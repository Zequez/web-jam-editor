# AGENTS.md

This repository is a browser-based local web authoring/editor for a Pug + UnoCSS workflow. The code currently assumes a desktop browser with the File System Access API, reads and writes project files from a user-selected directory, compiles Pug into HTML/CSS, and serves the generated site through a virtual preview system backed by a Service Worker.

This document is intentionally a preliminary, evidence-based reconstruction of the project model. It is meant to reduce context-reconstruction work for future agents before they change code.

## Project mental model

The project is not a traditional SPA with a server-side app backend. It is a local-first browser tool that:

- asks the user to choose a folder on disk;
- exposes that folder through the browser's File System Access API and ZenFS;
- treats the project as a filesystem-backed web app;
- reads `index.pug` from the selected directory;
- compiles it into HTML and extracted CSS;
- writes the result into a `www` directory inside that same filesystem;
- serves the generated output through a virtual preview URL under `/preview__/<session-id>/`;
- refreshes previews when the filesystem changes, even in another tab/window.

The README describes the project as "A web builder based on Pug, atomic CSS, that runs entirely in the browser" and explicitly calls out live previews via a Service Worker. That is consistent with the surrounding code.

## Architectural shape

### Entry and app selection

The browser entry point is `index.html`, which loads the Pug runtime script and then `src/main.ts`.

`src/main.ts` chooses one of three top-level UI modes based on the pathname:

- `/` -> `SystemFrame.svelte`
- `/preview` -> `Preview.svelte`
- `/single-file-coder` -> `SingleFileCoder`

This suggests the app is intentionally a lightweight multi-view browser application rather than a single dashboard component. The route switch is not a full router; it is a simple mode selector.

### System frame: folder session and preview shell

`src/components/SystemFrame.svelte` is the primary application shell. It:

- creates a `systemFs` store via `createSystemFs()` from `src/stores/systemFs.svelte.ts`;
- lets the user open or clear a project folder;
- renders `CoderFrame.svelte` on one half of the screen;
- renders `PreviewHostFrame.svelte` on the other half;
- passes `servePath={OUTPUT_DIR}` from the Pug compiler module.

The important design choice here is that the UI does not directly reach into the browser filesystem. It works through a filesystem abstraction (`Fs`) and a session object created by `createSystemFs()`. This keeps provider logic, session state, and UI concerns separate.

### Filesystem abstraction and persistence

`src/stores/systemFs.svelte.ts` is the key state container for the local project session.

It does the following:

- initializes with a `loading` state;
- restores a previously selected folder from `sessionStorage` + IndexedDB (`idb-keyval`);
- calls `showDirectoryPicker()` when the user chooses a folder;
- stores a `FileSystemDirectoryHandle` in IndexedDB;
- creates a ZenFS filesystem via `WebAccess.create({ handle: dir })` and calls `configureSingle(webAccessFs)`;
- exposes `fs`, `dirName`, `status`, and `clearSession` to the UI.

This code is intentionally browser-local and session-scoped. The app assumes the selected directory persists only for the current browser session unless the user reopens it, and it treats the chosen directory as the canonical project root.

### Compiler pipeline

The project’s compilation logic is centered in `src/lib/pure-pug-compiler/`.

`src/lib/pure-pug-compiler/compiler.ts` defines:

- `INPUT_FILE = "index.pug"`
- `OUTPUT_DIR = "www"`
- `build()`

The build flow is:

1. read `index.pug` from the current ZenFS filesystem;
2. ensure it begins with `doctype` if needed;
3. compile it via the bundled Pug runtime (`./pug-browser.ts`);
4. strip the default `<!DOCTYPE html>` from output for internal handling;
5. extract CSS from the rendered HTML via `../atomic-css-extractor/extractAtomicCss.ts`;
6. inject a stylesheet link into the HTML head;
7. ensure the document is wrapped in proper `<html>` / `<head>` / `<body>` structure;
8. write the result to `www/index.html` and `www/style.css`.

The compiler is deliberately direct and browser-side: it works from the virtual filesystem and writes into the same project directory. Future agents should treat `build()` as the normal code-generation boundary, not a separate compile/install pipeline.

### Atomic CSS extraction

`src/lib/atomic-css-extractor/` is a lightweight extraction step that turns rendered HTML into a CSS string. This is used by the Pug compiler to produce the final stylesheet for the generated preview output. The code is not a general CSS pipeline; it is tightly coupled to the project’s generated site output and should be treated as part of the build artifact generation process.

### Editor and preview split

`CoderFrame.svelte` is the source editor. It:

- reads `index.pug` from the current filesystem;
- stores the text in Svelte state;
- debounces writes to disk;
- triggers `build()` after save;
- calls `onBuildEnds()` when the compile completes so the preview can refresh.

`PreviewHostFrame.svelte` is the bridge between the editor and the virtual preview environment. It receives `fs` and `servePath`, registers a preview session with a Service Worker, obtains the preview URL, and passes it to `Preview.svelte`.

`Preview.svelte` is the actual iframe host UI. It handles resizing and URL navigation within the iframe but is intentionally not the place where the refresh protocol is implemented. The architecture wants the preview host to orchestrate refreshes through the Service Worker rather than reloading the iframe directly.

## Virtual preview and service worker architecture

This is the most important subsystem in the repository.

### Namespace and session model

The preview system uses a dedicated namespace in the browser origin:

- `PREVIEW_NAMESPACE = "/preview__/"`
- preview URLs look like `/preview__/<session-id>/...`

The session identifier is generated in the host component and remains stable for a browser tab or preview session. All preview requests for that session are routed to the same provider and the same Service Worker registration.

The service worker is responsible for:

- accepting preview requests under `/preview__/*`
- excluding the injected script endpoints from serving as files
- resolving candidates like `/`, `/about/`, `/about`, `/about/index.html`, and `/about.html`
- returning 404s and `404.html` when applicable
- inferring MIME types with `mime`
- injecting the preview refresh client script into HTML responses

### Provider/request flow

The conceptual flow is:

- browser iframe or standalone tab requests a virtual URL under `/preview__/...`
- the Service Worker decides whether the request belongs to a preview route
- the Service Worker sends a `preview-file-read` message to the page-side provider for the matching session
- the provider reads the file from the current ZenFS filesystem at the requested `servePath`
- the result is returned to the Service Worker over a `MessageChannel`
- the Service Worker converts it to a normal HTTP-style `Response`

This design is intentional and important: the Service Worker never directly accesses the browser's filesystem object. The page-side code stands in as the provider and the Service Worker acts as the filesystem router.

The `protocol.ts` file defines the typed message boundaries used by the service worker and page/provider. This is a deliberate boundary-preservation choice and future agents should not bypass it with ad hoc string messages.

### Refresh behavior

The preview refresh protocol is designed so that a change in the filesystem triggers a session refresh and then every currently connected client for that session reloads itself.

The sequence is conceptually:

- `PreviewHostFrame` knows the filesystem changed
- it sends a refresh request to the preview session through the Service Worker
- the Service Worker broadcasts a `preview-client-refresh` to every open client for that session
- each preview document is responsible for calling `location.reload()` when it receives the message

A small injected client script (the refresh client) is embedded into HTML responses to detect the session ID from the current URL, register/join the service worker session, and listen for refresh messages. This allows the same session to refresh in:

- the editor iframe,
- a direct browser tab,
- any other open preview instance for that same session.

The repository’s prompt files document this as an intentional architecture. The project is clearly trying to support session-aware self-refreshing previews rather than a one-off iframe reload.

## Important invariants and design constraints

These are the assumptions that appear to matter for the system to keep working:

- The selected project directory is the canonical project root; most file operations happen relative to it.
- The app deliberately uses the browser filesystem and local session persistence rather than a Node server or backend.
- The preview virtual server must live under the application origin, not on a separate TCP port.
- Preview URLs must remain under a dedicated `/preview__/` namespace so they do not collide with the application’s own routes.
- The Service Worker is the router and boundary; it must not directly access `fs`.
- `servePath` is a filesystem path inside the chosen project, not a URL path.
- The preview system must normalize paths carefully to prevent traversal outside `servePath`.
- HTML served by the preview must be able to inject the refresh client without corrupting the original document.
- Preview documents should be refreshable by session, not by a global singleton “current preview” state.
- No filesystem watcher is part of the architecture; filesystem changes are signaled by the host component and processed explicitly.

## Development and verification workflow

The actual project workflow, evidenced by `package.json` and README, is:

- install dependencies: `bun install`
- run the app: `bun start`

`package.json` currently declares a `start` script using Vite, and the app is configured with Vite + Svelte + UnoCSS. The project uses Vite for development and bundling rather than a custom server. The `vite.config.ts` file is therefore part of the runtime architecture, not a generic config leftover.

There is no explicit test script in `package.json`, and no dedicated test harness was found in the repository. Verification in this repo appears to be a mix of:

- Vite dev-server validation,
- TypeScript/editor diagnostics,
- manual browser validation for preview/session behavior,
- inspection of the virtual preview stack under the browser runtime.

## Agent guidance

Future agents should be conservative about changing these parts of the architecture:

- `systemFs.svelte.ts` and the filesystem/provider boundary
- `build()` in the Pug compiler and the `www` output contract
- the `/preview__/` Service Worker namespace and protocol types
- the injection of the refresh client into HTML
- any code that ties preview refreshes to a single iframe instead of a preview session

This repository is small but it has a few unusually intentional cross-context patterns (browser page, worker, virtual files, preview sessions). A change that looks like a "cleanup" may accidentally break the preview/session model or the filesystem boundary. Prefer extending existing abstractions, especially the session-based Service Worker protocol, rather than replacing them with a simpler but incompatible design.

## Known uncertainties and limits

The repository strongly suggests a browser-only local project workflow, but a few things remain intentionally uncertain from the code alone:

- the exact lifecycle guarantees around long-lived session persistence across browser restarts are not fully specified;
- the long-term supported browser compatibility of the File System Access API is a runtime environment assumption rather than a project contract enforced in code;
- the project does not currently expose a formal automated test suite, so preview correctness is mainly verified by manual runtime checks.

These are not necessarily bugs; they are simply the limits of current repository evidence.

## What was deliberately left out

This document does not attempt to prescribe future product features or redesign the app into a more conventional backend-style architecture. It also does not repeat generic software advice. It focuses only on the parts of the codebase that appear operationally important for an agent working in this repository today.

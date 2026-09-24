# Virtual Static Web Server

**Status:** Implementation task
**Authority:** This document is the authoritative specification for this task.

Implement the virtual static web server for `PreviewHostFrame.svelte`.

## Goal

`PreviewHostFrame.svelte` receives:

```ts
const { fs, servePath }: { fs: Fs; servePath: string } = $props();
```

`servePath` is a path *inside* the supplied ZenFS filesystem. It is currently `"www"`.

The component should create a browser-side virtual HTTP server backed by that filesystem and use its URL as the source of the existing `Preview.svelte` iframe.

The virtual site must behave like an ordinary static website:

* HTML can load CSS, JS, images, fonts, etc.
* Relative URLs must work normally.
* `/about/` should resolve to `/about/index.html`.
* `/about` should also be able to resolve to `/about/index.html` or `/about.html`.
* Static files such as `/assets/app.css` should resolve directly.
* Missing resources should return HTTP 404.
* If `/404.html` exists, use it as the body of a 404 response.
* MIME types must be inferred from file extensions using a well-established MIME-type library rather than maintaining a handwritten extension table.
* Files must always be read from the current `fs` contents when requested. Do not cache file contents.
* The parent application already knows when the filesystem has changed and calls `PreviewHostFrame.refresh()`, which ultimately calls `Preview.refresh()`, which does `iframe.contentWindow?.location.reload()`. Do not implement filesystem watching.

## Important architecture

Use a separate Service Worker source file. Do not put Service Worker code directly in `PreviewHostFrame.svelte`.

Do NOT configure ZenFS globally and do NOT assume that the Service Worker can directly access the `fs` JavaScript object.

The page and Service Worker run in different execution contexts. The page-side code must act as the filesystem provider, while the Service Worker acts as an HTTP request router.

Conceptually:

```text
Browser iframe request
        |
        v
Service Worker
        |
        | request file
        v
page-side filesystem provider
        |
        v
ZenFS `fs`
        |
        v
servePath
```

Use an appropriate `postMessage` / `MessageChannel` protocol or equivalent robust browser mechanism to communicate between the Service Worker and the page.

The design should support multiple independent preview sessions/tabs without requiring a separate Service Worker registration for every preview.

A single Service Worker should be capable of handling multiple preview instances. Use a generated preview/session identifier in the URL and/or protocol so that requests can be associated with the correct provider.

## URL design

Do NOT attempt to make the virtual website occupy the application's root `/`, because the Vite editor itself occupies that origin/root.

Do NOT use query parameters such as `/?host=foo` as the primary namespace.

Use a dedicated path namespace on the same origin, for example:

```text
/__preview/<session-id>/
```

The exact internal naming can be chosen sensibly, but it must:

1. not interfere with the editor application;
2. work on Vite's localhost origin;
3. also work on a normal HTTPS production origin;
4. allow normal relative URLs inside the virtual website;
5. be usable directly as an iframe `src`;
6. be usable by opening the URL in a separate browser tab.

The URL representing the virtual site's root should end in `/`, so that relative URLs resolve correctly.

For example:

```text
http://localhost:5173/__preview/abc123/
```

should represent:

```text
fs:/www/
```

when:

```ts
servePath === "www"
```

A request for:

```text
/__preview/abc123/style.css
```

should therefore read:

```text
www/style.css
```

from `fs`.

Do not create a real HTTP server or listen on another TCP port. This must be entirely browser-side and use the existing application origin.

## Service Worker lifecycle

Implement registration and lifecycle carefully.

`PreviewHostFrame` should:

1. register the Service Worker if necessary;
2. establish/register its preview session with the Service Worker;
3. associate the supplied filesystem provider and `servePath` with that session;
4. obtain the preview URL;
5. call `previewEl.go(previewUrl)` once the URL is ready;
6. clean up the session when the component is destroyed.

Avoid unnecessary re-registration of the Service Worker.

The component should be safe if it is mounted, destroyed, and mounted again.

Do not assume that the Service Worker is immediately active after `register()`. Correctly handle the Service Worker lifecycle and wait for the appropriate controller/ready state before depending on it.

Be careful about the distinction between:

* the editor page;
* the Service Worker;
* the preview iframe;
* a preview opened in another tab.

Do not assume that `navigator.serviceWorker.controller` is already available immediately after registration.

## Multiple tabs / sessions

The implementation should allow two different browser tabs to preview different filesystem objects/sessions without their requests being mixed up.

Do not create one global "current filesystem" variable that causes the second tab to overwrite the first.

Prefer an explicit session identifier and explicit provider registration.

The current application generally has one preview per tab, and the ZenFS filesystem object is effectively shared/remounted when the user picks a different directory, but the implementation should still keep the preview-session abstraction clean.

If a component is unloaded and later recreated, its session should be registered correctly again.

## Filesystem paths

`servePath` is a filesystem path, not a URL path.

Normalize paths carefully to avoid:

* `..` escaping outside `servePath`;
* duplicate separators;
* accidental absolute filesystem paths;
* malformed URL decoding.

The HTTP root `/` of the virtual website corresponds to `servePath`.

For example:

```text
virtual URL                     filesystem path

/__preview/abc/                 www/
/__preview/abc/index.html      www/index.html
/__preview/abc/style.css       www/style.css
/__preview/abc/assets/x.png    www/assets/x.png
```

Use the existing `Fs` interface rather than reconfiguring ZenFS globally.

Inspect `./lib/zen-fs-type` and the actual project APIs before implementing the filesystem access. Use the APIs that actually exist in this project rather than inventing methods.

## URL/file resolution

Implement static-site-style resolution.

For a request corresponding to:

```text
/
```

serve:

```text
/index.html
```

relative to `servePath`.

For:

```text
/about/
```

try:

```text
/about/index.html
```

For:

```text
/about
```

support sensible static-site resolution including:

```text
/about
/about/index.html
/about.html
```

For explicit files, such as:

```text
/assets/foo.css
```

serve the exact file.

Avoid incorrectly treating an existing file as a directory.

Do not append `index.html` to arbitrary file requests.

If multiple candidates exist, use a deterministic order and document it briefly in code.

## 404 handling

If no matching file exists, return an actual:

```http
404 Not Found
```

response.

If:

```text
/404.html
```

exists under `servePath`, use its contents as the response body for the 404.

Set an appropriate content type for it.

Do not redirect missing resources to `index.html`.

## MIME types

Use a well-established MIME type package rather than a handwritten map.

Before adding a dependency, inspect the existing package setup and choose a package that bundles cleanly into the browser/Service Worker through Vite.

If no suitable existing dependency is present, add the appropriate dependency using Bun.

The desired API is conceptually:

```ts
mimeTypeForPath(path)
```

so the HTTP response gets an appropriate `Content-Type`.

At minimum, common static web resources must work correctly:

* HTML
* CSS
* JavaScript
* JSON
* PNG
* JPEG
* WebP
* SVG
* fonts
* common audio/video formats

Do not over-engineer MIME handling if the selected library already handles it.

## Response semantics

Return real `Response` objects from the Service Worker `fetch` handler.

Preserve appropriate HTTP semantics.

Use suitable headers for static resources.

Do not introduce an unnecessary caching layer. During development, the source of truth is always the current ZenFS contents.

## Preview.svelte integration

The existing `Preview.svelte` is:

```svelte
<script lang="ts">
  import { onMount } from "svelte";

  let { initialValue } = $props<{ initialValue: string }>();
  let scale = $state(1);
  let containerWidth = $state(0);
  let containerHeight = $state(0);
  let width = $derived(containerWidth / scale);
  let height = $derived(containerHeight / scale);
  let address = $state(initialValue);
  let src = $state(address);
  let container: HTMLElement = $state(null!);
  let iframe: HTMLIFrameElement = $state(null!);

  // ...

  export function go(newSrc: string) {
    const isChanging = newSrc !== src;
    src = newSrc;
    address = newSrc;
    if (isChanging) {
      refresh();
    }
  }

  export function refresh() {
    iframe.contentWindow?.location.reload();
  }
</script>
```

Do not unnecessarily modify `Preview.svelte`.

Because the virtual server URL is not known synchronously when `PreviewHostFrame` is initialized, avoid leaving the iframe permanently at `about:blank`.

It is acceptable/preferred for `PreviewHostFrame` to initialize `Preview` with `about:blank` and then call:

```ts
previewEl.go(previewUrl);
```

once the Service Worker-backed URL is ready.

Take into account that `go()` reloads when its URL changes.

The existing public API of `PreviewHostFrame` must continue to expose:

```ts
export function refresh()
```

which calls:

```ts
previewEl.refresh();
```

## Important browser constraints

The solution must work in:

* Vite development on `http://localhost:<port>`;
* HTTPS production deployment.

Do not depend on Node APIs at runtime.

Do not use filesystem APIs unavailable in a Service Worker.

Do not attempt to directly transfer the ZenFS `fs` object to the Service Worker if it is not transferable.

Use browser-supported messaging/communication primitives.

## Files to create/modify

Inspect the repository first and determine the appropriate locations/naming conventions.

At minimum, expect to:

* modify `PreviewHostFrame.svelte`;
* add a dedicated Service Worker source file;
* add a small shared protocol/helper module if that makes the page/SW communication safer and avoids duplicated types.

Do not modify unrelated parts of the application.

## TypeScript

Keep the implementation strongly typed.

If a message protocol is used, define discriminated message types rather than passing arbitrary `any` objects.

Handle errors explicitly:

* Service Worker unavailable;
* registration failure;
* provider unavailable;
* malformed request;
* missing file;
* filesystem read failure;
* component teardown during initialization.

Do not leave unhandled promises or obvious race conditions.

## Before coding

Inspect the existing repository to understand:

* the Vite configuration;
* Svelte setup;
* TypeScript configuration;
* `Fs` type in `./lib/zen-fs-type`;
* how ZenFS is currently configured/mounted;
* existing build conventions;
* whether there is already any Service Worker infrastructure.

Do not ask me clarification questions unless the repository contains a genuine contradiction with this specification. The intended behavior is specified above.

## Acceptance criteria

When finished, the following should work:

1. Running the Vite app produces the normal editor at `/`.

2. `PreviewHostFrame` starts a virtual preview backed by `fs` and `servePath`.

3. The iframe navigates to a URL similar to:

```text
http://localhost:5173/__preview/<session-id>/
```

4. If `www/index.html` contains:

```html
<link rel="stylesheet" href="style.css">
<img src="assets/test.png">
```

the browser successfully loads:

```text
www/style.css
www/assets/test.png
```

5. `/about/` resolves to `www/about/index.html`.

6. `/about` can resolve to `www/about.html` when appropriate.

7. Missing files return 404.

8. `www/404.html` is used as the body of a 404 response when present.

9. CSS, JS, HTML, images and other common static resources receive appropriate MIME types.

10. Editing a file in the existing application, followed by the existing `refresh()` call, causes the iframe to reload and receive the new file contents.

11. No filesystem watcher is introduced.

12. The Service Worker does not globally replace/configure ZenFS.

13. Destroying and recreating `PreviewHostFrame` does not leave stale registrations that break subsequent previews.

14. Two separate tabs can use different preview sessions without their filesystem requests being mixed.

15. Opening the generated preview URL directly in another tab works to the extent supported by the chosen page↔Service Worker provider architecture. If direct opening requires an explicit provider/session registration mechanism, implement that mechanism rather than silently falling back to the editor application.

16. The implementation works under Vite localhost and HTTPS production origins.

After implementing, run the relevant typecheck/build/tests available in the repository and fix any errors introduced by the implementation.

Keep the implementation as small and comprehensible as possible. This is a development-time browser static server, not a general-purpose production web server.

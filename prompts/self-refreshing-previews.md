# Self Refreshing Previews

Read `prompts/virtual-static-web-server.md` as the authoritative specification for the existing browser-side virtual static web server.

Now extend that implementation so that **preview documents can refresh themselves when their preview session's filesystem changes**, regardless of whether the preview is displayed inside the editor's iframe or opened directly in another tab/window.

### Goal

Currently `PreviewHostFrame` refreshes the preview by calling `iframe.contentWindow.location.reload()`.

Replace that coupling with a preview-session refresh protocol:

```text
PreviewHostFrame
      │
      │ refresh session
      ▼
Service Worker
      │
      ├──► iframe preview document
      │
      └──► standalone preview tab/window
              │
              ▼
        location.reload()
```

A filesystem change should therefore cause **all currently open clients belonging to that preview session** to reload themselves.

### Preview client script

The virtual server should inject a very small JavaScript module into served HTML documents.

The injected script should:

* identify the preview session from the current preview URL;
* connect/register the current browser client with the Service Worker;
* listen for refresh messages from the Service Worker;
* call `location.reload()` when its session receives a refresh command.

Do **not** make the script iframe-specific. It should work identically when the document is:

* inside the `Preview.svelte` iframe;
* opened directly in another browser tab;
* opened in another window.

There is no need for `window.self === window.top` logic if the protocol works correctly in both cases.

The script should remain extremely small and dependency-light.

### Do not create a second compilation pipeline

Do not introduce a separate Vite build/compilation step just for this injected script.

Prefer making the refresh client a normal module belonging to the existing Vite application, and have the virtual server inject a script reference to that module into preview HTML.

Determine from the existing repository/build configuration the cleanest way to expose that module's URL in both development and production.

In particular:

* do not hardcode a development-only Vite URL if that would break production;
* do not make the virtual ZenFS filesystem responsible for compiling this module;
* do not duplicate the module's source into a generated artifact unless the existing build system genuinely requires it;
* ensure the injected script URL is not accidentally interpreted as a file from `servePath`.

If an existing application asset mechanism can provide the module URL cleanly, use it.

### HTML injection

For HTML responses served by the virtual static server:

* inject the refresh-client `<script>` automatically;
* prefer an appropriate location such as before `</head>` or `</body>`;
* handle HTML without those tags gracefully;
* preserve the original document contents otherwise.

The injection should happen for every HTML document served by the preview, including routed documents such as:

```text
/
about/
about/index.html
about.html
```

The injected script must therefore survive navigation naturally: if the user navigates from `/` to `/about/`, the new document establishes its own connection to the same preview session.

### Service Worker protocol

Extend the existing page ↔ Service Worker protocol rather than introducing a second communication mechanism.

The Service Worker should maintain enough information to associate browser clients with preview sessions.

A conceptual protocol is:

```text
preview:join
{
  sessionId
}

preview:refresh
{
  sessionId
}
```

Use properly typed discriminated TypeScript messages rather than untyped string/message handling.

When `PreviewHostFrame` knows that the filesystem has changed, it should communicate directly with its preview session through the existing Service Worker infrastructure.

The Service Worker should broadcast the refresh to all currently connected/open clients belonging to that session.

Do not use a global "current preview" or global filesystem.

Multiple sessions must remain independently addressable.

### PreviewHostFrame

Modify `PreviewHostFrame.svelte` so that filesystem changes can request a session refresh through the Service Worker.

The iframe itself should no longer be responsible for the refresh operation.

In other words, avoid making this the primary mechanism:

```ts
previewEl.refresh();
```

Instead, the host should tell the appropriate preview session to refresh.

`Preview.svelte` should consequently not need to know how preview refreshing is implemented.

Do not make unrelated changes to `Preview.svelte` unless they are genuinely required by the new architecture.

### Session behavior

Preserve the existing session URL architecture:

```text
/__preview/<session-id>/...
```

A session should remain valid across navigation within that preview.

For example:

```text
/__preview/abc/
/__preview/abc/about/
/__preview/abc/contact/
```

are all clients of session `abc`.

If the editor has the preview iframe open and the user separately opens:

```text
/__preview/abc/
```

in another tab, both should receive the same refresh event.

The standalone tab should therefore automatically update when the editor's filesystem changes.

A copied preview URL does not need to remain functional after the editor/provider disappears; the existing provider/session lifetime semantics remain acceptable for now.

### Important lifecycle cases

Handle these safely:

* iframe preview opens;
* standalone preview opens;
* multiple preview documents for the same session are open;
* a preview document navigates to another path;
* a preview document closes;
* the editor reloads/reinitializes;
* the filesystem is remounted;
* a preview client joins after the Service Worker is already active;
* a preview client temporarily has no Service Worker controller during normal registration/lifecycle timing.

Do not require a page reload merely to establish the refresh connection if the Service Worker is already available.

Do not introduce filesystem watchers or file-content caching. The existing model remains:

```text
filesystem changes
    ↓
host knows about change
    ↓
request session refresh
    ↓
Service Worker broadcasts refresh
    ↓
each preview client location.reload()
    ↓
Service Worker reads current filesystem contents
```

### Validation

After implementation:

1. Run the relevant typecheck/build/tests.
2. Fix errors caused by the implementation.
3. Test the iframe case.
4. Test opening the generated preview URL directly in another tab.
5. Open both simultaneously and verify that one refresh request refreshes both.
6. Navigate the standalone preview to a nested route and verify it still participates in the same session.
7. Verify that HTML injection does not corrupt the original HTML.
8. Verify development and production asset paths for the injected module.

Keep the implementation as small as reasonably possible. Reuse the existing Service Worker/session architecture from `prompts/virtual-static-web-server.md` rather than designing a parallel system.

Do not ask for clarification unless you encounter a genuine contradiction or an essential missing requirement. Inspect the repository and make the smallest sound engineering decisions where implementation details are unspecified.

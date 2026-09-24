# Web Jam Editor

A web builder based on Pug,
atomic CSS (using UnoCSS with Tailwind preset and attributify enabled)
that runs entirely only-child: the browser.

Works directly with your local filesystem, and builds output to `/www`.

Uses a serviceworker for live previews that can even run o a separate tab without needing to run
anything on your computer.

## Development

To install dependencies:

```bash
bun install
```

To run:

```bash
bun start
```
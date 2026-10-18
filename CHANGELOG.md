# Changelog

All notable changes to Web Jam are documented here.

This project follows [Semantic Versioning](https://semver.org/). Before `1.0.0`, minor releases may introduce breaking changes.

## [0.2.0] - 2026-10-18

New features!

* Web Icons Engine
    - You can now use the classes `icon-fa-<glyph>`, `icon-fab-<glyph>` and `icon-far-<glyph>` for Font Awesome 7 solid, brand and regular free icon sets
    - The icons are generated using a customized web font on the fly that includes only the glyphs used
    - Font based icons mean text-shadow works on the icons!
    - The icons stylesheet is generated as a separate file icons.css with the embeded URL-encoded font
* Adding a CNAME constant now generates a CNAME file in the output folder with the value
* The editor nows customly highlights the atomic classes
* The /roadmap and /architecture pages now load correctly with the new TLDraw tokens
* Edge buttons frames now close with ESC
* Easter egg on awareness frame
* Improved content on awareness frame
* Added architecture document
* Assets box
    - Assets box now supports drag and drop into the page
    - Documentation on assets box images
    - Assets box thumbnails now show up
    - Images can now be renamed
    - Syntax tab with useful data about the Pug syntax and Atomic CSS
    - Most recently used tab order
    - Persisted tab open/close state and order
    - Agentic context to copy paste


## [0.1.0] - 2026-10-09

First versioned release of Web Jam.

### Added

* Vite-based Development Environment
    - Svelte
    - UnoCSS
    - Bundle analysis generator
    - Markdown support
    - `@/lib`, `@/stores`, `@/components` aliases
* CodeMirror-based editor with
    - Pug syntax highlighting
    - Custom highlighters
    - Atomic CSS classes prettifier
    - Toggleable source code at hierarchy
    - Auto build, auto save
* Browser native compiling
    - Pug Support
    - Multi-page pug output from a single file
    - AtomicCSS parsing with UnoCSS Tailwind preset plus some personal goodies
    - YAML pre-processor support
    - Markdown filter support
* Virtual Filesystem
    - ZenFS integration and filesystem based project data
    - Bundling compiled artifacts to `/www` subpath
    - Browser FS support plus Indexed DB virtual FS
* Images Processing
    - Images uploading into `/assets` and processing into `/www/images/(img|img/sm|img/md|img/lg).webp`
* Service-Worker-based Live Preview
* Documentation
    - Project Roadmap at `/roadmap` (serves Roadmap.tldr) with tasks done and to do
    - Project Architecture at `/architecture` (serves Architecture.tldr)
    - Project context for AI at AGENTS.md
    - Project README
    - Project License
* Humanity
    - Awareness UI
    - Sustainers UI
    - Sustainers sign up form


### Notes

* Verified that the project can be installed and started from a fresh source archive using `bun i` and `bun run start`.
* This release establishes the initial versioned baseline for Web Jam.

# Changelog

All notable changes to Web Jam are documented here.

This project follows [Semantic Versioning](https://semver.org/). Before `1.0.0`, minor releases may introduce breaking changes.

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

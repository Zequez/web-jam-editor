# Initial agents.md Archeology

You are working directly inside this repository.

There is currently an empty `AGENTS.md` at the repository root. Your task is to create a **preliminary, evidence-based `AGENTS.md`** that helps future coding agents quickly understand this project without having to rediscover its architecture and design decisions from scratch.

This is an **archaeology and context-reconstruction task**, not primarily a documentation-writing task.

## Your objective

Study the repository deeply enough to reconstruct the project's current mental model:

* What is this project?
* What is it trying to enable?
* How is it architecturally organized?
* What are the important abstractions and boundaries?
* Which unusual implementation choices are intentional?
* How do the major subsystems communicate?
* What assumptions does the code make about the browser, filesystem, build system, previews, compilation, and runtime?
* Which patterns should future agents preserve?
* Which things would be dangerous for an agent to "simplify", replace, or redesign without understanding the larger system?
* What development and verification workflows actually work in this repository?

The resulting document should primarily reduce the amount of **context reconstruction** a future agent needs to do before making changes.

## Investigate before writing

Do not infer the architecture from filenames alone.

Read and inspect the relevant source code, configuration, package metadata, README, prompts, and other documentation.

In particular, investigate:

* `src/components/**`
* `src/lib/**`
* `src/stores/**`
* `prompts/**`
* `package.json`
* `vite.config.ts`
* `uno.config.ts`
* `tsconfig.json`
* `index.html`
* `README.md`
* existing scripts and dependencies
* imports and call relationships between the major modules

Follow important abstractions across their consumers rather than only reading individual files.

Pay particular attention to:

* `systemFs.svelte.ts`
* `preview-virtual-server/**`
* `pure-pug-compiler/**`
* `atomic-css-extractor/**`
* `SingleFileCoder/**`
* `Preview.svelte`
* `PreviewHostFrame.svelte`
* `CoderFrame.svelte`
* `SystemFrame.svelte`

Also inspect the documents under `prompts/`. Treat them as potentially important records of architectural intent, experiments, or design direction rather than assuming they are disposable notes.

Look at git history if it is available and useful. If history reveals why an unusual architectural decision exists, capture that context when sufficiently supported by evidence.

## Distinguish facts from inference

The AGENTS.md must not present guesses as established facts.

Use language such as:

* "The code currently..."
* "The architecture appears to..."
* "This abstraction is used for..."
* "The repository suggests..."
* "It appears intentional that..."
* "A future agent should investigate X before changing Y."

If something is uncertain, explicitly mark it as uncertain rather than inventing an explanation.

Do not manufacture product requirements that are not represented in the repository.

## What belongs in AGENTS.md

Focus on information that is valuable to an agent **before modifying code**.

Good material includes:

### Project mental model

A concise explanation of what the project currently is and how its pieces fit together.

### Architecture

Important subsystems, their responsibilities, dependencies, and boundaries.

### Core abstractions

Explain abstractions that future agents need to understand before touching code.

For example, if a filesystem abstraction is deliberately passed through components rather than accessed globally, explain that pattern and why it matters if the code supports that conclusion.

### Important invariants

Document things that appear to need to remain true for the system to work.

### Non-obvious design choices

Call out unusual code that might otherwise tempt an agent to "clean it up" into a conventional implementation.

### Runtime boundaries

Explain meaningful distinctions such as:

* host application vs preview
* browser vs build-time
* virtual filesystem vs physical filesystem
* source code vs generated/transformed content
* application runtime vs worker/service-worker contexts

Only include these if the repository actually supports them.

### Development workflow

Document the actual commands and procedures an agent needs to develop and verify the project.

Prefer commands discovered from `package.json` and the repository over generic Bun advice.

### Testing and verification

Document what tests, builds, type checks, linting, or manual verification actually exist.

Do not invent a testing methodology that the project does not currently use.

### Agent guidance

Explain how an agent should approach changes in this particular codebase.

Examples of useful guidance:

* where to look first for a particular kind of change
* which abstractions should be extended rather than bypassed
* which boundaries should not be crossed casually
* when a change likely requires understanding several subsystems
* when an agent should stop and ask the human rather than making an architectural decision

Only state such guidance when supported by the repository or clearly mark it as a tentative recommendation.

## What does NOT belong

Do not turn this into:

* a generic Bun manual
* a generic Svelte manual
* a generic Vite manual
* a list of every dependency
* a copy of package documentation
* a restatement of obvious coding conventions
* instructions that an agent can trivially discover by inspecting `package.json`
* speculative future product requirements
* a huge API reference
* generic advice such as "write clean code" or "follow best practices"

In particular, do **not** resurrect the old generated `CLAUDE.md` instructions blindly.

The old file was generated when the repository was essentially an empty Bun project and contained assumptions that are no longer true, including a Bun-native frontend architecture and advice to avoid Vite. Treat it as obsolete historical context, not authoritative project guidance.

## Keep the document maintainable

The resulting `AGENTS.md` should be reasonably concise.

Optimize for **high information density**.

A future agent should be able to read it and gain a useful mental model of the repository in a few minutes.

Prefer explaining relationships and invariants over enumerating files.

Use paths to point agents toward important implementation locations rather than copying large amounts of source code.

Do not create additional documentation files unless absolutely necessary. The task is specifically to produce the initial root `AGENTS.md`.

## Important: don't modify the implementation

For this task:

* Do not modify application source code.
* Do not refactor anything.
* Do not change dependencies.
* Do not change configuration.
* Do not "fix" issues you encounter.
* Do not create tests merely for this investigation.

Your only intended modification is the root `AGENTS.md`.

## Before finishing

After writing `AGENTS.md`, review it critically.

Ask yourself:

1. Would a capable coding agent understand this project substantially faster after reading it?
2. Does it explain the *why* and relationships rather than merely listing files?
3. Are its claims supported by repository evidence?
4. Does it distinguish current reality from inferred or future direction?
5. Does it protect important architectural boundaries from well-intentioned but harmful simplification?
6. Does it avoid obsolete assumptions inherited from the old Bun-generated instructions?
7. Is there anything important you discovered that a future agent would otherwise have to rediscover?

If useful, use the repository's git history to validate particularly important architectural conclusions.

Finally, provide a brief summary in your response of:

* the major architectural insights you encoded,
* any significant uncertainties you encountered,
* and anything you deliberately left out because the evidence was insufficient.

Do not merely summarize the files you read. Summarize the **mental model you reconstructed**.

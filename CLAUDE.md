# CLAUDE.md

Guidance for Claude Code when working in this repository.

@.rak200/CONVENTIONS.md
@node_modules/@rak200/coding-standard-ts/CONVENTIONS.md

> If `.rak200/` is empty, the clone skipped its submodule:
> `git submodule update --init --recursive`. If the second import is missing, run
> `npm ci` — TypeScript development needs it anyway.

## What this repository is

**@rak200/ui** is a library of host-agnostic custom elements: components that work in any page and
any framework, or none. It is the ecosystem's first non-PHP artifact and its first npm package.
[RFC 0016](https://github.com/rak200/devr/blob/master/docs/proposals/0016-ui-component-library.md)
decided the shape — Lit for a thin runtime, Zag for behaviour and accessibility when a component
has state to model, design tokens as the single source of truth for the visual language.

## Architecture

```
src/
├── tokens.ts   # the design tokens: names, defaults, and a :root stylesheet
├── button.ts   # <rak-button>
└── index.ts    # the public barrel
docs/           # one page per unit, indexed by docs/README.md
```

Each component lives in one file with its tests beside it, and registers itself with
`customElements.define` at import — so a host imports the package and writes the tag.

## Conventions specific to this library

- **Delegate to the platform.** A component wraps the real element wherever one exists —
  `<rak-button>` renders a `<button>` — so keyboard activation, the accessible name, disabled
  semantics and focus behaviour stay the browser's job. Reimplementing them with `role=` is how a
  component gets one of them wrong.
- **Every visual decision is a token.** A hardcoded colour, radius or spacing in a component is a
  decision a host cannot override without forking. Components read `var(--rak-*, fallback)`.
- **No `accessor`, no decorators.** Properties are declared with a `static properties` map beside
  plain fields, under `useDefineForClassFields: false`. The `accessor` keyword is an auto-accessor
  the test browser does not implement, and the transform leaves it in place — the module then fails
  to parse.
- **A mutant on a module-level side effect cannot be killed.** Stryker switches mutants inside a
  warm process, so `customElements.define(...)` has already run with the original value. Exclude
  it at the narrowest node with that reason; never widen the exclusion to the file.

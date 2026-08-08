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
RFC 0016 decided the shape — Lit for a thin runtime, Zag for behaviour and accessibility when a
component has state to model, design tokens as the single source of truth for the visual language.
The consumer-facing half of those decisions is [ARCHITECTURE.md](ARCHITECTURE.md).

## Architecture

```
src/
├── tokens.ts        # the design tokens: names, defaults, and a :root stylesheet
├── button.ts        # <ui-button>
└── index.ts         # the public barrel
tests/               # mirrors src/, one test file per unit
├── tokens.test.ts
├── button.test.ts
├── a11y.ts          # the axe assertion the component suite is built on
└── a11y.test.ts
docs/                # one page per unit, indexed by docs/README.md
```

`tests/` mirrors `src/`, one test file per unit — the Layer 2 layout, and what `/tests/
export-ignore` in the seeded `.gitattributes` has always been written for. `a11y.ts` is the
exception the mirror does not cover: it is the suite's own scaffolding rather than a unit, so it
has no counterpart in `src/`.

Each component lives in one file and registers itself with `customElements.define` at import — so
a host imports the package and writes the tag.

## Conventions specific to this library

- **Delegate to the platform.** A component wraps the real element wherever one exists —
  `<ui-button>` renders a `<button>` — so keyboard activation, the accessible name, disabled
  semantics and focus behaviour stay the browser's job. Reimplementing them with `role=` is how a
  component gets one of them wrong.
- **A component test asserts accessibility.** `expectAccessible('<ui-thing>…</ui-thing>')` from
  `tests/a11y.ts`, at least once per component and once per state that changes the markup. The
  ruleset is WCAG A/AA and the bar is serious-and-critical; both are named in that file with their
  reason. Narrowing either is a change to the file, never a per-test opt-out.
- **Every visual decision is a token.** A hardcoded colour, radius or spacing in a component is a
  decision a host cannot override without forking. Components read `var(--ui-*, fallback)`.
- **No `accessor`, no decorators.** Properties are declared with a `static properties` map beside
  plain fields, under `useDefineForClassFields: false`. The `accessor` keyword is an auto-accessor
  the test browser does not implement, and the transform leaves it in place — the module then fails
  to parse.
- **A mutant on a module-level side effect cannot be killed.** Stryker switches mutants inside a
  warm process, so `customElements.define(...)` has already run with the original value. Exclude
  it at the narrowest node with that reason; never widen the exclusion to the file.

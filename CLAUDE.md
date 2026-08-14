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
├── field.ts         # <ui-field> — the ARIA wiring every form control needs
└── index.ts         # the public barrel
tests/               # mirrors src/, one test file per unit
├── tokens.test.ts
├── button.test.ts
├── field.test.ts
├── a11y.ts          # the axe assertion the component suite is built on
├── a11y-ruleset.ts  # the axe ruleset, free of the test runner so a second reader can have it
└── a11y.test.ts
docs/                # one page per unit, indexed by docs/README.md
```

`tests/` mirrors `src/`, one test file per unit — the Layer 2 layout, and what `/tests/
export-ignore` in the seeded `.gitattributes` has always been written for. The two `a11y` modules
are the exception the mirror does not cover: they are the suite's own scaffolding rather than
units, so neither has a counterpart in `src/`.

Each component lives in one file and registers itself with `customElements.define` at import — so
a host imports the package and writes the tag.

## Where the rules are

In the two imports above, in [ARCHITECTURE.md](ARCHITECTURE.md), and in each file beside the line it
explains. This file restates none of them.

- **Delegate to the platform**, **every visual decision is a token**, and **the accessibility bar** —
  [ARCHITECTURE.md](ARCHITECTURE.md), which is the consumer-facing half of RFC 0016.
- **How to write the accessibility assertion**, and how often —
  `expectAccessible('<ui-thing>…</ui-thing>')` from `tests/a11y.ts`, which carries the
  serious-and-critical bar and the per-state obligation with their reasons. **The ruleset is one
  file over**, in `tests/a11y-ruleset.ts`, which says why it was moved out.
- **Why `accessor` and decorators are off** — the comment beside both flags in `tsconfig.json`.
  Turning either on makes the suite unable to load the code that uses it.
- **Why a mutant on a module-level side effect cannot be killed** — the `Stryker disable next-line`
  comments in `src/button.ts` and `src/field.ts`, each carrying its reason. Exclude at the narrowest
  node; never widen to the file.

# RFC 0007 — The workbench

- **Scope**: tooling
- **Created**: 2026-11-10

## Motivation

There is no place to use a component while it is being built. RFC 0001 decided the playground for a
consumer evaluating the package and set the maintainer aside on purpose — _"a maintainer needs no
publication at all, and an ignored local page would suffice"_ — and that page was never written.

What filled the gap for a while was RFC 0004's prototypes, served by Vite from
`docs/proposals/0004-motion/` through the whole of the motion work: the real components from `src/`,
a panel writing the CSS a consumer would, every component side by side. They sketch that proposal's
shape rather than the package's, and each change to the package leaves them further behind.

The playground was measured against that use on 2026-11-10, on Storybook 10.6.1:

- **An experiment there is a tracked file.** `tests/stories.ts` composes every story into the suite,
  under the accessibility bar, and `pages.yml` publishes it, so a composition tried for an afternoon
  is code the gate grades and the site shows.
- **Its controls reach what each story chose.** `ui-input`'s are five: `label`, `help`, `error`,
  `placeholder` and `disabled`.
- **No event reaches it.** Nothing is wired to the Actions panel, so `change`, `ui-close`,
  `ui-dismiss`, `ui-leave` and what a form submits cannot be seen.
- **Its toolbar has no direction.** It switches the scheme, the theme and reduced motion; a page
  written right to left is one story of the select's, where the menu and the tooltip were the
  hardest to place (#300).
- **It is slow to start.** `storybook dev` answered after 21 s, and each story took about a second
  to render in a fresh page.

None of that is a defect of the playground. It is the first premise of RFC 0001 holding: the surface
was built for the reader it names.

## Study

### A page of its own, measured

Vite answered over the whole repository in 0.97 s. It is already in the tree, 8.3.0, brought by
Vitest and by `@storybook/builder-vite`. A prototype, kept out of the tree in `reports/`, served a
page written as a consumer writes one — markup, `import '@rak200/ui'` in a module script, and a
module beside it with data and a type — resolving the name through the alias `.storybook/main.ts`
uses, with a shell written into the page by Vite's `transformIndexHtml` hook:

| What                                                             | Time   |
| ---------------------------------------------------------------- | ------ |
| The page rendered, with the shell in it and its module run       | 315 ms |
| An edit to the page reached the browser                          | 201 ms |
| An edit to the page's module reached the browser                 | 202 ms |
| A page written after the server started rendered, with the shell | 164 ms |

Each edit reloads the page, which is what Vite does for a module nothing accepts. So whatever the
shell holds — the theme chosen, the direction — has to outlive a reload, in the address or in
storage.

### Where a scratch page can live

**The three ignore files are closed here.** `.gitignore`, `.gitattributes` and `.prettierignore` are
`exact` seeds of the `ts` variant, so none of them can take a line for a new path.

**A nested `.gitignore` hides a folder from git and not from Prettier**, which reads the root's
alone. Measured: `prettier --check .` flagged an unformatted file under a nested ignore that git did
not list. Scratch kept under `tests/` would redden `lint` the first time it was untidy.

**`/reports/` is already in the root `.gitignore`**, which Prettier reads too: `prettier --check .`
passed with the scratch there, and `tsc --noEmit` reads only its `include`, which does not name the
folder.

**ESLint reads neither**, since flat config leaves `.gitignore` alone, so it already fails on
whatever lies in `reports/`: three errors on the prototype — two files in no program, and the
scratch module itself, linted under the rules through its own `tsconfig.json`. `eslint.config.js` is
not a seed, and `reports/**` among its ignores ends that for the measurement harnesses kept there
too.

### Types where the scratch is written

A `tsconfig.json` in the scratch folder, extending the root's, puts each scratch module in a program
with `@rak200/ui` mapped to `src/`. `tsc -p reports/workbench` passed over a clean scratch and
reported a wrong type in one, `TS2322`, so an editor shows the package's types there, and the root
`tsc --noEmit` stays as it was.

### What a listener on the document hears

One listener per type on the document, in the capture phase, heard what a consumer's would: `input`
and `change` from `ui-checkbox` and from `ui-input`, and `submit` from the form. `input` is composed
and arrives retargeted; `change` is not, and each control dispatches its own again, as its docblock
says.

### Where the shell's lists come from

None is written in the workbench.

- **The tokens** are the barrel's `tokens`, `defaults` and `darkScheme`. A ground is what a host
  sets, and a derived token follows it through its formula, as it does on any page.
- **The effects** are read off the sheets the way `tests/tokens.test.ts` reads them,
  `style(--ui-motion-<moment>: <effect>)`: 287 pairs across the fourteen elements that draw any,
  each component's in its own styles and the table's in the document, where its rules are adopted.
- **Reduced motion and more contrast** are each the sheets' own rule with its condition taken off,
  which is what `reduced()` in `.storybook/preview.ts` already does for the first.
- **The accessibility check** runs `axe-core` with `tests/a11y-ruleset.ts`, the constant the suite
  and the playground's panel already share.

## Proposed design

`npm run workbench` starts Vite over the repository with `tests/workbench/vite.config.ts`, a script
outside the eight verbs as `storybook` is. The config carries the alias, writes the shell into every
page under `reports/workbench/`, and creates that folder, with a starter page and its
`tsconfig.json`, where it is missing.

- **A scratch page is a page a consumer would write**: markup, `import '@rak200/ui'`, and a module
  beside it where the page needs data or state. The workbench lists them.
- **The shell is an element of its own**, with plain controls in its own shadow root, so a component
  under development cannot break the panel it is looked at through, and the accessibility check
  leaves it out. It carries:
  - the options — theme, scheme, reduced motion, direction and more contrast;
  - the event log — `input`, `change`, `invalid`, `submit` with its `FormData`, `ui-close`,
    `ui-dismiss` and `ui-leave`;
  - tokens and effects — a ground's value, an effect for a moment, and the CSS a consumer would
    write for both;
  - the accessibility check, on demand.
- **`analyse` grades it.** `tsconfig.json` and the ESLint config already cover `tests/`, so a rename
  in `src/` fails the shell rather than leaving it dead. `test` does not run it, and nothing
  publishes it.
- **A phone reaches it** with `--host`, for what only a device shows: iOS (#324) and the screen
  readers (#309).
- **`vite` is declared.** The config imports it, and Layer 2 counts a tool of a repository's own,
  _such as a playground_, among what it declares. `^8.3.0` resolves to the copy installed now.

### Alternatives, and what retired each

- **Inside Storybook.** A free composition would be a story group the build and the suite have to
  be taught to skip, under a server that takes 21 s to answer.
- **Published beside the playground.** The accessibility bar and the gate would bind a scratch
  nobody else reads.
- **An editor in the page**, RFC 0001's deferred example widget. It is a second editor beside the
  maintainer's own, without the types or the files to keep.
- **A top-level `workbench/`.** Easier to find, at the price of a seed change upstream for its
  `export-ignore` line; `tests/` is already ignored, which is why `tests/manual/` sits there.

## Decision

**Accepted** on 2026-11-10, on the three questions the shape turned on:

1. **The scratch is written in the editor**, and the page reloads on save — not in an editor in the
   page.
2. **The workbench is a page of its own, local only**: neither published nor run by `test`.
3. **The shell carries all four**: the options, the event log, tokens and effects, and the
   accessibility check.

The study settled the rest: the scratch in `reports/workbench/`, the workbench in
`tests/workbench/`, `reports/**` among ESLint's ignores, and `vite` declared.

**Built** in [#378](https://github.com/rak200/ui/pull/378).

## Rollout

1. **The workbench**, in one pull request: the config, the shell, the starter page, the script,
   `vite` in `devDependencies` and `reports/**` in ESLint's ignores, with CLAUDE.md's tree and a
   routing line. The index marks this proposal `Implemented` in the same pull request.

## Related

- [RFC 0001](0001-component-playground.md), whose first premise set this reader aside.
- [RFC 0004's prototypes](0004-motion/README.md), which served this use through the motion work.

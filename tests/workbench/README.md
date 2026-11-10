# The workbench

A page for using the components while they are built, which
[RFC 0007](../../docs/proposals/0007-workbench.md) decided. It is local: nothing publishes it, and
`test` does not run it.

```sh
npm run workbench
```

Then open the address Vite prints, on port 5180 unless another server holds it. The first run lays a
starter page out in `reports/workbench/`, with every component on it.

## The scratch

`reports/workbench/` is yours. Git, Prettier, `tsc` and ESLint all leave it alone, so nothing
written there reaches the tree or a gate.

- **A page there is a page a consumer would write**: HTML that imports `@rak200/ui`, with a module
  beside it where the page needs data or state. Save, and the page reloads. Copy `index.html` to
  start another; the shell lists every page in the folder.
- **A scratch module has the package's types.** The folder carries its own `tsconfig.json`, which
  maps `@rak200/ui` to `src/`.
- **To start over**, delete the folder. The next run lays the starter out again.

## The shell

The panel in the corner is written into every page of the scratch, and what it holds survives the
reload each save causes.

| Tab           | What it does                                                          |
| ------------- | --------------------------------------------------------------------- |
| Options       | the theme, the scheme, reduced motion, more contrast, the direction   |
| Events        | what a consumer listens for, and what each submission sends           |
| Tokens        | a value for any token a host sets, and the CSS a consumer would write |
| Effects       | an effect for a moment, on the page or on one component, and its CSS  |
| Accessibility | axe over the page, with the suite's ruleset                           |

- **Reduced motion and more contrast** are the sheets' own rules with the condition taken off, which
  is what the reader's setting does. A page cannot set either media feature.
- **A submission is held on the page**, so the log keeps what it sent.
- **While a modal dialog is open the shell is inert**, as everything outside a modal is.

## When something does not show

- **A change in `src/` that does not appear**: restart the server. After a branch switch Vite can go
  on serving an older copy of a module, and it starts again in about a second.
- **On a phone**: `npm run workbench -- --host`, then the network address Vite prints.

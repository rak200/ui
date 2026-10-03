# RFC 0003 — prototypes

[← RFC 0003](../0003-themes.md)

One page per wanted theme, each rendering the real components from `src/` under the CSS the theme
would ship. They are a sketch to judge the [proposed design](../0003-themes.md#proposed-design)
against, not a product: nothing here is published, tested or imported by the package.

```sh
npx vite docs/proposals/0003-themes
```

Then open the address Vite prints. The dev server compiles `src/` directly, so no build runs first.

| Page            | Shows                                                                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `default.html`  | an accent picker, with today's label beside the derived one — question 3                                                                                 |
| `contrast.html` | the default palette under `prefers-contrast: more` — question 4                                                                                          |
| `matrix.html`   | green on black and on white, glowing on the raised surfaces and the controls, and under today's formulas; closed at its defaults                         |
| `glass.html`    | translucent raised surfaces and controls over three pages — one of them a colour you choose — and the page each setting can take; closed at its defaults |

**Every page has a scheme control** — system, light, dark — which writes `color-scheme` on the root
element the way the playground's toolbar does, and remembers the choice from page to page.

**What a theme would ship is the `<style>` in each page's head.** Two changes the proposal makes
outside a theme are stood in for here, and each says so beside itself: the derived label, in
`proposal.css`, which the proposal would put in `src/tokens.ts`; and the raised surfaces reading
Glass's two names, at the top of `glass.html`, which the proposal would put in the components.

**Under every panel, the floors are measured again** — the ones `tests/tokens.test.ts` holds for
the default palette, read in the browser with the suite's own `contrastRatio()`, over whatever
palette that panel is in. `specimen.ts` renders the components and takes the readings.

The Matrix and Glass values follow the visual reference the proposal describes, wherever a floor
allows them; `matrix.html` names the one place it does not.

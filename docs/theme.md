# Themes

The themes this package ships, the shape a theme takes as data, and the function that renders one
to CSS. What a theme _is_ — a named set of decisions, selected with `data-ui-theme`, independent of
the scheme — is in [tokens.md](tokens.md#themes); this page is the shipped ones and the API.

## Contents

- [Using a shipped theme](#using-a-shipped-theme)
- [`matrix`](#matrix)
- [`glass`](#glass)
- [`Theme`](#theme)
- [`themeStyleSheet`](#themestylesheet)
- [Your own theme](#your-own-theme)

## Using a shipped theme

Insert the theme's block beside the token sheet, and put the attribute on whatever should wear it:

```js
import { matrix, themeStyleSheet, tokenStyleSheet } from '@rak200/ui';

const style = document.createElement('style');
style.textContent = tokenStyleSheet() + themeStyleSheet(matrix);
document.head.append(style);
```

```html
<body data-ui-theme="matrix">
  …
</body>
```

**A theme is opt-in.** `tokenStyleSheet()` never emits one, so a page pays for no theme it does not
select. The attribute can sit on any element — a theme can be a region of a page rather than the
whole of it — and the scheme stays yours: a shipped theme renders in both, under whatever
`color-scheme` is in force.

**A shipped theme is measured.** Every contrast floor the default palette clears runs again under
each shipped theme, in both schemes and when the reader asks for more contrast, and each one carries
a story the accessibility assertion runs over. A theme that stopped clearing a floor would block the
change that broke it.

## `matrix`

A terminal's green on near-black in the dark scheme, and the same idea on white in the light one.

|              | light                       | dark      |
| ------------ | --------------------------- | --------- |
| surface      | `#ffffff`                   | `#050505` |
| text         | `#003b00`                   | `#00ff00` |
| accent       | `#008f11`                   | `#00ff00` |
| focus ring   | `#008f11`                   | `#ccffcc` |
| success      | `#00850f`                   | `#00ff00` |
| info         | `#00778a`                   | `#00e5ff` |
| hover        | `#cfd9ce`                   | `#11280f` |
| pressed      | `#b0c1ae`                   | `#174315` |
| font, corner | a monospace stack, `0.5rem` | the same  |

**The raised surfaces glow**, through `--ui-elevation-100` — the step the card, the menu, the toast
and the tip already read, so no name is added for it. A glow is a shadow at no offset, and the part
of it that follows the scheme is its colour, which `light-dark()` can carry inside a shadow. It is
written in `currentColor`: the card and the open menu light it in the accent's green, a toast in its
edge's colour, and the tip, which is your own element, in its text.

**The controls wear the same ring and glow**, through `--ui-elevation-control`, at the same
strengths. It is written in `currentColor`, so a control is lit in its own colour: the green of the
accent, and the danger when it is invalid. **A button lights up under the pointer**: its ring goes
solid and its glow doubles, because the fills' own hovers barely move in this green. **An invalid field
writes its value in the danger**, inside its red edge: 6.47:1 on the field's white and 7.37 on its
black.

**It sets its own hover and pressed.** A green text is far from neutral, and the shared formula's
mix left the dark hover at 1.24:1 and the light pressed 1.24 past the hover, under the 1.25 both
owe. The theme writes 18% and 30% of the text instead, as values.

**When the reader asks for more contrast**, the green stays on the accent, and the text and the edge
of what floats over the page go to the text's pole, black or white.

## `glass`

The raised surfaces frosted over whatever page is behind them, in both schemes: the card, the toast,
the tip, the dialog and the open menu.

|                    | light                                                      | dark                                   |
| ------------------ | ---------------------------------------------------------- | -------------------------------------- |
| text               | `#000000`                                                  | `#ffffff`                              |
| accent             | `#334155`                                                  | `#94a3b8`                              |
| hover              | `#bebebe`                                                  | `#393f4d`                              |
| pressed            | `#989898`                                                  | `#535965`                              |
| a raised surface   | white at 0.20                                              | black at 0.20                          |
| behind it          | `blur(10px) saturate(1.7)`                                 | the same                               |
| its edge           | white at 0.45                                              | white at 0.16                          |
| its lift           | a highlight along the top, white at 0.60, and a soft drop  | white at 0.20, the drop darker         |
| a toast's edge     | its variant's colour at 0.80                               | the same                               |
| a control's fill   | the surface at 0.20                                        | the same                               |
| a table's stripe   | its mix at 0.20                                            | the same                               |
| a checked control  | the accent at 0.80, its mark whole                         | the same                               |
| the primary button | `#94a3b8` at 0.80, under a black label                     | `#334155` at 0.80, under a white label |
| a button's edge    | white at 0.45                                              | white at 0.16                          |
| under the pointer  | the text                                                   | the same                               |
| a button's lift    | a highlight along the top, white at 0.60, and a short drop | white at 0.20, the drop darker         |

**The glass is the scheme's pole at an opacity**, white in the light scheme and black in the dark —
black rather than the dark surface, because at the same opacity it takes a lighter page. The surface
itself stays opaque, so every mix of it — the border, the muted text — stays where the floors measured it. The text goes to its
pole and the accent to slate: text over frosted glass reads washed out long before it measures as
failing, and a saturated accent fights whatever colour the page throws through. A toast's icon stays
opaque in its variant's colour, being the one cue that tells a variant by more than its colour.

**The controls are glass too.** A field, a select, an empty box or radio, a switch that is off and a
table take their own fill at the glass's opacity, and a table's stripe its mix. Every edge stays
opaque, so a field keeps the 3:1 its boundary was chosen for, and what is written in it is measured
over the fill laid on the page and on the glass alike. A select's choices keep the opaque surface,
because the platform's picker reads them.

**A checked control takes the accent at 0.80, and the primary button is inverted.** A translucent
fill moves toward its own label, and Glass's accent sits at the far pole from the glass, so its label
is the glass's own pole: a primary button at an opacity would lose it below 0.72. Inverted — a light
slate under a black label in the light scheme, a dark one under a white label in the dark — the fill
moves away from the label instead, and so does each of its states. A checked box keeps the accent,
because inverted it fell under 3:1 against the glass even when opaque; its mark is drawn whole.

**A button's edge softens to the glass's, and a field's does not.** Drawn in the text's colour, a
secondary button's edge was the hardest line on the glass, and a button's label already identifies
it, so its edge owes no 3:1. A field's edge is what shows where the field is, and keeps the derived
border. Every button, the primary and the menu's trigger included, takes the glass's edge and a
highlight with a short drop, and under the pointer its edge goes to the text: a translucent fill's own
hover is the least of what moves.

**It holds its floors over a page, and the page is yours.** What rests on the glass is read against
the glass and the page behind it, so the theme is measured over the page it can take: **no darker
than `#cecece` in the light scheme, and no lighter than `#303030` in the dark.** One step past
either, something resting on the glass falls under its floor — the error message in the light
scheme, the focus ring in the dark. A page between the scheme's own pole and that grey holds; one
past the grey, or a light page behind dark glass, does not, and nothing here measures it. The text
has the most room of anything on the glass, so a page that looks fine under it can still be past
the limit.

**It sets its own hover and pressed**, 20% and 32% of the text rather than the formula's 16% and
26%. A menu's items and a toast's dismiss hover on the glass with nothing else to show the pointer
by, and over the light page Glass holds over, the formula's hover stood 1.15:1 from the glass, under
the 1.25 a state owes.

**When the reader asks for more contrast or for less transparency, glass stops being glass**: every
raised surface goes back to the opaque surface with nothing behind it, its edge to the boundary and
its lift to the default palette's, every control's fill and every stripe goes opaque, and a button
goes back to its variant's edge and no lift. More contrast also edges what floats over the page and a toast in
the text, and writes the default palette's neutral states, because Glass's text and surface are the
default's there.

## `Theme`

A theme as data, which is what `defaults`, `darkScheme` and `moreContrast` already are for the
default palette:

```ts
interface Theme {
  readonly name: string;
  readonly values: Readonly<Partial<Record<Token | DerivedToken, string>>>;
  readonly dark?: Readonly<Partial<Record<Token | DerivedToken, string>>>;
  readonly more?: Readonly<Partial<Record<Token | DerivedToken, readonly [string, string]>>>;
  readonly translucent?: Pick<Theme, 'values' | 'dark'>;
}
```

| Field         | Holds                                                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `name`        | what `data-ui-theme` says to select it                                                                                                   |
| `values`      | what it sets, at its light value or at the value it has in both, as `defaults`                                                           |
| `dark`        | the values that differ in the dark scheme — colours only, as `darkScheme`                                                                |
| `more`        | its answer to `prefers-contrast: more`, a light and a dark value per name                                                                |
| `translucent` | what it makes translucent, in the shape of `values` and `dark`, set aside for the reader who asks for more contrast or less transparency |

A derived role belongs in `values` only where the theme needs a different mix than the formula
gives; the floors then measure what it wrote. **A name in `translucent` may be in `values` too**, at
its opaque value: that is the value it goes back to when the translucency stands down. One that is
not goes back to its default — Glass gives its accent both, and its raised surfaces only the
translucent one. Data first, because a target that is not CSS reads the
values rather than parsing a stylesheet back into them.

## `themeStyleSheet`

A theme as CSS: its block under `[data-ui-theme='…']`, where it makes something translucent the
rule that stands that down, and its answer to more contrast last.

```js
themeStyleSheet(matrix);
// "[data-ui-theme='matrix'] {
//   --ui-color-surface: light-dark(#ffffff, #050505);
//   … }
//
// @media (prefers-contrast: more) {
//   [data-ui-theme='matrix'] {
//     --ui-color-text: light-dark(#000000, #ffffff);
//     --ui-color-accent-hover: initial;
//     … } }"
```

**The answer resets the states the default palette's answer writes and the theme's leaves out.**
`tokenStyleSheet()` writes the hover, the pressed, the striped row and the accent's two states as
values under more contrast, at `:root`, and a value there reaches every subtree — so under a theme
they would be the default palette's greys over the theme's grounds. `initial` hands each back to its
formula, which resolves against the theme's own grounds. A ground needs no reset: one the theme
declares wins on its own element, and one it leaves alone is the reader's setting, rightly inherited.

**What a theme makes translucent stands down under either setting**, in a rule of its own:

```css
@media (prefers-contrast: more), (prefers-reduced-transparency: reduce) {
  [data-ui-theme='glass'] {
    --ui-color-surface-raised: initial;
    --ui-backdrop-raised: initial;
    … } }
```

Each name goes back to the theme's opaque value, or with `initial` to its default. The answer to more
contrast comes after it, so where it names one of these it wins. Reduced transparency is known to
Chromium only; elsewhere the translucency stands down for more contrast alone.

## Your own theme

Write it by hand, the way [tokens.md](tokens.md#themes) shows — a block under `data-ui-theme` with
the grounds you want — or hand `themeStyleSheet()` an object of the shape above for the same
rendering. Neither is measured by this package: the floors run over the themes it ships, and yours
is yours to check.

**If your theme lets the page through, put it in `translucent`**, so a reader who asks for more
contrast or less transparency gets it opaque — and measure it over the page you will put it on.

**If your theme should answer more contrast, write the answer.** The default palette's states are
declared at `:root` under that setting and reach under your theme; declare your own, or reset them
with `initial` to hand them back to their formulas. `themeStyleSheet()` does the reset for you.

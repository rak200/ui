# Themes

The themes this package ships, the shape a theme takes as data, and the function that renders one
to CSS. What a theme _is_ — a named set of decisions, selected with `data-ui-theme`, independent of
the scheme — is in [tokens.md](tokens.md#themes); this page is the shipped ones and the API.

## Contents

- [Using a shipped theme](#using-a-shipped-theme)
- [`matrix`](#matrix)
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
solid and its glow doubles, because the fills' own hovers barely move in this green.

**It sets its own hover and pressed.** A green text is far from neutral, and the shared formula's
mix left the dark hover at 1.24:1 and the light pressed 1.24 past the hover, under the 1.25 both
owe. The theme writes 18% and 30% of the text instead, as values.

**When the reader asks for more contrast**, the green stays on the accent, and the text and the edge
of what floats over the page go to the text's pole, black or white.

## `Theme`

A theme as data, which is what `defaults`, `darkScheme` and `moreContrast` already are for the
default palette:

```ts
interface Theme {
  readonly name: string;
  readonly values: Readonly<Partial<Record<Token | DerivedToken, string>>>;
  readonly dark?: Readonly<Partial<Record<Token | DerivedToken, string>>>;
  readonly more?: Readonly<Partial<Record<Token | DerivedToken, readonly [string, string]>>>;
}
```

| Field    | Holds                                                                          |
| -------- | ------------------------------------------------------------------------------ |
| `name`   | what `data-ui-theme` says to select it                                         |
| `values` | what it sets, at its light value or at the value it has in both, as `defaults` |
| `dark`   | the values that differ in the dark scheme — colours only, as `darkScheme`      |
| `more`   | its answer to `prefers-contrast: more`, a light and a dark value per name      |

A derived role belongs in `values` only where the theme needs a different mix than the formula
gives; the floors then measure what it wrote. Data first, because a target that is not CSS reads the
values rather than parsing a stylesheet back into them.

## `themeStyleSheet`

A theme as CSS: its block under `[data-ui-theme='…']`, and its answer to more contrast after it.

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

## Your own theme

Write it by hand, the way [tokens.md](tokens.md#themes) shows — a block under `data-ui-theme` with
the grounds you want — or hand `themeStyleSheet()` an object of the shape above for the same
rendering. Neither is measured by this package: the floors run over the themes it ships, and yours
is yours to check.

**If your theme should answer more contrast, write the answer.** The default palette's states are
declared at `:root` under that setting and reach under your theme; declare your own, or reset them
with `initial` to hand them back to their formulas. `themeStyleSheet()` does the reset for you.

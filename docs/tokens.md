# Tokens

[← Reference](README.md)

The design tokens — the single source of truth for the visual language.

```js
import { tokens, defaults, darkScheme, tokenStyleSheet } from '@rak200/ui';
```

## Contents

- [Overriding a token](#overriding-a-token)
- [Light and dark](#light-and-dark)
- [`tokens`](#tokens)
- [`defaults`](#defaults)
- [`darkScheme`](#darkscheme)
- [`tokenStyleSheet`](#tokenstylesheet)
- [`Token`](#token)

## Overriding a token

Every token is a CSS custom property under `--ui-`, so a host overrides one by setting it anywhere
above the component. No build step, no theme object, no fork:

```css
:root {
  --ui-color-accent: rebeccapurple;
  --ui-radius: 0;
}
```

Tokens exist from day one because they are the only thing that reaches every target the roadmap
has: the components consume them as custom properties, and a native shell can read the same values
without the components. A token added later is a token some target already hardcoded.

## Light and dark

Insert [`tokenStyleSheet()`](#tokenstylesheet) and you have both. Each ground that differs by scheme
is declared as `light-dark(light, dark)`, and the sheet declares `color-scheme: light dark` beside
them, so the browser picks the branch:

```html
<style>
  /* whatever tokenStyleSheet() returned */
</style>
```

| What you want               | What you write                                |
| --------------------------- | --------------------------------------------- |
| Follow the operating system | nothing — that is what the sheet already does |
| Force light                 | `color-scheme: light` on any ancestor         |
| Force dark                  | `color-scheme: dark` on any ancestor          |

`color-scheme` inherits, so one declaration governs everything below it — a region, a dialog, or the
document. There is no media query to write and no three-state selector to get right.

**A scheme is not a theme.** A theme is a named set of decisions; a scheme is the light or dark
rendering of whichever theme is in force. They are independent axes, and this page documents the
second one — the token names never change between schemes, only some of their values.

**Without the sheet there is no dark rendering.** Components carry each token's _light_ value as
their `var()` fallback, so a page that declares no tokens at all still renders, in light. That is
the trade: nothing breaks without the sheet, and nothing goes dark without it either.

## `tokens`

The token names this package defines, as they appear in CSS.

| Token                        | Covers                                  |
| ---------------------------- | --------------------------------------- |
| `--ui-color-accent`          | the accent surface of a primary control |
| `--ui-color-accent-contrast` | text on that accent                     |
| `--ui-color-surface`         | a neutral surface                       |
| `--ui-color-text`            | body and secondary text                 |
| `--ui-color-focus`           | the focus ring — see the floor below    |
| `--ui-color-danger`          | error text                              |
| `--ui-radius`                | corner radius                           |
| `--ui-space`                 | the spacing step components scale from  |
| `--ui-font`                  | the font stack                          |

### One token carries a floor

`--ui-color-focus` is the visual information that identifies a focused control, so WCAG 1.4.11 asks
for **3:1 against the surface it sits on** — `outline-offset` puts the surface on both sides of the
ring, so the surface is what it is measured against rather than the control underneath.

An override is yours to choose, but a focus ring below that ratio is one some people cannot see. The
default is 5.02:1 on the light surface and clears the floor on a dark one too.

## `defaults`

The default value of every token. Deliberately plain rather than branded: a design system's
defaults are what a host sees before it has decided anything.

```js
defaults['--ui-color-accent']; // '#2563eb'
```

## `darkScheme`

The grounds whose value differs when the page is rendered dark — a **partial** map, because most
tokens do not vary. A radius is a radius in either scheme; a surface is not.

```js
darkScheme['--ui-color-surface']; // '#111827'
darkScheme['--ui-radius']; // undefined
```

Five entries today: `--ui-color-surface`, `--ui-color-text`, `--ui-color-accent`,
`--ui-color-accent-contrast` and `--ui-color-danger`. `--ui-color-focus` is absent because one value
clears its contrast floor in both schemes.

You rarely read this directly — [`tokenStyleSheet()`](#tokenstylesheet) composes it into the sheet.
It is exported because a target that is not CSS cannot evaluate `light-dark()` and needs the two
values as data.

## `tokenStyleSheet`

Every token as a CSS rule, for a host that wants them without importing a component. Returns the
text of a `:root` block; the host inserts it however it prefers.

```js
tokenStyleSheet();
// ':root {
//   color-scheme: light dark;
//   --ui-color-accent: light-dark(#2563eb, #60a5fa);
//   --ui-radius: 0.375rem;
//   … }'
```

A token with a dark value is emitted as a `light-dark()` pair; one without is emitted plain. The
`color-scheme` declaration rides along because it is a real property rather than a custom one, so it
can never be a token — and a dark scheme that depends on every host remembering to declare it is one
that mostly does not happen.

## `Token`

The union of CSS custom properties this package defines — useful for typing a partial override map.

# Tokens

[← Reference](README.md)

The design tokens — the single source of truth for the visual language.

```js
import { tokens, defaults, tokenStyleSheet } from '@rak200/ui';
```

## Contents

- [Overriding a token](#overriding-a-token)
- [`tokens`](#tokens)
- [`defaults`](#defaults)
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

## `tokenStyleSheet`

The token defaults as a CSS rule, for a host that wants them without importing a component.
Returns the text of a `:root` block; the host inserts it however it prefers.

```js
tokenStyleSheet();
// ':root {\n  --ui-color-accent: #2563eb;\n  … \n}'
```

## `Token`

The union of CSS custom properties this package defines — useful for typing a partial override map.

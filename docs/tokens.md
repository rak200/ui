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

Every token is a CSS custom property under `--rak-`, so a host overrides one by setting it anywhere
above the component. No build step, no theme object, no fork:

```css
:root {
  --rak-color-accent: rebeccapurple;
  --rak-radius: 0;
}
```

Tokens exist from day one because they are the only thing that reaches every target the roadmap
has: the components consume them as custom properties, and a native shell can read the same values
without the components. A token added later is a token some target already hardcoded.

## `tokens`

The token names this package defines, as they appear in CSS.

```js
tokens; // ['--rak-color-accent', '--rak-color-accent-contrast', … , '--rak-font']
```

## `defaults`

The default value of every token. Deliberately plain rather than branded: a design system's
defaults are what a host sees before it has decided anything.

```js
defaults['--rak-color-accent']; // '#2563eb'
```

## `tokenStyleSheet`

The token defaults as a CSS rule, for a host that wants them without importing a component.
Returns the text of a `:root` block; the host inserts it however it prefers.

```js
tokenStyleSheet();
// ':root {\n  --rak-color-accent: #2563eb;\n  … \n}'
```

## `Token`

The union of CSS custom properties this package defines — useful for typing a partial override map.

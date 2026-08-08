# UiButton

[← Reference](README.md)

A button.

```js
import '@rak200/ui';
```

## Contents

- [`<ui-button>`](#ui-button)
- [`variant`](#variant)
- [`disabled`](#disabled)
- [`ButtonVariant`](#buttonvariant)
- [Styling](#styling)

## `<ui-button>`

```html
<ui-button>Save</ui-button>
```

The element delegates to a real `<button>` inside its shadow root rather than reimplementing one.
That is the whole design: keyboard activation, the accessible name taken from the slotted content,
the disabled semantics and the focus behaviour stay the platform's job. A `<div role="button">`
would need every one of them written by hand, and would get one of them wrong.

The class is exported as `UiButton` for a host that needs the type; importing the package
registers the element, so nothing has to be called.

Every state below is asserted against [axe](https://github.com/dequelabs/axe-core) in the suite,
for WCAG A/AA, inside the real browser it renders in — including through the shadow root, which is
where a check that stops at the host silently passes.

## `variant`

```html
<ui-button variant="secondary">Cancel</ui-button>
```

How much visual weight the button carries — `primary` (the default) or `secondary`. Reflected, so
it can be read back from the attribute and selected on in CSS.

## `disabled`

```html
<ui-button disabled>Unavailable</ui-button>
```

Whether the button rejects interaction. It sets `disabled` on the inner `<button>`, which is what
actually stops the click and removes it from the tab order — the attribute on the host is reflected
so a host stylesheet can select on it.

## `ButtonVariant`

The union of accepted `variant` values: `'primary' | 'secondary'`.

## Styling

The inner button is exposed as a **part**, so a host can reach it without piercing the shadow root
blindly:

```css
ui-button::part(button) {
  text-transform: uppercase;
}
```

For colour, radius, spacing and the focus ring, prefer the [tokens](tokens.md) — they restyle every
component at once instead of one selector at a time.

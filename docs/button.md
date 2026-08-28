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
- [Interaction states](#interaction-states)
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

## Interaction states

The button answers a pointer, and every colour it answers with comes from the
[tokens](tokens.md):

| State            | What moves                                                               |
| ---------------- | ------------------------------------------------------------------------ |
| Hover            | the background, over `--ui-duration-state` and along `--ui-easing-state` |
| Pressed          | the background again, further, and **with no transition at all**         |
| Focus (keyboard) | a 2px `--ui-color-focus` ring, immediately                               |
| Disabled         | nothing — a disabled button takes a pointer and does not respond to it   |

Three of those are deliberate rather than incidental. The pressed colour lands instantly because a
click is over in about 100ms, so a 150ms transition would finish after the finger has left and the
state would never be seen. The focus ring is left out of the transition for the same kind of reason
in reverse: delaying the affordance that says _this is where you are_ is the opposite of what it
exists for. And the hover and pressed rules are guarded with `:not(:disabled)`, because a disabled
button still matches `:hover` and `:active` — without the guard it would light up under a pointer
that cannot activate it.

**A press is never the only feedback.** Activating with <kbd>Enter</kbd> produces no `:active` at
all, which is why the focus ring and the action itself carry the interaction for a keyboard user.

To retune the motion, set the purpose rather than the step:

```css
ui-button {
  --ui-duration-state: 300ms;
}
```

Under `prefers-reduced-motion: reduce` every duration collapses in the token sheet, and this
component never learns why.

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

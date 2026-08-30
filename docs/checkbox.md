# UiCheckbox and UiSwitch

[← Reference](README.md)

Boolean form controls, drawn from the token layer rather than replaced.

```js
import '@rak200/ui';
```

## Contents

- [`<ui-checkbox>`](#ui-checkbox)
- [`<ui-switch>`](#ui-switch)
- [Which one to reach for](#which-one-to-reach-for)
- [The control is yours](#the-control-is-yours)
- [The mixed state](#the-mixed-state)
- [Inside a field](#inside-a-field)
- [Interaction states](#interaction-states)
- [Styling](#styling)

## `<ui-checkbox>`

```html
<ui-checkbox>
  <input type="checkbox" name="receipt" />
</ui-checkbox>
```

A box around a checkbox you wrote. It carries the appearance — the size, the boundary, the radius,
the fill, the tick, the focus ring and the interaction states — and nothing else.

The class is exported as `UiCheckbox` for a host that needs the type; importing the package
registers the element, so nothing has to be called.

## `<ui-switch>`

```html
<ui-switch>
  <input type="checkbox" name="notify" checked />
</ui-switch>
```

The same control, drawn as a track and a thumb and announced as a switch. **`role="switch"` is set
by the element**, on the control you wrote, so a switch cannot ship looking like one and announcing
as a checkbox because an attribute was forgotten. A `role` you write yourself is never overwritten.

There is no native switch to delegate to: `<input type="checkbox" switch>` is unsupported in the
engine this package's suite measures, so a switch is drawn rather than adopted.

Exported as `UiSwitch`.

## Which one to reach for

**The difference is semantic, and the drawing follows it rather than the other way round.**

- A **checkbox** is a value you are about to submit. It sits in a form, it can be required, and
  nothing happens until the form is sent.
- A **switch** takes effect when you flick it. There is no submit to wait for and no cancel to
  reach for, so it is wrong for anything a person should be able to change their mind about before
  committing.

If the answer is _it goes in the form_, it is a checkbox. Two components that differed only in
appearance would be one component with a `variant`.

## The control is yours

**You write the `<input type="checkbox">`, and it stays in the light DOM.** That is the single
decision these components are made of, and it is forced rather than preferred — the same constraint
that shapes [`<ui-input>`](input.md) and [`<ui-field>`](field.md): an ARIA relationship by IDREF does
not cross a shadow boundary, so a control rendered into a shadow root cannot be labelled by the
`<label>` beside it.

What it buys back is the same three things: `name`, `checked`, `required` and `disabled` are the
platform's business with no pass-through list to fall out of step with; the control is directly
styleable, being your own element in your own tree; and it reaches a form submit because it is a
native control inside a `<form>`, with no `ElementInternals` and no value mirroring.

A `<label>` wrapping the control labels it, too — the control is a descendant of that label in the
tree the browser reads:

```html
<label>
  <ui-checkbox><input type="checkbox" name="remember" /></ui-checkbox>
  Remember this device
</label>
```

## The mixed state

```js
document.querySelector('#select-all').indeterminate = true;
```

A checkbox drawn by this package **draws the mixed state**, and that is not a tri-state feature
being offered. `appearance: none` takes the platform's own dash away along with the rest of the
drawing, so a control you set `indeterminate` on would otherwise render as plainly _unchecked_ — a
wrong answer rather than a missing one. The dash exists to stop that.

`<ui-switch>` draws no mixed state, because `role="switch"` has no third value.

## Inside a field

[`<ui-field>`](field.md) wires the label, the help, the error and `aria-invalid`, and it finds the
control through the wrapper:

```html
<ui-field>
  <label slot="label">I accept the terms</label>
  <ui-checkbox><input type="checkbox" name="terms" required /></ui-checkbox>
  <span slot="error">The terms have to be accepted.</span>
</ui-field>
```

The error boundary is not set here and not by the wrapper: the field marks the control
`aria-invalid`, and the drawing reads that — one source, and it is the one a screen reader is
already using.

## Interaction states

Unchecked, the boundary finishes the mix it started, the way [`<ui-input>`](input.md)'s does.
Checked, the boundary is not what the eye is on, so the fill moves instead, the way
[`<ui-button>`](button.md)'s does. Both are guarded against `:disabled`, which still matches
`:hover`.

The focus ring is `:focus-visible`, never transitioned, and never removed.

**The control is drawn at 24×24 at least.** WCAG 2.2's _2.5.8 Target Size (Minimum)_ asks that of a
target the author sized, and a native checkbox — 13×13 in this engine — escapes it only through
that criterion's _user agent control_ exception, which drawing our own gives up. Shrinking
`--ui-space` scales everything else and cannot take these below the floor.

**Forced colors is handled rather than inherited.** That mode replaces every author colour, so the
accent that says _checked_ would become the same `Canvas` as the surface that says _not_ — the state
would disappear for the people who turned the mode on to see states more clearly. The checked states
name `Highlight`, and the disabled one names `GrayText` instead of dimming, because opacity is not a
colour and is not forced.

## Styling

Every colour is a [token](tokens.md); nothing here is hardcoded, including the tick.

| Part                                      | Token                                                       |
| ----------------------------------------- | ----------------------------------------------------------- |
| size                                      | `--ui-space` × 3, floored at 24px                           |
| resting fill                              | `--ui-color-surface`                                        |
| boundary, and the switch's track when off | `--ui-color-border`                                         |
| checked fill                              | `--ui-color-accent`, and `--ui-color-accent-hover` on hover |
| unchecked boundary on hover               | `--ui-color-text`                                           |
| the switch's thumb                        | `--ui-color-surface`                                        |
| in error                                  | `--ui-color-danger`                                         |
| focus ring                                | `--ui-color-focus`                                          |
| corner                                    | `--ui-radius` (the switch is always a pill)                 |
| motion                                    | `--ui-duration-state`, `--ui-easing-state`                  |

**The tick is a hole, not a colour**, and that is what keeps it overridable. An SVG embedded in a
`data:` URI freezes whatever colour is drawn into it, and no host could override that. A mask has no
colour — only its alpha is read — so the tick is punched out of the accent fill with
`mask-composite: exclude`, and what shows through it is whatever the control sits on.

The alternative was a mark rendered into the shadow root, and it is not available:
`:host(:has(input:checked))` is invalid in this engine, measured with `CSS.supports`, and shadow CSS
has no other way to read a slotted control's state.

`::part()` is not exposed. There is nothing in the shadow root to aim it at — the control is yours,
so it is styleable directly.

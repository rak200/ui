# UiSelect

[← Reference](README.md)

A native `<select>`, styled by the token layer rather than replaced.

```js
import '@rak200/ui';
```

## Contents

- [`<ui-select>`](#ui-select)
- [The control is yours](#the-control-is-yours)
- [What this cannot style](#what-this-cannot-style)
- [Inside a field](#inside-a-field)
- [A list rather than a drop-down](#a-list-rather-than-a-drop-down)
- [Interaction states](#interaction-states)
- [Styling](#styling)

## `<ui-select>`

```html
<ui-select>
  <select name="currency">
    <option value="brl">Real</option>
    <option value="usd">Dollar</option>
  </select>
</ui-select>
```

A box around a `<select>` you wrote. It carries the appearance — the boundary, the radius, the
padding, the type, the caret, the focus ring and the interaction states — and nothing else.

Exported as `UiSelect`; importing the package registers the element, so nothing has to be called.

**The native element is the decision, not a shortcut.** A custom listbox is an accessibility project
of its own, and it would have to reimplement the picker a phone already opens — the part a consumer
notices most and a library gets wrong most. RFC 0016 defers that listbox, and this element is not a
step toward it.

## The control is yours

**You write the `<select>` and its `<option>`s, and they stay in the light DOM.** The same shape
[`<ui-input>`](input.md) has, forced by the same constraint: an ARIA relationship by IDREF does not
cross a shadow boundary, so a control rendered into a shadow root could not be labelled by the
`<label>` beside it.

So `name`, `required`, `disabled`, `multiple`, `size` and `value` are the platform's business, there
is no pass-through list to fall out of step with them, and the control reaches a form submit because
it is a native control inside a `<form>`.

## What this cannot style

The honest part, and the reason to read this page before reaching for the component.

**The drop-down list is drawn by the operating system.** Nothing in this package reaches inside it —
not the list's background, not its padding, not the highlight on the option under the pointer, and
not the checkmark beside the selected one. On a phone it is not a list at all but the platform's own
picker. That is the trade the native element makes, and it is the right one: the picker is
accessible, familiar and correct on every platform, for free.

**`<option>` styling is close to nothing.** `color` and `background-color` are honoured unevenly
across engines and ignored outright inside the OS picker. Do not build a design on them.

**The closed control is drawn here rather than by the platform.** `appearance: none` is set, which
takes the operating system's own chevron off and hands the box to the token layer — otherwise a
select would stop matching the text field beside it on the engines that ignore most of what an
`appearance: auto` select is told. It does **not** affect what opens: the picker is still the
platform's.

**A styleable drop-down is coming, and is not adopted here.** Chromium ships `appearance: base-select`
with `::picker(select)` and `::checkmark` — measured as supported in the engine this package's suite
runs. It is not used, because a visual language that changes shape depending on the engine is the
thing a kit exists to prevent, and a suite that runs one engine cannot speak for the others. When it
is available broadly, it is what reopens the deferred listbox question — by removing the reason the
listbox was wanted.

## Inside a field

[`<ui-field>`](field.md) wires the label, the help, the error and `aria-invalid`, and finds the
control through the wrapper:

```html
<ui-field>
  <label slot="label">Currency</label>
  <ui-select>
    <select name="currency" required>
      <option value="">Choose one</option>
      <option value="brl">Real</option>
    </select>
  </ui-select>
  <span slot="error">A currency is required.</span>
</ui-field>
```

The error boundary is not set here and not by the wrapper: the field marks the control
`aria-invalid`, and the drawing reads it — one source, and it is the one a screen reader is already
using.

## A list rather than a drop-down

```html
<ui-select>
  <select name="tags" multiple size="4">
    …
  </select>
</ui-select>
```

`multiple` makes the control a list, and **the caret is not drawn on one** — it would point at
nothing. The box stays, because the box is the part this component owns.

A `size` above 1 without `multiple` also renders as a list, and there the caret _is_ still drawn,
centred against a box far taller than it. CSS cannot compare an attribute's value to a number, so
this is a rough edge rather than a guard: reach for `multiple` when you want a list.

## Interaction states

The boundary completes the mix it started, the same way [`<ui-input>`](input.md)'s does and against
the same token, guarded against `:disabled`. There is **no `[readonly]` guard**, and its absence is
measured rather than forgotten: `readOnly` is not a property of a select at all, so the input's
second guard would be a rule about an attribute the platform never sets.

The focus ring is `:focus-visible`, never transitioned, and never removed.

**The box matches the input's, and something checks that.** The two are written in different files,
and `tests/select.test.ts` mounts both and asserts they agree on the boundary, the corner, the
padding, the type and the focus ring — then asserts they differ on exactly the two rules this
component declares they do. A kit whose select does not line up with its text field is a kit nobody
trusts with a form.

## Styling

Every colour is a [token](tokens.md); nothing here is hardcoded, including the caret.

| Part                | Token                                           |
| ------------------- | ----------------------------------------------- |
| boundary            | `--ui-color-border`, `--ui-color-text` on hover |
| fill                | `--ui-color-surface`                            |
| value               | `--ui-color-text`                               |
| caret               | `--ui-color-text-muted`                         |
| in error            | `--ui-color-danger`                             |
| focus ring          | `--ui-color-focus`                              |
| corner              | `--ui-radius`                                   |
| padding, caret room | `--ui-space`                                    |
| type                | `--ui-font`                                     |
| motion              | `--ui-duration-state`, `--ui-easing-state`      |

**The caret is two gradients, not a picture**, and that is what keeps its colour overridable: a
gradient takes `var()`, while an SVG embedded in a `data:` URI freezes whatever colour is drawn into
it. [`<ui-checkbox>`](checkbox.md) answers the same problem the other way, by making its mark a hole
— which is not available here, because a mask would clip the option text along with everything else.

**It follows the control's direction.** `padding-inline-end` is logical and flips on its own;
`background-position` has no logical form, so the caret is mirrored explicitly against
`:dir(rtl)` — the control's own direction, not the page's.

`::part()` is not exposed. There is nothing in the shadow root to aim it at — the control is yours,
so it is styleable directly.

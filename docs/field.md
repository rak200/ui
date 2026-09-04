# UiField

[← Reference](README.md)

Form plumbing: a label bound to a control, help and error text bound through `aria-describedby`, and
`aria-invalid` while the field is in error.

```js
import '@rak200/ui';
```

## Contents

- [`<ui-field>`](#ui-field)
- [Slots](#slots)
- [What it wires](#what-it-wires)
- [Errors](#errors)
- [Styling](#styling)

## `<ui-field>`

```html
<ui-field>
  <label slot="label">Amount</label>
  <input type="number" />
  <span slot="help">In BRL, two decimals.</span>
</ui-field>
```

Every form control in the v0 surface needs the same wiring. Written per control it is five chances
to get one subtly wrong; written here it is one.

The class is exported as `UiField` for a host that needs the type; importing the package registers
the element, so nothing has to be called.

## Slots

| Slot      | Holds                                                   |
| --------- | ------------------------------------------------------- |
| `label`   | a real `<label>` — the field sets its `for`             |
| _default_ | the control: the one child carrying no `slot` attribute |
| `help`    | text describing the expected value                      |
| `error`   | text describing what is wrong, when something is        |

**Everything is slotted, and that is forced rather than chosen.** An ARIA relationship by IDREF does
not cross a shadow boundary: a `<label for>` rendered inside this element's shadow root leaves
`control.labels` empty, and an `aria-describedby` pointing into it resolves to nothing. So the label,
the control, the help and the error all live in your tree, where the association is the browser's
job — and `<ui-field>` only generates the ids and points them at each other.

The control is found as the one child with no `slot` attribute, so any element works: a native
`<input>` or `<textarea>` today, a `<ui-input>` later.

**A wrapper carrying a `role` is the control**, and the search stops there rather than looking
through it. `<ui-radio-group>` is the first: what a field names there is the group, and reaching
the first radio inside would name one option and leave the set anonymous.

## What it wires

- **an `id` on the control**, generated when it has none. An `id` you supplied is never overwritten —
  something you can see and this element cannot may already reference it.
- **`for` on the label**, pointing at that id. Only when the slotted element really is a `<label>`; a
  `<span slot="label">` is left alone, because `for` on it would mean nothing.
- **`aria-labelledby` on the control instead**, when the control is not a **labelable** element —
  an `<input>`, a `<textarea>`, a `<select>`. A `<label for>` aimed anywhere else labels nothing,
  which axe reports at critical impact, so a [`<ui-radio-group>`](radio.md) is named by reference.
  Which elements are labelable is asked of the platform rather than listed: they are exactly the
  ones it gives a `labels` collection to. The name is dropped again if the label slot empties,
  rather than left dangling at an element that is gone.
- **`aria-describedby` on the control**, listing the error and the help.
- **`aria-invalid="true"` on the control** while the error says something, and removed when it does
  not.

- **a description it did not write is carried forward.** The list is rebuilt on every re-association,
  and anything in it that this field did not put there stays — [`<ui-tooltip>`](tooltip.md) is the
  first thing to add one, and the erasure it would otherwise cause happens on the _second_
  association rather than the first, which is the kind nobody sees.

Ids for the help and the error are generated the same way, and the same rule applies: yours survive.

Slots filled after the first render are picked up, and so is text rewritten in place — the shape a
framework produces when it patches an error message.

## Errors

```html
<ui-field>
  <label slot="label">Amount</label>
  <input type="number" />
  <span slot="help">In BRL, two decimals.</span>
  <span slot="error">Amount is required.</span>
</ui-field>
```

**The error supplements the help rather than replacing it,** and `aria-describedby` lists the error
first. A screen reader reads descriptions in order, so the user hears what is wrong before how the
value should look — and the help text is usually the format requirement, which is exactly the
suggestion needed to recover. Dropping it at the moment it becomes useful would be the opposite of
helping.

**An element rendered empty is not an error.** `<span slot="error"></span>` — the shape a template
produces for "nothing wrong yet" — leaves the control valid and undescribed. To raise an error, give
it text; to clear one, take the text away.

## Styling

The layout is exposed as a **part**:

```css
ui-field::part(stack) {
  gap: 1rem;
}
```

The help and error text read [tokens](tokens.md) — `--ui-color-text` and `--ui-color-danger` — so a
host restyles them without reaching inside. Colour is never the only cue: the error text says what is
wrong, and `aria-invalid` marks the control whatever the stylesheet does.

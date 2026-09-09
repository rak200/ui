# UiSelect, UiOption and UiOptgroup

[← Reference](README.md)

A drop-down over a native `<select>`, drawn from the token layer rather than replaced.

```js
import '@rak200/ui';
```

## Contents

- [`<ui-select>`](#ui-select)
- [`<ui-option>` and `<ui-optgroup>`](#ui-option-and-ui-optgroup)
- [Why the choices are not `<option>`](#why-the-choices-are-not-option)
- [The element is the control](#the-element-is-the-control)
- [In a form](#in-a-form)
- [In error](#in-error)
- [What the platform still refuses](#what-the-platform-still-refuses)
- [Styling](#styling)

## `<ui-select>`

```html
<ui-select label="Currency" name="currency">
  <ui-option value="brl" selected>Real</ui-option>
  <ui-option value="usd">Dollar</ui-option>
</ui-select>
```

The class is exported as `UiSelect` for a host that needs the type; importing the package registers
the element, so nothing has to be called.

| Attribute  | Type    | Default | Means                                                   |
| ---------- | ------- | ------- | ------------------------------------------------------- |
| `label`    | string  | `''`    | the accessible name, and the text above the control     |
| `help`     | string  | `''`    | supporting text under it, which an error does not hide  |
| `error`    | string  | `''`    | a message, which also makes the control invalid         |
| `name`     | string  | `''`    | what the choice is submitted under                      |
| `value`    | string  | `''`    | the choice in force; empty means _the declared default_ |
| `required` | boolean | `false` | the form is invalid while no choice is made             |
| `disabled` | boolean | `false` | refuses interaction, and submits nothing                |
| `multiple` | boolean | `false` | a list rather than a drop-down                          |

`form`, `validity` and `validationMessage` are read-only properties.

## `<ui-option>` and `<ui-optgroup>`

```html
<ui-select label="Currency" name="currency">
  <ui-optgroup label="Americas">
    <ui-option value="brl" selected>Real</ui-option>
    <ui-option value="usd">Dollar</ui-option>
  </ui-optgroup>
  <ui-optgroup label="Europe">
    <ui-option value="eur">Euro</ui-option>
  </ui-optgroup>
</ui-select>
```

**These draw nothing**, and they are the first elements here that do not. They are declarations: the
real `<option>` elements the platform needs are built from them.

| `<ui-option>` | Type    | Default | Means                                      |
| ------------- | ------- | ------- | ------------------------------------------ |
| _text_        |         |         | what the reader sees                       |
| `value`       | string  | `''`    | what a form submits for this choice        |
| `selected`    | boolean | `false` | the **default** — where the control starts |
| `disabled`    | boolean | `false` | whether this choice can be made at all     |

| `<ui-optgroup>` | Type    | Default | Means                                 |
| --------------- | ------- | ------- | ------------------------------------- |
| `label`         | string  | `''`    | the heading the platform draws        |
| `disabled`      | boolean | `false` | whether every choice in it is refused |

Exported as `UiOption` and `UiOptgroup`. Anything else you put inside a `<ui-select>` is ignored.

**Change them however you like.** Adding one, removing one and writing a property all reach the
control — including from inside a group:

```js
document.querySelector('ui-option[value=usd]').selected = true;
```

## Why the choices are not `<option>`

**Because it does not work**, and that is measured rather than argued. A `<slot>` inside a
`<select>` assigns the nodes and the select sees none of them:

```
assignedElements  2
options.length    0
value             ""
selectedIndex     -1
```

`HTMLSelectElement.options` is built from the select's own children, not from the flattened tree. So
the choices could not be slotted `<option>`s under any arrangement that puts the `<select>` in this
element's shadow root — and putting it anywhere else strands the label.

Mirroring host-written `<option>`s into the control was measured too, and it fails on the case that
matters most: `option.selected = true` is a property write, and no `MutationObserver` reports one, so
the control never moved. Declarations this package owns have reactive properties, so the change is
the platform's own rather than a watcher over somebody else's element.

## The element is the control

**You write the tag, its attributes and the choices.** The `<select>`, its `<label for>`, its help
text and its message are rendered together into this element's shadow root, so every IDREF resolves
in one tree scope — see [`<ui-input>`](input.md#the-element-is-the-control), which changed for the
same reason and records it.

**The native element is the decision, not a shortcut.** A custom listbox is an accessibility project
of its own, and it would have to reimplement the platform picker a phone already opens — which is
the part a consumer notices most and a library gets wrong most. What is rendered here is a real
`<select>` with real `<option>`s in it, so the keyboard, the typeahead, the picker and the semantics
are all still the platform's.

## In a form

- `name` is what the entry is called. A control with no `name` submits nothing, and neither does a
  disabled one.
- **`value` empty means _the declared default_, not _nothing_.** That is what lets
  `<ui-option selected>` mean what `<option selected>` means. With no choice marked, the control
  starts on the first — the platform's own rule.
- A form reset returns to that declared default.
- A `<fieldset disabled>` above the element disables it.

## In error

```html
<ui-select label="Currency" name="currency" error="Pick a currency.">
  <ui-option value="">Choose…</ui-option>
  <ui-option value="brl">Real</ui-option>
</ui-select>
```

One property renders the message, marks the control `aria-invalid`, points `aria-describedby` at it,
paints the boundary and reaches `setValidity` — the same shape [`<ui-input>`](input.md#in-error)
has, and the same warning applies: select on `:invalid`, never on `[error]`.

## What the platform still refuses

**The list a click opens is drawn by the operating system**, and no rule here reaches inside it. The
box, the caret and the states are this package's; the popup is not. That is the cost of delegating
to a native `<select>`, and it is the reason to.

`ROADMAP.md` carries what would reopen the question, and it is a platform feature arriving broadly
rather than a decision here.

## Styling

Every colour is a [token](tokens.md); nothing here is hardcoded, including the caret.

| Part               | Token                                                        |
| ------------------ | ------------------------------------------------------------ |
| surface            | `--ui-color-surface`                                         |
| text and the label | `--ui-color-text`, and `--ui-color-text-muted` when disabled |
| boundary           | `--ui-color-border`, and `--ui-color-text` on hover          |
| the caret          | `--ui-color-text-muted`                                      |
| in error           | `--ui-color-danger`, at `--ui-text-supporting`               |
| help text          | `--ui-color-text`, at `--ui-text-supporting`                 |
| focus ring         | `--ui-color-focus`                                           |
| corner             | `--ui-radius`                                                |
| padding and rhythm | `--ui-space`                                                 |
| motion             | `--ui-duration-state`, `--ui-easing-state`                   |

The same five parts [`<ui-input>`](input.md#styling) exposes — `stack`, `label`, `control`, `help`
and `error` — aimed at a `<select>` rather than an `<input>`.

**The caret is two gradients, not a picture**, and that is what keeps its colour overridable: a
gradient takes `var()`, while an SVG in a `data:` URI freezes whatever colour is drawn into it.
[`<ui-checkbox>`](checkbox.md) answers the same problem the other way, by making its mark a hole —
which is not available here, because a mask would clip the option text with it.

**It follows the control's direction.** `padding-inline-end` is logical and flips on its own;
`background-position` has no logical form, so the caret is mirrored explicitly against `:dir(rtl)`.

**It is not drawn on a `multiple` control**, where the list has nothing to open and a chevron would
be a promise of something that is not there.

**The box is written out rather than shared with [`<ui-input>`](input.md)**, and the duplication is
answered on its own terms rather than dodged: `tests/select.test.ts` mounts both and asserts they
agree on the boundary, the corner, the padding, the type and the frame around them. Something
compares them, and it fails when they drift.

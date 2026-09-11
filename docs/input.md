# UiInput and UiTextarea

[← Reference](README.md)

Text controls, drawn from the token layer rather than replaced.

```js
import '@rak200/ui';
```

## Contents

- [`<ui-input>`](#ui-input)
- [`<ui-textarea>`](#ui-textarea)
- [The element is the control](#the-element-is-the-control)
- [In a form](#in-a-form)
- [Validation](#validation)
- [In error](#in-error)
- [Events](#events)
- [Selecting on state](#selecting-on-state)
- [Styling](#styling)

## `<ui-input>`

```html
<ui-input label="Amount" help="In BRL, two decimals." type="number" name="amount"></ui-input>
```

A text field. It renders the control, its label, its help text and — when there is one — its
message, and it is the thing the form talks to.

The class is exported as `UiInput` for a host that needs the type; importing the package registers
the element, so nothing has to be called.

| Attribute      | Type    | Default  | Means                                                  |
| -------------- | ------- | -------- | ------------------------------------------------------ |
| `label`        | string  | `''`     | the accessible name, and the text above the control    |
| `help`         | string  | `''`     | supporting text under it, which an error does not hide |
| `error`        | string  | `''`     | a message, which also makes the control invalid        |
| `name`         | string  | `''`     | what the value is submitted under                      |
| `value`        | string  | `''`     | the **default** — see [In a form](#in-a-form)          |
| `type`         | string  | `'text'` | which control the platform draws, and how it validates |
| `placeholder`  | string  | `''`     | the hint inside an empty control                       |
| `autocomplete` | string  | `''`     | what the browser may fill it with                      |
| `inputmode`    | string  | `''`     | which keyboard a touch device offers                   |
| `pattern`      | string  | `''`     | the expression the value must match                    |
| `minlength`    | string  | `''`     | the shortest accepted value                            |
| `maxlength`    | string  | `''`     | the longest accepted value                             |
| `min`          | string  | `''`     | the lowest accepted value                              |
| `max`          | string  | `''`     | the highest accepted value                             |
| `step`         | string  | `''`     | the granularity the value must fall on                 |
| `required`     | boolean | `false`  | the form is invalid while the control is empty         |
| `disabled`     | boolean | `false`  | refuses interaction, and submits nothing               |
| `readonly`     | boolean | `false`  | shows a value it will not let you change               |

**An attribute you leave empty is not written at all**, and that is deliberate rather than
incidental: an empty attribute is not a neutral one. `pattern=""` is the empty expression and
matches only the empty string, so a control carrying it would be invalid for every value a person
can type.

`form`, `validity` and `validationMessage` are read-only properties, and they answer for the
element rather than for anything inside it.

## `<ui-textarea>`

```html
<ui-textarea label="Notes" name="notes" rows="4"></ui-textarea>
```

The same box around a control that grows. It takes every attribute above except the ones a
`<textarea>` has no use for — `type`, `inputmode`, `pattern`, `min`, `max` and `step` — and adds
`rows`.

Two rules differ, and only two: a height to start at, and resizing left on the vertical axis. A
control that cannot grow is one people fight, and one that grows sideways breaks the layout around
it.

Exported as `UiTextarea`.

## The element is the control

**You write the tag and its attributes. There is no `<input>` to supply and nothing to wrap it
in.** The control, its `<label for>`, its help text and its message are rendered together into
this element's shadow root, so every IDREF resolves in one tree scope.

> **This changed.** These elements used to take a control you wrote, in the light DOM, because an
> ARIA relationship by IDREF does not cross a shadow boundary. That is still true — and it was
> never the whole rule. What a relationship needs is for **every end of it to share a tree scope**,
> which a `<label for>` and its control in one shadow root satisfy. RFC 0005 measured that in
> Blink, Gecko and WebKit and moved the label, the help and the message inside with the control.

**The element is what the form sees**, through `ElementInternals`: an `<input>` in a shadow root has
no form owner, so the value reaches a submit because this element passes it on.

## In a form

```html
<form>
  <ui-input label="Amount" name="amount" value="100"></ui-input>
</form>
```

- `name` is what the entry is called. A control with no `name` submits nothing, and neither does a
  disabled one.
- **`value` is the default, not the live state.** It is the attribute a reset returns to, which is
  exactly what `value` does on a native `<input>`: the property tracks what was typed, the attribute
  does not follow it. Read `element.value` for the state.
- A `<fieldset disabled>` above the element disables it.
- The browser restores what was typed on a back-navigation.

## Validation

**Nothing here is reimplemented.** The rendered control is a real `<input>`, so it computes its own
validity — `type="email"`, `pattern`, `min`, `max`, `step`, `required`, `minlength` and whatever the
platform adds next — and this element hands the whole `ValidityState` over, with the message the
engine wrote:

```js
const field = document.querySelector('ui-input');

field.validity.typeMismatch; // true
field.validationMessage; // "Please include an '@' in the email address…"
```

`form.checkValidity()` and `form.reportValidity()` both work, and the second focuses the control —
focus is delegated, so it lands inside.

## In error

```html
<ui-input label="Amount" name="amount" required error="Amount is required."></ui-input>
```

**One property, and it says everything once.** `error` renders the message under the control, marks
the control `aria-invalid`, points `aria-describedby` at the message, paints the boundary from
`--ui-color-danger`, and hands the same string to `setValidity` — so a form cannot be submitted past
a message the reader can see. Clear it by setting `error` to the empty string.

A message you write wins over the one the platform would have written.

**The help text stays.** It is usually the format requirement, which is exactly the suggestion a
reader needs in order to recover (WCAG 3.3.3) — so the message is announced _before_ it rather than
instead of it.

## Events

`change` and `input` both reach a listener on the tag, with `event.target` being the element.

`change` is **re-dispatched**: the platform marks it non-composed, so the one the inner control
fires stops at the shadow boundary. `input` is composed and arrives on its own, retargeted.

## Selecting on state

```css
ui-input:invalid {
  --ui-color-border: red;
}
ui-input[readonly] {
  opacity: 0.8;
}
```

`:valid`, `:invalid` and `:disabled` match on the element, because a form-associated custom element
takes part in them. `required`, `readonly` and `disabled` reflect, so their attributes reach it too.

**Do not select on `[error]`.** It reflects, and a reflected string whose default is empty is
written as `error=""` — which a presence selector matches on every element, error or not.
`:invalid` is what you want.

## Styling

Every colour is a [token](tokens.md); nothing here is hardcoded.

| Part               | Token                                                        |
| ------------------ | ------------------------------------------------------------ |
| surface            | `--ui-color-surface`                                         |
| text and the label | `--ui-color-text`, and `--ui-color-text-muted` when disabled |
| placeholder        | `--ui-color-text-muted`, at full opacity                     |
| boundary           | `--ui-color-border`, and `--ui-color-text` on hover          |
| in error           | `--ui-color-danger`, at `--ui-text-supporting`               |
| help text          | `--ui-color-text`, at `--ui-text-supporting`                 |
| focus ring         | `--ui-color-focus`                                           |
| corner             | `--ui-radius`                                                |
| padding and rhythm | `--ui-space`                                                 |
| motion             | `--ui-duration-state`, `--ui-easing-state`                   |

**Four parts are exposed**, because the drawing is now in here:

| `::part()` | Is                                     |
| ---------- | -------------------------------------- |
| `stack`    | the column holding all of it           |
| `label`    | the `<label>` above the control        |
| `control`  | the `<input>` or `<textarea>` itself   |
| `help`     | the supporting text, when there is one |
| `error`    | the message, when there is one         |

The hover rules are guarded against `:disabled` **and** `[readonly]`, measured rather than assumed:
a disabled control still matches `:hover`, and a readonly one accepts a pointer it will do nothing
with.

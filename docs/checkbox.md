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
- [The element is the control](#the-element-is-the-control)
- [Naming it](#naming-it)
- [In a form](#in-a-form)
- [In error](#in-error)
- [The mixed state](#the-mixed-state)
- [Events](#events)
- [Interaction states](#interaction-states)
- [Styling](#styling)

## `<ui-checkbox>`

```html
<ui-checkbox label="Send a receipt" name="receipt"></ui-checkbox>
```

A checkbox. It renders the control, its label and — when there is one — its error message, and it
is the thing the form talks to.

The class is exported as `UiCheckbox` for a host that needs the type; importing the package
registers the element, so nothing has to be called.

| Attribute       | Type    | Default | Means                                               |
| --------------- | ------- | ------- | --------------------------------------------------- |
| `label`         | string  | `''`    | the accessible name, and the text beside the box    |
| `name`          | string  | `''`    | what the value is submitted under                   |
| `value`         | string  | `'on'`  | what a ticked box submits                           |
| `checked`       | boolean | `false` | the **default** state — see [In a form](#in-a-form) |
| `indeterminate` | boolean | `false` | the mixed state, `<ui-checkbox>` only               |
| `disabled`      | boolean | `false` | refuses interaction, and submits nothing            |
| `required`      | boolean | `false` | the form is invalid while the box is off            |
| `error`         | string  | `''`    | a message, which also makes the control invalid     |

`form`, `validity` and `validationMessage` are read-only properties, and they answer for the
element rather than for anything inside it.

## `<ui-switch>`

```html
<ui-switch label="Email notifications" name="notify" checked></ui-switch>
```

The same control, drawn as a track and a thumb and announced as a switch. **`role="switch"` is set
by the element**, on the control it renders, so a switch cannot ship looking like one and
announcing as a checkbox because an attribute was forgotten.

There is no native switch to delegate to: `<input type="checkbox" switch>` is unsupported in the
engine this package's suite measures, so a switch is drawn rather than adopted. It takes every
attribute above except `indeterminate` — `role="switch"` has no third value.

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

## The element is the control

**You write the tag and its attributes. There is no `<input>` to supply and no `<ui-field>` to wrap
it in.** The `<input type="checkbox">` and the `<label>` around it are rendered together into this
element's shadow root, which is what makes every behaviour below the platform's rather than this
package's: the toggle, <kbd>Space</kbd>, the click target over the label text, and the rule that a
link inside a label follows the link instead of toggling.

> **This changed.** These elements used to take a control you wrote, in the light DOM, because an
> ARIA relationship by IDREF does not cross a shadow boundary. That is still true — and it was
> never the whole rule. What a relationship needs is for **every end of it to share a tree scope**,
> and a `<label>` that _contains_ its control needs no IDREF at all. RFC 0005 measured that in
> Blink, Gecko and WebKit and moved both ends inside together.

**The element is what the form sees**, through `ElementInternals`: an `<input>` in a shadow root
has no form owner, so the value reaches a submit because this element passes it on.

## Naming it

`label` is the short road, and it is the accessible name:

```html
<ui-checkbox label="Send a receipt" name="receipt"></ui-checkbox>
```

For a name an attribute cannot hold, fill the `label` slot instead:

```html
<ui-checkbox name="terms">
  <span slot="label">I accept the <a href="/terms">terms of service</a></span>
</ui-checkbox>
```

The slot wins where both are given. The markup stays in your own tree — only the `<label>` around
it is in the shadow root — so a link inside it is a link: clicking it follows the link rather than
toggling the box, which is the platform's own rule rather than one written here.

**Give it one or the other.** A control with neither has no accessible name.

## In a form

```html
<form>
  <ui-checkbox label="Send a receipt" name="receipt" checked></ui-checkbox>
</form>
```

- `name` is what the entry is called, and `value` — `'on'` by default — is what a ticked box
  submits. An unticked one submits nothing, and neither does a disabled one.
- **`checked` is the default, not the live state.** It is the attribute a reset returns to, which
  is exactly what `checked` does on a native `<input>`: the property tracks what the user did, the
  attribute does not follow it. Read `element.checked` for the state; use `::part(box):checked` to
  style on it.
- A `<fieldset disabled>` above the element disables it.
- The browser restores the state on a back-navigation.

Constraint validation is the element's, because a control in a shadow root is not a submittable
one. `required` makes the form invalid while the box is off, `element.validity` and
`element.validationMessage` answer for it, and `form.reportValidity()` focuses it — focus is
delegated, so it lands on the control.

## In error

```html
<ui-checkbox
  label="I accept the terms"
  name="terms"
  required
  error="The terms have to be accepted."
>
</ui-checkbox>
```

**One property, and it says everything once.** `error` renders the message under the control, marks
the control `aria-invalid`, points `aria-describedby` at the message, paints the boundary from
`--ui-color-danger`, and hands the same string to `setValidity` — so the form cannot be submitted
past a message the reader can see, and nothing the reader sees can disagree with what the form
thinks. Clear it by setting `error` to the empty string.

A custom message wins over the one `required` writes for itself.

## The mixed state

```html
<ui-checkbox label="Select all" indeterminate></ui-checkbox>
```

A checkbox drawn by this package **draws the mixed state**, and that is not a tri-state feature
being offered. `appearance: none` takes the platform's own dash away along with the rest of the
drawing, so a control set `indeterminate` would otherwise render as plainly _unchecked_ — a wrong
answer rather than a missing one. The dash exists to stop that.

It takes an attribute where the platform offers only a property, which is this element having
become the control. A toggle answers the question the mixed state was asking, so the first click
clears it.

`<ui-switch>` has no mixed state at all, because `role="switch"` has no third value.

## Events

`change` and `input` both reach a listener on the tag, with `event.target` being the element.

`change` is **re-dispatched**, and that is worth knowing rather than assuming: the platform marks
it non-composed, so the one the inner control fires stops at the shadow boundary. `input` is
composed and arrives on its own, retargeted.

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
would disappear for the people who turned the mode on to see states more clearly. The checked and
mixed states name `Highlight`, and the disabled one names `GrayText` instead of dimming, because
opacity is not a colour and is not forced.

## Styling

Every colour is a [token](tokens.md); nothing here is hardcoded, including the tick.

| Part                                      | Token                                                        |
| ----------------------------------------- | ------------------------------------------------------------ |
| size                                      | `--ui-space` × 3, floored at 24px                            |
| resting fill                              | `--ui-color-surface`                                         |
| boundary, and the switch's track when off | `--ui-color-border`                                          |
| checked fill                              | `--ui-color-accent`, and `--ui-color-accent-hover` on hover  |
| unchecked boundary on hover               | `--ui-color-text`                                            |
| the switch's thumb                        | `--ui-color-surface`                                         |
| label text                                | `--ui-color-text`, and `--ui-color-text-muted` when disabled |
| in error                                  | `--ui-color-danger`, at `--ui-text-supporting`               |
| focus ring                                | `--ui-color-focus`                                           |
| corner                                    | `--ui-radius` (the switch is always a pill)                  |
| motion                                    | `--ui-duration-state`, `--ui-easing-state`                   |

**Four parts are exposed**, because the drawing is now in here:

| `::part()` | Is                                               |
| ---------- | ------------------------------------------------ |
| `label`    | the `<label>`, which wraps the whole pair        |
| `box`      | the `<input>` — `::part(box):checked` also works |
| `text`     | the span holding the label text                  |
| `error`    | the message, when there is one                   |

**The tick is a hole, not a colour**, and that is what keeps it overridable. An SVG embedded in a
`data:` URI freezes whatever colour is drawn into it, and no host could override that. A mask has no
colour — only its alpha is read — so the tick is punched out of the accent fill with
`mask-composite: exclude`, and what shows through it is whatever the control sits on.

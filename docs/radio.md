# UiRadioGroup and UiRadio

[← Reference](README.md)

One choice out of a set, drawn from the token layer and behaving because the platform does.

```js
import '@rak200/ui';
```

## Contents

- [`<ui-radio-group>`](#ui-radio-group)
- [`<ui-radio>`](#ui-radio)
- [The behaviour is the platform's](#the-behaviour-is-the-platforms)
- [Why the choices are not `<input type="radio">`](#why-the-choices-are-not-input-typeradio)
- [In a form](#in-a-form)
- [Orientation](#orientation)
- [Errors](#errors)
- [Interaction states](#interaction-states)
- [Styling](#styling)

## `<ui-radio-group>`

```html
<ui-radio-group label="Plan" name="plan" help="You can change it at any time.">
  <ui-radio value="free" checked>Free</ui-radio>
  <ui-radio value="pro">Pro</ui-radio>
</ui-radio-group>
```

The set, laid out and named as one thing. It renders the controls, the label beside each one, its
own name, help and message, and it joins the form in their place.

| Attribute     | Meaning                                                 |
| ------------- | ------------------------------------------------------- |
| `label`       | the accessible name of the set, and the text above it   |
| `name`        | what the chosen value is submitted under                |
| `value`       | the choice in force; empty means _the declared default_ |
| `help`        | supporting text, which an error does not replace        |
| `error`       | the message, which also paints the boundaries           |
| `orientation` | `vertical` (the default) or `horizontal`                |
| `required`    | invalid while no choice is made                         |
| `disabled`    | the whole set refuses interaction, and submits nothing  |

`form`, `validity` and `validationMessage` are readable properties, and `change` is dispatched from
the element when a choice is made. Exported as `UiRadioGroup`; importing the package registers the
element, so nothing has to be called.

## `<ui-radio>`

One choice: a `value`, whether it is `checked` by default, whether it is `disabled`, and the text
beside it.

**It draws nothing.** The group renders the real `<input type="radio">` and the `<label>` around
it. Exported as `UiRadio`.

## The behaviour is the platform's

**Nothing here installs a roving tabindex, and no state machine was added.** Neither was needed —
native radios sharing a `name` already are the APG **Radio Group** pattern:

| What the pattern asks                   | Who does it                    |
| --------------------------------------- | ------------------------------ |
| one tab stop for the whole set          | native radios sharing a `name` |
| arrow keys move focus **and** selection | the same                       |
| the set wraps at either end             | the same                       |
| entering focuses the selected option    | the same                       |
| left and right swap under `dir="rtl"`   | the same                       |

**And it holds inside a shadow root**, which is not obvious and is measured rather than assumed. A
radio group is the radios sharing a `name` within one form owner — and where there is no form
owner, within one **tree**. The controls here have no form owner, so the group is scoped by the
shadow root the component renders into.

Two consequences worth having: the internal `name` never collides, because two elements are two
trees rather than two sets sharing one form; and none of the behaviour above had to be written.

## Why the choices are not `<input type="radio">`

You used to write the controls. Now you declare the choices, and the reason is structural rather
than stylistic: the `role="radiogroup"`, the name pointing at it and the controls it contains have
to share **one tree scope**, or the reference resolves to nothing. Rendering them together is what
makes that true, and a control the host wrote cannot be rendered by the component.

That is the same rule [`<ui-select>`](select.md) met from the other side, and
[ARCHITECTURE.md](../ARCHITECTURE.md) states it in full.

## In a form

The element joins the form itself, so the controls do not have to:

```html
<form>
  <ui-radio-group label="Plan" name="plan" required>
    <ui-radio value="free">Free</ui-radio>
    <ui-radio value="pro">Pro</ui-radio>
  </ui-radio-group>
</form>
```

One entry is submitted for the set, under the group's `name`. `required` is validated on the group
— the platform computes it, and the message is the engine's own. A reset returns to the choice the
declarations name, and a `<fieldset disabled>` above the element reaches it.

**`value` is the state, not the default.** It is not reflected, the way a native control's
`checked` IDL attribute is not: the declared `<ui-radio checked>` is what a reset returns to, so an
empty `value` means _whatever the declarations say_ rather than _nothing chosen_.

[`<ui-field>`](field.md) is not needed here and has nothing to add: the group carries its own name,
help, message and `aria-invalid`.

## Orientation

```html
<ui-radio-group label="Plan" orientation="horizontal">…</ui-radio-group>
```

`vertical` (the default) or `horizontal`, typed as `RadioOrientation`. The attribute lays the
options out **and** sets `aria-orientation`, so the drawn shape and the announced one cannot
disagree — which is why it exists at all rather than leaving the layout to a `flex-direction` rule
in your own stylesheet. Arrow keys work either way; that part is the platform's and was never
oriented.

## Errors

```html
<ui-radio-group label="Plan" name="plan" error="Pick a plan to continue.">…</ui-radio-group>
```

**The error belongs to the set, not to an option** — what a radio group gets wrong is the choice.
The group marks itself `aria-invalid`, announces the message with the set, and turns every option's
boundary to `--ui-color-danger`. There is one source, and it is the one a screen reader is already
using.

## Interaction states

Unselected, the boundary finishes the mix it started, the way [`<ui-input>`](input.md)'s does.
Selected, the boundary is not what the eye is on, so the fill moves instead, the way
[`<ui-button>`](button.md)'s does. Both are guarded against `:disabled`, which still matches
`:hover`.

The focus ring is `:focus-visible`, never transitioned, and never removed — on a radio group it is
the only thing that says which option an arrow key just moved to.

**The control is drawn at 24×24 at least.** WCAG 2.2's _2.5.8 Target Size (Minimum)_ asks that of a
target the author sized, and a native radio — 13×13 in this engine — escapes it only through that
criterion's _user agent control_ exception, which drawing our own gives up.

**Forced colors is handled rather than inherited**, exactly as it is for
[`<ui-checkbox>`](checkbox.md): the selected state names `Highlight`, and the disabled one names
`GrayText` instead of dimming, because opacity is not a colour and is not forced.

## Styling

Every colour is a [token](tokens.md); nothing here is hardcoded, including the mark.

| Part                         | Token                                                       |
| ---------------------------- | ----------------------------------------------------------- |
| size                         | `--ui-space` × 3, floored at 24px                           |
| space between options        | `--ui-space` ÷ 2, and `--ui-space` × 2 across a row         |
| resting fill                 | `--ui-color-surface`                                        |
| boundary                     | `--ui-color-border`                                         |
| selected fill                | `--ui-color-accent`, and `--ui-color-accent-hover` on hover |
| unselected boundary on hover | `--ui-color-text`                                           |
| in error                     | `--ui-color-danger`                                         |
| focus ring                   | `--ui-color-focus`                                          |
| supporting text              | `--ui-text-supporting`, `--ui-color-text`                   |
| motion                       | `--ui-duration-state`, `--ui-easing-state`                  |

The exposed parts are `stack`, `label`, `options`, `option`, `control`, `option-label`, `help` and
`error`.

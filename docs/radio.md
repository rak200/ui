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
- [The controls are yours](#the-controls-are-yours)
- [Inside a field](#inside-a-field)
- [Orientation](#orientation)
- [Errors](#errors)
- [Interaction states](#interaction-states)
- [Styling](#styling)

## `<ui-radio-group>`

```html
<ui-radio-group>
  <label>
    <ui-radio><input type="radio" name="plan" value="free" /></ui-radio>
    Free
  </label>
  <label>
    <ui-radio><input type="radio" name="plan" value="pro" /></ui-radio>
    Pro
  </label>
</ui-radio-group>
```

The set, laid out and named as one thing. It stacks the options, marks itself
`role="radiogroup"` so a screen reader hears a set rather than three loose controls, and carries
the group's name, description and error state.

The class is exported as `UiRadioGroup` for a host that needs the type; importing the package
registers the element, so nothing has to be called.

## `<ui-radio>`

A box around one radio you wrote. It carries the appearance — the size, the boundary, the circle,
the fill, the mark, the focus ring and the interaction states — and nothing else. No `name`, no
value, no state: those are on the `<input>` inside it.

Exported as `UiRadio`.

## The behaviour is the platform's

**Nothing here installs a roving tabindex, and no state machine was added.** Issue #15 asked which
of the two it would be, because the APG **Radio Group** pattern is the first behaviour in the v0
surface that could have justified [Zag](https://zagjs.com). Neither was needed:

| What the pattern asks                   | Who does it                    |
| --------------------------------------- | ------------------------------ |
| one tab stop for the whole set          | native radios sharing a `name` |
| arrow keys move focus **and** selection | the same                       |
| the set wraps at either end             | the same                       |
| entering focuses the selected option    | the same                       |
| one value submitted for the set         | the same                       |

Wrapping each control in `<ui-radio>` changes none of it — a radio group is defined by `name` and
the tree the controls sit in, and they never left it. This package's suite measures that rather
than trusting it, wrappers and all.

That is the test [ARCHITECTURE.md](../ARCHITECTURE.md) states, applied: **Zag arrives where the
platform has no element for the pattern**, not merely where the pattern has state. `<ui-menu>` is
where that question is still open.

**All of it is the radios', not the group's.** A `<ui-radio-group>` around controls with different
`name` attributes is a stack with a role on it and nothing else — the platform has no set to
manage, so neither does this element.

## The controls are yours

**You write each `<input type="radio">`, and they stay in the light DOM.** The same decision
[`<ui-checkbox>`](checkbox.md) and [`<ui-input>`](input.md) are made of, and forced by the same
constraint: an ARIA relationship by IDREF does not cross a shadow boundary.

Each option is named by the `<label>` around it — implicit association, so there is no `id` to
write and no `for` to forget:

```html
<label>
  <ui-radio><input type="radio" name="plan" value="free" /></ui-radio>
  Free
</label>
```

## Inside a field

[`<ui-field>`](field.md) wires the group's label, help, error and `aria-invalid`:

```html
<ui-field>
  <label slot="label">Plan</label>
  <ui-radio-group>
    <label
      ><ui-radio><input type="radio" name="plan" value="free" /></ui-radio> Free</label
    >
    <label
      ><ui-radio><input type="radio" name="plan" value="pro" /></ui-radio> Pro</label
    >
  </ui-radio-group>
  <span slot="help">You can change this later.</span>
</ui-field>
```

**The name lands on the group, and it arrives as `aria-labelledby` rather than as `for`.** A
`<label for>` reaches only a labelable element — an `<input>`, a `<textarea>`, a `<select>` — and
aimed at anything else it labels nothing, which axe reports at critical impact. Aimed at the first
radio it would be worse than nothing: it would name one option and leave the set anonymous.

So the field stops at any wrapper carrying a `role`, treats it as the control, and names it by
reference. The same applies to `aria-describedby` and `aria-invalid`, which land on the group
because the group is the thing being described and the thing that can be wrong.

Without a field, name the group yourself:

```html
<p id="delivery">Delivery</p>
<ui-radio-group aria-labelledby="delivery">…</ui-radio-group>
```

## Orientation

```html
<ui-radio-group orientation="horizontal">…</ui-radio-group>
```

`vertical` (the default) or `horizontal`, typed as `RadioOrientation`. The attribute lays the
options out **and** sets `aria-orientation`, so the drawn shape and the announced one cannot
disagree — which is why it exists at all rather than leaving the layout to a `flex-direction` rule
in your own stylesheet. Arrow keys work either way; that part is the platform's and was never
oriented.

## Errors

```html
<ui-field>
  <label slot="label">Plan</label>
  <ui-radio-group>…</ui-radio-group>
  <span slot="error">Pick a plan to continue.</span>
</ui-field>
```

**The error belongs to the set, not to an option** — what a radio group gets wrong is the choice.
The field marks the group `aria-invalid`, and the group turns every option's boundary to
`--ui-color-danger`. Nothing is written twice: there is one source, and it is the one a screen
reader is already using.

It reaches the options by **retargeting the boundary token over its own subtree**, not by naming
them. A custom property inherits through a shadow boundary and a selector does not, so this is the
only thing that reaches a control two elements down: `::slotted()` stops at the group's own
children, `:host-context()` is not supported everywhere, and `:host(:has(…))` is invalid in this
engine. A host who retunes `--ui-color-danger` retunes this with it.

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
| motion                       | `--ui-duration-state`, `--ui-easing-state`                  |

**The shape is the one measurement that is not a token.** The circle is what tells a radio from a
checkbox before either is read, so it does not follow `--ui-radius` — a square radio would be a
checkbox that behaves differently.

**The mark is a hole, not a colour**, the same decision the [checkbox's tick](checkbox.md#styling)
carries, reached here without a picture at all: a circle is a gradient with a size. It is punched
out of the accent fill with `mask-composite: exclude`, so what shows through is whatever the
control sits on and no colour is frozen anywhere a host could not override it.

`::part()` is not exposed. There is nothing in either shadow root to aim it at — the controls and
the labels are yours, so they are styleable directly.

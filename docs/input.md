# UiInput and UiTextarea

[← Reference](README.md)

Text controls, drawn from the token layer rather than replaced.

```js
import '@rak200/ui';
```

## Contents

- [`<ui-input>`](#ui-input)
- [`<ui-textarea>`](#ui-textarea)
- [A prefix and a suffix](#a-prefix-and-a-suffix)
- [A clear button, the password shown, and a count](#a-clear-button-the-password-shown-and-a-count)
- [A button of the page's at the end](#a-button-of-the-pages-at-the-end)
- [The element is the control](#the-element-is-the-control)
- [In a form](#in-a-form)
- [Validation](#validation)
- [In error](#in-error)
- [Supplementary text](#supplementary-text)
- [Events](#events)
- [Selecting on state](#selecting-on-state)
- [Motion](#motion)
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
| `prefix-text`  | string  | `''`     | text drawn before the value, inside the box            |
| `suffix-text`  | string  | `''`     | text drawn after the value, inside the box             |
| `clear-label`  | string  | `''`     | names a button that empties the control                |
| `reveal-label` | string  | `''`     | names a button that shows a password's text            |
| `count-text`   | string  | `''`     | a sentence counting what the control holds             |
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

**It grows with its text**, from the height its `rows` ask for to a greatest one you set on its
control, past which it scrolls:

```html
<style>
  .notes::part(control) {
    max-block-size: 12lh;
  }
</style>
<ui-textarea class="notes" label="Notes" name="notes" rows="4"></ui-textarea>
```

`lh` is the height of one of the control's own lines, so `12lh` caps it at twelve of them, its
padding inside. It is never drawn shorter than a least height in the space token, rows or none, and
it grows by `field-sizing`: an engine without it, Firefox before 152, keeps the box at its rows and
scrolls, as it always has.

**Resizing is left on the vertical axis.** A control that grows sideways breaks the layout around
it.

Exported as `UiTextarea`.

## A prefix and a suffix

```html
<ui-input label="Price" name="price" prefix-text="R$" suffix-text="per month"></ui-input>
```

**Text comes as an attribute**, `prefix-text` or `suffix-text`, and is drawn inside the box before
or after the value, at the start and the end of its own direction. It is heard with the control, as
part of its description, after an error and before the help: `R$` is the unit the value is read in.
Not `prefix`, which is a property every element already has, its namespace prefix, read-only, so a
framework that sets properties would write to it and fail.

**A glyph comes in a slot of the same name**, hidden from the tree, where a text would be heard:

```html
<ui-input label="Search" name="q">
  <ui-icon slot="prefix" name="search"></ui-icon>
</ui-input>
```

**Either side is laid over the control's padding**, which widens to hold it, so the box, its
boundary and every effect on it stay the control's own, and a click on either side reaches the
control. The text is drawn in `--ui-color-text-muted`, as a placeholder is, and takes the halo the
control's text takes while a light passes under it.

## A clear button, the password shown, and a count

```html
<ui-input label="Search" name="q" type="search" clear-label="Clear"></ui-input>
<ui-input label="Password" name="password" type="password" reveal-label="Show password"></ui-input>
<ui-input
  label="Headline"
  name="headline"
  maxlength="60"
  count-text="{remaining} characters left"
></ui-input>
```

Each is drawn only where its attribute is written, and the attribute is the words a reader hears,
so a page in another language writes its own.

**`clear-label` names a button at the control's end that empties it.** It is there while the control
holds a value the reader can change, and keeps its place while there is nothing to clear, so the
value does not move as the first character arrives. Pressed, it empties the control, says so with
`input` and `change` as the platform's own clear does, and hands the focus back to the control. On
a `search`, the clear button Chromium and WebKit draw of their own gives way to it.

**`reveal-label` names a button at the end of a password's control** that shows its text while it
is pressed, which `aria-pressed` says, and hides it again. The element's own `type` stays
`password`, so a form and a password manager read it as one. A control of another type draws none.

**`count-text` is a sentence counting what the control holds**, drawn under the box and describing
the control, after a prefix and a suffix and before the help: `{count}` is where the number of its
characters goes, and `{remaining}` where the number its `maxlength` still allows. The count drawn
changes at each key; what a screen reader hears is said a second after the reader stops typing, as
GOV.UK's character count says its own, so a reader typing is not interrupted at each letter.

The buttons are drawn as the toast's dismiss button is, in the muted text, with a hover, a ring and
a 24px target, and the box's padding widens to hold them.

## A button of the page's at the end

```html
<form role="search">
  <ui-input label="Search the docs" name="q" type="search" clear-label="Clear">
    <ui-button slot="action" type="submit" variant="secondary" data-ui-density="compact"
      >Search</ui-button
    >
  </ui-input>
</form>
```

**A button of the page's goes in the `action` slot**, drawn at the box's end after the clear button
and the password's, and reached by Tab after the control and them. It is the page's own element,
named by its own text or label, which the element neither writes nor reads, and it does whatever
the page has it do. As the form's first submit button, it is the one <kbd>Enter</kbd> in the
control presses.

**The box gives it a place, the pointer and a colour**: it is laid over the control's padding,
which widens to hold it, so the value never runs under it; it takes the pointer, which the rest of
the side passes through to the control; and anything in it that inherits a colour takes the text's,
`--ui-color-text`, rather than the accent the box is drawn in for a theme's glow, which turns to the
danger on an invalid control.

**A disabled control leaves it as the page left it.** The element dims what it draws, and a button
it dimmed while it could still be pressed would say the wrong thing, so disabling it with the field
is the page's to write. A `<fieldset disabled>` round both disables both, as it does every control
in it.

**Written compact, a `<ui-button>` is drawn inside the box with room round it**:
`data-ui-density="compact"` on the button takes its space and its text a step down. At the page's
density it is as tall as the box, and fills it.

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
- A `<fieldset disabled>` above the element disables it, and enabling the fieldset enables it
  again. It leaves the `disabled` attribute as you wrote it, as it does on an `<input>`.
- **The browser restores what was typed** on a back-navigation, and Firefox on a reload too. The
  element saves a state of its own for it and takes back only that: Firefox hands a field the
  state another element saved where the two joined the form out of tree order (#380), and the
  field refuses it, staying as the markup declares. Every field here shares the two internal
  helpers in `src/state.ts`: `kept()` writes a state, marked with the field's tag and `name`, and
  `restored()` reads one back where the mark is the field's own.
- **<kbd>Enter</kbd> submits the form**, as in a native `<input>`: by a click on the form's
  default button where it has one, which a disabled one stops, and otherwise by submitting a form
  whose only text field this is. The control in the shadow root has no form owner for the platform
  to start from, so the element hands the key on, a task after it: a listener that cancels the
  `keydown` or the `keypress` stops it. Not from `type="color"` or `type="file"`, which open a
  picker instead, and not from a `<ui-textarea>`, where the key starts a line.

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

## Supplementary text

**Write it in a tip rather than in `help`.** Wrap the field in a [`<ui-tooltip>`](tooltip.md) and
the sentence lives in one place:

```html
<ui-tooltip>
  <ui-input label="Amount" name="amount"></ui-input>
  <span slot="tip">Two decimals, and a comma between them.</span>
</ui-tooltip>
```

The tooltip cannot point at the control in this element's shadow root — an IDREF resolves in one
tree scope — so it **hands the text over** and the element renders it into its own root, where the
control it draws can be described by it. There is no attribute or property to write; the sentence
lives in the tip, and editing the tip changes what is announced. It works the same on
`<ui-textarea>`.

**Why the tip rather than `help`.** A line under every control is a layout decision this library
would be making for you: it is there whether or not it is wanted, it pushes the fields apart, and
only some of these elements have one at all. The tip is the same sentence read when it is asked
for, and every element here accepts it.

**`help` is not deprecated, and here is what it is for.** A popover covers the field above it, so
two instructions that have to be read _together_ — or one read beside a neighbour's error — cannot
come from one. That is the case it stays available for.

**The three do not compete.** All of them are announced, in that order — the message first,
because it is what sent the reader looking; the help second, because it is usually the way out; the
handed sentence last.

The copy in here is not painted, because the tip is already showing it. Take the tip away and the
description goes with it.

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
takes part in them. `required`, `readonly` and `disabled` reflect, so their attributes reach it too,
though `[disabled]` is only the element's own: `:disabled` takes a `<fieldset disabled>` as well.

**Do not select on `[error]`.** It reflects, and a reflected string whose default is empty is
written as `error=""` — which a presence selector matches on every element, error or not.
`:invalid` is what you want.

## Motion

**A field answers the pointer and the focus with RFC 0004's effects**, as
[`<ui-button>`](button.md#motion) does, and **nothing moves the control on its own**: you are typing
there, so an effect changes what is round the control, or moves the box it sits in, its ring with
it. Each is chosen by a custom property per moment, and where you choose nothing the theme's taste
runs:

| Property                     | Effect      | What it draws                                             |
| ---------------------------- | ----------- | --------------------------------------------------------- |
| `--ui-motion-hover-fill`     | `tint`      | a little of the accent in the fill, under the pointer     |
| `--ui-motion-hover-fill`     | `spotlight` | the tint where the pointer is, as strong as it is near    |
| `--ui-motion-hover-shadow`   | `raise`     | the button's drop shadow under the control                |
| `--ui-motion-hover-shadow`   | `glow`      | a light of the accent round the control                   |
| `--ui-motion-hover-shadow`   | `cast`      | a shadow cast away from the pointer, as near as it is     |
| `--ui-motion-hover-border`   | `none`      | the boundary as it rests, its darkening taken away        |
| `--ui-motion-hover-border`   | `edge`      | a band lit nearest the pointer, in the darkening's place  |
| `--ui-motion-focus-fill`     | `tint`      | the same tint, while the focus stays                      |
| `--ui-motion-focus-fill`     | `shimmer`   | the button's sheen swept across it four times             |
| `--ui-motion-focus-shadow`   | `raise`     | the same drop, while the focus stays                      |
| `--ui-motion-focus-shadow`   | `burst`     | light bursting out round the control as it arrives        |
| `--ui-motion-focus-shadow`   | `inner`     | a light along the inside of its edge                      |
| `--ui-motion-focus-move`     | `lift`      | the box round the control two pixels up, ring and all     |
| `--ui-motion-focus-ring`     | `glide`     | the ring glided over from the control seen last           |
| `--ui-motion-focus-ring`     | `glitch`    | the ring shaken and split in two as the focus arrives     |
| `--ui-motion-focus-ring`     | `refocus`   | the ring out of a blur as the focus arrives, and into one |
| `--ui-motion-focus-label`    | `accent`    | the label in the accent, a fifth of the text in it        |
| `--ui-motion-focus-label`    | `glow`      | a light of the accent behind the label                    |
| `--ui-motion-invalid-border` | `pulse`     | a band of the danger sent out from a field in error       |
| `--ui-motion-invalid-border` | `split`     | the boundary split into the danger and the info           |
| `--ui-motion-invalid-border` | `glow`      | a light of the danger held round a field in error         |
| `--ui-motion-invalid-fill`   | `flash`     | a field in error tinted from the danger, and back         |

**The default theme's taste raises a field under the pointer and at the focus, lifts it at the
focus and glides its ring over**, and the boundary still darkens under the pointer, as it did. **A
field is a form's control, so it answers what a form's control does**: its label takes the accent
at the focus, and in error it sends a band of the danger out four times and flashes its fill four
times, each round a `--ui-duration-flourish`, and rests — an error stands for as long as you leave
it. The message comes as it did. **Under [Matrix](theme.md#matrix)** a field tints and glows under
the pointer, and its boundary no longer darkens there; at the focus it takes the tint and a burst of
light, its ring glitches and its label glows; and in error its boundary splits into the danger and
the info, and its fill stays as it is. **Under [Glass](theme.md#glass)** a field takes its tint
where the pointer is, a shadow cast away from it and a band lit along its boundary nearest it, in
the place of its darkening; it keeps a light along its inside at the focus, a sheen sweeps across
it four times and its ring comes into focus from a blur, its label staying as it is; and in error
it holds a light of the danger round it and flashes its fill.

**The spotlight, the cast and the edge follow the pointer**, as the button's do: the pointer engine
hands the box round the control where the pointer is, a frame at a time, from 96px away as the
pointer nears until it is 96px away again as it leaves, and each light rises and fades over that
distance. The spotlight is the field's tint rather than the button's light, since a light any
stronger darkened the ground under the placeholder past 4.5:1. The band is drawn on the layer round
the box, the one an error's border draws on, and leaves it to a field in error. All three follow
only where the pointer can hover and can change the field, never under reduced motion, and the focus
wins over all three. The box is handed to `follow()` from `src/pointer.ts` as it is drawn.

**The label's accent has a fifth of the text in it**, so it clears 4.5:1 in every theme and scheme,
where the accent alone fell under it. **The flash mixes a fifth of the danger into the fill** rather
than laying it over, so the text you type in holds 4.74:1 at each round's start. **Where a light
passes under the text — the flash, and the shimmer's sheen — the text and the placeholder take a
halo** in the field's fill, made opaque, for as long as it plays: a placeholder clears 4.5:1 at rest
and no more, and the halo is the text's background, so it keeps that contrast and the light still
shows round it. Over a fill a theme lets the page through, Glass's, the halo shows round the text
while the light plays. The band and the flash run where the control reads `aria-invalid="true"`, as
a screen reader does.

**The pointer's effects are drawn on a field the pointer can change**, never one that is disabled or
read-only, only where the pointer can hover, and **the focus wins**: in a field the focus is where
you are acting, so a pointer resting there changes nothing. A theme's taste reaches a field under
its own name, `--ui-taste-input-<moment>` or `--ui-taste-textarea-<moment>`, over the page's.

Each effect moves over `--ui-duration-effect` on `--ui-easing-enter`, the label on
`--ui-easing-state`, the glide over `--ui-duration-travel` on `--ui-easing-move`; the burst and the
glitch over `--ui-duration-flourish`, the glitch on a straight clock; the band and the flash over
`--ui-duration-flourish`, `--ui-iteration-settle` rounds of it, the band on `--ui-easing-enter` and
the flash on `--ui-easing-exit`; the split over `--ui-duration-effect`, twice as many rounds, on a
straight clock; the shimmer over `--ui-duration-loop`, `--ui-iteration-settle` rounds of it; and
the refocus over a quarter again `--ui-duration-effect`, on `--ui-easing-enter` and
`--ui-easing-exit`. All of them collapse under
`prefers-reduced-motion: reduce`, and the ring does not fly in forced colours. What they move
transitions only once one is chosen, so with none the boundary is still the only thing that moves.
They are drawn by one internal sheet, `fieldEffects()` in `src/effects.ts`, which the two elements
and [`<ui-select>`](select.md#motion) adopt after their own.

## Styling

Every colour is a [token](tokens.md); nothing here is hardcoded.

| Part               | Token                                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| surface            | `--ui-color-surface-control`, the surface unless set                                                        |
| text and the label | `--ui-color-text`, and `--ui-color-text-muted` when disabled                                                |
| placeholder        | `--ui-color-text-muted`, at full opacity                                                                    |
| boundary           | `--ui-color-border`, and `--ui-color-text` on hover                                                         |
| in error           | `--ui-color-danger`, at `--ui-text-supporting`                                                              |
| help text          | `--ui-color-text`, at `--ui-text-supporting`                                                                |
| focus ring         | `--ui-color-focus`                                                                                          |
| glow               | `--ui-elevation-control`, around the control, lit in the accent, or the danger in error; none when disabled |
| value in error     | `--ui-color-text-invalid`, which is the text unless a theme writes it                                       |
| corner             | `--ui-radius`                                                                                               |
| padding and rhythm | `--ui-space`                                                                                                |
| motion             | `--ui-duration-state`, `--ui-easing-state`                                                                  |
| the `action` slot  | `--ui-color-text`, to anything in it that inherits a colour                                                 |

**These parts are exposed**, because the drawing is now in here:

| `::part()` | Is                                     |
| ---------- | -------------------------------------- |
| `stack`    | the column holding all of it           |
| `label`    | the `<label>` above the control        |
| `control`  | the `<input>` or `<textarea>` itself   |
| `help`     | the supporting text, when there is one |
| `error`    | the message, when there is one         |
| `prefix`   | what is drawn before the value         |
| `suffix`   | what is drawn after the value          |
| `clear`    | the button that empties the control    |
| `reveal`   | the button that shows a password       |
| `count`    | the count drawn under the box          |

The hover rules are guarded against `:disabled` **and** `[readonly]`, measured rather than assumed:
a disabled control still matches `:hover`, and a readonly one accepts a pointer it will do nothing
with.

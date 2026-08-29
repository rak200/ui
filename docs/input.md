# UiInput and UiTextarea

[← Reference](README.md)

Native form controls, styled by the token layer rather than replaced.

```js
import '@rak200/ui';
```

## Contents

- [`<ui-input>`](#ui-input)
- [`<ui-textarea>`](#ui-textarea)
- [The control is yours](#the-control-is-yours)
- [Inside a field](#inside-a-field)
- [Form participation](#form-participation)
- [Interaction states](#interaction-states)
- [Styling](#styling)

## `<ui-input>`

```html
<ui-input>
  <input type="number" name="amount" placeholder="0,00" />
</ui-input>
```

A box around a control you wrote. It carries the appearance — the boundary, the radius, the
padding, the type, the placeholder colour, the focus ring and the interaction states — and nothing
else.

The class is exported as `UiInput` for a host that needs the type; importing the package registers
the element, so nothing has to be called.

## `<ui-textarea>`

```html
<ui-textarea>
  <textarea name="notes" rows="4"></textarea>
</ui-textarea>
```

The same box, plus the two rules that differ: a height to start at, and resizing left on the
vertical axis. A control that cannot grow is one people fight; one that grows sideways breaks the
layout around it.

Exported as `UiTextarea`.

## The control is yours

**You write the `<input>`, and it stays in the light DOM.** That is the single decision these
components are made of, and it is forced rather than preferred.

An ARIA relationship by IDREF does not cross a shadow boundary — the constraint that shapes
[`<ui-field>`](field.md) shapes this too. A control rendered into a component's shadow root is an
axe `label` violation at **critical** impact, and the `aria-describedby` a field points at it
dangles: measured, in this repository's own suite, both ways round. So the box can only ever sit
around the control, never instead of it.

Three things follow, and all three are the good half of the trade:

- **Attributes are the platform's.** `type`, `required`, `readonly`, `disabled`, `name`, `value`,
  `pattern`, `inputmode`, `autocomplete` — every one of them goes where it always went. There is no
  pass-through list to fall out of step with the platform, and nothing to add when you need an
  attribute this package never thought about.
- **The control is directly styleable.** It is your element in your tree; a stylesheet of yours
  reaches it without `::part` and without piercing anything.
- **Validation is the platform's too.** `:invalid`, `:user-invalid`, `setCustomValidity()` and
  constraint validation all work, because the thing they work on is a real `<input>`.

The cost is the extra tag at the call site. [ARCHITECTURE.md](../ARCHITECTURE.md) accepted the same
cost for the same reason when `<ui-field>` shipped.

## Inside a field

```html
<ui-field>
  <label slot="label">Amount</label>
  <ui-input><input type="number" name="amount" /></ui-input>
  <span slot="help">In BRL, two decimals.</span>
  <span slot="error">Amount is required.</span>
</ui-field>
```

`<ui-field>` looks **through** the wrapper and wires the label, the help, the error and
`aria-invalid` to the control itself — never to the box. A `<label for>` aimed at a custom element
labels nothing.

**The error styling is not decided here.** `ui-field` marks the control `aria-invalid` as part of
the wiring it already owns, and the box reads that attribute. One source, and it is the one a
screen reader is already using — so the message under the field and the boundary around it cannot
disagree about whether there is an error.

A control outside a field works too, and carries its own accessible name:

```html
<ui-input><input type="search" aria-label="Search invoices" /></ui-input>
```

## Form participation

**It just works, and there is no mechanism.** A native control inside a `<form>` participates
because it is a native control inside a `<form>` — the value reaches `FormData`, the submit, reset,
and the form's own validity, with no `ElementInternals`, no `setFormValue()` and no value
mirroring.

This was the open question when the component was specified, and the answer turned out to be a
consequence rather than a design: the shape the accessibility constraint forced is the shape that
answers it.

## Interaction states

| State            | What moves                                                        |
| ---------------- | ----------------------------------------------------------------- |
| Hover            | the boundary, toward `--ui-color-text` over `--ui-duration-state` |
| Focus (keyboard) | a 2px `--ui-color-focus` ring, immediately                        |
| Invalid          | the boundary becomes `--ui-color-danger`, from `aria-invalid`     |
| Disabled         | dimmed, `not-allowed`, and no hover response                      |
| Readonly         | no hover response — it takes focus and refuses edits              |

The resting boundary is `--ui-color-border`, which is the surface half way to the text; hovering
finishes that trip rather than introducing a colour of its own. The focus ring is deliberately not
in the transition: delaying the affordance that says _this is where you are_ is the opposite of
what it exists for.

Both `:hover` rules are guarded against `:disabled` and `[readonly]`, because a disabled control
still matches `:hover` and a readonly one takes a pointer it will do nothing with.

## Styling

The control is your own element, so style it directly — there is no part to reach for and nothing
to pierce:

```css
ui-input input {
  text-align: right;
}
```

For colour, radius, spacing, the boundary, the placeholder and the motion, prefer the
[tokens](tokens.md) — they restyle every component at once instead of one selector at a time. Two
of them arrived with these components: `--ui-color-border` and `--ui-color-text-muted`, each with a
contrast floor the suite holds.

**The placeholder is not a label.** It is styled to clear 4.5:1 against the surface, and it still
disappears the moment someone types — anything a person needs while filling the field belongs in
the field's `help` slot.

# RFC 0005 — The control the host writes, and whether it still has to

- **Status**: Draft
- **Scope**: library
- **Created**: 2026-09-07

## Motivation

This is the example in `src/checkbox.ts`'s own docblock:

```html
<ui-switch><input type="checkbox" name="notify" checked /></ui-switch>
```

`<ui-switch>` accepts exactly one element and was designed for exactly one element, and the call
site declares it anyway. The wrapper carries no information a reader could not have supplied — it
names the thing it was built for. What a host would rather write is this:

```html
<ui-switch name="notify" checked></ui-switch>
```

**The cost is already written down**, in [ARCHITECTURE.md](../../ARCHITECTURE.md), _ARIA
association is light-DOM only_:

> The cost is a more verbose call site — `<label slot="label">Amount</label>` rather than
> `label="Amount"`, and `<ui-input><input /></ui-input>` rather than `<ui-input />`.

So this proposal does not report a surprise. It asks whether the premise that bought that cost is
still the whole of the picture — because the same section names one escape and rejects it, and
never names the other one at all.

## Study

### What the architecture decided, and on what

The reasoning, as written, is a chain:

1. An IDREF does not cross a shadow boundary. **Measured**, in this repository's suite, both ways
   round: a `<label for>` in a shadow root leaves `control.labels` empty, and an
   `aria-describedby` pointing in resolves to nothing.
2. Therefore a component that associates elements cannot render them, and the control stays in the
   host's tree.
3. That cost bought three things back: attributes stay the platform's, the control is directly
   styleable, and **form participation stopped being a design question** — _"a native control
   inside a `<form>` reaches the submit because it is a native control inside a `<form>` — no
   `ElementInternals`, no value mirroring."_

Step 1 is a measurement and stands. Steps 2 and 3 are inferences from it, and step 3 mentions
`ElementInternals` only to say it is not needed.

The section also names one way out and rejects it:

> ARIA element reflection (`ariaLabelledByElements`) would remove it and does cross the boundary,
> but its support cannot be verified by a suite that runs one engine, and this is the one place in
> the library where being wrong is invisible to everyone who can see.

### What was never asked

**`formAssociated` and `attachInternals` appear nowhere** in `src/`, `docs/` or
`ARCHITECTURE.md`. `ElementInternals` appears three times, each time to say the package does not
need it because the control is native.

The rule the architecture relies on for `<ui-radio-group>` is stated exactly right:

> `<label for>` reaches a **labelable** element and nothing else.

What is not recorded anywhere is that **a form-associated custom element is a labelable element**.
That is what the spec makes it, and it is the hinge this proposal turns on.

### What was measured

A throwaway probe, in the Chromium the suite already runs, on a bare custom element with
`static formAssociated = true` and `attachInternals()` — no slotted control, no light-DOM anything:

| Probe                                                           | Result                                  |
| --------------------------------------------------------------- | --------------------------------------- |
| `internals.labels.length`                                       | `1`                                     |
| `label.control === element`                                     | `true`                                  |
| `internals.form`                                                | `FORM`                                  |
| `new FormData(form)` after `setFormValue('on')`                 | `[["notify","on"]]`                     |
| `internals.role` / `internals.ariaChecked`                      | `switch` / `true`                       |
| `element.outerHTML`                                             | `<probe-switch id="s3"></probe-switch>` |
| `form.checkValidity()` after `setValidity({valueMissing:true})` | `false`                                 |
| `internals.willValidate`                                        | `true`                                  |

Read against step 3 of the chain above, item by item:

- **The accessible name.** `<label for>` reaches it, and `label.control` is the custom element —
  so the label is a click target for it too, which is the property `ARCHITECTURE.md` gives as the
  reason to prefer `for` over `aria-labelledby`. No IDREF crosses any boundary; nothing is
  slotted.
- **Form participation.** The value reaches `FormData` with no native control anywhere. This is
  the `setFormValue()` the architecture named as the thing it was glad to avoid — but it avoided
  it by a route that costs a wrapper at every call site, and the route was never compared against
  the cost.
- **Role and state.** Written through `internals`, with **no ARIA attribute appearing in
  `outerHTML`** — so a host cannot accidentally clobber them, which is strictly better than
  writing `role` and `aria-checked` onto the host element.
- **Validation.** The form's own `checkValidity()` answers, and the element is `willValidate`.

**This is one engine**, which is precisely the objection that retired `ariaLabelledByElements`.
The difference is that the objection is answerable here: `vitest.config.js` already declares
`instances: [{ browser: 'chromium' }]`, and the suite's own browser mode takes more. See S1.

### What the light DOM still buys, and where

The measurement removes a blocker; it does not make the light DOM worthless. What the slotted
control still carries is **behaviour and platform integration**, and that varies sharply by
component:

| Component                     | What the slotted native control carries today                                                                                                                                     |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ui-input` / `ui-textarea`    | `type`, `inputmode`, `pattern`, `minlength`, autofill, the mobile keyboard the type selects, IME, spellcheck, text selection, undo                                                |
| `ui-select`                   | the operating system's picker — which `docs/select.md` already records as the part no rule here reaches                                                                           |
| `ui-checkbox` / `ui-switch`   | a toggle, Space, `:checked` for the CSS to read                                                                                                                                   |
| `ui-radio` / `ui-radio-group` | the roving tabindex, arrow-key navigation and single-selection the group hand-rolls nothing for — `src/radio.ts` measures the APG pattern on native radios _through_ the wrappers |

The first two rows are a long list of things a package would be reimplementing badly. The last
two are a much shorter one — and those are exactly the components that **already draw their own
control**: `src/checkbox.ts`, `src/radio.ts` and `src/select.ts` are the three files carrying
`appearance: none` or a mask.

So **the cut is probably not uniform**, and a proposal that answers "slot everything" or "slot
nothing" is likely answering the wrong question.

### What it would cost: the behaviour becomes ours

For any component that stops slotting, the package inherits what the native control was doing:
the toggle, the key handling, the focus behaviour, the state the CSS reads, and — for a group —
the roving tabindex and arrow keys `src/radio.ts` currently gets for free.

**This is the work [#122](https://github.com/rak200/ui/issues/122) exists to place.** RFC 0016
adopted Zag for behaviour and accessibility when a component has state to model, and every
candidate so far has been refused because the platform already carried the behaviour. If a
component stops slotting the platform's control, it stops getting the platform's behaviour, and
the adoption has a candidate for the first time. The two questions are the same question, and
whichever is decided first constrains the other.

### Open studies

- **S1 — does it hold in three engines?** The measurement above is Chromium. `vitest.config.js`
  takes more `instances`, so this is answerable in this repository rather than by citation. Until
  it is answered, this proposal carries the same weakness as the alternative the architecture
  rejected, and should not be decided.
- **S2 — where is the cut?** Per component, and stated as a table with a reason per row rather
  than a rule. The two lists in _What the light DOM still buys_ are the starting sketch, not the
  answer.
- **S3 — what does the drawn control lose?** `src/checkbox.ts` records that
  `:host(:has(input:checked))` is invalid in this engine, so only `::slotted(input:checked)` can
  read a slotted control's state. With no slotted control, the state is the component's own — this
  may _simplify_ the mask machinery rather than complicate it. Worth measuring before assuming
  either.
- **S4 — how does `ui-field` change?** `#control()` descends through a wrapper to find
  `input, textarea, select`, and stops at anything carrying a `role`. A form-associated custom
  element is neither: it is labelable _and_ may carry a role. The descent rule needs re-deriving,
  not patching.
- **S5 — what happens to `ui-field` itself?** If a control is a custom element with `internals`,
  the field could set the description through the control rather than by generating ids. Whether
  that is better is a separate question from whether it is possible.
- **S6 — the migration, and what `0.x` permits.** Seven form components. Below `1.0.0` a break is
  a minor, so the versioning cost is low, but the call sites are every example in `docs/` and
  every story. Whether both shapes can coexist for a release is worth answering before the cut is
  chosen.

## Proposed design

**Deliberately not written yet.** This proposal is at the stage the index describes as its first
purpose — _"a place to study"_ — and two of its six open studies (S1, S2) would change the shape
of any design written today. What is established is the Motivation and the measurement; what is
not established is where the cut falls.

## Decision

**Open.** Nothing is decided, and in particular:

- the measurement does **not** decide the question. It retires one premise — that form
  participation and the accessible name require a light-DOM control — and leaves the behaviour
  argument untouched.
- **`ui-input`, `ui-textarea` and `ui-select` are not assumed to move.** The platform integration
  in those three is the strongest form of the original argument and this proposal does not weaken
  it.

## Rollout

Not applicable while the Decision is open. Written when it is not.

## Related

- A **daughter of RFC 0016**, which decided the shape this proposal reopens one premise of —
  Lit for a thin runtime, Zag for behaviour, tokens for the visual language.
- [#122](https://github.com/rak200/ui/issues/122) — the Zag adoption with no candidate left. Same
  question from the other side; see _What it would cost_.

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

### What decides the cut, measured

The first sketch of this section asked _what platform integration does the slotted control
carry_ — `type`, `inputmode`, autofill, the operating system's picker. **Two of those three
arguments do not survive contact with a measurement**, and are recorded here rather than quietly
dropped:

- **The OS picker is not at risk.** A `<select>` inside a shadow root is still a native
  `<select>` and still opens the platform picker. What `docs/select.md` records as unreachable is
  the styling of the drop-down, and that is true wherever the element lives. The picker was never
  an argument for slotting.
- **The attribute pass-through list is avoidable.** `ARCHITECTURE.md` gives _"no pass-through
  list to fall out of step with `type`, `inputmode` or whatever comes next"_ as a thing the light
  DOM bought. That assumes an allowlist. A denylist — forward every attribute except the
  component's own — is stable against whatever the platform adds next.

What does decide it is a different question, and it has a measured answer.

**The probe.** Three variants, each with `<label for>` pointing at the custom element, each run
through `axe` under this suite's own `ruleset`:

|       | What it is                                                                                         | axe                            |
| ----- | -------------------------------------------------------------------------------------------------- | ------------------------------ |
| **A** | a custom element rendering `<input>` into its shadow root, not form-associated                     | `label [critical]`             |
| **B** | the same, **form-associated**, with `delegatesFocus: true`                                         | `label [critical]` — unchanged |
| **D** | form-associated, rendering **no inner control**; the host _is_ the control, `role` via `internals` | **no violations**              |

In **B** the host is correctly labelled — `internals.labels` is `1` — and focus delegates into
the shadow root, `shadowRoot.activeElement` being the `INPUT`. The critical violation survives
all of it: the `<label for>` names the **custom element**, and the element a screen reader
actually reaches is the inner `<input>`, which has no accessible name.

**So form association makes a host labelable; it does not make a control the host hides inside
itself labelable.** `ARCHITECTURE.md` measured variant A and concluded the control must be
slotted. That conclusion stands — and variant B is the reason it stands, which the original
measurement could not have known.

### The test, restated

Not _does the native element carry platform integration_, but:

> **Does the component need a real focusable control inside it, or can the host itself be the
> control?**

| Component                                                                            | Needs a control inside                    | Cut                                                                |
| ------------------------------------------------------------------------------------ | ----------------------------------------- | ------------------------------------------------------------------ |
| `ui-checkbox`, `ui-switch`                                                           | no — a boolean with a drawn face          | **variant D**: the host is the control                             |
| `ui-radio`, `ui-radio-group`                                                         | no — same, plus group behaviour           | **variant D**, at the highest behaviour cost                       |
| `ui-input`, `ui-textarea`                                                            | yes — text entry, selection, IME, undo    | **no change**: variant B is a critical violation                   |
| `ui-select`                                                                          | yes — a native picker the host must reach | **no change**, for the same reason                                 |
| `ui-button`                                                                          | renders its own `<button>` already        | see below                                                          |
| `ui-card`, `ui-dialog`, `ui-menu`, `ui-tooltip`, `ui-table`, `ui-toaster`, `ui-icon` | not controls                              | **no change**: the slot carries content, and content is the host's |

The first two rows are exactly the three files that already carry `appearance: none` or a mask —
`src/checkbox.ts` and `src/radio.ts`. Having thrown away the native drawing, what they still take
from the slotted control is a boolean, a name and the Space key.

### What each call site would become

```html
<!-- ui-switch — today -->
<ui-switch><input type="checkbox" name="notify" checked /></ui-switch>
<!-- proposed -->
<ui-switch name="notify" checked></ui-switch>
```

```html
<!-- ui-radio-group — today -->
<ui-radio-group>
  <label
    ><ui-radio><input type="radio" name="plan" value="free" /></ui-radio> Free</label
  >
  <label
    ><ui-radio><input type="radio" name="plan" value="pro" /></ui-radio> Pro</label
  >
</ui-radio-group>
<!-- proposed -->
<ui-radio-group name="plan" value="free">
  <ui-radio value="free">Free</ui-radio>
  <ui-radio value="pro">Pro</ui-radio>
</ui-radio-group>
```

`ui-input`, `ui-textarea` and `ui-select` keep the shape they have.

### `ui-button`, which is a different question wearing the same coat

`<ui-button>` declares `variant` and `disabled` and nothing else, and `docs/button.md` never
mentions forms. Measured: the inner `<button>` reports `type` `submit` — the HTML default for a
`<button>` with no `type` written, which `src/button.ts` does not write — and `form` `null`, and
clicking it submits nothing where a native button in the same form submits.

**That is a capability the component has never claimed, not a defect.** Form association would
give it, at no change to the call site at all. Whether it _should_ have it is a question this
proposal raises and does not answer; what should not survive either way is `docs/button.md`
saying neither.

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
- **S2 — where is the cut?** **Drafted above**, in _The test, restated_, and resting on the A/B/D
  probe rather than on judgement. What is still open is whether the test survives S1 and S7: a
  three-engine result that disagrees would retire it, and a workable answer to S7 would move
  `ui-input` back across the line.
- **S3 — what does the drawn control lose?** `src/checkbox.ts` records that
  `:host(:has(input:checked))` is invalid in this engine, so only `::slotted(input:checked)` can
  read a slotted control's state — and that constraint is what forced the mask and its
  `mask-composite: exclude`. With no slotted control the state is the component's own and
  `:host([checked])` reaches it, so this is more likely a **simplification** than a cost. Still
  worth measuring rather than assuming, because the mask also serves `forced-colors`.
- **S4 — how does `ui-field` change?** `#control()` descends through a wrapper to find
  `input, textarea, select`, and stops at anything carrying a `role`. **Partly answered, and the
  answer is uncomfortable**: a form-associated element carries its role in `internals.role`, which
  does not reflect to an attribute — measured, the probe's `outerHTML` is bare. So the
  `hasAttribute('role')` guard is dead for such an element, the descent finds no native control,
  and the `?? slotted` fallback returns the custom element — which is the right answer, reached by
  falling through rather than by design. The rule needs re-deriving, not patching.
- **S5 — what happens to `ui-field` itself?** If a control is a custom element with `internals`,
  the field could set the description through the control rather than by generating ids. Whether
  that is better is a separate question from whether it is possible.
- **S6 — the migration, and what `0.x` permits.** Seven form components. Below `1.0.0` a break is
  a minor, so the versioning cost is low, but the call sites are every example in `docs/` and
  every story. **Coexistence has a shipped precedent here**: `<ui-icon>` already dispatches on
  both shapes, `name="check"` against the registry and a slotted `<svg>` for a host's own. Whether
  that is the right pattern for a control is the question; whether it is possible is settled.

- **S7 — can a rendered control be named by copying?** Variant B fails because the inner control
  is anonymous. Writing the label's text onto it as an `aria-label` would name it, and the
  package already does exactly that once: `<ui-dialog>`'s accessible name is a copied string
  rather than an IDREF. The cost is equally known — a copied name goes stale when the label
  changes, which is one more thing to observe, and `ui-field` already runs a `MutationObserver`
  for a neighbouring reason. This is what would reopen `ui-input`; it is not a dead end and it is
  not free.

## Proposed design

**A cut is drafted, a design is not.** _The test, restated_ and _What each call site would
become_ are the shape this would take if it were decided today, and they rest on a measurement
rather than on taste. They are not a design: nothing here says how a drawn toggle implements
Space, how a group implements a roving tabindex, or who writes either — which is the whole of
S1 through S7 still being open, and #122 still being undecided.

## Decision

**Open.** Nothing is decided, and in particular:

- the measurement does **not** decide the question. It retires one premise — that form
  participation and the accessible name require a light-DOM control — and leaves the behaviour
  argument untouched.
- **`ui-input`, `ui-textarea` and `ui-select` do not move**, and now for a measured reason rather
  than an argued one. Variant B is a critical `label` violation with form association applied, so
  the original conclusion survives the thing that was supposed to overturn it. S7 is the only
  route back.
- **Two arguments this proposal originally made for that conclusion are withdrawn** — the OS
  picker and the attribute pass-through list. Both are recorded above rather than deleted, so
  their absence is not read later as an oversight.

## Rollout

Not applicable while the Decision is open. Written when it is not.

## Related

- A **daughter of RFC 0016**, which decided the shape this proposal reopens one premise of —
  Lit for a thin runtime, Zag for behaviour, tokens for the visual language.
- [#122](https://github.com/rak200/ui/issues/122) — the Zag adoption with no candidate left. Same
  question from the other side; see _What it would cost_.

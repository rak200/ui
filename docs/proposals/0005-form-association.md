# RFC 0005 — The control the host writes, and whether it still has to

- **Status**: Accepted
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

**There is a stated objective behind it, and it belongs here rather than in a later section:
`<ui-field>` is to be discontinued.** That element exists to wire a relationship whose ends are
scattered across the host's tree — it generates ids, points a `<label for>` at a control it
descends to find, and keeps `aria-describedby` honest with a `MutationObserver`. Every one of
those jobs is work created by the ends being in different places. A component that owns every end
of its own relationship has no such work to delegate, and nothing left for a field to do. Whether
that is reachable is what the Study measures; that it is wanted is a decision already taken.

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
itself labelable.**

**A fourth variant settles the shape the radio would take.** `checkbox`, `radio` and `switch` are
all _name from content_ roles, so a host element can be named by its own slotted text rather than
by a `<label for>`. Measured, a `role="radiogroup"` named by a `<label for>` holding two
`role="radio"` elements each naming itself from slotted text: **no violations and nothing
incomplete**. Both naming routes are therefore available to group 1, and the proposed radio does
not need the wrapping `<label>` its current form requires.

### The variant that changes the answer

A, B and D all keep the label in the host's tree. **A fifth variant moves it inside**, so that the
component owns every end of the relationship rather than one of them:

```html
<ui-input label="Amount" help="In BRL, two decimals." type="number" name="amount"></ui-input>
```

```html
<!-- rendered into its own shadow root: one tree scope, every reference internal -->
<label for="c">Amount</label>
<input id="c" type="number" aria-describedby="h e" />
<span id="h">In BRL, two decimals.</span>
<span id="e"></span>
```

Measured, in the same browser and under the same ruleset:

| Probe                     | Result                       |
| ------------------------- | ---------------------------- |
| `label.control`           | `INPUT` — the IDREF resolves |
| `inner.labels.length`     | `1`                          |
| `aria-describedby` target | resolves, to the help text   |
| axe violations            | **none**                     |
| axe incomplete            | **none**                     |
| clicking the label        | focuses the inner `INPUT`    |
| `new FormData(form)`      | `[["amount","42"]]`          |

**No copying, no observer, nothing that can go stale.** Where S7 tries to make a _reference_ cross
by turning it into a _string_, this puts both ends on the same side and leaves the reference
alone.

It is also not a new idea in this repository. `ARCHITECTURE.md` already states it:

> **Where a component owns _both_ ends, the relationship goes inside**

`<ui-menu>` is the only component that does it today, with `aria-controls`. Nothing in that
sentence limits it to a menu.

### A third working shape: both ends, in the host's tree

Variant F puts both ends in the component's shadow root. **A sixth variant puts both in the
host's**, which is where they already are today — the component simply stops waiting for someone
else to supply the label and creates it as its own light-DOM child:

```html
<ui-input label="Amount" help="In BRL, two decimals.">
  <input type="number" name="amount" />
</ui-input>
```

The control stays slotted, the host's own element, in the host's own tree. The `<label>` and the
help are created there beside it, so both ends share the document's scope. Measured:

| Probe                       | Result                                       |
| --------------------------- | -------------------------------------------- |
| `label.control`             | `INPUT`                                      |
| `control.labels.length`     | `1`                                          |
| `control.form`              | `FORM`                                       |
| in `form.elements`          | **`true`**                                   |
| `form.elements` contents    | `INPUT` — one native control, nothing custom |
| axe violations / incomplete | **none / none**                              |
| `new FormData(form)`        | `[["amount","42"]]`                          |

**G needs no form association at all** — no `formAssociated`, no `setFormValue`. The control is a
native control inside a `<form>`, exactly as today, so everything that follows from that is
untouched. And `<ui-field>` still goes: the wiring it existed to do is done by the component that
owns the control.

Its cost is new and is not small. **The component writes into its own light DOM**, creating nodes
that appear in the host's `innerHTML`. `ui-field` mutates light DOM today — ids and attributes —
but it creates nothing, and creating is the step that frameworks reconcile against: a React or Vue
render of `<ui-input>` owns that subtree and may remove what the component put there. See S10.

### The variant that passes the gate and is worse

Containment crosses a shadow boundary where a reference does not — `<ui-toaster>` is built on
that. A `<label>` that _contains_ a control labels it implicitly, with no IDREF at all. So a
seventh variant suggests itself, and it looks like the best of both: no light-DOM writes, the
control still slotted, the label in the shadow root **wrapping the slot**.

```html
<!-- rendered into the shadow root -->
<label part="label">
  <span>Amount</span>
  <slot></slot>
  <!-- the host's control lands in here -->
</label>
```

Measured, and the verdict is split:

| Probe                       | Result                |
| --------------------------- | --------------------- |
| axe violations / incomplete | **none / none**       |
| `label.control`             | **`null`**            |
| `control.labels.length`     | **`0`**               |
| `control.form`              | `FORM`                |
| clicking the label text     | focus lands on `BODY` |

The accessibility tree is built from the flattened tree, where the control really is inside the
label — so **axe passes**. The DOM's own labelling APIs are not: they walk the node tree, where a
slot is not its assigned nodes, so the label has no control and the control has no label.

**And the label stops being a click target**, which `ARCHITECTURE.md` names as half of why `for`
is preferred wherever it works:

> `for` wherever it works, because it names the control _and_ makes the label a click target for
> it

So H delivers the name, silently drops the affordance, and **passes the gate while doing it** —
the failure shape this library least wants, and the one the architecture calls out by name.
Rejected, and written down because it is seductive enough to be proposed again.

### Rich markup, and where the escape hatch can live

A label is not always a word. `<abbr title="Cadastro de Pessoas Físicas">CPF</abbr>`, a required
marker, and above all _"I accept the `<a href="/terms">terms</a>`"_ are ordinary labels that an
attribute cannot hold.

The escape hatch is a slot **inside** the rendered label, and the reason it works is the one this
whole proposal turns on:

```html
<!-- shadow root -->
<label for="c"><slot name="label"></slot></label>
<input id="c" type="checkbox" />
```

The **association** is between the `<label>` and the `<input>`, both in the shadow root — one
scope, so it resolves. The slotted content is _content_: projection, not reference, and markup
crosses because it never needed a scope.

Measured, with a control so the result is not vacuous:

|                                        | Result                                                                     |
| -------------------------------------- | -------------------------------------------------------------------------- |
| the slot left **empty**                | `label [critical]` — so the name really is coming from the slotted content |
| rich markup slotted                    | axe **clean**, `label.control` `INPUT`, `input.labels` `1`                 |
| the markup itself                      | preserved — `<a href="/terms">terms</a>`                                   |
| clicking the label text                | **toggles the control**                                                    |
| clicking the **link inside the label** | **does not also toggle**                                                   |

The last row is the one worth having: the classic hazard of an interactive element inside a label
is handled by the platform, and needs nothing written here.

**This is available under F and not under G.** A slot exists in a shadow root; the light DOM has
none. Under G a host that needs markup writes its own `<label>` and the component wires it — which
is the shape the library has today, carrying `ui-field`'s verbosity without `ui-field`. S9 is
therefore not neutral between the two shapes, and says so in the Decision.

### What the seven variants actually show

The variable was never _whether the control is slotted_. It is **whether every end of the
relationship is in one tree scope**:

|       | Control             | Label                            | Result                                    |
| ----- | ------------------- | -------------------------------- | ----------------------------------------- |
| today | light DOM           | light DOM                        | works — one scope, the host's             |
| **A** | shadow              | light DOM                        | `label [critical]` — two scopes           |
| **B** | shadow              | light DOM, form-associated       | `label [critical]` — still two scopes     |
| **D** | _is_ the host       | light DOM                        | works — one scope, the host's             |
| **F** | shadow              | **shadow**                       | works — one scope, the component's        |
| **G** | light DOM           | light DOM, **component-created** | works — one scope, the host's             |
| **H** | light DOM (slotted) | shadow, **wrapping the slot**    | axe-clean, no click target — **rejected** |

**Three shapes work, two do not, and one only appears to**, and the line between them is not where the control sits but
whether both ends sit together. A and B are the broken middle: the control inside, the label left
outside. That middle is what `ARCHITECTURE.md` measured before concluding the control must be
slotted — a conclusion right about the middle and read since as a rule about the whole.

### The test, restated

Not _does the native element carry platform integration_, and not _does the component need a
control inside it_ — the fifth variant retires both. What is left is the rule
`ARCHITECTURE.md` already states, applied per component:

> **Can this component own every end of its own relationship?**

| Component                                                                            | Can own every end                                             | Shape                                                           |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------- | --------------------------------------------------------------- |
| `ui-checkbox`, `ui-switch`                                                           | yes — there is no inner control to strand                     | **D**, or **F** if it renders its own label                     |
| `ui-radio`, `ui-radio-group`                                                         | yes — same, at the highest behaviour cost                     | **D** or **F**                                                  |
| `ui-input`, `ui-textarea`                                                            | yes, via **F or G** — either shape puts both ends together    | **G** reads as the fairer middle; both measured clean           |
| `ui-select`                                                                          | yes, via F or G — `<option>` stays slotted content either way | **G**, same reasoning                                           |
| `ui-button`                                                                          | already does; it renders its own `<button>`                   | unchanged; see below                                            |
| `ui-card`, `ui-dialog`, `ui-menu`, `ui-tooltip`, `ui-table`, `ui-toaster`, `ui-icon` | not controls                                                  | unchanged — the slot carries content, and content is the host's |

**This is the finding that reopened `ui-input`.** An earlier draft of this section closed those
three rows with _no change_, on the strength of variant B measuring as a critical violation. That
measurement was right and the conclusion drawn from it was too narrow: B strands the control
because the label stays outside, not because the control is inside. Recorded rather than quietly
corrected, because the narrower reading is the one `ARCHITECTURE.md` still carries.

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

### Which of the four refusals this proposal touches

[#122](https://github.com/rak200/ui/issues/122) records four components that declined Zag, and
states the test it would have to meet: _"Zag arrives where the accessible behaviour is the
expensive part."_ Two of those four refusals rest on the platform supplying the behaviour — which
is exactly what group 1 gives up here.

| Component                   | Why it declined                                   | Touched by this proposal |
| --------------------------- | ------------------------------------------------- | ------------------------ |
| `ui-checkbox` / `ui-switch` | the platform supplies the state                   | **yes**                  |
| `ui-radio-group`            | the APG pattern is what native radios already do  | **yes**                  |
| `ui-toast`                  | a live region is markup, not a machine            | no                       |
| `ui-menu`                   | `popover="auto"` supplies the layer and dismissal | no                       |

**The two it touches fall on opposite sides of #122's own test.**

_Checkbox and switch do not become a candidate._ What they take on is `setFormValue` with the rule
that an unchecked box submits nothing, `setValidity`, `formResetCallback` /
`formStateRestoreCallback` / `formDisabledCallback`, and a re-dispatch of `change`, which is
non-composed and therefore stops at the shadow boundary. It is a real list of small things, and
**none of it is accessibility**. Form plumbing is not the expensive part.

> **Corrected during the rollout.** This paragraph originally also listed _a click and Space
> toggle (and not Enter)_, `internals.ariaChecked` and _a tab stop that disabled removes_ — and
> named `role` and `aria-checked` through `internals` as the accessible half that survived. **That
> is variant D's list, not F's.** Under D the host _is_ the control and every one of those is
> hand-written; under F the element renders a real `<input type="checkbox">` inside a real
> `<label>`, so the toggle, the Space key, the tab stop, `disabled` removing it, and `aria-checked`
> are all still the platform's. F was the variant accepted. The conclusion is unchanged and the
> argument for it is stronger: measured on the implementation, the cost is form plumbing and one
> event that does not bubble out.

_The radio group does become one, and it is the first._ `tests/radio.test.ts` already documents
what it gets free, in tests that run — _one tab stop, not one per option_; _enters at the selected
option rather than at the first_; _moves and selects with the arrow keys, and wraps at the end_.
Written by hand that becomes a roving tabindex, arrow keys with wrap, **selection following
focus** — which is what separates a radiogroup from a listbox — Home and End, the single-selection
invariant across the set, `required` validated on the group rather than the option, and **RTL, where
left and right swap**. That is an APG pattern with directionality and wrapping, which is #122's
test met rather than argued.

**So the dependency runs one way**: this proposal unblocks #122, not the reverse. #122 cannot name
a candidate today because `ui-radio-group` delegates to native radios; it is this proposal that
withdraws the delegation. Deciding #122 first would be deciding it without the thing that makes it
answerable.

**Which suggests group 1 is two decisions, not one.** `ui-checkbox` and `ui-switch` decline Zag in
either outcome and can be settled here. `ui-radio` and `ui-radio-group` carry the expensive half
and are the ones #122 governs — which is the same shape as the rule the architecture already
follows, that a category arrives with the component that consumes it.

**This is the work #122 exists to place.** RFC 0016
adopted Zag for behaviour and accessibility when a component has state to model, and every
candidate so far has been refused because the platform already carried the behaviour. If a
component stops slotting the platform's control, it stops getting the platform's behaviour, and
the adoption has a candidate for the first time. The two questions are the same question, and
whichever is decided first constrains the other.

### Open studies

- **S1 — does it hold in three engines? Yes. All three, and not one value apart.** Every variant
  was re-measured in Blink, Gecko and WebKit:

  |                                          | Blink                                              | Gecko     | WebKit    |
  | ---------------------------------------- | -------------------------------------------------- | --------- | --------- |
  | `formAssociated` supported               | yes                                                | yes       | yes       |
  | **B** — control in shadow, label outside | `label` violation, `labels` `1`                    | identical | identical |
  | **D** — host is the control              | clean, `labels` `1`, `role` `switch`               | identical | identical |
  | **F** — both ends in the shadow root     | clean, `label.control` `INPUT`, `FormData` carries | identical | identical |
  | **G** — both ends in the light DOM       | clean, `labels` `1`, in `form.elements`            | identical | identical |
  | **H** — shadow label wrapping the slot   | clean, `label.control` `null`, `labels` `0`        | identical | identical |

  **This retires the objection that killed the alternative `ARCHITECTURE.md` rejected.** ARIA
  element reflection was turned down because _"its support cannot be verified by a suite that runs
  one engine"_. That is a statement about the apparatus, not about the mechanism — and the
  apparatus was one `instances` entry away from answering it. Two engines run directly from
  `vitest.config.js`; the third needs a container, because Playwright's WebKit build wants an
  older `libicu` than a current Debian ships and its dependency installer resolves Ubuntu 20.04
  package names that do not exist there. The official `mcr.microsoft.com/playwright` image carries
  all three with their libraries, which makes this reproducible rather than a one-off.

  **H agrees across all three too**, which is the uncomfortable half: a shape that clears the gate
  and drops the click target does so in every engine, so no browser will catch it for a reader who
  runs axe and stops.

- **S2 — where is the cut?** **Drafted above**, in _The test, restated_, and resting on the
  five-variant probe rather than on judgement. It has already been redrawn once — variant F moved
  `ui-input`, `ui-textarea` and `ui-select` from _no change_ to _changed_, which is most of the
  library — so it should be read as the current answer rather than a settled one. S1, S8 and S9
  can each move it again.
- **S3 — what does the drawn control lose?** `src/checkbox.ts` records that
  `:host(:has(input:checked))` is invalid in this engine, so only `::slotted(input:checked)` can
  read a slotted control's state — and that constraint is what forced the mask and its
  `mask-composite: exclude`. With no slotted control the state is the component's own and
  `:host([checked])` reaches it, so this is more likely a **simplification** than a cost. Still
  worth measuring rather than assuming, because the mask also serves `forced-colors`.
- **S4 — how does `ui-field` change on the way out?** The objective is to remove it, but a
  release in which both shapes coexist still has to work, and in that release the descent still
  runs. `#control()` descends through a wrapper to find
  `input, textarea, select`, and stops at anything carrying a `role`. **Partly answered, and the
  answer is uncomfortable**: a form-associated element carries its role in `internals.role`, which
  does not reflect to an attribute — measured, the probe's `outerHTML` is bare. So the
  `hasAttribute('role')` guard is dead for such an element, the descent finds no native control,
  and the `?? slotted` fallback returns the custom element — which is the right answer, reached by
  falling through rather than by design. The rule needs re-deriving, not patching.
- **S5 — what has to be true before `ui-field` can be removed?** Under variant F every control
  owns its own label, help and error, and the field has no remaining job — which is the objective
  stated in the Motivation. What has to be checked is that nothing else was quietly riding on it:
  the vertical rhythm between label, control and help is `ui-field`'s stylesheet today, and the
  error colour is a retargeted token that `ui-radio-group` reaches through three selectors it
  could not otherwise use. Removing the element removes those; each needs a home before it can go.
- **S6 — the migration, and what `0.x` permits.** Seven form components. Below `1.0.0` a break is
  a minor, so the versioning cost is low, but the call sites are every example in `docs/` and
  every story. **Coexistence has a shipped precedent here**: `<ui-icon>` already dispatches on
  both shapes, `name="check"` against the registry and a slotted `<svg>` for a host's own. Whether
  that is the right pattern for a control is the question; whether it is possible is settled.

- **S7 — naming a rendered control by copying.** **Demoted by variant F, not retired.** Copying
  the label text onto the inner control as an `aria-label` does work: measured, an element reading
  its own `internals.labels` and writing the text inward cleared the critical violation that
  variant B reports. It stops at the description — `aria-describedby` is irreducibly a reference,
  and measured from inside a shadow root at a light-DOM id, axe reports `aria-valid-attr-value` as
  _incomplete_ rather than as a violation, which is the failure mode this library least wants.
  F needs none of it. S7 survives only as the fallback if F is blocked by S8 or S9.
- **S8 — autofill. No longer a gate; a consequence of the variant chosen.** What is measured is
  that the standard form machinery does not see a control inside a shadow root: it is absent from
  `form.elements`, its `form` is `null`, and `closest('form')` returns nothing, while the
  form-associated host takes its place in the collection. What is **not** measured, and cannot be
  here, is whether a browser's autofill runs its own shadow-piercing traversal rather than that
  collection — the CDP `Autofill` domain is absent from the `chrome-headless-shell` this suite
  runs, so the automated route is closed, and recollection is not evidence. It is recorded as a
  hypothesis and left there. **The maintainer's position is that autofill is dispensable**, which
  removes it as a blocker: under F it is a cost knowingly accepted, and under G the question does
  not arise, because nothing about the control's position changes. Either way it is an outcome of
  the choice rather than an input to it.
- **S9 — what is lost when a label becomes a string? Answered: nothing, given an escape hatch.**
  Three shapes were weighed — attribute only, attribute plus a slot, slot only — and the second is
  taken. The attribute carries the common case; a `slot="label"` carries markup when there is
  markup, measured clean above. **It does not reintroduce the two-scope problem**, because the
  slot supplies the label's _content_ while the association stays between two elements the
  component owns. Two ways to say one thing is a real cost, and it is the cost this library
  already pays deliberately once: `<ui-icon>` dispatches between `name="check"` and a slotted
  `<svg>`, and the consumer has already learnt that an attribute is the short road and a slot is
  the way in for something of your own.
- **S10 — what does a component writing into its own light DOM cost?** Variant G's price, and
  **partly measured**. Two failure modes, both real in this engine:

  |                                      | Measured                                                                    |
  | ------------------------------------ | --------------------------------------------------------------------------- |
  | the element is **moved** in the tree | labels go `1` → `2`; `connectedCallback` runs again and injects a second    |
  | the host **rewrites its children**   | labels go `1` → `0`, `control.labels` `0` — silently unnamed, with no error |

  The first is cheap to fix: make the injection idempotent. The second is what a framework
  re-render does, and the fix is a `MutationObserver` re-injecting — a pattern `ui-field` already
  uses. **The difference matters**: the field rewrites _attributes on nodes the host wrote_, where
  G would re-create _nodes_, which the framework may remove again, which the observer would
  re-inject again.

  **The loop was measured and does not happen.** `lit-html` is a real reconciler and is already a
  dependency, so the test used it rather than a simulation: re-rendering the same template six
  times with changed bindings leaves `labels=1 named=1` and the injection count static; an unmount
  and remount re-injects exactly once; re-rendering the children of the host directly settles the
  same way. A reconciler touches its bindings, not the static DOM around them, and the observer
  never fires against it.

  **What the hardening produced instead is worse than the loop, and is S10.3.** The idempotence
  that fixes the duplication is a guard that returns early when a label already exists. When the
  reconciler swaps the _control_ for a new element, that guard fires, the label survives, and it
  goes on pointing at an id that no longer exists:

  ```
  A  label.for = c-14251 | input.id = c-14251 | named = 1
  B  label.for = c-14251 | input.id =         | named = 0
  C  label survived = true | points at a node that exists = false
  ```

  |                     | Symptom                          | Visible?         |
  | ------------------- | -------------------------------- | ---------------- |
  | S10.1 duplication   | two labels                       | yes, at a glance |
  | S10.2 erasure       | no label                         | yes, at a glance |
  | **S10.3 staleness** | one label, right text, **inert** | **no**           |

  The fix is real — reconcile rather than return early, checking that `for` still names the
  current control — but the finding is that **the first two fixes produced the third failure**,
  and the third is the class this repository treats as worst. So G's true price is not _writing to
  the light DOM_; it is **keeping an association synchronised against a renderer that may replace
  any node at any time** — which is the work `ui-field` does today, now done without `ui-field`.

  **Measured with one reconciler.** Lit is the one this package is built on and the one a
  consumer is most likely to pair it with; React and Vue have their own semantics and neither is
  installable here without changing the dependency tree. The result is strong for Lit and
  indicative, not conclusive, elsewhere.

## Proposed design

Every element the package registers, in the shape it has today and the shape this proposal would
give it. Nothing below is settled — see _Decision_ — but everything below is what the cut in
_The test, restated_ actually produces when written out.

### Group 1 — the host becomes the control

The four elements that already threw the native drawing away, and take a boolean, a name and a
key from the control they slot.

```html
<!-- ui-checkbox — today -->
<ui-checkbox><input type="checkbox" name="receipt" /></ui-checkbox>
<!-- proposed -->
<ui-checkbox name="receipt"></ui-checkbox>
```

```html
<!-- ui-switch — today -->
<ui-switch><input type="checkbox" name="notify" checked /></ui-switch>
<!-- proposed -->
<ui-switch name="notify" checked></ui-switch>
```

```html
<!-- ui-radio — today -->
<label
  ><ui-radio><input type="radio" name="plan" value="free" /></ui-radio> Free</label
>
<!-- proposed -->
<ui-radio value="free">Free</ui-radio>
```

The wrapping `<label>` goes: the text names the element itself, which is the fourth variant
measured above.

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

`name` rises to the group, which is where it always belonged — repeated on every option today
only because the native element requires it there. This is the largest reduction in the library
and the largest behaviour cost in it, and those are the same row.

### Group 2 — the label joins the control, wherever the control is

Variant F. The control keeps every reason it had to be a real native element; what changes is
that the label, the help and the error come inside with it, so nothing is stranded across a
boundary.

```html
<!-- ui-input — today -->
<ui-field>
  <label slot="label">Amount</label>
  <ui-input><input type="number" name="amount" /></ui-input>
  <span slot="help">In BRL, two decimals.</span>
</ui-field>
<!-- proposed -->
<ui-input label="Amount" help="In BRL, two decimals." type="number" name="amount"></ui-input>
```

```html
<!-- ui-textarea — today -->
<ui-field>
  <label slot="label">Notes</label>
  <ui-textarea><textarea name="notes" rows="4"></textarea></ui-textarea>
</ui-field>
<!-- proposed -->
<ui-textarea label="Notes" name="notes" rows="4"></ui-textarea>
```

```html
<!-- ui-select — today -->
<ui-field>
  <label slot="label">Currency</label>
  <ui-select>
    <select name="currency">
      <option value="brl">Real</option>
      <option value="usd">Dollar</option>
    </select>
  </ui-select>
</ui-field>
<!-- proposed -->
<ui-select label="Currency" name="currency">
  <option value="brl">Real</option>
  <option value="usd">Dollar</option>
</ui-select>
```

`<option>` stays slotted, and that is not an inconsistency: an option is content, not a control,
and the same rule that keeps a card's header in the host's tree keeps it there.

**There are two shapes for this group, and the difference is where the pair of ends lives.** Above
is **F**, both ends in the component's shadow root. **G** puts both in the host's tree instead: the
control stays slotted, and the component creates the label beside it.

```html
<!-- ui-input, variant G -->
<ui-input label="Amount" help="In BRL, two decimals.">
  <input type="number" name="amount" />
</ui-input>
```

G keeps the wrapper that group 1 sheds, and buys back everything that follows from the control
being an ordinary native control in an ordinary form — it needs no form association at all. What it
costs is that the component creates nodes in its own light DOM, which is S10.

**Either way `<ui-field>` goes**, which is the objective. S9 applies to both; S8 applies to F only,
and is no longer a gate.

### The label, in both shapes

Every call site above writes `label="…"`, and that is the common case rather than the only one. A
label that carries markup arrives through a slot inside the rendered label:

```html
<!-- the short road -->
<ui-checkbox label="Send a receipt" name="receipt"></ui-checkbox>

<!-- and the way in, for a label an attribute cannot hold -->
<ui-checkbox name="terms">
  <span slot="label">I accept the <a href="/terms">terms</a></span>
</ui-checkbox>
```

Measured clean, with the control toggling on a click of the label text and **not** toggling on a
click of the link inside it. The same pair applies to `help` and `error`.

Two ways to say one thing, deliberately, and not for the first time: `<ui-icon>` already
dispatches between `name="check"` and a slotted `<svg>`.

### Group 3 — unchanged, because the slot carries content

Content is the host's by definition, and none of these is a form control.

```html
<ui-button variant="primary">Save</ui-button>

<ui-card>
  <h3 slot="header">Monthly plan</h3>
  <p>Everything in the free tier.</p>
  <div slot="footer"><ui-button>Choose</ui-button></div>
</ui-card>

<ui-dialog>
  <h2 slot="title">Delete account</h2>
  <p>This cannot be undone.</p>
  <ui-button slot="actions">Delete</ui-button>
</ui-dialog>

<ui-menu>
  <span slot="trigger">Actions</span>
  <button type="button">Rename</button>
</ui-menu>

<ui-tooltip>
  <button type="button">Save</button>
  <span slot="tip">Saves without closing.</span>
</ui-tooltip>

<ui-table aria-label="Invoices">
  <table>
    …
  </table>
</ui-table>

<ui-toaster></ui-toaster>
<ui-toast variant="success">Saved.</ui-toast>

<ui-icon name="check"></ui-icon>
<ui-icon
  ><svg viewBox="0 0 24 24"><path d="M12 2 2 22h20Z" /></svg
></ui-icon>
```

`<ui-button>` sits here with a caveat rather than a change: its call site would not move even if
form participation were granted to it. See _`ui-button`, which is a different question wearing
the same coat_.

### `ui-field` is discontinued, which is the objective rather than a consequence

Under variant F every control owns its own label, help and error. `<ui-field>` has no remaining
job: it exists to point ends at each other, and there are no scattered ends left to point.

```html
<!-- today: seven lines, three elements, one wiring component -->
<ui-field>
  <label slot="label">Amount</label>
  <ui-input><input type="number" name="amount" /></ui-input>
  <span slot="help">In BRL, two decimals.</span>
  <span slot="error">Amount is required.</span>
</ui-field>

<!-- proposed: one element -->
<ui-input
  label="Amount"
  help="In BRL, two decimals."
  error="Amount is required."
  type="number"
  name="amount"
></ui-input>
```

What goes with it is not only the call site. `src/field.ts` is a `MutationObserver`, an id
sequence, a descent that has to guess which slotted node is the control, a `role` guard for the
one wrapper that is the widget, and a second naming path for the elements `<label for>` cannot
reach. **All of it is machinery for a problem that stops existing** once each component owns its
own relationship.

**Two things it carries would be lost with it**, and each needs a home before it can go: the
vertical rhythm between label, control and help, which is `ui-field`'s own stylesheet; and the
error colour, which `ui-radio-group` reaches by retargeting a token through three selectors it
could not otherwise use. See S5.

### The asymmetry, and what each shape does to it

An earlier draft of this section called the asymmetry the design's main cost, and it was right
about the design it was describing: with group 1 taking attributes and group 2 still slotting, two
form fields on one screen would not have read alike.

**Variant F removes it entirely** — one shape, both rows:

```html
<ui-switch label="Email notifications" name="notify" checked></ui-switch>
<ui-input label="Amount" help="In BRL, two decimals." type="number" name="amount"></ui-input>
```

**Variant G leaves a much milder one**, and it is worth naming precisely rather than waving at:

```html
<ui-switch label="Email notifications" name="notify" checked></ui-switch>
<ui-input label="Amount" help="In BRL, two decimals.">
  <input type="number" name="amount" />
</ui-input>
```

Both rows read `<ui-x label="…">`. They differ only in whether a control is written inside — which
is a difference a reader can see in the markup rather than one they have to know a rule to
predict. That is a weaker objection than the original asymmetry, where the _label_ changed shape
between the two.

The section is kept rather than deleted because the cost was real for the design as first drafted,
and because the residual form of it is the price G asks in exchange for S10 being smaller than S8.

## Decision

**Accepted, as variant F**, with the radios deferred to
[#122](https://github.com/rak200/ui/issues/122).

### What is decided

- **Every form control owns both ends of its own relationship, inside its shadow root.** The label,
  the help and the error are rendered there beside the control, so the IDREFs resolve in one tree
  scope. Measured clean in Blink, Gecko and WebKit.
- **`<ui-field>` is discontinued.** It exists to point scattered ends at each other, and under F
  there are none. This was the objective the proposal was written to serve, stated in the
  Motivation.
- **The label takes an attribute, with `slot="label"` as the escape hatch** for markup an attribute
  cannot hold. Measured: rich content slotted into the rendered label keeps the name, keeps the
  markup, toggles on a click of the text, and does not toggle on a click of a link inside it.
- **`ui-checkbox` and `ui-switch` decline Zag**, under either outcome of #122. What they take on is
  form plumbing with no accessible half at all — see the correction under _Which of the four
  refusals this proposal touches_, which the rollout measured.
- **`ui-input`, `ui-textarea` and `ui-select` move**, which an earlier draft of this section denied.
  That draft rested on variant B, which measures correctly and was read too broadly: B strands the
  control because the label stays outside, not because the control is inside.
- **Groups 3 and `ui-button` are unchanged.** Their slots carry content, and content is the host's.

### What is deferred

**`ui-radio` and `ui-radio-group`.** They are the only elements here whose behaviour meets #122's
own test — a roving tabindex, arrows with wrap, selection following focus, Home and End, the
single-selection invariant, and RTL. This proposal is what makes that issue answerable; it does not
answer it.

### Alternatives rejected, each with the argument that retired it

- **G — both ends in the host's tree**, the component creating the label as a light-DOM child.
  Measured clean, and the objection first raised against it — a component re-injecting nodes
  fighting a framework that removes them — **did not happen** against a real reconciler. It lost on
  two other counts. The hardening that fixes duplication and erasure produces **S10.3**: a stale
  label that survives a control swap, points at a node that is gone, and looks correct. And S9 is
  not neutral — a slot lives in a shadow root, so under G a host needing markup writes its own
  `<label>` and the component wires it, which is `ui-field`'s verbosity without `ui-field`. G
  discontinues the element and keeps its shape; F discontinues both.
- **H — a shadow `<label>` wrapping the slot.** Passes axe with nothing incomplete in all three
  engines, and leaves `label.control` `null`, `control.labels` `0`, and the label inert as a click
  target. It buys a clean gate and loses an affordance — the failure `ARCHITECTURE.md` names as
  being wrong invisibly to everyone who can see.
- **B — the control inside, the label left outside.** A critical `label` violation in all three
  engines, with or without form association.
- **S7, naming a rendered control by copying.** It works for the name and stops at the description,
  because `aria-describedby` is irreducibly a reference. F needs none of it.
- **Attribute-only and slot-only labels.** The first treats _"I accept the
  `<a href="/terms">terms</a>`"_ as exotic; the second returns the common case to verbosity, which
  is most of what this proposal exists to remove.

### Positions rather than findings, recorded as such

- **Autofill is held to be dispensable.** Under F the control lives in a shadow root and the
  standard form machinery does not see it; whether a browser's own filling pierces that is
  unmeasured and, by this position, does not gate the decision.
- **Discontinuing `<ui-field>` is an objective**, not something a measurement produced. The
  measurements establish only that it is reachable.

### What this cost being honest about

The cut moved twice under measurement, and both reversals are recorded where they happened rather
than smoothed: `ui-input` went from _no change_ to _changed_ when variant F was tried, and the
leaning went from G to F when S9 was measured. Two arguments this proposal originally made for
keeping the control slotted — the OS picker and the attribute pass-through list — were withdrawn as
wrong. A fourth correction came from the rollout rather than the study: the cost this proposal
attributed to `ui-checkbox` and `ui-switch` was variant D's and not F's, and is recorded inline
above rather than quietly rewritten. A study that has corrected itself four times is not a study
that has been careful once.

## Rollout

In order. Verification is not listed per step: this repository's floors already require it —
`expectAccessible` per state, 100% coverage, and `thresholds.break: 100` — so a step that named
tests as work would be describing the precondition of every commit here as though it were an
option.

1. **`ui-checkbox` and `ui-switch` to variant F.** The smallest pair, no Zag question, and the two
   that prove the shape. `src/checkbox.ts`'s mask machinery is expected to _simplify_: the state
   becomes the component's own, so `:host([checked])` reaches it and the `::slotted(input:checked)`
   constraint that forced `mask-composite: exclude` is gone. Verify against `forced-colors`, which
   the mask also serves.

   > **Done, and half of that prediction was wrong.** The `::slotted` constraint did go and every
   > rule reads `input:checked` directly — but **`:host([checked])` is not what reaches it, and
   > deliberately not**: a native checkbox's `checked` IDL attribute does not reflect either,
   > because the content attribute is the _default_ a reset returns to. A host reads the live state
   > through `::part(box):checked`. The mask stayed, because it was never about how the state is
   > read: a `data:` URI freezes the mark's colour whoever owns the control.
   >
   > The `forced-colors` verification is what earned its place. The mixed state's override was
   > declared in the shared sheet and lost to the accent declared in `UiCheckbox`'s later one at
   > equal specificity — so the state disappeared under exactly the mode the block exists for. It
   > was invisible to the old suite, which had no mixed-state assertion under `forced-colors` to
   > make.

2. **`ui-input`, `ui-textarea` and `ui-select` to variant F.** `<option>` stays slotted content.
3. **Rehome what `<ui-field>` carries, then remove it.** The vertical rhythm between label, control
   and help is its stylesheet; the error colour is a token `ui-radio-group` retargets through three
   selectors it could not otherwise use. Both need a home first — this is S5, and it is the step
   that can block the removal.
4. **Update `ARCHITECTURE.md`.** _ARIA association is light-DOM only_ is no longer true as stated,
   and it is the document a consumer reads. It should say what the six variants showed: that every
   end of a relationship must share a tree scope, that there are two consistent ways to arrange
   that, and that the middle one is what was measured when the rule was first written.

   > **Brought forward to step 1**, because a rule cannot stay in the consumer-facing document
   > while two shipped components contradict it. The section is now _A relationship needs one tree
   > scope_ and states both arrangements. What is left for this step is pruning the transitional
   > half — which components still take the other arrangement, and why — once there are none.

5. **`ui-radio` and `ui-radio-group`** — only after #122.

Below `1.0.0` a break is a minor, so the versioning cost is low. Whether both call-site shapes
coexist for a release is S6; `<ui-icon>` already dispatches on two shapes and is the precedent if
they should.

## Related

- A **daughter of RFC 0016**, which decided the shape this proposal reopens one premise of —
  Lit for a thin runtime, Zag for behaviour, tokens for the visual language.
- [#122](https://github.com/rak200/ui/issues/122) — the Zag adoption with no candidate left. Same
  question from the other side; see _What it would cost_.

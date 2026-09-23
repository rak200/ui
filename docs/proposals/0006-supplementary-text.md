# RFC 0006 — Supplementary text, and where it is allowed to live

- **Status**: Accepted
- **Scope**: library
- **Created**: 2026-09-11

## Motivation

This is the composition a reader writes by instinct, and it does not work:

```html
<ui-tooltip>
  <ui-input label="Amount" name="amount" type="number"></ui-input>
  <span slot="tip">Two decimals, in BRL.</span>
</ui-tooltip>
```

Measured, with both elements settled:

|                                                   |                        |
| ------------------------------------------------- | ---------------------- |
| the tip's id                                      | `ui-tooltip-1`         |
| `aria-describedby` on the `<ui-input>` host       | `ui-tooltip-1`         |
| `aria-describedby` on the rendered `<input>`      | `help` — its own, only |
| the tip's id resolved from inside the shadow root | **no**                 |

The tip appears, it places itself correctly, and it is never announced. The reference lands on a
host element with no role, and the control the browser focuses never carries it.

**This is #156, and #158 already fixed the half that was dangerous** — the failure was silent, and
the element now says so in the console. What is left is not a defect to repair but a question the
library has not answered: **where is supplementary text allowed to live, now that every control here
draws its own control into a shadow root?**

Three answers were sketched before this proposal, and each is unsatisfying in a way worth recording
before the study begins, because the shape of their dissatisfaction is what produced the design
below.

- **Bridge it.** Each control resolves the host's `aria-describedby` in the host's tree, copies the
  text into its own shadow root, and points at the copy. Nothing changes at the call site. It also
  puts a _copy_ inside the scope and keeps the original outside, held together by an observer —
  which is a workaround around this library's central rule rather than an application of it.
- **Refuse it.** The warning is the answer, and supplementary text uses `help`. This works for a
  form field and has nothing at all to say about `<ui-button>`, `<ui-checkbox>` and `<ui-switch>`,
  which have no `help` to offer.
- **Declare it.** A `description` attribute on each control, which is `help` without the visibility.
  Uniform, and it makes the host write the same sentence twice whenever a visible tip is wanted too.

**The duplication that sinks the third is an artifact of asking the host to write the text.** It is
the tooltip that already holds the sentence. That observation is what this proposal is about.

## Study

### What fails is the reference, and not the relationship

[ARCHITECTURE.md](../../ARCHITECTURE.md), _A relationship needs one tree scope_, already carries the
rule and both arrangements that satisfy it. What is new here is the case it does not cover: a
**second** component, in the host's tree, reaching in.

**Naming is not affected, and that matters more than it first looks.** A name can be carried by
containment, which crosses — the accessibility tree is built from the flattened tree, so a slotted
element really is inside the slot's parent. `<ui-toaster>` is where that distinction was settled,
and `<ui-icon>` is where it pays: an icon-only button takes its name from
`<ui-icon label="Search">`, and without one axe reports an unnamed button at **critical** impact.

So the thing at risk is a description, which is supplementary by construction. The failure is real
and it is not the critical one.

### The reach is a condition, not a roster

Anything that focuses a control inside its own shadow root strands the reference. In this package
that is `<ui-button>`, `<ui-input>`, `<ui-textarea>`, `<ui-select>`, `<ui-checkbox>`, `<ui-switch>`,
`<ui-radio-group>` and `<ui-menu>`, with `<ui-toast>`'s dismissal matching the same condition.

**The list is illustrative and is deliberately not the statement.** `docs/tooltip.md` once said
`<ui-button>` was _the one_ trigger affected, which was true when it was written; the correction
that replaced it with a list of seven was already wrong, because `<ui-menu>` creates its own
`<button>` too. A roster of the elements that draw their own control ages exactly the way the
sentence it replaced aged.

### `help` today, and what it is not

| Element                        | `help` |
| ------------------------------ | ------ |
| `<ui-input>`, `<ui-textarea>`  | yes    |
| `<ui-select>`                  | yes    |
| `<ui-radio-group>`             | yes    |
| `<ui-button>`                  | **no** |
| `<ui-checkbox>`, `<ui-switch>` | **no** |

Where it exists it renders a `<span>` into the component's own shadow root and the control points at
it with `aria-describedby`. Both ends in one scope, no copy, no observer, no engine question — and
it is gated today by the suite that already ships.

**So the mechanism a `description` would need is not new: it is `help` minus the visibility.** That
is the single most important fact in this study, because it means the expensive-looking option costs
almost nothing to build. What it costs is API surface, and the study below is about whether that
surface should exist at all.

### Where a tip can actually be read

The suite measures three: the tip shows on pointer, shows on keyboard focus, and **defers to focus
on a touch screen**, where there is no hover to answer. A form control receives focus when it is
tapped, so on touch the tip of a field is reachable — the objection that a tooltip is a mouse-only
affordance does not hold for the elements that have `help` today.

**One case is not covered by that, and it is written down in this repository already.**
`src/input.ts` records why the error supplements the help rather than replacing it — a rule
`<ui-field>` wrote first and every control inherited when #138 removed it:

> Help text is usually the format requirement, which is exactly the error suggestion the user needs
> in order to recover (WCAG 3.3.3) — dropping it at the moment it becomes useful is the opposite of
> helping.

A format requirement behind a hover is one the reader must summon _while_ reading the error that
sent them looking for it. That is the strongest argument against making a tip the only home for
supplementary text, and `docs/tooltip.md` states the general form of it in as many words:
**never make the tip the only place information exists.**

### Question 1, and the criterion it was aimed at does not say what I said

The objection this proposal opened with was that discontinuing visible `help` moves the format
requirement behind an interaction, against **WCAG 3.3.3 Error Suggestion**. Read normatively, that
is the wrong criterion and the objection is overstated.

**3.3.3 is silent on presentation.** _"If an input error is automatically detected and suggestions
for correction are known, then the suggestions are provided to the user."_ Its Understanding
document addresses the existence and the content of a suggestion, and says nothing about duration,
persistence, or where it sits relative to the error.

**The criterion that governs an instruction is 3.3.2 Labels or Instructions**, and its Understanding
document permits this design in as many words:

> Content authors may choose to make such instructions available to users only when the individual
> control has focus especially when instructions are long and verbose.

So focus-revealed instruction is a named, sanctioned pattern rather than a tolerated one.

**What 3.3.2 does impose is the constraint that matters here**, and it is not about visibility over
time but about audience:

> It is possible for controls and inputs to have an appropriate accessible name or description
> (e.g. using `aria-label="..."`) and therefore pass Success Criterion 4.1.2, but to still fail this
> success criterion (if the labels or instructions aren't presented to all users, not just those
> using assistive technologies).

An instruction carried **only** as an accessible description fails. It has to be presented visually
too — which the tip does, and which is the half of this design that has to keep working.

### Measured: the affordance is not a flash

|                                      |         |
| ------------------------------------ | ------- |
| tip open before focus                | no      |
| tip open on focus                    | **yes** |
| tip open while typing into the field | **yes** |
| tip open after blur                  | no      |

Focus opens it, and it **stays open for as long as the control is in use** — the instruction is in
view for the whole time the reader is acting on it, not for the moment they arrive. That is the
fact the objection assumed away.

### Measured: and it lands on the neighbour

Two `<ui-input>`s stacked, the lower one wrapped in a `<ui-tooltip>`, the lower one focused:

|                               |                                   |
| ----------------------------- | --------------------------------- |
| placed                        | `block-start` — above the trigger |
| covers its own label          | no                                |
| **covers the field above it** | **yes**                           |

The tip is a popover in the top layer, so while it persists it sits over the layout — and in a
stacked form what is above a field is the previous field, its message included. The cost of making
the tooltip the sole carrier is therefore **geometric rather than normative**: a form that needs
two instructions read together cannot have them, and a form that needs one while the field above it
is in error obscures the error to show the instruction.

**This is the finding that decides the middle position**, which the Decision below no longer records
as unstudied. An instruction a form needs _in view alongside others_ wants to be in flow; an
instruction a reader needs _while acting on one control_ is better as a tip, and measurably so.

### What has to be restated, and why it is not a quiet drop

`docs/tooltip.md` says **never make the tip the only place information exists**. This proposal makes
it exactly that, so the rule is contradicted unless it is rewritten — and the rewrite is not a
weakening.

That rule was written about a **decorative** tip: text with no relationship to the control, present
only while a pointer happens to rest somewhere. Under this proposal the text stops being decoration.
It becomes the control's **description** — in the accessibility tree at all times, announced on
focus, and visually present whenever the control is in use. The rule has to name which of the two it
governs, because the two are not the same object any more.

### What the platform offers, and what each costs

- **`aria-describedby`** — an IDREF, so one tree scope, so the failure this proposal starts from.
- **`aria-description`** — a string, therefore no tree scope at all, and the obvious escape.
- **ARIA through `ElementInternals`** — expresses the same thing more politely, and `src/icon.ts`
  already rejected it with an argument that applies here unchanged: _ARIA on internals is one more
  feature this suite can only verify in one engine, and being wrong there is invisible to everybody
  who can see._

**`aria-description` cannot be weighed here, and that is measured rather than assumed.** Probing the
engines for an instrument:

|                                            | chromium          | firefox           | webkit                  |
| ------------------------------------------ | ----------------- | ----------------- | ----------------------- |
| `page.accessibility`                       | `undefined`       | `undefined`       | does not launch locally |
| `ariaSnapshot()` of `aria-description="…"` | `- button "Save"` | `- button "Save"` | —                       |
| `ariaSnapshot()` of `aria-describedby`     | `- button "Send"` | `- button "Send"` | —                       |

Playwright has removed its accessibility-tree API, and `ariaSnapshot()` carries the accessible
**name** alone — neither description appears, referenced or copied. There is no instrument in this
toolchain that can tell whether a description reaches a reader, in one engine let alone three. By
the rule `docs/select.md` already applies to `appearance: base-select`, a feature that cannot be
verified is not adopted.

### The platform is solving this, and that changes what to build

The cross-root ARIA problem is a known platform gap with three named proposals against it —
**cross-root ARIA delegation**, **cross-root ARIA reflection**, and **Reference Target**, which is
the one that has advanced. Reference Target lets a component nominate an element inside its shadow
root as the resolution target for references aimed at the host, so an `aria-describedby` written
from the outside would simply land on the right node.

Status, as reported by its documentation rather than measured here: implemented in Chromium behind
an experimental flag, a positive position from Mozilla, and named in Interop 2026. **That is not
broad availability**, and nothing here should be built on it — but it is close enough to change the
shape of what is worth building, because the day it lands the tooltip's existing `aria-describedby`
starts working with no change at this library's call sites at all.

**The design consequence is sharp**: whatever carries the text across today should be **cheap to
retire**. A public `description` attribute on eight elements is a deprecation cycle when the
platform catches up. An internal protocol between two components is a deletion.

### Measured: a reference is live, and a copy is not

All three candidates hand over **text**, and what decides between them turns out to sit underneath
all three rather than between them. The tip's sentence, changed three ways with both elements
settled:

| The sentence is…               | `aria-describedby` | the id resolves to | `slotchange`  |
| ------------------------------ | ------------------ | ------------------ | ------------- |
| edited through `textContent`   | unchanged          | **the new text**   | **not fired** |
| grown by a node appended to it | unchanged          | **the new text**   | **not fired** |
| replaced, element and all      | unchanged          | the new text       | fired         |

A reference costs nothing to keep fresh because there is nothing to keep: the id points at the
sentence, and the sentence is the one the host edited. A copy is fresh only until the original is
touched — and the signal this element already listens to reports **neither** in-place edit. So a
handoff carrying text owes a `MutationObserver` over the tip, `characterData` and `childList`
through the subtree, and owes it whatever shape it takes.

**That reframes the objection to the bridge, and the correction belongs here rather than quietly.**
The Motivation rejected the bridge for holding a copy together with an observer; this measurement
says every design that leaves the reference behind does exactly that, this proposal's included.
What separates them is **where the observer lives**. The bridge put one in every control, watching a
node in a tree that control had to resolve an id in first. Here there is one per tooltip, watching
its own slotted child, and it is gone when the tooltip is.

### Measured: `ElementInternals` is refused by six of the eight

It is on the candidate list, and it answers a different question from the other two — internals are
how an element says something about itself, not how something reaches it from outside. That is a
reason to be suspicious of it rather than a reason to strike it. The measurement is the reason.
`attachInternals()`, called from outside the element:

| Element                                                                                          | From outside                     |
| ------------------------------------------------------------------------------------------------ | -------------------------------- |
| `<ui-button>`, `<ui-menu>`                                                                       | **attaches**                     |
| `<ui-input>`, `<ui-textarea>`, `<ui-select>`, `<ui-checkbox>`, `<ui-switch>`, `<ui-radio-group>` | **refused**, `NotSupportedError` |
| a custom element not yet upgraded                                                                | refused, `NotSupportedError`     |
| a native `<div>`                                                                                 | refused, `NotSupportedError`     |

The first row is worth naming on its own: an outsider really can claim the internals of a custom
element that never claimed its own, and write `ariaDescription` on it without that element knowing.
What rules the mechanism out here is the second row. Every form-associated control already holds its
internals and `attachInternals()` throws on the second call, so the mechanism is available on exactly
the two elements that do not need it and refused by the six that do. A uniform answer for eight
elements cannot be built on a call six of them refuse.

### Measured: reaching into the trigger's root works until the trigger disagrees

`#complain()` already queries `trigger.shadowRoot`, so the cheapest-looking shape is the one with no
handoff at all: the tooltip appends the sentence into the trigger's own root and points the inner
control at it. Both ends in one scope, no cooperation required, nothing to delete later. Measured on
`<ui-input>`:

|                                             |                                |
| ------------------------------------------- | ------------------------------ |
| the appended node resolves inside the root  | yes                            |
| `aria-describedby` right after the write    | the carried id                 |
| after a re-render that changes nothing else | the carried id — **survives**  |
| after `error` arrives                       | **`error`**                    |
| after `error` clears                        | **`null`**                     |
| the carried node, throughout                | still there, describing nobody |

It survives the re-render for a reason that is not reassuring: Lit writes an attribute only when the
bound value changed, and the component's own description list was empty both times. The moment that
list changes, the component writes its own answer over the top — with no error, and with the carried
node still sitting in the root.

**So it fails at the worst available moment**, which `src/input.ts` already named from the other
direction: help text is usually the format requirement, which is exactly what the reader needs once
the error arrives. This shape carries the instruction right up until the error appears, and then
takes it away.

### What decides between the two that are left

A public `description` property and a protocol. Two measurements separate them, and the third thing
is not a measurement at all.

**A property write is silent when nobody takes it.** Written before the element's definition is
registered:

|                                      | a plain `HTMLElement`  | a `LitElement`   |
| ------------------------------------ | ---------------------- | ---------------- |
| the accessor sees the early write    | **no**                 | yes              |
| an own property shadows the accessor | **yes, permanently**   | no               |
| reading the property back            | **the shadowed value** | the stored value |

Lit recovers it, so nothing in this package would break. A control someone else wrote does not, and
its failure is the one this proposal exists to remove: the write appears to land, reads back
correctly, and reaches nothing. Publishing a property publishes that failure mode to everyone who
implements it without Lit.

**A dispatch reports whether anyone took it, in the same call.**

|                                                            |             |
| ---------------------------------------------------------- | ----------- |
| `dispatchEvent` with nobody listening                      | **`true`**  |
| `dispatchEvent` where a listener called `preventDefault()` | **`false`** |

That is the whole of the advertisement this design asked for, and it arrives with no registry, no
capability list and no roster — which matters, because this proposal already recorded that **a roster
ages exactly like the sentence it replaced**. `#complain()` narrows to one condition: the dispatch
came back uncancelled.

**And the third thing is not a measurement.** A public `description` property is option three from
the Motivation, re-created as a side effect. That option was rejected for making the host write the
same sentence twice, and a property that exists publicly is one a host will write to directly — the
duplication arriving through the back door. A protocol that cannot be reached from a template cannot
be used that way.

**What the protocol costs, stated here rather than discovered later.** A trigger someone else wrote
cannot opt in without reading this package's source, and #158's warning fires at it forever. That is
deliberate, and it is the same answer `src/reference.ts` gives about a helper kept internal on
purpose; if it ever needs to change, naming the event publicly is additive and costs no deprecation
cycle. A host can also listen for the event and cancel it, which would break the handoff silently —
nothing prevents that, and it is the exposure every custom event has.

### Measured: the dispatch inherits the property's timing problem, and has no signal to recover

The case against a public property is that a write before the element upgrades is silent. A
dispatch before the element upgrades is silent in the same way, and it is worse here, because the
design reads the return value as an answer. Dispatched at an element whose definition has not
arrived:

|                                                 |                                |
| ----------------------------------------------- | ------------------------------ |
| the element, before its definition              | an `HTMLElement`               |
| the dispatch returns                            | **`true`**                     |
| the upgraded element hears the earlier dispatch | **no**                         |
| a dispatch after the upgrade returns            | `false` — the listener took it |

`true` is what an element that accepts no text returns, so the two are indistinguishable and
`#complain()` warns at a trigger that would have accepted. **That is the property's failure mode
arriving at the protocol**, and it has to be answered here rather than assumed away.

**What decides the answer is that no slotchange reports the upgrade.** The same fixture, watched
from a tooltip's own hooks:

| the trigger's definition | at `connectedCallback` | at either `slotchange` | when the definition lands |
| ------------------------ | ---------------------- | ---------------------- | ------------------------- |
| already registered       | **upgraded**           | upgraded               | —                         |
| arriving later           | `HTMLElement`          | `HTMLElement`          | **nothing fires**         |

The ordinary case — a host importing this package, so both definitions are registered before the
markup is parsed — is already safe at the earliest hook there is. The late case has no recovery at
all: no event fires, so a cadence built only on `slotchange` loses the handoff permanently and
leaves a warning saying the trigger refused it. `customElements.whenDefined()` is the only signal,
and it is a requirement rather than a refinement.

### Measured: the trigger's own slot reports a replacement, and nothing listens to it

`#associate` is wired to the tip's slot alone. The default slot fires too:

| what changed                      | default slot | tip slot  |
| --------------------------------- | ------------ | --------- |
| first assignment                  | **fires**    | **fires** |
| the **trigger** is replaced       | **fires**    | silent    |
| the tip's text is edited in place | silent       | silent    |
| the tip is removed                | silent       | **fires** |

So a trigger a framework re-renders is announced, and this element hears none of it — which is the
same sentence `#associate`'s own docblock already makes about the tip: a tip that is only wired the
first time is one that stops being announced at a moment nothing reports. The third row is the
in-place edit this proposal already measured, restated here because the four rows are one decision.

### Measured: the reference is already left behind when the tip goes

Before any protocol exists. A native trigger, described, with the tip then removed:

|                                           |                    |
| ----------------------------------------- | ------------------ |
| `aria-describedby` while the tip is there | `ui-tooltip-1`     |
| after the tip is removed                  | **`ui-tooltip-1`** |
| that id resolves to anything              | **no**             |

`#associate` returns at its guard when there is no tip, so the attribute it wrote is never unwritten
and the trigger is left describing nothing. **This is the fifth blank's failure arriving a step
early**, on the path this proposal was not going to touch: a control that keeps pointing at text the
reader can no longer summon reads as current. A withdrawal is therefore owed on both paths, and the
protocol is not what introduces the obligation — it is what makes it visible.

### Measured: 1.4.13's three requirements are gated on the one trigger the redesign removes

Dismissible, Hoverable and Persistent each have a test today, and all three run against a native
`<button>`. That was the right fixture while a tip was decoration. Under this proposal the trigger is
one of the eight, and the two that hold more than one focusable node answer differently.

**Dismissal is not remembered. It is a state that any focus crossing resets** — `#hide()` clears the
shown flag and the next `focusin` shows the tip again. So whether Escape works at all depends on
something the tooltip never asks about: whether focus subsequently leaves its subtree and comes back.

| Focus moves…                                                 | at the tooltip        | the dismissal |
| ------------------------------------------------------------ | --------------------- | ------------- |
| between two radios inside one shadow root                    | nothing fires         | **holds**     |
| into a field, and the reader types                           | nothing fires         | **holds**     |
| out of the trigger and back, because a component put it back | `focusout`, `focusin` | **undone**    |

The first row is the one worth measuring rather than assuming: focus really moved — radio 0 to radio
1 — and in the whole exchange `focusin` fired **once** and `focusout` **never**. The platform fires
no focus event at an ancestor when focus moves within a single shadow tree, so a dismissed tip stays
dismissed on `<ui-input>`, `<ui-textarea>`, `<ui-select>`, `<ui-checkbox>`, `<ui-switch>` and
`<ui-radio-group>`.

### Measured: on `<ui-menu>` the tip cannot be dismissed at all

`<ui-menu>` renders its trigger into its shadow root and leaves the items slotted, so opening it
moves focus **out** of the menu's root and into the tooltip's own subtree — a crossing in each
direction. The timeline, with a tip open and the menu opened from the keyboard:

```
focusin → [tip open] → focusout → focusin → [tip open] → keydown → focusout → focusin → [tip open]
```

The `keydown` is the Escape. It hides the tip; the platform then closes the menu; `#give()` returns
focus to the trigger it rendered, and that restoration re-opens the tip **in the same turn as the
key that dismissed it**. There is no sequence of keys that leaves the tip shut while the reader is
still on the control.

### Measured: and inside a dialog, the same key takes the dialog with it

|                                                    |                 |
| -------------------------------------------------- | --------------- |
| a tip open on a field inside an open `<ui-dialog>` | shown           |
| after one Escape — the tip                         | dismissed       |
| after the same Escape — the dialog                 | **also closed** |

1.4.13 asks for a mechanism that dismisses the additional content **without moving pointer hover or
keyboard focus**. Closing a modal returns focus to whatever opened it, so the only mechanism
available moves focus — and takes the form with it. The requirement is not met, and the reader pays
for reading an instruction by losing the dialog.

**The two failures are one defect seen from opposite ends.** `#dismiss` hides the tip without
claiming the key, so Escape is owned by nobody: on `<ui-menu>` the layer below acts and undoes the
dismissal, and inside `<ui-dialog>` the layer below acts and destroys the context. Neither is
created by this proposal — both are in the component today. What the proposal changes is the cost: a
decoration that overstays is untidy, and an instruction that cannot be moved is the field above it
obscured with no way out.

**The exemption that could have excused all of it is already closed.** Dismissible does not apply to
content that "does not obscure or replace other content" — and the measurement above records that
the tip covers the field above its trigger. There is no path here that avoids owing a dismissal.

### Measured: the key can be claimed, on both layers

A `keydown` taken in the capture phase, `preventDefault()` and `stopPropagation()` together:

| The layer below                   | key claimed    | key left alone |
| --------------------------------- | -------------- | -------------- |
| `<ui-dialog>`, a modal `<dialog>` | **stays open** | closes         |
| `<ui-menu>`, a `popover="auto"`   | **stays open** | closes         |

So the tooltip can take Escape when it actually had something to dismiss and leave it for the layer
below when it did not, which is the layered convention readers already have: the topmost thing
closes first, and the next key reaches the next thing down. It costs one flag and no new API.

### Measured: how much it covers, and what each reader has to do about it

Three stacked fields, the tip on the middle one, opened by focus. The viewport is the suite's own —
414 × 896, which is the narrow end and therefore the unkind one:

| the tip                         | height | covers the neighbour       | covers its own trigger |
| ------------------------------- | ------ | -------------------------- | ---------------------- |
| one line, placed `block-start`  | 29px   | **70%** of the field above | **0%**                 |
| one line, flipped `block-end`   | 29px   | **77%** of the field below | **0%**                 |
| three lines, a real instruction | 86px   | **81%** of the field above | **0%**                 |

**It never covers the trigger**, on either side and at any height, because `place()` puts the box
flush against the anchor's edge and the gap rule translates it further away. That is the measurement
that matters most and it is the one nobody asked for: SC 2.4.11 is about the focused component being
hidden, and the focused component is the one thing here that cannot be.

**What it does cover is the neighbour, and by most of the neighbour.** With the tip open,
`elementFromPoint` at the covered field's own centre returns the tip.

**Both readers can clear it, by different mechanisms.** A pointer reader clears it on the way:

```
tip:open
tip<-pointerenter   tip<-pointerleave   tip:closed
a<-pointerenter     a<-pointerdown      b:focusout->input     a<-click
```

The travel toward the covered field is itself what closes the tip, so the obstruction is gone before
the click lands — `elementFromPoint` returns the field again, and focus ends on it.

A keyboard reader has no travel, and Escape is what they have instead:

|              | tip            | `elementFromPoint` at the covered field | focus                 |
| ------------ | -------------- | --------------------------------------- | --------------------- |
| on focus     | open, 188..217 | the tip                                 | the trigger           |
| after Escape | closed         | **the field**                           | **still the trigger** |

**That is 1.4.13's Dismissible doing exactly the job it is written for**, and it is worth noting
that it did not exist when this question was asked: the dismissal was neither remembered nor
survivable until #169.

### Measured: there is no third side to place it on

The candidate that would avoid the neighbour entirely is an inline placement — the tip beside the
field rather than over the one above or below it. At this viewport there is no room for it:

|                         | px      |
| ----------------------- | ------- |
| viewport width          | 414     |
| the trigger occupies    | 65..250 |
| the tip needs           | 281     |
| room after the trigger  | 164     |
| room before the trigger | 65      |

`place()` would pull it back inside the viewport and it would land over the field again, wider than
before. A wide screen has the room; making the side depend on the width is a conditional placement,
which is the one thing `src/placement.ts` was written not to have — it takes four boxes and returns
one answer, and a component with two placements is wrong in one of them.

## Proposed design

### The rule, which the library already applies elsewhere

**A reference wherever it resolves, and text only where it cannot.** This is the same order
every form control here takes between `<label for>` and `aria-labelledby` — the platform's own
association first, because it does more, and the fallback only where the platform's refuses to
reach.

Applied to `<ui-tooltip>`, that is two paths and one rule:

- a **native trigger** keeps `aria-describedby`, unchanged;
- a **trigger that focuses inside its own shadow root** receives the tip's **text**.

### The tooltip generates the description

The host writes the sentence once, where it already writes it:

```html
<ui-tooltip>
  <ui-button>Save</ui-button>
  <span slot="tip">Saves without closing the dialog.</span>
</ui-tooltip>
```

`<ui-tooltip>` hands the text to the trigger, and the trigger renders it into its own shadow root
and points its control at it. Both ends in one scope, by the same mechanism `help` already uses.

**The handoff is a protocol rather than public API**, for the reason the study ends on: it is a
deletion when Reference Target arrives, not a deprecation. A component that accepts supplementary
text advertises it; a component that does not is left alone and the warning from #158 still fires.
**The advertisement is the dispatch's own return value.** The handoff is a **cancelable event**
carrying the sentence, dispatched at the trigger; a control that accepts it renders the text into
its own shadow root, points its control at it, and calls `preventDefault()`. The study measures why
it is that and not the alternatives: it is the only candidate that reports its own failure, the
only one that is a string in two files rather than a symbol in a published type, and the only one
available on all eight elements.

**The tooltip owns a `MutationObserver` over the tip**, because the sentence it hands over is a
copy and `slotchange` reports an in-place edit to neither the text nor the children. One per
tooltip, watching its own slotted child, gone when the element is.

### The handoff, written down

Five blanks, and they turn out to be one decision rather than five. The payload is what ties them:
once the sentence is a string whose empty value means _absent_, the withdrawal needs no second
event and the cadence needs no accumulation rule.

**The name is `ui-describe`, and it is written as a literal in every file that names it.** The two
internal event names this package already has — `ui-radio-changed` and `ui-option-changed` — are
module-level constants read by both ends in one file, and each carries a
`Stryker disable next-line StringLiteral` saying the mutant is equivalent because nothing outside
the module names it. **This one is the opposite case.** A trigger someone else wrote matches the
literal, so the name is a contract with code the suite cannot see, and a shared constant would make
every mutant on it equivalent _by construction_ — earning that same disable, and taking the one
string in this package that must not drift out of the floor's reach. Written at each end, a mutant
on either breaks the handoff and the test that exercises it kills it.

**The build made that cheaper than this paragraph predicted, and the argument is unchanged.** It
was written expecting one literal per element — seven, the eight triggers being six classes. The
second element to take the handoff showed the listener is identical wherever it goes, so it moved
into `src/description.ts` and the package now names the event **twice**: once where the tooltip
dispatches it and once where the carrier listens. Two independent literals, each still graded,
because neither is a constant the other reads — which was the whole of the objection to sharing one.
And the literal an outside implementer writes is the same one either way. The verb is imperative because the event is cancelable: this one asks, where `ui-close` and
`ui-dismiss` report.

**The payload is a `CustomEvent<string>`, and the sentence is `detail`.** An `Event` subclass has to
be exported to be typed where it is read, which is the published symbol point 1 exists to avoid; a
`CustomEvent` is constructible from platform primitives alone, so an outside implementer can
exercise their own trigger without importing anything from here. And `detail` is a bare string
rather than an object because `help` and `error` are both `= ''` already, and `described()` already
drops the empty ones — the handed sentence is a third field of that shape, so `''` is the
withdrawal and no new vocabulary enters. An object would need a second decision, whether
`{ text: '' }`, an absent field and an absent `detail` mean the same thing, to say what one
character already says.

**The most recent dispatch wins, and a trigger never accumulates.** A tooltip has one tip, so this
is a value being written and not an item being added — and accumulation would owe a withdrawal per
sentence, which a tooltip has nothing to identify one by. It is dispatched at four points, and the
fourth is not a refinement:

1. **every `#associate`** — first assignment and the tip slot's `slotchange`, both wired today;
2. **the default slot's `slotchange`, which is not wired today** — measured, a replaced trigger
   fires it and this element hears nothing;
3. **every `MutationObserver` callback**, which is where the in-place edits arrive, neither of them
   firing a `slotchange`;
4. **`customElements.whenDefined(trigger.localName)`**, where the trigger's name carries a hyphen
   and no definition has arrived — measured, the upgrade fires nothing and there is no other
   signal, so a cadence built on `slotchange` alone loses the handoff permanently. **`#complain()`
   waits on the same promise**, because until the definition lands an uncancelled dispatch does not
   mean refusal.

**A withdrawal is `detail: ''` on the same event**, dispatched when the tip is removed or emptied
and at `disconnectedCallback`, with the next `connectedCallback` re-dispatching — the arrangement
`#listeners` already takes in this file, and for the same reason: a tooltip a framework moves in the
tree has to come back able to do its job. **The reference owes the same withdrawal and does not make
it today**, measured above, so step 1 carries both halves: a protocol that withdraws correctly
beside an IDREF that does not is a component that is right in one half.

**The sentence is described last — `error`, `help`, then it** — rendered under `id="description"`
and composed **into the list**, never written into the attribute. The order already in the code is
urgency and is deliberately not the visual order: `frame()` renders `help` above `error`, and
`described()` announces `error` first, because the error is what sent the reader looking. The
handed sentence is supplementary by construction, which is what this study establishes before it
starts, so it follows both. Under the recommendation `help` is empty and the tip lands exactly
where `help` would have; the two coexist only in the case Question 1 kept `help` for, and there the
one already in flow is announced first.

### `help` stops being the recommendation, and stays a capability

This is the objective rather than a consequence, and it is the part of this proposal that is not
forced by #156. It is also the part the study narrowed twice.

A permanent block of text under every control is a layout decision the library makes on the host's
behalf, and it is the wrong thing to **recommend**: it is always visible whether or not it is
wanted, it pushes every field apart, and it exists in four elements and not in the other three, so
the library is already inconsistent about it. Supplementary text becomes the tooltip's, uniformly,
for all eight.

**Discontinuing it outright is what the measurement retired.** A persistent tip covers the field
above it, so a form that needs two instructions read together, or one read beside a neighbour's
error, cannot have them from a popover. `help` stays available for exactly that.

**And there is no default to discontinue**, which this proposal said there was for as long as it
went unread against the code:

```ts
help = '';
…
this.help === '' ? nothing : html`<span class="help" id="help" part="help">${this.help}</span>`
```

The property defaults to the empty string and the span is rendered only when it is not — and the
`aria-describedby` list is composed the same way, from the ids that are non-empty. **A control draws
`help` because the host wrote it, and never on its own.** An `<ui-input>` with no `help` renders no
block and points at nothing, today.

So what changes is which of the two a consumer is told to reach for, and nothing else. It is a
change of documentation: **no `minor`, no deprecation cycle, no line of `src/`.** The rollout
carried it as a release-shaped step and no longer does.

**`error` stays visible and is not touched.** WCAG 3.3.1 asks for the error to be identified in
text, and an error behind a hover is not identified.

### Alternatives considered

- **The bridge**, rejected above: a copy inside the scope with the original outside, held by an
  observer, is a workaround around the rule rather than an application of it — and it would be
  dead machinery the day Reference Target lands.
- **`aria-description`**, rejected: no instrument here can verify it, and `src/icon.ts` already
  refused ARIA that only one engine can confirm.
- **Status quo**, rejected as incomplete rather than wrong: it leaves `<ui-button>`,
  `<ui-checkbox>` and `<ui-switch>` with nowhere to put supplementary text at all.
- **Reaching into the trigger's shadow root**, rejected on measurement: it needs no cooperation and
  no API at all, and it is silently overwritten the moment the component writes its own
  `aria-describedby` — which is when an error arrives, the moment the instruction is most needed.
- **A public `description` property**, rejected twice over: it is the Motivation's third option
  arriving through the back door, and it publishes a failure mode to any implementer not using
  Lit.
- **Waiting for Reference Target**, rejected on timing alone: behind a flag in one engine is not
  something to ship a library's accessibility story on. It is, however, the reason the handoff is
  designed to be deleted rather than deprecated.

### What step 2 is actually extending

The eight triggers differ by **whether they compose an `aria-describedby` list today**, and that is
three categories rather than seven shapes:

|                                    | element                        | the node that carries the description                                                                 | what the handoff costs there                                                   |
| ---------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **has a composer**                 | `<ui-input>`, `<ui-textarea>`  | the rendered control, via `described()` — `protected` and shared by both                              | one id, in one method                                                          |
|                                    | `<ui-select>`                  | the rendered box, via `#described()`; the slotted choices are not described                           | one id                                                                         |
|                                    | `<ui-radio-group>`             | **the `<div role="radiogroup">`**, via `#described()` — not each radio                                | one id                                                                         |
| **has the attribute, no composer** | `<ui-checkbox>`, `<ui-switch>` | the rendered input, inline: `error === '' ? nothing : 'error'`                                        | **a composer first** — there is no `help` here, so nothing ever had to compose |
| **has neither**                    | `<ui-button>`                  | the rendered `<button>` carries no `aria-describedby` at all                                          | the path itself, which is step 1                                               |
|                                    | `<ui-menu>`                    | its rendered trigger carries `aria-haspopup`, `aria-expanded` and `aria-controls`, and no description | the path, again                                                                |

**So `<ui-menu>` is step 1's twin and not one of step 2's seven.** It stays in step 2 anyway: step 1
exists to prove the protocol with the fewest confounders, and `<ui-menu>` renders its own trigger,
drives a popover, holds an `aria-controls` reference and hand-writes the focus return across a
shadow boundary. A protocol that fails there first would not say whether the protocol or the menu
was at fault. `<ui-button>` has none of that, which is the reason this proposal already gives for
choosing it.

**Step 2 therefore has an order, from the most exposed to the cheapest**, rather than a list:

1. `<ui-menu>`, which reuses step 1's new path on the hardest element — if the menu's complexity
   breaks the protocol, that is worth learning at the start of step 2 rather than at the end;
2. `<ui-checkbox>` and `<ui-switch>`, the only real refactor here;
3. the four with a composer, where each addition is one id — and `<ui-input>` and `<ui-textarea>`
   are one edit, because `described()` is shared.

**Naming the second of those now is what this table is for.** It is the one item that is not "add an
id", and an item like that discovered mid-step is what tempts someone into writing the handed
sentence straight into the attribute instead of into the list — at which point `error` and the
instruction overwrite each other rather than coexisting, which is the failure `#described()` exists
to prevent everywhere else.

### What this design did not yet say

Seven things, and they were not research: six were blanks where a choice goes, and the seventh was
a sentence that contradicted the code it described. **All seven are closed.** They were numbered so
each could be taken on its own, and the last five were taken together because they are one
decision — _The handoff, written down_ above carries them, and the paragraph there says why they do
not separate.

1. ~~**The event has no name.**~~ **Closed: `ui-describe`, as a literal at each end.** The two
   internal event names here are shared constants carrying a `Stryker disable` for being equivalent
   by construction, and this name is the opposite case — a trigger someone else wrote matches the
   literal, so it is the one string in this package that has to stay inside the mutation floor's
   reach.

2. ~~**Nor a payload shape.**~~ **Closed: a `CustomEvent<string>`, the sentence in `detail`.** A
   subclass has to be exported to be typed where it is read, which is the published symbol point 1
   exists to avoid. The string is bare rather than wrapped because `help` and `error` are already
   `= ''` and `described()` already drops the empty ones.

3. ~~**When it is dispatched, and re-dispatched.**~~ **Closed: the most recent wins, at four
   points.** A tooltip has one tip, so this is a value written rather than an item added. Two of
   the four are wired today; the third is the observer; **the fourth is
   `customElements.whenDefined()`**, and it is the one the measurement added — a trigger whose
   definition arrives late fires no `slotchange`, so a cadence built on those alone loses the
   handoff permanently while warning that the trigger refused it.

4. ~~**How a description is withdrawn.**~~ **Closed: `detail: ''` on the same event**, at the tip's
   removal and at `disconnectedCallback`. The measurement moved this one out of the protocol: the
   IDREF path already leaves a removed tip's id on the trigger today, so the withdrawal is owed on
   both halves and step 1 carries both.

5. ~~**Where the sentence lands in `aria-describedby`.**~~ **Closed: last — `error`, `help`, then
   it**, composed into the list and never written into the attribute. The order in the code is
   urgency rather than visual order, and a sentence that is supplementary by construction follows
   both.

6. ~~**Step 2 of the rollout treats seven different shapes as one.**~~ **Closed**, and the code had
   already answered most of it — including both questions asked here. `<ui-radio-group>` describes
   the `<div role="radiogroup">` and not each radio, decided when the component was written;
   `<ui-select>` describes the box, and its slotted choices are not described at all. What the
   elements differ by is not their shape but **whether they compose an id list today**, which is
   three categories rather than seven shapes. _What step 2 is actually extending_ above carries it.

7. ~~**`help` has no default to discontinue.**~~ **Closed.** There was never a default: `help = ''`
   and the span is rendered only when it is not, so a control draws it because the host wrote it.
   The step is a change of documentation — no `minor`, no deprecation cycle, no line of `src/`.
   _`help` stops being the recommendation_ above carries it now, and the rollout has one step fewer.

**Nothing here is left open**, and the rollout's first step can now be written. What the five
changed in it is one line and one obligation: the trigger's own slot has to be listened to, and the
withdrawal is owed on the reference as well as on the protocol.

## Decision

**Accepted**, and what it commits to is narrower than what this proposal opened with. The four
questions are answered below and the seven blanks _Proposed design_ used to close on are all
filled — the last five in one pass, because they were one decision rather than five.

**What is built** is the handoff: a cancelable `ui-describe` carrying the tip's sentence, dispatched
at the trigger, accepted by a control that renders the text into its own shadow root and calls
`preventDefault()`. The tooltip owns a `MutationObserver` over its own tip, because the sentence
crosses as a copy. `help` stops being what a consumer is told to reach for and stays available for
the two cases a popover measurably cannot serve.

**What is not built** is most of what was considered. No public `description` property, so no API
surface and no deprecation cycle. No `aria-description`, which no instrument in this toolchain can
verify. No bridge, no reach into the trigger's root, and no waiting for Reference Target. And no
release: the `help` step turned out to be documentation, so nothing here cuts a version on its own.

**What it costs, named here rather than discovered in the rollout.** This is machinery with a known
expiry — the day Reference Target lands, the tooltip's existing `aria-describedby` starts working
and the handoff becomes deletable. That is not an argument against building it, and it is the
argument that chose its shape: a protocol is a deletion where a published property would have been
a deprecation. The other cost is that a trigger someone else wrote cannot opt in without reading
this package's source, and #158's warning fires at it until it does.

**What this does not decide** is when any of it is built. The rollout below is ordered and each step
makes the next possible; none of them is scheduled here.

**Question 1 — does discontinuing visible `help` hold?** Normatively, yes, and the criterion the
objection named was the wrong one. 3.3.3 says nothing about presentation; 3.3.2's Understanding
document explicitly permits an instruction available only on focus. The tip is not a flash either:
measured, it opens on focus and stays open for as long as the control is in use.

**What blocks it is geometry rather than WCAG.** The tip is a popover in the top layer and places
`block-start`, so a persistent one covers the field above it — measured, on two stacked controls,
where what it covered was the previous field's own message. That retires the **all-or-nothing**
form of this proposal and promotes the middle position from unstudied to recommended:

- `help` **discontinued as the default**, because a permanent block of text under every control is a
  layout decision the library should not make on the host's behalf;
- `help` **kept as a capability**, because a form that needs two instructions read together, or one
  read beside a neighbour's error, cannot have them from a popover.

That is a smaller change than the one this proposal opened with, and it is the one the measurements
support.

**Question 2 — what shape is the handoff?** A **cancelable event** carrying the sentence, dispatched
at the trigger and accepted with `preventDefault()`. Three candidates went in, and the measurements
took two off the table before the third had to be argued with:

- **`ElementInternals` is refused by six of the eight.** Every form-associated control here already
  holds its own internals and a second `attachInternals()` throws, so the mechanism is available on
  `<ui-button>` and `<ui-menu>` and on nothing else that needs it.
- **Reaching into the trigger's root is overwritten by the trigger**, silently, the moment the
  component writes its own `aria-describedby` — which is when an error arrives.
- **A public property fails quietly and duplicates loudly.** Written before an element upgrades, it
  shadows the accessor permanently on anything not built on Lit, reading back a value it never
  delivered; and a `description` a host can write directly is the Motivation's third option, which
  this proposal rejected for making the host write the sentence twice.

The event answers both halves in one call: `dispatchEvent` returns `false` exactly when someone took
it, so the advertisement needs no roster — and this proposal already recorded that a roster ages
exactly like the sentence it replaced.

**What the answer costs, which is not nothing.** The sentence crosses as a copy, so the tooltip owes
a `MutationObserver` over its own tip: `slotchange` fires for a replaced element and for **neither**
in-place edit, measured. That is the machinery the Motivation held against the bridge, and the honest
form of that objection is not that the bridge kept an observer but that it kept one **per control**,
watching a node it had to resolve an id in first.

**Question 3 — does the redesigned `<ui-tooltip>` still meet 1.4.13?** **Not as it stands**, and the
gap is in Dismissible. Hoverable and Persistent survive; what does not is the dismissal itself,
because it is not remembered and the key is not claimed.

The three requirements are gated today against a native `<button>`, which is the one trigger this
proposal removes from the picture. Against the eight:

- **A dismissal survives on the six form controls**, measured — focus moving within one shadow tree
  fires nothing at an ancestor, so an Escape on `<ui-radio-group>` holds while the reader arrows
  between radios.
- **On `<ui-menu>` a tip cannot be dismissed at all.** The items are slotted, so opening the menu
  moves focus out of its root and back into the tooltip's subtree; Escape closes the menu, the
  component returns focus to the trigger it rendered, and the tip re-opens in the same turn as the
  key that dismissed it.
- **Inside a `<ui-dialog>` the same key closes the dialog.** 1.4.13 wants a dismissal that does not
  move focus, and closing a modal returns focus to whatever opened it.

**Neither failure is created by this proposal** — both are in the component today, and they are
#169. What the proposal changes is the cost, and the exemption that might have excused them is
already closed by the measurement above: Dismissible does not apply to content that does not obscure
other content, and the tip covers the field above its trigger.

**The answer is therefore conditional rather than negative.** A claimed key stops both layers below
— measured on the modal and on the `popover="auto"` alike — so remembering the dismissal and
claiming the key when there was something to dismiss restores all three requirements. That was one
flag and no new API, and it shipped as #169 ahead of this proposal rather than inside it.

**Question 4 — does a tip carrying an instruction place differently from one carrying
decoration?** **No**, and the premise did not survive being measured. The question assumed an
asymmetry between the two readers: covering the neighbour is tolerable for text a reader summoned
and not for text that arrives with focus, because the pointer reader can move away and the keyboard
reader cannot. Both can, by different mechanisms — the pointer reader's travel toward the covered
field closes the tip before the click lands, and Escape closes it without moving focus. **The second
half of that is #169**, which did not exist when the question was written; the asymmetry was real
and it was closed by a dismissal rather than by a placement.

What is left is the covering itself, which is substantial and stays: 70% of the field above, 77% of
the one below when it flips, 81% for an instruction long enough to wrap. **The trigger is never
covered**, at any height or on either side, which is the one figure that would have forced a change
— a tip that hid the control it describes would fail 2.4.11 and no dismissal would excuse it.

The three candidates the question named all lose to a measurement rather than to an argument:

- **A placement rule** — prefer the side with no control — has no side to prefer. In a stacked form
  both sides hold one, which is what 70% above and 77% below say.
- **A gutter** costs the host's layout, and not placing into the host's layout is the whole reason
  the tip is a popover in the top layer. Reserving space for it would reintroduce exactly the
  permanent block of text that Question 1 discontinued.
- **An inline placement** does not fit: 281px of tip against 164px of room, so `place()` pulls it
  back over the field. Making it conditional on the viewport is the second placement
  `src/placement.ts` exists to not have.

**So it stays with the host**, which is where `place()` already leaves it by taking boxes rather
than elements — and the obligation this proposal adds is on the text rather than the geometry: an
instruction goes in a tip because the tip can be dismissed and re-summoned, and a form that needs
two instructions read together keeps `help`, which is the capability Question 1 kept for exactly
this.

## Rollout

Ordered, each step making the next possible.

1. **Build the handoff and prove it on one element end to end** — `<ui-button>`, being the one with
   no supplementary text of any kind today and therefore the case with nothing to regress. Three
   things arrive with it rather than after it, each because the half-built form is a defect and not
   a rough edge: the tooltip's **observer**, since an unsynchronised copy is wrong rather than
   stale; a `slotchange` listener on the **default slot**, since a replaced trigger is announced
   and currently heard by nobody; and the **withdrawal on both paths**, since the IDREF already
   leaves a removed tip's id behind and a protocol that withdraws correctly beside one that does
   not is a component right in one half.
2. **Extend to the remaining seven, in the order _What step 2 is actually extending_ sets** —
   `<ui-menu>` first, because it reuses step 1's new path on the hardest element; then
   `<ui-checkbox>` and `<ui-switch>`, which need a composer before they can hold a second id; then
   the four that already have one. The warning from #158 narrows as each is covered: it should fire
   only for a trigger that accepts no text.
3. **Move the recommendation, and prune the transitional half** — `docs/` stops sending a consumer
   to `help` for supplementary text and sends them to the tip; `help`'s own page keeps it for the
   two cases a popover cannot serve; the transitional half of `docs/tooltip.md` and
   [ARCHITECTURE.md](../../ARCHITECTURE.md) goes; #156 closes pointing here.

**There were four, and the third was _discontinue `help` as a default_ — a minor below `1.0.0`,
with the deprecation and its replacement required to coexist in one release.** There is no default
to discontinue, so nothing is deprecated and nothing is released, and what remains is documentation
the last step was always going to touch. The step did not shrink; it was never a step.

**What is verified, and how.** Every step is gated by the suite that already exists: the
`aria-describedby` written by a component resolves in its own root, axe reports no violation at
serious or critical impact, and the mutation floor holds at 100. **What cannot be verified here is
unchanged by this proposal** — no instrument in this toolchain reads an accessibility tree, so
every claim is made about the reference and the node it resolves to, never about what a screen
reader says.

# RFC 0006 — Supplementary text, and where it is allowed to live

- **Status**: Draft
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
Whether that advertisement is a property, a symbol or `ElementInternals` is an open question below.

### `help` is discontinued

This is the objective rather than a consequence, and it is the part of this proposal that is not
forced by #156.

A permanent block of text under every control is a layout decision the library makes on the host's
behalf, and it is the wrong default: it is always visible whether or not it is wanted, it pushes
every field apart, and it exists in four elements and not in the other three, so the library is
already inconsistent about it. Supplementary text becomes the tooltip's, uniformly, for all eight.

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
- **Waiting for Reference Target**, rejected on timing alone: behind a flag in one engine is not
  something to ship a library's accessibility story on. It is, however, the reason the handoff is
  designed to be deleted rather than deprecated.

## Decision

**Not reached.** Three questions have to be answered before it can be.

1. **Does discontinuing visible `help` hold against WCAG 3.3.3?** The format requirement is what a
   reader needs while recovering from an error, and this proposal moves it behind an interaction.
   `docs/tooltip.md`'s own rule — _never make the tip the only place information exists_ — is
   either restated with its reasoning intact or it is contradicted; it must not be quietly dropped.
   A middle position exists and is not yet studied: `help` discontinued as a **default** while
   remaining available for the instruction a form genuinely needs in view.

2. **What shape is the handoff?** A public property, a documented protocol, or `ElementInternals`.
   The constraint is that it must be deletable rather than deprecable.

3. **Does the redesigned `<ui-tooltip>` still meet 1.4.13?** Dismissible, hoverable and persistent
   are measured today against the current design; a component that becomes the sole carrier of
   supplementary text is held to that bar harder, not softer.

## Rollout

Ordered, each step making the next possible.

1. **Answer question 1**, because it decides whether the rest is a redesign or an addition. It is a
   study, not an implementation.
2. **Fix the handoff's shape**, and prove it on one element end to end — `<ui-button>`, being the
   one with no supplementary text of any kind today and therefore the case with nothing to
   regress.
3. **Extend to the remaining seven**, with the warning from #158 narrowing as each is covered:
   it should fire only for a trigger that accepts no text.
4. **Discontinue `help`** on the four elements that have it, if question 1 says so — a minor below
   `1.0.0`, and the deprecation and its replacement must coexist in one release.
5. **Prune the transitional half** of `docs/tooltip.md` and
   [ARCHITECTURE.md](../../ARCHITECTURE.md), and close #156 pointing here.

**What is verified, and how.** Every step is gated by the suite that already exists: the
`aria-describedby` written by a component resolves in its own root, axe reports no violation at
serious or critical impact, and the mutation floor holds at 100. **What cannot be verified here is
unchanged by this proposal** — no instrument in this toolchain reads an accessibility tree, so
every claim is made about the reference and the node it resolves to, never about what a screen
reader says.

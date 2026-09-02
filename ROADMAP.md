# Roadmap

Pending work, ordered. Released history lives in [CHANGELOG.md](CHANGELOG.md); a delivered entry
is **removed** by the pull request that delivers it, not annotated as done.

## The v0 surface (#18–#23)

RFC 0016 sets the v0 component surface. The token layer, `ui-button`, `ui-field`, `ui-dialog`,
`ui-input`, `ui-textarea`, `ui-checkbox`, `ui-switch`, `ui-select`, `ui-radio-group` and `ui-icon`
ship, and the remaining five components are open as #18 through #21 and #23, one issue each.

**`ui-icon` was a gap in the cut rather than a row of it**, and it shipped ahead of the rest because
several of those rows cannot be finished without a glyph — a toast's status mark, a menu's chevron,
an icon-only button. Left later, each would have inlined its own SVG and the decision would have
been made by accumulation instead of by anybody.

**One deferral now has an expiry date rather than a reason.** RFC 0016 put a custom listbox off
because a native `<select>` is accessible for free on every platform and a listbox is an
accessibility project of its own. That still holds — and Chromium now ships `appearance: base-select`
with `::picker(select)` and `::checkmark`, measured as supported in the engine this suite runs.
`ui-select` deliberately does not adopt it: a visual language that changes shape per engine is what a
kit exists to prevent, and one engine cannot speak for the others. What reopens the listbox question
is that feature arriving broadly, not a decision here — `docs/select.md` carries it for a consumer.

**Each of them brings its own token category with it**, which is a rule rather than a schedule and
is written where a consumer reads it — [ARCHITECTURE.md](ARCHITECTURE.md), _A category arrives with
the component that consumes it_. Elevation waits for `ui-card` (#18), a type scale for `ui-table`
(#19), `success` and `warning` for `ui-toast` (#21). The boundary and the muted text arrived with
`ui-input`, which is the pair the rest of the form cluster inherits rather than each naming its
own — and `ui-checkbox`, `ui-switch` and `ui-radio-group` arrive with **no** category at all, drawn
entirely from what was already there. What they brought instead is a floor: a control this package
sizes itself owes WCAG 2.2's 24px minimum target, which the native 13px one escaped only by never
having been sized.

Layering was expected to arrive with the first overlay, and did not. A modal `<dialog>` is promoted
to the top layer, so `ui-dialog` has no `z-index` anywhere to name — the category waits for an
overlay the platform does not lift, and may never be needed at all. The rule cuts both ways, which
is the point of writing it as a rule rather than a schedule.

And each ships with its interaction states or it does not ship: a component that accepts interaction
and shows no feedback is defective rather than incomplete.

## Zag arrives with the first component the platform has no element for (#23)

RFC 0016 adopts [Zag](https://zagjs.com) state machines for behaviour and accessibility, and this
package still does not depend on it.

**Two components have now declined it, and neither was a close call.** `ui-dialog` was the first and
was expected to be the trigger: dismissable layers and focus trapping are exactly what Zag was
adopted for, and `<dialog>` with `showModal()` supplies both — with the background inert because the
user agent says so rather than because a script is holding the boundary. Zag's dialog machine
implements the same pattern over a `<div>`, so taking it there would have traded the top layer for a
JavaScript trap. _The platform owns what the platform is good at_ is the older rule and it won;
[ARCHITECTURE.md](ARCHITECTURE.md) carries that for a consumer.

`ui-radio-group` was the second, and it is the one that sharpened the test. A radio group is an APG
pattern with a **roving tabindex** in it, which is the thing Zag is reached for — and native radios
sharing a `name` already are that pattern, wrappers and all, which this package's suite measures
rather than assumes. So _roving tabindex_ is not the marker either; nothing about the behaviour's
shape is.

`ui-menu` (#23) is the nearest candidate left — a dismissable layer the platform does not lift, and
positioning. Whichever component reaches it first, the test is stated rather than assumed: Zag
arrives where the platform has **no element** for the pattern, not merely where the pattern has
state, and not merely where it has a roving tabindex.

## Design tokens beyond the web (#24)

Tokens exist as CSS custom properties today. RFC 0016 keeps a native shell (M4) reachable by
treating tokens as a single source of truth, which will mean emitting them in a second format. No
consumer needs it yet, and the shape of that emission is a decision to make with one in hand.

RFC 0002 narrowed that shape from the other side, and the constraint is worth carrying here rather
than rediscovering: a derived token's value is a `color-mix()` expression, which is a CSS function and
therefore **not a value any emitter outside CSS can read**. A formula plus a concrete theme does yield
one, so the emitter resolves derived roles at build time and emits them frozen per theme, while CSS
keeps them live. That asymmetry is accepted, not solved — and it was accepted knowingly, because
choosing the more expensive structure to protect a target with no consumer is the same claim this file
already declines to make about Zag.

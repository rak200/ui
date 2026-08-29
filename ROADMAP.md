# Roadmap

Pending work, ordered. Released history lives in [CHANGELOG.md](CHANGELOG.md); a delivered entry
is **removed** by the pull request that delivers it, not annotated as done.

## `:active` from a real finger, on a real phone (#80)

Three engines are measured and agree — `tests/manual/interaction-states.mjs` is the step, and it
already earned its keep by finding that `-webkit-tap-highlight-color` was painting over the pressed
colour. One question survives it, and no amount of emulation answers it: **does `:active` fire from
a real finger on real iOS?** Playwright's touchscreen taps instantaneously and cannot hold.

It matters because the tap wash is now off. If iOS turns out to gate `:active` on a touch listener
existing, a tap there answers with nothing at all — and the fix is a listener, decided against for
now rather than carried before anything needed it. A phone and ten seconds settles it, and the nine
queued components inherit the answer.

## The v0 surface (#14–#23)

RFC 0016 sets the v0 component surface. The token layer, `ui-button`, `ui-field`, `ui-dialog`,
`ui-input` and `ui-textarea` ship, and the remaining nine components are open as #14 through #21 and
#23, one issue each.

**Each of them brings its own token category with it**, which is a rule rather than a schedule and
is written where a consumer reads it — [ARCHITECTURE.md](ARCHITECTURE.md), _A category arrives with
the component that consumes it_. Elevation waits for `ui-card` (#18), a type scale for `ui-table`
(#19), `success` and `warning` for `ui-toast` (#21). The boundary and the muted text arrived with
`ui-input`, which is the pair the rest of the form cluster inherits rather than each naming its
own.

Layering was expected to arrive with the first overlay, and did not. A modal `<dialog>` is promoted
to the top layer, so `ui-dialog` has no `z-index` anywhere to name — the category waits for an
overlay the platform does not lift, and may never be needed at all. The rule cuts both ways, which
is the point of writing it as a rule rather than a schedule.

And each ships with its interaction states or it does not ship: a component that accepts interaction
and shows no feedback is defective rather than incomplete.

## Zag arrives with the first component the platform has no element for (#23)

RFC 0016 adopts [Zag](https://zagjs.com) state machines for behaviour and accessibility, and this
package still does not depend on it.

**The trigger was expected to be `ui-dialog`, and it was not.** Dismissable layers and focus
trapping are exactly what Zag was adopted for, and `<dialog>` with `showModal()` supplies both —
with the background inert because the user agent says so rather than because a script is holding
the boundary. Zag's dialog machine implements the same pattern over a `<div>`, so taking it there
would have traded the top layer for a JavaScript trap. _The platform owns what the platform is good
at_ is the older rule and it won; [ARCHITECTURE.md](ARCHITECTURE.md) carries that for a consumer.

`ui-menu` (#23) is the nearest candidate — roving tabindex, a dismissable layer the platform does
not lift, and positioning. Whichever component reaches it first, the test is now stated rather than
assumed: Zag arrives where the platform has no element for the pattern, not merely where the
pattern has state.

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

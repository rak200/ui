# Roadmap

Pending work, ordered. Released history lives in [CHANGELOG.md](CHANGELOG.md); a delivered entry
is **removed** by the pull request that delivers it, not annotated as done.

## The v0 surface (#19–#23)

RFC 0016 sets the v0 component surface. Two components are open, one issue each: `ui-table` (#19)
and `ui-menu` (#23).

**`ui-menu` inherits its positioning rather than deciding it.** That answer is settled — measured
placement in this package, over a `popover`, with CSS anchor positioning measured as present in this
engine and deliberately not adopted; `docs/tooltip.md` carries the whole of it. What is left for #23
is to use it, not to choose it.

**One deferral has an expiry date rather than a reason.** RFC 0016 put a custom listbox off because
a native `<select>` is accessible for free on every platform and a listbox is an accessibility
project of its own. That still holds — and Chromium now ships `appearance: base-select` with
`::picker(select)` and `::checkmark`, measured as supported in the engine this suite runs. What
reopens the question is that feature arriving broadly, not a decision here; `docs/select.md` carries
it for a consumer.

**Each open component brings its own token category with it**, which is a rule rather than a
schedule and is written where a consumer reads it — [ARCHITECTURE.md](ARCHITECTURE.md), _A category
arrives with the component that consumes it_. A type scale waits for `ui-table` (#19). `ui-menu` (#23)
is expected to bring none: a menu is a surface over a page, and elevation, boundary and the derived
neutrals are all already here.

**Layering may never be needed at all**, and that is the rule cutting the other way. Three overlays
have now arrived and none brought it: a modal `<dialog>` and two `popover`s are all promoted to the
top layer, so there is no `z-index` anywhere to name. `ui-menu` is the last candidate, and it will be
a popover too.

And each ships with its interaction states or it does not ship: a component that accepts interaction
and shows no feedback is defective rather than incomplete.

## Zag arrives with the first component the platform has no element for (#23)

RFC 0016 adopts [Zag](https://zagjs.com) state machines for behaviour and accessibility, and this
package still does not depend on it. Three components have declined it already, and
[ARCHITECTURE.md](ARCHITECTURE.md) carries all three refusals for a consumer.

`ui-menu` (#23) is the nearest candidate left — a dismissable layer the platform does not lift, and
positioning. The test is stated rather than assumed: Zag arrives where the **accessible behaviour**
is the expensive part. Not merely where the pattern has state; not merely where it has a roving
tabindex; and — as `ui-toast` showed, declining a machine Zag actually ships — not merely where the
platform has no element, if what the component owns turns out to be markup rather than behaviour.

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

**One category already cannot make the trip in the shape the others do**, and it is worth carrying
for the same reason: elevation is a `box-shadow`, so it is neither a colour an emitter can resolve
nor a value `light-dark()` can carry two of. [ARCHITECTURE.md](ARCHITECTURE.md) says what the web
does about it; what a second format does is this issue's to decide.

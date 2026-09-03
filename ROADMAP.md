# Roadmap

Pending work, ordered. Released history lives in [CHANGELOG.md](CHANGELOG.md); a delivered entry
is **removed** by the pull request that delivers it, not annotated as done.

## The v0 surface (#19–#23)

RFC 0016 sets the v0 component surface. Four components are open, one issue each: `ui-table` (#19),
`ui-tooltip` (#20), `ui-toast` (#21) and `ui-menu` (#23).

**Two of them have an order between them.** `ui-menu` takes its positioning and viewport-edge
behaviour from whatever `ui-tooltip` settles on, because two answers to one problem is one too many
— so #20 decides and #23 inherits. What #20 has to state, and cannot inherit from anything here, is
whether that answer is CSS anchor positioning or a dependency: a feature one engine has is what
makes a kit look like two kits, which is the same test `docs/select.md` applies to
`appearance: base-select`.

**One deferral has an expiry date rather than a reason.** RFC 0016 put a custom listbox off because
a native `<select>` is accessible for free on every platform and a listbox is an accessibility
project of its own. That still holds — and Chromium now ships `appearance: base-select` with
`::picker(select)` and `::checkmark`, measured as supported in the engine this suite runs. What
reopens the question is that feature arriving broadly, not a decision here; `docs/select.md` carries
it for a consumer.

**Each open component brings its own token category with it**, which is a rule rather than a
schedule and is written where a consumer reads it — [ARCHITECTURE.md](ARCHITECTURE.md), _A category
arrives with the component that consumes it_. A type scale waits for `ui-table` (#19); `success` and
`warning` for `ui-toast` (#21).

**Layering may never be needed at all**, and that is the rule cutting the other way. It was expected
with the first overlay and did not arrive: a modal `<dialog>` is promoted to the top layer, so there
is no `z-index` anywhere to name. It waits for an overlay the platform does not lift — `ui-tooltip`
and `ui-menu` are the two that might be it.

And each ships with its interaction states or it does not ship: a component that accepts interaction
and shows no feedback is defective rather than incomplete.

## Zag arrives with the first component the platform has no element for (#23)

RFC 0016 adopts [Zag](https://zagjs.com) state machines for behaviour and accessibility, and this
package still does not depend on it. Two components have declined it already, and
[ARCHITECTURE.md](ARCHITECTURE.md) carries both refusals for a consumer.

`ui-menu` (#23) is the nearest candidate left — a dismissable layer the platform does not lift, and
positioning. The test is stated rather than assumed: Zag arrives where the platform has **no
element** for the pattern, not merely where the pattern has state, and not merely where it has a
roving tabindex.

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

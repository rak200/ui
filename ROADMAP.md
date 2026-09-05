# Roadmap

Pending work, ordered. Released history lives in [CHANGELOG.md](CHANGELOG.md); a delivered entry
is **removed** by the pull request that delivers it, not annotated as done.

## The v0 surface (#19)

RFC 0016 sets the v0 component surface. One component is open: `ui-table` (#19).

**One deferral has an expiry date rather than a reason.** RFC 0016 put a custom listbox off because
a native `<select>` is accessible for free on every platform and a listbox is an accessibility
project of its own. That still holds — and Chromium now ships `appearance: base-select` with
`::picker(select)` and `::checkmark`, measured as supported in the engine this suite runs. What
reopens the question is that feature arriving broadly, not a decision here; `docs/select.md` carries
it for a consumer.

**Each open component brings its own token category with it**, which is a rule rather than a
schedule and is written where a consumer reads it — [ARCHITECTURE.md](ARCHITECTURE.md), _A category
arrives with the component that consumes it_. A type scale waits for `ui-table` (#19), and it is the
last category the v0 surface expects.

**Layering was never needed**, and that is the rule cutting the other way. Four overlays have now
arrived and none brought it: a modal `<dialog>` and three `popover`s are all promoted to the top
layer, so there is no `z-index` anywhere to name. `ui-menu` was the last candidate on the list and it
is a popover too, so nothing pending is expected to open the category.

And each ships with its interaction states or it does not ship: a component that accepts interaction
and shows no feedback is defective rather than incomplete.

## Zag has no candidate left, and that is a decision to make (#122)

RFC 0016 adopts [Zag](https://zagjs.com) state machines for behaviour and accessibility, and this
package still does not depend on it. **Four components have now declined it**, and
[ARCHITECTURE.md](ARCHITECTURE.md) carries all four refusals for a consumer.

`ui-menu` was the one this file named, and the reason it declined is the reason the question is now
open rather than pending: measured, `popover="auto"` supplies the layer, the light dismissal, Escape
and the ordering against other open layers, so what a machine would have replaced is a roving
tabindex and four keys. Zag's menu also positions through Floating UI, which would be a second
placement in a package whose first one is measured, shared and documented.

The test is stated rather than assumed: Zag arrives where the **accessible behaviour** is the
expensive part. No component has met it, and no unwritten one is expected to — `ui-table` is static.
So the choice is between **retiring the adoption** and naming the component that would justify it,
and it is a decision rather than a wait. Nothing blocks on it: a dependency nobody has added costs
nothing, and the four refusals are each written where a reader meets them.

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

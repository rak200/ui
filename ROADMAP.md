# Roadmap

Pending work, ordered. Released history lives in [CHANGELOG.md](CHANGELOG.md); a delivered entry
is **removed** by the pull request that delivers it, not annotated as done.

## The v0 surface (#13–#23)

RFC 0016 sets the v0 component surface. The token layer, `ui-button` and `ui-field` ship — the last
of them in 0.2.1 — and the remaining twelve components are open as #13 through #23, one issue each
and the first of them holding `ui-input` and `ui-textarea` together.

**Each of them brings its own token category with it**, which is a rule rather than a schedule and
is written where a consumer reads it — [ARCHITECTURE.md](ARCHITECTURE.md), _A category arrives with
the component that consumes it_. Elevation waits for `ui-card` (#18), a type scale for `ui-table`
(#19), `success` and `warning` for `ui-toast` (#21), layering for the first overlay. And each ships
with its interaction states or it does not ship: a component that accepts interaction and shows no
feedback is defective rather than incomplete.

## Zag arrives with the first stateful component (#22)

RFC 0016 adopts [Zag](https://zagjs.com) state machines for behaviour and accessibility, and this
package does not depend on it yet — deliberately. A button has no state to model, and a dependency
carried before anything uses it is a claim the code does not back up. The first component with
dismissable layers, focus trapping or roving tabindex brings Zag with it — `ui-dialog`, whose issue
names it.

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

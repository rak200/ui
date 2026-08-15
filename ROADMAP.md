# Roadmap

Pending work, ordered. Released history lives in [CHANGELOG.md](CHANGELOG.md); a delivered entry
is **removed** by the pull request that delivers it, not annotated as done.

## The visual language

[RFC 0002](docs/proposals/0002-the-visual-language.md) is `Accepted`: eleven items resolved, from
where a colour with no token comes from to how the steps of a scale are named. The structural half is
what changes the package — the exported set splits into ground tokens with literal defaults and
derived tokens whose value is a formula that must never reach `:root`, a theme becomes two independent
axes (`data-ui-theme` for the theme, `color-scheme` and `light-dark()` for the scheme), motion arrives
as a duration scale with purposes over it, and reduced motion collapses every duration in one place
rather than in each component.

It sat below the playground, and the proposal's item 8 said why: its own contrast obligation for a
second theme is discharged by stories, so it waited on the playground's fourth step — the one that
proves composed stories render. **That step landed, and the whole playground with it**, so nothing
holds this back any more. Its issue is #47.

**What arrives is decided per component, not all at once.** A token category enters with the pull
request of the component that consumes it, with one clause that makes it a rule rather than a
schedule: a component that accepts interaction and shows no feedback is defective. `ui-button` has no
`:hover`, so interaction colours and the first motion tokens arrive with the fix to it — while
elevation waits for `ui-card`, a type scale for `ui-table`, and `success` and `warning` for
`ui-toast`.

## The v0 surface

RFC 0016 sets the v0 component surface. The token layer, `ui-button` and `ui-field` ship — the last
of them in 0.2.1 — and the rest is pending, with each entry getting an issue before it is worked.

## Zag arrives with the first stateful component

RFC 0016 adopts [Zag](https://zagjs.com) state machines for behaviour and accessibility, and this
package does not depend on it yet — deliberately. A button has no state to model, and a dependency
carried before anything uses it is a claim the code does not back up. The first component with
dismissable layers, focus trapping or roving tabindex brings Zag with it.

## Design tokens beyond the web

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

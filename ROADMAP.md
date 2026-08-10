# Roadmap

Pending work, ordered. Released history lives in [CHANGELOG.md](CHANGELOG.md); a delivered entry
is **removed** by the pull request that delivers it, not annotated as done.

## The component playground (#28)

[RFC 0001](docs/proposals/0001-component-playground.md) is `Accepted`: Storybook, built to GitHub
Pages at `/ui/`, with stories in `stories/` mirroring `src/` and rendered by the existing suite, so
a broken story fails `ci / gate` without opening a ninth verb. Its rollout is six steps, the first
of them a seed change in the baseline repository.

It sits above the component queue deliberately. The proposal's Decision C is _now, and built for
what is coming_ — the shape chosen here is the one every component after it inherits, and building
it after a dozen components means retrofitting a dozen.

## The v0 surface

RFC 0016 sets the v0 component surface. `ui-button` and the token layer ship; the rest is pending,
and each entry gets an issue before it is worked.

## Zag arrives with the first stateful component

RFC 0016 adopts [Zag](https://zagjs.com) state machines for behaviour and accessibility, and this
package does not depend on it yet — deliberately. A button has no state to model, and a dependency
carried before anything uses it is a claim the code does not back up. The first component with
dismissable layers, focus trapping or roving tabindex brings Zag with it.

## Design tokens beyond the web

Tokens exist as CSS custom properties today. RFC 0016 keeps a native shell (M4) reachable by
treating tokens as a single source of truth, which will mean emitting them in a second format. No
consumer needs it yet, and the shape of that emission is a decision to make with one in hand.

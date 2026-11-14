# Roadmap

Pending work, ordered. Released history lives in [CHANGELOG.md](CHANGELOG.md); a delivered entry
is **removed** by the pull request that delivers it, not annotated as done.

## The console manager, with its levels, its codes and `data-ui-quiet` (#423)

[RFC 0011](docs/proposals/0011-the-console.md)'s manager, `src/console.ts`, which every line the
package says goes through, once a page for each code and cause, at the console's own four levels,
with a link to its entry in `docs/console.md`. A page quiets a code, a level or all of it from its
root, and nothing else in `src/` calls the console.

## The lines that speak always (#424)

The icon's warning waits two seconds past `load`, and two join it: a tooltip whose trigger the keys
cannot reach, and a toast outside a toaster, which nothing announces.

## A tooltip on a disabled control, in the docs (#425)

`docs/tooltip.md` says such a tip is shown by no key, and points at `aria-disabled`, which keeps
the control in the tab order.

## `diagnose()`, said only when asked (#426)

Everything the components can tell is wrong under a root, as data, from an entry of its own, logged
only when the page asks and only what it has not heard. The last step, which marks RFC 0011
`Implemented`.

## Design tokens beyond the web (#24)

Tokens exist as CSS custom properties today. RFC 0016 keeps a native shell (M4) reachable by
treating tokens as a single source of truth, which will mean emitting them in a second format. No
consumer needs it yet, and the shape of that emission is a decision to make with one in hand.

RFC 0002 narrowed that shape from the other side, and the constraint is worth carrying here rather
than rediscovering: a derived token's value is a `color-mix()` expression, which is a CSS function and
therefore **not a value any emitter outside CSS can read**. A formula plus a concrete theme does yield
one, so the emitter resolves derived roles at build time and emits them frozen per theme, while CSS
keeps them live. That asymmetry is accepted, not solved — and it was accepted knowingly, because
choosing the more expensive structure to protect a target with no consumer is the claim that retired
the Zag adoption, and [ARCHITECTURE.md](ARCHITECTURE.md) is where that argument now lives.

**One category already cannot make the trip in the shape the others do**, and it is worth carrying
for the same reason: elevation is a `box-shadow`, so it is neither a colour an emitter can resolve
nor a value `light-dark()` can carry two of. [ARCHITECTURE.md](ARCHITECTURE.md) says what the web
does about it; what a second format does is this issue's to decide.

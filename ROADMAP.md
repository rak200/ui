# Roadmap

Pending work, ordered. Released history lives in [CHANGELOG.md](CHANGELOG.md); a delivered entry
is **removed** by the pull request that delivers it, not annotated as done.

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

## Placement by CSS anchor positioning (#300)

`<ui-tooltip>` and `<ui-menu>` place their popovers by script, and
[ARCHITECTURE.md](ARCHITECTURE.md) says what retires it: the properties the CSS would use have to be
Baseline Widely available, and every engine has to be able to read the side an overlay took, unless
`data-side` is retired by a decision of its own.

By web-features 3.44.0 the first comes on 2028-08-24. The part of anchor positioning the two would
use became complete in every engine with Firefox 148, on 2026-02-24, and wide availability is thirty
months later. The second has no date: only Chromium reads the side back, through anchored container
queries. RFC 0004's prototypes choose each overlay's direction of travel by `data-side`, so retiring
it is that proposal's question too.

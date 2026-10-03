# Roadmap

Pending work, ordered. Released history lives in [CHANGELOG.md](CHANGELOG.md); a delivered entry
is **removed** by the pull request that delivers it, not annotated as done.

## A neutral hover a reader can see (#228)

`--ui-color-hover` mixes 8% of the text into the surface, and in the dark scheme that is a step most
readers do not notice — a menu item under the pointer looks like the ones beside it. The suite's
1.05 floor is a floor for _renders as different_, so 1.17 clears it while the defect stands. The fix
raises the floor and the mix together, and the number wants a look in both schemes rather than a
guess. A palette whose text is far from neutral cannot reach it by the shared formula; that half is
RFC 0003's question 3.

## `::part(box):checked` matches (#229)

Three places — `docs/checkbox.md`, the docblock on `expose()` in `src/checkbox.ts`, and the comment
above the custom-state assertions in `tests/checkbox.test.ts` — say the selector does not match,
and in this engine it does. The custom states keep a reason, a different one: they select the
host, where a part reaches only the box. The fix is the three sentences, and a test that fails when
the engine changes rather than a re-dated measurement.

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

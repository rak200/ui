# Roadmap

Pending work, ordered. Released history lives in [CHANGELOG.md](CHANGELOG.md); a delivered entry
is **removed** by the pull request that delivers it, not annotated as done.

## A description reaches none of the controls this package renders (#156)

`<ui-tooltip>` names its trigger with `aria-describedby`, and an IDREF crosses no shadow boundary —
so on any element that focuses a control inside its own shadow root the tip appears, places itself
correctly, and is never announced. That is most of this package. The documentation said it of one
element, which was true when it was written.

**The mechanism did not change, its reach did.** `<ui-tooltip>` says so in the console now, which
settles the half that was dangerous — the failure was silent. What is left is whether a description
should cross at all, and the answer is not a measurement: **there is no instrument here that can
take one.** Playwright has removed its accessibility tree API and `ariaSnapshot()` carries the
accessible name alone, so whether `aria-description` reaches a reader cannot be verified in one
engine, let alone three. What remains is a design choice between building the crossing and declining
it.

## The listbox deferral, which has an expiry date rather than a reason

RFC 0016 put a custom listbox off because a native `<select>` is accessible for free on every
platform and a listbox is an accessibility project of its own. That still holds — and Chromium now
ships `appearance: base-select` with `::picker(select)` and `::checkmark`, measured as supported in
the engine this suite runs. What reopens the question is that feature arriving broadly, not a
decision here; `docs/select.md` carries it for a consumer.

**The v0 component surface is delivered**, and both halves of the token schedule closed with it.
The type scale arrived with `ui-table`, which was the last category the surface expected — and it
arrived to replace three hardcoded sizes rather than to anticipate a need, which is the schedule
working. **Layering never arrived at all**, and that is the rule cutting the other way: four
overlays came, a modal `<dialog>` and three `popover`s, every one promoted to the top layer, so
there is no `z-index` anywhere to name.

And each shipped with its interaction states or it did not ship: a component that accepts
interaction and shows no feedback is defective rather than incomplete.

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

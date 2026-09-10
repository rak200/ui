# Roadmap

Pending work, ordered. Released history lives in [CHANGELOG.md](CHANGELOG.md); a delivered entry
is **removed** by the pull request that delivers it, not annotated as done.

## A description reaches none of the controls this package renders (#156)

`<ui-tooltip>` names its trigger with `aria-describedby`, and an IDREF crosses no shadow boundary —
so on any element here that draws its own control the tip appears, places itself correctly, and is
never announced. Seven elements are in that set now; the documentation said one, and that sentence
was written when it was true.

**The mechanism did not change, its reach did**, which is why this is the first thing to settle: a
description that crosses has to cross as text rather than as a reference, and which of the two
shapes does it — the control copying the text in, or `aria-description` — is a measurement nobody
has taken.

## `<ui-field>` has one job left, and #156 named it (#138)

RFC 0005 decided that a form control owns **both ends of its own relationship, inside its shadow
root**, and every control in the package has now moved: `<ui-checkbox>`, `<ui-switch>`,
`<ui-input>`, `<ui-textarea>`, `<ui-select>` and `<ui-radio-group>` each render their control, their
label, their help and their message together.

**The two things that could have blocked the last move did not.** The vertical rhythm between
label, control and help was the field's stylesheet and is now the group's own, like every other
control's; and the error colour no longer needs retargeting a token over a subtree, because the
controls are in the group's shadow root and a rule can simply name them. The comment explaining
why no selector could reach them went with the problem.

**What is left is one question rather than one task**, and it is now a narrower one than it looked.
`<ui-field>` wires a control **you** wrote — which is less than it sounds, because `<ui-input>`
passes `type` through untouched, so `type="date"`, `type="file"`, `type="range"` and the rest are
already elements here. What the field alone still does is keep a control in your tree, and #156 is
what makes that worth something: it is the only arrangement in which a tooltip on a form control is
announced.

**So the order is the rule.** Whatever answers #156 is also what answers _what is `<ui-field>`
for_, and deciding this one first is deciding it without the thing that makes it answerable.
Decide before `1.0.0` either way, because after it the same removal costs a major and a deprecation
window.

[ARCHITECTURE.md](ARCHITECTURE.md) carries the corrected rule for a consumer.

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

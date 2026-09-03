# Architecture

Why `@rak200/ui` is shaped the way it is, and what was rejected on the way. The decisions are
RFC 0016's; this is the half a consumer needs in order to judge whether the package fits.

## Custom elements, not framework components

The kit ships **custom elements**, so it works in any page and any framework, or none.

A React-only component library was considered and rejected: it forfeits portability, and it forfeits
the server-rendered ride-along that a page emitting tags plus one module gets for free. A component
welded to one framework is not reusable outside it, which is the opposite of why this exists.

## Lit

Lit gives a thin runtime, no build step required of the host, and works unbundled.

**Stencil is the documented alternative**, and the two tie on the decisive question — the mobile
path, which is PWA first and Capacitor second. The web side breaks the tie. Revisit only if the
mobile direction becomes Ionic, or if many external framework applications consume the kit.

## Behaviour is adopted, markup is owned

For components with state to model, the state machines come from **Zag**; the markup and styling
shell stay in this repository.

Two alternatives were rejected. Building accessible behaviour from zero re-opens every APG pattern
and its verification cost, per component. Theming somebody else's monolith gives up the source, and
owning the source is not negotiable here.

Zag is **not a dependency yet**, deliberately. A button has no state to model, and a dependency
carried before anything uses it is a claim the code does not back up.

**The first component that could have brought it did not, and that is worth stating rather than
quietly not doing.** `ui-dialog` has dismissable layers and a focus trap — the two things Zag was
adopted for — and it gets both from `<dialog>` and `showModal()`, where the background is inert
because the user agent says so rather than because a script is holding the boundary. Zag's dialog
machine implements the same pattern over a `<div>`, so adopting it there would have meant giving up
the top layer in order to re-acquire in JavaScript what the top layer already grants.

_The platform owns what the platform is good at_ is the older rule, and it wins where the two meet.
Nothing about the adoption changed; what changed is which component triggers it. Zag arrives with
the first component the platform has **no element for** — a menu with roving tabindex and
positioning is the nearest one — and `ROADMAP.md` names it.

**`<ui-radio-group>` is the second component that could have brought it, and the test above is what
sent it away.** A radio group is an APG pattern with a roving tabindex in it — one tab stop, arrow
keys that move _and_ select, wrapping at either end — which reads like the trigger until the
question is asked the right way round: native radios sharing a `name` **are** that pattern, and
they keep being it inside a wrapper, which this package's suite measures rather than assumes. So
the group hand-rolls nothing and adopts nothing; what is left for it is the layout, the `role` and
the group-level name. The pattern having state was never the test. Having no element for it is.

## The prefix is `ui-`

Tags, CSS custom properties and exported classes all carry it: `<ui-button>`, `--ui-radius`,
`UiButton`. It is the repository name, so a reader can derive it from something that exists.

The trade-off is stated rather than hidden. A generic prefix collides more easily, and the collision
worth naming is **not** with another kit: a distinctive prefix is the web-components convention
(`sl-`, `md-`, `ion-`), which leaves the generic space largely unclaimed by libraries. It is with the
host application's own components, where `ui-card` is the first thing anyone reaches for.

That collision is unrecoverable rather than degraded. `customElements.define` throws on a name
already registered, and these components register themselves at import — so whichever side loads
second breaks, and if that is this package, it breaks on load. Opt-in registration would remove it,
and is the change to make if it ever bites; nothing needs it today.

## The platform owns what the platform is good at

A component wraps the real element wherever one exists — `<ui-button>` renders a `<button>` — so
keyboard activation, the accessible name, disabled semantics and focus behaviour stay the browser's
job. A `<div role="button">` needs every one of them written by hand, and gets one of them wrong.

**Where an element exists but is half-styleable, the limit is published rather than papered over.**
`<ui-select>` wraps a native `<select>`, so the picker a phone opens stays the platform's — and the
drop-down list stays unstyleable, which [docs/select.md](docs/select.md) says in as many words. A
custom listbox would style it and would have to reimplement that picker, which is the trade RFC 0016
declined. Chromium's `appearance: base-select` will eventually remove the trade; adopting it while
one engine has it would make the kit look like two kits.

**Where no element exists, the component says so rather than pretending one does.** `<ui-switch>` is
a native checkbox carrying `role="switch"` and a drawing, because there is nothing else for it to
be: `<input type="checkbox" switch>` is unsupported in the engine this package's suite measures.

**And taking a drawing over is a debt, not a free hand.** `appearance: none` removes the platform's
tick, its mixed-state dash, its target size and its behaviour under forced colors in one
declaration, and every one of those is then this package's to hold — which is why a checkbox here
draws the mixed state it was never asked for, floors itself at 24×24, and names system colours in a
`forced-colors` block. That list is the price of the decision rather than a set of extras, and it is
the reason a component takes the drawing over only where the alternative is worse.

## ARIA association is light-DOM only

Where a component wires an ARIA relationship between elements — a label to a control, help text to
`aria-describedby` — every one of those elements is slotted, and none is rendered into the shadow
root.

Not a preference. An IDREF does not cross a shadow boundary: a `<label for>` inside a component's
shadow root leaves `control.labels` empty, and an `aria-describedby` pointing in resolves to nothing.
Measured in the browser the suite runs in, both ways round. So a component that associates elements
generates the ids and points them at each other, and leaves the elements in the host's tree where the
browser can see them all.

**Where the platform's own association cannot reach, the ARIA one is used instead**, and
`<ui-radio-group>` is what made that concrete. `<label for>` reaches a **labelable** element and
nothing else, so a group — a custom element with a role — is named by `aria-labelledby` pointing at
the same slotted label. The order is the rule rather than the mechanism: `for` wherever it works,
because it names the control _and_ makes the label a click target for it, and a reference only
where it cannot.

**It binds the control itself, not only the text around it**, and `<ui-input>` is what made that
concrete. A styled text field is the obvious candidate for rendering the `<input>` into a shadow
root — and measured there, in this repository's own suite, it is an axe `label` violation at
critical impact with an `aria-describedby` that dangles. So the control is the host's own element,
slotted in, and the component is a box around it.

That cost bought three things back. Attributes are the platform's, so there is no pass-through list
to fall out of step with `type`, `inputmode` or whatever comes next; the control is directly
styleable, being the host's own element in the host's own tree; and **form participation stopped
being a design question**. A native control inside a `<form>` reaches the submit because it is a
native control inside a `<form>` — no `ElementInternals`, no value mirroring. The shape the
accessibility rule forced is the shape that answered the open question.

The cost is a more verbose call site — `<label slot="label">Amount</label>` rather than
`label="Amount"`, and `<ui-input><input /></ui-input>` rather than `<ui-input />`. ARIA element reflection (`ariaLabelledByElements`) would remove it and does cross
the boundary, but its support cannot be verified by a suite that runs one engine, and this is the one
place in the library where being wrong is invisible to everyone who can see.

## Glyphs are adopted, the delivery is owned

The icons come from [Lucide](https://lucide.dev), vendored under its ISC licence; `<ui-icon>`, the
registry behind it and the accessibility contract are this repository's.

**This is the build-versus-adopt rule aimed at the axis that actually carries cost.** RFC 0016 turned
that question on accessibility and interaction behaviour, and neither exists for an icon — there is
no APG pattern for drawing a padlock. What a glyph set costs is volume and optical consistency:
hundreds of marks on one grid at one stroke weight, each corrected by eye. That is designer-months
with no differentiation at the end of it, so drawing our own was an easier reject than Zag's was.

Adopting gives up no source. Under ISC the SVGs are copied in and are ours to edit, with no upstream
to fight — the copy-in model RFC 0016 wanted for components and could not have.

**A glyph module carries the geometry alone.** Every Lucide SVG has the same wrapper — 24 grid,
`fill="none"`, `stroke="currentColor"`, one stroke width — and that wrapper belongs to the element,
which is what keeps the grid, the stroke and the colour one decision rather than two thousand.

**The glyph is selected by an attribute, not by a value passed in**, and that follows from the first
decision in this document: a page that only emits tags has no way to hand a component a value. So
importing a glyph module registers it, and `<ui-icon name>` starts working. The price is a global map
of names and one silent failure — an unregistered name draws nothing — which is why the element says
so in the console rather than leaving a blank box.

**A mark the set does not have is slotted rather than registered**, and gets the adopted grid's
stroke, caps and colour applied to it — so a brand glyph is indistinguishable from a vendored one,
which is the condition under which drawing your own is worth doing at all.

## The accessibility bar

**Every component meets WCAG 2.2 AA and conforms to its WAI-ARIA APG pattern.**

Verification is two-layered, because automated tooling catches only a fraction of failures:

- **Automated**, and wired into the `test` verb: axe-core runs over each component in a real
  browser, across the WCAG A/AA tags, and any violation of serious or critical impact fails the
  suite. Tests run in a browser rather than a DOM emulator precisely because shadow DOM, focus and
  event ordering are where an emulator and a browser disagree.
- **Manual**, and required per component: a keyboard-only pass and a screen-reader pass. This is a
  recurring cost the automated floor cannot absorb.

## Every visual decision is a token

Colour, radius, spacing and motion are CSS custom properties with fallbacks, so a host restyles the
kit without forking it. Components read `var(--ui-*, fallback)`; a hardcoded value is a decision a
host cannot override.

Tokens are also the single source of truth that keeps a native shell reachable later, which is why
they exist from day one rather than being extracted once something needs them.

### The set splits into grounds and derivations

A **ground** carries a literal value and is declared at `:root`. A **derived** role carries a
formula — `color-mix()` over the grounds — and is declared nowhere: it lives in the `var()` fallback
at the point of use.

That placement is the whole of it, and the alternative was measured rather than argued about. A
derivation written beside its grounds resolves **once**, against the grounds in force there, and
freezes — a dark subtree then inherits the light mix, and a themed region inherits the untheme'd
one, with nothing anywhere to read. In the fallback it resolves against the grounds in force at that
element instead, so a hover colour follows a scheme and a theme without either restating it.

The price is real and is stated where a consumer meets it: a derived name is **write-only**. You can
override one; nothing can read one back. What it buys is an override surface a host can hold in
their head — change the accent and the hover and pressed colours follow, rather than being one more
name each.

### A theme and a scheme are two axes

A **scheme** is the light or dark rendering of whichever theme is in force, selected with
`color-scheme`, with each ground carrying both of its values in one `light-dark()`. A **theme** is a
named set of decisions, selected with the `data-ui-theme` attribute. They are independent: two
themes cost two blocks rather than two blocks plus two guarded media queries, and a whole theme is
four grounds.

### Motion is tokens, and reduced motion is one rule

Components read a **purpose** — `--ui-duration-state` — over a scale named by ordinals with gaps, so
inserting a step later is additive rather than a rename. `prefers-reduced-motion` is honoured once,
in the token layer, and collapses every duration to `0.01ms` rather than to zero — at zero a
transition still lands but fires no `transitionend`, so anything awaiting the end of one waits
forever, and only for the people who asked for less motion.

That is the argument for motion being tokens at all, and it is stronger than the theming one: a
hardcoded `150ms` is not merely un-overridable, it is an accessibility defect that every component
would otherwise have to fix on its own.

### One value cannot follow the scheme, and it says so

`light-dark()` takes **colours**, so a ground whose value is not a colour has no way to carry a
second one — and elevation is the first such category to arrive. `--ui-elevation-100` is a
`box-shadow`, one value in both schemes, and on a dark page it does almost nothing: it is black at a
low alpha, and black on charcoal is black.

The answer is at the component rather than in the token layer, because that is where it can be
judged: `<ui-card>` draws a **boundary** as well as a lift, and the boundary is derived — it mixes
toward the text, so it is correct in both schemes by construction. The shadow is the light scheme's
cue; the edge is what both schemes have. A scheme-aware shadow would mean a second axis in the
emitter for one category, and the thing it would buy is available from a name that already exists.

### A category arrives with the component that consumes it

Elevation lands with a card, a type scale with a table, `success` and `warning` with a toast — not
before. The rule cuts the other way as often as it looks like it will: the first overlay was
expected to bring a layering category, and brought none, because a modal `<dialog>` is promoted to
the top layer and there is no `z-index` anywhere in it to name. `<ui-checkbox>`, `<ui-switch>` and
`<ui-radio-group>` brought none either, being drawn entirely from the boundary and the accent that
were already there — a component arriving with no category is the schedule working, not a corner
being cut. Values chosen with no component to judge them against get corrected when one arrives, and
correcting a published default silently moves the rendering of every host that did not override it.

**The exception is a component's own interaction states, which are not a later category but a
present defect.** A component that accepts interaction and shows no feedback is incomplete, so
`:hover` and `:focus` ship together with the component or the component does not ship.

This is a schedule, not a licence to invent: a name is checked against the categories the token
layer declares, and one matching none fails the suite. What made an unmanaged token set a pile was
never lateness — it was each component naming things its own way.

## Distribution

A versioned npm package in its own repository, ESM only. No dual build: a package that ships two
formats ships two behaviours and debugs three.

The quality bar mirrors the ecosystem's PHP side — strict types, strict lint, a coverage floor, and
a mutation floor at 100% — so a consumer gets the same guarantees whichever language an artifact is
written in.

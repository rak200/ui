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

## ARIA association is light-DOM only

Where a component wires an ARIA relationship between elements — a label to a control, help text to
`aria-describedby` — every one of those elements is slotted, and none is rendered into the shadow
root.

Not a preference. An IDREF does not cross a shadow boundary: a `<label for>` inside a component's
shadow root leaves `control.labels` empty, and an `aria-describedby` pointing in resolves to nothing.
Measured in the browser the suite runs in, both ways round. So a component that associates elements
generates the ids and points them at each other, and leaves the elements in the host's tree where the
browser can see them all.

The cost is a more verbose call site — `<label slot="label">Amount</label>` rather than
`label="Amount"`. ARIA element reflection (`ariaLabelledByElements`) would remove it and does cross
the boundary, but its support cannot be verified by a suite that runs one engine, and this is the one
place in the library where being wrong is invisible to everyone who can see.

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

### A category arrives with the component that consumes it

Elevation lands with a card, a type scale with a table, `success` and `warning` with a toast — not
before. The rule cuts the other way as often as it looks like it will: the first overlay was
expected to bring a layering category, and brought none, because a modal `<dialog>` is promoted to
the top layer and there is no `z-index` anywhere in it to name. Values chosen with no component to judge them against get corrected when one arrives, and
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

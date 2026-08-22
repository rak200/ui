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
carried before anything uses it is a claim the code does not back up. It arrives with the first
component that has dismissable layers, focus trapping or roving tabindex.

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

Colour, radius and spacing are CSS custom properties with fallbacks, so a host restyles the kit
without forking it. Components read `var(--ui-*, fallback)`; a hardcoded value is a decision a host
cannot override.

Tokens are also the single source of truth that keeps a native shell reachable later, which is why
they exist from day one rather than being extracted once something needs them.

## Distribution

A versioned npm package in its own repository, ESM only. No dual build: a package that ships two
formats ships two behaviours and debugs three.

The quality bar mirrors the ecosystem's PHP side — strict types, strict lint, a coverage floor, and
a mutation floor at 100% — so a consumer gets the same guarantees whichever language an artifact is
written in.

A canary paragraph, added by a commit whose author is not a GitHub account.

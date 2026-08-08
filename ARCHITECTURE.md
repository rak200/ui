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

The trade-off is stated rather than hidden: a short vendor-style prefix — the web-components
convention, `sl-` or `md-` or `ion-` — would collide less on a page that combines this kit with
another. `ui-` is generic, and that risk is accepted in exchange for a prefix that matches its
source. A consumer mixing kits should expect to check for a clash.

## The platform owns what the platform is good at

A component wraps the real element wherever one exists — `<ui-button>` renders a `<button>` — so
keyboard activation, the accessible name, disabled semantics and focus behaviour stay the browser's
job. A `<div role="button">` needs every one of them written by hand, and gets one of them wrong.

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

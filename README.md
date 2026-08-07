# @rak200/ui

[![CI](https://github.com/rak200/ui/actions/workflows/ci.yml/badge.svg)](https://github.com/rak200/ui/actions/workflows/ci.yml)
[![Latest tag](https://img.shields.io/github/v/tag/rak200/ui?sort=semver)](https://github.com/rak200/ui/tags)
[![node](https://img.shields.io/badge/node-%3E%3D22-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Mutation testing](https://img.shields.io/badge/Stryker-MSI%20100%25-brightgreen)](stryker.config.js)
[![Code style](https://img.shields.io/badge/code%20style-Prettier-blue?logo=prettier&logoColor=white)](prettier.config.js)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![SemVer](https://img.shields.io/badge/semver-2.0.0-blue)](https://semver.org/spec/v2.0.0.html)

Host-agnostic custom-element UI components for the rak200 ecosystem.

They are **custom elements**, so they work in any page and any framework — or none. That is the
whole point: a component welded to one framework is not reusable outside it, and this kit exists to
be reused. Built with [Lit](https://lit.dev) for a thin runtime with no build step required of the
host. See [RFC 0016](https://github.com/rak200/devr/blob/master/docs/proposals/0016-ui-component-library.md)
for how that was decided and what was rejected.

## Install

```bash
npm install @rak200/ui
```

## Use

```html
<script type="module">
  import '@rak200/ui';
</script>

<rak-button>Save</rak-button>
<rak-button variant="secondary">Cancel</rak-button>
<rak-button disabled>Unavailable</rak-button>
```

Every visual decision is a CSS custom property, so a host restyles the kit without forking it:

```css
:root {
  --rak-color-accent: rebeccapurple;
  --rak-radius: 0;
}
```

## Documentation

The reference lives in [docs/](docs/README.md) — one page per unit.

## Status

**v0.** One component and the token layer, built to the ecosystem's full quality bar rather than
sketched: type-checked at the strictest available setting, formatted, tested in a real browser
and **asserted against axe** for WCAG A/AA, 100% coverage and **100% mutation score**, scanned, and
every public symbol documented. The v0
surface in RFC 0016 grows from here — see [ROADMAP.md](ROADMAP.md).

# @rak200/ui

[![CI](https://github.com/rak200/ui/actions/workflows/ci.yml/badge.svg)](https://github.com/rak200/ui/actions/workflows/ci.yml)
[![Latest tag](https://img.shields.io/github/v/tag/rak200/ui?sort=semver)](https://github.com/rak200/ui/tags)
[![node](https://img.shields.io/badge/node-%3E%3D22-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![ESLint](https://img.shields.io/badge/ESLint-strictTypeChecked-4B32C3?logo=eslint&logoColor=white)](eslint.config.js)
[![Mutation testing](https://img.shields.io/badge/Stryker-MSI%20100%25-brightgreen)](stryker.config.js)
[![Code style](https://img.shields.io/badge/code%20style-Prettier-blue?logo=prettier&logoColor=white)](prettier.config.js)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![SemVer](https://img.shields.io/badge/semver-2.0.0-blue)](https://semver.org/spec/v2.0.0.html)

Host-agnostic custom-element UI components for the rak200 ecosystem.

They are **custom elements**, so they work in any page and any framework — or none. That is the
whole point: a component welded to one framework is not reusable outside it, and this kit exists to
be reused. Built with [Lit](https://lit.dev) for a thin runtime with no build step required of the
host. See [ARCHITECTURE.md](ARCHITECTURE.md) for how that was decided and what was rejected.

## Install

```bash
npm install @rak200/ui
```

## Use

```html
<script type="module">
  import '@rak200/ui';
</script>

<ui-field>
  <label slot="label">Amount</label>
  <ui-input><input type="number" name="amount" /></ui-input>
  <span slot="help">In BRL, two decimals.</span>
</ui-field>

<ui-field>
  <label slot="label">Currency</label>
  <ui-select>
    <select name="currency">
      <option value="brl">Real</option>
      <option value="usd">Dollar</option>
    </select>
  </ui-select>
</ui-field>

<ui-field>
  <label slot="label">Email notifications</label>
  <ui-switch><input type="checkbox" name="notify" checked /></ui-switch>
</ui-field>

<ui-button><ui-icon name="check"></ui-icon> Save</ui-button>
<ui-button variant="secondary">Cancel</ui-button>
<ui-button disabled>Unavailable</ui-button>

<ui-dialog>
  <h2 slot="title">Delete account</h2>
  <p>This cannot be undone.</p>
  <ui-button slot="actions" variant="secondary">Cancel</ui-button>
  <ui-button slot="actions">Delete</ui-button>
</ui-dialog>
```

Every visual decision is a CSS custom property, so a host restyles the kit without forking it:

```css
:root {
  --ui-color-accent: rebeccapurple;
  --ui-radius: 0;
}
```

## Playground

**[rak200.github.io/ui](https://rak200.github.io/ui/)** — every component, rendered, with its
variants and states side by side and an accessibility panel over each one.

It follows `master` rather than the latest release, so it can show a component a published version
does not contain. The commit it was built from is stamped in the sidebar, so you can always tell
which one you are looking at.

## Documentation

The reference lives in [docs/](docs/README.md) — one page per unit. The playground shows the
components; `docs/` is what describes them.

## Status

**v0.** Sixteen components — `<ui-button>`, `<ui-card>`, `<ui-field>`, `<ui-dialog>`, `<ui-input>`,
`<ui-textarea>`, `<ui-checkbox>`, `<ui-switch>`, `<ui-select>`, `<ui-radio-group>`, `<ui-radio>`,
`<ui-tooltip>`, `<ui-toaster>`, `<ui-toast>`, `<ui-menu>` and `<ui-icon>` — the token layer
under them, and an adopted glyph set, built to the ecosystem's full quality bar rather than
sketched: type-checked at the strictest available setting, formatted, tested in a real browser and
**asserted against axe** for WCAG A/AA, 100% coverage and **100% mutation score**, scanned, and
every public symbol documented. The v0 surface in
RFC 0016 grows from here — see [ROADMAP.md](ROADMAP.md).

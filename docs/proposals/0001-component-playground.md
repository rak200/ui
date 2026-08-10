# RFC 0001 — Component playground

- **Status**: Accepted
- **Scope**: library
- **Created**: 2026-08-08

## Motivation

There is no way to **see** a component. `docs/button.md` states the API; it does not state what the
button looks like, how the variants differ, or whether focus is visible. Trying one means cloning
the repository, installing, building and writing a page — the whole cost paid up front, by the
person least invested in paying it.

Today that cost is small, because two components ship. **Eleven open issues carry twelve more** —
issues #13 through #23, the first of them holding `ui-input` and `ui-textarea` together — and each
lands with an API nobody can exercise without local setup. The moment to decide is before those
twelve, not after: whatever is chosen, every component after it inherits the shape.

**RFC 0016 does not answer this.** It settles the component surface, the accessibility bar, Lit
against Stencil, theming and mobile reuse; it says nothing about a playground, a demo or a published
page. So this is an open design decision rather than the implementation of a decided one.

This proposal is a **daughter of RFC 0016**, which decided this library and created this repository.
0016 stays where it was written — age is not ownership — and a playground for these components is
owned here, so the numbering in this repository starts at 0001.

### What is already settled

Four premises are fixed. They narrow the study rather than pre-empting it.

**The audience is a consumer evaluating the package**, not a maintainer prototyping locally. The two
do not produce a smaller and a larger version of the same thing: a maintainer needs no publication
at all, and an ignored local page would suffice; a consumer needs a public, versioned surface, which
makes the playground part of what this repository ships.

As first written, this premise ended _"and binds it to the release process"_ — and that half is
**retired by the study rather than carried by it.** It was an expectation, set before anything here
was measured, and the mechanism does not offer it: the release path cannot start a deploy at all, so
the site follows a branch. What survives is the half that did the premise's actual work — the
playground is part of what this repository ships, reviewed and gated like the rest of it, rather
than a maintainer's page nobody else sees. Which branch, and what that costs a reader, is settled
under Decision B.

**Interactivity is a bonus, not a requirement.** Being able to edit an example and watch it change
is worth having and is not worth buying. A surface that only _shows_ the components satisfies the
audience above; one that also lets them be edited is better, at equal cost and not above it.

A bonus is not a tie-break waiver, though, and the study turned that around: every surviving
candidate clears the requirements, so **what they do with the bonus is what separates them**. The
comparison is in the Decision, under B.

**`docs/` is not absorbed, whatever is chosen.** It stays where it is, in the repository, read as
files. It is not a rendering of the docblocks and would lose most of itself if it became one — the
pages carry the reasoning a signature cannot, and a reader already consuming the package opens
`docs/` first. Any candidate whose pitch is _one site for everything_ is therefore pitching a
downgrade.

That fixes the split this proposal is working inside: **`docs/` serves consumption after adoption; a
playground serves evaluation before it.**

**The target is dozens of components, several of them complex.** Charts, and tables that search and
sort, are planned rather than hypothetical. The fourteen the queue implies today are the beginning
of the surface, not its size. Two things follow, and both bear on the choice rather than on the schedule:

- **A shell for dozens needs grouping and search**, not a list. That is the difference between a page
  and a site, and it is the line the reference artifact below already sits on — jQuery UI groups its
  own catalog into _Interactions_ and _Widgets_ precisely because a flat list stopped working.
- **An example for a sortable table is not a block of markup.** It needs data and state, so whatever
  holds examples has to hold scripts too. Any design here that assumes an example is a string of HTML
  is designed for the two components that ship today.

Which tool produces that surface is open, and is what the rest of this document studies.

## Study

Every version and date below was read from the npm registry on 2026-08-08. Everything described as
extracted, served or rendered was **run**, not recalled, on the same day — the reproduction steps are
given where the result decided something.

### How the components reach a page at all

This cuts across every candidate below rather than being one of them, and measuring it first removes
a constraint the rest of the study would otherwise inherit.

The package is already published as ESM, so a CDN serves it. Which one matters:

```
esm.sh/@rak200/ui@0.2.1            rewrites the bare import to /lit@^3.3.3?target=es2022   works
jsdelivr /npm/@rak200/ui/+esm      bundles, rewrites lit to /npm/lit@3.3.3/+esm            works
unpkg  /@rak200/ui/dist/index.js   serves it raw; dist/button.js opens with
                                   `import { LitElement, css, html } from 'lit'`           fails
```

`esm.sh` answers with `Access-Control-Allow-Origin: *`, so even a page loaded over `file://` may
import it. Verified end to end: a plain HTML file whose only script is

```html
<script type="module" src="https://esm.sh/@rak200/ui@0.2.1"></script>
```

renders `<ui-button>` in all three variants and a fully wired `<ui-field>`, from disk, with no build
step and no bundler.

**Two consequences, and the second is the larger.**

_Versioning is asymmetric between surfaces._ A CDN URL carries the version for free —
`@rak200/ui@0.2.1` _is_ the version. GitHub Pages gives one site per repository, so a published page
has one URL and shows one version unless subpaths are added under it. Which is a capability of
whatever builds the site, not a constraint Pages imposes: only Docusaurus ships it among the
candidates, and the comparison belongs with them.

_And if nothing needs building, Pages needs no workflow._ The requirement to source Pages from
GitHub Actions follows entirely from `dist/` being git-ignored. A page that loads from a CDN builds
nothing, so Pages can deploy from a branch folder instead — no workflow, no `pages: write`, no
`id-token: write`, and none of the seeded-`release.yml` problem recorded below. That is documented
GitHub behaviour, **not exercised here**; a branch deploy also runs Jekyll unless a `.nojekyll` file
is present.

#### A third delivery, measured: an import map

The CDN buys _no build_ at the price of a third party's uptime, and a bundler buys independence back
at the price of a build. There is a third option, and the claim under test was whether it actually
works: **vendor the runtime graph and resolve it with an import map** — no bundler, no third party.

Reproduction: install `@rak200/ui@0.2.1`, copy the resolved packages into `vendor/`, declare an
import map, serve the folder over HTTP and load it in Chromium under Playwright.

The map is **eleven entries** — a bare name and a trailing-slash prefix per package, plus the package
itself:

```json
{
  "@rak200/ui": "./vendor/@rak200/ui/dist/index.js",
  "lit": "./vendor/lit/index.js",
  "lit/": "./vendor/lit/",
  "lit-html": "./vendor/lit-html/lit-html.js",
  "lit-html/": "./vendor/lit-html/"
}
```

…and the same pair again for `lit-element`, `@lit/reactive-element` and `@lit-labs/ssr-dom-shim`.

**It works, with nothing left over.** The page rendered, `<ui-button>` upgraded with a real `<button>`
in its shadow root, and `<ui-field>` wired itself exactly as the suite asserts: `label.htmlFor` and
the input's `id` both `ui-field-1-control`, `aria-describedby` reading
`"ui-field-1-error ui-field-1-help"` with the error first, and `aria-invalid="true"`. **Zero external
requests**, no console errors, no failed requests.

The cost, measured rather than guessed:

```
11 requests, 29,771 bytes total
   7,309  lit-html/lit-html.js
   6,603  @rak200/ui/dist/field.js
   6,306  @lit/reactive-element/reactive-element.js
   3,163  @rak200/ui/dist/button.js
   1,862  @rak200/ui/dist/tokens.js
   …
```

Two details worth keeping. Copying the packages whole is 4.7 MB on disk, of which **29 KB is what a
visitor actually fetches** — so vendoring should copy the reachable graph, not the packages.
And `@lit-labs/ssr-dom-shim` installs but never loads in a browser: the runtime graph is four
packages, not five.

So the item is not a two-way choice. **Independence from a third party does not require a bundler**;
it requires eleven lines of JSON and a copy step.

### The shape being asked for

`jqueryui.com/dialog/#animated` is the reference artifact — an old site whose shape is exactly what
this proposal wants, which is why age does not disqualify it. Four parts, and they are separable:

1. **A catalog shell.** A persistent sidebar listing every component, grouped, so a reader moves
   between them without going back.
2. **Named variants per component.** _Default functionality_, _Animation_, _Modal form_ — one page
   per component, several examples inside it, each addressable.
3. **A live rendering, isolated.** The component running in a bordered frame, not a screenshot.
4. **View source.** The code of the running example, on demand.

Parts 3 and 4 are one component's worth of work and are what candidate 4 and the CDN finding already
solve. **Parts 1 and 2 are a site**, and they are the part that scales with the component count: at
two components a shell is a heading and a horizontal rule, and at fourteen it is navigation.

That distinction is what the rest of this section is measured against.

### What an example has to be able to show

Three capabilities, raised as requirements of the surface rather than as properties of a tool. Two
cost nothing anywhere. The third has a measured constraint, and it decides a design detail rather
than a candidate.

**Visual states — hover, focus, transitions, disabled.** No candidate is limited. Anything rendering
live shows them, which is the whole difference between a playground and a screenshot.

**Theme switching is the constrained one, and the constraint is iframes rather than tools.** This
library's entire theming story is CSS custom properties, so a theme switcher is a control that sets
`--ui-*` above the examples. Measured, with an override on the outer page's `:root`:

```
--ui-color-accent: rgb(102, 51, 153)
  rendered inline     -> rgb(102, 51, 153)   picked it up
  rendered in iframe  -> rgb(37, 99, 235)    the default, untouched
```

Custom properties cross **shadow** boundaries — the inline one reached through the component's own
shadow root — and do not cross **document** boundaries. So one control theming every example on a
page needs either inline rendering, or a tool with its own channel into the frame. Storybook's
globals and decorators are exactly such a channel, and `@storybook/addon-themes` is that mechanism
packaged. A sandbox embed has none, which makes candidate 6 the one place a global theme switcher is
simply unavailable.

And a note against the reference artifact: jQuery UI framed every demo for style isolation. This
library needs less of that than it did — each component already carries a shadow root, so the site's
own CSS cannot leak into one, and the usual reason to reach for an iframe is mostly already paid for.

**The accessibility bar is an asymmetry.** Storybook's `addon-a11y` runs axe per story and shows the
result in a panel; no other candidate has one, and building it means running axe in the page and
rendering the output. That reverses the sign on something recorded above as pure cost: a second axe
configuration is a liability when nobody asked to see the results and a feature when someone did. It
is still a second configuration, and it would have to agree with the bar `tests/a11y.ts` already
sets, in public.

### The candidates

Seven, grouped by what kind of thing each is. Every one ends with where its output would live,
because that differs more than the tooling does.

**1. A page this repository writes.** Plain HTML and CSS, no generator. Cheapest in tooling; its
cost is that it puts each component's API in a third place — source, `docs/*.md`, page — with
nothing verifying the third.
_Available at:_ GitHub Pages, `https://rak200.github.io/ui/`.

**2. A documentation-site generator.** A custom element is just HTML, so markdown pages embed the
tags with no adapter involved. The third premise removes the claim that this class would absorb
`docs/`, but the reference shape exposes a second one: **a generator gives parts 1 and 2 for free** —
sidebar, routing, per-page anchors and highlighting are its whole product, and they are exactly the
parts that scale with the component count. Authoring is a markdown file per component, which is the
lightest of any candidate here.

Two things qualify that, and both are measured rather than felt.

_The class splits, and only half of it includes the shell._ **Docs themes** — Starlight 0.41.7 on
Astro, VitePress 1.6.4, Docusaurus 3.10.2 — ship the sidebar, search and prev/next. **Bare
generators** — Eleventy 3.1.6, Astro on its own — give templating and leave the shell to be written
here, which puts them nearer candidate 1 with a build step attached.

| Option              | Framework it brings | Shell   | Majors                                                     |
| ------------------- | ------------------- | ------- | ---------------------------------------------------------- |
| Eleventy 3.1.6      | none                | no      | 1.0 2022-01, 2.0 2023-02, 3.0 2024-10 — one per ~14 months |
| Astro 7.2.0         | none                | no      | 2.0 through 7.0 since 2023-01 — six, two of them in 2026   |
| Starlight (+ Astro) | none                | **yes** | inherits Astro's                                           |
| VitePress 1.6.4     | Vue, 5 packages     | **yes** | 1.0 2024-03, still 1.x                                     |
| Docusaurus 3.10.2   | React, 6 packages   | **yes** | 2.0 2022-08, 3.0 2023-10 — none since                      |

**No option is framework-free, slow-moving and shell-included at once.** Starlight gives the shell
with no rival framework and inherits a major every few months — 6.0 to 7.0 took fourteen weeks.
VitePress and Docusaurus are the calmest by a wide margin and put Vue or React inside a Lit
component library. Eleventy is framework-free and calm and does not bring the shell.

_And the class gives back what the CDN finding won._ A generator **builds**, so Pages returns to an
Actions source, with `pages: write`, `id-token: write`, and a separate workflow because `release.yml`
is a seed. Only a candidate that builds nothing escapes that.

One consequence of the third premise lands here too: with `docs/` staying as files, this option
leaves the repository with **two markdown trees** — one rendered, one not — and nothing marking which
is which.
_Available at:_ Pages.

**3. A component workshop.** `storybook` 10.5.7, published 2026-08-07, with
`@storybook/web-components-vite` and `@storybook/addon-a11y` at the same version. **It is the
reference shape, generalised**: a sidebar of components, several stories per component, each story
rendered in its own frame, and the Docs addon's _Show code_. All four parts, out of the box, with no
manifest involved — a correction to an earlier draft of this document, which argued against
Storybook on its manifest dependency. That dependency is real but narrower than stated: it governs
**generated controls and the API table**, not the catalog. Judged on the shape being asked for,
Storybook is the strongest candidate here. What it costs is a dependency tree heavy for a package
shipping two components, a `.storybook/` configuration surface outside the scaffold, a second place
where each component is described, and `addon-a11y` running axe under its own configuration against
a bar this repository has already chosen and written down. The alternatives in this class do not take
custom elements at all: `@ladle/react` 5.1.1 (2025-11-04) is React-only, and `histoire` is Vue and
Svelte, still at 1.0.0-beta.1 (2026-01-07).
_Available at:_ Pages via `storybook build`; or Chromatic, its own host, which adds per-pull-request
preview URLs but is a third party holding a token — and Layer 1's credential ladder puts a
repo-scoped secret below OIDC.

**4. An in-browser editor embedded in the page.** `playground-elements` 0.21.2, published
2025-10-02, from the Lit team, and what lit.dev itself uses: `<playground-ide>` compiles and previews
in the browser through a service worker, with no server behind it. It is the only candidate that
makes an example editable — which the premise above demotes to a bonus. 25 direct dependencies,
among them six `@material/mwc-*` pinned at `^0.27.0`: the deprecated Material line, superseded by
`@material/web`.
_Available at:_ wherever it is embedded. It is a component, not a site, so it composes with 1 and 2
rather than competing with them.

**5. A manifest, plus editor integration.** A different product rather than a cheaper one: a
playground is where a consumer _evaluates_, and this is where they _work_. It is the only candidate
that reaches the second moment. Studied by running it, in the next section.
_Available at:_ the consumer's editor, with nothing hosted — but _nothing hosted_ is not _nothing to
do_, and what it asks of the consumer instead of a server is measured below.

**6. A third-party sandbox.** An earlier draft called this "a link" and said its content is a
surface no gate here can reach. Both halves were wrong, and measuring the mechanisms is what showed
it.

_Where the example source lives_ is a choice, not a property. CodePen's prefill API carries the
payload in the request, so the example lives in the link. But **StackBlitz and CodeSandbox import
straight from a GitHub path** — `stackblitz.com/github/<owner>/<repo>/tree/<branch>/<path>`,
measured 200 including a subfolder, and `codesandbox.io/p/github/…` the same. With that, the example
files stay in **this repository**, under the same review and the same formatter as everything else.

_Where it renders_ is a second, independent choice. Both services embed in an `<iframe>`, and
`@stackblitz/sdk` — 1.11.1, published **2026-07-02**, the freshest package in this study outside
Storybook and the generators — defines a project in JavaScript and embeds it directly.

|                         | Renders on their domain | Renders inside our page          |
| ----------------------- | ----------------------- | -------------------------------- |
| Source on their service | a saved pen or project  | embed of a saved project         |
| **Source in this repo** | a GitHub-import link    | embed pointed at the same import |

The bottom-right cell is the one the earlier draft missed entirely: version-controlled examples,
rendered by someone else's runtime, inside our own shell.

_Embedding into a Pages-hosted page works, and it was worth measuring rather than assuming_, because
either side could refuse. Measured on both: `microsoft.github.io` — a real Pages site — sends **no**
`Content-Security-Policy`, `X-Frame-Options` or `Permissions-Policy`, so Pages constrains nothing;
and the sandbox embed URLs send no `X-Frame-Options` and no `frame-ancestors`, so they permit
framing. Loading a header-free page in Chromium with both embedded produced no refusal of any kind,
StackBlitz's editor with the file open and _starting dev server…_ against `web-platform.stackblitz.io`,
and CodeSandbox's editor with its file tree.

One trap, avoided by the same measurement: **GitHub Pages cannot set response headers at all**, so a
page hosted there can never be cross-origin isolated. `crossOriginIsolated` read `false` inside both
frames — and the StackBlitz project booted anyway, so the static template does not need it. A
WebContainer project that wanted `SharedArrayBuffer` would have no way to get it here.

What stays true is narrower and still real: **every visitor loads a third party's iframe**, and the
service's uptime becomes the page's. And the fourth premise cuts the other way here — a sandbox
carries scripts and data natively, which is exactly what a chart or a sortable table needs and what a
block of markup cannot express. The CDN finding also removes the install: a sandbox example is a
static HTML file with one script tag, so StackBlitz's `web-platform` template runs it without npm.
_Available at:_ either domain, by the table above — though Decision A settles this to the bottom-right
cell: the source in this repository, embedded in the Pages site.

**7. Nothing.** Recorded so its absence is not read as an oversight. The consumer already has a
runnable path — the CDN line above works in any HTML file — and the reference already exists in
`docs/`. What is missing is curation, not capability. The cost of choosing this is that every
evaluation starts by writing the file this proposal would have written once. **Closed by Decision A**,
which is a decision to host.
_Available at:_ the npm page and `docs/`, as today.

### Against the reference shape

Shape parts 1–2 and 3–4 are collapsed into a column each, because the prose above establishes that
they separate. _Fed by_ is what an author writes to add an example; the two effort columns are
divided into what is paid once and what is paid again per component, which is where the candidates
actually differ.

| Candidate                | Shell (1–2)         | Live + source (3–4) | Fed by                                               | Paid once                                                     | Paid per component                                    |
| ------------------------ | ------------------- | ------------------- | ---------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------- |
| 1. Hand-written page     | by hand             | yes                 | HTML in the repo, a block per example                | a file, and a Pages source                                    | a section, and the navigation grown by hand           |
| 2. Site generator        | **free** if a theme | yes                 | markdown per component, plus a sidebar config        | generator config, a build, a deploy workflow, a major cadence | a markdown file; navigation derives itself            |
| 3. Storybook             | **free**            | yes                 | `*.stories.ts`, one export per variant               | `.storybook/`, the tree, a build, a deploy, an axe-bar ruling | a stories file; sidebar and variants derive from it   |
| 4. `playground-elements` | no                  | editable            | a file set per example                               | a dependency, and a service-worker route on the host          | none of its own — it renders what the host page gives |
| 5. Manifest              | not a site          | no                  | the source, **plus docblock tags**                   | analyser, a converter per editor format, shipping both        | docblock tags, under no gate                          |
| 6. Sandbox               | no                  | editable            | example files **in this repo**, imported from GitHub | one URL pattern, or the SDK for embedding                     | a folder per example, reviewed like any other file    |
| 7. Nothing               | `docs/` sidebar     | no                  | the consumer                                         | none                                                          | none here; one file for every evaluator, every time   |

The two effort columns are judgements read off each tool's structure, **not measurements** — unlike
the version numbers and the extraction results, which were run.

Two things fall out of the _Fed by_ column. **Every candidate but 5 is fed by hand**, so "one source
of truth" was never on offer; and 5's own automatic half was measured above to stop at attributes.
And **candidate 1 is the only one whose recurring cost includes the navigation**: in 2 and 3 the
shell is derived from what the author already wrote, which is the same reason their setup is
heavier.

**So the list is shorter than it looks.** Candidates 1, 2 and 3 are the live ones and they divide on
a single line — whether the shell is written here or comes with the tool — which is what the two
effort columns restate. That division is a way of reading the candidates, not a decision that
precedes them: it is settled the moment one is picked. Everything else in this study — the CDN, the
import map, the manifest, interactivity — is settled or orthogonal.

### The manifest route, measured

The claim under test, and the reason this route was attractive: **a manifest is extracted from the
source, so it cannot drift from it.** Reproduction:

```
npm i @custom-elements-manifest/analyzer      # brings its own typescript
npx cem analyze --litelement --globs "src/*.ts"
```

**It runs on this source, and that was not a given.** These components use no decorators — a
`static properties` map beside plain fields, under `useDefineForClassFields: false`. The analyser
read it: `<ui-button>` came out with `variant` and `disabled`.

**It brings its own compiler, and cannot be pointed at the project's.** `typescript: ~5.4.2` is
declared under `dependencies`, not `peerDependencies`, so it is not configurable. Installed:
**5.4.5, published 2024-04-10**. This repository's is **6.0.3, published 2026-04-16** — one major
line and two years apart. Measured consequence: the two coexist, npm nests the older one, `npx tsc`
still resolves 6.0.3, and **nothing breaks**. The cost is not a broken build. It is that the tool
which would define what the public API _is_ parses the source with a compiler two years behind the
one that defines what that source _means_, and its failure mode is silence.

**The claim is refuted, and here is the refutation.** Run against `src/field.ts` exactly as this
repository has it, `<ui-field>` came out as:

```
attributes: []   members: []   slots: []   cssProps: []   cssParts: []
```

Nothing. The component whose entire API is four slots produced an empty entry, with
`Created new manifest.` and exit code 0 — no error, no warning. The analyser reads the TypeScript
tree, not the contents of Lit's template literals, so none of this is visible to it:

```ts
html`<slot name="help"></slot>`;
css`var(--ui-space, 0.5rem)`;
html`<div part="stack"></div>`;
```

Slots, CSS custom properties and CSS parts exist in a manifest only if someone hand-writes `@slot`,
`@cssprop` and `@csspart` in the docblock. Adding those tags to the same file and re-running
produced all four slots, all four custom properties and the part.

So the manifest does not replace a hand-written API surface; it **relocates** one, from Markdown to
docblocks — and no gate checks docblocks. CI greps `docs/`. `<ui-button>` survives extraction
because its API is two attributes; `<ui-field>` vanishes because its API is slots, and most of the
twelve queued components are the second kind.

**A second defect, visible in the editor.** `variant` is typed `ButtonVariant`, which is
`'primary' | 'secondary'`. The manifest recorded the alias name rather than the union, so attribute
completion offers `ButtonVariant` — not a valid value. It did not drift; it never resolved.

**The bridge to an editor is a third package, and it is also stale.** VS Code does not read
`custom-elements.json`; it reads its own `html.customData` format, and JetBrains reads a third
(`web-types.json`). `custom-element-vs-code-integration` is at 1.5.0, published **2025-01-20**; the
alternative `cem-plugin-vs-code-custom-data-generator` at 1.4.2, published **2023-10-14**. The
former appends `\n---\n` to every description, intending a horizontal rule; Markdown reads `---`
under a paragraph as a setext heading, so the whole description renders as an `<h2>` in the hover.
`api-viewer-element`, the one turnkey viewer, is at **1.0.0-pre.10**, published **2024-04-05** —
never a 1.0.

**And the consumer has to wire it, per project.** VS Code discovers nothing on its own: its HTML
language service reads custom tags only from `html.customData`, so completion exists only while a
`.vscode/settings.json` in the _consuming_ repository points at a file inside `node_modules`. That
declaration is the entire mechanism behind the completion demonstrated above — the package's
presence in the tree does nothing by itself. The extensions that would discover a manifest
automatically are the stalest links in the chain: `custom-elements-languageserver` 1.0.4, published
**2023-11-13**, and `lit-analyzer` / `ts-lit-plugin` 2.0.x, both **2024-01-09**. JetBrains is
documented to pick up a `web-types` field from `package.json` with no per-project setup, which would
make it the one editor where this is free — **not verified here**, for want of a JetBrains install
to test it on.

The route is therefore four packages deep — analyser, converter per editor format, viewer — the
newest of them published over a year and a half ago, and a configuration step in every consuming
repository. And none of it ships today: `@rak200/ui@0.2.1` publishes `dist/` and declares no
`customElements` field, so adopting the route starts by shipping the manifest and a converted file
per editor.

### What the repository already fixes

Not preferences: constraints already in the tree, which eliminate options before taste does.

- **A bare specifier does not resolve in a browser.** `dist/index.js` imports `lit`. A self-hosted
  static page therefore needs a bundler or an import map covering `lit`, `lit-html` and
  `@lit/reactive-element` — unless it loads from a CDN that rewrites, as measured above.
- **Pages is not enabled** on the repository. `dist/` being git-ignored is what would force the
  Actions source; it binds only a candidate that builds something, per the CDN finding above.
- **`.gitattributes`, `.gitignore` and `.prettierignore` are `exact` seeds** of the `ts` variant,
  conformance-checked byte for byte. A new directory cannot be given `export-ignore` here, and a new
  build output cannot be ignored here. Either the playground lives under a path already covered, or
  the shared seed changes in the baseline repository.
- **`release.yml` is a masked seed**, so a deploy cannot be a job inside it — and an
  `on: release: published` workflow would never fire anyway. That file already records why: a tag
  and a Release created with the repository's own `GITHUB_TOKEN` start no new workflow, which is
  what forces `npm-publish` to hang off the release job's outputs. A playground deploy has no
  equivalent thing to hang from. This binds only the candidates that need a workflow; a branch
  deploy never meets it.
- **axe already runs**, inside the `test` verb, across the WCAG A/AA tags, failing on serious and
  critical impact. `tests/a11y.ts` names the ruleset and the bar with their reasons. Any tool that
  brings its own axe brings a second bar.
- **CI asserts that every exported symbol appears somewhere under `docs/`**, by `grep -Rqw`.
  `docs/*.md` is the API surface of record, and the assertion is satisfied by anything under `docs/`
  that merely mentions a symbol.

### The question underneath

It was posed as: does this package keep **one** source of truth for a component's API, or acquire a
second? The measurement sharpens it. No candidate offers one — the manifest route only moves the
hand-written half somewhere less verified. So the real question is **which hand-written surface is
the one a gate can check**, and today that is `docs/*.md`, because CI checks it.

With `docs/` fixed as the reference, the question turns outward: what a playground must not
duplicate. Anything it restates about the API is a second surface by construction, unchecked, and
competing with the page a consumer already opens first.

## Proposed design

Written down so the reasoning is inspectable later rather than re-derived. The Decision below
resolves it to Storybook; these are the properties the design has to hold whichever shell carries
them, and two of them the choice puts under pressure.

- **Each example is defined once and both rendered and displayed from the same source**, so the code
  a reader sees is provably the code that ran. That is _view source_ without a build that could
  disagree with it. The fourth premise sets its bar: _source_ has to mean markup **and script**, or
  the design fits only the components that ship today.
- **No API tables.** The playground links to `docs/`, which the third premise fixes as the reference
  and which CI already checks. Anything restated there is a second surface by construction — which
  is why Storybook's autodocs is a collision to settle rather than a feature to enable.
- **Loading the components needs no build of its own.** Two routes were measured — the CDN and a
  vendored import map — and the second reaches it with no third party. Storybook bundles, so this
  stops governing the site and keeps its value for the examples a reader copies away.

**How the three candidates grouped**, kept because the Decision reads against it. Built-or-adopted
is a lens for comparing them, not a question answerable ahead of them.

- **Candidate 1** puts nothing new in the tree and nothing outside the scaffold, and pays for the
  shell per component: a heading and a rule at two, real navigation at fourteen, grouping and search
  at the scale the fourth premise sets. That premise is the strongest argument against it, and it
  arrived after the option was drafted. Decision C then removed its cheapest version outright — a
  page that is right for two components and replaced later is exactly what _built for what is
  coming_ excludes — so what remains is a hand-built shell generated from a component list, which is
  a smaller thing than a site and a larger thing than a page.
- **Candidates 2 and 3** get the shell complete and keep it complete as the queue lands. The price is
  a dependency tree, a build, an Actions-sourced deploy and a major cadence to carry — plus, for 3, a
  second axe configuration and a second place where each component is described.

**Candidates 4 and 6 are the same slot, and it is not the shell's.** Both are the interactive
example widget that drops into whichever shell wins: `playground-elements` is the self-hosted one,
a StackBlitz or CodeSandbox embed the hosted one. They compete with each other, and the choice
between them is a real one the fourth premise sharpens — an example with data and state is what
both are for. Neither is decided here, and neither has to be: they drop in later without rewriting
the shell.

Head to head on what was measured: `playground-elements` 0.21.2 (2025-10-02) keeps everything
in-house at the price of 25 direct dependencies and six deprecated Material pins; `@stackblitz/sdk`
1.11.1 (2026-07-02) is fresher and lets the example files live in this repository, at the price of a
third-party iframe in every visitor's browser.

**Candidate 7 is closed by Decision A.** Nothing measured ruled it out; the decision to host did.

**Candidate 5 is a separate subject rather than a rejected option.** It answers a different question
— completion while writing code, with nothing hosted — and it is the only candidate that does. It is
not competing with the playground and should not be decided against it. What it would need first:
**the analyser reaching 1.0 and accepting this repository's TypeScript**, a maintained converter,
either template-literal extraction or a gate over the docblock tags, and an editor path that does
not ask every consumer to configure their own workspace. None of those has a date.

## Decision

**Resolved.** This is **two** decisions that prune each other, not one root with consequences
and not a list of parallel questions. Two earlier drafts of this section got the structure wrong in
opposite directions, and both are recorded because the shape of the decision turned out to be part
of the study:

- The first opened with _build the shell or adopt one_. That is circular — whether the shell is
  built or adopted is a property of the candidate, readable off it, not answerable ahead of it.
- The second replaced it with _which candidate_, treating hosting as pure consequence. Also wrong:
  **deciding where it is hosted eliminates candidates**, so the arrow runs both ways.

### Decision A — where it is hosted — **Resolved: GitHub Pages**

The alternatives were a third party's domain or nowhere. Pages is the only first-party option that
costs nothing and needs no external credential; Netlify, Vercel and Cloudflare Pages all mean an
account and a token, which Layer 1's credential ladder puts below an in-platform path. The first
premise points the same way: a public, versioned surface that is _part of what this repository
ships_ is hard to satisfy on someone else's domain.

This **eliminates three things before candidates are compared**:

- **Candidate 7**, by definition — deciding to host is deciding not to choose it.
- **Candidate 6 as the destination**, not candidate 6 entirely. A link out, or a project living on
  their domain, is not hosted here. Its widget role survives intact: embedding a sandbox into a
  Pages-hosted page was measured working, on both sides of the frame.
- **Candidate 5**, which was never a hosting answer. Pages makes that explicit rather than implied.

**It eliminates nothing among candidates 1, 2 and 3.** Every one of them emits static files, which
is what Pages serves. Checked rather than assumed for the one with the most machinery behind it:
`facebook.github.io/docusaurus/` answers 200 and carries Docusaurus markers — a live Docusaurus
site, on Pages, at a subpath. If Docusaurus is ruled out it will be for bringing React into a Lit
component library, not for where it is hosted.

What Pages does impose is shared by all three, and is a configuration step rather than a
disqualification: **the site lives at `/ui/`, not at a domain root.** Every generator has the knob —
`baseUrl` in Docusaurus, `base` in VitePress and Astro, `pathPrefix` in Eleventy — and getting it
wrong is the classic Pages failure, a page that loads with every asset 404. A branch deploy also
runs Jekyll unless a `.nojekyll` file is present, which Docusaurus's own deployment page documents.

**Pages gives one site per repository**, so more than one version reachable at once means subpaths
under it. That is not a requirement and not a deadline — an earlier draft of this section called it
both, and neither survives contact with the mechanism: publishing at `/ui/` first forecloses
nothing, because `/ui/` simply stays as latest when `/ui/0.5.0/` is added beside it. Whether
multi-version is worth having at all, and how much work it is, is a property of the candidate rather
than a question standing on its own — recorded in B's table below.

### Decision C — when — **Resolved: now, and built for what is coming**

Lettered third and placed second, because it was settled after B was framed and it constrains B.

Not _now_ in the sense of a two-component page that gets replaced later. The resolution has two
halves, and the second is the load-bearing one: **the structure has to be ready for the components
that are coming.** Operationally that is a testable criterion rather than an aspiration —

> Adding the twentieth component must not require rewriting the structure.

which rules out the cheapest reading of candidate 1: hand-written HTML, one page per component, a
navigation edited by hand each time. It does **not** rule out candidate 1. It fixes how that
candidate would have to be built — the shell generated from a list of components rather than typed,
so growth is an entry in a data file. That is a real design requirement, and it is the difference
between the version of candidate 1 that is cheap today and the version that is still standing at
thirty components.

For candidates 2 and 3 the criterion is satisfied by construction; it is what their shell _is_.

### Decision B — which candidate, from what A and C leave — **Resolved: Storybook**

Three were live: **1** (a page written here), **2** (a site generator, and then which one), **3**
(Storybook). Candidates 4 and 6 are the example widget and are chosen later, against the winner.

**Resolved on the tie-break below rather than on cost.** All three clear the requirements, so the
bonus column decides, and Storybook takes it outright — the reference shape out of the box, native
controls, a theme toolbar and an accessibility panel. The costs are real and were not discounted:
the tree, a `.storybook/` surface outside the scaffold, a major cadence to carry, and a second axe
configuration. They are prices, not defects, and they are enumerated as consequences below rather
than argued away.

### What follows from the candidates

Nothing in this table is a separate decision. Each column is what the candidate already implies.

|                         | 1. Page written here               | 2. Site generator                                                                                                                                                                                               | 3. Storybook                                                      |
| ----------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Shell (shape parts 1–2) | built here, grows per component    | adopted, if a docs theme                                                                                                                                                                                        | adopted                                                           |
| Delivery                | **all three stay open**            | bundled                                                                                                                                                                                                         | bundled                                                           |
| `vite` declared         | only if bundling is chosen         | the generator's own build                                                                                                                                                                                       | its own build                                                     |
| Pages source            | a branch folder, no workflow       | Actions, plus a workflow                                                                                                                                                                                        | Actions, plus a workflow                                          |
| Second axe bar          | no                                 | no                                                                                                                                                                                                              | **yes, to be reconciled**                                         |
| Rival framework         | none                               | none, VitePress and Docusaurus excepted                                                                                                                                                                         | none                                                              |
| Major cadence to carry  | none                               | the generator's                                                                                                                                                                                                 | Storybook's                                                       |
| Multi-version site      | hand-built, if ever wanted         | **Docusaurus only** — `docs:version`, `versioned_docs/` and a version dropdown; VitePress, Starlight and Eleventy have none                                                                                     | none built in                                                     |
| Theme switcher          | trivial, if examples render inline | trivial, if examples render inline                                                                                                                                                                              | via globals and decorators; `@storybook/addon-themes` packages it |
| Accessibility panel     | hand-built over `axe-core`         | hand-built over `axe-core`                                                                                                                                                                                      | **built in**, and a second axe bar to reconcile                   |
| Search over the catalog | hand-built                         | **Starlight ships Pagefind**, self-hosted; Docusaurus's first-class path is Algolia, a third-party account, with community local search beside it                                                               | built into the sidebar                                            |
| Where its source lives  | a directory chosen here            | the generator's convention — Docusaurus defaults to `'docs'` and VitePress to `docs/`, both of which **collide with the directory the third premise reserves**; Starlight uses `src/content/docs/` and does not | `.storybook/`, plus the stories                                   |

Delivery stays open only under candidate 1, and there the import map measured above is the option
with neither a build nor a third party.

#### The tie-break: once the necessary is tied, the bonus decides

Every live candidate clears everything the premises and the reference shape require — the four parts
of the shape, a theme switcher, an accessibility bar, search, and growth to dozens. The table above
records that they clear it by different routes and at different prices, but for none of them is
_clearing it_ in doubt. So what separates them is the thing the second premise demoted.

Bonus is not one thing, and the four in play are not the same product:

| Bonus                               | 1. Page written here            | 2. Site generator          | 3. Storybook                      |
| ----------------------------------- | ------------------------------- | -------------------------- | --------------------------------- |
| Editing the example's code          | via candidate 4 or 6            | via candidate 4 or 6       | via 4 or 6, against its own idiom |
| Changing props without editing code | hand-built                      | hand-built                 | **Controls, native**              |
| One theme across every example      | hand-built, trivial when inline | hand-built, trivial inline | **globals, native**               |
| Accessibility results in the UI     | hand-built over `axe-core`      | hand-built over `axe-core` | **`addon-a11y`, native**          |

**Storybook takes that column outright**, and two qualifications stop it being the end of the
argument.

_Its controls are cheaper to hand-build here than the comparison implies._ For a custom element,
changing a prop is setting an attribute — a small form calling `setAttribute` covers what Controls
does, with none of the adapter machinery a framework component would need. And Storybook's
_auto-generated_ controls read the `custom-elements.json` measured above; hand-written `argTypes`
work without it, which is the same hand-maintained surface under another name.

_And native bonuses arrive bundled with the costs already recorded_ — the tree, a second axe
configuration to reconcile in public, a second place where each component is described. A bonus that
comes built in is also one that cannot be declined.

### What Decision B settles

Read off the table above, and no longer open:

- **The shell**, complete, and search with it.
- **Delivery: bundled**, by Storybook's own Vite builder. The CDN and the import map stop being
  candidates for the site itself — the import-map measurement keeps its value only for sandbox
  examples and for anyone copying one.
- **`vite` needs no declaration here.** `@storybook/builder-vite` brings it, which retires an item
  that had been open since the first draft.
- **Pages is sourced from Actions**, with a `pages.yml` of its own — `release.yml` is a seed and
  cannot host the job, and the release path triggers no workflow, so it runs on pushes to `master`.
  Under Decision A the branch-deploy shortcut is off the table, because Storybook builds.
- **`pages: write` and `id-token: write`** are needed, capped in the caller as every workflow here
  caps them.
- **Where its source lives**: `.storybook/` at the root, plus the stories.
- **Multi-version**: none built in. If it is ever wanted it is subpaths, hand-arranged.

**The site follows a branch — `master`, on every push — and that is where the first premise gave
ground.** The published site shows the tip of the branch, which can be ahead of the latest published
version: a consumer evaluating `0.2.1` may be looking at a component `0.2.1` does not contain. It is
written here rather than left to whoever wires the deploy, because it is visible to every reader of
the site.

**A convergence, not a concession.** _Bound to the release process_ entered this document as an
expectation in the first premise and left it as a refuted one, on the mechanism rather than on
taste: `release.yml` pins `npm-publish` as a job of its own, hanging off
`needs.release.outputs.release_created`, and the seed is `masked:@<semver>` — every byte but the
version pin is fixed, so no deploy job can join it there. Issue #28 carried the same expectation
(_a deploy is a release step, the same shape as `npm-publish.yml`_), and it is the one thing in that
issue this study contradicts.

A `workflow_run` trigger on the release workflow is the shape a release-following site would take,
and it is **not measured here**. Nor is it clearly wanted: this surface exists for evaluation
_before_ adoption, and what is coming serves that reader better than what shipped. What the site
owes them instead is being unambiguous about which it is, so **the build stamps the commit it came
from** — one line of Storybook configuration, carried in the Rollout.

### What Decision B opens

Five, and the first two are collisions with principles this document already fixed rather than
ordinary configuration.

1. **The second axe bar — Resolved: one ruleset, two readers; the panel never gates.**
   `addon-a11y`'s `parameters.a11y.options` is typed `RunOptions` — the same axe-core type
   `tests/a11y.ts` declares its ruleset as — so the suite's object is passed verbatim. One constant,
   two readers, nothing that can drift. And `test: 'off'`: the suite is the gate, the panel
   displays. Stated because otherwise someone later turns the panel into a second gate that can
   disagree with the first.

   **The impact asymmetry is accepted rather than configured away.** The addon has no impact filter
   — checked against its type definitions, `impact` appears nowhere in them — so the panel shows the
   `minor` and `moderate` violations the suite tolerates. The alternative is switching rules off
   through `config`, one by one, which is exactly what `tests/a11y.ts` refuses in writing. So the
   panel reports more than the gate blocks on, deliberately. The residual risk is a reader counting
   violations on the published site and concluding the bar is lower than it is; that is answered in
   prose beside the story, not in configuration.

   **It costs one change to existing code.** `tests/a11y.ts` imports `vitest` and does not export
   its ruleset, so importing it from `.storybook/preview.ts` would pull the test runner into the
   Storybook bundle. The ruleset moves to a module of its own, free of the runner, which both read.

2. **Autodocs against _no API tables_ — Resolved: Controls yes, autodocs no.** Looking closely, this
   is two surfaces rather than one, and only the second is avoidable. **Controls is already a list of
   props** — name, type, default, in a panel — and it is the bonus that won the tie-break, so the
   surface cannot be declined without declining the reason for the choice. **Autodocs is the other
   thing**: a static page with an ArgTypes table and prose, which duplicates
   `docs/<component>.md` outright. It is opt-in, carried by a tag (`AUTODOCS: 'autodocs'` in
   Storybook 10's own types), so not enabling it is the whole of the fix. Without the CEM manifest —
   rejected above — that table would be assembled from hand-written `argTypes` anyway: a
   hand-maintained duplicate of a reference that already exists.

   **The rule that keeps the surviving surface honest:** `argTypes` carry _control affordance, not
   documentation_. A name and a control type, so the panel works. What a variant means, when to
   reach for it, and the edge cases stay in `docs/`, which is the surface CI checks. The principle
   survives in a more accurate form than _no API tables_ ever stated it: the playground may **show**
   the API, and does not **describe** it.

   What this leaves is a written rule with no gate behind it — nothing stops a `description` being
   typed into an `argType`. It is the same kind of rule as _narrowing the bar is a change to the
   file_, and carries the same weakness.

3. **What stories import — Resolved: the package name, never a path into `src/`.** The question was
   posed as _source or published package_, and that framing was off: the deploy runs on pushes to
   `master`, so both show the same source. The real difference is narrower — whether a story goes
   through the package's public entry or reaches under it. A story importing `../src/button.js` can
   use something `src/index.ts` does not export, and then the demo shows a consumer something they
   cannot have. So stories import `@rak200/ui`, and how that name resolves is a build detail: an
   alias to `src/index.ts` keeps hot reload while still pointing at the barrel rather than at files.

   Resolving to `dist/` instead was considered and dropped: `build` is `tsc`, a mechanical
   transform, and `validate` is already `npm run build && publint --strict`, so the packaging claims
   have a check of their own. The marginal catch does not pay for building before the playground can
   open.

   **And unlike item 2, this one can be gated.** `eslint.config.js` is not a seed, so the stories
   tree can carry `no-restricted-imports` against `**/src/*`. The rule then fails inside `analyse`,
   which `ci / gate` already runs — a convention with a check behind it rather than a sentence
   hoping to be read.

4. **Where the story files live — Resolved: `stories/`, mirroring `src/`.** Layer 2's refusal to
   colocate `*.spec.ts` inside `src/` transfers word for word — the files would sit inside the
   published tree, and every tool that must not see them would carve them out by filename. So
   `stories/button.stories.ts` beside `tests/button.test.ts`, one file per unit, the same mirror
   Layer 1 asks for. The `.stories.ts` suffix inside a dedicated tree is redundant in exactly the way
   `.test.ts` already is, and consistency settles it. `tokens.stories.ts` is not the mirror being
   forced: a page of swatches is the thing missing today for seeing the palette at all.

   Checked rather than assumed, and it is the whole argument: **nothing needs a carve-out.**
   `coverage.include` is `['src/**/*.ts']`, Stryker mutates `src/`, and `tsconfig.build.json`
   includes `src` — a `stories/` tree falls outside all three with no line added anywhere. What it
   does need is `"stories"` in `tsconfig.json`'s include, and `/stories/` with `/.storybook/` named
   in the `ts` `.gitattributes` seed.

5. **The toolchain has to reach them — Resolved: through the `test` verb, not a ninth one.** The
   mechanical half is nothing: prettier already formats `.`, eslint already lints everything outside
   `dist/`, `coverage/` and `.stryker-tmp/`, and Stryker's `mutate` is
   `['src/**/*.ts', '!src/**/*.d.ts', '!src/**/*.test.ts']`, so a story is never mutated as source.
   `"stories"` and `".storybook"` join `tsconfig.json`'s include — required, not tidiness: the
   shared ESLint config sets `parserOptions: { projectService: true }`, so a TypeScript file outside
   the program has no type-aware linting to fail with. The two scripts Storybook needs are not verbs
   — `build` is already the precedent for a script outside the eight.

   **What the toolchain reaches and should not is the build output.** `storybook build` writes
   `storybook-static/`, and nothing in this repository ignores it. `.gitignore` is an `exact` seed,
   so it cannot be ignored locally — the directory shows up untracked after any local build, one
   `git add .` from being committed. And `eslint .` would lint the generated JavaScript inside it,
   with `projectService` unable to place those files in any program. Two lines fix it, in two
   different places: `/storybook-static/` in the `.gitignore` seed, and `storybook-static/**` in
   this repository's own `eslint.config.js`, which is not a seed.

   Prettier needs neither, and that was worth measuring rather than assuming: **Prettier 3.9.6
   honours `.gitignore` on its own.** A badly formatted file placed in `reports/` — git-ignored,
   absent from `.prettierignore` — did not fail `prettier --check .`. So the one seed line covers
   the formatter too, and `.prettierignore` stays as it is.

   **The half that is not mechanical is that the Storybook build has no gate.** `validate` is bound
   in Layer 2 to `npm run build && publint --strict`; the caller `ci.yml` is a masked seed and takes
   no extra step; and the deploy runs on push to `master`, which is _after_ the required check. A
   story that does not compile would therefore reach `master` and be caught by the deploy — the site
   keeps serving its previous build, so the failure is recoverable, but the gate that should have
   held it does not exist.

   **Portable stories close it without opening a verb.** `@storybook/web-components` 10.5.7 exports
   `composeStories`, `composeStory` and `setProjectAnnotations` — read off its type definitions —
   which turn story exports into functions any runner can render. The suite already runs in a real
   browser, so it renders them, and the stories land inside `test`, inside `ci / gate`, with nothing
   added to the shared pipeline. The mirror survives too: `tests/button.test.ts` composes
   `stories/button.ts`, so the assertion has a home that already exists.

   This is the argument `tests/a11y.ts` makes in writing — _the task vocabulary is closed at eight,
   and this is the suite asserting something more about the same subject, not a new kind of work_ —
   applied a second time, which is a sign it is the right one rather than a convenience.

   And it pays a dividend nobody asked for: a rendered story can be passed to `expectAccessible`,
   under the same single ruleset item 1 fixes. The stories stop being only a shopfront and become
   cases of the accessibility bar.

   **Marked as what it is: the export surface is measured, the render is not.** That those three
   symbols exist was read from the published types; that they render under Vitest browser mode is a
   hypothesis until the suite runs one. It is the only load-bearing claim in this document still in
   that state, and the Rollout puts it early enough to be cheap if it is wrong.

And what follows to another repository is **two seed lines, not one**: `/stories/` and
`/.storybook/` gain `export-ignore` in the `ts` `.gitattributes`, and `/storybook-static/` joins the
`ts` `.gitignore`. Both are `exact` seeds, so both are one pull request to the baseline — the same
one — and then the submodule bump Dependabot already opens daily. That is **sequencing, not a
blocker**; an earlier draft listed it as the one item _blocked outside this repository_, which
turned a known, short path into an unknown.

What `export-ignore` buys is narrower than _keeping the directories out of the package_, and the
seed file says so itself: npm packs from `package.json`'s `files`, which is `["dist"]`, so the npm
tarball never carried them. `export-ignore` governs `git archive` — what a **git-dependency**
consumer receives, which in this ecosystem is not hypothetical: this repository consumes
`@rak200/coding-standard-ts` exactly that way.

Putting the source under `docs/` instead, which is already export-ignored, costs more than it saves:
the symbol check is `grep -Rqw` over `docs/`, so anything there naming a symbol satisfies a gate that
currently means something, and it puts an evaluation surface inside the directory the third premise
reserves for consumption.

**This document does the small version of that, and recording it is the honest thing.** Measured
against the pipeline's own pattern — `^\s*export\s+…\s+\w+` over `src/`, then `grep -Rqw` over
`docs/` — the repository exports seven symbols, and this file alone matches three of them:
`ButtonVariant`, `defaults` and `tokens`. All three are genuinely documented in `docs/*.md` today,
so nothing is hidden right now; what has changed is that deleting one from its page would no longer
turn the gate red. The effect is not specific to this proposal — `docs/proposals/` is inside the
grep for every RFC that will ever be written here, and an RFC's job is to name symbols. The fix is
upstream and is not this proposal's to make: the check should exclude `docs/proposals/`.

### What stays open after B

**Which example widget**, 4 or 6 — and it is **deferred, not pending**: this proposal is accepted
with that question open, because nothing in the Rollout waits on it. Decision B changes its weight
rather than settling it. Storybook's own interactivity is Controls — changing attributes through a
panel — which is a different product from editing the code. Whether the code-editing bonus is worth
an embed on top of that is now a question about one addition to a shell that already exists, not
about the shell. It is answered when a component arrives that a panel cannot demonstrate, which the
fourth premise says is coming.

## Rollout

In order, one pull request per step. It is short because the Decision did the work.

1. **The seeds, upstream.** `/stories/` and `/.storybook/` gain `export-ignore` in the `ts`
   `.gitattributes`; `/storybook-static/` joins the `ts` `.gitignore`. One pull request to the
   baseline, then the daily submodule bump carries both here. Nothing else waits on it: what the
   first prevents is two directories riding along in a `git archive`, and what the second prevents
   is a build output sitting untracked — defects to fix rather than builds to unblock.
2. **The ruleset moves.** `tests/a11y.ts` splits — the axe `RunOptions` into a module free of the
   test runner, the assertion staying where it is — so the suite and `.storybook/preview.ts` read
   one constant. It is the only step that touches a file already carrying logic; everything else
   this proposal adds is new files and configuration.
3. **The shell, with content.** `.storybook/`, the dependency, the two scripts, `"stories"` and
   `".storybook"` in `tsconfig.json`'s include, and two additions to `eslint.config.js` — which is
   not a seed and can carry both: `no-restricted-imports` against `**/src/*`, and
   `storybook-static/**` in the ignore list. `stories/button.ts`, `stories/field.ts` and
   `stories/tokens.ts` land in the same step — an empty shell demonstrates nothing and cannot be
   reviewed.
4. **The gate.** Each unit's test file composes its stories and renders them, so a story that does
   not compile or does not render fails `test`. This step is what makes step 3 safe, and it is the
   one resting on a hypothesis rather than a measurement — if portable stories do not work under
   browser mode, it is found here, before anything is published, and the fallback is a plain
   `build-storybook` in the deploy with the gap stated instead of hidden.
5. **Pages.** Enabling it is a settings write, so it is **verified by reading it back**, never by its
   response code. The source is GitHub Actions: `dist/` is git-ignored, so a branch source has
   nothing to serve. The build stamps the commit it came from, because the site follows `master` and
   a reader has to be able to tell _which_ `master` they are looking at.
6. **The deploy is made to fail on purpose once**, and confirmed to block, before it is trusted. A
   gate that has never failed has never been tested.

The published page meets the same accessibility bar as the components it shows, and step 4 is what
asserts it — the stories are cases of the suite, not a display beside it.

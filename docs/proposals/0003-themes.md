# RFC 0003 — Themes: what the package ships, and what a theme may be made of

- **Status**: Draft
- **Scope**: library
- **Created**: 2026-09-05

## Motivation

**RFC 0002 settled what a theme _is_ and never settled whether this package contains one.** Item 2
resolved the mechanism — a theme is selected by `data-ui-theme`, a scheme by `color-scheme`, and each
ground carries both of its schemes in one `light-dark()` value. That resolution describes a shape a
host can write. It says nothing about whether `@rak200/ui` ships any palette but its own.

Today it ships none. `defaults` and `darkScheme` are **one** palette in two schemes, and the only
named theme anywhere in the tree is a demonstration: the `Theme` story in `stories/tokens.stories.ts`
sets four grounds under `[data-ui-theme='brand']` and lets the other six follow. That story is proof
the mechanism works. It is not a product.

Four themes are wanted, each in both schemes:

1. **Default**, with a configurable accent.
2. **High contrast**, for accessibility.
3. **Matrix** — green, with a glow.
4. **Glass** — translucency and blur.

**Two of the four ask the token layer for something it has no name for, and that `light-dark()`
structurally cannot carry.** A glow is a shadow and a blur is a filter; `src/tokens.ts` already
records, beside `--ui-elevation-100`, that `light-dark()` takes colours and a shadow is not one —
which is why the elevation category carries no dark value at all. Both new effects walk into that
same wall, and neither has a component asking for it, which is the condition
[ARCHITECTURE.md](../../ARCHITECTURE.md) puts on a category entering.

**One of the four may not be a theme.** High contrast is a setting a reader's system already
carries, through `prefers-contrast: more` and `forced-colors: active`, and this package already
answers the second in one component. The precedent for a reader's setting here is reduced motion:
honoured once inside `tokenStyleSheet()` rather than per component, and never as something the reader
also has to go and select.

**And the bar this repository advertises was tuned against exactly one pair of grounds.** The
derived percentages are measurements, not preferences — the boundary mixes 50% toward the text
because 45% is 2.94:1 on the light surface, and the muted text mixes 65% because 60% is 4.52:1, a
rounding error away from failing. Both numbers were read off the default grounds.
`tests/tokens.test.ts` measures them against `defaults` and `darkScheme`, and against nothing else. A
theme that moves `--ui-color-surface` and `--ui-color-text` moves every one of those ratios, and
nothing currently notices.

Four issues, one per theme, would each answer those questions on their own, and there is no reason
to expect four consistent answers. That is what this proposal is for.

## Study

### What RFC 0002 settled, and what this proposal may not reopen

Four resolutions bind here and are inherited rather than re-argued:

- **Item 1 — a derivation resolves where it is used.** A formula lives in the `var()` fallback, so a
  component in a themed subtree mixes against _that subtree's_ grounds. This is why a theme is
  cheap: the `Theme` story sets four grounds and `--ui-color-border`, `--ui-color-text-muted`,
  `--ui-color-hover`, `--ui-color-pressed`, `--ui-color-accent-hover` and `--ui-color-accent-pressed`
  all follow without being named. **Measured, in the tree, today.**
- **Item 2 — theme and scheme are two independent axes.** `data-ui-theme` for one, `color-scheme`
  for the other, each ground carrying both schemes through `light-dark()`. The attribute rather than
  a class, because it is single-valued by construction. Not reopened.
- **Item 4 — a category arrives with the component that consumes it.** The rule that a Matrix glow
  and a Glass blur both push on, from a direction item 4 did not consider: there, the consumer was
  always a component.
- **The Rollout obligation** — _a second theme is a second contrast obligation; its stories render
  it, so `expectAccessible` reaches it, and a theme without a story is outside the bar this
  repository advertises._ Standing, and this proposal inherits it whole.

### What the token layer carries today

|                               |                                      |
| ----------------------------- | ------------------------------------ |
| Ground tokens                 | 19, of which 9 are colours           |
| Grounds carrying a dark value | 7                                    |
| Derived tokens                | 8                                    |
| Named themes shipped          | 0                                    |
| Named themes demonstrated     | 1, in a story, as 4 ground overrides |

Two facts from that table matter more than the rest. **Nine colours is the whole surface a palette
has to decide** — a theme is not a large object. And **seven of nineteen carry a dark value**, so a
theme that wants both schemes is writing at most nine `light-dark()` pairs, not nineteen.

### What each of the four asks for

**1 — Default with a configurable accent.** Asks for nothing new. It _is_ the demonstrated pattern,
and the accent's own interaction colours already derive from it. One gap, and it is real:
`--ui-color-accent-contrast` is a **ground**, not a derivation, so a host that moves the accent must
also choose what sits on top of it, and nothing reads the pair. A yellow accent with the default
white contrast is 1.07:1 and ships green. Whether that ground can become a formula is the first
thing to measure — `color-contrast()` is the CSS answer and its support is a fact to read, not to
recall.

**2 — High contrast.** The one that may not be a theme. Beyond the axis question, it fights the
_derivations_ rather than the grounds: the boundary and the muted text mix **toward** the text, which
deliberately spends contrast to make a boundary read as a boundary. A high-contrast palette wants the
opposite, so it cannot simply move `--ui-color-surface` and `--ui-color-text` and inherit the rest —
it has to overrule formulas, which a host can do (a declared value wins over the `var()` fallback)
but which means the theme abandons the derivation it was supposed to benefit from. And yes, it has
**both** schemes: black on white and white on black are both standard, and both ship in the
platform's own high-contrast modes.

**3 — Matrix.** The identity is the glow, and a glow is a shadow. Same wall as elevation. Beyond
that, this is the first theme that plausibly wants to **decline a scheme**: a light Matrix is not
Matrix. `color-scheme: only dark` is how the platform expresses that, and whether a shipped theme may
use it is a decision this proposal owes.

**4 — Glass.** Two problems, and only the first is shared. A filter is not a colour, so the blur
cannot ride the scheme axis the way every other value does. The second is specific and is an
accessibility problem rather than a stylistic one: **the contrast of a translucent surface depends on
what is behind it**, which is unknowable when the token is defined. The measured-ratio gate in
`tests/tokens.test.ts` structurally cannot cover it, and `expectAccessible` measures only against
whatever a story happened to put behind the panel. `prefers-reduced-transparency` exists and is the
platform's own hook for the reader who cannot read through glass.

### The questions the four force

1. **Does the package _ship_ themes, or only enable them?** RFC 0002 said what a theme is; nothing
   says whether one lives in `src/`. This multiplies against issue #24, tokens in a second format —
   four themes times two schemes is what any second emitter would have to carry.
2. **May a theme add a token category?** Item 4 says a category arrives with the component that
   consumes it. Here the theme is the consumer and no component asks. Either that rule gains an
   explicit second clause, or themes 3 and 4 have no way to express themselves.
3. **What carries the contrast obligation when the grounds move?** Per-theme measured floors in the
   suite, per-theme formulas, or a rule that a shipped theme may not move the grounds the
   derivations were tuned against.
4. **Is high contrast a theme, or a media query the default theme answers?** These are different
   axes — the host chooses a theme, the reader's system asks for contrast — and they compose: a Glass
   theme under `prefers-contrast: more` should stop being glass.
5. **May a theme decline a scheme?**

### The visual reference, and why this file does not link it

Reference animations for themes 3 and 4 exist in a repository that is **private**. Repository
hygiene is explicit that public documentation neither links nor names one — a reader outside the
account finds a 404 where the reasoning should be. So the effects are described here by what they
do, and the source is not cited. Anything from it that this proposal needs to _rest_ on gets
reproduced here, in the open, or it does not count.

### Simulation plan

Every claim below is a **hypothesis until it is run**, which is the whole point of writing them down
before the design.

- **S1 — can `--ui-color-accent-contrast` become a derivation?** _Claim_: a formula can pick the
  readable pole from the accent, so moving one ground does not oblige a host to move two. _Steps_:
  read `color-contrast()`'s Baseline status; if usable, express the ground as a formula and run the
  existing contrast assertions across a spread of accents. _Expectation_: unknown, which is why it is
  first.
- **S2 — can a glow carry two schemes?** _Claim_: it cannot, by the same mechanism a shadow already
  failed at. _Steps_: declare a `box-shadow` ground through `light-dark()` and read it back.
  _Expectation_: refused, matching the elevation finding — which would mean the glow needs either a
  colour token the shadow reads, or two declarations under a scheme selector.
- **S3 — what is a glass surface's contrast?** _Claim_: no fixed ratio can be asserted for it.
  _Steps_: render one panel over a spread of backdrop luminances and measure the text ratio at each.
  _Expectation_: the range crosses 4.5:1, which would force the theme either to constrain what may
  sit behind it or to drop the translucency under `prefers-contrast: more`.
- **S4 — can the suite emulate the two contrast settings?** _Claim_: it can. `tests/tokens.test.ts`
  already emulates `prefers-color-scheme` through CDP, so the instrument exists; whether it reaches
  `prefers-contrast` and `forced-colors` is unmeasured. A gate that cannot be written changes what
  the design may promise.

## Proposed design

**Not written.** The proposal is `Draft`, and the questions above are what the Study has to answer
first. What is already fixed is the set of properties any answer has to hold:

- A theme is selected the way item 2 resolved and no other way.
- A shipped theme carries a story, because that is what puts it inside the advertised bar.
- No theme lowers a floor the default palette clears.
- A host's own theme stays as cheap as it is today. Shipping four must not make the fifth harder to
  write than the `Theme` story is now.

## Decision

**Not reached.**

## Rollout

**Not written**, and deliberately: the Rollout describes what must happen for an accepted design to
exist, and there is no accepted design yet.

One piece of bookkeeping is already known. **No `ROADMAP.md` entry precedes acceptance** — RFC 0002
records that both of its own obligations, the tracking issue and the roadmap entry, followed
acceptance rather than preceding it. This file is the register until then.

**One dependency is already visible**: four themes cannot be judged in a playground that renders one
scheme. [#120](https://github.com/rak200/ui/issues/120) inserts the token sheet into the Storybook
preview and puts a scheme control in the toolbar; the theme axis is the second control that would
live beside it, and that issue should not close off the room for it.

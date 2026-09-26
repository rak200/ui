# RFC 0003 — Themes: what the package ships, and what a theme may be made of

- **Status**: Exploring
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
platform's own hook for the reader who cannot read through glass — **in Chromium only**: web-features
3.40.0 lists no Firefox or Safari support, so a theme cannot rest on it everywhere.

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

  > **Run, and the claim holds only in a shape it did not name.** `color-contrast()` exists in no
  > engine; the function that shipped cannot carry a 4.5:1 floor; a formula can — and it cannot stay
  > on its own, because the pole is painted on three shades rather than one. _What S1 measured_,
  > below, has the numbers.

- **S2 — can a glow carry two schemes?** _Claim_: it cannot, by the same mechanism a shadow already
  failed at. _Steps_: declare a `box-shadow` ground through `light-dark()` and read it back.
  _Expectation_: refused, matching the elevation finding — which would mean the glow needs either a
  colour token the shadow reads, or two declarations under a scheme selector.

  > **Run, and refuted where it matters.** The whole shadow is refused, as expected — and the
  > first alternative the expectation names is not a workaround but the answer: the colour inside a
  > shadow is a colour, and `light-dark()` carries it. _What S2 and S3 measured_, below.

- **S3 — what is a glass surface's contrast?** _Claim_: no fixed ratio can be asserted for it.
  _Steps_: render one panel over a spread of backdrop luminances and measure the text ratio at each.
  _Expectation_: the range crosses 4.5:1, which would force the theme either to constrain what may
  sit behind it or to drop the translucency under `prefers-contrast: more`.

  > **Run, and there is a third option the expectation did not list: constrain the opacity, not
  > the backdrop.** Below a measured opacity the range does cross 4.5:1; above it, no backdrop can
  > pull the ratio under. _What S2 and S3 measured_, below.

- **S4 — can the suite emulate the two contrast settings?** _Claim_: it can. `tests/tokens.test.ts`
  already emulates `prefers-color-scheme` through CDP, so the instrument exists; whether it reaches
  `prefers-contrast` and `forced-colors` is unmeasured. A gate that cannot be written changes what
  the design may promise.

  > **Run: it can, and more of it was already there than this item assumed.** `forced-colors` is
  > emulated through `Emulation.setEmulatedMedia` in `tests/checkbox.test.ts` and
  > `tests/radio.test.ts`. `prefers-contrast` had never been tried, and emulates in all four values
  > in Chromium 153 — `more`, `less`, `custom`, `no-preference` — with a stylesheet rule following
  > and returning on reset. **The two are set independently**: `forced-colors: active` alone leaves
  > `prefers-contrast` at `no-preference`, and both can be set in one call, so every combination
  > question 4 names can be asserted. What a real operating system's high-contrast mode sets
  > _together_ is not something emulation can answer, and is not measured.
  >
  > **One premise above was wrong.** `tests/tokens.test.ts` does not emulate
  > `prefers-color-scheme`: the scheme is set by writing `color-scheme` on the element. What it
  > emulates through CDP is `prefers-reduced-motion` — which answers
  > [RFC 0004](0004-motion.md)'s S1. `prefers-reduced-transparency` emulates too, and is the
  > Chromium-only hook the Glass paragraph above now says it is.

### What S1 measured

Every number here is Chromium 153, read by the suite's own `contrastRatio()` after painting each
computed colour into one canvas pixel. **The sweep** is every sRGB colour on a 17-step grid — 16
levels per channel, 4096 accents. **The crossover sample** is the 5230 colours on a 3-step grid whose
WCAG luminance sits within 0.002 of 0.1791, where white and black give the same ratio and where any
switch is most likely to misfire. Support is web-features 3.40.0, read rather than recalled.

**The function this item named does not exist, and the one that shipped cannot carry the floor.**
`color-contrast()` has no support in any engine. `contrast-color()` is Baseline newly available since
2026-04-10 — Chrome 147, Firefox 146, Safari 26 — and its specification says the algorithm is
_"UA-defined at this level"_, advises engines **not** to use the WCAG 2.1 ratio, and guarantees only
AA for **large** text, which is 3:1. In Chromium 153 it happens to choose as WCAG 2 would: 0 of 4096
below 4.5:1. That is one engine's choice today, and this package's floor is 4.5:1 in every engine.

**A formula can, and it is WCAG 2 by construction.** Relative colour syntax exposes the channels in
`srgb-linear`, so the luminance WCAG defines is a `calc()`:

```css
/* white when the accent's luminance is under the crossover, black otherwise */
color(
  from var(--ui-color-accent) srgb-linear
  clamp(0, (0.1791 - (0.2126 * r + 0.7152 * g + 0.0722 * b)) * infinity, 1)
  clamp(0, (0.1791 - (0.2126 * r + 0.7152 * g + 0.0722 * b)) * infinity, 1)
  clamp(0, (0.1791 - (0.2126 * r + 0.7152 * g + 0.0722 * b)) * infinity, 1)
)
```

| switch                                       | sweep, below 4.5:1 | crossover sample, below 4.5:1 | worst    |
| -------------------------------------------- | ------------------ | ----------------------------- | -------- |
| **luminance in `srgb-linear`, `* infinity`** | **0 / 4096**       | **0 / 5230**                  | **4.58** |
| the same, `* 100000`                         | 0 / 4096           | 12 / 5230, as greys           | 1.08     |
| OKLCH `l` under 0.55 … 0.65                  | 78 … 592 / 4096    | —                             | 2.19     |
| `contrast-color()`, Chromium 153             | 0 / 4096           | 0 / 5230                      | 4.58     |

4.58:1 is the ceiling rather than a result: it is what the better of white and black gives at the
crossover, so no pole choice can do better for the worst accent. **The multiplier has to be
`infinity`** — any finite one leaves a band where the clamp lands between 0 and 1 and the pole is a
grey, measured at 1.08:1. And **OKLCH lightness is the wrong axis**: it is close to luminance and not
equal to it, and no threshold between 0.55 and 0.65 clears the sweep.

It resolves through `var()` and from a `light-dark()` origin, so a ground carrying both schemes gets
a pole per scheme with no second declaration: white on `#2563eb` at 5.17:1, as today, and **black**
on `#60a5fa` at 8.26:1 — where the shipped `#111827` is 6.98. **The pole is always pure white or
black**, never a palette colour. Relative colour is Baseline newly available since 2024-09-16, the
tier `light-dark()` has been at since 2024-05-13 and the token layer already rests on; `infinity`
in `calc()` is widely available. No new support floor.

**But the pair is three pairs, and one pole fails the other two.** `<ui-button>` paints the pole on
`--ui-color-accent`, `--ui-color-accent-hover` and `--ui-color-accent-pressed`, and both derived
shades mix **toward the text** — 12% and 22% in OKLab. When the pole has the text's polarity, black
in the light scheme or white in the dark, that mix moves the shade toward the pole:

| shape                                   | light, below 4.5:1 | dark, below 4.5:1 | worst    | text changes colour between states |
| --------------------------------------- | ------------------ | ----------------- | -------- | ---------------------------------- |
| one pole, from the accent               | 629 / 4096         | 662 / 4096        | 3.27     | 0                                  |
| a pole per shade                        | 0                  | 0                 | 4.58     | 667 and 698 accents                |
| **one pole, shades mixed away from it** | **0**              | **0**             | **4.58** | **0**                              |

The third shape mixes each shade toward the opposite pole — the same formula with the comparison
reversed — so every state moves _away_ from the text on it and the ratio can only rise. On the
shipped defaults the hover barely moves: `#255cd4` becomes `#1d52c6` in the light scheme, and
`#71aef9` becomes `#74b0fc` in the dark.

**What this settles, and what it leaves to the design.** `--ui-color-accent-contrast` can become a
derivation without lowering the floor, which answers question 3 for the one pair where the package
already knows the colours meet. It does not come alone: `--ui-color-accent-hover` and
`--ui-color-accent-pressed` change direction with it, from _toward the text_ to _away from the
pole_. And **the gate that reads today's pair cannot read tomorrow's**: `tests/tokens.test.ts`
measures hex defaults as strings, and a derived pole has no string to measure — it would have to be
resolved in the engine, the way this study resolved it.

### What S2 and S3 measured

Same engine and instrument as S1. The S3 sweep is the same 4096 colours, used as **backdrops**; the
panel is composited over each one as a browser composites a translucent box — source-over, in sRGB —
by painting both into one canvas pixel. axe computes the same stack and agrees with it: over black,
white glass at 0.3 opacity is `#4d4d4d` in both.

**S2 — a glow is geometry and a colour, and only the geometry is stuck.**

| declaration                                                         | light                 | dark            |
| ------------------------------------------------------------------- | --------------------- | --------------- |
| a whole shadow in `light-dark()`                                    | refused by the parser | refused         |
| the same, through a custom property                                 | `none`                | `none`          |
| `box-shadow: 0 0 8px light-dark(…)`                                 | the light colour      | the dark colour |
| the same colour through `var()`                                     | the light colour      | the dark colour |
| `text-shadow` and `filter: drop-shadow()`, colour in `light-dark()` | the light colour      | the dark colour |

So the whole shadow cannot be one `light-dark()` value, which is what `src/tokens.ts` records beside
`--ui-elevation-100` — and the part of it that has to follow the scheme **can**, because it is a
colour, and a colour is exactly what the emitter already carries through `light-dark()`. The shipped
elevation, with only its colour made a pair, reads `rgba(0, 0, 0, 0.1)` in the light scheme and
`rgba(0, 0, 0, 0.5)` in the dark. What stays one value is the geometry — the offsets and the blur —
and a glow's geometry has no reason to differ by scheme.

**This bears on a published reason, not only on Matrix.** `ARCHITECTURE.md`, _One value cannot
follow the scheme_, says a scheme-aware shadow _"would mean a second axis in the emitter for one
category"_. Measured, it would mean a **colour ground the shadow reads**, and no second axis. The
section's conclusion — the card's derived boundary is what both schemes have — does not rest on that
sentence and is not contradicted; the sentence itself is. And it narrows question 2: what a glow
needs from the scheme is a colour, which is a category that exists. What would be new is a shadow's
geometry, and whether a theme may bring that is the question left.

**S3 — below a measured opacity the text can fail, and above it nothing behind the panel can make
it fail.** Default grounds, panel at the surface colour, text at the text colour:

| opacity                                   | light, backdrops under 4.5:1 | range        | dark, backdrops under 4.5:1 | range        |
| ----------------------------------------- | ---------------------------- | ------------ | --------------------------- | ------------ |
| 0.3                                       | 1112 / 4096                  | 1.74 … 14.68 | 2000 / 4096                 | 1.59 … 16.28 |
| 0.5                                       | 110                          | 3.72 … 14.68 | 1024                        | 2.75 … 15.79 |
| 0.6                                       | **0**                        | 5.15 … 14.68 | 215                         | 3.78 … 15.59 |
| 0.7                                       | 0                            | 7.00 … 14.68 | **0**                       | 5.34 … 15.26 |
| **least opacity clearing every backdrop** | **0.56**                     |              | **0.66**                    |              |

**The worst backdrop is an extreme, not a sample**: black under the light panel and white under the
dark one. Compositing is monotonic in every channel of what is behind, and nothing behind a panel —
blurred or not, image or not — is darker than black or lighter than white. So the two floors hold
for **any** backdrop, not only for the sweep, and the claim that _no fixed ratio can be asserted_ is
true only below them. The floors belong to the default grounds; a theme that moves the surface or the
text moves them, and they are computable from the pair alone.

**What the gate sees today, and why that is not enough.** `expectAccessible` reads axe's
`violations` and nothing else, so what matters is which verdict axe returns:

| white glass at 0.3 over                        | axe's `color-contrast`                                        |
| ---------------------------------------------- | ------------------------------------------------------------- |
| a solid colour                                 | **violation**, 1.73:1                                         |
| a solid colour, with `backdrop-filter: blur()` | **violation**, 1.73:1                                         |
| an absolutely placed layer                     | **violation**, 1.73:1                                         |
| a gradient                                     | **`incomplete`** — _background color could not be determined_ |

axe follows translucency and ignores the blur, which is right, since a blur changes no colour in a
uniform backdrop. But it gives up on a gradient, and **an `incomplete` is invisible to this suite**.
A glass story over an image would pass the gate however unreadable it was. A story over a solid
colour is measured correctly — against that colour only. The measurement a glass theme needs is the
one above: the composite over the two extremes, asserted in the suite, where a story's choice of
backdrop cannot reach it.

`prefers-reduced-transparency` would be the natural second line, and S4 found it in Chromium only.
Contrast is also necessary rather than sufficient: a blurred, busy backdrop costs legibility no
ratio measures, which is what the specification of `contrast-color()` says of its own guarantee.

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

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

**[The prototypes](0003-themes/README.md) are that reproduction**: one page per wanted theme,
rendering the real components under the CSS the theme would ship, with the floors measured again
under every panel. Matrix and Glass take the reference's values wherever a floor allows them.

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

- **S5 — do the derivations keep their floors when a theme moves the grounds?** Added after S1–S4,
  because question 3 was still unmeasured for everything but the accent. _Claim_: there is a least
  ratio between text and surface above which the border (3:1), the muted text (4.5:1) and the hover
  and pressed surfaces (visible, over 1.05:1) always hold. _Steps_: every legal pair on a 6-level
  sRGB grid and on a grey ramp in steps of 5, each derivation resolved in the engine. _Expectation_:
  the least ratio is above 4.5:1, so a theme would owe a stronger pair than the text floor asks.

  > **Run, and refuted: no ratio predicts the floors.** Grey pairs on a light surface fail the
  > border and the muted text up to 11.9:1; on a dark surface, up to 16.83:1. _What S5 and S6
  > measured_, below.

- **S6 — may a theme decline a scheme, mechanically?** Added with S5, for question 5. _Claim_:
  `color-scheme: only dark` on a themed subtree fixes every `light-dark()` ground and every system
  colour in it to dark, whatever the host declared and whatever the reader prefers. _Steps_: a themed
  subtree under hosts declaring `light`, `dark` and `light dark`, the reader's preference emulated
  both ways. _Expectation_: dark throughout, with the playground's scheme control no longer reaching
  that subtree as the cost.

  > **Run, and it holds — with `only` doing nothing measurable.** _What S5 and S6 measured_, below.

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
pole_. And the gate already reads a derived pole the way it would have to: `tests/tokens.test.ts`
resolves every derived colour in the engine through `painted()`, and already asserts the label over
`--ui-color-accent-hover` and `--ui-color-accent-pressed` for the shipped accent — which is this
finding, held for one accent. A derived pole would be read by the same function.

> **Corrected after S5.** This paragraph first said the suite measures hex defaults as strings and
> would have to learn to resolve a derived pole. It already resolves every derived colour, and the
> sentence was written without reading how.

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

### What S5 and S6 measured

**S5 — the floors belong to the formula _and_ the grounds, and no ratio between the two grounds
predicts them.** Every pair on the grids whose text clears 4.5:1 on its surface, each derivation
resolved in Chromium 153 and measured against its own floor:

| pairs                              | legal | border under 3:1 | muted under 4.5:1 | hover or pressed invisible | highest ratio that still failed    |
| ---------------------------------- | ----- | ---------------- | ----------------- | -------------------------- | ---------------------------------- |
| greys, light surface               | 421   | 256              | 269               | 0                          | 11.9                               |
| greys, dark surface                | 421   | 248              | 272               | 36 / 32                    | 16.83 for the border, 21 for hover |
| 6-level colour grid, light surface | 4031  | 3431             | 3504              | 0                          | 12.5                               |
| 6-level colour grid, dark surface  | 4031  | 2777             | 3150              | 142 / 141                  | 16.89 for the border, 21 for hover |

The shipped pairs pass — 14.68:1 in the light scheme, 14.33:1 in the dark — and **the dark one passes
because of the surface it is, not because of its ratio**: grey pairs above 14.33:1 on a dark surface
fail the border. Two mechanisms, neither one a percentage chosen badly:

- **WCAG's ratio compresses the dark end.** Its `+ 0.05` term dominates near black, so a step that
  looks the same size in OKLab is almost no ratio at all there. An 8% mix toward white over pure black
  is `#020202`, **1.01:1** — hover and pressed stop being visible. With white text on the grey ramp, pure black is the one surface where hover disappears; `#050505`, the next step, already passes.
- **A 50% or 65% mix lands where the two grounds put it.** On a light surface it takes a grey pair above 11.9:1 to carry the midpoint past 3:1 and 4.5:1. On a dark one the same mix lands lower in
  luminance, and pairs up to 16.83:1 still fail.

**So question 3 is answered by elimination.** _A rule that a shipped theme may not move the grounds_
is too strong — the grounds are what a theme is. _Per-theme formulas_ may be needed, but only where a
theme's grounds break the default ones. What works for every theme is **per-theme measured floors**:
resolve the theme's derived colours in the engine and assert each floor, which is what `painted()`
already does for the default palette in both schemes. **A black-surface theme — Matrix, most
plausibly — is the case that fails today**, on hover and pressed rather than on text.

**S6 — a theme declines a scheme by declaring its own.** A subtree with `color-scheme: dark` or
`only dark`, a `light-dark(#ffffff, #000000)` ground inside it, and system colours read beside it:

| reader prefers | host declares                   | theme declares | ground    | `Canvas` / `CanvasText` |
| -------------- | ------------------------------- | -------------- | --------- | ----------------------- |
| light or dark  | `light`, `dark` or `light dark` | `only dark`    | `#000000` | `#121212` / `#ffffff`   |
| light or dark  | `light`, `dark` or `light dark` | `dark`         | `#000000` | `#121212` / `#ffffff`   |
| light or dark  | `light`, `dark` or `light dark` | `normal`       | `#ffffff` | `#ffffff` / `#000000`   |

All eighteen combinations resolve the same way for each declaration, so neither the host's scheme nor
the reader's preference reaches a subtree that declares its own, and the system colours follow it — which is what the platform paints its own parts with, a rendered `<input>` or a scrollbar among them. **`only` changed nothing measurable here.** What it exists for, per the specification, is refusing a browser's own forced darkening, which this study did not emulate. And `normal` is not a
pass-through: it is a declaration of its own, and resolves light under a dark host.

**The reader keeps one lever.** Under emulated `forced-colors: active` the same `only dark` subtree
reads `Canvas` as `#ffffff`: the forced palette overrides the theme's scheme, as it overrides every
author colour. What declining costs is the host's and the playground's scheme control, which stop
reaching that subtree — the expected cost, now measured.

### Two readings the design needed

Taken while sketching the design below, to choose between two shapes each, and **with no claim
written first** — so they are recorded as readings rather than as hypotheses confirmed. Same engine
and instrument as S1.

**A translucent surface makes its derivations translucent.** `color-mix()` interpolates alpha, and
every neutral derivation mixes the surface. The opacity each one resolves to, identical in both
schemes:

| surface opacity | border | muted text | hover | pressed | striped row |
| --------------- | ------ | ---------- | ----- | ------- | ----------- |
| 0.3             | 0.65   | 0.755      | 0.356 | 0.398   | 0.335       |
| 0.6             | 0.8    | 0.86       | 0.632 | 0.656   | 0.62        |
| 1               | 1      | 1          | 1     | 1       | 1           |

So an alpha on `--ui-color-surface` would make the muted text a colour read through the backdrop,
in every control that has a field, and S3's composite would have to be taken twice — the text
through the panel, and the panel through what is behind it.

**Moving the text to its pole raises every pair that mixes toward it.** `--ui-color-text` set to
`light-dark(#000000, #ffffff)`, and nothing else moved:

| pair                      | light, shipped | light, text at the pole | dark, shipped | dark, text at the pole |
| ------------------------- | -------------- | ----------------------- | ------------- | ---------------------- |
| text                      | 14.68          | 21.00                   | 14.33         | 17.74                  |
| border                    | 3.39           | 6.01                    | 3.96          | 4.60                   |
| muted text                | 5.24           | 11.37                   | 6.07          | 7.26                   |
| text on hover             | 12.41          | 16.52                   | 12.23         | 14.95                  |
| hover against the surface | 1.18           | 1.27                    | 1.17          | 1.19                   |
| label on the accent       | 5.17           | 5.17                    | 6.98          | 6.98                   |

A text further from the surface carries every mix toward it along, and the surface does not move,
so the dark end keeps the room S5 showed a black surface losing. **The label on the resting accent
is the pair that does not rise**: it mixes nothing toward the text.

### What the Glass prototype settled

[`glass.html`](0003-themes/glass.html) is where this theme's values were chosen — by eye, over the
reference's page and harder ones, with every floor read out under the panel — and **Glass is closed
at what that page renders by default**. The readings that shaped it, same engine and instrument as
S1:

**What the theme sets.** The raised surfaces — the card, the toast, the tip, the dialog and the
menu's panel — are the scheme's pole at 0.20, white in the light scheme and black in the dark, behind
`blur(10px) saturate(1.7)`, edged in white at 0.45 and 0.16 with a highlight along the top. Black
rather than the dark surface's blue-black, because at the same opacity it takes a lighter page:
`#303030` against `#2a2a2a`. The text goes to its pole and the accent to slate, `#334155` and
`#94a3b8`. The controls are translucent too — a field, a select, an empty box and radio, the switch
when off, a secondary button and the table each take their own fill at 0.20 — and a filled
control takes the accent at 0.80.

**The floor is a page, not an opacity.** S3 bounded the backdrop by black and white, and over those
the glass needs 0.46 and 0.60 even with the text at its pole. But a page that follows the dark
scheme is not white, nor one that follows the light scheme black. So the floor is stated as the page
the glass can take — the darkest grey behind it in the light scheme, the lightest in the dark —
before anything resting on it falls under its own floor:

| scheme | the page it can take, at 0.20 | what fails first  | what the reference's page needs |
| ------ | ----------------------------- | ----------------- | ------------------------------- |
| light  | no darker than `#cecece`      | the error message | 0.66                            |
| dark   | no lighter than `#303030`     | the focus ring    | 0.79                            |

**That is a condition on the host's page, and the theme documents it.** Raising the opacity until
the reference's colourful page passes leaves 21 to 34% of it showing, which reads as milk rather
than glass.

**What fails first is never the text.** Text at its pole has the most room of anything on the glass,
which is why the glass looked fine while it was the only thing measured. The error message, a
checked box, a switch's track and the focus ring have far less: over the reference's page in the
dark scheme the text reads 3.25 and the focus ring 1.08. **A halo carries text and only text** — a
4px stroke in the surface's colour under each letter held 4.5:1 over black and over white — and the
box, the track and the ring have no letter to put one around, so with the halo on the dark limit did
not move. It was dropped.

**A translucent accent moves toward its own label.** Glass's accent sits at the far pole from the
glass, so its label is the glass's own pole, and a primary button at an opacity loses its label
first: under 4.5:1 below 0.72, over the scheme's own background. **Inverted on the primary button
alone** — a light slate under a black label in the light scheme, a dark one under a white label in
the dark — the fill moves away from the label instead, and the label never binds. Inverted
everywhere, a checked box falls under 3:1 against the glass even when opaque. So the primary
button wants a fill of its own, apart from the accent the checked controls read. The theme keeps it
inverted, at 0.80 like the checked controls.

**A button's edge may soften; a field's may not.** WCAG 1.4.11 asks for a boundary only where the
boundary is what identifies the control, and a button's label already does — so the buttons, primary
included, take the glass's edge, while a field and an empty box keep the derived border. A
translucent fill's own hover barely moves, so a button hovers on its edge instead, which goes to the
text's colour — the hover a field already has. [#228](https://github.com/rak200/ui/issues/228) is
the same faint hover in the default palette.

**Two drawings a translucent fill breaks.** The platform's picker takes its colours from the select
unless an option brings its own, so a translucent select opened a list that was unreadable in the
dark scheme: each option has to paint the surface and the text itself, which renders identically in
every opaque palette. And the switch's track when off is filled with the border's colour, the one
opaque fill left on the glass: Glass draws it as an empty box is drawn, the fill inside the border,
with the thumb in the border's colour.

**Under `prefers-contrast: more` and reduced transparency, glass stops being glass** — opaque and
unblurred, as question 4 has it.

### Where the five questions stand

| question                                         | what the study settled                                                                                                                                                                                  | what is left                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1 — ship themes, or only enable them?            | nothing; it is not a measurement                                                                                                                                                                        | a decision                                                                         |
| 2 — may a theme add a token category?            | a glow's scheme-bound part is a colour, an existing category (S2); translucency cannot ride on the surface (above); Glass needs names for its glass, its controls' fills and its primary button (above) | whether shadow geometry, or a filter, may enter with a theme                       |
| 3 — what carries contrast when the grounds move? | per-theme measured floors, resolved in the engine; the accent pole can be derived if its shades change direction (S1, S5)                                                                               | whether the derived pole is adopted, and what a black-surface theme does for hover |
| 4 — is high contrast a theme or a media query?   | both are testable, alone and together (S4); moving the text alone raises every derived pair (above)                                                                                                     | a decision                                                                         |
| 5 — may a theme decline a scheme?                | mechanically yes, by declaring its own `color-scheme`; forced colors still wins (S6)                                                                                                                    | a decision                                                                         |

## Proposed design

**A sketch, with one recommendation per question**, written so the decisions have something
concrete to be made against. Where a sentence rests on a measurement it names it; the rest is
proposal, and nothing here is decided until the Decision says so. What was fixed before the Study
began still binds every answer:

- A theme is selected the way item 2 resolved and no other way.
- A shipped theme carries a story, because that is what puts it inside the advertised bar.
- No theme lowers a floor the default palette clears.
- A host's own theme stays as cheap as it is today. Shipping four must not make the fifth harder to
  write than the `Theme` story is now.

### The four, as the recommendations leave them

| wanted                       | becomes                                                                              | questions |
| ---------------------------- | ------------------------------------------------------------------------------------ | --------- |
| Default, configurable accent | the default palette, with the accent's label derived                                 | 3         |
| High contrast                | every shipped palette's answer to `prefers-contrast`                                 | 4         |
| Matrix                       | a shipped theme, dark only                                                           | 1, 2, 5   |
| Glass                        | a shipped theme in both schemes, for a page near its surface, and the last one built | 1, 2, 3   |

**Two named themes, and the other two are not dropped.** Each becomes something a palette does,
which is a stronger place for it than a name to select: the derived label follows every accent a
host sets, including in a host's own theme, and the contrast answer reaches every reader whose
system asks, under every palette this package ships.

### 1 — The package ships themes, as data a host opts into

**Ship, because only a shipped theme is measured.** RFC 0002's obligation puts a theme inside the
bar only where this suite renders it, and S5 is what the outside looks like: a palette whose text
clears 4.5:1 by a wide margin still loses its border at 11.9:1, and a black surface loses its hover,
with nothing to notice either. A Matrix a host writes from a description is exactly that palette.

**Data first, CSS second**, because #24's constraint binds a theme as much as a default: whatever
second format arrives reads the source, and CSS is one output of it. A theme is the object
`defaults` and `darkScheme` already are — a partial map of grounds and the dark values beside it —
plus the one scheme it keeps when it declines the other, and its answer to the reader's contrast
setting. One function renders it to a `[data-ui-theme='…']` block, as `tokenStyleSheet()` renders
the defaults to `:root`:

```ts
// The names are placeholders; the shape is the proposal.
export interface Theme {
  readonly name: string;
  readonly grounds: Readonly<Partial<Record<Token, string>>>;
  readonly dark?: Readonly<Partial<Record<Token, string>>>; // absent when `scheme` is set
  readonly scheme?: 'light' | 'dark'; // question 5
  readonly more?: Readonly<Partial<Record<Token, string>>>; // question 4
}

export function themeStyleSheet(theme: Theme): string;
```

**Opt-in, not emitted by `tokenStyleSheet()`.** A host inserts the block for a theme it uses, and
selecting it stays the attribute. Emitting every shipped theme into the default sheet would charge
every host for themes it never selects, to save one call.

**A host's own theme is written the way the `Theme` story writes it**, by hand and unchanged. The
data shape is what lets the suite iterate over the shipped ones (question 3); a host may hand
`themeStyleSheet()` its own for the same rendering, and it is never the only way in.

**What it costs is permanent.** Every component and every ground that arrives later is measured
under every shipped palette, and a theme that stops clearing a floor blocks the pull request that
broke it, not a pull request about the theme.

**Set aside:**

- _Enabling only_ — nothing would measure the four, and S5 says that is not a neutral choice.
- _Stylesheets rather than data_ — a second format would have to parse the CSS back into values,
  which is what #24 records as the thing to avoid.

### 2 — A category may arrive with a shipped theme, when its default changes nothing

**The rule gains a second clause and keeps its reason.** _A category arrives with the component that
consumes it_ exists because a value chosen with nothing to judge it against gets corrected when
something arrives, and correcting a published default silently moves every host that did not
override it. A category a theme brings keeps that reason whole on one condition: **its default is
the identity** — `none`, transparent, zero — so the default palette renders exactly as before and
there is no default to correct later. The value that is not the identity is the theme's, judged in
the theme's story, and the components that read the new name change in the same pull request.

**Matrix may not need it.** S2 found that the part of a glow that follows a scheme is a colour, and
Matrix keeps one scheme, so even that part is one value. A glow is a shadow at zero offset, and
`--ui-elevation-100` is already a shadow the raised surfaces read — the card, the menu, the toast and
the tooltip. The theme sets that step to a glow first; a name of its own follows only if its story
shows the glow wanted where elevation is not read, on text or on a control's boundary.

**Glass does, and the first reading above says where it goes.** Its translucency and its blur are a
category read by the raised surfaces and the dialog, and **not an alpha on `--ui-color-surface`**:
every derivation mixes the surface, so a translucent one takes the muted text, the border and the
hover translucent with it — muted text at 0.755 opacity over a surface at 0.3. Leaving the surface
opaque keeps every field where S5 measured it, and keeps S3's floors computable from one pair and one
layer.

**The prototype says how far it reaches**, and it is further than the raised surfaces. Every name
below has the identity as its default, so each meets the condition above:

- the raised surfaces' colour, backdrop filter and edge — the three placeholders `glass.html`
  declares;
- the controls' neutral fill, defaulting to the surface;
- the primary button's fill and its label, defaulting to the accent and the accent's label;
- a button's edge and the edge it hovers to, defaulting to what each variant draws today;
- the switch's track and thumb when off, defaulting to the border and the surface.

The select's options painting their own surface needs no name: it is a fix to `src/select.ts`, and
any translucent field needs it.

**That is as far into the open list as a theme reaches.** The highlight on the option under the
pointer is the platform's, in every theme, as
[docs/select.md](../select.md#what-the-platform-still-refuses) already publishes for the popup.
`appearance: base-select` would hand it over, and `ARCHITECTURE.md` declines that while one engine
has it, so no name is proposed for it here.

**Set aside:**

- _A theme styling components directly_, through `::part()` or selectors of its own — a second
  styling surface beside the tokens, holding values a host cannot override.
- _No new category at all_ — Matrix and Glass without the one thing each is named for.

### 3 — Every shipped palette is measured, and the accent's label is derived

**The floors run per palette.** _The contrast floors_ in `tests/tokens.test.ts` stop being a list
over `defaults` and `darkScheme` and run over every palette this package ships, in each scheme it
keeps: the theme's block inserted, and `data-ui-theme` on the element `painted()` resolves under.
That is S5's answer — no rule about the grounds predicts the floors, so the engine measures each
palette — and it turns the third property above from a promise into a check. Glass adds everything
that rests on its glass, composited on the grey at the page limit it documents: S3's black and white
bound a page that does not follow the scheme, which is no page a host draws.

**The accent's label becomes a derivation**, in S1's third shape: `--ui-color-accent-contrast` is the
WCAG pole of the accent, and the accent's hover and pressed shades mix away from that pole instead of
toward the text. This is what makes a configurable accent a property of the default palette rather
than a theme: a host moves one ground and the label follows, in both schemes — 0 of 4096 accents
under 4.5:1, measured. It is the one answer here that reaches a host's own theme, which no floor in
this suite can.

What it costs:

- `--ui-color-accent-contrast` moves from `tokens` to `derivedTokens`, so `defaults` and
  `darkScheme` lose a key and `Token` loses a member. Code that reads
  `defaults['--ui-color-accent-contrast']` breaks, which below `1.0.0` is a minor. A host that sets
  the name keeps working: a derived name still takes an override.
- The dark scheme's label goes from `#111827` to black, 8.26:1 where it was 6.98, because the pole
  is always pure white or black.
- The accent's shades move a little: `#255cd4` becomes `#1d52c6` in the light scheme.

**A black surface gets no rule of its own.** Its hover is `#020202` at 1.01:1 (S5), and the
per-palette floor already refuses it. A theme answers with a surface whose hover the floor accepts —
under white text, `#050505` already is one — or declares its own hover and pressed, an override
every host already has, which the floor then measures.

**Set aside:**

- _A rule that a theme may not move the grounds_ — the grounds are what a theme is.
- _A least ratio between text and surface_ — S5 refuted the premise: no ratio predicts the floors.
- _Per-theme formulas as a mechanism_ — a theme that needs a different mix overrides the derived
  name, and the floor measures what it wrote. It needs nothing of its own.

### 4 — High contrast is the reader's setting, answered by every palette

**`prefers-contrast: more`, answered in the token layer as reduced motion is, and not a theme.** A
host chooses a theme; a reader's system asks for contrast, and a reader who needs it should not
depend on a host having shipped a picker. It also composes where a theme cannot: Glass under `more`
stops being glass, which is one theme answering a setting rather than two themes selected at once.

**The block moves one ground: the text, to its pole.** Every neutral derivation mixes toward the
text, so the second reading above is the whole mechanism — muted text at 11.37:1 in the light scheme
and 7.26:1 in the dark, the border at 6.01 and 4.60, and the hover still visible because the surface
does not move. Every text pair made of the text and the surface then clears 7:1, WCAG's enhanced
level. No formula is declared at `:root`, so nothing freezes. **What it does not raise is every
colour that is a ground of its own**: the labels on the accent — 5.17 on the resting accent in the
light scheme — and the three outcome colours, which were chosen against 4.5:1. Raising those would
mean the reader's setting moving a host's brand and status colours, and whether it should is left
open here.

**A theme answers it too, in its own data** — the `more` map in the shape above — because a theme's
grounds are declared on its own element and a `:root` block cannot reach under them, which is the
reason the derivations live in the fallback. Glass's answer is opaque and unblurred, and the same
answer serves `prefers-reduced-transparency: reduce` in the engine that has it (S4). A host's own
theme answers only if it writes the block, which the documentation says. **The floors run again
under emulated `more`**, for every shipped palette — S4 measured that the suite can.

`forced-colors` stays the platform's, answered per component where a drawing needs it, as today.

**Set aside:**

- _A named high-contrast theme_ — a reader would depend on the host exposing it, and choosing it
  would exclude every other theme instead of composing with them. A switch for readers whose system
  cannot ask stays a host's to add, and a theme later would be additive.
- _A third attribute beside `data-ui-theme`_ — a third axis to RFC 0002's two, for a signal the
  platform already carries.

### 5 — A shipped theme may keep one scheme, by declaring it

**Yes, for Matrix, with `color-scheme: dark`.** A light Matrix is not Matrix. S6 measured that the
declaration on the themed element is the whole mechanism: neither the host's scheme nor the
reader's preference reaches the subtree, the grounds the theme does not move resolve to their dark
values, the system colours follow, and forced colours still win. **`dark` rather than `only dark`**:
`only` changed nothing S6 could measure, and what the specification says it is for — refusing a
browser's own forced darkening — was not emulated. It is one word to add once something shows it
matters.

The cost is S6's: the host's scheme control and the playground's stop reaching that subtree. It is
documented with the theme, and the floors run in the one scheme it keeps.

**Set aside:** _every shipped theme in both schemes_ — a light Matrix would be a second theme under
the first one's name, built for a symmetry nobody asked for.

### The order the recommendations imply

Not a Rollout, which waits for a Decision — only the sequence these answers would put the work in,
each step shippable alone:

1. **The per-palette floors**, over the default palette alone. Nothing renders differently, and every
   later step lands inside the gate.
2. **The derived label**, with the accent's shades turned away from it — the breaking step, alone so
   its changelog entry says only that.
3. **`prefers-contrast: more`** in `tokenStyleSheet()`, with the floors run under emulation.
4. **The theme shape, `themeStyleSheet()` and Matrix** — dark only, its glow through elevation first,
   and a theme control in the playground beside the scheme control #120 put there. `ARCHITECTURE.md`
   loses the elevation sentence S2 contradicts, and gains the second clause of _A category arrives…_
   if the glow turns out to need a name.
5. **Glass**, last: the raised surfaces, the controls' fills and the primary button's own fill, its
   floors measured over the page limit it documents, and opaque under `more` and under reduced
   transparency. The select's options painting their own surface can go first, since it changes
   nothing in an opaque palette.

## Decision

**Not reached.**

## Rollout

**Not written**, and deliberately: the Rollout describes what must happen for an accepted design to
exist, and there is no accepted design yet.

One piece of bookkeeping is already known. **No `ROADMAP.md` entry precedes acceptance** — RFC 0002
records that both of its own obligations, the tracking issue and the roadmap entry, followed
acceptance rather than preceding it. This file is the register until then.

**One dependency is already met**: four themes cannot be judged in a playground that renders one
scheme, and [#120](https://github.com/rak200/ui/issues/120) inserted the token sheet into the
Storybook preview and put a scheme control in the toolbar. The theme axis is the second control that
would live beside it.

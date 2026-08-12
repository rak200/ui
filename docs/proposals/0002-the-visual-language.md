# RFC 0002 — The visual language: token structure, motion and themes

- **Status**: Exploring
- **Scope**: library
- **Created**: 2026-08-09

## Motivation

The token layer is sized for the two components that exist. Nine tokens: six colours, a radius, a
spacing unit and a font stack. Nothing else has ever been needed, so nothing else was added — which
was right at the time and is the reason the gap is invisible from inside the code.

**There is no motion.** Searched across `src/`, the only match for
`transition|animation|:hover|:active|box-shadow|prefers-` is `button:focus-visible`. No transition,
no duration, no easing, and no token for any of them.

**There is one theme.** `defaults` is a single light palette written as hex literals. No dark
values, no `prefers-color-scheme`, no `color-scheme`, no named theme, nothing scoped.

**There are no interaction colours.** `button.ts` has no `:hover` and no `:active`. The first hover
state either invents a token or hardcodes a colour, and hardcoding is the one thing ARCHITECTURE.md
forbids in writing: _a hardcoded value is a decision a host cannot override._

And the queue needs categories that do not exist. Four of the twelve components in issues #13–#23
are overlays — `ui-dialog`, `ui-tooltip`, `ui-toast`, `ui-menu` — and every one needs elevation and
an answer for stacking. `ui-card` and `ui-table` need a border colour. None of the six can be built
without inventing tokens on the spot, one component at a time, which is how a token set stops being
a language and becomes a pile.

**The deadline is not the queue, it is RFC 0001.** That proposal is `Accepted`: Storybook on GitHub
Pages, and among the bonuses that won it the tie-break is a theme toolbar, reached through
Storybook's globals and decorators. The iframe/token boundary was measured specifically to make a
global theme switcher possible. A theme switcher over one theme switches nothing.

### What is already settled

**Tokens are the single source of truth for the visual language**, from RFC 0016 — and not only for
CSS. They are what keeps a native shell reachable, which is why they exist from day one rather than
being extracted once something needs them.

**Every visual decision is a token**, from ARCHITECTURE.md. Components read `var(--ui-*, fallback)`.

**The playground is Storybook**, from RFC 0001, with stories rendered by the existing suite. That
matters here for a reason beyond the switcher: whatever this proposal decides gets rendered, and
anything rendered by the suite is inside the accessibility bar.

**And a premise this proposal proposes rather than inherits, stated so it can be rejected:** what is
settled here is **structure, not values**. Which categories of token exist, what a theme _is_
mechanically, how motion is expressed — those are decisions a document can make, and the shape of
the playground depends on them. Which blue, how many milliseconds, which curve — those are
judgements made by looking, and RFC 0001 is building the instrument for looking. Deciding them in
prose, unseen, is how a decision gets reversed.

**Item 6 narrows this premise rather than refuting it, and the difference is worth keeping.** As
written it covers every value, and one class of value does not answer to looking at all: a contrast
ratio has a floor under it, and no amount of judgement moves the floor. The premise was not wrong —
it was stated over the wrong domain. Restricted to the values nothing but an eye can settle, it
survives intact.

## Study

Everything below was measured on 2026-08-09 unless it says otherwise. Where a claim is a judgement
rather than a measurement, it says that too.

### What the tree carries today

| Category      | Tokens | Names                                                                                                |
| ------------- | -----: | ---------------------------------------------------------------------------------------------------- |
| Colour        |      6 | `accent`, `accent-contrast`, `surface`, `text`, `focus`, `danger`                                    |
| Radius        |      1 | `--ui-radius`                                                                                        |
| Spacing       |      1 | `--ui-space`                                                                                         |
| Type          |      1 | `--ui-font` — a family, no scale                                                                     |
| Motion        |  **0** |                                                                                                      |
| Elevation     |  **0** |                                                                                                      |
| Layering      |  **0** |                                                                                                      |
| Border colour |  **0** | `button.secondary` uses `currentcolor`, which works for one case and is not a border-colour decision |
| State colour  |  **0** | no hover, no active, no pressed                                                                      |

**Every default is duplicated into the components, and nothing checks the copies.** Extracted both
sides and compared: the two components carry **13 `var()` fallbacks** against **9 defaults**, and
today **all 13 agree**. That is the finding — not a bug, an unchecked duplication that grows with
the component count. At two components it is 13 literals; at fourteen it is closer to ninety, and
the first one to disagree does so silently, because a fallback only shows when the `:root` block is
absent.

**No test asserts a token's value.** `tests/tokens.test.ts` asserts the shape of the layer — every
token has a non-blank default, every name carries the prefix, no name appears twice, and
`tokenStyleSheet()` emits one declaration per line that the browser parses. Deliberate and correct
for a value nobody has justified. It becomes load-bearing the moment a second theme exists, because
a theme's obligation is contrast, and contrast is a property of values.

### The token set is public API, and it is asymmetric in a way that is easy to get backwards

`tokens` is exported `as const` and `Token` is derived from it, so the set is a type. Reading the
consequences off the declaration rather than off intuition:

- **Removing or renaming a token is breaking**, obviously — a consumer's `--ui-x` stops being read.
- **Adding one is breaking too, for a specific consumer**, and this is the one that surprises:
  `defaults` is typed `Readonly<Record<Token, string>>`, so anyone who builds their own exhaustive
  map — `const mine: Record<Token, string> = { … }` — stops compiling the moment the union grows.
  Untyped CSS overrides are unaffected; the typed path is not.

Which means the **shape** decided here is the expensive part, and the values are the cheap part. It
is the same reason `src/tokens.ts` already says _a token added later is a token some target already
hardcoded_ — written about native targets, and true about the type as well.

### What the platform gives, and when each became safe

Read from the `web-features` package, which carries the Baseline status of each feature rather than
one browser's support:

| Feature                  | Baseline   | Newly since | Widely since |
| ------------------------ | ---------- | ----------- | ------------ |
| `custom-properties`      | **widely** | 2017-04-05  | 2019-10-05   |
| `prefers-reduced-motion` | **widely** | 2020-01-15  | 2022-07-15   |
| `color-mix()`            | **widely** | 2023-05-09  | 2025-11-09   |
| `oklab` / `oklch`        | **widely** | 2023-05-09  | 2025-11-09   |
| `color-scheme`           | **widely** | 2022-02-03  | 2024-08-03   |
| `light-dark()`           | newly      | 2024-05-13  | —            |
| `@starting-style`        | newly      | 2024-08-06  | —            |
| `transition-behavior`    | newly      | 2024-08-06  | —            |
| `popover`                | newly      | 2025-01-27  | —            |

**One of these changes the size of the answer.** `color-mix()` reached Widely on 2025-11-09, which
means hover, active and pressed can be **derived from the accent** rather than enumerated as their
own tokens. The difference is not stylistic: enumerating states multiplies every colour token by
three or four, and every one of those is a name a host has to override to retheme. Deriving keeps
the override surface at one colour per role.

**Two are Newly rather than Widely, and both are wanted by the overlay components.**
`@starting-style` and `transition-behavior: allow-discrete` are what animate an element that enters
from `display: none` — dialogs, toasts, tooltips, menus, all four in the queue. Available, not yet
Widely, and the fallback is a component that appears without a transition rather than one that
breaks.

`light-dark()` is Newly too, and it is the tempting shortcut for a two-theme default: one value
carries both. Attractive and not free — it couples a token's value to the document's
`color-scheme`, which is a different thing from a named theme a host can select.

### What the suite's own browser supports

Chromium **151.0.7922.34**, the version Playwright drives for the component suite: `light-dark()`,
`color-mix()`, `oklch()`, relative colour, `color-scheme`, `transition-behavior` and
`@starting-style` all report `true` from `CSS.supports`.

Recorded with its caveat, because the opposite reading is the trap: **the test browser is not the
support floor.** Everything above passes here, including the three that are not Widely. The Baseline
table is the one that governs; this measurement only says nothing will fail _in the suite_ and
therefore that the suite cannot warn about it.

### A theme does not need `:root` — measured

The working claim was that theming means re-declaring tokens at `:root`, and that a second theme
therefore replaces the first. Tested with a token declared on `:root`, overridden under
`[data-ui-theme='dark']` on a plain `<div>`, and read from inside a nested shadow root:

```
no [data-ui-theme]          background: rgb(37, 99, 235)
under [data-ui-theme=dark]  background: rgb(147, 197, 253)
```

**A theme scoped to an ancestor reaches into the shadow root, and two themes coexist on one page.**
Which matters twice: a host can theme one region without theming the document, and the playground
can put a light story beside a dark one instead of reloading between them.

### Reduced motion is one rule, not one per component — measured

Same page, same components, `prefers-reduced-motion: reduce` emulated, nothing in the component
aware of it:

```
default                     transition-duration: 0.15s
prefers-reduced-motion      transition-duration: 0s
```

The media query sits on the token block and collapses the duration token; the component reads
`var(--ui-motion-…)` and never learns why it changed. **This is the argument for motion being
tokens rather than literals**, and it is stronger than the theming argument: a hardcoded `150ms` is
not merely un-overridable, it is an accessibility defect that every component would have to fix
individually.

### What a peer with dozens of components actually carries

Counted from Shoelace's published theme CSS — the closest peer by kind: host-agnostic web
components, token-driven, tens of components.

```
390 tokens, 19 KB
  colour 290   type 45   other 16   space 14   radius 10   elevation 5   motion 5   layering 5
```

**The three categories this library has none of cost five tokens each there.** Fifteen tokens for
motion, elevation and layering combined, against 290 for colour — the colour count is large because
Shoelace ships full primitive palettes, which is a separate decision from the one this section is
about.

Their shapes, quoted because they are concrete and this proposal has to pick something:

```
--sl-transition-x-fast 50ms   fast 150ms   medium 250ms   slow 500ms   x-slow 1000ms
--sl-shadow-x-small … x-large      five shadows, increasing blur and opacity
--sl-z-index-drawer 700   dialog 800   dropdown 900   toast 950   tooltip 1000
```

Two of those are worth noticing rather than copying. **Motion is named by speed** — `fast`, `slow` —
which is a value name; naming by purpose (`--ui-motion-enter`) would be a decision name, and the two
read very differently at the call site. **Layering is named by component role**, which is honest
about what z-index is for and does not pretend to be a scale.

**The theme selector is a class, not `:root` and not a media query.** `.sl-theme-light` and
`.sl-theme-dark` — exactly the scoped mechanism measured above, adopted by a library that had to
solve this at scale.

**The model is two layers, and the numbers say so.** Of 390 names, **213 change value between light
and dark** and **115 are aliases** whose value is a `var()` pointing elsewhere:

```
--sl-color-gray-100      hsl(240 4.8% 95.9%)   ->  hsl(240 5.7% 18.2%)     primitive: changes
--sl-color-primary-100   var(--sl-color-sky-100)                            semantic: does not
```

So a theme **redeclares the primitive layer**, and the semantic layer — the names components
actually read — stays fixed. This library today has only the semantic layer, with literal values and
no primitives underneath. That works at nine tokens and is the thing that stops working first.

**One gap in the peer, and it is the cheap one.** Neither theme file mentions
`prefers-reduced-motion`; both do set `color-scheme`. So the closest peer leaves reduced motion to
its consumers, and the measurement two sections up shows it costs one media query in the token
block. Recorded because a study that only borrows never notices where the borrowed thing is thin.

**Carbon, for contrast in kind rather than degree:** 648 tokens, 936 KB of CSS, most of them not
classifiable as any of the categories above. It is a framework wearing a token layer, not a token
layer, and it is recorded so its absence is not read as an oversight. Spectrum's theme package was
attempted and its published CSS path answered 404; not pursued further.

### How many colour roles the queue actually needs

The layer question is not answerable by taste, and it was being asked before the number that decides
it existed. Read off the eleven queued issues — what each component's own text says it renders, not
what a component of that name usually has — the fourteen components ask for **thirteen colour roles
beyond the six that exist**:

| Role                              | Asked for by                 | Reachable from the six?                          |
| --------------------------------- | ---------------------------- | ------------------------------------------------ |
| Border, control and container     | #13 #14 #15 #17 #18 #19      | yes — text mixed into surface                    |
| Divider / separator               | #18 #19 #23                  | yes — the same, lighter                          |
| Muted text (placeholder, caption) | #13 #17 #19 #23              | yes                                              |
| Subtle surface (zebra, header)    | #16 #19                      | yes                                              |
| Hover background                  | #14 #15 #23, and `ui-button` | yes                                              |
| Accent hover / pressed            | `ui-button` #14 #15          | yes — accent mixed toward text                   |
| Selected / highlighted item       | #15 #23                      | yes — accent mixed into surface                  |
| Scrim behind a modal              | #22                          | yes — text at an alpha                           |
| Inverted surface + text (tooltip) | #20                          | yes — surface and text swapped, no mix needed    |
| Elevated surface                  | #18 #20 #21 #22 #23          | yes — it is `surface`; the elevation is a shadow |
| Disabled                          | #13 #14 #15 #16 #17 #23      | already answered — `button.ts` uses `opacity`    |
| **Success**                       | #21                          | **no** — a hue no mix of the six produces        |
| **Warning**                       | #21                          | **no** — the same                                |

**Eleven of thirteen are reachable; two are not.** Which is the answer the layer question was
waiting for: a primitive palette exists to supply related colours, and `color-mix()` supplies them
from the six already declared. What no mix can invent is a _new hue_, and exactly two are asked for.

Read as a judgement, not a measurement — the issues describe intent, and a component's real markup
can ask for something its issue did not. The count is a floor, not a ceiling.

### Derivation, and where it has to live — measured, and it refuted the obvious placement

The claim under test was the one the count implies: **declare the derived roles beside the ground
tokens, and a theme that redeclares two grounds moves all of them.** It is wrong, and the way it is
wrong is silent.

Three placements of one derivation — `color-mix(in oklab, var(--ui-color-text) 22%, var(--ui-color-surface))`
— on one page, with a dark theme redeclaring only `--ui-color-surface` and `--ui-color-text`. Colours
resolved to sRGB by the browser's own canvas, because `color-mix()` computes to `oklab()` and no
hand-written parser should be trusted with that:

```
A  declared once, beside the ground tokens
     light rgb(200,203,207)     dark rgb(200,203,207)   << did not follow
B  declared again inside the theme block
     light rgb(200,203,207)     dark rgb( 56, 63, 77)      followed
C  no token — the mix written at the point of use
     light rgb(200,203,207)     dark rgb( 56, 63, 77)      followed
```

**The mechanism:** a custom property whose value contains `var()` resolves at the element where it is
_declared_. `--ui-color-border` computed once at `:root`, against the light values, and what
inherited into the dark subtree was the already-resolved colour. It is not a fallback, not a
specificity problem and not a bug — and it produced a near-white border on a dark surface, contrast
**10.90** against a background it was meant to sit quietly against. Visibly wrong rather than subtly
wrong, which is the only merciful part.

**Both fixes cost something.** _B_ makes the theme block repeat every derivation, which turns
"redeclare two grounds" into "redeclare two grounds and eleven formulas" — the peer's 213-name theme
file, arrived at from the other direction. _C_ follows the theme for free and leaves **no token**, so
a host cannot override a border by name, which is the rule ARCHITECTURE.md states outright.

**A fourth placement holds both ends, and it is the pattern this repository already uses.** Put the
derivation in the `var()` _fallback_, at the point of use — `var(--ui-color-border, «the mix»)`:

```
D  light rgb(200,203,207)   dark rgb(56,63,77)   branded rgb(102,51,153)
     followed the theme:      true
     host override still wins: true
```

The name exists and is overridable; the formula resolves per element, so it tracks the theme; and
nothing has to be declared at `:root` for either to be true. It is `var(--ui-*, fallback)` — the
convention already in every component — with the fallback promoted from a copy of a default to a
formula.

**And it carries a consequence for `tokenStyleSheet()` that is easy to get backwards:** a derived
token must **not** be emitted into the `:root` block. Emitting it is precisely placement _A_, the one
measured broken. So the set splits in two — ground tokens, which have literal defaults and belong in
the stylesheet, and derived tokens, which have formulas and must never appear there.

**One number is a warning rather than a result.** The 22% mix reads 1.63:1 against white and 1.68:1
against the dark surface. WCAG 1.4.11 asks 3:1 for the boundary of a user-interface component, and
that tag is inside the ruleset `tests/a11y.ts` already declares. 22% was picked to demonstrate the
mechanism, not proposed as a value — but it shows that **a derivation percentage is an accessibility
decision wearing the clothes of a taste decision.**

### What placement D costs, measured — and `@property` is not the way out

D looks free in the previous section because the previous section only asked whether it paints
correctly. The cost is on the other side: **a token that exists only as a `var()` fallback is never
declared, so nothing can read it.** Measured, along with the obvious escape — registering the
property with `@property` so it has a value to read.

Three variants, one page, a dark subtree and a host override on each:

| Variant                                    | Derivation used | Follows theme | Override wins | Host can read it |
| ------------------------------------------ | --------------- | ------------- | ------------- | ---------------- |
| Never declared — **placement D**           | **yes**         | **yes**       | **yes**       | **no**           |
| `@property` `<color>` with `initial-value` | no              | no            | yes           | yes              |
| `@property` `*` with no `initial-value`    | **yes**         | **yes**       | **yes**       | **no**           |

**The trade is exact, and it is forced.** A registered property with an initial value is never
guaranteed-invalid, so `var(--x, «the mix»)` stops reaching its fallback: the middle row painted
`#cccccc` in both themes, its declared initial value, and the derivation never ran. Registering does
not add read-back to D — **it converts D back into placement A**, the one already measured broken,
declared a different way. And `syntax: '*'` without an initial value is D exactly, byte for byte in
its results: it buys nothing.

So **read-back and derivation are mutually exclusive**, and no third option was found.

**A second, smaller loss travels with it: the name is not discoverable by inspection.** Iterating
computed style on a plain element lists custom properties that are declared or registered, and
nothing else — `--declared` and `--registered` both appear, an undeclared name does not. So a host
cannot find `--ui-color-border` by looking at an element; the only place the name exists is the
documentation.

**And it splits the exported set.** `defaults` is `Readonly<Record<Token, string>>`, exhaustive over
`Token`. A derived name has no static value — its default is a formula that must never be emitted at
`:root` — so it cannot take a row there without lying. Either derived names stay out of `tokens`,
which puts them outside the type a host can reference, or the export grows a second array with its
own meaning. Both are API decisions, and both belong to item 1 rather than to whoever implements it.

**What is not lost, stated so the cost is not overstated:** the override works, the theme is
followed, and the effective colour is still observable where it is _painted_ — a host that wants the
resolved value can read the `background-color` of the element carrying it. What disappears is asking
the token layer directly, by name.

### Theme and scheme are two axes, and they are independent — measured

The earlier sections here treat `dark` as a theme. **That is a category error**, and correcting it
changed the answer to item 2 rather than decorating it: light and dark are not two themes, they are
one theme rendered two ways. Which makes them two axes — a **theme**, a named set of decisions, and
a **scheme**, the light or dark rendering of whichever theme is in force.

The claim under test was that the axes are genuinely independent, and that the item-1 derivation
follows both. Two themes — a default and a brand — with the scheme carried inside each ground value
by `light-dark()`, and the scheme forced on a subtree with `color-scheme`. Twelve cells, read from
the derived border inside a shadow root:

```
the OS says light                     the OS says dark
  default  system   light               default  system   dark
  default  light    light               default  light    light
  default  dark     dark                default  dark     dark
  brand    system   light  (violet)     brand    system   dark   (violet)
  brand    light    light  (violet)     brand    light    light  (violet)
  brand    dark     dark   (violet)     brand    dark     dark   (violet)
```

**Every cell is right and neither axis leaks into the other.** The theme picks the pair of grounds,
`color-scheme` picks the branch within that pair, the OS is followed where nothing forces, and a
force wins over the OS — with the derived colour tracking both.

**And `color-scheme` is inherited**, which is what makes this cheap rather than repetitive: a child
that never declares it, under an ancestor that does, computed `dark`. So the scheme axis is declared
once at the root and a host's own theme block never mentions it.

**What this eliminates is the three-state pattern.** Under a selector-only scheme axis, _follow the
system / force light / force dark_ needs a media query guarded by
`:root:not([data-ui-theme='light'])` — the rule nobody writes correctly the first time. Under this
model the three states are `color-scheme` absent, `light`, or `dark`. The fragile construct does not
get written more carefully; it stops existing.

### A zero-length transition fires no event — measured

Collapsing a duration to zero under `prefers-reduced-motion` looks like the obvious reduction. It
takes one behaviour away that nothing announces.

An element transitioned from `opacity: 1` to `0`, at five durations, with `transitionstart` and
`transitionend` observed for 400ms:

```
duration   transitionstart   transitionend   final opacity
150ms      true              true            0
1ms        true              true            0
0.01ms     true              true            0
0ms        false             false           0
0s         false             false           0
```

**At zero the value still lands and no event ever fires.** A component that awaits `transitionend`
before removing itself — closing a dialog, dismissing a toast, closing a menu, which is four of the
queue's twelve — waits forever, and only for the users who asked for less motion.

_Reproduction note, because the first attempt measured nothing:_ the element's style must be flushed
between appending it and changing the property — read `getComputedStyle(el).opacity` — or both values
resolve in one frame, no transition is ever started, and every duration reports `false` including
150ms.

### Which accessibility floors the suite already enforces, and which it cannot

Three floors bear on the values this proposal will need. Whether each is already gated was read from
the installed `axe-core` 4.13.0, filtered to the five tags `tests/a11y.ts` declares — **70 rules
active**:

```
color-contrast        1.4.3, text contrast 4.5:1        ACTIVE — every story, free
target-size           2.5.8, pointer target 24x24       ACTIVE — every story, free
non-text-contrast     1.4.11, a component's boundary    NO SUCH RULE in axe-core
focus-appearance      the focus indicator itself        NO SUCH RULE in axe-core
```

`color-contrast-enhanced` does exist and is tagged `wcag2aaa`, so it is correctly outside the
declared ruleset rather than missing from it.

**Two of the three are already a gate and nobody had to decide anything.** The third is the one the
derivation measurement landed on — 3:1 for a component boundary, against the 22% mix's 1.63:1 — and
it has no rule to switch on. Enforcing it means a hand-written assertion, which is not a new kind of
thing here: `tests/a11y.ts` is already exactly that, a hand-written accessibility assertion carrying
its own reasoning.

### The question underneath

RFC 0001 found its question by measuring: _which hand-written surface is the one a gate can check._
The equivalent here is sharper than _how many tokens_.

**Is a token a value, or a decision?** Today it is a value: `--ui-radius` is `0.375rem` and that is
all it is. Motion and themes both break that reading from opposite sides. A duration that must
collapse to zero under `prefers-reduced-motion` is not a value, it is a value plus a condition. A
colour that must be one thing in light and another in dark is not a value either. The moment either
lands, the layer stops being a dictionary of values and becomes a small language — and the choice is
whether to admit that in the structure or to keep bolting conditions onto a dictionary.

## Proposed design

Two halves, and they are at different stages. The properties below hold whatever the remaining items
decide; the worked shape after them follows from item 1, which is resolved.

### The properties any answer has to hold

- **A component never reads a primitive.** Whatever layering is chosen, components read names that
  describe a role — `--ui-color-accent`, not `--ui-color-blue-600`. A component that reads a
  primitive is a component that a theme cannot retheme.
- **Whether a category needs a ground scale depends on what its values carry.** Two kinds, and the
  test is whether one value can be a fact:

  _Identity-bearing_ — colour, font family. `#111827` rather than `#111826` may be a trademark, and
  a font stack is a licensing decision. The value is the content, so semantic names hold literals
  and no scale sits underneath.

  _Scale-bearing_ — duration, spacing, radius, type size, elevation, layering. Nobody chooses 149ms
  over 150ms; the value means something only against its neighbours. **The content is the relation**,
  so the ground is a scale of steps and the semantic names point into it.

  Spacing already lives this way without anyone deciding it — `calc(var(--ui-space) * 2)` in
  `button.ts` is a scale by multiplication. And the two kinds explain why item 1 gives colour one
  layer while item 9 gives duration two, on a property of the domain rather than a preference.

- **A host overrides one name to change one thing.** The override surface is the semantic layer, and
  its size is the cost a host pays to make the kit theirs. This is the argument against enumerating
  interaction states as tokens and for deriving them — and the measurement below adds the condition
  it depends on: a derivation only survives a theme if it resolves where it is used.
- **Reduced motion is honoured in the token layer, once.** Not in each component. Measured above as
  working; the only question is which tokens it collapses.
- **A second theme is an addition, not a replacement.** The measurement says a scoped selector can
  do this. A design where `:root` is the only theming surface forecloses it.
- **Whatever ships is renderable by the suite.** RFC 0001 puts the stories inside `test`, so a theme
  with a contrast defect is catchable — but only if something renders it. A theme with no story is a
  theme with no accessibility bar.

### The shape item 1 produces

Written out because a resolution stated in prose is one that gets re-derived, and re-derived
differently. **Every number below is a placeholder**, and item 6 says which kind: the border's
percentage is floor-bound and answers to 3:1, the rest are taste and answer to the playground.

**The exported set splits in two, and the ground half barely moves.** It grows by the two hues no
mix produces:

```ts
export const tokens = [
  '--ui-color-accent',
  '--ui-color-accent-contrast',
  '--ui-color-surface',
  '--ui-color-text',
  '--ui-color-focus',
  '--ui-color-danger',
  '--ui-color-success', // new: no mix of the others produces this hue
  '--ui-color-warning', // new: the same
  '--ui-radius',
  '--ui-space',
  '--ui-font',
] as const;

export type Token = (typeof tokens)[number];
export const defaults: Readonly<Record<Token, string>> = {/* … the light scheme … */};

/** The grounds that differ in the dark scheme — item 2's second axis, kept as data. */
export const darkScheme: Readonly<Partial<Record<Token, string>>> = {/* … four of them … */};
```

The derived half sits beside it, never inside it:

```ts
export const derivedTokens = [
  '--ui-color-border',
  '--ui-color-divider',
  '--ui-color-text-muted',
  '--ui-color-surface-subtle',
  '--ui-color-hover',
  '--ui-color-accent-hover',
  '--ui-color-selected',
  '--ui-color-scrim',
  '--ui-color-inverted-surface',
  '--ui-color-inverted-text',
] as const;

export type DerivedToken = (typeof derivedTokens)[number];

/** How each derived role computes when the host has not set it. Never emitted at `:root`. */
export const formulas: Readonly<Record<DerivedToken, string>> = {
  '--ui-color-border': 'color-mix(in oklab, var(--ui-color-text) 22%, var(--ui-color-surface))',
  '--ui-color-inverted-surface': 'var(--ui-color-text)',
  // …
};
```

**Eleven ground, ten derived** — and the arithmetic against the thirteen counted roles is worth
stating so it does not read as a discrepancy: _elevated surface_ is `surface` carrying a shadow,
_disabled_ is already `opacity` in `button.ts`, and _inverted_ is one role that yields two names.

**Three consequences fall out of that split, and none of them needed a new decision.**

_`tokenStyleSheet()` does not change._ It iterates `tokens`, which by construction never holds a
derived name, so the function is already correct for the rule that a formula must never reach
`:root`. Most of item 5 answers itself here.

_`Token` does not widen and `defaults` stays exhaustive_, so the source-breaking change the study
identified — a consumer's `Record<Token, string>` — never happens.

_The thirteen duplicated literals go away as a class._ A component stops writing the fallback and
reads a reference generated from the same data:

```ts
const reference = (name: Token | DerivedToken) =>
  unsafeCSS(`var(${name}, ${name in formulas ? formulas[name] : defaults[name]})`);
```

```ts
// today
button { border-radius: var(--ui-radius, 0.375rem); }

// after
button { border-radius: ${ref['--ui-radius']}; border-color: ${ref['--ui-color-border']}; }
```

`unsafeCSS` is warranted here and nowhere near user input: every argument is this package's own
literal. **It does mean the reference helper cannot live in `tokens.ts`** — that module imports no
Lit today, and that is exactly what keeps the native-shell promise intact. The helper is a separate
internal module that reads from it.

**A whole theme is then four grounds**, each carrying both of its schemes — the shape item 2 settled:

```css
[data-ui-theme='brand'] {
  --ui-color-surface: light-dark(#faf5ff, #1a0b2e);
  --ui-color-text: light-dark(#3b0764, #f3e8ff);
  --ui-color-accent: light-dark(#7e22ce, #c084fc);
  --ui-color-accent-contrast: light-dark(#ffffff, #1a0b2e);
}
```

Border, divider, muted text, subtle surface, hover, selected, scrim and the inverted pair follow on
their own, in both schemes of both themes — measured, not assumed.

**And the line that must never be written**, which is the first thing anyone will try:

```css
/* Placement A — measured broken. It resolves once here and freezes; the dark
   subtree then inherits a near-white border. */
:root {
  --ui-color-border: color-mix(in oklab, var(--ui-color-text) 22%, var(--ui-color-surface));
}
```

It belongs in the source as a comment rather than only here, because the failure looks like
something to fix rather than something already decided.

**What a host writes is unchanged**, which is the whole point of the trade:

```css
:root {
  --ui-color-accent: rebeccapurple; /* everything derived from accent follows */
  --ui-color-border: #d1d5db; /* and a derived name is still overridable */
}
```

## Decision

**Partly resolved**, which is what keeps this `Exploring`: seven items are settled, two are not, and
they are **kept apart below rather than interleaved**. Item 5 appears among the settled having been
closed, reopened by item 2 and closed again, and item 3 arrived carrying two halves of which only one
was settled — the round trips are left visible, because an item that reopens or splits says something
about the order the items were taken in. A settled item is read once and referred to;
an open one is read to be worked on. Numbers are stable across the split, so a later reference to
_item 5_ still means what it meant.

**An earlier draft listed seven, and two of them were one question asked from both ends.** _One layer
or two_ and _derived states or enumerated_ cannot be answered independently: every answer to the
second already _is_ an answer to the first. Deriving from a small semantic set keeps one layer;
picking from a scale requires two; adding a name per role keeps one layer and makes it large. The
same circularity RFC 0001 recorded twice — a property of the answer, promoted to a question that
precedes it. Merged rather than quietly dropped, which is why the numbering has a history.

### Resolved

#### Item 1 — Where a colour that has no token comes from

**From the six, mixed in the `var()` fallback at the point of use.** The merged item, and the one
everything else inherits. The queue asks for thirteen roles beyond the six, **eleven of them
reachable by mixing the six** and two — success and warning — reachable only by declaring a new hue.
The placement is settled by measurement rather than preference, because three of the four candidates
are broken or lossy: the derivation belongs in the `var()` fallback at the point of use, which
followed the theme and kept the host's override.

**This settles the layer count for colour: one, not two.** A primitive palette exists to supply
related colours; `color-mix()` supplies them from the six already declared, so the second layer has
no work left to do. The peer's 213-name theme file is what the alternative costs at scale.

**For colour, and not as a rule for every category** — an earlier draft said _one, not two_ without
that qualifier, and item 9 later found the qualifier was load-bearing. What lets colour drop the
second layer is that `color-mix()` took over the scale's job, plus the fact that a colour value can
carry identity: `#111827` rather than `#111826` may be a trademark. Neither holds for duration, and
item 9 gives it two layers for exactly the reasons this one gives colour one. The general form is in
the _Proposed design_.

**Its price is measured too, and it is a real one**: a derived name cannot be read back, cannot be
discovered by inspecting an element, and cannot take a row in `defaults` — with `@property` ruled
out as the escape, because registering the property is placement A again.

**And one consequence reaches past CSS, which is where it stops being obvious.** `src/tokens.ts`
states that the layer exists partly so a native shell can read the same values without the
components, and `ROADMAP.md` carries the second emission format as pending work. `color-mix()` is a
CSS function: a derived role has **no value a TypeScript emitter can read**, only a formula in a
language the target does not have. It is an asymmetry rather than a wall — a formula plus a concrete
theme yields a value, so the emitter resolves derived roles at build time and emits them frozen per
theme, while CSS keeps them live. Recorded because deciding this without it would be deciding it on
the web alone.

**Both costs are accepted, and here is what bought them.** The trade was: a write-only name, or every
colour a declared value paid for in the theme block. Three reasons decided it, in order of weight.

_The override surface is a promise the package already makes._ `src/tokens.ts` says _no build step,
no theme object, no fork_. Deriving keeps that surface at eight names; declaring every role puts it
at nineteen, and a host who wants to change the blue has to know which of the nineteen follow from
it.

_The native target has no consumer, and the roadmap says so in writing_ — _"No consumer needs it yet,
and the shape of that emission is a decision to make with one in hand."_ Choosing the more expensive
structure to protect a target nobody has is the antipattern that same file already states for Zag: a
dependency carried before anything uses it is a claim the code does not back up. The asymmetry above
is the price, and it is payable later by the emitter that does not exist.

_It is the convention already in every component_ — `var(--ui-*, fallback)` — with the fallback
promoted from a copy of a default to a formula. Which retires the thirteen duplicated literals from
the other direction: a fallback stops being a value that can silently disagree with `defaults` and
becomes one that cannot.

**What would reverse it, stated so the reversal has a trigger rather than a mood:** a host reading
tokens by script — runtime theming, or a chart canvas that must match the table's border. Read-back
stops being a convenience there and becomes a requirement, and the all-declared structure wins.

**Three things left this item so that it could close**, and each went to the place that owns it: the
exported surface, to item 7; the formulas, which are values, to item 6; and whether success and
warning arrive now or with `ui-toast`, to item 4.

#### Item 2 — What a theme is, mechanically

**Resolved: two independent axes. A _theme_ is selected by `data-ui-theme`; a _scheme_ is selected
by `color-scheme`, and each ground carries both of its schemes in one value through
`light-dark()`.**

```css
:root {
  color-scheme: light dark; /* the scheme axis, declared once, inherited */
  --ui-color-surface: light-dark(#ffffff, #111827);
  --ui-color-text: light-dark(#1f2937, #e5e7eb);
}

[data-ui-theme='brand'] {
  /* a theme carries both of its schemes */
  --ui-color-surface: light-dark(#faf5ff, #1a0b2e);
}
```

Forcing a scheme is `color-scheme: dark` on any ancestor; following the system is declaring nothing.
The theme axis is an **attribute rather than a class** — single-valued by construction, so two
values cannot fight, and it matches the `ui-` prefix the elements already carry.

**This entry is the one that changed most, and the reason is recorded rather than smoothed.** An
earlier draft weighed a scoped selector _against_ `light-dark()` as rival mechanisms and recommended
the selector, on four arguments. Two of them died the moment `dark` stopped being called a theme:
_it caps themes at two_ caps **schemes** at two, and there are exactly two; _it solves a problem item
1 eliminated_ inverted, because with T themes two axes cost T blocks where one axis costs T×2 blocks
plus T guarded media queries. A third — _it fails silently without `color-scheme`_ — shrank to a
narrow case when inheritance was measured. **The framing was the error, not the arithmetic.**

**What decided it in the end was not on that list at all**: this model deletes the three-state
pattern rather than making it safer, and that construct was the weakest part of the rejected
recommendation by its own admission.

**`color-scheme` is load-bearing beyond the scheme axis**, and it would be worth declaring even if
this item had gone the other way: it is what makes a native `<select>` and `<input>` render dark, and
issues #13 and #17 are styled native elements by design.

**Two consequences, and neither is small.**

_Item 5 reopens._ Its resolution — _the function does not change_ — was reached under the assumption
of a single axis. Under two, `tokenStyleSheet()` emits `light-dark(light, dark)` rather than a bare
default, and the test asserting ``toContain(`  ${token}: ${defaults[token]};`)`` no longer holds.
The shape that looks right is the one item 7 already used twice — two clean records, one generated
expression, so the native emitter reads data instead of parsing CSS — but that is item 5's to decide,
not this one's.

_A browser floor becomes real, and is deliberately not declared yet._ `light-dark()` is Baseline
**Newly** since 2024-05-13, not Widely, and `package.json` carries no `browserslist`. The decision
here is to adopt it and **defer the floor**. Recorded precisely, because deferring is not the same as
avoiding: **the constraint exists the moment `light-dark()` ships — declining to write it down makes
it undocumented, not absent.** The degradation path in a browser without the function was not
measured, for want of one to measure in, so what a consumer on such a browser sees is reasoning
rather than evidence.

#### Item 3 — What reduced motion collapses

**Resolved: every duration collapses, to `0.01ms` rather than to zero.** How motion is _named_ was
split out into item 9; this half stands on its own, because the collapse rule is the same whichever
name the durations carry.

**The collapse is to `0.01ms`, and the reason is versatility rather than the one first written
down.** The first draft argued that the alternative — collapse to zero, and forbid components from
depending on `transitionend` — is a convention and therefore weak. That argument does not hold:
**`0.01ms` is equally a convention.** What actually separates them:

_One code path at two speeds, instead of two behaviours._ At `0.01ms` transitions still exist,
events still fire, the lifecycle still runs — reduced motion is the same system with the time taken
out. At zero it is a structurally different mode, and every component that wants to hook the end of
a transition has to have two implementations. And a host who wants true zero can still set it; with
zero baked in, a host cannot repair a component that broke.

_And the rule is honoured once, not once per component._ The corrected form of the original
argument: the collapse lives in one place in the token layer and is assertable, while _do not depend
on `transitionend`_ must be remembered by every author of every future component, and its violation
is invisible until someone enables the setting.

**Every duration collapses, not a marked subset.** No case for an exception exists, and building the
marking mechanism before one does is the antipattern item 4 names.

**And _every_ has to mean both layers, which item 9 turned from a phrasing into a requirement.**
Duration now has ground steps and derived purposes, and collapsing only the steps leaves a hole:
a derived name is resolved from its fallback **only while nobody has declared it**, so a host who
has set `--ui-duration-enter: 300ms` keeps 300ms through the collapse — the setting is honoured for
everyone except the hosts who tuned their motion. The reduced-motion block therefore declares every
`--ui-duration-*` name, ground and derived alike, which the two arrays already enumerate.

**This extends item 5's emitted output rather than reopening it.** The collapse is a second rule —
`@media (prefers-reduced-motion: reduce)` — where item 5's assertion says `cssRules.length === 1`.
The decision is the one item 5 already made for `color-scheme`, applied again: one function, complete
output, because leaving it to the host is a silent failure and a sibling export creates a which-do-I-call
problem. The assertion changes; the principle does not.

#### Item 5 — `tokenStyleSheet()` and the thirteen fallbacks

**Resolved, on the second pass: two records and a generated expression, with `color-scheme` emitted
by the same function.**

```ts
export const defaults: Readonly<Record<Token, string>>; // the light scheme — unchanged, to the value
export const darkScheme: Readonly<Partial<Record<Token, string>>>; // only the grounds that vary
```

`tokenStyleSheet()` composes `light-dark(defaults[t], darkScheme[t])` where there is a pair and emits
the plain default where there is not, and declares `color-scheme: light dark` in the same `:root`
block.

**A correction first, because it changes which option looked cheap.** The reopening said the test
asserting ``toContain(`  ${token}: ${defaults[token]};`)`` fails under two axes. It fails under
_this_ resolution and not under the rival, where `defaults` itself would carry the
`light-dark(…)` string — that assertion compares the output against the very constant that produced
it, so **no change of value can ever fail it.** It checks the emission mechanism, not the emission.

That is not a point in the rival's favour, and reading it as one is the trap: _breaks no test_ was a
property of the test's weakness, not of the change's safety. Choosing this shape forces the
assertion to **state the emitted form** instead of comparing it to itself.

**Why two records rather than one carrying the expression.** The rival folds both schemes into
`defaults`, which reads as the cheap option and stops the data being data: the native emitter of
item 1 would have to **parse CSS** to recover a branch, a host reading `defaults['--ui-color-surface']`
for a colour would get an expression, and `--ui-radius`, which has no scheme variation, would be
indistinguishable at the type level from `--ui-color-surface`, which does. `Partial` answers _which
grounds vary by scheme_ in the type system; the alternative answers it by substring search.

And `defaults` keeps every value it has today — the second pass at this item changes what the
function emits, not what the package already declares.

**Why the same function emits `color-scheme`.** It is a real property, not a custom one, so it can
never be a token; the choices were the host declaring it, a sibling export, or this. Leaving it to
the host is a silent failure at the highest possible frequency — every host must remember, and
forgetting means dark mode never happens with nothing to read. A sibling export means two functions
with overlapping output and a host who has to know which to call. The one adverse case here is a
host who deliberately wants a different `color-scheme`, `only light` say, and they resolve it with
their own rule: they control the order the sheet is inserted in. Low and manageable against silent
and constant.

**What the suite says afterwards.** Untouched: every token has a non-blank default, the prefix, no
duplicates, the block's opening and closing, and _parses as CSS the browser actually applies_ —
which gains value here, because it now catches a malformed `light-dark()`. Changed: the emitted line
per token, which states its form, and the count, `tokens.length + 3`. Added:

```ts
it('varies only colour tokens by scheme', () => {
  // light-dark() takes colours. A dark value for --ui-radius emits invalid CSS.
  for (const name of Object.keys(darkScheme)) expect(name.startsWith('--ui-color-')).toBe(true);
});
```

plus a dark value never equal to its light one, and the sheet declaring the scheme axis. **With item
7's three, the token layer goes from three checked invariants to seven** — and the three it has today
are all about shape.

#### Item 6 — Where the values get decided

**Resolved: by class, and for two of the three classes the question does not arise.**

```
floor-bound   a threshold decides pass or fail   → the test decides; where it was chosen is moot
rule-bound    an internal consistency rule       → written here, because nothing else can write it
taste         nothing but an eye settles it      → the playground, which RFC 0001 is building
```

Floor-bound: text contrast, pointer target size, the 3:1 boundary. Rule-bound: z-index ordered by
stacking role with room to insert, the steps of a duration or type scale, spacing as multiples of
`--ui-space`. Taste: which blue, how many milliseconds, which easing curve, how soft a shadow.

**And the floors are executable, which is what makes the first row true rather than aspirational.**
Two of the three already run on every story, measured above. The third has no axe rule and takes a
hand-written assertion beside `tests/a11y.ts`, which is a precedent rather than a novelty. That work
is Rollout, not Decision — it is equally true under every answer this item could have had.

**A fourth option was drafted and collapsed under inspection, and it is recorded because the way it
collapsed is the reasoning.** It read: _make the floors executable and stop legislating where._ It
was two things glued together. The first half is not an answer to this item at all — it is true
whichever answer wins, which is why it moved to Rollout. The second half — _the rest, anywhere_ —
governs only the values that have tests, and those were never the hard part: **a floor is not a
choice.** For the taste values, which are the whole of the difficulty, it said nothing while
sounding like it had. It also needed a piece of the classification handed back to it to work, and an
option that needs its rival to function is not a rival.

**The correction underneath is the one worth keeping.** The 22% mix reading 1.63:1 was recorded here
as a counterexample to the premise in _What is already settled_. It was not. It is a counterexample
to applying that premise to a value with a floor under it — the premise was **stated over the wrong
domain, not refuted**, and narrowing it is the whole of this resolution.

The condition it depends on is unchanged and now covers more: **a value with no story is a value
with no floor.**

#### Item 7 — The shape of the exported set

**Resolved: a second exported array and a second type, with the formulas exported beside them.**

```ts
export const derivedTokens = ['--ui-color-border' /* … */] as const;
export type DerivedToken = (typeof derivedTokens)[number];

/** How each derived role computes when the host has not set it. Never emitted at `:root`. */
export const formulas: Readonly<Record<DerivedToken, string>>;
```

`tokens`, `Token`, `defaults` and `tokenStyleSheet()` do not change. **Pure addition — a `feat`, and
nothing breaks.**

**The formulas are exported because item 1 already required it**, not as a preference: that
resolution has the native emitter resolving derived roles at build time, frozen per theme, and it
can only do that if it can read them from the package. Internal formulas would mean reimplementing
them outside — two sources for one decision. The objection that a formula string becomes API does
not survive contact with the rest of the package: changing 22% to 18% is a value change, and
`--ui-color-accent` changing hue is equally observable and equally not breaking.

**Three shapes were rejected, and one of them for a reason worth keeping.** A single array with
`defaults` made `Partial` breaks twice over and voids the test that every token has a default. An
array of discriminated objects is tidier in the abstract and costs a major for no gain available
today. And a single array carrying the formula _inside_ `defaults` is the dangerous one: the types
stay total and the test stays green, while `tokenStyleSheet()` — which iterates `tokens` — would
**emit the formula at `:root`**, which is placement A. It would make the one measured failure mode
reachable through the public API, held back only by a filter someone could delete.

**Exporting nothing at all was the real rival, and it loses on documentation.** The derived names
could live in an internal module and in `docs/tokens.md` alone. But CI extracts exported symbols
from `src/` and requires each to appear under `docs/`; a name that is not an exported symbol is
checked by nothing. Ten overridable names documented only where no rule looks is a surface that
rots.

**What decided it was neither of those.** Writing out the consequences showed that this shape
**turns the measured failure into a gate** — with a list to iterate, `tokenStyleSheet()` can be
asserted never to contain a derived name, and every formula can be asserted to reference only
tokens that exist. Under the internal-only shape neither test is writable. Those assertions are
Rollout, and they are the strongest argument the item produced.

**Two costs accepted.** `tokens` is not renamed to `groundTokens`: a rename is breaking, and Layer 1
would require deprecating in a minor and removing in the next major — a major spent on a name. So
the pair reads asymmetrically, and `tokens` carries the documented meaning _the names that have a
default_. And no `Token | DerivedToken` alias is exported yet; the internal reference helper uses
the union, and exporting a third name before something needs it is the complaint `ROADMAP.md`
already makes about Zag.

#### Item 9 — How motion is named

**Resolved: by purpose, with duration and easing as separate names — and duration carrying a ground
scale underneath its purposes, which easing does not.**

```css
/* ground: the scale. Steps, not facts. */
--ui-duration-fast   --ui-duration-moderate   --ui-duration-slow

/* derived: what a component reads. A formula that is a plain reference. */
--ui-duration-enter: var(--ui-duration-fast);
--ui-easing-enter    --ui-easing-exit    --ui-easing-state
```

Split out of item 3, which was recorded as resolving both halves and had only resolved one. The
rival was **by speed alone** — `--ui-duration-fast` read directly by components, the peer's shape,
five steps from 50ms to 1000ms.

**One argument for purpose was made and is void, and it is left here because the way it fails is the
useful part.** It said that if a tooltip and a toast both read `fast`, a host wanting slower tooltips
and unchanged toasts has no name to reach for. They have exactly the same problem under
`--ui-duration-enter`: both schemes are one flat set, and **neither gives per-component control.**

What does give it is the selector, under either scheme, and for free — custom properties inherit, so
a host writes `ui-tooltip { --ui-duration-enter: 300ms }` and only tooltips move. Granularity was
never a differentiator between the two, and treating it as one obscured what is.

**Two arguments survive, and both are about who has to know what.**

_Role names, not value names._ The _Proposed design_ fixes that a component reads a name describing a
role — `--ui-color-accent`, not `--ui-color-blue-600`. A speed is a value: **`--ui-motion-fast` is
`--ui-color-blue-600` for time.** Adopting speed names for motion while forbidding them for colour
would make the two categories inconsistent.

_Reverse engineering._ Under speed names, a host who thinks _dialogs feel abrupt_ must first discover
which step the dialog uses — by reading the component's CSS — and then override that step, which
also moves everything else sharing it. Under purpose names the mapping is the name. This is the
correctly stated version of the void argument: not per-component granularity, but whether the host
can find the knob without reading the source.

**The layered version was rejected here and the rejection did not survive.** It was turned down for
importing the **primitive-plus-alias** shape item 1 rejected for colour — speeds as grounds,
purposes as derived names, reusing the item 1 and item 7 machinery, since a formula may be a plain
reference rather than a mix.

What broke that argument is a distinction between the categories, and it is now written into the
_Proposed design_ as a property: **a colour value carries identity, a duration value carries only
relation.** `#111827` rather than `#111826` can be a fact about a trademark; nobody chooses 149ms
over 150ms. A duration means something only against the other durations, so the object being named
is a **scale**, and a scale is exactly what a ground layer is for.

**And the document had already agreed, in a place this entry was not reading.** Item 6 classifies
_the steps of a duration or type scale_ as rule-bound — decided here, in writing. Under
purpose-names-only there is no scale for that rule to govern: item 6 legislates over an object item
9 never creates. Nothing prevents `enter: 150ms`, `exit: 140ms`, `state: 155ms`, three numbers
differing for no reason, and no rule can say so.

**Easing stays single-layer, and the reason is arithmetic rather than principle.** A curve is not
identity-bearing either — no brand owns a `cubic-bezier` — but neither is it a scale: curves are
qualitative, and the handful in play maps one to one onto the handful of purposes. A ground layer
whose members correspond exactly to the semantic names above them is indirection with no consumer.

**Purpose naming survives all of this intact**, and both arguments for it still stand: a component
reads a role, and a host finds the knob without reading the source. What changed is what sits
underneath the role, not the role.

**The sub-question that rode along — one token holding `150ms ease-out`, or two names — resolves to
two, and an earlier draft of this entry overstated why.** It claimed the split was _forced_ by item
3, on the grounds that a collapse over `--ui-duration-*` has no referent unless durations are their
own names. That is wrong: item 3 needs a **set of names** to collapse and says nothing about what
those names hold. `--ui-duration-enter: 0ms ease-out` is valid, transitions correctly, and collapses
correctly — while quietly killing the separation and leaving `--ui-easing-enter` contradicted or
dead.

So the split is a convention, like the rest of the naming scheme, and it is chosen for the reason
that stands on its own: a host changing a speed should not have to restate a curve. **What makes it
more than a convention is that it can be gated, and cheaply** — see the Rollout, where the browser
does the validating.

**The set of purposes and the number of steps in the scale are item 4's**, and their values are item
6's — taste for the steps themselves, rule-bound for the relation between them.

### Open

Two. **The work order is 4, then 8** — and 8 is answerable at any point, since nothing in it waits on
the other.

#### Item 4 — Which categories enter now

Elevation, layering and a type scale are needed by queued components and by neither that exists.
Adding a token is cheap and adding it _later_ is what `src/tokens.ts` already warns about; adding one
nothing uses is a decision made without a case. Border colour has left this item — the count puts it
under item 1, as a derivation rather than a declaration. Whether success and warning arrive now or
with `ui-toast` arrived here from item 1.

**This item inherits a criterion and a count.** The criterion is the identity-bearing versus
scale-bearing split in the _Proposed design_: every category this item admits is scale-bearing —
elevation, layering, type size — so each arrives as a scale with semantic names over it, not as
loose values, and the question _how many tokens_ becomes _how many steps_. The count is item 9's:
**the number of steps in the duration scale, and the set of purposes above it**, which that item
settled the shape of and deliberately left the size of here.

**And it carries a semver consequence it does not look like it has.** Item 7 kept `Token` from
widening, but only for the derived names; every ground token this item admits still widens it, and
the study established that widening breaks a consumer who writes `Record<Token, string>`
exhaustively. So `--ui-color-success` and `--ui-color-warning`, and any elevation or layering token
that lands beside them, are that breaking change. Whether it is worth a note in the release or more
than a note is part of what this item decides.

#### Item 8 — Which of RFC 0001 and this one is built first

Promoted from a Rollout note, where it read as a scheduling detail and is not one: 0001 is `Accepted`
with a six-step rollout nobody has started, and the two constrain each other in both directions.
0001's theme toolbar needs a second theme to switch; the values this proposal defers need somewhere
to be judged. A note cannot decide that, so it is an item.

---

**No issue tracks this proposal yet**, and no roadmap entry exists for it. Both follow acceptance
rather than preceding it.

## Rollout

Conditional on the Decision, and only the parts already known are written down.

- **A token added is a type widened.** Any pull request that adds one is at least a `feat`, and the
  release notes say which names appeared, because a consumer mapping `Token` exhaustively finds out
  at compile time.
- **A second theme is a second contrast obligation.** Its stories render it, so `expectAccessible`
  reaches it; a theme without a story is outside the bar this repository advertises.
- **Reduced motion gets a test, not a comment**, and it asserts two things rather than one. That the
  collapse happens — the suite's browser can emulate the preference, measured above — and that what
  it collapses to is **not zero**, because a zero-length transition fires no `transitionend` and the
  components that would hang on it are four of the twelve queued.
- **Eight checked invariants replace three, and three of them are the important ones.**
  `tokenStyleSheet()` contains no derived name — placement A as a gate rather than a comment (item
  7). `darkScheme` holds only `--ui-color-*` names, because `light-dark()` takes colours and a dark
  value for `--ui-radius` would emit invalid CSS (item 5). And **the browser validates every value
  against the property its token serves**, below. The rest: every formula references only names in
  `tokens`, which catches a typo like `var(--ui-color-surfase)` that today falls silently through to
  nothing; no name in both arrays; no dark value equal to its light one; and the sheet declaring the
  scheme axis.
- **The browser is the validator, and one table buys two invariants.** The suite runs in a real
  browser, so `CSS.supports(property, value)` is available and is the same idiom as the existing
  _parses as CSS the browser actually applies_. A prefix table in the test maps each token category
  to the property it serves — `--ui-color-` to `color`, `--ui-duration-` to `transition-duration`,
  `--ui-easing-` to `transition-timing-function`, `--ui-radius` to `border-radius`, `--ui-space` to
  `padding`, `--ui-font` to `font-family` — and every default, dark value and formula is checked
  against it. Measured: `transition-duration` refuses `0ms ease-out` and `ease-out`,
  `transition-timing-function` refuses `150ms`, `color` refuses `0.375rem` and the typo
  `rebeccapurpel`, while `light-dark(…)` and `color-mix(…)` both pass.

  **The second invariant is the lookup failing.** A name matching no prefix fails the test, so a new
  token cannot invent a category nobody declared — the naming scheme becomes checked rather than
  described. And both replace the weakest assertion the layer has: that a default is a **non-blank
  string**, which was the most that could be said before there was anything else to say.

- **The boundary-contrast floor gets an assertion, because axe has no rule for it.** 1.4.11 is
  inside the ruleset `tests/a11y.ts` declares and outside what any axe rule covers, so 3:1 on a
  component's boundary is enforced by a hand-written check beside it or not at all. It arrives with
  the first token whose value it governs, not before — a gate with nothing behind it is the one kind
  this repository refuses. This is item 6's mechanism and it belongs here rather than in the
  Decision, because it is true whichever way that item had gone.
- **The order against RFC 0001 is decided in item 8, not here.** It sat in this section as a note
  until taking inventory showed a note was the wrong shape for it.

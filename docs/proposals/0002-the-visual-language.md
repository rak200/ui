# RFC 0002 — The visual language: token structure, motion and themes

- **Status**: Implemented
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

**Item 8 inverted the second half of that paragraph and left the first half standing.** The urgency is
real and 0001 is still what creates it — but 0001 turned out not to be waiting: its toolbar is a bonus
that appears in none of its six steps, while this proposal has a written obligation that only its
stories discharge. So 0001 is built first, and the deadline this section names is a deadline for
_starting_ rather than for _finishing first_.

### What is already settled

**Tokens are the single source of truth for the visual language**, from RFC 0016 — and not only for
CSS. They are what keeps a native shell reachable, which is why they exist from day one rather than
being extracted once something needs them.

**Every visual decision is a token**, from ARCHITECTURE.md. Components read `var(--ui-*, fallback)`.

**The playground is Storybook**, from RFC 0001, with stories rendered by the existing suite. That
matters here for a reason beyond the switcher: whatever this proposal decides gets rendered, and
anything rendered by the suite is inside the accessibility bar.

**A component that accepts interaction and shows no feedback is defective** — from the owner, and a
premise rather than a finding. This library is meant to be rich in effects and transitions, so
`:hover` and `:focus` are not an enhancement a component may skip; their absence is a bug report, not
a backlog entry. The criterion narrows this proposal without pre-deciding it: it says _that_
interaction states exist, never which values they take. Read against the tree it already names one
defect — `button.ts` has a focus ring and no hover — and it binds the nine interactive components
still queued.

**The pairing is load-bearing, and it is the accessible one.** A component that reacts to the mouse
and not to the keyboard is the classic way an effect becomes an exclusion, so the criterion names
both states or neither.

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

**Read this section against the later one that measured it.** _Adding one is breaking too_ was written
from the declaration rather than from a compiler, and it sat here pricing every later question about
how many tokens to declare. It is true of exactly three consumer patterns out of eight, all of them
the same act — enumerated further down, and answered by item 11. The sentence is left standing because
the order in which it was believed is part of why item 4 was hard.

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
`var(--ui-duration-…)` and never learns why it changed. **This is the argument for motion being
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
which is a value name; naming by purpose (`--ui-duration-enter`) would be a decision name, and the two
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

### What widening the token union actually breaks — measured

_Adding a token breaks `Record<Token, string>`_ was stated early and left there, which priced every
later question about how many tokens to declare. Measured properly: a two-token package, a consumer
exercising eight ways of touching the surface, and one name appended.

```
Record<Token, string> exhaustive          BREAKS   TS2741, property missing
{…} satisfies Record<Token, string>       BREAKS   TS1360
switch + const never: never = t           BREAKS   TS2322, not assignable to never
Partial<Record<Token, string>>            fine
(t: Token) => …                           fine
tokens.map(…)                             fine
a literal assigned to Token               fine
{ [K in Token]?: string }                 fine
```

**Three of eight, and the three are one thing.** Every breaking pattern is the consumer asserting it
enumerates the whole set; nothing that merely _uses_ a token notices. At runtime nothing notices at
all — a custom property that no rule reads has no effect, and the new token arrives with a default.

**The consequence is about the caret, not the compiler.** Under `bump-minor-pre-major` a break cuts a
minor, and `^0.3.0` refuses `0.4.0`. Treating every added token as a break means twelve components'
worth of minors, each one severing automatic updates for every host — to protect a claim of
completeness over a set that visibly is not complete. That is what item 11 answers.

### What `:active` actually matches — measured

The interaction states the criterion above requires were assumed to behave the obvious way. Four of
them do not. Chromium via Playwright, read back from `getComputedStyle` rather than
`Element.matches` — the first run used `matches` and answered for the selector engine rather than for
the rule that applies.

```
mousedown on a button        the button, its ancestor <div> and <body> all match
mousedown inside a shadow    the inner <button> matches AND :host(:active) matches
Space held                   matches
Enter held                   NEVER matches
button is disabled           STILL matches
dragged off, still held      STILL matches; the click never fires
```

**`:active` is a chain, and it crosses the shadow boundary**, so a component can style either the
inner control or `:host(:active)`. One cascade note that cost a re-measurement: a `ui-button:active`
rule in the host document beats the shadow tree's `:host(:active)`, which is `:host` being
deliberately weak rather than a bug.

**Enter produces no `:active` at all**, and that follows from the platform: Space activates on
release, so there is an interval; Enter activates on keydown, so there is none. A pressed state can
therefore never be the only evidence a button responded — which is the same conclusion the
hover/focus pairing reaches from the other side.

**A disabled button matches `:active`.** An unguarded `button:active { … }` would make a disabled
control react to a click it does not perform, and ordering will not save it because
`button:disabled` in `button.ts` sets `opacity` and `cursor` — different properties, no collision.
The rule has to be written `button:not(:disabled):active`.

**Not measured**: Firefox, Safari, and iOS touch, where `:active` has a long-standing dependency on a
touch listener existing and `-webkit-tap-highlight-color` paints over the component's own answer. A
library that intends to be rich in effects owes that a measurement before the first one ships, not
after.

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
  layer while item 9 gives duration two, on a property of the domain rather than a preference. **How
  a scale's steps are named is item 10**, and it applies to every category in the second kind.

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

**And every _name_ below is the end state, not the first release** — a distinction item 4 introduced
after this section was written, and one a reader would otherwise get backwards. What follows shows the
shape item 1 produces once the queue has been built: eleven ground names and ten derived. What
actually lands in the first pull request is item 4's slice, which is narrower on both sides —
`--ui-color-success` and `--ui-color-warning` wait for `ui-toast`, and of the ten derived only the
interaction colours have a consumer. The structure is what this section decides; the schedule is item
4's, and the two are read together.

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

_The split costs no widening of its own._ Ten derived names are ten names `Token` never sees, and
`defaults` stays exhaustive over the ground half. The two new hues do widen it — the split does not
pretend otherwise — and item 11 prices that at three of eight consumer patterns and calls it a `feat`.
An earlier draft of this line claimed the widening _never happens_, which was reading the derived half
and forgetting the two names declared ten lines above it.

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

**Fully resolved: eleven items, none open** — and accepted on 2026-08-13, after a review pass whose
corrections are recorded in place rather than smoothed. Five of them were the same kind of defect: a
sentence written before a later item landed and left standing as though it still held. They are marked
where they sit, because a document that silently agrees with itself teaches a reader nothing about
which parts were hard.

The two halves below are **kept apart rather than interleaved**, and the empty one is kept too. Item
5 appears among the settled having been closed, reopened by item 2 and closed again; item 3 arrived
carrying two halves of which only one was settled, and shed the other as item 9; item 4 shed a
premise it had been carrying as a consequence, which became item 11. The round trips are left
visible, because an item that reopens or splits says something about the order the items were taken
in. A settled item is read once and referred to; an open one is read to be worked on. Numbers are
stable across every split, so a later reference to _item 5_ still means what it meant.

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

#### Item 4 — Which categories enter now

**A category enters with the pull request of the component that consumes it, and a component that
ships without its interaction states is a defect rather than a gap.** Today that admits exactly one
new category — motion — and one purpose inside it.

**The item had three questions, and the third was hiding under the other two.** _Which categories_
and _which motion purposes_ were both being answered against an unpriced cost: if adding a token
later is expensive, declaring the queue's tokens now is prudence; if it is cheap, the same act is a
guess published as a promise. Measuring the widening settled that, and the answer moved to item 11.
With additions cheap, **batching has no motive left**, and the two questions collapse into one
trigger.

**Four triggers were considered, and the losing arguments matter more than the winning one.**

_Everything the queue foresees_ — motion, elevation, layering, a type scale, success and warning, all
at once — loses on the shape of its failure. Values chosen with no component to judge them against
get corrected when the component arrives, and correcting a published default moves the rendering of
every host that did not override it, with no error anywhere. It trades a loud break for a silent one,
which is the exact inversion the Layer 1 non-negotiables exist to prevent — every rule in that list
is there because a failure was silent. What pre-population produces is also already measured in this
Study: a peer with 390 tokens, 213 of them varying and 115 of them aliases.

_Strictly what a component consumes today_ loses on item 3, which is **already resolved**. Nothing in
the tree animates, so a reduced-motion collapse would have nothing to collapse and no test; the
mechanism would arrive with the first component that animates, which is the retrofit this proposal
exists to prevent.

_What a written issue already names_ was the most checkable of the four, and it was checked: #18 says
_surface, radius, spacing and elevation from tokens_, #21 says _motion respects
`prefers-reduced-motion`_, and layering and a type scale are named in no issue at all — they were a
forecast, not a fact. It still loses, because #18's sentence describes an intended discipline rather
than specifying a value, and a card's elevation cannot be judged without a card. The checkability it
offered survives in the winner: _the PR of the consuming component_ needs no forecast either.

**So the criterion is the defect clause, and the premise in _What is already settled_ is what makes
it a rule rather than an exception for one component.** An interactive component without `:hover` and
`:focus` is defective, so those states are a present consumer, not an anticipated one. Elevation
arrives with `ui-card` (#18), layering and positioning with the first overlay, a type scale with
`ui-table` (#19), success and warning with `ui-toast` (#21) — each judged against something.

**Every category admitted this way is scale-bearing**, which is the _Proposed design_'s split read
forward: elevation, layering and type size each arrive as a scale with semantic names over it rather
than as loose values, so item 10 governs all of them without a second debate. Border colour never
reaches this list — the role count put it under item 1, as a derivation rather than a declaration.

**This resolution looks like the thing the Motivation feared, and the difference is the whole point.**
That section says a token set becomes _a pile_ when components invent tokens on the spot, one
component at a time — and one component at a time is exactly the schedule chosen here. What separates
them is not the timing but whether the naming is legislated: a token that arrives with `ui-card` under
item 9's role naming, item 10's ordinals, and the Rollout's prefix table cannot be invented on the
spot, because a name matching no declared category **fails the suite**. The pile was never caused by
lateness. It was caused by each component naming things its own way, and that is what is closed here —
by a checked scheme rather than by pre-populating a set nobody has looked at.

**The motion purposes follow from the same criterion applied honestly.** Item 9 made duration
two-layer and easing single-layer; the only purpose with a consumer today is a property changing on
an element that stays. `enter` and `exit` wait for the four overlays. Three names, and **items 7 and 9
together put them in two different arrays** — which a first draft of this entry got wrong by listing
all three as ground:

```ts
// tokens — a literal default, emitted at :root. Nine becomes eleven.
'--ui-duration-100',   // the step — item 10
'--ui-easing-state',   // easing has no ground layer, so its purpose name IS the ground — item 9

// derivedTokens — a formula, never emitted at :root. Its formula is a plain reference.
'--ui-duration-state', // → var(--ui-duration-100)
```

The asymmetry is not an oversight in either item: a duration purpose points into a scale, so it is
derived by construction, while an easing purpose has nothing to point at. Item 3 already assumed this
reading — it collapses _every `--ui-duration-*` name, ground and derived alike_, which is only a
sentence worth writing if some of them are derived.

Choosing `state` alone prejudges nothing: `enter` wants an ease-out, `exit` an ease-in, and `state`
something symmetric because it reverses mid-flight. Three independent decisions, and item 10's gaps
let the scale grow underneath them.

**The hover and active colours are not in `tokens` either, and that is item 1 working.** They are
mixed from `--ui-color-accent`, so by item 7 they join `--ui-duration-state` in the second array and
widen nothing. Which names exactly is the implementing pull request's, derived under item 1's rule —
the role count already says _accent hover / pressed_ is one role, so a pressed name comes with the
hover one. The colour half of the defect costs no widening at all.

**Two things this item deliberately does not decide.** The value of the step is item 6's _taste_
class, and that rule already names who decides it. And the asymmetry a press wants — the measurement
above puts a click near 100ms, so an entering transition of 150ms finishes after the click is over —
is `transition-duration: 0s` on the `:active` rule, a structural decision in the component rather
than a second token. The focus ring is likely a third case: delaying the affordance is the opposite
of what it exists to do.

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

plus a dark value never equal to its light one, and the sheet declaring the scheme axis.

**Two numbers here were counted before two later items landed, and the Rollout carries the current
ones.** This entry said _three invariants become seven_; item 9's prefix table made the category
lookup an invariant of its own, so the Rollout enumerates **eight**. And the line count asserted here
as `tokens.length + 3` counts one `:root` block, while item 3 adds a
`@media (prefers-reduced-motion: reduce)` rule to the same output — so the count and the
`cssRules.length === 1` beside it are both restated by that item. The mechanism this entry decided is
unaffected; only its arithmetic was superseded, and the Rollout is where the current form lives.

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

#### Item 8 — Which of RFC 0001 and this one is built first

**RFC 0001 first, and what this proposal is actually waiting on is its step 4, not its step 6.**

**Promoted from a Rollout note, where it read as a scheduling detail and is not one:** 0001 is
`Accepted` with a six-step rollout nobody has started, and the two constrain each other in both
directions. A note cannot decide that.

**The deadlock came from treating the two arrows as the same kind of thing, and they never were.**
0001's dependency on this proposal is a **bonus**: the theme toolbar appears among the advantages
that won its tie-break and in **none of its six steps**, so with one theme it is born empty, all six
steps complete and the site publishes. This proposal's dependency on 0001 is a **gate**: the Rollout
below discharges a second theme's contrast obligation through _its stories_ — _a theme without a
story is outside the bar this repository advertises_ — and the premise in _What is already settled_
sends every taste value to an instrument only 0001 builds. One direction postpones a bonus; the other
leaves a written obligation with no mechanism.

**The unmeasured risk is entirely in 0001, and this proposal already bets on it.** Step 4 is the only
place in either document that its own author marks as _resting on a hypothesis rather than a
measurement_ — portable stories under browser mode. The Rollout below was written assuming that
hypothesis holds. Collapsing it before it is load-bearing costs a step; collapsing it afterwards
costs this section.

**Built second, this proposal is validated; built second, 0001 would only gain content.** With the
playground standing, the dark scheme, the second theme, the motion collapse and the button's new
states are all visible and all inside `expectAccessible` through composed stories, with the a11y
addon over each. That is validation of precisely what this proposal produces. The reverse order buys
0001 nothing but more to show.

**Two arguments were considered and dropped.** 0001's step 1 is upstream, which looked like latency
worth overlapping — but that rollout answers it directly: _nothing else waits on it_, since what it
prevents are two defects rather than a blocked build. And the Motivation here says _a theme switcher
over one theme switches nothing_, which reads as an argument for going first; it is an argument about
the toolbar's completeness, not about 0001's delivery, and the toolbar gains its second entry
additively.

**The rework in the losing direction is real and is named rather than smoothed.** With 0001 first,
`stories/tokens.ts` is born over one array and gains the second, the formulas and the dark scheme;
`stories/button.ts` gains hover and active cases. That is _writing_ stories. The reverse order makes
the second theme's contrast obligation a standalone test that is later duplicated or moved, which is
_undoing_ one. Both are small; only one is undoing.

**The generalisation, since the numbering will outlive the two proposals it decided:** when two
accepted proposals constrain each other, build the one whose dependency on the other is a bonus
rather than a gate.

#### Item 9 — How motion is named

**Resolved: by purpose, with duration and easing as separate names — and duration carrying a ground
scale underneath its purposes, which easing does not.**

```css
/* ground: the scale. Steps, not facts. Named by item 10. */
--ui-duration-100   --ui-duration-200

/* derived: what a component reads. A formula that is a plain reference. */
--ui-duration-enter: var(--ui-duration-200);
--ui-easing-enter    --ui-easing-exit    --ui-easing-state
```

_An earlier draft of this entry wrote the scale as `fast / moderate / slow`. Item 10 replaced those
names, for a reason that has nothing to do with motion and everything to do with what happens the
first time a step is needed between two of them._

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
role — `--ui-color-accent`, not `--ui-color-blue-600`. A speed is a value: **`--ui-duration-fast` is
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

**The set of purposes is item 4's**, how the steps are named is item 10's, and the values are item
6's — taste for the steps themselves, rule-bound for the relation between them.

#### Item 10 — How the steps of a scale are named

**Resolved: ordinal names with gaps — `--ui-duration-100`, `-200`, leaving room for `-150` and
`-250` — for every scale-bearing category, with one standing exception below.**

The question that produced this item: with `fast / moderate / slow`, **what happens when a component
needs something between `moderate` and `slow`?** It is not hypothetical; it is what a growing
component set does.

**The framing that decided it:** a naming scheme that turns a **foreseeable** change into a breaking
one is a bad scheme, and this change was foreseen before a line of it was written. Four schemes,
judged on what insertion costs in each:

| Scheme                                     | Inserting a step between two others                                           |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| Adjectives — `fast / moderate / slow`      | rename the neighbours (**breaking**), or a name that does not read as ordered |
| Adjectives with reserved room — `x-fast …` | postpones it, does not solve it, and pre-populates                            |
| **Ordinals with gaps — `100 / 200`**       | **additive** — `150` is a new token                                           |
| Base and multiplier — `calc(base * 2)`     | free, no token at all                                                         |

The first two are eliminated by the framing: renaming a token is breaking, per the study, and the
second only moves the day it happens.

**Base-and-multiplier is elegant, has precedent in this tree, and loses on the domain.** Spacing is
genuinely multiplicative, which is why `calc(var(--ui-space) * 2)` in `button.ts` is right and
**stays** — this item does not condemn it. Duration is not: the peer's measured scale runs 50, 150,
250, 500, 1000, with ratios of 3, 1.67, 2, 2. Expressing that as a base times a multiplier puts
`* 1.67` in a formula, or forces the scale to be geometric when good motion scales are not. **The
rule is per category, and the test is whether the steps are genuinely proportional.**

**The readability cost of ordinals is smaller here than elsewhere, because of item 9.** Components
never read the ground — they read `--ui-duration-enter`. A number appears in exactly two places, the
`formulas` record and the table in `docs/tokens.md`. Adjectives would be most legible precisely where
nobody looks.

**Two consequences.** It governs **every** scale-bearing category, so elevation, type size and
layering inherit it without a second debate — which is the criterion item 4 already carries. And it
**disarms the question of how many steps to start with**: with insertion additive, two steps commit
nothing. That question stops being structural and becomes what item 6 calls rule-bound — the rule is
_ordinals with gaps_, and the concrete steps appear as their consumers do.

#### Item 11 — What a widened token union costs a consumer

**Split out of item 4, because it turned out to precede it.** As long as the price of adding a token
was unknown, _which categories enter now_ could not be argued on its merits — every option was really
an argument about how much a later addition would hurt. It sat inside item 4 as a consequence and was
in fact a premise.

**The token set is declared open, and adding to it is a `feat`.** `docs/tokens.md` and the docblock on
`tokens` say so in those words: the set grows as components arrive, and asserting completeness over it
asserts something this package does not promise. The supported shape is the partial map — which is
what a theme is anyway, and what item 5's `darkScheme` already is.

**Measured before deciding, and the measurement is narrower than the claim it replaced.** Three of
eight consumer patterns break, and all three are the same act: enumerating the whole set. Reading a
token, taking one as a parameter, iterating the array and mapping optionally all survive, and nothing
survives or breaks at runtime because a custom property nobody reads does nothing.

**The deciding argument is the caret, not the compiler.** `^0.3.0` refuses `0.4.0`, and
`bump-minor-pre-major` makes every break a minor. Calling each added token a break would mean twelve
components' worth of minors, every one of them severing automatic updates for every host — a real,
recurring cost imposed on everyone, to defend a claim of completeness against a set whose own
documentation says it is not complete.

**What was rejected: opening the type itself.** `Token | (string & {})` removes the break by
accepting any string, and takes the typo with it — `read('--ui-color-surfase')` would compile. The
openness is a documented promise about the set, never a widening of the type; the type stays exact so
it keeps catching what it exists to catch.

**Item 7 is not reopened by this.** It kept derived names out of `Token` for a semantic reason — a
derivation is not a declaration — and that reason is untouched by the cost of widening being small.

### Open

**None.** Item 8 was the last, and closing it left the split with one side — kept anyway, because the
preamble reads against it and a reader arriving at an earlier version should find the same shape.

---

**Both of this proposal's bookkeeping obligations were discharged**: it was tracked by issue #47 and
carried by `ROADMAP.md`. Each followed acceptance rather than preceding it, which is why an earlier
version of this line said neither existed.

**Built in [#77](https://github.com/rak200/ui/pull/77)**, which closed #47 and pruned the
`ROADMAP.md` entry that carried it — so the sentence above is now history rather than a description.
What that pull request implemented is the structure: the two arrays, the formulas, the generated
sheet, the reduced-motion collapse, the eight invariants, and the first category admitted under item
4 — motion, with the interaction colours, arriving with the `ui-button` defect they answer. What it
deliberately did **not** implement is the rest of item 4's schedule: elevation still waits for
`ui-card` (#18), a type scale for `ui-table` (#19), `success` and `warning` for `ui-toast` (#21).
That is the resolution working rather than an unfinished rollout, and the rule that governs it now
lives in `ARCHITECTURE.md`, where a consumer reads it.

**The Rollout step that was outstanding here is discharged, and half of it closed unmeasured**: the
interaction states are measured in three engines and agree, and the one reading that needed hardware
— a real finger on real iOS — was never taken, because no iPhone was available to anyone who could
have held one. #80 closed on that rather than staying open indefinitely. The bullet below carries
both halves, and the second is written as an open question with a known remedy rather than as a
result.

## Rollout

Conditional on the Decision, and only the parts already known are written down.

- **A token added is a type widened, and by item 11 that is a `feat` and not a break.** Any pull
  request that adds one still names the appearing tokens in its release notes, because the three
  consumer patterns that do break find out at compile time and deserve to read why. The openness is
  written where a consumer looks — `docs/tokens.md` and the docblock on `tokens` — or it is not a
  promise, only a habit.
- **A component ships with its interaction states or it does not ship.** The criterion in _What is
  already settled_ is a review rule, not an aspiration: `:hover` and `:focus` together, both or
  neither, for every component that accepts interaction. The nine still queued inherit it, and
  `ui-button` is the first to pay it off.
- **`:active` is guarded against `:disabled`, measured and not assumed.** A disabled button matches
  `:active`, so the rule is written `button:not(:disabled):active` and ordering does not substitute
  for it. The same measurement says Enter produces no `:active` at all, which is why the pressed
  state is never the only feedback a component gives.
- **A second theme is a second contrast obligation.** Its stories render it, so `expectAccessible`
  reaches it; a theme without a story is outside the bar this repository advertises.
- **The interaction states are measured outside Chromium before the first one ships.** The Study
  measured `:active` in one engine and says which four results were counterintuitive; Firefox, Safari
  and iOS touch are unmeasured, and iOS is the one that matters, where `:active` has a long-standing
  dependency on a touch listener existing and `-webkit-tap-highlight-color` paints over whatever the
  component decided. The suite runs one engine and therefore cannot warn about this — the same caveat
  already recorded for the browser-support measurement. So it is a step, not a test: a pressed state
  invisible on a phone is half the value of a library that intends to be rich in effects.

  **Measured after 0.2.5, and it found something the colours did not.** Chromium, Firefox and
  WebKit — the last inside the official Playwright image, since WebKit needs libraries a current
  Debian does not carry — agree on every derived colour to the fifth decimal of `oklab()`, on the
  transition, on the focus ring at `#b45309` with `:focus-visible` matching, and on the
  `:not(:disabled)` guard holding. Under an iPhone viewport too. `tests/manual/interaction-states.mjs`
  is the step, kept because the nine queued components inherit this obligation.

  What it found is that **`-webkit-tap-highlight-color` was nobody's**: 40% black in WebKit, the
  Android blue in Chromium under a phone viewport, painted over the pressed colour on every tap.
  Owned in `src/button.ts`, and only correct because the pressed state exists — until it did, that
  wash was the only answer a touch got.

  _A caution the run itself taught:_ the first WebKit pass read a hover partway through the 150ms
  transition and looked like a cross-engine discrepancy. It was the settle time, not the engine.

  **Closed unmeasured — #80.** Whether `:active` fires from a real finger on real iOS. Playwright's
  touchscreen taps instantaneously and cannot hold; an emulated context is not a device. The reading
  was never taken: no iPhone was available, and an obligation nobody present can discharge is a line
  in a file rather than a safeguard. So it is closed as unmeasured — which is a different claim from
  closed as satisfied, and the distinction is the reason this paragraph exists.

  What is known points one way without settling it. Under emulated touch, WebKit matched `:active`
  on a pointer press with no touch listener anywhere on the page; and the element the question is
  about is a native `<button>` carrying `cursor: pointer`, which is the shape WebKit is documented to
  treat as clickable — the condition the quirk turns on. Partial evidence, not a confirmation.

  **What being wrong costs is bounded, and the remedy is one line.** If a tap on real iOS answers
  with nothing, iOS is gating `:active` on a touch listener existing, and a no-op listener on the
  component restores it — still decided against, now for want of evidence rather than for want of a
  need. Ten seconds on a phone settles it, the procedure is in
  `tests/manual/interaction-states.mjs`'s own header, and a finding reopens this with somewhere to
  start.

- **The new exports are documented, because a gate already requires it and a bigger reason does too.**
  CI extracts every exported symbol from `src/` and greps `docs/` for it, so `darkScheme`,
  `derivedTokens`, `DerivedToken` and `formulas` each need a home — item 7 used that gate as an
  argument for exporting them and it applies to the consequence as well. Beyond the gate,
  `docs/tokens.md` today is a table of nine names, and after this proposal it has to say three things
  it cannot currently say: that the set is open (item 11), which names are derived and therefore
  **write-only** — overridable, never readable, which is the one cost of item 1 a consumer can be
  surprised by — and what each formula computes.
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
- **None of this starts before RFC 0001's step 4.** Item 8 decided the order and the boundary: the
  structural work here — the two arrays, the formulas, the generated sheet, the eight invariants —
  waits only on the step that proves composed stories render, never on the two that publish the
  site. The second theme's contrast obligation and the taste values wait for the site itself.
  The item sat in this section as a note until taking inventory showed a note was the wrong shape
  for it.

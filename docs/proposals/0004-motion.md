# RFC 0004 — Motion: who owns a component's, and what a catalogue would cost

- **Scope**: library
- **Created**: 2026-09-05

## Motivation

**The intention is a catalogue, per component and per event.** Each component offers a set of
effects for each event it answers — a press, the pointer arriving and leaving, focus arriving and
leaving, an entrance and an exit — and **the consumer picks which effect each event uses, and
where**: for the page, for a region of it, for every instance of one component, or for one instance,
each choice apart from the others. Some of the effects follow the pointer. Stated that way it is not
yet a proposal, because it assumes an answer to the question underneath it — **whose decision is a
component's motion?**

Today it is the package's. Each component makes exactly one motion decision, writes it into its
`static styles`, and records beside it what was deliberately left out. What a host retunes is the
duration and the curve, and RFC 0002 item 9 already established that per-component retuning costs
nothing new: custom properties inherit, so `ui-tooltip { --ui-duration-enter: 300ms }` moves tooltips
and nothing else.

A catalogue moves the ownership, and the intention says how far: **which effect runs becomes the
consumer's, and what each effect is stays the package's.** That may well be right — a library that
intends to be rich in effects cannot hold every effect as a single blessed choice. But **some of
what would move is not taste**, and that is the part this proposal exists to separate.

Five modules carry the same sentence about what is _not_ in a transition list:

> Only the colour moves. The focus ring is deliberately not in this list: delaying the affordance
> that says _this is where you are_ is the opposite of what it exists to do.

And `src/button.ts` records that the pressed colour transitions in `0s`, because a press is over in
about 100ms and a 150ms transition would land after the finger has left. Neither is a preference.
Both are findings, one about accessibility and one about perception, and a menu of alternatives hands
them back to a host who has not read the measurement that produced them.

**The pointer-driven half is a different proposal wearing the same coat.** Everything the package
moves today is a CSS transition on a declarative state. An effect that follows the cursor has no CSS
primitive at all: it needs JavaScript writing a custom property from `pointermove`, throttled to a
frame — per-frame main-thread work in a package that chose a thin runtime on purpose. And it escapes
the one mechanism that protects the reader, which the Study measures below.

## Study

### What RFC 0002 settled, and what this proposal may not reopen

- **Item 9 — motion is named by purpose, not by speed.** `--ui-duration-fast` is
  `--ui-color-blue-600` for time: a speed is a value and a purpose is a role, and the package
  forbids value names for colour. A catalogue that ships `bounce`, `fade` and `slide` should know
  which of those it is before it ships them.
- **Item 9 also settled granularity, and it is free.** Custom properties inherit, so a host already
  reaches one component's motion through a selector without any new axis.
- **Item 3 — reduced motion is honoured once, not per component.** `tokenStyleSheet()` collapses
  every duration to `0.01ms`, and the reason it is not zero is that a zero-length transition fires
  no `transitionstart` and no `transitionend`, so a component that awaits the end of one waits
  forever — and only for the people who asked for less movement.
- **Item 10 — the scale is numbered, so a step between two others is additive.** The room for more
  steps was designed in and deliberately left empty.

### What the tree carries today

|                                                               |                                                                                                                   |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `transition:` declarations                                    | 15, across 8 modules                                                                                              |
| properties actually moved                                     | 20: `background-color` ×7, `border-color` ×7, `opacity` ×3, `background-position` ×1, `rotate` ×1, `translate` ×1 |
| `@keyframes`                                                  | **0**                                                                                                             |
| `animation:`                                                  | **0**                                                                                                             |
| `pointermove`, `mousemove`, `requestAnimationFrame` in `src/` | **0**                                                                                                             |
| `@starting-style`                                             | 3, in `dialog` and `toast`                                                                                        |
| duration steps in the scale                                   | **1** — `--ui-duration-100`                                                                                       |
| duration purposes                                             | **1** — `--ui-duration-state`                                                                                     |
| easing purposes                                               | 3 — `--ui-easing-state`, `--ui-easing-enter`, `--ui-easing-exit`                                                  |

Two readings of that table matter.

**The package has no animation, only transition.** Six properties move, all of them on a
declarative state change. Nothing is keyframed and nothing runs on a clock.

**The motion category shipped a scale with one step, and three curves against one duration.** An
entrance and an exit each have their own easing and both borrow `--ui-duration-state`, because no
component has yet needed them to differ. That asymmetry is item 4 working — a name arrives when
something consumes it — and it is also the measure of how much of this category is still unbuilt.

### The mechanism that protects the reader, and the shape of the hole

Reduced motion is enforced by a filter over token _names_:

```js
[...tokens, ...derivedTokens].filter((token) => token.startsWith('--ui-duration-'));
```

Everything that collapses, collapses because it reads a duration token. **Anything that moves
without reading one escapes the mechanism entirely, silently, and only for the reader who asked for
less movement.** Nothing in the tree does today. A pointer-driven effect would be the first, because
its motion comes from a coordinate rather than from a duration.

This is a shape the codebase has already met once, from the other side: `src/toast.ts` records that
the dwell is deliberately **not** a token, precisely because the collapse would then take the notice
away from the reader who asked for less movement. There, the answer was to keep a value out of the
category. Here the value is not the problem — the movement is outside the category altogether.

So a catalogue that includes anything non-declarative forces a decision: either every effect must be
expressible in terms of a duration token, or reduced motion becomes a second obligation carried per
component — which is exactly what item 3 refused, and refused for a stated reason.

**WCAG 2.3.3, Animation from Interactions**, is the external half of the same point: motion animation
triggered by interaction must be disableable unless it is essential. A highlight that follows the
cursor is not essential.

### The question underneath, and the three shapes it has

**Whose decision is a component's motion?** Three answers, and this proposal exists to pick one
rather than to assume it.

- **A — the package keeps owning it, and the host gets more tokens.** More easing purposes, more
  duration steps, more of a scale that was designed with room and shipped with one step. Consistent
  with everything already decided, no new axis, no runtime. **Its cost is that it delivers no
  variety in the sense the Motivation asks for**: a host can make the existing motion slower or
  softer, never different.
- **B — a named motion set, selected the way a theme is.** `data-ui-motion` beside `data-ui-theme`,
  shipping N presets. This reuses item 2's machinery whole. **RFC 0003 has answered the question
  that could have closed it**: its question 2 was whether a theme may bring a token category when no
  component asks, and the answer is yes, when the category's default is the identity. A set is
  coarser than the intention, though: it chooses every event at once, where the Motivation chooses
  each apart.
- **C — the package ships hooks and no catalogue.** `::part()`, documented custom properties, named
  `@keyframes` a host may target. Thinnest runtime, largest documentation burden, and it moves the
  accessibility findings above from _decided_ to _documented_ — which is a real downgrade unless the
  documentation is unusually good.
- **D — the package offers a catalogue per component and event, and the consumer picks from it at
  any scope.** The Motivation's intention, made precise. It splits the decision rather than moving
  it: what an effect is stays the package's, so a finding written into one stays decided, and which
  one runs is the consumer's. The choice is a custom property, so it reaches every scope the way
  item 9's granularity already does, with no attribute and no new axis — and a named set falls out
  of it as a block of choices under one selector, which is what a theme already is. What it asks of
  the platform is that a component branch on a value it inherits, which S5 to S8 measure.

None of the four is obviously right, which is the argument for deciding once here rather than four
times in four issues.

### What a catalogue costs the gate, measured

This is not an estimate. On the pull request that added `<ui-menu>`, **two of the nineteen surviving
mutants were a single line**:

```ts
transition: rotate ${reference('--ui-duration-state')} ${reference('--ui-easing-state')};
```

The test read `rotate` back and never read the transition, so both token references could be
replaced with an empty string and nothing failed. Killing them meant retuning both tokens and
reading three computed properties — `transitionProperty`, `transitionDuration`,
`transitionTimingFunction` — at a moment chosen so the value being read was not a frame somewhere
along the animation.

**One declaration, two mutants, three assertions, and a timing constraint on when they can be
read.** The mutation floor is 100% and is never lowered, so a catalogue multiplies that by the number
of effects, by the number of components that offer them, by the reduced-motion axis. That number
belongs in the proposal before the catalogue is designed, not after.

### The visual reference, and why this file does not link it

The reference animations live in a repository that is **private**, and public documentation here
neither links nor names one. The effects are therefore described by what they do. Anything this
proposal needs to _rest_ on gets reproduced here, in the open, or it does not count. The same
constraint applies to [RFC 0003](0003-themes.md), and for the same reason.

**[The prototypes](0004-motion/README.md) are that reproduction**: one page per component,
rendering the real component with the catalogue shape D would give it — the moments it answers, the
effects it offers for each, the choice made at each of the four scopes and the CSS that choice is,
and the effects the reference has that the catalogue leaves out, each with its reason.

### Simulation plan

Hypotheses, each unrun until it is run.

- **S1 — can `prefers-reduced-motion` be emulated in the suite?** _Claim_: it can, by the same
  instrument `tests/tokens.test.ts` already uses for `prefers-color-scheme`. _Why it comes first_:
  every shape below is unbuildable if the collapse cannot be asserted per effect. Shares its answer
  with RFC 0003's S4.

  > **Answered by [RFC 0003](0003-themes.md)'s S4: it already is.** `tests/tokens.test.ts` emulates
  > `prefers-reduced-motion: reduce` through CDP and asserts that the browser collapses a
  > component-facing duration, and that the collapsed transition still fires its end event; that
  > every duration token, ground and derived, sits inside the collapse is asserted on the rule
  > itself. What stays open is _per effect_, which is S2's question. The premise carried the same
  > error RFC 0003's did: that file does not emulate `prefers-color-scheme` at all — the scheme is
  > written as `color-scheme` on the element — and what it emulates through CDP is this very feature.

- **S2 — what does a keyframed animation do under the collapse?** _Claim_: `animation-duration`
  reads no `--ui-duration-*` unless it is written to, so a `@keyframes` effect survives reduced
  motion untouched. _Steps_: declare one, collapse the tokens, read it back. _Expected_: it keeps
  running, which would make "every effect reads a duration token" a rule rather than a habit.

  > **Measured in Chromium 153, Firefox 155 and WebKit 26.6: it holds.** Under emulated reduced
  > motion, keyframes whose duration reads `--ui-duration-state` run for 0.01ms, and the same
  > keyframes at a literal `10s` keep all 10,000ms, in the three. So _every effect reads a duration
  > token_ has to be a rule of the catalogue rather than a habit — and one a test can check effect
  > by effect, since the collapse is a value the suite already reads.
  > `tests/manual/motion-selection.mjs` is the step, for this and for S5 to S8.

- **S3 — what does pointer tracking actually cost?** _Claim_: a `pointermove` handler writing two
  custom properties, throttled to `requestAnimationFrame`, is measurable against an idle baseline.
  _Steps_: one component, one effect, main-thread time over a fixed pointer path. _Expected_:
  unknown, and that is the point — a number decides this, not an opinion.

  > **Measured in Chromium 153, headless: it is.** Six hundred moves across one card lit by a
  > gradient at `--x` and `--y` cost 300 to 850ms more main-thread time with the handler than the
  > same path idle, over six rounds — 0.5 to 1.4ms a move, of which 0.1 to 0.2ms is script and 0.2
  > to 0.3ms style recalculation. Layout never moved; the rest is paint, which a headless engine
  > does in software, so that share is an upper bound. The cost is per frame while the pointer is
  > over the one element that follows it, not per instance on the page. **And the effect reads no
  > duration token, so the collapse never reaches it**: it would have to look for the collapse
  > itself, in script. `tests/manual/pointer-cost.mjs` is the step.

- **S4 — do the existing interaction states hold outside Chromium?** RFC 0002 measured `:active` in
  one engine and left Firefox, Safari and iOS touch unmeasured; #80 closed on that rather than
  staying open. **Any catalogue inherits that gap and multiplies it**, so the gap is this proposal's
  to reckon with rather than to re-file.

  > **Answered by [RFC 0002](0002-the-visual-language.md)'s Rollout, and the premise was already out
  > of date.** `tests/manual/interaction-states.mjs` measured the button in Chromium, Firefox and
  > WebKit, and under an iPhone viewport, a week before this was written: the three agree on every
  > derived colour, on the transition, on the focus ring and on the disabled guard. What stays
  > unmeasured is a real finger on real iOS, closed as such in #80 — and a press effect inherits
  > exactly that, since it hangs on `:active` firing there.

- **S5 — can a component run an effect the consumer named?** _Claim_: a custom property set outside
  a shadow root names the `@keyframes` an element inside it runs, through `animation-name: var(…)`.
  _Steps_: keyframes declared in the shadow root, only in the document, and nowhere; the name set on
  the instance.

  > **Measured in the three engines: it can, from the component's own shadow root.** Keyframes
  > declared there run when named from outside, in all three, and a name nothing declares runs
  > nothing and throws nothing. **Keyframes declared only in the document are where the engines
  > part**: WebKit finds them from inside the shadow root, Chromium and Firefox do not. So an effect
  > a component offers is declared in that component's shadow root, the one place all three agree
  > on.

- **S6 — can a component branch on a choice made at any scope?** _Claim_: `@container style()`
  inside a shadow root reads the custom property its host inherits, so one choice reaches the page,
  a region, a component type and an instance, the narrower winning. Container style queries are
  Baseline since Firefox 151, after Chrome 111 and Safari 18, per web-features 3.40.1; `if()`, which
  would branch inside one declaration, is in Chromium alone.

  > **Measured in the three engines: it does, at all four scopes.** The page's choice reaches an
  > instance with no other, a region's overrides the page's, and so does a rule on one component's
  > type or a choice on the instance itself. `none`, or a name the component does not offer, matches
  > no query and leaves the default — so the default is what renders until someone chooses, and a
  > misspelt choice costs the effect and nothing else.

- **S7 — does a press effect run on every press?** _Claim_: an animation applied under `:active`
  starts again each time the state is entered.

  > **Measured in the three engines: it starts every time, and it is cut short.** A 60ms press runs
  > it, and releasing removes it at once, well before its 300ms are up — `:active` ends, and the
  > animation with it; the next press starts it again. Most of what a press effect is outlasts the
  > press, so it cannot hang on `:active` alone: a transition runs back on release rather than
  > stopping, and anything that has to finish needs a trigger that outlives the state.

- **S8 — can an effect drawn on the host see a choice made on the host?** _Claim_: no. A container
  query asks an ancestor, never the element itself, so a rule on `:host` reads the choice of
  whatever is around the component, while the elements inside its shadow root, and the host's own
  pseudo-elements, read the host's. _Steps_: one element choosing an effect on itself inside a page
  that chose another; read its `:host`, its `::before` and an element in its shadow root.

  > **Measured in the three engines: it cannot.** The `:host` took the page's choice and ignored
  > its own, while the `::before` and the element inside took the element's. So an effect that
  > moves a whole component is out of reach of the two narrowest scopes wherever the component's
  > surface is its host — the card and the toast today. Drawing the surface inside the shadow root,
  > or the effect on a pseudo-element, brings them back; the prototypes mark every effect this
  > limits.

## Proposed design

**Not written** — it waits on the Study choosing between A, B, C and D. What is already fixed is
what any answer has to hold:

- Motion is named by purpose, per item 9. A catalogue does not get to ship speed names.
- Every effect the package ships collapses under `prefers-reduced-motion`, through one mechanism
  rather than one per component.
- No effect the package offers can remove a focus affordance or delay one, whatever a host selects.
- A host's own motion stays as reachable as it is now — one selector, one custom property.

## Decision

**Not reached.**

## Rollout

**Not written**, and for the reason [RFC 0003](0003-themes.md) gives: a Rollout describes what an
accepted design needs, and there is no accepted design.

Two dependencies are already visible.

**[RFC 0003](0003-themes.md) has answered.** Its question 2 — may a theme bring a token category
when the theme, not a component, is the consumer — was decided yes, when the category's default is
the identity. So B is open, and under D a choice is a value a theme can carry like any other.

**[#120](https://github.com/rak200/ui/issues/120) did half of what this needs.** It put a scheme
control in the playground; there is still no way to see a story under reduced motion there, and a
motion catalogue cannot be reviewed without one: the second state of every effect is the one that is
easiest to ship broken, because nobody sees it by accident.

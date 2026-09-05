# RFC 0004 — Motion: who owns a component's, and what a catalogue would cost

- **Status**: Draft
- **Scope**: library
- **Created**: 2026-09-05

## Motivation

**The intention is a catalogue**: a variety of transitions and animations offered per component, for
click, hover, focus and blur, and some that follow the pointer. Stated that way it is not yet a
proposal, because it assumes an answer to the question underneath it — **whose decision is a
component's motion?**

Today it is the package's. Each component makes exactly one motion decision, writes it into its
`static styles`, and records beside it what was deliberately left out. What a host retunes is the
duration and the curve, and RFC 0002 item 9 already established that per-component retuning costs
nothing new: custom properties inherit, so `ui-tooltip { --ui-duration-enter: 300ms }` moves tooltips
and nothing else.

A catalogue moves the ownership. That may well be right — a library that intends to be rich in
effects cannot hold every effect as a single blessed choice. But **some of what would move is not
taste**, and that is the part this proposal exists to separate.

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

|                                                               |                                                                                         |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `transition:` declarations                                    | 13, across 8 modules                                                                    |
| properties actually moved                                     | 15: `background-color` ×7, `border-color` ×3, `opacity` ×3, `rotate` ×1, `translate` ×1 |
| `@keyframes`                                                  | **0**                                                                                   |
| `animation:`                                                  | **0**                                                                                   |
| `pointermove`, `mousemove`, `requestAnimationFrame` in `src/` | **0**                                                                                   |
| `@starting-style`                                             | 2, in `dialog` and `toast`                                                              |
| duration steps in the scale                                   | **1** — `--ui-duration-100`                                                             |
| duration purposes                                             | **1** — `--ui-duration-state`                                                           |
| easing purposes                                               | 3 — `--ui-easing-state`, `--ui-easing-enter`, `--ui-easing-exit`                        |

Two readings of that table matter.

**The package has no animation, only transition.** Five properties move, all of them on a
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
  shipping N presets. This reuses item 2's machinery whole, and it is why **RFC 0003 has to answer
  first**: its question 2 is whether a theme may bring a token category when no component asks, and
  a motion set is the same question in a second costume. If that answer is no, shape B is closed
  before it is written.
- **C — the package ships hooks and no catalogue.** `::part()`, documented custom properties, named
  `@keyframes` a host may target. Thinnest runtime, largest documentation burden, and it moves the
  accessibility findings above from _decided_ to _documented_ — which is a real downgrade unless the
  documentation is unusually good.

None of the three is obviously right, which is the argument for deciding once here rather than four
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

### Simulation plan

Hypotheses, each unrun until it is run.

- **S1 — can `prefers-reduced-motion` be emulated in the suite?** _Claim_: it can, by the same
  instrument `tests/tokens.test.ts` already uses for `prefers-color-scheme`. _Why it comes first_:
  every shape below is unbuildable if the collapse cannot be asserted per effect. Shares its answer
  with RFC 0003's S4.
- **S2 — what does a keyframed animation do under the collapse?** _Claim_: `animation-duration`
  reads no `--ui-duration-*` unless it is written to, so a `@keyframes` effect survives reduced
  motion untouched. _Steps_: declare one, collapse the tokens, read it back. _Expected_: it keeps
  running, which would make "every effect reads a duration token" a rule rather than a habit.
- **S3 — what does pointer tracking actually cost?** _Claim_: a `pointermove` handler writing two
  custom properties, throttled to `requestAnimationFrame`, is measurable against an idle baseline.
  _Steps_: one component, one effect, main-thread time over a fixed pointer path. _Expected_:
  unknown, and that is the point — a number decides this, not an opinion.
- **S4 — do the existing interaction states hold outside Chromium?** RFC 0002 measured `:active` in
  one engine and left Firefox, Safari and iOS touch unmeasured; #80 closed on that rather than
  staying open. **Any catalogue inherits that gap and multiplies it**, so the gap is this proposal's
  to reckon with rather than to re-file.

## Proposed design

**Not written.** The proposal is `Draft`, and shape A, B or C is what the Study has to choose
between. What is already fixed is what any answer has to hold:

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

**[RFC 0003](0003-themes.md) answers first.** Its question 2 — may a theme bring a token category
when the theme, not a component, is the consumer — decides shape B before this proposal can weigh
it. Answering it twice is how two proposals end up with two answers.

**[#120](https://github.com/rak200/ui/issues/120) is a prerequisite here more than it is there.** A
motion catalogue cannot be reviewed in a playground with no scheme control and no reduced-motion
emulation: the second state of every effect is the one that is easiest to ship broken, because
nobody sees it by accident.

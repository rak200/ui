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

### What the review of the prototypes has settled

The prototypes were reviewed page by page, each choice judged in Chromium, Firefox and WebKit, and
the review has been building shape D. What it settled is below, each point with what it rests on;
[the prototypes' README](0004-motion/README.md) carries every measurement in full, and each page
lists what its component leaves out and why. None of it is the Decision, which stays open below.

- **A choice is one custom property per moment, and its value is the effect's name.**
  `--ui-motion-<moment>`, inherited, so the page, a region, a component type and one instance choose
  apart and the narrowest wins, as S6 measured. Moments share names across components, and a name
  means one effect wherever it is offered.
- **A moment can come by kind**, a property per kind of change — `--ui-motion-hover-move`,
  `-shadow`, `-fill` and `-border` — because a style query compares the whole value: a list in one
  property matched no effect, in all three engines. Each kind draws on an element of its own, since
  an element has one animation list and two effects animating it leave one unplayed.
- **The pointer's and the focus's effects are one list**, the moments' and not a component's: each
  kind offers the same effects in the same order on every component that answers it, under one name
  for one effect, at the focus as under the pointer, and a component's panel marks the ones it does
  not draw yet and, with why, the ones it leaves out. At the focus, which comes with no pointer, the
  effects that are which way the pointer is — leaning, drawing toward, casting away — are left out,
  and the lights placed where the pointer is start from the middle, as the focus's ripple does.
  Before, each component kept a list of its own, and a field's `tint` under the pointer was the
  button's `highlight`.
- **Every component draws every border** of the list, under the pointer and at the focus, from one
  definition each, but the line along a drawn control's bottom edge, which is too small and too
  round to have one. A card and a toast answer a focus on something they hold, on layers of their
  own.
- **Every component draws every fill it can**, from one definition each. The preview, the card's and
  the toast's blur and the hover colour are left out where they cannot be drawn honestly: the hover
  colour, chosen against a control's label, took a field's placeholder and the card's muted text to
  3.28:1, and a toast's icon, which owes 3:1, to 2.70:1. The tint is the card's everywhere, 10% of
  the accent in the dark scheme where it had been 15%, which left a field's placeholder at 4.43:1 on
  Glass's dark page; and a field's and the card's lights are their tint rather than the text's
  colour, so the muted text and the placeholder hold 4.54:1 or more under every one.
- **Every component draws every shadow**, from one definition each, each where its component draws
  its shadows, but the cast at the focus, which is the pointer's direction, and the card's and the
  toast's own shadow under the pointer, which no theme gives a raised surface.
- **Every component moves as far as it can be moved**, from one definition each, at a give that is a
  share of the button's, so a wide component grows by what a button does: the lean and the tilt are
  left out at the focus, the flips and the breathe out of a card's content and a toast's message,
  and out of a field the flips and, where the reader types, the breathe. A card's entrance and its
  movements are two properties of its host's one list, since one written over the other played the
  entrance again, and so are a toast's, whose movements go on its transform, which no entrance
  starts from.
- **At the focus, the pointer's lights start from the middle**: the edge is lit as a pointer in the
  middle would light it, the spotlight is held there, and the flood spreads from there and drains
  back to it. Every effect of the list is now drawn on every component, or left out there with why.
- **The focus wins.** A component the reader can see the focus on, or a card or a toast it is in, is
  drawn as the focus chose, and the pointer resting on it changes nothing, what the component does
  there today included — the button's hover colour, a theme's edge and glow under the pointer, a
  field's and a drawn control's darker boundary — and its arrival fires nothing; a press is drawn
  over both. The button had drawn the pointer over the focus, and a field and a drawn control the
  focus over the pointer. An effect both moments chose holds from one to the other where it holds a
  state, drawn once, and plays again for the focus's arrival where it plays: the focus's keyframes
  have names of their own, since an element matches an animation by its name, and under the
  pointer's the focus's took the pointer's over and did not start.
- **A kind can qualify an effect instead**: an entrance or an exit takes a direction and a curve
  beside it, `--ui-motion-enter-direction` and `--ui-motion-enter-curve`.
- **What a component does today is one of its choices**, by name, and `none` is nothing. The focus
  ring is not a choice: every focus effect adds to it, which is what the Proposed design's third
  point asks of any shape.
- **A moment can be one element's**: a toast arrives and leaves, and the stack is its toaster's.
- **What a component ships is a sheet in its shadow root**, every effect under a style query on its
  moment (S5, S6) — and a `not` in that query takes parentheses of its own: without them Chromium
  and WebKit dropped the rule and Firefox read only its first half. Beside the sheet goes the script
  CSS cannot stand in for: a trigger for an effect that outlives its state (S7), a pointer engine
  for one that follows the pointer (S3), a focus and a press state on the host — no engine lets a
  host match `:focus-visible` for the control inside it, and under Space the control is `:active`
  and its host is not, in Chromium and WebKit — an arrival and a departure, the pieces and the
  grain, and per component what only it needs: the toast's stack, and the tooltip's typing and next
  tip.
- **S8 is marked rather than solved.** An effect drawn on the host misses a choice made on the host;
  every page badges such an effect, and a script that draws one reads its choice where the sheet
  does, so the two miss the same choices.
- **Every effect reads a duration token, and the catalogue needs more of them** (S2). One step and
  three curves cannot carry it, so the prototypes declare four steps on the reference's five-step
  scale and the dialog's between two of them, a move curve and an emphasis curve, collapsed under
  reduced motion with the rest: shape A arriving with D. A loop needs a period and a count, and the
  count has to collapse as well — with only the period at 0.01ms, an infinite loop runs on in all
  three engines. The loops one moment plays together end close to one another, a quicker loop
  playing more rounds: at four rounds each, an error's split and glitch ended at 960ms and its pulse
  and flash at 2080ms, in all three engines, and at eight the two end at 1920ms.
- **A theme brings a taste.** `--ui-taste-<moment>` for the page and
  `--ui-taste-<component>-<moment>` for one component, written on the root under `:where()` and read
  only where no choice is written, so any choice at any scope runs instead of every taste, in all
  three engines. The default theme's taste stands under every theme, as its tokens do, and a theme
  that names a moment for the page clears the default theme's taste for one component there. A theme
  names the pointer, the focus, a press and an error once, for the page — the pointer's and the
  focus's effects are one list wherever they are answered, a press is the button's alone and an
  error a form's controls' — and a component's own taste is left for a moment of its own: a check, a
  menu's panel and caret, a toast, a tooltip, an icon and a table's row. That is RFC 0003's answer,
  that a theme may bring a category whose default is the identity, spent on motion — B falling out
  of D as a block of choices under one selector.
- **An effect never rewrites the text it animates.** A toast's message is in the live region it is
  announced through, and a tooltip hands its trigger its sentence again whenever the tip's text
  changes. The tooltip's typing hides what is not typed yet with a highlight drawn in no colour
  instead, through the highlight API, whose rules have to be in the tree the text is in: written in
  the tooltip's shadow root, Firefox drew none of them on a slotted tip.
- **An exit that has to play in every engine is held by its component.** A popover's exit holds it
  on the page by transitioning `display` and `overlay`, and only Chromium holds it: Firefox takes it
  away at once while it reports `transition-behavior: allow-discrete` as supported, and WebKit,
  which holds a plain element that way, takes a popover away at once. So the tooltip's and the
  menu's exits play in Chromium only; the dialog and the toast hold theirs themselves.
- **An effect that colours text, or the ground under it, keeps the text's 4.5:1.** The accent alone,
  as a field's label, was 4.31:1 on Matrix's light page and on Glass's dark one, and the danger laid
  over a field as a flash took its text to 3.14:1, so the label mixes in a fifth of the text's
  colour and the flash, on a field and a drawn control alike, a fifth of the danger into the surface
  — measured. The menu leaves dimming the other items out for the same floor.
- **An effect of one name looks the same on every component**, adjusted only for the size of what it
  lights: the glow and the halo are one definition, and the pulse and the neon one shape in a drawn
  control's size and a button's, which a field and a card take. The pulse is the ring that leaves a
  boundary wherever one does, in the colour of what it answers — the accent under the pointer, at a
  press and on a change, the ring's own at the focus, the danger in error — and the focus's beacon
  was that ring under a second name: from 80ms on the two reached within a pixel of each other —
  measured. A table's row has no room round it for one, and the icon's follows its strokes. The
  shimmer and the scan are the button's wherever they are offered, a wide sheen swept across a
  little off upright and a thin band crossing down, no thicker than a rem however tall what it
  crosses is, where a field's and a drawn control's scan had crossed from the start to the end, two
  fifths of their width. Across an icon's strokes they are drawn in the accent moved off the
  strokes' colour: in the accent at half its strength, as over a surface, they left Matrix's dark
  strokes, which are the accent, as they were — measured. The orbit is the card's wherever it is
  offered, a light on the boundary that never runs past it, run from the accent's hue round the
  wheel, so that some of it stands apart from any fill it crosses, and so is the trace, the boundary
  drawn round once on the orbit's band, which over a fill is the accent moved off the fill — a step
  from the page left it 1.04:1 from Matrix's dark primary; the comet is the button's, clear of the
  boundary and over the focus ring, in the orbit's colours: in the accent, which the ring takes, its
  tail was the ring's own colour. And no band runs in the gap a focus ring keeps from its control,
  where the band, the ring and the boundary read as one line: the trace is wider than the boundary,
  so it grows into the component rather than out of it. The edge is the card's wherever it is
  offered too, the band lit where the pointer is nearest, its light fading over the component's own
  width and height rather than over one size set for each, which had left a button's far side lit.
  Every band moves with what it rings, as the effects a moment fires already did: left at the host's
  size, a band stood inside a button the zoom had grown past it.
- **An overlay placed by its size moves, uncovers, blurs and fades, and never scales or turns.** The
  tooltip reads its tip's box, transform and all, as it shows: started at 0.9 of its size, a tip was
  placed 11px off its trigger's middle, and edge-on, 26px over it, in all three engines. The menu
  leaves zoom out for the same reason. And an entrance comes from the trigger's side only where the
  side is written before the overlay's first style: the menu now places its panel before it is
  shown, by the size it had when it was last open, and the tooltip places its tip after, so a tip
  comes from the side it was last placed on.
- **A menu's trigger answers as a button does, and only the trigger.** It is a secondary button, so
  it takes the button's effects, and a theme's taste for them as every button does. Its host holds
  the panel and the items too, whose press, pointer and focus are not the trigger's, and in Firefox
  the host's own `:hover` and `:active` take the panel in: drawn off them, the trigger's raise and
  trace held over the panel, and an item's press put its border out. So the page names the control
  the moments are answered on and keeps a record of the pointer on it, which a component would keep
  as a state of its own. And the menu now hangs its panel from where the trigger rests, its host's
  box: hung from the trigger as drawn, a panel opened under a movement came to rest anywhere from
  1.6px over the trigger to 7px clear of it — measured.
- **A select's list can be drawn by the page, in two engines of three.** Under
  `appearance: base-select` an engine hands the list to the page: Chromium and WebKit do, and
  Firefox has the base appearance behind a preference that is off. Drawn, the list is the menu's
  panel — its surface, its items, its entrances, its exits and its caret, under the menu's tastes —
  while the control stays the component's box, within a pixel, and the keyboard and the typeahead
  stay the platform's, in Chromium and WebKit — measured. The platform places the list and writes
  nowhere which side it took, so what comes from the trigger's side comes from above. The component
  took it up in #303, under a pointer that hovers and is fine, so its surface and the mark on the
  choice already made are no longer this proposal's, and its entrances, exits and caret still are.

**The tastes the review chose**, which run wherever nothing is chosen, read off each page's choices
under each theme; `today` marks what a component does today. A theme names the pointer, the focus, a
press and an error once, for the page. _Every_ is the button, the menu's trigger, the card, the
toast, the input, the textarea, the select, the checkbox, the switch and the radio, which answer the
pointer and the focus, the card and the toast a focus on something they hold; _form_ is the input,
the textarea, the select, the checkbox, the switch and the radio, which answer an error; and a press
is answered by the button and the menu's trigger. A component that leaves an effect out does what it
does today there: the hover colour is the button's today, and the card, the toast and the fields
leave it out. The select's `enter`, `exit` and `caret` are its list's, where the component draws it.

| Component | Moment            | Default          | Matrix      | Glass       |
| --------- | ----------------- | ---------------- | ----------- | ----------- |
| every     | `hover-move`      | none, today      | zoom        | tilt        |
| every     | `hover-fill`      | highlight        | tint        | spotlight   |
| every     | `hover-shadow`    | raise            | glow        | cast        |
| every     | `hover-border`    | pulse            | trace       | edge        |
| every     | `focus-move`      | lift             | glitch      | none, today |
| every     | `focus-fill`      | none, today      | scan        | shimmer     |
| every     | `focus-shadow`    | raise            | burst       | neon        |
| every     | `focus-border`    | pulse            | comet       | orbit       |
| every     | `focus-label`     | accent           | glow        | none, today |
| button    | `press-move`      | squish           | shatter     | spring      |
| button    | `press-fill`      | highlight, today | none        | ripple      |
| button    | `press-shadow`    | sink             | fragments   | sink        |
| button    | `press-border`    | bloom            | bloom       | pulse       |
| form      | `invalid-border`  | pulse            | split       | glow        |
| form      | `invalid-fill`    | flash            | none, today | flash       |
| form      | `invalid-message` | none, today      | none, today | none, today |
| card      | `enter`           | fade             | materialize | dissolve    |
| card      | `exit`            | fade             | erode       | dissolve    |
| checkbox  | `check`           | draw             | draw        | draw        |
| switch    | `check`           | spring           | spring      | spring      |
| radio     | `check`           | pop              | pop         | pop         |
| dialog    | `enter`           | fade, today      | materialize | dissolve    |
| dialog    | `exit`            | fade, today      | erode       | dissolve    |
| dialog    | `backdrop`        | fade, today      | char-rain   | blur        |
| toast     | `enter`           | slide-elastic    | wind        | refocus     |
| toast     | `exit`            | slide            | wind        | defocus     |
| toast     | `dwell`           | ring             | ring        | ring        |
| toaster   | `stack`           | spring           | spring      | spring      |
| table     | `hover`           | highlight        | highlight   | frost       |
| table     | `enter`           | glow             | glow        | glow        |
| icon      | `enter`           | draw             | pop         | refocus     |
| icon      | `hover`           | glow             | glitch      | pop         |
| tooltip   | `enter`           | rise             | typing      | refocus     |
| tooltip   | `exit`            | sink             | glitch      | defocus     |
| tooltip   | `next`            | glide            | glide       | glide       |
| menu      | `enter`           | cascade          | glitch      | refocus     |
| menu      | `exit`            | fold             | glitch      | defocus     |
| menu      | `caret`           | flip             | flip        | flip        |
| select    | `enter`           | cascade          | glitch      | refocus     |
| select    | `exit`            | fold             | glitch      | defocus     |
| select    | `caret`           | flip             | flip        | flip        |

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

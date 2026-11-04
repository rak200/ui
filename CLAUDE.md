# CLAUDE.md

Guidance for Claude Code when working in this repository.

@.rak200/CONVENTIONS.md
@node_modules/@rak200/coding-standard-ts/CONVENTIONS.md

> If `.rak200/` is empty, the clone skipped its submodule:
> `git submodule update --init --recursive`. If the second import is missing, run
> `npm ci` — TypeScript development needs it anyway.

## What this repository is

**@rak200/ui** is a library of host-agnostic custom elements: components that work in any page and
any framework, or none. It is the ecosystem's first non-PHP artifact and its first npm package.
RFC 0016 decided the shape — a thin runtime, how behaviour is acquired, design tokens as the
single source of truth for the visual language. What each of those became, and what was reversed
along the way, is [ARCHITECTURE.md](ARCHITECTURE.md), which is the consumer-facing half.

## Architecture

```
src/
├── tokens.ts        # the tokens: the two arrays, their values, and the emitted stylesheet
├── reference.ts     # how a component writes a token — internal, and the only importer of Lit here
├── button.ts        # <ui-button>
├── card.ts          # <ui-card> — a surface, three regions, and the elevation category
├── check.ts         # the check's mark — internal, the tick and the dot played on a reader's change
├── checkbox.ts      # <ui-checkbox> and <ui-switch> — the drawing the platform has no element for
├── description.ts   # the sentence a tooltip hands over — internal, shared by every control that takes one
├── dialog.ts        # <ui-dialog> — a modal, and the scroll lock the platform leaves out
├── effects.ts       # the effects a component draws — internal, one sheet for each kind: a button's, a field's
├── held.ts          # a focus a surface holds — internal, the mark a card's sheet draws its focus from
├── icon.ts          # <ui-icon> — the wrapper, and the registry a plain page writes into
├── icons/           # 2048 generated glyph modules, plus all.ts and the ISC notice
├── input.ts         # <ui-input> and <ui-textarea> — the control, its label and its message
├── menu.ts          # <ui-menu> — a menu button, and both ends of one ARIA relationship
├── motion.ts        # which effect runs: the names that are not tokens, and the query — internal
├── next.ts          # the next tip — internal, a tip glided over from the one closed just before
├── passage.ts       # a surface's passage in script — internal, its pieces and its grain, one filter
├── placement.ts     # where an overlay lands — internal, shared by the tooltip and the menu
├── pointer.ts       # the pointer engine — internal, where the pointer is for the lights that follow it
├── radio.ts         # <ui-radio-group> and <ui-radio> — the drawing, over a group the platform runs
├── rain.ts          # the scrim's rain — internal, falling code drawn on a canvas in the accent
├── ring.ts          # the focus ring the page flies — internal, the one popover laid in the page
├── ripple.ts        # the press's ripple — internal, a circle the sheet draws and a press starts
├── shatter.ts       # the press's shatter — internal, a filter over the button it breaks
├── stack.ts         # the toaster's stack — internal, how its toasts spring into their place
├── select.ts        # <ui-select>, <ui-option>, <ui-optgroup> — the box, the caret, and choices
│                   #   the platform could not take slotted
├── table.ts        # <ui-table> — a surface around your table, in the tree your table is in
├── theme.ts         # the shipped themes, as data, and the function that renders one
├── toast.ts         # <ui-toaster> and <ui-toast> — two live regions, and a clock that is not a token
├── tooltip.ts       # <ui-tooltip> — a popover the platform lifts, placed by hand
├── typing.ts        # the tip's typing — internal, its text typed out through highlights
└── index.ts         # the public barrel
tests/               # mirrors src/, one test file per unit
├── tokens.test.ts
├── reference.test.ts
├── button.test.ts
├── card.test.ts
├── check.test.ts
├── checkbox.test.ts
├── description.test.ts
├── dialog.test.ts
├── effects.test.ts
├── held.test.ts
├── icon.test.ts
├── input.test.ts
├── menu.test.ts
├── motion.test.ts
├── next.test.ts
├── passage.test.ts
├── placement.test.ts
├── pointer.test.ts
├── radio.test.ts
├── rain.test.ts
├── ring.test.ts
├── ripple.test.ts
├── shatter.test.ts
├── stack.test.ts
├── select.test.ts
├── table.test.ts
├── theme.test.ts
├── toast.test.ts
├── tooltip.test.ts
├── typing.test.ts
├── a11y.ts          # the axe assertion the component suite is built on
├── a11y-ruleset.ts  # the axe ruleset, free of the test runner so a second reader can have it
├── contrast.ts      # the WCAG ratio, for the floor axe has no rule for
├── stories.ts       # mounts a composed story, which is what puts the playground behind the gate
├── manual/          # steps a person runs, collected by nothing — see each file's own header
└── a11y.test.ts
stories/             # mirrors src/ too — what the playground shows
├── button.stories.ts
├── card.stories.ts
├── checkbox.stories.ts
├── dialog.stories.ts
├── icon.stories.ts
├── input.stories.ts
├── menu.stories.ts
├── radio.stories.ts
├── select.stories.ts
├── table.stories.ts
├── theme.stories.ts
├── toast.stories.ts
├── tooltip.stories.ts
└── tokens.stories.ts
.storybook/          # main.ts (the build), preview.ts (the sheet, its three controls), manager.ts (the stamp)
docs/                # one page per unit, indexed by docs/README.md
```

`tests/` mirrors `src/`, one test file per unit — the Layer 2 layout, and what `/tests/
export-ignore` in the seeded `.gitattributes` has always been written for. The two `a11y` modules,
`contrast.ts` and `stories.ts` are the exception the mirror does not cover: they are the suite's own
scaffolding rather than units, so none has a counterpart in `src/`.

**`tests/manual/` is a second kind of exception**, and it is not the suite at all: it holds scripts
rather than units — the steps a person runs, collected by nothing and gating nothing. It sits here
because `/tests/` is already `export-ignore`d, so a development script does not ride along in a
consumer's `git archive`, and the alternative was editing a seed the conformance check compares byte
for byte — `.gitattributes` is `form: exact` in `scaffold/seeds.tsv`, so it cannot grow a line for a
new path. `eslint.config.js` ignores it and says why.

**`tests/tooling/` was the other half of that exception and is gone**: the `mutation` verb's binding
moved into `@rak200/coding-standard-ts`, which now ships `rak200-mutate`.

Each component lives in one file and registers itself with `customElements.define` at import — so
a host imports the package and writes the tag.

**The playground runs outside the eight verbs**, the way `build` already does: `npm run storybook`
opens it on port 6006, `npm run build-storybook` writes the static site. Neither is a verb and CI
asserts neither — what the pipeline runs against the stories is `test`, which composes each one and
mounts it, so a story that stops compiling or stops rendering reds `ci / gate`.

**`@rak200/ui` resolves to `src/index.ts` in three places**, because three tools resolve module
names themselves: `.storybook/main.ts` for the bundler, `tsconfig.json`'s `paths` for the compiler,
`vitest.config.js` for the suite. Adding a fourth reader means a fourth mapping; leaving one out
means that tool silently loading `dist/` instead.

## Where the rules are

In the two imports above, in [ARCHITECTURE.md](ARCHITECTURE.md), and in each file beside the line it
explains. This file restates none of them.

- **Delegate to the platform**, **every visual decision is a token**, and **the accessibility bar** —
  [ARCHITECTURE.md](ARCHITECTURE.md), which is the consumer-facing half of RFC 0016.
- **How to write the accessibility assertion**, and how often —
  `expectAccessible('<ui-thing>…</ui-thing>')` from `tests/a11y.ts`, which carries the
  serious-and-critical bar and the per-state obligation with their reasons. **The ruleset is one
  file over**, in `tests/a11y-ruleset.ts`, which says why it was moved out.
- **Why `accessor` and decorators are off** — the comment beside both flags in `tsconfig.json`.
  Turning either on makes the suite unable to load the code that uses it.
- **Why a mutant on a module-level side effect cannot be killed** — the `Stryker disable next-line`
  comments in `src/button.ts` and `src/tooltip.ts`, each carrying its reason. Exclude at the
  narrowest node; never widen to the file.
- **Why a derived token's formula must never be declared at `:root`** — the docblock on `formulas`
  in `src/tokens.ts`, which shows the broken placement rather than only naming it, and the gate in
  `tests/tokens.test.ts` that makes it fail rather than be remembered.
- **Why a component never writes `var(--ui-*, …)` by hand** — `src/reference.ts`, which also says
  why the helper cannot live in `tokens.ts` and why a formula carries its grounds' own fallbacks.
- **Why no component here brings a state machine, and what would change that** —
  [ARCHITECTURE.md](ARCHITECTURE.md), _Behaviour is delegated_, which carries the whole of it.
  `src/dialog.ts` has only its own half beside the lines it explains: why `showModal()` and never
  the `open` attribute, and why the accessible name is a copied string rather than an IDREF.
- **Why a relationship needs one tree scope, and which of the two arrangements a component
  takes** — [ARCHITECTURE.md](ARCHITECTURE.md), _A relationship needs one tree scope_, which also
  records why the rule used to be stated as _light-DOM only_, what that read too broadly, and what
  it costs a **second** component reaching in from outside, which is what RFC 0006 answered by
  handing the text over. `src/checkbox.ts` is the arrangement every control moved to and
  `docs/checkbox.md` is the consumer-facing half; the docblock on `field` in `src/input.ts` says
  why those rules were once written with `::slotted()`.
- **Why a drawn control paints its own mark, and why the mark is a mask** — `src/checkbox.ts`,
  beside the mask constant. A `data:` URI would freeze the mark's colour in a package whose rule is
  that a host overrides every visual decision, which a mask avoids by carrying the shape and no
  colour: the mark is the accent's label, painted on the control's `::before` and cut to that shape.
  The target-size floor and the forced-colors block beside it are
  the other two things `appearance: none` made this component's to own — and **the mixed state's
  forced-colors override lives in `UiCheckbox`'s own sheet rather than the shared one**, because a
  later sheet at equal specificity wins; the comment there carries the measurement.
- **Why `ui-tooltip` and `ui-menu` place themselves instead of adopting CSS anchor positioning** —
  [ARCHITECTURE.md](ARCHITECTURE.md), _The platform owns what the platform is good at_, which gives
  both reasons and what retires the script: an engine without the rules puts a popover at `inset: 0`
  rather than near the trigger, and the CSS writes nowhere the side `data-side` reports. #300 holds
  the measurements and the dates, and the docblock on `UiTooltip` in `src/tooltip.ts` keeps the
  element's own half. `popover="manual"` and the Escape handler carry their reasons beside them, and
  `#complain()` carries the one a reader hits first: a reference written from out here reaches no
  control drawn inside a shadow root, which #156 measured and RFC 0006 answered — so what the
  warning is left pointing at is a trigger **someone else** wrote that does not take the handoff.
- **Which browsers the package supports, and how that moves** — [ARCHITECTURE.md](ARCHITECTURE.md),
  _The browser floor_, which says what sets it, what a feature newer than it has to do, and why a
  raise is an ordinary change. `tests/manual/browser-floor.mjs` recounts it from `src/`, and its
  `heard` and `carried` lists keep each reading's reasons beside the keys they excuse or add.
- **Why `ui-card` draws a boundary as well as a shadow, and claims no role** — the docblock on
  `UiCard` in `src/card.ts`, beside each. Only a shadow's colour can follow the scheme, and the
  default shadow writes one colour that all but vanishes on a dark page, so the derived boundary is
  what both schemes have; the missing role is the same rule `ui-button` states from the other
  side — there is no card element to delegate to, so what a card _means_ stays the host's.
- **Why `ui-radio-group` hand-rolls no roving tabindex** — the docblock on `UiRadioGroup` in
  `src/radio.ts`, and `tests/radio.test.ts`'s _the behaviour, which the platform already had_,
  which measures the APG pattern rather than citing it — in the arrangement the controls are
  actually in, a shadow root with no form owner, where a radio group is scoped by its tree. The
  internal `name` the rendered controls share rides on that and says so beside itself.
- **Why a choice is `<ui-radio>` rather than an `<input type="radio">` you wrote** — the docblock on
  `UiRadio` in `src/radio.ts`, and `docs/radio.md`. The `role="radiogroup"`, the name pointing at it
  and the controls it contains have to share one tree scope, and a control the host wrote cannot be
  rendered by the component. **`.checked` is a property binding and `?checked` would be wrong**: on
  a radio the content attribute is `defaultChecked`, so once anything has set the property the
  attribute stops driving the live state — measured, as a reset that left the control where the
  reader had put it.
- **Why `ui-select` writes the box out instead of sharing `ui-input`'s** — the docblock on
  `src/select.ts`, and `tests/select.test.ts`'s _the box, against the input it has to match_, which
  is the mechanism that answers `src/input.ts`'s objection to duplication on its own terms. The same
  file records why `appearance: none` is set at all. **Why the list is drawn under
  `appearance: base-select` in two engines of three, and only under a pointer that hovers and is
  fine** — [ARCHITECTURE.md](ARCHITECTURE.md), _The platform owns what the platform is good at_, and
  the comment beside the `@supports` block in `src/select.ts`; **why the choice already made has
  names of its own** is the comment beside `--ui-color-selected` in `src/tokens.ts`.
- **Why a choice is `<ui-option>` rather than `<option>`** — the docblock on `UiSelect` and on
  `UiDeclaration` in `src/select.ts`, and `docs/select.md`'s _Why the choices are not `<option>`_. A
  `<slot>` inside a `<select>` assigns the nodes and the select sees none of them, measured; and a
  mirrored `<option>` the host owns cannot report `option.selected = true`, because a property write
  is not something a `MutationObserver` reports. **The two halves of change detection are split on
  purpose**: `slotchange` reports structure and each declaration carries its own slot — the select's
  own sees nothing when a choice moves inside an `<ui-optgroup>` — while a property change is
  announced by the declaration itself, an event from `disconnectedCallback` having no path left to
  bubble along.
- **Why a form control renders its own label, and what that costs** —
  [ARCHITECTURE.md](ARCHITECTURE.md), _A relationship needs one tree scope_, and the docblock on
  each element. `src/input.ts`'s `attribute()` carries the rule an empty attribute breaks:
  `pattern=""` is the empty expression and matches only the empty string, so an optional attribute
  is omitted rather than written blank. The `updated()` loop beside it says why the control is
  iterated rather than asserted — a null branch there is a coverage hole and an immortal mutant at
  once, and there is exactly one control to iterate.
- **Why `ui-toaster` renders two live regions into its shadow root, when every other ARIA
  relationship here is light-DOM only** — the docblock on `UiToaster` in `src/toast.ts`, and
  [ARCHITECTURE.md](ARCHITECTURE.md), _Containment is the one relationship that does cross_. A
  reference is resolved in a tree scope and a region holds what is inside it, so a slotted toast
  really is in the region. The same docblock carries why neither region takes `role="alert"` —
  the implied `aria-atomic` re-reads the whole stack — and why the popover is shown once and never
  re-promoted. **The dwell is deliberately not a token**: `tokenStyleSheet()` collapses every
  `--ui-duration-*` under reduced motion, so a dwell that was one would take the notice away from
  the reader who asked for less movement; the constant in `src/toast.ts` says so beside itself.
- **Why `ui-menu` renders its own trigger, when every other component slots one** — the docblock
  on `UiMenu` in `src/menu.ts`, and `docs/menu.md`. Both ends of the `aria-controls` reference
  are rendered into one shadow root, so the IDREF resolves and a consumer has nothing to
  miswire; the items stay slotted, because containment crosses and a reference does not. The
  same docblock carries what `popover="auto"` gives — the layer, light dismissal, Escape — and
  the one thing it measurably does not: **the focus does not come back** across the shadow
  boundary, so `#give()` writes the return trip and only for the two ways out that leave the
  reader inside the menu. **Why the trigger answers the button's effects, and under the menu's
  taste name** — the comment beside its box in `src/menu.ts` and the docblock on
  `src/effects.ts`: it adopts `buttonEffects('menu')` after its own sheet, takes the `secondary`
  class and the band, and binds the four scripts as `ui-button` binds them. `tests/menu.test.ts`
  measures it against a secondary `ui-button` state by state, with every duration the sheet moves
  over taken out — and never a script's, whose time of nothing is the collapse's, under which
  nothing runs.
- **Why the placement is a module rather than a method** — `src/placement.ts`, which issue #23
  asked for in as many words. `ui-tooltip` wrote it first and `ui-menu` needed it pointing the
  other way; it takes boxes rather than elements for the reason `reservedGutter` in
  `src/dialog.ts` takes numbers, so the viewport edges are checked directly.
- **Why a tooltip's sentence crosses as text rather than as a reference, and where that text
  lives** — [ARCHITECTURE.md](ARCHITECTURE.md), _A relationship needs one tree scope_, and
  `src/description.ts`, the carrier every control that accepts the handoff shares. RFC 0006 decided
  the shape; the module says why the clip travels **inline on the node** rather than in a stylesheet
  each component has to remember to adopt — measured, as 363px of text nobody asked to see on the
  first host that consumed it without one. **The `aria-describedby` list is composed there too**,
  so _the handed sentence goes last_ is one decision rather than six components' to remember —
  `src/checkbox.ts` is what asked for it, having had the attribute and no composer at all, and
  `src/input.ts`, `src/select.ts` and `src/radio.ts` each carried a copy of that composition before
  the handoff gave them a second thing to compose; all three now call the one.
- **Why `src/icons/` is generated, excluded from mutation and excluded from coverage** —
  `tests/manual/vendor-icons.mjs` emits it from a pinned Lucide, and the two exclusions carry their
  reasons at `stryker.config.js` and `vitest.config.js`. **The mutation half is written in three
  places for one reason**: a pull request runs `--mutate` over the changed files and that argument
  replaces the config's list, so each generated module carries its own `// Stryker disable all`
  (emitted by the script), and the `mutation` verb passes `--drop-prefix src/icons/` to
  `rak200-mutate`, which drops the generated tree from the list before Stryker creates the mutants it
  would then ignore. **The coverage half is written in two**, and for the mirror-image reason: the
  floor checks the report against `src/` on disk, so the `coverage` verb passes it the same
  `--drop-prefix src/icons/` the `mutation` verb passes. `tsc` is what covers the generated half:
  `tsconfig.json` includes `src`, so all two thousand modules and the barrel are typechecked by
  `analyse`. **Never hand-edit a file under `src/icons/`** — re-run the script.
- **Why the build is two `tsc` passes, and why the order matters** — `tsconfig.icons.json` runs
  first and emits the glyphs without source maps; `tsconfig.build.json` runs second and re-emits
  everything else with them. Reversing it strips the maps from the whole package.
- **Why `@rak200/ui/icons/*` needs its own alias entry in three resolvers** — an alias matches by
  prefix, so a lone `@rak200/ui` entry rewrites `@rak200/ui/icons/x.js` into `src/index.ts/icons/x.js`.
  The specific entry comes first in `.storybook/main.ts`, `vitest.config.js` and `tsconfig.json`.
- **Why `ui-table` adopts a stylesheet into the host's tree instead of styling with
  `::slotted()`** — the docblock on `rules` in `src/table.ts`, and `docs/table.md`'s _Where the
  styles actually live_. `::slotted()` matches the top level of what a slot was given and nothing
  below it, and every part of a table worth styling is a descendant — so the rules go where the
  table is, found with `getRootNode()` rather than `document`, because a `<ui-table>` inside another
  component's shadow root would be bare otherwise. The tab stop beside it carries WCAG 2.1.1 and
  says why it is taken only while the table overflows, and what watching for that costs; **the box
  asks for no name**, because a focusable `generic` passes 4.1.2 and ARIA prohibits naming one.
  `docs/table.md`'s _The scroll, and when it takes a tab stop_ is the consumer-facing half.
- **Why the type scale arrived to fix something rather than to enable something** —
  [ARCHITECTURE.md](ARCHITECTURE.md), _A category arrives with the component that consumes it_, and
  the comment beside `--ui-text-100` in `src/tokens.ts`. Three hardcoded `font-size: 0.875em`
  declarations were already shipping across the form wrapper of the day and `src/tooltip.ts`, and
  waiting for the
  component that judged them is what made the extraction a correction. `--ui-color-surface-muted`
  arrived beside it and says at its formula why it is not `--ui-color-hover`.
- **Why the playground inserts the token sheet into each story rather than into the document
  head** — the docblock on `sheet()` in `.storybook/preview.ts`. `tests/stories.ts` composes those
  annotations, so a sheet appended to the head would outlive the story that carried it and re-tune
  every test that ran after; a rule reaches `:root` from wherever the `<style>` sits. The scheme
  control beside it is one `color-scheme` write and no class swap, which is RFC 0002 item 2 being
  spent rather than a mechanism of its own — and it is written on the root element because the
  preview's background is the canvas's, not the story's. **The reduced-motion control is the
  sheet's own collapse, written out**, since a page cannot set the media feature: the docblock on
  `reduced()` says why the rule is read out of the sheet rather than restated, and it goes into the
  story as the sheet does.
- **Which token categories exist, and when a new one may enter** — [ARCHITECTURE.md](ARCHITECTURE.md),
  _A category arrives with the component that consumes it_. A name in no declared category fails
  `tests/tokens.test.ts`, so the scheme is checked rather than described.
- **Which `--ui-` names are not tokens, and how a component asks for an effect** — the docblock on
  `src/motion.ts`, which keeps the three kinds RFC 0004 added (a consumer's choice, a theme's taste,
  and a property an effect animates under `--ui-fx-`, which a host never sets), the `query()` each
  effect is drawn under, and the `Taste` shape with `tasteBlock()`, which writes one. It imports
  nothing, for `src/reference.ts`'s reason, because `src/tokens.ts` and `src/theme.ts` read from it.
  The gate in `tests/tokens.test.ts` lets a component's sheet name a token or one of the three
  kinds, and nothing else, and refuses a taste that names an effect no component draws.
- **Who owns a component's motion, and what the default theme's taste is** —
  [ARCHITECTURE.md](ARCHITECTURE.md), _Which effect runs is the consumer's_, and the docblock on
  `taste` in `src/tokens.ts`, which says why it stands under every theme. **Why the button draws its
  effects on the real `<button>`, transitions them only once one is chosen, and lets the focus win
  and a press win over both** — the comments beside the rules in `src/effects.ts`, and
  `docs/button.md`'s _Motion_. **Why those rules are one sheet built for each component that is a
  button, and what a component that adopts it gives it** — the docblock on `src/effects.ts`.
  `buttonEffects()` is a function where the note on `drawn` beside it keeps helpers out of the
  sheet, and its docblock says why this one is safe: emptied, it hands Lit no sheet, so the component
  fails as it renders rather than the import failing, which the runner grades as a survivor. **Why a
  field's effects are a sheet of their own, and why it moves the box rather than the control** — the
  docblock on `fieldEffects()` in `src/effects.ts`. It names the control by the component, and takes
  the guard the pointer's effects carry from each, so the select's sheet names no read-only guard, as
  `tests/select.test.ts` asks. Each field's `watch()` call is set aside from mutation for the warm
  runner's reason, which the comment beside it gives. **Why the label's accent has a fifth of the
  text in it, and why the flash mixes the danger in rather than laying it over** — the comments
  beside those rules there, which carry RFC 0004's measurements; **why a field's text takes a halo
  while the flash or the shimmer plays, and why it is played rather than held** — the comment beside
  `ui-halo` there, [ARCHITECTURE.md](ARCHITECTURE.md)'s _Which effect runs is the consumer's_, and
  the floors in `tests/tokens.test.ts` that measure the placeholder against it. **Why a field's control reads one list of
  animations from a property per kind** — the comment beside that rule in `src/effects.ts`: the
  focus's burst and an error's flash both animate the control, and two rules writing `animation`
  leave one unplayed. **Why a field's pointer engine is bound to the box round the control rather
  than to the control** — the comment beside the hand-off there: the box's own layer draws the
  band, and it reads where the pointer is only from an ancestor. **Why `none` takes the pressed colour away where it keeps the lift
  as it was** — the docblock on `query()` in `src/motion.ts`, which states it once for every
  component. `tests/manual/browser-floor.mjs` counts each call to `query()` as a
  container style query, which it sets aside: an engine without one keeps today's motion.
- **Why the focus ring's glide, glitch and refocus are a popover the page owns, and why the script
  only reads what the sheet decided** — the docblock on `src/ring.ts`, and
  [ARCHITECTURE.md](ARCHITECTURE.md), _Which effect runs is the consumer's_. A component hands the
  ring `--ui-fx-ring: glide`, `glitch` or `refocus` and the flight's time and curve on its control —
  the glitch's two colours and the refocus's curve out too — under that effect's query and
  `:focus-visible`, and binds `arrive()` to its focus. **The module keeps no guard a mutant can turn into a throw on an unasserted path**:
  the departure from nowhere is a sentinel rather than `undefined`, and where the focus went is read
  off the arrival's composed path rather than walked to `null` — a throw no test fails on is graded
  as an error, which fails the floor.
- **Why the shimmer's sheen is the accent moved off the label rather than the prototype's, why the
  layer it sweeps lies under the label, and why its property is registered in script** — the
  docblock on the sheens in `src/effects.ts`, which carries the measurement, the comment beside
  `button::after` in `src/button.ts`, and the comment beside `CSS.registerProperty` in
  `src/effects.ts`: a registration is one per page, so it is set aside from mutation for
  `customElements.define`'s reason. The sheen's floor runs
  over every palette in `tests/tokens.test.ts`, read off a button rather than a token, as the tint's
  is.
- **Why the pointer's lights are handed their point by one engine, why the edge's band is an
  element of its own, and why its mask is written twice** — the docblock on `src/pointer.ts`, and the
  comments beside `.edge` in `src/effects.ts`. `tests/pointer.test.ts` dispatches its points and
  parks the real pointer at the far corner first, since a real pointer left over a control as it is
  laid gets a `pointerover` of the browser's own.
- **Why the shatter is a filter over the button, what of the button it breaks, and when it lets
  go** — the docblock on `src/shatter.ts`. A component hands it `--ui-fx-press: shatter` and the
  pieces' return time and curve on its control while it can be used, and binds `press()` to its
  `pointerdown` and `keydown`. **`tests/shatter.test.ts` dispatches its pointer events rather than
  driving the pointer**: a driven pointer lands where the frame the suite runs in is drawn, which the
  runner scales, and the cut depends on the exact point struck. It pins `Math.random` for the same
  reason, so each cut plan is one a test can state in full.
- **Why a card's pieces and its grain are a filter over it rather than copies of it, and how long
  they take** — the docblock on `src/passage.ts`, and ARCHITECTURE.md's _Which effect runs is the
  consumer's_. A surface hands `--ui-fx-enter` and `--ui-fx-exit` the effect each moment chose —
  materialize, erode, wind or dissolve — with that moment's time and curve; the card, the toast and
  the dialog's panel call `enter()` once drawn, `exit()` as they leave and `mend()` once gone, and a
  passage runs on clocks that are the surface's own animations, which `leave()`, `dismiss()` and a
  dialog's close wait out. One module for both, so whichever is running is the one the next ends.
  **Why a dialog's panel takes every passage whole in one step**, where a card's run at the pace the
  review judged — the comment beside its hand-offs in `src/dialog.ts`: it hands `--ui-fx-fit: whole`
  beside them, and every other surface writes `pace` for itself, so a card held in a dialog keeps
  its own. `tests/passage.test.ts` pins `Math.random`, as the shatter's does, and mends every
  surface it mounted after each test: a clock in a shadow root is no animation of the document's.
- **Why Glass's blur lays no scrim colour over the page, and how a dialog knows the theme is glass**
  — the comments beside `--ui-fx-glass` and the blur in `src/dialog.ts`. A theme's name does not
  reach a shadow root and its glass does, as `--ui-backdrop-raised` read through the token's
  fallback: the stand-down leaves the token with no value at all, which the fallback reads as none
  and a query on the token itself took for glass. **Why the scrim always leaves over the panel's
  step** — the comment beside the exit's rule there: `#exit` waits on the panel alone, so a scrim
  that came in slower would be cut short as the dialog closed.
- **Why Matrix's rain over a dialog's scrim is a picture drawn on a canvas, handed over by a blob
  URL, and drawn after the opening's first frame** — the docblock on `src/rain.ts`, and the docblock
  on `#rain()` in `src/dialog.ts`. A picture cannot read a token, so the accent is read off the
  scrim, where the sheet writes it, and the tiles are drawn in it; a blob URL keeps the property the
  scrim reads under a kilobyte where data URLs came to over a megabyte; and the drawing holds the
  page for tens of milliseconds, which the opening should not wait on. **The module remembers
  nothing and the dialog keeps what it drew**, by colour and density: a cache in the module would
  live across the warm runner's mutants. **Why its loops walk `upTo()` and its tiles are whole
  numbers written down** — the docblocks beside both: a slip could otherwise loop forever drawing,
  or make a canvas thousands of columns wide, either holding the page's memory while the runner
  waits it out. **`#lay()` is async for the floor's sake**: an `undefined` a mutant hands it is
  awaited rather than thrown from a timer, which the runner grades as an error. `tests/rain.test.ts`
  records every character a canvas is asked to draw in place of drawing it, and pins `Math.random`;
  the canvas keeps a transform and a blur in single precision, so it compares them rounded.
- **Why a tooltip's tip comes and goes by transitions, never scales, and plays its exit in Chromium
  alone** — the comments beside its rules in `src/tooltip.ts`, and `docs/tooltip.md`'s _Motion_: the
  placement reads the tip's box as it shows, transform and all; an exit is held by transitioning
  display and overlay, which Firefox and WebKit do not honour for a popover; and the side the tip
  comes from is `--ui-fx-toward`, written from `data-side` after the tip's first style.
  `tests/tooltip.test.ts` leaves a trigger by `parkPointer()` rather than `unhover()`, which
  scrolled the page under the tip and moved what its placement reads.
- **Why Matrix's tip is typed through highlights rather than by writing its text, and why the typing
  is handed over only under `@supports`** — the docblock on `src/typing.ts`: the tooltip hands its
  trigger the tip's sentence again whenever its text changes, so what is not typed yet is a
  highlight in no colour, whose rules are adopted into the tree the text is in, since Firefox drew
  none written in the tooltip's shadow root; and the Highlight API is newer than the floor, so an
  engine without it never reaches the drawing, which `tests/manual/browser-floor.mjs` sets aside in
  `heard`. **Why nothing on the path every tip takes can throw** — the same docblock: `ready()`,
  `write()` and `halt()` run as any tip shows and goes, from listeners, where a throw reaches no
  test and is graded as an error, so a tip nobody types reads no state that could be missing and
  never touches the page's highlights. The clock is an animation of the tip's own, which
  `tests/typing.test.ts` holds where it likes, and the tests that type wrap the pointer in
  `escaped()`.
- **Why the next tip glides from a record the page keeps, and why that record starts as a sentinel**
  — the docblock on `src/next.ts`: a tip notes where it was and when as it closes, and one opened
  within 300ms of it, a reading of the pointer rather than motion and so no token, ends both their
  effects and glides from there; `left()` and `arrived()` run as every tip goes and shows, so the
  tip before the first is on no page and closed before any time, and the tooltip's sheet hands every
  tip a time of nothing where the glide is not chosen, so no guard a mutant turns makes either
  throw. `tests/next.test.ts` pins `performance.now`, and so does the tooltip's own test of the
  glide, so the second tip opens inside the window however long the pointer takes.
- **Why the ripple is started by a script and drawn by the sheet, and why it takes the layer under
  the label from the shimmer while it spreads** — the docblock on `src/ripple.ts`, and the comment
  beside the ripple's rules in `src/effects.ts`. A component hands it `--ui-fx-ripple-time` and
  `-curve` on its control while it can be used, draws the circle under `[data-ripple]`, and binds
  `spread()` to its `pointerdown` and `keydown` — a button through `pressed()` in `src/effects.ts`,
  one listener that calls the shatter's too. `tests/ripple.test.ts` holds a circle's `finished` before cancelling it: a
  cancelled animation hands out a new promise, which never settles.
- **Why a drawn control's mark is played from its `change` rather than drawn under `:checked`, and
  why the control takes its colour at once while it plays** — the docblock on `src/check.ts`. The
  sheet's half is `controlEffects()` in `src/effects.ts`: the hand-offs, the `data-check` rule and
  the switch's spring, scoped to `input[role='switch']`, the one control with a thumb. A check is
  each control's own moment, so the default taste names it per component, and `ui-radio-group`
  builds the sheet under the radio's name, since the controls it draws are radios. **Why the
  default taste names a drawn control's `hover-border: none` per component rather than on the
  page, and why Glass names the edge back for each** — the comments beside both tastes, in
  `src/tokens.ts` and `src/theme.ts`: a component's own entry outweighs a page's, and on the page
  the `none` would take a field's darkening. **Why the full control's rule under the pointer names
  a checkbox's mixed state by its type** — the comment beside it in `src/effects.ts`: a radio is
  indeterminate wherever its group has no choice. **Why a drawn control's pulse is added to its own
  shadow, and why its flash is the field's though it takes most of a full control's mark** — the
  comments beside the control's animation list and the flash there, and
  [ARCHITECTURE.md](ARCHITECTURE.md)'s _Which effect runs is the consumer's_, which carries the
  measurement and the choice. **Why an error's red is drawn after every effect on the boundary or
  the fill** — the comment beside the pointer's rules there: a full control's boundary goes with its
  fill, and the red outlasts that. **Why a drawn control's sheen is swept under its mark, and none
  on a switch** — the comment beside the shimmer there, and ARCHITECTURE.md's same section. **Why a
  drawn control sits in a `.frame`** — the docblock on `controlEffects()` and the comment beside the
  edge: the pointer engine follows the frame, so the control and every layer read where the pointer
  is, and the band is drawn on the frame's own layer.
- **Why a card's effects are drawn on layers of their own, how it knows a focus it holds is one the
  reader sees, and what a choice written on one card cannot reach** — the docblocks on
  `surfaceEffects()` in `src/effects.ts` and on `src/held.ts`, and `docs/card.md`'s _Motion_. Each
  moment fades a layer in by its opacity, since a theme's glow in currentColor went dark through a
  transition in Chromium; `:host(:has(:focus-visible))` matched nothing in Chromium, so the card is
  marked in script; and the lift is drawn on the host, which RFC 0004's S8 leaves out of reach of a
  choice made on the one card. **Why a card is isolated only where something under its content is
  chosen** — the same docblock: a fill or a light held inside the boundary, under the content, needs
  a stacking context, which keeps what a card holds with a `z-index` from stacking over what follows
  it, so the default theme, which puts nothing there, leaves the card as it was. **Why a card's sheen
  is its tint rather than a button's** — the docblock on `surfaceSheen` there, ARCHITECTURE.md's
  _Which effect runs is the consumer's_, and the floor in `tests/tokens.test.ts`: the accent's sheen
  took the muted text to 1.97:1, and the halo a field's text takes would be inherited by everything a
  card holds. **How the lights that follow the pointer reach a card** — the same docblock: `follow()`
  is bound to its `pointerover` and handed its time on the host, so S8 reaches them as it reaches the
  lift and the tilt. **Why a card leaves through `leave()` and removes itself** — the docblock on
  `UiCard` in `src/card.ts`, and `docs/card.md`'s _Taking a card away_: no element can hold off a
  removal it did not ask for, so the exit is the card's own way out, as `close()` is the dialog's,
  and `ui-leave` fires while the card is still in the tree, as the toast's `ui-dismiss` does. **Why
  a surface sets its passage to none before any entrance writes one** — the comment beside it in
  `src/effects.ts`: a custom property is inherited, and a card held in a leaving card played its
  exit.
- **Why a toast answers the pointer and a focus as a card does, and why what moves it goes on its
  transform** — the docblocks on `UiToast` in `src/toast.ts` and on `surfaceEffects()` in
  `src/effects.ts`: its own rise holds its translate, so the sheet lifts it on its transform and
  leaves the transition to the toast's own list, which one rule of the sheet's would take the rise's
  out of. Its layers cover its edge, the wider stripe included, which its border leaves transparent.
  **Why its own rise and sink stand down for an entrance or an exit the sheet animates** — the comment
  beside them in `src/toast.ts`: a transition outranks an animation in the cascade, and Firefox started
  the rise's beside a slide, so under one the toast transitions only its transform; they stay what it
  does under `none` and in an engine without style queries, and its exit is the `leaving` state the
  card's is; under an exit drawn through a filter it stands at rest, since its sink's values would
  have left the filter nothing to draw. **Why the time left is a ring the toast's own dwell runs,
  and why it stands down under reduced motion** — the comment beside the ring in `src/toast.ts`: the
  dwell is no token, for the reason the constant gives, so the toast writes it on itself as
  `--ui-fx-dwell` and marks itself `timed`; a ring that does not collapse would move for the whole
  of it, so it is read off the count the collapse takes to one. Its angle is registered in script,
  for the shimmer's reason. **Why the stack is measured as a toast announces `ui-dismiss`, and why a
  toast hands it the spring under its toaster's query** — the docblock on `src/stack.ts`: a layout
  move is animated from where each toast stood, and `ui-dismiss` is the last moment the toast going
  holds its place, while a newcomer is measured out of the layout and moved at the next frame; a
  toast's `:host` rule reads where its toaster stands, so a choice written on the toaster reaches
  the stack, which S8 would have kept a rule on the toaster's own host from. `tests/stack.test.ts`
  stacks undefined `ui-toast` elements of its own, so only the stack moves them.
- **Why the package ships themes, why a theme is data, and why its stylesheet resets states** —
  [ARCHITECTURE.md](ARCHITECTURE.md), _A theme and a scheme are two axes_ and _More contrast is the
  reader's setting_, and the docblocks on `Theme`, `themeStyleSheet`, `matrix` and `glass` in
  `src/theme.ts`. **The contrast floors run over every shipped palette**, in each scheme and under
  emulated `prefers-contrast: more`: a theme joins them by an entry in `palettes` in
  `tests/tokens.test.ts`, and the derived accent label is swept over a grid of accents there too.

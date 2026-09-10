# Architecture

Why `@rak200/ui` is shaped the way it is, and what was rejected on the way. The decisions are
RFC 0016's; this is the half a consumer needs in order to judge whether the package fits.

## Custom elements, not framework components

The kit ships **custom elements**, so it works in any page and any framework, or none.

A React-only component library was considered and rejected: it forfeits portability, and it forfeits
the server-rendered ride-along that a page emitting tags plus one module gets for free. A component
welded to one framework is not reusable outside it, which is the opposite of why this exists.

## Lit

Lit gives a thin runtime, no build step required of the host, and works unbundled.

**Stencil is the documented alternative**, and the two tie on the decisive question — the mobile
path, which is PWA first and Capacitor second. The web side breaks the tie. Revisit only if the
mobile direction becomes Ionic, or if many external framework applications consume the kit.

## Behaviour is delegated, markup is owned

**The state machines were going to come from [Zag](https://zagjs.com), and that adoption is now
retired.** Five components were candidates and five declined, each on its own measurement; the
walk-through below is how a decision taken before the first component existed was answered by the
components themselves, and the last part of this section is where it lands.

Two alternatives were rejected when the adoption was made, and neither came back. Building
accessible behaviour from zero re-opens every APG pattern and its verification cost, per component.
Theming somebody else's monolith gives up the source, and owning the source is not negotiable here.

Zag was **not a dependency yet**, deliberately. A button has no state to model, and a dependency
carried before anything uses it is a claim the code does not back up.

**The first component that could have brought it did not, and that is worth stating rather than
quietly not doing.** `ui-dialog` has dismissable layers and a focus trap — the two things Zag was
adopted for — and it gets both from `<dialog>` and `showModal()`, where the background is inert
because the user agent says so rather than because a script is holding the boundary. Zag's dialog
machine implements the same pattern over a `<div>`, so adopting it there would have meant giving up
the top layer in order to re-acquire in JavaScript what the top layer already grants.

_The platform owns what the platform is good at_ is the older rule, and it wins where the two meet.
Nothing about the adoption changed at that point; what changed was which component would trigger
it. The next candidate was to be the first component the platform has **no element for** — a menu
with roving tabindex and positioning being the nearest — and the roadmap named it.

**`<ui-radio-group>` is the second component that could have brought it, and the test above is what
sent it away.** A radio group is an APG pattern with a roving tabindex in it — one tab stop, arrow
keys that move _and_ select, wrapping at either end — which reads like the trigger until the
question is asked the right way round: native radios sharing a `name` **are** that pattern, and
they keep being it inside a wrapper, which this package's suite measures rather than assumes. So
the group hand-rolls nothing and adopts nothing; what is left for it is the layout, the `role` and
the group-level name. The pattern having state was never the test. Having no element for it is.

**`<ui-toast>` is the third, and it declines on different grounds — which is what showed the test
was carrying more weight than its wording.** Zag ships a toast machine, so this is a refusal rather
than an absence of an option, and the platform has no toast element: read literally, _no element for
the pattern_ says adopt. It was not adopted, because the expensive part of a toast is not behaviour.
It is **announcement** — one live region per politeness, in the document before any message, carrying
no role that would re-read the whole stack — and that is a structural decision no state machine can
make on your behalf, because it depends on what existed when. What is left over is a timer that pauses
while the toast is being read, which is fifteen lines and no machine.

So the test reads, in full: Zag arrives where the **accessible behaviour** is the expensive part —
keyboard interaction, focus management, a layer that dismisses. Where the platform supplies that,
Zag is redundant; where there is barely any of it to supply, Zag is overhead. `<ui-dialog>` and
`<ui-radio-group>` are the first case and `<ui-toast>` is the second, and at this point the roadmap
still named a component expected to be neither.

**`<ui-menu>` was that component, and it declined too — which makes four, and turns a deferral
into a question.** A menu button is the pattern the adoption was written for: a single tab stop,
arrow keys, Home/End, typeahead, Escape, focus returned to the trigger. Measured in the component's
own arrangement, `popover="auto"` supplies the top layer, light dismissal, Escape, and the ordering
against every other open layer; what is left over is a roving tabindex and four keys, which the
`<ui-radio-group>` refusal already named as not the trigger. The one thing the platform did **not**
supply was focus restoration across the shadow boundary, and that is three lines rather than a
machine.

The second reason is narrower and harder to argue with: Zag's menu positions through Floating UI,
and this package's placement is measured, documented and shared by two components. Adopting the
machine would put a second answer to that question in the same package — which is the trade
`<ui-tooltip>` already refused, from the other direction.

**The fifth candidate was expected to be the one, and it is not.** RFC 0005 moves every form
control's own control inside its shadow root, and the reading of that was that `<ui-radio-group>`
would lose what it delegates to and have to write the pattern by hand: a roving tabindex, arrows
with wrap, selection following focus, the single-selection invariant across the set, and RTL, where
left and right swap. An APG pattern with directionality and wrapping in it is this section's test
met rather than argued — if it were true.

Measured in `tests/radio.test.ts`, it is not. **A radio group is the radios sharing a `name` within
one form owner, and where there is no form owner, within one tree.** An `<input>` in a shadow root
has no form owner — which is the whole premise of RFC 0005 — so the fallback applies and the group
is scoped by the shadow root instead. Every part of the pattern survives the move: the group forms
at all, one tab stop rather than one per option, arrows that move _and_ select, wrapping at either
end, RTL, and the single tab stop under `delegatesFocus`. The delegation is not withdrawn by
variant F. It is **re-scoped**, by the same tree-scope rule the rest of that proposal turns on —
and two groups carrying the same `name` stop colliding, which under a shared form owner they do.

**So the adoption is retired.** Not deferred, and not rejected on principle: the test was applied
five times and answered _no_ five times, and the fifth was the one designed to answer yes.

What replaces it is the rule that was doing the work the whole time — _the platform owns what the
platform is good at_ — with the part that makes it a test rather than a preference: where the
platform has **no element**, what is actually left over gets measured before anything is reached
for. Five times that leftover was three lines, fifteen lines, or four keys. The two alternatives
rejected at the top of this section stay rejected, and neither describes this one: nothing here
builds an APG pattern from zero, because nothing here has had to.

**What would reopen it**, stated so that it stays a decision rather than becoming a habit: a
component whose accessible behaviour the platform supplies no part of, and whose leftover is a
pattern rather than a handful of lines — a combobox with inline autocomplete, a tree with
typeahead, a grid with two-dimensional navigation. None is on `ROADMAP.md`. Adding one is what puts
this question back, and the machines are a better answer then than a dependency carried for five
components that each turned it down.

## The prefix is `ui-`

Tags, CSS custom properties and exported classes all carry it: `<ui-button>`, `--ui-radius`,
`UiButton`. It is the repository name, so a reader can derive it from something that exists.

The trade-off is stated rather than hidden. A generic prefix collides more easily, and the collision
worth naming is **not** with another kit: a distinctive prefix is the web-components convention
(`sl-`, `md-`, `ion-`), which leaves the generic space largely unclaimed by libraries. It is with the
host application's own components, where `ui-card` is the first thing anyone reaches for.

That collision is unrecoverable rather than degraded. `customElements.define` throws on a name
already registered, and these components register themselves at import — so whichever side loads
second breaks, and if that is this package, it breaks on load. Opt-in registration would remove it,
and is the change to make if it ever bites; nothing needs it today.

## The platform owns what the platform is good at

A component wraps the real element wherever one exists — `<ui-button>` renders a `<button>` — so
keyboard activation, the accessible name, disabled semantics and focus behaviour stay the browser's
job. A `<div role="button">` needs every one of them written by hand, and gets one of them wrong.

**Where an element exists but is half-styleable, the limit is published rather than papered over.**
`<ui-select>` wraps a native `<select>`, so the picker a phone opens stays the platform's — and the
drop-down list stays unstyleable, which [docs/select.md](docs/select.md) says in as many words. A
custom listbox would style it and would have to reimplement that picker, which is the trade RFC 0016
declined. Chromium's `appearance: base-select` will eventually remove the trade; adopting it while
one engine has it would make the kit look like two kits.

**Where the platform has the feature but only in one engine, it is measured and declined.**
`<ui-tooltip>` places itself with thirty lines of script over a `popover`, and CSS anchor positioning
is not adopted even though this package's suite measures it working end to end — an anchored popover
really is placed against its anchor here. The reason is `<ui-select>`'s, one step harsher: where an
engine lacks the rules, a popover is `position: fixed` at `inset: 0`, so the failure is a tooltip in
the corner of the screen rather than one that merely looks different. The flip at a viewport edge is
`position-try-fallbacks`, so the script would have to exist anyway — and a component with a CSS path
and a script path is two components. The script goes when the feature is broadly available, and the
tests do not, because they assert where the tip lands rather than who put it there.

**Where no element exists, the component says so rather than pretending one does.** `<ui-switch>` is
a native checkbox carrying `role="switch"` and a drawing, because there is nothing else for it to
be: `<input type="checkbox" switch>` is unsupported in the engine this package's suite measures.

**And taking a drawing over is a debt, not a free hand.** `appearance: none` removes the platform's
tick, its mixed-state dash, its target size and its behaviour under forced colors in one
declaration, and every one of those is then this package's to hold — which is why a checkbox here
draws the mixed state it was never asked for, floors itself at 24×24, and names system colours in a
`forced-colors` block. That list is the price of the decision rather than a set of extras, and it is
the reason a component takes the drawing over only where the alternative is worse.

## A relationship needs one tree scope

Where a component wires an ARIA relationship between elements — a label to a control, help text to
`aria-describedby` — **every end of it is in one tree**, and which tree follows from who owns the
elements.

Not a preference. An IDREF is resolved _within_ a tree scope, and a shadow root is one of those: a
`<label for>` inside a component's shadow root leaves a slotted `control.labels` empty, and an
`aria-describedby` pointing in resolves to nothing. Measured in the browser the suite runs in, both
ways round.

**So two arrangements work and one does not.** Both ends in the host's tree, with the component
generating the ids and pointing them at each other; or both ends in the component's, rendered
together. What fails is one of each.

This section used to say _ARIA association is light-DOM only_, which was the middle arrangement
measured correctly and read too broadly: what strands a slotted control is the label staying
outside, not the control being inside. RFC 0005 measured the other shapes and moved the drawn
boolean controls to the second arrangement.

**Where a component owns _both_ ends, the relationship goes inside**, and `<ui-menu>` is the one
that does. A menu button's `aria-haspopup`, `aria-expanded` and `aria-controls` all point from a
trigger at a panel, and both are elements the component renders — so they share one tree scope, the
IDREF resolves, and a consumer has nothing to miswire. That is not an exception to the rule above
but the same rule read forwards: the elements in a relationship must be in one tree, and which tree
follows from who owns them. The menu's _items_ stay slotted, because they are the host's controls
and what binds them is containment rather than a name.

**`<ui-checkbox>` and `<ui-switch>` are the second arrangement in full**, and they are what
reversed the reading above. Each renders a real `<input type="checkbox">` inside a real `<label>`
in its own shadow root, so there is no IDREF to strand — a label that _contains_ its control needs
none — and the toggle, <kbd>Space</kbd>, the click target over the text and the rule that a link
inside a label follows the link all stay the platform's. What moved is form participation, not
accessibility: an `<input>` in a shadow root has no form owner, so the element joins the form
itself through `ElementInternals` and answers for the value, the validity and the three form
lifecycle callbacks.

**Containment is the one relationship that does cross, and `<ui-toaster>` is what made the
distinction concrete.** An IDREF is resolved inside a tree scope, which is exactly what a shadow root
is one of — so a reference fails. A live region is not a reference: it holds whatever is _inside_ it,
and the accessibility tree is built from the flattened tree, where a slotted element really is inside
the slot's parent. So the toaster's two `aria-live` regions are rendered in its shadow root and the
toasts stay in the host's tree, slotted into them — which is the arrangement this section forbids for
a label and permits for a region, for a reason and not by exception. The rule is about how the
relationship is _expressed_: by name, or by position.

**Where the platform's own association cannot reach, the ARIA one is used instead**, and
`<ui-radio-group>` is what made that concrete. `<label for>` reaches a **labelable** element and
nothing else, so a group — an element with a role — is named by `aria-labelledby` rather than by
`for`. The order is the rule rather than the mechanism: `for` wherever it works, because it names
the control _and_ makes the label a click target for it, and a reference only where it cannot.

The group renders both ends now, so the reference resolves in one scope and the choice is visible
in one file: **the set** is named by reference, and **each option** by containment, its label
wrapping its control with no id anywhere.

**It binds the control itself, not only the text around it**, and `<ui-input>` is what made that
concrete — twice, in opposite directions. A styled text field is the obvious candidate for
rendering the `<input>` into a shadow root, and measured there it was an axe `label` violation at
critical impact with an `aria-describedby` that dangled. The library was built on that measurement:
the control stayed the host's own element, and the component was a box around it.

**The measurement holds; the conclusion drawn from it did not.** The label had been left in the
host's tree, so it was one end on each side — the arrangement this section names as the one that
fails. Rendered _together_ with the control, a `<label for>` and its `aria-describedby` resolve
cleanly, in all three engines. Every form control here now owns both ends of its own relationship:
`<ui-checkbox>`, `<ui-switch>`, `<ui-input>`, `<ui-textarea>`, `<ui-select>` and `<ui-radio-group>`
render their control, their label, their help and their message into one shadow root, and a host
writes the tag and its attributes.

**What that costs is `ElementInternals`, and it is smaller than it looks.** A control in a shadow
root has no form owner, so the element joins the form itself and answers for the value, the
validity and the three form lifecycle callbacks. **Constraint validation is not reimplemented** —
the rendered control is a real one, so it still computes its own `type="email"`, `min`, `pattern`
and `required`, and the element hands the whole `ValidityState` over with the message the engine
wrote. `change` is re-dispatched, being non-composed; `input` is not, being composed.

**The attribute pass-through is a declared API rather than a forwarding table.** Each element
declares the attributes it accepts, and the objection this shape used to answer — _no pass-through
list to fall out of step with `type`, `inputmode` or whatever comes next_ — is answered differently
rather than dodged: the list is the component's interface, which is where a design system's
attributes live anyway. A denylist that forwarded everything else was the alternative, and it is
not stable in the way it looks: `id` would collide with the label's `for`, `style` would apply
twice, and an `aria-describedby` written on the host would dangle across the very boundary this
section is about.

**One element could not take the shape, and that is measured too.** `<ui-select>`'s choices cannot
be slotted `<option>`s: a `<slot>` inside a `<select>` assigns the nodes and the select sees none of
them, because `HTMLSelectElement.options` is built from its own children rather than from the
flattened tree. So the choices are `<ui-option>` and `<ui-optgroup>` — declarations that draw
nothing, from which the platform's own elements are built. That is the first time this library has
added an element to say something rather than to show something, and it was the platform's refusal
that asked for it.

**`<ui-field>` is what all of this leaves behind.** It exists to point scattered ends at each
other, and no control in this package has scattered ends any more. What it is still for is a
control **you** wrote — a smaller job than the one it was built for, and one that turned out to
have a second half nobody designed for it.

**A control in the host's tree is the only one a second component can still reach.** The rule this
section states for a component's own relationship holds just as firmly against a component
_outside_ it: `<ui-tooltip>` writes `aria-describedby` from the host's tree, and an IDREF crosses a
boundary in neither direction — so a tooltip on any element this package renders describes a node
the reader never lands on. The tip appears and places itself; the announcement is what is lost. The
field is currently the only arrangement that keeps both ends together, which is a thing to weigh
before removing it. #156

## Glyphs are adopted, the delivery is owned

The icons come from [Lucide](https://lucide.dev), vendored under its ISC licence; `<ui-icon>`, the
registry behind it and the accessibility contract are this repository's.

**This is the build-versus-adopt rule aimed at the axis that actually carries cost.** RFC 0016 turned
that question on accessibility and interaction behaviour, and neither exists for an icon — there is
no APG pattern for drawing a padlock. What a glyph set costs is volume and optical consistency:
hundreds of marks on one grid at one stroke weight, each corrected by eye. That is designer-months
with no differentiation at the end of it, so drawing our own was an easier reject than Zag's was.

Adopting gives up no source. Under ISC the SVGs are copied in and are ours to edit, with no upstream
to fight — the copy-in model RFC 0016 wanted for components and could not have.

**A glyph module carries the geometry alone.** Every Lucide SVG has the same wrapper — 24 grid,
`fill="none"`, `stroke="currentColor"`, one stroke width — and that wrapper belongs to the element,
which is what keeps the grid, the stroke and the colour one decision rather than two thousand.

**The glyph is selected by an attribute, not by a value passed in**, and that follows from the first
decision in this document: a page that only emits tags has no way to hand a component a value. So
importing a glyph module registers it, and `<ui-icon name>` starts working. The price is a global map
of names and one silent failure — an unregistered name draws nothing — which is why the element says
so in the console rather than leaving a blank box.

**A mark the set does not have is slotted rather than registered**, and gets the adopted grid's
stroke, caps and colour applied to it — so a brand glyph is indistinguishable from a vendored one,
which is the condition under which drawing your own is worth doing at all.

## The accessibility bar

**Every component meets WCAG 2.2 AA and conforms to its WAI-ARIA APG pattern.**

Verification is two-layered, because automated tooling catches only a fraction of failures:

- **Automated**, and wired into the `test` verb: axe-core runs over each component in a real
  browser, across the WCAG A/AA tags, and any violation of serious or critical impact fails the
  suite. Tests run in a browser rather than a DOM emulator precisely because shadow DOM, focus and
  event ordering are where an emulator and a browser disagree.
- **Manual**, and required per component: a keyboard-only pass and a screen-reader pass. This is a
  recurring cost the automated floor cannot absorb.

## Every visual decision is a token

Colour, radius, spacing and motion are CSS custom properties with fallbacks, so a host restyles the
kit without forking it. Components read `var(--ui-*, fallback)`; a hardcoded value is a decision a
host cannot override.

Tokens are also the single source of truth that keeps a native shell reachable later, which is why
they exist from day one rather than being extracted once something needs them.

### The set splits into grounds and derivations

A **ground** carries a literal value and is declared at `:root`. A **derived** role carries a
formula — `color-mix()` over the grounds — and is declared nowhere: it lives in the `var()` fallback
at the point of use.

That placement is the whole of it, and the alternative was measured rather than argued about. A
derivation written beside its grounds resolves **once**, against the grounds in force there, and
freezes — a dark subtree then inherits the light mix, and a themed region inherits the untheme'd
one, with nothing anywhere to read. In the fallback it resolves against the grounds in force at that
element instead, so a hover colour follows a scheme and a theme without either restating it.

The price is real and is stated where a consumer meets it: a derived name is **write-only**. You can
override one; nothing can read one back. What it buys is an override surface a host can hold in
their head — change the accent and the hover and pressed colours follow, rather than being one more
name each.

### A theme and a scheme are two axes

A **scheme** is the light or dark rendering of whichever theme is in force, selected with
`color-scheme`, with each ground carrying both of its values in one `light-dark()`. A **theme** is a
named set of decisions, selected with the `data-ui-theme` attribute. They are independent: two
themes cost two blocks rather than two blocks plus two guarded media queries, and a whole theme is
four grounds.

### Motion is tokens, and reduced motion is one rule

Components read a **purpose** — `--ui-duration-state` — over a scale named by ordinals with gaps, so
inserting a step later is additive rather than a rename. `prefers-reduced-motion` is honoured once,
in the token layer, and collapses every duration to `0.01ms` rather than to zero — at zero a
transition still lands but fires no `transitionend`, so anything awaiting the end of one waits
forever, and only for the people who asked for less motion.

That is the argument for motion being tokens at all, and it is stronger than the theming one: a
hardcoded `150ms` is not merely un-overridable, it is an accessibility defect that every component
would otherwise have to fix on its own.

### One value cannot follow the scheme, and it says so

`light-dark()` takes **colours**, so a ground whose value is not a colour has no way to carry a
second one — and elevation is the first such category to arrive. `--ui-elevation-100` is a
`box-shadow`, one value in both schemes, and on a dark page it does almost nothing: it is black at a
low alpha, and black on charcoal is black.

The answer is at the component rather than in the token layer, because that is where it can be
judged: `<ui-card>` draws a **boundary** as well as a lift, and the boundary is derived — it mixes
toward the text, so it is correct in both schemes by construction. The shadow is the light scheme's
cue; the edge is what both schemes have. A scheme-aware shadow would mean a second axis in the
emitter for one category, and the thing it would buy is available from a name that already exists.

### A category arrives with the component that consumes it

Elevation lands with a card, a type scale with a table, `success` and `warning` with a toast — not
before.

**The type scale is the case where the rule paid off most visibly, and it did so backwards.** It
arrived with `<ui-table>` as scheduled, and what it found on arrival was not a gap but a **defect**:
`font-size: 0.875em` was already shipping in three places — twice in `<ui-field>`, once in
`<ui-tooltip>` — all three agreeing, none of them compared to anything, and every one of them a
decision a host could not override. Had the category been admitted earlier, on a schedule, those
three would have read a token from the start and nothing would have recorded that they were once a
literal. Waiting is what made the extraction a correction rather than a formality.

The rule cuts the other way as often as it looks like it will: the first overlay was
expected to bring a layering category, and brought none, because a modal `<dialog>` is promoted to
the top layer and there is no `z-index` anywhere in it to name. Four overlays have now arrived and
none has brought one — the other three are `popover`s, which the platform promotes the same way, and
with the v0 surface delivered the category never opened at all. `<ui-checkbox>`, `<ui-switch>` and
`<ui-radio-group>` brought none either, being drawn entirely from the boundary and the accent that
were already there — a component arriving with no category is the schedule working, not a corner
being cut. Values chosen with no component to judge them against get corrected when one arrives, and
correcting a published default silently moves the rendering of every host that did not override it.

**The exception is a component's own interaction states, which are not a later category but a
present defect.** A component that accepts interaction and shows no feedback is incomplete, so
`:hover` and `:focus` ship together with the component or the component does not ship.

This is a schedule, not a licence to invent: a name is checked against the categories the token
layer declares, and one matching none fails the suite. What made an unmanaged token set a pile was
never lateness — it was each component naming things its own way.

## Distribution

A versioned npm package in its own repository, ESM only. No dual build: a package that ships two
formats ships two behaviours and debugs three.

The quality bar mirrors the ecosystem's PHP side — strict types, strict lint, a coverage floor, and
a mutation floor at 100% — so a consumer gets the same guarantees whichever language an artifact is
written in.

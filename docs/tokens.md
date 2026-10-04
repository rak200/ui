# Tokens

[← Reference](README.md)

The design tokens — the single source of truth for the visual language.

```js
import { tokens, derivedTokens, defaults, formulas, darkScheme, tokenStyleSheet } from '@rak200/ui';
```

## Contents

- [The set is open](#the-set-is-open)
- [Two kinds of name](#two-kinds-of-name)
- [Overriding a token](#overriding-a-token)
- [Light and dark](#light-and-dark)
- [Themes](#themes)
- [Motion](#motion)
- [More contrast](#more-contrast)
- [`tokens`](#tokens)
- [`defaults`](#defaults)
- [`derivedTokens`](#derivedtokens)
- [`formulas`](#formulas)
- [`darkScheme`](#darkscheme)
- [`moreContrast`](#morecontrast)
- [`tokenStyleSheet`](#tokenstylesheet)
- [`Token`](#token)
- [`DerivedToken`](#derivedtoken)

## The set is open

**Names are added as components arrive**, and a category enters with the pull request of the
component that consumes it — elevation with a card, a type scale with a table. So the set below is
what exists today, not a promise of what exists forever.

Adding a name is a `feat` rather than a break, and it costs a consumer nothing at runtime: a custom
property nobody reads does nothing. The one pattern it does break is **enumerating the whole set** —
a `Record<Token, string>` that has to stay exhaustive, or a `switch` over every name. Write a
**partial** map instead, which is what a theme is anyway:

```ts
const overrides: Partial<Record<Token, string>> = { '--ui-color-accent': 'rebeccapurple' };
```

Every release that adds a name names it in the release notes, because the consumers who do break
find out at compile time and deserve to read why.

## Two kinds of name

Some names have a **value**; others have a **formula**. Both are overridden in exactly the same way,
and the difference only shows if you try to read one back.

|                     | [`tokens`](#tokens) | [`derivedTokens`](#derivedtokens)       |
| ------------------- | ------------------- | --------------------------------------- |
| Has a default value | yes                 | no — it has a formula                   |
| Emitted at `:root`  | yes                 | **never**                               |
| You can override it | yes                 | yes                                     |
| You can read it     | yes                 | **no** — write-only                     |
| Follows your theme  | you set it          | automatically, from the tokens it mixes |

Components reach both through one internal helper, `reference()`, which attaches the default or the
formula to the `var()` it writes. That is why a component renders correctly on a page that declares
no tokens at all — and why a derived role tracks your accent, your surface and the scheme without
you declaring anything.

## Overriding a token

Every token is a CSS custom property under `--ui-`, so a host overrides one by setting it anywhere
above the component. No build step, no theme object, no fork:

```css
:root {
  --ui-color-accent: rebeccapurple; /* everything derived from the accent follows */
  --ui-radius: 0;
  --ui-color-hover: #f3f4f6; /* and a derived name is still overridable */
}
```

Tokens exist from day one because they are the only thing that reaches every target the roadmap
has: the components consume them as custom properties, and a native shell can read the same values
without the components. A token added later is a token some target already hardcoded.

## Light and dark

Insert [`tokenStyleSheet()`](#tokenstylesheet) and you have both. Each ground that differs by scheme
is declared as `light-dark(light, dark)`, and the sheet declares `color-scheme: light dark` beside
them, so the browser picks the branch:

```html
<style>
  /* whatever tokenStyleSheet() returned */
</style>
```

| What you want               | What you write                                |
| --------------------------- | --------------------------------------------- |
| Follow the operating system | nothing — that is what the sheet already does |
| Force light                 | `color-scheme: light` on any ancestor         |
| Force dark                  | `color-scheme: dark` on any ancestor          |

`color-scheme` inherits, so one declaration governs everything below it — a region, a dialog, or the
document. There is no media query to write and no three-state selector to get right.

**Without the sheet there is no dark rendering.** Components carry each token's _light_ value as
their `var()` fallback, so a page that declares no tokens at all still renders, in light. That is
the trade: nothing breaks without the sheet, and nothing goes dark without it either.

## Themes

**A scheme is not a theme, and the two are independent axes.** A scheme is the light or dark
rendering of whichever theme is in force. A theme is a named set of decisions, selected with the
`data-ui-theme` attribute — an attribute rather than a class, so two values cannot fight.

A whole theme is a handful of grounds, each carrying both of its schemes:

```css
[data-ui-theme='brand'] {
  --ui-color-surface: light-dark(#faf5ff, #1a0b2e);
  --ui-color-text: light-dark(#3b0764, #f3e8ff);
  --ui-color-accent: light-dark(#7e22ce, #c084fc);
}
```

```html
<div data-ui-theme="brand">…</div>
```

Three declarations, and the accent's label, the hover and the pressed colours follow into **both
schemes of both themes** without appearing anywhere — that is what [`formulas`](#formulas) buys.
Nothing is scoped to `:root`, so a theme can be a region of a page rather than the whole of it.

The package ships themes of its own as well, as data with a function that renders them — see
[theme.md](theme.md).

## Motion

Components read a **purpose** — `--ui-duration-state` — never a step of the scale underneath it. So
a host who wants slower state changes has a name to reach for without first reading a component's
CSS to discover which step it uses.

The scale is named by ordinals with gaps — `--ui-duration-100`, leaving room for a `-150` — because
a naming scheme that turns _inserting a step_ into a rename is a scheme that breaks on a foreseeable
change. Duration and easing are separate names so that changing a speed does not mean restating a
curve.

## More contrast

**A reader who asks for more contrast gets it in every component, and nothing in a component
knows.** The sheet answers `prefers-contrast: more` the way it answers reduced motion: the text, the
surface, the accent and the focus ring go to black and white, with the dark scheme on pure black.
The accent's label follows on its own, being derived from the accent, and so do the border and the
muted text, which mix toward the text. What floats over the page — a dialog, a tip, an open menu —
is edged in the text itself, and so is a toast, its icon with it. Every pair the text makes with a surface clears 7:1, WCAG's enhanced
level.

**The outcome colours stay where they are.** An error that turned grey would stop saying it is an
error, so `--ui-color-danger`, `-success`, `-warning` and `-info` keep the 4.5:1 they were chosen
at.

**The states are written out rather than derived.** Over pure black a mix toward the text barely
moves, and a black or white accent has no room to shade toward, so the hover, the pressed, the
striped row and the accent's two states are given as values — at the steps the default palette's own
states take. Those values are declared at `:root`, so they reach under a theme of your own too: a
theme that answers the setting itself declares its own states, or resets them with `initial` to hand
them back to their formulas.

It is the reader's setting, not a theme you select: a reader who needs it should not depend on a
host having shipped a picker. [`moreContrast`](#morecontrast) holds the values.

**Easing has three names and duration has one purpose, which is not an inconsistency.** A state
change reverses mid-flight — a pointer leaves a button while the hover is still arriving — so
`--ui-easing-state` is symmetric. An overlay does not reverse: it arrives and it leaves, and
`--ui-easing-enter` and `--ui-easing-exit` are asked to feel different on purpose. No second
duration step came with them, because nothing needed one; a step enters when a component judges it
against something rather than when a name looks incomplete.

**The icon pair are the two knobs that decide whether an adopted set looks like it belongs.**
`--ui-icon-size` is in `em`, so an icon beside a word is the size of that word — the placement that
dominates — and a host who wants a fixed size sets one. `--ui-icon-stroke` is unitless because it is
a `stroke-width` against a 24-unit viewBox: it scales with the glyph rather than staying two device
pixels at every size. There is no icon _colour_, and that is deliberate rather than missing — a glyph
strokes with `currentColor`, so it takes the colour of whatever it sits in, which is what lets one
registration serve a primary button, a danger message and body text.

**Reduced motion is honoured in the sheet, once.** `tokenStyleSheet()` emits a
`@media (prefers-reduced-motion: reduce)` rule that collapses every duration — ground and derived
alike, so a host who tuned one still gets the collapse. It collapses to `0.01ms` rather than to
zero, and that difference is not cosmetic: at zero a transition still lands but fires no
`transitionstart` and no `transitionend`, so anything waiting on the end of one waits forever, and
only for the people who asked for less motion.

**Two of those percentages are read off a measurement rather than chosen.** A control's boundary is
what identifies the component, so WCAG 1.4.11 asks 3:1 against the surface, and a placeholder is
text, so 1.4.3 asks 4.5:1. `--ui-color-border` clears 3 at 50% (3.39 light, 3.96 dark) and does not
at 45% (2.94 light); `--ui-color-text-muted` clears 4.5 at 65% (5.24, 6.07) rather than at the 60%
that first cleared it, because 4.52 is a rounding error away from failing. The suite holds both
floors, in both schemes.

[`<ui-dialog>`](dialog.md) is the component that makes that concrete: it waits for its exit to
finish before closing, so it is the thing that would have waited forever.

## `tokens`

The names that have a default and are emitted at `:root` — the **ground** half of the set.

| Token                    | Covers                                                            |
| ------------------------ | ----------------------------------------------------------------- |
| `--ui-color-accent`      | the accent surface of a primary control                           |
| `--ui-color-surface`     | a neutral surface                                                 |
| `--ui-color-text`        | body and secondary text                                           |
| `--ui-color-focus`       | the focus ring — see the floor below                              |
| `--ui-color-danger`      | error text                                                        |
| `--ui-color-success`     | a successful outcome                                              |
| `--ui-color-warning`     | an outcome worth a second look                                    |
| `--ui-color-info`        | an outcome that is neither                                        |
| `--ui-color-toast-edge`  | the edge of a toast, its variant's colour by default              |
| `--ui-color-scrim`       | the dim behind a modal                                            |
| `--ui-radius`            | corner radius                                                     |
| `--ui-space`             | the spacing step components scale from                            |
| `--ui-font`              | the font stack                                                    |
| `--ui-duration-100`      | the first step of the duration scale                              |
| `--ui-easing-state`      | the curve a state change follows                                  |
| `--ui-easing-enter`      | the curve an overlay arrives along                                |
| `--ui-easing-exit`       | the curve it leaves along                                         |
| `--ui-icon-size`         | how big a glyph is drawn                                          |
| `--ui-icon-stroke`       | how heavy its stroke is, on a 24 grid                             |
| `--ui-elevation-100`     | the first step of the elevation scale                             |
| `--ui-elevation-control` | the glow a theme lights a control with, none by default           |
| `--ui-backdrop-raised`   | what a raised surface does to the page behind it, none by default |
| `--ui-text-100`          | the first step of the type scale                                  |

It is not called `groundTokens`, and that is a cost rather than an oversight: renaming an exported
name is breaking. Read it as _the names that have a default_.

### Four tokens carry a text floor

`--ui-color-danger`, `--ui-color-success`, `--ui-color-warning` and `--ui-color-info` each clear
**4.5:1 against the surface** in both schemes — the floor for text, not the 3:1 a coloured edge
would owe. The floor a value has to clear is the strictest use it is put to, and nothing stops a host
writing one of these as text; every control's error message already writes the first one that way.

Override one and you own that ratio. A `success` that only ever draws an edge can be lighter; one that
also labels something cannot.

### One token carries a floor

`--ui-color-focus` is the visual information that identifies a focused control, so WCAG 1.4.11 asks
for **3:1 against the surface it sits on** — `outline-offset` puts the surface on both sides of the
ring, so the surface is what it is measured against rather than the control underneath.

An override is yours to choose, but a focus ring below that ratio is one some people cannot see. The
default is 5.02:1 on the light surface and clears the floor on a dark one too.

### One category cannot follow the scheme

`--ui-elevation-100` is a `box-shadow`, and a shadow is not a colour — so it cannot go through
`light-dark()` the way every scheme-varying value here does, and it carries **one value in both
schemes**. On a dark page it does almost nothing: the shadow is black at a low alpha, and black on
charcoal is black.

That is stated rather than worked around, because the component that consumes it answers it:
[`<ui-card>`](card.md) draws a boundary as well as a shadow, and the boundary is derived — it mixes
toward the text, so it is correct in both schemes by construction. The lift is the light scheme's
cue; the edge is what both schemes have.

### A shadow written in `currentColor` is lit in its element's colour

`--ui-elevation-control` is `none` until a theme writes one. **Write it in `currentColor`** and each
control lights it in the colour of its state: the accent, or the danger on an invalid control. The
box that draws it sets its own colour for that and has no text for the colour to reach, so one
value serves every control:

```css
[data-ui-theme='neon'] {
  --ui-elevation-control: 0 0 0 1px currentColor, 0 0 12px rgb(from currentColor r g b / 0.5);
}
```

A colour named in the value instead lights every control in that one colour, an invalid one
included — a variable inside a custom property is resolved where the property is declared, before
any control can change it. A control that cannot be used lights nothing. Every control draws it:
the checkbox, the switch, the radio, the text fields, the select, the button and the menu's trigger.
A button and the trigger light to `--ui-elevation-control-hover` under the pointer, which is the
resting glow until a theme writes a brighter one.

**`--ui-elevation-100` takes `currentColor` the same way.** The card and the open menu draw their lift
on a layer in the accent, and a toast on one in its edge colour, `--ui-color-toast-edge` — its
variant's, unless you set the name. The tooltip's tip is your own element, so it lights the lift in
its text. The default palette's lift names its colour, so none of this changes how it renders.

## `defaults`

The default value of every ground token. Deliberately plain rather than branded: a design system's
defaults are what a host sees before it has decided anything.

```js
defaults['--ui-color-accent']; // '#2563eb'
defaults['--ui-duration-100']; // '150ms'
```

## `derivedTokens`

The roles computed from the grounds rather than declared beside them.

| Token                          | Covers                                        |
| ------------------------------ | --------------------------------------------- |
| `--ui-color-accent-contrast`   | text, and every mark, on the accent           |
| `--ui-color-accent-hover`      | a primary control under the pointer           |
| `--ui-color-accent-pressed`    | a primary control being pressed               |
| `--ui-color-hover`             | a neutral surface under the pointer           |
| `--ui-color-pressed`           | a neutral surface being pressed               |
| `--ui-color-border`            | the boundary of a control                     |
| `--ui-color-border-overlay`    | the edge of a dialog, a tip and a menu        |
| `--ui-color-border-raised`     | the edge of a card                            |
| `--ui-color-text-invalid`      | the value written in a field in error         |
| `--ui-color-text-muted`        | text that is not a value yet                  |
| `--ui-duration-state`          | how long a state change takes                 |
| `--ui-elevation-raised`        | a surface lifted off the page                 |
| `--ui-elevation-control-hover` | the glow a button lights to under the pointer |
| `--ui-text-supporting`         | text that explains what is beside it          |
| `--ui-color-surface-muted`     | a second surface tone, for grouping           |
| `--ui-color-surface-raised`    | the colour of a raised surface                |

**These are write-only, and it is the one cost of the design worth knowing about.** Set one and
every component picks it up, exactly like a ground token. Read one back and there is nothing to
read: a derived name is never declared anywhere, so `getComputedStyle(el).getPropertyValue()`
returns an empty string for it, and it takes no row in [`defaults`](#defaults).

What that buys is an override surface you can hold in your head. Change `--ui-color-accent` and its
label, its hover and its pressed colours follow, in both schemes and under any theme, because each
is a formula that resolves where it is used rather than a value somebody has to keep in step.

**The accent's label is one of them.** `--ui-color-accent-contrast` is white or black, whichever
stands further from the accent, so no accent you pick leaves its label under 4.5:1. The hover and
the pressed move toward whichever pole leaves them room — away from the label while it has little to
spare, toward it once it stands at 10:1 — so every accent but pure black keeps a state you can see.
You can still set the label yourself; a derived name takes an override like any other.

**The edge of what floats is the boundary under a name of its own.** `--ui-color-border-overlay`
computes what `--ui-color-border` does, and is a second name because
[more contrast](#more-contrast) edges a dialog, a tip and a menu in the text while a control's
boundary stays where its floor put it. A formula reads grounds only, never another derived name, so
setting `--ui-color-border` leaves this one alone: set both to move both. A card's edge,
`--ui-color-border-raised`, is a third name for the same mix, because more contrast leaves it alone.

**A raised surface has a colour of its own**, `--ui-color-surface-raised`, and a filter it lays over
the page behind it, `--ui-backdrop-raised`: the card, the toast, the tip, the dialog and the open
menu read both. They are the surface and nothing until something sets them, which is how a theme
makes those five glass. Not an alpha on `--ui-color-surface`: every derivation mixes the surface, so
a translucent one would take the border, the muted text and the hover translucent with it.

## `formulas`

How each derived role computes when you have not set it.

```js
formulas['--ui-color-hover'];
// 'color-mix(in oklab, var(--ui-color-text, #1f2937) 16%, var(--ui-color-surface, #ffffff))'

formulas['--ui-duration-state'];
// 'var(--ui-duration-100, 150ms)'
```

| Token                          | Computes                                                          |
| ------------------------------ | ----------------------------------------------------------------- |
| `--ui-color-accent-contrast`   | white or black, whichever stands further from the accent          |
| `--ui-color-accent-hover`      | the accent, 12% of the way toward the pole it has room to move to |
| `--ui-color-accent-pressed`    | the accent, 22% of the way toward that pole                       |
| `--ui-color-hover`             | the surface, 16% of the way toward the text                       |
| `--ui-color-pressed`           | the surface, 26% of the way toward the text                       |
| `--ui-color-border`            | the surface, 50% of the way toward the text                       |
| `--ui-color-border-overlay`    | the same mix as `--ui-color-border`                               |
| `--ui-color-border-raised`     | the same mix again                                                |
| `--ui-color-text-invalid`      | the text                                                          |
| `--ui-color-text-muted`        | the surface, 65% of the way toward the text                       |
| `--ui-duration-state`          | the first step of the duration scale                              |
| `--ui-elevation-raised`        | the first step of the elevation scale                             |
| `--ui-elevation-control-hover` | the resting glow, `--ui-elevation-control`                        |
| `--ui-text-supporting`         | the first step of the type scale                                  |
| `--ui-color-surface-muted`     | the surface, 5% of the way toward the text                        |
| `--ui-color-surface-raised`    | the surface                                                       |

Each ground inside a formula carries its own default, and that is not decoration. A formula only
ever runs as the fallback of a name nobody declared — which is exactly the page that inserted no
`:root` block. A bare `var(--ui-color-text)` there is invalid at computed-value time and takes the
whole mix down with it, so the declaration would be dropped rather than fall back to anything.

Mixing toward the **text** rather than toward black or white is what makes one formula right in both
schemes: on a light page the colour darkens under the pointer, on a dark one it lightens, and the
contrast against the label rises either way.

**A formula is never declared at `:root`, and neither should yours be.** Written there it resolves
once, against the grounds in force at the root, and freezes — a dark subtree then inherits the light
mix, and a themed region inherits the untheme'd one. Components put it in the `var()` fallback at the
point of use instead, which is what makes a derived role follow a theme without being restated in it.

You rarely read this directly. It is exported because a target that is not CSS cannot evaluate
`color-mix()`, and has to resolve these itself — frozen per theme — from the same source the
components read. `reference()`, internal to this package, is what turns one into the CSS a component
writes.

## `darkScheme`

The grounds whose value differs when the page is rendered dark — a **partial** map, because most
tokens do not vary. A radius is a radius in either scheme; a surface is not.

```js
darkScheme['--ui-color-surface']; // '#111827'
darkScheme['--ui-radius']; // undefined
```

Seven entries today: `--ui-color-surface`, `--ui-color-text`, `--ui-color-accent` and the four
outcomes — `--ui-color-danger`, `--ui-color-success`, `--ui-color-warning` and `--ui-color-info`.
Each of those four is a mid-dark hue that reads on white and goes muddy on charcoal, so each is
inverted here for the same reason. `--ui-color-focus` is absent because one value
clears its contrast floor in both schemes, and `--ui-color-scrim` because dimming is dimming in
either — it is the one neutral here that does **not** follow the text, since mixing toward the text
would lighten the page behind a dialog on a dark one.

Only colours may appear here, and that is a rule rather than a coincidence: `light-dark()` takes
colours, so a dark value for `--ui-radius` would emit CSS the browser discards.

You rarely read this directly either — [`tokenStyleSheet()`](#tokenstylesheet) composes it into the
sheet. It is exported because a target that is not CSS cannot evaluate `light-dark()` and needs the
two values as data.

## `moreContrast`

The default palette's answer to `prefers-contrast: more`: each name it moves, with a light value and
a dark one.

```js
moreContrast['--ui-color-surface']; // ['#ffffff', '#000000']
moreContrast['--ui-color-danger']; // undefined
```

A pair rather than two maps, so a name cannot be given one scheme and forgotten in the other, and so
a target that is not CSS reads two values instead of parsing `light-dark()`. It names derived roles
as well as grounds — the states, which [More contrast](#more-contrast) says why it writes out.
[`tokenStyleSheet()`](#tokenstylesheet) composes it into the sheet.

## `tokenStyleSheet`

Every token as CSS, for a host that wants them without importing a component. Returns the text of a
`:root` block, the reduced-motion rule beside it and the answer to `prefers-contrast: more` after
both; the host inserts them however it prefers.

```js
tokenStyleSheet();
// ':root {
//   color-scheme: light dark;
//   --ui-color-accent: light-dark(#2563eb, #60a5fa);
//   --ui-radius: 0.375rem;
//   … }
//
// @media (prefers-reduced-motion: reduce) {
//   :root {
//     --ui-duration-100: 0.01ms;
//     --ui-duration-state: 0.01ms;
//   } }
//
// @media (prefers-contrast: more) {
//   :root {
//     --ui-color-accent: light-dark(#000000, #ffffff);
//     … } }'
```

A token with a dark value is emitted as a `light-dark()` pair; one without is emitted plain. The
`color-scheme` declaration rides along because it is a real property rather than a custom one, so it
can never be a token — and a dark scheme that depends on every host remembering to declare it is one
that mostly does not happen.

The two media rules are the only places a **derived** name is declared, and it is legal there
because what each declares is a literal rather than a formula. If you want a different `color-scheme`
— `only light`, say — declare it after this sheet.

## `Token`

The union of ground custom properties this package defines — useful for typing a partial override
map. The type stays exact rather than accepting any string: the set is open, and the type is what
catches `--ui-color-surfase`.

## `DerivedToken`

The union of the computed ones. `Token` and `DerivedToken` are deliberately separate: a derivation
is not a declaration, and only the first half has a value to look up.

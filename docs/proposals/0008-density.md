# RFC 0008 — Density

- **Scope**: library
- **Created**: 2026-11-11

## Motivation

A page that holds a lot — a back office's tables, a bar of filters, a form of thirty fields — wants
its controls closer together and smaller than this package draws them. There is one lever for it
today, `--ui-space`, and it is not a density. Brought down, it does take the controls from 40px to
32px, but it also narrows every tooltip and shortens every textarea, leaves the text as it was, and
cannot reach the checkbox, the switch or the radio, which already sit on their floor. And nothing
lets a page say _this region is dense_ and have every component in it answer.

## Study

### What the space token does alone, measured

Every padding and gap here is `--ui-space` multiplied, so the first question is how far the token
gets on its own. A scratch page of one of each component, in Chromium 153, with the token written
on the root:

| `--ui-space`                        | 0.5rem, today | 0.375rem | 0.25rem |
| ----------------------------------- | ------------- | -------- | ------- |
| button, input, select, menu trigger | 40px          | 36px     | 32px    |
| a table's row                       | 39px          | 35px     | 31px    |
| a card's padding                    | 16px          | 12px     | 8px     |
| a menu's item                       | 30px          | 28px     | 26px    |
| checkbox, switch, radio             | 24px          | 24px     | 24px    |
| a tooltip's ceiling                 | 320px         | 240px    | 160px   |
| a textarea's least height           | 80px          | 60px     | 40px    |
| the page, one of each component     | 939px         | 861px    | 797px   |

**The drawn controls do not move, and that is the floor working.** `src/checkbox.ts` and
`src/radio.ts` size the control `max(24px, space × 3)`, WCAG 2.2's 2.5.8 target size, and at the
default space that is the floor exactly. A compact page tightens their gaps and leaves the controls.

**Two of the measures are no density at all.** The tooltip's ceiling is in the space token on
purpose, so that it scales with everything else a host retunes, as `src/tooltip.ts` says beside it;
the textarea's least height is too. A host halving the token halves both.

### With the text a step smaller

The controls inherit their text from the page — `font: inherit`, with no token in between — so a
smaller text is written where they inherit it. The same page, with `font-size: 0.875em`, the type
scale's first step, on the element holding the components:

| `--ui-space`, with the text at 0.875em | 0.375rem | 0.25rem |
| -------------------------------------- | -------- | ------- |
| button, input, select, menu trigger    | 33px     | 29px    |
| a table's row                          | 32px     | 28px    |
| a menu's item                          | 25px     | 23px    |
| supporting text                        | 12.25px  | 12.25px |
| the page, one of each component        | 814px    | 744px   |

**At 0.25rem a menu's item is 23px, under 2.5.8's 24px**, and items in a menu sit one against the
next, so the standard's spacing exception does not save them. At 0.375rem it is 25px, the one value
of the two that keeps every target on the floor, and a page of the components is 13% shorter.

### Where the smaller text can be written

Three places, each measured with the space at 0.375rem:

| The size written on            | a button | a button in a card | the page's own `1rem` |
| ------------------------------ | -------- | ------------------ | --------------------- |
| the element holding the region | 14px     | 14px               | 16px                  |
| the root element               | 14px     | 14px               | 14px                  |
| every component's host         | 14px     | 12.25px            | 16px                  |

- **Once, on the region, is clean**: every component takes 14px, nested or not, and the page's own
  `rem` stays put.
- **On the root it moves `rem`**, which the space token itself is written in: the controls come to
  31.5px, and every length the host wrote in `rem` shrinks with them.
- **On every host it compounds** where components nest: a button in a card is two steps down.

### How others draw density

- **Material**, in `@material/density`: an interval of 4px, a scale that runs negative only and as
  far as each component allows, applied by the component's own density mixin — a button at `-3` is
  24px. [npm](https://cdn.jsdelivr.net/npm/@material/density@14.0.0/README.md)
- **FAST**: a control's height is `(baseHeightMultiplier + density) × designUnit`, with defaults of
  10, 0 and 4px, so 40px, and each step of `density` a design unit; the type ramp is apart from it,
  at 14px.
  [source](https://unpkg.com/@microsoft/fast-components@2.30.6/dist/esm/styles/size.js)
- **Ant Design**: `compactAlgorithm` builds its font tokens from the smaller size, `fontSizeSM`, and
  takes 4px off `controlHeight` — an algorithm a page picks, which combines with the dark one.
  [source](https://github.com/ant-design/ant-design/blob/master/components/theme/themes/compact/index.ts)
- **Carbon**: a data table's rows at 24, 32, 40, 48 and 64px, chosen by a size on the table, every
  one of them in 14px text.
  [style](https://carbondesignsystem.com/components/data-table/style/)

**Two families**: a size written on each component — Carbon's on the table, and Material's mixin on
each — and a context every component reads, FAST's token and Ant's algorithm. This package's tokens
already reach every shadow root by inheritance, the way a theme's do, so a context is within reach
without an attribute on each control.

### How a region reaches a shadow root

An attribute selector matches in the document, where the token sheet is, and the custom properties
it writes inherit into every shadow root below, as `data-ui-theme`'s do. `font-size` inherits the
same way, through the flat tree, so what a host slots into a card takes the region's size too.

## Proposed design

**`data-ui-density="compact"` on any element makes everything under it compact.** The default needs
no attribute, and there is one level.

What `tokenStyleSheet()` writes for it, under `:where()` so a host's own rule outweighs it, as a
taste's block does:

- **`--ui-space` at 0.375rem**, the one unit every component multiplies: 33px controls, 32px rows,
  25px menu items.
- **The text a step smaller, written once on the region**: the type scale's first step, 0.875em. A
  compact region inside another does not shrink again, and on the root element the size is written
  on `<body>` instead, so `rem` stays where it is.
- **Both through tokens of their own**, the compact space and the compact text, so a host retunes
  compact as it retunes the default.

What it leaves alone:

- **The drawn controls stay on their 24px floor**; their gaps tighten.
- **The tooltip's ceiling and the textarea's least height stay on the space token**, and come down
  by a quarter, half of which the smaller text takes back: a tip holds about 14% fewer characters a
  line. Taking them off the token would undo a choice `src/tooltip.ts` records, for a difference the
  study does not show to matter.
- **Themes, schemes and more contrast**, which are axes of their own.

**Your own text in a compact region shrinks with it**, unless you sized it in `rem` or `px`: the
size is written on the region, and your text inherits it as the components' does.

**A menu's item takes a floor of 24px**, which compact comes within a pixel of, so a host's own
compact space cannot take it under 2.5.8.

### Alternatives, and what retired each

- **Documenting `--ui-space` alone**: no smaller text, a tooltip at half its width once the space
  reaches the controls a compact page wants, and no way to make one region dense.
- **A size on each component**: written again on every control, where a dense page is a region.
- **Several levels, or a scale**: one level asked for; a second value is additive, and so is a
  value that makes a region inside a compact one comfortable again.
- **The text through a token each component applies**: it compounds wherever components nest.
- **The text on the root element**: it moves `rem`, the space token's own unit.
- **The space at 0.25rem**: a menu's item comes to 23px.

## Decision

**Accepted** on 2026-11-11, on the three questions the shape turned on:

1. **It is chosen by an attribute on an ancestor**, `data-ui-density="compact"`, which reaches every
   component under it.
2. **It changes the space, the heights and the text**.
3. **It has one level.**

The study settled the rest: the space at 0.375rem, the text at the type scale's first step, written
once on the region and never on the root, and a floor of 24px for a menu's item.

## Rollout

1. **The density**, in one pull request: the block and its two tokens in `tokenStyleSheet()`, the
   floor on a menu's item, a test per component of its height under compact, of the floor, of a
   region nested in another and of the root; the workbench's Options tab and the playground's
   toolbar gaining a density, `docs/tokens.md` and ARCHITECTURE.md describing the axis. The index
   marks this proposal `Implemented` in the same pull request.

## Related

- [RFC 0002](0002-the-visual-language.md), which keeps every space a multiple of one unit.
- [RFC 0003](0003-themes.md), whose two axes this proposal adds a third to.

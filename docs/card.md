# UiCard

[← Reference](README.md)

A container: a surface with a boundary, a corner and a lift.

```js
import '@rak200/ui';
```

## Contents

- [`<ui-card>`](#ui-card)
- [Slots](#slots)
- [It is not a button](#it-is-not-a-button)
- [It claims no role](#it-claims-no-role)
- [A row of cards](#a-row-of-cards)
- [Styling](#styling)

## `<ui-card>`

```html
<ui-card>
  <h3 slot="header">Monthly plan</h3>
  <p>Everything in the free tier, plus priority support.</p>
  <div slot="footer"><ui-button>Choose</ui-button></div>
</ui-card>
```

Presentational, with no behaviour and no state. The class is exported as `UiCard` for a host that
needs the type; importing the package registers the element, so nothing has to be called.

## Slots

| Slot      | Holds                                         |
| --------- | --------------------------------------------- |
| `header`  | the top region — a heading, usually           |
| _default_ | the body: everything with no `slot` attribute |
| `footer`  | the bottom region — actions, usually          |

**Three, and no more.** A card with more regions than that is a layout, and a layout is the host's.

**The regions render in the order this element declares them**, whatever order you wrote them in —
which is the first of the two things a named slot buys here. The second is the alignment below.

**An unfilled region costs nothing.** A `<slot>` is `display: contents`, so it contributes no box:
a card with no footer has no empty row at the bottom and no gap where one would have been. Nothing
in this element has to know whether you filled a slot, because nothing draws a region — it draws
the card, and your elements sit in it.

## It is not a button

**A clickable card is a button or a link.** This element grows no `clickable` attribute, and the
reason is what such an attribute would have to do first: reimplement keyboard activation, the
accessible name, the focus ring and the disabled semantics that `<button>` and `<a>` carry already —
and get one of them wrong, which is how a card ends up mouse-only.

Put the interactive element **inside**, over the part that is actually the target:

```html
<ui-card>
  <h3 slot="header"><a href="/plans/monthly">Monthly plan</a></h3>
  <p>Everything in the free tier, plus priority support.</p>
</ui-card>
```

If the whole card must be clickable, that is one link wrapping the content — yours to write, and
yours to give an accessible name that says where it goes.

## It claims no role

There is no card element to delegate to and no APG pattern for one, so the shadow root renders
slots and nothing else. What the card _means_ is yours to say:

- a heading in the `header` slot gives it a name and a place in the document outline;
- `<article>` around it, or `role` on it, when the content really is self-contained.

A role invented here would be one every consumer inherits and none of them chose.

## A row of cards

```html
<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem">
  <ui-card>…</ui-card>
  <ui-card>…</ui-card>
  <ui-card>…</ui-card>
</div>
```

The card is a flex column, and **the footer is pushed to the bottom of whatever height it was
given** — so a row of cards with bodies of different lengths still lines its buttons up. That is
the one thing the `footer` slot buys that writing the element last does not.

The card takes the width it is given. It sets no `max-inline-size` of its own: how wide a card is
belongs to the layout around it, not to the card.

## Styling

Every value is a [token](tokens.md); nothing here is hardcoded.

| Part                                 | Token                   |
| ------------------------------------ | ----------------------- |
| padding, and the gap between regions | `--ui-space` × 2        |
| surface                              | `--ui-color-surface`    |
| text                                 | `--ui-color-text`       |
| boundary                             | `--ui-color-border`     |
| corner                               | `--ui-radius`           |
| lift                                 | `--ui-elevation-raised` |
| font                                 | `--ui-font`             |

**The boundary and the shadow are one decision made twice**, and each covers where the other cannot.
The shadow says _raised_ on a light page and nearly nothing on a dark one — it is black at a low
alpha, and `light-dark()` cannot carry a second value for it, because it takes colours and a shadow
is not one. The boundary is derived, so it mixes toward the text and is correct in both schemes by
construction. Drop either and the card loses its edge in one scheme.

**The surface and the text colour are set as a pair**, never half of it: a surface declared without
the colour chosen against it inherits whatever the page set, and the contrast the token layer
measured stops holding at the one place it was measured for.

**The lift is read through a purpose, not a step.** Components read `--ui-elevation-raised`; the
value lives in `--ui-elevation-100`, the first step of the scale. Flatten every card by setting the
role:

```css
ui-card {
  --ui-elevation-raised: none;
}
```

`::part()` is not exposed. There is nothing in the shadow root to aim it at — the regions are your
own elements, in your own tree, so they are styleable directly.

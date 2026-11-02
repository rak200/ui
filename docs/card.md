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
- [Motion](#motion)
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

## Motion

**A card answers the pointer and a focus on something it holds**, in RFC 0004's motion, and where you
choose nothing the theme's taste runs. Under the default theme's:

- under the pointer it rises: the theme's lift drawn again, with a drop under it, faded in over
  `--ui-duration-effect`;
- while a focus the reader can see is on something it holds — a button in its footer — it rises the
  same way and lifts a quarter rem, and the pointer resting on it changes nothing.

A focus a click left is not one the reader sees, and changes nothing. Each rise is drawn on a layer of
its own in the card's shadow root, an empty span that means nothing. The lift moves the card itself,
which a container query asks the card's surroundings about, never the card: **a choice written on
the one card alone does not reach the lift**, where one written on anything round it does — RFC
0004's S8, which the card leaves marked. Under `prefers-reduced-motion: reduce` each lands at once.

**Under [Matrix](theme.md#matrix)** a card takes a tint under the pointer, a little of the accent in
its own fill, and glows, a light of the accent round it; at a focus it holds it takes the tint and a
burst of light, and does not lift. The tint holds the card's text and muted text at 4.5:1 in every
shipped palette. **A fill lies under the card's content, and so does a light held inside its
boundary, and that isolates the card**: the layer each is drawn on stays over the card's own fill
only in a stacking context of the card's, and in one anything the card holds with a `z-index` of its
own — a dropdown that is no popover — stops stacking over what follows the card. So the card is
isolated only where one of them is chosen, under Matrix and Glass, whose glass isolates it already;
the default theme leaves it as it was. The isolation is drawn on the card itself, so S8 reaches it
too: a fill chosen on the one card alone, and not round it, lies behind the card's own and does not
show.

**Under [Glass](theme.md#glass)** a card takes its tint where the pointer is, casts its shadow away
from the pointer, lights a band along its boundary nearest it, and leans toward it, five degrees at
most each way, over `--ui-duration-follow` — each as strong as the pointer is near, so they fade as
it moves off the card. At a focus it holds, its tint sweeps across it, `--ui-iteration-settle`
rounds of `--ui-duration-loop`, and a light of the accent holds along its inside; it neither lifts
nor leans. **The sweep is the card's tint rather than a button's sheen**: the accent a button sweeps
took the card's muted text to 1.97:1 at its peak, and a field's answer, a halo round its text, would
be inherited by everything the card holds and ring a light label on a fill of its own in the card's
colour. Over the tint the card's text and muted text hold 4.5:1 in every shipped palette.

The lights that follow the pointer, and the lean, read where it is from an internal engine, bound to
the card's `pointerover`, which follows nothing under reduced motion or for a pointer that cannot
hover. The lean is a transform on the card itself, which makes the card a stacking context and the
box what it holds that is fixed is placed in, as Glass's glass does already. The engine is handed its
time on the card itself too, so S8 reaches the lights: chosen on the one card alone, and not round
it, none of them is followed, and none shows.

The effects are drawn by one internal sheet, `surfaceEffects()` in `src/effects.ts`. The card is
marked by two internal helpers in `src/held.ts`, `held()` bound to its `focusin` and `released()` to
its `focusout`, since no selector reads a focus the reader can see in what a host holds in every
engine, and followed by `follow()` in `src/pointer.ts`, bound to its `pointerover`.

## Styling

Every value is a [token](tokens.md); nothing here is hardcoded.

| Part                                 | Token                                                                   |
| ------------------------------------ | ----------------------------------------------------------------------- |
| padding, and the gap between regions | `--ui-space` × 2                                                        |
| surface                              | `--ui-color-surface-raised`, the surface unless set                     |
| what it does to the page behind      | `--ui-backdrop-raised`, nothing unless set                              |
| text                                 | `--ui-color-text`                                                       |
| boundary                             | `--ui-color-border-raised`, the boundary's mix unless set               |
| corner                               | `--ui-radius`                                                           |
| lift                                 | `--ui-elevation-raised`, lit in the accent if written in `currentColor` |
| font                                 | `--ui-font`                                                             |

**The boundary and the shadow are one decision made twice**, and each covers where the other cannot.
The shadow says _raised_ on a light page and nearly nothing on a dark one: the default's is black at
a low alpha in both schemes. Only a shadow's colour can follow the scheme, as a `light-dark()` pair
inside it — [`matrix`](theme.md#matrix) and [`glass`](theme.md#glass) write theirs that way — and
the default writes one colour. The boundary is derived, so it mixes toward the text and is correct
in both schemes by construction. Drop either and the card loses its edge in one scheme.

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

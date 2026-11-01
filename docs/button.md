# UiButton

[← Reference](README.md)

A button.

```js
import '@rak200/ui';
```

## Contents

- [`<ui-button>`](#ui-button)
- [`variant`](#variant)
- [`disabled`](#disabled)
- [`ButtonVariant`](#buttonvariant)
- [Supplementary text](#supplementary-text)
- [Interaction states](#interaction-states)
- [Motion](#motion)
- [Styling](#styling)

## `<ui-button>`

```html
<ui-button>Save</ui-button>
```

The element delegates to a real `<button>` inside its shadow root rather than reimplementing one.
That is the whole design: keyboard activation, the accessible name taken from the slotted content,
the disabled semantics and the focus behaviour stay the platform's job. A `<div role="button">`
would need every one of them written by hand, and would get one of them wrong.

The class is exported as `UiButton` for a host that needs the type; importing the package
registers the element, so nothing has to be called.

Every state below is asserted against [axe](https://github.com/dequelabs/axe-core) in the suite,
for WCAG A/AA, inside the real browser it renders in — including through the shadow root, which is
where a check that stops at the host silently passes.

## `variant`

```html
<ui-button variant="secondary">Cancel</ui-button>
```

How much visual weight the button carries — `primary` (the default) or `secondary`. Reflected, so
it can be read back from the attribute and selected on in CSS.

**A primary button is filled with its own four names**: `--ui-color-primary`, its label
`--ui-color-primary-contrast`, and `--ui-color-primary-hover` and `--ui-color-primary-pressed`. Each
computes what the accent's own does, from `--ui-color-accent`, so moving the accent moves the button.
Overriding the accent's label or its states does not reach the button; set the primary's too. A
theme can fill the button apart from the checked controls, which is what [Glass](theme.md#glass)
does. A secondary button is the surface and the text.

## `disabled`

```html
<ui-button disabled>Unavailable</ui-button>
```

Whether the button rejects interaction. It sets `disabled` on the inner `<button>`, which is what
actually stops the click and removes it from the tab order — the attribute on the host is reflected
so a host stylesheet can select on it.

## `ButtonVariant`

The union of accepted `variant` values: `'primary' | 'secondary'`.

## Supplementary text

Wrap it in a [`<ui-tooltip>`](tooltip.md) and write the sentence once, where you already write it:

```html
<ui-tooltip>
  <ui-button>Save</ui-button>
  <span slot="tip">Saves without closing the dialog.</span>
</ui-tooltip>
```

The tooltip cannot point at anything in this element's shadow root — an IDREF resolves in one tree
scope — so it **hands the text over** and `<ui-button>` renders it into its own root, where its
`<button>` can be described by it. Nothing at the call site says so, and there is no attribute or
property to write: the sentence lives in the tip, and editing the tip changes what is announced.

The copy in here is **not painted**, because the tip is already showing it. Take the tip away and
the description goes with it.

## Interaction states

The button answers a pointer, and every colour it answers with comes from the
[tokens](tokens.md):

| State            | What moves                                                               |
| ---------------- | ------------------------------------------------------------------------ |
| Hover            | the background, over `--ui-duration-state` and along `--ui-easing-state` |
| Pressed          | the background again, further, and **with no transition at all**         |
| Focus (keyboard) | a 2px `--ui-color-focus` ring, immediately                               |
| Disabled         | nothing — a disabled button takes a pointer and does not respond to it   |

**Its edge is drawn on a layer of its own**, in `--ui-color-border-button` — the variant's colour by
default, the text on a secondary button and nothing on a primary — with `--ui-elevation-button`, a
lift a theme gives it, on the same layer. The layer lies under the label and over the fill, so what
a fill effect draws on it lights the button's fill and never its label. Under the pointer the edge goes to
`--ui-color-border-button-hover`, which is the resting edge until a theme gives the pointer its own.
A secondary button is filled with `--ui-color-surface-control`, the fill every control takes.

**A theme can light a button as well**, through `--ui-elevation-control` at rest and
`--ui-elevation-control-hover` under the pointer, both drawn in the accent on a layer over the
button — the second where nothing is chosen for the pointer's shadow, as [Motion](#motion) says.
Both are `none` in the default palette, and a disabled button lights nothing — see
[tokens](tokens.md#a-shadow-written-in-currentcolor-is-lit-in-its-elements-colour).

Three of those are deliberate rather than incidental. The pressed colour lands instantly because a
click is over in about 100ms, so a 150ms transition would finish after the finger has left and the
state would never be seen. The focus ring is left out of the transition for the same kind of reason
in reverse: delaying the affordance that says _this is where you are_ is the opposite of what it
exists for. And the hover and pressed rules are guarded with `:not(:disabled)`, because a disabled
button still matches `:hover` and `:active` — without the guard it would light up under a pointer
that cannot activate it.

**A press is never the only feedback.** Activating with <kbd>Enter</kbd> produces no `:active` at
all, which is why the focus ring and the action itself carry the interaction for a keyboard user.

To retune the motion, set the purpose rather than the step:

```css
ui-button {
  --ui-duration-state: 300ms;
}
```

Under `prefers-reduced-motion: reduce` every duration collapses in the token sheet, and this
component never learns why.

## Motion

The button answers the pointer, the focus and a press with an **effect**, and which effect runs is
yours to choose — RFC 0004. Each moment comes by kind, a custom property apiece, and its value is
the effect's name:

| Property                   | Effect      | What it draws                                             |
| -------------------------- | ----------- | --------------------------------------------------------- |
| `--ui-motion-hover-fill`   | `tint`      | a little of the accent in the fill, under the pointer     |
| `--ui-motion-hover-fill`   | `spotlight` | a light where the pointer is, as strong as it is near     |
| `--ui-motion-hover-shadow` | `raise`     | a drop shadow under the pointer                           |
| `--ui-motion-hover-shadow` | `glow`      | a light of the accent round the button, under the pointer |
| `--ui-motion-hover-shadow` | `cast`      | a shadow cast away from the pointer, as near as it is     |
| `--ui-motion-hover-border` | `edge`      | a band lit along the edge nearest the pointer             |
| `--ui-motion-focus-fill`   | `highlight` | the hover colour, while the focus stays                   |
| `--ui-motion-focus-fill`   | `shimmer`   | a sheen swept across it four times, at the focus          |
| `--ui-motion-focus-shadow` | `raise`     | the same drop, while the focus stays                      |
| `--ui-motion-focus-shadow` | `burst`     | light bursting out round the button as the focus arrives  |
| `--ui-motion-focus-shadow` | `inner`     | a light along the inside of its edge, at the focus        |
| `--ui-motion-focus-move`   | `lift`      | two pixels up, the focus ring with it                     |
| `--ui-motion-focus-ring`   | `glide`     | the ring glided over from the control seen last           |
| `--ui-motion-focus-ring`   | `glitch`    | the ring shaken and split in two as the focus arrives     |
| `--ui-motion-focus-ring`   | `refocus`   | the ring out of a blur as the focus arrives, and into one |
| `--ui-motion-press-fill`   | `ripple`    | a circle spread once from where it was pressed, fading    |
| `--ui-motion-press-move`   | `squish`    | squeezed to 96%, springing back once let go               |
| `--ui-motion-press-move`   | `shatter`   | broken into pieces where it was pressed, until let go     |
| `--ui-motion-press-move`   | `spring`    | pressed to 90%, let go on a spring past its rest          |
| `--ui-motion-press-shadow` | `sink`      | its shadow sunk inside, as if pressed into the page       |

**Where you choose nothing, the theme's taste runs.** The default theme's — the
[`taste`](tokens.md#taste) the token sheet carries — raises the button under the pointer and at the
focus, lifts it at the focus, glides the ring over and squeezes and sinks it under a press. Under
[Matrix](theme.md#matrix) the button tints and glows under the pointer, takes its hover colour and a
burst at the focus without lifting, its ring glitching there, and shatters under a press, with
neither a colour nor a sinking shadow. Under [Glass](theme.md#glass) it takes a light, a shadow
and a band that follow the pointer, keeps a light along its inside at the focus without lifting, a
sheen sweeping across it and its ring coming into focus there, and a press springs it back and
spreads a circle from where it landed, with no colour of its own.

A choice is inherited, so it reaches as far as the selector it is written under: the page, a region,
every button, or one. A name the button does not offer draws nothing, and the button does what it
does today there.

**`none` is nothing.** Where the button answered a moment with nothing before effects existed —
every move, the ring's flight, the focus's fill, a press's shadow — `none` keeps it as it was. Where
it answered with something of its own, `none` takes that away: the hover colour under the pointer
(`hover-fill`), the pressed colour under a press (`press-fill`), a theme's glow under the pointer
(`hover-shadow`), which Matrix alone lights, and a theme's edge under the pointer
(`hover-border`), which Glass alone draws. `highlight` names what the button did there, and brings
it back:

```css
/* No movement under a press, on every button. */
ui-button {
  --ui-motion-press-move: none;
}

/* The pressed colour back, under Matrix. */
[data-ui-theme='matrix'] ui-button {
  --ui-motion-press-fill: highlight;
}
```

**The focus wins.** A button the reader can see the focus on is drawn as the focus chose, and the
pointer resting on it changes nothing the focus chose for, since a reader who came by the keyboard
may have left the pointer where it was. **A press is drawn over both**, and lands at once, as the
pressed colour does; letting go runs each effect back, the squeeze along `--ui-easing-emphasis`,
which springs past its rest. The shadow under the pointer is drawn only where the pointer can hover,
so a tap on a touch screen leaves none behind. A disabled button draws no effect.

**A theme's glow under the pointer is that moment's answer from before effects existed**, so any
choice for the pointer's shadow takes its place and the glow the button rests with stays: under
Matrix the button glows in the accent rather than its ring going solid. At the focus, a choice for
the focus's shadow does the same.

**The tint is held light** in the light scheme, so the label keeps the contrast the hover colour's
darkening would have spent, and it stays at least 0.6 opaque over a fill a theme lets the page
through. A primary's fill is the accent already, so its tint is the hover colour it goes to anyway.

**The inner light is the accent's**, a line along the inside of the edge and its light from it.
Over the primary's fill, which is the accent already, the accent is moved two fifths toward the
label, which stands off that fill.

**The spotlight, the cast and the edge follow the pointer.** One listener on the page hands the
button where the pointer is, a frame at a time, from the moment the pointer comes over it until it
is 96px away, the lights fading out over that distance. The spotlight is a light 4rem across where
the pointer is, on the layer under the label, in the shimmer's light at a quarter of its strength, so
the label keeps its 4.5:1 under it; it takes the hover colour's place. The cast is a shadow on the
button that falls away from the pointer, and on a dark page the accent spills round the side the
pointer is on. The edge is a band 2px wide on the edge, lit where the pointer is nearest, on a layer
of its own so the band can be cut to the edge; it takes the place of the edge a theme gives the
pointer. All three follow only where the pointer can hover and the button can be used, never under
reduced motion, and the focus wins over all three. The button binds one internal helper,
`follow()` in `src/pointer.ts`, to its `pointerover`.

**The shimmer is a sheen swept across the button**, ten degrees off upright and three quarters as
wide as the button, four rounds of `--ui-duration-loop` and then at rest before the start: a focus
can rest for minutes, and four rounds stay inside the five seconds a loop that settles keeps to. It
is drawn on the layer under the label, in the accent with a fifth of the pole further from the
label mixed in, at half strength, so the label keeps 4.5:1 at the sheen's peak on every palette.
One internal helper reads that pole, `farPole()` in `src/tokens.ts`, as the accent's own label is
read.

**The burst is an animation**: it starts each time the reader sees the focus arrive, plays out on its
own and leaves nothing behind while the focus stays. Only the light round the button moves, so the
label keeps its contrast throughout.

**The glide, the glitch and the refocus are flown by a ring of the page's own.** An outline is drawn round its
own element and moves only with it, so a ring that leaves one control and lands on the button, or
jumps about the button's own, is a popover laid in the top layer: it takes the button's outline,
width and colour, follows the button frame by frame — lifting with it — and hides as it lands, where
the button's own outline is back. It is `aria-hidden` and takes no pointer, and it is styled on
itself, so your page needs no sheet for it. The glide starts where the ring the reader saw last was,
and leaves only from a ring the reader saw, for where the focus went: a click, a script's focus or
the page's first focus brings the ring at once. The glitch starts on the button's own ring, wherever
the focus came from, jumps a pixel or three each way about every twelfth of its time, and splits
three times into two lines thrown 3px either way, in `--ui-color-danger` and `--ui-color-info`. The
refocus starts on the button's own ring too, out of a 3px blur, and as the focus leaves it blurs away
on a second ring, fading over the second half, while the next control's ring may be coming into
focus; both take a quarter again `--ui-duration-effect`, on `--ui-easing-enter` and
`--ui-easing-exit`. The button binds one internal helper, `arrive()` in `src/ring.ts`, to its focus,
and calls `watch()` as it connects, so the ring seen before its first focus is already recorded.

**The shatter is a filter over the button**, which no sheet can draw: it cuts the button as it is
drawn into a dozen or so pieces, smallest where the pointer struck it — the middle, for Space — and
holds each a couple of pixels off until the press is let go, when they go back together. Only what
the button draws solid breaks, so a theme's glow stays whole under the pieces, and through the
cracks shows whatever is under the button. The filter goes in the button's own shadow root and is
gone once the pieces are together. It answers what the squeeze and the sink answer: a pointer's
primary button and Space, held until the pointer comes up or Space does or the focus leaves; Enter,
which makes no `:active`, breaks nothing. The button binds one internal helper, `press()` in
`src/shatter.ts`, to its `pointerdown` and its `keydown`.

**The ripple is a circle spread once from where the button was pressed** — the middle, for Space and
for Enter — out to its farthest corner, in the shimmer's light at a third of its strength as it
starts and faded to nothing as it gets there. A click is over in about 100ms, so the circle starts as
the press lands and plays out on its own, and it takes the pressed colour's place. It is drawn on
the layer under the label: over the spotlight, whose light and the circle's stay inside the sheen's
strength together, and in the shimmer's place while it spreads, the sweep running on underneath, so
the label keeps its 4.5:1 throughout. Enter, which makes no `:active`, ripples all the same, as the
reader pressing the button; a key held down spreads one circle. The button binds one internal
helper, `spread()` in `src/ripple.ts`, to its `pointerdown` and its `keydown`, beside the shatter's.

Each effect moves over `--ui-duration-effect`, the shatter's pieces going back along
`--ui-easing-move`; the glide over `--ui-duration-travel` along `--ui-easing-move`; the burst, the
glitch, the ripple and the spring a press lets go on over `--ui-duration-flourish`, the ripple along
`--ui-easing-enter` and the spring along a curve of its own; and the shimmer over
`--ui-duration-loop`, `--ui-iteration-settle` rounds of it. All of them collapse with every other
duration under `prefers-reduced-motion: reduce`: the button still rises, lifts and sinks, at once,
the ring does not fly, no burst shows, no circle spreads and nothing breaks. Nor does the ring fly or
the burst show in forced colours. An engine without
container style queries — Firefox before 151, inside the
[browser floor](../ARCHITECTURE.md#the-browser-floor) — matches no effect, and the button does what
it did before effects existed.

**Every effect here is drawn by one internal sheet**, `buttonEffects()` in `src/effects.ts`, which
the button adopts after its own, built under the button's taste name. The shatter's `press()` and
the ripple's `spread()` reach the button through one listener from the same module, `pressed()`.

## Styling

The inner button is exposed as a **part**, so a host can reach it without piercing the shadow root
blindly:

```css
ui-button::part(button) {
  text-transform: uppercase;
}
```

For colour, radius, spacing and the focus ring, prefer the [tokens](tokens.md) — they restyle every
component at once instead of one selector at a time.

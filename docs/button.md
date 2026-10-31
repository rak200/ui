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
lift a theme gives it, on the same layer. Under the pointer the edge goes to
`--ui-color-border-button-hover`, which is the resting edge until a theme gives the pointer its own.
A secondary button is filled with `--ui-color-surface-control`, the fill every control takes.

**A theme can light a button as well**, through `--ui-elevation-control` at rest and
`--ui-elevation-control-hover` under the pointer, both drawn in the accent on a layer over the
button. Both are `none` in the default palette, and a disabled button lights nothing — see
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

| Property                   | Effects the button offers | What it draws                                       |
| -------------------------- | ------------------------- | --------------------------------------------------- |
| `--ui-motion-hover-shadow` | `raise`                   | a drop shadow under the pointer                     |
| `--ui-motion-focus-shadow` | `raise`                   | the same drop, while the focus stays                |
| `--ui-motion-focus-move`   | `lift`                    | two pixels up, the focus ring with it               |
| `--ui-motion-focus-ring`   | `glide`                   | the ring glided over from the control seen last     |
| `--ui-motion-press-move`   | `squish`                  | squeezed to 96%, springing back once let go         |
| `--ui-motion-press-shadow` | `sink`                    | its shadow sunk inside, as if pressed into the page |

**Where you choose nothing, the theme's taste runs**, and the default theme's — the
[`taste`](tokens.md#taste) the token sheet carries — names every effect above. So a page that
inserts the sheet gets them all, and `none` keeps the button as it was for one moment:

```css
/* No movement under a press, on every button. */
ui-button {
  --ui-motion-press-move: none;
}
```

A choice is inherited, so it reaches as far as the selector it is written under: the page, a region,
every button, or one. A name the button does not offer draws nothing, and the button does what it
does today there.

**The focus wins.** A button the reader can see the focus on is drawn as the focus chose, and the
pointer resting on it changes nothing, since a reader who came by the keyboard may have left the
pointer where it was. **A press is drawn over both**, and lands at once, as the pressed colour does;
letting go runs each effect back, the squeeze along `--ui-easing-emphasis`, which springs past its
rest. The shadow under the pointer is drawn only where the pointer can hover, so a tap on a touch
screen leaves none behind. A disabled button draws no effect.

**The glide is flown by a ring of the page's own.** An outline is drawn round its own element and
moves only with it, so a ring that leaves one control and lands on the button is a popover laid in
the top layer: it takes the button's outline, width and colour, starts where the ring the reader saw
last was, follows the button frame by frame — lifting with it — and hides as it lands, where the
button's own outline is back. It is `aria-hidden` and takes no pointer, and it is styled on itself,
so your page needs no sheet for it. It leaves only from a ring the reader saw, for where the focus
went: a click, a script's focus or the page's first focus brings the ring at once. The button binds
one internal helper, `arrive()` in `src/ring.ts`, to its focus, and calls `watch()` as it connects,
so the ring seen before its first focus is already recorded.

Each effect moves over `--ui-duration-effect`, and the glide over `--ui-duration-travel` along
`--ui-easing-move`, and both collapse with every other duration under
`prefers-reduced-motion: reduce`: the button still rises, lifts and sinks, at once, and the ring
does not fly. Nor does it in forced colours. An engine without container style queries — Firefox
before 151, inside the [browser floor](../ARCHITECTURE.md#the-browser-floor) — matches no effect,
and the button does what it did before effects existed.

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

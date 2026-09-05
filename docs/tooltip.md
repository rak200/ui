# UiTooltip

[← Reference](README.md)

Supplementary text on hover and on keyboard focus.

```js
import '@rak200/ui';
```

## Contents

- [`<ui-tooltip>`](#ui-tooltip)
- [Slots](#slots)
- [The trigger has to be focusable, and in your tree](#the-trigger-has-to-be-focusable-and-in-your-tree)
- [What it shows and what dismisses it](#what-it-shows-and-what-dismisses-it)
- [Touch](#touch)
- [Where it lands, and who put it there](#where-it-lands-and-who-put-it-there)
- [Inside a field](#inside-a-field)
- [Styling](#styling)

## `<ui-tooltip>`

```html
<ui-tooltip>
  <button type="button">Save</button>
  <span slot="tip">Saves without closing the dialog.</span>
</ui-tooltip>
```

A wrapper around a trigger you wrote and a tip you wrote. It lays nothing out — `display: contents`,
so wrapping a control does not move it — and it owns four things: the popover, the description, when
the tip appears, and where it lands.

The class is exported as `UiTooltip` for a host that needs the type; importing the package registers
the element, so nothing has to be called.

## Slots

| Slot      | Holds                                                              |
| --------- | ------------------------------------------------------------------ |
| _default_ | the trigger: the one child carrying no `slot` attribute            |
| `tip`     | the text — the element becomes a popover and gets `role="tooltip"` |

**Both stay in your tree.** An IDREF does not cross a shadow boundary, so a tip rendered inside this
element's shadow root could not be the target of the trigger's `aria-describedby` — the same measured
constraint that shapes [`<ui-field>`](field.md) and [`<ui-input>`](input.md).

What the element writes on your tip: an `id` (only if it has none), `role="tooltip"` (only if you
wrote no role), `popover="manual"`, and a `data-side` saying which way it was placed. What it writes
on your trigger: `aria-describedby`, **added to** whatever was already there rather than replacing it.

## The trigger has to be focusable, and in your tree

**A tooltip describes the element the browser actually focuses.** So the trigger should be a native
focusable element — `<button>`, `<a href>`, an `<input>` — or something you made focusable yourself.

**`<ui-button>` is the one trigger whose description does not arrive.** Its `<button>` lives in a
shadow root, and an IDREF does not cross that boundary in either direction: measured, an element
inside a shadow root cannot resolve an id in the document, and an `aria-describedby` on the host is
on a different node than the one a screen reader reads when focus lands. The tip still appears and
still positions itself; what is lost is the announcement. Where the text has to be announced, write a
native `<button>` — and where it does not, the tip is decoration and should not be the only place the
information exists anyway.

**Never make the tip the only place information exists.** A tooltip is supplementary by definition:
anything a person must have in order to complete the task belongs in the page, not behind a hover.

## What it shows and what dismisses it

|          |                                                              |
| -------- | ------------------------------------------------------------ |
| shows on | pointer entering the trigger, and keyboard focus reaching it |
| hides on | the pointer leaving, focus leaving, and **Escape**           |

WCAG 2.2's **1.4.13 Content on Hover or Focus** asks for three things, and the shape of the component
answers all three:

- **Dismissible** — Escape closes it without moving your focus. The tip is a `popover="manual"`,
  which is deliberate: an `auto` popover light-dismisses, and dismissing one closes the others, so a
  tooltip appearing over an open menu would close the menu. What `manual` costs is Escape, which it
  does not handle — measured — so this element wires it.
- **Hoverable** — the pointer can travel onto the tip and it stays open, because the tip is a DOM
  child of `<ui-tooltip>`: moving into it never leaves the element that is listening. The gap between
  trigger and tip is `--ui-space` ÷ 2, small enough that a pointer crossing it does not leave first.
- **Persistent** — no timer closes it. It stays until you leave it or dismiss it.

There is no delay before it opens and no fade. A tooltip is information asked for; a transition is a
delay in delivering it.

## Touch

**There is no hover on a touch screen, and this is documented rather than emulated.** A tap fires a
pointer event and then focus, so a tooltip that answered both would appear, be dismissed by the tap,
and appear again. The element ignores a pointer whose `pointerType` is `touch` and lets focus do the
work — so on a touch device the tip appears when the trigger is focused, which is what tapping a
button does.

That is a real limitation, not a solved problem: content only reachable by hovering is content a
touch user may never see. See the rule above about the tip never being the only place.

## Where it lands, and who put it there

The tip is a **popover**, so the platform promotes it to the top layer: it escapes `overflow: hidden`
and every stacking context above it, and there is no `z-index` anywhere in this component to tune.

**The placement is this package's, and that is a decision rather than an omission.** It goes above
the trigger, flips below when there is no room, and is pulled back inside the viewport at either edge.

CSS anchor positioning would do all of it, and in the engine this package's suite measures it is
entirely present — `anchor-name`, `position-anchor`, `position-area` and `position-try-fallbacks` all
work, and an anchored popover really is placed against its anchor. It is still not adopted, for the
reason [`<ui-select>`](select.md) gives about `appearance: base-select`: a feature one engine has
makes a kit look like two kits.

Here the difference is not cosmetic. Measured: a popover whose anchor rules are ignored is
`position: fixed` at `inset: 0` — the corner of the screen, not near the trigger. And the flip at a
viewport edge _is_ `position-try-fallbacks`, so an engine without it needs the script regardless.
Adopting the CSS would mean writing the placement **and** a second code path for it.

A positioning dependency was the other option. It solves scroll containers, virtual anchors and
continuous auto-update — none of which a tooltip against a real element needs — and it would be this
package's second runtime dependency. When anchor positioning is broadly available it replaces the
script, and the tests stay: they assert where the tip lands, not who put it there.

## Inside a field

```html
<ui-field>
  <label slot="label">Amount</label>
  <ui-tooltip>
    <input type="number" name="amount" />
    <span slot="tip">Two decimals, in BRL.</span>
  </ui-tooltip>
  <span slot="help">Excluding tax.</span>
</ui-field>
```

Both components write `aria-describedby` on the same control, and both keep what the other wrote:
the tooltip adds its id to the list, and [`<ui-field>`](field.md) carries forward any id it did not
generate when it rebuilds it. Prefer the field's `help` slot for anything a person needs before they
start typing — a tooltip is for what they might want, not what they must have.

## Styling

Every value is a [token](tokens.md); nothing here is hardcoded.

| Part                 | Token                                  |
| -------------------- | -------------------------------------- |
| padding              | `--ui-space` ÷ 2 and `--ui-space`      |
| gap from the trigger | `--ui-space` ÷ 2                       |
| maximum width        | `--ui-space` × 40                      |
| surface              | `--ui-color-surface`                   |
| text                 | `--ui-color-text`                      |
| boundary             | `--ui-color-border`                    |
| corner               | `--ui-radius`                          |
| lift                 | `--ui-elevation-raised`                |
| font                 | `--ui-font`, at `--ui-text-supporting` |

**It is a small raised surface rather than an inverted one.** A dark bubble on a light page is the
convention, and it would need a colour pair no other component in this kit uses — a category invented
for one component, which is what the token layer's schedule exists to prevent. Surface, boundary and
lift were all already here.

**The maximum width is a ceiling, not a width.** The tip is `max-content` up to it: a phrase stays on
one line, and a sentence wraps at a readable measure rather than at whatever the trigger happens to
be near.

The `data-side` attribute is written on your tip and says which way it went — `block-start` or
`block-end` — so a host that wants an arrow, or a different gap, has something to select on.

`::part()` is not exposed. There is nothing in the shadow root to aim it at: the trigger and the tip
are your own elements, styleable directly.

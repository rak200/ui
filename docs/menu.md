# UiMenu

[← Reference](README.md)

A menu button: one trigger, one menu, and the ARIA relationship between them.

```js
import '@rak200/ui';
```

## Contents

- [`<ui-menu>`](#ui-menu)
- [Items are yours; the trigger is not](#items-are-yours-the-trigger-is-not)
- [With an icon](#with-an-icon)
- [The keyboard](#the-keyboard)
- [What the platform does, and what is left](#what-the-platform-does-and-what-is-left)
- [Where the panel lands](#where-the-panel-lands)
- [Submenus](#submenus)
- [Supplementary text](#supplementary-text)
- [Motion](#motion)
- [Styling](#styling)

## `<ui-menu>`

```html
<ui-menu>
  <span slot="trigger">Actions</span>
  <button type="button">Rename</button>
  <button type="button">Duplicate</button>
  <hr />
  <button type="button" disabled>Delete</button>
</ui-menu>
```

| Slot      | Holds                                                      |
| --------- | ---------------------------------------------------------- |
| `trigger` | the button's label — inline content, not a control         |
| _default_ | the items: `<button>`s and `<a href>`s, and `<hr>` between |

| Property | Type      | Default | Means                                            |
| -------- | --------- | ------- | ------------------------------------------------ |
| `open`   | `boolean` | `false` | whether the menu is showing; reflected, settable |

The class is exported as `UiMenu` for a host that needs the type; importing the package
registers the element, so nothing has to be called.

## Items are yours; the trigger is not

**This is the one component in the kit that renders its own trigger**, and that is deliberate
rather than an inconsistency. [`<ui-tooltip>`](tooltip.md) is the other side of it: there the
elements in an ARIA relationship stay in your tree, because an IDREF does not cross a shadow
boundary. Here **both** ends are
rendered inside one shadow root, so the reference resolves and there is nothing for a
consumer to get wrong: `aria-haspopup`, `aria-expanded` and `aria-controls` are written on an
element you never see.

**The items stay yours**, and they must be natively focusable — a `<button>` or an
`<a href>`. What the component writes on each is `role="menuitem"` and `tabindex="-1"`;
activation, the accessible name and the disabled state stay the platform's. Containment is
what crosses the boundary here: a slotted item really is inside the `role="menu"` panel, the
same rule [`<ui-toaster>`](toast.md) relies on and the one a reference cannot borrow.

**An `<hr>` needs nothing.** It already carries an implicit `role="separator"` — measured —
so the component styles it and leaves what it means alone.

**A disabled item is stepped over rather than landed on.** Write `disabled` on a button, or
`aria-disabled="true"` on a link; either is skipped by the arrow keys and by typeahead, and
neither closes the menu when clicked.

## With an icon

An [`<ui-icon>`](icon.md) in the trigger's label or in an item sits centred on the line it is on,
and the trigger and the item stay as tall as ones without it, as in a
[`<ui-button>`](button.md#with-an-icon):

```html
<ui-menu>
  <span slot="trigger"><ui-icon name="settings"></ui-icon> Settings</span>
  <button type="button"><ui-icon name="pencil"></ui-icon> Rename</button>
  <button type="button"><ui-icon name="copy"></ui-icon> Duplicate</button>
</ui-menu>
```

**Wherever the label or the item holds one**, since both are elements of yours: an icon inside an
element of yours in either is fitted to the line too. So is one slotted beside the label,
`<ui-icon slot="trigger">`, and the room between the two is then the trigger's own gap, where an
icon written in the label has the space you write. An icon alone, as in a menu opened from one,
needs a `label`, as [the accessible name](icon.md#the-accessible-name) says.

**A click on an item's icon chooses the item**, as a click anywhere else on it does, and so does one
on anything else of yours the item holds: the menu closes and hands the focus back.

**A layout of your own inside the label or an item is not a line**: in a column over the text, say,
an icon larger than the line would draw over the text. Give that icon `margin-block: 0`, which
outweighs the element's own.

## The keyboard

|                                                    |                                                   |
| -------------------------------------------------- | ------------------------------------------------- |
| <kbd>Enter</kbd> / <kbd>Space</kbd> on the trigger | opens, focus on the first item                    |
| <kbd>↓</kbd> on the trigger                        | opens, focus on the first item                    |
| <kbd>↑</kbd> on the trigger                        | opens, focus on the **last** item                 |
| <kbd>↓</kbd> / <kbd>↑</kbd>                        | moves, wrapping at either end                     |
| <kbd>Home</kbd> / <kbd>End</kbd>                   | jumps to the first or last item                   |
| a letter                                           | jumps to the next item whose label starts with it |
| <kbd>Enter</kbd> on an item                        | chooses it: closes, focus back on the trigger     |
| <kbd>Space</kbd> on a button                       | chooses it, unless a search is in progress        |
| <kbd>Space</kbd> on a link                         | nothing                                           |
| <kbd>Esc</kbd>                                     | closes, focus back on the trigger                 |
| <kbd>Tab</kbd>                                     | closes, focus carries on out of the menu          |

**The menu is one tab stop.** Every item carries `tabindex="-1"`, so <kbd>Tab</kbd> leaves
rather than walking the list — which is the APG Menu Button pattern, and what the platform
would _not_ do on its own with a panel full of real buttons.

**Typeahead cycles.** The search starts after the item under the focus and wraps, so pressing
the same letter twice moves between the items that share it. The buffer is forgotten after
half a second of no typing, which is the interval the platform's own `<select>` uses.

**A space belongs to a search in progress**, so a label with a space in it can be typed whole:
`open r` reaches _Open recent_. With no search in progress, <kbd>Space</kbd> is the item's.

**Choosing is the platform's.** <kbd>Enter</kbd> clicks a button and follows a link, and
<kbd>Space</kbd> clicks a button, as each does anywhere else; the click closes the menu and hands
the focus back. A link is never followed on <kbd>Space</kbd>, so on one the key does nothing, and
the menu keeps it from scrolling the page underneath, as it keeps the arrows. The APG lists
<kbd>Space</kbd> on an item as optional.

## What the platform does, and what is left

The panel is a **`popover="auto"`**, and that is most of the pattern. Measured, in this
component's own arrangement:

| The platform                               | This component                         |
| ------------------------------------------ | -------------------------------------- |
| the top layer, over every stacking context | `role`, `aria-*` and the tabindex      |
| light dismissal on a click elsewhere       | the arrow keys, Home/End and typeahead |
| <kbd>Esc</kbd> closes it                   | **handing the focus back**             |
| closing any other open popover             | the placement                          |

**`auto` rather than `manual`, which is the opposite of [`<ui-tooltip>`](tooltip.md).** An
`auto` popover light-dismisses and closes the others, which is wrong for a tip appearing over
an open menu and exactly right for a menu.

**Focus restoration is written here, and only because it had to be.** With the trigger inside
this shadow root and the focus on a slotted item, closing leaves the focus on `<body>` —
measured; the same markup in one flat tree returns it to the invoker. So the return trip is
this component's, and it happens only for the two ways out that leave you inside the menu:
<kbd>Esc</kbd>, and choosing an item. A click elsewhere is the third, and it deliberately
leaves the focus where you put it.

**No state machine.** The table above splits the work, and what is left over is a roving
tabindex and four keys. [ARCHITECTURE.md](../ARCHITECTURE.md), _Behaviour is delegated_, carries
that decision for the whole package.

## Where the panel lands

**The platform places it**, by CSS anchor positioning. It hangs from the trigger's leading edge,
which right to left is its right edge, flips above when there is no room below, and hangs from the
trigger's other edge where it would run off the screen — placed as it is shown, and kept against the
trigger through every scroll, with no script. A panel that flipped stays on the side it flipped to
while it still fits there. It is hung by the trigger's edges rather than by an area, since Firefox
mirrors an area's alignment in a part of the page whose direction is not the page's, and put the
panel at the screen's other edge there (Mozilla bug 2019601).

It writes `data-side` — `block-start` or `block-end` — on the panel, so a host who wants a different
gap has something to select on. The CSS writes the side nowhere, so the element reads it off where
the panel landed, and foretells it before the panel is first drawn, by the height the panel had when
it was last open: the panel's entrance comes from that side.

**It hangs from where the trigger rests**, which is the box the component takes up. A trigger you
move through `::part(trigger)` — grown under the pointer, say — moves alone, and the panel stays
where it was hung. The component takes its anchor name from its own stylesheet: give `<ui-menu>` an
`anchor-name` of your own and yours replaces it, which leaves the panel nothing to hang from — write
both, `anchor-name: --yours, --menu`.

## Submenus

**Out of scope**, as RFC 0016 cut it. A submenu is a second layer with its own dismissal
ordering, its own placement against a moving parent, and <kbd>→</kbd>/<kbd>←</kbd> on top of
everything above — it is a component, not an option. Nest a second `<ui-menu>` inside an item
and you will get two triggers rather than a submenu.

## Supplementary text

Wrap it in a [`<ui-tooltip>`](tooltip.md) and write the sentence once, in the tip:

```html
<ui-tooltip>
  <ui-menu>
    <span slot="trigger">Actions</span>
    <button type="button">Rename</button>
  </ui-menu>
  <span slot="tip">Everything you can do to this file.</span>
</ui-tooltip>
```

The tooltip cannot point at anything in this element's shadow root — an IDREF resolves in one tree
scope — so it **hands the text over** and `<ui-menu>` renders it into its own root, where the
trigger it owns can be described by it. There is no attribute or property to write; the sentence
lives in the tip, and editing the tip changes what is announced.

**The carrier sits beside the trigger, never inside the panel.** The panel is a popover in a layer
of its own that opens and closes; the reference has to resolve from where the reader's focus is,
which is the trigger. Opening the menu does not disturb it.

The copy in here is not painted, because the tip is already showing it. Take the tip away and the
description goes with it.

**On an item, write the tooltip inside it**, round its label, and it describes the item, as
[`<ui-tooltip>`](tooltip.md#inside-a-button-or-a-link) says:

```html
<ui-menu>
  <span slot="trigger">Actions</span>
  <button type="button">
    <ui-tooltip>Rename<span slot="tip">Rename the invoice</span></ui-tooltip>
  </button>
</ui-menu>
```

The item stays an item: the keys land on it and show its tip, and a click on its label chooses it.
**A tooltip written round an item takes it out of the menu**, which takes an item only as its own
child: unstyled, passed over by the keys, and a button no menu claims.

## Motion

**The trigger answers as the secondary button it is.** It takes every effect a
[`<ui-button>`](button.md#motion) answers the pointer, the focus and a press with — the raise, the
lift, the ring's glide, the squeeze and the sink under the default theme; the tint, the glow, the
burst, the glitch and the shatter under Matrix; the spotlight, the cast, the edge, the inner light,
the shimmer, the refocus, the spring and the ripple under Glass. They are drawn by the same sheet,
in the same colours and on the same layers, and the suite measures the trigger against a secondary
button in every state rather than trusting the two to agree.

**A choice reaches it as it reaches a button**: `--ui-motion-<moment>`, written on the page, a
region, every menu or one. **A theme's taste reaches it under the menu's own name**,
`--ui-taste-menu-<moment>`, over the page's, so a theme that sets the menu apart sets its trigger
apart with it. The shipped themes name the pointer, the focus and a press once, for the page, so the
trigger moves as every button does.

**The panel's entrance and exit, and the caret's flip, are the menu's own moments**,
`--ui-motion-enter`, `--ui-motion-exit` and `--ui-motion-caret`, under the menu's taste name. Under
the default theme the panel is there at once and its items come into it one after another from the
trigger's side, `cascade`, each over five sixths of `--ui-duration-overlay` and five thirty-seconds
of it later than the one before, the seventh on together; it closes covered back toward the trigger,
`fold`; and the caret turns over its middle line, edge-on halfway, as a card is turned, `flip`, over
a step and a half on `--ui-easing-move`. Under [Matrix](theme.md#matrix) the panel jumps in and
flickers out in bands, its labels split into `--ui-color-danger` and `--ui-color-info`, `glitch`;
under [Glass](theme.md#glass) it comes into focus and goes out of it, `refocus` and `defocus`.
`none` takes each away: the panel opens and closes at once, and the caret turns over at once.

They are drawn by one internal sheet, `panelEffects()` in `src/effects.ts`, which the select's list
opens by too. **None scales the panel**, which the menu measures to foretell its side, and an
entrance comes from the side the panel hangs on, written before the panel is first drawn. **Only
Chromium plays an exit**: the panel is held on the page while it goes by transitioning its display
and its overlay, which Firefox and WebKit do not honour for a popover, so there the panel is gone at
once. In an engine without container style queries the panel opens and closes at once and the caret
turns as it always did.

## Styling

Every value is a [token](tokens.md); nothing here is hardcoded.

| Part                  | Token                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| trigger box           | the same as a secondary [`<ui-button>`](button.md), measured against it                                     |
| trigger edge and lift | `--ui-color-border-button`, `--ui-color-border-button-hover` under the pointer, and `--ui-elevation-button` |
| caret                 | `--ui-icon-size` and `--ui-icon-stroke`, in `--ui-color-text-muted`, centred on the label's line            |
| panel padding         | `--ui-space` ÷ 2                                                                                            |
| panel width           | capped at `--ui-space` × 44                                                                                 |
| gap from trigger      | `--ui-space` ÷ 2                                                                                            |
| surface               | `--ui-color-surface-raised`, and `--ui-backdrop-raised` behind it                                           |
| text                  | `--ui-color-text`                                                                                           |
| boundary              | `--ui-color-border-overlay`                                                                                 |
| separator             | `--ui-color-border`                                                                                         |
| corner                | `--ui-radius`                                                                                               |
| lift                  | `--ui-elevation-raised`, lit in the accent if written in `currentColor`                                     |
| item padding          | `--ui-space` ÷ 2 and `--ui-space`, the item never under the 24px WCAG 2.2's 2.5.8 asks of a target          |
| item hover            | `--ui-color-hover`                                                                                          |
| focus ring            | `--ui-color-focus`                                                                                          |
| trigger glow          | `--ui-elevation-control`, and `--ui-elevation-control-hover` under the pointer, in the accent               |
| motion                | `--ui-duration-state`, `--ui-easing-state`                                                                  |
| trigger effects       | a secondary [`<ui-button>`](button.md#motion)'s, by [`--ui-motion-*`](#motion) and `--ui-taste-menu-*`      |

**No new category arrives with this component**, which `ROADMAP.md` predicted: a menu is a
surface over a page, and elevation, the boundary and the derived neutrals were all already
here. It is the third overlay in a row to stack with no `z-index`, because the top layer is the
platform's: the one the sheet names lays the trigger's own layer under its label.

| Part                       | Aims at    |
| -------------------------- | ---------- |
| `<ui-menu>::part(trigger)` | the button |
| `<ui-menu>::part(menu)`    | the panel  |

The items are your own elements, styleable directly — what the component sets on them is a
row's worth of layout and the states, which your own rule outranks.

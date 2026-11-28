# UiMenu

[← Reference](README.md)

A menu button: one trigger, one menu, and the ARIA relationship between them.

```js
import '@rak200/ui';
```

## Contents

- [`<ui-menu>`](#ui-menu)
- [Items are yours; the trigger is not](#items-are-yours-the-trigger-is-not)
- [Items that tick, and sections](#items-that-tick-and-sections)
- [A shortcut and a description](#a-shortcut-and-a-description)
- [With an icon](#with-an-icon)
- [The keyboard](#the-keyboard)
- [What the platform does, and what is left](#what-the-platform-does-and-what-is-left)
- [Where the panel lands](#where-the-panel-lands)
- [Submenus](#submenus)
- [Opened at the pointer](#opened-at-the-pointer)
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

| Property  | Type        | Default   | Means                                                                                 |
| --------- | ----------- | --------- | ------------------------------------------------------------------------------------- |
| `open`    | `boolean`   | `false`   | whether the menu is showing; reflected, settable                                      |
| `align`   | `MenuAlign` | `'start'` | which of the trigger's edges the panel hangs from: `start` or `end`; reflected        |
| `context` | `boolean`   | `false`   | a [context menu](#opened-at-the-pointer), opened from the element it is in; reflected |

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
`<a href>`, written as the menu's own children or in a [section](#items-that-tick-and-sections).
What the component writes on each is `role="menuitem"` and `tabindex="-1"`;
activation, the accessible name and the disabled state stay the platform's. Containment is
what crosses the boundary here: a slotted item really is inside the `role="menu"` panel, the
same rule [`<ui-toaster>`](toast.md) relies on and the one a reference cannot borrow.

**An `<hr>` needs nothing.** It already carries an implicit `role="separator"` — measured —
so the component styles it and leaves what it means alone.

**A disabled item is stepped over rather than landed on.** Write `disabled` on a button, or
`aria-disabled="true"` on a link; either is skipped by the arrow keys and by typeahead, and
neither closes the menu when clicked.

**A hidden item is left out.** Write `hidden` on it, or hide it with a rule of your own: it is not
drawn, and the arrow keys and typeahead pass over it. Take `hidden` off and it is back, in its
place.

## Items that tick, and sections

```html
<ui-menu>
  <span slot="trigger">View</span>
  <button type="button" role="menuitemcheckbox" aria-checked="true">Show the ruler</button>
  <button type="button" role="menuitemcheckbox">Show the grid</button>
  <hr />
  <div role="group" aria-labelledby="view-sort">
    <span id="view-sort">Sort by</span>
    <button type="button" role="menuitemradio" aria-checked="true">Name</button>
    <button type="button" role="menuitemradio" aria-checked="false">Date</button>
  </div>
</ui-menu>
```

**An item ticks when you give it the role**: `role="menuitemcheckbox"` or `role="menuitemradio"` on
a button of yours, with its `aria-checked`. The menu keeps the role where it writes `menuitem` on
any other item, writes `aria-checked="false"` where you wrote none, since the role requires the
state, and draws a tick at the item's start while it is checked: the checkbox's tick, or the
radio's dot, in the item's own text. A press turns it:

- **a checkbox's state turns over, and a radio's goes to it** from the other radios of its section,
  or of the menu's own children outside a section;
- **the space bar ticks it and leaves the menu open**, so several can be ticked in a row, where
  Enter and a click tick it and close the menu as they close it from any item — the APG's menu;
- **the item announces `change` for every tick**, the space bar's included, which fires no click,
  so read `aria-checked` there; a listener on the item for `click` hears the state the click set;
- an item that cannot be used is left as it is.

**A section is a `role="group"` of yours among the menu's items**, named by a heading it holds: a
`<span>` with an `id`, which the section's `aria-labelledby` points at. The menu takes the
section's items as its own, and the arrows, Home, End and typing move through sections as through
the rest and pass over the heading, which is drawn as the section's title, in the muted text at the
supporting size. An `<hr>` sets a section apart from what is round it.

**What a section holds is drawn by rules the menu adopts into the tree it is in**, as
[`<ui-table>`](table.md)'s are, since `::slotted()` reaches the section and nothing in it; written
at no weight, so a rule of yours for your own button still has the last word, as it has for the
menu's own items. An item written into a section after the menu was drawn is taken as the menu
opens.

## A shortcut and a description

```html
<ui-menu>
  <span slot="trigger">File</span>
  <button type="button">
    Rename <kbd>F2</kbd><span data-ui-description>Give the file a new name.</span>
  </button>
  <button type="button">Duplicate <kbd>Ctrl+D</kbd></button>
</ui-menu>
```

**A shortcut is a `<kbd>` in the item**, drawn at the item's end on the label's line — the right
edge where the page runs left to right, the left where it runs right to left — in the muted text and
the label's own size, so the two stand on one baseline. It floats to the end, so an icon and the
label beside it stay on one line. It stays in the item's name, so the shortcut is heard with it.

**A description is an element of yours marked `data-ui-description`**, drawn on a line of its own
under the label, from where the label starts, in the muted text at the supporting size. The menu
names it in the item's `aria-describedby`, giving it an `id` where it has none and keeping an id of
yours beside it, and hides it from the item's name, so it is heard after the name rather than as
part of it. Take it away and the reference goes with it, as the menu next opens.

**Under the pointer both take the item's own text**: on the fill an item takes there, the muted
text fell under 4.5:1 in some of the shipped palettes, where at rest it holds 4.5:1 everywhere.

They are drawn by the rules the menu adopts into the tree it is in, which reach into an item as
[sections](#items-that-tick-and-sections) need them to, in a section or not.

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

**`align="end"` hangs it from the trigger's trailing edge** instead, its right edge where the page
runs left to right and its left edge where it runs right to left, so a menu at the end of a toolbar
opens toward the toolbar rather than past it. It turns to the leading edge where it would run off
the screen, by the same flip that turns the default to the trailing edge, and it opens below or
above as any menu does.

```html
<ui-menu align="end">
  <span slot="trigger">Actions</span>
  <button type="button">Rename</button>
  <button type="button">Delete</button>
</ui-menu>
```

**It hangs from where the trigger rests**, which is the box the component takes up. A trigger you
move through `::part(trigger)` — grown under the pointer, say — moves alone, and the panel stays
where it was hung. The component takes its anchor name from its own stylesheet: give `<ui-menu>` an
`anchor-name` of your own and yours replaces it, which leaves the panel nothing to hang from — write
both, `anchor-name: --yours, --menu`.

## Submenus

```html
<ui-menu>
  <span slot="trigger">File</span>
  <button type="button">Rename</button>
  <ui-menu>
    <span slot="trigger">Share</span>
    <button type="button">Copy the link</button>
    <button type="button">Email</button>
  </ui-menu>
  <button type="button">Delete</button>
</ui-menu>
```

**A `<ui-menu>` written in another is a submenu**, among its items or in a
[section](#items-that-tick-and-sections). Its trigger is drawn as one of the menu's items — a
`menuitem`, out of the tab order, its caret turned toward the inline end — and its panel opens
beside it, its first item level with it, toward the inline end, turned to the start and up where it
would run off the screen. Its trigger stays lit while its panel is open, and the effects of a button
its trigger answers on a menu of its own stand down, as no item takes them.

- **The keys are the APG's.** The arrows up and down move over the submenu's trigger as over any
  item; the arrow toward the inline end opens it onto its first item, and the arrow back closes it
  onto its trigger — right and left, the other way round right to left. Enter and the space bar open
  it as they press any trigger, Escape closes it alone and leaves the menu round it open, and typing
  reaches it by its trigger's label.
- **A choice made in it closes both**, the focus going back to the first trigger, as a choice
  anywhere does; a press of its trigger opens it and leaves the menu round it open.
- **The pointer opens it after resting on its trigger for 100ms**, and leaves the focus where it was.
  As the pointer leaves the trigger for the open submenu, the submenu waits for it across the
  triangle from where it left, five pixels back, to the corners of its near edge, for 300ms at most,
  while the items it crosses open nothing; leaving that triangle or running out of time closes it. A
  touch opens it as a press of its trigger does. The two times are a reading of the pointer, Radix's,
  rather than motion, so they are no token and reduced motion leaves them as they are.

The layer and its dismissal are the platform's: a popover in another's panel is its child among the
open popovers, measured for RFC 0010, so a click elsewhere closes both and Escape the one on top.

## Opened at the pointer

```html
<div class="canvas">
  <button type="button">A shape</button>
  <ui-menu context>
    <button type="button">Paste</button>
    <button type="button">Select all</button>
  </ui-menu>
</div>
```

**`context` makes the menu a context menu for the element it is written in.** A secondary click
there opens it where the pointer is, and keeps the platform's own menu shut; the menu key and
<kbd>Shift</kbd>+<kbd>F10</kbd> on what has the focus there open it at that element's middle, read as
keys, since only Chromium sends `contextmenu` for them. It opens once in every engine: the key it
opens from is kept from its default, which keeps Chromium's own `contextmenu` away. Asked for again
while it is open, it moves to where it was asked for.

- **No trigger is drawn, and the menu takes no box where it is written.** Its panel hangs from a
  point, a zero-size element of its own placed where it was asked for, below it and toward the inline
  end — the right left to right, the left right to left — turned up and toward the start where it
  would run off the screen, by the same flips that turn the menu's.
- **The point is shown in the top layer while the menu is open**, so it stays where the pointer was
  whatever is round the menu: a transform, a filter or a containment on an element the menu is in
  makes that element where a fixed element is placed, and a card that lifts as the focus enters it
  moved the point, and the panel with it, away from the pointer.
- **The focus goes into it and comes back** as the menu's does: onto its first item as it opens, and
  back to what had it as Escape or a choice closes it; where nothing had it, it leaves the menu. A
  click elsewhere closes it and leaves the focus where the click put it.
- **What happens in the menu stays the menu's**: a secondary click on an item opens nothing.
- **Linux sends `contextmenu` with the secondary button still down**, and the platform dismisses an
  open menu as a press that began outside it ends, so the menu opens once the button is up there.

A person runs it in each engine on `tests/manual/menu-context.html`, since a driven menu key is not a
reader's: the suite dispatches what each engine was measured sending.

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

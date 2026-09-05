# UiMenu

[← Reference](README.md)

A menu button: one trigger, one menu, and the ARIA relationship between them.

```js
import '@rak200/ui';
```

## Contents

- [`<ui-menu>`](#ui-menu)
- [Items are yours; the trigger is not](#items-are-yours-the-trigger-is-not)
- [The keyboard](#the-keyboard)
- [What the platform does, and what is left](#what-the-platform-does-and-what-is-left)
- [Where the panel lands](#where-the-panel-lands)
- [Submenus](#submenus)
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
rather than an inconsistency. Everywhere else — [`<ui-field>`](field.md),
[`<ui-input>`](input.md), [`<ui-tooltip>`](tooltip.md) — the elements in an ARIA relationship
stay in your tree, because an IDREF does not cross a shadow boundary. Here **both** ends are
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

## The keyboard

|                                                    |                                                   |
| -------------------------------------------------- | ------------------------------------------------- |
| <kbd>Enter</kbd> / <kbd>Space</kbd> on the trigger | opens, focus on the first item                    |
| <kbd>↓</kbd> on the trigger                        | opens, focus on the first item                    |
| <kbd>↑</kbd> on the trigger                        | opens, focus on the **last** item                 |
| <kbd>↓</kbd> / <kbd>↑</kbd>                        | moves, wrapping at either end                     |
| <kbd>Home</kbd> / <kbd>End</kbd>                   | jumps to the first or last item                   |
| a letter                                           | jumps to the next item whose label starts with it |
| <kbd>Esc</kbd>                                     | closes, focus back on the trigger                 |
| <kbd>Tab</kbd>                                     | closes, focus carries on out of the menu          |

**The menu is one tab stop.** Every item carries `tabindex="-1"`, so <kbd>Tab</kbd> leaves
rather than walking the list — which is the APG Menu Button pattern, and what the platform
would _not_ do on its own with a panel full of real buttons.

**Typeahead cycles.** The search starts after the item under the focus and wraps, so pressing
the same letter twice moves between the items that share it. The buffer is forgotten after
half a second of no typing, which is the interval the platform's own `<select>` uses.

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

**No Zag.** RFC 0016 adopted state machines for behaviour, `ROADMAP.md` named this component
as the nearest candidate, and Zag ships a menu machine — so this is a refusal rather than an
absence of an option, and [ARCHITECTURE.md](../ARCHITECTURE.md) carries it. The short form:
the table above splits the work, and what is left over is a roving tabindex and four keys.
The second reason is this component's own — Zag's menu positions through Floating UI, and a
package with two placements is a package that is wrong in one of them.

## Where the panel lands

It hangs from the trigger's leading edge, flips above when there is no room below, and is
pulled back inside the viewport at either edge. It writes `data-side` — `block-start` or
`block-end` — on the panel, so a host who wants a different gap has something to select on.

**The arithmetic is shared with [`<ui-tooltip>`](tooltip.md)**, which is what issue #23 asked
for: two answers to one problem is one too many. It lives in one internal module, alongside
`reference` — the exported `place` takes a `Box` for the anchor and one for the overlay, a
`Side` to prefer and an `Align` to line up by, and returns a `Placement`: the side it took and
the two insets to write. A tooltip asks for `block-start` and `center`; a menu asks for
`block-end` and `inline-start`. Being a function of four boxes rather than of two elements is
what lets the edges be checked directly, at values a rendered page reaches only by luck.

CSS anchor positioning would do all of it and is deliberately not adopted; `docs/tooltip.md`
carries that whole argument, and it did not change.

## Submenus

**Out of scope**, as RFC 0016 cut it. A submenu is a second layer with its own dismissal
ordering, its own placement against a moving parent, and <kbd>→</kbd>/<kbd>←</kbd> on top of
everything above — it is a component, not an option. Nest a second `<ui-menu>` inside an item
and you will get two triggers rather than a submenu.

## Styling

Every value is a [token](tokens.md); nothing here is hardcoded.

| Part             | Token                                                                   |
| ---------------- | ----------------------------------------------------------------------- |
| trigger box      | the same as a secondary [`<ui-button>`](button.md), measured against it |
| caret            | `--ui-icon-size` and `--ui-icon-stroke`, in `--ui-color-text-muted`     |
| panel padding    | `--ui-space` ÷ 2                                                        |
| panel width      | capped at `--ui-space` × 44                                             |
| gap from trigger | `--ui-space` ÷ 2                                                        |
| surface          | `--ui-color-surface`                                                    |
| text             | `--ui-color-text`                                                       |
| boundary         | `--ui-color-border`, and the separator with it                          |
| corner           | `--ui-radius`                                                           |
| lift             | `--ui-elevation-raised`                                                 |
| item padding     | `--ui-space` ÷ 2 and `--ui-space`                                       |
| item hover       | `--ui-color-hover`                                                      |
| focus ring       | `--ui-color-focus`                                                      |
| motion           | `--ui-duration-state`, `--ui-easing-state`                              |

**No new category arrives with this component**, which `ROADMAP.md` predicted: a menu is a
surface over a page, and elevation, the boundary and the derived neutrals were all already
here. It is the third overlay in a row to name no `z-index`, because the top layer is the
platform's.

| Part                       | Aims at    |
| -------------------------- | ---------- |
| `<ui-menu>::part(trigger)` | the button |
| `<ui-menu>::part(menu)`    | the panel  |

The items are your own elements, styleable directly — what the component sets on them is a
row's worth of layout and the states, which your own rule outranks.

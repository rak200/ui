# The console

**Every line this package says in the console goes through one place**, so every line follows the
same rules:

- **It starts with its code**, such as `[ui-icon:unregistered]`, which names the component and the
  case, and which this page explains below.
- **It ends with a link** to the code's entry on this page.
- **It is said once a page for each cause**, however far apart the repeats come: once a name for
  an icon, once a tag for a tooltip's trigger. Thirty icons under one typo are one line.
- **The element it is about follows the text**, which the devtools show as a node you can reveal.

**Four codes speak always**, for a mistake that is silent otherwise and known the moment it is
written. **The rest are a [diagnosis](diagnose.md)'s**, said only when a page asks, since what is
missing as a component connects may still arrive.

## Contents

- [Levels](#levels)
- [Quieting](#quieting)
- [Codes](#codes)

## Levels

Each line takes the console's own level that says what it is:

| Level   | A line at it is                                                              |
| ------- | ---------------------------------------------------------------------------- |
| `warn`  | a mistake of the page's, which the page can mend: the four that speak always |
| `info`  | what the page asked to hear: a [diagnosis](diagnose.md)'s log                |
| `error` | a failure of the package's own, and never a mistake of the page's            |
| `log`   | none of these                                                                |

## Quieting

**Write `data-ui-quiet` on any element**, as you write `data-ui-density` on a region. It quiets the
lines about what is inside it, across the shadow roots that is drawn in, and on the root element
it quiets the whole page. It takes a list, and each word in it is one of three:

- **a code**, `ui-icon:unregistered`, which quiets that code alone;
- **a level**, `log`, `info`, `warn` or `error`, which quiets every line said at it;
- **`all`**, which quiets everything the package says.

| `<html data-ui-quiet="…">`  | The console is told        |
| --------------------------- | -------------------------- |
| `ui-icon:unregistered`      | every line but that code's |
| `warn`                      | no warning                 |
| `ui-tooltip:stranded error` | every line but those       |
| `all`                       | nothing                    |

A region quiets what it holds and nothing else. A page that shows a toast where none is ever
written, as a specimen of a theme does, quiets that one code round it:

```html
<div data-ui-quiet="ui-toast:outside">
  <ui-toast duration="0">Draft saved.</ui-toast>
</div>
```

**The attribute is read at every line**, so a page that changes it as it runs changes what the
lines after say, and a test that wants the package silent while it tests something else writes it
the same way:

```js
document.documentElement.dataset.uiQuiet = 'all';
```

**A line quieted is not remembered**, so once the quiet is lifted, the next line of that cause is
said. The devtools can still hide one code by itself, with a filter of `-ui-icon:unregistered`.

## Codes

### `ui-icon:unregistered`

**An icon whose `name` has no glyph registered draws nothing**, and says so two seconds past the
later of the page's load and the icon's first update, once a name. A typo in `name` and a glyph
module nobody imported look alike: an empty box, with no error anywhere else. A glyph a page
imports as it draws the icon arrives within the two seconds, and says nothing.

Import the glyph's module, `import '@rak200/ui/icons/x.js'`, or slot an `<svg>` of your own.
[icon.md](icon.md) says how glyphs are registered.

### `ui-tooltip:stranded`

**A tooltip whose trigger focuses a control inside its own shadow root describes nothing a reader
hears.** The description is an id in your tree, and no control in that shadow root can reach it.
The tip still shows and lands where it should, so nothing on the page looks wrong. It is said once
a page for the trigger's tag.

Make the trigger a control you wrote, a native `<button>`, `<a href>` or form control, or one of
this package's, which take the sentence. [tooltip.md](tooltip.md) says how the sentence crosses.

### `ui-tooltip:unreachable`

**A tooltip whose trigger takes no tab stop is shown by a pointer alone.** The keys never land on a
`<span>`, an `<a>` with no `href` or an element with `tabindex="-1"`, so a reader on the keyboard
never sees the tip, and a reader with a mouse sees nothing wrong. It is said the first time a
pointer shows the tip, once a page for the trigger's tag. A disabled control says nothing, whether
its own `disabled` or a `<fieldset disabled>` round it disabled it, and a `<ui-button disabled>` is
one: [tooltip.md](tooltip.md#the-trigger-has-to-be-focusable-and-in-your-tree) says what to write
where the reason it is disabled matters to a reader on the keyboard.

Write the trigger as a `<button>` or an `<a href>`, which take a tab stop, or as one of this
package's controls. A trigger the keys reach by something it holds, a `<ui-button>` or a box round
a button, is reached, and so is an item with `tabindex="-1"` inside a widget the arrows move
through: a toolbar, a menu or a menu bar, a list box, a tab list, a tree, a grid or a radio group,
written as its `role`. A `<ui-menu>`'s items are among them.

### `ui-toast:outside`

**A toast written outside a `<ui-toaster>` is announced by nothing**, since the regions that
announce a toast are the toaster's. In an element of your own it is drawn where you wrote it, and
inside another component not at all. It is said once a page.

Write it inside the page's `<ui-toaster>`, which [toast.md](toast.md) says where to put. A toast
shown on purpose where none is ever written, as a specimen is, takes
`data-ui-quiet="ui-toast:outside"` on the element round it.

### `ui-menu:not-an-item`

**A menu takes as items only the `<button>`, the `<a href>` and the `<ui-menu>` written as its own
children or in a section it holds**, a `role="group"` — a `<ui-menu>` there is a
[submenu](menu.md#submenus) — so a child that is neither an item nor a section is drawn as
written, passed over by the keys and left out of the menu's choices. A [diagnosis](diagnose.md) says
it for each one, for the page to judge. A tooltip, a `<div>` or a list written round items, a form
round a submit button, a label round a checkbox and a component's own element round each item are
mistakes, which axe reports too once the menu is open. An `<a>` with no `href` may be a link left
inert on purpose, and a `<span>` naming a section belongs inside the section, which it names.

Write each item as the menu's own child, and what was round it, a tooltip among them, inside it.
[menu.md](menu.md#items-are-yours-the-trigger-is-not) says what a menu takes.

### `ui-menu:forwarded`

**A `<slot>` that forwards a component's items to the menu it draws hands the menu nothing it
takes.** The menu reads its own children, and what a slot forwards is not among them, so the items
are drawn as written and passed over by the keys. A [diagnosis](diagnose.md) says it.

Write the items as the menu's own children, in the tree the menu is in: in the component that draws
the menu, rather than forwarded to it.

### `ui-menu:no-items`

**A menu with no item opens an empty panel.** An item written a moment after the menu connects
works once it arrives, so only a [diagnosis](diagnose.md) says it.

Write its items as its own children, each a `<button>` or an `<a href>`.

### `ui-tooltip:no-tip`

**A tooltip with no tip describes nothing and shows nothing.** A tip written a moment after the
tooltip connects is wired as it arrives, so only a [diagnosis](diagnose.md) says it.

Write the tip in it, with `slot="tip"`, or take the tooltip away. [tooltip.md](tooltip.md) says
how.

### `ui-select:option`

**A select draws only the `<ui-option>`s it holds**, so an `<option>` written in it is left out of
the list and cannot be chosen. A [diagnosis](diagnose.md) says it for each one.

Write each choice as a `<ui-option>`, and a group of them as a `<ui-optgroup>`.
[select.md](select.md#why-the-choices-are-not-option) says why a choice is not an `<option>`.

### `ui-radio:outside`

**A choice is drawn by the group it is written in**, so a `<ui-radio>` outside a
`<ui-radio-group>` draws nothing. A [diagnosis](diagnose.md) says it.

Write it inside its `<ui-radio-group>`. [radio.md](radio.md) says why a choice is a `<ui-radio>`.

### `ui-radio-group:unnamed`

**A radio group with no `label` is announced as a group with no name**, which axe does not judge.
A [diagnosis](diagnose.md) says it.

Give it one with `label="…"`.

### `ui-dialog:unnamed`

**A dialog with no title opens with no name for a screen reader to announce.** Its name is copied
from the heading written in it with `slot="title"`, and axe judges a dialog's name only as best
practice. A [diagnosis](diagnose.md) says it.

Write its heading in it with `slot="title"`. [dialog.md](dialog.md#the-accessible-name) says how
the name is made.

### `ui-density:unknown`

**A density the package does not have leaves the region as it was**, with the default space and
text. There is one density, `compact`, and no way to name another, so any other value is a typo,
where a theme the package does not ship may be the page's own and is nothing to say. A
[diagnosis](diagnose.md) says it, once a page for each value.

Write `data-ui-density="compact"`. [tokens.md](tokens.md#density) says what a compact region
writes.

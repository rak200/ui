# The console

**Every line this package says in the console goes through one place**, so every line follows the
same rules:

- **It starts with its code**, such as `[ui-icon:unregistered]`, which names the component and the
  case, and which this page explains below.
- **It ends with a link** to the code's entry on this page.
- **It is said once a page for each cause**, however far apart the repeats come: once a name for
  an icon, once a tag for a tooltip's trigger. Thirty icons under one typo are one line.
- **The element it is about follows the text**, which the devtools show as a node you can reveal.

## Contents

- [Levels](#levels)
- [Quieting](#quieting)
- [Codes](#codes)

## Levels

Each line takes the console's own level that says what it is:

| Level   | A line at it is                                                           |
| ------- | ------------------------------------------------------------------------- |
| `warn`  | a mistake of the page's, which the page can mend: every code below is one |
| `info`  | what the page asked to hear                                               |
| `error` | a failure of the package's own, and never a mistake of the page's         |
| `log`   | none of these                                                             |

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
one.

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

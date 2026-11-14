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

**Write `data-ui-quiet` on the root element**, as you write `data-ui-theme` to choose a theme. It
takes a list, and each word in it is one of three:

- **a code**, `ui-icon:unregistered`, which quiets that code alone;
- **a level**, `log`, `info`, `warn` or `error`, which quiets every line said at it;
- **`all`**, which quiets everything the package says.

| `<html data-ui-quiet="…">`  | The console is told        |
| --------------------------- | -------------------------- |
| `ui-icon:unregistered`      | every line but that code's |
| `warn`                      | no warning                 |
| `ui-tooltip:stranded error` | every line but those       |
| `all`                       | nothing                    |

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

**An icon whose `name` has no glyph registered draws nothing**, and says so once the page has
loaded, once a name. A typo in `name` and a glyph module nobody imported look alike: an empty box,
with no error anywhere else.

Import the glyph's module, `import '@rak200/ui/icons/x.js'`, or slot an `<svg>` of your own.
[icon.md](icon.md) says how glyphs are registered.

### `ui-tooltip:stranded`

**A tooltip whose trigger focuses a control inside its own shadow root describes nothing a reader
hears.** The description is an id in your tree, and no control in that shadow root can reach it.
The tip still shows and lands where it should, so nothing on the page looks wrong. It is said once
a page for the trigger's tag.

Make the trigger a control you wrote, a native `<button>`, `<a href>` or form control, or one of
this package's, which take the sentence. [tooltip.md](tooltip.md) says how the sentence crosses.

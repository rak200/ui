# UiButtonGroup

`<ui-button-group>` draws `<ui-button>`s as one, names them together, and with `toolbar` takes the
keyboard of a toolbar.

## Contents

- [`<ui-button-group>`](#ui-button-group)
- [`label`](#label)
- [`toolbar`](#toolbar)
- [How the buttons are joined](#how-the-buttons-are-joined)
- [Styling](#styling)

## `<ui-button-group>`

```html
<ui-button-group label="View">
  <ui-button variant="secondary" type="button">Day</ui-button>
  <ui-button variant="secondary" type="button">Week</ui-button>
  <ui-button variant="secondary" type="button">Month</ui-button>
</ui-button-group>
```

Buttons in a row, joined: the corners they share are squared, and their edges meet as one line. The
buttons are yours, written inside the element, and the group draws a `group` round them in its
root, which a screen reader announces with its name as it enters. Containment crosses a root where
a reference does not, so the buttons are inside the role it draws.

The class is exported as `UiButtonGroup`; importing the package registers the element.

| Attribute | Type    | Default | Means                                                     |
| --------- | ------- | ------- | --------------------------------------------------------- |
| `label`   | string  | `''`    | the name the group is read by                             |
| `toolbar` | boolean | `false` | one tab stop, which the arrows, Home and End move through |

## `label`

The name the group is read by, written on the role in the element's root as a string: a
reference from in there would reach nothing in your page, so a heading of yours cannot name it by
`aria-labelledby`. Write one wherever the buttons alone do not say what they choose between, and on
every toolbar where a page has more than one. Reflected.

## `toolbar`

```html
<ui-button-group label="Text style" toolbar>
  <ui-button toggle pressed type="button">Bold</ui-button>
  <ui-button toggle type="button">Italic</ui-button>
  <ui-button toggle type="button">Underline</ui-button>
</ui-button-group>
```

**A toolbar is one tab stop**, the APG's toolbar pattern: Tab reaches the button you were on last,
or the first, and leaves the toolbar from there. Inside it the keys move the focus:

| Key             | Moves to                                        |
| --------------- | ----------------------------------------------- |
| <kbd>→</kbd>    | the next button, from the last to the first     |
| <kbd>←</kbd>    | the previous button, from the first to the last |
| <kbd>Home</kbd> | the first button                                |
| <kbd>End</kbd>  | the last button                                 |

Right to left, the two arrows turn with the reading: <kbd>←</kbd> is the next. Every other key is
the button's, so <kbd>Enter</kbd> and <kbd>Space</kbd> press it.

**The stop is a roving `tabindex`** that the group writes on each `<ui-button>`: `0` on the one
you were on last, by the keys, the pointer or a script, and `-1` on the rest. That is why
`<ui-button>` delegates its focus: its `tabindex` decides its button's stop, and `focus()` on it
lands on its button. A group that is not a toolbar writes none, and takes away what it wrote.

**A disabled button is passed by**, since the keys cannot reach it, and the stop moves off one the
moment it is disabled. One marked `aria-disabled="true"` is reached, as the APG asks of a toolbar,
so a tooltip on it is shown and its reason heard — [button.md](button.md#disabled) says what it
draws and refuses.

The group moves the focus between `<ui-button>`s only. Anything else you put in a toolbar keeps its
own stop.

## How the buttons are joined

A button's corners are drawn on the button in its own root, which the group reaches only through
`::part(button)`, and `::slotted()` takes no `::part()` after it. So the rules that join them are
adopted into the tree the group is in — your document, or the shadow root of a component it is
written in — and every one of them names the group's own children, so they reach no other button.
The button learns nothing: its effects' layers take their corners from it.

Each button after the first is drawn one pixel back over the one before, where its edge lies, so two
secondary buttons share one edge. The button under the pointer, or holding the focus, is drawn over
its neighbours, so its edge, its effects and its focus ring are whole.

## Styling

The role round the buttons is exposed as a part:

| `::part()` | Is                                         |
| ---------- | ------------------------------------------ |
| `group`    | the `group` or `toolbar` round the buttons |

The buttons are yours, and take every token and every effect a `<ui-button>` takes, one by one.

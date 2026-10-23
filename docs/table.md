# UiTable

`<ui-table>` puts this package's surface around a table **you** wrote. It renders no markup from
data, sorts nothing, and selects nothing.

```html
<ui-table>
  <table>
    <caption>
      Every invoice raised this quarter.
    </caption>
    <thead>
      <tr>
        <th scope="col">Number</th>
        <th scope="col">Client</th>
        <th scope="col" style="text-align: end">Total</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>0001</td>
        <td>Papelaria Aurora</td>
        <td style="text-align: end">R$ 1.200,00</td>
      </tr>
      <tr>
        <td>0002</td>
        <td>Marcenaria Vale</td>
        <td style="text-align: end">R$ 840,50</td>
      </tr>
    </tbody>
  </table>
</ui-table>
```

## Contents

- [The table is yours](#the-table-is-yours)
- [What it styles](#what-it-styles)
- [It is not a data grid](#it-is-not-a-data-grid)
- [The scroll, and when it takes a tab stop](#the-scroll-and-when-it-takes-a-tab-stop)
- [Where the styles actually live](#where-the-styles-actually-live)
- [Styling](#styling)

## The table is yours

Write the `<table>`, the `<caption>`, the `<thead>`, the `scope` attributes — all of it. The element
takes no data and emits no rows.

That is the same shape [`<ui-select>`](select.md) and [`<ui-input>`](input.md) have, and it is
chosen for a stronger reason here: a table's semantics **are** its subject. Which column is a
header, whether a row has a header of its own, what the caption says — a component that generated
those would be guessing, and a wrong guess in a table is a wrong guess a screen reader reads aloud
on every cell.

It also means everything the platform gives you still works: `colspan`, `rowspan`, `<tfoot>`,
`<colgroup>`, a `scope="row"` header, a nested `<table>` if you must.

## What it styles

| Part                       | What it gets                                                                 |
| -------------------------- | ---------------------------------------------------------------------------- |
| the element                | a boundary, a corner, and horizontal scrolling                               |
| `table`                    | collapsed borders, full width, the font, and the text on a control's fill    |
| `th`, `td`                 | padding from `--ui-space`, a bottom rule, `text-align: start`, top alignment |
| `thead th`                 | the second surface tone, so a one-row table still reads as having a header   |
| `tbody tr:nth-child(even)` | the same tone, as a stripe                                                   |
| `caption`                  | below the table, start-aligned, muted, at the supporting size                |

**`text-align: start` on every cell is a correction rather than a decoration.** The platform centres
a `th` and only a `th`, which leaves a header sitting off the column it heads. `start` rather than
`left`, so a right-to-left page needs no second rule.

**Aligning a column is yours**, and needs nothing from this element: `text-align` inherits, so
`style="text-align: end"` on the cells of a numeric column is the whole of it. The stories show that
on a currency column.

**The caption reads after the table**, which reverses the platform's default on purpose: a caption
that _explains_ a table belongs after it, and one that _titles_ it is a heading you write outside
this element.

## It is not a data grid

Sorting, selection, virtualization, editing and pagination are **out of scope**, each deferred in
RFC 0016 as an accessibility project of its own. A sortable column header is not a style — it is a
button, a live announcement of the new order, and a state that has to survive being re-rendered.

A pull request adding a `sortable` attribute here is reopening a design decision, and needs the
proposal rather than a review.

## The scroll, and when it takes a tab stop

The element scrolls when its table is wider than the space it has, or taller than a height you gave
it. A region that overflows and cannot be reached from a keyboard is unusable from a keyboard — WCAG
2.1.1 — so **while it overflows, the element takes a tab stop**. Chromium and Firefox make an
overflowing box focusable of their own accord and leave one that fits alone; WebKit does neither, so
the element writes the stop itself, by the same rule, in all three.

- **A table that fits takes no stop**, and a click in one of its cells leaves the focus where it
  was.
- **The stop follows the size** of the element and of its table: narrow the page and it arrives,
  widen it and it goes. While the element has the focus the stop stays, so the focus is never
  dropped on the page, and it goes once the focus has left.
- **A table with a link or a control in it still takes the stop while it overflows**, as Firefox
  does: the box is what scrolls, and what is focusable in it may not be where the reader needs to
  go.
- **It is there once the element has rendered.** `updateComplete` waits for it, so a test that runs
  axe after it finds the stop in place.

**Watching costs little, and a page that is not resizing pays nothing.** Measured on pages of 10,
100 and 500 tables, half of them overflowing: rendering the page and laying it out took 1 to 6 ms
more with 10 tables, 5 to 9 ms more with 100 and 13 to 27 ms more with 500, across the three
engines, and each resize with 500 tables took 2 to 3.5 ms.

**A `tabindex` you write is yours**, and left alone; remove it and the element takes the stop back.
On a table that can overflow, `tabindex="-1"` takes away the only way in from a keyboard, in every
engine, and axe reports `scrollable-region-focusable`, which is serious.

**It needs no name.** The element claims no role, so it is `generic`, and a focusable `generic` does
not fail WCAG 4.1.2, which is the WCAG working group's answer in
[w3c/wcag#3029](https://github.com/w3c/wcag/issues/3029). ARIA prohibits naming a `generic`, so an
`aria-label` on `<ui-table>` is a name an engine may drop, though Chromium exposes it; the
`<caption>` is what names your table. If you want the box to be a named region, write
`role="region"` and the name on it yourself, which makes the name valid.

## Where the styles actually live

Every other component here styles what you slot with `::slotted()`. This one cannot, and the reason
is worth knowing because it shows up the moment you inspect the page.

**`::slotted()` matches the top level of what a slot was given and nothing below it.** A `<td>` is a
descendant of the slotted `<table>`, so no selector written inside a shadow root reaches it — shadow
CSS is scoped to its own tree, and your table is in your tree.

So the cell rules are adopted into **your** tree instead, as a constructed stylesheet, when the first
`<ui-table>` in that tree connects. Three consequences:

- Every selector is prefixed `ui-table`, so a table you wrote elsewhere on the page is untouched.
- The tree is found with `getRootNode()`, not `document` — a `<ui-table>` inside another component's
  shadow root is styled in **that** root, which is the case a hardcoded `document` would leave bare.
- One sheet per tree, however many tables are in it.

## Styling

Everything comes from the [token layer](tokens.md); nothing here is a literal. Retune a token
anywhere above the element and this follows.

The category that arrived with this component is the **type scale** — `--ui-text-100`, read through
`--ui-text-supporting` — and it did not arrive for the caption alone. It replaced three hardcoded
`font-size: 0.875em` declarations that were already shipping across the form controls and
[`<ui-tooltip>`](tooltip.md), all three agreeing and none of them overridable.

`--ui-color-surface-muted` arrived with it: a second surface tone, for the header and the stripes.
It is deliberately lighter than `--ui-color-hover`, so a state drawn over a striped row is still a
change. The table itself is filled with `--ui-color-surface-control`, the fill every control takes,
which is the surface until a theme sets it.

There are **no parts**. `::part()` reaches into a shadow root, and everything you would want to
style is in your own tree already — write a selector.

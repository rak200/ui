# UiTable

`<ui-table>` puts this package's surface around a table **you** wrote. It renders no markup from
data, sorts nothing, and selects nothing.

```html
<ui-table aria-label="Invoices">
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
- [The scroll, and why it takes a tab stop](#the-scroll-and-why-it-takes-a-tab-stop)
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
| `table`                    | collapsed borders, full width, the font and the surface pair                 |
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

## The scroll, and why it takes a tab stop

The element scrolls horizontally when its table is wider than the space it has. A region that
overflows and cannot be reached from a keyboard is unusable from a keyboard — WCAG 2.1.1 — so the
element makes itself focusable.

It is unconditional. A table that happens to fit still costs one tab stop, and the alternative is
watching every table's size for the life of the page to save it. **If that trade is wrong for you,
write your own `tabindex`** — a value you set is left alone, including `tabindex="-1"`.

**The name is yours too.** A scrollable region wants one, and the only text that could supply it is
the `<caption>` — which is in your tree, where an `aria-label`/`aria-labelledby` from inside this
component's shadow root cannot resolve. So write `aria-label` on `<ui-table>`, which is one element
in one tree with nothing to miswire.

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
`font-size: 0.875em` declarations that were already shipping, in [`<ui-field>`](field.md) twice and
in [`<ui-tooltip>`](tooltip.md) once, all three agreeing and none of them overridable.

`--ui-color-surface-muted` arrived with it: a second surface tone, for the header and the stripes.
It is deliberately lighter than `--ui-color-hover`, so a state drawn over a striped row is still a
change.

There are **no parts**. `::part()` reaches into a shadow root, and everything you would want to
style is in your own tree already — write a selector.

# Roadmap

Pending work, ordered. Released history lives in [CHANGELOG.md](CHANGELOG.md); a delivered entry
is **removed** by the pull request that delivers it, not annotated as done.

## An alert `<ui-dialog>` (#457)

[RFC 0010](docs/proposals/0010-component-features.md)'s eighteenth step: `role="alertdialog"`, for a
choice the reader has to make.

## A heading on `<ui-toast>` (#458)

A slot above the message, read with it.

## An action on `<ui-toast>` (#459)

A slot for a button the host writes, on a toast that then never expires.

## A card that opens where it is clicked (#460)

By the stretched link the card draws, lifting what it holds above it.

## Numeric columns on `<ui-table>` (#461)

End-aligned in tabular figures, for the cells the host marks.

## A sticky header and a sticky first column on `<ui-table>` (#462)

The column within the box that scrolls already, and the header within a box given a height.

## `<ui-radio>` choices drawn as cards (#463)

The button group's joined drawing, larger, with a description for each choice.

## `<ui-menu>` hung from the trigger's other edge (#464)

The trailing edge, where the host asks.

## Items that tick, and sections, in `<ui-menu>` (#465)

`menuitemcheckbox` and `menuitemradio` on the host's items, and groups named by a heading.

## A shortcut and a description on `<ui-menu>`'s items (#466)

Drawn by rules the menu adopts into the host's tree.

## Submenus in `<ui-menu>` (#467)

The platform's layer, the menu's keys, and the pointer's way in across the area Radix's waits
across.

## `<ui-menu>` opened at the pointer (#468)

A context menu, opened by the pointer and by the menu key and Shift+F10 read as keys. The last
step, which marks RFC 0010 `Implemented`.

## A busy `<ui-button>` (#439)

[RFC 0010](docs/proposals/0010-component-features.md)'s twelfth step, at the end of the list since
its turn came before RFC 0009's progress landed, which it still waits on; the `aria-disabled`
button it rests on has landed.

## Design tokens beyond the web (#24)

Tokens exist as CSS custom properties today. RFC 0016 keeps a native shell (M4) reachable by
treating tokens as a single source of truth, which will mean emitting them in a second format. No
consumer needs it yet, and the shape of that emission is a decision to make with one in hand.

RFC 0002 narrowed that shape from the other side, and the constraint is worth carrying here rather
than rediscovering: a derived token's value is a `color-mix()` expression, which is a CSS function and
therefore **not a value any emitter outside CSS can read**. A formula plus a concrete theme does yield
one, so the emitter resolves derived roles at build time and emits them frozen per theme, while CSS
keeps them live. That asymmetry is accepted, not solved — and it was accepted knowingly, because
choosing the more expensive structure to protect a target with no consumer is the claim that retired
the Zag adoption, and [ARCHITECTURE.md](ARCHITECTURE.md) is where that argument now lives.

**One category already cannot make the trip in the shape the others do**, and it is worth carrying
for the same reason: elevation is a `box-shadow`, so it is neither a colour an emitter can resolve
nor a value `light-dark()` can carry two of. [ARCHITECTURE.md](ARCHITECTURE.md) says what the web
does about it; what a second format does is this issue's to decide.

# Roadmap

Pending work, ordered. Released history lives in [CHANGELOG.md](CHANGELOG.md); a delivered entry
is **removed** by the pull request that delivers it, not annotated as done.

## A toggle `<ui-button>` (#449)

[RFC 0010](docs/proposals/0010-component-features.md)'s ninth step: `pressed`, written as
`aria-pressed` and drawn in the selected names.

## An `aria-disabled` `<ui-button>` (#450)

Drawn and refused as a disabled button, and still reached by the keys, so a tooltip on it is shown
by them.

## `<ui-button-group>` (#451)

The buttons joined, their shared corners squared through `::part(button)`, and with `toolbar` the
APG toolbar's keyboard, for which `<ui-button>` delegates its focus.

## A busy `<ui-button>` (#439)

Blocked until RFC 0009's progress and the `aria-disabled` button land, and moved to the end of the
list if they have not by its turn.

## `<ui-icon>` turned right to left (#452)

For a glyph the host marks as pointing one way, by `:host(:dir(rtl))`.

## A side of its own for `<ui-tooltip>`'s tip (#453)

Below or beside its trigger, and in a passage of another direction by anchored insets read in the
tip's own.

## An arrow on `<ui-tooltip>`'s tip (#454)

Pointing at its trigger's middle, drawn as the tip's `::before` and moved by `translate`.

## `<ui-dialog>` opened from markup (#455)

`--show` and `--close`, from any button aimed at it with `commandfor`.

## `<ui-dialog>` closed by its form (#456)

A `<form method="dialog">` in it closes it, with the value of the button that sent it.

## An alert `<ui-dialog>` (#457)

`role="alertdialog"`, for a choice the reader has to make.

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

# RFC 0010 — Features for the components that exist

- **Scope**: library
- **Created**: 2026-11-11

## Motivation

Four were asked for: a prefix and a suffix inside a field, a button that shows it is busy, an action
on a toast, and a card that opens wherever it is clicked. A look past them was asked for too. Each
changes a component that ships, and two of them meet a decision a page in `docs/` records against
them. A card "grows no `clickable` attribute", and a toast's one control is its dismiss button.

This proposal studies the four and a catalogue round them. It decides which enter, and what each
costs the decision it meets. New components are [RFC 0009](0009-new-components.md)'s.

## Study

### Measured: a focused button that is disabled loses the focus

A busy button is one a second press must not reach, and `disabled` is the platform's way to refuse
a press. In Chromium 153, Firefox 155 and WebKit 26.5, a button was focused from the keyboard and
then disabled. The engines measured alike:

| The button                           | The focus | `blur` | The next Tab         |
| ------------------------------------ | --------- | ------ | -------------------- |
| in the document                      | `<body>`  | fires  | the element after it |
| in a shadow root, as `<ui-button>`'s | `<body>`  | fires  | the element after it |

**The reader who pressed it is left nowhere.** A screen reader announces the page or nothing, and
when the button comes back to rest, the focus is not on it. So a busy button refuses a press without
`disabled`. It keeps its tab stop and says it is busy.

Adobe's Spectrum takes the same shape from the other side: a pending button disables its events at
once, and shows its spinner only after a second, so a quick task flashes nothing
([React Spectrum](https://react-spectrum.adobe.com/react-spectrum/Button.html)).

### A toast with an action

What the toast already gives an action:

- **Its clock stops while it is read**, with the pointer over it or the focus inside it.
- **<kbd>Esc</kbd> dismisses it** once the reader has tabbed in.
- **A `danger` toast never expires.**

What it cannot give is the way there. The toaster sits last in `<body>`, so a keyboard reader comes
to the action after the whole page, against a clock that does not stop until they arrive.

**Carbon refuses the combination outright.** Its toasts "do not contain interactive elements, and
they do not receive focus". A notification that needs an action is an `alertdialog` instead, which
"grabs and traps focus until an action is taken or the notification is dismissed"
([Carbon](https://carbondesignsystem.com/components/notification/accessibility/)).

Between the two there is a toast that waits: an action toast never expires, as a danger toast never
does. It is offered for an action the page has elsewhere too — the undo of a deletion the list
itself can also reverse. An action that exists only in a toast is one a reader who never reaches
the toast does not have, and one the reader must take is a dialog's.

### A card that opens where it is clicked

`docs/card.md` turned down a `clickable` attribute for what it would have to reimplement: keyboard
activation, the accessible name, the focus ring and the disabled semantics. A link wrapping the
whole card, which that page leaves to the host, makes the link's name the whole card's text.

Inclusive Components gives two shapes that reimplement none of these, and keep a short link in the
heading as the one target for the keyboard and the reader
([Inclusive Components](https://inclusive-components.design/cards/)):

- **The stretched link.** The link's `::after` covers the card, with no script. The text under it
  cannot be selected. A control nested in the card is lifted above it, or the click lands on the
  link. What the pointer is over _is_ the link, so a new tab, the link's menu and the address shown
  as the pointer rests all work.
- **The redundant click.** A click on the card clicks the link, from script. A press longer than
  200ms is taken for a selection and left alone. The card is not a link, so the new tab and the
  link's menu are not there.

The link is a descendant of what the host slots, an `<a>` inside the header's heading, which
`::slotted()` cannot reach. A stretched link is a rule the card adopts into the host's tree, as
`<ui-table>` adopts its own, and it must sit over the card's layers and under what the card holds.

### A prefix and a suffix

A field renders its control, its label, its help and its message in one root. A prefix like `R$`
or `https://` is visible text a reader needs too: `R$` is the unit. So it must reach the control's
name or description. A prefix slotted from the host's tree cannot be pointed at from inside the
root, which is the tree-scope rule again.

**Text as an attribute.** It is rendered into the root, where `src/description.ts` composes it
into the control's `aria-describedby`.

**A glyph as a slot.** A `<ui-icon>` with no `label` is hidden from the tree already, which is what
a magnifier before a search field should be.

A click on either focuses the control, as a click anywhere on the box does today.

### Measured: a header sticks only to a box that scrolls

An overflowing table's box scrolls sideways. CSS computes the other axis to `auto` with it, which
makes the box the header's scroll container. In Chromium, Firefox and WebKit, `overflow-y` read
`auto`, and the page scrolled 300px past the table's top took the header with it, 300px off the
screen. So a header sticks only inside a box that scrolls both ways, with a height of its own.

### Measured: a command reaches a custom element only by its own name

A button's `commandfor` names any element, and its `command` reaches it as a `command` event:
`CommandEvent` is at the floor, from Chrome 135, Firefox 144 and Safari 26.2. In Chromium 153,
Firefox 155 and WebKit 26.5, a button aimed at a custom element fired nothing for `show-modal`,
which is a `<dialog>`'s command. It fired `--show`, a command of the element's own, in all three.

So a `<ui-dialog>` can be opened by a button the host writes, with no script, through
`command="--show"`.

### Measured: a submenu's layer is the platform's

`docs/menu.md` keeps submenus out as "a component, not an option": a second layer with its own
dismissal ordering, its own placement against a moving parent, and <kbd>→</kbd> and <kbd>←</kbd> on
top. Two `popover="auto"` panels were measured, each in a shadow root of its own, the inner one
slotted into the outer one's panel as a submenu would be. Chromium 153, Firefox 155 and WebKit 26.5
measured alike:

| What happens                     | The outer panel | The inner panel |
| -------------------------------- | --------------- | --------------- |
| the inner one opens              | stays open      | open            |
| Escape from inside the inner one | stays open      | closes          |
| a click inside the outer one     | stays open      | closes          |
| a click outside both             | closes          | closes          |

**The dismissal ordering is the platform's**, since a popover inside another's panel, in the flat
tree, is its child among the open popovers. A panel elsewhere in the page closes the outer one as it
opens. Shown with `showPopover({ source })`, the outer one's item as its source, it keeps the outer
open too.

**What is left over** is three things:

- **<kbd>→</kbd> and <kbd>←</kbd>.** The first opens the submenu from its item, with the focus on
  its first item. The second closes it back onto the item
  ([APG](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/)).
- **The placement against the parent's item**, which anchor positioning already does for the menu
  against its trigger.
- **The pointer's way from an item to its submenu.** It crosses the other items, so a submenu that
  closed as soon as the pointer left its item could never be reached.

That last is what the study has still to measure: how long a submenu waits for the pointer, or
across which shape.

### Measured: a column sticks inside the box that already scrolls

The table's box scrolls sideways already, so a first column made sticky against the box's start
sticks where the reader is scrolling. Each box was scrolled 200px in the three engines. The first
column stayed at the box's start, and the bottom rule under each of its cells stayed with it, under
collapsed borders and separate ones alike.

So a sticky first column needs no height, where a sticky header does. Where both are sticky, the
cell at their corner is both.

### A group of buttons

There are two patterns, by what the keyboard does:

- **A group**, `role="group"` with a name. Each button keeps its own tab stop, and the group says
  what they are together. Nothing is left over but the drawing.
- **A toolbar**, the APG's, with one tab stop, the arrows between the controls, and Home and End
  ([APG](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/)). It is the menu's leftover once more.

**The drawing is the same in both**: the buttons side by side, joined, with the corners they share
squared. A button draws its corners from one `--ui-radius` today. So either a group reaches each
button's `::part(button)` from the host's tree, where a rule can, or the button learns a radius per
corner.

**A segmented row of radios is the same drawing** over a radio group, so the two share it.

### The rest of the catalogue

| Component     | Feature                | What it rests on                                                             | Cost   |
| ------------- | ---------------------- | ---------------------------------------------------------------------------- | ------ |
| `ui-button`   | a `danger` variant     | four names of its own, as the primary's, computed from the danger            | low    |
| `ui-button`   | a lone icon            | the name is the icon's `label` already; a square box at the target floor     | low    |
| `ui-button`   | an `href`              | an `<a>` rendered for a `<button>`; a form and `disabled` mean nothing there | medium |
| `ui-button`   | a group                | `role="group"`, or the APG's toolbar; the corners they share, squared        | medium |
| `ui-input`    | a clear button         | `type="search"` draws one in Chromium and WebKit only; a named button        | medium |
| `ui-input`    | the password shown     | a pressed button that switches the `type`, named by an attribute             | medium |
| `ui-input`    | a count to `maxlength` | text describing the control, heard once the reader stops typing (GOV.UK)     | medium |
| `ui-textarea` | growing with its text  | `field-sizing: content`, with no growth before Firefox 152                   | low    |
| `ui-select`   | a placeholder          | the platform's placeholder label option, a first choice with no value        | low    |
| `ui-checkbox` | a group with a name    | `<fieldset>` and `<legend>` in the group's root, the boxes slotted           | medium |
| `ui-checkbox` | select all             | the mixed state the box already draws, worked out by the group               | medium |
| `ui-radio`    | a description each     | `aria-describedby` in the group's root, where its controls are               | low    |
| `ui-radio`    | a segmented row        | the platform's radios, drawn as buttons side by side                         | medium |
| `ui-dialog`   | sizes                  | a width for each, as tokens                                                  | low    |
| `ui-dialog`   | against an edge        | `showModal()` as now; light dismissal is `closedby`, which Safari lacks      | medium |
| `ui-dialog`   | opened from markup     | `commandfor` and a command of its own, measured above                        | low    |
| `ui-toast`    | following a promise    | the toaster is a place, not a factory, and a variant changed is heard twice  | —      |
| `ui-table`    | a sticky header        | a box that scrolls both ways, measured above                                 | medium |
| `ui-table`    | a sticky first column  | the box that scrolls sideways already, measured above                        | low    |
| `ui-table`    | sorting, selection     | deferred by RFC 0016 as a data grid's                                        | —      |
| `ui-menu`     | items that tick        | `menuitemcheckbox` and `menuitemradio`, `aria-checked`, on the host's items  | low    |
| `ui-menu`     | sections               | `role="group"` named by a heading, both in the host's tree                   | low    |
| `ui-menu`     | submenus               | the platform's layer and dismissal, measured above; the pointer's way in     | high   |
| `ui-menu`     | items forwarded        | a slot's flattened assignment, styled where `::slotted()` cannot reach       | medium |
| `ui-card`     | a picture              | a region at the top, edge to edge                                            | low    |

## Proposed design

### What enters, in this order

1. **`<ui-textarea>` grows with its text**, between its least height and a greatest one the host
   sets. An engine without `field-sizing`, Firefox before 152, keeps the box as it is.
2. **A prefix and a suffix on `<ui-input>`.** The text comes as the `prefix` and `suffix`
   attributes, rendered in the root and joining the description; a glyph comes as a slot of the same
   name, hidden from the tree.
3. **A busy `<ui-button>`**, once RFC 0009's progress has landed. It refuses a press and keeps its
   tab stop. After a second it draws the indeterminate ring in place of its label, keeping its
   width. How it says it is busy to a reader is its manual page's to measure: a name that changes on
   the focused button is announced by some readers and not by others.
4. **A `danger` `<ui-button>`**, filled with four names of its own, computed from the danger as the
   primary's are from the accent, and measured over every palette.
5. **An action on `<ui-toast>`**, a slot for a button the host writes. A toast with an action never
   expires, and `docs/toast.md` asks for an action the page offers elsewhere too.
6. **A card that opens where it is clicked**, by the stretched link: the host names the link that is
   the card's target, and the card adopts the rule that spreads it over itself into the host's tree,
   lifting what the card holds above it. `docs/card.md`'s refusal of `clickable` stands; what
   changes is that the stretched link is drawn by the package rather than left to the host.
7. **`<ui-dialog>` opened from markup**, answering `--show` and `--close` from any button aimed at
   it.
8. **A placeholder on `<ui-select>`**, the platform's own: a first choice with no value, which a
   required select refuses.
9. **A clear button, the password shown, and a count on `<ui-input>`**, each a part of the root.
   The clear button and the password's switch are named by attributes. The count is a sentence
   describing the control, written by an attribute with a place for the number, and heard once the
   reader stops typing.
10. **A sticky header and a sticky first column on `<ui-table>`.** The column sticks within the box
    that scrolls already. The header sticks within a box given a height of its own, which the host
    sets.
11. **Items that tick, and sections, in `<ui-menu>`**: `menuitemcheckbox` and `menuitemradio` with
    `aria-checked` on the host's items, and `role="group"` named by a heading, all in the host's
    tree.
12. **`<ui-button-group>`**: the buttons drawn joined, and named together as a group. Whether it
    takes the toolbar's keyboard too is the study's to settle.
13. **Submenus in `<ui-menu>`**, last, once the pointer's way into one is measured. The layer and
    its dismissal are left to the platform, as measured. The menu writes <kbd>→</kbd>, <kbd>←</kbd>
    and the focus between the two panels.

**The rest of the catalogue is left out for now**, each for the reason its row gives. The proposal
stays in study, so another feature can still join it.

### What each feature brings with it

- **Its tests**: the feature on every state it touches, axe on each, and the gate a mutant on it
  would pass otherwise.
- **Its effects untouched.** A feature inside a component takes that component's effects as they
  are, and a part it adds takes none until a pull request of its own gives it some.
- **Its strings as attributes**, as `dismiss-label` is. Every word a reader hears and the host did
  not write is a word a page in another language replaces.
- **Its line in the component's page**, and in ARCHITECTURE.md where it reverses something written
  there.

### Alternatives, and what retired each

- **A busy button that is `disabled`**: measured, it drops the focus in every engine.
- **A toast whose action expires with it**: the action is gone before a keyboard reader arrives.
- **The action as an `alertdialog`**, Carbon's shape: it is right for an action the reader must
  take, and that is a dialog, which the package has.
- **The redundant click**: it keeps the card's text selectable, and makes a card that is not a link
  where the pointer rests, so a new tab and the link's menu are lost over most of it.
- **A slotted prefix that the control is described by**: the reference would cross the root.
- **A `clickable` attribute**: everything `docs/card.md` says it would reimplement.

## Decision

**Not taken yet.** The proposal stays in study, so that more features can join it before its set is
closed. Two questions are settled, and the proposed design above is written to them:

1. **A card opens where it is clicked by the stretched link**, over the redundant click.
2. **Five more join the eight proposed**: the input's clear button, password and count; the table's
   sticky header and first column; the menu's items that tick and its sections; a group of buttons;
   and submenus.

## Rollout

1. **One pull request for each step above**, in its order. The busy button waits for RFC 0009's
   progress. The last pull request marks this proposal `Implemented`.
2. **Each step enters ROADMAP.md with an issue of its own** once this proposal is accepted.

## Related

- [RFC 0009](0009-new-components.md), the new components, written beside this one; its
  indeterminate progress is what the busy button draws.
- RFC 0016, which deferred sorting and selection in a table, and submenus in a menu, which this
  proposal takes back up.
- [RFC 0011](0011-the-console.md), which measured that a menu takes no item a component of the
  page forwards through a slot, and sent taking them here.

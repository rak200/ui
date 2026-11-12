# RFC 0009 — New components

- **Scope**: library
- **Created**: 2026-11-11

## Motivation

The package registers eighteen tags, and a page built from them still writes some of its parts by
hand: the questions a help page folds away, the sections of a settings page behind tabs, how far an
upload has got, a warning that stays above a form, a status beside a row's name. Each of those is
then drawn without the tokens, the themes or the effects, and held to no accessibility bar, beside
components held to this package's.

Four were asked for — an accordion, tabs, a progress and a meter, an alert and a badge — and so was
a look past them. This proposal studies the four and a catalogue round them against the test the
package already applies, and decides which enter and in what order. What the components that exist
should learn to do is RFC 0010's.

## Study

### The test, as the package already states it

Nothing in it is new. Each candidate is read against rules ARCHITECTURE.md holds:

- **The platform owns what it is good at.** A component wraps the element wherever one exists, and
  where none does, what is left over is measured before anything is reached for. A roving tabindex
  and four keys is what `<ui-menu>` was left with, and it writes them itself; what would reopen the
  question of a state machine is a pattern — a combobox with inline autocomplete, a tree with
  typeahead, a grid with two-dimensional navigation.
- **A relationship needs one tree scope.** Both ends of an IDREF are in the host's tree, or both in
  the component's; containment is what crosses.
- **A category arrives with the component that consumes it.**
- **The accessibility bar**: WCAG 2.2 AA and the APG pattern, axe on every state, and a keyboard
  pass and a screen-reader pass by a person.
- **The browser floor**, Chrome 144, Firefox 148 and Safari 26.2. A feature newer than it leaves a
  component as it was where it is missing, or raises the floor.

### What the platform has for them, at the floor

Read from `@mdn/browser-compat-data` 8.1.8:

| Feature                                        | Chrome    | Firefox    | Safari                  | For              |
| ---------------------------------------------- | --------- | ---------- | ----------------------- | ---------------- |
| `<details name>`, an exclusive group           | 120       | 130        | 17.2                    | accordion        |
| `hidden="until-found"` and `beforematch`       | 102       | 148        | 26.2, scrolling wrongly | accordion, tabs  |
| `interpolate-size`, a height eased to `auto`   | 129       | no         | no                      | accordion        |
| `HTMLSlotElement.assign()`                     | 92        | 92         | 16.4                    | tabs, breadcrumb |
| `<progress>`, `<meter>`, their pseudo-elements | yes       | yes        | yes                     | progress, meter  |
| `content` with an alternative text             | 77        | 128        | 17.4                    | breadcrumb       |
| `showPopover({ source })`                      | 137       | 144        | 26                      | popover          |
| `::-webkit-slider-thumb`, `::-moz-range-thumb` | the first | the second | the first               | slider           |
| `::file-selector-button`                       | 89        | 82         | 14.1                    | file             |

**Everything the candidates need is at the floor but one thing**: a height eased to `auto`, which
only Chromium has, so an accordion opens at once in the other two.

### Measured: an exclusive group is the tree's

A `name` groups the `<details>` of one tree, the way radios sharing a `name` are grouped by their
tree where there is no form. In Chromium 153, Firefox 155 and WebKit 26.5, each pair opened by a
click on one summary and then on the other, the three engines alike:

| The two `<details name>`                                     | The first, once the second opens |
| ------------------------------------------------------------ | -------------------------------- |
| in one tree                                                  | closed                           |
| each in a shadow root of its own                             | **still open**                   |
| both in one shadow root                                      | closed                           |
| in the host's tree, each slotted into a component of its own | closed                           |

**So an exclusive group is the host's `<details>` or the component's, never one each.** Items that
each render their own `<details>` are not a group, and an accordion that keeps one open either
leaves the `<details>` where the host wrote them, styled there as `<ui-table>` styles a table, or
keeps one open itself.

### Measured: a summary is not the APG's header

The APG's accordion puts a `button` with `aria-expanded` alone inside a heading, so a reader moves
from header to header by heading ([APG](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/)). A
`<summary>` is the platform's disclosure, and ARIA in HTML allows it no role: Chromium's tree has it
as a `DisclosureTriangle` with its expanded state, and keeps a heading written inside it —
measured. What a reader hears is the pairing's: Scott O'Hara heard it as a disclosure triangle, a
button or a summary depending on the browser and the reader, the heading inside it exposed in some
and not others, and Firefox reading the marker into its name
([2022](https://www.scottohara.me/blog/2022/09/12/details-summary.html)). The suite can read no
other engine's tree.

### Tabs, and what is left over

There is no element. The APG's pattern is a `tablist` of `tab`s, each pointing at its `tabpanel` by
`aria-controls` and named back by its panel's `aria-labelledby`, with one tab stop: the arrows move
between the tabs and wrap, Home and End are optional, and the panel shows as its tab takes the focus
wherever it shows without delay. A panel with nothing focusable at its start is a tab stop of its
own ([APG](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)).

**What is left over is the menu's**: a roving tabindex, four keys, and their mirror in a page that
reads right to left. Both references run between a tab and its panel, so both ends go in one tree:

- **the host's**, the component writing the roles and the ids onto the tabs and panels the host gave
  it, as `<ui-menu>` writes `role="menuitem"` onto its items;
- **or the component's**, the host's labels and panels slotted into tabs and panels it renders,
  which `assign()` makes possible at the floor.

**Radios drawn as tabs** keep the keyboard the platform's, as `<ui-radio-group>` does, and announce
radios: ARIA in HTML allows a radio no other role than `menuitemradio`, so the APG's pattern is out
of their reach.

**A panel hidden `until-found` is opened by the page's find**, which `beforematch` hands the
component so it selects the tab: in Chromium and Firefox at the floor, and in Safari without
scrolling to the match.

### Progress and meter

`<progress>` is a `progressbar` and `<meter>` a `meter`, and both are labelable, so a component
renders either beside its `<label for>` in one root, as every field here renders its control.

**Measured: each engine paints the value through its own pseudo-elements**, under
`appearance: none` — `::-webkit-progress-value` and `::-webkit-meter-optimum-value` in Chromium and
WebKit, `::-moz-progress-bar` and `::-moz-meter-bar` in Firefox, read off the pixels at a fifth of
the bar and at nine tenths. BCD records no `::-moz-meter-bar`. Taking the drawing over is the
checkbox's debt again, and the forced-colors block is this package's to write.

**An indeterminate progress is a loop whose motion is the message.** The token sheet takes every
loop to one round under reduced motion, and a bar that moves once and stops reads as stuck — which
WCAG's understanding of 2.2.2 names as the case where the motion is essential: a preload animation,
"if not indicating progress could confuse users or cause them to think that content was frozen or
broken" ([Understanding 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)).
What it draws with less motion is the component's to decide, and the sheet's one rule would decide
it otherwise.

**A spinner is the same element**, indeterminate and drawn round: a `progressbar` with a name says
_something is happening_ to a reader as a ring says it to the eye.

**A meter's regions are the outcomes.** `low`, `high` and `optimum` put its value in one of three,
which the success, the warning and the danger draw.

### Alert and badge

**An alert in the page's flow is read where it stands.** The APG notes that an alert present as the
page loads is not announced, that one added later is, by most readers, and that frequent
interruptions "inhibit usability for people with visual and cognitive disabilities"
([APG](https://www.w3.org/WAI/ARIA/apg/patterns/alert/)). The messages that must be heard as they
arrive already have a place here: the toaster's two regions, in the document before any message,
which is the structural half no role on an inserted element supplies. What a page lacks beside them
is the toast's drawing — the variant's edge and icon, the message — somewhere that stays.

**The four outcome colours need no new name.** Each is held at 4.5:1 as text on the surface, and at
3:1 as a toast's icon on the raised surface and under its tint, over every palette and scheme. An
alert's edge and icon, and a badge's word and edge, drawn in an outcome over the surface, are pairs
the floors already hold. **A badge filled with an outcome** needs a label on each fill, which no
palette has, and four pairs nothing measures yet.

### The rest of the catalogue

| Candidate  | What the platform has                                    | What is left                                                         | Cost   |
| ---------- | -------------------------------------------------------- | -------------------------------------------------------------------- | ------ |
| Breadcrumb | `<nav>`, `<ol>`, `aria-current="page"`                   | a list item for each link, separators no reader hears                | low    |
| Skeleton   | nothing to delegate                                      | shapes hidden from the tree; `aria-busy` is the host's region's      | low    |
| Stepper    | `<ol>`, `aria-current="step"`                            | each step's state written in words as well as drawn                  | low    |
| Avatar     | `<img>` and its `alt`                                    | initials where the picture fails, on a colour every palette measures | low    |
| Pagination | `<nav>`, links, `aria-current="page"`                    | the pages with their gaps, and links or events — an API to decide    | medium |
| Popover    | `popover`, anchor positioning, `showPopover({ source })` | the menu's trigger and the focus returned, any content in the panel  | medium |
| Slider     | `<input type="range">`                                   | a seventh form control, its thumb drawn for two engine families      | medium |
| File       | `<input type="file">`, `::file-selector-button`          | an eighth form control, the chosen files listed, a place to drop     | medium |
| Combobox   | `<datalist>`, drawn differently by each engine           | the pattern ARCHITECTURE.md names as reopening a state machine       | high   |
| Tree view  | nothing                                                  | the same                                                             | high   |

**Two candidates are components that exist, drawn otherwise**, and go to RFC 0010: a **segmented
control** is a radio group drawn as a row of buttons, and a **drawer** is a dialog against an edge.

## Proposed design

### What enters, in this order

1. **`<ui-progress>` and `<ui-meter>`**, first because RFC 0010's busy button draws its ring with
   the indeterminate progress. Each renders its element beside its label; a progress with no `value`
   is indeterminate, and drawn round where the host asks for a spinner.
2. **`<ui-accordion>`, in the APG's shape.** Each item renders its header — a `button` with
   `aria-expanded`, alone in a heading whose level the host sets — and its panel, both in its own
   root, with the host's header text and content slotted. An `exclusive` attribute keeps one item
   open, which the accordion writes itself, a few lines, since no `name` groups panels in roots of
   their own. A closed panel is hidden `until-found`, so the page's find opens it.
3. **`<ui-alert>` and `<ui-badge>`.** An alert is the toast's variants in the page's flow — the
   edge, the icon hidden from the tree, the message, room for a heading and for actions — and
   announces nothing. A badge is a word in an outcome colour, edged in it, on the surface. Neither
   claims a role, as `<ui-card>` claims none, and a message in either says what happened in words,
   as a toast's does.
4. **`<ui-tabs>`**, over the tabs and panels the host gives it: the roles, the ids and the roving
   tabindex written onto them, as the menu writes onto its items; the arrows and their mirror, Home,
   End and automatic activation; every panel but the selected one hidden `until-found`.
5. **`<ui-breadcrumb>`**: a `<nav>` named by an attribute with a default, as `dismiss-label` is,
   and a list item for each link the host slots. The last link takes `aria-current="page"`, and the
   separators are drawn with an empty alternative text.
6. **`<ui-popover>`**, the menu's arrangement round any content. It renders its trigger and its
   panel in one root, so `aria-expanded` and `aria-controls` resolve, and slots the host's content
   into the panel, which `popover="auto"` lifts, dismisses on a click outside and closes on Escape,
   hung from its trigger by anchor positioning as the menu's is. What it is to a reader — a
   disclosure, or a dialog that is not modal — and where the focus goes as it opens, its pull
   request decides.
7. **`<ui-slider>`**, a seventh form control: an `<input type="range">` beside its label in one
   root, joined to the form as every field is, its thumb drawn under both engine families'
   pseudo-elements and floored at 24px, and the track filled up to the value — through
   `::-moz-range-progress` in Firefox, and a value the component writes in the other two.
8. **`<ui-file>`**, an eighth: an `<input type="file">` beside its label, its button drawn through
   `::file-selector-button` as a secondary `<ui-button>` is drawn, the chosen files listed by name,
   and a place to drop files for the pointer, the button staying the way in for everyone else.

**Skeleton, stepper, avatar and pagination are left out for now**, each for the reason its row
gives, and **the combobox and the tree view** are the proposals of their own ARCHITECTURE.md says
they would be. The proposal stays in study, so another candidate can still join it.

### What each component brings with it

- **Its tree scope, in its docblock**: which arrangement it takes, and why.
- **Its interaction states, and no effect.** RFC 0004's catalogue and each theme's taste reach a new
  component in a pull request of their own, once it has landed, so that it is judged on its shape
  before its motion.
- **No category of tokens** unless one is measured missing. The outcome colours, the surfaces, the
  border, the space and the type scale cover every component above.
- **Its density**: its height under RFC 0008's `compact`, tested, once that lands.
- **Its passes**: axe on every state in the suite, and a page in `tests/manual/` for the keyboard
  and the screen reader a person runs, as `table-announcement.html` is for the table.
- **Its page in `docs/`**, its story, its place on the workbench's starter, and a paragraph in
  ARCHITECTURE.md wherever it decides something the package had not.

### Alternatives, and what retired each

- **The accordion on the host's `<details name>`**, styled where it is: no script, and the page's
  find for nothing, but a summary is not the APG's header, and what a reader hears depends on the
  pairing.
- **Tabs drawn from radios**: the keyboard for nothing, and a role the pattern does not allow.
- **An alert that announces itself**, `role="alert"` as it is inserted: a second way to be heard,
  beside the toaster's two regions, which were built to be the only one.
- **A filled badge**: four labels no palette has, for a fill the word in its colour already gives.
- **A spinner of its own**: the role and name of an indeterminate progress, drawn round.
- **Sixteen components at once**: each a docs page and a manual pass, in one window no review holds.

## Decision

**Not taken yet.** The proposal stays in study, so that more candidates can join it before its set
is closed. Two questions are settled, and the proposed design above is written to them:

1. **The accordion takes the APG's shape**, over the host's `<details name>`.
2. **The popover, the slider and the file input join the five proposed.**

## Rollout

1. **One pull request for each step above**, in its order, each bringing its component whole: the
   element, its tests, its story, its page in `docs/` and in `tests/manual/`. The last marks this
   proposal `Implemented`.
2. **Each step enters ROADMAP.md with an issue of its own** once this proposal is accepted.

## Related

- [RFC 0010](0010-component-features.md), the features the components that exist gain, written
  beside this one.
- [RFC 0004](0004-motion.md), whose catalogue reaches each new component once it lands.
- [RFC 0008](0008-density.md), the density each new component is tested under.

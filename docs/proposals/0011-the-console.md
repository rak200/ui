# RFC 0011 — The console

- **Scope**: library
- **Created**: 2026-11-13

## Motivation

A tooltip written round a menu's item took the item out of the menu. It was drawn as the browser's
own button, passed over by the keys and left open by a click. The reader saw all of that and not
why, and a warning was offered for it: a menu child that is not an item. #409 made a tooltip work
inside an item, and `docs/menu.md` now says what one written round an item does. What is left is
whether the menu should say so in the console.

**A console that speaks too often is one nobody reads**, and this package already leans on it
being read: `docs/tooltip.md` says _the test is the console_ for whether a trigger will be
announced. A warning that fires on correct markup teaches a reader to stop looking, and takes that
test with it.

**Each component decides for itself today.** The icon and the tooltip each call `console.warn`
themselves, each its own way: the icon once an icon, the tooltip again at every edit of its tip,
neither with a code. A third warning would be a third way.

So this proposal builds **one console manager**, which every line the package says goes through in
place of `console` itself. It decides what the manager lets through: when a component here speaks,
how often, and who hears it, for every component at once. The menu is its first case, and the two
warnings that ship are measured under it.

## Study

### What speaks today

Two warnings, written to one criterion, which each docblock gives: **nothing on the page looks
wrong**.

- **`<ui-icon>`** warns when its `name` has no glyph registered and nothing was slotted in its
  place. A typo and a missing import both draw an empty box, with no error anywhere. It waits for
  the page's `load`, since a glyph a later script imports registers after the icon is first drawn:
  every icon on the workbench warned and then drew until #399.
- **`<ui-tooltip>`** warns when its trigger focuses a control inside its own shadow root, where the
  description cannot arrive. The tip shows and lands where it should, and the sentence never reaches
  what a screen reader reads. RFC 0006.

Each names the element, what failed and the way out. Neither carries a code, and neither is said
only once.

### Measured: what the suite lets through

The whole suite, 2584 tests in 32 files, ran in Chromium 153 with every console call that reached
the terminal recorded beside the test that made it. A test that mocks `console.warn` replaces the
recorder, so what was recorded is what no test asked for: 29 calls, every one a warning.

| Said                             | Times | By                                              |
| -------------------------------- | ----- | ----------------------------------------------- |
| Lit is in dev mode               | 21    | Lit, once in each test file that loads it       |
| `<ui-tooltip>` … will not arrive | 6     | the six tests of the tooltip's 1.4.13 dismissal |
| `<ui-icon name>` … drew nothing  | 2     | two tests of the icon's registry                |

**Nothing failed, and nothing would have.** No test fails on a console call it did not expect, and
only `tests/icon.test.ts` and `tests/tooltip.test.ts` watch the console, each for its own warning.
The tooltip's six are right about their fixture, a trigger that focuses a control in its own shadow
root, and nobody asked for them. Of the icon's two, _stops waiting on a name once the element leaves
the document_ is right when it is said. _Draws a glyph registered after the element was already in
the document_ is wrong: the glyph arrived, and the icon drew.

### Measured: how often each warning is said

On a page the workbench served, in Chromium 153:

| What the page did                                        | Warnings         |
| -------------------------------------------------------- | ---------------- |
| 30 icons under one unregistered name                     | 30               |
| one of them renamed to another unregistered name         | 1 more           |
| an icon whose glyph registers after the page has loaded  | 1, and then drew |
| a tooltip on a trigger with a control in its shadow root | 0                |
| ten such tooltips                                        | 0                |
| the tip of the first rewritten five times                | 5                |
| that tooltip moved once                                  | 1                |

The tooltips were written through `innerHTML`, as every situation here was.

**The icon says it once an icon**, so a typo copied down a list is a line for each icon. The
devtools fold a repeated line; a test that counts warnings and a monitor that records them do not.

**The tooltip says nothing as it is written in, and once for each edit after.** It hands the
sentence over in `connectedCallback`, and markup written through `innerHTML` upgrades in tree order,
so the tooltip connects before its trigger has upgraded: the trigger has no shadow root yet, and the
warning's condition is false. Every later hand-over warns again. The same order loses the sentence
itself, which _Found on the way_ records. The tooltip has since waited for its trigger to upgrade,
#413, and says it once as it is written in.

### Measured: every example in `docs/`

Every `html` block in `docs/`, 55 in 14 pages, was mounted as a reader would write it, with the
glyphs it names imported first. **None said anything, and the prototype below found nothing in any
of them.** Five hold a menu, and each of those menus holds a trigger and items, one an `<hr>` as
well, and nothing else.

### Who reads the console

- **The author**, with the devtools open, who is the one reader a warning is for.
- **A consumer's suite.** Some teams fail a test on any `console.warn` or `console.error`, and
  `jest-fail-on-console` exists to do only that. There a false positive of ours is a red build in
  someone else's repository, and a warning that is right is one more line they must set aside.
- **A monitor**, which records the console in production beside the errors.
- **The visitor**, who never opens it.

**So the bar is no false positive, and a way to quiet one warning by name.**

### How others decide

**Lit**, read in its own source, `@lit/reactive-element`'s development build:

- A warning is said once a page, by its text or by its code.
- It ends with a link to a page that explains it, `https://lit.dev/msg/<code>`.
- A page silences a code by adding it to `globalThis.litIssuedWarnings`.
- It exists only in the development build, which the `development` export condition chooses.

Which build each tool took, measured:

| Loaded by                                | Took        | The warning           |
| ---------------------------------------- | ----------- | --------------------- |
| the workbench, on Vite's dev server      | development | said once, at load    |
| the suite, in Vitest's browser mode      | development | said once a test file |
| `vite build`                             | production  | not in the output     |
| esbuild, by default                      | production  | not in the output     |
| esbuild, with `--conditions=development` | development | in the output         |

**Spectrum Web Components**, Adobe's, does the same with more to tune. Its dev mode comes through
the `development` condition. Its warnings have a type (`default`, `accessibility`, `api`) and a
level (from `default` to `high`, and `deprecation`). A page writes `window.__swc` to quiet a type, a
level or an element, and its documentation says not to deliver dev mode to users in production
([dev mode](https://opensource.adobe.com/spectrum-web-components/dev-mode/)). **What a second build
costs is on record there.** The development build called `window.__swc.warn` where Storybook had no
`window.__swc`, and opening an overlay threw a `TypeError` the production build never reached
([#5896](https://github.com/adobe/spectrum-web-components/pull/5896)).

**Vue and React each say something once a page in development**, measured on a page that renders a
menu with each: Vue, at `info`, that it is a development build; React, at `info`, where to get its
devtools. Lit's is a `warn`.

**A development build would cost this package two things it is built against.**

- **A page with no build step would never hear it.** That page loads `dist/` from a URL or through
  an import map, and a URL names a file: no resolver is there to choose a condition. It is a page
  the package promises to work in.
- **It is a second behaviour.** The TypeScript standard refuses dual builds because "a package that
  ships both formats ships two behaviours and debugs three", and Spectrum's crash in Storybook
  is that third debugging. The suite would test the source, which is neither build.

### Two kinds of failure

- **A silent failure.** The page looks right and something does not work. The tooltip's is one:
  the tip shows, and the sentence never arrives. The console is the only signal there is.
- **A visible failure whose cause is not.** The page looks wrong and does not say why. The menu's
  is one, and so, measured against this line, is the icon's: an empty box shows that something is
  missing, and the console carries the why.

The second kind is where the noise grows, because _not what the component expected_ takes in
markup a host means.

### Measured: what a host writes in a menu

Each situation was mounted, opened, walked once round with <kbd>↓</kbd> from its first item, and
run through axe at the suite's WCAG A and AA tags. The last column is the prototype's menu check,
which finds an element child that is not an item, a slotted trigger, an `<hr>`, a `<template>`, a
`<script>` or a `<style>`. Chromium 153.

| A host writes                                    | The menu takes | axe      | The check    |
| ------------------------------------------------ | -------------- | -------- | ------------ |
| items, an `<hr>`, a link, a disabled item        | all of them    | —        | —            |
| a `hidden` item                                  | it, drawn      | —        | —            |
| a `<template>` beside the items                  | the items      | —        | —            |
| a `<style>` and a `<script>`                     | the items      | —        | —            |
| a tooltip inside an item                         | the item       | —        | —            |
| a submit button joined to a form outside, `form` | the item       | —        | —            |
| a tooltip round an item                          | the others     | critical | the tooltip  |
| a component's own element round each item        | none           | critical | each one     |
| a form round a submit button                     | the others     | critical | the form     |
| a `<div>` round two items                        | the others     | critical | the `<div>`  |
| a list round the items                           | none           | critical | the list     |
| a checkbox in a label                            | the others     | critical | the label    |
| items a page's component forwards through a slot | none           | critical | the slot     |
| an `<a>` with no `href`                          | the others     | —        | the `<a>`    |
| a `<span>` naming a section                      | the items      | —        | the `<span>` |
| an `<h3>` naming a section                       | the items      | critical | the `<h3>`   |

axe's critical is `aria-required-children`, at every row that has one. For a component's own
element and for a list, it also reported `target-size` as serious. The keys reached what the menu
took, and passed over its disabled item.

**axe reports every situation that is certainly a mistake, as critical, and only with the menu
open.** Shut, the menus with a tooltip and a `<div>` round their items measured nothing in axe,
whose tree leaves the panel out, and the check found both either way. The check goes past axe
exactly twice, at an `<a>` with no `href` and at a `<span>` over a section, and those are the two a
host can mean: a link left inert on purpose, and a section's name, which the menu has no place for
until RFC 0010's sections arrive.

**What four frameworks leave between a menu's items**, each rendering three items from a list:

| Written with                                       | Between the items                |
| -------------------------------------------------- | -------------------------------- |
| Lit 3.3.3, `map`                                   | comments                         |
| Alpine 3.17.5, `x-for`                             | a `<template>`, kept before them |
| Vue 3.5.45, `v-for` on the item, and on a template | empty text                       |
| React 19.3.1, `map`, and a component in a fragment | nothing                          |

Each menu took its three items, and the check found nothing in any of them. **A check that did not
set `<template>` aside would speak at every menu Alpine writes.** A framework that renders each
component as an element of its own, as Angular does, writes the row of a component's own element
above, where the check is right (from Angular's documentation, not measured here).

### Measured: what a diagnosis weighs

The prototype has three checks, the menu's, the tooltip's and the icon's, with messages as long as
today's. Minified by esbuild 0.28.2, in bytes:

| Bundle                             | Minified | gzip   | brotli |
| ---------------------------------- | -------- | ------ | ------ |
| the package, with Lit left out     | 297,433  | 70,580 | 55,251 |
| `diagnose()`                       | 1,672    | 832    | 663    |
| the console manager, as prototyped | 123      | 130    | 114    |

**The diagnosis is a little over 1% of the package**, and only a page that imports it loads it.

### Measured: what else could be said, across the package

Every component was given what a page might write wrong, in Chromium 153, Firefox 155 and WebKit
26.5, which measured alike. Each situation was read in the accessibility tree, run through axe at
the suite's WCAG A and AA tags, and walked by the keys and the pointer where that is what the reader
does. **The console said nothing in any of them.**

**Seven leave something without a name:**

| Left with no name          | axe      |
| -------------------------- | -------- |
| an icon-only `<ui-button>` | critical |
| a `<ui-menu>`'s trigger    | critical |
| a `<ui-input>`             | critical |
| a `<ui-select>`            | critical |
| a `<ui-checkbox>`          | critical |
| a `<ui-radio-group>`       | —        |
| a `<ui-dialog>`, opened    | —        |

axe judges no radio group's name, and a dialog's only as best practice, which the suite's tags
leave out.

**The rest, none of which axe reported.** The last column is when a component could know: _at
once_ where what is written is wrong, _at the end_ where something is missing that could still
arrive, and _never_ where the page may mean it.

| A page writes                         | The reader meets              | Known          |
| ------------------------------------- | ----------------------------- | -------------- |
| a `<ui-tooltip>` with no tip          | a trigger nothing describes   | at the end     |
| a `<ui-menu>` with no items, opened   | an empty panel                | at the end     |
| a tooltip on a `<span>`               | a tip the keys never show     | at once        |
| a tooltip on a disabled button        | a tip the keys never show     | while it lasts |
| a `<ui-toast>` outside a toaster      | a toast nothing announces     | at once        |
| a `<ui-select>` holding `<option>`s   | a select with no choices      | at once        |
| a `<ui-radio>` outside a group        | nothing drawn                 | at once        |
| a density the package does not have   | a field as tall as with none  | at once        |
| a theme the package does not ship     | the default theme's accent    | never          |
| a placeholder as an input's only name | a name that goes as one types | never          |
| a link inside a tip                   | the link, reached by Tab      | nothing wrong  |

The pointer showed both tips the keys never reach, in the three engines. A field in a compact
region measured 34px; with no density, 40px, and 41px in Firefox.

**What is written wrong is known at once; what is missing only at the end, and no component knows
when the end is.** A tip and an item written into a tooltip and a menu half a second after each
connected were missing at first, and worked once they arrived. The icon's one measured false
positive is this case: a glyph missing until it registers.

**Every missing name but two is axe's already, as critical**, so a page that runs axe has five of
the seven.

**Three are silent, known at once, and out of axe's sight**: the description that will not arrive,
which today's warning says; a tooltip whose trigger the keys cannot reach; and a toast outside a
toaster, drawn in the flow and announced by nothing. A tooltip on a disabled button is a fourth for
as long as the button is disabled, which is a state the page changes rather than a thing it wrote.

**A name the package does not know may be the page's own.** A theme can be written under any name,
as `docs/theme.md` shows with `[data-ui-theme='yours']`, so an unknown one is nothing to say. A
density has one level, `compact`, and no way to name another, so an unknown density is a typo.

**The platform already says one.** A second copy of the package throws `NotSupportedError` at
`customElements.define()`, in each engine's own words.

**A diagnosis has to walk the shadow roots it can open.** An app built of components holds ours in
its own shadow roots. From the document, the prototype found nothing in an app's shell; from the
shell's root, it found the item a tooltip had taken out of its menu.

### Found on the way

The first round found two defects, and each was fixed on its own:

- **A tooltip written through `innerHTML` did not hand its sentence over**, nor warn about a
  trigger that strands it, #411. It now waits for its trigger to upgrade, #413.
- **A `hidden` item was drawn**, 30px tall, and the keys reached it, #412. An item the page hid
  itself stopped the keys, which never got past it. Both are left out now, #414.

The second round found a third, fixed on its own too:

- **`docs/toast.md` said a toast outside a toaster renders nothing**, #416. Written into a plain
  element, it was drawn in the flow, 42px tall with its dismiss button, carried `slot="polite"`, and
  sat in no live region. The sentence held only where the toast's parent is another component's
  host, whose shadow root has no slot of that name. The page now says what each place does, #417.

## Proposed design

### The console manager

**Every line the package says goes through one module, `src/console.ts`, and nothing else in `src/`
calls the console.** A component hands it a code, a cause, the message and the element, and the
manager decides whether the line is said, and says it. `analyse` holds the second half: ESLint's
`no-console` turns on over `src/`, and the manager's one call to `console.warn` is the line set
aside, with its reason beside it, so a call written anywhere else fails the pipeline.

What it does with every line:

- **It remembers the line by its code and its cause**, and leaves out a repeat wherever it falls,
  once a page, which rule 2 below states.
- **It writes the code first and the link last**, the link to the code's heading in
  `docs/console.md` on `master`, which rule 3 states.
- **It hands the element over** as the second argument, which the devtools show as a node.
- **It says it as `console.warn`**, and has no other level to say it at, which rule 4 states.

**What a component no longer does** is decide whether it has spoken, write a code or build a link.
The icon's listener, one an icon, and the tooltip's warning, said again at every edit, each become
one call, and the manager's memory is what keeps each to one line.

**It is internal**, as `src/description.ts` is. What a page meets is the console's lines and
`diagnose()`, never the manager. The diagnosis logs through it too, so a finding a warning has said
is not said again, and one an earlier log said is not repeated by the next.

### Two tiers

**A failure speaks always where it is silent, known at once, and out of axe's sight**:

- the description that will not arrive, `ui-tooltip:stranded`, as today;
- a tooltip whose trigger takes no tab stop, so the keys never show its tip;
- a toast written outside a toaster, drawn and announced by nothing.

**The icon speaks always too, once its glyph has had time to arrive.** Its failure shows, as an
empty box, and what it checks is missing, so by the rule above it would be the diagnosis's. But the
box never says why, and the why is the mistake this design meets most, a typo or a missing import.
So the icon waits two seconds past the later of the page's `load` and its own first update, and
says it only for a name still unregistered then. A glyph a page imports as it renders the icon
arrived 6 to 53ms later, measured, which the wait takes in. One on a network slower than the wait
is the false positive left, and once a name keeps it to one line. Two seconds is a reading of the
network rather than of motion, so it is no token, as the toast's dwell is not.

The manager holds each to four rules:

1. **No false positive, held by a gate.** Every story and every example in `docs/` mounts silent,
   and a console call no test expected fails the suite. A test that means a warning says so, and
   Lit's dev-mode warning is the one line set aside, by its code.
2. **Once a page for each cause, wherever the repeat falls.** What has been said is remembered by
   its code and its cause, a name for the icon and a trigger's tag for the tooltip, and a repeat
   is left out however far from the first it comes and whatever was said between them: thirty
   icons under one typo are one line, and so are five edits of one tip. The element goes as the
   second argument, so the devtools reveal which one.
3. **A code in the message, and a link to what it means.** Each code, such as
   `ui-tooltip:stranded`, which a consumer's suite and the devtools' filter can name, has an entry
   of its own in `docs/console.md`, with what it means and the way out, under a heading that is the
   code. GitHub anchors that heading as the code with its colon left out, `#ui-tooltipstranded`. The
   message ends with a link to that anchor on the repository's `master`, and a code never changes,
   so the link holds as the page around it moves.
4. **`console.warn`, never `console.error`**, which a monitor reads as a failure. The message keeps
   today's three parts: what happened, what it costs, the way out.

**The rest is a diagnosis, said only when asked.** `diagnose(root)` returns what it finds, the code,
the element and the message, and prints nothing. A page logs it, and a consumer's test asserts it
empty, as this suite asserts axe. The menu's check is its first. The icon's and the tooltip's run
there too, where they can be asked about a shut menu, a fragment or a test. It is an entry of its
own, `@rak200/ui/diagnose.js`, beside the glyphs', so a page that never asks loads none of it.

**Asked to log what it finds, it says only what is new.** It returns every finding, so a test sees
them all. Logged, a finding already said is left out by the manager's memory, so a page
that logs the diagnosis at each route hears each mistake once a page, and never again after a
warning has said it.

**Asked, what is missing can be said.** The page asks once it is done, which no component can
tell, so what is known only at the end belongs to the diagnosis: a missing tip, item or glyph, and
the two names axe does not judge, a radio group's and a dialog's. So does what is visible and
wrong: a menu's child that is not an item, an `<a>` with no `href` and a `<span>` naming a section
among them, for the page to judge; items a component forwards to a menu through a slot; an
`<option>` in a select; a radio outside its group; an unknown density. It walks every shadow root
it can open.

**It leaves to axe what axe reports**, the five missing names axe holds as critical, so a page that
runs both reads each once.

**Nothing is said for a tooltip on a disabled control.** It is common, and meant to say why the
control is disabled, and the keys never reach it, in the three engines. `docs/tooltip.md` says so
and points at `aria-disabled`, and the package says nothing.

**Nothing is said for a name that may be the page's own**, as a theme's may, nor for what the
platform already says.

**No development build.** A page with no build step would never hear it, and it would be the second
behaviour the standard refuses.

### What each looks like

Every example below is what the design above will make available, written as a page writes it and
shown as the console will show it. A warning is one line in the console. Each is printed here on
one line too, and the devtools show the element after the link as a node they can reveal.

#### The manager, as the package calls it

A component calls one function, with the code, the cause, the message and the element:

```ts
// src/icon.ts, two seconds past the later of load and the icon's first update
import { warn } from './console.js';

warn(
  'ui-icon:unregistered',
  this.name,
  `<ui-icon name="${this.name}"> drew nothing: no glyph is registered under that name. ` +
    `Import it — import '@rak200/ui/icons/${this.name}.js' — or slot an <svg> of your own.`,
  this,
);
```

The diagnosis, asked to log, hands each finding to the same function, with the cause it found it
under, so what any of them has said is said once:

```ts
// src/diagnose.ts
for (const finding of found) {
  warn(finding.code, finding.cause, finding.message, finding.element);
}
```

And the pipeline holds the rest of `src/` to it:

```js
// eslint.config.js: nothing in src/ calls the console but the manager
{ files: ['src/**/*.ts'], rules: { 'no-console': 'error' } },
```

```ts
// src/console.ts, the one line set aside
// eslint-disable-next-line no-console -- every line the package says is said here, once
console.warn(`[${code}] ${message} ${docs}#${code.replace(':', '')}`, element);
```

#### The warnings that speak always

**`ui-tooltip:stranded`**, a trigger that focuses a control inside its own shadow root:

```html
<ui-tooltip>
  <x-save-button></x-save-button>
  <span slot="tip">Saves the draft.</span>
</ui-tooltip>
```

```text
[ui-tooltip:stranded] <ui-tooltip> described <x-save-button>, and the description will not arrive: it focuses a control inside its own shadow root, which an id in your tree cannot reach. Where the text has to be announced, the trigger has to be a control you wrote — a native <button>, <a href> or form control. https://github.com/rak200/ui/blob/master/docs/console.md#ui-tooltipstranded
```

**`ui-tooltip:unreachable`**, a trigger that takes no tab stop:

```html
<ui-tooltip>
  <span>Draft</span>
  <span slot="tip">Saved two minutes ago.</span>
</ui-tooltip>
```

```text
[ui-tooltip:unreachable] <ui-tooltip> describes a <span> the keys never reach: it takes no tab stop, so only a pointer shows the tip. Write the trigger as a <button> or an <a href>, which take one. https://github.com/rak200/ui/blob/master/docs/console.md#ui-tooltipunreachable
```

**`ui-toast:outside`**, a toast written outside a toaster:

```html
<main>
  <ui-toast variant="success">Invoice sent.</ui-toast>
</main>
```

```text
[ui-toast:outside] <ui-toast> is outside a <ui-toaster>, so nothing announces it: the regions that do are the toaster's. Write it inside the page's <ui-toaster>. https://github.com/rak200/ui/blob/master/docs/console.md#ui-toastoutside
```

**`ui-icon:unregistered`**, a name with no glyph two seconds past the later of `load` and the icon's
first update:

```html
<ui-icon name="pencl"></ui-icon>
```

```text
[ui-icon:unregistered] <ui-icon name="pencl"> drew nothing: no glyph is registered under that name. Import it — import '@rak200/ui/icons/pencl.js' — or slot an <svg> of your own. https://github.com/rak200/ui/blob/master/docs/console.md#ui-iconunregistered
```

#### A repeat, wherever it falls

```html
<ui-icon name="pencl"></ui-icon>
<main><ui-toast variant="success">Invoice sent.</ui-toast></main>
<ui-icon name="pencl"></ui-icon>
<ui-icon name="trsh"></ui-icon>
```

**Three lines**: the toast's at once, and two seconds on, one for `pencl`, whose second icon repeats
the first with the toast's line between them, and one for `trsh`, a cause of its own. Thirty icons
under `pencl` would still be one line, and so would five edits of a stranded tip.

#### The diagnosis

```js
import { diagnose } from '@rak200/ui/diagnose.js';

// Everything wrong under a root, as data, with nothing printed. The root is walked into every
// shadow root it can open, so the document reaches the components an app's own shell holds.
const findings = diagnose(document);
// [{ code: 'ui-menu:not-an-item', element: <ui-tooltip>, message: '<ui-menu> holds …' }, …]

// The same findings, and what is new among them logged too, through the manager:
// a second call at the next route prints only the mistakes the page has not heard yet.
diagnose(document, { log: true });
```

It finds the four that speak always, the icon's without waiting, since the page asking is the page
saying it is done, and these besides:

| Code                     | A page writes                                                      |
| ------------------------ | ------------------------------------------------------------------ |
| `ui-menu:not-an-item`    | a tooltip round an item, an `<a>` with no `href`, a section's name |
| `ui-menu:forwarded`      | a `<slot>` that forwards a component's items to its menu           |
| `ui-menu:no-items`       | a menu with no item                                                |
| `ui-tooltip:no-tip`      | a tooltip with no tip                                              |
| `ui-select:option`       | an `<option>` in a `<ui-select>`                                   |
| `ui-radio:outside`       | a `<ui-radio>` outside a group                                     |
| `ui-radio-group:unnamed` | a group with no `label`                                            |
| `ui-dialog:unnamed`      | a dialog with no title                                             |
| `ui-density:unknown`     | `data-ui-density="compacted"`                                      |

One of them, as the log prints it:

```text
[ui-menu:not-an-item] <ui-menu> holds a <ui-tooltip> that is not an item: the menu takes as items only the <button> and <a href> written as its own children, so what this one holds is drawn as written, passed over by the keys and left out of the menu's choices. Write the item as the menu's child, and the tooltip inside it. https://github.com/rak200/ui/blob/master/docs/console.md#ui-menunot-an-item
```

#### In a consumer's test

```js
import { diagnose } from '@rak200/ui/diagnose.js';

it('writes the components the way they work', () => {
  container.innerHTML = toolbar();

  expect(diagnose(container)).toEqual([]);
});
```

#### Quieting one code

In the devtools, a filter of `-ui-icon:unregistered` hides that code's lines and no other. In a
suite that fails on any warning, the code is what lets one through by name:

```js
const warn = vi.spyOn(console, 'warn');

afterEach(() => {
  const unexpected = warn.mock.calls.filter(
    ([text]) => !String(text).startsWith('[ui-icon:unregistered]'),
  );

  expect(unexpected).toEqual([]);
});
```

#### In `docs/console.md`

Each code has an entry under its own heading, which the warning's link lands on:

```md
### `ui-icon:unregistered`

**An icon whose name has no glyph registered draws nothing**, and says so two seconds past the
later of the page's load and its own first update, once a name. A typo in `name` and a glyph
module nobody imported look the same.

Import the glyph's module, `import '@rak200/ui/icons/x.js'`, or slot an `<svg>` of your own.
```

#### In `docs/tooltip.md`

The disabled control, which the package says nothing about:

```md
**A tooltip on a disabled control is shown by no key.** A disabled button takes no tab stop, so
only a pointer shows its tip. Where the tip says why the button is disabled, write
`aria-disabled="true"` instead, which keeps the button in the tab order, and refuse the press in
your own handler.
```

#### In this repository's suite

**A console call no test expected fails the test it was made in.** A test that means a warning
names its code, and Lit's dev-mode warning is set aside by its own, `dev-mode`.

### Alternatives, and what retired each

- **Every warning always, as today.** The suite's eight unasked warnings, and thirty lines for one
  typo copied down a list of icons, are that design, measured.
- **A development build**, as Lit and Spectrum ship. The page with no build step and the second
  behaviour retired it, above.
- **A check on every menu child, with no set of quiet ones.** Alpine's `<template>` retired it,
  measured: it would speak at every menu Alpine writes.
- **A check, as a component connects, for what it is missing.** A tip and an item written in half a
  second later retired it, measured: it would have spoken at both, and both worked.
- **Telling a typo from a missing import by the names the set ships.** The 2048 names weigh 8,028
  bytes gzipped, about 11% of the package, on every page, for what the wait already answers.
- **The icon's warning moved to the diagnosis.** A typo would go back to an empty box with nothing
  said, and the wait leaves a false positive only where the network is slower than it.
- **The diagnosis repeating what axe reports.** A page that runs both would read each name twice,
  and the diagnosis is for what axe cannot see.
- **A tooltip on a disabled control said always, or when asked.** It would be a line in the console
  of every page that disables a button with a tip, a common pattern the docs can answer instead.
- **A menu taking forwarded items now.** Its `::slotted()` reaches no item forwarded through a
  slot, so they need another way to be drawn, which is a feature rather than a warning.
- **A code with no link, or a link to the published version.** The first leaves the reader to find
  the page, and the second needs the version written into the build. A link to `master`, under an
  anchor that is the code and never changes, needs neither.

## Decision

**The aim, as review put it, is one console manager.** Every line the package says goes through
`src/console.ts`, nothing else in `src/` calls the console, and `analyse` holds that through
`no-console`. The tiers and the rules are what the manager lets through and how it says it.

**Every question the study left is settled**, and the proposed design above is written to the
answers:

1. **The icon keeps speaking, once its glyph has had time to arrive**: two seconds past `load`,
   once a name. Its box shows that something is missing and never why, and the wait takes in a
   glyph a page imports as it renders the icon.
2. **The two new warnings speak always**: a tooltip whose trigger takes no tab stop, and a toast
   outside a toaster. Each is silent, known at once and out of axe's sight.
3. **A tooltip on a disabled control is the docs' alone.**
4. **The diagnosis leaves to axe the five names axe reports**, and says what axe cannot see.
5. **An `<a>` with no `href` and a `<span>` naming a section are the diagnosis's**, as children
   that are not items, for the page to judge.
6. **Items forwarded to a menu through a slot are diagnosed now.** Taking them joins
   [RFC 0010](0010-component-features.md)'s catalogue.
7. **Each code is explained in `docs/console.md`**, and each message links to its heading's anchor
   there, on `master`.
8. **A repeat is the same code and the same cause**, so it is left out wherever it falls, as review
   asked.

The proposal stays in study until it is accepted, which is the step left.

## Rollout

If it is accepted, one pull request for each step, in this order:

1. **The gate, first**, because it is what keeps every later warning honest. The suite fails on a
   console call no test expected, and the eight it lets through today are either asked for or
   answered.
2. **The console manager, `src/console.ts`.** It says a line once a page for each code and cause,
   wherever the repeat falls, writes the code first and the link last, hands the element over, and
   says it as `console.warn` alone. `docs/console.md` explains each code under its own heading,
   which each link lands on. The icon's and the tooltip's warnings move onto it in the same step,
   and `no-console` turns on over `src/`, so the manager's own call is the one line set aside. Its
   tests say one cause twice with another between, and read one line for it.
3. **The warnings that speak always, on the manager**: the icon's wait, two seconds past `load`,
   then the two new ones, a tooltip whose trigger takes no tab stop and a toast outside a toaster.
4. **`docs/tooltip.md` says a tooltip on a disabled control is never reached by the keys**, and
   points at `aria-disabled`.
5. **`diagnose()`**, with the menu's check first, then the rest the design lists, a page in
   `docs/`, and its logging through the manager.

The defects found on the way were fixed on their own, in #413, #414 and #417.

## Related

- RFC 0006, which made the tooltip's warning the test of whether a trigger will be announced.
- #399, where the icon's warning learned to wait for the page to load.
- [RFC 0010](0010-component-features.md), whose menu sections would give a section's name a place,
  and whose catalogue takes the items a menu is forwarded through a slot.
- #409, which made a tooltip work inside a menu's item.
- #413 and #414, which fixed what this proposal's first round found, and #417, what its second
  found.

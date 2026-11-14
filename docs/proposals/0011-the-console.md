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

So this proposal decides when a component here speaks, how often, and who hears it, for every
component at once. The menu is its first case, and the two warnings that ship are measured under
it.

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
itself, which _Found on the way_ records.

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

| Bundle                               | Minified | gzip   | brotli |
| ------------------------------------ | -------- | ------ | ------ |
| the package, with Lit left out       | 297,433  | 70,580 | 55,251 |
| `diagnose()`                         | 1,672    | 832    | 663    |
| a helper that warns once for a cause | 123      | 130    | 114    |

**The diagnosis is a little over 1% of the package**, and only a page that imports it loads it.

### Found on the way

Two defects, which this proposal does not fix and which each go on their own:

- **A tooltip written through `innerHTML` does not hand its sentence over.** Round a
  `<ui-button>`, the button had no description once the markup went in, and had it once the tip
  was edited. Built with `createElement` and appended, it had it at once. The cause is the one the
  silent warning measured above: the hand-over runs as the tooltip connects, before the trigger
  upgrades, and the `slotchange` that follows finds the pair already wired.
- **A `hidden` item is drawn.** In an open menu it measured `display: block`, 30px tall, and the
  keys reached it.

## Proposed design

### Two tiers

**A silent failure speaks, always**, under four rules:

1. **No false positive, held by a gate.** Every story and every example in `docs/` mounts silent,
   and a console call no test expected fails the suite. A test that means a warning says so, and
   Lit's dev-mode warning is the one line set aside, by its code.
2. **Once a page for each cause**: once a name for the icon, once a trigger's tag for the tooltip.
   The element goes as the second argument, so the devtools reveal which one.
3. **A code in the message**, such as `ui-tooltip:stranded`, which a consumer's suite and the
   devtools' filter can name and `docs/` explains.
4. **`console.warn`, never `console.error`**, which a monitor reads as a failure. The message keeps
   today's three parts: what happened, what it costs, the way out.

**The rest is a diagnosis, said only when asked.** `diagnose(root)` returns what it finds, the code,
the element and the message, and prints nothing. A page logs it, and a consumer's test asserts it
empty, as this suite asserts axe. The menu's check is its first. The icon's and the tooltip's run
there too, where they can be asked about a shut menu, a fragment or a test.

**No development build.** A page with no build step would never hear it, and it would be the second
behaviour the standard refuses.

### What the measurements leave open

1. **The icon is not a silent failure by this line**, since an empty box shows. The first tier
   would move it to the diagnosis, and a typo would go back to drawing nothing with nothing said.
   Either it keeps speaking, for a reason the line does not give, or it moves.
2. **The icon's one measured false positive is a glyph registered after the page has loaded**, as a
   view loaded later imports its own glyphs. Once a name makes it one line. Nothing short of the
   future removes it.
3. **axe already reports every menu situation that is certainly wrong**, as critical, with the menu
   open. A diagnosis earns its place by what axe cannot see: a shut menu, a description that will
   not arrive, a glyph that never registered.
4. **Two situations are ones a host can mean**: an `<a>` with no `href`, and a section's name. They
   are either set aside or said by the diagnosis alone.
5. **A menu takes no item that a component of the page forwards through a slot.** That is either
   diagnosed or made to work, by reading the slot's flattened assignment, and the second is a
   feature rather than a warning.
6. **A code's explanation needs a place to live.** A link in each message needs a page that stays
   put, and `docs/` moves with the code.

### Alternatives, and what retired each

- **Every warning always, as today.** The suite's eight unasked warnings, and thirty lines for one
  typo copied down a list of icons, are that design, measured.
- **A development build**, as Lit and Spectrum ship. The page with no build step and the second
  behaviour retired it, above.
- **A check on every menu child, with no set of quiet ones.** Alpine's `<template>` retired it,
  measured: it would speak at every menu Alpine writes.

## Decision

**Not taken yet.** The proposal stays in study while more situations are weighed, and nothing above
is settled.

## Rollout

If it is accepted, one pull request for each step, in this order:

1. **The gate, first**, because it is what keeps every later warning honest. The suite fails on a
   console call no test expected, and the eight it lets through today are either asked for or
   answered.
2. **The warnings that keep speaking onto the rules**: a code each, said once for each cause, with
   the element handed over.
3. **`diagnose()`**, with the menu's check first and a page in `docs/`, and the icon's and the
   tooltip's beside it.

The two defects found on the way are fixed before any of these, each on its own.

## Related

- RFC 0006, which made the tooltip's warning the test of whether a trigger will be announced.
- #399, where the icon's warning learned to wait for the page to load.
- [RFC 0010](0010-component-features.md), whose menu sections would give a section's name a place.
- #409, which made a tooltip work inside a menu's item.

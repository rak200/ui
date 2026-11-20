# diagnose

[← Reference](README.md)

Everything the components can tell is wrong under a root, as data, said only when a page asks.

```js
import { diagnose } from '@rak200/ui/diagnose.js';
```

## Contents

- [`diagnose()`](#diagnose)
- [What it finds](#what-it-finds)
- [Logging what it finds](#logging-what-it-finds)
- [In a test](#in-a-test)
- [What it leaves to axe](#what-it-leaves-to-axe)

## `diagnose()`

```js
const findings = diagnose(document);
// [{ code: 'ui-menu:not-an-item', element: <ui-tooltip>, message: '<ui-menu> holds …' }, …]
```

| Parameter | Type              | Default    | What it is                                                  |
| --------- | ----------------- | ---------- | ----------------------------------------------------------- |
| `root`    | `ParentNode`      | `document` | Where to look: a document, an element, a shadow root        |
| `options` | `DiagnoseOptions` | `{}`       | `{ log: true }` logs what is new among the findings as well |

It returns an array of `Finding`, each with three fields: the `code`, which
[console.md](console.md#codes) explains under a heading of its own; the `element` the finding is
about; and the `message`, which says what happened, what it costs and the way out. It prints
nothing unless it is asked to, and the array is empty where every component is written the way it
works.

**It is an entry of its own**, beside the glyphs', so a page that never asks loads none of it:
`@rak200/ui` does not export it.

**It walks into every shadow root it can open**, so the document reaches the components an app's
own shell holds, and an element handed to it as the root is asked about as well as what it holds. A
closed shadow root is not walked, nor a `<template>`'s content, which is no part of the page.

**Ask it once the page has drawn what it means to.** No component knows when a page is done, so
nothing that is missing as a component connects is said then: a tip, an item or a glyph may still
arrive. The page asking is the page saying it is done, so the diagnosis says what is missing, and
it reads what the components have drawn, which is how it knows that the keys reach a
`<ui-button>`. A diagnosis made before they have drawn finds them as they are, not drawn yet.

## What it finds

The four lines that speak always, in the same words, and the icon's without the two seconds it
waits:

| Code                                                         | A page writes                                                  |
| ------------------------------------------------------------ | -------------------------------------------------------------- |
| [`ui-icon:unregistered`](console.md#ui-iconunregistered)     | an icon whose `name` has no glyph registered                   |
| [`ui-tooltip:stranded`](console.md#ui-tooltipstranded)       | a tooltip on a trigger that focuses inside its own shadow root |
| [`ui-tooltip:unreachable`](console.md#ui-tooltipunreachable) | a tooltip on a trigger the keys never reach                    |
| [`ui-toast:outside`](console.md#ui-toastoutside)             | a toast outside a `<ui-toaster>`                               |

And these, which only a diagnosis says:

| Code                                                         | A page writes                                                      |
| ------------------------------------------------------------ | ------------------------------------------------------------------ |
| [`ui-menu:not-an-item`](console.md#ui-menunot-an-item)       | a tooltip round an item, an `<a>` with no `href`, a section's name |
| [`ui-menu:forwarded`](console.md#ui-menuforwarded)           | a `<slot>` that forwards a component's items to its menu           |
| [`ui-menu:no-items`](console.md#ui-menuno-items)             | a menu with no item                                                |
| [`ui-tooltip:no-tip`](console.md#ui-tooltipno-tip)           | a tooltip with no tip                                              |
| [`ui-select:option`](console.md#ui-selectoption)             | an `<option>` in a `<ui-select>`                                   |
| [`ui-radio:outside`](console.md#ui-radiooutside)             | a `<ui-radio>` outside a group                                     |
| [`ui-radio-group:unnamed`](console.md#ui-radio-groupunnamed) | a group with no `label`                                            |
| [`ui-dialog:unnamed`](console.md#ui-dialogunnamed)           | a dialog with no title                                             |
| [`ui-density:unknown`](console.md#ui-densityunknown)         | `data-ui-density="compacted"`, or any density but `compact`        |

**What a page writes on purpose finds nothing.** A menu's trigger, an `<hr>` between its items, and
the `<template>`, `<script>` or `<style>` a framework writes beside them are no mistake: Alpine
keeps a `<template>` before the items it writes, so a check that took one for a mistake would speak
at every menu Alpine writes. Nor does a theme the package does not ship, which may be the page's
own, nor a tooltip on a disabled control, which [tooltip.md](tooltip.md) answers.

## Logging what it finds

```js
diagnose(document, { log: true });
```

**Logged, it says only what is new**, at `info`, through the one place every line the package says
goes through. A finding is said once a page for its code and its cause, so a page that logs at
each route hears each mistake once, and never again after a warning has said it. The cause is the
element's tag, or the value the page wrote, an icon's name or a density's, so two icons under one
typo are one line and two typos are two.

**`data-ui-quiet` quiets the log as it quiets a warning**, by its code, by `info` or by `all`, on
the root or on any element round the one a finding is about, as [console.md](console.md#quieting)
says. A page that quiets `warn` still hears what it asked for. The findings come back whole
whatever is logged and whatever is quieted.

## In a test

```js
import { diagnose } from '@rak200/ui/diagnose.js';

it('writes the components the way they work', async () => {
  container.innerHTML = toolbar();
  await new Promise(requestAnimationFrame);

  expect(diagnose(container)).toEqual([]);
});
```

**A test asserts it empty, as it asserts axe.** This package's own suite logs a diagnosis of every
story and every example in `docs/` as it mounts them, and fails on any line it did not expect.

## What it leaves to axe

**The names axe reports are axe's**: an icon-only `<ui-button>`, a menu's trigger, a `<ui-input>`,
a `<ui-select>` and a `<ui-checkbox>` with none, each critical there, so a page that runs both reads
each once. A radio group's name and a dialog's are here instead, since axe judges no radio group's
name and a dialog's only as best practice.

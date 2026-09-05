# UiToaster

[← Reference](README.md)

Feedback after an action — saved, failed, undone — announced once and dismissed by the reader or by
a clock.

```js
import '@rak200/ui';
```

## Contents

- [`<ui-toaster>`](#ui-toaster)
- [`<ui-toast>`](#ui-toast)
- [`ToastVariant`](#the-variant-decides-three-things)
- [Two regions, and why not one](#two-regions-and-why-not-one)
- [The variant decides three things](#the-variant-decides-three-things)
- [Dismissal](#dismissal)
- [Showing a toast](#showing-a-toast)
- [Queueing](#queueing)
- [Where to put the toaster](#where-to-put-the-toaster)
- [Styling](#styling)

## `<ui-toaster>`

```html
<ui-toaster></ui-toaster>
```

The place toasts go, and the thing that announces them. Put **one** on the page, empty, and leave it
there: a live region has to be in the document _before_ the message is put into it, which is the
single most common reason a toast is never read out.

It draws the stack in the block-end inline-end corner of the viewport, takes no clicks of its own,
and is a `popover` — so it is in the top layer, escapes every `overflow: hidden` and every stacking
context, and there is no `z-index` in this package to tune.

The classes are exported as `UiToaster` and `UiToast` for a host that needs the types; importing the
package registers both elements, so nothing has to be called.

## `<ui-toast>`

```html
<ui-toaster>
  <ui-toast variant="success">Invoice sent.</ui-toast>
</ui-toaster>
```

One message. A child of the toaster, in **your** tree — the component writes its `slot` to route it
into the region its variant names, and nothing else about it moves.

**A toast outside a `<ui-toaster>` renders nothing.** The `slot` it wrote on itself names a region
that is not there, so the element is in the document and assigned to no slot. That is the same thing
a stray `<option>` or `<td>` does, and the fix is the same: put it in the element that holds it.

| Attribute       | Type                    | Default   | Means                                          |
| --------------- | ----------------------- | --------- | ---------------------------------------------- |
| `variant`       | `ToastVariant`          | `info`    | what happened — see below                      |
| `duration`      | number, in milliseconds | `5000`    | how long before it dismisses itself; `0` never |
| `dismiss-label` | string                  | `Dismiss` | the accessible name of the dismiss button      |

| Event        | Fires                                                                        |
| ------------ | ---------------------------------------------------------------------------- |
| `ui-dismiss` | after the exit and **before** the toast removes itself; bubbles and composed |

| Method      | Does                                           |
| ----------- | ---------------------------------------------- |
| `dismiss()` | runs the exit, announces it, removes the toast |

`ToastVariant` is exported for a host that needs the type: `'info' | 'success' | 'warning' |
'danger'`.

**`dismiss-label` is this package's one user-facing string.** It is an attribute precisely because it
is one: a page that is not in English replaces it rather than forking the component.

## Two regions, and why not one

The toaster renders two live regions and never removes either: one `aria-live="polite"`, one
`aria-live="assertive"`. A toast is added to whichever its variant names.

**The number of regions is the number of politenesses, not the number of messages.** Giving each
toast its own `aria-live` would make every message its own region root — which is the shape that
fails, because a region announces _changes_ and a region that arrives with its content already inside
has no change to announce. Two regions that outlive every message answer _politeness is per toast_
without ever creating one.

**Neither region carries `role="alert"` or `role="status"`.** Both roles imply `aria-atomic="true"`,
so every arrival re-announces the whole stack — three toasts up means the third one reads all three.
Bare `aria-live` leaves atomicity at its `false` default, which announces the toast that arrived and
nothing else. The semantics of `role="alert"` are `aria-live="assertive"` plus that atomicity; this
keeps the half that is right for a stack.

## The variant decides three things

|           | Announced   | Expires                     | Edge                 |
| --------- | ----------- | --------------------------- | -------------------- |
| `info`    | politely    | after `duration`            | `--ui-color-accent`  |
| `success` | politely    | after `duration`            | `--ui-color-success` |
| `warning` | politely    | after `duration`            | `--ui-color-warning` |
| `danger`  | assertively | **never**, whatever you set | `--ui-color-danger`  |

Those three are one answer: **an error is the message the reader has to see, hear, and keep.**

**There is deliberately no separate politeness attribute.** Two knobs can disagree, and a polite error
or an assertive success is a defect nothing reports — where one knob cannot be wrong. What it gives up
is real and is stated rather than hidden: **there is no way to write an assertive success.** If you
find yourself wanting one, the message is probably an error.

**The colour is redundant, and must stay redundant.** WCAG 1.4.1 asks that colour never be the only
carrier of information: write a message that says what happened, and let the edge agree with it. That
is also what makes the component correct under `forced-colors`, where the edge goes flat and nothing
is lost.

## Dismissal

**Manual always.** Every toast has a dismiss button, and there is no attribute to remove it — a toast
that cannot be dismissed _and_ does not expire is a permanent obstruction, and that combination is one
attribute away in every kit that offers the knob. <kbd>Esc</kbd> dismisses a toast the reader has
tabbed into.

**Timed unless you say otherwise.** `duration` is in milliseconds and defaults to `5000`; `0` turns
the clock off. A `danger` toast has no clock whatever `duration` says.

**The clock stops while the toast is being read** — while the pointer is over it, or the focus is
inside it — and starts again when both have left. That is WCAG 2.2's **2.2.1 Timing Adjustable**
aimed at the only time limit this component has.

**`duration` is not a token, and that is deliberate.** Every `--ui-duration-*` name collapses to
`0.01ms` under `prefers-reduced-motion`, which is right for a transition and catastrophic for a dwell:
the notice would vanish before it could be read, and only for the people least able to chase it. The
entrance and exit _are_ tokens and do collapse, which is the half that should.

## Showing a toast

**The toaster is a place, not a factory.** Append a toast to it:

```js
const toaster = document.querySelector('ui-toaster');

toaster.append(
  Object.assign(document.createElement('ui-toast'), {
    variant: 'success',
    textContent: 'Invoice sent.',
  }),
);
```

Set the variant **before** inserting, which the example does: the toast routes itself into its region
in the same task it is inserted, so nothing ever observes it in the other one. Changing the variant
afterwards works and moves it, at the cost of a message that may be announced twice.

**A dismissed toast removes itself**, after dispatching `ui-dismiss` while it is still in the tree so
the event can reach a listener above it. A framework rendering a list of toasts drops the entry there:

```js
toaster.addEventListener('ui-dismiss', (event) => {
  remove(event.target.dataset['id']);
});
```

## Queueing

**There is none, and that is the decision rather than the omission.** Every toast is shown when it
arrives.

A queue is a second serialisation on top of the one `aria-live` already performs, and it delays the
_announcement_ of a message to a moment the library chose. A queued error is an error the reader has
not been told about — which is the failure mode that matters here. The stack grows instead, newest
nearest the corner, and the polite region sits above the assertive one so an error is the toast
closest to where the eye already is.

If the stack can grow without bound in your application, the bound belongs where the messages are
generated, not here.

## Where to put the toaster

Last in `<body>`, outside anything that scrolls. Two things follow from the platform rather than from
this component:

- **Tab order is document order.** A toast's dismiss button is a real button in your tree, so where
  the toaster sits is where it lands in the tab sequence. Last means a reader reaches the page before
  they reach the notices.
- **A modal `<dialog>` makes the rest of the document inert**, which removes it from the accessibility
  tree. A toaster outside an open modal is not announced while that modal is open — whichever layer it
  is in, so this is not something the top layer can fix. A page that toasts from inside a dialog puts
  a second `<ui-toaster>` inside the dialog.

## Styling

Every value is a [token](tokens.md); nothing here is hardcoded.

| Part          | Token                                                          |
| ------------- | -------------------------------------------------------------- |
| stack padding | `--ui-space` × 2                                               |
| stack width   | capped at `--ui-space` × 44, and at the viewport               |
| gap           | `--ui-space`                                                   |
| toast padding | `--ui-space` and `--ui-space` × 1.5                            |
| edge          | `--ui-space` ÷ 2 wide, in the variant's colour                 |
| surface       | `--ui-color-surface`                                           |
| text          | `--ui-color-text`                                              |
| boundary      | `--ui-color-border`                                            |
| corner        | `--ui-radius`                                                  |
| lift          | `--ui-elevation-raised`                                        |
| font          | `--ui-font`                                                    |
| dismiss mark  | `--ui-icon-size` and `--ui-icon-stroke`, at 24 × 24 minimum    |
| motion        | `--ui-duration-state`, `--ui-easing-enter`, `--ui-easing-exit` |

A toast is **bounded as well as lifted**, for the reason [`<ui-card>`](card.md) gives: a shadow is one
value in both schemes and does almost nothing on a dark page, where the derived boundary is what
separates the surface from what is under it.

| Part                            | Aims at                                 |
| ------------------------------- | --------------------------------------- |
| `<ui-toaster>::part(polite)`    | the polite region — the upper column    |
| `<ui-toaster>::part(assertive)` | the assertive region — the lower column |
| `<ui-toast>::part(message)`     | the box around your message             |
| `<ui-toast>::part(dismiss)`     | the dismiss button                      |

The corner is not an attribute. A host that wants the stack somewhere else positions the
`<ui-toaster>` itself — it is your element, and `position`, `inset` and `inline-size` are all yours to
set.

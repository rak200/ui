# UiDialog

[← Reference](README.md)

A modal dialog.

```js
import '@rak200/ui';
```

## Contents

- [`<ui-dialog>`](#ui-dialog)
- [Slots](#slots)
- [`open`](#open)
- [`show()` and `close()`](#show-and-close)
- [The `ui-close` event](#the-ui-close-event)
- [What the platform does, and what this element adds](#what-the-platform-does-and-what-this-element-adds)
- [The accessible name](#the-accessible-name)
- [Motion](#motion)
- [Limits](#limits)
- [Styling](#styling)

## `<ui-dialog>`

```html
<ui-dialog>
  <h2 slot="title">Delete account</h2>
  <p>This cannot be undone.</p>
  <ui-button slot="actions" variant="secondary">Cancel</ui-button>
  <ui-button slot="actions">Delete</ui-button>
</ui-dialog>
```

The element delegates to a real `<dialog>` and opens it with `showModal()`. That is the whole
design: the top layer, the inert background, the focus trap, <kbd>Esc</kbd> and focus returning to
whatever opened it are the browser's job rather than this component's.

The class is exported as `UiDialog` for a host that needs the type; importing the package registers
the element, so nothing has to be called.

## Slots

| Slot        | Holds                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| `title`     | the heading, which is also where the accessible name comes from        |
| _(default)_ | the body                                                               |
| `actions`   | the buttons, laid out as a row that wraps and aligns to the inline end |

## `open`

```html
<ui-dialog open>…</ui-dialog>
```

Whether the dialog is showing. Reflected, so a host stylesheet can select on it and a host can read
it back.

**It is the single source of truth, and the only one.** The attribute, the property, the methods
below and <kbd>Esc</kbd> all move this one value, so there is no second path that can disagree with
it. Setting it to `false` runs the [exit](#motion) and closes when that has finished.

A dialog that is dismissed sets `open` back to `false` itself and
[announces it](#the-ui-close-event). A host that binds `open` from its own state should listen for
that event and follow it, the same way a `<details>` or a native `<dialog>` is followed — otherwise
the next render puts the dialog straight back up.

## `show()` and `close()`

```js
document.querySelector('ui-dialog').show();
```

Sugar over `open = true` and `open = false`. They are deliberately not a second way in: a method
that opened by its own route would produce a state the attribute does not describe.

`show()` is named for the pair it forms with `close()`. It is always modal — there is no
non-modal mode, because the `open` attribute on a bare `<dialog>` is exactly the thing that looks
modal and traps nobody.

## The `ui-close` event

```js
dialog.addEventListener('ui-close', () => {
  /* the dialog is closed and focus is back on the trigger */
});
```

Fired after the dialog has closed, however it was closed — the exit finishing, <kbd>Esc</kbd>, or
the element being removed from the document while open. It bubbles and is composed, so a host can
delegate it and it crosses a shadow boundary.

## What the platform does, and what this element adds

Everything in the first list is the browser's, and delegating it is the design decision rather than
a shortcut — a component that stopped calling `showModal()` would look identical and trap nobody.

| The platform's                     | How                                                     |
| ---------------------------------- | ------------------------------------------------------- |
| Top layer, above everything        | `showModal()` — no `z-index` anywhere                   |
| Background inert                   | enforced by the user agent, not by a JS trap            |
| Focus trap                         | the same                                                |
| Focus moves in on open             | the first focusable in the dialog                       |
| **Focus returns to the trigger**   | the platform remembers what was focused                 |
| <kbd>Esc</kbd> dismisses           | the `cancel` event, which this element runs its exit on |
| `aria-modal` and the `dialog` role | implicit in a modal `<dialog>`                          |

What this element adds is the rest: the scroll lock, the accessible name across the shadow
boundary, an exit that can be seen, and the tokens.

**Zag is not involved, and RFC 0016 expected it to be.** Zag was adopted for dismissable layers
and focus trapping, and its dialog machine implements both over a `<div>` — which means giving up
the top layer and taking a JS focus trap in exchange for one the user agent enforces.
[ARCHITECTURE.md](../ARCHITECTURE.md) carries that decision and what it moved.

### The scroll lock

`<dialog>` does not stop the page behind it scrolling, and that is the one piece of modality left
to the component. While any dialog is open the document is `overflow: hidden`, and where the
scrollbar was **taking layout space** its gutter is reserved with `scrollbar-gutter: stable`, so the
page does not jump sideways as the scrollbar goes.

**Taking space, not scrolling.** Those are different questions and only one of them is the right
one: an overlay scrollbar floats over the content and reserves nothing, so a page can scroll and
still have no gutter to keep — reserving one there pulls the content in by the width of a scrollbar
nobody was using, which is the same shift in the other direction. `reservedGutter` is the rule, and
it is decided from the viewport width against the content width rather than from whether the page
scrolls; `applyLock` is what writes the two properties the lock is made of, in the one place either
is named.

Whatever the host had set is given back, not cleared — a page with its own `overflow` or its own
gutter keeps them, through the lock as well as after it. The lock is counted, so a confirm opened
over a form does not hand the page back when the inner dialog closes.

**Verified where it can be.** The suite's browser reports no scrollbar width at all, so the absence
of a layout shift is not observable there — the suite asserts the mechanism and the rule, and
`tests/manual/scroll-lock.mjs` measures the effect on a headed browser that draws a scrollbar. It
reads `shift 0px` in both directions: with a scrollbar to keep, and without one to invent.

## The accessible name

The dialog is named after its own `title` slot, and the name is a **copy of that text** rather than
a reference to the element.

That is forced rather than chosen. The APG pattern names a modal with `aria-labelledby` pointing at
its heading, and an IDREF does not cross a shadow boundary — so the `<dialog>` in this element's
shadow root cannot point at a heading in your tree. [`<ui-field>`](field.md) answers the same
constraint by leaving every associated element in the light DOM; a dialog cannot, because the
element that has to reach the top layer is the one this component renders. What does cross is a
string.

The copy is kept current: rewriting the title's text, with no element changing, updates the name.

**A dialog with no title has no accessible name.** Nothing is invented and no blank `aria-label` is
written — a present-but-empty attribute is the shape that makes an audit read as handled. Give it a
title.

## Motion

The dialog and the scrim fade in along `--ui-easing-enter` and out along `--ui-easing-exit`, both
over `--ui-duration-state`.

The exit is the reason the token layer collapses reduced motion to `0.01ms` rather than to zero:
this component waits for the end of its transition before closing, and a zero-length transition
fires no end at all. Under `prefers-reduced-motion: reduce` the exit still runs — the time is what
goes, not the lifecycle.

To retune it, set the purpose rather than the step:

```css
ui-dialog {
  --ui-duration-state: 300ms;
}
```

A host that sets it to `0s` still gets a dialog that closes: the exit waits on the animations
themselves, and an empty list resolves rather than blocks.

## Limits

- **`<form method="dialog">` does not close it.** Measured, and it is a property of slotting rather
  than of this element: the platform looks for the form's nearest ancestor `<dialog>` in the node
  tree, and slotted content is not a descendant of the element it is slotted into. Close it from
  the [event](#the-ui-close-event) side instead — call `close()`, or set `open`.
- **No light dismiss.** Clicking the scrim does nothing. The APG pattern does not ask for it,
  dismissing a destructive confirm by a stray click is a real cost, and the platform is
  standardising `closedby` — inventing a different answer now would be one to un-invent.
- **Moving an open dialog in the DOM closes it.** The platform drops a removed element out of the
  top layer and announces nothing; this element closes it rather than leaving a dialog that looks
  modal and is not.

## Styling

The inner dialog is exposed as a **part**, so a host can reach it without piercing the shadow root
blindly. Its width is capped rather than tokenised — a size is a layout decision, and this is the
surface for what the token set deliberately does not name:

```css
ui-dialog::part(dialog) {
  max-inline-size: 48rem;
}
```

For colour, radius, spacing, the scrim and the motion, prefer the [tokens](tokens.md) — they
restyle every component at once instead of one selector at a time.

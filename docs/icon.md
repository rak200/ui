# UiIcon

[← Reference](README.md)

An icon, drawn from an adopted set or from a mark you slot in yourself.

```js
import '@rak200/ui';
import '@rak200/ui/icons/x.js';
```

## Contents

- [`<ui-icon>`](#ui-icon)
- [Importing glyphs](#importing-glyphs)
- [The accessible name](#the-accessible-name)
- [A mark the set does not have](#a-mark-the-set-does-not-have)
- [What this costs](#what-this-costs)
- [Styling](#styling)
- [The set, and its licence](#the-set-and-its-licence)

## `<ui-icon>`

```html
<ui-icon name="check"></ui-icon> <ui-icon name="search" label="Search"></ui-icon>
```

| Attribute | Type     | Default | What it does                                                 |
| --------- | -------- | ------- | ------------------------------------------------------------ |
| `name`    | `string` | `''`    | Which glyph to draw, as registered by importing its module   |
| `label`   | `string` | `''`    | The accessible name. Unset, the icon is hidden from the tree |

Exported as `UiIcon`, along with `register` for adding a glyph by hand.

## Importing glyphs

**A glyph is imported for its side effect**, and the markup underneath starts working:

```html
<script type="module">
  import '@rak200/ui';
  import '@rak200/ui/icons/x.js';
</script>

<ui-icon name="x"></ui-icon>
```

That is what makes `name` an attribute rather than a value: a page with no build step can
write it, which is the premise this package is built on. The cost is a global map of names,
and one failure mode it is worth knowing about — **an unregistered name draws nothing and
warns** in the console, naming the import you are missing. A typo in `name` and a module
nobody imported look identical otherwise.

**Import all of them when the name is decided at runtime:**

```js
import '@rak200/ui/icons/all.js';
```

Then `name` can be any of the 2048 glyphs, and you pay for all of them. See
[what this costs](#what-this-costs).

## The accessible name

**This is the part with a wrong answer, so it is the part to read.**

An icon beside a word is decoration: the word is already the accessible name, and an icon
that repeats it makes a screen reader say the same thing twice. So an icon with no `label`
is `aria-hidden` — which is the default, because it is the common case.

```html
<!-- Decoration. The button is already called "Delete". -->
<ui-button><ui-icon name="trash-2"></ui-icon> Delete</ui-button>
```

An icon that **is** the content has nowhere else to get a name from. Give it a `label`, and
it becomes an image with one:

```html
<!-- The only thing this control has to go on. -->
<ui-button><ui-icon name="trash-2" label="Delete"></ui-icon></ui-button>
```

It is never both. Taking the `label` off puts it back to hidden; there is no state where
the icon is announced and hidden at once.

## A mark the set does not have

Brand and domain marks are the case that stays in scope for drawing by hand. Slot the
`<svg>` instead of registering it:

```html
<ui-icon label="Our mark">
  <svg viewBox="0 0 24 24"><path d="M12 3 3 21h18Z" /></svg>
</ui-icon>
```

The stroke, the caps, the joins and the colour are applied to your `<svg>` exactly as they
are to a vendored one, so a bespoke mark on the adopted grid is **indistinguishable from
the set** — which is the condition under which drawing your own is worth doing. Give it the
24-unit viewBox and leave the stroke to the component.

Slotting is not warned about: it is deliberate, and the element can tell.

`register()` is the other way, and it is the right one for a mark you use in several places:

```js
import { register } from '@rak200/ui';
import { svg } from 'lit';

register('our-mark', svg`<path d="M12 3 3 21h18Z" />`);
```

Registering a name twice replaces it, so this also overrides a vendored glyph with your own
drawing.

## What this costs

Measured, because a glyph set is the kind of dependency that grows quietly:

| What you import        | What it costs                              |
| ---------------------- | ------------------------------------------ |
| one glyph module       | 368 bytes on average, 222 for `x`          |
| `icons/all.js`         | about 96 KiB gzipped, bundled and minified |
| installing the package | 249 kB tarball, whatever you import        |

**Tree-shaking protects your bundle, not your install.** The vendored set is in the package
whether you use it or not; what you import is what reaches your build.

A glyph module carries **the geometry alone** — the `<svg>` around it belongs to this
element, which is what keeps the grid, the stroke and the colour one decision rather than
two thousand. Across the whole set that is 182 bytes of geometry against a 482-byte source
file, measured.

## Styling

| Part   | Token                                          |
| ------ | ---------------------------------------------- |
| size   | `--ui-icon-size` (default `1.25em`)            |
| stroke | `--ui-icon-stroke` (default `2`, on a 24 grid) |
| colour | none — the icon strokes with `currentColor`    |

**The colour is not a token and that is deliberate.** Every glyph strokes with
`currentColor`, so one registration serves a primary button, a danger message and body text
without three of anything. Colour an icon by colouring what it sits in.

The size is in `em` rather than pixels, so an icon beside a word is the size of that word.
A host who wants a fixed size sets `--ui-icon-size`; a host who wants it to follow the text
already has that.

The drawn `<svg>` is exposed as `part="svg"`.

## The set, and its licence

The glyphs are [Lucide](https://lucide.dev) 1.37.0, vendored under the **ISC licence**,
whose notice ships with the package at `dist/icons/LICENSE`.

**They are adopted, and the delivery is owned.** There is no APG pattern for drawing a
padlock, so what a set costs is volume and optical consistency — hundreds of marks on one
grid at one stroke weight, each corrected by eye. That is designer-months with no
differentiation at the end of it. Under ISC the SVGs are ours to edit, with no upstream to
fight.

The version is pinned in `tests/manual/vendor-icons.mjs`, and the set moves when somebody
edits that line and re-runs it — never on its own.

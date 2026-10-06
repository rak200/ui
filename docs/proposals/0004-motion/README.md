# RFC 0004 — prototypes

[← RFC 0004](../0004-motion.md)

One page per component, each rendering the real component from `src/` with the catalogue the
proposal would give it: the moments it answers, the effects it offers for each, and the effects the
reference has that it leaves out, with the reason. They are a sketch to judge shape D against, not a
product: nothing here is published, tested or imported by the package.

```sh
npx vite docs/proposals/0004-motion
```

Then open the address Vite prints. The dev server compiles `src/` directly, so no build runs first.

| Page        | Moments                                                   |
| ----------- | --------------------------------------------------------- |
| `button/`   | press, pointer over, focus                                |
| `card/`     | pointer over, entrance                                    |
| `checkbox/` | check, invalid, focus — for `ui-checkbox` and `ui-switch` |
| `radio/`    | choose, invalid, focus                                    |
| `input/`    | focus, invalid — for `ui-input` and `ui-textarea`         |
| `select/`   | focus, invalid                                            |
| `menu/`     | open, close, caret                                        |
| `tooltip/`  | appear, leave                                             |
| `dialog/`   | entrance, exit, backdrop                                  |
| `toast/`    | entrance, exit, the stack                                 |
| `table/`    | the row under the pointer, a row added                    |
| `icon/`     | entrance, pointer over                                    |

**Every page makes the choice the same way.** Pick an effect for each moment and the scope it
applies to — the page, a region, every instance of the component, or one instance — and the page
writes the CSS a consumer would: one custom property per moment, `--ui-motion-<moment>`, whose value
is the effect's name. The panel under the components shows that CSS. The moments share names across
components, so a choice made for the page reaches every component that offers that effect, and the
others keep what they do today. The names are placeholders; the shape is the proposal.

**What a component would ship is each page's `sheet`, in its `effects.ts`.** Every effect sits under
a style query on its moment, inside the component's shadow root — where S5 found the three engines
agree on finding it. The page adopts the sheet into each instance's shadow root, which stands in for
the component carrying it. Two pieces of script stand in for what a component would carry where CSS
cannot do it alone, both in `motion.ts`:

- **a trigger** that starts an effect on its event and lets it finish, for the effects that outlive
  the state they answer (S7). The effect stays in the sheet, under `[data-fx]`, so the collapse
  reaches it; the script only marks the moment and clears the mark when the animation ends;
- **a pointer engine** that publishes where the pointer is, for the effects that follow it (S3): one
  passive listener, one write a frame, and nothing at all for a reader who asked for less motion or
  has no hover.

**The catalogue needs steps the token layer does not have.** One duration step and three curves
cannot carry it, so `motion.ts` declares four more steps and two curves as stand-ins, on the
reference's five-step scale, collapsed under reduced motion like the rest. That is shape A arriving
with D.

**Every page has a scheme control and a reduced-motion switch.** The switch collapses every duration
the way the reader's own setting does, so the second state of every effect — the one easiest to ship
broken — is one click away.

**A badge marks what S8 limits.** An effect drawn on a component's host does not see a choice made
on the host itself. The card's and the toast's surfaces are their hosts, so the effects that move
them say so, and choosing one of them for the instance shows it.

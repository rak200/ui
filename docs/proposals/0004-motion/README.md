# RFC 0004 — prototypes

[← RFC 0004](../0004-motion.md)

One page per component, each rendering the real component from `src/` with the catalogue the
proposal would give it: the moments it answers, the effects it offers for each, and the effects the
reference has that it leaves out, with the reason; and one page with every component side by side.
They are a sketch to judge shape D against, not a product: nothing here is published, tested or
imported by the package.

```sh
npx vite docs/proposals/0004-motion
```

Then open the address Vite prints. The dev server compiles `src/` directly, so no build runs first.

| Page        | Moments                                                            |
| ----------- | ------------------------------------------------------------------ |
| `button/`   | press, pointer over, focus                                         |
| `card/`     | pointer over, entrance, exit                                       |
| `checkbox/` | check, pointer, focus, invalid — for `ui-checkbox` and `ui-switch` |
| `radio/`    | choose, pointer, focus, invalid                                    |
| `input/`    | pointer, focus, invalid — for `ui-input` and `ui-textarea`         |
| `select/`   | pointer, focus, invalid                                            |
| `menu/`     | open, close, caret                                                 |
| `tooltip/`  | appear, leave, the next tip                                        |
| `dialog/`   | entrance, exit, backdrop                                           |
| `toast/`    | entrance, exit, time left, the stack                               |
| `table/`    | the row under the pointer, a row added                             |
| `icon/`     | entrance, pointer over                                             |
| `compare/`  | every component side by side, with nothing to choose               |

**Every component can be seen side by side.** `compare/` draws each component as its page does, with
the page's effects and the theme's taste and nothing to choose, so one moment can be compared from
one component to the next under each theme and scheme: point at each, tab through them, and play the
error on every required one at once. It loads each page's module as the page does, and the frame,
drawn once, tells every one of them of a new theme.

**Every page makes the choice the same way.** Pick an effect for each moment and the scope it
applies to — the page, a region, every instance of the component, or one instance — and the page
writes the CSS a consumer would: one custom property per moment, `--ui-motion-<moment>`, whose value
is the effect's name. The panel under the components shows that CSS. The moments share names across
components, so a choice made for the page reaches every component that offers that effect, and the
others keep what they do today; so a name means one effect wherever it is offered. The button's
`orbit` runs round on its edge and its `edge` lights the part of it nearest the pointer, as the
card's do, over a reach in proportion to the button; the comet it ran clear of the edge is `comet`,
and its burst of light is `burst`, `glow` being the card's halo. The names are placeholders; the
shape is the proposal.

**A moment can come by kind.** Where a component's effects for one moment change different things
— where the element is, its shadow, its fill, its border — each kind is a property of its own:
`--ui-motion-hover-move`, `-shadow`, `-fill` and `-border`, and a reader combines two by writing
both. The card's pointer comes by kind, and so does every moment of the button. Two effects of one
kind would fight over the same thing, and one property holds one of them. A list in one property
is not the way: a style query compares the whole value, so `edge, raise` matches neither effect,
in all three engines.

**What a component does today is one of its choices.** Where it already answers a moment, the answer
has a name, and `none` there is nothing: the dialog fades in today, and `none` puts it there at
once. The button answers the pointer in three kinds — the hover colour, and the edge and the glow a
theme gives the pointer — and the press in one, the pressed colour. Each is its kind's `highlight`,
which renders with no choice, and any other effect of the kind takes its place. The focus ring is
not a choice: it is where the reader is, and every focus effect adds to it. The checkbox, the switch
and the radio fade to a new state today, which is their check's `fade`, and darken under the
pointer, which is their pointer's border `highlight`. Their pointer, their focus and an error are
sorted by kind, as a field's are, and the three offer the same effects, drawn alike from rules their
two pages share, as the components draw the three controls alike.

**A press is drawn over the pointer.** A press that brings a colour shows it over the pointer's, and
one that brings none keeps the pointer's; the press's `none` takes away the colour a touch is
answered with, which the component turned the platform's own tap wash off for. The squish and the
spring shrink a button the pointer zoomed, and while they hold it smaller, the raise and the light
round its edge, the pointer's or the focus's, step aside until it is let go: they are drawn on the
host, at its size rather than the button's, and framed the pressed button — measured. A sink takes
the raise away as well, since a button pressed into the page casts nothing under it. A ring fired on
those layers — a pulse, an explode, a burst, a beacon — is drawn where the button is held instead,
at the size, the turn and the place the pointer, the focus or the press holds it at, on the button's
own transitions and at once for a press: at the host's size the pulse began 4.3px clear of a button
the spring had pulled in, measured. A layer that comes into being with its effect starts where the
button rests and moves with it, since begun where the button was going, the beacon ran 2px above a
button the focus was still lifting. The pointer is drawn over the focus as the press is over the
pointer: an effect the focus brings to a layer the pointer draws on too — the border's, the fill's —
waits while the pointer rests on the button and plays again when it leaves. Written for the layer
rather than for the focus, the focus's orbit stood in for Glass's edge under the pointer, and its
comet put Matrix's trace out, measured. A drawn control's pointer yields to its focus instead, as a
field's does: its halo and glow are drawn only where it has no focus. An error and a focus play
together on the control itself. When each declared the control's one list of animations, one took
the other's away — the focus never played on a radio in error, and an error that came while a
checkbox or a switch had the focus never played on it, measured — so each kind writes its animation
into a property of its own, which the one list reads: the focus's beacon or scan and the error's
pulse and flash or split ran together, whichever came first, in all three engines. The rings are
added to what is drawn under them rather than drawn in its place, so a theme's glow stays beside
them; the one exception is the glow a theme lights the control with, which Chromium draws
transparent there, measured.

**A press can hold the button in pieces.** `shatter` breaks it into pieces, smallest where it was
pressed, and `split` breaks it in two there; either parts them a gap at once, as a squish presses in
— eased apart, they had moved a pixel or so when a quick click let go, measured — and holds them so
until the button is let go, and the layers on the host step aside while they are apart, as they do
for a squish. There is no copy: one filter over the button cuts what it draws solid into cells and
moves each, the dissolve's way, so the pieces go on showing the pressed colour and whatever else the
press draws, and a theme's glow, drawn fainter, stays whole round them — cut with them, every crack
ran on across Matrix's halo. The script holds the pieces until the press that broke them ends, at
the pointer's release, since `:active` is all the state a press has, or Space's as it comes up;
Enter's press arrives as its click, with nothing to hold, so for Enter the pieces part and close at
once. The filter counts in the button's own pixels: in fractions of its box, all three engines count
in a box that takes in the glow, and in pixels WebKit counts from the page's corner until the
element has a transform, so the button takes a turn of nothing while it is in pieces — all measured.

**A kind can qualify an effect instead.** The card's entrance keeps the moment's own property for
its effect, `--ui-motion-enter`, and two kinds qualify it: a direction, for the effects that travel,
and a curve. `--ui-motion-enter: slide` beside `--ui-motion-enter-direction: up` slides the card up;
the effects that do not travel leave the direction alone. The card's exit and the dialog's and the
toast's entrances and exits take the same three, and an exit's direction is the way it leaves: its
effects are the entrance's run the other way, named for leaving where the entrance's name would not
do — a rise sinks, a refocus defocuses, what converged scatters. The card, the dialog and the toast
offer the same entrances and exits, drawn on the card's host, the dialog's panel and the toast's
host. The card's and the toast's each take a step by what they change, and the dialog's all take
one, 200ms, as its scrim, its pieces and its grain do: a dialog is opened to be used and closed to
get back to the page, so a reader waits on its motion both ways. Whatever travels on a toast comes
in from the page's right edge, where a toaster stands unless it is moved, and leaves toward it. The
toaster draws a toast that moves past its box there rather than scrolling to it: the platform gives
a popover `overflow: auto`, and a slide scrolled the toaster, under a scrollbar, for as long as it
ran — measured.

**A slide can bounce or spring.** The toast adds two slides to the catalogue: `slide-bounce` strikes
where it lands and bounces back off it twice, and `slide-elastic` springs past it and swings either
side of it until it settles. Each runs on a curve of its own, which a chosen one does not replace,
as the drop's does, and leaving, each is its entrance run backward, bouncing or swinging before it
goes. Their bounces are in rem, as the drop's are, so a slide up a toast's own height bounces as far
as one across its width.

**Each kind draws on an element of its own**, because one element has one animation list: two
effects animating it leave one unplayed. The card's are layers the page renders into the shadow
root where the component would, because a host has two pseudo-elements and a theme already draws
on one; the button's are the button, its two layers and the host's two, and each says which in
its sheet.

**What a component would ship is each page's `sheet`, in its `effects.ts`.** Every effect sits under
a style query on its moment, inside the component's shadow root — where S5 found the three engines
agree on finding it. The page adopts the sheet into each instance's shadow root, which stands in for
the component carrying it. Five pieces of script stand in for what a component would carry where
CSS cannot do it alone, all in `motion.ts`:

- **a trigger** that starts an effect on its event and lets it finish, for the effects that outlive
  the state they answer (S7). The effect stays in the sheet, under `[data-fx]`, so the collapse
  reaches it; the script marks the moment, publishes what only a measurement has — where a
  ripple starts, how wide a flip turns — and clears the mark when the animation ends. A moment
  that comes by kind marks each kind by an attribute of its own, so one press can start an
  effect of every kind, and each mark goes when its own animation ends. **A
  focus effect that happens once is fired too**: run under `:focus-visible`, its animation stays on
  the layer for as long as the focus does, and a press's effect on that layer then never plays;
- **a pointer engine** that publishes where the pointer is, for the effects that follow it (S3): one
  passive listener, one write a frame, and nothing at all for a reader who asked for less motion or
  has no hover;
- **a focus state and a press state on the host**, for an effect drawn on the host rather than
  inside it. No engine lets a host match `:focus-visible` for the control in its shadow root — it
  matches `:focus` and `:focus-within`, which a click sets too — so an attribute stands in for the
  custom state a component would set, `:host(:state(focus-visible))`. Under Space the control is
  `:active` and the host is not, in Chromium and WebKit, where a pointer's press makes both, so a
  second stands in for `:host(:state(pressed))`, set only once the control is `:active`;
- **an arrival and a departure**, for an entrance and an exit: one the sheet draws plays as the
  instance is inserted, and one a script draws is fired then — the card's reintegrations, which put
  it together from copies of itself, as the reference's disintegration takes one apart. A choice
  made for the entrance takes every instance out and puts it back where it was, so the choice plays
  at once. A dialog arrives as it opens and leaves as it closes, and the page reads both off what
  the component writes on its `<dialog>` — the open attribute, and the class its exit is carried by
  — where the component would fire them itself. Its scrim leaves with it, over the length of the
  exit the panel takes, so neither is left on the page without the other. A card cannot hold off its
  own removal, so its exit needs a way out the component would own, as the dialog owns its close:
  the page's buttons stand in for it, playing the exit and then taking the card away, and a choice
  made for the exit takes every instance out through it and back. The page marks a card on its way
  out, where the component would set a state of its own, `:host(:state(leaving))`: an exit the sheet
  draws is drawn under the mark, and holds its last frame until the card has gone. A toast arrives
  as it is inserted and leaves as a dialog closes, read off the class its exit is carried by, and
  its removal waits on the animations on its host: an exit a script draws is held for there by one
  that draws nothing, the toast standing aside under the pieces, and the stack closes up once they
  have gone;
- **the pieces**, for an effect that breaks an instance apart or puts it together: thirty-six copies
  of it, each cut to its cell. They go in the top layer, which a modal and its backdrop are in and
  the rest of the page paints under, and beside the instance in the tree, so the page's rules for
  its content reach theirs. A cell is cut by its own box, on a device pixel, and faded through its
  copy: cut anywhere else two pieces meet at a seam, and in Chromium a clip-path or a moving opacity
  over a glass copy takes its blur away, both measured. A dialog's copy is its panel under the
  component's own sheet rather than a copied `ui-dialog`, which would open itself. When it breaks
  apart, its scrim fades as the pieces fly, and it closes as the last of them goes. A toast's copy
  is what the component rendered, under its own sheet, since a copied `ui-toast` would put itself
  into a region and start a clock of its own. It is cut as near square as thirty-six pieces allow,
  where six by six cut a toast into slivers 7px high, and its pieces go after its toaster: beside
  the toast they are assigned to none of the toaster's slots, and showed nothing in Chromium and
  Firefox, measured. The dissolve,
  the card's and the dialog's, is the reference's cheaper way, with no copy at all: noise becomes
  the surface's alpha through a filter whose threshold a script moves, across the span where the
  grain changes — half the reference's sweep changed nothing, measured. The filter goes in the
  surface's own tree: one in the document filtered nothing inside a shadow root, in all three
  engines, and the dialog's panel is in one.

**The catalogue needs steps the token layer does not have.** One duration step and three curves
cannot carry it, so `motion.ts` declares five more steps and two curves as stand-ins, collapsed
under reduced motion like the rest: four on the reference's five-step scale, and the dialog's
between two of them. That is shape A arriving with D. A loop needs two more, its period and its
count, and **the count has to collapse as well**: with only the period at 0.01ms, an infinite loop
goes on running in all three engines, and Firefox draws it at a different phase every frame.

**Every page has a theme control, a scheme control and a reduced-motion switch.** The theme is
selected the way a host selects one, by the attribute and the theme's block after the token sheet,
so an effect drawn for a theme — the button's glitch, for Matrix — is judged where it belongs. Under
Glass, which lets the page through, the stage is a page with colour and a grid on it, inside the
limits the theme is measured over: over the token sheet's white alone, the glass was white on white.
The switch collapses every duration the way the reader's own setting does, so the second state of
every effect — the one easiest to ship broken — is one click away. **A focus effect chosen with the
pointer plays at once**: the first instance the choice reaches takes the focus a Tab would give it,
so the effect is judged without tabbing to it. The checkbox's, the radio's, the input's and the
select's pages can play an error again: every error is taken off and drawn gone before the required
controls are validated, since the effect starts as the error does. **Every effect can be set to
`none` at once**, from above the moments, so one is tried with nothing else running — neither a
theme's taste nor what the component does today — and clearing the choices puts the theme's back.

**A theme can bring a taste.** The default theme fades the card and the dialog in and out wherever
nothing else is chosen and, under the pointer, lifts the card with `lift` and `raise`, tints it with
`tint` and runs a light round its boundary with `orbit`; Matrix puts them together with
`materialize`, takes them apart with `erode`, rains code behind the dialog with `char-rain`, and
under the pointer has the card grow with `zoom`, glow with `glow`, take the tint and draw its
boundary round with `trace`; and Glass brings them out of grain and back into it with `dissolve`,
blurs the page behind the dialog with `blur`, and under the pointer has the card lean with `tilt`,
cast its shadow with `cast` and light its fill and its boundary with `spotlight` and `edge`. Under
the pointer, the default theme lights the icon with `glow`, as it lights a form's controls, below;
the glow is drawn in the accent, so under Glass, whose accent is a translucent slate, it reads as a
soft shadow in the light scheme. In Chromium the dissolve's filter leaves the glass its blur: on the
element that carries the backdrop filter, rather than an ancestor of it, the card and the dialog
drew the same with the filter at nothing taken as with none. Firefox takes the blur away for as long
as the filter is on, about as much of the surface changing as with the glass taken off, and WebKit
is unmeasured, for the reason the backdrops below give. Glass's blur is the blur alone, with no
scrim colour over the page the glass lets through; the theme's name does not reach a shadow root, so
the sheet asks for its glass instead, a backdrop filter on a raised surface, read through the
token's fallback. Where the reader asks for less transparency or more contrast, the glass stands
down by leaving the token with no value at all: a query on the token itself took that for glass, and
through the fallback the scrim comes back, in all three engines.

**A taste is written apart from the choices.** Each block writes a theme's taste on the root, under
`:where()`, in properties no choice is written in: `--ui-taste-<moment>` for the page, and
`--ui-taste-<component>-<moment>` for one component. A component reads a taste only where no choice
is written — a bare `style(--ui-motion-<moment>)` asks whether one is, at any scope — and its own
before the page's, so any choice a consumer writes, at any scope, runs instead of every taste, in
all three engines. In the consumer's property a taste for one component could not be told from a
choice made for the page, and written on the component it would outweigh every choice inherited
from above, and be missed besides by the effects the card draws on its host — S8. The default
theme's block is on the root whatever the theme, as its tokens are, and a theme's comes after it.
Today's motion is then a choice like any other, written by name, and a theme that leaves a moment
out keeps the default theme's taste for it, as it keeps the default's tokens. That is RFC 0003's
answer, that a theme may bring a category whose default is the identity, spent on motion.

**A component can have a taste of its own.** The page's taste reaches every component that offers
its effect — a tooltip's fade — and a component's own runs over it there. The default theme keeps
the button still under the pointer, in the hover colour of its `highlight`, raises it with `raise`
and sends a ring out with `pulse`; has a press shrink it with `squish`, sink it with `sink`, take
the pressed colour with `highlight` and throw a disc out from under it with `bloom`; and has a focus
lift it with `lift` and `raise` and send the beacon out past the ring, its fill left alone. A theme
that names a moment for the page clears the default theme's taste for one component there, so under
Matrix the pointer zooms the button and traces its edge, and under Glass it leans the button, lights
it with the spotlight where the hover colour was and lights its edge nearest the pointer with
`edge`. A theme can name one for the component as well: Matrix has the pointer light the button with
`neon`, since the `glow` it names for the page is the card's halo and not one the button offers; has
a press break it with `shatter`, leave its colour alone, throw chips of the accent off its edge with
`fragments` and throw the disc out with `bloom`; and has a focus make its label jump and split with
`glitch`, send a band of light across it with `scan`, burst light out round it with `burst` and run
a comet round over the ring with `comet`. Glass has the pointer raise the button with `raise`, the
`cast` it names for the page being the card's, and has a press spring it in with `spring`, spread a
circle from where it was pressed with `ripple`, sink it with `sink` and send a ring out from its
edge with `pulse`; and has a focus leave it where it is, sweep a sheen across it with `shimmer`,
light a line round it that glows out and back with `neon` and run a light round on its edge with
`orbit`. The default theme also has the checkbox draw its tick with `draw`, the switch spring its
thumb with `spring`, and the radio grow its dot into place with `pop`, and Matrix and Glass keep all
three, naming no `check` of their own. The default theme slides the toast in with `slide-elastic`
and out with `slide`, over the page's fade, and runs its time left down round its dismiss button
with `ring` and its toaster's stack into place with `spring`, under the toaster's own name,
`--ui-taste-toaster-stack`, the stack being the toaster's; Matrix and Glass keep both, naming
neither for the page, and Matrix puts it together and blows it away with `wind`, and Glass brings it
into focus with `refocus` and lets it go with `defocus`, where the card and the dialog dissolve: the
toast kept its glass through the blur in Chromium and in Firefox's video, and Firefox takes a
glass's blur away for as long as the grain's filter is on. Each theme names the icon's entrance over
the one it names for the page: the icon draws its strokes in with `draw` under the default theme,
grows in with `pop` under Matrix and comes into focus with `refocus` under Glass; and under the
pointer, over the page's `glow`, Matrix makes it jump and split with `glitch` and Glass grows it
with `pop`. A table's row arrives in the accent's tint with `glow` in every theme, which Matrix and
Glass name again, since the entrance each names for the page, which the table does not offer, would
clear the default theme's; and under the pointer it takes the hover colour with `highlight`, but
under Glass, whose hover colour is opaque and hid the page its glass lets through, it turns to that
glass with `frost`: the page behind the row blurred under a veil of the text at 0.12, which held it
1.33:1 or more from itself at rest where the hover colour held 1.26. Where there is no glass,
`frost` is the hover colour. The tooltip rises away from its trigger with `rise` and sinks back
toward it with `sink` under the default theme, is typed in with `typing` and flickers out with
`glitch` under Matrix, and comes into focus with `refocus` and goes out of it with `defocus` under
Glass, over the entrance and the exit each names for the page; a tip that opens as another closes
glides from where the other was with `glide` in every theme, Matrix and Glass naming no `next`. The
menu's panel is there at once and its items come into it one after another with `cascade`, and it is
covered back toward the trigger with `fold`, under the default theme; it jumps in and flickers out
with `glitch` under Matrix, and comes into focus and blurs away with `refocus` and `defocus` under
Glass; and its caret flips over with `flip` in every theme. A form's controls — the input, the
textarea, the select, the checkbox, the switch and the radio — take one taste, so a moment does the
same on each. Under the pointer the boundary darkens as it does today, with `highlight`, a light of
the accent comes round the control with `glow`, and its fill and its place are left as they are,
with `none`, in every theme. Matrix and Glass name the pointer again, since the pointer's kinds each
names for the page clear the default theme's: with the form's taste cleared, Matrix's `tint` filled
a field and its `zoom` grew a checkbox a tenth, and Glass's `cast`, which no control offers, took a
field's light away, in Chromium and Firefox. At the focus the default theme sends a wave past the
ring with `beacon`, lights the control from inside its boundary with `inner`, takes its label to the
accent with `accent` and leaves its fill alone; Matrix draws a line round the control with `trace` —
inside a field's boundary, and outside a drawn control's ring — holds a light round it with `glow`,
sends a band of light across it with `scan` and lights its label with `glow`; and Glass runs a light
round on its boundary with `orbit`, a soft band round the control with `halo` and blurs the page
behind it with `blur`, and leaves its label as it is. In error the default theme sends a red ring
out from the control with `pulse` and tints it red with `flash`, Matrix splits its boundary in two
colours where it is with `split`, and Glass holds a red light round it with `glow` and tints it with
`flash`; each that loops plays four rounds and rests, as a loop does for a state that stands for as
long as the reader leaves it, and the message comes as it does today under all three. Where the
default theme names an effect for a kind another theme leaves alone, that theme names `none`, or the
default theme's would run there: Glass's label at the focus, and Matrix's fill in error. The
checkbox and the switch share a page and a sheet, and each asks for its taste under its own name,
`--ui-taste-checkbox-check` and `--ui-taste-switch-check`, so one draws while the other springs; an
effect only one of them offers, chosen for both, plays on that one, and the other does what it does
today. The input and the textarea share a page and a sheet as well, and each takes a copy of the
sheet written for its own name, `--ui-taste-input-<moment>` and `--ui-taste-textarea-<moment>`: a
taste written for the textarea alone reached it and not the input, in all three engines. Every page
writes these. The page marks the effects a theme takes, and where the two elements of a page take
different ones, it names each and checks neither; switching theme plays the arrival and the
departure at once, as a choice made for them does.

**A backdrop can bend the page as well as blur it.** The dialog's `frost` is the reference's frosted
glass over the whole page, a long blur and more colour with no scrim, and `refract` is its lens:
noise pushing each pixel of the page about through an SVG filter, which the page renders into the
shadow root, because the reference in a backdrop filter is looked up in the dialog's own tree — from
the document it reached nothing. Chromium draws the lens. Firefox draws nothing for a backdrop
filter that names an SVG one, a blur beside it included, while `CSS.supports` says it does, so
`refract` keeps the scrim's colour, under glass too, and the colour is what Firefox shows. Its first
frame is the costliest of the backdrops: 217–250ms in a headless Chromium, which composites in
software, against 100–133 for the blur and 17 for today's scrim. The reference's `liquid`, the lens
rippling, is left out: it would move for as long as the dialog is open. **Firefox's and WebKit's
screenshots draw no backdrop filter at all**, a blur included, so Firefox's were read from its
video, which it takes from what its compositor drew; WebKit's video draws none either, here, so
WebKit is unmeasured.

**A backdrop can draw over the scrim**, in the theme's accent, so what it draws takes on the theme
it is under. `stripes`, `grid` — squared paper — and `checker` each slide 2.5rem into place as the
scrim comes in and on as it goes: a pattern that repeats ends where it would have been, and nothing
moves once it is there. `char-rain` is the reference's falling code at three depths, each a tile the
page draws on a canvas in the colour the accent resolves to, since a picture cannot read a token,
and draws again when a theme or a scheme changes that colour. Each tile reaches the sheet by a blob
URL: as data URLs, the three came to 1.1MB or more in the property the backdrop reads them from, and
opening the dialog on the page with every component took 212 to 230ms in Chromium and 64 to 129ms in
Firefox, where the blob URLs took 28 to 57ms and 39 to 51ms — measured. It falls for a loop that
settles, slowing to rest as a still wall of code within the five seconds WCAG 2.2.2 allows, and the
whole backdrop is painted again on every frame it moves: about half of those frames took over 20ms
in a headless Chromium, and four in five in Firefox and WebKit. Forced colours keep a picture where
they take a gradient away, measured in Chromium, so the rain stands down there itself.
`char-columns` is the same falling code set in type, a column at a time, each moved by a transform,
as the reference's loading columns are. The backdrop has no children to hold them, so a layer of the
dialog's own does: shown from the dialog's `beforetoggle`, it enters the top layer before the
dialog, under it and under its backdrop, and none of the dialog's opacity, transform, filter,
clip-path or overflow reaches it there, in all three engines — measured. It opens as quickly as the
rain, but it is more to draw while it falls, in software and on a GPU alike, and a dialog closed
meanwhile waits longer for it; #292 holds what was measured, until RFC 0004 is implemented.

**A badge marks what S8 limits.** An effect drawn on a component's host does not see a choice made
on the host itself. The card's and the toast's surfaces are their hosts, so the effects that move
them say so, and choosing one of them for the instance shows it. A script that draws one reads its
choice where the host's own sheet does, at the host's parent, so the two miss the same choices: a
toast blown in on a wind chosen for it alone rises as it does today, sheet and script both. A moment
can also be one element's: a toast arrives and leaves, and the toaster round it holds the stack and
does neither, so a theme's entrance is not read on the toaster, nor its stack on a toast.

**A toast can show how long it stays.** Its time left is a moment of its own, `--ui-motion-dwell`:
`bar` runs a line along its foot down with its time, in its edge's colour, and `ring` runs a ring
round its dismiss button down, in the button's. Each holds full while the pointer or the focus is on
the toast and starts again from full when both have gone, as the toast's clock does, and an error,
which stays, has neither. Both are drawn inside the toast, so every choice reaches them. The time
is the toast's own, which the page writes on it where the component would, and no duration token, so
nothing collapses it: for a reader who asked for less motion, neither is drawn.

**The stack moves as a toast arrives or leaves.** The toasts a change leaves standing move from
where each stood: `glide` brings them on the move curve, `stagger` one after another, the nearest to
the change first, `spring` past their places and back, and `drop` lets them fall into the place one
leaves and bounce once as they land, gliding when one arriving pushes them up. Each is a script's,
as the reference's glide is: it measures the toasts before the change and animates each from where
it stood, added to whatever already moves it, so a toast arriving while another leaves moves the
stack on from where it is, with no step between two frames over 11px — measured. Before one
arrives, the others are measured with it taken out of the layout, and after, at the next frame:
measured at once, the layout spent a fade's and a pop's starting style before the sheet that holds
them reached the newcomer, which rose as a toast does today, in all three engines.

**A tooltip's tip keeps its size as it comes and goes.** The tooltip places a tip by the box it has
as it shows, transform and all, and again whenever the page scrolls under it: a tip that started at
0.9 of its size was placed 11px off its trigger's middle and 3px into the gap, and one that started
edge-on 26px over its trigger, in all three engines. So its entrances fade it, move it, uncover it,
blur it, make it jump or type it, and none scales it or turns it: `spring` moves it past where it
sits and back on a curve of its own, and `unfold`, `curtain` and `wipe` uncover it from the
trigger's side, from its middle and from where it starts to be read; its exits cover it the same
three ways, `sink` it back toward the trigger and `defocus` it. Moved, cut and blurred, a tip rested
where today's does, in all three engines. Every one but the glitch and the typing is a transition,
so a tip left before it has arrived turns back from where it is, and one pointed at again as it
leaves comes back from where it got to, in Chromium; the glitch, whose jumps are keyframes, plays
again from its start, and left halfway it is gone at once. An exit that covers a tip covers it from
an open clip, written ahead of the entrances: written after them, it was also the start of an
entrance that uncovers, and nothing was uncovered, in all three engines.

**Only Chromium holds a tip on the page as it leaves.** An exit holds a tip there by transitioning
`display` and `overlay` as discrete values. Firefox takes the element away at once, a plain one as
well as a popover, while it reports `transition-behavior: allow-discrete` as supported; WebKit holds
a plain element and takes a popover away at once, measured with a frame drawn before each reading.
So in Firefox and WebKit a tip, and a menu's panel, are gone at once whatever exit is chosen. An
exit that has to play in every engine has to be held by its component, as the dialog's and the
toast's are.

**A tip can be typed in.** `typing` puts its surface up at once and types its text into it, a
character every 25ms behind a block caret in the accent, onto every line the text wraps to; for a
reader who asked for less motion, the text is there at once. It never writes the text, which the
tooltip hands its trigger again whenever the tip's text changes: what is not typed yet is a
highlight drawn in no colour, through the highlight API, over the text the tip already has, so its
wrapping and its colour, which Matrix's glow is drawn in, stay as they are, and the trigger was
handed nothing while the tip typed, in all three engines. Its rules are written in the tree the text
is in, as the table's are: written in the tooltip's shadow root, Firefox drew none of them on a
slotted tip, where Chromium and WebKit did. A background clipped to the text was the other way, and
Firefox clips to the text only a background's bottom layer, whose clip the surface's colour takes
too, in all three engines. And over a tip in the top layer, WebKit drew a range moved where it was
once and then not again, so each range is taken out of its highlight and put back as the caret moves
— all measured.

**The next tip is what a tip does when it opens as another closes**, along a row of triggers:
`--ui-motion-next`. `instant` has it there at once and the other gone at once, so only the first
tip's entrance plays, and `glide` moves it from where the other was to its own place, as if one tip
followed the pointer. Within 300ms of the other closing it is the next; later, it arrives as any tip
does. The page stands in for what the component would carry: it notes where each tip was as it
closes and when, and once the next is placed it ends both tips' effects, before either is drawn
again. The other was gone and the next in place at the following frame, or 115px back where the
other was and gliding in from there, in Chromium and Firefox — measured.

**A menu's panel keeps its size as it opens and closes.** The menu places the panel by its size,
read as it opens, so its effects fade it, move it, uncover it, blur it or make it jump, and none
scales it: `spring` brings it past where it hangs and back, `unfold`, `curtain` and `wipe` uncover
it from the trigger's side, from a line down its middle and from where its lines are read, and
`cascade` has the panel there at once and its items come into it one after another, each from the
trigger's side. Its exits cover it the same three ways, `defocus` it and make it flicker out in
bands. Each rested where today's panel does, in all three engines. The menu places the panel before
it is shown, by the size it had when it was last open, so the side is written before the panel's
first style and an entrance knows which way the trigger is: a change this review made to the
component, after the first frame of a first open drew the panel at the viewport's corner, 3ms before
the `toggle` event that placed it, in Chromium. Held on the page as it closed, the panel laid its
items out in a row, because the direction was written for the open state alone; the component writes
it for both now. A clip stands 3rem clear of the panel, past the 32px Glass's shadow falls.

**A field's effects are sorted by kind, as the button's are, and none moves it.** Under the pointer
it has a border, a shadow and a fill; at the focus a border, which takes the accent, draws a line
along the bottom edge from the middle or from where the text starts, draws a line round inside the
boundary, sends a wave past the ring, runs a light round on the boundary or a comet round clear of
it, and a shadow, a fill and a label; in error a border, a fill and a message. Each kind draws on a
layer of its own, so one of each draws at once: on a focused field in error, a neon, a scan and a
flash ran on the control together, with an orbit round it, a pulse off its boundary, the label in
the accent and the message dropping in, in all three engines. Four kinds animate the control itself
— the pointer's fill, the focus's shadow and fill, and an error's fill — so each writes its
animations into a property of its own, and the control's one list of animations reads the four. The
trace's line runs 2px inside the boundary and is 2px wide, as the ring runs outside it: drawn across
the boundary, from 2px out to 1px in, as the button's is, it filled the gap the ring keeps, and the
ring, the line and the boundary ran together as one line 5px wide, in every theme; inside, the three
stood apart in all three engines — measured. The pointer's shadow and fill yield to the focus, and a
disabled field answers none of the pointer's effects. The pointer's orbit and comet yield to the
focus too, and to an error, whose layer they are drawn on; they are shown through a property of
their own rather than through their opacity, which that layer holds at full: eased, the opacity ran
down from there each time an error was taken away, with the band drawn where it stood, in all three
engines — measured. The focus's `blur` is drawn for Glass, the one theme whose field lets the page
through: the field takes the theme's glass, and in Chromium the steepest step between neighbouring
pixels of the page behind it went from 42 to 20 in the light scheme and from 49 to 16 in the dark.
Firefox's video drew it too, WebKit is unmeasured, as the backdrops are, and the text held 15.3:1 or
more over it in both schemes. Where there is no glass, under another theme or with Glass standing
down, it changes nothing. An error's effects on the field play four rounds and rest, as the drawn
controls' do, and Play the error again starts them over. The label's accent is mixed a fifth of the
way to the text's colour: alone, it was 4.31:1 on Matrix's light page and on Glass's dark one, and
mixed, 5.4:1 or more in every theme and scheme. The flash mixes a fifth of the danger into the
surface rather than laying the danger over it, as the drawn controls once did, which took a field's
text to 3.14:1 at each round's start on Matrix's light page; mixed in, the text held 4.74:1 at the
least — measured — and the drawn controls take the same flash now, so the two look alike. The
select's page draws the same effects, from the module the two pages share, `fields.ts`. Its caret is
the control's background, two triangles the component paints there, so the shimmer and the scan
write the list again with their light in front of them and move the light alone, through a property
of its own: the caret stayed where the component puts it, left to right and right to left, under the
pointer and at the focus, in all three engines. Over the select the label in the accent held 5.4:1
or more, the text 4.74:1 at the least at the flash's peak and 15.5:1 or more over Glass's blur —
measured.

**A drawn control's effects are sorted by kind, as a field's are.** The checkbox, the switch and the
radio have the field's kinds — under the pointer a border, a shadow, a fill and their place; at the
focus a border, a shadow, a fill and a label; in error a border, a fill and a message — and each
kind draws on a layer of its own, so one of each draws at once. The control's own shadow is the glow
a theme lights it with, so the rings are added to it, and the lights round the control — the
pointer's, the focus's outside the boundary and inside it, and an error's — are drawn on its
`::after`, each from a property of its own. Its `::before` is the checkbox's mark and the radio's
dot, so the bands run on two layers the label lays over the control, the pointer's on its `::before`
and the focus's on its `::after`: the orbit, the comet, and the trace, which a field draws inside
its boundary and which on a control this small, its mark and its thumb inside, runs outside the
ring, 2px clear of it and 2px wide. The label's `::before` comes before the control, so it is raised
over it, the orbit running on the control's boundary; both layers are always there, empty until an
effect draws on one: a `::before` that a choice brought and took away stayed in Firefox's layout as
a flex item, and the label's gap moved the control 8px; and each is sized with its band's padding
inside it: sized by its content, every band, the trace's among them, ran twice its width further out
on the right and at the bottom than on the left and at the top — measured. The shimmer's sheen and
the scan's band cross the control on its `::after`, over the mark and the switch's thumb, and over a
full control in its fill lifted toward white. That layer and the label's colour are read off the
host's record of a visible focus and the label's `:focus-within` rather than off `:has(>
input:focus-visible)`: Firefox matched that selector and drew none of the rules under it as the
focus arrived, by Tab as by a script's focus — measured. The label in the accent is the field's mix,
and on the checkbox's and the radio's pages it held 5.4:1 or more in every theme and scheme, where
the accent alone fell to 4.23:1 — measured.

**An effect of one name looks the same wherever it is drawn.** The halo, the glow and the red glow
are one definition, which the fields and the drawn controls draw from, and the beacon and the neon
are one shape in two sizes: the beacon reaching 10px and the neon's widest light blurred over 24px
on a drawn control, and 12px and 40px on the button and a field, a field being the button's size.
Before, under the pointer a field's glow was two thirds of a checkbox's beside it and its halo half
as wide, and a field's beacon and neon were a checkbox's. The orbit and the comet are one definition
each, under the pointer and at the focus, on every component that offers either — the button, the
fields and the drawn controls in both moments, the card under the pointer. The orbit is the card's:
a light that runs round on the boundary and never past it, in a band from the boundary's outer edge
2px in, three laps of 1.6s, a third longer than the card's took and ending where four of the loop's
1.2s do, and then it fades. The comet is the button's: the orbit's light, in a band from 2px out to
5px, over where the focus ring is drawn, a lap every 2.4s; under the pointer it runs for as long as
the pointer rests and is held where it was when the pointer leaves, and at the focus, which can rest
for minutes, it runs two laps and fades. Before, the orbit ran from 2px out to 1px in on the button
under the pointer and from 4px out to 7px at every focus, and the button's comet from 6px out to 9px
at its focus. Each band landed where it is written on every component, in all three engines —
measured. The comet is drawn after the control, so it passes over the ring rather than under it, in
all three engines, and its tail is the accent a step from the page, as the orbit's is, rather than
the accent the ring takes: where the ring is the accent, which is every theme and scheme but
Matrix's dark one, the tail in the accent was 1.00 to 1.01:1 from the ring, and only the comet's
outer pixel and its head stood out over it; a step from the page, the tail is 1.35 to 1.86:1 from
the ring — measured. The card had left out a light that circles for as long as the pointer rests,
since a card is read with the pointer on it; it offers the comet now, and that refusal is gone. The
shimmer and the scan are the button's, one definition each, on every component with a pointer or a
focus to answer: the button, the fields and the drawn controls in both moments, and the card, a
table's row and the icon under the pointer. The shimmer is a sheen ten degrees off upright, three
quarters as wide as what it crosses, swept across from before its start to past its end, a sweep in
1.5s for as long as the pointer rests, and four of the loop's 1.2s at the focus, which can rest for
minutes, before it rests. The scan is a band of light crossing from above to below once as its
moment arrives, in 520ms: two fifths of the height, as on the button, and never more than a rem, so
across a card it is still a line. Both are drawn in the accent at half its strength over a surface,
and over a fill in that fill lifted toward white, as on the button's primary. Before, a field's and
a drawn control's scan was a band two fifths of their width crossing from the start to the end, at
the focus only, in a fifth of the accent and over a full control in the colour its mark is drawn in.
The icon's are cut to its strokes, on a layer over the glyph: a mask is a picture, which cannot read
the glyph the page draws, so the page draws the glyph into one as the pointer arrives. Each crossed
the way it is written, on every component, in all three engines — measured. No band runs in the gap
a control's focus ring keeps: the trace runs inside a field and outside a drawn control's ring.

/**
 * `ui-dialog`: what the entrance, the exit and the backdrop can do.
 *
 * **The entrance and the exit take the card's entrance**, each with a direction and a curve
 * beside it as kinds of their own: `--ui-motion-exit: slide` beside
 * `--ui-motion-exit-direction: left` slides the dialog out to the left. An exit's direction is
 * the way it leaves, so a dialog that came in from the left can go on to the right. An exit is
 * its entrance run the other way, under a name that says so where the entrance's would not: a
 * rise sinks, a refocus defocuses, and what converged scatters.
 *
 * **Every effect takes one step**, whatever it changes, where the card's each take a step by what
 * they change; the scrim, the pieces and the grain take it too. A dialog is opened to be used and
 * closed to get back to the page, so a reader waits on its motion both ways.
 *
 * The component closes once every animation on its `<dialog>` has finished, so an exit effect is
 * waited out by the code that is already there. Both moments are drawn on that `<dialog>`, inside
 * the shadow root, which every scope reaches: the limit S8 found on the card's host is not here.
 */
import { UiDialog } from '../../../../src/dialog.js';
import { reference } from '../../../../src/reference.js';
import {
    attributes,
    curve,
    dissolve,
    duration,
    inner,
    pieces,
    prototype,
    queries,
    restore,
    travel,
    type Effect,
    type Firing,
    type Order,
} from '../motion.js';

/** The query each effect is drawn under: the consumer's choice, else the theme's taste. */
const is = queries('dialog');

/** The step every effect here takes: 200ms, between two of the reference's. */
const step = '--ui-duration-150';

/** One depth of the rain: how big a character is, how strongly it is drawn, and its tile. */
interface Depth {
    readonly size: number;
    readonly strength: number;
    readonly width: number;
    readonly height: number;
}

/**
 * The rain's depths, nearest first. Each tile has a size of its own, so the three do not repeat
 * together: with one size for all, the repeat lined up across them and showed.
 */
const [near, middle, far]: readonly [Depth, Depth, Depth] = [
    { size: 18, strength: 1, width: 640, height: 600 },
    { size: 13, strength: 0.7, width: 520, height: 520 },
    { size: 9, strength: 0.45, width: 400, height: 440 },
];

/**
 * A copy of a dialog's panel, for a piece to show its cell of: the `<dialog>` the component
 * renders, laid out in place rather than lifted, under the component's own sheet, over copies of
 * what the host was given. Not a copy of the host: a `ui-dialog` copied while open opens itself,
 * and holds the page still as it does.
 */
const panel = (host: HTMLElement, dialog: HTMLElement) => (): HTMLElement => {
    const copy = document.createElement('div');
    // A box of its own, which the piece cuts and fades: the component's sheet gives its host
    // none, for the top layer's sake.
    copy.style.display = 'block';
    const root = copy.attachShadow({ mode: 'open' });
    const own = UiDialog.styles.styleSheet;
    root.adoptedStyleSheets = own === undefined ? [] : [own];

    const shown = dialog.cloneNode(true) as HTMLElement;
    shown.removeAttribute('class');
    // The copy's whole box, with nothing to come in from: the component's fade would.
    shown.style.cssText =
        'position: absolute; inset: 0; width: auto; height: auto; max-inline-size: none; max-block-size: none; margin: 0; transition: none; backdrop-filter: none;';
    // The panel's glass on the copy itself, which is what fades: an ancestor whose opacity moves
    // is a backdrop root, which the glass cannot see past — as the pieces say of their cells.
    const glass = getComputedStyle(dialog);
    copy.style.backdropFilter = glass.backdropFilter;
    copy.style.borderRadius = glass.borderRadius;
    root.append(shown);
    copy.append(...[...host.children].map((child) => child.cloneNode(true)));

    return copy;
};

/** The panel put together from pieces of itself as the dialog opens, over it in the top layer. */
const assemble =
    (order: Order) =>
    ({ host }: Firing): void => {
        const dialog = inner(host, 'dialog');

        if (dialog === null) {
            return;
        }

        const way = travel(host, 'enter') ?? [1, 0];

        pieces({
            host,
            surface: dialog,
            copy: panel(host, dialog),
            order,
            // The disintegration this runs backwards blew the other way.
            wind: [-way[0], -way[1]],
            together: true,
            easing: curve(host, 'enter'),
            length: duration(host, step),
        });
    };

/**
 * The panel broken into pieces as the dialog closes: the reference's disintegration, forward.
 * The pieces are beside the dialog rather than in it, and the dialog closes as the last goes.
 */
const disintegrate =
    (order: Order) =>
    ({ host }: Firing): void => {
        const dialog = inner(host, 'dialog');

        if (dialog === null) {
            return;
        }

        pieces({
            host,
            surface: dialog,
            copy: panel(host, dialog),
            order,
            wind: travel(host, 'exit') ?? [1, 0],
            together: false,
            easing: curve(host, 'exit'),
            length: duration(host, step),
        });
    };

/**
 * The panel brought out of grain as the dialog opens, or dissolved into it as the dialog closes:
 * the card's dissolve, on the `<dialog>` itself. No copy, so it stays where it is, in the top
 * layer, until the grain is gone.
 */
const grain =
    (together: boolean) =>
    ({ host }: Firing): void => {
        const dialog = inner(host, 'dialog');

        if (dialog === null) {
            return;
        }

        dissolve({
            host,
            surface: dialog,
            together,
            easing: curve(host, together ? 'enter' : 'exit'),
            length: duration(host, step),
        });
    };

const sheet = String.raw`
/* ——— The entrance and the exit.

   Animations, as the card's entrance is: each brings its own curve, on the one step, and leaves
   nothing behind when it is done — a reveal's clip goes with it. The component's fade is a
   transition, which would run beside an animation and win, a transition outranking an animation
   in the cascade, so each effect turns it off for its moment.

   An exit starts from a panel that is there and holds its last frame until the component closes
   the dialog: the component's own exit is a fade to nothing, which every effect here draws in
   its place.

   The direction and the curve are values the keyframes read, as on the card. Each effect sets
   its own direction; a chosen one comes later in the sheet, and wins. ——— */
@container ${is('enter', 'none')} {
    dialog[open]:not(.closing) {
        transition: none;
    }
}

@container ${is('enter', 'rise')} {
    dialog {
        --ui-enter-x: 0;
        --ui-enter-y: -1;
    }

    dialog[open]:not(.closing) {
        transition: none;
        animation: ui-enter-rise var(${step})
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

@container ${is('enter', 'zoom')} {
    dialog[open]:not(.closing) {
        transition: none;
        animation: ui-enter-zoom var(${step})
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

/* drop: its bounce is its curve, which a chosen one does not replace. */
@container ${is('enter', 'drop')} {
    dialog[open]:not(.closing) {
        transition: none;
        animation: ui-drop var(${step}) linear;
    }
}

@container ${is('enter', 'slide')} {
    dialog {
        --ui-enter-x: 1;
        --ui-enter-y: 0;
    }

    dialog[open]:not(.closing) {
        transition: none;
        animation: ui-enter-slide var(${step})
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

@container ${is('enter', 'flip-vertical')} {
    dialog[open]:not(.closing) {
        transition: none;
        animation: ui-enter-flip-vertical var(${step})
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

@container ${is('enter', 'flip-horizontal')} {
    dialog[open]:not(.closing) {
        transition: none;
        animation: ui-enter-flip-horizontal var(${step})
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

@container ${is('enter', 'wipe')} {
    dialog {
        --ui-enter-x: 1;
        --ui-enter-y: 0;
    }

    dialog[open]:not(.closing) {
        transition: none;
        animation: ui-enter-wipe var(${step})
            var(--ui-enter-curve, var(--ui-easing-move)) backwards;
    }
}

@container ${is('enter', 'circle')} {
    dialog {
        --ui-enter-x: 0;
        --ui-enter-y: 0;
    }

    dialog[open]:not(.closing) {
        transition: none;
        animation: ui-enter-circle var(${step})
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

@container ${is('enter', 'curtain')} {
    dialog {
        --ui-enter-x: 1;
        --ui-enter-y: 0;
    }

    dialog[open]:not(.closing) {
        transition: none;
        animation: ui-enter-curtain var(${step})
            var(--ui-enter-curve, var(--ui-easing-move)) backwards;
    }
}

@container ${is('enter', 'refocus')} {
    dialog[open]:not(.closing) {
        transition: none;
        animation: ui-enter-refocus var(${step})
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

/* wind, converge, materialize: the pieces are a script's, over the panel in the top layer. The
   panel is where it will be, transparent until they have landed, and there at once then. So is
   a dissolving one, under the grain a script moves. */
@container ${is('enter', 'wind')} or ${is('enter', 'converge')} or
    ${is('enter', 'materialize')} or ${is('enter', 'dissolve')} {
    dialog[open]:not(.closing) {
        transition: none;
    }
}

@container ${is('exit', 'none')} {
    dialog.closing {
        transition: none;
    }
}

@container ${is('exit', 'sink')} {
    dialog {
        --ui-exit-x: 0;
        --ui-exit-y: 1;
    }

    dialog.closing {
        --ui-exit-length: var(${step});
        opacity: 1;
        transition: none;
        animation: ui-exit-sink var(--ui-exit-length)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'zoom')} {
    dialog.closing {
        --ui-exit-length: var(${step});
        opacity: 1;
        transition: none;
        animation: ui-exit-zoom var(--ui-exit-length)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'slide')} {
    dialog {
        --ui-exit-x: 1;
        --ui-exit-y: 0;
    }

    dialog.closing {
        --ui-exit-length: var(${step});
        opacity: 1;
        transition: none;
        animation: ui-exit-slide var(--ui-exit-length)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'flip-vertical')} {
    dialog.closing {
        --ui-exit-length: var(${step});
        opacity: 1;
        transition: none;
        animation: ui-exit-flip-vertical var(--ui-exit-length)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'flip-horizontal')} {
    dialog.closing {
        --ui-exit-length: var(${step});
        opacity: 1;
        transition: none;
        animation: ui-exit-flip-horizontal var(--ui-exit-length)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'wipe')} {
    dialog {
        --ui-exit-x: 1;
        --ui-exit-y: 0;
    }

    dialog.closing {
        --ui-exit-length: var(${step});
        opacity: 1;
        transition: none;
        animation: ui-exit-wipe var(--ui-exit-length)
            var(--ui-exit-curve, var(--ui-easing-move)) forwards;
    }
}

@container ${is('exit', 'circle')} {
    dialog {
        --ui-exit-x: 0;
        --ui-exit-y: 0;
    }

    dialog.closing {
        --ui-exit-length: var(${step});
        opacity: 1;
        transition: none;
        animation: ui-exit-circle var(--ui-exit-length)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'curtain')} {
    dialog {
        --ui-exit-x: 1;
        --ui-exit-y: 0;
    }

    dialog.closing {
        --ui-exit-length: var(${step});
        opacity: 1;
        transition: none;
        animation: ui-exit-curtain var(--ui-exit-length)
            var(--ui-exit-curve, var(--ui-easing-move)) forwards;
    }
}

@container ${is('exit', 'defocus')} {
    dialog.closing {
        --ui-exit-length: var(${step});
        opacity: 1;
        transition: none;
        animation: ui-exit-defocus var(--ui-exit-length)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

/* wind, scatter, erode: the pieces are a script's, and the panel goes at once under them. What
   the component waits on here holds the dialog open while they fly, and its scrim fades with
   them. */
@container ${is('exit', 'wind')} or ${is('exit', 'scatter')} or
    ${is('exit', 'erode')} {
    dialog.closing {
        --ui-exit-length: var(${step});
        transition: none;
        animation: ui-held var(--ui-exit-length) linear;
    }
}

/* dissolve: the grain is drawn on the panel itself, so the dialog stays open until it has gone,
   for as long as the script's dissolve runs. The scrim goes on the grain's curve, which is
   linear unless one is chosen. */
@container ${is('exit', 'dissolve')} {
    dialog.closing {
        --ui-exit-length: var(${step});
        opacity: 1;
        transition: none;
        animation: ui-kept var(--ui-exit-length) linear;
    }

    dialog.closing::backdrop {
        transition-timing-function: var(--ui-exit-curve, linear);
    }
}

/* The scrim leaves with the panel, over the length of the exit the panel takes, so neither is
   left on the page without the other. An exit with no length of its own, today's fade or none,
   leaves it the state's step, as today. */
dialog.closing::backdrop {
    transition-duration: var(--ui-exit-length, ${reference('--ui-duration-state')});
}

/* A direction chosen, for either moment: the way the effect travels. */
@container ${is('enter-direction', 'up')} {
    dialog {
        --ui-enter-x: 0;
        --ui-enter-y: -1;
    }
}

@container ${is('enter-direction', 'down')} {
    dialog {
        --ui-enter-x: 0;
        --ui-enter-y: 1;
    }
}

@container ${is('enter-direction', 'left')} {
    dialog {
        --ui-enter-x: -1;
        --ui-enter-y: 0;
    }
}

@container ${is('enter-direction', 'right')} {
    dialog {
        --ui-enter-x: 1;
        --ui-enter-y: 0;
    }
}

@container ${is('exit-direction', 'up')} {
    dialog {
        --ui-exit-x: 0;
        --ui-exit-y: -1;
    }
}

@container ${is('exit-direction', 'down')} {
    dialog {
        --ui-exit-x: 0;
        --ui-exit-y: 1;
    }
}

@container ${is('exit-direction', 'left')} {
    dialog {
        --ui-exit-x: -1;
        --ui-exit-y: 0;
    }
}

@container ${is('exit-direction', 'right')} {
    dialog {
        --ui-exit-x: 1;
        --ui-exit-y: 0;
    }
}

/* A curve chosen, for either moment. Today's fade takes it too. */
@container ${is('enter-curve', 'linear')} {
    dialog {
        --ui-enter-curve: linear;
    }

    dialog[open]:not(.closing) {
        transition-timing-function: linear;
    }
}

@container ${is('enter-curve', 'ease-in-out')} {
    dialog {
        --ui-enter-curve: ease-in-out;
    }

    dialog[open]:not(.closing) {
        transition-timing-function: ease-in-out;
    }
}

@container ${is('exit-curve', 'linear')} {
    dialog {
        --ui-exit-curve: linear;
    }

    dialog.closing {
        transition-timing-function: linear;
    }
}

@container ${is('exit-curve', 'ease-in-out')} {
    dialog {
        --ui-exit-curve: ease-in-out;
    }

    dialog.closing {
        transition-timing-function: ease-in-out;
    }
}

/* backdrop */
@container ${is('backdrop', 'none')} {
    dialog::backdrop {
        transition: none;
    }
}

@container ${is('backdrop', 'blur')} {
    dialog::backdrop {
        backdrop-filter: blur(4px);
        transition:
            opacity var(${step}) var(--ui-easing-enter),
            backdrop-filter var(${step}) var(--ui-easing-enter);
    }

    @starting-style {
        dialog[open]::backdrop {
            backdrop-filter: blur(0);
        }
    }

    dialog.closing::backdrop {
        backdrop-filter: blur(0);
    }
}

/* blur, under a theme that raises its surfaces as glass: the blur alone, with no scrim colour
   over it, which would tint the page the glass is there to let through. The theme's name does
   not reach a shadow root; its glass does, as the backdrop filter of a raised surface, read
   through the token's fallback. Where the reader asks for less transparency or more contrast,
   the glass stands down by leaving the token with no value at all, and a query on the token
   itself took that for glass and left the page with no scrim, measured. */
:host {
    --ui-glass: var(--ui-backdrop-raised, none);
}

@container ${is('backdrop', 'blur')} and (not style(--ui-glass: none)) {
    dialog::backdrop {
        background: transparent;
    }
}

/* frost: the reference's frosted glass over the whole page, a long blur and more colour, with
   no scrim over it in any theme. It grows in as the blur does. */
@container ${is('backdrop', 'frost')} {
    dialog::backdrop {
        background: transparent;
        backdrop-filter: blur(12px) saturate(1.7);
        transition:
            opacity var(${step}) var(--ui-easing-enter),
            backdrop-filter var(${step}) var(--ui-easing-enter);
    }

    @starting-style {
        dialog[open]::backdrop {
            backdrop-filter: blur(0) saturate(1);
        }
    }

    dialog.closing::backdrop {
        backdrop-filter: blur(0) saturate(1);
    }
}

/* refract: the reference's lens, which pushes the page about by noise rather than blurring it,
   so an edge behind it bends. A filter's reference is looked up in the dialog's own tree, so
   the lens is rendered into the shadow root. It comes in with the scrim, which keeps its colour
   under glass too: Firefox draws nothing for a backdrop filter that names an SVG filter, a
   blur beside it included, and CSS.supports says it does, so the colour is what Firefox shows. */
@container ${is('backdrop', 'refract')} {
    dialog::backdrop {
        backdrop-filter: url(#ui-lens);
        transition: opacity var(${step}) var(--ui-easing-enter);
    }
}

/* The patterns, drawn over the scrim in the theme's accent, so each takes on the theme it is
   under. Each slides 2.5rem into place as the scrim comes in and on as it goes: a pattern that
   repeats ends where it would have been, and nothing moves once it is there. */
dialog {
    --ui-pattern: rgb(from var(--ui-color-accent) r g b / 0.3);
}

@container ${is('backdrop', 'stripes')} {
    dialog::backdrop {
        background:
            linear-gradient(
                    45deg,
                    var(--ui-pattern) 25%,
                    transparent 25% 50%,
                    var(--ui-pattern) 50% 75%,
                    transparent 75%
                )
                0 0 / 2.5rem 2.5rem,
            ${reference('--ui-color-scrim')};
        transition:
            opacity var(${step}) var(--ui-easing-enter),
            background-position var(${step}) var(--ui-easing-enter);
    }

    @starting-style {
        dialog[open]::backdrop {
            background-position:
                -2.5rem 0,
                0 0;
        }
    }

    dialog.closing::backdrop {
        background-position:
            2.5rem 0,
            0 0;
    }
}

/* grid: squared paper, its lines stronger than a stripe, being a pixel wide. */
@container ${is('backdrop', 'grid')} {
    dialog::backdrop {
        background:
            linear-gradient(to right, rgb(from var(--ui-color-accent) r g b / 0.5) 1px, transparent 1px)
                0 0 / 2.5rem 2.5rem,
            linear-gradient(to bottom, rgb(from var(--ui-color-accent) r g b / 0.5) 1px, transparent 1px)
                0 0 / 2.5rem 2.5rem,
            ${reference('--ui-color-scrim')};
        transition:
            opacity var(${step}) var(--ui-easing-enter),
            background-position var(${step}) var(--ui-easing-enter);
    }

    @starting-style {
        dialog[open]::backdrop {
            background-position:
                -2.5rem -2.5rem,
                -2.5rem -2.5rem,
                0 0;
        }
    }

    dialog.closing::backdrop {
        background-position:
            2.5rem 2.5rem,
            2.5rem 2.5rem,
            0 0;
    }
}

@container ${is('backdrop', 'checker')} {
    dialog::backdrop {
        background:
            repeating-conic-gradient(var(--ui-pattern) 0 25%, transparent 0 50%) 0 0 / 5rem 5rem,
            ${reference('--ui-color-scrim')};
        transition:
            opacity var(${step}) var(--ui-easing-enter),
            background-position var(${step}) var(--ui-easing-enter);
    }

    @starting-style {
        dialog[open]::backdrop {
            background-position:
                -2.5rem -2.5rem,
                0 0;
        }
    }

    dialog.closing::backdrop {
        background-position:
            2.5rem 2.5rem,
            0 0;
    }
}

/* char-rain: the reference's falling code, at three depths over the scrim, each a tile the page
   draws in the colour the theme's accent resolves to. It falls as a loop that settles runs,
   slowing to rest within the five seconds WCAG 2.2.2 lets motion run unstoppable, and stays a
   still wall of code for as long as the dialog is open. Forced colours keep a picture where
   they take a gradient away, so the rain stands down there itself. */
@container ${is('backdrop', 'char-rain')} {
    dialog::backdrop {
        background:
            var(--ui-rain, none),
            ${reference('--ui-color-scrim')};
        transition: opacity var(${step}) var(--ui-easing-enter);
        animation: ui-rain calc(var(--ui-duration-loop) * var(--ui-iteration-settle))
            cubic-bezier(0.33, 0.33, 0.5, 1);
    }

    @media (forced-colors: active) {
        dialog::backdrop {
            background-image: none;
            animation: none;
        }
    }
}

/* A step below, as the entrance has always risen. */
@keyframes ui-enter-rise {
    from {
        opacity: 0;
        translate: calc(var(--ui-enter-x) * -1rem) calc(var(--ui-enter-y) * -1rem);
    }
}

@keyframes ui-enter-zoom {
    from {
        opacity: 0;
        scale: 0.96;
    }
}

@keyframes ui-drop {
    0% {
        opacity: 0;
        translate: 0 -4rem;
        animation-timing-function: ease-in;
    }
    45% {
        opacity: 1;
        translate: 0 0;
        animation-timing-function: ease-out;
    }
    70% {
        translate: 0 -0.75rem;
        animation-timing-function: ease-in;
    }
    88% {
        translate: 0 0;
        animation-timing-function: ease-out;
    }
    95% {
        translate: 0 -0.2rem;
        animation-timing-function: ease-in;
    }
    100% {
        translate: 0 0;
    }
}

/* Its own size behind, and whole by two fifths of the way. */
@keyframes ui-enter-slide {
    from {
        opacity: 0;
        translate: calc(var(--ui-enter-x) * -100%) calc(var(--ui-enter-y) * -100%);
    }
    40% {
        opacity: 1;
    }
}

/* Edge-on, at 90°, turning until it faces the reader. */
@keyframes ui-enter-flip-vertical {
    from {
        transform: perspective(60rem) rotateX(90deg);
    }
}

@keyframes ui-enter-flip-horizontal {
    from {
        transform: perspective(60rem) rotateY(90deg);
    }
}

/* The reveals end 3rem past the panel, so the focus ring round it is uncovered with it rather
   than all at once when the clip goes. The wipe's edge sweeps the way it travels. */
@keyframes ui-enter-wipe {
    from {
        clip-path: inset(
            calc(max(0, -1 * var(--ui-enter-y)) * 100%)
            calc(max(0, var(--ui-enter-x)) * 100%)
            calc(max(0, var(--ui-enter-y)) * 100%)
            calc(max(0, -1 * var(--ui-enter-x)) * 100%)
        );
    }
    to {
        clip-path: inset(-3rem);
    }
}

/* From the middle, or from the edge it travels away from, out to 3rem past the farthest corner
   and no further: the card's circle, whose sheet says why. */
@keyframes ui-enter-circle {
    from {
        clip-path: circle(
            0 at calc(50% - var(--ui-enter-x) * 50%) calc(50% - var(--ui-enter-y) * 50%)
        );
    }
    to {
        clip-path: circle(
            calc(
                (1 + max(var(--ui-enter-x), -1 * var(--ui-enter-x), var(--ui-enter-y),
                    -1 * var(--ui-enter-y))) * 70.71% + 3rem
            )
            at calc(50% - var(--ui-enter-x) * 50%) calc(50% - var(--ui-enter-y) * 50%)
        );
    }
}

/* From a line through the middle outward, across the axis it travels on. */
@keyframes ui-enter-curtain {
    from {
        clip-path: inset(
            calc(max(var(--ui-enter-y), -1 * var(--ui-enter-y)) * 50%)
            calc(max(var(--ui-enter-x), -1 * var(--ui-enter-x)) * 50%)
        );
    }
    to {
        clip-path: inset(-3rem);
    }
}

/* Out of focus by half a rem and sharpening, there by half the way: the card's refocus, whose
   sheet says why no deeper. */
@keyframes ui-enter-refocus {
    from {
        filter: blur(0.5rem);
        opacity: 0;
    }
    50% {
        opacity: 1;
    }
}

/* The exits, each its entrance run the other way: from a panel that is there to none. */
@keyframes ui-exit-sink {
    to {
        opacity: 0;
        translate: calc(var(--ui-exit-x) * 1rem) calc(var(--ui-exit-y) * 1rem);
    }
}

@keyframes ui-exit-zoom {
    to {
        opacity: 0;
        scale: 0.96;
    }
}

/* Whole for three fifths of the way, then gone with the last of it. */
@keyframes ui-exit-slide {
    60% {
        opacity: 1;
    }
    to {
        opacity: 0;
        translate: calc(var(--ui-exit-x) * 100%) calc(var(--ui-exit-y) * 100%);
    }
}

/* Turning on the way it came in, until it is edge-on. */
@keyframes ui-exit-flip-vertical {
    to {
        transform: perspective(60rem) rotateX(-90deg);
    }
}

@keyframes ui-exit-flip-horizontal {
    to {
        transform: perspective(60rem) rotateY(-90deg);
    }
}

/* The edge sweeps the way it travels, covering what it passes. */
@keyframes ui-exit-wipe {
    from {
        clip-path: inset(-3rem);
    }
    to {
        clip-path: inset(
            calc(max(0, var(--ui-exit-y)) * 100%)
            calc(max(0, -1 * var(--ui-exit-x)) * 100%)
            calc(max(0, -1 * var(--ui-exit-y)) * 100%)
            calc(max(0, var(--ui-exit-x)) * 100%)
        );
    }
}

/* Closing on the middle, or on the edge it travels to, from 3rem past the farthest corner. */
@keyframes ui-exit-circle {
    from {
        clip-path: circle(
            calc(
                (1 + max(var(--ui-exit-x), -1 * var(--ui-exit-x), var(--ui-exit-y),
                    -1 * var(--ui-exit-y))) * 70.71% + 3rem
            )
            at calc(50% + var(--ui-exit-x) * 50%) calc(50% + var(--ui-exit-y) * 50%)
        );
    }
    to {
        clip-path: circle(
            0 at calc(50% + var(--ui-exit-x) * 50%) calc(50% + var(--ui-exit-y) * 50%)
        );
    }
}

/* Closing to a line through the middle, across the axis it travels on. */
@keyframes ui-exit-curtain {
    from {
        clip-path: inset(-3rem);
    }
    to {
        clip-path: inset(
            calc(max(var(--ui-exit-y), -1 * var(--ui-exit-y)) * 50%)
            calc(max(var(--ui-exit-x), -1 * var(--ui-exit-x)) * 50%)
        );
    }
}

/* Blurring away by as much as the entrance sharpens from, and gone over the second half. */
@keyframes ui-exit-defocus {
    50% {
        opacity: 1;
    }
    to {
        filter: blur(0.5rem);
        opacity: 0;
    }
}

/* Nothing to draw: the panel has gone already, and this only holds the dialog open. */
@keyframes ui-held {
    to {
        opacity: 0;
    }
}

/* Nothing to draw either, the panel kept as it is while a script draws on it. */
@keyframes ui-kept {
    to {
        opacity: 1;
    }
}

/* Each depth falls a whole number of its tiles and comes to rest where it started, the nearest
   fastest: a tile every round of the loop for it, three in four for the middle, one in two behind. */
@keyframes ui-rain {
    from {
        background-position:
            0 calc(var(--ui-iteration-settle) * -${String(near.height)}px),
            0 calc(var(--ui-iteration-settle) * -${String(middle.height * 0.75)}px),
            0 calc(var(--ui-iteration-settle) * -${String(far.height * 0.5)}px),
            0 0;
    }
}
`;

/** The way a moment's effect travels, a kind of its own beside the effect. */
const direction = (moment: 'enter' | 'exit'): readonly Effect[] => [
    {
        name: 'none',
        today: true,
        says:
            moment === 'enter'
                ? 'Each effect’s own: up for a rise, right for a slide, a wipe and the wind, out from the middle for a circle, across for a curtain.'
                : 'Each effect’s own: down for a sink, right for a slide, a wipe and the wind, into the middle for a circle, across for a curtain.',
    },
    { name: 'up', says: moment === 'enter' ? 'Travels up, from below.' : 'Leaves upward.' },
    { name: 'down', says: moment === 'enter' ? 'Travels down, from above.' : 'Leaves downward.' },
    {
        name: 'left',
        says: moment === 'enter' ? 'Travels left, from the right.' : 'Leaves to the left.',
    },
    {
        name: 'right',
        says: moment === 'enter' ? 'Travels right, from the left.' : 'Leaves to the right.',
    },
];

/** The curve a moment's effect runs on, a kind of its own beside the effect. */
const curves: readonly Effect[] = [
    {
        name: 'none',
        today: true,
        says: 'Each effect’s own: quick and settling, or a reveal’s even sweep.',
    },
    { name: 'linear', says: 'At one speed from start to end.' },
    { name: 'ease-in-out', says: 'Gathers speed, then settles.' },
];

prototype({
    tags: ['ui-dialog'],
    sheet,
    moments: [
        {
            name: 'enter',
            label: 'Entrance',
            on: 'opening',
            kinds: [
                {
                    name: '',
                    label: 'Effect',
                    effects: [
                        { name: 'fade', today: true, says: 'Fades in, on the state’s step.' },
                        { name: 'none', says: 'There at once.' },
                        {
                            name: 'rise',
                            directed: true,
                            says: 'Fades in from a little way off, below it unless a direction says otherwise.',
                        },
                        { name: 'zoom', says: 'Fades in from a little smaller.' },
                        {
                            name: 'drop',
                            says: 'Falls in from above and bounces to rest, on a curve of its own.',
                        },
                        {
                            name: 'slide',
                            directed: true,
                            says: 'Slides in from its own size away, from the left unless a direction says otherwise.',
                        },
                        {
                            name: 'flip-vertical',
                            says: 'Turns in from edge-on, top over bottom, until it faces the reader.',
                        },
                        {
                            name: 'flip-horizontal',
                            says: 'Turns in from edge-on, side over side, until it faces the reader.',
                        },
                        {
                            name: 'wipe',
                            directed: true,
                            says: 'Uncovered by an edge sweeping across it, from the left unless a direction says otherwise.',
                        },
                        {
                            name: 'circle',
                            directed: true,
                            says: 'Uncovered by a circle growing from its middle, or from the edge a direction leaves.',
                        },
                        {
                            name: 'curtain',
                            directed: true,
                            says: 'Uncovered from its middle outward, as a curtain opens: across it, or up and down for those directions.',
                        },
                        {
                            name: 'refocus',
                            says: 'Comes into focus: blurred and faint, then sharp.',
                        },
                        {
                            name: 'wind',
                            directed: true,
                            fire: assemble('wind'),
                            says: 'Put together from pieces of itself blown in on a wind, from the left unless a direction says otherwise.',
                        },
                        {
                            name: 'converge',
                            fire: assemble('middle'),
                            says: 'Put together from pieces flying in from all round, the outermost first.',
                        },
                        {
                            name: 'materialize',
                            fire: assemble('random'),
                            says: 'Put together from pieces appearing where they belong, at random.',
                        },
                        {
                            name: 'dissolve',
                            fire: grain(true),
                            says: 'Comes out of a fine grain, the whole panel at once, until no grain is missing.',
                        },
                    ],
                },
                { name: 'direction', label: 'Direction', effects: direction('enter') },
                { name: 'curve', label: 'Curve', effects: curves },
            ],
        },
        {
            name: 'exit',
            label: 'Exit',
            on: 'closing',
            kinds: [
                {
                    name: '',
                    label: 'Effect',
                    effects: [
                        { name: 'fade', today: true, says: 'Fades out, on the state’s step.' },
                        { name: 'none', says: 'Gone at once.' },
                        {
                            name: 'sink',
                            directed: true,
                            says: 'Fades out going a little way off, down unless a direction says otherwise.',
                        },
                        { name: 'zoom', says: 'Fades out, getting smaller.' },
                        {
                            name: 'slide',
                            directed: true,
                            says: 'Slides out its own size away, to the right unless a direction says otherwise.',
                        },
                        {
                            name: 'flip-vertical',
                            says: 'Turns away, top over bottom, until it is edge-on.',
                        },
                        {
                            name: 'flip-horizontal',
                            says: 'Turns away, side over side, until it is edge-on.',
                        },
                        {
                            name: 'wipe',
                            directed: true,
                            says: 'Covered by an edge sweeping across it, rightward unless a direction says otherwise.',
                        },
                        {
                            name: 'circle',
                            directed: true,
                            says: 'Covered as a circle closes on its middle, or on the edge a direction goes to.',
                        },
                        {
                            name: 'curtain',
                            directed: true,
                            says: 'Covered from its edges inward, as a curtain closes: across it, or up and down for those directions.',
                        },
                        {
                            name: 'defocus',
                            says: 'Goes out of focus: sharp, then blurred and faint.',
                        },
                        {
                            name: 'wind',
                            directed: true,
                            fire: disintegrate('wind'),
                            says: 'Broken into pieces blown away on a wind, to the right unless a direction says otherwise; blown down, the top goes first.',
                        },
                        {
                            name: 'scatter',
                            fire: disintegrate('middle'),
                            says: 'Broken into pieces flying out from its middle, the innermost first.',
                        },
                        {
                            name: 'erode',
                            fire: disintegrate('random'),
                            says: 'Broken into pieces vanishing where they are, at random.',
                        },
                        {
                            name: 'dissolve',
                            fire: grain(false),
                            says: 'Dissolves into a fine grain, the whole panel at once, and closes when none is left.',
                        },
                    ],
                },
                { name: 'direction', label: 'Direction', effects: direction('exit') },
                { name: 'curve', label: 'Curve', effects: curves },
            ],
        },
        {
            name: 'backdrop',
            label: 'Backdrop',
            effects: [
                { name: 'fade', today: true, says: 'The scrim fades in and out.' },
                { name: 'none', says: 'The scrim is there at once.' },
                {
                    name: 'blur',
                    says: 'The page behind blurs as the scrim comes in; under glass, the blur alone.',
                },
                {
                    name: 'frost',
                    says: 'The page behind turns to frosted glass, blurred a long way and more colourful, with no scrim.',
                },
                {
                    name: 'refract',
                    says: 'The page behind bends as through rippled glass, under the scrim. Firefox draws the scrim alone.',
                },
                {
                    name: 'stripes',
                    says: 'Diagonal stripes in the theme’s accent over the scrim, sliding into place.',
                },
                {
                    name: 'grid',
                    says: 'Squared paper in the theme’s accent over the scrim, sliding into place.',
                },
                {
                    name: 'checker',
                    says: 'A checkerboard in the theme’s accent over the scrim, sliding into place.',
                },
                {
                    name: 'char-rain',
                    says: 'Falling code in the theme’s accent, at three depths over the scrim, slowing to rest within five seconds as a still wall of it.',
                },
            ],
        },
    ],
    refused: [
        {
            name: 'liquid',
            why: 'the page behind rippling, its lens moved for as long as the dialog is open. That can be minutes, and WCAG 2.2.2 lets motion run five seconds before a reader must be able to stop it, which here only closing the dialog would do.',
        },
        {
            name: 'reveal from the click',
            why: 'a circle that opens from where the trigger was clicked needs the point, which the dialog does not have: it is opened by a call, from a key as often as from a pointer.',
        },
        {
            name: 'shake',
            why: 'answering a dismissal the dialog refuses by shaking it. Every ui-dialog closes on Escape and on its actions, so there is no refusal to answer.',
        },
    ],
});

/*
 * The two moments, announced where the component would fire them itself, from #enter() and
 * #exit(): the page watches what those write on the <dialog> — the open attribute, and the class
 * the exit is carried by — and dispatches the moment from inside it. A watcher's callback runs
 * before the next frame, so the pieces are there in the first frame the panel would have been.
 * Whatever pieces are still flying from the last moment end first.
 */
/**
 * The lens a refracting backdrop draws through, the reference's own: noise read as a map of how
 * far to push each pixel of what is behind.
 */
const lens = (): SVGSVGElement => {
    const svg = 'http://www.w3.org/2000/svg';
    const holder = document.createElementNS(svg, 'svg');
    attributes(holder, {
        'aria-hidden': 'true',
        style: 'position: absolute; width: 0; height: 0;',
    });
    const filter = document.createElementNS(svg, 'filter');
    attributes(filter, { id: 'ui-lens', x: '-20%', y: '-20%', width: '140%', height: '140%' });
    const noise = document.createElementNS(svg, 'feTurbulence');
    attributes(noise, {
        type: 'fractalNoise',
        baseFrequency: '0.018 0.05',
        numOctaves: '2',
        seed: '9',
        result: 'noise',
    });
    const push = document.createElementNS(svg, 'feDisplacementMap');
    attributes(push, {
        in: 'SourceGraphic',
        in2: 'noise',
        scale: '24',
        xChannelSelector: 'R',
        yChannelSelector: 'G',
    });
    filter.append(noise, push);
    holder.append(filter);

    return holder;
};

/** The characters the reference's falling code is written in. */
const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * One depth of falling code, as a tile that repeats without a seam: columns of characters, each
 * trail lit at its head and fading towards its tail, wrapped round the tile's height, with a
 * character mirrored now and then, as the film's are. Drawn on a canvas, in the colour the
 * theme's accent resolves to, because a picture cannot read a token; and a canvas rather than an
 * SVG, so its glow is drawn once rather than on every frame the rain moves.
 */
function depth(colour: string, { size, strength, width: wide, height }: Depth): string {
    const ratio = Math.min(devicePixelRatio, 2);
    // A row's height divides the tile's, so the tile repeats on a whole row.
    const line = height / Math.round(height / (size * 1.3));
    const rows = Math.round(height / line);
    const pitch = Math.round(size * 1.15);
    const columns = Math.round(wide / pitch);
    const width = columns * pitch;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const context = canvas.getContext('2d');

    if (context === null) {
        return 'none';
    }

    context.scale(ratio, ratio);
    context.font = `bold ${String(size)}px 'Courier New', Courier, ui-monospace, monospace`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.shadowColor = colour;
    context.shadowBlur = size * 0.6;
    const glow = size;

    /** Draws one character, and again across each edge its glow reaches past. */
    const stamp = (glyph: string, x: number, y: number, mirrored: boolean): void => {
        const across = [0, ...(x < glow ? [width] : []), ...(x > width - glow ? [-width] : [])];
        const down = [0, ...(y < glow ? [height] : []), ...(y > height - glow ? [-height] : [])];

        for (const dx of across) {
            for (const dy of down) {
                context.save();
                context.translate(x + dx, y + dy);
                context.scale(mirrored ? -1 : 1, 1);
                context.fillText(glyph, 0, 0);
                context.restore();
            }
        }
    };

    for (let column = 0; column < columns; column += 1) {
        // Up to two trails a column, so a tall tile is not sparse.
        for (let trail = 0; trail < 2; trail += 1) {
            if (Math.random() < 0.35) {
                continue;
            }

            const length = 6 + Math.floor(Math.random() * rows * 0.45);
            const head = Math.floor(Math.random() * rows);

            for (let behind = 0; behind < length; behind += 1) {
                const row = (head - behind + rows) % rows;
                const glyph = glyphs.charAt(Math.floor(Math.random() * glyphs.length));
                const mirrored = Math.random() < 0.3;
                const x = column * pitch + pitch / 2;
                const y = row * line + line / 2;
                context.fillStyle = colour;
                context.globalAlpha =
                    strength * (behind === 0 ? 1 : 0.08 + 0.8 * (1 - behind / length));
                stamp(glyph, x, y, mirrored);

                if (behind === 0) {
                    // The head, lit nearly white over its own colour.
                    context.fillStyle = 'white';
                    context.globalAlpha = strength * 0.65;
                    stamp(glyph, x, y, mirrored);
                }
            }
        }
    }

    return `url("${canvas.toDataURL('image/png')}") 0 0 / ${String(width)}px ${String(height)}px`;
}

/** The rain's three depths in one accent, drawn once for every dialog that asks for it. */
const rains = new Map<string, string>();

/** The rain's depths, nearest first, for a colour the accent resolved to. */
function rain(colour: string): string {
    let layers = rains.get(colour);

    if (layers === undefined) {
        layers = [near, middle, far].map((one) => depth(colour, one)).join(', ');
        rains.set(colour, layers);
    }

    return layers;
}

for (const host of document.querySelectorAll('ui-dialog')) {
    void host.updateComplete.then(() => {
        const dialog = inner(host, 'dialog');

        if (dialog === null) {
            return;
        }

        // Where the component would render it: from the document, the backdrop filter reached
        // nothing, measured in Chromium, the one engine that draws it.
        host.shadowRoot?.append(lens());

        // The rain in the accent as it resolves here, drawn again when a theme or a scheme
        // changes it.
        const accent = document.createElement('span');
        accent.hidden = true;
        accent.style.color = 'var(--ui-color-accent)';
        host.shadowRoot?.append(accent);
        let drawn = '';
        const paint = (): void => {
            const colour = getComputedStyle(accent).color;

            if (colour !== drawn) {
                drawn = colour;
                dialog.style.setProperty('--ui-rain', rain(colour));
            }
        };
        paint();
        new MutationObserver(() => {
            paint();
            requestAnimationFrame(paint);
        }).observe(document.documentElement, { attributes: true });
        matchMedia('(prefers-color-scheme: dark)').addEventListener('change', paint);

        const announce = (moment: 'opening' | 'closing'): void => {
            restore(dialog);
            dialog.dispatchEvent(new Event(moment, { bubbles: true, composed: true }));
        };

        new MutationObserver((records) => {
            for (const record of records) {
                if (record.attributeName === 'open') {
                    if (record.oldValue === null && dialog.hasAttribute('open')) {
                        announce('opening');
                    }
                } else if (
                    dialog.classList.contains('closing') &&
                    !(record.oldValue ?? '').split(' ').includes('closing')
                ) {
                    announce('closing');
                }
            }
        }).observe(dialog, { attributeFilter: ['open', 'class'], attributeOldValue: true });
    });
}

for (const button of document.querySelectorAll<HTMLElement>('[data-open]')) {
    button.addEventListener('click', () => {
        const dialog = document.querySelector(button.dataset['open'] ?? '');

        if (dialog instanceof UiDialog) {
            dialog.show();
        }
    });
}

for (const button of document.querySelectorAll<HTMLElement>('[data-close]')) {
    button.addEventListener('click', () => {
        button.closest('ui-dialog')?.close();
    });
}

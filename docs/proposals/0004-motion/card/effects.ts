/**
 * `ui-card`: what the pointer, an entrance and an exit can do.
 *
 * **The pointer's effects come by kind** — where the card is, its shadow, its fill, its
 * border — and each kind is a property of its own, so a reader combines two by writing two:
 * `--ui-motion-hover-shadow: raise` beside `--ui-motion-hover-border: edge`. Two effects of
 * one kind would fight over the same thing, and one property holds one of them. Every kind
 * but the movement draws on a layer of its own, which the page renders into the shadow root
 * as the component would, by the rules every surface shares, in `surfaces.ts`.
 *
 * **The card's surface is its host**, and S8 is what that costs: an effect that moves the
 * whole card is written on `:host`, which a choice made on the card itself — its type or the
 * one instance — cannot reach. Those are marked; the ones drawn on a layer reach every scope.
 * Moving the surface into the shadow root would lift the limit.
 */
import { enters, floods, focal, moves, sized, sweeps, waves } from '../controls.js';
import { focus, hover } from '../moments.js';
import {
    curve,
    dissolve,
    inner,
    pieces,
    prototype,
    queries,
    travel,
    type Firing,
    type Order,
} from '../motion.js';
import { layered, surface } from '../surfaces.js';

/** The query each effect is drawn under: the consumer's choice, else the theme's taste. */
const is = queries('card');

/** A card without a focus the reader can see in it, which the pointer's effects are drawn on,
 *  since they yield to it. Under :where(), so each weighs what it did. */
const calm = ':where(:not([data-focus-visible]))';

/** Throws a circle out from under the card, on the pointer's border layer or the focus's. */
const wave = waves(
    (host) => host,
    (host) => inner(host, "[data-layer='border']"),
);
const focusWave = waves(
    (host) => host,
    (host) => inner(host, "[data-layer='focus-border']"),
);

/**
 * A copy of the card for a piece to show its cell of: neither its name, nor what the pointer left
 * on it, nor the mark of a card on its way out.
 */
const copyOf = (host: HTMLElement) => (): HTMLElement => {
    const copy = host.cloneNode(true) as HTMLElement;
    copy.removeAttribute('id');
    copy.removeAttribute('style');
    copy.removeAttribute('data-leaving');

    return copy;
};

/**
 * Puts the card together from pieces of itself: the reference's disintegration, run backwards, by
 * the harness's pieces. The order is the reading: `wind` sweeps them in along a direction,
 * `converge` brings them in from all round, the outermost first, and `materialize` sets them down
 * where they belong at random.
 */
const reintegrate =
    (order: Order) =>
    ({ host }: Firing): void => {
        const way = travel(host, 'enter') ?? [1, 0];

        pieces({
            host,
            surface: host,
            copy: copyOf(host),
            order,
            // The disintegration this runs backwards blew the other way.
            wind: [-way[0], -way[1]],
            together: true,
            easing: curve(host, 'enter'),
        });
    };

/**
 * Breaks the card into pieces of itself as it goes: the reference's disintegration, forward, the
 * wind blowing the way the exit travels — down, it is the reference's from-the-top.
 */
const disintegrate =
    (order: Order) =>
    ({ host }: Firing): void => {
        pieces({
            host,
            surface: host,
            copy: copyOf(host),
            order,
            wind: travel(host, 'exit') ?? [1, 0],
            together: false,
            easing: curve(host, 'exit'),
        });
    };

/**
 * The card dissolved into grain where it stands, or brought out of it where it lands: the
 * reference's cheaper way, one filter and no copy, by the harness's dissolve.
 */
const grain =
    (together: boolean) =>
    ({ host }: Firing): void => {
        dissolve({
            host,
            surface: host,
            together,
            easing: curve(host, together ? 'enter' : 'exit'),
        });
    };

const sheet = String.raw`
/* The host is what moves, and the layers stack inside it: isolated, so a layer under the
   content stays over the card's own fill instead of going behind it. */
:host {
    isolation: isolate;
    transition-property: translate, scale, transform;
    transition-duration: var(--ui-duration-200), var(--ui-duration-200), var(--ui-duration-50);
    transition-timing-function: var(--ui-easing-enter), var(--ui-easing-enter), linear;
}

/* The host's one list of animations, read from a property for its entrance and its exit and one
   for a movement the pointer or the focus plays: written in one, a beat as the pointer arrived
   would take the entrance out of the list, which played again as the pointer left. Named for the
   card, since what it holds inherits them. A beat, a stretch and a swell go a quarter of the
   button's way, the card being three buttons wide. */
:host {
    animation: var(--ui-card-passage, none), var(--ui-card-move, none);
    --ui-give: 0.25;
}

${layered}

/* The focus wins. A card the reader can see the focus in is drawn as the focus chose, and the
   pointer resting on it changes nothing, nor does its arrival fire anything: a reader who came by
   the keyboard may have left the pointer where it was. */

/* hover-move: lift, on the host.

   Every hover state here sits under hover: hover, as the button's do: a tap leaves :hover on
   whatever it touched, so a state drawn without it stays on a phone's card. */
@media (hover: hover) {
    @container ${is('hover-move', 'lift')} {
        :host(:hover${calm}) {
            translate: 0 -0.25rem;
        }
    }
}

/* hover-move: zoom, on the host: three hundredths larger. */
@media (hover: hover) {
    @container ${is('hover-move', 'zoom')} {
        :host(:hover${calm}) {
            scale: 1.03;
        }
    }
}

/* hover-move: tilt, on the host. */
@container ${is('hover-move', 'tilt')} {
    :host(${calm}) {
        transform: perspective(60rem)
            rotateX(calc(var(--ui-pointer-ny) * var(--ui-pointer-near) * -5deg))
            rotateY(calc(var(--ui-pointer-nx) * var(--ui-pointer-near) * 5deg));
    }
}

/* hover-move: magnetic, on the host: drawn toward the pointer as it nears, half a step at most —
   the button's magnetic, at a card's size. */
@container ${is('hover-move', 'magnetic')} {
    :host(${calm}) {
        translate: calc(var(--ui-pointer-nx) * var(--ui-pointer-near) * 0.5rem)
            calc(var(--ui-pointer-ny) * var(--ui-pointer-near) * 0.375rem);
    }
}

/* hover-move: heartbeat, rubber and glitch, the button's, once, as the pointer arrives, on the
   host; and at the focus, as the focus arrives in the card, with its lift and its zoom. The
   focus's play under its own names, so its arrival starts them where the pointer's played the
   same in the host's one list. */
@media (hover: hover) {
    @container ${is('hover-move', 'heartbeat')} {
        :host(:hover${calm}) {
            --ui-card-move: ui-heartbeat var(--ui-duration-300) var(--ui-easing-state);
        }
    }

    @container ${is('hover-move', 'rubber')} {
        :host(:hover${calm}) {
            --ui-card-move: ui-rubber var(--ui-duration-400) linear;
        }
    }

    @container ${is('hover-move', 'glitch')} {
        :host(:hover${calm}) {
            --ui-card-move: ui-glitch var(--ui-duration-200) linear;
        }
    }
}

@container ${is('focus-move', 'lift')} {
    :host([data-focus-visible]) {
        translate: 0 -0.25rem;
    }
}

@container ${is('focus-move', 'zoom')} {
    :host([data-focus-visible]) {
        scale: 1.03;
    }
}

@container ${is('focus-move', 'heartbeat')} {
    :host([data-focus-visible]) {
        --ui-card-move: ${focal.run('ui-heartbeat var(--ui-duration-300) var(--ui-easing-state)')};
    }
}

@container ${is('focus-move', 'rubber')} {
    :host([data-focus-visible]) {
        --ui-card-move: ${focal.run('ui-rubber var(--ui-duration-400) linear')};
    }
}

@container ${is('focus-move', 'glitch')} {
    :host([data-focus-visible]) {
        --ui-card-move: ${focal.run('ui-glitch var(--ui-duration-200) linear')};
    }
}

${surface({
    is,
    unfocused: `:host(${calm})`,
    resting: `:host(:hover${calm})`,
    focused: ':host([data-focus-visible])',
    rtl: ':host(:dir(rtl))',
})}

/* ——— The entrance, on the host, which a choice made on the card itself does not reach — S8.

   Animations rather than transitions from @starting-style: a flip turns the whole transform,
   whose transition here is the tilt's 50ms, and an animation brings its own length and curve.
   Each is held at its first frame only while it waits, so where an effect ends — a clip that
   reaches past the shadow — goes when it is done.

   The direction and the curve are values the keyframes read: a direction is a step on each
   axis, which an effect that travels starts behind, and the curve stands in for the effect's
   own where one is chosen. Each effect sets its own direction; a chosen one comes later in the
   sheet, and wins. ——— */
@container ${is('enter', 'fade')} {
    :host {
        --ui-card-passage: ui-enter-fade var(--ui-duration-300)
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

@container ${is('enter', 'rise')} {
    :host {
        --ui-enter-x: 0;
        --ui-enter-y: -1;
        --ui-card-passage: ui-enter-rise var(--ui-duration-300)
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

@container ${is('enter', 'zoom')} {
    :host {
        --ui-card-passage: ui-enter-zoom var(--ui-duration-300)
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

/* drop: its bounce is its curve, which a chosen one does not replace. */
@container ${is('enter', 'drop')} {
    :host {
        --ui-card-passage: ui-drop var(--ui-duration-400) linear backwards;
    }
}

@container ${is('enter', 'slide')} {
    :host {
        --ui-enter-x: 1;
        --ui-enter-y: 0;
        --ui-card-passage: ui-enter-slide var(--ui-duration-400)
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

@container ${is('enter', 'flip-vertical')} {
    :host {
        --ui-card-passage: ui-enter-flip-vertical var(--ui-duration-400)
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

@container ${is('enter', 'flip-horizontal')} {
    :host {
        --ui-card-passage: ui-enter-flip-horizontal var(--ui-duration-400)
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

@container ${is('enter', 'wipe')} {
    :host {
        --ui-enter-x: 1;
        --ui-enter-y: 0;
        --ui-card-passage: ui-enter-wipe var(--ui-duration-400)
            var(--ui-enter-curve, var(--ui-easing-move)) backwards;
    }
}

@container ${is('enter', 'circle')} {
    :host {
        --ui-enter-x: 0;
        --ui-enter-y: 0;
        --ui-card-passage: ui-enter-circle var(--ui-duration-400)
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

@container ${is('enter', 'curtain')} {
    :host {
        --ui-enter-x: 1;
        --ui-enter-y: 0;
        --ui-card-passage: ui-enter-curtain var(--ui-duration-400)
            var(--ui-enter-curve, var(--ui-easing-move)) backwards;
    }
}

@container ${is('enter', 'refocus')} {
    :host {
        --ui-card-passage: ui-enter-refocus calc(var(--ui-duration-400) * 1.25)
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

@container ${is('enter-direction', 'up')} {
    :host {
        --ui-enter-x: 0;
        --ui-enter-y: -1;
    }
}

@container ${is('enter-direction', 'down')} {
    :host {
        --ui-enter-x: 0;
        --ui-enter-y: 1;
    }
}

@container ${is('enter-direction', 'left')} {
    :host {
        --ui-enter-x: -1;
        --ui-enter-y: 0;
    }
}

@container ${is('enter-direction', 'right')} {
    :host {
        --ui-enter-x: 1;
        --ui-enter-y: 0;
    }
}

@container ${is('enter-curve', 'linear')} {
    :host {
        --ui-enter-curve: linear;
    }
}

@container ${is('enter-curve', 'ease-in-out')} {
    :host {
        --ui-enter-curve: ease-in-out;
    }
}

/* ——— The exit, on the host as the entrance is, and as limited — S8. The page marks the host as
   it takes the card away, where a component that owned its removal would set a state of its own,
   :host(:state(leaving)); each exit is drawn under the mark, a step quicker than its entrance, and
   holds its last frame until the card has gone. The direction is the way it leaves. ——— */
@container ${is('exit', 'fade')} {
    :host([data-leaving]) {
        --ui-card-passage: ui-exit-fade var(--ui-duration-200)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'sink')} {
    :host {
        --ui-exit-x: 0;
        --ui-exit-y: 1;
    }

    :host([data-leaving]) {
        --ui-card-passage: ui-exit-sink var(--ui-duration-200)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'zoom')} {
    :host([data-leaving]) {
        --ui-card-passage: ui-exit-zoom var(--ui-duration-200)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'slide')} {
    :host {
        --ui-exit-x: 1;
        --ui-exit-y: 0;
    }

    :host([data-leaving]) {
        --ui-card-passage: ui-exit-slide var(--ui-duration-300)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'flip-vertical')} {
    :host([data-leaving]) {
        --ui-card-passage: ui-exit-flip-vertical var(--ui-duration-300)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'flip-horizontal')} {
    :host([data-leaving]) {
        --ui-card-passage: ui-exit-flip-horizontal var(--ui-duration-300)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'wipe')} {
    :host {
        --ui-exit-x: 1;
        --ui-exit-y: 0;
    }

    :host([data-leaving]) {
        --ui-card-passage: ui-exit-wipe var(--ui-duration-300)
            var(--ui-exit-curve, var(--ui-easing-move)) forwards;
    }
}

@container ${is('exit', 'circle')} {
    :host {
        --ui-exit-x: 0;
        --ui-exit-y: 0;
    }

    :host([data-leaving]) {
        --ui-card-passage: ui-exit-circle var(--ui-duration-300)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'curtain')} {
    :host {
        --ui-exit-x: 1;
        --ui-exit-y: 0;
    }

    :host([data-leaving]) {
        --ui-card-passage: ui-exit-curtain var(--ui-duration-300)
            var(--ui-exit-curve, var(--ui-easing-move)) forwards;
    }
}

@container ${is('exit', 'defocus')} {
    :host([data-leaving]) {
        --ui-card-passage: ui-exit-defocus calc(var(--ui-duration-300) * 1.25)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit-direction', 'up')} {
    :host {
        --ui-exit-x: 0;
        --ui-exit-y: -1;
    }
}

@container ${is('exit-direction', 'down')} {
    :host {
        --ui-exit-x: 0;
        --ui-exit-y: 1;
    }
}

@container ${is('exit-direction', 'left')} {
    :host {
        --ui-exit-x: -1;
        --ui-exit-y: 0;
    }
}

@container ${is('exit-direction', 'right')} {
    :host {
        --ui-exit-x: 1;
        --ui-exit-y: 0;
    }
}

@container ${is('exit-curve', 'linear')} {
    :host {
        --ui-exit-curve: linear;
    }
}

@container ${is('exit-curve', 'ease-in-out')} {
    :host {
        --ui-exit-curve: ease-in-out;
    }
}

@keyframes ui-enter-fade {
    from {
        opacity: 0;
    }
}

/* Three quarters of a step behind where it travels to. */
@keyframes ui-enter-rise {
    from {
        opacity: 0;
        translate: calc(var(--ui-enter-x) * -0.75rem) calc(var(--ui-enter-y) * -0.75rem);
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

/* A reveal changes which parts of the card there are and leaves the rest where it was: the
   reference's clip-path. Each ends 3rem past the card, so a theme's glow is uncovered with it
   rather than all at once when the clip goes. The wipe's edge sweeps the way it travels. */
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

/* From the middle, or from the edge it travels away from, out to 3rem past the farthest corner,
   so a glow or a ring drawn past the box comes with it. A radius in percent is of the box's
   diagonal over √2: 70.71% reaches a corner from the middle, and twice that the far corner from
   anywhere on an edge. No further, because a circle grown past the box spends the rest of its
   duration where nothing is seen to change. */
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

/* Out of focus by half a rem and sharpening, there by half the way, so it never arrives as a
   blur all at once. No deeper: a blur is drawn again on every frame it changes, and eight cards
   coming into focus at once dropped 50 to 90 frames over eight runs in Chromium at 1.5rem, 12 to
   16 at 0.5rem, where a fade dropped none. */
@keyframes ui-enter-refocus {
    from {
        filter: blur(0.5rem);
        opacity: 0;
    }
    50% {
        opacity: 1;
    }
}

/* The exits, each its entrance run the other way: from a card that is there to none. */
@keyframes ui-exit-fade {
    to {
        opacity: 0;
    }
}

@keyframes ui-exit-sink {
    to {
        opacity: 0;
        translate: calc(var(--ui-exit-x) * 0.75rem) calc(var(--ui-exit-y) * 0.75rem);
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

/* Closing on the middle, or on the edge it travels to, from 3rem past the farthest corner: the
   entrance's circle, run the other way. */
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

@keyframes ui-orbit {
    to {
        --ui-orbit: 360deg;
    }
}

${sized.wide}

${sweeps}

${moves}

${focal.frames(moves)}

@keyframes ui-rest {
    to {
        opacity: 0;
    }
}
`;

/** Why the card leaves the hover colour out: its muted text is set against its own surface. */
const hovered =
    'the hover colour is chosen against a control’s label, and under the card’s muted text it fell to 3.28:1 on Matrix’s light page, and under 4.5:1 in five themes and schemes of six — measured.';

/** Why the card leaves the theme's own pointer shadow out: there is none for a raised surface. */
const unlit =
    'no theme gives a raised surface a shadow of its own under the pointer: the token layer has the card’s elevation at rest, and none for the pointer.';

/** Why the card leaves the preview out: what it shows is what a click would change. */
const unchanged = 'a click changes nothing of the card’s own for it to show beforehand.';

/** Why the card leaves the blur out: it is the glass already, wherever a theme makes it glass. */
const glassy =
    'the card is the theme’s glass already: it blurs the page behind it at rest wherever a theme makes it glass, and nothing is left for the effect to add.';

/** Why the card leaves the breathe out: what it swells is what is being read. */
const swelled =
    'it swells and settles the card’s content round after round, and a card’s content is what is being read.';

/** Why the card leaves the flips out. */
const turned =
    'it turns the content away from the reader for half its run, and a card’s content is what is being read: the entrance has it, before there is anything to read.';

const page = prototype({
    tags: ['ui-card'],
    sheet,
    layers: ['fill', 'focus-fill', 'shadow', 'focus-shadow', 'border', 'focus-border'],
    moments: [
        hover('card', {
            move: {
                draws: [
                    { name: 'lift', host: true },
                    { name: 'zoom', host: true },
                    { name: 'magnetic', host: true },
                    { name: 'tilt', host: true },
                    { name: 'heartbeat', host: true },
                    { name: 'rubber', host: true },
                    { name: 'glitch', host: true },
                ],
                refuses: { breathe: swelled, 'flip-vertical': turned, 'flip-horizontal': turned },
            },
            fill: {
                draws: [
                    'tint',
                    'spotlight',
                    { name: 'flood', fire: floods((host) => inner(host, "[data-layer='fill']")) },
                    'shimmer',
                    { name: 'ripple', fire: enters((host) => inner(host, "[data-layer='fill']")) },
                    'scan',
                ],
                refuses: { highlight: hovered, preview: unchanged, blur: glassy },
            },
            shadow: {
                draws: [
                    'raise',
                    'sink',
                    'halo',
                    'glow',
                    'inner',
                    'cast',
                    'neon',
                    'breathe',
                    'burst',
                ],
                refuses: { highlight: unlit },
            },
            border: {
                draws: [
                    'highlight',
                    'accent',
                    'edge',
                    'orbit',
                    'trace',
                    'comet',
                    'underline',
                    'sweep',
                    'pulse',
                    { name: 'shockwave', fire: wave('shockwave') },
                    { name: 'bloom', fire: wave('bloom') },
                    'explode',
                ],
            },
        }),
        focus(
            'card',
            {
                move: {
                    draws: [
                        { name: 'lift', host: true },
                        { name: 'zoom', host: true },
                        { name: 'heartbeat', host: true },
                        { name: 'rubber', host: true },
                        { name: 'glitch', host: true },
                    ],
                    refuses: {
                        breathe: swelled,
                        'flip-vertical': turned,
                        'flip-horizontal': turned,
                    },
                },
                fill: {
                    draws: ['tint', 'spotlight', 'flood', 'shimmer', 'ripple', 'scan'],
                    refuses: { highlight: hovered, preview: unchanged, blur: glassy },
                },
                shadow: {
                    draws: ['raise', 'sink', 'halo', 'glow', 'inner', 'neon', 'breathe', 'burst'],
                    refuses: { highlight: unlit },
                },
                border: {
                    draws: [
                        'highlight',
                        'accent',
                        'edge',
                        'orbit',
                        'trace',
                        'comet',
                        'underline',
                        'sweep',
                        'pulse',
                        { name: 'shockwave', fire: focusWave('shockwave') },
                        { name: 'bloom', fire: focusWave('bloom') },
                        'explode',
                    ],
                },
            },
            true,
        ),
        {
            name: 'enter',
            label: 'Entrance',
            on: 'arrive',
            kinds: [
                {
                    name: '',
                    label: 'Effect',
                    effects: [
                        { name: 'none', today: true, says: 'Appears where it lands.' },
                        { name: 'fade', host: true, says: 'Fades in where it lands.' },
                        {
                            name: 'rise',
                            host: true,
                            directed: true,
                            says: 'Fades in from a little way off, below it unless a direction says otherwise.',
                        },
                        { name: 'zoom', host: true, says: 'Fades in from a little smaller.' },
                        {
                            name: 'drop',
                            host: true,
                            says: 'Falls in from above and bounces to rest, on a curve of its own.',
                        },
                        {
                            name: 'slide',
                            host: true,
                            directed: true,
                            says: 'Slides in from its own size away, from the left unless a direction says otherwise.',
                        },
                        {
                            name: 'flip-vertical',
                            host: true,
                            says: 'Turns in from edge-on, top over bottom, until it faces the reader.',
                        },
                        {
                            name: 'flip-horizontal',
                            host: true,
                            says: 'Turns in from edge-on, side over side, until it faces the reader.',
                        },
                        {
                            name: 'wipe',
                            host: true,
                            directed: true,
                            says: 'Uncovered by an edge sweeping across it, from the left unless a direction says otherwise.',
                        },
                        {
                            name: 'circle',
                            host: true,
                            directed: true,
                            says: 'Uncovered by a circle growing from its middle, or from the edge a direction leaves.',
                        },
                        {
                            name: 'curtain',
                            host: true,
                            directed: true,
                            says: 'Uncovered from its middle outward, as a curtain opens: across it, or up and down for those directions.',
                        },
                        {
                            name: 'refocus',
                            host: true,
                            says: 'Comes into focus: blurred and faint, then sharp.',
                        },
                        {
                            name: 'wind',
                            directed: true,
                            fire: reintegrate('wind'),
                            says: 'Put together from pieces of itself blown in on a wind, from the left unless a direction says otherwise.',
                        },
                        {
                            name: 'converge',
                            fire: reintegrate('middle'),
                            says: 'Put together from pieces flying in from all round, the outermost first.',
                        },
                        {
                            name: 'materialize',
                            fire: reintegrate('random'),
                            says: 'Put together from pieces appearing where they belong, at random.',
                        },
                        {
                            name: 'dissolve',
                            fire: grain(true),
                            says: 'Comes out of a fine grain, the whole card at once, until no grain is missing.',
                        },
                    ],
                },
                {
                    name: 'direction',
                    label: 'Direction',
                    effects: [
                        {
                            name: 'none',
                            today: true,
                            says: 'Each effect’s own: up for a rise, right for a slide, a wipe and the wind, out from the middle for a circle, across for a curtain.',
                        },
                        { name: 'up', host: true, says: 'Travels up, from below.' },
                        { name: 'down', host: true, says: 'Travels down, from above.' },
                        { name: 'left', host: true, says: 'Travels left, from the right.' },
                        { name: 'right', host: true, says: 'Travels right, from the left.' },
                    ],
                },
                {
                    name: 'curve',
                    label: 'Curve',
                    effects: [
                        {
                            name: 'none',
                            today: true,
                            says: 'Each effect’s own: quick at first and settling, or a reveal’s even sweep.',
                        },
                        { name: 'linear', host: true, says: 'At one speed from start to end.' },
                        {
                            name: 'ease-in-out',
                            host: true,
                            says: 'Gathers speed, then settles.',
                        },
                    ],
                },
            ],
        },
        {
            name: 'exit',
            label: 'Exit',
            on: 'leave',
            kinds: [
                {
                    name: '',
                    label: 'Effect',
                    effects: [
                        { name: 'none', today: true, says: 'Gone at once, where it stood.' },
                        { name: 'fade', host: true, says: 'Fades out where it stands.' },
                        {
                            name: 'sink',
                            host: true,
                            directed: true,
                            says: 'Fades out going a little way off, down unless a direction says otherwise.',
                        },
                        { name: 'zoom', host: true, says: 'Fades out, getting smaller.' },
                        {
                            name: 'slide',
                            host: true,
                            directed: true,
                            says: 'Slides out its own size away, to the right unless a direction says otherwise.',
                        },
                        {
                            name: 'flip-vertical',
                            host: true,
                            says: 'Turns away, top over bottom, until it is edge-on.',
                        },
                        {
                            name: 'flip-horizontal',
                            host: true,
                            says: 'Turns away, side over side, until it is edge-on.',
                        },
                        {
                            name: 'wipe',
                            host: true,
                            directed: true,
                            says: 'Covered by an edge sweeping across it, rightward unless a direction says otherwise.',
                        },
                        {
                            name: 'circle',
                            host: true,
                            directed: true,
                            says: 'Covered as a circle closes on its middle, or on the edge a direction goes to.',
                        },
                        {
                            name: 'curtain',
                            host: true,
                            directed: true,
                            says: 'Covered from its edges inward, as a curtain closes: across it, or up and down for those directions.',
                        },
                        {
                            name: 'defocus',
                            host: true,
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
                            says: 'Dissolves into a fine grain, the whole card at once, and goes when none is left.',
                        },
                    ],
                },
                {
                    name: 'direction',
                    label: 'Direction',
                    effects: [
                        {
                            name: 'none',
                            today: true,
                            says: 'Each effect’s own: down for a sink, right for a slide, a wipe and the wind, into the middle for a circle, across for a curtain.',
                        },
                        { name: 'up', host: true, says: 'Leaves upward.' },
                        { name: 'down', host: true, says: 'Leaves downward.' },
                        { name: 'left', host: true, says: 'Leaves to the left.' },
                        { name: 'right', host: true, says: 'Leaves to the right.' },
                    ],
                },
                {
                    name: 'curve',
                    label: 'Curve',
                    effects: [
                        {
                            name: 'none',
                            today: true,
                            says: 'Each effect’s own: slow to start and quick to go, or a cover’s even sweep.',
                        },
                        { name: 'linear', host: true, says: 'At one speed from start to end.' },
                        {
                            name: 'ease-in-out',
                            host: true,
                            says: 'Gathers speed, then settles.',
                        },
                    ],
                },
            ],
        },
    ],
});

for (const button of document.querySelectorAll<HTMLElement>('[data-add]')) {
    button.addEventListener('click', () => {
        const target = document.querySelector(button.dataset['add'] ?? '');
        const card = document.querySelector('template#card');

        if (target !== null && card instanceof HTMLTemplateElement) {
            target.append(card.content.cloneNode(true));
        }
    });
}

/*
 * A card the page takes away, the last in its scope, the way a component that owned its removal
 * would: its exit plays first. A card cannot hold off its own removal, so a component would need
 * a way out of its own — as the dialog has one in close().
 */
for (const button of document.querySelectorAll<HTMLElement>('[data-remove]')) {
    button.addEventListener('click', () => {
        const card = [
            ...document.querySelectorAll<HTMLElement>(
                `${button.dataset['remove'] ?? ''} > ui-card:not([data-leaving])`,
            ),
        ].at(-1);

        if (card !== undefined) {
            void page.remove(card);
        }
    });
}

/**
 * `ui-card`: what the pointer, an entrance and an exit can do.
 *
 * **The pointer's effects come by kind** — where the card is, its shadow, its fill, its
 * border — and each kind is a property of its own, so a reader combines two by writing two:
 * `--ui-motion-hover-shadow: raise` beside `--ui-motion-hover-border: edge`. Two effects of
 * one kind would fight over the same thing, and one property holds one of them. Every kind
 * but the movement draws on a layer of its own, which the page renders into the shadow root
 * as the component would.
 *
 * **The card's surface is its host**, and S8 is what that costs: an effect that moves the
 * whole card is written on `:host`, which a choice made on the card itself — its type or the
 * one instance — cannot reach. Those are marked; the ones drawn on a layer reach every scope.
 * Moving the surface into the shadow root would lift the limit.
 */
import { reference } from '../../../../src/reference.js';
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

/** The query each effect is drawn under: the consumer's choice, else the theme's taste. */
const is = queries('card');

/*
 * The accent the fill takes, in both of its effects. How far it goes is what the text in the
 * card allows, and two shipped palettes allow little in the light scheme: Matrix's muted text
 * clears 4.5:1 there by 6%, and Glass's error message is at its floor over the darkest page
 * the theme takes. A plain 8% of the accent left them at 4.32 and 4.06:1. So the light mix is
 * held at a lightness of at least 0.98, and the dark one, with room there, is 15%: every
 * shipped palette's text then holds 4.5:1 on the hovered card — measured, Glass at both of
 * its page limits.
 *
 * A translucent surface takes it at 0.6 at least, laid over its own glass: at the glass's
 * opacity the light mix is white over white glass, and nothing showed.
 */
const tint = String.raw`light-dark(
    oklch(
        from color-mix(
                in oklab,
                ${reference('--ui-color-surface-raised')} 88%,
                ${reference('--ui-color-accent')}
            )
            max(l, 0.98) c h / max(alpha, 0.6)
    ),
    oklch(
        from color-mix(
                in oklab,
                ${reference('--ui-color-surface-raised')} 85%,
                ${reference('--ui-color-accent')}
            )
            l c h / max(alpha, 0.6)
    )
)`;

/*
 * The accent pushed toward the far pole from the page — darker on a light one, lighter on a
 * dark one — which every effect on the boundary draws in, so it stands apart from an edge that
 * is already the accent, as a glowing theme's is: a band in the accent itself vanished into
 * Matrix's.
 */
const far = String.raw`light-dark(
    oklch(from var(--ui-color-accent) calc(l - 0.1) c h),
    oklch(from var(--ui-color-accent) calc(l + 0.2) c h)
)`;

/**
 * Publishes where the pointer came onto the card, for the flood to spread from, and then where
 * it leaves, for the flood to drain toward. Measured once each way rather than followed, so the
 * circle's centre holds still while it grows; held to the card's box, because the first point a
 * fast pointer is seen at outside it can be a long way off.
 */
const flood = ({ host, event }: Firing): void => {
    const layer = inner(host, "[data-layer='fill']");

    if (layer === null || !(event instanceof PointerEvent)) {
        return;
    }

    const at = (point: PointerEvent): void => {
        const box = layer.getBoundingClientRect();
        const x = Math.min(Math.max(point.clientX - box.left, 0), box.width);
        const y = Math.min(Math.max(point.clientY - box.top, 0), box.height);
        layer.style.setProperty('--ui-ripple-x', `${x.toFixed(1)}px`);
        layer.style.setProperty('--ui-ripple-y', `${y.toFixed(1)}px`);
    };

    at(event);
    host.addEventListener('pointerleave', at, { once: true });
};

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

/* A layer per kind that draws, over the boundary, taking no pointer, and invisible until an
   effect gives it something. The fill and the shadow are under the content, so neither veils
   the text; the border is over it, where the content never reaches. */
[data-layer] {
    position: absolute;
    inset: -1px;
    z-index: -1;
    border-radius: inherit;
    pointer-events: none;
    opacity: 0;
}

/* Inside the boundary, which a fill would paint out. */
[data-layer='fill'] {
    inset: 0;
}

/* A band: 2px over the edge and just inside, the rest masked out. */
[data-layer='border'] {
    z-index: auto;
    padding: 2px;
    mask:
        linear-gradient(#000 0 0) content-box,
        linear-gradient(#000 0 0);
    mask-composite: exclude;
}

/* hover-move: lift, on the host.

   Every hover state here sits under hover: hover, as the button's do: a tap leaves :hover on
   whatever it touched, so a state drawn without it stays on a phone's card. */
@media (hover: hover) {
    @container ${is('hover-move', 'lift')} {
        :host(:hover) {
            translate: 0 -0.25rem;
        }
    }
}

/* hover-move: zoom, on the host: three hundredths larger. */
@media (hover: hover) {
    @container ${is('hover-move', 'zoom')} {
        :host(:hover) {
            scale: 1.03;
        }
    }
}

/* hover-move: tilt, on the host. */
@container ${is('hover-move', 'tilt')} {
    :host {
        transform: perspective(60rem)
            rotateX(calc(var(--ui-pointer-ny) * var(--ui-pointer-near) * -5deg))
            rotateY(calc(var(--ui-pointer-nx) * var(--ui-pointer-near) * 5deg));
    }
}

/* hover-move: magnetic, on the host: drawn toward the pointer as it nears, half a step at most —
   the button's magnetic, at a card's size. */
@container ${is('hover-move', 'magnetic')} {
    :host {
        translate: calc(var(--ui-pointer-nx) * var(--ui-pointer-near) * 0.5rem)
            calc(var(--ui-pointer-ny) * var(--ui-pointer-near) * 0.375rem);
    }
}

/* hover-shadow: raise. The theme's lift drawn a second time, with a drop under it, and faded
   in. Not by moving the theme's own layer: Matrix's glow is written from currentColor, and
   Chromium carried that glow through transparent for the length of the transition, so the
   card went dark and lit again on every hover — measured. An opacity has no colour to carry.

   A shadow barely shows on a dark page, which nothing is much darker than. So in the dark
   scheme the drop is near black and wider, and the boundary catches the light, brightest
   along the top. Not by lighting the card from inside, which showed most: that is the fill's
   to change, and with the tint's it took Matrix's muted text to 3.95:1 — measured. */
@container ${is('hover-shadow', 'raise')} {
    [data-layer='shadow'] {
        color: ${reference('--ui-color-accent')};
        box-shadow:
            ${reference('--ui-elevation-raised')},
            inset 0 1px 0 light-dark(transparent, rgb(255 255 255 / 0.22)),
            inset 0 0 0 1px light-dark(transparent, rgb(255 255 255 / 0.12)),
            0 0.75rem 1.75rem -0.5rem light-dark(rgb(0 0 0 / 0.35), transparent),
            0 1rem 2.5rem -0.25rem light-dark(transparent, rgb(0 0 0 / 0.9)),
            0 0.25rem 0.75rem light-dark(transparent, rgb(0 0 0 / 0.5));
        transition: opacity var(--ui-duration-200) var(--ui-easing-enter);
    }

    @media (hover: hover) {
        :host(:hover) [data-layer='shadow'] {
            opacity: 1;
        }
    }
}

/* hover-shadow: glow, a halo of the accent round the card, faded in as raise is. A halo and no
   ring: a ring at the boundary read as a border, which is another kind's to draw. */
@container ${is('hover-shadow', 'glow')} {
    [data-layer='shadow'] {
        box-shadow:
            0 0 1rem 0.125rem rgb(from var(--ui-color-accent) r g b / 0.45),
            0 0 2.5rem 0.5rem rgb(from var(--ui-color-accent) r g b / 0.25);
        transition: opacity var(--ui-duration-200) var(--ui-easing-enter);
    }

    @media (hover: hover) {
        :host(:hover) [data-layer='shadow'] {
            opacity: 1;
        }
    }
}

/* hover-shadow: cast. The pointer as a light: the shadow falls away from it, the further the
   further the pointer is from the middle, and the light spills round the side the pointer is
   on. A page shows one of the two: a light one the shadow, a dark one the light — on Matrix's
   near black a shadow showed nothing at all. The light is the accent's, and nothing in the
   light scheme, where it would be light on a light page. It reaches well past the glow a
   theme may already draw round the card, or Matrix's swallows it. */
@container ${is('hover-shadow', 'cast')} {
    [data-layer='shadow'] {
        box-shadow:
            calc(var(--ui-pointer-nx) * -1rem) calc(var(--ui-pointer-ny) * -1rem + 0.5rem) 1.75rem
                -0.25rem light-dark(rgb(0 0 0 / 0.3), rgb(0 0 0 / 0.85)),
            calc(var(--ui-pointer-nx) * 1.5rem) calc(var(--ui-pointer-ny) * 1.5rem) 3rem 0.25rem
                light-dark(transparent, rgb(from var(--ui-color-accent) r g b / 0.35));
        opacity: var(--ui-pointer-near);
    }
}

/* hover-fill: tint, the surface taking on the accent. */
@container ${is('hover-fill', 'tint')} {
    [data-layer='fill'] {
        background-color: ${tint};
        transition: opacity ${reference('--ui-duration-state')} var(--ui-easing-state);
    }

    @media (hover: hover) {
        :host(:hover) [data-layer='fill'] {
            opacity: 1;
        }
    }
}

/* hover-fill: spotlight, the same tint under the pointer only. The tint's colour rather than
   the accent's own, so the text over it holds what the tint measured. */
@container ${is('hover-fill', 'spotlight')} {
    [data-layer='fill'] {
        background: radial-gradient(
            16rem circle at var(--ui-pointer-x) var(--ui-pointer-y),
            ${tint},
            transparent 70%
        );
        opacity: var(--ui-pointer-near);
    }
}

/* hover-fill: flood. The tint spreads from where the pointer came onto the card, a circle
   growing until it covers the card, and drains toward where the pointer leaves. At 150% of the
   box's own measure the circle covers the box from any point on its edge, so a reader who asked
   for less motion gets the tint whole, at once. */
@container ${is('hover-fill', 'flood')} {
    [data-layer='fill'] {
        background-color: ${tint};
        opacity: 1;
        clip-path: circle(0 at var(--ui-ripple-x) var(--ui-ripple-y));
        transition: clip-path var(--ui-duration-400) var(--ui-easing-move);
    }

    @media (hover: hover) {
        :host(:hover) [data-layer='fill'] {
            clip-path: circle(150% at var(--ui-ripple-x) var(--ui-ripple-y));
        }
    }
}

/* hover-border: edge, the band lit where the pointer is nearest, fading over 20rem, so a
   pointer in the middle of a card still lights the side it is nearest. */
@container ${is('hover-border', 'edge')} {
    [data-layer='border'] {
        background: radial-gradient(
            20rem circle at calc(var(--ui-pointer-x) + 1px) calc(var(--ui-pointer-y) + 1px),
            ${far},
            transparent 70%
        );
        opacity: var(--ui-pointer-near);
    }
}

/* hover-border: trace. The band drawn round once, clockwise from the top, and undrawn the same
   way when the pointer leaves: a registered angle, transitioned. */
@container ${is('hover-border', 'trace')} {
    [data-layer='border'] {
        background: conic-gradient(${far} var(--ui-trace), transparent 0);
        opacity: 1;
        transition: --ui-trace calc(var(--ui-duration-400) * 1.5) var(--ui-easing-move);
    }

    @media (hover: hover) {
        :host(:hover) [data-layer='border'] {
            --ui-trace: 360deg;
        }
    }
}

/* hover-border: orbit. A comet of that colour and the info runs round the band, as the
   button's does, but for four laps and then it fades, where the button's runs for as long as
   the pointer rests: a card is read with the pointer resting on it. */
@container ${is('hover-border', 'orbit')} {
    [data-layer='border'] {
        background: conic-gradient(
            from var(--ui-orbit),
            transparent 0 55%,
            ${far} 75%,
            var(--ui-color-info) 88%,
            transparent
        );
        transition: opacity var(--ui-duration-200) var(--ui-easing-exit);
    }

    @media (hover: hover) {
        :host(:hover) [data-layer='border'] {
            opacity: 1;
            animation:
                ui-orbit var(--ui-duration-loop) linear var(--ui-iteration-settle),
                ui-rest var(--ui-duration-200) var(--ui-easing-exit)
                    calc(var(--ui-duration-loop) * var(--ui-iteration-settle)) forwards;
        }
    }
}

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
        animation: ui-enter-fade var(--ui-duration-300)
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

@container ${is('enter', 'rise')} {
    :host {
        --ui-enter-x: 0;
        --ui-enter-y: -1;
        animation: ui-enter-rise var(--ui-duration-300)
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

@container ${is('enter', 'zoom')} {
    :host {
        animation: ui-enter-zoom var(--ui-duration-300)
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

/* drop: its bounce is its curve, which a chosen one does not replace. */
@container ${is('enter', 'drop')} {
    :host {
        animation: ui-drop var(--ui-duration-400) linear backwards;
    }
}

@container ${is('enter', 'slide')} {
    :host {
        --ui-enter-x: 1;
        --ui-enter-y: 0;
        animation: ui-enter-slide var(--ui-duration-400)
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

@container ${is('enter', 'flip-vertical')} {
    :host {
        animation: ui-enter-flip-vertical var(--ui-duration-400)
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

@container ${is('enter', 'flip-horizontal')} {
    :host {
        animation: ui-enter-flip-horizontal var(--ui-duration-400)
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

@container ${is('enter', 'wipe')} {
    :host {
        --ui-enter-x: 1;
        --ui-enter-y: 0;
        animation: ui-enter-wipe var(--ui-duration-400)
            var(--ui-enter-curve, var(--ui-easing-move)) backwards;
    }
}

@container ${is('enter', 'circle')} {
    :host {
        --ui-enter-x: 0;
        --ui-enter-y: 0;
        animation: ui-enter-circle var(--ui-duration-400)
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

@container ${is('enter', 'curtain')} {
    :host {
        --ui-enter-x: 1;
        --ui-enter-y: 0;
        animation: ui-enter-curtain var(--ui-duration-400)
            var(--ui-enter-curve, var(--ui-easing-move)) backwards;
    }
}

@container ${is('enter', 'refocus')} {
    :host {
        animation: ui-enter-refocus calc(var(--ui-duration-400) * 1.25)
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
        animation: ui-exit-fade var(--ui-duration-200)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'sink')} {
    :host {
        --ui-exit-x: 0;
        --ui-exit-y: 1;
    }

    :host([data-leaving]) {
        animation: ui-exit-sink var(--ui-duration-200)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'zoom')} {
    :host([data-leaving]) {
        animation: ui-exit-zoom var(--ui-duration-200)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'slide')} {
    :host {
        --ui-exit-x: 1;
        --ui-exit-y: 0;
    }

    :host([data-leaving]) {
        animation: ui-exit-slide var(--ui-duration-300)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'flip-vertical')} {
    :host([data-leaving]) {
        animation: ui-exit-flip-vertical var(--ui-duration-300)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'flip-horizontal')} {
    :host([data-leaving]) {
        animation: ui-exit-flip-horizontal var(--ui-duration-300)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'wipe')} {
    :host {
        --ui-exit-x: 1;
        --ui-exit-y: 0;
    }

    :host([data-leaving]) {
        animation: ui-exit-wipe var(--ui-duration-300)
            var(--ui-exit-curve, var(--ui-easing-move)) forwards;
    }
}

@container ${is('exit', 'circle')} {
    :host {
        --ui-exit-x: 0;
        --ui-exit-y: 0;
    }

    :host([data-leaving]) {
        animation: ui-exit-circle var(--ui-duration-300)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'curtain')} {
    :host {
        --ui-exit-x: 1;
        --ui-exit-y: 0;
    }

    :host([data-leaving]) {
        animation: ui-exit-curtain var(--ui-duration-300)
            var(--ui-exit-curve, var(--ui-easing-move)) forwards;
    }
}

@container ${is('exit', 'defocus')} {
    :host([data-leaving]) {
        animation: ui-exit-defocus calc(var(--ui-duration-300) * 1.25)
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

@keyframes ui-rest {
    to {
        opacity: 0;
    }
}
`;

const page = prototype({
    tags: ['ui-card'],
    sheet,
    layers: ['fill', 'shadow', 'border'],
    moments: [
        {
            name: 'hover',
            label: 'Pointer over',
            on: 'enter',
            kinds: [
                {
                    name: 'move',
                    label: 'Movement',
                    effects: [
                        { name: 'none', today: true, says: 'Stays where it is.' },
                        { name: 'lift', host: true, says: 'Rises a quarter of a step.' },
                        { name: 'zoom', host: true, says: 'Grows a little, as if it came closer.' },
                        {
                            name: 'tilt',
                            follows: true,
                            host: true,
                            says: 'Leans toward the pointer, a few degrees.',
                        },
                        {
                            name: 'magnetic',
                            follows: true,
                            host: true,
                            says: 'Drawn toward the pointer as it nears, half a step at most.',
                        },
                    ],
                },
                {
                    name: 'shadow',
                    label: 'Shadow',
                    effects: [
                        { name: 'none', today: true, says: 'The theme’s own shadow or glow.' },
                        {
                            name: 'raise',
                            says: 'The shadow or glow deepens, with a drop under it, as if the card came forward; on a dark page, where a shadow barely shows, its edge also catches the light.',
                        },
                        { name: 'glow', says: 'A halo of the accent round the card.' },
                        {
                            name: 'cast',
                            follows: true,
                            says: 'The pointer as a light: the shadow falls away from it, and on a dark page, where a shadow barely shows, the light spills round the side the pointer is on.',
                        },
                    ],
                },
                {
                    name: 'fill',
                    label: 'Fill',
                    effects: [
                        { name: 'none', today: true, says: 'The surface’s own colour.' },
                        { name: 'tint', says: 'The surface takes a little of the accent.' },
                        {
                            name: 'spotlight',
                            follows: true,
                            says: 'The same tint, under the pointer.',
                        },
                        {
                            name: 'flood',
                            fire: flood,
                            says: 'The tint spreads from where the pointer came in, and drains toward where it leaves.',
                        },
                    ],
                },
                {
                    name: 'border',
                    label: 'Border',
                    effects: [
                        { name: 'none', today: true, says: 'The boundary the theme draws.' },
                        {
                            name: 'edge',
                            follows: true,
                            says: 'A band of the boundary lights up where the pointer is nearest.',
                        },
                        {
                            name: 'trace',
                            says: 'The boundary is drawn round once, from the top, and undrawn as the pointer leaves.',
                        },
                        {
                            name: 'orbit',
                            settles: true,
                            says: 'A light runs round the boundary, four times, then rests.',
                        },
                    ],
                },
            ],
        },
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
    refused: [
        {
            name: 'flip, under the pointer',
            why: 'turns the content away from the reader for half its run, and a card’s content is what is being read: the entrance has it, before there is anything to read.',
        },
        {
            name: 'turning border',
            why: 'a light that keeps circling for as long as the pointer rests is motion with no end, and a card is read with the pointer resting on it: orbit runs four laps and rests.',
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

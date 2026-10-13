/**
 * `ui-button`: what a press, the pointer and focus can each do.
 *
 * **Every moment comes by kind** — where the button is, its fill, its shadow, its border — and
 * each kind is a property of its own, `--ui-motion-<moment>-<kind>`, so one press can squash
 * the button, spread a ripple, burst a glow and throw a ring at once. Each kind draws on an
 * element of its own, because one element has one animation list, and two effects animating
 * it would leave one of them unplayed: the movement on the `<button>`, the fill on its
 * `::after` put under the label, the shadow on its `::before`, where a theme draws its glow —
 * and its burst and its raise on the host's `::before`, under the button, its sink on the button
 * itself and its particles in the top layer — and the border on the host's `::after`.
 *
 * The sheet is what the component would carry. Every effect sits under the style query for its
 * kind, inside the shadow root, and none on the host itself, which S8 found a choice made on
 * the host cannot reach; the host's `::after`, which S8 found it can, carries the border.
 */
import { reference } from '../../../../src/reference.js';
import {
    attributes,
    duration,
    easing,
    inner,
    prototype,
    queries,
    replay,
    still,
    type Firing,
} from '../motion.js';

/** The query each effect is drawn under: the consumer's choice, else the theme's taste. */
const is = queries('button');

/** The kind a fired effect is of, which names the attribute it marks its element by. */
type Mark = 'move' | 'fill' | 'shadow' | 'border';

/** Plays one fired effect, on the button inside the shadow root or, for one drawn on the
 *  host's own layers, on the host. */
const play =
    (name: string, mark: Mark, on: 'button' | 'host' = mark === 'border' ? 'host' : 'button') =>
    ({ host }: { host: HTMLElement }): void => {
        const target = on === 'host' ? host : inner(host, 'button');

        if (target !== null) {
            replay(target, name, `data-${mark}`);
        }
    };

/**
 * Spreads the ripple from where the pointer came onto the button — going down for a press,
 * arriving for a hover — or from the centre for a key.
 */
const ripple = ({ host, event }: Firing): void => {
    const target = inner(host, 'button');

    if (target === null) {
        return;
    }

    const box = target.getBoundingClientRect();
    const pointer =
        event instanceof PointerEvent &&
        (event.type === 'pointerdown' || event.type === 'pointerenter');
    const x = pointer ? event.clientX - box.left : box.width / 2;
    const y = pointer ? event.clientY - box.top : box.height / 2;
    const reach = Math.hypot(Math.max(x, box.width - x), Math.max(y, box.height - y));

    target.style.setProperty('--ui-ripple-x', `${x.toFixed(1)}px`);
    target.style.setProperty('--ui-ripple-y', `${y.toFixed(1)}px`);
    target.style.setProperty('--ui-ripple-reach', `${reach.toFixed(1)}px`);
    replay(target, 'ripple', 'data-fill');
};

/**
 * Throws a circle out from under the button, publishing first where it starts and how far it
 * goes: from half the button's height, under it, to past its farthest corner by half as far again
 * as the explode's ring flies. A circle's reach is in proportion to the button, and only a
 * measurement has the button's size.
 */
const wave =
    (name: 'shockwave' | 'bloom') =>
    ({ host }: { host: HTMLElement }): void => {
        const target = inner(host, 'button');

        if (target === null) {
            return;
        }

        const corner = Math.hypot(target.offsetWidth, target.offsetHeight) / 2;
        host.style.setProperty('--ui-wave-from', `${(target.offsetHeight / 2).toFixed(1)}px`);
        host.style.setProperty('--ui-wave-to', `calc(${corner.toFixed(1)}px + 4.5rem)`);
        replay(host, name, 'data-border');
    };

/**
 * Publishes where the pointer came onto the button, for the flood to spread from, and then where
 * it leaves, for the flood to drain toward: the card's, held to the button's box.
 */
const flood = ({ host, event }: Firing): void => {
    const target = inner(host, 'button');

    if (target === null || !(event instanceof PointerEvent)) {
        return;
    }

    const at = (point: PointerEvent): void => {
        const box = target.getBoundingClientRect();
        const x = Math.min(Math.max(point.clientX - box.left, 0), box.width);
        const y = Math.min(Math.max(point.clientY - box.top, 0), box.height);
        target.style.setProperty('--ui-ripple-x', `${x.toFixed(1)}px`);
        target.style.setProperty('--ui-ripple-y', `${y.toFixed(1)}px`);
    };

    at(event);
    host.addEventListener('pointerleave', at, { once: true });
};

/** One particle a press throws: its element, set at the button's middle, and its flight. */
interface Particle {
    readonly element: HTMLElement;
    readonly keyframes: Keyframe[];
    readonly options: KeyframeAnimationOptions;
}

/** Makes the particle at that place in the count, for a button of that box, given the duration
 *  token's longest step, in milliseconds. */
type Make = (index: number, box: DOMRect, length: number) => Particle;

/**
 * Throws particles out from the button, the reference's emitter: in the top layer, as the pieces
 * are, which the page is never made wider to hold, so a burst at the viewport's edge adds no
 * scroll. Each effect makes its own, at the button's middle, on a length the duration token
 * gives. For a reader who asked for less motion there are none.
 */
const emit =
    (count: number, make: Make) =>
    ({ host }: Firing): void => {
        const target = inner(host, 'button');

        if (target === null || still()) {
            return;
        }

        const box = target.getBoundingClientRect();
        const length = duration(host, '--ui-duration-400');
        const flock = document.createElement('div');
        flock.dataset['particles'] = '';
        flock.popover = 'manual';
        flock.inert = true;
        flock.setAttribute('aria-hidden', 'true');
        // The top layer's own box undone, centred on the button.
        flock.style.cssText = `position: fixed; inset: auto; left: ${String(box.left + box.width / 2)}px; top: ${String(box.top + box.height / 2)}px; width: 0; height: 0; margin: 0; padding: 0; border: 0; background: none; overflow: visible; pointer-events: none;`;

        const animations = Array.from({ length: count }, (_, index) => {
            const { element, keyframes, options } = make(index, box, length);
            flock.append(element);

            return element.animate(keyframes, options);
        });

        host.after(flock);
        flock.showPopover();
        void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
            flock.remove();
        });
    };

/** A number anywhere between the two. */
const between = (from: number, to: number): number => from + Math.random() * (to - from);

/** Where a particle leaves the button a turn round from its right: on the ellipse the box
 *  holds, not at its middle, and the way out from the middle there. */
const leaving = (
    box: DOMRect,
    turn: number,
): { readonly x: number; readonly y: number; readonly across: number; readonly down: number } => ({
    x: (Math.cos(turn) * box.width) / 2,
    y: (Math.sin(turn) * box.height) / 2,
    across: Math.cos(turn),
    down: Math.sin(turn),
});

/**
 * How far a thing thrown at that speed has gone after that long, in pixels and seconds, through
 * air that slows it toward the speed it settles to, by that much a second: falling, the pull
 * down and the air come to a speed they hold. The speed is v∞ + (v₀ − v∞)e^(−kt), so the way
 * gone is v∞t + (v₀ − v∞)(1 − e^(−kt))/k.
 */
const gone = (speed: number, settles: number, drag: number, time: number): number =>
    settles * time + ((speed - settles) * (1 - Math.exp(-drag * time))) / drag;

/** A colour of the theme's, by its name, for a particle to be cut from. */
const tone = (name: string): string => `var(--ui-color-${name})`;

/**
 * sparks: sixteen points of the accent and the info leave the edge all round, each its own way
 * and distance, shrinking and fading.
 */
const sparks = emit(16, (index, box, length) => {
    const { x, y, across, down } = leaving(box, ((index + between(0, 0.6)) / 16) * 2 * Math.PI);
    const reach = between(20, 56);
    const size = between(4, 8);
    const colour = tone(index % 3 === 0 ? 'info' : 'accent');
    const element = document.createElement('span');
    element.style.cssText = `position: absolute; left: ${String(-size / 2)}px; top: ${String(-size / 2)}px; width: ${String(size)}px; height: ${String(size)}px; border-radius: 50%; background: ${colour}; box-shadow: 0 0 6px 1px ${colour};`;

    return {
        element,
        keyframes: [
            { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(1)`, opacity: 1 },
            // Lit for the first half of the way: fading from the start, a spark was a speck by
            // the time it had left the edge.
            { opacity: 1, offset: 0.5 },
            {
                transform: `translate(${(x + across * reach).toFixed(1)}px, ${(y + down * reach).toFixed(1)}px) scale(0.3)`,
                opacity: 0,
            },
        ],
        options: {
            duration: length * 1.25 * between(0.7, 1),
            easing: 'cubic-bezier(0.15, 0.6, 0.3, 1)',
            fill: 'forwards',
        },
    };
});

/**
 * beams: the sparks as lasers. A dozen rays of the accent and the info shoot out from the edge
 * all round, along the way out from the button's middle: each runs out at once to its full
 * reach, past where the sparks go, its tail still on the edge, and then its tail runs after its
 * head and it is gone. A ray fades in from its tail, and is lit by a glow drawn close to it.
 */
const beams = emit(12, (index, box, length) => {
    const turn = ((index + between(0.2, 0.8)) / 12) * 2 * Math.PI;
    const { x, y } = leaving(box, turn);
    const reach = between(50, 90);
    const colour = tone(index % 3 === 0 ? 'info' : 'accent');
    const element = document.createElement('span');
    // Drawn from its tail, its left end, which is where it turns about.
    element.style.cssText = `position: absolute; left: 0; top: -1px; width: ${String(reach)}px; height: 2px; border-radius: 1px; background: linear-gradient(to right, transparent, ${colour} 40%); box-shadow: 0 0 4px ${colour}; transform-origin: 0 50%;`;
    // From its tail to its head, in pixels out from the edge.
    const ray = (tail: number, head: number): string =>
        `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${((turn * 180) / Math.PI).toFixed(1)}deg) translateX(${tail.toFixed(1)}px) scaleX(${Math.max((head - tail) / reach, 0.01).toFixed(3)})`;

    return {
        element,
        keyframes: [
            { transform: ray(0, 0), opacity: 1 },
            { transform: ray(0, reach), offset: 0.3 },
            { opacity: 1, offset: 0.5 },
            { transform: ray(reach, reach), opacity: 0 },
        ],
        options: {
            duration: length * between(0.7, 0.9),
            easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)',
            fill: 'forwards',
        },
    };
});

/** The theme's colours confetti is cut from. */
const palette = ['accent', 'info', 'success', 'warning', 'danger'] as const;

/** Confetti's cuts: a strip, a square, a disc and a triangle. */
const cuts = [
    'border-radius: 1px;',
    '',
    'border-radius: 50%;',
    'clip-path: polygon(50% 0, 100% 100%, 0 100%);',
] as const;

/**
 * confetti: two dozen scraps in the theme's colours — the accent, the info, the success, the
 * warning and the danger — burst up from the top of the button, slow in the air, and flutter
 * down past it, turning and flipping over as they fall, and fade. A strip is longer than it is
 * wide; the other cuts are as wide as they are long.
 */
const confetti = emit(24, (index, box, length) => {
    const cut = Math.floor(Math.random() * cuts.length);
    const width = cut === 0 ? between(7, 11) : between(5, 8);
    const height = cut === 0 ? between(3, 4.5) : width;
    const element = document.createElement('span');
    element.style.cssText = `position: absolute; left: ${String(-width / 2)}px; top: ${String(-height / 2)}px; width: ${String(width)}px; height: ${String(height)}px; background: ${tone(palette[index % palette.length] ?? 'accent')}; ${cuts[cut] ?? ''}`;
    // Up from the top of the button, within half a right angle either way of straight up.
    const start = [between(-0.4, 0.4) * box.width, between(-0.5, -0.2) * box.height] as const;
    const angle = -Math.PI / 2 + between(-0.8, 0.8);
    const speed = between(260, 420);
    const seconds = (length / 1000) * 2.4 * between(0.85, 1.15);
    const spin = between(-540, 540);
    const flips = between(1.5, 3.5) * (Math.random() < 0.5 ? -1 : 1);
    const sway = between(4, 9);
    const sways = between(2, 3.5);
    const phase = between(0, 2 * Math.PI);
    const steps = 12;

    return {
        element,
        keyframes: Array.from({ length: steps + 1 }, (_, step) => {
            const at = step / steps;
            const time = at * seconds;
            // A flutter from side to side, which grows as the scrap slows.
            const flutter =
                sway * Math.sin(2 * Math.PI * sways * time + phase) * Math.min(time * 4, 1);
            const across = start[0] + gone(Math.cos(angle) * speed, 0, 3, time) + flutter;
            const down = start[1] + gone(Math.sin(angle) * speed, 200, 3, time);

            return {
                transform: `translate(${across.toFixed(1)}px, ${down.toFixed(1)}px) rotate(${(spin * time).toFixed(1)}deg) rotateX(${(flips * 360 * time).toFixed(1)}deg)`,
                opacity: at <= 0.75 ? 1 : (1 - at) / 0.25,
            };
        }),
        options: { duration: seconds * 1000, easing: 'linear', fill: 'forwards' },
    };
});

/** A fragment's outline: three to six corners round its middle, each its own way and distance
 *  from it, so no two are cut alike. */
const jagged = (): string => {
    const corners = 3 + Math.floor(Math.random() * 4);
    const start = Math.random() * 2 * Math.PI;
    const points = Array.from({ length: corners }, (_, corner) => {
        const turn = start + ((corner + between(-0.3, 0.3)) / corners) * 2 * Math.PI;
        const far = between(28, 50);

        return `${(50 + far * Math.cos(turn)).toFixed(1)}% ${(50 + far * Math.sin(turn)).toFixed(1)}%`;
    });

    return `polygon(${points.join(', ')})`;
};

/**
 * fragments: eighteen chips of the theme's colour, the accent, of every shape and size, fly off
 * the edge all round, spinning, and slow in the air as they fade, each going straight on its way
 * with nothing to pull it down. Each is a little lighter or darker than the accent, so chips
 * that cross are told apart.
 */
const fragments = emit(18, (index, box, length) => {
    const { x, y, across, down } = leaving(box, ((index + between(0, 0.8)) / 18) * 2 * Math.PI);
    const size = between(4, 12);
    const speed = between(140, 300);
    const seconds = (length / 1000) * 1.5 * between(0.8, 1.15);
    const spin = between(-720, 720);
    const element = document.createElement('span');
    element.style.cssText = `position: absolute; left: ${String(-size / 2)}px; top: ${String(-size / 2)}px; width: ${String(size)}px; height: ${String(size)}px; background: oklch(from ${tone('accent')} calc(l + ${between(-0.08, 0.08).toFixed(3)}) c h); clip-path: ${jagged()};`;
    const steps = 10;

    return {
        element,
        keyframes: Array.from({ length: steps + 1 }, (_, step) => {
            const at = step / steps;
            const time = at * seconds;
            const out = gone(speed, 0, 3, time);

            return {
                transform: `translate(${(x + across * out).toFixed(1)}px, ${(y + down * out).toFixed(1)}px) rotate(${(spin * time).toFixed(1)}deg)`,
                opacity: at <= 0.6 ? 1 : (1 - at) / 0.4,
            };
        }),
        options: { duration: seconds * 1000, easing: 'linear', fill: 'forwards' },
    };
});

/** The colour a band of the border is drawn in: the card's, the accent a step from the page. */
const far = String.raw`light-dark(
    oklch(from var(--ui-color-accent) calc(l - 0.1) c h),
    oklch(from var(--ui-color-accent) calc(l + 0.2) c h)
)`;

/** The flood's circle, from where the pointer came in, as far as its registered progress. */
const flooded = String.raw`radial-gradient(
    circle farthest-corner at var(--ui-ripple-x) var(--ui-ripple-y),
    var(--ui-flood-ink) calc(var(--ui-flood) * 101% - 1px),
    transparent calc(var(--ui-flood) * 101%)
)`;

/**
 * Turns the button in from edge-on, publishing its size first: how deep the turn reads is in
 * proportion to the side it turns, and only a measurement has that side.
 */
const flip =
    (name: string) =>
    ({ host }: { host: HTMLElement }): void => {
        const target = inner(host, 'button');

        if (target !== null) {
            target.style.setProperty('--ui-flip-width', `${String(target.offsetWidth)}px`);
            target.style.setProperty('--ui-flip-height', `${String(target.offsetHeight)}px`);
            replay(target, name, 'data-move');
        }
    };

/** The reference's spring, which a press lets go on: a linear() curve, which passes its end and
 *  comes back as no cubic-bezier can, settled by four fifths of the way. */
const spring =
    'linear(0, 0.38 8%, 0.83 17%, 1.06 24%, 1.13 30%, 1.08 39%, 0.99 51%, 0.97 62%, 1 82%, 1)';

/** One piece of a button held in pieces: its cell, in pixels from the button's top-left
 *  corner, and how far from it the piece is held. */
interface Shard {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
    readonly dx: number;
    readonly dy: number;
}

/** How a press cuts a button of that size, struck at that point. */
type Cut = (width: number, height: number, x: number, y: number) => Shard[];

/** How far a crack holds its two sides apart, in pixels. */
const gap = 2;

/**
 * Many pieces, smallest where the button was struck: the cell that is largest for how near the
 * point it lies is cut across its longer side, somewhere in its middle, until there are a dozen
 * or so. Across each cut, the side the point is not on is pushed off by the gap and slid along
 * the crack a pixel or none, so every crack opens as far, the piece that was struck stays where
 * it is, and the furthest from it have gone the furthest.
 */
const shards: Cut = (width, height, x, y) => {
    const count = Math.min(16, Math.max(8, Math.round((width * height) / 350)));
    const cells: Shard[] = [{ left: 0, top: 0, width, height, dx: 0, dy: 0 }];
    // A cell's area, less the further its middle lies from the point; none for a cell too small
    // to cut again.
    const claim = (cell: Shard): number =>
        Math.max(cell.width, cell.height) < 18
            ? 0
            : (cell.width * cell.height) /
              (1 +
                  Math.hypot(cell.left + cell.width / 2 - x, cell.top + cell.height / 2 - y) /
                      height) **
                  2;

    while (cells.length < count) {
        const cell = cells.reduce((best, next) => (claim(next) > claim(best) ? next : best));

        if (claim(cell) === 0) {
            break;
        }

        const across = cell.width > cell.height * 1.25;
        const cut = Math.round((across ? cell.width : cell.height) * (0.3 + Math.random() * 0.4));
        const first: Shard = across ? { ...cell, width: cut } : { ...cell, height: cut };
        const second: Shard = across
            ? { ...cell, left: cell.left + cut, width: cell.width - cut }
            : { ...cell, top: cell.top + cut, height: cell.height - cut };
        // The point on the second's side of the cut, or past it: the first is pushed off.
        const beyond = across ? x >= cell.left + cut : y >= cell.top + cut;
        const moved = beyond ? first : second;
        const away = beyond ? -gap : gap;
        const slide = Math.round((Math.random() - 0.5) * gap);
        const pushed: Shard = {
            ...moved,
            dx: moved.dx + (across ? away : slide),
            dy: moved.dy + (across ? slide : away),
        };
        cells.splice(cells.indexOf(cell), 1, beyond ? pushed : first, beyond ? second : pushed);
    }

    return cells;
};

/**
 * Two pieces, cut top to bottom where the button was struck, but no nearer an end than a
 * quarter of the way, since a sliver is no half. Each is held off by the gap and slid by half of
 * it, one up and the other down, as something snapped is.
 */
const halves: Cut = (width, height, x) => {
    const cut = Math.round(Math.min(Math.max(x, width * 0.25), width * 0.75));
    const tilt = Math.random() < 0.5 ? -1 : 1;

    return [
        { left: 0, top: 0, width: cut, height, dx: -gap, dy: (tilt * gap) / 2 },
        { left: cut, top: 0, width: width - cut, height, dx: gap, dy: (-tilt * gap) / 2 },
    ];
};

/** A button held in pieces: parts them, from wherever they are, or puts them back. */
interface Broken {
    readonly part: () => void;
    readonly mend: () => void;
}

/** The buttons in pieces now. */
const broken = new WeakMap<HTMLElement, Broken>();

/** How many breaks have run, which names each one's filter. */
let breaks = 0;

/**
 * Cuts the button where it is and holds the pieces apart: the dissolve's way rather than the
 * pieces', with no copy, one filter over the button as it is drawn, which takes each piece's
 * cell of it and moves that alone. So the pieces are the button as it goes on changing while it
 * is held — the pressed colour, a sink, a ripple — and through the cracks shows whatever is under
 * it. The filter goes in the button's own tree, as the dissolve's does.
 *
 * **It counts in the button's own pixels, from the corner of its border box.** In fractions it
 * would count in a box that takes in whatever the button draws past its edge, in all three
 * engines — measured — so Matrix's glow, wider than the button, moved every cut with it. In
 * pixels, WebKit counts from the page's corner on an element with no transform and from the
 * element's own once it has one, as the other two always do — measured — so the button takes a
 * turn of nothing while it is in pieces; no effect here turns it by `rotate`.
 *
 * **Only what the button draws solid breaks.** Where it draws more than half opaque — its fill,
 * its label, its edge, a ring — goes with the pieces, an outer piece reaching to the filter's
 * edge so a ring there goes with it; what it draws fainter, a theme's glow, stays whole where it
 * is, under them. Cut with the pieces, the glow showed every crack running on across Matrix's
 * halo as a line through the page; cut off at a box round the button, it showed the box — both
 * measured.
 *
 * **The pieces part at once**, as the squish and the pressed colour press in, so a quick click
 * shows them apart: on the enter curve, a click of 80ms had moved them a pixel or so by the time
 * it let go, and not at all for most of it — measured. They go back on the move curve, which
 * does not pass its end: on the emphasis, which does, and on the spring they first parted on,
 * the pieces settled a pixel either way of where they came to rest, and the cracks flickered as
 * they did — measured. Every piece is held on a device pixel, so its edge is cut where its
 * content is drawn. The host is marked for as long as the pieces are apart, for the layers drawn
 * on it to step aside.
 */
function crack(host: HTMLElement, target: HTMLElement, cut: Cut, event: Event): Broken {
    // Its border box, which a button's computed size is in all three engines — measured — and
    // which no transform reaches.
    const style = getComputedStyle(target);
    const width = Number.parseFloat(style.width);
    const height = Number.parseFloat(style.height);
    const box = target.getBoundingClientRect();
    const pointer = event instanceof PointerEvent && event.type === 'pointerdown';
    // Struck where the pointer went down, or in the middle for a key.
    const x = pointer ? ((event.clientX - box.left) / box.width) * width : width / 2;
    const y = pointer ? ((event.clientY - box.top) / box.height) * height : height / 2;
    const plan = cut(width, height, x, y);
    // The filter takes in 4rem round the button, past the widest glow drawn here — the neon's,
    // 40px of blur on a 10px spread — since nothing outside it is drawn at all; and room for the
    // furthest piece.
    const room =
        4 * Number.parseFloat(getComputedStyle(document.documentElement).fontSize) +
        Math.max(...plan.map((shard) => Math.max(Math.abs(shard.dx), Math.abs(shard.dy))));

    breaks += 1;
    const id = `ui-break-${String(breaks)}`;
    const svg = 'http://www.w3.org/2000/svg';
    const holder = document.createElementNS(svg, 'svg');
    attributes(holder, {
        'aria-hidden': 'true',
        style: 'position: absolute; width: 0; height: 0;',
    });
    const filter = document.createElementNS(svg, 'filter');
    attributes(filter, {
        id,
        filterUnits: 'userSpaceOnUse',
        primitiveUnits: 'userSpaceOnUse',
        x: String(-room),
        y: String(-room),
        width: String(width + 2 * room),
        height: String(height + 2 * room),
        'color-interpolation-filters': 'sRGB',
    });
    // Where the button draws more than half solid, cut sharp: what it draws there goes with the
    // pieces, and what it draws fainter, its glow, stays where it is.
    const solid = document.createElementNS(svg, 'feComponentTransfer');
    attributes(solid, { in: 'SourceAlpha', result: 'solid' });
    const threshold = document.createElementNS(svg, 'feFuncA');
    attributes(threshold, { type: 'discrete', tableValues: '0 1' });
    solid.append(threshold);
    const core = document.createElementNS(svg, 'feComposite');
    attributes(core, { in: 'SourceGraphic', in2: 'solid', operator: 'in', result: 'core' });
    const halo = document.createElementNS(svg, 'feComposite');
    attributes(halo, { in: 'SourceGraphic', in2: 'solid', operator: 'out', result: 'halo' });
    const merge = document.createElementNS(svg, 'feMerge');
    const under = document.createElementNS(svg, 'feMergeNode');
    under.setAttribute('in', 'halo');
    merge.append(under);
    const pieces = plan.map((shard, index) => {
        const left = shard.left < 0.5 ? -room : shard.left;
        const top = shard.top < 0.5 ? -room : shard.top;
        const right =
            shard.left + shard.width > width - 0.5 ? width + room : shard.left + shard.width;
        const bottom =
            shard.top + shard.height > height - 0.5 ? height + room : shard.top + shard.height;
        // Its cell of the button, moved: the offset's own region is where the cell lands.
        const offset = document.createElementNS(svg, 'feOffset');
        attributes(offset, {
            in: 'core',
            result: `piece-${String(index)}`,
            width: String(right - left),
            height: String(bottom - top),
        });
        const node = document.createElementNS(svg, 'feMergeNode');
        node.setAttribute('in', `piece-${String(index)}`);
        merge.append(node);

        return { offset, left, top, dx: shard.dx, dy: shard.dy };
    });
    filter.append(solid, core, halo, ...pieces.map((piece) => piece.offset), merge);
    holder.append(filter);

    /** How far apart the pieces are: together at 0, where they are held at 1. */
    const place = (amount: number): void => {
        for (const { offset, left, top, dx, dy } of pieces) {
            const across = Math.round(dx * amount * devicePixelRatio) / devicePixelRatio;
            const down = Math.round(dy * amount * devicePixelRatio) / devicePixelRatio;
            attributes(offset, {
                dx: String(across),
                dy: String(down),
                x: String(left + across),
                y: String(top + down),
            });
        }
    };

    place(0);
    const tree = target.getRootNode();
    (tree instanceof ShadowRoot ? tree : document.body).append(holder);
    target.style.filter = `url(#${id})`;
    target.style.rotate = '0deg';
    host.setAttribute('data-broken', '');

    let amount = 0;
    let running: Animation | undefined;
    let frame = 0;

    // An animation with no target brings the duration token and the curve, and a frame
    // callback copies its progress into the filter, as the dissolve's does.
    const go = (to: number, length: number, curve: string): Promise<boolean> => {
        running?.cancel();
        cancelAnimationFrame(frame);
        const from = amount;
        const animation = new Animation(
            new KeyframeEffect(null, null, { duration: length, easing: curve, fill: 'forwards' }),
        );
        const step = (): void => {
            amount = from + (to - from) * (animation.effect?.getComputedTiming().progress ?? 0);
            place(amount);

            if (animation.playState === 'running') {
                frame = requestAnimationFrame(step);
            }
        };

        running = animation;
        animation.play();
        frame = requestAnimationFrame(step);

        return animation.finished.then(
            () => {
                cancelAnimationFrame(frame);
                amount = to;
                place(to);

                return true;
            },
            // Cancelled by the next, which goes on from wherever this one had got to.
            () => false,
        );
    };

    const whole = (): void => {
        cancelAnimationFrame(frame);
        target.style.removeProperty('filter');
        target.style.removeProperty('rotate');
        holder.remove();
        host.removeAttribute('data-broken');
        broken.delete(target);
    };

    const pieced: Broken = {
        part: () => {
            running?.cancel();
            cancelAnimationFrame(frame);
            amount = 1;
            place(amount);
        },
        mend: () => {
            void go(0, duration(host, '--ui-duration-200'), easing(host, '--ui-easing-move')).then(
                (together) => {
                    if (together) {
                        whole();
                    }
                },
            );
        },
    };
    broken.set(target, pieced);

    return pieced;
}

/**
 * Breaks the button where it was pressed and holds it in pieces until it is let go. Fired,
 * because a sheet cannot cut an element; and holding, which no other fired effect does, so it
 * listens for the end of the press that fired it: the pointer's release or its cancel, or Space
 * coming up or the focus leaving. Enter's press arrives as its click, with nothing to hold, so
 * for Enter the pieces part and go back at once. A press while the pieces are going back parts
 * them again from where they are. For a reader who asked for less motion nothing breaks.
 */
const shatter =
    (cut: Cut) =>
    ({ host, event }: Firing): void => {
        const target = inner(host, 'button');

        if (target === null || still()) {
            return;
        }

        const pieces = broken.get(target) ?? crack(host, target, cut, event);
        pieces.part();

        if (event instanceof PointerEvent && event.type === 'pointerdown') {
            const { pointerId } = event;
            const done = new AbortController();
            const release = (next: PointerEvent): void => {
                if (next.pointerId === pointerId) {
                    done.abort();
                    pieces.mend();
                }
            };

            window.addEventListener('pointerup', release, { capture: true, signal: done.signal });
            window.addEventListener('pointercancel', release, {
                capture: true,
                signal: done.signal,
            });
        } else if (event instanceof KeyboardEvent) {
            const done = new AbortController();
            const release = (): void => {
                done.abort();
                pieces.mend();
            };

            window.addEventListener(
                'keyup',
                (up) => {
                    if (up.key === ' ') {
                        release();
                    }
                },
                { capture: true, signal: done.signal },
            );
            target.addEventListener('blur', release, { signal: done.signal });
        } else {
            pieces.mend();
        }
    };

/** The ripple's circle, in the label's colour, at how far it has spread. */
const circle = String.raw`radial-gradient(
    circle at var(--ui-ripple-x) var(--ui-ripple-y),
    rgb(from var(--ui-ink) r g b / var(--ui-ripple-alpha))
        calc(var(--ui-ripple-progress) * var(--ui-ripple-reach)),
    transparent calc(var(--ui-ripple-progress) * var(--ui-ripple-reach) + 1px)
)`;

/** The breathe's own light, in the layer's colour, as strong as its registered progress. */
const breath = String.raw`0 0 calc(var(--ui-breath) * 15px) rgb(from currentColor r g b / var(--ui-breath))`;

/** The light under the pointer, in the label's colour, fading with distance. */
const spot = String.raw`radial-gradient(
    circle 4rem at var(--ui-pointer-x) var(--ui-pointer-y),
    rgb(from var(--ui-ink) r g b / calc(var(--ui-pointer-near) * 0.24)),
    transparent
)`;

/** The pointer's borders that hold the edge's layer while the pointer rests on the button. */
const pointerBorder = `(${is('hover-border', 'edge')} or ${is('hover-border', 'orbit')} or ${is('hover-border', 'trace')} or ${is('hover-border', 'comet')})`;

/** The pointer's fills that hold the fill's layer while the pointer rests on the button. */
const pointerFill = `(${is('hover-fill', 'spotlight')} or ${is('hover-fill', 'flood')} or ${is('hover-fill', 'shimmer')})`;

/** The focus's orbit, on the edge's band: the card's comet on the edge, inside the focus ring,
 *  four laps, then it fades. */
const focusOrbit = String.raw`
        content: '';
        position: absolute;
        inset: -2px;
        padding: 3px;
        border-radius: calc(var(--ui-radius) + 2px);
        background: conic-gradient(
            from var(--ui-orbit),
            transparent 0 55%,
            ${far} 75%,
            var(--ui-color-info) 88%,
            transparent
        );
        mask:
            linear-gradient(#000 0 0) content-box exclude,
            linear-gradient(#000 0 0);
        pointer-events: none;
        opacity: 1;
        animation:
            ui-orbit var(--ui-duration-loop) linear var(--ui-iteration-settle),
            ui-rest var(--ui-duration-200) var(--ui-easing-exit)
                calc(var(--ui-duration-loop) * var(--ui-iteration-settle)) forwards;`;

/** The focus's comet, outside the focus ring and 2px clear of it, four laps, then it fades. */
const focusComet = String.raw`
        content: '';
        position: absolute;
        inset: -9px;
        padding: 3px;
        border-radius: calc(var(--ui-radius) + 9px);
        background: conic-gradient(
            from var(--ui-orbit),
            transparent 0 55%,
            var(--ui-color-accent) 75%,
            var(--ui-color-info) 88%,
            transparent
        );
        mask:
            linear-gradient(#000 0 0) content-box exclude,
            linear-gradient(#000 0 0);
        pointer-events: none;
        opacity: 1;
        animation:
            ui-orbit var(--ui-duration-loop) linear var(--ui-iteration-settle),
            ui-rest var(--ui-duration-200) var(--ui-easing-exit)
                calc(var(--ui-duration-loop) * var(--ui-iteration-settle)) forwards;`;

/** The focus's sheen, swept across four times, then at rest past the button's edge. */
const focusShimmer = String.raw`
        background-image: linear-gradient(100deg, transparent 35%, var(--ui-sheen) 50%, transparent 65%);
        background-size: 250% 100%;
        background-repeat: no-repeat;
        animation: ui-shimmer var(--ui-duration-loop) linear var(--ui-iteration-settle);`;

const sheet = String.raw`
/* Every property the movement moves, transitioned once. Nothing here moves until an effect
   asks it to, so with no choice the button does what it does today. The transform's short
   linear step only smooths the tilt between the pointer engine's frames.

   Isolated, so the fill's layer can sit under the label and still over the button's own fill. */
button {
    isolation: isolate;
    transition-property: background-color, scale, translate, transform;
    transition-duration: ${reference('--ui-duration-state')}, var(--ui-duration-200), var(--ui-duration-200), var(--ui-duration-100);
    transition-timing-function: var(--ui-easing-state), var(--ui-easing-emphasis), var(--ui-easing-enter), linear;
}

/* The border's containing block. Not under the border's queries: a :host rule there would miss
   a choice made on the host itself — S8 — and the border would be placed against the page.
   Isolated, so the circles drawn under the button stay over whatever the page put under it. */
:host {
    position: relative;
    isolation: isolate;
}

/* The fill is drawn on the layer the edge is drawn on, put under the label: what a fill paints
   then lights the button's own fill and never the label, and the edge it shares the layer with
   lies past where the label reaches. Not on the other layer, where a theme draws its glow and
   the shadow's loops were measured. */
button::after {
    z-index: -1;
}

/* What the fill is drawn in. The light under the pointer and the ripple, in the label's colour,
   so they read on either variant: the layer's own colour is the edge's, which on a primary is
   nothing. A sheen, in the primary's own fill lifted toward white, and the accent on a
   secondary, whose fill is already white in the light scheme. Not the primary's label: that is
   black on a light fill — the dark scheme's, and every scheme's in Matrix — and crossed the
   button as a shadow. */
button.primary::after {
    --ui-ink: ${reference('--ui-color-primary-contrast')};
    --ui-sheen: oklch(from ${reference('--ui-color-primary')} calc(l + 0.35) calc(c * 0.4) h / 0.55);
}

button.secondary::after {
    --ui-ink: ${reference('--ui-color-text')};
    --ui-sheen: rgb(from var(--ui-color-accent) r g b / 0.5);
}

/* Every effect a moment fires is an animation the script starts — as the pointer or Space goes
   down or on the click another key makes, as the pointer arrives, as a focus the reader can see
   arrives — so
   it answers the moment itself and finishes whatever the state does. The click a pointer makes
   arrives on release, as long after as the button was held. Each kind marks its element by an
   attribute of its own, so one press can start one effect of each and every one runs to its
   end. They sit under no moment's query, because more than one moment starts most of them.

   The loops run for as long as their state lasts, and step aside while an effect of their kind
   that a moment fires plays on the same element: one element has one animation list, so the
   more specific rule would otherwise keep a press from ever showing on a hovered button. */

/* ——— The movement, on the button. ——— */

/* press-move: squish. A transition rather than an animation, so letting go runs it back instead
   of cutting it — S7. Pressing in is immediate, as the pressed colour is.

   A press is drawn over the pointer, so the second selector weighs as a press under the pointer
   does: written once, at the weight of the pointer's zoom and before it, the zoom held a pressed
   button at its size — measured. */
@container ${is('press-move', 'squish')} {
    button:not(:disabled):active,
    button:not(:disabled):hover:active {
        scale: 0.96;
    }
}

/* press-move: spring. Pressed in further than the squish, and let go on the reference's spring.
   In at once, as the squish is: the pressed colour's 0s covers the scale. */
@container ${is('press-move', 'spring')} {
    button {
        transition-duration: ${reference('--ui-duration-state')}, var(--ui-duration-400), var(--ui-duration-200), var(--ui-duration-100);
        transition-timing-function: var(--ui-easing-state), ${spring}, var(--ui-easing-enter), linear;
    }

    button:not(:disabled):active,
    button:not(:disabled):hover:active {
        scale: 0.9;
    }
}

/* glitch: the label jumps and splits into two colours, drawn for the Matrix theme. The two
   are the danger and the info, which that theme's dark scheme makes a terminal's red and
   cyan. */
button[data-move='glitch'] {
    animation: ui-glitch var(--ui-duration-200) linear;
}

/* heartbeat: two beats outward. It only grows, so the pointer that pressed it stays on it. */
button[data-move='heartbeat'] {
    animation: ui-heartbeat var(--ui-duration-300) var(--ui-easing-state);
}

/* rubber squashes the button inside the shadow root and leaves the host's box where it was, so
   a release the squashed button no longer covers lands on the host, and the click a page
   listens for still arrives — measured in all three engines, with the press starting it. The
   native button misses that click; nothing outside it can tell. */
button[data-move='rubber'] {
    animation: ui-rubber var(--ui-duration-400) linear;
}

/* flip: the reference's clean flip, turning in from edge-on and rocking past its face, less
   each time, until it settles, on the reference's curve and about its length. Vertical swings
   the top and bottom, as the reference's does; horizontal swings the sides. The ring, the
   theme's glow and the edge are the button's, so they turn with it.

   It starts edge-on, so the button — and on focus, the ring — is under a third there at 30ms
   and just over half at 60ms, measured in all three engines. A release the turned button no
   longer covers falls on the host's box, which takes the click, as it does for the rubber.

   The depth is ten times the side that turns, which the script publishes as it fires: the
   reference's 400px on a one-line button. Held at 400px, a 572px button turning side over side
   brought its near edge so far forward that it stood 142px tall, three and a half times the
   button, and widened the page by 26px in Chromium and Firefox — measured. */
button[data-move='flip-vertical'] {
    animation: ui-flip-vertical calc(var(--ui-duration-400) * 1.5) var(--ui-easing-enter);
}

button[data-move='flip-horizontal'] {
    animation: ui-flip-horizontal calc(var(--ui-duration-400) * 1.5) var(--ui-easing-enter);
}

/* hover-move: lift. Two pixels: the target moves under a pointer that is already on it, so the
   distance stays well inside the button.

   Every hover state here sits under hover: hover. A finger has no hover, and a tap leaves
   :hover on whatever it touched, so a state drawn without it — a loop above all — stays on a
   phone's button after the finger has gone. */
@media (hover: hover) {
    @container ${is('hover-move', 'lift')} {
        button:not(:disabled):hover {
            translate: 0 -2px;
        }
    }
}

/* hover-move: zoom. Grows a little under the pointer, which it only grows away from. */
@media (hover: hover) {
    @container ${is('hover-move', 'zoom')} {
        button:not(:disabled):hover {
            scale: 1.05;
        }
    }
}

/* hover-move: magnetic. Leans toward the pointer as it nears, a few pixels at most. */
@container ${is('hover-move', 'magnetic')} {
    button:not(:disabled) {
        translate: calc(var(--ui-pointer-nx) * var(--ui-pointer-near) * 6px)
            calc(var(--ui-pointer-ny) * var(--ui-pointer-near) * 4px);
    }
}

/* hover-move: tilt. Turns toward the pointer, up to 14°, and grows a little as it nears — the
   reference's 3D tilt, through the pointer engine. The light the reference's catches where the
   pointer is, is the fill's spotlight: the two together are the whole of it. */
@container ${is('hover-move', 'tilt')} {
    button:not(:disabled) {
        transform: perspective(500px)
            rotateY(calc(var(--ui-pointer-nx) * var(--ui-pointer-near) * 14deg))
            rotateX(calc(var(--ui-pointer-ny) * var(--ui-pointer-near) * -14deg));
        scale: calc(1 + var(--ui-pointer-near) * 0.06);
    }
}

/* hover-move: breathe. Swells and settles, the half of the reference's pulse that moves, with
   the shadow's breathe as the other; it only grows, so the pointer resting on it stays on it. */
@media (hover: hover) {
    @container ${is('hover-move', 'breathe')} {
        button:not(:disabled):not([data-move]):hover {
            animation: ui-breathe var(--ui-duration-loop) var(--ui-easing-state) var(--ui-iteration-loop) alternate;
        }
    }
}

/* focus-move: lift. Two pixels up, ring and all, for as long as the focus stays. */
@container ${is('focus-move', 'lift')} {
    button:focus-visible {
        translate: 0 -2px;
    }
}

/* The focus loops settle: four rounds and they rest, because a focus can stay for as long as
   the reader reads. */
@container ${is('focus-move', 'breathe')} {
    button:focus-visible:not([data-move]) {
        animation: ui-breathe var(--ui-duration-loop) var(--ui-easing-state) var(--ui-iteration-settle) alternate;
    }
}

/* ——— The fill, on the button's ::after, under the label. ——— */

/* highlight: the hover colour under the pointer and the pressed colour while held, which is what
   the component does today and so what renders with no choice. The colours are named here so any
   other choice of the kind can take its one away: the pointer then leaves the resting colour, and
   a press leaves whatever the pointer gave, since a press is drawn over the pointer, as it is
   today. A press that brings no colour leaves its name unset, and the fill falls back. */
button.primary {
    --ui-fill-rest: ${reference('--ui-color-primary')};
    --ui-fill-hover: ${reference('--ui-color-primary-hover')};
    --ui-fill-pressed: ${reference('--ui-color-primary-pressed')};
}

button.secondary {
    --ui-fill-rest: ${reference('--ui-color-surface-control')};
    --ui-fill-hover: ${reference('--ui-color-hover')};
    --ui-fill-pressed: ${reference('--ui-color-pressed')};
}

button.primary,
button.secondary {
    --ui-fill-hovered: var(--ui-fill-hover);
}

@container ${is('hover-fill', 'none')} or ${is('hover-fill', 'spotlight')} or
    ${is('hover-fill', 'flood')} or ${is('hover-fill', 'shimmer')} or
    ${is('hover-fill', 'ripple')} or ${is('hover-fill', 'scan')} {
    button.primary,
    button.secondary {
        --ui-fill-hovered: var(--ui-fill-rest);
    }
}

@container ${is('press-fill', 'none')} or ${is('press-fill', 'ripple')} or
    ${is('press-fill', 'scan')} {
    button.primary,
    button.secondary {
        --ui-fill-pressed: initial;
    }
}

button.primary:not(:disabled):hover,
button.secondary:not(:disabled):hover {
    background: var(--ui-fill-hovered);
}

button.primary:not(:disabled):active,
button.secondary:not(:disabled):active {
    background: var(--ui-fill-pressed, var(--ui-fill-rest));
}

button.primary:not(:disabled):hover:active,
button.secondary:not(:disabled):hover:active {
    background: var(--ui-fill-pressed, var(--ui-fill-hovered));
}

/* ripple: from where the pointer went down for a press or came in for a hover, and from the
   middle for a key or a focus. */
button[data-fill='ripple']::after {
    background-image: ${circle};
    animation: ui-ripple var(--ui-duration-400) var(--ui-easing-enter);
}

/* scan: a band of light crossing the button, top to bottom. */
button[data-fill='scan']::after {
    background-image: linear-gradient(transparent, var(--ui-sheen), transparent);
    background-size: 100% 40%;
    background-repeat: no-repeat;
    animation: ui-scan var(--ui-duration-400) var(--ui-easing-state);
}

/* hover-fill: spotlight. A light where the pointer is, fading with distance. It steps aside for
   the scan, and the ripple is drawn over it: one background-image, two layers, for as long as
   the ripple plays. */
@container ${is('hover-fill', 'spotlight')} {
    button:not(:disabled):not([data-fill])::after {
        background-image: ${spot};
    }

    button[data-fill='ripple']::after {
        background-image: ${circle}, ${spot};
    }
}

/* hover-fill: shimmer. A sheen sweeps across and comes round again — the reference's skeleton
   loader, as a light rather than as a placeholder. */
@media (hover: hover) {
    @container ${is('hover-fill', 'shimmer')} {
        button:not(:disabled):not([data-fill]):hover::after {
            background-image: linear-gradient(100deg, transparent 35%, var(--ui-sheen) 50%, transparent 65%);
            background-size: 250% 100%;
            background-repeat: no-repeat;
            animation: ui-shimmer calc(var(--ui-duration-loop) * 1.25) linear var(--ui-iteration-loop);
        }
    }
}

/* hover-fill: flood. The hover colour spreads from where the pointer came in and drains toward
   where it leaves: in the highlight's place, the button keeps its resting fill under the pointer
   and the flood brings the hover colour, and the pressed one while it is held where the press
   brings it, so the label stands on the colours it stands on today. A circle drawn on the layer
   under the label rather than the card's clip: this layer also draws the edge and a theme's lift,
   which a clip would take away. The ripple and the scan are drawn over it. */
@container ${is('hover-fill', 'flood')} {
    button {
        --ui-flood-ink: var(--ui-fill-hover);
    }

    button:not(:disabled):active {
        --ui-flood-ink: var(--ui-fill-pressed, var(--ui-fill-hover));
    }

    button::after {
        background-image: ${flooded};
        transition: --ui-flood var(--ui-duration-400) var(--ui-easing-move);
    }

    button[data-fill='ripple']::after {
        background-image: ${circle}, ${flooded};
    }

    button[data-fill='scan']::after {
        background-image: linear-gradient(transparent, var(--ui-sheen), transparent), ${flooded};
        background-size: 100% 40%, 100% 100%;
    }

    @media (hover: hover) {
        button:not(:disabled):hover::after {
            --ui-flood: 1;
        }
    }
}

/* focus-fill: shimmer. It shares the layer with the pointer's light, and the pointer is drawn over
   the focus, as a press is over the pointer: where the pointer brings a fill of its own to the
   layer, the sheen waits while the pointer rests on the button and sweeps again when it leaves.
   Drawn over Glass's spotlight, a focused button under the pointer showed the sheen and no light
   — measured. */
@container ${is('focus-fill', 'shimmer')} and (not ${pointerFill}) {
    button:focus-visible:not([data-fill])::after {${focusShimmer}
    }
}

@container ${is('focus-fill', 'shimmer')} and ${pointerFill} {
    button:focus-visible:where(:not(:hover)):not([data-fill])::after {${focusShimmer}
    }
}

/* ——— The shadow, on the button's ::before, where a theme draws its glow. ——— */

/* highlight: the glow a theme gives the pointer, where it gives one — Matrix's ring goes solid
   and its glow doubles. What the component does today; any other choice of the kind keeps the
   glow the theme gives at rest. */
@container ${is('hover-shadow', 'none')} or ${is('hover-shadow', 'raise')} or
    ${is('hover-shadow', 'sink')} or ${is('hover-shadow', 'neon')} or
    ${is('hover-shadow', 'breathe')} or ${is('hover-shadow', 'burst')} {
    button:not(:disabled):hover::before {
        box-shadow: ${reference('--ui-elevation-control')};
    }
}

/* burst: light bursting out around the button, on the host's ::before, a layer of its own
   under the button. On the button's ::before, where the loops run, it stood in for a theme's
   glow for its length: Matrix's went out for the first 40ms of every press and came back at
   once at the end — measured. Here it adds to that glow, and to a loop the pointer is running.
   Not glow, which is the card's halo, and which Matrix's taste names.

   The reference also brightens the button itself at the peak, and on the light scheme's
   primary, a white label over the accent, that takes the label from 5.17:1 to 2.32:1 —
   measured. So only the light around the button moves. */
:host([data-shadow='burst'])::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: calc(var(--ui-radius) + 1px);
    pointer-events: none;
    opacity: 1;
    transition: none;
    animation: ui-burst var(--ui-duration-400) var(--ui-easing-enter);
}

/* raise: positive elevation. A drop shadow under the button, faded in on the host's ::before,
   where the burst is drawn, rather than moved on the button's own, where a theme writes its glow
   from currentColor, which Chromium does not interpolate — the neon's note. A shadow barely
   shows on a dark page, so there the drop is the accent's. While the pointer rests, while the
   button is held, or while it has the focus; the burst takes the layer while it plays. */
@container ${is('hover-shadow', 'raise')} or ${is('press-shadow', 'raise')} or
    ${is('focus-shadow', 'raise')} {
    :host::before {
        content: '';
        position: absolute;
        inset: -1px;
        border-radius: calc(var(--ui-radius) + 1px);
        pointer-events: none;
        box-shadow:
            0 2px 4px -1px light-dark(rgb(0 0 0 / 0.25), rgb(0 0 0 / 0.6)),
            0 6px 14px -4px light-dark(rgb(0 0 0 / 0.35), rgb(from var(--ui-color-accent) r g b / 0.45));
        opacity: 0;
        transition: opacity var(--ui-duration-200) var(--ui-easing-enter);
    }
}

@media (hover: hover) {
    @container ${is('hover-shadow', 'raise')} {
        :host(:hover:not([disabled]):not([data-shadow]))::before {
            opacity: 1;
        }
    }
}

@container ${is('press-shadow', 'raise')} {
    :host(:active:not([disabled]):not([data-shadow]))::before {
        opacity: 1;
        transition-duration: 0s;
    }
}

@container ${is('focus-shadow', 'raise')} {
    :host([data-focus-visible]:not([data-shadow]))::before {
        opacity: 1;
    }
}

/* sink: negative elevation, the shadow gone inside, as if the button were pressed into the page.
   On the button itself, the one surface over its fill and under its label: an inset shadow on a
   layer under the button is covered by it, and on the glow's layer it would be written beside a
   theme's glow, which is none where a theme gives none — and a list holding none is no shadow at
   all, measured. A transition rather than an animation, so it leaves the movement's list alone;
   the shadow takes the first of the button's lengths and curves. In at once for a press, as the
   pressed colour is; the flood's colour, where it is chosen too, is drawn over it. */
@container ${is('press-shadow', 'sink')} or ${is('hover-shadow', 'sink')} {
    button {
        transition-property: background-color, scale, translate, transform, box-shadow;
    }
}

@container ${is('press-shadow', 'sink')} {
    button:not(:disabled):active {
        box-shadow: inset 0 2px 5px light-dark(rgb(0 0 0 / 0.35), rgb(0 0 0 / 0.7));
    }
}

@media (hover: hover) {
    @container ${is('hover-shadow', 'sink')} {
        button:not(:disabled):hover {
            box-shadow: inset 0 2px 5px light-dark(rgb(0 0 0 / 0.35), rgb(0 0 0 / 0.7));
        }
    }
}

/* While a press holds the button smaller, the layers the pointer and the focus draw on the host
   step aside until it is let go: they are the host's size, not the button's, and the raise framed
   a squished button in white and the light round the edge stood clear of it — measured. A sink
   takes the raise away as well, since a button pressed into the page casts nothing under it. A
   raise the press chose for itself stays. Let go, each comes back on its own transition. A press
   the pointer makes is read as :hover:active, which weighs as much as the pointer's own loop,
   written after it; one a key makes, from the host's record of it, since the host is not :active
   for a key — measured. */
@container (${is('press-move', 'squish')} or ${is('press-move', 'spring')} or
    ${is('press-shadow', 'sink')}) and (not ${is('press-shadow', 'raise')}) {
    :host([data-pressed]:not([disabled]):not([data-shadow]))::before,
    :host(:hover:active:not([disabled]):not([data-shadow]))::before {
        opacity: 0;
        transition-duration: 0s;
    }
}

@container ${is('press-move', 'squish')} or ${is('press-move', 'spring')} {
    :host([data-pressed]:not([disabled]):not([data-border]))::after,
    :host(:hover:active:not([disabled]):not([data-border]))::after {
        opacity: 0;
        transition-duration: 0s;
    }
}

/* The breathe's light is added to the glow a theme gives the layer at rest rather than drawn from
   it, and only its strength moves, a registered number, so no engine interpolates a shadow.
   Chromium does not interpolate one whose colour is derived from currentColor, which is how
   Matrix writes its glow, and a loop drawn from that glow held it to halfway and jumped —
   measured. A list holding none is no shadow at all, so where the theme gives no glow the light
   is the layer's only shadow, which a style query decides: the glow is named here, read through
   its token's fallback, so one nobody declared is none to the query too. */
button {
    --ui-glow: ${reference('--ui-elevation-control')};
}

@media (hover: hover) {
    /* hover-shadow: neon. A lit line round the edge, as a tube is, and a glow that swells from
       close round it to a wide halo and back. */
    @container ${is('hover-shadow', 'neon')} {
        button:not(:disabled):not([data-shadow]):hover::before {
            animation: ui-neon var(--ui-duration-loop) var(--ui-easing-state) var(--ui-iteration-loop) alternate;
        }
    }

    /* hover-shadow: breathe. A glow that comes and goes, the movement's breathe's other half. */
    @container ${is('hover-shadow', 'breathe')} {
        button:not(:disabled):not([data-shadow]):hover::before {
            box-shadow: var(--ui-glow), ${breath};
            animation: ui-breathe-glow var(--ui-duration-loop) var(--ui-easing-state) var(--ui-iteration-loop) alternate;
        }
    }

    @container ${is('hover-shadow', 'breathe')} and style(--ui-glow: none) {
        button:not(:disabled):not([data-shadow]):hover::before {
            box-shadow: ${breath};
        }
    }
}

/* focus-shadow: neon. Its last round ends on its lit line, so it fades from there to what the
   layer rests on instead of going out at once. */
@container ${is('focus-shadow', 'neon')} {
    button:focus-visible:not([data-shadow])::before {
        animation:
            ui-neon var(--ui-duration-loop) var(--ui-easing-state) var(--ui-iteration-settle) alternate,
            ui-neon-rest var(--ui-duration-200) var(--ui-easing-exit)
                calc(var(--ui-duration-loop) * var(--ui-iteration-settle));
    }
}

@container ${is('focus-shadow', 'breathe')} {
    button:focus-visible:not([data-shadow])::before {
        box-shadow: var(--ui-glow), ${breath};
        animation: ui-breathe-glow var(--ui-duration-loop) var(--ui-easing-state) var(--ui-iteration-settle) alternate;
    }
}

@container ${is('focus-shadow', 'breathe')} and style(--ui-glow: none) {
    button:focus-visible:not([data-shadow])::before {
        box-shadow: ${breath};
    }
}

/* ——— The border, on the host's ::after. ——— */

/* highlight: the edge takes the colour a theme gives the pointer, where it gives one — Glass's
   faint edge goes solid. Drawn on the button's ::after, as the component draws it today; any
   other choice of the kind keeps the edge the theme draws at rest. */
@container ${is('hover-border', 'none')} or ${is('hover-border', 'edge')} or
    ${is('hover-border', 'orbit')} or ${is('hover-border', 'trace')} or
    ${is('hover-border', 'comet')} or ${is('hover-border', 'pulse')} or
    ${is('hover-border', 'shockwave')} or ${is('hover-border', 'bloom')} {
    button:not(:disabled):hover::after {
        border-color: ${reference('--ui-color-border-button')};
    }
}

/* The edge's band, for the edge, the orbit and the trace, the rest masked out, as the card's
   border layer is: 3px, from 2px out to 1px in. The card's is 2px across its edge, half of it
   over the card's white; half of the button's would be over its own fill, which on a primary is
   the accent, and the comet went into it. The focus's orbit draws the same band for itself. */
@container ${is('hover-border', 'edge')} or ${is('hover-border', 'orbit')} or
    ${is('hover-border', 'trace')} {
    :host::after {
        content: '';
        position: absolute;
        inset: -2px;
        padding: 3px;
        border-radius: calc(var(--ui-radius) + 2px);
        mask:
            linear-gradient(#000 0 0) content-box exclude,
            linear-gradient(#000 0 0);
        pointer-events: none;
    }
}

/* hover-border: edge. The card's: the band lit where the pointer is nearest, as near as the
   pointer engine finds it. The card's light fades out over 14rem, which is about the card's
   240px; over a button of 67 to 95px it would leave the far side at more than half of the near
   one, and the band lit nearly all round. So the button's circle is 7rem, whose light fades out
   about as far across a button as the card's does across the card. Never on a disabled button,
   which the pointer engine measures all the same: the light is how near the pointer is, not
   whether it is over the button, so no :hover keeps it off. */
@container ${is('hover-border', 'edge')} {
    :host::after {
        background: radial-gradient(
            7rem circle at calc(var(--ui-pointer-x) + 2px) calc(var(--ui-pointer-y) + 2px),
            ${far},
            transparent 70%
        );
        opacity: 0;
    }

    :host(:not([disabled]))::after {
        opacity: var(--ui-pointer-near);
    }
}

/* hover-border: orbit. The card's: a comet of the band's colour and the info runs round the edge
   itself, four laps, and fades. A name means one effect wherever it is offered, so a choice made
   for the page — a theme's taste among them — orbits the card and the button alike. */
@container ${is('hover-border', 'orbit')} {
    :host::after {
        background: conic-gradient(
            from var(--ui-orbit),
            transparent 0 55%,
            ${far} 75%,
            var(--ui-color-info) 88%,
            transparent
        );
        opacity: 0;
        transition: opacity var(--ui-duration-200) var(--ui-easing-exit);
    }

    @media (hover: hover) {
        :host(:hover:not([disabled]):not([data-border]))::after {
            opacity: 1;
            animation:
                ui-orbit var(--ui-duration-loop) linear var(--ui-iteration-settle),
                ui-rest var(--ui-duration-200) var(--ui-easing-exit)
                    calc(var(--ui-duration-loop) * var(--ui-iteration-settle)) forwards;
        }
    }
}

/* hover-border: trace. The card's: the edge drawn round once, clockwise from the top, and
   undrawn the same way when the pointer leaves — a registered angle, transitioned. */
@container ${is('hover-border', 'trace')} {
    :host::after {
        background: conic-gradient(${far} var(--ui-trace), transparent 0);
        transition: --ui-trace calc(var(--ui-duration-400) * 1.5) var(--ui-easing-move);
    }

    @media (hover: hover) {
        :host(:hover:not([disabled]):not([data-border]))::after {
            --ui-trace: 360deg;
        }
    }
}

/* hover-border: comet. A comet of the accent and the info runs round the button, 2px clear of
   its edge so it reads apart from any ring a theme draws there, while the pointer rests; the
   mask leaves only the 3px track. Paused rather than removed when the pointer leaves, so the
   next pass picks the comet up where this one left it, which is how the reference keeps a hover
   loop from jumping back to its start. */
@container ${is('hover-border', 'comet')} {
    :host::after {
        content: '';
        position: absolute;
        inset: -5px;
        padding: 3px;
        border-radius: calc(var(--ui-radius) + 5px);
        background: conic-gradient(
            from var(--ui-orbit),
            transparent 0 55%,
            var(--ui-color-accent) 75%,
            var(--ui-color-info) 88%,
            transparent
        );
        mask:
            linear-gradient(#000 0 0) content-box exclude,
            linear-gradient(#000 0 0);
        pointer-events: none;
        opacity: 0;
        transition: opacity var(--ui-duration-200) var(--ui-easing-state);
        animation: ui-orbit calc(var(--ui-duration-loop) * 2) linear var(--ui-iteration-loop) paused;
    }

    @media (hover: hover) {
        :host(:hover:not([disabled]):not([data-border]))::after {
            opacity: 1;
            animation-play-state: running;
        }
    }
}

/* focus-border: orbit and comet. The host cannot see the focus: no engine lets a host match
   :focus-visible for the control in its shadow root, so it reads the attribute the harness sets
   for :state(focus-visible).

   Each is written under the focus alone, since it shares the layer with the pointer's border:
   written for the layer, the orbit stood in for Glass's edge under the pointer, a still arc where
   the light should have followed it, and the comet put Matrix's trace out, at its own inset —
   measured. And the pointer is drawn over the focus, as a press is over the pointer: where the
   pointer brings a border of its own to the layer, the focus's waits while the pointer rests on
   the button and runs its laps again when it leaves. The wait sits under :where(), so the focus
   weighs what it did, under the press that steps it aside. */
@container ${is('focus-border', 'orbit')} and (not ${pointerBorder}) {
    :host([data-focus-visible]:not([data-border]))::after {${focusOrbit}
    }
}

@container ${is('focus-border', 'orbit')} and ${pointerBorder} {
    :host([data-focus-visible]:where(:not(:hover)):not([data-border]))::after {${focusOrbit}
    }
}

@container ${is('focus-border', 'comet')} and (not ${pointerBorder}) {
    :host([data-focus-visible]:not([data-border]))::after {${focusComet}
    }
}

@container ${is('focus-border', 'comet')} and ${pointerBorder} {
    :host([data-focus-visible]:where(:not(:hover)):not([data-border]))::after {${focusComet}
    }
}

/* The border's fired effects, on the same layer, drawn round the button's edge in the accent:
   the orbit's track put away while one plays, and shown at once rather than through the
   orbit's fade. On the host's layer, over the button, so a ring begun on the edge shows on
   both sides of it, and held where the button is — after the circles. */
:host([data-border])::after {
    content: '';
    position: absolute;
    inset: -1px;
    padding: 0;
    border-radius: calc(var(--ui-radius) + 1px);
    color: ${reference('--ui-color-accent')};
    background: none;
    mask: none;
    pointer-events: none;
    opacity: 1;
    transition: none;
}

/* pulse: a ring leaving an edge decelerates, as the ripple does. On the exit curve, which
   accelerates, it stays under a pixel wide for its first quarter-second, and the press looks
   answered late — measured. */
:host([data-border='pulse'])::after {
    animation: ui-pulse var(--ui-duration-400) var(--ui-easing-enter);
}

/* explode, keeping the button: one ring, 8px thick and soft from the start, leaves the edge and
   flies out to 3rem, blurring further as it spreads, while the button stays where it was
   pressed. The reference's explode ends with the button gone, which is the moment of whatever
   held it, not of the control.

   One ring on both variants, in the edge's colour, which on this layer is the accent until a
   theme names one: a band of the fill inside it reads as a second edge on a primary and
   vanishes into a secondary's white. It fades through its own colour, not the layer's
   opacity. The blur is the layer's, and the layer is the ring's alone while it plays.

   Drawn as an outline, which is ink: it reaches as far around a full-width button as around a
   small one, and never widens the page. A scaled copy does both — at the viewport's right edge
   it widened the page by 16px while it ran, measured.

   On the in-out curve, so the ring is seen at the edge before it flies: the enter curve starts
   at full speed and had it 14px out by the first 100ms, which read as a burst that began away
   from the button. It starts centred on the edge, half over the button: begun just outside,
   the blur left it at half strength where the button ends and strongest 4px out, measured,
   which reads as a gap between the two. */
:host([data-border='explode'])::after {
    outline: 8px solid transparent;
    animation: ui-explode var(--ui-duration-400) var(--ui-easing-state);
}

/* beacon: the ring is drawn at once, as today; the beacon spreads out past it afterwards and
   fades, so it can only add to the ring, never stand in for it. */
:host([data-border='beacon'])::after {
    animation: ui-beacon var(--ui-duration-400) var(--ui-easing-enter);
}

/* shockwave and bloom: the ripple, outward, as circles from the button's middle, for as long as
   the explode and half as far again past the button. The shockwave is a line, 2px and sharp,
   drawn as the explode is, as an outline; the bloom is filled, a disc of the accent, drawn as the
   pulse is, as a shadow. Each is drawn round a dot of 2px, whose rounded corner the outline and
   the shadow both grow with, so either comes out round; a corner of nothing stays square. Under
   the button, so the disc never covers the label and both come out from behind it; and on the
   enter curve, at speed from the start, which the explode's in-out held back while the circle
   was still hidden. Both are ink, which widens no page. */
:host([data-border='shockwave'])::after,
:host([data-border='bloom'])::after {
    inset: auto;
    left: calc(50% - 1px);
    top: calc(50% - 1px);
    width: 2px;
    height: 2px;
    border-radius: 1px;
    z-index: -1;
}

:host([data-border='shockwave'])::after {
    outline: 2px solid transparent;
    animation: ui-shockwave var(--ui-duration-400) var(--ui-easing-enter);
}

:host([data-border='bloom'])::after {
    animation: ui-bloom var(--ui-duration-400) var(--ui-easing-enter);
}

/* A fired effect on the host's layers is drawn where the button is held: at the size, the turn
   and the place the pointer, the focus or a press holds it at, on the button's own transitions,
   and at once for a press, as the button goes in. At the host's size and place, the pulse a
   press sent out began 4.3px clear of the button the spring had pulled in, and 3px above and
   below it; once the spring let go under Glass's tilt, it ran a pixel and a half inside the edge
   — measured. Not where a movement that fires takes the button, a flip, a stretch or a beat,
   which a ring leaving the edge has no need to follow; and only while one plays, so the loops on
   these layers keep the host's size and step aside for a press.

   A layer that comes into being with its effect has no style to move from, so it starts where
   the button rests and moves as the button does: begun where the button was going, the beacon
   ran 2px above a button the focus was still lifting — measured. A press moves it at once,
   whatever the button was already doing, as the button's own press does. */
:host([data-border])::after,
:host([data-shadow])::before {
    transition-property: scale, translate, transform;
    transition-duration: var(--ui-duration-200), var(--ui-duration-200), var(--ui-duration-100);
    transition-timing-function: var(--ui-easing-emphasis), var(--ui-easing-enter), linear;
}

@starting-style {
    :host([data-border])::after,
    :host([data-shadow])::before {
        scale: none !important;
        translate: none !important;
        transform: none !important;
    }
}

:host([data-border]:active:not([disabled]))::after,
:host([data-border][data-pressed]:not([disabled]))::after,
:host([data-shadow]:active:not([disabled]))::before,
:host([data-shadow][data-pressed]:not([disabled]))::before {
    transition-duration: 0s;
}

@container ${is('press-move', 'spring')} {
    :host([data-border])::after,
    :host([data-shadow])::before {
        transition-duration: var(--ui-duration-400), var(--ui-duration-200), var(--ui-duration-100);
        transition-timing-function: ${spring}, var(--ui-easing-enter), linear;
    }
}

@container ${is('hover-move', 'magnetic')} {
    :host([data-border]:not([disabled]))::after,
    :host([data-shadow]:not([disabled]))::before {
        translate: calc(var(--ui-pointer-nx) * var(--ui-pointer-near) * 6px)
            calc(var(--ui-pointer-ny) * var(--ui-pointer-near) * 4px);
    }
}

@container ${is('hover-move', 'tilt')} {
    :host([data-border]:not([disabled]))::after,
    :host([data-shadow]:not([disabled]))::before {
        transform: perspective(500px)
            rotateY(calc(var(--ui-pointer-nx) * var(--ui-pointer-near) * 14deg))
            rotateX(calc(var(--ui-pointer-ny) * var(--ui-pointer-near) * -14deg));
        scale: calc(1 + var(--ui-pointer-near) * 0.06);
    }
}

@media (hover: hover) {
    @container ${is('hover-move', 'lift')} {
        :host([data-border]:hover:not([disabled]))::after,
        :host([data-shadow]:hover:not([disabled]))::before {
            translate: 0 -2px;
        }
    }

    @container ${is('hover-move', 'zoom')} {
        :host([data-border]:hover:not([disabled]))::after,
        :host([data-shadow]:hover:not([disabled]))::before {
            scale: 1.05;
        }
    }
}

@container ${is('focus-move', 'lift')} {
    :host([data-border][data-focus-visible])::after,
    :host([data-shadow][data-focus-visible])::before {
        translate: 0 -2px;
    }
}

@container ${is('press-move', 'squish')} {
    :host([data-border]:active:not([disabled]))::after,
    :host([data-border][data-pressed]:not([disabled]))::after,
    :host([data-shadow]:active:not([disabled]))::before,
    :host([data-shadow][data-pressed]:not([disabled]))::before {
        scale: 0.96;
    }
}

@container ${is('press-move', 'spring')} {
    :host([data-border]:active:not([disabled]))::after,
    :host([data-border][data-pressed]:not([disabled]))::after,
    :host([data-shadow]:active:not([disabled]))::before,
    :host([data-shadow][data-pressed]:not([disabled]))::before {
        scale: 0.9;
    }
}

/* press-move: shatter and split. While the button is in pieces, from the break until they are
   back together, the layers the pointer and the focus draw on the host step aside, as they do for
   a squish: they are the host's shape, and the pieces are not. A fired effect of their own plays,
   and a raise the press chose for itself stays. The host is marked for as long as the pieces are
   apart, which covers a key's press too, held or not. Last, so it outweighs the pointer's and the
   focus's own rules on these layers, which it weighs as much as. */
@container not ${is('press-shadow', 'raise')} {
    :host([data-broken]:not([disabled]):not([data-shadow]))::before {
        opacity: 0;
        transition-duration: 0s;
    }
}

:host([data-broken]:not([disabled]):not([data-border]))::after {
    opacity: 0;
    transition-duration: 0s;
}

/* A plain number, which the gradient scales the reach by: Firefox does not interpolate a
   registered property toward a var(), and a size animated to var(--ui-ripple-reach) jumped from
   nothing to the whole reach halfway through — measured. */
@keyframes ui-ripple {
    from {
        --ui-ripple-progress: 0;
        --ui-ripple-alpha: 0.32;
    }
    to {
        --ui-ripple-progress: 1;
        --ui-ripple-alpha: 0;
    }
}

@keyframes ui-pulse {
    from {
        box-shadow: 0 0 0 0 rgb(from var(--ui-color-accent) r g b / 0.5);
    }
    to {
        box-shadow: 0 0 0 13px rgb(from var(--ui-color-accent) r g b / 0);
    }
}

@keyframes ui-burst {
    from {
        box-shadow: 0 0 0 0 rgb(from var(--ui-color-accent) r g b / 0.8);
    }
    to {
        box-shadow: 0 0 30px 20px rgb(from var(--ui-color-accent) r g b / 0);
    }
}

/* The band is 40% of the height, so -66.7% starts it wholly above and 166.7% ends it wholly
   below: a percentage places the band within what is left over once its own size is taken. */
@keyframes ui-scan {
    from {
        background-position: 0 -66.7%;
    }
    to {
        background-position: 0 166.7%;
    }
}

/* The ring is gone by nine tenths; the last tenth only brings the blur back down. */
@keyframes ui-explode {
    from {
        outline-offset: -4px;
        outline-color: rgb(from ${reference('--ui-color-border-button')} r g b / 1);
        filter: blur(4px);
    }
    40% {
        outline-color: rgb(from ${reference('--ui-color-border-button')} r g b / 0.85);
    }
    90% {
        outline-color: rgb(from ${reference('--ui-color-border-button')} r g b / 0);
        filter: blur(16px);
    }
    to {
        outline-offset: 3rem;
        outline-color: rgb(from ${reference('--ui-color-border-button')} r g b / 0);
        filter: blur(0);
    }
}

@keyframes ui-shockwave {
    from {
        outline-offset: var(--ui-wave-from);
        outline-color: rgb(from ${reference('--ui-color-border-button')} r g b / 1);
    }
    50% {
        outline-color: rgb(from ${reference('--ui-color-border-button')} r g b / 0.7);
    }
    to {
        outline-offset: var(--ui-wave-to);
        outline-color: rgb(from ${reference('--ui-color-border-button')} r g b / 0);
    }
}

@keyframes ui-bloom {
    from {
        box-shadow: 0 0 0 var(--ui-wave-from) rgb(from var(--ui-color-accent) r g b / 0.45);
    }
    to {
        box-shadow: 0 0 0 var(--ui-wave-to) rgb(from var(--ui-color-accent) r g b / 0);
    }
}

@keyframes ui-glitch {
    0%, 100% { transform: none; }
    20% {
        transform: translate(-4px, 2px) skewX(-5deg);
        text-shadow: 2px -2px ${reference('--ui-color-danger')};
    }
    40% {
        transform: translate(4px, -2px) skewX(5deg);
        text-shadow: -2px 2px ${reference('--ui-color-info')};
    }
    60% { transform: translate(-2px, -2px) skewX(0deg); }
    80% { transform: translate(2px, 2px) skewX(3deg); }
}

@keyframes ui-heartbeat {
    0%, 28%, 70%, 100% { scale: 1; }
    14% { scale: 1.24; }
    42% { scale: 1.18; }
}

@keyframes ui-rubber {
    0%, 100% { scale: 1 1; }
    30% { scale: 1.25 0.75; }
    40% { scale: 0.75 1.25; }
    50% { scale: 1.15 0.85; }
    65% { scale: 0.95 1.05; }
    75% { scale: 1.05 0.95; }
}

@keyframes ui-flip-vertical {
    from { transform: perspective(calc(var(--ui-flip-height) * 10)) rotateX(90deg); }
    40% { transform: perspective(calc(var(--ui-flip-height) * 10)) rotateX(-20deg); }
    70% { transform: perspective(calc(var(--ui-flip-height) * 10)) rotateX(10deg); }
    90% { transform: perspective(calc(var(--ui-flip-height) * 10)) rotateX(-5deg); }
    to { transform: perspective(calc(var(--ui-flip-height) * 10)) rotateX(0deg); }
}

@keyframes ui-flip-horizontal {
    from { transform: perspective(calc(var(--ui-flip-width) * 10)) rotateY(90deg); }
    40% { transform: perspective(calc(var(--ui-flip-width) * 10)) rotateY(-20deg); }
    70% { transform: perspective(calc(var(--ui-flip-width) * 10)) rotateY(10deg); }
    90% { transform: perspective(calc(var(--ui-flip-width) * 10)) rotateY(-5deg); }
    to { transform: perspective(calc(var(--ui-flip-width) * 10)) rotateY(0deg); }
}

/* The line holds through the whole loop, so the trough is lit too: a glow alone, 2px at its
   lowest, drew next to nothing there on a light page, and the loop read as a faint flicker.

   In the accent, which is this layer's colour, written out rather than as currentColor:
   Chromium does not interpolate a shadow whose colour is derived from currentColor, by
   rgb(from) or color-mix(). It holds the first value to halfway and jumps — measured; Firefox
   and WebKit interpolate it. */
@keyframes ui-neon {
    from {
        box-shadow:
            0 0 0 1px var(--ui-color-accent),
            0 0 6px 1px rgb(from var(--ui-color-accent) r g b / 0.7),
            0 0 16px 3px rgb(from var(--ui-color-accent) r g b / 0.35);
    }
    to {
        box-shadow:
            0 0 0 1px var(--ui-color-accent),
            0 0 12px 3px var(--ui-color-accent),
            0 0 40px 10px rgb(from var(--ui-color-accent) r g b / 0.5);
    }
}

/* From where an even count of rounds leaves the neon, to the keyframe it leaves out, which is
   the layer's own: the theme's glow, or nothing. */
@keyframes ui-neon-rest {
    from {
        box-shadow:
            0 0 0 1px var(--ui-color-accent),
            0 0 6px 1px rgb(from var(--ui-color-accent) r g b / 0.7),
            0 0 16px 3px rgb(from var(--ui-color-accent) r g b / 0.35);
    }
}

@keyframes ui-breathe {
    from { scale: 1; }
    to { scale: 1.06; }
}

/* From no light at all, so a loop that settles on an even count leaves the layer on the theme's
   own glow, with nothing to jump back to. */
@keyframes ui-breathe-glow {
    from {
        --ui-breath: 0;
    }
    to {
        --ui-breath: 1;
    }
}

/* The image is two and a half widths long with the band in its middle, so 150% starts the
   band wholly off the left edge and -50% ends it wholly off the right. */
@keyframes ui-shimmer {
    from { background-position: 150% 0; }
    to { background-position: -50% 0; }
}

@keyframes ui-orbit {
    to { --ui-orbit: 360deg; }
}

@keyframes ui-rest {
    to { opacity: 0; }
}

@keyframes ui-beacon {
    from {
        box-shadow: 0 0 0 2px rgb(from var(--ui-color-focus) r g b / 0.55);
    }
    to {
        box-shadow: 0 0 0 12px rgb(from var(--ui-color-focus) r g b / 0);
    }
}
`;

prototype({
    tags: ['ui-button'],
    sheet,
    moments: [
        {
            name: 'press',
            label: 'Press',
            on: 'press',
            kinds: [
                {
                    name: 'move',
                    label: 'Movement',
                    effects: [
                        { name: 'none', today: true, says: 'Stays where it is.' },
                        { name: 'squish', says: 'Shrinks while held and springs back on release.' },
                        {
                            name: 'spring',
                            says: 'Pressed in while held; let go, it overshoots and settles on a spring.',
                        },
                        {
                            name: 'heartbeat',
                            says: 'Beats twice, the second smaller.',
                            fire: play('heartbeat', 'move'),
                        },
                        {
                            name: 'rubber',
                            says: 'Stretches and settles, like something soft that was hit.',
                            fire: play('rubber', 'move'),
                        },
                        {
                            name: 'flip-vertical',
                            says: 'Turns in from edge-on, top over bottom, swings past its face and settles.',
                            fire: flip('flip-vertical'),
                        },
                        {
                            name: 'flip-horizontal',
                            says: 'Turns in from edge-on, side over side, swings past its face and settles.',
                            fire: flip('flip-horizontal'),
                        },
                        {
                            name: 'glitch',
                            says: 'The label jumps and splits into two colours. Drawn for the Matrix theme.',
                            fire: play('glitch', 'move'),
                        },
                        {
                            name: 'shatter',
                            says: 'Breaks into pieces, smallest where it was pressed, held a little apart until let go.',
                            fire: shatter(shards),
                        },
                        {
                            name: 'split',
                            says: 'Breaks in two where it was pressed, the halves held a little apart until let go.',
                            fire: shatter(halves),
                        },
                    ],
                },
                {
                    name: 'fill',
                    label: 'Fill',
                    effects: [
                        {
                            name: 'highlight',
                            today: true,
                            says: 'Takes the pressed colour, at once.',
                        },
                        { name: 'none', says: 'Keeps its colour while held.' },
                        {
                            name: 'ripple',
                            says: 'A circle spreads from where the pointer went down, or from the centre for a key.',
                            fire: ripple,
                        },
                        {
                            name: 'scan',
                            says: 'A band of light crosses the button, top to bottom.',
                            fire: play('scan', 'fill'),
                        },
                    ],
                },
                {
                    name: 'shadow',
                    label: 'Shadow',
                    effects: [
                        {
                            name: 'none',
                            today: true,
                            says: 'The theme’s own glow, where it gives one.',
                        },
                        {
                            name: 'burst',
                            says: 'Light bursts out around the button and fades.',
                            fire: play('burst', 'shadow', 'host'),
                        },
                        {
                            name: 'raise',
                            says: 'Stands off the page while held, a shadow dropping under it.',
                        },
                        {
                            name: 'sink',
                            says: 'Sinks into the page while held, its shadow gone inside.',
                        },
                        {
                            name: 'sparks',
                            says: 'Sparks of the accent fly out from the edge all round and fade.',
                            fire: sparks,
                        },
                        {
                            name: 'beams',
                            says: 'Beams of light shoot out from the edge all round, like lasers, and are gone.',
                            fire: beams,
                        },
                        {
                            name: 'confetti',
                            says: 'Confetti in the theme’s colours bursts up from the button and flutters down.',
                            fire: confetti,
                        },
                        {
                            name: 'fragments',
                            says: 'Chips of the theme’s colour, of every shape and size, fly off the edge all round, spinning, and fade.',
                            fire: fragments,
                        },
                    ],
                },
                {
                    name: 'border',
                    label: 'Border',
                    effects: [
                        { name: 'none', today: true, says: 'The edge the theme draws.' },
                        {
                            name: 'pulse',
                            says: 'A ring leaves the edge and fades.',
                            fire: play('pulse', 'border'),
                        },
                        {
                            name: 'explode',
                            says: 'A thick ring is thrown far out from the edge, blurring as it goes; the button stays.',
                            fire: play('explode', 'border'),
                        },
                        {
                            name: 'shockwave',
                            says: 'A thin circle ripples out from under the button, half as far again as the explode’s ring, and fades.',
                            fire: wave('shockwave'),
                        },
                        {
                            name: 'bloom',
                            says: 'A filled disc ripples out from under the button, half as far again as the explode’s ring, and fades.',
                            fire: wave('bloom'),
                        },
                    ],
                },
            ],
        },
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
                        { name: 'lift', says: 'Rises two pixels.' },
                        { name: 'zoom', says: 'Grows a little.' },
                        {
                            name: 'magnetic',
                            follows: true,
                            says: 'Leans a few pixels toward the pointer as it nears.',
                        },
                        {
                            name: 'tilt',
                            follows: true,
                            says: 'Turns toward the pointer in depth; with the fill’s spotlight, it catches the light where the pointer is.',
                        },
                        {
                            name: 'breathe',
                            loops: true,
                            says: 'Swells and settles; with the shadow’s breathe, a glow comes and goes with it.',
                        },
                        {
                            name: 'heartbeat',
                            says: 'Once, as the pointer arrives: two beats.',
                            fire: play('heartbeat', 'move'),
                        },
                        {
                            name: 'rubber',
                            says: 'Once, as the pointer arrives: stretches and settles.',
                            fire: play('rubber', 'move'),
                        },
                        {
                            name: 'flip-vertical',
                            says: 'Once, as the pointer arrives: turns in from edge-on, top over bottom.',
                            fire: flip('flip-vertical'),
                        },
                        {
                            name: 'flip-horizontal',
                            says: 'Once, as the pointer arrives: turns in from edge-on, side over side.',
                            fire: flip('flip-horizontal'),
                        },
                        {
                            name: 'glitch',
                            says: 'Once, as the pointer arrives: the label jumps and splits. Drawn for Matrix.',
                            fire: play('glitch', 'move'),
                        },
                    ],
                },
                {
                    name: 'fill',
                    label: 'Fill',
                    effects: [
                        { name: 'highlight', today: true, says: 'Takes the hover colour.' },
                        { name: 'none', says: 'Keeps its own colour.' },
                        {
                            name: 'spotlight',
                            follows: true,
                            says: 'A light under the pointer, fading with distance.',
                        },
                        {
                            name: 'flood',
                            fire: flood,
                            says: 'The hover colour spreads from where the pointer came in, and drains toward where it leaves.',
                        },
                        {
                            name: 'shimmer',
                            loops: true,
                            says: 'A sheen sweeps across, and comes round again.',
                        },
                        {
                            name: 'ripple',
                            says: 'Once, as the pointer arrives: a circle spreads from where it came in.',
                            fire: ripple,
                        },
                        {
                            name: 'scan',
                            says: 'Once, as the pointer arrives: a band of light crosses the button.',
                            fire: play('scan', 'fill'),
                        },
                    ],
                },
                {
                    name: 'shadow',
                    label: 'Shadow',
                    effects: [
                        {
                            name: 'highlight',
                            today: true,
                            says: 'The glow the theme gives the pointer: Matrix’s ring goes solid and its glow doubles. The default theme and Glass give the button none, so under them it changes nothing.',
                        },
                        {
                            name: 'none',
                            says: 'The glow the theme gives at rest, where it gives one.',
                        },
                        {
                            name: 'raise',
                            says: 'Stands off the page, a shadow dropping under it.',
                        },
                        {
                            name: 'sink',
                            says: 'Sinks into the page, its shadow gone inside.',
                        },
                        {
                            name: 'neon',
                            loops: true,
                            says: 'A lit line round the edge, its glow swelling to a wide halo and back.',
                        },
                        {
                            name: 'breathe',
                            loops: true,
                            says: 'A glow that comes and goes; with the movement’s breathe, the button swells with it.',
                        },
                        {
                            name: 'burst',
                            says: 'Once, as the pointer arrives: light bursts out around the button.',
                            fire: play('burst', 'shadow', 'host'),
                        },
                    ],
                },
                {
                    name: 'border',
                    label: 'Border',
                    effects: [
                        {
                            name: 'highlight',
                            today: true,
                            says: 'The edge takes the colour the theme gives the pointer: Glass’s faint edge goes solid. The default theme and Matrix give none, so under them it changes nothing.',
                        },
                        { name: 'none', says: 'The edge the theme draws at rest.' },
                        {
                            name: 'edge',
                            follows: true,
                            says: 'A band of the edge lights up where the pointer is nearest.',
                        },
                        {
                            name: 'orbit',
                            settles: true,
                            says: 'A light runs round the edge itself, four times, then rests — the card’s.',
                        },
                        {
                            name: 'trace',
                            says: 'The edge is drawn round once, from the top, and undrawn as the pointer leaves.',
                        },
                        {
                            name: 'comet',
                            loops: true,
                            says: 'A comet of light runs round just outside the edge, and waits where it was when the pointer leaves.',
                        },
                        {
                            name: 'pulse',
                            says: 'Once, as the pointer arrives: a ring leaves the edge.',
                            fire: play('pulse', 'border'),
                        },
                        {
                            name: 'shockwave',
                            says: 'Once, as the pointer arrives: a thin circle ripples far out from under the button.',
                            fire: wave('shockwave'),
                        },
                        {
                            name: 'bloom',
                            says: 'Once, as the pointer arrives: a filled disc ripples far out from under the button.',
                            fire: wave('bloom'),
                        },
                    ],
                },
            ],
        },
        {
            name: 'focus',
            label: 'Focus',
            on: 'focus',
            kinds: [
                {
                    name: 'move',
                    label: 'Movement',
                    effects: [
                        { name: 'none', today: true, says: 'Stays where it is.' },
                        {
                            name: 'lift',
                            says: 'Stands two pixels up, ring and all, while it has the focus.',
                        },
                        {
                            name: 'breathe',
                            settles: true,
                            says: 'Swells and settles, four times, then rests.',
                        },
                        {
                            name: 'heartbeat',
                            says: 'As focus arrives: two beats.',
                            fire: play('heartbeat', 'move'),
                        },
                        {
                            name: 'rubber',
                            says: 'As focus arrives: stretches and settles.',
                            fire: play('rubber', 'move'),
                        },
                        {
                            name: 'flip-vertical',
                            says: 'As focus arrives: turns in from edge-on, top over bottom, ring and all.',
                            fire: flip('flip-vertical'),
                        },
                        {
                            name: 'flip-horizontal',
                            says: 'As focus arrives: turns in from edge-on, side over side, ring and all.',
                            fire: flip('flip-horizontal'),
                        },
                        {
                            name: 'glitch',
                            says: 'As focus arrives: the label jumps and splits. Drawn for Matrix.',
                            fire: play('glitch', 'move'),
                        },
                    ],
                },
                {
                    name: 'fill',
                    label: 'Fill',
                    effects: [
                        { name: 'none', today: true, says: 'The button’s own colour.' },
                        {
                            name: 'shimmer',
                            settles: true,
                            says: 'A sheen sweeps across, four times, then rests.',
                        },
                        {
                            name: 'ripple',
                            says: 'As focus arrives: a circle spreads from the middle.',
                            fire: ripple,
                        },
                        {
                            name: 'scan',
                            says: 'As focus arrives: a band of light crosses the button.',
                            fire: play('scan', 'fill'),
                        },
                    ],
                },
                {
                    name: 'shadow',
                    label: 'Shadow',
                    effects: [
                        {
                            name: 'none',
                            today: true,
                            says: 'The theme’s own glow, where it gives one.',
                        },
                        {
                            name: 'raise',
                            says: 'Stands off the page while it has the focus, a shadow dropping under it.',
                        },
                        {
                            name: 'neon',
                            settles: true,
                            says: 'A lit line round the edge, its glow swelling to a wide halo, four times, then rests.',
                        },
                        {
                            name: 'breathe',
                            settles: true,
                            says: 'A glow that comes and goes, four times, then rests.',
                        },
                        {
                            name: 'burst',
                            says: 'As focus arrives: light bursts out around the button.',
                            fire: play('burst', 'shadow', 'host'),
                        },
                    ],
                },
                {
                    name: 'border',
                    label: 'Border',
                    effects: [
                        { name: 'none', today: true, says: 'The ring, drawn at once.' },
                        {
                            name: 'beacon',
                            says: 'The ring at once, then a wave that spreads past it and fades.',
                            fire: play('beacon', 'border'),
                        },
                        {
                            name: 'explode',
                            says: 'As focus arrives: a thick ring is thrown far out past the focus ring.',
                            fire: play('explode', 'border'),
                        },
                        {
                            name: 'shockwave',
                            says: 'As focus arrives: a thin circle ripples far out past the focus ring.',
                            fire: wave('shockwave'),
                        },
                        {
                            name: 'bloom',
                            says: 'As focus arrives: a filled disc ripples far out past the focus ring.',
                            fire: wave('bloom'),
                        },
                        {
                            name: 'orbit',
                            settles: true,
                            says: 'A light runs round the edge, inside the focus ring, four times, then rests.',
                        },
                        {
                            name: 'comet',
                            settles: true,
                            says: 'A comet runs round outside the focus ring, four laps, then fades.',
                        },
                    ],
                },
            ],
        },
    ],
    refused: [
        {
            name: 'none, of the focus ring',
            why: 'the ring is where the reader is, not motion: a focus nobody can see is the commonest way a control stops being usable by keyboard, so every focus effect adds to the ring and none takes it away.',
        },
        {
            name: 'squish, on focus',
            why: 'it is the press being held; a focus has nothing held to answer.',
        },
        {
            name: 'pulse, on focus',
            why: 'the beacon is its form there: in the focus colour, and leaving from the focus ring rather than from the edge the ring would cover.',
        },
        {
            name: 'spotlight, magnetic and tilt, on focus',
            why: 'they follow a pointer, and a focus that arrives by keyboard has none.',
        },
        {
            name: 'shake',
            why: 'answering an error by moving the button the reader is still pointing at; the reference measures what that costs on a field, and the button is the same target.',
        },
        {
            name: 'flash',
            why: 'the whole button drops to 30% twice, label included: the reference’s alert, and a press is not one. WCAG 2.3.1 is not the reason — a button is small enough to pass on area however often it is pressed.',
        },
        {
            name: 'bounce',
            why: 'an entrance: it starts the button 100px up and transparent, so a press would take it from under the pointer to drop it back in. That is an arrival, and a press is not one.',
        },
        {
            name: 'spin',
            why: 'on hover, a turning button says it is busy, and the one under the pointer is waiting to be pressed.',
        },
        {
            name: 'move',
            why: 'carries the target 50px out from under the pointer resting on it.',
        },
        {
            name: 'swing',
            why: 'swings the label 20° either way for as long as the pointer rests, so the target never holds still.',
        },
        {
            name: 'blink',
            why: 'drops the button, label and all, to 20% once a second while the pointer rests.',
        },
        {
            name: 'colour cycle',
            why: 'turns the fill the reference’s blue, red and green under a label that stays white: 3.15, 3.82 and 2.10 to 1, all three under the 4.5 the label owes.',
        },
        {
            name: 'rainbow',
            why: 'a hue rotation keeps the fill’s lightness only roughly: the primary’s white label falls to 3.79:1 at 120°, and is under 4.5:1 for about two fifths of every turn — measured in three engines.',
        },
        {
            name: 'smoke',
            why: 'blurs the label of the button the reader is about to press.',
        },
        {
            name: 'jelly',
            why: 'as a loop, a 15° skew that never settles under a resting pointer; once, it is the rubber.',
        },
        {
            name: 'coin',
            why: 'turns the label edge-on every one and a half seconds while the pointer rests.',
        },
        {
            name: 'embolden',
            why: 'the label growing bolder under the pointer: weight is width, the reference says of its own, so the button widens and moves what is beside it.',
        },
        {
            name: 'typing',
            why: 'takes the label away and types it back, again and again, while the reader is deciding whether to press it.',
        },
    ],
});

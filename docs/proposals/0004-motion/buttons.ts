/**
 * What a button can do, shared by the button's page and the menu's — `ui-button`, and the trigger
 * `ui-menu` renders, which is a secondary button written out: what a press, the pointer and focus
 * can each do.
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
 *
 * **The menu's host holds more than its button.** Its panel is in it too, and in Firefox the
 * host's own `:hover` and `:active` take the panel in: drawn off them, the trigger's raise and its
 * trace held while the pointer was in the panel, and an item's press put the border's layer out —
 * measured. So the layers drawn on the menu's host are drawn off the page's record of the pointer
 * on the trigger instead, which a component would set as a custom state.
 */
import { reference } from '../../../src/reference.js';
import {
    aside,
    breathe,
    centres,
    comet,
    edge,
    far,
    flooded,
    floods,
    flights,
    focal,
    glass,
    lights,
    line,
    moves,
    orbit,
    rainbow,
    ringRules,
    ripple,
    scan,
    sheen,
    shimmer,
    sized,
    spot,
    sweeps,
    thrown,
    tinted,
    trace,
    waves,
} from './controls.js';
import { focus, hover } from './moments.js';
import {
    attributes,
    duration,
    easing,
    inner,
    queries,
    replay,
    still,
    type Firing,
    type Moment,
    type Refusal,
} from './motion.js';

/** A button's variant, which its fill and the lights drawn over it are coloured by. */
type Variant = 'primary' | 'secondary';

/** One page's buttons, as the sheet draws on them. */
export interface Buttons {
    /** The button the component renders, by its variant: `ui-button`'s primary and secondary, and
     *  the menu's trigger, which is a secondary. */
    readonly variants: Partial<Readonly<Record<Variant, string>>>;
    /** The host's record of the pointer on its button, where the host holds more than the
     *  button; a press is the record and `:active`. Without one, the host's own `:hover` and
     *  `:active`. */
    readonly hovered?: string;
    /** The host while the button it renders is filled, `ui-button`'s primary, which the trace is
     *  drawn over in a colour moved off the fill. */
    readonly filled?: string;
}

/** What each variant draws its fill in, at rest, under the pointer and pressed, and the ink and
 *  the sheen drawn over it, as the component colours it. */
const colours = {
    primary: {
        rest: reference('--ui-color-primary').cssText,
        hover: reference('--ui-color-primary-hover').cssText,
        pressed: reference('--ui-color-primary-pressed').cssText,
        ink: reference('--ui-color-primary-contrast').cssText,
        sheen: sheen.on(reference('--ui-color-primary').cssText),
        tint: reference('--ui-color-primary-hover').cssText,
    },
    secondary: {
        rest: reference('--ui-color-surface-control').cssText,
        hover: reference('--ui-color-hover').cssText,
        pressed: reference('--ui-color-pressed').cssText,
        ink: reference('--ui-color-text').cssText,
        sheen: sheen.over,
        tint: tinted(reference('--ui-color-surface-control').cssText),
    },
} as const;

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
const spread = ({ host, event }: Firing): void => {
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

    target.style.setProperty('--ui-ripple-x', `${x.toFixed(1)}px`);
    target.style.setProperty('--ui-ripple-y', `${y.toFixed(1)}px`);
    replay(target, 'ripple', 'data-fill');
};

/** Throws a circle out from under the button, from the host's layer: the shared measure, taken
 *  of the button the component renders. */
const wave = waves(
    (host) => inner(host, 'button'),
    (host) => host,
);

/** Publishes where the pointer came onto the button and where it leaves it, for the flood: the
 *  card's, held to the button's box, with the leaving read off the button rather than off the
 *  host, which on the menu holds the panel too. */
const flood = floods(
    (host) => inner(host, 'button'),
    (host) => inner(host, 'button'),
);

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

/** The breathe's own light, in the layer's colour, as strong as its registered progress. */
const breath = lights.breath('currentColor', '15px');

/** The orbit's band, on the edge from its outer side in, and never past it. */
const onEdge = String.raw`
        content: '';
        position: absolute;
        inset: 0;
        padding: ${orbit.width}px;
        border-radius: var(--ui-radius);
        background: ${orbit.light};
        mask:
            linear-gradient(#000 0 0) content-box exclude,
            linear-gradient(#000 0 0);
        pointer-events: none;`;

/** What moves the button, on the button's own transitions, for a layer held where the button is:
 *  the scale's on `--ui-scale-time`, which the press's spring sets as it sets the button's. */
const moving = String.raw`scale var(--ui-scale-time),
            translate var(--ui-duration-200) var(--ui-easing-enter),
            transform var(--ui-duration-100) linear`;

/** The trace's band, the orbit's, on the edge from its outer side in, moving as the button moves,
 *  on the button's own transitions. */
const traced = String.raw`
        content: '';
        position: absolute;
        inset: 0;
        padding: ${trace.width}px;
        border-radius: var(--ui-band-radius, var(--ui-radius));
        background: ${trace.light};
        mask:
            linear-gradient(#000 0 0) content-box exclude,
            linear-gradient(#000 0 0);
        pointer-events: none;
        transition:
            ${trace.transition},
            ${moving};`;

/** The rainbow's band, the trace's, whole, in the trace's colour turned round the hue wheel. */
const turning = String.raw`
        content: '';
        position: absolute;
        inset: 0;
        padding: ${trace.width}px;
        border-radius: var(--ui-band-radius, var(--ui-radius));
        background: ${rainbow.colour(`var(--ui-band-ink, ${far})`)};
        mask:
            linear-gradient(#000 0 0) content-box exclude,
            linear-gradient(#000 0 0);
        pointer-events: none;`;

/** The comet's band, clear of the edge, over where the focus ring is drawn. */
const clear = String.raw`
        content: '';
        position: absolute;
        inset: -${comet.reach}px;
        padding: ${comet.width}px;
        border-radius: calc(var(--ui-radius) + ${comet.reach}px);
        background: ${comet.light};
        mask:
            linear-gradient(#000 0 0) content-box exclude,
            linear-gradient(#000 0 0);
        pointer-events: none;`;

/** The edge's band, the orbit's, on the edge from its outer side in, lit by `light`. */
const edged = (light: string): string => String.raw`
        content: '';
        position: absolute;
        inset: 0;
        padding: ${edge.width}px;
        border-radius: var(--ui-band-radius, var(--ui-radius));
        background: ${light};
        mask:
            linear-gradient(#000 0 0) content-box exclude,
            linear-gradient(#000 0 0);
        pointer-events: none;`;

/** The focus's orbit, the pointer's, three laps, then it fades. */
const focusOrbit = String.raw`${onEdge}
        opacity: 1;
        animation: ${focal.run(orbit.run)};
        transition: ${moving};`;

/** The focus's comet, the pointer's, two laps, then it fades. */
const focusComet = String.raw`${clear}
        opacity: 1;
        animation: ${focal.run(comet.run)};
        transition: ${moving};`;

/** The orbit's laps and the fade it rests by, and the rainbow's turns. */
const laps = String.raw`
@keyframes ui-orbit {
    to { --ui-orbit: 360deg; }
}

@keyframes ui-rest {
    to { opacity: 0; }
}
${rainbow.frames}`;

/** The shimmer's sheen, in the button's own colour for it. */
const sheened = String.raw`
        background-image: ${shimmer.image('var(--ui-sheen)')};
        background-size: ${shimmer.size};
        background-repeat: no-repeat;
        background-position: ${shimmer.position};`;

/** The focus's sheen, swept across four times, then at rest before the button's start. */
const focusShimmer = String.raw`${sheened}
        animation: ${focal.run(shimmer.run)};`;

/**
 * The sheet as one page's buttons carry it, under the name the component asks for its tastes by:
 * the button's `--ui-taste-button-<moment>`, the menu's `--ui-taste-menu-<moment>`.
 */
export function sheet({ variants, hovered, filled }: Buttons, name: string): string {
    /** The query each effect is drawn under: the consumer's choice, else the theme's taste. */
    const is = queries(name);

    /** The host while the pointer is on the button, while a pointer presses it, and while a
     *  pointer presses it and is still on it. */
    const pointed = hovered ?? ':hover';
    const pressed = hovered === undefined ? ':active' : `${hovered}:active`;
    const held = hovered === undefined ? ':hover:active' : `${hovered}:active`;

    /** What the pointer's effects are drawn on: a button without a focus the reader can see, and
     *  a host whose record says there is none, since they yield to it. Under :where(), so each
     *  weighs what it did, under a press, which is drawn over the pointer and the focus alike. */
    const unfocused = ':where(:not(:focus-visible))';
    const calm = ':where(:not([data-focus-visible]))';

    /** The variants the component renders, each with its selector. */
    const drawn = (['primary', 'secondary'] as const).flatMap((variant) => {
        const selector = variants[variant];

        return selector === undefined ? [] : [[variant, selector] as const];
    });

    /** Every variant's selector, each followed by the same. */
    const every = (after = ''): string =>
        drawn.map(([, selector]) => `${selector}${after}`).join(',\n');

    /** A rule for each variant, its block written for that variant. */
    const each = (block: (variant: Variant) => string): string =>
        drawn.map(([variant, selector]) => `${selector}${block(variant)}`).join('\n\n');

    /** The pointer's borders that hold the edge's layer while the pointer rests on the button. */
    const pointerBorder = `(${is('hover-border', 'edge')} or ${is('hover-border', 'orbit')} or ${is('hover-border', 'trace')} or ${is('hover-border', 'comet')} or ${is('hover-border', 'underline')} or ${is('hover-border', 'sweep')} or ${is('hover-border', 'rainbow')})`;

    /** The focus's borders that hold the same layer while the focus stays. */
    const focusBorder = `(${is('focus-border', 'edge')} or ${is('focus-border', 'orbit')} or ${is('focus-border', 'trace')} or ${is('focus-border', 'comet')} or ${is('focus-border', 'underline')} or ${is('focus-border', 'sweep')} or ${is('focus-border', 'rainbow')})`;

    /** The pointer's shadows that light the layer a theme draws its glow on, the focus's, and the
     *  halo and the glow drawn there, each as strong as a number of its own. */
    const pointerLight = `(${is('hover-shadow', 'halo')} or ${is('hover-shadow', 'glow')})`;
    const focusLight = `(${is('focus-shadow', 'halo')} or ${is('focus-shadow', 'glow')})`;
    const lit = `${lights.shown.halo('var(--ui-shown-halo)')}, ${lights.shown.glow('var(--ui-shown-glow)')}`;

    return String.raw`
/* Every property the movement moves, transitioned once, and the blur's glass, on the fill's
   length and curve, which the list's fifth entry takes. Nothing here moves until an effect asks it
   to, so with no choice the button does what it does today. The transform's short linear step
   only smooths the tilt between the pointer engine's frames.

   Isolated, so the fill's layer can sit under the label and still over the button's own fill. */
button {
    isolation: isolate;
    transition-property: background-color, scale, translate, transform, backdrop-filter;
    transition-duration: ${reference('--ui-duration-state')}, var(--ui-duration-200), var(--ui-duration-200), var(--ui-duration-100);
    transition-timing-function: var(--ui-easing-state), var(--ui-easing-emphasis), var(--ui-easing-enter), linear;
}

/* The border's containing block. Not under the border's queries: a :host rule there would miss
   a choice made on the host itself — S8 — and the border would be placed against the page.
   Isolated, so the circles drawn under the button stay over whatever the page put under it. The
   give its beats take is its own, whatever holds it: a card's, a quarter, is inherited. */
:host {
    position: relative;
    isolation: isolate;
    --ui-scale-time: var(--ui-duration-200) var(--ui-easing-emphasis);
    --ui-give: 1;
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
${each(
    (variant) => String.raw`::after {
    --ui-ink: ${colours[variant].ink};
    --ui-sheen: ${colours[variant].sheen};
}`,
)}

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

/* The focus wins. A button the reader can see the focus on is drawn as the focus chose, and the
   pointer resting on it changes nothing, what the button does today under the pointer included —
   the hover colour, and the edge and the glow a theme gives the pointer: a reader who came by the
   keyboard may have left the pointer where it was. A press is drawn over both. The pointer's
   arrival on such a button fires nothing either, which the page's script holds back. */

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

    :host {
        --ui-scale-time: var(--ui-duration-400) ${spring};
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
    animation: ui-glitch var(--ui-duration-200) linear, var(--ui-run-ring, none);
}

/* heartbeat: two beats outward. It only grows, so the pointer that pressed it stays on it. */
button[data-move='heartbeat'] {
    animation: ui-heartbeat var(--ui-duration-300) var(--ui-easing-state), var(--ui-run-ring, none);
}

/* rubber squashes the button inside the shadow root and leaves the host's box where it was, so
   a release the squashed button no longer covers lands on the host, and the click a page
   listens for still arrives — measured in all three engines, with the press starting it. The
   native button misses that click; nothing outside it can tell. */
button[data-move='rubber'] {
    animation: ui-rubber var(--ui-duration-400) linear, var(--ui-run-ring, none);
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
    animation: ui-flip-vertical calc(var(--ui-duration-400) * 1.5) var(--ui-easing-enter), var(--ui-run-ring, none);
}

button[data-move='flip-horizontal'] {
    animation: ui-flip-horizontal calc(var(--ui-duration-400) * 1.5) var(--ui-easing-enter), var(--ui-run-ring, none);
}

/* hover-move: lift. Two pixels: the target moves under a pointer that is already on it, so the
   distance stays well inside the button.

   Every hover state here sits under hover: hover. A finger has no hover, and a tap leaves
   :hover on whatever it touched, so a state drawn without it — a loop above all — stays on a
   phone's button after the finger has gone. */
@media (hover: hover) {
    @container ${is('hover-move', 'lift')} {
        button:not(:disabled):hover${unfocused} {
            translate: 0 -2px;
        }
    }
}

/* hover-move: zoom. Grows a little under the pointer, which it only grows away from. */
@media (hover: hover) {
    @container ${is('hover-move', 'zoom')} {
        button:not(:disabled):hover${unfocused} {
            scale: 1.05;
        }
    }
}

/* hover-move: magnetic. Leans toward the pointer as it nears, a few pixels at most. */
@container ${is('hover-move', 'magnetic')} {
    button:not(:disabled)${unfocused} {
        translate: calc(var(--ui-pointer-nx) * var(--ui-pointer-near) * 6px)
            calc(var(--ui-pointer-ny) * var(--ui-pointer-near) * 4px);
    }
}

/* hover-move: tilt. Turns toward the pointer, up to 14°, and grows a little as it nears — the
   reference's 3D tilt, through the pointer engine. The light the reference's catches where the
   pointer is, is the fill's spotlight: the two together are the whole of it. */
@container ${is('hover-move', 'tilt')} {
    button:not(:disabled)${unfocused} {
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
        button:not(:disabled):not([data-move]):hover${unfocused} {
            animation: ${breathe.loop};
        }
    }
}

/* focus-move: lift and zoom. Two pixels up, or grown a little, ring and all, for as long as the
   focus stays. */
@container ${is('focus-move', 'lift')} {
    button:focus-visible {
        translate: 0 -2px;
    }
}

@container ${is('focus-move', 'zoom')} {
    button:focus-visible {
        scale: 1.05;
    }
}

/* The focus loops settle: four rounds and they rest, because a focus can stay for as long as
   the reader reads. */
@container ${is('focus-move', 'breathe')} {
    button:focus-visible:not([data-move]) {
        animation: ${focal.run(breathe.settle)}, var(--ui-run-ring, none);
    }
}

/* ——— The fill, on the button's ::after, under the label. ——— */

/* highlight: the hover colour under the pointer and the pressed colour while held, which is what
   the component does today and so what renders with no choice. The colours are named here so any
   other choice of the kind can take its one away: the pointer then leaves the resting colour, and
   a press leaves whatever the pointer or the focus gave, since a press is drawn over both, as it is
   over the pointer today. A press that brings no colour leaves its name unset, and the fill falls
   back. */
${each(
    (variant) => String.raw` {
    --ui-fill-rest: ${colours[variant].rest};
    --ui-fill-hover: ${colours[variant].hover};
    --ui-fill-pressed: ${colours[variant].pressed};
    --ui-fill-tint: ${colours[variant].tint};
}`,
)}

${every()} {
    --ui-fill-hovered: var(--ui-fill-hover);
    --ui-fill-focused: var(--ui-fill-rest);
}

@container ${is('hover-fill', 'none')} or ${is('hover-fill', 'spotlight')} or
    ${is('hover-fill', 'flood')} or ${is('hover-fill', 'shimmer')} or
    ${is('hover-fill', 'ripple')} or ${is('hover-fill', 'scan')} or
    ${is('hover-fill', 'blur')} {
    ${every()} {
        --ui-fill-hovered: var(--ui-fill-rest);
    }
}

/* tint: a little of the accent in the button's own fill, in the hover colour's place, over the
   secondary's surface as over a field's. The primary's fill is the accent already, so a little more
   of it left the fill as it was — measured, Matrix's #008f11 and #00ff00 under the pointer as at
   rest — and the primary takes its hover colour instead, a step toward the pole with room. */
@container ${is('hover-fill', 'tint')} {
    ${every()} {
        --ui-fill-hovered: var(--ui-fill-tint);
    }
}

/* highlight and tint at the focus: the hover colour, or the tint, while the focus stays, in the
   resting fill's place, which is the focus's with no choice. */
@container ${is('focus-fill', 'highlight')} {
    ${every()} {
        --ui-fill-focused: var(--ui-fill-hover);
    }
}

@container ${is('focus-fill', 'tint')} {
    ${every()} {
        --ui-fill-focused: var(--ui-fill-tint);
    }
}

@container ${is('press-fill', 'none')} or ${is('press-fill', 'ripple')} or
    ${is('press-fill', 'scan')} {
    ${every()} {
        --ui-fill-pressed: initial;
    }
}

${every(`:not(:disabled):hover${unfocused}`)} {
    background: var(--ui-fill-hovered);
}

/* As specific as the component's own colour under the pointer, which it is drawn over. */
${every(':not(:disabled):focus-visible')} {
    background: var(--ui-fill-focused);
}

${every(':not(:disabled):active')} {
    background: var(--ui-fill-pressed, var(--ui-fill-rest));
}

${every(`:not(:disabled):hover:active${unfocused}`)} {
    background: var(--ui-fill-pressed, var(--ui-fill-hovered));
}

${every(':not(:disabled):focus-visible:active')} {
    background: var(--ui-fill-pressed, var(--ui-fill-focused));
}

/* blur: a field's, the page behind the button blurred through the theme's glass, under the pointer
   or while the focus stays. Only Glass lets the page through a button, so only Glass has anything
   to blur; where there is no glass, nothing changes. Faded in on the button's own transitions. */
@media (hover: hover) {
    @container ${is('hover-fill', 'blur')} {
        button:not(:disabled):hover${unfocused} {
            backdrop-filter: ${glass};
        }
    }
}

@container ${is('focus-fill', 'blur')} {
    button:focus-visible {
        backdrop-filter: ${glass};
    }
}

/* ripple: from where the pointer went down for a press or came in for a hover, and from the
   middle for a key or a focus. */
button[data-fill='ripple']::after {
    background-image: ${ripple.image(ripple.ink('var(--ui-ink)'))};
    animation: ui-ripple var(--ui-duration-400) var(--ui-easing-enter);
}

/* scan: a band of light crossing the button, top to bottom. */
button[data-fill='scan']::after {
    background-image: ${scan.image('var(--ui-sheen)')};
    background-size: ${scan.size};
    background-repeat: no-repeat;
    background-position: ${scan.position};
    animation: ${scan.run};
}

/* hover-fill: spotlight. A light where the pointer is, fading with distance. It steps aside for
   the scan, and the ripple is drawn over it: one background-image, two layers, for as long as
   the ripple plays. At the focus, the light is in the middle, as strong as it gets. */
@container ${is('hover-fill', 'spotlight')} {
    button:not(:disabled):not([data-fill])${unfocused}::after {
        background-image: ${spot('var(--ui-ink)')};
    }

    button[data-fill='ripple']${unfocused}::after {
        background-image: ${ripple.image(ripple.ink('var(--ui-ink)'))}, ${spot('var(--ui-ink)')};
    }
}

@container ${is('focus-fill', 'spotlight')} {
    button:focus-visible:not([data-fill])::after {
        background-image: ${spot('var(--ui-ink)', '50% 50%', '1')};
    }

    button[data-fill='ripple']:focus-visible::after {
        background-image: ${ripple.image(ripple.ink('var(--ui-ink)'))}, ${spot('var(--ui-ink)', '50% 50%', '1')};
    }
}

/* hover-fill: shimmer. A sheen sweeps across and comes round again — the reference's skeleton
   loader, as a light rather than as a placeholder. */
@media (hover: hover) {
    @container ${is('hover-fill', 'shimmer')} {
        button:not(:disabled):not([data-fill]):hover${unfocused}::after {${sheened}
            animation: ${shimmer.loop};
        }
    }
}

/* hover-fill: flood. The hover colour spreads from where the pointer came in and drains toward
   where it leaves: in the highlight's place, the button keeps its resting fill under the pointer
   and the flood brings the hover colour, and the pressed one while it is held where the press
   brings it, so the label stands on the colours it stands on today. A circle drawn on the layer
   under the label rather than the card's clip: this layer also draws the edge and a theme's lift,
   which a clip would take away. The ripple and the scan are drawn over it. Its centre glides only
   where the script finds the circle showing, as the card's does. At the focus, from the middle,
   which the focus's arrival publishes, and back to it. */
@container ${is('hover-fill', 'flood')} or ${is('focus-fill', 'flood')} {
    button {
        --ui-flood-ink: var(--ui-fill-hover);
    }

    button:not(:disabled):active {
        --ui-flood-ink: var(--ui-fill-pressed, var(--ui-fill-hover));
    }

    button::after {
        background-image: ${flooded('var(--ui-flood-ink)')};
        transition: --ui-flood var(--ui-duration-400) var(--ui-easing-move);
    }

    button[data-gliding]::after {
        transition-property: --ui-flood, --ui-flood-x, --ui-flood-y;
    }

    button[data-fill='ripple']::after {
        background-image: ${ripple.image(ripple.ink('var(--ui-ink)'))}, ${flooded('var(--ui-flood-ink)')};
    }

    button[data-fill='scan']::after {
        background-image: ${scan.image('var(--ui-sheen)')}, ${flooded('var(--ui-flood-ink)')};
        background-size: ${scan.size}, 100% 100%;
        background-position: ${scan.position}, 0 0;
    }
}

@container ${is('hover-fill', 'flood')} {
    @media (hover: hover) {
        button:not(:disabled):hover${unfocused}::after {
            --ui-flood: 1;
        }
    }
}

@container ${is('focus-fill', 'flood')} {
    button:focus-visible::after {
        --ui-flood: 1;
    }
}

/* focus-fill: shimmer, on the layer the pointer's light is drawn on, which steps aside for it. */
@container ${is('focus-fill', 'shimmer')} {
    button:focus-visible:not([data-fill])::after {${focusShimmer}
    }
}

/* ——— The shadow, on the button's ::before, where a theme draws its glow. ——— */

/* highlight: the glow a theme gives the pointer, where it gives one — Matrix's ring goes solid
   and its glow doubles. What the component does today; any other choice of the kind keeps the
   glow the theme gives at rest. */
@container ${is('hover-shadow', 'none')} or ${is('hover-shadow', 'raise')} or
    ${is('hover-shadow', 'sink')} or ${is('hover-shadow', 'neon')} or
    ${is('hover-shadow', 'breathe')} or ${is('hover-shadow', 'burst')} or
    ${is('hover-shadow', 'halo')} or ${is('hover-shadow', 'glow')} or
    ${is('hover-shadow', 'inner')} or ${is('hover-shadow', 'cast')} {
    button:not(:disabled):hover${unfocused}::before {
        box-shadow: ${reference('--ui-elevation-control')};
    }
}

/* The glow a theme gives the pointer steps aside for the focus, which keeps the one at rest unless
   it chose the highlight: as specific as the component's own under the pointer, and before every
   shadow the focus draws on the layer. */
button:not(:disabled):focus-visible::before {
    box-shadow: ${reference('--ui-elevation-control')};
}

/* focus-shadow: highlight, the glow a theme gives the pointer, while the focus stays. */
@container ${is('focus-shadow', 'highlight')} {
    button:focus-visible:not([data-shadow])::before {
        box-shadow: ${reference('--ui-elevation-control-hover')};
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
        box-shadow: ${lights.raise};
        opacity: 0;
        transition: opacity var(--ui-duration-200) var(--ui-easing-enter);
    }
}

@media (hover: hover) {
    @container ${is('hover-shadow', 'raise')} {
        :host(${pointed}${calm}:not([disabled]):not([data-shadow]))::before {
            opacity: 1;
        }
    }
}

@container ${is('press-shadow', 'raise')} {
    :host(${pressed}:not([disabled]):not([data-shadow]))::before {
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
   the shadow takes the first of the button's lengths and curves, and the blur's glass, after it,
   the second. In at once for a press, as the pressed colour is; the flood's colour, where it is
   chosen too, is drawn over it. */
@container ${is('press-shadow', 'sink')} or ${is('hover-shadow', 'sink')} {
    button {
        transition-property: background-color, scale, translate, transform, box-shadow, backdrop-filter;
    }
}

@container ${is('press-shadow', 'sink')} {
    button:not(:disabled):active {
        box-shadow: ${lights.sink};
    }
}

@media (hover: hover) {
    @container ${is('hover-shadow', 'sink')} {
        button:not(:disabled):hover${unfocused} {
            box-shadow: ${lights.sink};
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
    :host(${held}:not([disabled]):not([data-shadow]))::before {
        opacity: 0;
        transition-duration: 0s;
    }
}

@container ${is('press-move', 'squish')} or ${is('press-move', 'spring')} {
    :host([data-pressed]:not([disabled]):not([data-border]))::after,
    :host(${held}:not([disabled]):not([data-border]))::after {
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
        button:not(:disabled):not([data-shadow]):hover${unfocused}::before {
            animation: ui-neon var(--ui-duration-loop) var(--ui-easing-state) var(--ui-iteration-loop) alternate;
        }
    }

    /* hover-shadow: breathe. A glow that comes and goes, the movement's breathe's other half. */
    @container ${is('hover-shadow', 'breathe')} {
        button:not(:disabled):not([data-shadow]):hover${unfocused}::before {
            box-shadow: var(--ui-glow), ${breath};
            animation: ui-breathe-glow var(--ui-duration-loop) var(--ui-easing-state) var(--ui-iteration-loop) alternate;
        }
    }

    @container ${is('hover-shadow', 'breathe')} and style(--ui-glow: none) {
        button:not(:disabled):not([data-shadow]):hover${unfocused}::before {
            box-shadow: ${breath};
        }
    }
}

/* halo and glow, a field's, and cast, the card's at half its size, added to the glow a theme gives
   the button at rest, on the layer the theme draws it on, as the breathe's light is. The cast
   follows the pointer as it nears, as the card's does, whether it is over the button or not, so it
   is drawn as strong as the pointer is near rather than under :hover.

   The halo and the glow fade as the breathe's light does, by their strength alone: a registered
   number each, so a light both moments chose holds from one to the other. Faded as a shadow, they
   took the theme's glow with them, since Chromium carried Matrix's, written from currentColor,
   through transparent for the length of the transition: the button's ring and glow went out as the
   pointer came and again as it left — measured. So the layer draws both wherever either moment
   chose one, at rest too, where neither has any strength. Where another shadow takes the layer, a
   light goes at once, as the theme's own glow under the pointer does. */
@container ${pointerLight} or ${focusLight} {
    button::before {
        box-shadow: var(--ui-glow), ${lit};
        transition:
            --ui-shown-halo var(--ui-duration-200) var(--ui-easing-enter),
            --ui-shown-glow var(--ui-duration-200) var(--ui-easing-enter);
    }
}

@container (${pointerLight} or ${focusLight}) and style(--ui-glow: none) {
    button::before {
        box-shadow: ${lit};
    }
}

${[
    ['hover', 'halo'],
    ['hover', 'glow'],
    ['focus', 'halo'],
    ['focus', 'glow'],
]
    .map(([moment = '', effect = '']) => {
        const state =
            moment === 'hover'
                ? `button:not(:disabled):not([data-shadow]):hover${unfocused}::before`
                : 'button:focus-visible:not([data-shadow])::before';

        return String.raw`@container ${is(`${moment}-shadow`, effect)} {
    ${state} {
        --ui-shown-${effect}: 1;
        box-shadow: var(--ui-glow), ${lit};
    }
}

@container ${is(`${moment}-shadow`, effect)} and style(--ui-glow: none) {
    ${state} {
        box-shadow: ${lit};
    }
}`;
    })
    .join('\n\n')}

@container ${is('hover-shadow', 'cast')} {
    button:not(:disabled):not([data-shadow])${unfocused}::before,
    button:not(:disabled):not([data-shadow]):hover${unfocused}::before {
        box-shadow: var(--ui-glow), ${lights.cast(0.5, 'var(--ui-pointer-near)')};
    }
}

@container ${is('hover-shadow', 'cast')} and style(--ui-glow: none) {
    button:not(:disabled):not([data-shadow])${unfocused}::before,
    button:not(:disabled):not([data-shadow]):hover${unfocused}::before {
        box-shadow: ${lights.cast(0.5, 'var(--ui-pointer-near)')};
    }
}

@container ${is('hover-shadow', 'inner')} or ${is('focus-shadow', 'inner')} or
    ${is('focus-shadow', 'sink')} {
    button {
        transition-property: background-color, scale, translate, transform, box-shadow, backdrop-filter;
    }
}

@media (hover: hover) {
    @container ${is('hover-shadow', 'inner')} {
        button:not(:disabled):hover${unfocused} {
            box-shadow: ${lights.inner('0.75rem', '0.125rem')};
        }
    }
}

@container ${is('focus-shadow', 'inner')} {
    button:focus-visible {
        box-shadow: ${lights.inner('0.75rem', '0.125rem')};
    }
}

/* The inner light over the primary's fill, in the accent moved off it, as the trace is: in the
   accent, over a fill that is the accent, none of it showed — measured. */
${
    filled === undefined
        ? ''
        : String.raw`@container ${is('hover-shadow', 'inner')} or ${is('focus-shadow', 'inner')} {
    :host(${filled}) {
        --ui-band-ink: ${trace.over(colours.primary.rest)};
    }
}`
}

@container ${is('focus-shadow', 'sink')} {
    button:focus-visible {
        box-shadow: ${lights.sink};
    }
}

/* focus-shadow: neon. Its last round ends on its lit line, so it fades from there to what the
   layer rests on instead of going out at once. */
@container ${is('focus-shadow', 'neon')} {
    button:focus-visible:not([data-shadow])::before {
        animation: ${focal.run('ui-neon var(--ui-duration-loop) var(--ui-easing-state) var(--ui-iteration-settle) alternate, ui-neon-rest var(--ui-duration-200) var(--ui-easing-exit) calc(var(--ui-duration-loop) * var(--ui-iteration-settle))')};
    }
}

@container ${is('focus-shadow', 'breathe')} {
    button:focus-visible:not([data-shadow])::before {
        box-shadow: var(--ui-glow), ${breath};
        animation: ${focal.run('ui-breathe-glow var(--ui-duration-loop) var(--ui-easing-state) var(--ui-iteration-settle) alternate')};
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
    ${is('hover-border', 'comet')} or ${is('hover-border', 'underline')} or
    ${is('hover-border', 'sweep')} or ${is('hover-border', 'pulse')} or
    ${is('hover-border', 'shockwave')} or ${is('hover-border', 'bloom')} or
    ${is('hover-border', 'explode')} or ${is('hover-border', 'rainbow')} {
    button:not(:disabled):hover${unfocused}::after {
        border-color: ${reference('--ui-color-border-button')};
    }
}

/* The colour a theme gives the pointer's edge steps aside for the focus, as its fill and its glow
   do, unless the focus chose the highlight: as specific as the component's own, and before the
   focus's highlight and accent. */
button:not(:disabled):focus-visible::after {
    border-color: ${reference('--ui-color-border-button')};
}

/* accent: the edge the component draws, in the accent, and over the primary's fill in the accent
   moved off it, as the trace is: the accent over the accent was no edge at all. */
@container ${is('hover-border', 'accent')} {
    button:not(:disabled):hover${unfocused}::after {
        border-color: var(--ui-band-ink, var(--ui-color-accent));
    }
}

/* hover-border: underline and sweep, the field's: a line of the accent along the bottom edge,
   drawn out from the middle or from where the label starts, on the layer the bands are drawn on. */
@container ${is('hover-border', 'underline')} or ${is('hover-border', 'sweep')} {
    :host::after {
        content: '';
        position: absolute;${line.drawn}
        pointer-events: none;
        clip-path: ${line.underline};
        transition:
            ${line.transition},
            ${moving};
    }

    @media (hover: hover) {
        :host(${pointed}${calm}:not([disabled]):not([data-border]))::after {
            clip-path: inset(0);
        }
    }
}

@container ${is('hover-border', 'sweep')} {
    :host::after {
        clip-path: ${line.sweep};
    }

    :host(:dir(rtl))::after {
        clip-path: ${line.mirrored};
    }
}

/* hover-border: edge. The card's: the orbit's band, on the edge from its outer side in, lit where
   the pointer is nearest, as near as the pointer engine finds it. Never on a disabled button,
   which the pointer engine measures all the same: the light is how near the pointer is, not
   whether it is over the button, so no :hover keeps it off. */
@container ${is('hover-border', 'edge')} {
    :host::after {${edged(edge.light)}
        opacity: 0;
        transition: ${moving};
    }

    :host(${calm}:not([disabled]))::after {
        opacity: var(--ui-pointer-near);
    }
}

/* hover-border: orbit. The card's: a light from the accent round the hue wheel runs round on the
   edge itself and never past it, three laps, and fades. A name means one effect wherever it is
   offered, so a choice made for the page — a theme's taste among them — orbits the card and the
   button alike. */
@container ${is('hover-border', 'orbit')} {
    :host::after {${onEdge}
        opacity: 0;
        transition:
            opacity var(--ui-duration-200) var(--ui-easing-exit),
            ${moving};
    }

    @media (hover: hover) {
        :host(${pointed}${calm}:not([disabled]):not([data-border]))::after {
            opacity: 1;
            animation: ${orbit.run};
        }
    }
}

/* hover-border: trace. The card's: the edge drawn round once, clockwise from the top, on the
   orbit's band, and undrawn the same way when the pointer leaves. */
@container ${is('hover-border', 'trace')} {
    :host::after {${traced}
    }

    @media (hover: hover) {
        :host(${pointed}${calm}:not([disabled]):not([data-border]))::after {
            --ui-trace: 360deg;
        }
    }
}

/* hover-border: rainbow. The trace's band, whole, over the edge the theme draws, its colour turned
   round the hue wheel for as long as the pointer rests: the fill and the label keep theirs, so the
   label keeps the contrast the reference's rainbow, turning the fill, took from it. In and out on
   the state's step. */
@container ${is('hover-border', 'rainbow')} {
    :host::after {${turning}
        opacity: 0;
        transition:
            opacity ${reference('--ui-duration-state')} ${reference('--ui-easing-state')},
            ${moving};
    }

    @media (hover: hover) {
        :host(${pointed}${calm}:not([disabled]):not([data-border]))::after {
            opacity: 1;
            animation: ${rainbow.loop};
        }
    }
}

/* hover-border: comet. A comet from the accent round the hue wheel runs round the button, 2px clear
   of its edge so it reads apart from any ring a theme draws there, while the pointer rests; the
   mask leaves only the 3px track. Paused rather than removed when the pointer leaves, so the next
   pass picks the comet up where this one left it, which is how the reference keeps a hover loop
   from jumping back to its start. */
@container ${is('hover-border', 'comet')} {
    :host::after {${clear}
        opacity: 0;
        transition:
            opacity var(--ui-duration-200) var(--ui-easing-state),
            ${moving};
        animation: ${comet.loop};
    }

    @media (hover: hover) {
        :host(${pointed}${calm}:not([disabled]):not([data-border]))::after {
            opacity: 1;
            animation-play-state: running;
        }
    }
}

/* focus-border: the bands. The host cannot see the focus: no engine lets a host match
   :focus-visible for the control in its shadow root, so it reads the attribute the harness sets
   for :state(focus-visible).

   Each is written under the focus alone, since it shares the layer with the pointer's band, which
   steps aside while the focus is there: written for the layer, the orbit stood in for Glass's edge
   under the pointer, a still arc where the light should have followed it, and the comet put
   Matrix's trace out, at its own inset — measured. Where both chose one band that holds, it is
   written alike for each, so it holds from one to the other.

   Where the pointer brings no band of its own, the focus's is the layer's at rest too, unseen, so
   the focus's lift moves it from where it was, and a line has somewhere to be undrawn from: drawn
   only as the focus arrived, it stood 2px up at once while the button rose on its transition —
   measured. */
@container ${is('focus-border', 'edge')} and (not ${pointerBorder}) {
    :host::after {${edged(edge.middle)}
        opacity: 0;
        transition:
            opacity var(--ui-duration-200) var(--ui-easing-enter),
            ${moving};
    }
}

@container ${is('focus-border', 'edge')} {
    :host([data-focus-visible]:not([data-border]))::after {${edged(edge.middle)}
        opacity: 1;
    }
}

@container ${is('focus-border', 'orbit')} and (not ${pointerBorder}) {
    :host::after {${onEdge}
        opacity: 0;
        transition: ${moving};
    }
}

@container ${is('focus-border', 'orbit')} {
    :host([data-focus-visible]:not([data-border]))::after {${focusOrbit}
    }
}

@container ${is('focus-border', 'comet')} and (not ${pointerBorder}) {
    :host::after {${clear}
        opacity: 0;
        transition: ${moving};
    }
}

@container ${is('focus-border', 'comet')} {
    :host([data-focus-visible]:not([data-border]))::after {${focusComet}
    }
}

@container ${is('focus-border', 'trace')} and (not ${pointerBorder}) {
    :host::after {${traced}
    }
}

@container ${is('focus-border', 'trace')} {
    :host([data-focus-visible]:not([data-border]))::after {${traced}
        opacity: 1;
        --ui-trace: 360deg;
    }
}

@container ${is('focus-border', 'rainbow')} and (not ${pointerBorder}) {
    :host::after {${turning}
        opacity: 0;
        transition:
            opacity var(--ui-duration-200) var(--ui-easing-enter),
            ${moving};
    }
}

@container ${is('focus-border', 'rainbow')} {
    :host([data-focus-visible]:not([data-border]))::after {${turning}
        opacity: 1;
        animation: ${focal.run(rainbow.run)};
    }
}

@container (${is('focus-border', 'underline')} or ${is('focus-border', 'sweep')}) and (not ${pointerBorder}) {
    :host::after {
        content: '';
        position: absolute;${line.drawn}
        pointer-events: none;
        clip-path: ${line.underline};
        transition:
            ${line.transition},
            ${moving};
    }
}

@container ${is('focus-border', 'sweep')} and (not ${pointerBorder}) {
    :host::after {
        clip-path: ${line.sweep};
    }

    :host(:dir(rtl))::after {
        clip-path: ${line.mirrored};
    }
}

@container ${is('focus-border', 'underline')} or ${is('focus-border', 'sweep')} {
    :host([data-focus-visible]:not([data-border]))::after {${line.drawn}
        opacity: 1;
        clip-path: inset(0);
    }
}

/* focus-border: highlight and accent, on the edge the component draws: the colour a theme gives the
   pointer, or the accent, moved off the primary's fill as the pointer's is, beside the ring. */
@container ${is('focus-border', 'highlight')} {
    button:not(:disabled):focus-visible::after {
        border-color: ${reference('--ui-color-border-button-hover')};
    }
}

@container ${is('focus-border', 'accent')} {
    button:not(:disabled):focus-visible::after {
        border-color: var(--ui-band-ink, var(--ui-color-accent));
    }
}

/* The trace and the edge over a fill, in the accent moved off it, and their corners drawn 2px
   tighter, so they reach past the fill's own: on the fill's corners exactly, the fill's antialiased
   curve showed round the line in the fill's colour, which the line moved off it stands apart from,
   in all three engines. 2px tighter, none of it showed in Chromium and WebKit, and a quarter of it
   in Firefox — measured. The straight edges are not moved, so nothing is drawn nearer the focus
   ring there. The accent's edge and the underline's line take the same colour over a fill. */
${
    filled === undefined
        ? ''
        : String.raw`@container ${is('hover-border', 'trace')} or ${is('focus-border', 'trace')} or
    ${is('hover-border', 'edge')} or ${is('hover-border', 'accent')} or
    ${is('focus-border', 'accent')} or ${is('hover-border', 'underline')} or
    ${is('focus-border', 'underline')} or ${is('hover-border', 'sweep')} or
    ${is('focus-border', 'sweep')} or ${is('hover-border', 'rainbow')} or
    ${is('focus-border', 'rainbow')} {
    :host(${filled}) {
        --ui-band-ink: ${trace.over(colours.primary.rest)};
        --ui-band-radius: max(0px, calc(var(--ui-radius) - 2px));
    }
}`
}

/* The layer the pointer and the focus draw their borders on is the button's edge, so it is drawn
   where the button is held, as a fired effect is: grown, raised, leaned toward the pointer and
   turned with it, on the button's own transitions, and breathing with it. At the host's size, each
   stayed where the button had been: the zoom grew the button past the trace and the orbit on its
   edge, which then stood inside it, and up to the comet clear of it. */
@container ${pointerBorder} or ${focusBorder} {
    @media (hover: hover) {
        @container ${is('hover-move', 'zoom')} {
            :host(${pointed}${calm}:not([disabled]):not([data-border]))::after {
                scale: 1.05;
            }
        }

        @container ${is('hover-move', 'lift')} {
            :host(${pointed}${calm}:not([disabled]):not([data-border]))::after {
                translate: 0 -2px;
            }
        }
    }

    @container ${is('hover-move', 'magnetic')} {
        :host(${calm}:not([disabled]):not([data-border]))::after {
            translate: calc(var(--ui-pointer-nx) * var(--ui-pointer-near) * 6px)
                calc(var(--ui-pointer-ny) * var(--ui-pointer-near) * 4px);
        }
    }

    @container ${is('hover-move', 'tilt')} {
        :host(${calm}:not([disabled]):not([data-border]))::after {
            transform: perspective(500px)
                rotateY(calc(var(--ui-pointer-nx) * var(--ui-pointer-near) * 14deg))
                rotateX(calc(var(--ui-pointer-ny) * var(--ui-pointer-near) * -14deg));
            scale: calc(1 + var(--ui-pointer-near) * 0.06);
        }
    }

    @container ${is('focus-move', 'lift')} {
        :host([data-focus-visible]:not([data-border]))::after {
            translate: 0 -2px;
        }
    }

    @container ${is('focus-move', 'zoom')} {
        :host([data-focus-visible]:not([data-border]))::after {
            scale: 1.05;
        }
    }
}

/* The breathe is an animation, which the layer runs beside the button's from the same moment, after
   the border's own, which it keeps: the orbit's laps go on, and the comet is still held where it
   was when the pointer leaves. At the focus, the focus's rounds, under its own names. */
@media (hover: hover) {
    @container ${is('hover-move', 'breathe')} {
        @container ${is('hover-border', 'edge')} or ${is('hover-border', 'trace')} or
            ${is('hover-border', 'underline')} or ${is('hover-border', 'sweep')} {
            :host(${pointed}${calm}:not([disabled]):not([data-border]))::after {
                animation: ${breathe.loop};
            }
        }

        @container ${is('hover-border', 'orbit')} {
            :host(${pointed}${calm}:not([disabled]):not([data-border]))::after {
                animation: ${orbit.run}, ${breathe.loop};
            }
        }

        @container ${is('hover-border', 'comet')} {
            :host(${pointed}${calm}:not([disabled]):not([data-border]))::after {
                animation: ${comet.loop}, ${breathe.loop};
                animation-play-state: running;
            }
        }

        @container ${is('hover-border', 'rainbow')} {
            :host(${pointed}${calm}:not([disabled]):not([data-border]))::after {
                animation: ${rainbow.loop}, ${breathe.loop};
            }
        }
    }
}

@container ${is('focus-move', 'breathe')} {
    @container ${is('focus-border', 'edge')} or ${is('focus-border', 'trace')} or
        ${is('focus-border', 'underline')} or ${is('focus-border', 'sweep')} {
        :host([data-focus-visible]:not([data-border]))::after {
            animation: ${focal.run(breathe.settle)};
        }
    }

    @container ${is('focus-border', 'orbit')} {
        :host([data-focus-visible]:not([data-border]))::after {
            animation: ${focal.run(`${orbit.run}, ${breathe.settle}`)};
        }
    }

    @container ${is('focus-border', 'comet')} {
        :host([data-focus-visible]:not([data-border]))::after {
            animation: ${focal.run(`${comet.run}, ${breathe.settle}`)};
        }
    }

    @container ${is('focus-border', 'rainbow')} {
        :host([data-focus-visible]:not([data-border]))::after {
            animation: ${focal.run(`${rainbow.run}, ${breathe.settle}`)};
        }
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
    --ui-thrown-ink: ${reference('--ui-color-border-button')};
    background: none;
    mask: none;
    pointer-events: none;
    opacity: 1;
    transition: none;
}

/* pulse: a ring leaving an edge decelerates, as the ripple does. On the exit curve, which
   accelerates, it stays under a pixel wide for its first quarter-second, and the press looks
   answered late — measured. In the accent for the pointer and a press, and for a focus in the
   ring's own colour, out across the ring and past it: the ring is drawn at once, as today, so the
   pulse only adds to it and never stands in for it. */
:host([data-border='pulse'])::after {
    animation: ui-pulse var(--ui-duration-400) var(--ui-easing-enter);
}

:host([data-border='pulse-focus'])::after {
    animation: ui-pulse-focus var(--ui-duration-400) var(--ui-easing-enter);
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
:host([data-border='explode'])::after {${thrown.explode}
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
:host([data-border='bloom'])::after {${thrown.dot}
}

:host([data-border='shockwave'])::after {${thrown.shockwave}
}

:host([data-border='bloom'])::after {${thrown.bloom}
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
   the button rests and moves as the button does: begun where the button was going, the pulse a
   focus sent out ran 2px above a button the focus was still lifting — measured. A press moves it at once,
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

:host([data-border]${pressed}:not([disabled]))::after,
:host([data-border][data-pressed]:not([disabled]))::after,
:host([data-shadow]${pressed}:not([disabled]))::before,
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
    :host([data-border]${calm}:not([disabled]))::after,
    :host([data-shadow]${calm}:not([disabled]))::before {
        translate: calc(var(--ui-pointer-nx) * var(--ui-pointer-near) * 6px)
            calc(var(--ui-pointer-ny) * var(--ui-pointer-near) * 4px);
    }
}

@container ${is('hover-move', 'tilt')} {
    :host([data-border]${calm}:not([disabled]))::after,
    :host([data-shadow]${calm}:not([disabled]))::before {
        transform: perspective(500px)
            rotateY(calc(var(--ui-pointer-nx) * var(--ui-pointer-near) * 14deg))
            rotateX(calc(var(--ui-pointer-ny) * var(--ui-pointer-near) * -14deg));
        scale: calc(1 + var(--ui-pointer-near) * 0.06);
    }
}

@media (hover: hover) {
    @container ${is('hover-move', 'lift')} {
        :host([data-border]${pointed}${calm}:not([disabled]))::after,
        :host([data-shadow]${pointed}${calm}:not([disabled]))::before {
            translate: 0 -2px;
        }
    }

    @container ${is('hover-move', 'zoom')} {
        :host([data-border]${pointed}${calm}:not([disabled]))::after,
        :host([data-shadow]${pointed}${calm}:not([disabled]))::before {
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

@container ${is('focus-move', 'zoom')} {
    :host([data-border][data-focus-visible])::after,
    :host([data-shadow][data-focus-visible])::before {
        scale: 1.05;
    }
}

@container ${is('press-move', 'squish')} {
    :host([data-border]${pressed}:not([disabled]))::after,
    :host([data-border][data-pressed]:not([disabled]))::after,
    :host([data-shadow]${pressed}:not([disabled]))::before,
    :host([data-shadow][data-pressed]:not([disabled]))::before {
        scale: 0.96;
    }
}

@container ${is('press-move', 'spring')} {
    :host([data-border]${pressed}:not([disabled]))::after,
    :host([data-border][data-pressed]:not([disabled]))::after,
    :host([data-shadow]${pressed}:not([disabled]))::before,
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

/* The ring's movements, in a property of their own that every rule animating the button lists
   beside its own animation, as a field's kinds are listed: an element plays one list, and the
   ring's written as the button's animation took the place of a movement fired on the focus's
   arrival, Matrix's glitch among them — measured. Under :where(), so where the button plays
   nothing else, the ring's plays alone, and anything else written for the button wins. */
:where(button:focus-visible) {
    animation: var(--ui-run-ring, none);
}

${ringRules(
    'button:focus-visible',
    is,
    'var(--ui-ring-ink, currentColor)',
    (query, run) => String.raw`@container ${query} {
    button:focus-visible {
        --ui-run-ring: ${run};
    }
}`,
)}

/* The inset ring, 2px inside the edge the reader sees, in a colour that stands off the fill and
   the edge both: the label's, which is the button's own colour. Where no theme colours the edge,
   each variant draws it in its own colour: a primary's is nothing, so its ring stands 2px off the
   fill's end, 4px in rather than 5, and a secondary's is its label's, so its ring takes the focus
   colour, as a field's does. The eye counts from the line it sees: 3px of fill read as farther in
   than 2px past an edge, and an edge and a ring in one colour, 2px apart, as one heavier line.
   Neither in Glass, which colours the edge on both variants, nor in forced colours, which draw it
   on both and the ring in the system's colour. */
@media (forced-colors: none) {
    @container style(--ui-color-border-button: currentColor) {
${each((variant) =>
    variant === 'primary'
        ? String.raw` {
    --ui-ring-inset: -4px;
}`
        : String.raw` {
    --ui-ring-ink: ${reference('--ui-color-focus').cssText};
}`,
)}
    }
}

${sweeps}

${laps}

${sized.wide}

${moves}

${focal.frames(sweeps + laps + sized.wide + moves)}
`;
}

/** Why a button leaves the preview out: what it shows is what a click would change. */
const unchanged = 'a click changes nothing of the button’s own for it to show beforehand.';

/** The moments a button offers, and each kind's effects. */
export const moments: readonly Moment[] = [
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
                        fire: spread,
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
    hover('button', {
        move: {
            draws: [
                'lift',
                'zoom',
                'magnetic',
                'tilt',
                'breathe',
                { name: 'heartbeat', fire: play('heartbeat', 'move') },
                { name: 'rubber', fire: play('rubber', 'move') },
                { name: 'flip-vertical', fire: flip('flip-vertical') },
                { name: 'flip-horizontal', fire: flip('flip-horizontal') },
                { name: 'glitch', fire: play('glitch', 'move') },
            ],
        },
        fill: {
            today: 'highlight',
            draws: [
                'highlight',
                'tint',
                'spotlight',
                { name: 'flood', fire: flood },
                'shimmer',
                { name: 'ripple', fire: spread },
                { name: 'scan', fire: play('scan', 'fill') },
                'blur',
            ],
            refuses: { preview: unchanged },
        },
        shadow: {
            today: 'highlight',
            draws: [
                {
                    name: 'highlight',
                    says: 'The glow the theme gives the pointer: Matrix’s ring goes solid and its glow doubles. The default theme and Glass give the button none, so under them it changes nothing.',
                },
                'raise',
                'sink',
                'halo',
                'glow',
                'inner',
                'cast',
                'neon',
                'breathe',
                { name: 'burst', fire: play('burst', 'shadow', 'host') },
            ],
        },
        border: {
            today: 'highlight',
            draws: [
                {
                    name: 'highlight',
                    says: 'The boundary takes the colour the theme gives the pointer: Glass’s faint edge goes solid. The default theme and Matrix give none, so under them it changes nothing.',
                },
                'accent',
                'rainbow',
                'edge',
                'orbit',
                'trace',
                'comet',
                'underline',
                'sweep',
                { name: 'pulse', fire: play('pulse', 'border') },
                { name: 'shockwave', fire: wave('shockwave') },
                { name: 'bloom', fire: wave('bloom') },
                { name: 'explode', fire: play('explode', 'border') },
            ],
        },
    }),
    focus('button', {
        move: {
            draws: [
                'lift',
                'zoom',
                'breathe',
                { name: 'heartbeat', fire: play('heartbeat', 'move') },
                { name: 'rubber', fire: play('rubber', 'move') },
                { name: 'flip-vertical', fire: flip('flip-vertical') },
                { name: 'flip-horizontal', fire: flip('flip-horizontal') },
                { name: 'glitch', fire: play('glitch', 'move') },
            ],
        },
        fill: {
            draws: [
                'highlight',
                'tint',
                'spotlight',
                { name: 'flood', fire: centres((host) => inner(host, 'button')) },
                'shimmer',
                { name: 'ripple', fire: spread },
                { name: 'scan', fire: play('scan', 'fill') },
                'blur',
            ],
            refuses: { preview: unchanged },
        },
        shadow: {
            draws: [
                'highlight',
                'raise',
                'sink',
                'halo',
                'glow',
                'inner',
                'neon',
                'breathe',
                { name: 'burst', fire: play('burst', 'shadow', 'host') },
            ],
        },
        border: {
            draws: [
                'highlight',
                'accent',
                'rainbow',
                'edge',
                'orbit',
                'trace',
                'comet',
                'underline',
                'sweep',
                { name: 'pulse', fire: play('pulse-focus', 'border') },
                { name: 'shockwave', fire: wave('shockwave') },
                { name: 'bloom', fire: wave('bloom') },
                { name: 'explode', fire: play('explode', 'border') },
            ],
        },
        ring: {
            draws: [
                aside('button'),
                'slim',
                'bold',
                'tight',
                'inset',
                'dashed',
                'double',
                'breathe',
                'implode',
                'rainbow',
                ...flights('button'),
            ],
        },
    }),
];

/** What a button leaves out of the reference's, and why. */
export const refused: readonly Refusal[] = [
    {
        name: 'squish, on focus',
        why: 'it is the press being held; a focus has nothing held to answer.',
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
        name: 'rainbow, on the fill',
        why: 'a hue rotation keeps the fill’s lightness only roughly: the primary’s white label falls to 3.79:1 at 120°, and is under 4.5:1 for about two fifths of every turn — measured in three engines. The rainbow turns the edge and the ring instead, which no label is drawn over.',
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
];

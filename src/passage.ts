/**
 * A surface's passage in script — RFC 0004's pieces and grain: the entrances and the exits a sheet
 * cannot draw. Materialize puts a surface together from pieces appearing where they belong, at
 * random, as it arrives, and erode breaks it into pieces vanishing where they are as it leaves;
 * dissolve brings it out of a fine grain as it arrives, or dissolves it into one as it leaves.
 *
 * **One filter over the surface, and nothing is copied.** The prototypes cut a card from thirty-six
 * copies of itself, and a copy of what a host put in a card is that content again: an iframe loaded
 * and a video played once a copy, a field in a form round the card submitted with every copy's
 * value, an open dialog shown as a modal by each. So each passage is an SVG filter over the surface,
 * as the shatter in `src/shatter.ts` is over the button, and whatever the surface draws goes with it
 * as it is drawn — a glow, a glass. What a copy did and a piece here does not: shrink toward the
 * middle as it faded.
 *
 * **The pieces are six by six, cut on device pixels**, so two pieces side by side meet without a
 * seam, and an outer piece reaches 3rem past the surface, so a glow or a ring drawn round it goes
 * with its piece. They count in the surface's own pixels from the corner of its border box, which
 * WebKit counts from only once the surface has a transform, so the surface takes a turn of nothing
 * while it is in pieces, as the shatter's button does. Each fades on a clock of its own: breaking, a
 * piece waits up to 465ms and fades over 390 to 585, a quarter quicker than the reference's own; put
 * together, every wait is run backward, so the piece that would go last comes first, and the whole is
 * fitted so the last piece lands at 650ms.
 *
 * **The grain is noise made the surface's alpha.** feTurbulence's noise becomes the alpha through a
 * colour matrix — six times the noise plus an offset, held between 0 and 1 — and the offset is a
 * threshold: moved from where every pixel is whole to where none is left, it eats the surface grain
 * by grain. Only the span the grain moves through is run, a little past where the first grain goes
 * and where the last does: nothing changed below 0.25, and everything had by 0.725, on the card and on
 * the dialog's panel, in every theme — measured for RFC 0004. The ends are exact: whole before, gone
 * after. Its clock takes 780ms either way, on the straight curve the sheet hands over.
 *
 * **Each passage takes as long as the review judged it**, at the entrance's and the exit's own
 * defaults, 360ms and 240ms, and in proportion as either time is moved. Its clocks are animations on
 * the surface, so whatever waits out a surface's animations waits out its passage, and a frame
 * copies their progress into the filter while one runs or is held.
 *
 * **The sheet decides, and this only reads.** A component hands `--ui-fx-enter` and `--ui-fx-exit`
 * the effect it chose for each moment, with that moment's time and curve, under the effect's query.
 * So nothing is cut where the sheet chose otherwise, nor in an engine without style queries; and under
 * reduced motion the time is the collapse's 0.01ms, and nothing is cut.
 *
 * Internal — it is not re-exported from `src/index.ts`.
 */

import { kinds, milliseconds } from './motion.js';

/** The two moments a surface passes in: as it is put on the page, and as it leaves. */
type Moment = 'enter' | 'exit';

/** What a passage is handed for a moment: its effect, and how it runs. */
interface Handed {
    /** The effect the sheet chose for the moment. */
    readonly effect: string;
    /** The moment's time over the time the review judged it at: how much longer or shorter to run. */
    readonly pace: number;
    /** The curve each clock runs on. */
    readonly curve: string;
    /** The surface as the page draws it, and its own width and height, in its own pixels. */
    readonly box: DOMRect;
    readonly width: number;
    readonly height: number;
}

/** One piece: its cell, as steps of the cut across and down, and its fade, in milliseconds. */
interface Piece {
    readonly row: number;
    readonly column: number;
    readonly wait: number;
    readonly length: number;
}

/** What is cutting each surface now: how to stop it and give the surface back as it was. */
const cutting = new WeakMap<HTMLElement, () => void>();

/** Pieces a side, thirty-six in all, as the reference cuts them. */
const side = 6;

/** How far past the surface an outer piece reaches, in rem: past a glow or a ring drawn round it. */
const reach = 3;

/** The time under which the collapse took the passage: reduced motion's 0.01ms, or none. */
const collapsed = 0.01;

/**
 * The times the review judged every passage at, in milliseconds: `--ui-duration-enter`'s default
 * and `--ui-duration-exit`'s.
 */
const judged: Readonly<Record<Moment, number>> = { enter: 360, exit: 240 };

/** When the last piece landed, put together at the judged entrance: five quarters of a flourish. */
const assembled = 650;

/** How long the grain took either way at the judged times: a step and a half of a flourish. */
const dissolved = 780;

/** How hard a grain's edge is: the noise times this turns its ramp into a step. */
const gain = 6;

/** The span of the threshold the grain moves through, from before its first grain to past its last. */
const span = [0.22, 0.75] as const;

/** The namespace a filter is written in. */
const svg = 'http://www.w3.org/2000/svg';

/** How many passages have been cut, which names each one's filter apart from the rest. */
let cuts = 0;

/** An element of a filter, with the attributes it is drawn by, which it has no properties for. */
function made<Name extends keyof SVGElementTagNameMap>(
    name: Name,
    values: Readonly<Record<string, string>>,
): SVGElementTagNameMap[Name] {
    const element = document.createElementNS(svg, name);

    for (const [key, value] of Object.entries(values)) {
        element.setAttribute(key, value);
    }

    return element;
}

/**
 * What `surface`'s sheet handed a passage for `moment`, or nothing where there is nothing to run:
 * under the collapse, or with no box to draw.
 */
function handed(surface: HTMLElement, moment: Moment): Handed | undefined {
    const style = getComputedStyle(surface);
    const time = milliseconds(style.getPropertyValue(`${kinds.animated}${moment}-time`));
    const box = surface.getBoundingClientRect();

    if (!(time > collapsed) || box.width === 0 || box.height === 0) {
        return undefined;
    }

    return {
        effect: style.getPropertyValue(`${kinds.animated}${moment}`),
        pace: time / judged[moment],
        curve: style.getPropertyValue(`${kinds.animated}${moment}-curve`),
        box,
        width: Number.parseFloat(style.width),
        height: Number.parseFloat(style.height),
    };
}

/**
 * Draws `surface` through `filter`, laid where it takes no room in the surface's own tree under a
 * name of its own, and with whatever else `styles` names, on clocks with `timings`, copying their
 * progress into the filter with `draw` each frame while one runs or is held. Put `together`, the
 * surface is given back as it was once every clock has finished; broken, it stays as the last frame
 * drew it until it is mended.
 */
function run(
    surface: HTMLElement,
    name: string,
    filter: SVGFilterElement,
    timings: readonly KeyframeEffect[],
    draw: () => void,
    together: boolean,
    styles: Readonly<Record<string, string>>,
): void {
    cuts += 1;

    const id = `ui-${name}-${String(cuts)}`;
    const holder = made('svg', {
        'aria-hidden': 'true',
        style: 'position:absolute;width:0;height:0',
    });
    const clocks = timings.map((timing) => new Animation(timing, document.timeline));
    const tree = surface.getRootNode();
    const drawn = Object.entries({ filter: `url(#${id})`, ...styles });
    // What the surface was drawn with of its own where the passage draws it, which it is given back.
    const before = drawn.map(
        ([property]) => [property, surface.style.getPropertyValue(property)] as const,
    );

    /** Puts the surface back as it was, every clock stopped and the filter gone. */
    const whole = (): void => {
        for (const clock of clocks) {
            clock.cancel();
        }

        holder.remove();

        for (const [property, value] of before) {
            surface.style.setProperty(property, value);
        }

        cutting.delete(surface);
    };

    /**
     * Draws the clocks' progress, and asks for the next frame while a clock is still running or
     * held: once the last has finished, what it drew last is where the passage rests, and once it is
     * ended its clocks are stopped, so nothing asks for another.
     */
    const frame = (): void => {
        draw();

        if (clocks.some((clock) => clock.playState === 'running' || clock.playState === 'paused')) {
            requestAnimationFrame(frame);
        }
    };

    filter.setAttribute('id', id);
    holder.append(filter);
    (tree instanceof ShadowRoot ? tree : document.body).append(holder);

    for (const [property, value] of drawn) {
        surface.style.setProperty(property, value);
    }

    cutting.set(surface, whole);

    for (const clock of clocks) {
        clock.play();
    }

    requestAnimationFrame(frame);
    // A passage ended early has given the surface back already.
    void Promise.all(clocks.map((clock) => clock.finished)).then(
        () => {
            if (together) {
                whole();
            }
        },
        () => undefined,
    );
}

/**
 * The thirty-six pieces, row by row: each waits up to 465ms and fades over 390 to 585, at the
 * reference's pace less a quarter.
 */
function plan(): Piece[] {
    const pieces: Piece[] = [];

    for (let row = 0; row < side; row += 1) {
        for (let column = 0; column < side; column += 1) {
            pieces.push({
                row,
                column,
                wait: Math.random() * 465,
                length: 390 + Math.random() * 195,
            });
        }
    }

    return pieces;
}

/** Cuts `surface` into its pieces, and fades them in, `together`, or out, as `handed` says. */
function pieces(
    surface: HTMLElement,
    { pace, curve, box, width, height }: Handed,
    together: boolean,
): void {
    const room = reach * Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
    const ratio = devicePixelRatio;
    // Where cut `at` of the six falls across `length` of the surface's own pixels, drawn `drawn`
    // pixels long on the page from `origin`: on a device pixel of the page, or `room` past an
    // outer edge.
    const line = (origin: number, drawn: number, length: number, at: number): number =>
        at === 0
            ? -room
            : at === side
              ? length + room
              : ((Math.round((origin + (drawn * at) / side) * ratio) / ratio - origin) * length) /
                drawn;
    const filter = made('filter', {
        filterUnits: 'userSpaceOnUse',
        primitiveUnits: 'userSpaceOnUse',
        x: String(-room),
        y: String(-room),
        width: String(width + 2 * room),
        height: String(height + 2 * room),
        'color-interpolation-filters': 'sRGB',
    });
    const merge = made('feMerge', {});
    const cut = plan();
    const end = Math.max(...cut.map((piece) => piece.wait + piece.length));
    const first = Math.min(...cut.map((piece) => piece.wait));
    // Put together, the span from the first piece setting off to the last landing is fitted to
    // its time; broken, every piece keeps its pace, and the pace follows the exit's time.
    const scale = together ? (assembled * pace) / (end - first) : pace;
    const faded = cut.map((piece, index) => {
        const left = line(box.left, box.width, width, piece.column);
        const top = line(box.top, box.height, height, piece.row);
        const fade = made('feFuncA', { type: 'linear', slope: together ? '0' : '1' });
        const cell = made('feComponentTransfer', {
            in: 'SourceGraphic',
            x: String(left),
            y: String(top),
            width: String(line(box.left, box.width, width, piece.column + 1) - left),
            height: String(line(box.top, box.height, height, piece.row + 1) - top),
            result: `piece-${String(index)}`,
        });
        // Its clock, on the surface: put together, what would have gone last comes first.
        const timing = new KeyframeEffect(surface, null, {
            delay: (together ? end - piece.wait - piece.length : piece.wait) * scale,
            duration: piece.length * scale,
            easing: curve,
            fill: 'both',
        });

        cell.append(fade);
        filter.append(cell);
        merge.append(made('feMergeNode', { in: `piece-${String(index)}` }));

        return { fade, timing };
    });

    filter.append(merge);
    run(
        surface,
        'pieces',
        filter,
        faded.map(({ timing }) => timing),
        () => {
            for (const { fade, timing } of faded) {
                const progress = timing.getComputedTiming().progress ?? 0;

                fade.setAttribute('slope', String(together ? progress : 1 - progress));
            }
        },
        together,
        // A turn of nothing, which WebKit counts the pieces' pixels from.
        { rotate: '0deg' },
    );
}

/** The threshold `progress` of the way through the grain's span, exact at either end. */
function level(progress: number): number {
    const [from, to] = span;

    return progress <= 0 ? 0 : progress >= 1 ? 1 : from + (to - from) * progress;
}

/** Dissolves `surface` into a grain, or brings it out of one, `together`, as `handed` says. */
function grain(surface: HTMLElement, { pace, curve }: Handed, together: boolean): void {
    // Room round the surface for a glow, which the default tenth would cut; and the surface's own
    // colours, which a round trip through linearRGB shifted, measured in Firefox for RFC 0004.
    const filter = made('filter', {
        x: '-25%',
        y: '-25%',
        width: '150%',
        height: '150%',
        'color-interpolation-filters': 'sRGB',
    });
    const matrix = made('feColorMatrix', { in: 'grain', type: 'matrix', result: 'mask' });
    const timing = new KeyframeEffect(surface, null, {
        duration: dissolved * pace,
        easing: curve,
        fill: 'forwards',
    });
    /** Where the threshold is: at 0 every pixel is whole, and at 1 none is left. */
    const at = (threshold: number): void => {
        matrix.setAttribute(
            'values',
            `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${String(gain)} 0 0 0 ${(1 - (gain + 1) * threshold).toFixed(3)}`,
        );
    };

    filter.append(
        made('feTurbulence', {
            type: 'fractalNoise',
            baseFrequency: '0.62',
            numOctaves: '1',
            seed: String(Math.floor(Math.random() * 1000)),
            result: 'grain',
        }),
        matrix,
        made('feComposite', { in: 'SourceGraphic', in2: 'mask', operator: 'in' }),
    );
    at(together ? 1 : 0);
    run(
        surface,
        'grain',
        filter,
        [timing],
        () => {
            const progress = timing.getComputedTiming().progress ?? 0;

            at(level(together ? 1 - progress : progress));
        },
        together,
        {},
    );
}

/**
 * Runs the entrance `surface`'s sheet chose for it as it arrives — putting it together from its
 * pieces, or bringing it out of a grain — and gives it back as it was once that is done. Whatever was
 * running on it is ended first.
 */
export function enter(surface: HTMLElement): void {
    mend(surface);

    const chosen = handed(surface, 'enter');

    if (chosen?.effect === 'materialize') {
        pieces(surface, chosen, true);
    } else if (chosen?.effect === 'dissolve') {
        grain(surface, chosen, true);
    }
}

/**
 * Runs the exit `surface`'s sheet chose for it as it leaves — breaking it into its pieces, or
 * dissolving it into a grain — and leaves it drawn gone until it is mended, which the component does
 * once it has taken the surface away. Whatever was running on it is ended first.
 */
export function exit(surface: HTMLElement): void {
    mend(surface);

    const chosen = handed(surface, 'exit');

    if (chosen?.effect === 'erode') {
        pieces(surface, chosen, false);
    } else if (chosen?.effect === 'dissolve') {
        grain(surface, chosen, false);
    }
}

/** Gives `surface` back as it was, ending whatever passage is running on it; a whole one stays so. */
export function mend(surface: HTMLElement): void {
    cutting.get(surface)?.();
}

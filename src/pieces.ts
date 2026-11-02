/**
 * A surface's pieces — RFC 0004's materialize and erode: a surface put together from pieces
 * appearing where they belong, at random, as it arrives, or broken into pieces vanishing where they
 * are as it leaves.
 *
 * **One filter cuts the surface as it is drawn, and nothing is copied.** The prototypes cut a card
 * from thirty-six copies of itself, and a copy of what a host put in a card is that content again:
 * an iframe loaded and a video played once a copy, a field in a form round the card submitted with
 * every copy's value, an open dialog shown as a modal by each. So the cut is the shatter's, in
 * `src/shatter.ts`: an SVG filter over the surface takes each piece's cell of it and fades that
 * alone, and whatever the surface draws goes with its piece as it is drawn. What a copy did and this
 * does not: shrink toward the middle as it faded.
 *
 * **Six by six, cut on device pixels**, so two pieces side by side meet without a seam, and an outer
 * piece reaches 3rem past the surface, so a glow or a ring drawn round it goes with its piece. It
 * counts in the surface's own pixels from the corner of its border box, which WebKit counts from
 * only once the surface has a transform, so the surface takes a turn of nothing while it is cut, as
 * the shatter's button does.
 *
 * **Each piece fades on a clock of its own**: an animation with no keyframes on the surface, which
 * brings the time and the curve its sheet handed over, and whose progress a frame copies into its
 * piece. Breaking, a piece waits up to 465ms and fades over 390 to 585, a quarter quicker than the
 * reference's own, at the exit the review judged the pieces at, and in proportion to the exit's time
 * from there. Put together, every wait is run backward, so the piece that would go last comes first,
 * and the whole is fitted so the last piece lands in five quarters of a flourish at the entrance the
 * review judged, and in proportion from there. The clocks being the surface's own animations,
 * whatever waits out a surface's animations waits out its pieces.
 *
 * **The sheet decides, and this only reads.** A component hands `--ui-fx-enter: materialize` and
 * `--ui-fx-exit: erode` on its surface, each with the time and the curve its pieces fade on, under
 * the effect's query. So nothing is cut where the sheet chose otherwise, nor in an engine without
 * style queries; and under reduced motion the time is the collapse's 0.01ms, and nothing is cut.
 *
 * Internal — it is not re-exported from `src/index.ts`.
 */

import { kinds, milliseconds } from './motion.js';

/** One piece: its cell, as steps of the cut across and down, and its fade, in milliseconds. */
interface Piece {
    readonly row: number;
    readonly column: number;
    readonly wait: number;
    readonly length: number;
}

/** What is cutting each surface now: how to stop it and give the surface back whole. */
const cutting = new WeakMap<HTMLElement, () => void>();

/** Pieces a side, thirty-six in all, as the reference cuts them. */
const side = 6;

/** How far past the surface an outer piece reaches, in rem: past a glow or a ring drawn round it. */
const reach = 3;

/** The time under which the collapse took the fade: reduced motion's 0.01ms, or none. */
const collapsed = 0.01;

/** The exit the review judged the breaking at, in milliseconds: `--ui-duration-exit`'s default. */
const breakingAt = 240;

/** The entrance it judged the putting together at: `--ui-duration-enter`'s default. */
const assemblingAt = 360;

/** When the last piece landed then, in milliseconds: five quarters of a flourish. */
const assembled = 650;

/** The namespace the filter is written in. */
const svg = 'http://www.w3.org/2000/svg';

/** How many cuts have been made, which names each one's filter apart from the rest. */
let cuts = 0;

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

/** An element of the filter, with the attributes it is drawn by, which it has no properties for. */
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
 * Cuts `surface` into its pieces and fades them in, `together`, or out, over the time and along the
 * curve its sheet handed it for `moment`, where it chose `effect` there. Whatever was cutting it
 * before is ended first, which gives it back whole.
 */
function cut(
    surface: HTMLElement,
    moment: 'enter' | 'exit',
    effect: string,
    together: boolean,
): void {
    const style = getComputedStyle(surface);
    const time = milliseconds(style.getPropertyValue(`${kinds.animated}${moment}-time`));
    const box = surface.getBoundingClientRect();

    mend(surface);

    if (
        style.getPropertyValue(`${kinds.animated}${moment}`) !== effect ||
        !(time > collapsed) ||
        box.width === 0 ||
        box.height === 0
    ) {
        return;
    }

    const width = Number.parseFloat(style.width);
    const height = Number.parseFloat(style.height);
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
    cuts += 1;

    const id = `ui-pieces-${String(cuts)}`;
    const holder = made('svg', {
        'aria-hidden': 'true',
        style: 'position:absolute;width:0;height:0',
    });
    const filter = made('filter', {
        id,
        filterUnits: 'userSpaceOnUse',
        primitiveUnits: 'userSpaceOnUse',
        x: String(-room),
        y: String(-room),
        width: String(width + 2 * room),
        height: String(height + 2 * room),
        'color-interpolation-filters': 'sRGB',
    });
    const merge = made('feMerge', {});
    const pieces = plan();
    const end = Math.max(...pieces.map((piece) => piece.wait + piece.length));
    const first = Math.min(...pieces.map((piece) => piece.wait));
    // Put together, the span from the first piece setting off to the last landing is fitted to
    // its time; broken, every piece keeps its pace, and the pace follows the exit's time.
    const scale = together
        ? ((time / assemblingAt) * assembled) / (end - first)
        : time / breakingAt;
    const curve = style.getPropertyValue(`${kinds.animated}${moment}-curve`);
    const faded = pieces.map((piece, index) => {
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
    const clocks = faded.map(({ timing }) => new Animation(timing, document.timeline));
    const tree = surface.getRootNode();

    /** Puts the surface back as it was, every clock stopped and the filter gone. */
    const whole = (): void => {
        for (const clock of clocks) {
            clock.cancel();
        }

        holder.remove();
        surface.style.removeProperty('filter');
        surface.style.removeProperty('rotate');
        cutting.delete(surface);
    };

    /**
     * Copies each clock's progress into its piece while this cut is the surface's, and asks for the
     * next frame while a clock is still running or held: once the last has finished, what it drew
     * last is where each piece rests.
     */
    const frame = (): void => {
        if (cutting.get(surface) === whole) {
            for (const { fade, timing } of faded) {
                const progress = timing.getComputedTiming().progress ?? 0;

                fade.setAttribute('slope', String(together ? progress : 1 - progress));
            }

            if (
                clocks.some(
                    (clock) => clock.playState === 'running' || clock.playState === 'paused',
                )
            ) {
                requestAnimationFrame(frame);
            }
        }
    };

    filter.append(merge);
    holder.append(filter);
    (tree instanceof ShadowRoot ? tree : document.body).append(holder);
    surface.style.filter = `url(#${id})`;
    surface.style.rotate = '0deg';
    cutting.set(surface, whole);

    for (const clock of clocks) {
        clock.play();
    }

    requestAnimationFrame(frame);
    // Put together, the surface is whole once every piece has landed; broken, it stays cut, every
    // piece gone, until it is mended. A cut ended early has given the surface back already.
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
 * Puts `surface` together from its pieces as it arrives, where its sheet chose `materialize` for its
 * entrance, and gives it back whole once the last has landed.
 */
export function materialize(surface: HTMLElement): void {
    cut(surface, 'enter', 'materialize', true);
}

/**
 * Breaks `surface` into its pieces as it leaves, where its sheet chose `erode` for its exit, and
 * leaves it cut, every piece gone, until it is mended — which the component does once it has taken
 * the surface away.
 */
export function erode(surface: HTMLElement): void {
    cut(surface, 'exit', 'erode', false);
}

/** Gives `surface` back whole, ending whatever is cutting it; a surface that is whole stays so. */
export function mend(surface: HTMLElement): void {
    cutting.get(surface)?.();
}

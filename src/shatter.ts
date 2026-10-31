/**
 * The press's shatter — RFC 0004's: a button broken into pieces where it was pressed, smallest
 * there, held a little apart until it is let go, and put back together.
 *
 * **A sheet cannot cut an element, so one filter cuts it as it is drawn**: no copy, an SVG filter
 * over the button that takes each piece's cell of it and moves that alone. So the pieces are the
 * button as it goes on changing while it is held — its pressed colour, a sink — and through the
 * cracks shows whatever is under it. The filter goes in the button's own tree, where a reference
 * written on the button resolves.
 *
 * **Only what the button draws solid breaks.** Where it draws more than half opaque — its fill, its
 * label, its edge, a ring — goes with the pieces, an outer piece reaching to the filter's edge so a
 * ring there goes with it; what it draws fainter, a theme's glow, stays whole where it is, under
 * them. Cut with the pieces, the glow showed every crack running on across Matrix's halo as a line
 * through the page; cut off at a box round the button, it showed the box — both measured for RFC
 * 0004.
 *
 * **It counts in the button's own pixels, from the corner of its border box.** In fractions it
 * would count in a box that takes in whatever the button draws past its edge, so Matrix's glow,
 * wider than the button, moved every cut with it. In pixels, WebKit counts from the page's corner
 * on an element with no transform and from the element's own once it has one, so the button takes
 * a turn of nothing while it is in pieces — both measured for RFC 0004 in the three engines.
 *
 * **The pieces part at once**, as the pressed colour presses in, so a quick click shows them
 * apart, and go back together on the curve the sheet hands over. Every piece is held on a device
 * pixel, so its edge is cut where its content is drawn.
 *
 * **The sheet decides, and this only reads.** The button declares `--ui-fx-press: shatter` with
 * the time and curve its pieces go back on, under the shatter's query, while it can be used. So it
 * breaks exactly where the sheet chose it, and never in an engine without style queries; under
 * reduced motion the time is the collapse's 0.01ms, and nothing breaks.
 *
 * **It holds for as long as the press does**, which no effect a sheet draws needs to ask: from the
 * pointer's primary button going down until it comes up or is cancelled, and from Space going down
 * until it comes up or the focus leaves. A key held repeats its down, which parts pieces already
 * apart and waits for the same key to come up. Enter makes no press of its own — its click has no
 * `:active` — so it breaks nothing, as it presses nothing in.
 *
 * Internal — it is not re-exported from `src/index.ts`.
 */

import { kinds, milliseconds } from './motion.js';

/** One piece: its cell, in pixels from the button's top-left corner, and how far it is held off. */
interface Shard {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
    readonly dx: number;
    readonly dy: number;
}

/** A button held in pieces: parts them, from wherever they are, or puts them back. */
interface Broken {
    readonly part: () => void;
    readonly mend: () => void;
}

/** How far a crack holds its two sides apart, in pixels. */
const gap = 2;

/** The namespace the filter is written in. */
const svg = 'http://www.w3.org/2000/svg';

/** The time under which the collapse took the pieces' return: reduced motion's 0.01ms, or none. */
const collapsed = 0.01;

/** The buttons in pieces now. */
const broken = new WeakMap<HTMLElement, Broken>();

/**
 * Many pieces, smallest where the button was struck: the cell that is largest for how near the
 * point it lies is cut across its longer side, somewhere in its middle, until there are a dozen or
 * so. Across each cut, the side the point is not on is pushed off by the gap and slid along the
 * crack a pixel or none, so every crack opens as far, the piece that was struck stays where it is,
 * and the furthest from it have gone the furthest.
 *
 * Every cut falls on a whole pixel, so an outer cell's far edge is the box's own, exactly.
 */
function shards(width: number, height: number, x: number, y: number): Shard[] {
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
 * Cuts the button `width` by `height` where it was struck, at `x` and `y` in its own pixels, and
 * returns it in pieces, which go back together over `time` along `curve` once mended.
 */
function crack(
    button: HTMLElement,
    width: number,
    height: number,
    x: number,
    y: number,
    time: number,
    curve: string,
): Broken {
    const plan = shards(width, height, x, y);
    // The filter takes in 4rem round the button, past the widest light the button draws — the
    // burst's, 15px of blur on a 10px spread — since nothing outside it is drawn at all; and room
    // for the furthest piece.
    const room =
        4 * Number.parseFloat(getComputedStyle(document.documentElement).fontSize) +
        Math.max(...plan.map((shard) => Math.max(Math.abs(shard.dx), Math.abs(shard.dy))));
    const holder = made('svg', {
        'aria-hidden': 'true',
        style: 'position:absolute;width:0;height:0',
    });
    const filter = made('filter', {
        id: 'ui-break',
        filterUnits: 'userSpaceOnUse',
        primitiveUnits: 'userSpaceOnUse',
        x: String(-room),
        y: String(-room),
        width: String(width + 2 * room),
        height: String(height + 2 * room),
        'color-interpolation-filters': 'sRGB',
    });
    // Where the button draws more than half solid, cut sharp: what it draws there goes with the
    // pieces, and what it draws fainter, its glow, stays where it is, under them.
    const solid = made('feComponentTransfer', { in: 'SourceAlpha', result: 'solid' });
    const core = made('feComposite', {
        in: 'SourceGraphic',
        in2: 'solid',
        operator: 'in',
        result: 'core',
    });
    const halo = made('feComposite', {
        in: 'SourceGraphic',
        in2: 'solid',
        operator: 'out',
        result: 'halo',
    });
    const merge = made('feMerge', {});
    const pieces = plan.map((shard, index) => {
        // An outer cell reaches to the filter's edge, so a ring past the button goes with it.
        const left = shard.left === 0 ? -room : shard.left;
        const top = shard.top === 0 ? -room : shard.top;
        const right = shard.left + shard.width === width ? width + room : shard.left + shard.width;
        const bottom =
            shard.top + shard.height === height ? height + room : shard.top + shard.height;
        // Its cell of the button, moved: the offset's own region is where the cell lands.
        const offset = made('feOffset', {
            in: 'core',
            result: `piece-${String(index)}`,
            width: String(right - left),
            height: String(bottom - top),
        });

        merge.append(made('feMergeNode', { in: `piece-${String(index)}` }));

        return { offset, left, top, dx: shard.dx, dy: shard.dy };
    });
    const tree = button.getRootNode();

    /** How far apart the pieces are: together at 0, and held apart at 1. */
    const place = (amount: number): void => {
        for (const { offset, left, top, dx, dy } of pieces) {
            const across = Math.round(dx * amount * devicePixelRatio) / devicePixelRatio;
            const down = Math.round(dy * amount * devicePixelRatio) / devicePixelRatio;

            offset.setAttribute('dx', String(across));
            offset.setAttribute('dy', String(down));
            offset.setAttribute('x', String(left + across));
            offset.setAttribute('y', String(top + down));
        }
    };

    solid.append(made('feFuncA', { type: 'discrete', tableValues: '0 1' }));
    merge.prepend(made('feMergeNode', { in: 'halo' }));
    filter.append(solid, core, halo, ...pieces.map(({ offset }) => offset), merge);
    holder.append(filter);
    (tree instanceof ShadowRoot ? tree : document.body).append(holder);
    button.style.filter = 'url(#ui-break)';
    button.style.rotate = '0deg';

    let amount = 1;
    let running: Animation | undefined;

    const whole = (): void => {
        running = undefined;
        button.style.removeProperty('filter');
        button.style.removeProperty('rotate');
        holder.remove();
        broken.delete(button);
    };

    const pieced: Broken = {
        part: () => {
            running?.cancel();
            running = undefined;
            amount = 1;
            place(amount);
        },
        mend: () => {
            running?.cancel();

            // An effect with no keyframes is a clock, its progress already eased by the curve,
            // and each frame copies it into the filter; it runs on the button, so it is the
            // button's to read.
            const from = amount;
            const timing = new KeyframeEffect(button, null, { duration: time, easing: curve });
            const clock = new Animation(timing, document.timeline);
            const step = (): void => {
                if (running === clock) {
                    amount = from * (1 - (timing.getComputedTiming().progress ?? 1));
                    place(amount);
                    requestAnimationFrame(step);
                }
            };

            running = clock;
            clock.play();
            requestAnimationFrame(step);
            // A return given up — by a press, which cancels it — leaves the pieces where they are.
            void clock.finished.then(whole, () => undefined);
        },
    };

    broken.set(button, pieced);

    return pieced;
}

/**
 * Breaks the button a press reached, where its sheet chose the shatter, and holds it in pieces
 * until the press is let go. Bound to the button's `pointerdown` and `keydown` as it is: a pointer's
 * primary button going down, or Space going down.
 */
export function press(event: PointerEvent | KeyboardEvent): void {
    const button = event.currentTarget as HTMLElement;
    const style = getComputedStyle(button);
    const time = milliseconds(style.getPropertyValue(`${kinds.animated}press-time`));
    const pointer = event instanceof PointerEvent;
    const pressed = pointer ? event.button === 0 : event.key === ' ';

    if (
        !pressed ||
        style.getPropertyValue(`${kinds.animated}press`) !== 'shatter' ||
        !(time > collapsed)
    ) {
        return;
    }

    const box = button.getBoundingClientRect();
    const width = Number.parseFloat(style.width);
    const height = Number.parseFloat(style.height);
    // Struck where the pointer went down, in the button's own pixels, or in the middle for Space.
    const x = pointer ? ((event.clientX - box.left) / box.width) * width : width / 2;
    const y = pointer ? ((event.clientY - box.top) / box.height) * height : height / 2;
    const pieces =
        broken.get(button) ??
        crack(
            button,
            width,
            height,
            x,
            y,
            time,
            style.getPropertyValue(`${kinds.animated}press-curve`),
        );
    const done = new AbortController();
    // Capturing, so a page that stops the end of a press on its way up does not hold it forever.
    const listening = { capture: true, signal: done.signal };
    const release = (): void => {
        done.abort();
        pieces.mend();
    };

    pieces.part();

    if (pointer) {
        const { pointerId } = event;
        const up = (next: PointerEvent): void => {
            if (next.pointerId === pointerId) {
                release();
            }
        };

        window.addEventListener('pointerup', up, listening);
        window.addEventListener('pointercancel', up, listening);
    } else {
        window.addEventListener(
            'keyup',
            (next) => {
                if (next.key === ' ') {
                    release();
                }
            },
            listening,
        );
        button.addEventListener('blur', release, listening);
    }
}

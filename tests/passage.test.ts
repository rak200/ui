import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { cdp } from 'vitest/browser';
// The playwright provider is what puts `send` on `CDPSession` — see `tokens.test.ts`.
import type {} from '@vitest/browser-playwright';
import { enter, exit, mend } from '../src/passage.js';
import { reference } from '../src/reference.js';

/**
 * What a component's sheet hands a surface under materialize's and erode's queries: each effect, at
 * the time the review judged it at, on a straight curve, so a piece's progress is its time.
 */
const handed = [
    '--ui-fx-enter: materialize',
    '--ui-fx-enter-time: 360ms',
    '--ui-fx-enter-curve: linear',
    '--ui-fx-exit: erode',
    '--ui-fx-exit-time: 240ms',
    '--ui-fx-exit-curve: linear',
].join('; ');

/** Every surface the test mounted, mended after it, wherever it was. */
const mounted: HTMLElement[] = [];

/**
 * A surface 300 by 120, its corner at `left` and 31px into the page, carrying what its sheet hands it
 * and then `style`, in a shadow root of its own where `shadowed`.
 */
function mount(style = '', left = 53, shadowed = false): HTMLElement {
    const host = document.createElement('div');
    host.style.cssText = `position: absolute; left: ${String(left)}px; top: 31px`;
    const tree = shadowed ? host.attachShadow({ mode: 'open' }) : host;
    const surface = document.createElement('div');
    surface.style.cssText = `box-sizing: border-box; width: 300px; height: 120px; ${handed}; ${style}`;
    tree.append(surface);
    document.body.append(host);
    mounted.push(surface);

    return surface;
}

/** The filter a passage draws `surface` through now, found by the reference written on it. */
function filterOf(surface: HTMLElement): SVGFilterElement {
    const id = /^url\("#(ui-(?:pieces|grain)-\d+)"\)$/.exec(surface.style.filter)?.[1];
    const tree = surface.getRootNode() as Document | ShadowRoot;
    const filter = id === undefined ? null : tree.getElementById(id);

    if (!(filter instanceof SVGFilterElement)) {
        throw new Error('nothing is cutting the surface');
    }

    return filter;
}

/** Each piece as the filter cuts it: its region's corner and size. */
function cells(surface: HTMLElement): (readonly number[])[] {
    return [...filterOf(surface).querySelectorAll('feComponentTransfer')].map((cell) =>
        ['x', 'y', 'width', 'height'].map((name) => Number(cell.getAttribute(name))),
    );
}

/** How much of each piece shows, as the filter draws it: never a slope left blank, which is 1. */
function slopes(surface: HTMLElement): number[] {
    return [...filterOf(surface).querySelectorAll('feFuncA')].map((fade) => {
        const slope = fade.getAttribute('slope') ?? '';

        if (slope === '') {
            throw new Error('a piece drawn with no slope, which shows it whole');
        }

        return Number(slope);
    });
}

/** Each piece's clock: when it starts, for how long, on what curve, and how it holds. */
function clocks(surface: HTMLElement): (readonly unknown[])[] {
    return surface.getAnimations().map((clock) => {
        const timing = clock.effect?.getTiming();

        return [timing?.delay, timing?.duration, timing?.easing, timing?.fill];
    });
}

/** Holds every clock on `surface` at `time`, and waits a frame for the pieces to be drawn there. */
async function hold(surface: HTMLElement, time: number): Promise<void> {
    for (const clock of surface.getAnimations()) {
        clock.pause();
        clock.currentTime = time;
    }

    await new Promise(requestAnimationFrame);
}

/** Runs every clock on `surface` to its end, and waits for what its end does. */
async function finish(surface: HTMLElement): Promise<void> {
    const running = surface.getAnimations();

    for (const clock of running) {
        clock.finish();
    }

    await Promise.all(running.map((clock) => clock.finished));
    await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Two kinds of piece, every other one each: one that waits a fifth of the longest wait, 93ms, and
 * fades over the longest, 585ms, so it sets off first and is gone last; and one that waits half the
 * longest wait, 232.5ms, and fades over a quarter of the way from the shortest, 438.75ms. Each piece
 * asks for its wait first and its fade second.
 */
beforeEach(() => {
    const draws = [0.2, 1, 0.5, 0.25];
    let drawn = 0;

    vi.spyOn(Math, 'random').mockImplementation(() => {
        const value = draws[drawn % draws.length] ?? 0;
        drawn += 1;

        return value;
    });
});

afterEach(() => {
    // Mended rather than cancelled from the page: a clock in a shadow root is no animation of the
    // document's, and one left running asks for frames after the test.
    for (const surface of mounted.splice(0)) {
        mend(surface);
    }

    vi.restoreAllMocks();
    document.body.replaceChildren();
});

/** The first kind's wait and fade, and the second's, at the reference's pace less a quarter. */
const first = [93, 585] as const;
const second = [232.5, 438.75] as const;

/** When the last piece would be gone, broken at that pace, and when the first would set off. */
const end = Math.max(first[0] + first[1], second[0] + second[1]);
const start = Math.min(first[0], second[0]);

describe('putting a surface together', () => {
    it('cuts it under one filter of thirty-six pieces, six by six, an outer one reaching 3rem past it', () => {
        const surface = mount();

        enter(surface);

        const filter = filterOf(surface);

        expect(
            ['x', 'y', 'width', 'height', 'filterUnits', 'primitiveUnits'].map((name) =>
                filter.getAttribute(name),
            ),
        ).toEqual(['-48', '-48', '396', '216', 'userSpaceOnUse', 'userSpaceOnUse']);
        expect(filter.getAttribute('color-interpolation-filters')).toBe('sRGB');
        expect(cells(surface)).toHaveLength(36);
        expect(cells(surface)[0], 'the first, at the corner').toEqual([-48, -48, 98, 68]);
        expect(cells(surface)[7], 'one inside').toEqual([50, 20, 50, 20]);
        expect(cells(surface)[35], 'the last, at the far corner').toEqual([250, 100, 98, 68]);
        expect(
            [...filter.querySelectorAll('feMergeNode')].map((node) => node.getAttribute('in')),
            'every piece drawn',
        ).toEqual(Array.from({ length: 36 }, (_, index) => `piece-${String(index)}`));
        expect(
            [...filter.querySelectorAll('feComponentTransfer')].map((cell) => [
                cell.getAttribute('in'),
                cell.getAttribute('result'),
                cell.querySelector('feFuncA')?.getAttribute('type'),
            ])[5],
            'each from the surface as it is drawn',
        ).toEqual(['SourceGraphic', 'piece-5', 'linear']);
        expect(filter.parentElement?.getAttribute('aria-hidden'), 'out of what is read').toBe(
            'true',
        );
    });

    it('takes the surface a turn of nothing while it is cut, which WebKit counts from', () => {
        const surface = mount();

        enter(surface);

        expect(surface.style.rotate).toBe('0deg');
    });

    it('fades each piece in on a clock of its own, its wait run backward, the last landing at 650ms', () => {
        const surface = mount();

        enter(surface);

        // The span from the first setting off to the last landing, fitted to 650ms.
        const scale = 650 / (end - start);

        expect(slopes(surface).slice(0, 2), 'none showing yet').toEqual([0, 0]);
        expect(clocks(surface)).toHaveLength(36);
        expect(clocks(surface)[0], 'the first kind, which would have gone last').toEqual([
            (end - first[0] - first[1]) * scale,
            first[1] * scale,
            'linear',
            'both',
        ]);
        expect(clocks(surface)[1], 'the second').toEqual([
            (end - second[0] - second[1]) * scale,
            second[1] * scale,
            'linear',
            'both',
        ]);
    });

    it("fits the pieces to the entrance's time in proportion", () => {
        const surface = mount('--ui-fx-enter-time: 720ms');

        enter(surface);

        const [delay, duration] = clocks(surface)[0] ?? [];

        expect(Number(delay) + Number(duration)).toBeCloseTo(1300, 6);
    });

    it("copies each clock's progress into its piece, frame after frame while it is held", async () => {
        const surface = mount();

        enter(surface);

        const [[delay, duration] = [], [wait, length] = []] = clocks(surface);

        for (const time of [300, 400]) {
            await hold(surface, time);

            expect(slopes(surface)[0], `the first kind, at ${String(time)}ms`).toBeCloseTo(
                (time - Number(delay)) / Number(duration),
                4,
            );
            expect(slopes(surface)[1], `the second, at ${String(time)}ms`).toBeCloseTo(
                (time - Number(wait)) / Number(length),
                4,
            );
        }
    });

    it('keeps drawing the pieces still under way once others have landed', async () => {
        const surface = mount('--ui-fx-enter-time: 36s');

        enter(surface);

        const running = surface.getAnimations();
        // Every second piece landed; the rest held, and moved on while held.
        running.forEach((clock, index) => {
            if (index % 2 === 1) {
                clock.finish();
            }
        });

        const [[delay, duration] = []] = clocks(surface);
        const held = running.filter((_, index) => index % 2 === 0);

        for (const time of [9000, 20000]) {
            for (const clock of held) {
                clock.pause();
                clock.currentTime = time;
            }

            await new Promise(requestAnimationFrame);

            expect(slopes(surface)[0], `at ${String(time)}ms`).toBeCloseTo(
                (time - Number(delay)) / Number(duration),
                4,
            );
        }
    });

    it('draws the pieces frame after frame as their clocks run on their own', async () => {
        const surface = mount('--ui-fx-enter-time: 36s');

        enter(surface);
        await new Promise((resolve) => setTimeout(resolve, 50));

        const earlier = slopes(surface)[0] ?? 0;

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(earlier, 'under way').toBeGreaterThan(0);
        expect(slopes(surface)[0], 'and further on').toBeGreaterThan(earlier);
    });

    it('gives the surface back whole once the last piece has landed, and copies nothing after', async () => {
        const surface = mount();

        enter(surface);
        await finish(surface);

        expect([surface.style.filter, surface.style.rotate]).toEqual(['', '']);
        expect(document.body.querySelector(':scope > svg'), 'the filter gone').toBeNull();

        const asked = vi.spyOn(window, 'requestAnimationFrame');
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(asked, 'no frame asked for').not.toHaveBeenCalled();
    });

    it('cuts on device pixels of the page, counted in the surface’s own pixels', async () => {
        await cdp().send('Emulation.setDeviceMetricsOverride', {
            width: 414,
            height: 896,
            deviceScaleFactor: 2,
            mobile: false,
        });
        onTestFinished(async () => {
            await cdp().send('Emulation.clearDeviceMetricsOverride');
        });

        // A corner off the grid: 53.3px in, the first cut 103.3px in, which a 2x display draws on
        // 103.5; and a surface drawn at twice its size, whose cut falls a pixel short of 100.
        const off = mount('', 53.3);
        const grown = mount('transform: scale(2); transform-origin: 0 0', 0.3);

        enter(off);
        enter(grown);

        const box = off.getBoundingClientRect();

        expect(cells(off)[1]?.[0]).toBeCloseTo(Math.round((box.left + 50) * 2) / 2 - box.left, 6);
        expect(cells(grown)[1]?.[0], 'in its own pixels').toBeCloseTo(
            (Math.round((grown.getBoundingClientRect().left + 100) * 2) / 2 -
                grown.getBoundingClientRect().left) /
                2,
            6,
        );
    });

    it('cuts nothing where the sheet chose another entrance, or none', () => {
        const other = mount('--ui-fx-enter: fade');
        const unchosen = mount('--ui-fx-enter: initial');

        enter(other);
        enter(unchosen);

        for (const surface of [other, unchosen]) {
            expect([surface.style.filter, surface.getAnimations().length]).toEqual(['', 0]);
        }
    });

    it('cuts nothing under the collapse, which takes its time to 0.01ms', () => {
        const surface = mount('--ui-fx-enter-time: 0.01ms');

        enter(surface);

        expect(surface.style.filter).toBe('');
    });

    it('cuts nothing with no box to cut', () => {
        const hidden = mount('display: none');
        const flat = mount('height: 0');
        const narrow = mount('width: 0');

        for (const surface of [hidden, flat, narrow]) {
            enter(surface);
        }

        expect([hidden.style.filter, flat.style.filter, narrow.style.filter]).toEqual(['', '', '']);
    });

    it('lays the filter where it takes no room on the page', () => {
        const surface = mount();

        enter(surface);

        const holder = filterOf(surface).parentElement;
        const room = holder?.getBoundingClientRect();

        expect([holder?.style.position, room?.width, room?.height]).toEqual(['absolute', 0, 0]);
    });

    it('names each cut apart, so two surfaces cut at once each take their own', () => {
        const one = mount();
        const two = mount();

        enter(one);
        enter(two);

        expect(one.style.filter).toMatch(/^url\("#ui-pieces-\d+"\)$/);
        expect(two.style.filter).toMatch(/^url\("#ui-pieces-\d+"\)$/);
        expect(one.style.filter).not.toBe(two.style.filter);
    });

    it("writes the filter in the surface's own tree, where the reference to it resolves", () => {
        const surface = mount('', 53, true);

        enter(surface);

        expect(filterOf(surface).getRootNode()).toBe(surface.getRootNode());
        expect(document.body.querySelector(':scope > svg'), 'none in the page').toBeNull();
    });
});

describe('breaking a surface apart', () => {
    it("fades each piece out on a clock of its own, at the reference's pace less a quarter", () => {
        const surface = mount();

        exit(surface);

        expect(slopes(surface).slice(0, 2), 'all showing yet').toEqual([1, 1]);
        expect(clocks(surface).slice(0, 2)).toEqual([
            [first[0], first[1], 'linear', 'both'],
            [second[0], second[1], 'linear', 'both'],
        ]);
    });

    it("keeps the pace in proportion to the exit's time", () => {
        const surface = mount('--ui-fx-exit-time: 480ms');

        exit(surface);

        expect(clocks(surface)[1]?.slice(0, 2)).toEqual([second[0] * 2, second[1] * 2]);
    });

    it('fades each piece out as its clock runs, frame by frame', async () => {
        const surface = mount();

        exit(surface);
        await hold(surface, 300);

        expect(slopes(surface)[0], 'the first kind').toBeCloseTo(
            1 - (300 - first[0]) / first[1],
            4,
        );
        expect(slopes(surface)[1], 'the second').toBeCloseTo(1 - (300 - second[0]) / second[1], 4);
    });

    it('leaves the surface cut, every piece gone, until it is mended', async () => {
        const surface = mount();

        exit(surface);
        await finish(surface);
        await new Promise(requestAnimationFrame);

        expect(new Set(slopes(surface)), 'every piece gone').toEqual(new Set([0]));

        mend(surface);

        expect([surface.style.filter, surface.style.rotate]).toEqual(['', '']);
        expect(document.body.querySelector(':scope > svg'), 'the filter gone').toBeNull();

        const asked = vi.spyOn(window, 'requestAnimationFrame');
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(asked, 'no frame asked for').not.toHaveBeenCalled();
    });

    it('cuts nothing where the sheet chose another exit', () => {
        const surface = mount('--ui-fx-exit: fade');

        exit(surface);

        expect(surface.style.filter).toBe('');
    });
});

/** The offset the grain's matrix ends its alpha row in: 1 where every pixel is whole, -6 where none is. */
function offset(surface: HTMLElement): string {
    const values = filterOf(surface).querySelector('feColorMatrix')?.getAttribute('values') ?? '';

    return values.split(/\s+/).at(-1) ?? '';
}

describe('dissolving a surface', () => {
    /** What a sheet hands a surface for the grain, over the pieces the fixture is handed. */
    const grained = '--ui-fx-enter: dissolve; --ui-fx-exit: dissolve';

    it('brings it out of a grain under one filter, with room round it for a glow and a seed of its own', () => {
        const surface = mount(grained);

        enter(surface);

        const filter = filterOf(surface);
        const read = (selector: string, names: readonly string[]): (string | null)[] => {
            const element = selector === '' ? filter : filter.querySelector(selector);

            return names.map((name) => element?.getAttribute(name) ?? null);
        };

        expect(filter.id).toMatch(/^ui-grain-\d+$/);
        expect(read('', ['x', 'y', 'width', 'height', 'color-interpolation-filters'])).toEqual([
            '-25%',
            '-25%',
            '150%',
            '150%',
            'sRGB',
        ]);
        expect(
            read('feTurbulence', ['type', 'baseFrequency', 'numOctaves', 'seed', 'result']),
            'the noise',
        ).toEqual(['fractalNoise', '0.62', '1', '200', 'grain']);
        expect(read('feColorMatrix', ['in', 'type', 'result']), 'made alpha').toEqual([
            'grain',
            'matrix',
            'mask',
        ]);
        expect(read('feComposite', ['in', 'in2', 'operator']), 'the surface kept there').toEqual([
            'SourceGraphic',
            'mask',
            'in',
        ]);
        expect(
            filter.querySelector('feColorMatrix')?.getAttribute('values'),
            'none of it yet',
        ).toBe('0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  6 0 0 0 -6.000');
        expect(filter.parentElement?.getAttribute('aria-hidden'), 'out of what is read').toBe(
            'true',
        );
        expect(surface.style.rotate, 'no turn, counting no pixels').toBe('');
    });

    it('runs the grain on one clock on the surface, 780ms at the judged entrance, on the curve handed over', () => {
        const surface = mount(grained);

        enter(surface);

        expect(clocks(surface)).toEqual([[0, 780, 'linear', 'forwards']]);
    });

    it("runs it in proportion to the entrance's time", () => {
        const surface = mount(`${grained}; --ui-fx-enter-time: 720ms`);

        enter(surface);

        expect(clocks(surface)[0]?.[1]).toBe(1560);
    });

    it("moves the threshold through the grain's span as its clock runs, exact at either end", async () => {
        const surface = mount(grained);

        enter(surface);

        // Halfway, half the span: 0.22 and half of 0.53 is 0.485, which takes the offset to
        // 1 - 7 x 0.485.
        for (const [time, at] of [
            [0, '-6.000'],
            [390, '-2.395'],
            [780, '1.000'],
        ] as const) {
            await hold(surface, time);

            expect(offset(surface), `at ${String(time)}ms`).toBe(at);
        }
    });

    it('gives the surface back whole once it is out of the grain, and draws nothing after', async () => {
        const surface = mount(grained);

        enter(surface);
        await finish(surface);

        expect(surface.style.filter).toBe('');
        expect(document.body.querySelector(':scope > svg'), 'the filter gone').toBeNull();

        const asked = vi.spyOn(window, 'requestAnimationFrame');
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(asked, 'no frame asked for').not.toHaveBeenCalled();
    });

    it('dissolves it into a grain as it leaves, 780ms at the judged exit, and leaves it gone until mended', async () => {
        const surface = mount(grained);

        exit(surface);

        expect(clocks(surface), 'its clock').toEqual([[0, 780, 'linear', 'forwards']]);
        expect(offset(surface), 'whole yet').toBe('1.000');

        await finish(surface);
        await new Promise(requestAnimationFrame);

        expect(offset(surface), 'none of it left').toBe('-6.000');

        mend(surface);

        expect(surface.style.filter).toBe('');
    });

    it('gives the surface back the filter and the turn of its own it had, turning it only for its pieces', async () => {
        const kept = 'filter: grayscale(1); rotate: 3deg';
        const dissolving = mount(`${grained}; ${kept}`);
        const pieced = mount(kept);

        enter(dissolving);
        enter(pieced);

        expect([dissolving.style.rotate, pieced.style.rotate], 'while drawn').toEqual([
            '3deg',
            '0deg',
        ]);

        await finish(dissolving);
        await finish(pieced);

        for (const surface of [dissolving, pieced]) {
            expect([surface.style.filter, surface.style.rotate], 'after').toEqual([
                'grayscale(1)',
                '3deg',
            ]);
        }
    });
});

describe('mending', () => {
    it('ends whatever was cutting the surface, so the next cut starts from it whole', () => {
        const surface = mount();

        enter(surface);
        exit(surface);

        expect(document.body.querySelectorAll(':scope > svg'), 'one filter').toHaveLength(1);
        expect(surface.getAnimations(), "the first cut's clocks stopped").toHaveLength(36);
        expect(slopes(surface)[0], 'breaking from whole').toBe(1);
    });

    it('gives a surface that arrives anew while it was breaking back whole, whatever it arrives with', () => {
        const pieced = mount();
        const plain = mount('--ui-fx-enter: fade');

        for (const surface of [pieced, plain]) {
            exit(surface);
            enter(surface);
        }

        expect(document.body.querySelectorAll(':scope > svg'), 'one filter').toHaveLength(1);
        expect(pieced.getAnimations(), 'its arrival alone').toHaveLength(36);
        expect(
            [plain.style.filter, plain.getAnimations().length],
            'nothing to arrive with',
        ).toEqual(['', 0]);
    });

    it('leaves a whole surface as it was', () => {
        const surface = mount();

        mend(surface);

        expect(surface.style.filter).toBe('');
    });

    it('leaves a surface alone once it is whole again, a filter of its own included', async () => {
        const surface = mount();

        enter(surface);
        await finish(surface);
        surface.style.filter = 'grayscale(1)';
        mend(surface);

        expect(surface.style.filter).toBe('grayscale(1)');
    });

    it("counts its pace from the entrance's and the exit's own defaults", () => {
        // The pieces are fitted at 360ms and paced at 240ms, the review's: what the two times are
        // where nobody moved them.
        const probe = document.createElement('div');
        probe.style.transitionDuration = `${String(reference('--ui-duration-enter'))}, ${String(reference('--ui-duration-exit'))}`;
        document.body.append(probe);

        expect(getComputedStyle(probe).transitionDuration).toBe('0.36s, 0.24s');
    });
});

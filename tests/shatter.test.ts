import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { cdp } from 'vitest/browser';
// The playwright provider is what puts `send` on `CDPSession` — see `tokens.test.ts`.
import type {} from '@vitest/browser-playwright';
import { press } from '../src/shatter.js';

/** A piece as the filter draws it: its region's corner and size, and how far it is moved. */
type Piece = readonly [x: number, y: number, width: number, height: number, dx: number, dy: number];

/**
 * A button `width` by `height` that shatters, in a shadow root of its own unless `bare`: while it
 * can be used, it carries what a component's sheet declares under the shatter's query — the choice,
 * and a return long enough to read partway on a straight curve, so its progress is its time.
 */
async function mount(width: number, height: number, bare = false): Promise<HTMLButtonElement> {
    const host = document.createElement('div');
    // Away from the page's corner, so where the pointer struck is read off the button's own.
    host.style.margin = '31px 0 0 53px';
    const tree = bare ? host : host.attachShadow({ mode: 'open' });
    tree.innerHTML = `
        <style>
            button {
                box-sizing: border-box;
                width: ${String(width)}px;
                height: ${String(height)}px;
                margin: 0;
                padding: 0;
                border: 0;
                font: 10px monospace;
            }
            button:not(:disabled) {
                --ui-fx-press: shatter;
                --ui-fx-press-time: 10s;
                --ui-fx-press-curve: linear;
            }
        </style>
        <button>B</button>`;
    document.body.append(host);

    const button = tree.querySelector('button');

    if (button === null) {
        throw new Error('no button in the fixture');
    }

    button.addEventListener('pointerdown', press);
    button.addEventListener('keydown', press);
    await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
            resolve();
        });
    });

    return button;
}

/**
 * Puts a pointer's `which` button down on the button at `x`, `y` in its own pixels, or lets it go
 * there. Dispatched rather than driven, because a driven pointer lands where the frame the suite
 * runs in is drawn, which the runner scales: aimed 5px in, it arrived 6.2px in — measured.
 */
function pointer(button: HTMLButtonElement, x: number, y: number, down: boolean, which = 0): void {
    const box = button.getBoundingClientRect();

    button.dispatchEvent(
        new PointerEvent(down ? 'pointerdown' : 'pointerup', {
            bubbles: true,
            composed: true,
            clientX: box.left + x,
            clientY: box.top + y,
            button: which,
            pointerId: 1,
        }),
    );
}

/** Holds `key` down on whatever has the focus, or lets it come up. */
async function key(down: boolean, which: 'Space' | 'KeyA' = 'Space'): Promise<void> {
    await cdp().send('Input.dispatchKeyEvent', {
        type: down ? 'keyDown' : 'keyUp',
        key: which === 'Space' ? ' ' : 'a',
        code: which,
        windowsVirtualKeyCode: which === 'Space' ? 32 : 65,
    });
}

/** The tree a button's filter goes in: its shadow root, or the page's body for one in none. */
function tree(button: HTMLButtonElement): ParentNode {
    const root = button.getRootNode();

    return root instanceof ShadowRoot ? root : document.body;
}

/** The pieces the button's filter draws now, in the order it draws them. */
function pieces(button: HTMLButtonElement): readonly Piece[] {
    return [...tree(button).querySelectorAll('feOffset')].map((offset) => {
        const read = (name: string): number => Number(offset.getAttribute(name));

        return [read('x'), read('y'), read('width'), read('height'), read('dx'), read('dy')];
    });
}

/** The clock the pieces go back together on, which runs on the button. */
function clock(button: HTMLButtonElement): Animation {
    const [running] = button.getAnimations();

    if (running === undefined) {
        throw new Error('nothing is going back together');
    }

    return running;
}

/** Holds the return `at` a time of its own, and lets a frame place the pieces where that is. */
async function hold(button: HTMLButtonElement, at: number): Promise<void> {
    const running = clock(button);

    running.pause();
    running.currentTime = at;
    await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
            resolve();
        });
    });
}

beforeEach(() => {
    // Each cut in the middle of its cell, and no slide along the crack, unless a test says.
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
});

afterEach(async () => {
    window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1 }));
    await key(false);
    vi.restoreAllMocks();

    for (const button of document.querySelectorAll('button')) {
        for (const running of button.getAnimations()) {
            running.finish();
        }
    }

    document.body.replaceChildren();
});

describe('where a press cuts the button', () => {
    it('breaks it where the pointer struck it, the struck piece left where it is', async () => {
        const button = await mount(40, 20);

        pointer(button, 10, 10, true);

        // Smallest round the point: the cells nearest it are cut first, each across its longer
        // side, and across each cut the side the point is not on is pushed off by 2px. The outer
        // cells reach 68px past the button: 4rem, and the furthest piece's 4px.
        expect(pieces(button)).toEqual([
            [-70, -70, 78, 78, -2, -2],
            [10, -70, 10, 78, 0, -2],
            [-70, 10, 78, 78, -2, 0],
            [10, 10, 10, 78, 0, 0],
            [22, -70, 10, 78, 2, -2],
            [34, -70, 78, 78, 4, -2],
            [22, 10, 10, 78, 2, 0],
            [34, 10, 78, 78, 4, 0],
        ]);
    });

    it('slides each crack along where chance says, and cuts no cell too small to cut', async () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.75);
        const button = await mount(30, 20);

        pointer(button, 5, 10, true);

        // Cut three fifths along, each pushed piece slid a pixel; the cells of 18px are cut again,
        // and the six left are all under it, so the cutting stops short of eight.
        expect(pieces(button)).toEqual([
            [-67, -67, 78, 79, 0, 0],
            [13, -66, 7, 79, 2, 1],
            [-66, 14, 78, 75, 1, 2],
            [14, 15, 7, 75, 3, 3],
            [20, -66, 79, 79, 2, 1],
            [21, 15, 79, 75, 3, 3],
        ]);
    });

    it('strikes the middle for Space, and cuts a cell a quarter again as wide as it is tall along its height', async () => {
        const button = await mount(25, 20);
        button.focus();

        await key(true);

        expect(pieces(button)).toEqual([
            [-66, -68, 79, 76, 0, -2],
            [15, -68, 78, 76, 2, -2],
            [-66, 10, 79, 76, 0, 0],
            [15, 10, 78, 76, 2, 0],
        ]);
    });

    it('cuts first the cells largest for how near the point they lie, the first of equals first', async () => {
        const button = await mount(80, 32);

        pointer(button, 20, 16, true);

        // Eight pieces, where its area asks for no more, with cells still big enough to cut: so
        // which cells were cut is the order they were claimed in. Four cells claim the same at the
        // sixth cut and three at the seventh, and the first of them goes each time.
        expect(pieces(button)).toEqual([
            [-70, -72, 88, 76, -2, -4],
            [-70, 6, 88, 8, -2, -2],
            [20, -72, 20, 76, 0, -4],
            [20, 6, 20, 8, 0, -2],
            [-70, 16, 88, 84, -2, 0],
            [20, 16, 20, 84, 0, 0],
            [42, -70, 108, 84, 2, -2],
            [42, 16, 108, 84, 2, 0],
        ]);
    });

    it('measures how near a cell lies from its middle, down as well as across', async () => {
        const button = await mount(80, 32);

        pointer(button, 20, 28, true);

        // Struck near the bottom: the lower half's cells are nearer, and cut before the upper.
        expect(pieces(button)).toEqual([
            [-68, -68, 86, 82, -2, -2],
            [20, -68, 20, 82, 0, -2],
            [-68, 14, 86, 8, -2, -2],
            [-68, 24, 86, 74, -2, 0],
            [20, 14, 20, 8, 0, -2],
            [20, 24, 20, 74, 0, 0],
            [42, -68, 106, 82, 2, -2],
            [42, 16, 106, 82, 2, 0],
        ]);
    });

    it('strikes the middle for Space on its way down as well as across', async () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.75);
        const button = await mount(20, 20);
        button.focus();

        await key(true);

        // The first cut three fifths down, below the middle: the side under it is pushed off.
        expect(pieces(button)).toEqual([
            [-67, -67, 79, 79, 0, 0],
            [14, -66, 75, 79, 2, 1],
            [-66, 14, 79, 75, 1, 2],
            [15, 15, 75, 75, 3, 3],
        ]);
    });

    it.each([
        [200, 40, 16],
        [100, 40, 11],
    ])(
        'cuts a %ipx by %ipx button into %i pieces, as its area asks, between eight and sixteen',
        async (width, height, count) => {
            const button = await mount(width, height);

            pointer(button, width / 2, height / 2, true);

            expect(pieces(button)).toHaveLength(count);
        },
    );
});

describe('the filter that cuts it', () => {
    it('takes in 4rem round the button and the furthest piece, in its own pixels', async () => {
        const button = await mount(40, 20);

        pointer(button, 10, 10, true);

        const filter = tree(button).querySelector('filter');
        const read = (name: string): string | null | undefined => filter?.getAttribute(name);

        expect(filter).toBeInstanceOf(SVGFilterElement);
        expect(
            ['id', 'filterUnits', 'primitiveUnits', 'x', 'y', 'width', 'height'].map(read),
        ).toEqual(['ui-break', 'userSpaceOnUse', 'userSpaceOnUse', '-68', '-68', '176', '156']);
        expect(read('color-interpolation-filters')).toBe('sRGB');
        expect(button.style.filter).toBe('url("#ui-break")');
    });

    it('breaks only what the button draws solid, and lays the pieces over its glow', async () => {
        const button = await mount(40, 20);

        pointer(button, 10, 10, true);

        const filter = tree(button).querySelector('filter');
        const [solid, core, halo] = filter?.children ?? [];
        const attributes = (element: Element | undefined): Record<string, string> =>
            Object.fromEntries(
                [...(element?.attributes ?? [])].map(({ name, value }) => [name, value]),
            );

        expect(solid?.localName).toBe('feComponentTransfer');
        expect(attributes(solid)).toEqual({ in: 'SourceAlpha', result: 'solid' });
        expect(attributes(solid?.firstElementChild ?? undefined)).toEqual({
            type: 'discrete',
            tableValues: '0 1',
        });
        expect(attributes(core)).toEqual({
            in: 'SourceGraphic',
            in2: 'solid',
            operator: 'in',
            result: 'core',
        });
        expect(attributes(halo)).toEqual({
            in: 'SourceGraphic',
            in2: 'solid',
            operator: 'out',
            result: 'halo',
        });
        expect([...(filter?.querySelectorAll('feOffset') ?? [])].map(attributes)[1]).toMatchObject({
            in: 'core',
            result: 'piece-1',
        });
        expect(
            [...(filter?.querySelectorAll('feMergeNode') ?? [])].map((node) =>
                node.getAttribute('in'),
            ),
        ).toEqual(['halo', ...Array.from({ length: 8 }, (_, index) => `piece-${String(index)}`)]);
    });

    it('goes in the shadow root the button is in, hidden and taking no room', async () => {
        const button = await mount(40, 20);
        const root = button.getRootNode() as ShadowRoot;
        const before = root.host.getBoundingClientRect().height;

        pointer(button, 10, 10, true);

        const holder = root.querySelector('svg');

        expect(holder?.parentNode).toBe(root);
        expect(holder?.getAttribute('aria-hidden')).toBe('true');
        expect(root.host.getBoundingClientRect().height).toBe(before);
    });

    it("goes in the page's body for a button in no shadow root", async () => {
        const button = await mount(40, 20, true);

        pointer(button, 10, 10, true);

        expect(document.body.querySelector(':scope > svg filter')).toBeInstanceOf(SVGFilterElement);
    });

    it('takes the button a turn of nothing while it is in pieces, which WebKit counts from', async () => {
        const button = await mount(40, 20);

        pointer(button, 10, 10, true);

        expect(button.style.rotate).toBe('0deg');
    });
});

describe('the press it holds for', () => {
    it('goes back together over the time and on the curve handed over, on device pixels', async () => {
        await cdp().send('Emulation.setDeviceMetricsOverride', {
            width: 414,
            height: 896,
            deviceScaleFactor: 2,
            mobile: false,
        });
        onTestFinished(async () => {
            await cdp().send('Emulation.clearDeviceMetricsOverride');
        });
        const button = await mount(40, 20);

        pointer(button, 10, 10, true);
        pointer(button, 10, 10, false);

        const timing = clock(button).effect?.getTiming();

        expect([timing?.duration, timing?.easing]).toEqual([10000, 'linear']);

        // Seven tenths of the way back: the 2px a piece was held off is 0.6px, held on the half
        // pixel a 2x display draws, where a 1x display would hold it on a whole one; and the 4px
        // is 1.2px, on 1.
        await hold(button, 7000);

        expect(pieces(button)[0]).toEqual([-68.5, -68.5, 78, 78, -0.5, -0.5]);
        expect(pieces(button)[5]).toEqual([31, -68.5, 78, 78, 1, -0.5]);

        // And frame after frame: nine tenths back, the 4px is 0.4px, on the half pixel.
        await hold(button, 9000);

        expect(pieces(button)[5]).toEqual([30.5, -68, 78, 78, 0.5, 0]);
    });

    it('takes the filter away once the pieces are together, and breaks anew on the next press', async () => {
        const button = await mount(40, 20);

        pointer(button, 10, 10, true);
        pointer(button, 10, 10, false);

        const running = clock(button);

        running.finish();
        await running.finished;
        await new Promise((resolve) => setTimeout(resolve));

        expect([button.style.filter, button.style.rotate]).toEqual(['', '']);
        expect(tree(button).querySelector('svg')).toBeNull();

        pointer(button, 30, 10, true);

        // Cut afresh round where it was struck this time: the piece there is the one left put.
        expect(tree(button).querySelectorAll('svg')).toHaveLength(1);
        expect(pieces(button)[0]).toEqual([-72, -70, 78, 78, -4, -2]);
        expect(pieces(button)[7]).toEqual([30, 10, 78, 78, 0, 0]);
    });

    it('parts the pieces again, from where they are, under a press while they go back', async () => {
        const button = await mount(40, 20);

        pointer(button, 10, 10, true);
        pointer(button, 10, 10, false);
        await hold(button, 5000);

        const going = clock(button);

        pointer(button, 10, 10, true);
        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
                resolve();
            });
        });

        expect(going.playState, 'the return given up').toBe('idle');
        expect(tree(button).querySelectorAll('svg'), 'the same filter').toHaveLength(1);
        expect(pieces(button)[0]).toEqual([-70, -70, 78, 78, -2, -2]);
    });

    it('holds until Space comes up, whatever other key does', async () => {
        const button = await mount(40, 20);
        button.focus();

        await key(true);
        await key(true, 'KeyA');
        await key(false, 'KeyA');

        expect(button.getAnimations(), 'still apart').toHaveLength(0);

        await key(false);

        expect(button.getAnimations(), 'going back').toHaveLength(1);
    });

    it('holds a press by Space until the focus leaves, if it leaves first', async () => {
        const button = await mount(40, 20);
        button.focus();

        await key(true);
        button.blur();

        expect(button.getAnimations()).toHaveLength(1);
    });

    it("holds a pointer's press until that pointer comes up, or is cancelled", async () => {
        const button = await mount(40, 20);

        pointer(button, 10, 10, true);
        window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 99 }));

        expect(button.getAnimations(), 'another pointer let go').toHaveLength(0);

        window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1 }));

        expect(button.getAnimations(), 'this one cancelled').toHaveLength(1);
    });

    it('hears the end of a press the page stops on its way up', async () => {
        const button = await mount(40, 20);
        const stop = (event: Event): void => {
            event.stopPropagation();
        };

        document.addEventListener('pointerup', stop);

        try {
            pointer(button, 10, 10, true);
            pointer(button, 10, 10, false);

            expect(button.getAnimations()).toHaveLength(1);
        } finally {
            document.removeEventListener('pointerup', stop);
        }
    });

    it('lets go of a press once, so a stray end after it starts nothing', async () => {
        const button = await mount(40, 20);

        pointer(button, 10, 10, true);
        pointer(button, 10, 10, false);
        await hold(button, 5000);

        const going = clock(button);

        window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1 }));

        expect(going.playState).toBe('paused');
    });
});

describe('a press it leaves alone', () => {
    it.each([
        [
            'another key',
            async (button: HTMLButtonElement) => {
                button.focus();
                await key(true, 'KeyA');
            },
        ],
        [
            'another button of the pointer',
            (button: HTMLButtonElement) => {
                pointer(button, 10, 10, true, 2);
                pointer(button, 10, 10, false, 2);
            },
        ],
    ] as const)('breaks nothing for %s', async (_press, act) => {
        const button = await mount(40, 20);

        await act(button);

        expect(tree(button).querySelector('svg')).toBeNull();
    });

    it.each([
        ['a sheet that chose no shatter', '--ui-fx-press', 'none'],
        ['the collapse, which took the time to 0.01ms', '--ui-fx-press-time', '0.01ms'],
        ['a host who took the time to nothing', '--ui-fx-press-time', '0s'],
    ])('breaks nothing under %s', async (_where, name, value) => {
        const button = await mount(40, 20);
        button.style.setProperty(name, value);

        pointer(button, 10, 10, true);

        expect(tree(button).querySelector('svg')).toBeNull();
    });
});

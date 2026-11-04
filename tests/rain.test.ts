import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { cdp } from 'vitest/browser';
// The playwright provider is what puts `send` on `CDPSession` — see `button.test.ts`.
import type {} from '@vitest/browser-playwright';
import { rain } from '../src/rain.js';

/** One character the rain asked a canvas to draw, and how. */
interface Stroke {
    readonly glyph: string;
    /** Where its centre lands, in the tile's own pixels. */
    readonly x: number;
    readonly y: number;
    readonly mirrored: boolean;
    /** The device pixels a tile pixel was drawn at. */
    readonly scale: number;
    readonly alpha: number;
    readonly fill: string;
    readonly font: string;
    readonly align: string;
    readonly baseline: string;
    readonly shadow: string;
    readonly blur: number;
}

/** `value` to `digits` places: the canvas keeps a transform and a blur in single precision. */
function near(value: number, digits = 3): number {
    return Number(value.toFixed(digits));
}

/**
 * How far the layer a character is drawn on reaches past its tile, in the tile's own pixels: a
 * character's size, in whole device pixels.
 */
function reach(font: string, scale: number): number {
    const size = Number(/(\d+)px/.exec(font)?.[1] ?? 0);

    return Math.ceil(size * scale) / scale;
}

/** Records every character the rain draws, in order, in place of drawing it. */
function recorded(): Stroke[] {
    const strokes: Stroke[] = [];

    vi.spyOn(OffscreenCanvasRenderingContext2D.prototype, 'fillText').mockImplementation(function (
        this: OffscreenCanvasRenderingContext2D,
        glyph: string,
    ) {
        const { a, d, e, f } = this.getTransform();
        // Where it lands on the tile: where it lands on the layer, less the layer's reach.
        const margin = reach(this.font, d);

        strokes.push({
            glyph,
            x: near(e / d - margin),
            y: near(f / d - margin),
            mirrored: a < 0,
            scale: d,
            alpha: this.globalAlpha,
            fill: typeof this.fillStyle === 'string' ? this.fillStyle : 'a pattern',
            font: this.font,
            align: this.textAlign,
            baseline: this.textBaseline,
            shadow: this.shadowColor,
            blur: near(this.shadowBlur),
        });
    });

    return strokes;
}

/** One picture laid on a tile: its size and where, and the shadow it was laid with. */
interface Laid {
    readonly picture: readonly [number, number];
    readonly at: readonly [number, number];
    readonly tile: readonly [number, number];
    readonly shadow: string;
    readonly blur: number;
    readonly alpha: number;
}

/** Records every picture laid on a canvas, in order, in place of laying it. */
function laid(): Laid[] {
    const pictures: Laid[] = [];

    vi.spyOn(OffscreenCanvasRenderingContext2D.prototype, 'drawImage').mockImplementation(function (
        this: OffscreenCanvasRenderingContext2D,
        picture: CanvasImageSource,
        x: number,
        y: number,
    ) {
        const { width, height } = picture as OffscreenCanvas;

        pictures.push({
            picture: [width, height],
            at: [x, y],
            tile: [this.canvas.width, this.canvas.height],
            shadow: this.shadowColor,
            blur: near(this.shadowBlur),
            alpha: this.globalAlpha,
        });
    });

    return pictures;
}

/** Answers every draw of `Math.random` from `values`, round and round. */
function pinned(values: readonly number[]): void {
    let at = 0;

    vi.spyOn(Math, 'random').mockImplementation(() => {
        const value = values[at % values.length] ?? 0;
        at += 1;

        return value;
    });
}

/** The strokes of one depth, told apart by the size its font names. */
function depth(strokes: readonly Stroke[], size: number): Stroke[] {
    return strokes.filter(({ font }) => font.includes(`${String(size)}px`));
}

/** The tiles the layers name: each one's blob URL and its size in the page's pixels. */
function tiles(layers: string): (readonly [string, number, number])[] {
    return layers.split(', ').map((layer) => {
        const [, url = '', width = '', height = ''] =
            /^url\("(blob:[^"]+)"\) 0 0 \/ (\d+)px (\d+)px$/.exec(layer) ?? [];

        return [url, Number(width), Number(height)];
    });
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('the rain', () => {
    it("lays three tiles, nearest first, each a blob from its corner at its size in the page's pixels", async () => {
        recorded();
        pinned([0.5]);

        const layers = tiles(await rain('rgb(0, 255, 65)'));

        expect(layers.map(([, width, height]) => [width, height])).toEqual([
            [630, 600],
            [525, 520],
            [400, 440],
        ]);
        expect(layers.map(([url]) => url.startsWith('blob:'))).toEqual([true, true, true]);
    });

    it.each([
        [1, [630, 600], 1],
        [2, [1260, 1200], 2],
        [3, [1260, 1200], 2],
    ] as const)(
        "draws each tile at the display's density, up to twice the page's pixels: %s",
        async (density, size, scale) => {
            await cdp().send('Emulation.setDeviceMetricsOverride', {
                width: 414,
                height: 896,
                deviceScaleFactor: density,
                mobile: false,
            });
            onTestFinished(async () => {
                await cdp().send('Emulation.clearDeviceMetricsOverride');
            });
            const strokes = recorded();
            pinned([0.5]);

            const [[url] = ['']] = tiles(await rain('rgb(0, 255, 65)'));
            const picture = await createImageBitmap(await (await fetch(url)).blob());

            expect([picture.width, picture.height]).toEqual(size);
            expect(strokes[0]?.scale).toBe(scale);
        },
    );

    it.each([
        [18, 1],
        [13, 0.7],
        [9, 0.45],
    ] as const)(
        'draws its %spx depth sharp, in bold type, centred on its point',
        async (size, strength) => {
            const strokes = recorded();
            pinned([0.5]);

            await rain('rgb(0, 255, 65)');

            const [head, , white] = depth(strokes, size);

            expect(head).toMatchObject({
                font: `bold ${String(size)}px "Courier New", Courier, ui-monospace, monospace`,
                align: 'center',
                baseline: 'middle',
                shadow: 'rgba(0, 0, 0, 0)',
                fill: '#00ff41',
                alpha: strength,
            });
            expect(head?.blur, 'its glow is laid with the tile').toBe(0);
            expect(white, 'its head lit nearly white over its own colour').toMatchObject({
                fill: '#ffffff',
                glyph: head?.glyph,
                x: head?.x,
                y: head?.y,
            });
            expect(white?.alpha).toBeCloseTo(strength * 0.65, 9);
        },
    );

    it.each([
        [
            1,
            [
                [
                    [666, 636],
                    [-18, -18],
                    [630, 600],
                ],
                [
                    [551, 546],
                    [-13, -13],
                    [525, 520],
                ],
                [
                    [418, 458],
                    [-9, -9],
                    [400, 440],
                ],
            ],
        ],
        [
            1.25,
            [
                [
                    [834, 796],
                    [-23, -23],
                    [788, 750],
                ],
                [
                    [690, 684],
                    [-17, -17],
                    [656, 650],
                ],
                [
                    [524, 574],
                    [-12, -12],
                    [500, 550],
                ],
            ],
        ],
        [
            2,
            [
                [
                    [1332, 1272],
                    [-36, -36],
                    [1260, 1200],
                ],
                [
                    [1102, 1092],
                    [-26, -26],
                    [1050, 1040],
                ],
                [
                    [836, 916],
                    [-18, -18],
                    [800, 880],
                ],
            ],
        ],
    ] as const)(
        "lays each depth's characters on its tile once, glowing in the colour handed in, at a density of %s",
        async (density, expected) => {
            // The layer reaches a character's size past each edge, in whole device pixels, so a
            // character's glow is whole across an edge and the layer lies on the tile's pixels.
            await cdp().send('Emulation.setDeviceMetricsOverride', {
                width: 414,
                height: 896,
                deviceScaleFactor: density,
                mobile: false,
            });
            onTestFinished(async () => {
                await cdp().send('Emulation.clearDeviceMetricsOverride');
            });
            const pictures = laid();
            recorded();
            pinned([0.5]);

            await rain('rgb(0, 255, 65)');

            expect(pictures.map(({ picture, at, tile }) => [picture, at, tile])).toEqual(expected);
            expect(pictures.map(({ shadow, blur, alpha }) => [shadow, blur, alpha])).toEqual([
                ['#00ff41', 10.8, 1],
                ['#00ff41', 7.8, 1],
                ['#00ff41', 5.4, 1],
            ]);
        },
    );

    it('lights a trail at its head and fades it toward its tail, a row at a time', async () => {
        // Every draw at a half: no trail skipped, eleven characters long in the nearest depth's
        // twenty-six rows, its head on the fourteenth, each an S, none mirrored.
        const strokes = recorded();
        pinned([0.5]);

        await rain('rgb(0, 255, 65)');

        const line = 600 / 26;
        // The first column's first trail, each character as drawn where it lies, not its copy
        // across the edge, nor its head's white.
        const trail = depth(strokes, 18)
            .filter(({ x, fill }) => x === 10.5 && fill === '#00ff41')
            .slice(0, 11);

        expect(trail.map(({ glyph, mirrored }) => [glyph, mirrored])).toEqual(
            Array.from({ length: 11 }, () => ['S', false]),
        );
        expect(trail.map(({ y }) => y)).toEqual(
            Array.from({ length: 11 }, (_, behind) => near((13 - behind) * line + line / 2)),
        );
        expect(trail.map(({ alpha }) => near(alpha, 5))).toEqual(
            Array.from({ length: 11 }, (_, behind) =>
                near(behind === 0 ? 1 : 0.08 + 0.8 * (1 - behind / 11), 5),
            ),
        );
    });

    it('lays a column a pitch apart, two trails a column at most', async () => {
        const strokes = recorded();
        pinned([0.5]);

        await rain('rgb(0, 255, 65)');

        const nearest = depth(strokes, 18);
        const columns = [...new Set(nearest.map(({ x }) => x).filter((x) => x > 0 && x < 630))];

        expect(columns).toEqual(Array.from({ length: 30 }, (_, column) => column * 21 + 10.5));
        // Thirty columns of two trails, each eleven characters and a white head, and the two
        // outer columns drawn again across the edge their glow reaches past.
        expect(nearest).toHaveLength(30 * 2 * 12 + 2 * 2 * 12);
    });

    it('draws a character within its glow of an edge again across it, and mirrors one now and then', async () => {
        // The first trail's head on the first row, so its first character lies within a glow of
        // the top and its second of the bottom; its third is mirrored.
        const strokes = recorded();
        pinned([0.5, 0.5, 0]);

        await rain('rgb(0, 255, 65)');

        const line = 600 / 26;
        const top = near(line / 2);
        const bottom = near(25 * line + line / 2);
        const drawn = depth(strokes, 18).map(({ glyph, x, y, mirrored, fill }) => [
            glyph,
            x,
            y,
            mirrored,
            fill,
        ]);

        expect(drawn.slice(0, 12)).toEqual([
            ['S', 10.5, top, false, '#00ff41'],
            ['S', 10.5, near(top + 600), false, '#00ff41'],
            ['S', 640.5, top, false, '#00ff41'],
            ['S', 640.5, near(top + 600), false, '#00ff41'],
            ['S', 10.5, top, false, '#ffffff'],
            ['S', 10.5, near(top + 600), false, '#ffffff'],
            ['S', 640.5, top, false, '#ffffff'],
            ['S', 640.5, near(top + 600), false, '#ffffff'],
            ['A', 10.5, bottom, false, '#00ff41'],
            ['A', 10.5, near(bottom - 600), false, '#00ff41'],
            ['A', 640.5, bottom, false, '#00ff41'],
            ['A', 640.5, near(bottom - 600), false, '#00ff41'],
        ]);
        expect(drawn[12], 'the third, mirrored').toEqual([
            'S',
            10.5,
            near(24 * line + line / 2),
            true,
            '#00ff41',
        ]);
    });

    it("draws the last column's characters again across the start", async () => {
        const strokes = recorded();
        pinned([0.5]);

        await rain('rgb(0, 255, 65)');

        const last = depth(strokes, 18).filter(({ x }) => x === 619.5 || x === -10.5);

        expect(last.map(({ x }) => x).slice(0, 4)).toEqual([619.5, -10.5, 619.5, -10.5]);
    });

    it.each([
        ['skips every trail', 0.34, 0],
        ['draws every one', 0.35, 768],
    ] as const)('%s where each draw falls under 0.35 or not', async (_what, draw, count) => {
        const strokes = recorded();
        pinned([draw]);

        await rain('rgb(0, 255, 65)');

        expect(depth(strokes, 18).length).toBe(count);
    });

    it('mirrors a character only where its draw falls under 0.3', async () => {
        // Each trail draws a half, then 0.3 twice, so every character's mirroring draw is 0.3 or
        // a half.
        const strokes = recorded();
        pinned([0.5, 0.3, 0.3]);

        await rain('rgb(0, 255, 65)');

        expect(depth(strokes, 18).some(({ mirrored }) => mirrored)).toBe(false);
    });

    it('draws anew on every call', async () => {
        const strokes = recorded();
        pinned([0.5]);

        const first = await rain('rgb(0, 255, 65)');
        const drawn = strokes.length;
        const second = await rain('rgb(0, 255, 65)');

        expect(strokes.length).toBe(drawn * 2);
        expect(second).not.toBe(first);
    });
});

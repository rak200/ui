/**
 * The scrim's rain — RFC 0004's char-rain: the reference's falling code at three depths, each a
 * tile that repeats without a seam, drawn in the colour the accent resolves to.
 *
 * **Drawn on a canvas, in the colour handed in, because a picture cannot read a token**; and a
 * canvas rather than an SVG, so its glow is drawn once rather than on every frame the rain moves —
 * RFC 0004's prototype measured both. A tile is columns of characters, up to two trails a column,
 * each lit at its head and fading toward its tail, wrapped round the tile's height, with a
 * character mirrored now and then, as the film's are. A character within its glow of an edge is
 * drawn again across it, so the tile repeats without a seam.
 *
 * **Handed to the sheet by a blob URL rather than written into it**: as data URLs the three depths
 * came to 1.1MB or more in the property the scrim reads them from, and opening the dialog took 212
 * to 230ms in Chromium, where their blob URLs, under a kilobyte, took 28 to 57ms — measured for RFC
 * 0004. A tile is drawn at the display's density, up to twice the page's pixels.
 *
 * **The sheet decides, and this only draws.** The dialog asks for the rain where its sheet chose
 * it and forced colours have not taken it away, and the sheet decides how it falls. Nothing here is
 * remembered: the dialog keeps what it has drawn.
 *
 * Internal — it is not re-exported from `src/index.ts`.
 */

/**
 * One depth of the rain: how big a character is, how strongly it is drawn, and its tile, in whole
 * columns and rows and in the page's pixels.
 */
interface Depth {
    readonly size: number;
    readonly strength: number;
    readonly columns: number;
    readonly rows: number;
    readonly width: number;
    readonly height: number;
}

/**
 * The rain's depths, nearest first, the reference's: a tile of 640 by 600 for the nearest, 520 by
 * 520 for the middle and 400 by 440 behind, cut into columns 1.15 characters wide and rows 1.3 tall,
 * each a whole number, so a tile repeats on a whole one of each. Each tile has a size of its own, so
 * the three do not repeat together: with one size for all, the repeat lined up across them and
 * showed.
 *
 * **Written as whole numbers rather than worked out**, so no slip in the working can make a canvas
 * thousands of columns wide, which holds the page's memory for as long as it is drawn on.
 */
const depths: readonly Depth[] = [
    { size: 18, strength: 1, columns: 30, rows: 26, width: 630, height: 600 },
    { size: 13, strength: 0.7, columns: 35, rows: 31, width: 525, height: 520 },
    { size: 9, strength: 0.45, columns: 40, rows: 38, width: 400, height: 440 },
];

/** The characters the reference's falling code is written in. */
const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * The whole numbers from 0 up to `count`, not including it, and none for a count under one: what the
 * rain's loops walk, which no slip can turn into a loop that never ends or a count that throws.
 */
function upTo(count: number): number[] {
    return Array.from({ length: Math.max(count, 0) }, (_, at) => at);
}

/** Runs `draw` on `canvas`'s 2D context, which a canvas made here always has. */
function on(
    canvas: OffscreenCanvas,
    draw: (context: OffscreenCanvasRenderingContext2D) => void,
): void {
    // A canvas made here answers null for nothing but a context of another kind, which it cannot
    // have: iterated rather than asserted, so no branch stands for a case nothing reaches.
    // Stryker disable next-line MethodExpression,ConditionalExpression: equivalent — without the
    // filter, or with one that keeps everything, the one context is drawn on all the same, since
    // it is never null; no input distinguishes either.
    for (const context of [canvas.getContext('2d')].filter((each) => each !== null)) {
        draw(context);
    }
}

/**
 * One depth's tile in `colour`, at `ratio` device pixels to a page pixel, as a layer the sheet lays:
 * its blob URL, from its corner, at its size in the page's pixels.
 *
 * **One blur a tile.** The characters are drawn sharp on a layer that reaches a glow past each edge,
 * and the layer is laid on the tile once, with the glow as its shadow. A shadow drawn with each
 * character was thousands of blurs a tile, and drawing the three took the page 79ms in Chromium in
 * software, 102ms on a GPU and 354ms in Firefox, as the dialog opened and over its entrance —
 * measured for #292. The layer's reach is in whole device pixels, so it lies on the tile's own.
 */
async function tile(
    colour: string,
    ratio: number,
    { size, strength, columns, rows, width, height }: Depth,
): Promise<string> {
    const pitch = width / columns;
    const line = height / rows;
    const wide = Math.round(width * ratio);
    const high = Math.round(height * ratio);
    const reach = Math.ceil(size * ratio);
    const layer = new OffscreenCanvas(wide + 2 * reach, high + 2 * reach);
    const canvas = new OffscreenCanvas(wide, high);

    on(layer, (context) => {
        context.translate(reach, reach);
        context.scale(ratio, ratio);
        context.font = `bold ${String(size)}px 'Courier New', Courier, ui-monospace, monospace`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        /** Draws `glyph` at `x`, `y`, and again across each edge its glow reaches past. */
        const stamp = (glyph: string, x: number, y: number, mirrored: boolean): void => {
            // The glow reaches a character's size out, and no centre lies exactly that far from an
            // edge at any depth.
            // Stryker disable next-line EqualityOperator: equivalent — a centre is half a pitch or
            // half a row past a whole number of them, never a whole character's size from an edge.
            const across = [0, ...(x < size ? [width] : []), ...(x > width - size ? [-width] : [])];
            // Each annotation sits on the line its operator is on, where the formatter left it.
            const down = [
                0,
                // Stryker disable next-line EqualityOperator: equivalent, for the same reason.
                ...(y < size ? [height] : []),
                // Stryker disable next-line EqualityOperator: equivalent, for the same reason.
                ...(y > height - size ? [-height] : []),
            ];

            for (const dx of across) {
                for (const dy of down) {
                    context.save();
                    context.translate(x + dx, y + dy);
                    context.scale(mirrored ? -1 : 1, 1);
                    context.fillText(glyph, 0, 0);
                    context.restore();
                }
            }
        };

        /** Draws a trail down `column`, or nothing, at random. */
        const trail = (column: number): void => {
            if (Math.random() < 0.35) {
                return;
            }

            const length = 6 + Math.floor(Math.random() * rows * 0.45);
            const head = Math.floor(Math.random() * rows);

            for (const behind of upTo(length)) {
                const row = (head - behind + rows) % rows;
                const glyph = glyphs.charAt(Math.floor(Math.random() * glyphs.length));
                const mirrored = Math.random() < 0.3;
                const x = column * pitch + pitch / 2;
                const y = row * line + line / 2;

                context.fillStyle = colour;
                context.globalAlpha =
                    strength * (behind === 0 ? 1 : 0.08 + 0.8 * (1 - behind / length));
                stamp(glyph, x, y, mirrored);

                if (behind === 0) {
                    // The head, lit nearly white over its own colour.
                    context.fillStyle = 'white';
                    context.globalAlpha = strength * 0.65;
                    stamp(glyph, x, y, mirrored);
                }
            }
        };

        for (const column of upTo(columns)) {
            // Up to two trails a column, so a tall tile is not sparse.
            trail(column);
            trail(column);
        }
    });

    on(canvas, (context) => {
        // The glow each character had, in the colour handed in: a shadow's blur is in the canvas's
        // own pixels, which no transform scales.
        context.shadowColor = colour;
        context.shadowBlur = size * 0.6;
        context.drawImage(layer, -reach, -reach);
    });

    const picture = await canvas.convertToBlob();

    return `url("${URL.createObjectURL(picture)}") 0 0 / ${String(width)}px ${String(height)}px`;
}

/**
 * The rain's three depths in `colour`, nearest first, as the layers the scrim lays over its own
 * colour, at the display's density up to twice the page's pixels: drawn anew on every call.
 */
export async function rain(colour: string): Promise<string> {
    const ratio = Math.min(devicePixelRatio, 2);
    const layers = await Promise.all(depths.map((depth) => tile(colour, ratio, depth)));

    return layers.join(', ');
}

/**
 * The half every prototype page shares: the components each one renders, and the floors
 * measured over every rendering.
 *
 * Proposal material rather than a consumer demo, so it reaches under the barrel on purpose.
 * A floor is read through `reference()`, the helper every component writes a token with, and
 * the ratio is the suite's own `contrastRatio()` — so a number on a page is the number
 * `tests/tokens.test.ts` would compute for the same palette. **What a page proposes is the
 * `<style>` in its own head**; nothing in this file is themed.
 */
import './scheme.js';
import '../../../src/index.js';

import { html, render, type TemplateResult } from 'lit';

import type { UiDialog } from '../../../src/dialog.js';
import { reference } from '../../../src/reference.js';
import { tokenStyleSheet, type DerivedToken, type Token } from '../../../src/tokens.js';
import { contrastRatio } from '../../../tests/contrast.js';

/** A resolved colour: sRGB channels from 0 to 255, and its opacity from 0 to 1. */
interface Colour {
    readonly red: number;
    readonly green: number;
    readonly blue: number;
    readonly alpha: number;
}

/** One floor, as a page reports it. */
interface Floor {
    readonly name: string;
    readonly value: number;
    readonly floor: number;
    /** `>` rather than `≥`: the visibility floors, where exactly 1.05 is not yet a change. */
    readonly strict?: boolean;
}

// First in the head, so a page's own `:root` rule follows it in the cascade the way it would
// follow it inside the one sheet the proposal would ship.
const sheet = document.createElement('style');
sheet.textContent = tokenStyleSheet();
document.head.prepend(sheet);

const canvas = document.createElement('canvas');
canvas.width = 1;
canvas.height = 1;
const context = canvas.getContext('2d', { willReadFrequently: true });

const black: Colour = { red: 0, green: 0, blue: 0, alpha: 1 };
const white: Colour = { red: 255, green: 255, blue: 255, alpha: 1 };

/**
 * A colour as the browser resolves it inside `within`, painted into one canvas pixel — the
 * instrument the suite and every simulation in the proposal used.
 */
function resolved(within: Element, colour: string): Colour {
    if (context === null) {
        throw new Error('no 2d context, so no colour can be resolved');
    }

    const probe = document.createElement('i');
    probe.style.setProperty('background-color', colour);
    within.append(probe);

    try {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = getComputedStyle(probe).backgroundColor;
        context.fillRect(0, 0, 1, 1);

        const [red = 0, green = 0, blue = 0, alpha = 0] = context.getImageData(0, 0, 1, 1).data;

        return { red, green, blue, alpha: alpha / 255 };
    } finally {
        probe.remove();
    }
}

/** Six-digit hex, which is what `contrastRatio()` reads. */
function hex(colour: Colour): string {
    const channels = [colour.red, colour.green, colour.blue].map((channel) =>
        Math.round(channel).toString(16).padStart(2, '0'),
    );

    return `#${channels.join('')}`;
}

/** `top` composited over an opaque `backdrop`: source-over, in sRGB, as S3 measured it. */
function over(top: Colour, backdrop: Colour): Colour {
    const mix = (upper: number, lower: number): number =>
        top.alpha * upper + (1 - top.alpha) * lower;

    return {
        red: mix(top.red, backdrop.red),
        green: mix(top.green, backdrop.green),
        blue: mix(top.blue, backdrop.blue),
        alpha: 1,
    };
}

/**
 * The least ratio `text` keeps over `glass` composited on each of `backdrops` — by default the
 * two extremes nothing behind a panel can be darker or lighter than.
 */
function worst(text: string, glass: Colour, backdrops: readonly Colour[] = [black, white]): number {
    return Math.min(
        ...backdrops.map((backdrop) => contrastRatio(text, hex(over(glass, backdrop)))),
    );
}

/** The least opacity at which `glass` keeps `text` at 4.5:1 over every one of `backdrops`. */
function least(text: string, glass: Colour, backdrops?: readonly Colour[]): string {
    const alpha = Array.from({ length: 101 }, (_, step) => step / 100).find(
        (candidate) => worst(text, { ...glass, alpha: candidate }, backdrops) >= 4.5,
    );

    return alpha === undefined ? 'at no opacity' : `from ${alpha.toFixed(2)}`;
}

/** `#rrggbb`, opaque. */
function parsed(value: string): Colour {
    const [red = 0, green = 0, blue = 0] = [1, 3, 5].map((offset) =>
        Number.parseInt(value.slice(offset, offset + 2), 16),
    );

    return { red, green, blue, alpha: 1 };
}

/** A token as a component writes it, resolved inside `panel`. */
function painted(panel: Element, token: Token | DerivedToken): string {
    return hex(resolved(panel, String(reference(token))));
}

/**
 * The floors `tests/tokens.test.ts` holds for the default palette, taken over whatever
 * palette is in force inside `panel` — question 3's per-palette floors, in miniature.
 */
function floors(panel: HTMLElement): Floor[] {
    const read = (token: Token | DerivedToken): string => painted(panel, token);

    const surface = read('--ui-color-surface');
    const text = read('--ui-color-text');
    const hover = read('--ui-color-hover');
    const accent = read('--ui-color-accent');
    const accentHover = read('--ui-color-accent-hover');
    const accentPressed = read('--ui-color-accent-pressed');
    const label = read('--ui-color-accent-contrast');

    return [
        { name: 'text', value: contrastRatio(text, surface), floor: 4.5 },
        {
            name: 'muted text',
            value: contrastRatio(read('--ui-color-text-muted'), surface),
            floor: 4.5,
        },
        {
            name: 'text on a striped row',
            value: contrastRatio(text, read('--ui-color-surface-muted')),
            floor: 4.5,
        },
        { name: 'border', value: contrastRatio(read('--ui-color-border'), surface), floor: 3 },
        { name: 'focus ring', value: contrastRatio(read('--ui-color-focus'), surface), floor: 3 },
        {
            name: 'hover, against resting',
            value: contrastRatio(hover, surface),
            floor: 1.05,
            strict: true,
        },
        {
            name: 'pressed, against hover',
            value: contrastRatio(read('--ui-color-pressed'), hover),
            floor: 1.05,
            strict: true,
        },
        { name: 'label on the accent', value: contrastRatio(label, accent), floor: 4.5 },
        { name: 'label on its hover', value: contrastRatio(label, accentHover), floor: 4.5 },
        { name: 'label on its pressed', value: contrastRatio(label, accentPressed), floor: 4.5 },
        {
            name: 'accent hover, against resting',
            value: contrastRatio(accentHover, accent),
            floor: 1.05,
            strict: true,
        },
        {
            name: 'accent pressed, against hover',
            value: contrastRatio(accentPressed, accentHover),
            floor: 1.05,
            strict: true,
        },
        { name: 'danger', value: contrastRatio(read('--ui-color-danger'), surface), floor: 4.5 },
        { name: 'success', value: contrastRatio(read('--ui-color-success'), surface), floor: 4.5 },
        { name: 'warning', value: contrastRatio(read('--ui-color-warning'), surface), floor: 4.5 },
        ...raised(panel, text),
    ];
}

/** One text shadow, as the computed style serialises it. */
interface Shadow {
    readonly colour: string;
    readonly x: number;
    readonly y: number;
    readonly blur: number;
}

/** The shadows in a computed `text-shadow`, which Chrome writes colour first, in pixels. */
function shadows(value: string): Shadow[] {
    const found: Shadow[] = [];

    for (const match of value.matchAll(
        /([a-z]+\([^)]*\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px/g,
    )) {
        const [, colour = 'transparent', x = '0', y = '0', blur = '0'] = match;

        found.push({ colour, x: Number(x), y: Number(y), blur: Number(blur) });
    }

    return found;
}

// The halo is measured on its own canvas, a line of text long enough to hold every shape a
// glyph's counter can take.
const sample = 'Printed on every invoice — 0142, 0143.';
const stage = document.createElement('canvas');
stage.width = 360;
stage.height = 40;
const staged = stage.getContext('2d', { willReadFrequently: true });

/**
 * The text against the halo around it, over one backdrop: the worst pixel touching a glyph
 * that no glyph covers at all — what sits against the letter, with its antialiased edge, part
 * letter and part background, left out.
 *
 * Drawn in a canvas with the halo `raised` actually computes, read back from its style: the
 * text shadows one by one, and the text stroke if there is one. A canvas shadow and a CSS text
 * shadow blur by the same Gaussian, half the radius as its deviation. The size is the
 * supporting text's, the smallest set on the glass.
 */
function onHalo(raised: Element, text: string, glass: Colour, backdrop: Colour): number {
    if (staged === null) {
        throw new Error('no 2d context, so no halo can be drawn');
    }

    const style = getComputedStyle(raised);
    const size = Number.parseFloat(style.fontSize) * 0.875;
    const { width, height } = stage;
    const [left, middle, far] = [8, height / 2, 10000];

    staged.font = `${style.fontWeight} ${String(size)}px ${style.fontFamily}`;
    staged.textBaseline = 'middle';

    staged.clearRect(0, 0, width, height);
    staged.fillStyle = '#ffffff';
    staged.fillText(sample, left, middle);

    const glyphs = staged.getImageData(0, 0, width, height).data;

    staged.fillStyle = hex(over(glass, backdrop));
    staged.fillRect(0, 0, width, height);

    const stroke = Number.parseFloat(style.getPropertyValue('-webkit-text-stroke-width'));

    // Up to 4px this matches the page; past it the canvas stroker leaves pixels unfilled that
    // the page fills, so a wider stroke reads worse here than it renders there.
    if (stroke > 0) {
        staged.lineWidth = stroke;
        // Mitred, as Chrome strokes text: a round join drew holes the page never shows.
        staged.lineJoin = 'miter';
        staged.strokeStyle = style.getPropertyValue('-webkit-text-stroke-color');
        staged.strokeText(sample, left, middle);
    }

    // Drawn far off the canvas and cast back onto it, so only the shadow lands.
    for (const shadow of shadows(style.textShadow)) {
        staged.save();
        staged.shadowColor = shadow.colour;
        staged.shadowBlur = shadow.blur;
        staged.shadowOffsetX = shadow.x - far;
        staged.shadowOffsetY = shadow.y;
        staged.fillStyle = shadow.colour;
        staged.fillText(sample, left + far, middle);
        staged.restore();
    }

    staged.fillStyle = text;
    staged.fillText(sample, left, middle);

    const scene = staged.getImageData(0, 0, width, height).data;
    const alpha = (column: number, row: number): number =>
        glyphs[(row * width + column) * 4 + 3] ?? 0;
    const nearGlyph = (column: number, row: number): boolean => {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (alpha(column + dx, row + dy) > 127) {
                    return true;
                }
            }
        }

        return false;
    };

    let least = Number.POSITIVE_INFINITY;

    for (let row = 2; row < height - 2; row++) {
        for (let column = 2; column < width - 2; column++) {
            if (alpha(column, row) !== 0 || !nearGlyph(column, row)) {
                continue;
            }

            const at = (row * width + column) * 4;
            const pixel = hex({
                red: scene[at] ?? 0,
                green: scene[at + 1] ?? 0,
                blue: scene[at + 2] ?? 0,
                alpha: 1,
            });

            least = Math.min(least, contrastRatio(text, pixel));
        }
    }

    return least;
}

/**
 * A translucent raised surface, measured the way S3 found it has to be: over black and over
 * white, which bound every backdrop there can be. Only a panel that declares `data-raised`
 * has one, because only Glass proposes the pair of names it reads.
 *
 * A panel that also lists its page's own colours in `data-backdrops` gets a second row: the
 * same text over only those, which is what a theme could promise if it constrained what may
 * sit behind it instead of holding for any page.
 *
 * A panel whose `data-halo` names one gets the same two readings again, taken against the
 * halo around each letter instead of the glass behind it.
 */
function raised(panel: HTMLElement, text: string): Floor[] {
    if (!panel.hasAttribute('data-raised')) {
        return [];
    }

    // The channels are read from the colour made opaque, and only the opacity from the
    // translucent one: a pixel at 0.06 keeps too little of its colour to un-premultiply, and
    // read whole it moved the least opacity by 0.02.
    const glass = {
        ...resolved(panel, 'rgb(from var(--ui-color-surface-raised) r g b / 1)'),
        alpha: resolved(panel, 'var(--ui-color-surface-raised)').alpha,
    };
    const opacity = glass.alpha.toFixed(2);
    const rows: Floor[] = [
        {
            name: `text on the glass at ${opacity}, any page — clears ${least(text, glass)}`,
            value: worst(text, glass),
            floor: 4.5,
        },
    ];
    const listed = panel.dataset['backdrops'];
    const backdrops = listed === undefined || listed === '' ? [] : listed.split(' ').map(parsed);

    if (backdrops.length > 0) {
        rows.push({
            name: `text on the glass at ${opacity}, this page's colours — clears ${least(text, glass, backdrops)}`,
            value: worst(text, glass, backdrops),
            floor: 4.5,
        });
    }

    const halo = panel.dataset['halo'];
    const surface = panel.querySelector('ui-card');

    if (halo === undefined || halo === 'none' || surface === null) {
        return rows;
    }

    const haloed = (behind: readonly Colour[]): number =>
        Math.min(...behind.map((backdrop) => onHalo(surface, text, glass, backdrop)));

    rows.push({
        name: `text on its ${halo} halo at ${opacity}, any page`,
        value: haloed([black, white]),
        floor: 4.5,
    });

    if (backdrops.length > 0) {
        rows.push({
            name: `text on its ${halo} halo at ${opacity}, this page's colours`,
            value: haloed(backdrops),
            floor: 4.5,
        });
    }

    return rows;
}

/** Writes `panel`'s floors into the list beside it. */
function report(panel: HTMLElement): void {
    const list = panel.closest('figure')?.querySelector('[data-floors]');

    if (list === null || list === undefined) {
        return;
    }

    list.replaceChildren(
        ...floors(panel).map((floor) => {
            const passes =
                floor.strict === true ? floor.value > floor.floor : floor.value >= floor.floor;
            const row = document.createElement('div');
            const name = document.createElement('dt');
            const value = document.createElement('dd');

            row.dataset['pass'] = String(passes);
            name.textContent = floor.name;
            value.textContent = `${floor.value.toFixed(2)} ${floor.strict === true ? '>' : '≥'} ${String(floor.floor)}`;
            row.append(name, value);

            return row;
        }),
    );
}

/** Measures every panel again, for a page whose controls just moved a ground. */
export function measureAll(): void {
    for (const panel of document.querySelectorAll<HTMLElement>('[data-specimen]')) {
        report(panel);
    }
}

document.addEventListener('schemechange', measureAll);

/** The same small billing screen in every panel, so the themes differ and nothing else does. */
function specimen(index: number): TemplateResult {
    const opens = (event: Event): void => {
        (event.currentTarget as Element)
            .closest('[data-specimen]')
            ?.querySelector<UiDialog>('ui-dialog')
            ?.show();
    };
    const closes = (event: Event): void => {
        (event.currentTarget as Element).closest<UiDialog>('ui-dialog')?.close();
    };

    return html`
        <div class="specimen">
            <ui-card>
                <h3 slot="header">Company</h3>
                <ui-input
                    label="Legal name"
                    placeholder="Northwind Ltda."
                    help="Printed on every invoice."
                ></ui-input>
                <ui-input
                    label="Tax ID"
                    value="12.345.678/0001"
                    error="Enter all fourteen digits."
                ></ui-input>
                <ui-select label="Currency">
                    <ui-option value="brl" selected>Real</ui-option>
                    <ui-option value="usd">Dollar</ui-option>
                    <ui-option value="eur">Euro</ui-option>
                </ui-select>
                <div slot="footer" class="actions">
                    <ui-button>Save</ui-button>
                    <ui-button variant="secondary">Cancel</ui-button>
                    <ui-button disabled>Archive</ui-button>
                </div>
            </ui-card>
            <ui-card>
                <h3 slot="header">Reminders</h3>
                <ui-checkbox label="Send me a copy" checked></ui-checkbox>
                <ui-checkbox label="Only when overdue" indeterminate></ui-checkbox>
                <ui-switch label="Remind automatically" checked></ui-switch>
                <ui-radio-group label="Plan" name=${`plan-${String(index)}`}>
                    <ui-radio value="free" checked>Free</ui-radio>
                    <ui-radio value="pro">Pro</ui-radio>
                    <ui-radio value="max" disabled>Max</ui-radio>
                </ui-radio-group>
            </ui-card>
            <ui-card class="wide">
                <h3 slot="header">Invoices this month</h3>
                <ui-table aria-label="Invoices this month">
                    <table>
                        <thead>
                            <tr>
                                <th scope="col">Number</th>
                                <th scope="col">Client</th>
                                <th scope="col" class="amount">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>0142</td>
                                <td>Northwind</td>
                                <td class="amount">R$ 1.200,00</td>
                            </tr>
                            <tr>
                                <td>0143</td>
                                <td>Contoso</td>
                                <td class="amount">R$ 860,50</td>
                            </tr>
                            <tr>
                                <td>0144</td>
                                <td>Fabrikam</td>
                                <td class="amount">R$ 4.075,00</td>
                            </tr>
                        </tbody>
                    </table>
                </ui-table>
                <div slot="footer" class="actions">
                    <ui-tooltip>
                        <ui-button variant="secondary">Export</ui-button>
                        <span slot="tip">A spreadsheet of every invoice this month.</span>
                    </ui-tooltip>
                    <ui-menu>
                        <span slot="trigger">More</span>
                        <button type="button">Duplicate</button>
                        <button type="button">Send again</button>
                        <hr />
                        <button type="button">Void</button>
                    </ui-menu>
                    <ui-button @click=${opens}>Delete…</ui-button>
                </div>
            </ui-card>
            <div class="toasts wide">
                <ui-toast duration="0">Draft saved.</ui-toast>
                <ui-toast variant="success" duration="0">Invoice 0143 sent.</ui-toast>
                <ui-toast variant="warning" duration="0">Two fields were skipped.</ui-toast>
                <ui-toast variant="danger">Could not reach the bank.</ui-toast>
            </div>
            <ui-dialog>
                <h2 slot="title">Delete invoice 0144?</h2>
                <p>It is removed for everyone on the account, and the number is not reused.</p>
                <ui-button slot="actions" variant="secondary" @click=${closes}>Cancel</ui-button>
                <ui-button slot="actions" @click=${closes}>Delete</ui-button>
            </ui-dialog>
        </div>
    `;
}

for (const [index, panel] of document.querySelectorAll<HTMLElement>('[data-specimen]').entries()) {
    render(specimen(index), panel);
}

measureAll();

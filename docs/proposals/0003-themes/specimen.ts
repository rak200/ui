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
import type { UiMenu } from '../../../src/menu.js';
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

/** A reading that is no floor: what a setting allows, stated rather than passed or failed. */
interface Reading {
    readonly name: string;
    readonly says: string;
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

/** Something that rests directly on a raised surface, and the floor it owes there. */
interface Resting {
    readonly name: string;
    readonly floor: number;
    /** The ratio it keeps over `ground`: the glass, already composited on the page. */
    readonly against: (ground: Colour) => number;
}

/** The least ratio `on` keeps over `glass` composited on each of `backdrops`. */
function worst(on: Resting, glass: Colour, backdrops: readonly Colour[]): number {
    return Math.min(...backdrops.map((backdrop) => on.against(over(glass, backdrop))));
}

/** The least opacity at which `glass` keeps `on` at its floor over every one of `backdrops`. */
function least(on: Resting, glass: Colour, backdrops: readonly Colour[]): string {
    const alpha = Array.from({ length: 101 }, (_, step) => step / 100).find(
        (candidate) => worst(on, { ...glass, alpha: candidate }, backdrops) >= on.floor,
    );

    return alpha === undefined ? 'at no opacity' : `from ${alpha.toFixed(2)}`;
}

/** An opaque grey, `level` from 0 to 255 in every channel. */
function grey(level: number): Colour {
    return { red: level, green: level, blue: level, alpha: 1 };
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
function floors(panel: HTMLElement): (Floor | Reading)[] {
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
        ...raised(panel),
    ];
}

/**
 * A translucent raised surface, measured with everything that rests on it rather than the text
 * alone: the error message, a checked box, the track of a switch that is off and the focus
 * ring each owe their floor against the glass too, and have less room to give than the text.
 * Only a panel that declares `data-raised` has one, because only Glass proposes the pair of
 * names it reads.
 *
 * Black and white bound every backdrop there can be, but a page that follows the dark scheme
 * is not white, nor one that follows the light scheme black. So what the glass holds is stated
 * as the page it can take: the lightest grey under it in the dark scheme, the darkest in the
 * light — kept on the panel as `data-limit`, for the page to paint.
 *
 * A panel whose controls fill with the accent at an opacity — `data-checks`, `data-buttons`,
 * and `--proposal-accent` — has a checked box and a button's label read against that fill.
 * A neutral fill needs no row: it only adds to the glass beneath it.
 *
 * A panel that lists its page's own colours in `data-backdrops` gets each of them measured
 * over only those.
 */
function raised(panel: HTMLElement): (Floor | Reading)[] {
    if (!panel.hasAttribute('data-raised')) {
        return [];
    }

    const read = (token: Token | DerivedToken): string => painted(panel, token);
    // The channels are read from the colour made opaque, and only the opacity from the
    // translucent one: a pixel at 0.06 keeps too little of its colour to un-premultiply, and
    // read whole it moved the least opacity by 0.02.
    const glass = {
        ...resolved(panel, 'rgb(from var(--ui-color-surface-raised) r g b / 1)'),
        alpha: resolved(panel, 'var(--ui-color-surface-raised)').alpha,
    };
    const opacity = glass.alpha.toFixed(2);
    const accent = parsed(read('--ui-color-accent'));
    const label = read('--ui-color-accent-contrast');
    const translucent = resolved(panel, 'rgb(0 0 0 / var(--proposal-accent, 1))').alpha;
    const box = { ...accent, alpha: panel.hasAttribute('data-checks') ? translucent : 1 };
    const button = { ...accent, alpha: panel.hasAttribute('data-buttons') ? translucent : 1 };
    const solid =
        (colour: string) =>
        (ground: Colour): number =>
            contrastRatio(colour, hex(ground));
    const resting: Resting[] = [
        { name: 'text', floor: 4.5, against: solid(read('--ui-color-text')) },
        { name: 'the error message', floor: 4.5, against: solid(read('--ui-color-danger')) },
        {
            name: 'a checked box',
            floor: 3,
            against: (ground) => contrastRatio(hex(over(box, ground)), hex(ground)),
        },
        {
            name: 'the label on a button',
            floor: 4.5,
            against: (ground) => contrastRatio(label, hex(over(button, ground))),
        },
        { name: 'a switch that is off', floor: 3, against: solid(read('--ui-color-border')) },
        { name: 'the focus ring', floor: 3, against: solid(read('--ui-color-focus')) },
    ];
    const ratio = (on: Resting, backdrop: Colour): number => on.against(over(glass, backdrop));
    const failing = (level: number): Resting | undefined =>
        resting.find((on) => ratio(on, grey(level)) < on.floor);

    // The scheme's own end is the pole its surface sits at: white under the light scheme,
    // black under the dark. The search runs from there toward the other.
    const surface = read('--ui-color-surface');
    const own = contrastRatio(surface, '#000000') > contrastRatio(surface, '#ffffff') ? 255 : 0;
    const [atOwn, atOther] = [failing(own), failing(255 - own)];
    let says = 'any';

    panel.removeAttribute('data-limit');

    if (atOwn !== undefined) {
        says = `none — ${atOwn.name} fails even over ${own === 255 ? 'white' : 'black'}`;
    } else if (atOther !== undefined) {
        // Halving the grey levels left between the end that holds and the one that does not.
        let held = own;
        let lost = 255 - own;

        while (Math.abs(lost - held) > 1) {
            const middle = Math.round((held + lost) / 2);

            if (failing(middle) === undefined) {
                held = middle;
            } else {
                lost = middle;
            }
        }

        const page = hex(grey(held));

        panel.dataset['limit'] = page;
        says = `${held < lost ? 'as light as' : 'as dark as'} ${page}, then ${failing(lost)?.name ?? ''} fails`;
    }

    const rows: (Floor | Reading)[] = [
        { name: `the page the glass at ${opacity} holds all of it over`, says },
    ];
    const listed = panel.dataset['backdrops'];
    const backdrops = listed === undefined || listed === '' ? [] : listed.split(' ').map(parsed);

    for (const on of backdrops.length > 0 ? resting : []) {
        rows.push({
            name: `${on.name} on the glass at ${opacity}, this page — clears ${least(on, glass, backdrops)}`,
            value: Math.min(...backdrops.map((backdrop) => ratio(on, backdrop))),
            floor: on.floor,
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
            const row = document.createElement('div');
            const name = document.createElement('dt');
            const value = document.createElement('dd');

            name.textContent = floor.name;

            if ('says' in floor) {
                value.textContent = floor.says;
            } else {
                const passes =
                    floor.strict === true ? floor.value > floor.floor : floor.value >= floor.floor;

                row.dataset['pass'] = String(passes);
                value.textContent = `${floor.value.toFixed(2)} ${floor.strict === true ? '>' : '≥'} ${String(floor.floor)}`;
            }

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

// The menu names no part, where every other control here names the box a page would style, so
// a page reaches neither its trigger nor its panel from outside, and a theme tried through
// parts would pass it by. A theme that ships needs no part — it reaches a component through
// the tokens the component reads, which cross a shadow root — so this is the prototype's gap
// rather than the proposal's, and the stand-in closes it: it names the menu's two boxes.
for (const menu of document.querySelectorAll<UiMenu>('ui-menu')) {
    void menu.updateComplete.then(() => {
        menu.shadowRoot?.querySelector('button')?.setAttribute('part', 'trigger');
        menu.shadowRoot?.querySelector('[popover]')?.setAttribute('part', 'panel');
    });
}

measureAll();

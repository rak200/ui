import { afterEach, describe, expect, it } from 'vitest';
import { expectAccessible } from './a11y.js';
import { mountStory } from './stories.js';
import meta, { NoCaption, RowHeaders, Scrolling, Table } from '../stories/table.stories.js';
import '../src/table.js';
import { reference } from '../src/reference.js';
import type { DerivedToken, Token } from '../src/tokens.js';
import type { UiTable } from '../src/table.js';

/** The markup the tests use, unless one needs a different shape. */
const fixture = `
    <ui-table aria-label="Invoices">
        <table>
            <caption>Every invoice raised this quarter.</caption>
            <thead>
                <tr><th scope="col">Number</th><th scope="col">Total</th></tr>
            </thead>
            <tbody>
                <tr><td>0001</td><td>R$ 1.200,00</td></tr>
                <tr><td>0002</td><td>R$ 840,50</td></tr>
                <tr><td>0003</td><td>R$ 2.310,00</td></tr>
            </tbody>
        </table>
    </ui-table>
`;

async function mount(markup: string): Promise<HTMLElement> {
    const host = document.createElement('div');
    host.innerHTML = markup;
    document.body.append(host);

    for (const element of host.querySelectorAll('ui-table')) {
        await element.updateComplete;
    }

    return host;
}

/** The one element a selector has to match, so a fixture typo fails where it happened. */
function only(host: ParentNode, selector: string): HTMLElement {
    const found = host.querySelector<HTMLElement>(selector);

    if (found === null) {
        throw new Error(`no ${selector} in the fixture`);
    }

    return found;
}

const table = (host: ParentNode): UiTable => only(host, 'ui-table') as UiTable;

/**
 * What a token computes to here, so an assertion names the token rather than its value.
 *
 * Comparing against the literal would compare the component's CSS with the constant that
 * produced it — a check no change of value can fail.
 */
function resolved(token: Token | DerivedToken, property = 'color'): string {
    const probe = document.createElement('div');
    probe.style.setProperty(property, String(reference(token)));
    document.body.append(probe);

    try {
        return getComputedStyle(probe).getPropertyValue(property);
    } finally {
        probe.remove();
    }
}

/** A colour the browser has resolved, as the `rgb()` a computed style reports. */
function painted(element: Element): string {
    return getComputedStyle(element).backgroundColor;
}

afterEach(() => {
    document.body.replaceChildren();
});

describe('ui-table', () => {
    it('registers itself as a custom element', () => {
        expect(customElements.get('ui-table')).toBeDefined();
    });

    it('leaves the whole table in the light DOM, where it stays yours', async () => {
        const host = await mount(fixture);

        expect(only(host, 'table').parentElement).toBe(table(host));
        expect(table(host).shadowRoot?.querySelector('table')).toBeNull();
    });

    it('renders nothing but a slot, and claims no role', async () => {
        const host = await mount(fixture);
        const root = table(host).shadowRoot;

        expect(root?.querySelector('slot')).not.toBeNull();
        expect(table(host).hasAttribute('role'), 'the platform already has the element').toBe(
            false,
        );
    });

    it('is accessible', async () => {
        await expectAccessible(await mount(fixture));
    });
});

/**
 * The half that cannot live in the shadow root at all.
 *
 * `::slotted()` matches the top level of what a slot was given and nothing below it, so a
 * cell — a descendant of the slotted `<table>` — is unreachable from inside. These assert
 * that the rules arrive in the tree the table is actually in.
 */
describe('the rules that have to live in the host tree', () => {
    it('styles a cell, which no ::slotted() selector could have reached', async () => {
        const host = await mount(fixture);
        const cell = only(host, 'tbody td');

        expect(getComputedStyle(cell).paddingTop).toBe(resolved('--ui-space', 'padding-top'));
    });

    it('adopts into the document when the table is in it', async () => {
        await mount(fixture);

        expect(document.adoptedStyleSheets.length).toBeGreaterThan(0);
    });

    it('adopts once however many tables a tree holds', async () => {
        await mount(fixture);

        const before = document.adoptedStyleSheets.length;
        await mount(fixture);

        expect(document.adoptedStyleSheets.length).toBe(before);
    });

    it('adopts into a shadow root instead, when that is the tree it is in', async () => {
        // The case `document` would have missed: a table inside another component's shadow
        // root is styled in THAT root or it is bare, because a stylesheet does not reach
        // down through a boundary any more than a selector does.
        const outer = document.createElement('div');
        const root = outer.attachShadow({ mode: 'open' });
        document.body.append(outer);
        root.innerHTML = fixture;

        await table(root).updateComplete;

        expect(root.adoptedStyleSheets.length).toBe(1);
        expect(getComputedStyle(only(root, 'tbody td')).paddingTop).toBe(
            resolved('--ui-space', 'padding-top'),
        );
    });

    it('reaches no table the host wrote outside it', async () => {
        const host = await mount(`${fixture}<table><tbody><tr><td>loose</td></tr></tbody></table>`);
        host.style.setProperty('--ui-space', '17px');

        const inside = getComputedStyle(only(host, 'ui-table tbody td')).paddingTop;
        const loose = getComputedStyle(only(host, ':scope > table td')).paddingTop;

        // The token is in force on both — it inherits down the whole fixture — so what
        // separates them is only whether a rule reads it. Compared against each other
        // rather than against the platform's own `1px`, which is a default this assertion
        // has no business pinning.
        expect(inside).toBe('17px');
        expect(loose, 'every selector names the element').not.toBe(inside);
    });
});

describe('the scroll, and the tab stop it needs', () => {
    it('scrolls on the element itself, so the host can name what scrolls', async () => {
        const host = await mount(fixture);

        expect(getComputedStyle(table(host)).overflowX).toBe('auto');
    });

    it('takes a tab stop, because a region nobody can reach is a region nobody can read', async () => {
        const host = await mount(fixture);

        expect(table(host).getAttribute('tabindex')).toBe('0');
    });

    it('leaves a tabindex the host wrote alone', async () => {
        const host = await mount(`
            <ui-table aria-label="Invoices" tabindex="-1">
                <table><tbody><tr><td>0001</td></tr></tbody></table>
            </ui-table>
        `);

        expect(table(host).getAttribute('tabindex'), 'a host decision, not a default').toBe('-1');
    });

    it('keeps its tabindex across the reconnection a framework performs', async () => {
        const host = await mount(fixture);
        const element = table(host);

        element.remove();
        host.append(element);
        await element.updateComplete;

        expect(element.getAttribute('tabindex')).toBe('0');
    });
});

/**
 * Every value the component paints, read back from the token it was written with.
 *
 * **Each assertion retunes the token and reads the property**, rather than comparing the
 * property against the default the layer already declares: comparing against the default
 * compares this package with itself, and passes for a rule that names the wrong token, or
 * no token at all.
 */
describe('the values, all of which come from the token layer', () => {
    it('takes the box around the table from the host', async () => {
        const host = await mount(fixture);
        const element = table(host);

        element.style.setProperty('--ui-color-border', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-radius', '9px');

        const styles = getComputedStyle(element);

        expect(styles.borderTopColor).toBe('rgb(1, 2, 3)');
        expect(styles.borderTopWidth).toBe('1px');
        expect(styles.borderTopStyle).toBe('solid');
        expect(styles.borderTopLeftRadius).toBe('9px');
    });

    it('takes the focus ring from the host', async () => {
        const host = await mount(fixture);
        const element = table(host);

        element.style.setProperty('--ui-color-focus', 'rgb(4, 5, 6)');
        element.focus();

        const styles = getComputedStyle(element);

        expect(element.matches(':focus-visible'), 'a scroll box focused by script').toBe(true);
        expect(styles.outlineColor).toBe('rgb(4, 5, 6)');
        expect(styles.outlineWidth).toBe('2px');
        expect(styles.outlineStyle).toBe('solid');
        expect(styles.outlineOffset).toBe('2px');
    });

    it('takes the surface and the font from the host', async () => {
        const host = await mount(fixture);
        const element = table(host);

        element.style.setProperty('--ui-color-surface', 'rgb(7, 8, 9)');
        element.style.setProperty('--ui-color-text', 'rgb(10, 11, 12)');
        element.style.setProperty('--ui-font', 'Courier');

        const styles = getComputedStyle(only(host, 'table'));

        expect(styles.backgroundColor).toBe('rgb(7, 8, 9)');
        expect(styles.color).toBe('rgb(10, 11, 12)');
        expect(styles.fontFamily).toBe('Courier');
        expect(styles.borderCollapse, 'one rule per junction, not two').toBe('collapse');
    });

    it('takes a cell from the host', async () => {
        const host = await mount(fixture);
        const element = table(host);

        element.style.setProperty('--ui-space', '11px');
        element.style.setProperty('--ui-color-border', 'rgb(13, 14, 15)');

        const styles = getComputedStyle(only(host, 'tbody td'));

        expect(styles.paddingTop).toBe('11px');
        expect(styles.paddingLeft).toBe('11px');
        expect(styles.borderBottomColor).toBe('rgb(13, 14, 15)');
        expect(styles.borderBottomWidth).toBe('1px');
        expect(styles.verticalAlign).toBe('top');
    });

    it('starts a header where the column starts, which the platform does not', async () => {
        const host = await mount(fixture);

        // The platform centres a th and only a th, so a header would sit off the column it
        // heads. `start` rather than `left`, so a right-to-left page needs no second rule.
        expect(getComputedStyle(only(host, 'thead th')).textAlign).toBe('start');
        expect(getComputedStyle(only(host, 'tbody td')).textAlign).toBe('start');
    });

    it('rests the header and every other row on the second surface tone', async () => {
        const host = await mount(fixture);
        const element = table(host);

        element.style.setProperty('--ui-color-surface-muted', 'rgb(16, 17, 18)');

        const rows = [...host.querySelectorAll('tbody tr')];

        expect(painted(only(host, 'thead th'))).toBe('rgb(16, 17, 18)');
        expect(rows.map(painted), 'the second row and no other').toEqual([
            'rgba(0, 0, 0, 0)',
            'rgb(16, 17, 18)',
            'rgba(0, 0, 0, 0)',
        ]);
    });

    it('leaves a thead row unstriped, whatever its position', async () => {
        // Two header rows, so the second one is the `even` a tbody rule would have caught.
        const host = await mount(`
            <ui-table aria-label="Invoices">
                <table>
                    <thead>
                        <tr><th scope="col">Number</th></tr>
                        <tr><th scope="col">All values in BRL</th></tr>
                    </thead>
                    <tbody><tr><td>0001</td></tr></tbody>
                </table>
            </ui-table>
        `);
        const element = table(host);

        element.style.setProperty('--ui-color-surface-muted', 'rgb(19, 20, 21)');

        const headers = [...host.querySelectorAll('thead tr')];

        expect(headers.map(painted), 'the row is bare; the cells carry the tone').toEqual([
            'rgba(0, 0, 0, 0)',
            'rgba(0, 0, 0, 0)',
        ]);
    });

    it('takes the caption from the host, below the table', async () => {
        const host = await mount(fixture);
        const element = table(host);

        element.style.setProperty('--ui-color-text-muted', 'rgb(22, 23, 24)');
        element.style.setProperty('--ui-text-100', '30px');
        element.style.setProperty('--ui-space', '12px');

        const styles = getComputedStyle(only(host, 'caption'));

        expect(styles.captionSide, 'a caption that explains reads after').toBe('bottom');
        expect(styles.textAlign).toBe('start');
        expect(styles.color).toBe('rgb(22, 23, 24)');
        expect(styles.fontSize, 'through the purpose, not the step').toBe('30px');
        expect(styles.paddingTop).toBe('12px');
        expect(styles.paddingBottom).toBe('12px');
    });

    it('reads the purpose rather than the step, so a host can retune either', async () => {
        const host = await mount(fixture);
        const element = table(host);

        element.style.setProperty('--ui-text-supporting', '27px');

        expect(getComputedStyle(only(host, 'caption')).fontSize).toBe('27px');
    });
});

describe('table stories', () => {
    it.each([
        ['Table', Table],
        ['NoCaption', NoCaption],
        ['Scrolling', Scrolling],
        ['RowHeaders', RowHeaders],
    ] as const)('renders %s accessibly', async (name, story) => {
        await expectAccessible(await mountStory(story, meta, name));
    });
});

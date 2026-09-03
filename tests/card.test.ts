import { afterEach, describe, expect, it } from 'vitest';
import { expectAccessible } from './a11y.js';
import { mountStory } from './stories.js';
import meta, { BodyOnly, Card, OutOfOrder, Row, WithLink } from '../stories/card.stories.js';
import '../src/card.js';
import '../src/button.js';
import type { UiCard } from '../src/card.js';

/** The markup the drawing tests use, unless one needs a different shape. */
const fixture = `
    <ui-card>
        <h3 slot="header" style="margin: 0">Monthly plan</h3>
        <p style="margin: 0">Everything in the free tier.</p>
        <div slot="footer">Choose</div>
    </ui-card>
`;

/** Mounts a fixture and waits for the card's first render. */
async function mount(markup: string): Promise<HTMLElement> {
    const host = document.createElement('div');
    host.innerHTML = markup;
    document.body.append(host);

    for (const element of host.querySelectorAll('ui-card')) {
        await element.updateComplete;
    }

    return host;
}

/** The card, which is the element under test. */
function card(host: HTMLElement): UiCard {
    const element = host.querySelector('ui-card');

    if (element === null) {
        throw new Error('no card in the fixture');
    }

    return element;
}

/** The one element a selector has to match, so a fixture typo fails where it happened. */
function only(host: ParentNode, selector: string): HTMLElement {
    const found = host.querySelector<HTMLElement>(selector);

    if (found === null) {
        throw new Error(`no ${selector} in the fixture`);
    }

    return found;
}

/** The names of the slots the shadow root declares, in the order it declares them. */
function slots(element: UiCard): (string | null)[] {
    return [...(element.shadowRoot?.querySelectorAll('slot') ?? [])].map((slot) =>
        slot.getAttribute('name'),
    );
}

/** The component's own stylesheet, as text, for the rules no rendering can show. */
function styleText(): string {
    return String((customElements.get('ui-card') as unknown as { styles: unknown }).styles);
}

afterEach(() => {
    document.body.replaceChildren();
});

describe('ui-card', () => {
    it('registers itself as a custom element', () => {
        expect(customElements.get('ui-card')).toBeDefined();
    });

    it('claims no role, because there is no card element to delegate to', async () => {
        const host = await mount(fixture);

        expect(card(host).hasAttribute('role')).toBe(false);
        expect(card(host).shadowRoot?.querySelector('[role]')).toBeNull();
    });

    it('renders three regions and nothing else', async () => {
        const host = await mount(fixture);

        expect(slots(card(host))).toEqual(['header', null, 'footer']);
        expect(card(host).shadowRoot?.querySelectorAll('*').length, 'slots only').toBe(3);
    });

    it('orders the regions itself, whatever order they were written in', async () => {
        const host = await mount(`
            <ui-card>
                <div slot="footer">last</div>
                <p style="margin: 0">middle</p>
                <h3 slot="header" style="margin: 0">first</h3>
            </ui-card>
        `);
        const top = (selector: string): number => only(host, selector).getBoundingClientRect().top;

        expect(top('h3'), 'the header is above the body').toBeLessThan(top('p'));
        expect(top('p'), 'and the body above the footer').toBeLessThan(top('div[slot=footer]'));
    });

    it('spaces the regions it has, and only those', async () => {
        // A `<slot>` is `display: contents`, so an unfilled region contributes no box —
        // which is what stops `gap` from spacing a card that has no footer. Measured as
        // arithmetic rather than asserted structurally: the card is exactly its padding
        // plus its one child, with no third gap in it.
        const host = await mount(`
            <ui-card><p style="margin: 0">Everything in the free tier.</p></ui-card>
        `);
        const height = card(host).getBoundingClientRect().height;

        // The padding twice and the boundary twice, and nothing between the one child and
        // the regions it does not have.
        expect(height).toBeCloseTo(only(host, 'p').getBoundingClientRect().height + 34, 1);
    });

    it('pushes the footer to the bottom of the height it was given', async () => {
        // The one thing a footer slot buys that writing the element last does not: a row
        // of cards lines its buttons up when the bodies are different lengths.
        const host = await mount(`
            <ui-card style="block-size: 300px">
                <p style="margin: 0">Short.</p>
                <div slot="footer">Choose</div>
            </ui-card>
        `);
        const footer = only(host, 'div[slot=footer]').getBoundingClientRect();

        expect(footer.bottom).toBeCloseTo(card(host).getBoundingClientRect().bottom - 17, 1);
    });

    it('is a surface with a boundary and a corner, drawn from the token layer', async () => {
        const host = await mount(fixture);
        const styles = getComputedStyle(card(host));

        expect(styles.display).toBe('flex');
        expect(styles.flexDirection).toBe('column');
        expect(styles.rowGap).toBe('16px');
        expect(styles.boxSizing).toBe('border-box');
        expect(styles.padding).toBe('16px');
        expect(styles.backgroundColor).toBe('rgb(255, 255, 255)');
        expect(styles.borderTopWidth).toBe('1px');
        expect(styles.borderTopStyle).toBe('solid');
        expect(styles.borderRadius).toBe('6px');
        expect(styles.fontFamily).toContain('system-ui');
    });

    it('declares the text colour with the surface, never half the pair', async () => {
        // A surface declared without the colour chosen against it inherits whatever the
        // page set, and the contrast the token layer measured stops holding at the one
        // place it was measured for.
        const host = await mount(`<div style="color: rgb(1, 2, 3)">${fixture}</div>`);

        expect(getComputedStyle(card(host)).color).toBe('rgb(31, 41, 55)');
    });

    it('lifts off the page, and takes the lift from the host', async () => {
        const host = await mount(fixture);

        expect(getComputedStyle(card(host)).boxShadow, 'two layers, not one').toMatch(
            /rgba?\([^)]*\).*,.*rgba?\([^)]*\)/,
        );

        card(host).style.setProperty('--ui-elevation-raised', 'rgb(1, 2, 3) 0px 4px 8px 0px');

        expect(getComputedStyle(card(host)).boxShadow).toBe('rgb(1, 2, 3) 0px 4px 8px 0px');
    });

    it('takes the boundary, the corner and the spacing from the host', async () => {
        const host = await mount(fixture);
        const element = card(host);

        element.style.setProperty('--ui-color-border', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-radius', '11px');
        element.style.setProperty('--ui-space', '10px');

        const styles = getComputedStyle(element);

        expect(styles.borderTopColor).toBe('rgb(1, 2, 3)');
        expect(styles.borderRadius).toBe('11px');
        expect(styles.padding).toBe('20px');
        expect(styles.rowGap).toBe('20px');
    });

    it('takes the surface from the host', async () => {
        const host = await mount(fixture);
        card(host).style.setProperty('--ui-color-surface', 'rgb(1, 2, 3)');

        expect(getComputedStyle(card(host)).backgroundColor).toBe('rgb(1, 2, 3)');
    });

    it('exposes no part — the regions are the host own elements, styleable directly', () => {
        expect(styleText()).not.toContain('part=');
    });
});

/**
 * The stories are the playground, and mounting them here is what puts it behind the gate.
 * `expectAccessible` is called per story rather than once: a card with a link and a card
 * with a heading are different markup, and each can fail on its own.
 */
describe('accessibility', () => {
    it('has no violations with every region filled', async () => {
        await expectAccessible(await mountStory(Card, meta, 'Card'));
    });

    it('has no violations with a body alone', async () => {
        await expectAccessible(await mountStory(BodyOnly, meta, 'BodyOnly'));
    });

    it('has no violations with the regions written out of order', async () => {
        await expectAccessible(await mountStory(OutOfOrder, meta, 'OutOfOrder'));
    });

    it('has no violations in a row of them', async () => {
        await expectAccessible(await mountStory(Row, meta, 'Row'));
    });

    it('has no violations when the card carries a link', async () => {
        await expectAccessible(await mountStory(WithLink, meta, 'WithLink'));
    });
});

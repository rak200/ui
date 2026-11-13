import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectAccessible } from './a11y.js';
import { pointTo } from './pointing.js';
import { mountStory } from './stories.js';
import meta, { BodyOnly, Card, OutOfOrder, Row, WithLink } from '../stories/card.stories.js';
import '../src/card.js';
import '../src/button.js';
import type { UiCard } from '../src/card.js';
import { glass, matrix, themeStyleSheet, type Theme } from '../src/theme.js';
import { tokenStyleSheet } from '../src/tokens.js';

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

    it('renders three regions, and beside them only the empty layers its effects are drawn on', async () => {
        const host = await mount(fixture);
        const layers = [...(card(host).shadowRoot?.querySelectorAll('[data-layer]') ?? [])];

        expect(slots(card(host))).toEqual(['header', null, 'footer']);
        expect(
            layers.map((layer) => [layer.getAttribute('data-layer'), layer.childNodes.length]),
            'the layers, empty',
        ).toEqual([
            ['fill', 0],
            ['focus-fill', 0],
            ['shadow', 0],
            ['focus-shadow', 0],
            ['border', 0],
        ]);
        expect(card(host).shadowRoot?.querySelectorAll('*').length, 'nothing else').toBe(8);
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
        // Drawn on a layer over the card, so a shadow a theme writes in currentColor is lit
        // in the accent rather than in the card's text.
        const lift = (): CSSStyleDeclaration => getComputedStyle(card(host), '::before');

        expect(lift().boxShadow, 'two layers, not one').toMatch(
            /rgba?\([^)]*\).*,.*rgba?\([^)]*\)/,
        );
        expect(getComputedStyle(card(host)).boxShadow, 'and none on the card').toBe('none');

        card(host).style.setProperty('--ui-elevation-raised', 'rgb(1, 2, 3) 0px 4px 8px 0px');

        expect(lift().boxShadow).toBe('rgb(1, 2, 3) 0px 4px 8px 0px');

        card(host).style.setProperty('--ui-elevation-raised', '0 0 0 1px currentColor');
        card(host).style.setProperty('--ui-color-accent', 'rgb(4, 5, 6)');
        card(host).style.setProperty('--ui-radius', '11px');

        expect(lift().boxShadow).toBe('rgb(4, 5, 6) 0px 0px 0px 1px');
        // Over the card and its border, at its corner, and in the way of no pointer.
        expect(lift().position).toBe('absolute');
        expect(getComputedStyle(card(host)).position).toBe('relative');
        expect(lift().top).toBe('-1px');
        expect(lift().left).toBe('-1px');
        expect(lift().borderTopLeftRadius).toBe('11px');
        expect(lift().pointerEvents).toBe('none');
    });

    it('lets a pointer through its lift to what is in it', async () => {
        // The lift's layer is positioned, so it is painted over the card's content and would
        // be what a pointer lands on: the card, rather than the control inside it.
        const host = await mount('<ui-card><button type="button">Choose</button></ui-card>');
        const button = host.querySelector('button');

        if (button === null) {
            throw new Error('no button in the card');
        }

        const box = button.getBoundingClientRect();

        expect(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)).toBe(
            button,
        );
    });

    it('takes the boundary, the corner and the spacing from the host', async () => {
        const host = await mount(fixture);
        const element = card(host);

        element.style.setProperty('--ui-color-border-raised', 'rgb(1, 2, 3)');
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

    it('takes a raised surface and what it does to the page behind it from the host', async () => {
        const host = await mount(fixture);
        const element = card(host);

        expect(getComputedStyle(element).backdropFilter, 'nothing by default').toBe('none');

        element.style.setProperty('--ui-color-surface-raised', 'rgb(1, 2, 3, 0.2)');
        element.style.setProperty('--ui-backdrop-raised', 'blur(10px)');

        expect(getComputedStyle(element).backgroundColor).toBe('rgba(1, 2, 3, 0.2)');
        expect(getComputedStyle(element).backdropFilter).toBe('blur(10px)');
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
/**
 * Mounts `markup` under the token sheet, and under a theme's after it where one is named, which the
 * region round it then takes, with every duration the effects fade over out.
 */
async function under(markup: string, theme?: Theme): Promise<HTMLElement> {
    const style = document.createElement('style');
    style.textContent = tokenStyleSheet() + (theme === undefined ? '' : themeStyleSheet(theme));
    document.body.append(style);

    const host = await mount(markup);
    host.style.setProperty('--ui-duration-effect', '0s');
    host.style.setProperty('--ui-duration-state', '0s');

    if (theme !== undefined) {
        host.dataset['uiTheme'] = theme.name;
    }

    return host;
}

/** One of the card's layers. */
function layer(element: UiCard, name: string): HTMLElement {
    return only(element.shadowRoot ?? document, `[data-layer='${name}']`);
}

/**
 * Mounts `markup` under the token sheet and `theme`'s, inside the region the theme is chosen on, so
 * a card arrives under it as it is put on the page.
 */
async function themed(markup: string, theme: Theme): Promise<HTMLElement> {
    const style = document.createElement('style');
    style.textContent = tokenStyleSheet() + themeStyleSheet(theme);
    document.body.append(style);

    const host = document.createElement('div');
    host.dataset['uiTheme'] = theme.name;
    host.innerHTML = markup;
    document.body.append(host);

    for (const element of host.querySelectorAll('ui-card')) {
        await element.updateComplete;
    }

    return host;
}

/** Runs every animation on `element` to its end — its pieces' clocks among them — and waits. */
async function settle(element: HTMLElement): Promise<void> {
    const running = element.getAnimations();

    for (const animation of running) {
        animation.finish();
    }

    await Promise.allSettled(running.map((animation) => animation.finished));
    await new Promise((resolve) => setTimeout(resolve, 0));
}

/** The one CSS animation named `name` running on `element`. */
function running(element: HTMLElement, name: string): CSSAnimation {
    const found = element
        .getAnimations()
        .find(
            (animation): animation is CSSAnimation =>
                animation instanceof CSSAnimation && animation.animationName === name,
        );

    if (found === undefined) {
        throw new Error(`no ${name} running`);
    }

    return found;
}

/**
 * The pointer and a focus on something a card holds — RFC 0004's — under the default theme's taste.
 * What each effect draws is graded on a surface of the suite's own in `tests/effects.test.ts`; what
 * these are about is that the card draws it.
 */
describe("the pointer and a focus it holds, under the default theme's taste", () => {
    it('raises a card under the pointer', async () => {
        const host = await under(fixture);

        await userEvent.hover(card(host));

        expect(getComputedStyle(layer(card(host), 'shadow')).opacity).toBe('1');
    });

    it('takes the mark off as the focus leaves the card', async () => {
        const host = await under(`
            <ui-card><div slot="footer"><button>Choose</button></div></ui-card>
            <button>After</button>
        `);

        await userEvent.tab();

        expect(card(host).hasAttribute('data-focus-visible'), 'in it').toBe(true);

        await userEvent.tab();

        expect(card(host).hasAttribute('data-focus-visible'), 'left').toBe(false);
    });

    it.each([
        ['its own taste', '--ui-taste-card-hover-shadow', '1'],
        ["another component's", '--ui-taste-toast-hover-shadow', '0'],
    ])('draws its effects under %s', async (_whose, name, opacity) => {
        // No token sheet, so no page's taste: only the name written here can reach the card.
        const host = await mount(fixture);
        host.style.setProperty('--ui-duration-effect', '0s');
        host.style.setProperty(name, 'raise');

        await userEvent.hover(card(host));

        expect(getComputedStyle(layer(card(host), 'shadow')).opacity).toBe(opacity);
    });

    it('marks, raises and lifts a card while a focus the reader can see is on something it holds', async () => {
        const host = await under(`
            <ui-card>
                <p style="margin: 0">Everything in the free tier.</p>
                <div slot="footer"><ui-button>Choose</ui-button></div>
            </ui-card>
        `);
        const element = card(host);

        await userEvent.tab();

        expect(element.hasAttribute('data-focus-visible'), 'marked').toBe(true);
        expect(getComputedStyle(layer(element, 'focus-shadow')).opacity, 'raised').toBe('1');
        expect(getComputedStyle(element).translate, 'lifted').toBe('0px -4px');
    });

    it('leaves a card unisolated under the default theme, which chooses no fill', async () => {
        const host = await under(fixture);

        expect(getComputedStyle(card(host)).isolation).toBe('auto');
    });

    it('glows a card under the pointer under Matrix, its fill as it is and unisolated, and tints it where a consumer chooses', async () => {
        const host = await under(fixture, matrix);
        const element = card(host);

        await userEvent.hover(element);

        // The tint a field or a drawn control takes under the pointer is the card's, so a card
        // tinted round one hid it.
        expect(getComputedStyle(layer(element, 'fill')).opacity, 'not tinted').toBe('0');
        expect(getComputedStyle(layer(element, 'shadow')).boxShadow, 'glowing').toMatch(
            / 0px 0px 16px 2px, .+ 0px 0px 40px 8px$/,
        );
        // Nothing lies under its content at either moment, so nothing isolates it.
        expect(getComputedStyle(element).isolation, 'unisolated').toBe('auto');

        host.style.setProperty('--ui-motion-card-hover-fill', 'tint');

        expect(getComputedStyle(layer(element, 'fill')).opacity, 'tinted where chosen').toBe('1');
        expect(getComputedStyle(element).isolation, 'isolated for it').toBe('isolate');
    });

    it('bursts light round a card at a focus it holds under Matrix, its fill as it is', async () => {
        const host = await under(
            `
            <ui-card>
                <p style="margin: 0">Everything in the free tier.</p>
                <div slot="footer"><ui-button>Choose</ui-button></div>
            </ui-card>
        `,
            matrix,
        );
        const element = card(host);

        await userEvent.tab();

        // A field takes the tint at the focus too, so a card tinted round one hid it. The card
        // takes the page's highlight, which it leaves out.
        expect(getComputedStyle(layer(element, 'focus-fill')).opacity, 'not tinted').toBe('0');
        expect(getComputedStyle(layer(element, 'focus-shadow')).animationName, 'a burst').toBe(
            'ui-burst',
        );
        expect(getComputedStyle(element).translate, 'not lifted').toBe('none');
    });

    it('bursts light round a card once under Matrix, as the focus arrives in it and not as it moves from one thing the card holds to another', async () => {
        const host = await under(
            `
            <ui-card>
                <p style="margin: 0">Everything in the free tier.</p>
                <div slot="footer"><ui-button>Back</ui-button><ui-button>Choose</ui-button></div>
            </ui-card>
        `,
            matrix,
        );
        const element = card(host);
        // A burst that outlasts the step from one button to the next.
        host.style.setProperty('--ui-duration-flourish', '60s');

        await userEvent.tab();

        const burst = running(layer(element, 'focus-shadow'), 'ui-burst');

        await userEvent.tab();

        expect(document.activeElement?.textContent, 'moved').toBe('Choose');
        expect(running(layer(element, 'focus-shadow'), 'ui-burst'), 'the same burst').toBe(burst);
    });

    it("casts a card's shadow and edges it under Glass, its fill as it is and flat, and lights or leans it where a consumer chooses", async () => {
        const host = await under(fixture, glass);
        const element = card(host);
        const box = element.getBoundingClientRect();
        // The engine is handed an effect's time, and follows nothing under none.
        host.style.setProperty('--ui-duration-effect', '0.3s');
        host.style.setProperty('--ui-duration-follow', '0s');

        await pointTo(element, box.width - 1, box.height / 2);

        expect(element.style.getPropertyValue('--ui-fx-pointer-near'), 'followed').toBe('1');

        for (const name of ['shadow', 'border']) {
            expect(getComputedStyle(layer(element, name)).opacity, name).toBe('1');
        }

        // The spotlight is no longer Glass's for the card: it lit the card round a control the card
        // holds as the control lit.
        expect(getComputedStyle(layer(element, 'fill')).opacity, 'unlit').toBe('0');
        // Nor the tilt: it turned the card under its blur on every frame.
        expect(getComputedStyle(element).transform, 'flat').toBe('none');
        expect(getComputedStyle(element).isolation, 'isolated').toBe('isolate');

        // Each is still a choice of the consumer's.
        host.style.setProperty('--ui-motion-card-hover-fill', 'spotlight');
        host.style.setProperty('--ui-motion-hover-move', 'tilt');

        expect(getComputedStyle(layer(element, 'fill')).opacity, 'lit where chosen').toBe('1');
        expect(getComputedStyle(element).transform, 'leaning where chosen').not.toBe('none');
    });

    it("sweeps a card's tint across it and holds a light inside it at a focus it holds under Glass", async () => {
        const host = await under(
            `
            <ui-card>
                <p style="margin: 0">Everything in the free tier.</p>
                <div slot="footer"><ui-button>Choose</ui-button></div>
            </ui-card>
        `,
            glass,
        );
        const element = card(host);

        await userEvent.tab();

        expect(getComputedStyle(layer(element, 'focus-fill')).animationName, 'a sweep').toBe(
            'ui-shimmer',
        );
        expect(getComputedStyle(layer(element, 'focus-shadow')).boxShadow, 'a light').toMatch(
            / 0px 0px 0px 1px inset, .+ 0px 0px 12px 2px inset$/,
        );
        expect(getComputedStyle(element).translate, 'not lifted').toBe('none');
    });
});

/**
 * How a card comes onto the page and leaves it — RFC 0004's entrance and exit, and the way out a card
 * owns, since nothing that removes it waits for an exit.
 */
describe('arriving and leaving', () => {
    it("fades a card in as it is put on the page, under the default theme's taste", async () => {
        const host = await under(fixture);

        expect(getComputedStyle(card(host)).animationName).toBe('ui-enter-fade');
    });

    it('takes a card off the page through its exit: marked, faded, announced in the tree, then removed', async () => {
        const host = await under(fixture);
        host.style.setProperty('--ui-duration-exit', '10s');
        const element = card(host);
        const heard: (readonly [boolean, boolean, boolean])[] = [];
        host.addEventListener('ui-leave', (event) => {
            heard.push([element.isConnected, event.bubbles, event.composed]);
        });

        // Bound, so it leaves however it is called.
        const { leave } = element;
        const gone = leave();

        expect(element.matches(':state(leaving)'), 'marked').toBe(true);

        const exit = running(element, 'ui-exit-fade');
        await new Promise(requestAnimationFrame);

        expect([element.isConnected, heard], 'there while the exit plays').toEqual([true, []]);

        exit.finish();
        await gone;

        expect(heard, 'announced while still in the tree').toEqual([[true, true, true]]);
        expect(element.isConnected, 'removed').toBe(false);
    });

    it('takes a card off at once where no exit is chosen', async () => {
        // No token sheet, so no taste: nothing chooses an exit.
        const host = await mount(fixture);
        const element = card(host);

        await element.leave();

        expect(element.isConnected).toBe(false);
    });

    it('leaves once, however often it is asked', async () => {
        const host = await under(fixture);
        host.style.setProperty('--ui-duration-exit', '10s');
        const element = card(host);
        let heard = 0;
        host.addEventListener('ui-leave', () => {
            heard += 1;
        });

        const first = element.leave();
        const second = element.leave();

        expect(second, 'one departure').toBe(first);

        running(element, 'ui-exit-fade').finish();
        await Promise.all([first, second]);

        expect(heard, 'announced once').toBe(1);
    });

    it('puts a card together from its pieces as it is put on the page under Matrix, and then whole', async () => {
        const host = await themed(fixture, matrix);
        const element = card(host);

        expect(element.style.filter, 'cut').toMatch(/^url\("#ui-pieces-\d+"\)$/);

        await settle(element);

        expect(element.style.filter, 'whole').toBe('');
    });

    it('breaks a card into its pieces as it leaves under Matrix, then removes it and mends it', async () => {
        const host = await themed(fixture, matrix);
        const element = card(host);
        await settle(element);

        const gone = element.leave();

        expect(element.style.filter, 'cut').toMatch(/^url\("#ui-pieces-\d+"\)$/);
        expect(element.isConnected, 'there while it breaks').toBe(true);

        await settle(element);
        await gone;

        expect([element.isConnected, element.style.filter], 'removed, and whole').toEqual([
            false,
            '',
        ]);
        expect(document.body.querySelector(':scope > svg'), 'the filter gone').toBeNull();
    });

    it('brings a card out of a grain as it is put on the page under Glass, and dissolves it as it leaves', async () => {
        const host = await themed(fixture, glass);
        const element = card(host);

        expect(element.style.filter, 'arriving').toMatch(/^url\("#ui-grain-\d+"\)$/);

        await settle(element);

        expect(element.style.filter, 'whole').toBe('');

        const gone = element.leave();

        expect(element.style.filter, 'leaving').toMatch(/^url\("#ui-grain-\d+"\)$/);

        await settle(element);
        await gone;

        expect([element.isConnected, element.style.filter], 'removed, and whole').toEqual([
            false,
            '',
        ]);
    });

    it('arrives anew when it is put back on the page, and can leave again', async () => {
        const host = await under(fixture);
        host.style.setProperty('--ui-duration-exit', '0s');
        const element = card(host);
        await element.leave();

        host.append(element);

        expect(element.matches(':state(leaving)'), 'no longer leaving').toBe(false);
        expect(getComputedStyle(element).animationName, 'arriving').toBe('ui-enter-fade');

        await element.leave();

        expect(element.isConnected, 'gone again').toBe(false);
    });
});

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

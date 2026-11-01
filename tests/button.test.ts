import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
// The playwright provider is what puts `send` on `CDPSession` — see `tokens.test.ts`,
// which needs the same line for the same reason.
import type {} from '@vitest/browser-playwright';
import { expectAccessible } from './a11y.js';
import { mountStory } from './stories.js';
import meta, { Disabled, Primary, Secondary, States } from '../stories/button.stories.js';
import '../src/button.js';
import '../src/tooltip.js';
import type { UiButton } from '../src/button.js';
import { tokenStyleSheet } from '../src/tokens.js';
import { glass, matrix, themeStyleSheet } from '../src/theme.js';

/** Mounts a `<ui-button>` and waits for its first render. */
async function mount(html: string): Promise<UiButton> {
    const host = document.createElement('div');
    host.innerHTML = html;
    document.body.append(host);

    const element = host.querySelector('ui-button');

    if (element === null) {
        throw new Error('no ui-button in the fixture');
    }

    await element.updateComplete;

    return element;
}

/** The one `<ui-button>` a story mounted, which failing to find is the gate doing its job. */
function only(container: HTMLElement): UiButton {
    const element = container.querySelector('ui-button');

    if (element === null) {
        throw new Error('the story rendered no ui-button');
    }

    return element;
}

/** The real `<button>` the component delegates to. */
function inner(element: UiButton): HTMLButtonElement {
    const button = element.shadowRoot?.querySelector('button');

    if (!(button instanceof HTMLButtonElement)) {
        throw new Error('the component rendered no button');
    }

    return button;
}

/** The component's own stylesheet, as text, for the rules no rendering can show. */
function styleText(): string {
    return String((customElements.get('ui-button') as unknown as { styles: unknown }).styles);
}

/** What the inner button is painted right now. A mix serialises as `oklab(…)`; the
 * question here is only whether it moved. */
function background(element: UiButton): string {
    return getComputedStyle(inner(element)).backgroundColor;
}

/**
 * Holds the pointer down over an element, which is the only way to make `:active` match.
 *
 * No event a page can dispatch produces it — the pseudo-class is the user agent's, so the
 * press has to come from outside the page. Nothing else in the suite reaches for CDP; this
 * state is the one thing in the component that cannot be observed without it.
 */
async function press(element: Element, down: boolean): Promise<void> {
    const box = element.getBoundingClientRect();

    await cdp().send('Input.dispatchMouseEvent', {
        type: down ? 'mousePressed' : 'mouseReleased',
        x: box.left + box.width / 2,
        y: box.top + box.height / 2,
        button: 'left',
        buttons: down ? 1 : 0,
        clickCount: 1,
    });
}

afterEach(async () => {
    await press(document.body, false);

    // A ring still in the air lands, so nothing flies on into the next test.
    for (const flight of document.querySelector('[data-ui-ring]')?.getAnimations() ?? []) {
        flight.finish();
    }

    document.body.replaceChildren();
});

describe('ui-button', () => {
    it('registers itself as a custom element', () => {
        expect(customElements.get('ui-button')).toBeDefined();
    });

    it('delegates to a real button, so the platform owns the semantics', async () => {
        const element = await mount('<ui-button>Save</ui-button>');

        expect(inner(element).tagName).toBe('BUTTON');
    });

    it('takes its accessible name from the slotted content', async () => {
        const element = await mount('<ui-button>Save</ui-button>');

        expect(element.textContent.trim()).toBe('Save');
    });

    it('is primary until told otherwise', async () => {
        const element = await mount('<ui-button>Save</ui-button>');

        expect(element.variant).toBe('primary');
        expect(inner(element).classList.contains('primary')).toBe(true);
    });

    it('carries the variant onto the inner button', async () => {
        const element = await mount('<ui-button variant="secondary">Cancel</ui-button>');

        expect(element.variant).toBe('secondary');
        expect(inner(element).classList.contains('secondary')).toBe(true);
    });

    it('reflects the variant back to the attribute when set as a property', async () => {
        const element = await mount('<ui-button>Save</ui-button>');
        element.variant = 'secondary';
        await element.updateComplete;

        expect(element.getAttribute('variant')).toBe('secondary');
    });

    it('is enabled until told otherwise', async () => {
        const element = await mount('<ui-button>Save</ui-button>');

        expect(element.disabled).toBe(false);
        expect(inner(element).disabled).toBe(false);
    });

    it('disables the inner button, which is what stops the click', async () => {
        const element = await mount('<ui-button disabled>Save</ui-button>');

        expect(element.disabled).toBe(true);
        expect(inner(element).disabled).toBe(true);
    });

    it('reflects disabled back to the attribute, so CSS can select on it', async () => {
        const element = await mount('<ui-button>Save</ui-button>');
        element.disabled = true;
        await element.updateComplete;

        expect(element.hasAttribute('disabled')).toBe(true);
    });

    it('is reachable by keyboard', async () => {
        const element = await mount('<ui-button>Save</ui-button>');
        inner(element).focus();

        expect(element.shadowRoot?.activeElement).toBe(inner(element));
    });

    it('exposes the inner button as a part, so a host can style it', async () => {
        const element = await mount('<ui-button>Save</ui-button>');

        expect(inner(element).getAttribute('part')).toBe('button');
    });

    it('has no accessibility violations', async () => {
        await expectAccessible('<ui-button>Save</ui-button>');
    });

    it('has no accessibility violations as a secondary button', async () => {
        await expectAccessible('<ui-button variant="secondary">Cancel</ui-button>');
    });

    it('has no accessibility violations while disabled', async () => {
        await expectAccessible('<ui-button disabled>Unavailable</ui-button>');
    });

    it('keeps a visible focus ring — removing it is how a component stops being usable', () => {
        expect(styleText()).toContain('focus-visible');
        expect(styleText()).toContain('outline:');
    });
});

/**
 * *Every visual decision is a token* is a promise a component can quietly stop keeping.
 *
 * The assertion is the host's own act: declare the property above the component and read
 * what it rendered. A hardcoded value fails it, and so does a reference that stopped being
 * one — an invalid `var()` drops the whole declaration, so the override reaches nothing and
 * the button falls back to the browser's own styling with nothing to read anywhere.
 */
describe('every visual decision a button paints is a token', () => {
    it('takes its shape and its primary colours from the host', async () => {
        const element = await mount('<ui-button>Save</ui-button>');

        element.style.setProperty('--ui-font', 'monospace');
        element.style.setProperty('--ui-radius', '11px');
        element.style.setProperty('--ui-space', '7px');
        element.style.setProperty('--ui-color-primary', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-color-primary-contrast', 'rgb(4, 5, 6)');

        const styles = getComputedStyle(inner(element));

        expect(styles.fontFamily, '--ui-font').toBe('monospace');
        expect(styles.borderRadius, '--ui-radius').toBe('11px');
        expect(styles.paddingTop, '--ui-space').toBe('7px');
        expect(styles.paddingLeft, '--ui-space, doubled across the inline axis').toBe('14px');
        expect(styles.backgroundColor, '--ui-color-primary').toBe('rgb(1, 2, 3)');
        expect(styles.color, '--ui-color-primary-contrast').toBe('rgb(4, 5, 6)');
    });

    it('fills a primary button with the accent and its label, until a theme gives the button its own', async () => {
        // The primary's names compute what the accent's do, from the accent: a host who moves
        // the accent moves the button with it.
        const element = await mount('<ui-button>Save</ui-button>');

        element.style.setProperty('--ui-color-accent', 'rgb(0, 0, 0)');

        const styles = getComputedStyle(inner(element));

        expect(styles.backgroundColor).toBe('rgb(0, 0, 0)');
        expect(styles.color, "the accent's pole").toBe('color(srgb-linear 1 1 1)');
    });

    it('takes the neutral pair from the host, as a secondary button', async () => {
        const element = await mount('<ui-button variant="secondary">Cancel</ui-button>');

        element.style.setProperty('--ui-color-surface', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-color-text', 'rgb(4, 5, 6)');

        const styles = getComputedStyle(inner(element));

        expect(styles.backgroundColor, '--ui-color-surface').toBe('rgb(1, 2, 3)');
        expect(styles.color, '--ui-color-text').toBe('rgb(4, 5, 6)');
    });

    it('takes the focus ring colour from the host', async () => {
        // Tabbed to rather than focused by script: `:focus-visible` is what carries the
        // ring, and it matches on a keyboard interaction rather than on a `focus()` call.
        const element = await mount('<ui-button>Save</ui-button>');
        element.style.setProperty('--ui-color-focus', 'rgb(1, 2, 3)');

        await userEvent.tab();

        expect(element.shadowRoot?.activeElement, 'tab reached the button').toBe(inner(element));
        expect(getComputedStyle(inner(element)).outlineColor).toBe('rgb(1, 2, 3)');
    });

    it.each([
        ['primary', '<ui-button>Save</ui-button>', '--ui-color-primary-hover'],
        ['secondary', '<ui-button variant="secondary">Cancel</ui-button>', '--ui-color-hover'],
    ])('takes the hover colour from the host, as a %s button', async (_v, markup, token) => {
        const element = await mount(markup);
        element.style.setProperty(token, 'rgb(1, 2, 3)');
        // The colour is the question here, not the motion — and a background read partway
        // through a 150ms transition is whatever the interpolation had reached. Taking the
        // duration out is the host's own knob, and it makes the read the destination.
        element.style.setProperty('--ui-duration-state', '0s');

        await userEvent.hover(inner(element));

        expect(background(element)).toBe('rgb(1, 2, 3)');
    });

    it.each([
        ['primary', '<ui-button>Save</ui-button>', '--ui-color-primary-pressed'],
        ['secondary', '<ui-button variant="secondary">Cancel</ui-button>', '--ui-color-pressed'],
    ])('takes the pressed colour from the host, as a %s button', async (_v, markup, token) => {
        const element = await mount(markup);
        element.style.setProperty(token, 'rgb(1, 2, 3)');

        await press(inner(element), true);

        expect(background(element)).toBe('rgb(1, 2, 3)');
    });
});

/**
 * A component that accepts interaction and shows no feedback is defective, which is the
 * rule that brought the interaction colours and the first motion tokens into the token
 * layer at all. These are the assertions that make it a rule rather than a sentence.
 *
 * Nothing here restates a colour. The question a hover asks is *did it move*, and the
 * answer is a comparison against what the same button was painted a moment earlier — so
 * retuning a formula does not touch this file, and removing one fails it.
 */
describe('the interaction states', () => {
    it.each([
        ['primary', '<ui-button>Save</ui-button>'],
        ['secondary', '<ui-button variant="secondary">Cancel</ui-button>'],
    ])('answers a pointer, as a %s button', async (_variant, markup) => {
        const element = await mount(markup);
        const resting = background(element);

        await userEvent.hover(inner(element));

        expect(background(element)).not.toBe(resting);
    });

    it.each([
        ['primary', '<ui-button>Save</ui-button>'],
        ['secondary', '<ui-button variant="secondary">Cancel</ui-button>'],
    ])('goes further under a press than under a hover, as a %s button', async (_v, markup) => {
        const element = await mount(markup);

        await userEvent.hover(inner(element));
        const hovered = background(element);

        await press(inner(element), true);

        expect(background(element)).not.toBe(hovered);
    });

    it('ignores a pointer while disabled, which is the :not(:disabled) guard', async () => {
        // A disabled button matches :hover and :active — measured, and the reason the
        // guard is written rather than left to source order. Without it the button lights
        // up under a pointer that cannot activate it.
        const element = await mount('<ui-button disabled>Unavailable</ui-button>');
        const resting = background(element);

        await userEvent.hover(inner(element));

        expect(background(element), 'hovered').toBe(resting);

        await press(inner(element), true);

        expect(background(element), 'pressed').toBe(resting);
    });

    it('pairs hover with focus, both or neither', () => {
        // A component that reacts to the mouse and not to the keyboard is the classic way
        // an effect becomes an exclusion. Layer 1 states the pairing as a review rule; this
        // is the check under it, and the nine components still queued inherit both.
        expect(styleText()).toContain(':hover');
        expect(styleText()).toContain(':focus-visible');
    });

    it('guards every interaction rule against :disabled, over the whole sheet', () => {
        // The behavioural half is asserted above, on this button. This half is structural
        // and reaches the rules a later variant might add: ordering does not save them,
        // because the `:disabled` rule sets different properties and never collides.
        const rules = [...styleText().matchAll(/button[a-z.\-:()]*:(?:hover|active)/g)];

        for (const [rule] of rules) {
            expect(rule, rule).toContain(':not(:disabled)');
        }

        expect(rules.length, 'and there are some to guard').toBeGreaterThan(0);
    });

    it('moves the colour over the state duration, and moves nothing else', async () => {
        const element = await mount('<ui-button>Save</ui-button>');
        const styles = getComputedStyle(inner(element));

        // The focus ring is deliberately absent from the transition: delaying the
        // affordance that says *this is where you are* is the opposite of its purpose.
        expect(styles.transitionProperty).toBe('background-color');
        expect(styles.transitionDuration).toBe('0.15s');
    });

    it('owns the tap highlight, so the pressed colour is what a finger sees', async () => {
        // Measured off Chromium before this was written: WebKit paints 40% black on tap
        // and Chromium under a phone viewport paints the Android blue, both over whatever
        // the component decided. The component now has a pressed state of its own, which
        // is the only reason turning the wash off is a fix rather than a removal.
        const element = await mount('<ui-button>Save</ui-button>');
        const highlight = getComputedStyle(inner(element)).getPropertyValue(
            '-webkit-tap-highlight-color',
        );

        expect(highlight).toBe('rgba(0, 0, 0, 0)');
    });

    it('lands on the pressed colour with no transition at all', async () => {
        // A press is over in about 100ms, so an entering transition of 150ms would finish
        // after the finger has left and the pressed colour would never be seen.
        const element = await mount('<ui-button>Save</ui-button>');

        await press(inner(element), true);

        expect(getComputedStyle(inner(element)).transitionDuration).toBe('0s');
    });
});

/**
 * The playground's gate. A story that stops compiling or stops rendering fails here rather
 * than on the deploy, which runs after the required check.
 */
/**
 * RFC 0006's first rollout step. An `aria-describedby` written in the host's tree cannot
 * name a node in this shadow root — one IDREF, one tree scope — so `<ui-tooltip>` hands the
 * sentence over instead and this element renders it where the reference resolves.
 *
 * `<ui-button>` is the element the proposal chose to prove it on: it is the one with no
 * supplementary text of any kind today, so there is nothing here to regress.
 */
/**
 * The glow a theme lights a control with, drawn on a layer over the button: a theme writes
 * it in `currentColor`, and the button's own colour is its label.
 */
describe('the glow a theme lights', () => {
    const glow = '0 0 0 1px currentColor';
    const variants = [
        ['primary', '<ui-button>Save</ui-button>'],
        ['secondary', '<ui-button variant="secondary">Cancel</ui-button>'],
    ] as const;

    /** What the layer the glow is drawn on computes to. */
    function lit(element: UiButton): CSSStyleDeclaration {
        return getComputedStyle(inner(element), '::before');
    }

    beforeEach(async () => {
        // Off every button, so a resting read is not a hovered one.
        await cdp().send('Input.dispatchMouseEvent', {
            type: 'mouseMoved',
            x: 1,
            y: 1,
            buttons: 0,
        });
    });

    it.each(variants)('lights nothing on a %s button by default', async (_variant, markup) => {
        const element = await mount(markup);

        expect(lit(element).boxShadow).toBe('none');
    });

    it.each(variants)(
        'lights a %s button in the accent, against its boundary',
        async (_v, markup) => {
            const element = await mount(markup);

            element.style.setProperty('--ui-elevation-control', glow);
            element.style.setProperty('--ui-color-accent', 'rgb(1, 2, 3)');
            element.style.setProperty('--ui-radius', '11px');

            expect(lit(element).boxShadow).toBe('rgb(1, 2, 3) 0px 0px 0px 1px');
            // Over the whole button, its border included, and at its corner.
            expect(lit(element).position).toBe('absolute');
            expect(lit(element).top).toBe('-1px');
            expect(lit(element).left).toBe('-1px');
            expect(lit(element).borderTopLeftRadius).toBe('11px');
        },
    );

    it('lights to the hover glow under the pointer, the resting one until a theme says', async () => {
        const element = await mount('<ui-button>Save</ui-button>');

        element.style.setProperty('--ui-elevation-control', glow);
        element.style.setProperty('--ui-color-accent', 'rgb(1, 2, 3)');
        await userEvent.hover(inner(element));

        expect(lit(element).boxShadow).toBe('rgb(1, 2, 3) 0px 0px 0px 1px');

        element.style.setProperty('--ui-elevation-control-hover', '0 0 0 2px currentColor');

        expect(lit(element).boxShadow).toBe('rgb(1, 2, 3) 0px 0px 0px 2px');
    });

    it('lights nothing that cannot be used, under the pointer or not', async () => {
        const element = await mount('<ui-button disabled>Save</ui-button>');

        element.style.setProperty('--ui-elevation-control', glow);

        expect(lit(element).boxShadow).toBe('none');

        await userEvent.hover(inner(element));

        expect(lit(element).boxShadow).toBe('none');
    });
});

/**
 * The edge, which is drawn on a layer of its own in the variant's colour, and the lift a theme
 * gives a button on the same layer. Read back from a retuned name, as every token here is.
 */
describe('the edge, and the lift a theme gives', () => {
    /** What the layer the edge is drawn on computes to. */
    function edged(element: UiButton): CSSStyleDeclaration {
        return getComputedStyle(inner(element), '::after');
    }

    beforeEach(async () => {
        // Off every button, so a resting read is not a hovered one.
        await cdp().send('Input.dispatchMouseEvent', {
            type: 'mouseMoved',
            x: 1,
            y: 1,
            buttons: 0,
        });
    });

    it('edges a secondary button in its text and a primary in nothing, as before', async () => {
        const secondary = await mount('<ui-button variant="secondary">Cancel</ui-button>');
        secondary.style.setProperty('--ui-color-text', 'rgb(1, 2, 3)');
        const primary = await mount('<ui-button>Save</ui-button>');

        expect(edged(secondary).borderTopColor).toBe('rgb(1, 2, 3)');
        expect(edged(primary).borderTopColor).toBe('rgba(0, 0, 0, 0)');
        // Over the button's own border, which it keeps transparent as room.
        expect(edged(secondary).top).toBe('-1px');
        expect(edged(secondary).borderTopWidth).toBe('1px');
        expect(edged(secondary).borderTopStyle).toBe('solid');
        expect(edged(secondary).position).toBe('absolute');
        expect(getComputedStyle(inner(secondary)).borderTopColor).toBe('rgba(0, 0, 0, 0)');
    });

    it.each([
        ['primary', '<ui-button>Save</ui-button>'],
        ['secondary', '<ui-button variant="secondary">Cancel</ui-button>'],
    ])('takes the edge, and the lift, from the host on a %s button', async (_v, markup) => {
        const element = await mount(markup);
        element.style.setProperty('--ui-color-border-button', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-elevation-button', 'rgb(4, 5, 6) 0px 1px 3px 0px');
        element.style.setProperty('--ui-radius', '11px');

        expect(edged(element).borderTopColor).toBe('rgb(1, 2, 3)');
        expect(edged(element).boxShadow).toBe('rgb(4, 5, 6) 0px 1px 3px 0px');
        expect(edged(element).borderTopLeftRadius).toBe('11px');
    });

    it('lifts nothing by default', async () => {
        const element = await mount('<ui-button>Save</ui-button>');

        expect(edged(element).boxShadow).toBe('none');
    });

    it('moves the edge with the motion the host sets', async () => {
        const element = await mount('<ui-button variant="secondary">Cancel</ui-button>');
        element.style.setProperty('--ui-duration-state', '0.4s');
        element.style.setProperty('--ui-easing-state', 'linear');

        expect(edged(element).transitionProperty).toBe('border-color');
        expect(edged(element).transitionDuration).toBe('0.4s');
        expect(edged(element).transitionTimingFunction).toBe('linear');
    });

    it('goes to the edge a theme gives the pointer, and stays put until one does', async () => {
        const element = await mount('<ui-button variant="secondary">Cancel</ui-button>');
        element.style.setProperty('--ui-color-border-button', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-duration-state', '0s');
        await userEvent.hover(inner(element));

        expect(edged(element).borderTopColor, 'the resting edge').toBe('rgb(1, 2, 3)');

        element.style.setProperty('--ui-color-border-button-hover', 'rgb(7, 8, 9)');

        expect(edged(element).borderTopColor, 'the edge under the pointer').toBe('rgb(7, 8, 9)');
    });

    it('moves no edge on a button that cannot be used', async () => {
        const element = await mount('<ui-button variant="secondary" disabled>Cancel</ui-button>');
        element.style.setProperty('--ui-color-border-button', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-color-border-button-hover', 'rgb(7, 8, 9)');
        element.style.setProperty('--ui-duration-state', '0s');
        await userEvent.hover(inner(element), { force: true });

        expect(edged(element).borderTopColor).toBe('rgb(1, 2, 3)');
    });

    it("fills a secondary button with the controls' own fill", async () => {
        const element = await mount('<ui-button variant="secondary">Cancel</ui-button>');
        element.style.setProperty('--ui-color-surface-control', 'rgb(1, 2, 3, 0.2)');

        expect(background(element)).toBe('rgba(1, 2, 3, 0.2)');
    });
});

describe('the description a tooltip hands over', () => {
    /** Dispatches the handoff the way `<ui-tooltip>` does, and reports whether it was taken. */
    function hand(element: UiButton, detail: unknown): boolean {
        return !element.dispatchEvent(new CustomEvent('ui-describe', { detail, cancelable: true }));
    }

    it('renders the sentence where its own control can reach it', async () => {
        const element = await mount('<ui-button>Save</ui-button>');

        expect(inner(element).hasAttribute('aria-describedby'), 'bare until handed').toBe(false);

        expect(hand(element, 'Saves without closing the dialog.'), 'taken').toBe(true);
        await element.updateComplete;

        const described = inner(element).getAttribute('aria-describedby');
        const carrier = element.shadowRoot?.getElementById(String(described));

        expect(described).toBe('description');
        expect(carrier?.textContent).toBe('Saves without closing the dialog.');
    });

    it('does not paint the sentence, because the tip is already showing it', async () => {
        const element = await mount('<ui-button>Save</ui-button>');
        const before = element.getBoundingClientRect().width;

        hand(element, 'Saves without closing the dialog, which is a long sentence.');
        await element.updateComplete;

        const carrier = element.shadowRoot?.getElementById('description');

        expect(carrier?.getBoundingClientRect().width).toBeLessThanOrEqual(1);
        expect(element.getBoundingClientRect().width, 'the button did not grow').toBe(before);
    });

    it('takes the description away when the sentence is withdrawn', async () => {
        // The withdrawal is the same event carrying the empty string, because `detail` is
        // a string whose empty value means absent — the shape `help` and `error` have.
        const element = await mount('<ui-button>Save</ui-button>');

        hand(element, 'Saves.');
        await element.updateComplete;

        expect(hand(element, ''), 'the withdrawal is taken too').toBe(true);
        await element.updateComplete;

        expect(inner(element).hasAttribute('aria-describedby')).toBe(false);
        expect(element.shadowRoot?.getElementById('description')).toBeNull();
    });

    it('leaves a payload that is not a sentence unclaimed', async () => {
        // Unclaimed rather than accepted and ignored: the dispatch's return value is the
        // whole of the advertisement, so a malformed handoff has to read as a refusal.
        const element = await mount('<ui-button>Save</ui-button>');

        expect(hand(element, 42)).toBe(false);
        await element.updateComplete;

        expect(inner(element).hasAttribute('aria-describedby')).toBe(false);
    });

    it('leaves a plain event of the same name unclaimed', async () => {
        const element = await mount('<ui-button>Save</ui-button>');

        expect(element.dispatchEvent(new Event('ui-describe', { cancelable: true }))).toBe(true);
        await element.updateComplete;

        expect(inner(element).hasAttribute('aria-describedby')).toBe(false);
    });

    it('arrives from a real tooltip, and is announced from inside this root', async () => {
        const host = document.createElement('div');
        host.style.marginBlockStart = '120px';
        host.innerHTML = `
            <ui-tooltip>
                <ui-button>Save</ui-button>
                <span slot="tip">Saves without closing the dialog.</span>
            </ui-tooltip>
        `;
        document.body.append(host);

        const element = only(host);
        await element.updateComplete;
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });
        await element.updateComplete;

        const described = inner(element).getAttribute('aria-describedby');

        expect(described).toBe('description');
        expect(element.shadowRoot?.getElementById(String(described))?.textContent).toBe(
            'Saves without closing the dialog.',
        );

        await expectAccessible(host);
    });
});

/**
 * RFC 0004's effects, which the button is the first to draw: the default theme's taste raises it
 * under the pointer and at the focus, lifts it at the focus, and squeezes it and sinks its shadow
 * under a press. Each reads a choice or a taste, so each is read here with one written — the
 * token sheet's taste, a consumer's choice, or the button's own taste.
 */
/** Inserts the sheet a host inserts, which carries the default theme's taste. */
function sheet(): void {
    const style = document.createElement('style');
    style.textContent = tokenStyleSheet();
    document.body.append(style);
}

/**
 * Mounts a button with every duration taken out, the host's own knob, so a read is where an
 * effect lands rather than a frame on its way there.
 */
async function still(markup = '<ui-button>Save</ui-button>'): Promise<UiButton> {
    const element = await mount(markup);
    element.style.setProperty('--ui-duration-state', '0s');
    element.style.setProperty('--ui-duration-effect', '0s');

    return element;
}

/** What the effects move on the real button, as it is painted now. */
function moved(element: UiButton): readonly [shadow: string, translate: string, scale: string] {
    const styles = getComputedStyle(inner(element));

    return [styles.boxShadow, styles.translate, styles.scale];
}

describe("the effects the default theme's taste names", () => {
    /** The raise, as the browser serialises it in the light scheme. */
    const raised = 'rgba(0, 0, 0, 0.25) 0px 2px 4px -1px, rgba(0, 0, 0, 0.35) 0px 6px 14px -4px';

    /** The sink, the same way. */
    const sunk = 'rgba(0, 0, 0, 0.35) 0px 2px 5px 0px inset';

    it('moves nothing new where nothing is chosen, as before', async () => {
        const element = await still();

        await userEvent.hover(inner(element));
        await press(inner(element), true);

        expect(moved(element)).toEqual(['none', 'none', 'none']);
    });

    it('raises the button under the pointer', async () => {
        sheet();
        const element = await still();

        await userEvent.hover(inner(element));

        expect(moved(element)).toEqual([raised, 'none', 'none']);
    });

    it('raises it and lifts it two pixels, ring and all, at the focus', async () => {
        sheet();
        const element = await still();

        await userEvent.tab();

        expect(moved(element)).toEqual([raised, '0px -2px', 'none']);
    });

    it('squeezes it and sinks its shadow under a press, drawn over the pointer', async () => {
        sheet();
        const element = await still();

        await userEvent.hover(inner(element));
        await press(inner(element), true);

        expect(moved(element)).toEqual([sunk, 'none', '0.96']);
    });

    it('lets the focus win: a pointer resting on a focused button changes nothing', async () => {
        sheet();
        const element = await still();
        element.style.setProperty('--ui-motion-focus-shadow', 'none');

        await userEvent.tab();
        await userEvent.hover(inner(element));

        expect(moved(element)[0], 'the focus chose no shadow').toBe('none');
    });

    it('moves nothing that cannot be used', async () => {
        sheet();
        const element = await still('<ui-button disabled>Unavailable</ui-button>');

        await userEvent.hover(inner(element));
        await press(inner(element), true);

        expect(moved(element)).toEqual(['none', 'none', 'none']);
    });

    it('draws nothing where a host chooses none for each moment', async () => {
        sheet();
        const element = await still();

        for (const moment of ['hover-shadow', 'press-move', 'press-shadow']) {
            element.style.setProperty(`--ui-motion-${moment}`, 'none');
        }

        await userEvent.hover(inner(element));
        await press(inner(element), true);

        expect(moved(element)).toEqual(['none', 'none', 'none']);
    });

    it("answers a choice on one instance, and the button's own taste over the page's", async () => {
        const element = await still();
        element.style.setProperty('--ui-motion-press-move', 'squish');
        element.style.setProperty('--ui-taste-press-shadow', 'none');
        element.style.setProperty('--ui-taste-button-press-shadow', 'sink');

        await press(inner(element), true);

        expect(moved(element)).toEqual([sunk, 'none', '0.96']);
    });

    it('draws the wider layer of the raise in the accent on a dark page', async () => {
        sheet();
        const element = await still();
        element.style.colorScheme = 'dark';
        element.style.setProperty('--ui-color-accent', 'rgb(10, 20, 30)');

        await userEvent.hover(inner(element));

        const [shadow] = moved(element);

        expect(shadow).toContain('rgba(0, 0, 0, 0.6) 0px 2px 4px -1px');
        // Relative colour syntax resolves to a colour the browser writes in sRGB's own terms.
        expect(shadow).toContain(
            'color(srgb 0.0392157 0.0784314 0.117647 / 0.45) 0px 6px 14px -4px',
        );
    });

    it.each([
        ['hover-shadow', 'raise'],
        ['hover-shadow', 'glow'],
        ['focus-shadow', 'raise'],
        ['focus-shadow', 'inner'],
        ['focus-move', 'lift'],
        ['press-move', 'squish'],
        ['press-move', 'spring'],
        ['press-shadow', 'sink'],
    ] as const)(
        'transitions what the effects move once %s is %s, and only then',
        async (moment, effect) => {
            const element = await mount('<ui-button>Save</ui-button>');

            element.style.setProperty(`--ui-motion-${moment}`, effect);

            expect(getComputedStyle(inner(element)).transitionProperty).toBe(
                'background-color, box-shadow, translate, scale',
            );
        },
    );

    it('moves each property on its own token, the squeeze on the emphasis curve', async () => {
        sheet();
        const element = await mount('<ui-button>Save</ui-button>');
        element.style.setProperty('--ui-duration-state', '3ms');
        element.style.setProperty('--ui-duration-effect', '7ms');
        element.style.setProperty('--ui-easing-state', 'step-end');
        element.style.setProperty('--ui-easing-enter', 'ease');
        element.style.setProperty('--ui-easing-emphasis', 'linear');

        const styles = getComputedStyle(inner(element));

        expect(styles.transitionDuration).toBe('0.003s, 0.007s, 0.007s, 0.007s');
        expect(styles.transitionTimingFunction).toBe('steps(1), ease, ease, linear');
    });

    it('lands a press at once and lets it go over the effect', async () => {
        sheet();
        const element = await mount('<ui-button>Save</ui-button>');

        await press(inner(element), true);

        expect(getComputedStyle(inner(element)).transitionDuration, 'pressed').toBe('0s');

        await press(inner(element), false);

        expect(getComputedStyle(inner(element)).transitionDuration, 'let go').toBe(
            '0.15s, 0.24s, 0.24s, 0.24s',
        );
    });

    /**
     * A native button before the component, whose ring the glide leaves from, and the component
     * itself, under the token sheet — so under the default theme's taste, which glides the ring.
     */
    async function line(): Promise<UiButton> {
        sheet();
        const before = document.createElement('button');
        before.textContent = 'Before';
        document.body.append(before);

        return mount('<ui-button>Save</ui-button>');
    }

    /** Whether the page's ring is in the air. */
    function flying(): boolean {
        return document.querySelector('[data-ui-ring]:popover-open') !== null;
    }

    /** What the button's sheet hands the page's ring, read where the script reads it. */
    function handed(element: UiButton): readonly [ring: string, time: string, curve: string] {
        const styles = getComputedStyle(inner(element));

        return [
            styles.getPropertyValue('--ui-fx-ring'),
            styles.getPropertyValue('--ui-fx-ring-time'),
            styles.getPropertyValue('--ui-fx-ring-curve'),
        ];
    }

    it('glides the focus ring over from the control before it', async () => {
        const element = await line();

        await userEvent.tab();
        await userEvent.tab();

        expect(flying(), "the page's ring in the air").toBe(true);
        expect(inner(element).style.outlineStyle, "the button's own put away").toBe('none');
    });

    it('hands the ring the glide, its time and its curve, while the reader can see the focus', async () => {
        const element = await line();

        await userEvent.tab();
        await userEvent.tab();

        expect(handed(element)).toEqual(['glide', '360ms', 'cubic-bezier(0.4, 0, 0.2, 1)']);
    });

    it('hands it nothing where the focus came by the pointer, which draws no ring', async () => {
        const element = await line();

        await userEvent.click(inner(element));

        expect(handed(element)).toEqual(['', '', '']);
        expect(flying()).toBe(false);
    });

    it('glides nothing where a host chose another ring', async () => {
        const element = await line();
        element.style.setProperty('--ui-motion-focus-ring', 'none');

        await userEvent.tab();
        await userEvent.tab();

        expect(flying()).toBe(false);
    });

    it.each([
        ['forced colours', 'forced-colors', 'active'],
        ['reduced motion', 'prefers-reduced-motion', 'reduce'],
    ])('glides nothing under %s', async (_setting, name, value) => {
        await cdp().send('Emulation.setEmulatedMedia', { features: [{ name, value }] });

        try {
            await line();
            await userEvent.tab();
            await userEvent.tab();

            expect(flying()).toBe(false);
        } finally {
            await cdp().send('Emulation.setEmulatedMedia', { features: [] });
        }
    });
});

/**
 * The effects Matrix's taste names, chosen one at a time on a button whose colours are retuned
 * to values a read can tell apart, and then read off the theme itself.
 */
describe("the effects Matrix's taste names", () => {
    const variants = [
        ['primary', '<ui-button>Save</ui-button>'],
        ['secondary', '<ui-button variant="secondary">Cancel</ui-button>'],
    ] as const;

    /** Each variant's colour at rest, under the pointer and pressed, as `colours` retunes them. */
    const painted = {
        primary: { rest: 'rgb(10, 0, 0)', hover: 'rgb(20, 0, 0)', pressed: 'rgb(30, 0, 0)' },
        secondary: { rest: 'rgb(0, 10, 0)', hover: 'rgb(0, 20, 0)', pressed: 'rgb(0, 30, 0)' },
    } as const;

    /** Retunes the button's six colours to `painted`'s, through the names a host has. */
    function colours(element: UiButton): void {
        element.style.setProperty('--ui-color-primary', painted.primary.rest);
        element.style.setProperty('--ui-color-primary-hover', painted.primary.hover);
        element.style.setProperty('--ui-color-primary-pressed', painted.primary.pressed);
        element.style.setProperty('--ui-color-surface-control', painted.secondary.rest);
        element.style.setProperty('--ui-color-hover', painted.secondary.hover);
        element.style.setProperty('--ui-color-pressed', painted.secondary.pressed);
    }

    /** Chooses an effect for each moment named, on the one button. */
    function choose(element: UiButton, choices: Readonly<Record<string, string>>): void {
        for (const [moment, effect] of Object.entries(choices)) {
            element.style.setProperty(`--ui-motion-${moment}`, effect);
        }
    }

    /** The channels of an `oklch()` the browser computed: lightness, chroma, hue, opacity. */
    function oklch(colour: string): readonly [number, number, number, number] {
        const match = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)$/.exec(colour);

        if (match === null) {
            throw new Error(`not an oklch() colour: ${colour}`);
        }

        return [Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4] ?? '1')];
    }

    /**
     * The pointer at the corner of the page furthest from a mounted button, which is laid at the
     * nearest one: pressed there and let go, if `click`, so the next Tab starts from the page.
     */
    async function away(click = false): Promise<void> {
        const at = { x: innerWidth - 1, y: innerHeight - 1 };

        await cdp().send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...at, buttons: 0 });

        if (click) {
            for (const type of ['mousePressed', 'mouseReleased'] as const) {
                await cdp().send('Input.dispatchMouseEvent', {
                    type,
                    ...at,
                    button: 'left',
                    buttons: type === 'mousePressed' ? 1 : 0,
                    clickCount: 1,
                });
            }
        }
    }

    /** Holds Space down on whatever has the focus, which makes a button `:active` with no pointer. */
    async function space(down: boolean): Promise<void> {
        await cdp().send('Input.dispatchKeyEvent', {
            type: down ? 'keyDown' : 'keyUp',
            key: ' ',
            code: 'Space',
            windowsVirtualKeyCode: 32,
        });
    }

    /** What the layer a theme's glow is drawn on computes to. */
    function lit(element: UiButton): string {
        return getComputedStyle(inner(element), '::before').boxShadow;
    }

    /** The burst, if one is playing on the button. */
    function burst(element: UiButton): CSSAnimation | undefined {
        return inner(element)
            .getAnimations()
            .find(
                (animation): animation is CSSAnimation =>
                    animation instanceof CSSAnimation && animation.animationName === 'ui-burst',
            );
    }

    beforeEach(async () => {
        await away();
    });

    it('tints a secondary button under the pointer, a little of the accent held light', async () => {
        const element = await still('<ui-button variant="secondary">Cancel</ui-button>');
        choose(element, { 'hover-fill': 'tint' });
        element.style.setProperty('--ui-color-surface-control', 'rgb(255, 255, 255)');
        element.style.setProperty('--ui-color-accent', 'rgb(0, 0, 255)');

        await userEvent.hover(inner(element));

        const [lightness, chroma, hue, opacity] = oklch(background(element));

        // An eighth of the accent's chroma in white, at the accent's own hue, lifted to 0.98.
        expect(lightness).toBe(0.98);
        expect(chroma).toBeCloseTo(0.0376, 3);
        expect(hue).toBeCloseTo(264.1, 1);
        expect(opacity).toBe(1);
    });

    it('tints it a tenth of the accent in the dark scheme, where nothing holds it light', async () => {
        const element = await still('<ui-button variant="secondary">Cancel</ui-button>');
        choose(element, { 'hover-fill': 'tint' });
        element.style.colorScheme = 'dark';
        element.style.setProperty('--ui-color-surface-control', 'rgb(0, 0, 0)');
        element.style.setProperty('--ui-color-accent', 'rgb(0, 0, 255)');

        await userEvent.hover(inner(element));

        const [lightness, chroma, hue] = oklch(background(element));

        expect(lightness).toBeCloseTo(0.0452, 3);
        expect(chroma).toBeCloseTo(0.0313, 3);
        expect(hue).toBeCloseTo(264.1, 1);
    });

    it.each(['light', 'dark'])(
        'keeps the tint at least 0.6 opaque over a fill the page shows through, in %s',
        async (scheme) => {
            const element = await still('<ui-button variant="secondary">Cancel</ui-button>');
            choose(element, { 'hover-fill': 'tint' });
            element.style.colorScheme = scheme;
            element.style.setProperty('--ui-color-surface-control', 'rgb(255 255 255 / 0.2)');

            await userEvent.hover(inner(element));

            expect(oklch(background(element))[3]).toBeCloseTo(0.6, 5);
        },
    );

    it('tints a primary button the hover colour it already goes to', async () => {
        const element = await still();
        colours(element);
        choose(element, { 'hover-fill': 'tint' });

        await userEvent.hover(inner(element));

        expect(background(element)).toBe(painted.primary.hover);
    });

    it.each(variants)(
        'leaves a %s button as it rests under the pointer where the pointer chose none',
        async (variant, markup) => {
            const element = await still(markup);
            colours(element);
            choose(element, { 'hover-fill': 'none' });

            await userEvent.hover(inner(element));

            expect(background(element)).toBe(painted[variant].rest);
        },
    );

    it.each(variants)(
        'leaves a %s button as it rests under the pointer where the spotlight lights it',
        async (variant, markup) => {
            const element = await still(markup);
            colours(element);
            element.style.setProperty('--ui-motion-hover-fill', 'spotlight');

            await userEvent.hover(inner(element));

            expect(background(element)).toBe(painted[variant].rest);
        },
    );

    it.each(variants)(
        'fills a %s button with its hover colour at the focus, over the pointer',
        async (variant, markup) => {
            const element = await still(markup);
            colours(element);
            choose(element, { 'focus-fill': 'highlight', 'hover-fill': 'none' });

            await userEvent.tab();

            expect(background(element), 'at the focus').toBe(painted[variant].hover);

            await userEvent.hover(inner(element));

            expect(background(element), 'the pointer resting on it').toBe(painted[variant].hover);
        },
    );

    it.each(variants)(
        'keeps a press on a %s button its own colour, over the pointer and the focus',
        async (variant, markup) => {
            const element = await still(markup);
            colours(element);
            choose(element, { 'hover-fill': 'tint', 'focus-fill': 'highlight' });

            await userEvent.tab();
            await userEvent.hover(inner(element));
            await press(inner(element), true);

            expect(background(element)).toBe(painted[variant].pressed);
        },
    );

    it.each([
        ['primary', 'nothing', '<ui-button>Save</ui-button>', {}],
        ['secondary', 'nothing', '<ui-button variant="secondary">Cancel</ui-button>', {}],
        [
            'secondary',
            'the tint',
            '<ui-button variant="secondary">Cancel</ui-button>',
            { 'hover-fill': 'tint' },
        ],
        ['primary', 'none', '<ui-button>Save</ui-button>', { 'hover-fill': 'none' }],
        [
            'secondary',
            'none',
            '<ui-button variant="secondary">Cancel</ui-button>',
            { 'hover-fill': 'none' },
        ],
    ] as const)(
        'leaves a %s button as the pointer left it under a press with no colour, where the pointer chose %s',
        async (_variant, _choice, markup, choices) => {
            const element = await still(markup);
            colours(element);
            choose(element, { ...choices, 'press-fill': 'none' });

            await userEvent.hover(inner(element));

            const hovered = background(element);

            await press(inner(element), true);

            expect(background(element)).toBe(hovered);
        },
    );

    it.each([
        ['primary', 'nothing', 'rest', '<ui-button>Save</ui-button>', {}],
        ['secondary', 'nothing', 'rest', '<ui-button variant="secondary">Cancel</ui-button>', {}],
        [
            'primary',
            'the highlight',
            'hover',
            '<ui-button>Save</ui-button>',
            { 'focus-fill': 'highlight' },
        ],
        [
            'secondary',
            'the highlight',
            'hover',
            '<ui-button variant="secondary">Cancel</ui-button>',
            { 'focus-fill': 'highlight' },
        ],
    ] as const)(
        'leaves a %s button as the focus left it under a press with no colour, where the focus chose %s',
        async (variant, _choice, state, markup, choices) => {
            const element = await still(markup);
            colours(element);
            choose(element, { ...choices, 'press-fill': 'none' });

            await userEvent.tab();
            await space(true);

            try {
                expect(inner(element).matches(':active'), 'pressed by Space').toBe(true);
                expect(background(element)).toBe(painted[variant][state]);
            } finally {
                await space(false);
            }
        },
    );

    it('glows under the pointer, a light of the accent round its boundary', async () => {
        const element = await still();
        choose(element, { 'hover-shadow': 'glow' });
        element.style.setProperty('--ui-color-accent', 'rgb(10, 20, 30)');

        await userEvent.hover(inner(element));

        expect(moved(element)[0]).toBe(
            'color(srgb 0.0392157 0.0784314 0.117647 / 0.5) 0px 0px 12px 2px',
        );
    });

    it('lets the focus win over the glow, and a press be drawn over it', async () => {
        const element = await still();
        choose(element, { 'hover-shadow': 'glow', 'press-shadow': 'sink' });

        await userEvent.tab();
        await userEvent.hover(inner(element));

        expect(moved(element)[0], 'the focus chose no shadow').toBe('none');

        await press(inner(element), true);

        expect(moved(element)[0], 'pressed').toBe('rgba(0, 0, 0, 0.35) 0px 2px 5px 0px inset');
    });

    /** Gives the button a theme's glow, its resting ring 1px wide and its pointer's 2px. */
    function glowing(element: UiButton): void {
        element.style.setProperty('--ui-elevation-control', '0 0 0 1px currentColor');
        element.style.setProperty('--ui-elevation-control-hover', '0 0 0 2px currentColor');
        element.style.setProperty('--ui-color-accent', 'rgb(1, 2, 3)');
    }

    it.each(['none', 'raise', 'glow', 'cast'])(
        "keeps the theme's resting glow under the pointer where the pointer's shadow is %s",
        async (effect) => {
            const element = await still();
            glowing(element);
            choose(element, { 'hover-shadow': effect });

            await userEvent.hover(inner(element));

            expect(lit(element)).toBe('rgb(1, 2, 3) 0px 0px 0px 1px');
        },
    );

    it.each(['none', 'raise', 'burst', 'inner'])(
        "keeps the theme's resting glow at the focus where the focus's shadow is %s",
        async (effect) => {
            const element = await still();
            glowing(element);
            choose(element, { 'focus-shadow': effect });

            await userEvent.tab();
            await userEvent.hover(inner(element));

            expect(lit(element)).toBe('rgb(1, 2, 3) 0px 0px 0px 1px');
        },
    );

    it("lights the theme's pointer glow where nobody chose, at the focus as under the pointer", async () => {
        const element = await still();
        glowing(element);

        await userEvent.tab();
        await userEvent.hover(inner(element));

        expect(lit(element)).toBe('rgb(1, 2, 3) 0px 0px 0px 2px');
    });

    it('bursts light round the button as the reader sees the focus arrive', async () => {
        const element = await still();
        choose(element, { 'focus-shadow': 'burst' });
        element.style.setProperty('--ui-duration-flourish', '10s');
        element.style.setProperty('--ui-easing-enter', 'linear');

        await userEvent.tab();

        const playing = burst(element);

        expect(playing, 'the burst').toBeDefined();
        expect(getComputedStyle(inner(element)).animationDuration).toBe('10s');
        expect(getComputedStyle(inner(element)).animationTimingFunction).toBe('linear');

        playing?.pause();

        for (const [at, shadow] of [
            [0, /\/ 0\.8\) 0px 0px 0px 0px$/],
            [5000, /\/ 0\.4\) 0px 0px 7\.5px 5px$/],
        ] as const) {
            if (playing !== undefined) {
                playing.currentTime = at;
            }

            expect(moved(element)[0], String(at)).toMatch(shadow);
        }
    });

    it('bursts nothing where the focus came by the pointer, which draws no ring', async () => {
        const element = await still();
        choose(element, { 'focus-shadow': 'burst' });

        await userEvent.click(inner(element));

        expect(burst(element)).toBeUndefined();
    });

    it('takes the time out of the burst under reduced motion, with every other duration', async () => {
        await cdp().send('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
        });

        try {
            sheet();
            const element = await mount('<ui-button>Save</ui-button>');
            choose(element, { 'focus-shadow': 'burst' });

            await userEvent.tab();

            const time = Number.parseFloat(getComputedStyle(inner(element)).animationDuration);

            expect(time).toBeGreaterThan(0);
            expect(time).toBeLessThan(0.001);
        } finally {
            await cdp().send('Emulation.setEmulatedMedia', { features: [] });
        }
    });

    it('draws no burst in forced colours, where the system draws the focus', async () => {
        await cdp().send('Emulation.setEmulatedMedia', {
            features: [{ name: 'forced-colors', value: 'active' }],
        });

        try {
            const element = await still();
            choose(element, { 'focus-shadow': 'burst' });

            await userEvent.tab();
            burst(element)?.pause();

            expect(moved(element)[0]).toBe('none');
        } finally {
            await cdp().send('Emulation.setEmulatedMedia', { features: [] });
        }
    });

    /** Whether the page's ring is in the air. */
    function aloft(): boolean {
        return document.querySelector('[data-ui-ring]:popover-open') !== null;
    }

    it("hands the ring the glitch, its time, a straight clock and its two lines' colours", async () => {
        const element = await mount('<ui-button>Save</ui-button>');
        choose(element, { 'focus-ring': 'glitch' });
        element.style.setProperty('--ui-color-danger', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-color-info', 'rgb(4, 5, 6)');

        await userEvent.tab();

        const styles = getComputedStyle(inner(element));

        expect(
            ['', '-time', '-curve', '-left', '-right'].map((name) =>
                styles.getPropertyValue(`--ui-fx-ring${name}`),
            ),
        ).toEqual(['glitch', '520ms', 'linear', 'rgb(1, 2, 3)', 'rgb(4, 5, 6)']);
    });

    it("glitches the ring on the page's first focus, which no glide flies from", async () => {
        const element = await mount('<ui-button>Save</ui-button>');
        choose(element, { 'focus-ring': 'glitch' });

        await userEvent.tab();

        expect(aloft(), "the page's ring in the air").toBe(true);
        expect(inner(element).style.outlineStyle, "the button's own put away").toBe('none');
    });

    it.each([
        ['forced colours', 'forced-colors', 'active'],
        ['reduced motion', 'prefers-reduced-motion', 'reduce'],
    ])('glitches nothing under %s', async (_setting, name, value) => {
        await cdp().send('Emulation.setEmulatedMedia', { features: [{ name, value }] });

        try {
            sheet();
            const element = await mount('<ui-button>Save</ui-button>');
            choose(element, { 'focus-ring': 'glitch' });

            await userEvent.tab();

            expect(aloft()).toBe(false);
        } finally {
            await cdp().send('Emulation.setEmulatedMedia', { features: [] });
        }
    });

    it('hands the press the shatter, its time and its curve, while the button can be used', async () => {
        const element = await mount('<ui-button>Save</ui-button>');
        choose(element, { 'press-move': 'shatter' });

        const handed = (): string[] =>
            ['', '-time', '-curve'].map((name) =>
                getComputedStyle(inner(element)).getPropertyValue(`--ui-fx-press${name}`),
            );

        expect(handed()).toEqual(['shatter', '240ms', 'cubic-bezier(0.4, 0, 0.2, 1)']);

        element.disabled = true;
        await element.updateComplete;

        expect(handed(), 'disabled').toEqual(['', '', '']);
    });

    it('breaks under a press into pieces a filter cuts, and is whole once let go', async () => {
        const element = await mount('<ui-button>Save</ui-button>');
        choose(element, { 'press-move': 'shatter' });

        await press(inner(element), true);

        expect(inner(element).style.filter, 'in pieces').toBe('url("#ui-break")');
        expect(element.shadowRoot?.querySelector('svg filter'), 'its filter').not.toBeNull();

        await press(inner(element), false);

        const [going] = inner(element)
            .getAnimations()
            .filter((animation) => !(animation instanceof CSSTransition));

        going?.finish();
        await going?.finished;

        expect(inner(element).style.filter, 'whole').toBe('');
    });

    it('breaks nothing under reduced motion, as it squeezes nothing', async () => {
        await cdp().send('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
        });

        try {
            sheet();
            const element = await mount('<ui-button>Save</ui-button>');
            choose(element, { 'press-move': 'shatter' });

            await press(inner(element), true);

            expect(inner(element).style.filter).toBe('');
        } finally {
            await cdp().send('Emulation.setEmulatedMedia', { features: [] });
        }
    });

    it("shatters under a press where Matrix's taste runs, rather than squeezing", async () => {
        const style = document.createElement('style');
        style.textContent = tokenStyleSheet() + themeStyleSheet(matrix);
        document.body.append(style);
        const element = await mount('<ui-button>Save</ui-button>');
        element.parentElement?.setAttribute('data-ui-theme', matrix.name);

        await press(inner(element), true);

        expect(inner(element).style.filter).toBe('url("#ui-break")');
        expect(getComputedStyle(inner(element)).scale).toBe('none');
    });

    it("reads Matrix's taste off the theme: light where the default theme's moves", async () => {
        const style = document.createElement('style');
        style.textContent = tokenStyleSheet() + themeStyleSheet(matrix);
        document.body.append(style);
        const element = await still('<ui-button variant="secondary">Cancel</ui-button>');
        element.parentElement?.setAttribute('data-ui-theme', matrix.name);

        await userEvent.hover(inner(element));

        const [shadow] = moved(element);

        expect(oklch(background(element))[0], 'tinted, held light').toBe(0.98);
        expect(shadow, 'glowing').toMatch(/0px 0px 12px 2px$/);

        await press(inner(element), true);

        expect(background(element), 'no colour of its own under a press').toMatch(/^oklch\(0\.98 /);
        expect(moved(element), 'nothing sunk, and no squeeze').toEqual([shadow, 'none', 'none']);

        await press(inner(element), false);
        await away(true);
        await userEvent.tab();

        expect(background(element), "the theme's hover colour at the focus").toBe(
            'rgb(207, 217, 206)',
        );
        expect(moved(element)[1], 'no lift').toBe('none');
        expect(burst(element), 'a burst').toBeDefined();
        expect(aloft(), 'the ring glitching, from a focus no glide would fly from').toBe(true);
        expect(
            [
                getComputedStyle(inner(element)).animationDuration,
                getComputedStyle(inner(element)).animationTimingFunction,
            ],
            'over the flourish, on the curve an arrival takes',
        ).toEqual(['0.52s', 'ease-out']);
    });
});

/** The effects Glass's taste names, chosen one at a time and then read off the theme itself. */
describe("the effects Glass's taste names", () => {
    /** What the browser computes `value` to for `property`, on an element of the page. */
    function resolved(property: string, value: string): string {
        const probe = document.createElement('div');
        probe.style.setProperty(property, value);
        document.body.append(probe);

        try {
            return getComputedStyle(probe).getPropertyValue(property);
        } finally {
            probe.remove();
        }
    }

    /** Moves the pointer off every button, so a read is not a hovered one. */
    async function away(): Promise<void> {
        await cdp().send('Input.dispatchMouseEvent', {
            type: 'mouseMoved',
            x: innerWidth - 1,
            y: innerHeight - 1,
            buttons: 0,
        });
    }

    beforeEach(async () => {
        await away();
    });

    it('holds a light inside the boundary at the focus, in the accent on a secondary button', async () => {
        const element = await still('<ui-button variant="secondary">Cancel</ui-button>');
        element.style.setProperty('--ui-motion-focus-shadow', 'inner');
        element.style.setProperty('--ui-color-accent', 'rgb(10, 20, 30)');

        await userEvent.tab();

        expect(moved(element)[0]).toBe(
            'rgb(10, 20, 30) 0px 0px 0px 1px inset, color(srgb 0.0392157 0.0784314 0.117647 / 0.5) 0px 0px 12px 2px inset',
        );
    });

    it('moves the light toward the label on a primary button, whose fill is the accent already', async () => {
        const element = await still();
        element.style.setProperty('--ui-motion-focus-shadow', 'inner');
        element.style.setProperty('--ui-color-accent', 'rgb(10, 20, 30)');
        element.style.setProperty('--ui-color-primary-contrast', 'rgb(250, 250, 250)');

        await userEvent.tab();

        const line = resolved(
            'color',
            'color-mix(in oklab, rgb(10, 20, 30), rgb(250, 250, 250) 40%)',
        );

        expect(moved(element)[0].startsWith(`${line} 0px 0px 0px 1px inset, `)).toBe(true);
    });

    it('springs a press in further than the squeeze, and lets it go on the spring', async () => {
        const element = await mount('<ui-button>Save</ui-button>');
        element.style.setProperty('--ui-motion-press-move', 'spring');

        await press(inner(element), true);

        expect(getComputedStyle(inner(element)).scale, 'pressed in').toBe('0.9');

        await press(inner(element), false);

        const styles = getComputedStyle(inner(element));
        const curve = resolved(
            'transition-timing-function',
            'linear(0, 0.38 8%, 0.83 17%, 1.06 24%, 1.13 30%, 1.08 39%, 0.99 51%, 0.97 62%, 1 82%, 1)',
        );

        expect(styles.transitionDuration, 'over the flourish').toBe('0.15s, 0.24s, 0.24s, 0.52s');
        expect(styles.transitionTimingFunction, 'on the spring').toBe(
            `ease-in-out, ease-out, ease-out, ${curve}`,
        );
    });

    it("hands the ring the refocus, an effect's time and the curves it comes and goes on", async () => {
        const element = await mount('<ui-button>Save</ui-button>');
        element.style.setProperty('--ui-motion-focus-ring', 'refocus');

        await userEvent.tab();

        const styles = getComputedStyle(inner(element));

        expect(
            ['', '-time', '-curve', '-exit'].map((name) =>
                styles.getPropertyValue(`--ui-fx-ring${name}`),
            ),
        ).toEqual(['refocus', '240ms', 'ease-out', 'ease-in']);
    });

    it("brings the ring into focus where Glass's taste runs, on the page's first focus", async () => {
        const style = document.createElement('style');
        style.textContent = tokenStyleSheet() + themeStyleSheet(glass);
        document.body.append(style);
        const element = await mount('<ui-button>Save</ui-button>');
        element.parentElement?.setAttribute('data-ui-theme', glass.name);

        await userEvent.tab();

        expect(document.querySelector('[data-ui-ring]:popover-open')).not.toBeNull();
        expect(getComputedStyle(inner(element)).getPropertyValue('--ui-fx-ring')).toBe('refocus');
    });

    /** The shimmer, if one is sweeping the button's layer under its label. */
    function shimmer(element: UiButton): CSSAnimation | undefined {
        return inner(element)
            .getAnimations({ subtree: true })
            .find(
                (animation): animation is CSSAnimation =>
                    animation instanceof CSSAnimation && animation.animationName === 'ui-shimmer',
            );
    }

    it('lays the layer it sweeps under the label, over the fill', async () => {
        const element = await mount('<ui-button>Save</ui-button>');

        expect(getComputedStyle(inner(element)).isolation, 'a context of its own').toBe('isolate');
        expect(getComputedStyle(inner(element), '::after').zIndex, 'under the label').toBe('-1');
    });

    it('sweeps a sheen across the button at the focus, four rounds of the loop', async () => {
        const element = await mount('<ui-button variant="secondary">Cancel</ui-button>');
        element.style.setProperty('--ui-motion-focus-fill', 'shimmer');
        element.style.setProperty('--ui-duration-loop', '10s');

        await userEvent.tab();

        const layer = getComputedStyle(inner(element), '::after');

        expect(layer.backgroundImage).toMatch(
            /^linear-gradient\(100deg, rgba\(0, 0, 0, 0\) 35%, .+ 50%, rgba\(0, 0, 0, 0\) 65%\)$/,
        );
        expect([layer.backgroundSize, layer.backgroundRepeat]).toEqual(['250% 100%', 'no-repeat']);
        expect([layer.animationDuration, layer.animationIterationCount]).toEqual(['10s', '4']);

        // Through a property of its own, which moves rather than jumps: halfway across a round.
        const sweeping = shimmer(element);

        sweeping?.pause();

        if (sweeping !== undefined) {
            sweeping.currentTime = 5000;
        }

        expect(
            getComputedStyle(inner(element), '::after').getPropertyValue('--ui-fx-shimmer'),
        ).toBe('50%');
        expect(getComputedStyle(inner(element), '::after').backgroundPosition).toBe('50% 0px');
    });

    it('draws the sheen in the accent moved off the label, a primary its own and a secondary the text', async () => {
        const element = await mount('<ui-button>Save</ui-button>');
        element.style.setProperty('--ui-motion-focus-fill', 'shimmer');
        element.style.setProperty('--ui-color-accent', 'rgb(0, 0, 255)');
        element.style.setProperty('--ui-color-primary-contrast', 'rgb(255, 255, 255)');

        const sheen = getComputedStyle(inner(element)).getPropertyValue('--ui-fx-sheen');
        const probe = document.createElement('div');
        probe.style.color = sheen;
        document.body.append(probe);

        // A white label's far pole is black: a fifth of it in the blue, at half strength.
        const expected = document.createElement('div');
        expected.style.color =
            'rgb(from color-mix(in oklab, rgb(0, 0, 255), black 20%) r g b / 0.5)';
        document.body.append(expected);

        expect(getComputedStyle(probe).color).toBe(getComputedStyle(expected).color);
    });

    it('sweeps nothing under reduced motion: one round, and no time to take', async () => {
        await cdp().send('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
        });

        try {
            sheet();
            const element = await mount('<ui-button>Save</ui-button>');
            element.style.setProperty('--ui-motion-focus-fill', 'shimmer');

            await userEvent.tab();

            const layer = getComputedStyle(inner(element), '::after');

            expect(Number.parseFloat(layer.animationDuration)).toBeLessThan(0.001);
            expect(layer.animationIterationCount).toBe('1');
        } finally {
            await cdp().send('Emulation.setEmulatedMedia', { features: [] });
        }
    });

    /**
     * A button 100px by 40px, its pointer's lights chosen as `choices` says, with the pointer
     * brought over it at `x`, `y` in its own pixels and a frame let pass, so the engine has handed
     * it where the pointer is.
     */
    async function followed(
        choices: Readonly<Record<string, string>>,
        x: number,
        y: number,
        markup = '<ui-button>Save</ui-button>',
    ): Promise<UiButton> {
        const style = document.createElement('style');
        style.textContent =
            'ui-button::part(button) { box-sizing: border-box; width: 100px; height: 40px; }';
        document.body.append(style);
        const element = await mount(markup);

        for (const [moment, effect] of Object.entries(choices)) {
            element.style.setProperty(`--ui-motion-${moment}`, effect);
        }

        const box = inner(element).getBoundingClientRect();

        inner(element).dispatchEvent(
            new PointerEvent('pointerover', {
                bubbles: true,
                composed: true,
                clientX: box.left + x,
                clientY: box.top + y,
            }),
        );
        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
                resolve();
            });
        });

        return element;
    }

    /** The edge's band, on a layer of its own. */
    function band(element: UiButton): HTMLElement {
        const edge = element.shadowRoot?.querySelector<HTMLElement>('.edge');

        if (edge === null || edge === undefined) {
            throw new Error('the button rendered no band');
        }

        return edge;
    }

    it.each(['hover-fill: spotlight', 'hover-shadow: cast', 'hover-border: edge'])(
        "hands the pointer engine an effect's time where %s, and only while the button can be used",
        async (choice) => {
            const [moment = '', effect = ''] = choice.split(': ');
            const element = await mount('<ui-button>Save</ui-button>');
            const handed = (): string =>
                getComputedStyle(inner(element)).getPropertyValue('--ui-fx-follow');

            expect(handed(), 'nothing chosen').toBe('');

            element.style.setProperty(`--ui-motion-${moment}`, effect);

            expect(handed(), 'chosen').toBe('240ms');

            element.disabled = true;
            await element.updateComplete;

            expect(handed(), 'disabled').toBe('');
        },
    );

    it('lights the layer under the label where the pointer is, a quarter the sheen and 4rem out', async () => {
        const element = await followed({ 'hover-fill': 'spotlight' }, 30, 10);

        expect(getComputedStyle(inner(element), '::after').backgroundImage).toMatch(
            /^radial-gradient\(64px at 30px 10px, .+ \/ 0\.24\), rgba\(0, 0, 0, 0\)\)$/,
        );
    });

    it('casts a shadow away from the pointer, as strong as the pointer is near', async () => {
        const element = await followed({ 'hover-shadow': 'cast' }, 75, 10);

        // Halfway right and halfway up: the shadow falls left and down, and on a light page
        // the light that spills round the pointer's side is none.
        expect(moved(element)[0]).toBe(
            'rgba(0, 0, 0, 0.3) -4px 8px 14px -2px, rgba(0, 0, 0, 0) 6px -6px 24px 2px',
        );
    });

    it("spills the accent round the pointer's side of the button on a dark page", async () => {
        const element = await followed({ 'hover-shadow': 'cast' }, 75, 10);
        element.style.colorScheme = 'dark';
        element.style.setProperty('--ui-color-accent', 'rgb(10, 20, 30)');

        expect(moved(element)[0]).toBe(
            'rgba(0, 0, 0, 0.85) -4px 8px 14px -2px, color(srgb 0.0392157 0.0784314 0.117647 / 0.35) 6px -6px 24px 2px',
        );
    });

    it('lights a band on the edge where the pointer is nearest, as strong as the pointer is near', async () => {
        const element = await followed({ 'hover-border': 'edge' }, 30, 10);
        const style = getComputedStyle(band(element));

        expect(style.opacity).toBe('1');
        expect(style.backgroundImage).toMatch(/^radial-gradient\(100% 100% at 30px 10px, /);
        expect([style.top, style.paddingTop, style.position]).toEqual(['-1px', '2px', 'absolute']);
    });

    it.each([
        ['light', 'calc(l - 0.1)'],
        ['dark', 'calc(l + 0.2)'],
    ])(
        "draws a secondary button's band in the accent moved away from the page, in the %s scheme",
        async (scheme, lightness) => {
            const element = await mount('<ui-button variant="secondary">Cancel</ui-button>');
            element.style.colorScheme = scheme;
            element.style.setProperty('--ui-color-accent', 'rgb(0, 0, 255)');

            const probe = (value: string): string => {
                const painted = document.createElement('div');
                painted.style.colorScheme = scheme;
                painted.style.color = value;
                document.body.append(painted);

                return getComputedStyle(painted).color;
            };

            expect(probe(getComputedStyle(inner(element)).getPropertyValue('--ui-fx-band'))).toBe(
                probe(`oklch(from rgb(0, 0, 255) ${lightness} c h)`),
            );
        },
    );

    it('lets the focus win over the lights, and lights nothing on a button that cannot be used', async () => {
        const element = await followed(
            { 'hover-fill': 'spotlight', 'hover-shadow': 'cast', 'hover-border': 'edge' },
            30,
            10,
        );

        await userEvent.tab();

        expect(getComputedStyle(band(element)).opacity, 'band').toBe('0');
        expect(moved(element)[0], 'cast').toBe('none');
        expect(getComputedStyle(inner(element), '::after').backgroundImage, 'spotlight').toBe(
            'none',
        );
    });

    it.each(['edge', 'none'])(
        "keeps the edge as it rests under the pointer where the pointer's border is %s",
        async (effect) => {
            const element = await still();
            element.style.setProperty('--ui-color-border-button', 'rgb(1, 2, 3)');
            element.style.setProperty('--ui-color-border-button-hover', 'rgb(4, 5, 6)');
            element.style.setProperty('--ui-motion-hover-border', effect);

            await userEvent.hover(inner(element));

            expect(getComputedStyle(inner(element), '::after').borderTopColor).toBe('rgb(1, 2, 3)');
        },
    );

    it("follows the pointer where Glass's taste runs: a light, a shadow and a band", async () => {
        const style = document.createElement('style');
        style.textContent = tokenStyleSheet() + themeStyleSheet(glass);
        document.body.append(style);
        const element = await followed(
            {},
            30,
            10,
            '<ui-button variant="secondary">Cancel</ui-button>',
        );
        element.parentElement?.setAttribute('data-ui-theme', glass.name);

        // The theme's taste reaches the button once its region is Glass's: brought over it again.
        const box = inner(element).getBoundingClientRect();

        inner(element).dispatchEvent(
            new PointerEvent('pointerover', {
                bubbles: true,
                composed: true,
                clientX: box.left + 30,
                clientY: box.top + 10,
            }),
        );
        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
                resolve();
            });
        });

        expect(getComputedStyle(band(element)).opacity, 'band').toBe('1');
        expect(getComputedStyle(inner(element), '::after').backgroundImage, 'spotlight').toMatch(
            /^radial-gradient/,
        );
        expect(moved(element)[0], 'cast').toMatch(/px/);
    });

    it("sweeps the sheen where Glass's taste runs", async () => {
        const style = document.createElement('style');
        style.textContent = tokenStyleSheet() + themeStyleSheet(glass);
        document.body.append(style);
        const element = await mount('<ui-button>Save</ui-button>');
        element.parentElement?.setAttribute('data-ui-theme', glass.name);

        await userEvent.tab();

        expect(shimmer(element)).toBeDefined();
    });

    it("reads Glass's taste off the theme: the light held inside, and a spring", async () => {
        const style = document.createElement('style');
        style.textContent = tokenStyleSheet() + themeStyleSheet(glass);
        document.body.append(style);
        const element = await still('<ui-button variant="secondary">Cancel</ui-button>');
        element.parentElement?.setAttribute('data-ui-theme', glass.name);

        await userEvent.tab();

        expect(moved(element)[0], 'a light inside').toMatch(/ inset$/);
        expect(moved(element)[1], 'no lift').toBe('none');

        await press(inner(element), true);

        expect(moved(element)[2], 'sprung in').toBe('0.9');
    });
});

describe('ui-button stories', () => {
    it.each([
        ['Primary', Primary],
        ['Secondary', Secondary],
        ['Disabled', Disabled],
        ['States', States],
    ] as const)('%s renders a real button and meets the bar', async (name, story) => {
        const container = await mountStory(story, meta, name);

        expect(inner(only(container)).tagName).toBe('BUTTON');
        await expectAccessible(container);
    });

    it('renders the disabled story disabled, so the story shows the state it names', async () => {
        const container = await mountStory(Disabled, meta, 'Disabled');

        expect(inner(only(container)).disabled).toBe(true);
    });
});

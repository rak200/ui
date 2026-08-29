import { afterEach, describe, expect, it } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
// The playwright provider is what puts `send` on `CDPSession` — see `tokens.test.ts`,
// which needs the same line for the same reason.
import type {} from '@vitest/browser-playwright';
import { expectAccessible } from './a11y.js';
import { mountStory } from './stories.js';
import meta, { Disabled, Primary, Secondary, States } from '../stories/button.stories.js';
import '../src/button.js';
import type { UiButton } from '../src/button.js';

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
        element.style.setProperty('--ui-color-accent', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-color-accent-contrast', 'rgb(4, 5, 6)');

        const styles = getComputedStyle(inner(element));

        expect(styles.fontFamily, '--ui-font').toBe('monospace');
        expect(styles.borderRadius, '--ui-radius').toBe('11px');
        expect(styles.paddingTop, '--ui-space').toBe('7px');
        expect(styles.paddingLeft, '--ui-space, doubled across the inline axis').toBe('14px');
        expect(styles.backgroundColor, '--ui-color-accent').toBe('rgb(1, 2, 3)');
        expect(styles.color, '--ui-color-accent-contrast').toBe('rgb(4, 5, 6)');
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
        ['primary', '<ui-button>Save</ui-button>', '--ui-color-accent-hover'],
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
        ['primary', '<ui-button>Save</ui-button>', '--ui-color-accent-pressed'],
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

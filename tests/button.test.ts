import { afterEach, describe, expect, it } from 'vitest';
import { expectAccessible } from './a11y.js';
import { mountStory } from './stories.js';
import meta, { Disabled, Primary, Secondary } from '../stories/button.stories.js';
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

afterEach(() => {
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
        const styles = String(
            (customElements.get('ui-button') as unknown as { styles: unknown }).styles,
        );

        expect(styles).toContain('focus-visible');
        expect(styles).toContain('outline:');
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

describe('canary for RFC 0017 step 5', () => {
    it('fails on purpose, so that npm run test is proven to gate', () => {
        expect(1).toBe(2);
    });
});

import { afterEach, describe, expect, it } from 'vitest';
import { expectAccessible } from './a11y.js';
import '../src/button.js';
import type { RakButton } from '../src/button.js';

/** Mounts a `<rak-button>` and waits for its first render. */
async function mount(html: string): Promise<RakButton> {
    const host = document.createElement('div');
    host.innerHTML = html;
    document.body.append(host);

    const element = host.querySelector('rak-button');

    if (element === null) {
        throw new Error('no rak-button in the fixture');
    }

    await element.updateComplete;

    return element;
}

/** The real `<button>` the component delegates to. */
function inner(element: RakButton): HTMLButtonElement {
    const button = element.shadowRoot?.querySelector('button');

    if (!(button instanceof HTMLButtonElement)) {
        throw new Error('the component rendered no button');
    }

    return button;
}

afterEach(() => {
    document.body.replaceChildren();
});

describe('rak-button', () => {
    it('registers itself as a custom element', () => {
        expect(customElements.get('rak-button')).toBeDefined();
    });

    it('delegates to a real button, so the platform owns the semantics', async () => {
        const element = await mount('<rak-button>Save</rak-button>');

        expect(inner(element).tagName).toBe('BUTTON');
    });

    it('takes its accessible name from the slotted content', async () => {
        const element = await mount('<rak-button>Save</rak-button>');

        expect(element.textContent.trim()).toBe('Save');
    });

    it('is primary until told otherwise', async () => {
        const element = await mount('<rak-button>Save</rak-button>');

        expect(element.variant).toBe('primary');
        expect(inner(element).classList.contains('primary')).toBe(true);
    });

    it('carries the variant onto the inner button', async () => {
        const element = await mount('<rak-button variant="secondary">Cancel</rak-button>');

        expect(element.variant).toBe('secondary');
        expect(inner(element).classList.contains('secondary')).toBe(true);
    });

    it('reflects the variant back to the attribute when set as a property', async () => {
        const element = await mount('<rak-button>Save</rak-button>');
        element.variant = 'secondary';
        await element.updateComplete;

        expect(element.getAttribute('variant')).toBe('secondary');
    });

    it('is enabled until told otherwise', async () => {
        const element = await mount('<rak-button>Save</rak-button>');

        expect(element.disabled).toBe(false);
        expect(inner(element).disabled).toBe(false);
    });

    it('disables the inner button, which is what stops the click', async () => {
        const element = await mount('<rak-button disabled>Save</rak-button>');

        expect(element.disabled).toBe(true);
        expect(inner(element).disabled).toBe(true);
    });

    it('reflects disabled back to the attribute, so CSS can select on it', async () => {
        const element = await mount('<rak-button>Save</rak-button>');
        element.disabled = true;
        await element.updateComplete;

        expect(element.hasAttribute('disabled')).toBe(true);
    });

    it('is reachable by keyboard', async () => {
        const element = await mount('<rak-button>Save</rak-button>');
        inner(element).focus();

        expect(element.shadowRoot?.activeElement).toBe(inner(element));
    });

    it('exposes the inner button as a part, so a host can style it', async () => {
        const element = await mount('<rak-button>Save</rak-button>');

        expect(inner(element).getAttribute('part')).toBe('button');
    });

    it('has no accessibility violations', async () => {
        await expectAccessible('<rak-button>Save</rak-button>');
    });

    it('has no accessibility violations as a secondary button', async () => {
        await expectAccessible('<rak-button variant="secondary">Cancel</rak-button>');
    });

    it('has no accessibility violations while disabled', async () => {
        await expectAccessible('<rak-button disabled>Unavailable</rak-button>');
    });

    it('keeps a visible focus ring — removing it is how a component stops being usable', () => {
        const styles = String(
            (customElements.get('rak-button') as unknown as { styles: unknown }).styles,
        );

        expect(styles).toContain('focus-visible');
        expect(styles).toContain('outline:');
    });
});

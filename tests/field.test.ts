import { afterEach, describe, expect, it } from 'vitest';
import { expectAccessible } from './a11y.js';
import '../src/field.js';
import type { UiField } from '../src/field.js';

/** Mounts a `<ui-field>` and waits for its first render and its first association. */
async function mount(markup: string): Promise<UiField> {
    const host = document.createElement('div');
    host.innerHTML = markup;
    document.body.append(host);

    const element = host.querySelector('ui-field');

    if (element === null) {
        throw new Error('no ui-field in the fixture');
    }

    await element.updateComplete;

    return element;
}

/** The control the field wraps. */
function control(field: UiField): HTMLElement {
    const found = field.querySelector(':scope > :not([slot])');

    if (!(found instanceof HTMLElement)) {
        throw new Error('the fixture has no control');
    }

    return found;
}

/** The light-DOM child filling `name`'s slot, or a failure naming what the fixture lacks. */
function slotted(field: UiField, name: string): HTMLElement {
    const found = field.querySelector(`:scope > [slot='${name}']`);

    if (!(found instanceof HTMLElement)) {
        throw new Error(`the fixture has no ${name}`);
    }

    return found;
}

/**
 * The elements the control's `aria-describedby` actually resolves to.
 *
 * Resolving the reference rather than comparing it to the target's own `id` is the whole
 * point: an assertion that both are `''` passes while describing nothing.
 */
function describers(field: UiField): Element[] {
    const value = control(field).getAttribute('aria-describedby') ?? '';

    return value
        .split(' ')
        .filter((id) => id !== '')
        .map((id) => {
            const found = document.getElementById(id);

            if (found === null) {
                throw new Error(`aria-describedby points at "${id}", which resolves to nothing`);
            }

            return found;
        });
}

/** Lets the MutationObserver deliver, which it does on a microtask. */
async function settled(): Promise<void> {
    await Promise.resolve();
}

afterEach(() => {
    document.body.replaceChildren();
});

describe('ui-field', () => {
    it('registers itself as a custom element', () => {
        expect(customElements.get('ui-field')).toBeDefined();
    });

    it('associates the label with the control, so the platform owns the naming', async () => {
        const field = await mount(`
            <ui-field>
                <label slot="label">Amount</label>
                <input />
            </ui-field>
        `);

        const input = control(field) as HTMLInputElement;

        expect(input.labels?.length).toBe(1);
        expect(input.labels?.[0]?.textContent).toBe('Amount');
    });

    it('gives the control an id when it has none', async () => {
        const field = await mount('<ui-field><input /></ui-field>');

        expect(control(field).id).not.toBe('');
    });

    it('keeps an id the host supplied, which something unseen may already reference', async () => {
        const field = await mount('<ui-field><input id="amount" /></ui-field>');

        expect(control(field).id).toBe('amount');
    });

    it('numbers each field separately, so two on one page do not collide', async () => {
        const first = await mount('<ui-field><input /></ui-field>');
        const second = await mount('<ui-field><input /></ui-field>');

        expect(control(first).id).not.toBe(control(second).id);
    });

    it('leaves a non-label element in the label slot unwired', async () => {
        const field = await mount(`
            <ui-field>
                <span slot="label">Amount</span>
                <input />
            </ui-field>
        `);

        expect((control(field) as HTMLInputElement).labels?.length).toBe(0);
    });

    it('does nothing at all when there is no control to wire', async () => {
        const field = await mount('<ui-field><label slot="label">Amount</label></ui-field>');

        expect(field.querySelector('label')?.getAttribute('for')).toBeNull();
    });

    it('describes the control by its help text', async () => {
        const field = await mount(`
            <ui-field>
                <input />
                <span slot="help">In BRL.</span>
            </ui-field>
        `);

        expect(describers(field)).toEqual([slotted(field, 'help')]);
    });

    it('carries no aria-describedby when nothing describes the control', async () => {
        const field = await mount('<ui-field><input /></ui-field>');

        expect(control(field).hasAttribute('aria-describedby')).toBe(false);
    });

    it('marks the control invalid while the error says something', async () => {
        const field = await mount(`
            <ui-field>
                <input />
                <span slot="error">Amount is required.</span>
            </ui-field>
        `);

        expect(control(field).getAttribute('aria-invalid')).toBe('true');
    });

    it('treats an error rendered empty as no error, which is how a framework renders one', async () => {
        const field = await mount(`
            <ui-field>
                <input />
                <span slot="error"> </span>
            </ui-field>
        `);

        expect(control(field).hasAttribute('aria-invalid')).toBe(false);
        expect(control(field).hasAttribute('aria-describedby')).toBe(false);
    });

    it('ignores help rendered empty the same way', async () => {
        const field = await mount(`
            <ui-field>
                <input />
                <span slot="help"></span>
            </ui-field>
        `);

        expect(control(field).hasAttribute('aria-describedby')).toBe(false);
    });

    it('announces the error before the help, because the problem comes before the format', async () => {
        const field = await mount(`
            <ui-field>
                <input />
                <span slot="help">In BRL.</span>
                <span slot="error">Amount is required.</span>
            </ui-field>
        `);

        expect(describers(field)).toEqual([slotted(field, 'error'), slotted(field, 'help')]);
    });

    it('keeps the help described while in error, since the format is the way out', async () => {
        const field = await mount(`
            <ui-field>
                <input />
                <span slot="help">In BRL.</span>
                <span slot="error">Amount is required.</span>
            </ui-field>
        `);

        expect(describers(field)).toContain(slotted(field, 'help'));
    });

    it('keeps an id the host gave the help text', async () => {
        const field = await mount(`
            <ui-field>
                <input />
                <span slot="help" id="hint">In BRL.</span>
            </ui-field>
        `);

        expect(control(field).getAttribute('aria-describedby')).toBe('hint');
    });

    it('re-associates when the error text changes without the element moving', async () => {
        const field = await mount(`
            <ui-field>
                <input />
                <span slot="error"></span>
            </ui-field>
        `);

        const error = slotted(field, 'error');

        error.textContent = 'Amount is required.';
        await settled();

        expect(control(field).getAttribute('aria-invalid')).toBe('true');
    });

    it('drops aria-describedby once the last describer is gone', async () => {
        const field = await mount(`
            <ui-field>
                <input />
                <span slot="help">In BRL.</span>
            </ui-field>
        `);

        expect(control(field).hasAttribute('aria-describedby')).toBe(true);

        slotted(field, 'help').remove();
        await settled();

        expect(control(field).hasAttribute('aria-describedby')).toBe(false);
    });

    it('re-associates when existing text is rewritten in place', async () => {
        const field = await mount(`
            <ui-field>
                <input />
                <span slot="error"> </span>
            </ui-field>
        `);

        // Assigning textContent to an empty element ADDS a node, which is a childList
        // change. Rewriting an existing text node's data is the characterData case, and
        // it is the one a framework produces when it patches text in place.
        const text = slotted(field, 'error').firstChild;

        if (text === null) {
            throw new Error('the fixture has no text node to rewrite');
        }

        text.nodeValue = 'Amount is required.';
        await settled();

        expect(control(field).getAttribute('aria-invalid')).toBe('true');
    });

    it('re-associates when a slot is filled after the first render', async () => {
        const field = await mount('<ui-field><input /></ui-field>');

        const error = document.createElement('span');
        error.slot = 'error';
        error.textContent = 'Amount is required.';
        field.append(error);
        await settled();

        expect(control(field).getAttribute('aria-invalid')).toBe('true');
    });

    it('re-associates when the text changes below a wrapper, not directly under it', async () => {
        const field = await mount(`
            <ui-field>
                <input />
                <span slot="error"><strong></strong></span>
            </ui-field>
        `);

        const nested = field.querySelector('[slot="error"] strong');

        if (nested === null) {
            throw new Error('no nested element');
        }

        nested.textContent = 'Amount is required.';
        await settled();

        expect(control(field).getAttribute('aria-invalid')).toBe('true');
    });

    it('clears the invalid mark when the error text goes away', async () => {
        const field = await mount(`
            <ui-field>
                <input />
                <span slot="error">Amount is required.</span>
            </ui-field>
        `);

        const error = slotted(field, 'error');

        error.textContent = '';
        await settled();

        expect(control(field).hasAttribute('aria-invalid')).toBe(false);
    });

    it('stops watching once removed from the document', async () => {
        const field = await mount(`
            <ui-field>
                <input />
                <span slot="error"></span>
            </ui-field>
        `);

        const input = control(field);
        const error = slotted(field, 'error');

        field.remove();
        error.textContent = 'Amount is required.';
        await settled();

        expect(input.hasAttribute('aria-invalid')).toBe(false);
    });

    it('exposes the layout as a part, so a host can style it', async () => {
        const field = await mount('<ui-field><input /></ui-field>');

        expect(field.shadowRoot?.querySelector('.stack')?.getAttribute('part')).toBe('stack');
    });

    it('reads its colours from tokens, so a host restyles the error without forking', () => {
        const styles = String(
            (customElements.get('ui-field') as unknown as { styles: unknown }).styles,
        );

        expect(styles).toContain('--ui-color-danger');
        expect(styles).toContain('flex-direction: column');
    });

    it('has no accessibility violations', async () => {
        await expectAccessible(`
            <ui-field>
                <label slot="label">Amount</label>
                <input type="number" />
                <span slot="help">In BRL, two decimals.</span>
            </ui-field>
        `);
    });

    it('has no accessibility violations while in error', async () => {
        await expectAccessible(`
            <ui-field>
                <label slot="label">Amount</label>
                <input type="number" />
                <span slot="help">In BRL, two decimals.</span>
                <span slot="error">Amount is required.</span>
            </ui-field>
        `);
    });
});

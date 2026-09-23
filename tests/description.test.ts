import { afterEach, describe, expect, it } from 'vitest';
import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { Description } from '../src/description.js';

/**
 * The smallest host the carrier needs: something that renders and can be asked to redraw.
 *
 * Written here rather than reaching for `<ui-button>` or `<ui-menu>` for the reason
 * `tooltip.test.ts` gives about its own fixtures — this file grades the carrier, and a test
 * built out of a component grades that component's wiring as well, so a failure would not
 * say which of the two moved.
 */
class Host extends LitElement {
    readonly description = new Description(this);

    /** How many times the carrier asked for a redraw, which is the whole of its reactivity. */
    redraws = 0;

    override requestUpdate(): void {
        this.redraws += 1;
        super.requestUpdate();
    }

    override render(): TemplateResult {
        return html`<button aria-describedby=${this.description.reference()}>Save</button>
            ${this.description.carrier()}`;
    }
}

customElements.define('test-described', Host);

/** Mounts one and waits for its first render. */
async function mount(): Promise<Host> {
    const element = document.createElement('test-described') as Host;
    document.body.append(element);
    await element.updateComplete;
    element.redraws = 0;

    return element;
}

/** Dispatches the handoff the way `<ui-tooltip>` does, and reports whether it was taken. */
function hand(element: Host, detail: unknown): boolean {
    return !element.dispatchEvent(new CustomEvent('ui-describe', { detail, cancelable: true }));
}

const control = (element: Host): HTMLElement => {
    const found = element.shadowRoot?.querySelector('button');

    if (found === null || found === undefined) {
        throw new Error('the host rendered no control');
    }

    return found;
};

afterEach(() => {
    document.body.replaceChildren();
});

describe('Description', () => {
    it('describes nothing until a sentence arrives', async () => {
        const element = await mount();

        expect(element.description.reference()).toBe(nothing);
        expect(element.description.carrier()).toBe(nothing);
        expect(control(element).hasAttribute('aria-describedby'), 'absent, not empty').toBe(false);
    });

    it('takes a sentence and asks the host to redraw', async () => {
        const element = await mount();

        expect(hand(element, 'Saves without closing the dialog.'), 'taken').toBe(true);
        expect(element.redraws, 'one redraw asked for').toBe(1);

        await element.updateComplete;

        expect(control(element).getAttribute('aria-describedby')).toBe('description');
        expect(element.shadowRoot?.getElementById('description')?.textContent).toBe(
            'Saves without closing the dialog.',
        );
    });

    it('lets the empty sentence mean absent rather than empty', async () => {
        const element = await mount();

        hand(element, 'Saves.');
        await element.updateComplete;

        expect(hand(element, ''), 'the withdrawal is taken too').toBe(true);
        await element.updateComplete;

        expect(control(element).hasAttribute('aria-describedby')).toBe(false);
        expect(element.shadowRoot?.getElementById('description')).toBeNull();
    });

    it('leaves a payload that is not a sentence unclaimed, and redraws nothing', async () => {
        // Unclaimed rather than accepted and ignored: the dispatch's return value is the
        // whole of the advertisement, so a malformed handoff has to read as a refusal.
        const element = await mount();

        expect(hand(element, 42)).toBe(false);
        expect(hand(element, undefined)).toBe(false);
        expect(element.dispatchEvent(new Event('ui-describe', { cancelable: true }))).toBe(true);

        expect(element.redraws).toBe(0);
    });

    it('points a control built by hand at the carrier, and stops pointing it', async () => {
        // `<ui-menu>` builds its trigger with `document.createElement`, so it writes the
        // reference rather than binding it — the same rule, in the other shape.
        const element = await mount();
        const byHand = document.createElement('button');

        element.description.point(byHand);

        expect(byHand.hasAttribute('aria-describedby'), 'nothing to point at yet').toBe(false);

        hand(element, 'Saves.');
        element.description.point(byHand);

        expect(byHand.getAttribute('aria-describedby')).toBe('description');

        hand(element, '');
        element.description.point(byHand);

        expect(byHand.hasAttribute('aria-describedby'), 'unpointed, not emptied').toBe(false);
    });

    it('keeps the carrier out of the paint, and in the tree', async () => {
        // The sentence is already on screen, in the tip. Drawing it again would show it
        // twice — and taking it out of the tree is the thing it exists to be in.
        const element = await mount();

        hand(element, 'Saves without closing the dialog, which is a long sentence.');
        await element.updateComplete;

        const carrier = element.shadowRoot?.getElementById('description') ?? null;

        if (carrier === null) {
            throw new Error('the carrier was not rendered');
        }

        const box = carrier.getBoundingClientRect();

        expect(carrier.isConnected).toBe(true);
        expect(getComputedStyle(carrier).display, 'in the tree, not display:none').not.toBe('none');
        expect(box.width, 'out of flow and one column wide').toBeLessThanOrEqual(1);
        expect(box.height, 'one row tall').toBeLessThanOrEqual(1);
    });

    it('paints nowhere, which the box being small does not say on its own', async () => {
        // A 1x1 box still paints a sliver of the first glyph, and still answers a hit test.
        // `clip-path: inset(50%)` is the declaration that removes both, and it is the one
        // the three sizes above cannot speak for.
        const element = await mount();

        hand(element, 'Saves without closing the dialog.');
        await element.updateComplete;

        const carrier = element.shadowRoot?.getElementById('description') ?? null;

        if (carrier === null) {
            throw new Error('the carrier was not rendered');
        }

        const box = carrier.getBoundingClientRect();
        const at = element.shadowRoot?.elementFromPoint(box.x, box.y);

        expect(at, 'nothing of it is there to be hit').not.toBe(carrier);
    });

    it('carries no part, so a host cannot unclip it into view', async () => {
        const element = await mount();

        hand(element, 'Saves.');
        await element.updateComplete;

        expect(element.shadowRoot?.getElementById('description')?.hasAttribute('part')).toBe(false);
    });
});

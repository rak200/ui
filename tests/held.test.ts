import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { held } from '../src/held.js';

/**
 * A surface of the test's own: a host that marks itself by `held()`, holding what `markup` writes,
 * after a button outside it that the focus starts from.
 */
function surface(markup: string): HTMLElement {
    const before = document.createElement('button');
    before.textContent = 'Before';

    const host = document.createElement('div');
    host.innerHTML = markup;
    host.addEventListener('focusin', held);
    host.addEventListener('focusout', held);

    const after = document.createElement('button');
    after.textContent = 'After';

    document.body.append(before, host, after);
    before.focus();

    return host;
}

/** Whether the surface carries the mark its sheet draws a focus from. */
function marked(host: HTMLElement): boolean {
    return host.hasAttribute('data-focus-visible');
}

afterEach(() => {
    document.body.replaceChildren();
});

describe('a focus a surface holds', () => {
    it('marks the surface while a focus the reader can see is on something it holds', async () => {
        const host = surface('<button>Inside</button>');

        await userEvent.tab();

        expect(marked(host)).toBe(true);
    });

    it('takes the mark off as the focus leaves the surface', async () => {
        const host = surface('<button>Inside</button>');

        await userEvent.tab();
        await userEvent.tab();

        expect(marked(host)).toBe(false);
    });

    it('keeps the mark as the focus moves from one thing the surface holds to another', async () => {
        const host = surface('<button>One</button><button>Two</button>');

        await userEvent.tab();
        await userEvent.tab();

        expect(marked(host)).toBe(true);
    });

    it('leaves a surface unmarked where a click left the focus, which the reader does not see', async () => {
        const host = surface('<button>Inside</button>');
        const inside = host.querySelector('button');

        if (inside === null) {
            throw new Error('the surface holds no button');
        }

        await userEvent.click(inside);

        expect(document.activeElement, 'focused').toBe(inside);
        expect(marked(host), 'unmarked').toBe(false);
    });

    it("reads a control inside another component it holds, off the arrival's composed path", async () => {
        const host = surface('<div></div>');
        const component = host.querySelector('div');
        const root = component?.attachShadow({ mode: 'open' });

        if (root === undefined) {
            throw new Error('the surface holds no component');
        }

        root.innerHTML = '<button>Inside its root</button>';

        await userEvent.tab();

        expect(marked(host)).toBe(true);
    });
});

import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { held, released } from '../src/held.js';

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
    host.addEventListener('focusout', released);

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

/**
 * Every change to the surface's mark while `act` runs, each one it was taken off or put on along
 * the way, where reading the mark once it is done sees only where it ended.
 */
async function changes(host: HTMLElement, act: () => Promise<void>): Promise<string[]> {
    const records: MutationRecord[] = [];
    const observer = new MutationObserver((delivered) => {
        records.push(...delivered);
    });

    observer.observe(host, { attributeFilter: ['data-focus-visible'], attributeOldValue: true });
    await act();
    records.push(...observer.takeRecords());
    observer.disconnect();

    return records.map((record) => (record.oldValue === null ? 'put on' : 'taken off'));
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

    it('takes the mark off as the focus leaves for nowhere, as it does when the page loses it', async () => {
        const host = surface('<button>Inside</button>');

        await userEvent.tab();
        host.querySelector('button')?.blur();

        expect(document.activeElement, 'gone').toBe(document.body);
        expect(marked(host), 'unmarked').toBe(false);
    });

    it('leaves the mark on as the focus moves from one thing the surface holds to another', async () => {
        const host = surface('<button>One</button><button>Two</button>');

        await userEvent.tab();

        // Taken off and put back, the mark started the surface's answer over.
        expect(await changes(host, () => userEvent.tab()), 'untouched').toEqual([]);
        expect(document.activeElement?.textContent, 'moved').toBe('Two');
        expect(marked(host), 'marked').toBe(true);
    });

    it('leaves the mark on as the focus moves from a control inside one component it holds to one inside another', async () => {
        const host = surface('<div></div><div></div>');

        for (const component of host.querySelectorAll('div')) {
            component.attachShadow({ mode: 'open' }).innerHTML = '<button>Inside its root</button>';
        }

        await userEvent.tab();

        expect(await changes(host, () => userEvent.tab()), 'untouched').toEqual([]);
        expect(document.activeElement, 'moved').toBe(host.lastElementChild);
        expect(marked(host), 'marked').toBe(true);
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

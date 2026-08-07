import { afterEach, describe, expect, it } from 'vitest';
import type { ImpactValue, Result } from 'axe-core';
import { blockingViolations, expectAccessible, findViolations } from './a11y.js';

/**
 * A deliberately broken element: a shadow-root button carrying no accessible name.
 *
 * The canary issue #11 asks for, and a permanent test rather than a one-off manual check —
 * a gate that has never failed has never been tested, and one that quietly stops failing
 * later is the same broken gate, found too late. The break sits inside a shadow root on
 * purpose: a check that does not traverse into one passes everything this library ships.
 */
class BrokenCanary extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML = '<button></button>';
    }
}

customElements.define('a11y-broken-canary', BrokenCanary);

/** An axe result with only the fields the impact filter reads carrying real values. */
function violation(id: string, impact: ImpactValue): Result {
    return {
        id,
        impact,
        description: id,
        help: id,
        helpUrl: `https://dequeuniversity.com/rules/axe/${id}`,
        tags: [],
        nodes: [],
    };
}

afterEach(() => {
    document.body.replaceChildren();
});

describe('blockingViolations', () => {
    it('blocks on serious and critical', () => {
        const blocking = blockingViolations([
            violation('serious-one', 'serious'),
            violation('critical-one', 'critical'),
        ]);

        expect(blocking.map((found) => found.id)).toEqual(['serious-one', 'critical-one']);
    });

    it('lets minor and moderate through', () => {
        const blocking = blockingViolations([
            violation('minor-one', 'minor'),
            violation('moderate-one', 'moderate'),
        ]);

        expect(blocking).toEqual([]);
    });

    it('blocks on an impact axe did not grade, rather than assuming it is harmless', () => {
        const blocking = blockingViolations([violation('ungraded', null)]);

        expect(blocking.map((found) => found.id)).toEqual(['ungraded']);
    });

    it('keeps the graded and drops the tolerated from the same batch', () => {
        const blocking = blockingViolations([
            violation('moderate-one', 'moderate'),
            violation('serious-one', 'serious'),
            violation('minor-one', 'minor'),
        ]);

        expect(blocking.map((found) => found.id)).toEqual(['serious-one']);
    });
});

describe('findViolations', () => {
    it('reports nothing for markup with nothing wrong with it', async () => {
        expect(await findViolations('<button>Save</button>')).toEqual([]);
    });

    it('restricts itself to the WCAG A/AA ruleset, not axe best practices', async () => {
        // `region` — content outside a landmark — is best-practice and fires on every
        // fragment mounted on its own. Its absence is what makes the helper usable at all.
        const reported = await findViolations('<p>Loose content</p>');

        expect(reported.map((found) => found.id)).not.toContain('region');
    });
});

describe('expectAccessible', () => {
    it('passes markup with nothing wrong with it', async () => {
        await expectAccessible('<button>Save</button>');
    });

    it('fails a control with no accessible name', async () => {
        await expect(expectAccessible('<button></button>')).rejects.toThrow(/button-name/);
    });

    it('sees a violation inside a shadow root', async () => {
        await expect(expectAccessible('<a11y-broken-canary></a11y-broken-canary>')).rejects.toThrow(
            /button-name/,
        );
    });

    it('names the offending markup, so the failure is actionable', async () => {
        await expect(expectAccessible('<button aria-label=" "></button>')).rejects.toThrow(
            /aria-label=" "/,
        );
    });

    it('removes its fixture even when it fails', async () => {
        await expect(expectAccessible('<button></button>')).rejects.toThrow();

        expect(document.body.querySelector('button')).toBeNull();
    });

    it('removes its fixture when it passes', async () => {
        await expectAccessible('<button>Save</button>');

        expect(document.body.querySelector('button')).toBeNull();
    });
});

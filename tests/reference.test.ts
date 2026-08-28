import { describe, expect, it } from 'vitest';
import { css } from 'lit';
import { reference } from '../src/reference.js';
import { defaults, derivedTokens, formulas, tokens } from '../src/tokens.js';

describe('reference', () => {
    it('writes a ground token as the property with its default behind it', () => {
        expect(String(reference('--ui-radius'))).toBe('var(--ui-radius, 0.375rem)');
    });

    it('writes a derived token as the property with its formula behind it', () => {
        // The placement RFC 0002 item 1 settled, in one line: the formula is the fallback,
        // so it resolves here rather than at `:root`, against the grounds in force here.
        // The ground inside it carries its own default, which `src/tokens.ts` says why.
        expect(String(reference('--ui-duration-state'))).toBe(
            'var(--ui-duration-state, var(--ui-duration-100, 150ms))',
        );
    });

    it('never falls through to undefined, whichever half a name comes from', () => {
        // The failure this catches is a name in one array and a value in neither map —
        // which the compiler cannot see through the union and which emits a `var()` the
        // browser silently discards.
        for (const name of [...tokens, ...derivedTokens]) {
            expect(String(reference(name)), name).not.toContain('undefined');
        }
    });

    it('takes a ground token straight from the defaults', () => {
        for (const token of tokens) {
            expect(String(reference(token)), token).toBe(`var(${token}, ${defaults[token]})`);
        }
    });

    it('takes a derived token straight from the formulas', () => {
        for (const token of derivedTokens) {
            expect(String(reference(token)), token).toBe(`var(${token}, ${formulas[token]})`);
        }
    });

    it('resolves on a page that has declared no token at all', () => {
        // The promise the package already makes, and the one the grounding above keeps:
        // nothing breaks without the sheet, and nothing goes dark without it either. This
        // page inserts none, which is what makes the assertion mean anything.
        const probe = document.createElement('div');
        probe.style.setProperty('background-color', String(reference('--ui-color-accent-hover')));
        probe.style.setProperty('transition-duration', String(reference('--ui-duration-state')));
        document.body.append(probe);

        try {
            expect(getComputedStyle(probe).backgroundColor, 'hover').not.toBe('rgba(0, 0, 0, 0)');
            expect(getComputedStyle(probe).transitionDuration, 'duration').toBe('0.15s');
        } finally {
            probe.remove();
        }
    });

    it('is a CSSResult, which is the whole reason this module imports Lit', () => {
        // A plain string interpolated into `css` throws — Lit refuses anything it did not
        // produce. `unsafeCSS` is what makes the reference usable at all, and it is safe
        // in the only sense that matters: its argument is this package's own literal.
        const styles = String(css`
            button {
                color: ${reference('--ui-color-text')};
            }
        `);

        expect(styles).toContain('color: var(--ui-color-text, #1f2937);');
    });

    it('produces CSS the browser accepts, formula and all', () => {
        for (const token of [...tokens, ...derivedTokens].filter((name) =>
            name.startsWith('--ui-color-'),
        )) {
            expect(CSS.supports('color', String(reference(token))), token).toBe(true);
        }
    });
});

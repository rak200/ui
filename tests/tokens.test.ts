import { afterEach, describe, expect, it } from 'vitest';
import { expectAccessible } from './a11y.js';
import { contrastRatio } from './contrast.js';
import { mountStory } from './stories.js';
import meta, { Defaults } from '../stories/tokens.stories.js';
import { defaults, tokens, tokenStyleSheet, type Token } from '../src/tokens.js';
import { UiButton } from '../src/button.js';
import { UiField } from '../src/field.js';

afterEach(() => {
    document.body.replaceChildren();
});

describe('tokens', () => {
    it('gives every declared token a default', () => {
        for (const token of tokens) {
            expect(defaults[token], token).toMatch(/\S/);
        }
    });

    it('names every token under the --ui- prefix', () => {
        for (const token of tokens) {
            expect(token.startsWith('--ui-'), token).toBe(true);
        }
    });

    it('declares no token twice', () => {
        expect(new Set(tokens).size).toBe(tokens.length);
    });
});

describe('tokenStyleSheet', () => {
    it('emits a :root block holding every token and its default', () => {
        const sheet = tokenStyleSheet();

        expect(sheet.startsWith(':root {')).toBe(true);
        expect(sheet.endsWith('}')).toBe(true);

        for (const token of tokens) {
            expect(sheet).toContain(`  ${token}: ${defaults[token]};`);
        }
    });

    it('emits one declaration per line, and nothing else', () => {
        const lines = tokenStyleSheet().split('\n');

        expect(lines.length).toBe(tokens.length + 2);
    });

    it('parses as CSS the browser actually applies', () => {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(tokenStyleSheet());

        expect(sheet.cssRules.length).toBe(1);
    });
});

/**
 * Every `var(--ui-*, fallback)` a component writes carries a copy of a default, and until
 * now nothing compared the copies.
 *
 * They all agreed, which is why the duplication looked harmless — it is unchecked rather
 * than broken, and it grows with the component count. A fallback only shows when the
 * `:root` block is absent, so the first one to disagree does so invisibly. This PR is the
 * case in point: one value changed, in two files.
 */
describe('the fallbacks components write', () => {
    /** A `var(--ui-name, fallback)` reference, with the fallback allowed its own commas. */
    const reference = /var\((--ui-[a-z-]+),\s*([^)]+)\)/g;

    const isToken = (name: string): name is Token => (tokens as readonly string[]).includes(name);

    const written = [UiButton.styles, UiField.styles].flatMap((styles) =>
        [...String(styles).matchAll(reference)].map((match) => ({
            name: match[1] ?? '',
            fallback: match[2] ?? '',
        })),
    );

    it('finds them at all, so a passing suite is not an empty loop', () => {
        expect(written.length).toBeGreaterThan(0);
    });

    it('names only tokens that exist', () => {
        for (const { name } of written) {
            expect(isToken(name), name).toBe(true);
        }
    });

    it('repeats the default exactly, because a fallback that drifts drifts silently', () => {
        for (const { name, fallback } of written) {
            if (isToken(name)) {
                expect(fallback, name).toBe(defaults[name]);
            }
        }
    });
});

/**
 * The floors the values themselves have to clear, before any component paints them.
 *
 * Two of these axe already enforces wherever a story renders the pair; the focus ring is
 * the one it cannot, and the one that was wrong.
 */
describe('the contrast floors', () => {
    it('is a real ratio, checked against the two colours everyone knows', () => {
        expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
        expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    });

    it('refuses a value it cannot measure, rather than returning a number anyway', () => {
        expect(() => contrastRatio(defaults['--ui-font'], '#ffffff')).toThrow(/hex colour/);
    });

    it('keeps the focus ring at 3:1 against the surface — WCAG 1.4.11, which axe cannot see', () => {
        // `outline-offset` shows the surface on both sides of the ring, so the surface is
        // what the ring is adjacent to. This is the assertion the shipped `#f59e0b` failed.
        const ratio = contrastRatio(defaults['--ui-color-focus'], defaults['--ui-color-surface']);

        expect(ratio).toBeGreaterThanOrEqual(3);
    });

    it('keeps body text at 4.5:1 against the surface', () => {
        expect(
            contrastRatio(defaults['--ui-color-text'], defaults['--ui-color-surface']),
        ).toBeGreaterThanOrEqual(4.5);
    });

    it('keeps error text at 4.5:1 against the surface', () => {
        expect(
            contrastRatio(defaults['--ui-color-danger'], defaults['--ui-color-surface']),
        ).toBeGreaterThanOrEqual(4.5);
    });

    it('keeps a primary button legible, which is its own pair rather than the surface', () => {
        expect(
            contrastRatio(defaults['--ui-color-accent-contrast'], defaults['--ui-color-accent']),
        ).toBeGreaterThanOrEqual(4.5);
    });
});

/**
 * The playground's gate. A story that stops compiling or stops rendering fails here rather
 * than on the deploy, which runs after the required check.
 */
describe('token stories', () => {
    it('shows every declared token, so the page cannot fall behind the set', async () => {
        const container = await mountStory(Defaults, meta, 'Defaults');

        for (const token of tokens) {
            expect(container.textContent, token).toContain(token);
        }
    });

    it('meets the bar, which a table of swatches is not exempt from', async () => {
        await expectAccessible(await mountStory(Defaults, meta, 'Defaults'));
    });
});

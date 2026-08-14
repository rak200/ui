import { afterEach, describe, expect, it } from 'vitest';
import { expectAccessible } from './a11y.js';
import { mountStory } from './stories.js';
import meta, { Defaults } from '../stories/tokens.stories.js';
import { defaults, tokens, tokenStyleSheet } from '../src/tokens.js';

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

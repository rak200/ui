import { describe, expect, it } from 'vitest';
import { defaults, tokens, tokenStyleSheet } from '../src/tokens.js';

describe('tokens', () => {
    it('gives every declared token a default', () => {
        for (const token of tokens) {
            expect(defaults[token], token).toMatch(/\S/);
        }
    });

    it('names every token under the --rak- prefix', () => {
        for (const token of tokens) {
            expect(token.startsWith('--rak-'), token).toBe(true);
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

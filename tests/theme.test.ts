import { afterEach, describe, expect, it } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
// The playwright provider is what puts `send` on `CDPSession` — see `tokens.test.ts`, which
// needs the same line for the same reason.
import type {} from '@vitest/browser-playwright';
import { expectAccessible } from './a11y.js';
import { mountStory } from './stories.js';
import meta, { Matrix } from '../stories/theme.stories.js';
import { Defaults } from '../stories/tokens.stories.js';
import tokensMeta from '../stories/tokens.stories.js';
import { matrix, themeStyleSheet, type Theme } from '../src/theme.js';
import '../src/button.js';
import '../src/checkbox.js';
import { reference } from '../src/reference.js';
import {
    derivedTokens,
    moreContrast,
    tokens,
    tokenStyleSheet,
    type DerivedToken,
    type Token,
} from '../src/tokens.js';

afterEach(async () => {
    document.body.replaceChildren();
    delete document.documentElement.dataset['uiTheme'];
    await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

/** A small theme, written here so the emitter is graded on a shape it was not built from. */
const sample: Theme = {
    name: 'sample',
    values: {
        '--ui-color-surface': '#fafafa',
        '--ui-radius': '2px',
        '--ui-color-hover': '#eeeeee',
    },
    dark: { '--ui-color-surface': '#101010' },
    more: { '--ui-color-text': ['#000000', '#ffffff'] },
};

/** A theme's sheet as the browser parses it. */
function parsed(theme: Theme): CSSStyleSheet {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(themeStyleSheet(theme));

    return sheet;
}

/** What one rule declares, browser-parsed, in order. */
function declarations(rule: CSSRule | undefined): Map<string, string> {
    if (!(rule instanceof CSSStyleRule)) {
        throw new Error(`expected a style rule, found ${rule?.constructor.name ?? 'nothing'}`);
    }

    const found = new Map<string, string>();

    for (let index = 0; index < rule.style.length; index += 1) {
        const name = rule.style.item(index);

        found.set(name, rule.style.getPropertyValue(name).trim());
    }

    return found;
}

/** The answer to more contrast a theme's sheet carries after its block. */
function answer(theme: Theme): Map<string, string> {
    const rule = parsed(theme).cssRules[1];

    if (!(rule instanceof CSSMediaRule)) {
        throw new Error('the theme sheet carries no answer to more contrast');
    }

    expect(rule.conditionText).toBe('(prefers-contrast: more)');

    return declarations(rule.cssRules[0]);
}

/** A colour, as six-digit sRGB hex, resolved by a one-pixel canvas — `tokens.test.ts`'s. */
function sRGB(colour: string): string {
    const context = document.createElement('canvas').getContext('2d');

    if (context === null) {
        throw new Error('no 2d context, so no colour can be resolved');
    }

    context.fillStyle = colour;
    context.fillRect(0, 0, 1, 1);

    const pixel = context.getImageData(0, 0, 1, 1).data;

    return `#${[0, 1, 2].map((offset) => (pixel[offset] ?? 0).toString(16).padStart(2, '0')).join('')}`;
}

/** A token as a component writes it, under `theme` in `scheme`, with both sheets in force. */
function painted(token: Token | DerivedToken, theme: Theme, scheme: 'light' | 'dark'): string {
    const style = document.createElement('style');
    style.textContent = tokenStyleSheet() + themeStyleSheet(theme);

    const host = document.createElement('div');
    host.dataset['uiTheme'] = theme.name;
    host.style.colorScheme = scheme;

    const probe = document.createElement('div');
    probe.style.backgroundColor = String(reference(token));
    host.append(probe);
    document.body.append(style, host);

    try {
        return sRGB(getComputedStyle(probe).backgroundColor);
    } finally {
        style.remove();
        host.remove();
    }
}

describe('themeStyleSheet', () => {
    it("puts a theme's values under the attribute that selects it, and nothing else", () => {
        const rule = parsed(sample).cssRules[0];

        expect(rule instanceof CSSStyleRule ? rule.selectorText : '').toBe(
            '[data-ui-theme="sample"]',
        );
        expect([...declarations(rule).keys()]).toEqual(Object.keys(sample.values));
    });

    it('pairs a value with its dark one, and only where the theme gives one', () => {
        const values = declarations(parsed(sample).cssRules[0]);

        expect(values.get('--ui-color-surface')).toBe('light-dark(#fafafa, #101010)');
        expect(values.get('--ui-radius')).toBe('2px');
    });

    it("answers more contrast with the theme's own answer first", () => {
        expect(answer(sample).get('--ui-color-text')).toBe('light-dark(#000000, #ffffff)');
    });

    it('hands back to their formulas the states the default answer writes and the theme leaves out', () => {
        // The default palette's answer declares its states at :root, and a value there
        // reaches under every theme — so a theme that does not answer them would be painted
        // in the default palette's greys over its own grounds.
        const resets = [...answer(sample)].filter(([, value]) => value === 'initial');
        const written = derivedTokens.filter((name) => name in moreContrast);

        expect(resets.map(([name]) => name)).toEqual(
            written.filter((name) => name !== '--ui-color-hover'),
        );
    });

    it('resets no state the theme sets itself, which wins on its own element', () => {
        expect(answer(sample).has('--ui-color-hover')).toBe(false);
    });

    it('resets no ground, which a theme either declares or rightly inherits', () => {
        const grounds: readonly string[] = tokens;
        const reset = [...answer(matrix)]
            .filter(([, value]) => value === 'initial')
            .map(([name]) => name);

        expect(reset.length, 'it does reset something').toBeGreaterThan(0);
        expect(reset.filter((name) => grounds.includes(name))).toEqual([]);
    });

    it('answers more contrast for a theme that wrote no answer, with the resets alone', () => {
        // A host's own theme handed to the function usually carries no `more` map, and it is
        // the theme that most needs the resets: nothing of its own would cover the greys.
        const bare: Theme = { name: 'bare', values: { '--ui-color-surface': '#fafafa' } };
        const written = derivedTokens.filter((name) => name in moreContrast);

        expect([...answer(bare)]).toEqual(written.map((name) => [name, 'initial']));
    });

    it('emits one declaration per line, because a host reads this output as well as parses it', () => {
        // The browser is indifferent to newlines, so every assertion above passes with each
        // block on one line; a host pasting it into a page reads it there. `tokens.test.ts`
        // holds the token sheet to the same.
        const lines = themeStyleSheet(sample).split('\n');

        for (const line of lines) {
            expect(line.split(';').length, line).toBeLessThanOrEqual(2);
        }

        // The block: its selector, one line per value, its brace; a blank line; the media
        // rule, the selector again, one line per answer, and the two closing braces.
        expect(lines).toHaveLength(
            Object.keys(sample.values).length + 2 + 1 + [...answer(sample)].length + 4,
        );
        expect(lines[Object.keys(sample.values).length + 2], 'the blank line between').toBe('');
    });

    it('emits the two rules the browser applies, and only those', () => {
        expect(parsed(matrix).cssRules).toHaveLength(2);
    });
});

describe('a theme, as the browser renders it', () => {
    it.each([
        ['light', '#ffffff', '#003b00'],
        ['dark', '#050505', '#00ff00'],
    ] as const)('puts its grounds in force under the attribute, in %s', (scheme, surface, text) => {
        expect(painted('--ui-color-surface', matrix, scheme)).toBe(surface);
        expect(painted('--ui-color-text', matrix, scheme)).toBe(text);
    });

    it('takes its face, its corner and its glow from its own values', () => {
        const style = document.createElement('style');
        style.textContent = tokenStyleSheet() + themeStyleSheet(matrix);

        const host = document.createElement('div');
        host.dataset['uiTheme'] = matrix.name;

        const probe = document.createElement('div');
        probe.style.fontFamily = String(reference('--ui-font'));
        probe.style.borderRadius = String(reference('--ui-radius'));
        probe.style.boxShadow = String(reference('--ui-elevation-raised'));
        host.append(probe);
        document.body.append(style, host);

        const glow = (scheme: 'light' | 'dark'): string => {
            host.style.colorScheme = scheme;

            return getComputedStyle(probe).boxShadow;
        };

        expect(getComputedStyle(probe).fontFamily).toContain('Courier New');
        expect(getComputedStyle(probe).borderRadius).toBe('8px');
        // The raised surfaces read the elevation step, and Matrix makes it a glow whose
        // colour follows the scheme: its middle green on white, its bright one on black.
        expect(glow('light'), 'light').toContain('rgba(0, 143, 17');
        expect(glow('dark'), 'dark').toContain('rgba(0, 255, 0');
    });

    it.each([
        // Its accent at the raised surfaces' strengths, the ring 0.54 and the glow 0.45 on
        // white and the other way round on black; an invalid control in the danger.
        ['light', '', '0 0.560784 0.0666667', '0.54', '0.45'],
        ['dark', '', '0 1 0', '0.45', '0.54'],
        ['light', 'Accept the terms.', '0.72549 0.109804 0.109804', '0.54', '0.45'],
        ['dark', 'Accept the terms.', '0.972549 0.443137 0.443137', '0.45', '0.54'],
    ] as const)(
        'lights a control in its own colour, in %s with the error %j',
        async (scheme, error, colour, ring, spread) => {
            const style = document.createElement('style');
            style.textContent = tokenStyleSheet() + themeStyleSheet(matrix);

            const host = document.createElement('div');
            host.dataset['uiTheme'] = matrix.name;
            host.style.colorScheme = scheme;
            host.innerHTML = `<ui-checkbox label="Terms" error="${error}"></ui-checkbox>`;
            document.body.append(style, host);

            const element = host.querySelector('ui-checkbox');
            await element?.updateComplete;
            const box = element?.renderRoot.querySelector('input');

            if (box === null || box === undefined) {
                throw new Error('the checkbox rendered no control');
            }

            expect(getComputedStyle(box).boxShadow).toBe(
                `color(srgb ${colour} / ${ring}) 0px 0px 0px 1px, color(srgb ${colour} / ${spread}) 0px 0px 18px 0px`,
            );
        },
    );

    it.each([
        // The ring goes solid and the glow doubles: 0.45 to 0.9 on white, and 0.54 to solid
        // on black, where doubling stops.
        [
            'light',
            'rgb(0, 143, 17) 0px 0px 0px 1px, color(srgb 0 0.560784 0.0666667 / 0.9) 0px 0px 18px 0px',
        ],
        ['dark', 'rgb(0, 255, 0) 0px 0px 0px 1px, rgb(0, 255, 0) 0px 0px 18px 0px'],
    ] as const)('lights a button brighter under the pointer, in %s', async (scheme, lit) => {
        const style = document.createElement('style');
        style.textContent = tokenStyleSheet() + themeStyleSheet(matrix);

        const host = document.createElement('div');
        host.dataset['uiTheme'] = matrix.name;
        host.style.colorScheme = scheme;
        host.innerHTML = '<ui-button>Save</ui-button>';
        document.body.append(style, host);

        const element = host.querySelector('ui-button');
        await element?.updateComplete;
        const button = element?.renderRoot.querySelector('button');

        if (button === null || button === undefined) {
            throw new Error('the button rendered no control');
        }

        await userEvent.hover(button);

        expect(getComputedStyle(button, '::before').boxShadow).toBe(lit);
    });

    it("derives its accent's label from its own accent", () => {
        // Black on Matrix's green in both schemes: the label is the accent's pole, and both
        // greens are past the crossover.
        expect(painted('--ui-color-accent-contrast', matrix, 'light')).toBe('#000000');
        expect(painted('--ui-color-accent-contrast', matrix, 'dark')).toBe('#000000');
    });

    it('takes back the formula for a state it leaves out, when the reader asks for more contrast', async () => {
        await cdp().send('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-contrast', value: 'more' }],
        });

        // The default answer writes the accent's hover as a grey, `#333333`; under Matrix the
        // reset hands it back to the formula, which shades Matrix's own green.
        const hover = painted('--ui-color-accent-hover', matrix, 'light');

        expect(hover).not.toBe(moreContrast['--ui-color-accent-hover']?.[0]);

        const [red, green] = [1, 3].map((offset) =>
            Number.parseInt(hover.slice(offset, offset + 2), 16),
        );

        expect(green, 'still green').toBeGreaterThan(red ?? 0);
    });
});

describe('matrix', () => {
    it('names only tokens that exist', () => {
        const named: readonly string[] = [...tokens, ...derivedTokens];

        for (const name of [...Object.keys(matrix.values), ...Object.keys(matrix.dark ?? {})]) {
            expect(named, name).toContain(name);
        }
    });

    it('gives a dark value only to a name it sets, and only a colour', () => {
        for (const [name, value] of Object.entries(matrix.dark ?? {})) {
            expect(Object.keys(matrix.values), name).toContain(name);
            expect(CSS.supports('color', value), name).toBe(true);
        }
    });
});

describe('theme stories', () => {
    it('renders Matrix accessibly in both of its schemes — a theme with no story has no floor', async () => {
        const container = await mountStory(Matrix, meta, 'Matrix');

        expect(
            [...container.querySelectorAll('[data-ui-theme]')].map((panel) =>
                panel.getAttribute('data-scheme'),
            ),
        ).toEqual(['light', 'dark']);

        await expectAccessible(container);
    });
});

describe('the theme control the playground carries', () => {
    it('leaves the root unthemed by default, which is the default palette', async () => {
        await mountStory(Defaults, tokensMeta, 'Defaults');

        expect(document.documentElement.hasAttribute('data-ui-theme')).toBe(false);
    });

    it('themes the root and inserts the theme when the toolbar asks for one', async () => {
        const container = await mountStory(
            { ...Defaults, globals: { theme: matrix.name } },
            tokensMeta,
            'Defaults',
        );

        expect(document.documentElement.dataset['uiTheme']).toBe(matrix.name);
        expect(container.textContent).toContain("[data-ui-theme='matrix']");
    });
});

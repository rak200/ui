import { afterEach, describe, expect, it } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
// The playwright provider is what puts `send` on `CDPSession` — see `tokens.test.ts`, which
// needs the same line for the same reason.
import type {} from '@vitest/browser-playwright';
import { expectAccessible } from './a11y.js';
import { mountStory } from './stories.js';
import meta, { Glass, Matrix } from '../stories/theme.stories.js';
import tokensMeta, {
    DarkScheme,
    Defaults,
    Derived,
    YourOwnTheme,
} from '../stories/tokens.stories.js';
import buttonMeta, { Primary } from '../stories/button.stories.js';
import { glass, matrix, themeStyleSheet, type Theme } from '../src/theme.js';
import '../src/button.js';
import '../src/input.js';
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

/**
 * A theme that makes something translucent: a ground it also gives an opaque value, and a
 * derived name it gives none.
 */
const frosted: Theme = {
    name: 'frosted',
    values: { '--ui-color-accent': '#334155', '--ui-radius': '2px' },
    dark: { '--ui-color-accent': '#94a3b8' },
    translucent: {
        values: {
            '--ui-color-accent': 'rgb(51 65 85 / 0.8)',
            '--ui-color-surface-raised': 'rgb(255 255 255 / 0.2)',
        },
        dark: { '--ui-color-surface-raised': 'rgb(0 0 0 / 0.2)' },
    },
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

/** The conditions a theme's sheet puts its media rules under, in order. */
function conditions(theme: Theme): string[] {
    return [...parsed(theme).cssRules].map((rule) =>
        rule instanceof CSSMediaRule ? rule.conditionText : '',
    );
}

/** The media rule a theme's sheet carries under `condition`. */
function under(theme: Theme, condition: string): CSSMediaRule {
    const rule = parsed(theme).cssRules[conditions(theme).indexOf(condition)];

    if (!(rule instanceof CSSMediaRule)) {
        throw new Error(`the theme sheet carries nothing under ${condition}`);
    }

    return rule;
}

/** The answer to more contrast a theme's sheet carries, last. */
function answer(theme: Theme): Map<string, string> {
    expect(conditions(theme).at(-1), 'last').toBe('(prefers-contrast: more)');

    return declarations(under(theme, '(prefers-contrast: more)').cssRules[0]);
}

/** Where a theme's translucency stands down: under either of the reader's two settings. */
const quiet = '(prefers-contrast: more), (prefers-reduced-transparency: reduce)';

/** What a theme's translucency stands down to. */
function stoodDown(theme: Theme): Map<string, string> {
    return declarations(under(theme, quiet).cssRules[0]);
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

    it('puts a translucent value in place of the opaque one, declaring each name once', () => {
        const block = declarations(parsed(frosted).cssRules[0]);

        expect([...block.keys()]).toEqual([
            '--ui-color-accent',
            '--ui-radius',
            '--ui-color-surface-raised',
        ]);
        expect(block.get('--ui-color-accent')).toBe('rgb(51 65 85 / 0.8)');
        expect(block.get('--ui-color-surface-raised')).toBe(
            'light-dark(rgb(255 255 255 / 0.2), rgb(0 0 0 / 0.2))',
        );
    });

    it("stands the translucency down to the theme's opaque value, or to the default", () => {
        expect([...stoodDown(frosted)]).toEqual([
            ['--ui-color-accent', 'light-dark(#334155, #94a3b8)'],
            ['--ui-color-surface-raised', 'initial'],
        ]);
    });

    it('stands it down before the answer to more contrast, which wins where both name one', () => {
        expect(conditions(frosted)).toEqual(['', quiet, '(prefers-contrast: more)']);
    });

    it('emits one declaration per line for a translucent theme too', () => {
        for (const line of themeStyleSheet(frosted).split('\n')) {
            expect(line.split(';').length, line).toBeLessThanOrEqual(2);
        }
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
        // In the accent, which is the colour a raised surface's layer lights its lift in.
        probe.style.color = String(reference('--ui-color-accent'));
        probe.style.boxShadow = String(reference('--ui-elevation-raised'));
        host.append(probe);
        document.body.append(style, host);

        const glow = (scheme: 'light' | 'dark'): string => {
            host.style.colorScheme = scheme;

            return getComputedStyle(probe).boxShadow;
        };

        expect(getComputedStyle(probe).fontFamily).toContain('Courier New');
        expect(getComputedStyle(probe).borderRadius).toBe('8px');
        // The raised surfaces read the elevation step, and Matrix makes it a glow in the
        // colour it is lit in, which follows the scheme: its middle green on white at the
        // ring's 0.54, its bright one on black at 0.45.
        expect(glow('light'), 'light').toContain('color(srgb 0 0.560784 0.0666667 / 0.54)');
        expect(glow('dark'), 'dark').toContain('color(srgb 0 1 0 / 0.45)');
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

    it.each([
        ['light', 'rgb(185, 28, 28)'],
        ['dark', 'rgb(248, 113, 113)'],
    ] as const)('writes a value in error in the danger, in %s', async (scheme, danger) => {
        const style = document.createElement('style');
        style.textContent = tokenStyleSheet() + themeStyleSheet(matrix);

        const host = document.createElement('div');
        host.dataset['uiTheme'] = matrix.name;
        host.style.colorScheme = scheme;
        host.innerHTML = '<ui-input label="Amount" error="A number."></ui-input>';
        document.body.append(style, host);

        const element = host.querySelector('ui-input');
        await element?.updateComplete;
        const control = element?.renderRoot.querySelector('input');

        if (control === null || control === undefined) {
            throw new Error('the field rendered no control');
        }

        expect(getComputedStyle(control).color).toBe(danger);
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

/**
 * Glass, read off one element painted the way the raised surfaces paint — every name it makes
 * translucent, in both schemes, and what each stands down to.
 */
describe('glass, as the browser renders it', () => {
    /** An element under Glass in `scheme`, painted from what a raised surface reads. */
    function frosted(scheme: 'light' | 'dark'): CSSStyleDeclaration {
        const style = document.createElement('style');
        style.textContent = tokenStyleSheet() + themeStyleSheet(glass);

        const host = document.createElement('div');
        host.dataset['uiTheme'] = glass.name;
        host.style.colorScheme = scheme;

        const probe = document.createElement('div');
        probe.style.color = 'rgb(10, 20, 30)';
        probe.style.background = String(reference('--ui-color-surface-raised'));
        probe.style.backdropFilter = String(reference('--ui-backdrop-raised'));
        probe.style.border = `1px solid ${String(reference('--ui-color-border-raised'))}`;
        probe.style.outline = `1px solid ${String(reference('--ui-color-border-overlay'))}`;
        probe.style.boxShadow = String(reference('--ui-elevation-raised'));
        // The toast's edge, lit in the colour above as a toast lights it in its variant's.
        probe.style.textDecorationColor = String(reference('--ui-color-toast-edge'));
        // And a control's boundary, which is what the two edges stand down to.
        probe.style.columnRuleColor = String(reference('--ui-color-border'));
        // A control's fill and a table's stripe.
        probe.style.caretColor = String(reference('--ui-color-surface-control'));
        probe.style.textEmphasisColor = String(reference('--ui-color-surface-muted'));
        host.append(probe);
        document.body.append(style, host);

        return getComputedStyle(probe);
    }

    it.each([
        [
            'light',
            'rgba(255, 255, 255, 0.2)',
            'rgba(255, 255, 255, 0.45)',
            'rgba(255, 255, 255, 0.6) 0px 1px 0px 0px inset, rgba(0, 0, 0, 0.08) 0px 8px 24px 0px',
            'rgba(255, 255, 255, 0.2)',
            'rgba(238, 238, 238, 0.2)',
        ],
        [
            'dark',
            'rgba(0, 0, 0, 0.2)',
            'rgba(255, 255, 255, 0.16)',
            'rgba(255, 255, 255, 0.2) 0px 1px 0px 0px inset, rgba(0, 0, 0, 0.33) 0px 8px 24px 0px',
            'rgba(17, 24, 39, 0.2)',
            'rgba(26, 33, 48, 0.2)',
        ],
    ] as const)(
        'frosts a raised surface, in %s',
        (scheme, surface, edge, lift, control, stripe) => {
            const styles = frosted(scheme);

            // The surface at the glass's opacity in a control, and the stripe's mix with it.
            expect(styles.caretColor, "a control's fill").toBe(control);
            expect(styles.textEmphasisColor, "a table's stripe").toBe(stripe);

            expect(styles.backgroundColor, 'the glass').toBe(surface);
            expect(styles.backdropFilter, 'what it does to the page').toBe(
                'blur(10px) saturate(1.7)',
            );
            expect(styles.borderTopColor, "a card's edge").toBe(edge);
            expect(styles.outlineColor, 'the edge of what floats').toBe(edge);
            expect(styles.boxShadow, 'a highlight along the top, and a soft drop').toBe(lift);
            expect(styles.textDecorationColor, "a toast's edge, at 0.80").toBe(
                'color(srgb 0.0392157 0.0784314 0.117647 / 0.8)',
            );
        },
    );

    it.each([
        // Glass's own, and the boundary's mix where the edge of what floats goes: the text is
        // only for the reader who asked for more contrast.
        ['prefers-reduced-transparency', 'reduce', 'rgb(10, 20, 30)', false],
        ['prefers-contrast', 'more', 'rgb(0, 0, 0)', true],
    ] as const)('stops being glass when the reader sets %s', async (name, value, toast, more) => {
        await cdp().send('Emulation.setEmulatedMedia', { features: [{ name, value }] });

        const styles = frosted('light');

        expect(styles.backgroundColor, 'the surface, opaque').toBe('rgb(255, 255, 255)');
        expect(styles.backdropFilter, 'and nothing behind it').toBe('none');
        expect(styles.caretColor, "a control's fill, opaque").toBe('rgb(255, 255, 255)');
        // The stripe goes opaque too: back to its formula, or to the answer to more contrast.
        expect(styles.textEmphasisColor, 'and a stripe').toMatch(/^(rgb|oklab)\(/);
        expect(styles.borderTopColor, "a card's edge, the boundary's mix").toBe(
            styles.columnRuleColor,
        );
        expect(styles.outlineColor, 'the edge of what floats').toBe(
            more ? 'rgb(0, 0, 0)' : styles.columnRuleColor,
        );
        expect(styles.boxShadow, "the default palette's lift").toBe(
            'rgba(0, 0, 0, 0.1) 0px 1px 2px -1px, rgba(0, 0, 0, 0.1) 0px 2px 6px -1px',
        );
        expect(styles.textDecorationColor, "a toast's edge").toBe(toast);
    });
});

/**
 * Glass's accent and primary button, as the browser resolves each name — at 0.80 the accent a
 * checked control is filled with, the button inverted, and the marks drawn whole.
 */
describe("glass's filled controls, as the browser renders them", () => {
    /** One token under Glass in `scheme`, as the browser serialises the colour. */
    function underGlass(token: Token | DerivedToken, scheme: 'light' | 'dark'): string {
        const style = document.createElement('style');
        style.textContent = tokenStyleSheet() + themeStyleSheet(glass);

        const host = document.createElement('div');
        host.dataset['uiTheme'] = glass.name;
        host.style.colorScheme = scheme;

        const probe = document.createElement('div');
        probe.style.backgroundColor = String(reference(token));
        host.append(probe);
        document.body.append(style, host);

        try {
            return getComputedStyle(probe).backgroundColor;
        } finally {
            style.remove();
            host.remove();
        }
    }

    it.each([
        ['--ui-color-accent', 'light', 'rgba(51, 65, 85, 0.8)'],
        ['--ui-color-accent', 'dark', 'rgba(148, 163, 184, 0.8)'],
        ['--ui-color-primary', 'light', 'rgba(148, 163, 184, 0.8)'],
        ['--ui-color-primary', 'dark', 'rgba(51, 65, 85, 0.8)'],
        ['--ui-color-primary-contrast', 'light', 'rgb(0, 0, 0)'],
        ['--ui-color-primary-contrast', 'dark', 'rgb(255, 255, 255)'],
        ['--ui-color-primary-hover', 'light', 'rgba(160, 174, 192, 0.8)'],
        ['--ui-color-primary-hover', 'dark', 'rgba(41, 53, 70, 0.8)'],
        ['--ui-color-primary-pressed', 'light', 'rgba(171, 183, 199, 0.8)'],
        ['--ui-color-primary-pressed', 'dark', 'rgba(34, 44, 59, 0.8)'],
        ['--ui-color-border-button', 'light', 'rgba(255, 255, 255, 0.45)'],
        ['--ui-color-border-button', 'dark', 'rgba(255, 255, 255, 0.16)'],
        ['--ui-color-border-button-hover', 'light', 'rgb(0, 0, 0)'],
        ['--ui-color-border-button-hover', 'dark', 'rgb(255, 255, 255)'],
    ] as const)('writes %s in %s as %s', (token, scheme, value) => {
        expect(underGlass(token, scheme)).toBe(value);
    });

    it.each([
        ['light', 'color(srgb-linear 1 1 1)'],
        ['dark', 'color(srgb-linear 0 0 0)'],
    ] as const)(
        "draws a checked control's mark whole on the translucent accent, in %s",
        (scheme, mark) => {
            expect(underGlass('--ui-color-accent-contrast', scheme)).toBe(mark);
        },
    );

    it.each([
        [
            'light',
            'rgba(255, 255, 255, 0.6) 0px 1px 0px 0px inset, rgba(0, 0, 0, 0.08) 0px 1px 3px 0px',
        ],
        [
            'dark',
            'rgba(255, 255, 255, 0.2) 0px 1px 0px 0px inset, rgba(0, 0, 0, 0.33) 0px 1px 3px 0px',
        ],
    ] as const)('lifts a button with a highlight and a short drop, in %s', (scheme, lift) => {
        const style = document.createElement('style');
        style.textContent = tokenStyleSheet() + themeStyleSheet(glass);

        const host = document.createElement('div');
        host.dataset['uiTheme'] = glass.name;
        host.style.colorScheme = scheme;

        const probe = document.createElement('div');
        probe.style.boxShadow = String(reference('--ui-elevation-button'));
        host.append(probe);
        document.body.append(style, host);

        expect(getComputedStyle(probe).boxShadow).toBe(lift);
    });

    it('fills them opaque, and the button as the accent is, when the reader asks for less transparency', async () => {
        await cdp().send('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
        });

        expect(underGlass('--ui-color-accent', 'light'), 'the accent').toBe('rgb(51, 65, 85)');
        expect(underGlass('--ui-color-primary', 'light'), 'the button').toBe('rgb(51, 65, 85)');
        expect(underGlass('--ui-color-primary-contrast', 'light'), 'its label').toBe(
            'color(srgb-linear 1 1 1)',
        );
        // A button's edge back to its variant's colour, which this probe paints in black.
        expect(underGlass('--ui-color-border-button', 'light'), 'its edge').toBe('rgb(0, 0, 0)');
    });
});

describe.each([matrix, glass])('$name', (theme) => {
    /** The values it sets and the translucent ones it sets aside, each with its dark ones. */
    const sets = [theme, ...(theme.translucent === undefined ? [] : [theme.translucent])];

    it('names only tokens that exist', () => {
        const named: readonly string[] = [...tokens, ...derivedTokens];

        for (const set of sets) {
            for (const name of [...Object.keys(set.values), ...Object.keys(set.dark ?? {})]) {
                expect(named, name).toContain(name);
            }
        }
    });

    it('gives a dark value only to a name it sets, and only a colour', () => {
        for (const set of sets) {
            for (const [name, value] of Object.entries(set.dark ?? {})) {
                expect(Object.keys(set.values), name).toContain(name);
                expect(CSS.supports('color', value), name).toBe(true);
            }
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

    it('renders Glass accessibly in both of its schemes, over the page it holds over', async () => {
        const container = await mountStory(Glass, meta, 'Glass');
        const panels = [...container.querySelectorAll<HTMLElement>('[data-ui-theme]')];

        expect(panels.map((panel) => panel.getAttribute('data-scheme'))).toEqual(['light', 'dark']);
        expect(panels.map((panel) => getComputedStyle(panel).backgroundColor)).toEqual([
            'rgb(206, 206, 206)',
            'rgb(48, 48, 48)',
        ]);

        await expectAccessible(container);
    });
});

describe('the theme control the playground carries', () => {
    it('leaves the root unthemed by default, which is the default palette', async () => {
        await mountStory(Primary, buttonMeta, 'Primary');

        expect(document.documentElement.hasAttribute('data-ui-theme')).toBe(false);
    });

    it.each([matrix, glass])(
        'themes the root and inserts $name when the toolbar asks for it',
        async (theme) => {
            const container = await mountStory(Primary, buttonMeta, 'Primary', {
                theme: theme.name,
            });

            expect(document.documentElement.dataset['uiTheme']).toBe(theme.name);
            expect(container.textContent).toContain(`[data-ui-theme='${theme.name}']`);
        },
    );

    it.each([
        { name: 'Defaults', story: Defaults },
        { name: 'Derived', story: Derived },
        { name: 'DarkScheme', story: DarkScheme },
        { name: 'YourOwnTheme', story: YourOwnTheme },
    ])('keeps $name on the default palette, whatever the toolbar says', async ({ name, story }) => {
        const container = await mountStory(story, tokensMeta, name, { theme: matrix.name });

        expect(document.documentElement.hasAttribute('data-ui-theme')).toBe(false);
        expect(container.textContent).not.toContain(`[data-ui-theme='${matrix.name}']`);
    });
});

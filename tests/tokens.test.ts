import { afterEach, describe, expect, it } from 'vitest';
import { expectAccessible } from './a11y.js';
import { contrastRatio } from './contrast.js';
import { mountStory } from './stories.js';
import meta, { DarkScheme, Defaults } from '../stories/tokens.stories.js';
import { darkScheme, defaults, tokens, tokenStyleSheet, type Token } from '../src/tokens.js';
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

describe('darkScheme', () => {
    it('varies only colours, because light-dark() takes colours', () => {
        // A dark value for `--ui-radius` would emit CSS the browser discards, silently.
        for (const name of Object.keys(darkScheme)) {
            expect(name.startsWith('--ui-color-'), name).toBe(true);
        }
    });

    it('names only tokens that exist', () => {
        for (const name of Object.keys(darkScheme)) {
            expect(tokens, name).toContain(name);
        }
    });

    it('never repeats a light value, which would be a scheme that does not vary', () => {
        for (const [name, value] of Object.entries(darkScheme)) {
            expect(value, name).not.toBe(defaults[name as Token]);
        }
    });
});

describe('tokenStyleSheet', () => {
    it('emits a :root block holding every token', () => {
        const sheet = tokenStyleSheet();

        expect(sheet.startsWith(':root {')).toBe(true);
        expect(sheet.endsWith('}')).toBe(true);

        for (const token of tokens) {
            expect(sheet).toContain(`  ${token}: `);
        }
    });

    it('states the form of each declaration, rather than comparing it to itself', () => {
        const sheet = tokenStyleSheet();

        // Asserting `${token}: ${defaults[token]}` would compare the output against the
        // very constant that produced it — a check no change of value can ever fail. The
        // emitted form is the thing worth stating.
        expect(sheet).toContain('  --ui-radius: 0.375rem;');
        expect(sheet).toContain('  --ui-color-surface: light-dark(#ffffff, #111827);');
    });

    it('declares the scheme axis, which no token can carry', () => {
        expect(tokenStyleSheet()).toContain('  color-scheme: light dark;');
    });

    it('pairs a token with its dark value, and only where one exists', () => {
        const sheet = tokenStyleSheet();

        for (const token of tokens) {
            const dark = darkScheme[token];
            const expected =
                dark === undefined
                    ? `  ${token}: ${defaults[token]};`
                    : `  ${token}: light-dark(${defaults[token]}, ${dark});`;

            expect(sheet, token).toContain(expected);
        }
    });

    it('emits one declaration per line, and nothing else', () => {
        const lines = tokenStyleSheet().split('\n');

        // The opening, the scheme axis, one line per token, the closing.
        expect(lines.length).toBe(tokens.length + 3);
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
 * The browser is the validator, and one table buys two invariants.
 *
 * The suite runs in a real browser, so `CSS.supports` is available and is the same idiom
 * as *parses as CSS the browser actually applies* below. The second invariant is the
 * **lookup failing**: a token matching no prefix has no property to be checked against, so
 * a new name cannot invent a category nobody declared. Together they replace the weakest
 * assertion this layer had — that a default is a non-blank string.
 */
describe('every value is legal for the property its token serves', () => {
    const properties = [
        ['--ui-color-', 'color'],
        ['--ui-radius', 'border-radius'],
        ['--ui-space', 'padding'],
        ['--ui-font', 'font-family'],
    ] as const;

    function propertyFor(token: string): string {
        const found = properties.find(([prefix]) => token.startsWith(prefix));

        if (found === undefined) {
            throw new Error(`no property declared for ${token} — a token cannot invent a category`);
        }

        return found[1];
    }

    it('declares a property for every token', () => {
        for (const token of tokens) {
            expect(() => propertyFor(token), token).not.toThrow();
        }
    });

    it('refuses a name in no declared category', () => {
        expect(() => propertyFor('--ui-elevation-100')).toThrow(/invent a category/);
    });

    it('accepts every default', () => {
        for (const token of tokens) {
            expect(CSS.supports(propertyFor(token), defaults[token]), token).toBe(true);
        }
    });

    it('accepts every dark value', () => {
        for (const [name, value] of Object.entries(darkScheme)) {
            expect(CSS.supports(propertyFor(name), value), name).toBe(true);
        }
    });

    it('accepts the composed light-dark() the sheet actually emits', () => {
        for (const [name, value] of Object.entries(darkScheme)) {
            const composed = `light-dark(${defaults[name as Token]}, ${value})`;

            expect(CSS.supports('color', composed), name).toBe(true);
        }
    });

    it('rejects the wrong category and a typo, so the check is not vacuous', () => {
        expect(CSS.supports('color', '0.375rem')).toBe(false);
        expect(CSS.supports('color', 'rebeccapurpel')).toBe(false);
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

    /**
     * A second scheme is a second contrast obligation, and it is the same obligation
     * rather than a lighter one. `--ui-color-danger` is why this block exists: red-700 is
     * legible on white and 2.74:1 on charcoal, which no amount of looking at the light
     * scheme would have revealed.
     */
    describe('in the dark scheme', () => {
        const dark = (token: Token): string => darkScheme[token] ?? defaults[token];

        it('keeps body text at 4.5:1', () => {
            expect(
                contrastRatio(dark('--ui-color-text'), dark('--ui-color-surface')),
            ).toBeGreaterThanOrEqual(4.5);
        });

        it('keeps error text at 4.5:1', () => {
            expect(
                contrastRatio(dark('--ui-color-danger'), dark('--ui-color-surface')),
            ).toBeGreaterThanOrEqual(4.5);
        });

        it('keeps a primary button legible against its own accent', () => {
            expect(
                contrastRatio(dark('--ui-color-accent-contrast'), dark('--ui-color-accent')),
            ).toBeGreaterThanOrEqual(4.5);
        });

        it('keeps the focus ring at 3:1, which is why it needs no dark value of its own', () => {
            expect(
                contrastRatio(dark('--ui-color-focus'), dark('--ui-color-surface')),
            ).toBeGreaterThanOrEqual(3);
        });
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

    it('renders the dark scheme from the sheet, without restating a value', async () => {
        const container = await mountStory(DarkScheme, meta, 'DarkScheme');
        const painted = container.querySelector('.scheme');

        if (painted === null) {
            throw new Error('the dark story rendered no scheme wrapper');
        }

        // The browser resolved `light-dark()` rather than the test asserting it did: this
        // is the dark branch, computed, and it is not the light one.
        const background = getComputedStyle(painted).backgroundColor;

        expect(background).toBe('rgb(17, 24, 39)');
        expect(getComputedStyle(painted).colorScheme).toBe('dark');
    });

    it('meets the bar in the dark scheme too — a scheme with no story has no floor', async () => {
        await expectAccessible(await mountStory(DarkScheme, meta, 'DarkScheme'));
    });
});

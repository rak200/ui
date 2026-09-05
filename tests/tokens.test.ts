import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';
// The playwright provider is what puts `send` on `CDPSession`, and the compiler sees that
// augmentation only if this module is in the program. `vitest.config.js` imports the
// provider, but a JS config file is not — so without this line `cdp().send` is a type
// error and the emulation below cannot be written at all.
import type {} from '@vitest/browser-playwright';
import { expectAccessible } from './a11y.js';
import { contrastRatio } from './contrast.js';
import { mountStory } from './stories.js';
import meta, { DarkScheme, Defaults, Derived, Theme } from '../stories/tokens.stories.js';
import {
    darkScheme,
    defaults,
    derivedTokens,
    formulas,
    tokens,
    tokenStyleSheet,
    type DerivedToken,
    type Token,
} from '../src/tokens.js';
import { reference } from '../src/reference.js';
import { UiButton } from '../src/button.js';
import { UiCard } from '../src/card.js';
import { UiCheckbox, UiSwitch } from '../src/checkbox.js';
import { UiDialog } from '../src/dialog.js';
import { UiField } from '../src/field.js';
import { UiIcon } from '../src/icon.js';
import { UiInput, UiTextarea } from '../src/input.js';
import { UiMenu } from '../src/menu.js';
import { UiRadio, UiRadioGroup } from '../src/radio.js';
import { UiSelect } from '../src/select.js';
import { UiToast, UiToaster } from '../src/toast.js';
import { UiTooltip } from '../src/tooltip.js';

afterEach(() => {
    document.body.replaceChildren();
});

/** The axis `color-scheme` selects. A theme is the other one, and they are independent. */
type Scheme = 'light' | 'dark';

/** Every name this package declares, from either half. */
const declared: readonly string[] = [...tokens, ...derivedTokens];

/** The `var()` names one CSS value refers to — how a formula names its grounds. */
function referenced(value: string): string[] {
    return [...value.matchAll(/var\((--[a-z0-9-]+)/g)].map((match) => match[1] ?? '');
}

/** `tokenStyleSheet()` as the browser parses it, which is the only reader that matters. */
function parsed(): CSSStyleSheet {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(tokenStyleSheet());

    return sheet;
}

function styleRule(rule: CSSRule | undefined): CSSStyleRule {
    if (!(rule instanceof CSSStyleRule)) {
        throw new Error(`expected a style rule, found ${rule?.constructor.name ?? 'nothing'}`);
    }

    return rule;
}

/** What a rule declares, in the order it declares it — names and values, browser-parsed. */
function declarations(rule: CSSStyleRule): Map<string, string> {
    const declarations = new Map<string, string>();

    for (let index = 0; index < rule.style.length; index += 1) {
        const name = rule.style.item(index);

        declarations.set(name, rule.style.getPropertyValue(name).trim());
    }

    return declarations;
}

/** The `:root` block, which is the half a formula must never reach. */
function root(): Map<string, string> {
    return declarations(styleRule(parsed().cssRules[0]));
}

/** The reduced-motion rule beside it. */
function reducedMotion(): CSSMediaRule {
    const rule = parsed().cssRules[1];

    if (!(rule instanceof CSSMediaRule)) {
        throw new Error('the sheet emits no reduced-motion rule');
    }

    return rule;
}

/**
 * What the browser computes for one declaration, with this package's own sheet in force
 * and `scheme` selected.
 *
 * A derived role has no value to read anywhere — only a formula — so resolving one is the
 * only way to check it at all, and the browser is the only thing that can.
 */
function computed(property: string, value: string, scheme: Scheme): string {
    const style = document.createElement('style');
    style.textContent = tokenStyleSheet();

    const host = document.createElement('div');
    host.style.colorScheme = scheme;

    const probe = document.createElement('div');
    probe.style.setProperty(property, value);
    host.append(probe);
    document.body.append(style, host);

    try {
        return getComputedStyle(probe).getPropertyValue(property);
    } finally {
        style.remove();
        host.remove();
    }
}

/**
 * A colour the browser has resolved, as six-digit sRGB hex.
 *
 * `color-mix()` computes in oklab and serialises as `oklab(…)`, which is neither something
 * `contrastRatio` can read nor something a hand-written parser should be trusted with. A
 * one-pixel canvas is the browser's own conversion, and the same instrument the proposal
 * measured the derivation with.
 */
function sRGB(colour: string): string {
    const context = document.createElement('canvas').getContext('2d');

    if (context === null) {
        throw new Error('no 2d context, so no colour can be resolved');
    }

    context.fillStyle = colour;
    context.fillRect(0, 0, 1, 1);

    const pixel = context.getImageData(0, 0, 1, 1).data;
    const channels = [0, 1, 2].map((offset) => (pixel[offset] ?? 0).toString(16).padStart(2, '0'));

    return `#${channels.join('')}`;
}

/** A token as a component writes it, resolved in `scheme`. */
function painted(token: Token | DerivedToken, scheme: Scheme): string {
    return sRGB(computed('background-color', String(reference(token)), scheme));
}

/** The ground value in force in `scheme`, which is data rather than a rendering. */
function ground(token: Token, scheme: Scheme): string {
    return scheme === 'dark' ? (darkScheme[token] ?? defaults[token]) : defaults[token];
}

/** The channels of a resolved colour, for a question about hue rather than about luminance. */
function channels(hex: string): { red: number; green: number; blue: number } {
    const [red, green, blue] = [1, 3, 5].map((offset) =>
        Number.parseInt(hex.slice(offset, offset + 2), 16),
    );

    return { red: red ?? 0, green: green ?? 0, blue: blue ?? 0 };
}

/** Tells the browser what the reader has asked for, which no API in the page can. */
async function askForLessMotion(reduce: boolean): Promise<void> {
    await cdp().send('Emulation.setEmulatedMedia', {
        features: reduce ? [{ name: 'prefers-reduced-motion', value: 'reduce' }] : [],
    });
}

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

describe('derivedTokens', () => {
    it('names every derived token under the --ui- prefix, and declares none twice', () => {
        for (const token of derivedTokens) {
            expect(token.startsWith('--ui-'), token).toBe(true);
        }

        expect(new Set(derivedTokens).size).toBe(derivedTokens.length);
    });

    it('shares no name with the ground half, which would be a value and a formula at once', () => {
        for (const token of derivedTokens) {
            expect(tokens as readonly string[], token).not.toContain(token);
        }
    });

    it('gives every derived token a formula', () => {
        for (const token of derivedTokens) {
            expect(formulas[token], token).toMatch(/\S/);
        }
    });

    it('builds every formula out of grounds that exist, and out of at least one', () => {
        // The failure this catches is a typo — `var(--ui-color-surfase)` mixes against
        // nothing, and CSS says so by rendering nothing rather than by complaining. The
        // second half is what stops the loop passing over a formula that names nothing.
        for (const [token, formula] of Object.entries(formulas)) {
            expect(referenced(formula).length, token).toBeGreaterThan(0);

            for (const name of referenced(formula)) {
                expect(tokens as readonly string[], `${token} → ${name}`).toContain(name);
            }
        }
    });

    it('gives every ground inside a formula its own default', () => {
        // A formula only ever runs as the fallback of a name nobody declared, which is
        // exactly the page that inserted no `:root` block. A bare `var(--ui-color-text)`
        // there is invalid at computed-value time and takes the whole mix down with it,
        // so the declaration is dropped rather than falling back to anything.
        for (const [token, formula] of Object.entries(formulas)) {
            for (const found of formula.matchAll(/var\((--ui-[a-z0-9-]+)(.?)/g)) {
                expect(found[2], `${token} → ${found[1] ?? ''}`).toBe(',');
            }
        }
    });

    it('states the form a formula is composed into, rather than restating the composer', () => {
        expect(formulas['--ui-color-hover']).toBe(
            'color-mix(in oklab, var(--ui-color-text, #1f2937) 8%, var(--ui-color-surface, #ffffff))',
        );
        expect(formulas['--ui-duration-state']).toBe('var(--ui-duration-100, 150ms)');
    });

    it('refers to no derived name from inside a formula, which would be a derivation of one', () => {
        for (const [token, formula] of Object.entries(formulas)) {
            for (const name of referenced(formula)) {
                expect(derivedTokens as readonly string[], `${token} → ${name}`).not.toContain(
                    name,
                );
            }
        }
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
    it('emits a :root block holding every ground token and the scheme axis, and nothing else', () => {
        expect([...root().keys()]).toEqual(['color-scheme', ...tokens]);
    });

    it('states the form of each declaration, rather than comparing it to itself', () => {
        const sheet = tokenStyleSheet();

        // Asserting `${token}: ${defaults[token]}` would compare the output against the
        // very constant that produced it — a check no change of value can ever fail. The
        // emitted form is the thing worth stating.
        expect(sheet).toContain('  --ui-radius: 0.375rem;');
        expect(sheet).toContain('  --ui-color-surface: light-dark(#ffffff, #111827);');
        expect(sheet).toContain('  --ui-duration-100: 150ms;');
    });

    it('declares the scheme axis, which no token can carry', () => {
        expect(root().get('color-scheme')).toBe('light dark');
    });

    it('pairs a token with its dark value, and only where one exists', () => {
        const declarations = root();

        for (const token of tokens) {
            const dark = darkScheme[token];
            const expected =
                dark === undefined ? defaults[token] : `light-dark(${defaults[token]}, ${dark})`;

            expect(declarations.get(token), token).toBe(expected);
        }
    });

    it('never lets a formula reach :root, which is the one measured failure of the design', () => {
        // A derivation declared beside its grounds resolves once, there, and freezes — so
        // a dark subtree inherits the light mix and a second theme inherits the first
        // one's. The gate is here rather than in a comment because the broken placement is
        // the first thing anyone will try.
        const declarations = root();

        for (const token of derivedTokens) {
            expect(declarations.has(token), token).toBe(false);
        }

        for (const [token, formula] of Object.entries(formulas)) {
            expect(tokenStyleSheet(), token).not.toContain(formula);
        }
    });

    it('collapses every duration when the reader has asked for less motion', () => {
        const rule = reducedMotion();

        expect(rule.conditionText).toBe('(prefers-reduced-motion: reduce)');

        const collapsed = declarations(styleRule(rule.cssRules[0]));
        const durations = declared.filter((name) => name.startsWith('--ui-duration-'));

        // Ground *and* derived, which is the half that is easy to drop: a derived name
        // falls back to its formula only while nobody has declared it, so a host who had
        // tuned `--ui-duration-state` would keep their motion right through the collapse.
        expect([...collapsed.keys()]).toEqual(durations);
        expect(durations.length).toBeGreaterThan(1);
    });

    it('collapses to a duration that is short but not zero', () => {
        for (const [name, value] of declarations(styleRule(reducedMotion().cssRules[0]))) {
            const seconds = Number.parseFloat(computed('transition-duration', value, 'light'));

            expect(seconds, name).toBeGreaterThan(0);
            expect(seconds, name).toBeLessThan(0.001);
        }
    });

    it('parses as CSS the browser actually applies', () => {
        expect(parsed().cssRules.length).toBe(2);
    });

    it('emits one declaration per line, because a host reads this output as well as parses it', () => {
        // The browser is indifferent to where the newlines are, so every assertion above
        // this one passes with the whole block on a single line. It is pasted into a page
        // by hand and read there, which is the property no CSSOM check can see.
        const lines = tokenStyleSheet().split('\n');
        const durations = declared.filter((name) => name.startsWith('--ui-duration-'));

        for (const line of lines) {
            expect(line.split(';').length, line).toBeLessThanOrEqual(2);
        }

        // `:root {`, the scheme axis, one line per token, `}`; a blank line; the media
        // rule, its own `:root {`, one line per duration, and the two closing braces.
        expect(lines.length).toBe(tokens.length + durations.length + 8);
    });
});

/**
 * Reduced motion is honoured in the token layer, once, and nothing in a component knows.
 *
 * That is the argument for motion being tokens rather than literals, and it is stronger
 * than the theming one: a hardcoded `150ms` is not merely un-overridable, it is an
 * accessibility defect every component would have to fix on its own.
 */
describe('the reduced-motion collapse, as the browser applies it', () => {
    afterEach(async () => {
        await askForLessMotion(false);
    });

    it('takes the time out of a component-facing duration', async () => {
        const state = String(reference('--ui-duration-state'));

        expect(computed('transition-duration', state, 'light'), 'before').toBe('0.15s');

        await askForLessMotion(true);

        const collapsed = Number.parseFloat(computed('transition-duration', state, 'light'));

        expect(collapsed, 'collapsed').toBeLessThan(0.001);
        expect(collapsed, 'and not to zero').toBeGreaterThan(0);
    });

    it('leaves a transition that still fires its end event, which zero does not', async () => {
        // Measured: at 0ms the value lands and neither transitionstart nor transitionend
        // ever fires. A component that awaits the end of a transition before removing
        // itself — a dialog, a toast, a menu, a tooltip — would then wait forever, and
        // only for the people who asked for less motion. `0.01ms` is the same code path
        // with the time taken out; zero is a second behaviour nothing announces.
        await askForLessMotion(true);

        const style = document.createElement('style');
        style.textContent = tokenStyleSheet();

        const probe = document.createElement('div');
        probe.style.transitionProperty = 'opacity';
        probe.style.transitionDuration = String(reference('--ui-duration-state'));
        probe.style.opacity = '1';
        document.body.append(style, probe);

        const ended = new Promise<boolean>((resolve) => {
            probe.addEventListener('transitionend', () => {
                resolve(true);
            });
            setTimeout(() => {
                resolve(false);
            }, 2000);
        });

        // The style has to be flushed between appending the element and changing the
        // property, or both values resolve in one frame, no transition is ever started and
        // every duration reports false — including one nobody collapsed.
        expect(getComputedStyle(probe).opacity).toBe('1');
        probe.style.opacity = '0';

        expect(await ended).toBe(true);
    });
});

/**
 * Every `var(--ui-*, fallback)` a component writes used to carry a hand-copied literal,
 * and nothing compared the copies.
 *
 * They all agreed, which is why the duplication looked harmless — it was unchecked rather
 * than broken, and it grew with the component count. Generated from `defaults` and
 * `formulas` by `src/reference.ts`, a fallback can no longer drift; what this block now
 * catches is a component going back to writing one by hand, which is how the copies got
 * here in the first place.
 */
describe('the references components write', () => {
    // Every component, and the list is the assertion: one left out is a component free to
    // hand-write a fallback, which is exactly what this block exists to stop.
    const styles = [
        UiButton.styles,
        UiCard.styles,
        UiCheckbox.styles,
        UiDialog.styles,
        UiField.styles,
        UiIcon.styles,
        UiInput.styles,
        UiMenu.styles,
        UiRadio.styles,
        UiRadioGroup.styles,
        UiSelect.styles,
        UiSwitch.styles,
        UiTextarea.styles,
        UiToast.styles,
        UiToaster.styles,
        UiTooltip.styles,
    ]
        .map(String)
        .join('\n');

    /** Every `--ui-` name mentioned anywhere in a component's CSS. */
    const mentioned = [...styles.matchAll(/--ui-[a-z0-9-]+/g)].map((match) => match[0]);

    it('finds them at all, so a passing suite is not an empty loop', () => {
        expect(mentioned.length).toBeGreaterThan(0);
    });

    it('names only tokens that exist', () => {
        for (const name of mentioned) {
            expect(declared, name).toContain(name);
        }
    });

    it('carries the fallback the layer declares, never a copy of it', () => {
        for (const name of declared) {
            const expected = String(reference(name as Token | DerivedToken));

            for (let at = styles.indexOf(`var(${name},`); at !== -1;) {
                expect(styles.startsWith(expected, at), name).toBe(true);
                at = styles.indexOf(`var(${name},`, at + 1);
            }
        }
    });

    // A step in a scale is a position, and a component that reads one makes the host
    // reverse-engineer which step a button or a card happens to use before they can slow
    // it down or flatten it. Take the purpose out of the styles and the step goes with it:
    // every mention of the ground is inside the purpose's own fallback, which is a
    // reference to the scale rather than a reading of it.
    //
    // A table rather than a case per scale, because the rule is the scale-and-purpose
    // shape itself: whichever category grows a scale next inherits the check by adding a
    // row, and a scale that arrives without a purpose has nothing to add.
    it.each([
        ['--ui-duration-state', '--ui-duration-100'],
        ['--ui-elevation-raised', '--ui-elevation-100'],
    ] as const)('reads %s rather than the step under it', (name, step) => {
        const purpose = String(reference(name));

        expect(styles).toContain(purpose);
        expect(styles.split(purpose).join('')).not.toContain(step);
    });
});

/**
 * The browser is the validator, and one table buys two invariants.
 *
 * The suite runs in a real browser, so `CSS.supports` is available and is the same idiom
 * as *parses as CSS the browser actually applies* above. The second invariant is the
 * **lookup failing**: a token matching no prefix has no property to be checked against, so
 * a new name cannot invent a category nobody declared. Together they replace the weakest
 * assertion this layer had — that a default is a non-blank string.
 */
describe('every value is legal for the property its token serves', () => {
    const properties = [
        ['--ui-color-', 'color'],
        ['--ui-duration-', 'transition-duration'],
        ['--ui-easing-', 'transition-timing-function'],
        ['--ui-radius', 'border-radius'],
        ['--ui-space', 'padding'],
        ['--ui-font', 'font-family'],
        // Two rows rather than one `--ui-icon-` prefix: the pair serves two different
        // properties, and a prefix row would have to pick one of them and stop checking
        // the other.
        ['--ui-icon-size', 'inline-size'],
        ['--ui-icon-stroke', 'stroke-width'],
        ['--ui-elevation-', 'box-shadow'],
    ] as const;

    function propertyFor(token: string): string {
        const found = properties.find(([prefix]) => token.startsWith(prefix));

        if (found === undefined) {
            throw new Error(`no property declared for ${token} — a token cannot invent a category`);
        }

        return found[1];
    }

    it('declares a property for every name in either half', () => {
        for (const token of declared) {
            expect(() => propertyFor(token), token).not.toThrow();
        }
    });

    it('refuses a name in no declared category', () => {
        // Layering, which is the category `ROADMAP.md` expected the first overlay to bring
        // and it brought none — a modal `<dialog>` is promoted to the top layer, so there
        // is no `z-index` anywhere to name. So this is a name nobody has declared *and*
        // one somebody might, which is the shape this check exists for. It was
        // `--ui-elevation-100` until `ui-card` declared that one.
        expect(() => propertyFor('--ui-z-100')).toThrow(/invent a category/);
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

    it('resolves every formula to a value of the right kind, which supports() cannot see', () => {
        // A value holding `var()` is valid for *every* property at parse time, so
        // `CSS.supports` says yes to a duration under a colour name and to a typo under
        // either. Resolving it is what discriminates: an unresolvable reference computes
        // to nothing, and a mixed colour computes to a colour.
        for (const token of derivedTokens) {
            const resolved = computed(propertyFor(token), String(reference(token)), 'light');

            expect(resolved, token).toMatch(/\S/);

            if (token.startsWith('--ui-color-')) {
                expect(painted(token, 'light'), token).not.toBe('#000000');
            }
        }
    });

    it('rejects the wrong category and a typo, so the check is not vacuous', () => {
        expect(CSS.supports('color', '0.375rem')).toBe(false);
        expect(CSS.supports('color', 'rebeccapurpel')).toBe(false);
        expect(CSS.supports('transition-duration', 'ease-out')).toBe(false);
        expect(CSS.supports('transition-timing-function', '150ms')).toBe(false);
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

    // The two outcomes that arrived with `ui-toast`, held to the text floor rather than to
    // the 3:1 a coloured edge would owe. The floor a value has to clear is the strictest
    // use it is put to, and nothing stops a host writing one as text — `--ui-color-danger`
    // is that use, in `ui-field`, today.
    it.each(['--ui-color-success', '--ui-color-warning'] as const)(
        'keeps %s at 4.5:1 against the surface',
        (token) => {
            expect(
                contrastRatio(defaults[token], defaults['--ui-color-surface']),
            ).toBeGreaterThanOrEqual(4.5);
        },
    );

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
        const dark = (token: Token): string => ground(token, 'dark');

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

        // Both are inverted for the dark surface for the reason the error is: green-700 is
        // 3.54:1 there and amber-700 is 3.53, so each would pass as an edge and fail as the
        // text a host is free to write it as.
        it.each(['--ui-color-success', '--ui-color-warning'] as const)(
            'keeps %s at 4.5:1',
            (token) => {
                expect(
                    contrastRatio(dark(token), dark('--ui-color-surface')),
                ).toBeGreaterThanOrEqual(4.5);
            },
        );

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

    /**
     * And the derived colours have the same floors, which nothing else can check.
     *
     * A hovered button is a state axe never sees — it inspects a rendering, and no
     * automated pass hovers anything — so a hover colour that puts text under 4.5:1 is
     * invisible to every gate this repository has. The values are not readable either:
     * a derived role has a formula and no value, so the browser has to resolve it first.
     */
    describe('over a derived colour, resolved by the browser', () => {
        it.each(['light', 'dark'] as const)('moves the accent visibly, in %s', (scheme) => {
            const resting = ground('--ui-color-accent', scheme);
            const hover = painted('--ui-color-accent-hover', scheme);
            const pressed = painted('--ui-color-accent-pressed', scheme);

            // A component that accepts interaction and shows no feedback is defective, and
            // *no feedback* includes a mix too small to see. 1.05 is about the least a
            // real display renders as a difference at all.
            expect(contrastRatio(hover, resting), 'hover against resting').toBeGreaterThan(1.05);
            expect(contrastRatio(pressed, hover), 'pressed against hover').toBeGreaterThan(1.05);
        });

        it.each(['light', 'dark'] as const)('moves the surface visibly, in %s', (scheme) => {
            const resting = ground('--ui-color-surface', scheme);
            const hover = painted('--ui-color-hover', scheme);
            const pressed = painted('--ui-color-pressed', scheme);

            expect(contrastRatio(hover, resting), 'hover against resting').toBeGreaterThan(1.05);
            expect(contrastRatio(pressed, hover), 'pressed against hover').toBeGreaterThan(1.05);
        });

        it.each(['light', 'dark'] as const)('keeps a hovered primary legible, in %s', (scheme) => {
            const label = ground('--ui-color-accent-contrast', scheme);

            expect(
                contrastRatio(label, painted('--ui-color-accent-hover', scheme)),
                'hovered',
            ).toBeGreaterThanOrEqual(4.5);
            expect(
                contrastRatio(label, painted('--ui-color-accent-pressed', scheme)),
                'pressed',
            ).toBeGreaterThanOrEqual(4.5);
        });

        it.each(['light', 'dark'] as const)(
            'gives a control a boundary that clears the non-text floor, in %s',
            (scheme) => {
                // WCAG 1.4.11: a control's boundary is what identifies the component, so
                // it owes 3:1 against what it sits on. The step below the shipped one is
                // 2.94 in light — which is what a percentage chosen by eye would have
                // shipped, and what nothing would have caught.
                expect(
                    contrastRatio(
                        painted('--ui-color-border', scheme),
                        ground('--ui-color-surface', scheme),
                    ),
                ).toBeGreaterThanOrEqual(3);
            },
        );

        it.each(['light', 'dark'] as const)('keeps muted text legible as text, in %s', (scheme) => {
            // A placeholder is text, so 4.5:1 rather than 3:1 — the floor that makes a
            // muted role only just muted.
            expect(
                contrastRatio(
                    painted('--ui-color-text-muted', scheme),
                    ground('--ui-color-surface', scheme),
                ),
            ).toBeGreaterThanOrEqual(4.5);
        });

        it.each(['light', 'dark'] as const)(
            'keeps a hovered secondary legible, in %s',
            (scheme) => {
                const label = ground('--ui-color-text', scheme);

                expect(
                    contrastRatio(label, painted('--ui-color-hover', scheme)),
                    'hovered',
                ).toBeGreaterThanOrEqual(4.5);
                expect(
                    contrastRatio(label, painted('--ui-color-pressed', scheme)),
                    'pressed',
                ).toBeGreaterThanOrEqual(4.5);
            },
        );
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

    it('shows every derived role with the formula it computes from', async () => {
        const container = await mountStory(Derived, meta, 'Derived');

        for (const token of derivedTokens) {
            expect(container.textContent, token).toContain(token);
            expect(container.textContent, token).toContain(formulas[token]);
        }
    });

    it('meets the bar over the derived roles too', async () => {
        await expectAccessible(await mountStory(Derived, meta, 'Derived'));
    });

    it('renders the dark scheme from the sheet, without restating a value', async () => {
        const container = await mountStory(DarkScheme, meta, 'DarkScheme');
        const painted = container.querySelector('.panel');

        if (painted === null) {
            throw new Error('the dark story rendered no panel');
        }

        // The browser resolved `light-dark()` rather than the test asserting it did: this
        // is the dark branch, computed, and it is not the light one.
        expect(getComputedStyle(painted).backgroundColor).toBe('rgb(17, 24, 39)');
        expect(getComputedStyle(painted).colorScheme).toBe('dark');
    });

    it('meets the bar in the dark scheme too — a scheme with no story has no floor', async () => {
        await expectAccessible(await mountStory(DarkScheme, meta, 'DarkScheme'));
    });

    it('carries a derived role into a second theme, hue and all', async () => {
        const container = await mountStory(Theme, meta, 'Theme');
        const swatch = container.querySelector(
            '[data-ui-theme] [data-token="--ui-color-accent-hover"]',
        );

        if (swatch === null) {
            throw new Error('the theme story rendered no accent-hover swatch');
        }

        const themed = channels(sRGB(getComputedStyle(swatch).backgroundColor));
        const shipped = channels(painted('--ui-color-accent-hover', 'light'));

        // Nothing in the theme block declares this name — it redeclares four grounds and
        // stops. The swatch is purple because the formula resolved against those grounds
        // where it was used, which is the whole measurement item 1 turned on.
        expect(themed.red, 'the theme is purple').toBeGreaterThan(themed.green);
        expect(shipped.red, 'the default is blue').toBeLessThan(shipped.green);
    });

    it('meets the bar under a second theme — a theme with no story has no floor', async () => {
        await expectAccessible(await mountStory(Theme, meta, 'Theme'));
    });
});

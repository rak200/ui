import { derivedTokens, moreContrast, type DerivedToken, type Token } from './tokens.js';

/** A name a theme may set: a ground, or a derived role it overrides. */
type Named = Token | DerivedToken;

/**
 * A named set of decisions, as data, for {@link themeStyleSheet} to render.
 *
 * **The object `defaults`, `darkScheme` and `moreContrast` already are**, for a palette other
 * than the default one — RFC 0003. Data first and CSS second, because a target that is not CSS
 * reads the source rather than parsing a stylesheet back into values, which is what #24 records
 * as the thing to avoid.
 *
 * A theme carries no `scheme`: no shipped theme declines one, and a theme that wanted one would
 * gain an optional field, additively.
 */
export interface Theme {
    /** What `data-ui-theme` says to select it. */
    readonly name: string;
    /**
     * What it sets, at its value in the light scheme or in both — as `defaults` is. A derived
     * role belongs here only where the theme needs a different mix than the formula gives,
     * and then the floors measure what it wrote.
     */
    readonly values: Readonly<Partial<Record<Named, string>>>;
    /** The values that differ in the dark scheme, as `darkScheme` is. Colours only. */
    readonly dark?: Readonly<Partial<Record<Named, string>>>;
    /**
     * Its answer to `prefers-contrast: more`, a light and a dark value per name, as
     * `moreContrast` is.
     */
    readonly more?: Readonly<Partial<Record<Named, readonly [light: string, dark: string]>>>;
}

/** One declaration, a value with its dark one where it has one. */
function declare(name: string, light: string, dark: string | undefined): string {
    return `  ${name}: ${dark === undefined ? light : `light-dark(${light}, ${dark})`};`;
}

/**
 * A theme as CSS: its block under `[data-ui-theme='…']`, and its answer to
 * `prefers-contrast: more` after it.
 *
 * **Never emitted by `tokenStyleSheet()`**, so a host inserts the block for a theme it uses
 * and pays for no theme it never selects. Selecting one stays the attribute.
 *
 * **The answer resets the states the default palette's answer writes and the theme's leaves
 * out.** `tokenStyleSheet()` writes them under `more` at `:root`, and a value declared at
 * `:root` reaches every subtree — so under a theme it would paint the default palette's greys
 * over the theme's grounds. `initial` takes each back to its formula, which resolves against
 * the theme's own grounds where it is used. A ground needs no reset: one the theme declares
 * wins on its own element, and one it does not is the reader's setting, rightly inherited.
 */
export function themeStyleSheet(theme: Theme): string {
    const selector = `[data-ui-theme='${theme.name}']`;
    const values = Object.entries(theme.values).map(([name, light]) =>
        declare(name, light, theme.dark?.[name as Named]),
    );

    const answered = theme.more ?? {};
    const resets = derivedTokens.filter(
        (name) => name in moreContrast && !(name in answered) && !(name in theme.values),
    );
    const answer = [
        ...Object.entries(answered).map(([name, [light, dark]]) => declare(name, light, dark)),
        ...resets.map((name) => `  ${name}: initial;`),
    ].map((line) => `  ${line}`);

    return [
        `${selector} {\n${values.join('\n')}\n}`,
        `@media (prefers-contrast: more) {\n  ${selector} {\n${answer.join('\n')}\n  }\n}`,
    ].join('\n\n');
}

/**
 * Matrix: a terminal's green on near-black in the dark scheme, and the same idea on white in
 * the light one — RFC 0003 built it in both and kept both.
 *
 * The dark scheme is the reference's wherever the floors allow it: its green on `#050505`,
 * a monospace face, an 8px corner. On white that green is 1.37:1, so the text goes to a dark
 * green and the accent to a middle one, which keeps the derived black label legible on it.
 * Success is the theme's own green, where the default palette's would sit beside it as a
 * second one, and info a terminal's brighter cyan; both clear the 4.5:1 every outcome does.
 *
 * **The glow is the elevation step, so no name is added for it**: the card, the menu, the
 * toast and the tip already read `--ui-elevation-100`, and a glow is a shadow at no offset. A
 * shadow is not a colour, so `light-dark()` cannot carry two of them — but the part of a glow
 * that follows the scheme is its colour, and a colour inside a shadow can be `light-dark()`.
 * The strength the prototype settled on, 1.8, is folded into the alphas.
 *
 * Under `prefers-contrast: more` the green stays on the accent and the text goes to its pole.
 */
export const matrix: Theme = {
    name: 'matrix',
    values: {
        '--ui-color-surface': '#ffffff',
        '--ui-color-text': '#003b00',
        '--ui-color-accent': '#008f11',
        '--ui-color-focus': '#008f11',
        '--ui-color-success': '#00850f',
        '--ui-color-info': '#00778a',
        '--ui-font': "'Courier New', Courier, ui-monospace, monospace",
        '--ui-radius': '0.5rem',
        // 18% and 30% of the text rather than the formula's 16% and 26%: a green text is
        // far from neutral, and the formula's mix left the dark hover at 1.24:1 and the light
        // pressed 1.24 past the hover, under the 1.25 both owe. Written as values, so they
        // are data a target that is not CSS can read.
        '--ui-color-hover': '#cfd9ce',
        '--ui-color-pressed': '#b0c1ae',
        '--ui-elevation-100':
            '0 0 0 1px light-dark(rgb(0 143 17 / 0.54), rgb(0 255 0 / 0.45)), 0 0 18px light-dark(rgb(0 143 17 / 0.45), rgb(0 255 0 / 0.54))',
    },
    dark: {
        '--ui-color-surface': '#050505',
        '--ui-color-text': '#00ff00',
        '--ui-color-accent': '#00ff00',
        '--ui-color-focus': '#ccffcc',
        '--ui-color-success': '#00ff00',
        '--ui-color-info': '#00e5ff',
        '--ui-color-hover': '#11280f',
        '--ui-color-pressed': '#174315',
    },
    more: {
        '--ui-color-text': ['#000000', '#ffffff'],
    },
};

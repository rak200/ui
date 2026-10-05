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
    /**
     * What it makes translucent, in the shape `values` and `dark` take — set aside, because
     * a reader who asks for more contrast or for less transparency does not get it. Each name
     * then takes the theme's own value in `values`, opaque, or its default where the theme
     * gives none.
     */
    readonly translucent?: Pick<Theme, 'values' | 'dark'>;
}

/** One declaration, a value with its dark one where it has one. */
function declare(name: string, light: string, dark: string | undefined): string {
    return `  ${name}: ${dark === undefined ? light : `light-dark(${light}, ${dark})`};`;
}

/** Every declaration a set of values makes, each with its dark one. */
function declared(set: Pick<Theme, 'values' | 'dark'>): Map<string, string> {
    return new Map(
        Object.entries(set.values).map(([name, light]) => [
            name,
            declare(name, light, set.dark?.[name as Named]),
        ]),
    );
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
 *
 * **What it makes translucent stands down between the two**, under more contrast or reduced
 * transparency: each name goes back to the theme's opaque value, or with `initial` to its
 * default. A comma rather than a `not` around the translucent block, because a media feature
 * an engine does not know makes a `not` false there — and only Chromium knows reduced
 * transparency, so the glass would never show anywhere else. The answer to more contrast
 * comes after, so where it names one of these, it wins.
 */
export function themeStyleSheet(theme: Theme): string {
    const selector = `[data-ui-theme='${theme.name}']`;
    const opaque = declared(theme);
    const translucent = declared(theme.translucent ?? { values: {} });
    // One declaration per name: a translucent one takes the place of the opaque one.
    const values = new Map([...opaque, ...translucent]);
    const quiet = [...translucent.keys()].map(
        (name) => `  ${opaque.get(name) ?? `  ${name}: initial;`}`,
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
        `${selector} {\n${[...values.values()].join('\n')}\n}`,
        ...(quiet.length === 0
            ? []
            : [
                  `@media (prefers-contrast: more), (prefers-reduced-transparency: reduce) {\n  ${selector} {\n${quiet.join('\n')}\n  }\n}`,
              ]),
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
 * **The raised surfaces' glow is the elevation step**: the card, the menu, the toast and the
 * tip already read `--ui-elevation-100`, and a glow is a shadow at no offset. A shadow is not
 * a colour, so `light-dark()` cannot carry two of them — but the part of a glow that follows
 * the scheme is its colour, and a colour inside a shadow can be `light-dark()`. The strength
 * the prototype settled on, 1.8, is folded into the alphas. **The controls wear the same
 * ring and glow through `--ui-elevation-control`.** Both are written in `currentColor`, so
 * each surface and control lights them in its own colour: the accent's green, the danger on
 * an invalid control, and a toast's edge.
 *
 * Under `prefers-contrast: more` the green stays on the accent, and the text and the edge of
 * what floats over the page go to the text's pole.
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
        // A value in error written in the danger, inside its red edge: the default palette's
        // own danger, which this theme keeps, at 6.47:1 on the field's white and 7.37 on its
        // black.
        '--ui-color-text-invalid': '#b91c1c',
        '--ui-elevation-100':
            '0 0 0 1px light-dark(rgb(from currentColor r g b / 0.54), rgb(from currentColor r g b / 0.45)), 0 0 18px light-dark(rgb(from currentColor r g b / 0.45), rgb(from currentColor r g b / 0.54))',
        // The same ring and glow on every control, at the same strengths, so neither reads
        // weaker than the other. In the control's own colour, which is the accent's green
        // and the danger on an invalid one.
        '--ui-elevation-control':
            '0 0 0 1px light-dark(rgb(from currentColor r g b / 0.54), rgb(from currentColor r g b / 0.45)), 0 0 18px light-dark(rgb(from currentColor r g b / 0.45), rgb(from currentColor r g b / 0.54))',
        // Under the pointer the ring goes solid and the glow doubles, which stops at solid in
        // the dark: the fills' own hovers barely move in this green, so the glow says a
        // button is live.
        '--ui-elevation-control-hover':
            '0 0 0 1px currentColor, 0 0 18px light-dark(rgb(from currentColor r g b / 0.9), currentColor)',
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
        '--ui-color-text-invalid': '#f87171',
    },
    more: {
        '--ui-color-text': ['#000000', '#ffffff'],
        '--ui-color-border-overlay': ['#000000', '#ffffff'],
    },
};

/**
 * Glass: the raised surfaces frosted over whatever page is behind them, in both schemes —
 * RFC 0003 chose it by eye over pages harder than a host's, and closed it at what that page
 * rendered.
 *
 * **The glass is the scheme's pole at 0.20**, white in the light scheme and black in the
 * dark, behind a 10px blur that saturates what it lets through. Black rather than the dark
 * surface's blue-black, because at the same opacity it takes a lighter page. The surface
 * itself stays opaque, so every derivation that mixes it stays where the floors measured it.
 * The text goes to its pole and the accent to slate: text over frosted glass reads washed
 * out long before it measures as failing, and a saturated accent fights whatever colour the
 * page throws through.
 *
 * **The floor is a page, not an opacity.** What rests on the glass — the error message
 * first in the light scheme, the focus ring in the dark — holds its floor over a page no
 * darker than `#cecece` in the light scheme and no lighter than `#303030` in the dark, and
 * that is a condition on the host's page, which `docs/theme.md` states.
 *
 * Under more contrast or reduced transparency, glass stops being glass: what it makes
 * translucent stands down, and the edges and the toasts go to the text's pole.
 */
export const glass: Theme = {
    name: 'glass',
    values: {
        '--ui-color-text': '#000000',
        '--ui-color-accent': '#334155',
        // 20% and 32% of the text rather than the formula's 16% and 26%: a menu's items and a
        // toast's dismiss hover on the glass, and over the light page Glass holds over the
        // formula's hover stood 1.15:1 from it, under the 1.25 it owes. Opaque, as a state's
        // fill is, and written as values, as Matrix's are.
        '--ui-color-hover': '#bebebe',
        '--ui-color-pressed': '#989898',
    },
    dark: {
        '--ui-color-text': '#ffffff',
        '--ui-color-accent': '#94a3b8',
        '--ui-color-hover': '#393f4d',
        '--ui-color-pressed': '#535965',
    },
    translucent: {
        values: {
            '--ui-color-surface-raised': 'rgb(255 255 255 / 0.2)',
            '--ui-backdrop-raised': 'blur(10px) saturate(1.7)',
            // White at 0.45 on the light glass, where a dark glass's 0.16 would vanish into
            // it; softer than a line, which is what the derived border drew.
            '--ui-color-border-raised': 'rgb(255 255 255 / 0.45)',
            '--ui-color-border-overlay': 'rgb(255 255 255 / 0.45)',
            // A highlight along the top edge, and a soft drop under it.
            '--ui-elevation-100':
                'inset 0 1px 0 light-dark(rgb(255 255 255 / 0.6), rgb(255 255 255 / 0.2)), 0 8px 24px light-dark(rgb(0 0 0 / 0.08), rgb(0 0 0 / 0.33))',
            // A toast edged all round in its variant's colour, at the opacity the glass's
            // filled controls take.
            '--ui-color-toast-edge': 'rgb(from currentColor r g b / 0.8)',
            // A control's fill and a table's stripe at the glass's own opacity, each its own
            // colour — the surface and the stripe's mix of the text into it — with only the
            // opacity given up. Every edge stays opaque, so a field keeps the 3:1 its
            // boundary was chosen for.
            '--ui-color-surface-control': 'rgb(255 255 255 / 0.2)',
            '--ui-color-surface-muted': 'rgb(238 238 238 / 0.2)',
            // A checked control filled with the accent at 0.80, its mark drawn whole in the
            // accent's label. Opaque in `values`, which is what it stands down to.
            '--ui-color-accent': 'rgb(51 65 85 / 0.8)',
            // The primary button inverted, a light slate under a black label in the light
            // scheme and a dark one under a white label in the dark. A translucent accent moves
            // toward its own label, and Glass's sits at the far pole from the glass, so its
            // label is the glass's own pole: under 4.5:1 below 0.72. Inverted, the fill moves
            // away from the label instead, and each state moves on away from it. Inverted
            // everywhere, a checked box fell under 3:1 against the glass even opaque, so the
            // button alone takes it — RFC 0003.
            '--ui-color-primary': 'rgb(148 163 184 / 0.8)',
            '--ui-color-primary-contrast': '#000000',
            '--ui-color-primary-hover': 'rgb(160 174 192 / 0.8)',
            '--ui-color-primary-pressed': 'rgb(171 183 199 / 0.8)',
        },
        dark: {
            '--ui-color-surface-raised': 'rgb(0 0 0 / 0.2)',
            '--ui-color-border-raised': 'rgb(255 255 255 / 0.16)',
            '--ui-color-border-overlay': 'rgb(255 255 255 / 0.16)',
            '--ui-color-surface-control': 'rgb(17 24 39 / 0.2)',
            '--ui-color-surface-muted': 'rgb(26 33 48 / 0.2)',
            '--ui-color-accent': 'rgb(148 163 184 / 0.8)',
            '--ui-color-primary': 'rgb(51 65 85 / 0.8)',
            '--ui-color-primary-contrast': '#ffffff',
            '--ui-color-primary-hover': 'rgb(41 53 70 / 0.8)',
            '--ui-color-primary-pressed': 'rgb(34 44 59 / 0.8)',
        },
    },
    more: {
        '--ui-color-border-overlay': ['#000000', '#ffffff'],
        '--ui-color-toast-edge': ['#000000', '#ffffff'],
        // The neutral states the default palette's answer writes, because under more contrast
        // Glass's text and surface are the default's, at their poles. Handed back to the
        // formula instead, the hover over pure black is 1.08:1 from it, under the 1.25 it owes.
        '--ui-color-hover': ['#d9d9d9', '#282828'],
        '--ui-color-pressed': ['#c1c1c1', '#3d3d3d'],
        '--ui-color-surface-muted': ['#f2f2f2', '#141414'],
    },
};

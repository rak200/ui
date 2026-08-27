/**
 * Design tokens — the single source of truth for the visual language.
 *
 * They exist from day one because they are the only thing that reaches every target the
 * roadmap has: the web components below consume them as CSS custom properties, and a
 * native shell (RFC 0016, M4) can read the same values without the components. A token
 * added later is a token some target already hardcoded.
 *
 * Every token is a CSS custom property under `--ui-`, so a host overrides one by
 * setting it anywhere above the component — no build step, no theme object, no fork.
 */

/** The token names this package defines, as they appear in CSS. */
export const tokens = [
    '--ui-color-accent',
    '--ui-color-accent-contrast',
    '--ui-color-surface',
    '--ui-color-text',
    '--ui-color-focus',
    '--ui-color-danger',
    '--ui-radius',
    '--ui-space',
    '--ui-font',
] as const;

/** A CSS custom property this package defines. */
export type Token = (typeof tokens)[number];

/**
 * The default value of every token, applied at `:root` by {@link tokenStyleSheet}.
 *
 * These are deliberately plain and low-contrast-safe rather than branded: a design
 * system's defaults are what a host sees before it has decided anything.
 */
export const defaults: Readonly<Record<Token, string>> = {
    '--ui-color-accent': '#2563eb',
    '--ui-color-accent-contrast': '#ffffff',
    '--ui-color-surface': '#ffffff',
    '--ui-color-text': '#1f2937',
    // Amber-700 rather than the amber-500 this shipped with, and the change is a floor
    // rather than a preference: a focus ring is the visual information that identifies a
    // component's state, so WCAG 1.4.11 asks 3:1 against what it sits on. `#f59e0b`
    // against the default surface is 2.15:1 — and `outline-offset` puts the surface on
    // both sides of the ring, so the surface is what it is measured against, not the
    // button underneath. This value is 5.02:1 there and 3.53:1 on a dark surface, so it
    // clears the floor in either scheme. `tests/tokens.test.ts` holds the assertion,
    // because no axe rule does.
    '--ui-color-focus': '#b45309',
    '--ui-color-danger': '#b91c1c',
    '--ui-radius': '0.375rem',
    '--ui-space': '0.5rem',
    '--ui-font': 'system-ui, sans-serif',
};

/**
 * The grounds whose value differs when the page is rendered dark.
 *
 * **A scheme is not a theme, and conflating them is the mistake this shape exists to
 * avoid.** A theme is a named set of decisions, selected with `data-ui-theme`; a scheme is
 * the light or dark rendering of whichever theme is in force, selected with
 * `color-scheme`. The two axes are independent, and a token carries both of its schemes in
 * one value through `light-dark()`, so a theme is a handful of grounds rather than a
 * parallel block per scheme plus a media query nobody writes correctly the first time.
 *
 * `Partial` is the type doing the work: it answers *which grounds vary by scheme* in the
 * type system. `--ui-radius` does not vary and `--ui-color-surface` does, and folding both
 * schemes into {@link defaults} as a single expression would make those two
 * indistinguishable — and would hand a native emitter a CSS function to parse instead of a
 * value to read.
 *
 * Only colours appear here, and that is a rule rather than a coincidence: `light-dark()`
 * takes colours, so a dark value for `--ui-radius` would emit CSS the browser discards.
 */
export const darkScheme: Readonly<Partial<Record<Token, string>>> = {
    // Blue-400 over the dark surface rather than blue-600, which is legible on white and
    // muddy on charcoal. Its contrast pair is inverted with it: dark text on a light
    // accent is what reads at this end.
    '--ui-color-accent': '#60a5fa',
    '--ui-color-accent-contrast': '#111827',
    '--ui-color-surface': '#111827',
    '--ui-color-text': '#e5e7eb',
    // Red-700 is 2.74:1 on the dark surface — under the 4.5:1 floor for text, and error
    // text is the one thing in this set that must never be hard to read. Red-400 is 6.41.
    '--ui-color-danger': '#f87171',
};

/**
 * The token defaults as a CSS rule, for a host that wants them without importing a
 * component. Returns the text of a `:root` block; a host inserts it however it prefers.
 *
 * **It declares `color-scheme` as well as the tokens, and that is deliberate.**
 * `color-scheme` is a real property rather than a custom one, so it can never be a token —
 * and leaving it to the host is a silent failure at the highest possible frequency: every
 * host would have to remember, and forgetting means dark mode simply never happens, with
 * no error anywhere to read. A host who wants something else — `only light`, say — governs
 * the order this sheet is inserted in, which is a knob they already hold.
 */
export function tokenStyleSheet(): string {
    const body = tokens
        .map((token) => {
            const dark = darkScheme[token];

            return `  ${token}: ${dark === undefined ? defaults[token] : `light-dark(${defaults[token]}, ${dark})`};`;
        })
        .join('\n');

    return `:root {\n  color-scheme: light dark;\n${body}\n}`;
}

/** Canary probe for RFC 0017 step 5 — an exported symbol absent from docs/. */
export const canaryProbe = 'undocumented';

/**
 * Design tokens — the single source of truth for the visual language.
 *
 * They exist from day one because they are the only thing that reaches every target the
 * roadmap has: the web components below consume them as CSS custom properties, and a
 * native shell (RFC 0016, M4) can read the same values without the components. A token
 * added later is a token some target already hardcoded.
 *
 * Every token is a CSS custom property under `--rak-`, so a host overrides one by
 * setting it anywhere above the component — no build step, no theme object, no fork.
 */

/** The token names this package defines, as they appear in CSS. */
export const tokens = [
    '--rak-color-accent',
    '--rak-color-accent-contrast',
    '--rak-color-surface',
    '--rak-color-text',
    '--rak-color-focus',
    '--rak-radius',
    '--rak-space',
    '--rak-font',
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
    '--rak-color-accent': '#2563eb',
    '--rak-color-accent-contrast': '#ffffff',
    '--rak-color-surface': '#ffffff',
    '--rak-color-text': '#1f2937',
    '--rak-color-focus': '#f59e0b',
    '--rak-radius': '0.375rem',
    '--rak-space': '0.5rem',
    '--rak-font': 'system-ui, sans-serif',
};

/**
 * The token defaults as a CSS rule, for a host that wants them without importing a
 * component. Returns the text of a `:root` block; a host inserts it however it prefers.
 */
export function tokenStyleSheet(): string {
    const body = tokens.map((token) => `  ${token}: ${defaults[token]};`).join('\n');

    return `:root {\n${body}\n}`;
}

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
 * The token defaults as a CSS rule, for a host that wants them without importing a
 * component. Returns the text of a `:root` block; a host inserts it however it prefers.
 */
export function tokenStyleSheet(): string {
    const body = tokens.map((token) => `  ${token}: ${defaults[token]};`).join('\n');

    return `:root {\n${body}\n}`;
}

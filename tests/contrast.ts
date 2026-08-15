/**
 * The contrast floor axe has no rule for.
 *
 * `tests/a11y.ts` runs axe over the WCAG A/AA tags, and two of the three floors that bear
 * on a token's value are active there and free: `color-contrast` for text (1.4.3) and
 * `target-size` for pointer targets (2.5.8). The third is **1.4.11 non-text contrast** —
 * 3:1 for the visual information that identifies a component or its state — and
 * **axe-core has no rule for it**. Filtered to the five tags the ruleset declares, 70
 * rules are active and none of them is this one.
 *
 * So it is enforced here or it is not enforced at all, which is exactly what a focus ring
 * shipped at 2.15:1 for two releases demonstrates. Hand-written beside the axe assertion
 * rather than instead of it: axe still owns everything axe can see.
 *
 * **This checks the token layer's own values, not a rendering.** It answers *is this
 * default legal against that default*, which is a question about two strings and needs no
 * browser. Whether a component then paints them adjacent to each other is what the story
 * suite is for.
 */

/** A six-digit hex colour, which is the only form a token's colour default takes. */
const HEX = /^#[0-9a-f]{6}$/i;

/**
 * The relative luminance of a colour, per WCAG 2.x.
 *
 * @param colour - A six-digit hex string. Anything else throws rather than resolving to a
 * number that would silently make a floor look satisfied.
 */
function luminance(colour: string): number {
    if (!HEX.test(colour)) {
        throw new Error(`not a six-digit hex colour: ${colour}`);
    }

    const [red, green, blue] = [1, 3, 5].map((offset) => {
        const channel = Number.parseInt(colour.slice(offset, offset + 2), 16) / 255;

        return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];

    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/**
 * The WCAG contrast ratio between two colours, from 1 to 21.
 *
 * Order does not matter — the ratio is symmetric, and writing it as *foreground against
 * background* at the call site is for the reader rather than for the arithmetic.
 */
export function contrastRatio(one: string, other: string): number {
    const [lighter, darker] = [luminance(one), luminance(other)].sort((a, b) => b - a) as [
        number,
        number,
    ];

    return (lighter + 0.05) / (darker + 0.05);
}

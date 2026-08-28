/**
 * How a component writes a token, and the only way one should.
 *
 * Every `var(--ui-*, fallback)` used to carry a hand-copied literal — thirteen of them
 * across two components, all agreeing, none compared to anything. A fallback only shows
 * when the `:root` block is absent, so the first copy to disagree would have done it
 * invisibly. Generated from `defaults` and `formulas`, a fallback stops being a value that
 * *can* drift and becomes one that cannot.
 *
 * **For a derived name the fallback is the formula, and that placement is the whole of
 * RFC 0002's item 1.** A derivation resolves where it is *used*, against the grounds in
 * force at that element — so a component in a dark subtree, or under a second theme, mixes
 * against that subtree's grounds without either being restated. Declared beside the
 * grounds instead, it would resolve once at `:root` and freeze; `src/tokens.ts` carries
 * that measurement beside {@link formulas}.
 *
 * **This module exists because `src/tokens.ts` imports no Lit, and must not start.** That
 * module is what a native shell reads, and a target that is not the web cannot take a
 * dependency on a web renderer to find out what a colour is. `unsafeCSS` is what forces
 * the split, and it is safe here in the only sense that matters: every argument it ever
 * receives is this package's own literal, from a record the compiler keeps exhaustive.
 *
 * Internal — it is not re-exported from `src/index.ts`, because what a consumer overrides
 * is the token, never the reference to it.
 */

import { unsafeCSS, type CSSResult } from 'lit';
import { defaults, derivedTokens, formulas, type DerivedToken, type Token } from './tokens.js';

/** Whether a name is computed rather than declared, which decides where its fallback comes from. */
function isDerived(name: Token | DerivedToken): name is DerivedToken {
    return (derivedTokens as readonly string[]).includes(name);
}

/**
 * A token as a component reads it: the custom property, with the package's own value
 * behind it.
 *
 * ```ts
 * css`button { border-radius: ${reference('--ui-radius')}; }`;
 * // → button { border-radius: var(--ui-radius, 0.375rem); }
 * ```
 *
 * @param name - A ground or derived token. The fallback is that token's default where it
 * has one and its formula where it does not.
 */
export function reference(name: Token | DerivedToken): CSSResult {
    return unsafeCSS(`var(${name}, ${isDerived(name) ? formulas[name] : defaults[name]})`);
}

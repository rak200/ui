/**
 * Which effect runs, as RFC 0004 decided it: a choice a consumer writes, a taste a theme writes
 * where nobody chose, and the query a component draws each effect it offers under.
 *
 * **Three kinds of `--ui-` name live here, and none of them is a token.** A token has a default
 * at `:root` and a category its value is checked against. These have neither: a choice is
 * unwritten until a consumer writes one, a taste until a theme does, and the properties an effect
 * animates are this package's own state, which a host is never meant to set. `tests/tokens.test.ts`
 * refuses any `--ui-` name in a component's sheet that is neither a token nor of one of these
 * kinds, so a fourth cannot enter by accident.
 *
 * **This module imports no Lit, and imports nothing at all**, for the reason `src/reference.ts`
 * gives for `src/tokens.ts`: `src/tokens.ts` and `src/theme.ts` read the taste's shape and names
 * from here, and both are data a target that is not the web reads too. A component wraps the
 * query in `unsafeCSS` where it draws one.
 *
 * Internal — it is not re-exported from `src/index.ts`, but for {@link Taste}, which is a theme's
 * shape: what a consumer writes is the property, never the code that builds its name.
 */

/**
 * What a theme chooses where a consumer has chosen nothing — RFC 0004's taste: an effect for a
 * moment on every component, and for one component apart from the page.
 *
 * Read only where no choice is written, so any choice a consumer makes, at any scope, runs
 * instead. The names are a moment's and an effect's, as a component offers them; one a component
 * does not offer runs nothing there, and the component does what it does today.
 */
export interface Taste {
    /** The effect each moment runs on every component that offers it, by moment. */
    readonly page?: Readonly<Record<string, string>>;
    /**
     * The effect a moment runs on one component, by the component's tag less `ui-`, over the
     * page's.
     */
    readonly components?: Readonly<Record<string, Readonly<Record<string, string>>>>;
}

/**
 * The prefix of each kind of name that is not a token.
 *
 * - `choice` — `--ui-motion-<moment>`, the effect a consumer chooses for a moment, at any scope:
 *   inherited, so the page, a region, a component type and one instance choose apart and the
 *   narrowest wins.
 * - `taste` — `--ui-taste-<moment>` and `--ui-taste-<component>-<moment>`, the effect a theme
 *   chooses for the page and for one component, read only where no choice is written.
 * - `animated` — `--ui-fx-<name>`, a property an effect animates. Only this package writes one,
 *   and a host that sets one changes an effect partway through drawing it.
 */
export const kinds = {
    choice: '--ui-motion-',
    taste: '--ui-taste-',
    animated: '--ui-fx-',
} as const;

/**
 * The condition one component draws an effect under, written inside `@container`.
 *
 * True where the consumer chose that effect for the moment at any scope; or, where they chose
 * nothing, where the component's own taste names it; or, where that is unwritten too, where the
 * page's taste does. A choice of any other name — `none`, an effect the component does not offer,
 * a misspelling — matches no query, so the component does what it does today: a choice costs the
 * effect and nothing else. The queries ask the element's ancestors, never the element itself, so
 * an effect drawn on a host misses a choice written on that host alone — RFC 0004's S8.
 *
 * Each `not` sits in parentheses of its own, which the grammar asks for: without them Chromium
 * and WebKit dropped the rule and Firefox read only its first half — measured for RFC 0004.
 *
 * ```ts
 * const is = query('button');
 * css`@container ${unsafeCSS(is('hover-shadow', 'raise'))} { … }`;
 * ```
 *
 * @param component - The component's tag less `ui-`, which names its own taste.
 */
export function query(component: string): (moment: string, effect: string) => string {
    return (moment, effect) => {
        const chosen = `${kinds.choice}${moment}`;
        const own = `${kinds.taste}${component}-${moment}`;
        const page = `${kinds.taste}${moment}`;

        return `(style(${chosen}: ${effect}) or ((not style(${chosen})) and (style(${own}: ${effect}) or ((not style(${own})) and style(${page}: ${effect})))))`;
    };
}

/**
 * A taste as CSS: its declarations under `:where()` of `selector`, the page's moments first and
 * then each component's, or an empty string where the taste names none.
 *
 * **Under `:where()`, so the block has no specificity**: a rule a host writes for a taste
 * outweighs it whatever order the sheets are in, as a host's choice already does by being a
 * different property. `tokenStyleSheet()` writes the default theme's at `:root`, and
 * `themeStyleSheet()` a shipped theme's under the attribute that selects it.
 */
export function tasteBlock(selector: string, taste: Taste | undefined): string {
    const page = Object.entries(taste?.page ?? {}).map(
        ([moment, effect]) => `  ${kinds.taste}${moment}: ${effect};`,
    );
    const components = Object.entries(taste?.components ?? {}).flatMap(([component, moments]) =>
        Object.entries(moments).map(
            ([moment, effect]) => `  ${kinds.taste}${component}-${moment}: ${effect};`,
        ),
    );
    const lines = [...page, ...components];

    return lines.length === 0 ? '' : `:where(${selector}) {\n${lines.join('\n')}\n}`;
}

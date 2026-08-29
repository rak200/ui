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
 *
 * **The exported set splits in two, and the split is the shape of RFC 0002.** {@link tokens}
 * are *ground*: they carry a literal default and are emitted at `:root`.
 * {@link derivedTokens} are computed from the grounds by a {@link formulas | formula} and
 * are **never** emitted there — a derivation declared beside its grounds resolves once and
 * freezes, which is measured rather than feared.
 */

/**
 * The token names this package defines, as they appear in CSS — the *ground* half: the
 * names that have a default and are emitted at `:root`.
 *
 * It is not called `groundTokens`, and that is a cost rather than an oversight: renaming
 * an exported name is breaking, and Layer 1 would spend a major on it. So the pair reads
 * asymmetrically and this one carries the documented meaning *the names that have a
 * default*.
 *
 * **The set is open, and that is a promise rather than an accident.** It grows as
 * components arrive — a category enters with the pull request of the component that
 * consumes it — so asserting completeness over it asserts something this package does not
 * offer. Adding a name is a `feat`, never a break, and it costs nothing at runtime; what
 * it does break is code that **enumerates** the set, an exhaustive `Record<Token, string>`
 * above all. The supported shape is the partial map, which is what a theme is anyway.
 */
export const tokens = [
    '--ui-color-accent',
    '--ui-color-accent-contrast',
    '--ui-color-surface',
    '--ui-color-text',
    '--ui-color-focus',
    '--ui-color-danger',
    // The dim behind a modal, and a *ground* rather than a derivation even though every
    // other neutral here is derived. A derived neutral mixes toward the text, which is
    // what makes one formula right in both schemes — and it is exactly wrong for this
    // one: on a dark page the text is the light pole, so the mix would *lighten* the
    // page behind the dialog instead of dimming it. A scrim dims in both schemes, so it
    // carries a literal and appears in neither `darkScheme` nor `formulas`.
    //
    // **This departs from RFC 0002**, whose survey of the queued components answered
    // *text at an alpha* for this role. That table asks whether a role needs a new hue,
    // and the answer to that question is still no — what it could not weigh, with no
    // overlay yet written to judge against, is which pole the mix should run toward. The
    // proposal says so in the same breath: read as a judgement, not a measurement.
    '--ui-color-scrim',
    '--ui-radius',
    '--ui-space',
    '--ui-font',
    // Motion, and it arrives with the component that consumes it rather than with the
    // twelve that might: `ui-button` accepts interaction and until now showed no feedback
    // for it, which is a defect rather than a gap.
    //
    // The duration is a *step* in a scale, named by an ordinal with gaps so that inserting
    // `--ui-duration-150` later is additive rather than a rename. No component reads it —
    // they read `--ui-duration-state`, which points in here. Easing has no scale under it,
    // because a curve is qualitative rather than relative, so its purpose name *is* the
    // ground and a component reads it directly.
    '--ui-duration-100',
    '--ui-easing-state',
    // The pair `--ui-easing-state` promised, arriving with the overlay that has an enter
    // and an exit to name — `ui-dialog`. A state change reverses mid-flight and wants a
    // symmetric curve; an overlay does not reverse, it arrives and it leaves, and the two
    // directions are asked to feel different on purpose.
    //
    // No duration steps come with them. The scale is ordinal with gaps precisely so a step
    // can be inserted when something needs one, and the dialog needs no duration the state
    // step does not already give it — inventing `--ui-duration-200` before a component
    // judges it against something is the claim ROADMAP.md declines to make about Zag.
    '--ui-easing-enter',
    '--ui-easing-exit',
] as const;

/** A CSS custom property this package defines and gives a default. */
export type Token = (typeof tokens)[number];

/**
 * The roles computed from the grounds rather than declared beside them.
 *
 * **These are write-only.** A host may override one, and every component picks the
 * override up; nothing can read one back, because a derived name has no declared value —
 * only a {@link formulas | formula} that lives in the `var()` fallback at the point of
 * use. That is the one cost of the derivation that a consumer can be surprised by, and
 * what it buys is an override surface a host can hold in their head: change the accent and
 * the hover and pressed colours follow, rather than being one more name each.
 */
export const derivedTokens = [
    '--ui-duration-state',
    // The boundary of a control, and the text inside one that is not a value yet. Both
    // arrive with `ui-input`, and both are the same mix at different strengths — which is
    // what makes them one category rather than two: a border and a placeholder are the
    // surface travelling toward the text, stopped at the contrast each one owes.
    //
    // The percentages are read off a measurement rather than chosen. A control's boundary
    // is what identifies the component, so WCAG 1.4.11 asks 3:1 against the surface, and
    // a placeholder is text, so 1.4.3 asks 4.5:1. `tests/tokens.test.ts` holds both.
    '--ui-color-border',
    '--ui-color-text-muted',
    // `hover` matches the pseudo-class it answers to; `pressed` deliberately does not —
    // `--ui-color-active` would read as *the active item* as readily as *the pressed
    // control*, and the role this implements was named `accent hover / pressed`.
    '--ui-color-hover',
    '--ui-color-pressed',
    '--ui-color-accent-hover',
    '--ui-color-accent-pressed',
] as const;

/** A CSS custom property this package computes rather than declares. */
export type DerivedToken = (typeof derivedTokens)[number];

/**
 * The default value of every ground token, applied at `:root` by {@link tokenStyleSheet}.
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
    // Half black. Enough to push the page behind a modal out of the reading order for the
    // eye as well as for the accessibility tree, and not so much that the context a modal
    // is *about* stops being visible. The alpha is the whole point, so this is the one
    // default that is not an opaque hex.
    '--ui-color-scrim': 'rgb(0 0 0 / 0.5)',
    '--ui-radius': '0.375rem',
    '--ui-space': '0.5rem',
    '--ui-font': 'system-ui, sans-serif',
    // The ordinal is a position, not a millisecond count, and the value is chosen so that
    // the two cannot be confused: `--ui-duration-100: 100ms` would teach a reader an
    // arithmetic that breaks the moment a second step is anything but 200ms.
    '--ui-duration-100': '150ms',
    // Symmetric, because a state transition reverses mid-flight: the pointer leaves a
    // button while the hover is still arriving, and an asymmetric curve makes the return
    // trip visibly different from the outbound one. The keyword rather than the
    // `cubic-bezier` it stands for — nothing here needs a curve the platform has no name
    // for. `enter` will want an ease-out and `exit` an ease-in, and they arrive with the
    // overlays that have an enter and an exit to name.
    '--ui-easing-state': 'ease-in-out',
    // Fast out of the gate and settling at the end, which is what makes an arriving
    // overlay feel like it was already on its way. The exit is its mirror: slow to let go
    // and quick to be gone, so a dismissal does not linger over a decision already made.
    '--ui-easing-enter': 'ease-out',
    '--ui-easing-exit': 'ease-in',
};

/**
 * A ground as it is written inside a formula: the name, with its own default behind it.
 *
 * **The default is not decoration.** A formula only ever runs as the fallback of a name
 * nobody declared, which is precisely the page that inserted no `:root` block — and a bare
 * `var(--ui-color-text)` there is invalid at computed-value time, which takes the whole
 * `color-mix()` down with it and leaves the declaration unset. Measured, as a transparent
 * hover on a page that had declared nothing. So a derivation carries its grounds' defaults
 * exactly the way a component carries them.
 */
function ground(name: Token): string {
    return `var(${name}, ${defaults[name]})`;
}

/** `amount`% of `foreground` mixed into `background`, in a perceptual space. */
function mix(foreground: Token, amount: number, background: Token): string {
    return `color-mix(in oklab, ${ground(foreground)} ${String(amount)}%, ${ground(background)})`;
}

/**
 * How each derived role computes when the host has not set it.
 *
 * **Never emitted at `:root`, and this is the one measured failure of the whole design
 * rather than a caution:**
 *
 * ```css
 * :root {
 *   --ui-color-hover: color-mix(in oklab, var(--ui-color-text) 8%, var(--ui-color-surface));
 * }
 * ```
 *
 * That resolves *once*, against the grounds in force at `:root`, and freezes. A dark
 * subtree then inherits the light mix — a near-white hover on charcoal — with nothing to
 * read anywhere. The formula belongs in the `var()` fallback at the point of use, where it
 * resolves against the grounds in force *there*, which is what makes a derived role follow
 * a theme and a scheme without being restated in either. `src/reference.ts` is what writes
 * it, and `tests/tokens.test.ts` gates the rule rather than trusting this comment.
 *
 * Composed rather than written out, because a formula is data about *which* grounds a role
 * mixes and in what proportion — and a hand-written string can name a token that does not
 * exist, or forget the default above, and CSS reports either by rendering nothing.
 *
 * Exported because a target that is not CSS cannot evaluate `color-mix()` and has to
 * resolve these itself, frozen per theme, from the same source the components read.
 */
export const formulas: Readonly<Record<DerivedToken, string>> = {
    // A formula may be a plain reference. A purpose points into the scale; the scale is
    // where the number lives, and a host who wants slower state changes moves the step.
    '--ui-duration-state': ground('--ui-duration-100'),
    // Mixing toward the text rather than toward black or white is what makes one formula
    // right in both schemes: text is always the far pole from surface, so the mix darkens
    // on a light page and lightens on a dark one, without either being named. The contrast
    // against whatever sits on top rises either way rather than falling.
    '--ui-color-hover': mix('--ui-color-text', 8, '--ui-color-surface'),
    '--ui-color-pressed': mix('--ui-color-text', 14, '--ui-color-surface'),
    '--ui-color-accent-hover': mix('--ui-color-text', 12, '--ui-color-accent'),
    '--ui-color-accent-pressed': mix('--ui-color-text', 22, '--ui-color-accent'),
    // 3.39:1 on the light surface and 3.96:1 on the dark one, against a floor of 3. The
    // step below clears neither — 45% is 2.94 in light, which is what a value chosen by
    // eye would have shipped.
    '--ui-color-border': mix('--ui-color-text', 50, '--ui-color-surface'),
    // 5.24:1 and 6.07:1, against a floor of 4.5. Not the 60% that first cleared it: that
    // is 4.52 in light, a rounding error from failing, and a default nobody could then
    // retune without breaking a floor they were not thinking about.
    '--ui-color-text-muted': mix('--ui-color-text', 65, '--ui-color-surface'),
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

/** The category every duration name shares, which is what reduced motion collapses. */
const duration = '--ui-duration-';

/**
 * The token defaults as a CSS rule, for a host that wants them without importing a
 * component. Returns the text of a `:root` block and the reduced-motion rule beside it; a
 * host inserts them however it prefers.
 *
 * **It declares `color-scheme` as well as the tokens, and that is deliberate.**
 * `color-scheme` is a real property rather than a custom one, so it can never be a token —
 * and leaving it to the host is a silent failure at the highest possible frequency: every
 * host would have to remember, and forgetting means dark mode simply never happens, with
 * no error anywhere to read. A host who wants something else — `only light`, say — governs
 * the order this sheet is inserted in, which is a knob they already hold.
 *
 * **Reduced motion is honoured here, once, rather than in each component.** A component
 * reads `--ui-duration-state` and never learns why it changed, which is the argument for
 * motion being tokens rather than literals: a hardcoded `150ms` is not merely
 * un-overridable, it is an accessibility defect every component would have to fix on its
 * own. The block declares the *derived* duration names as well as the ground ones — the
 * only place either may appear at `:root`, and legal there precisely because what it
 * declares is a literal rather than a formula. Without it, a host who tuned
 * `--ui-duration-state` would keep their motion through the collapse, and the setting
 * would be honoured for everyone except the people who had touched it.
 */
export function tokenStyleSheet(): string {
    const grounds = tokens
        .map((token) => {
            const dark = darkScheme[token];

            return `  ${token}: ${dark === undefined ? defaults[token] : `light-dark(${defaults[token]}, ${dark})`};`;
        })
        .join('\n');

    // Not zero, and the difference is not cosmetic: a zero-length transition fires no
    // `transitionstart` and no `transitionend`, measured, so a component that awaits the
    // end of one before removing itself waits forever — and only for the people who asked
    // for less motion. At `0.01ms` the lifecycle still runs; the time is what goes.
    const collapsed = [...tokens, ...derivedTokens]
        .filter((token) => token.startsWith(duration))
        .map((token) => `    ${token}: 0.01ms;`)
        .join('\n');

    return [
        `:root {\n  color-scheme: light dark;\n${grounds}\n}`,
        `@media (prefers-reduced-motion: reduce) {\n  :root {\n${collapsed}\n  }\n}`,
    ].join('\n\n');
}

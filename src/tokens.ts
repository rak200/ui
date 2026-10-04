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
    '--ui-color-surface',
    '--ui-color-text',
    '--ui-color-focus',
    '--ui-color-danger',
    // The other two outcomes, arriving with `ui-toast` — the component `ROADMAP.md` said
    // would bring them. They complete a set `--ui-color-danger` has been half of since the
    // first field: a form told you what went wrong and had no way to say that anything
    // went right.
    //
    // Grounds rather than derivations, and for the reason `--ui-color-danger` is one: a
    // hue cannot be mixed out of the grounds that exist. Both are values a host is
    // expected to replace with their own brand's, which is what a ground is for.
    '--ui-color-success',
    '--ui-color-warning',
    // The fourth outcome, the one that is neither good nor bad news, arriving with the
    // toast that reads it. It read the accent before, which made a notice the buttons'
    // colour in the default palette and a second green beside success in a green one —
    // RFC 0003. A ground for the reason the other three are.
    '--ui-color-info',
    // The edge of a toast, arriving with the answer to more contrast, which edges a toast in
    // the text — RFC 0003. Its default is `currentColor`, and a toast's colour is its
    // variant's, so each variant is edged in its own outcome colour with no formula per
    // variant. Set, it edges every variant in that one colour, and a theme's glow on a toast
    // is lit in it too.
    '--ui-color-toast-edge',
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
    // judges it against something is a claim this package does not make.
    '--ui-easing-enter',
    '--ui-easing-exit',
    // The icon category, arriving with `ui-icon` rather than with the twelve components
    // that will eventually hold one. Two names, because an adopted set has exactly two
    // knobs that decide whether it looks like it belongs: how big a glyph is drawn and
    // how heavy its stroke is.
    //
    // The size is in `em` rather than `rem` or pixels, so an icon beside a word is the
    // size of that word — the placement that dominates. A host who wants a fixed size
    // sets one; a host who wants it to follow the text gets that without asking.
    //
    // The stroke is unitless on purpose. It is a `stroke-width` against a 24-unit
    // viewBox, so it scales with the glyph rather than staying two device pixels at every
    // size, and 2 is the weight the adopted set is drawn at.
    '--ui-icon-size',
    '--ui-icon-stroke',
    // Elevation, arriving with `ui-card` — the category `ROADMAP.md` said would, after the
    // first overlay arrived and brought none.
    //
    // A step in a scale, named by an ordinal with gaps, for the reason the duration scale
    // gives above: elevation is *relative* by nature — a card sits above the page, a menu
    // above the card — so the names have to be able to grow between each other. No
    // component reads this one; they read `--ui-elevation-raised`, which points in here.
    // No second step comes with it: a tooltip and a menu are the components that would
    // judge one, and neither is written.
    //
    // **It carries no dark value, and cannot.** `darkScheme` is emitted through
    // `light-dark()`, which takes colours — and a shadow is not a colour. So this is one
    // value in both schemes, and on a dark page it does almost nothing: black on charcoal
    // is black. What separates a raised surface there is the *boundary*, which is derived
    // and therefore already scheme-correct — which is why `src/card.ts` draws both and
    // says so beside them.
    '--ui-elevation-100',
    // The glow a theme lights a control with, arriving with Matrix under RFC 0003's second
    // clause: a category a shipped theme brings whose default is the identity, so the
    // default palette renders as before. A ground rather than a purpose pointing into the
    // scale, because a control is not raised and `none` is no step of it.
    //
    // **A theme writes it in `currentColor`**, and the box that draws it sets its own colour
    // to the accent, or to the danger when the control is invalid — so one value lights
    // every control in its state's colour. `ARCHITECTURE.md` says why a named colour would not.
    '--ui-elevation-control',
    // The type scale, arriving with `ui-table` — the category `ROADMAP.md` said would, and
    // the last one the v0 surface expects. It arrives to fix a defect rather than to
    // anticipate one: `font-size: 0.875em` was written out in three places across the form
    // controls and `src/tooltip.ts`, all three agreeing and nothing comparing them — the shape
    // `src/reference.ts` records finding in thirteen hand-copied fallbacks, and the thing
    // `ARCHITECTURE.md` forbids in writing, since a hardcoded value is a decision a host
    // cannot override.
    //
    // A step in a scale, ordinal with gaps, for the reason the duration and elevation
    // scales give above: a size is *relative* by nature, so the names have to be able to
    // grow between each other. It follows the scale-and-purpose shape rather than easing's
    // purpose-is-the-ground shape, and that split is item 9's: a curve is qualitative, a
    // size is not. No component reads this one; they read `--ui-text-supporting`.
    //
    // The unit is `em` rather than `rem`, for the reason `--ui-icon-size` is: the role is
    // text set *beside* other text, so it should be a fraction of whatever that text is
    // rather than a fraction of the root. A host who wants a fixed size sets one.
    //
    // **The ordinal ascends with the size**, so `100` is the smallest step this package has
    // needed and a body or heading step later is `200` or `300`. Neither is invented here:
    // every component sets `font: inherit` and takes the page's own size, which is the
    // right default and not a step at all.
    '--ui-text-100',
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
    // The edge of what floats over the page — the dialog, the tip and the open menu — apart
    // from a control's boundary, because the answer to `prefers-contrast: more` edges the
    // first in the text and leaves the second where its floor put it — RFC 0003. Its default
    // is the boundary's, so the default palette renders as before.
    '--ui-color-border-overlay',
    // The value written in a field that is in error, arriving with Matrix, which writes it in
    // the danger — RFC 0003. The text by default, so the default palette renders as before:
    // a field's boundary, its glow and its message already say it is wrong.
    '--ui-color-text-invalid',
    // `hover` matches the pseudo-class it answers to; `pressed` deliberately does not —
    // `--ui-color-active` would read as *the active item* as readily as *the pressed
    // control*, and the role this implements was named `accent hover / pressed`.
    '--ui-color-hover',
    '--ui-color-pressed',
    // The text on the accent, derived from it so a host who moves the accent moves the
    // label with it — RFC 0003. It was a ground until then, and a host's accent with the
    // default label beside it was a pair nothing measured.
    '--ui-color-accent-contrast',
    '--ui-color-accent-hover',
    '--ui-color-accent-pressed',
    // The purpose the elevation scale is read through, arriving with `ui-card`. `raised`
    // is a role rather than a component: a card is the first surface lifted off the page
    // and will not be the last, and the name a host retunes should not be the name of
    // whichever component happened to need it first.
    '--ui-elevation-raised',
    // The glow a button lights to under the pointer, arriving with Matrix beside the glow it
    // lights from. Derived from that one, so a theme that writes only the resting glow keeps
    // it under the pointer rather than losing it, and the default palette lights nothing.
    '--ui-elevation-control-hover',
    // The purpose the type scale is read through, and the only name a component writes.
    // `supporting` is a role rather than a size and rather than a component: the four
    // places that want it are a field's help text, a field's error, a tooltip's tip and a
    // table's caption, and what unites them is that each explains the thing beside it. A
    // `--ui-text-small` here would be `--ui-color-blue-600` for type, which item 9 rejects
    // in as many words.
    '--ui-text-supporting',
    // A second surface tone: the same plane, tinted only enough to group. A table stripes
    // its rows with it and rests its header on it.
    //
    // **Not `--ui-color-hover`, which is the same kind of value at a different strength.**
    // A token name says what it answers to, and a zebra row answers to nothing — reading
    // the hover colour for it is the reverse engineering item 9 names as the cost of value
    // names. It also sits deliberately *below* that value, so an interactive layer drawn
    // over a striped row is still a change rather than a coincidence.
    //
    // The pairing with `--ui-color-text-muted` is the point of the name: this package
    // already says `muted` for *the same role, one step back*, and a second vocabulary for
    // the surface half would be one more thing for a host to learn.
    '--ui-color-surface-muted',
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
    // Green-700 and amber-700, each the darkest step of its hue that still reads as that
    // hue. Both clear **4.5:1** against the surface rather than the 3:1 a coloured edge
    // would owe, because the floor a value has to clear is the strictest use it is put to
    // and nothing stops a host using one as text — `--ui-color-danger` was chosen the same
    // way and is text in every control's message today.
    //
    // The warning is the same amber as `--ui-color-focus`, and the two arrived at it
    // independently: both are *the darkest amber that clears its floor in both schemes*,
    // and that question has one answer. They stay separate names because they are separate
    // knobs — a host who retunes the focus ring has said nothing about warnings.
    '--ui-color-success': '#15803d',
    '--ui-color-warning': '#b45309',
    // Cyan-700, the step the other outcomes take, and held to their floor: 5.36:1.
    '--ui-color-info': '#0e7490',
    // The colour of the toast it edges, which is its variant's.
    '--ui-color-toast-edge': 'currentColor',
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
    '--ui-icon-size': '1.25em',
    '--ui-icon-stroke': '2',
    // Two layers rather than one, which is what makes a shadow read as *lift* instead of
    // as a smudge: a tight, nearly opaque one draws the contact edge, and a wider, softer
    // one is the cast. Both are black at a low alpha, so the shadow darkens whatever it
    // falls on rather than tinting it — a coloured shadow is a decision this layer would
    // have to defend at every hue a host might set.
    '--ui-elevation-100': '0 1px 2px -1px rgb(0 0 0 / 0.1), 0 2px 6px -1px rgb(0 0 0 / 0.1)',
    '--ui-elevation-control': 'none',
    // The value the three hardcoded sites already carried, adopted rather than re-chosen:
    // this token exists to make an existing decision overridable, and changing it in the
    // same breath would hide whether the extraction was faithful. 87.5% is 14px against a
    // 16px page, which is the smallest size in wide use that is still ordinary body text
    // rather than fine print.
    '--ui-text-100': '0.875em',
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
 * A ground's relative luminance, as relative colour syntax reads it: the WCAG weights over
 * the linear channels. Written out wherever a formula needs it, because a CSS value has no
 * variable of its own.
 */
const luminance = '(0.2126 * r + 0.7152 * g + 0.0722 * b)';

/** 1 where `expression` is above zero and 0 where it is not — a step, as CSS can write one. */
function step(expression: string): string {
    return `clamp(0, (${expression}) * infinity, 1)`;
}

/**
 * White or black, read off `name` by `channel`: the one number written into all three linear
 * channels, so 1 is white and 0 is black, and nothing between is ever produced by a step.
 */
function pole(name: Token, channel: string): string {
    return `color(from ${ground(name)} srgb-linear ${channel} ${channel} ${channel})`;
}

/**
 * The luminance where white and black stand equally far from a colour, 1.05 / (Y + 0.05)
 * against (Y + 0.05) / 0.05. Under it white is the further pole, from it on black.
 */
const crossover = 0.1791;

/**
 * The pole the accent's states move toward. Away from the label while the label has little
 * to spare, toward it once the label stands at 10:1 or more: lighten at or under 0.055 (a
 * white label at 10:1 and up) or between the crossover and 0.45 (a black label under 10:1),
 * darken otherwise.
 *
 * Away from the label always left a very light or a very dark accent no room to move, 697
 * of 4096 under the 1.05 the suite asks; toward it always took the label under 4.5:1 on
 * 1978. With the turn anywhere from 8.5:1 to 12:1 only black fails, its hover at 1.03 under
 * every shape — measured for RFC 0003, and 10 sits in the middle.
 */
const room = pole(
    '--ui-color-accent',
    `clamp(0, ${step(`0.055 - ${luminance}`)} + ${step(`${luminance} - ${String(crossover)}`)} * ${step(`0.45 - ${luminance}`)}, 1)`,
);

/** `amount`% of the way from the accent toward the pole its states have room to move to. */
function shade(amount: number): string {
    return `color-mix(in oklab, ${room} ${String(amount)}%, ${ground('--ui-color-accent')})`;
}

/**
 * How each derived role computes when the host has not set it.
 *
 * **Never emitted at `:root`, and this is the one measured failure of the whole design
 * rather than a caution:**
 *
 * ```css
 * :root {
 *   --ui-color-hover: color-mix(in oklab, var(--ui-color-text) 16%, var(--ui-color-surface));
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
    //
    // 1.41:1 against the resting surface in light and 1.42 in dark, and the pressed 1.27 and
    // 1.34 past the hover, against a floor of 1.25 for each. The 8% and 14% before these
    // were 1.18 and 1.17: rendered as a difference, and reported on a dark menu as a hover
    // nobody could see. The step below, 12% and 22%, clears with the pressed at 1.26 in
    // light, which is passing by rounding.
    '--ui-color-hover': mix('--ui-color-text', 16, '--ui-color-surface'),
    '--ui-color-pressed': mix('--ui-color-text', 26, '--ui-color-surface'),
    // The pole of the accent, white or black, whichever stands further from it: the label
    // that reads on any accent a host picks, 0 of 4096 under 4.5:1. Black on the dark
    // scheme's blue-400 at 8.26:1, where the ground it replaced was `#111827` at 6.98.
    '--ui-color-accent-contrast': pole(
        '--ui-color-accent',
        step(`${String(crossover)} - ${luminance}`),
    ),
    // Toward whichever pole has room rather than toward the text, which ran out of room on
    // an accent already near it: the docblock on `room` carries the measurement. The light
    // scheme's hover moves from `#255cd4` to `#1d52c6`, the pole being black there.
    '--ui-color-accent-hover': shade(12),
    '--ui-color-accent-pressed': shade(22),
    // 3.39:1 on the light surface and 3.96:1 on the dark one, against a floor of 3. The
    // step below clears neither — 45% is 2.94 in light, which is what a value chosen by
    // eye would have shipped.
    '--ui-color-border': mix('--ui-color-text', 50, '--ui-color-surface'),
    // The boundary's own mix, written from the grounds rather than through
    // `--ui-color-border`, since a formula reads grounds only. So a host who retunes the
    // boundary retunes this name beside it.
    '--ui-color-border-overlay': mix('--ui-color-text', 50, '--ui-color-surface'),
    // A plain reference: the text, until a theme writes a value in error in another colour.
    '--ui-color-text-invalid': ground('--ui-color-text'),
    // 5.24:1 and 6.07:1, against a floor of 4.5. Not the 60% that first cleared it: that
    // is 4.52 in light, a rounding error from failing, and a default nobody could then
    // retune without breaking a floor they were not thinking about.
    '--ui-color-text-muted': mix('--ui-color-text', 65, '--ui-color-surface'),
    // A plain reference, like the duration purpose above: the scale is where the value
    // lives, and a host who wants flatter cards moves the role rather than reverse
    // engineering which step a card happens to read.
    '--ui-elevation-raised': ground('--ui-elevation-100'),
    // A plain reference: the resting glow, until a theme lights a brighter one.
    '--ui-elevation-control-hover': ground('--ui-elevation-control'),
    // A plain reference, like the two purposes above: the scale is where the value lives,
    // and a host who wants larger supporting text moves the role rather than working out
    // which step a tooltip happens to read.
    '--ui-text-supporting': ground('--ui-text-100'),
    // 5% rather than the hover colour's 16%, and the gap is the whole design: a stripe has
    // to be visible without reading as a different surface, and it has to leave room above
    // itself for a state that is not a stripe. Mixing toward the text is what makes one
    // formula right in both schemes, for the reason the neutrals above give — the tint
    // darkens a light page and lightens a dark one without either being named.
    //
    // `tests/tokens.test.ts` holds the floor that matters here: text on a striped row is
    // still text, so 4.5:1 is owed against this surface and not only against the plain one.
    '--ui-color-surface-muted': mix('--ui-color-text', 5, '--ui-color-surface'),
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
    // muddy on charcoal. Its label needs no dark value: it is derived from the accent, so
    // it goes to black at this end on its own.
    '--ui-color-accent': '#60a5fa',
    '--ui-color-surface': '#111827',
    '--ui-color-text': '#e5e7eb',
    // Red-700 is 2.74:1 on the dark surface — under the 4.5:1 floor for text, and error
    // text is the one thing in this set that must never be hard to read. Red-400 is 6.41.
    '--ui-color-danger': '#f87171',
    // The same inversion, for the same reason: green-700 is 3.54:1 on the dark surface and
    // amber-700 is 3.53, so both would clear a coloured edge and fail as text — which is
    // the half of the pair a reader is most likely to need.
    '--ui-color-success': '#4ade80',
    '--ui-color-warning': '#fbbf24',
    // Cyan-400, inverted with the other three for the same reason: 9.82:1.
    '--ui-color-info': '#22d3ee',
};

/**
 * The default palette's answer to `prefers-contrast: more`: each name it moves, with its
 * light value and its dark one.
 *
 * **The reader's setting, answered in the token layer as reduced motion is, and not a
 * theme** — RFC 0003. A host chooses a theme; a reader's system asks for contrast, and a
 * reader who needs it should not depend on a host having shipped a picker.
 *
 * The text, the surface, the accent and the focus ring go to the poles, the dark scheme on
 * pure black. The accent's label follows on its own, being the accent's pole, and so do the
 * border and the muted text, which mix toward the text. The outcome colours stay where they
 * were chosen, at 4.5:1: an error that turned grey would stop saying it is an error.
 *
 * **The states are written out, as values rather than formulas.** Over pure black a mix
 * toward the text barely moves — 8% of white is 1.01:1 — and a black or white accent has
 * no room to shade toward, so a palette this fully known gives its states. Each is set at
 * the step the default palette's own states take: the hover 1.41:1 from the surface in
 * light and 1.42 in dark, the pressed 1.28 and 1.36 past it. They are derived names, and a
 * value declared at `:root` reaches every subtree below it, which a formula must never do
 * and a value may.
 *
 * A pair rather than two maps, so a name cannot be given one scheme and forgotten in the
 * other, and so an emitter that is not CSS reads two values rather than parsing a function.
 */
export const moreContrast: Readonly<
    Partial<Record<Token | DerivedToken, readonly [light: string, dark: string]>>
> = {
    '--ui-color-accent': ['#000000', '#ffffff'],
    '--ui-color-surface': ['#ffffff', '#000000'],
    '--ui-color-text': ['#000000', '#ffffff'],
    '--ui-color-focus': ['#000000', '#ffffff'],
    '--ui-color-hover': ['#d9d9d9', '#282828'],
    '--ui-color-pressed': ['#c1c1c1', '#3d3d3d'],
    '--ui-color-accent-hover': ['#333333', '#d6d6d6'],
    '--ui-color-accent-pressed': ['#4d4d4d', '#b3b3b3'],
    // Under the hover, so a row under the pointer is still a change rather than a stripe.
    '--ui-color-surface-muted': ['#f2f2f2', '#141414'],
    // What floats over the page edged in the text, which the mix toward it falls short of.
    '--ui-color-border-overlay': ['#000000', '#ffffff'],
    // And a toast, whichever its variant: black and white, its icon with it.
    '--ui-color-toast-edge': ['#000000', '#ffffff'],
};

/** The category every duration name shares, which is what reduced motion collapses. */
const duration = '--ui-duration-';

/**
 * The token defaults as a CSS rule, for a host that wants them without importing a
 * component. Returns the text of a `:root` block, the reduced-motion rule beside it and the
 * answer to `prefers-contrast: more` after both; a host inserts them however it prefers.
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
 *
 * **More contrast is answered here too**, from {@link moreContrast} and for the same
 * reason: it is the reader's setting, so no component should have to learn it exists.
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

    const contrasted = Object.entries(moreContrast)
        .map(([token, [light, dark]]) => `    ${token}: light-dark(${light}, ${dark});`)
        .join('\n');

    return [
        `:root {\n  color-scheme: light dark;\n${grounds}\n}`,
        `@media (prefers-reduced-motion: reduce) {\n  :root {\n${collapsed}\n  }\n}`,
        `@media (prefers-contrast: more) {\n  :root {\n${contrasted}\n  }\n}`,
    ].join('\n\n');
}

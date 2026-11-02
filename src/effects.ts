/**
 * The effects a component draws — RFC 0004's: one sheet for each kind of control, which a
 * component of that kind adopts. A button's, for what the pointer, the focus and a press do to it;
 * a field's, for what the pointer and the focus do to a control a reader types or chooses in,
 * {@link fieldEffects}; a drawn control's, {@link controlEffects}; and a surface's, for what the
 * pointer and a focus on something it holds do to a card, {@link surfaceEffects}. The rest of this
 * docblock is the button's, and each of the others says its own.
 *
 * **Built for a component, under its own taste name.** A theme's taste reaches a component by its
 * tag — the button's is `--ui-taste-button-<moment>`, the menu's `--ui-taste-menu-<moment>` — so
 * {@link buttonEffects} builds the sheet for the component it is given. `ui-button` adopts it, and
 * so does the menu's trigger, a secondary button the menu writes out, as RFC 0004's prototype drew
 * it: one sheet rather than one in each, which would stay in step only by being compared.
 *
 * **What it asks of the component.** Its control is the `button` in its shadow root, with a class
 * of `primary` or `secondary`, laid out against itself and a stacking context of its own, with the
 * `::before` a theme's glow is drawn on and an `::after` under the label that carries the edge; a
 * `<span class="edge">` in the control, for the edge's band; and the scripts bound as `ui-button`
 * binds them — `arrive()` to its focus, `follow()` to its `pointerover` and {@link pressed} to its
 * `pointerdown` and `keydown` — with `watch()` called as it connects. The sheet comes after the
 * component's own, which it is drawn over where the two weigh the same.
 *
 * Internal — it is not re-exported from `src/index.ts`.
 */

import { css, unsafeCSS, type CSSResult } from 'lit';
import { query } from './motion.js';
import { reference } from './reference.js';
import { spread } from './ripple.js';
import { press } from './shatter.js';
import { farPole } from './tokens.js';

/**
 * The effects that move the button's shadow, its place or its size, each by the moment it
 * answers. Its fill always moves on the state's own transition, and the burst is an animation,
 * which needs none.
 */
const moves = [
    ['hover-shadow', 'raise'],
    ['hover-shadow', 'glow'],
    ['focus-shadow', 'raise'],
    ['focus-shadow', 'inner'],
    ['focus-move', 'lift'],
    ['press-move', 'squish'],
    ['press-move', 'spring'],
    ['press-shadow', 'sink'],
] as const;

/**
 * The raise: a drop under the button, two layers as the elevation step's are. On a dark page,
 * where a shadow barely shows, the wider layer is the accent's.
 */
const raise = css`0 2px 4px -1px light-dark(rgb(0 0 0 / 0.25), rgb(0 0 0 / 0.6)),
    0 6px 14px -4px
        light-dark(rgb(0 0 0 / 0.35), rgb(from ${reference('--ui-color-accent')} r g b / 0.45))`;

/** The sink: the shadow gone inside, as if the button were pressed into the page. */
const sink = css`inset 0 2px 5px light-dark(rgb(0 0 0 / 0.35), rgb(0 0 0 / 0.7))`;

/** The accent moved toward a primary's label, which stands off the fill the accent is. */
const offPrimary = css`color-mix(
    in oklab,
    ${reference('--ui-color-accent')},
    ${reference('--ui-color-primary-contrast')} 40%
)`;

/**
 * The inner light: a line of the accent along the inside of the boundary, and its light from it.
 * Over the primary's fill, which is the accent already, the accent is moved toward the label: in
 * the accent itself, over a fill that is the accent, none of it showed — measured for RFC 0004.
 */
const inner = css`inset 0 0 0 1px ${reference('--ui-color-accent')},
    inset 0 0 0.75rem 0.125rem rgb(from ${reference('--ui-color-accent')} r g b / 0.5)`;

/** The inner light over the primary's fill. */
const innerOnPrimary = css`inset 0 0 0 1px ${offPrimary},
    inset 0 0 0.75rem 0.125rem rgb(from ${offPrimary} r g b / 0.5)`;

/**
 * The reference's spring, which a press lets go on: a `linear()` curve, which passes its rest and
 * comes back as no `cubic-bezier()` can, settled by four fifths of the way.
 */
const spring = css`linear(0, 0.38 8%, 0.83 17%, 1.06 24%, 1.13 30%, 1.08 39%, 0.99 51%, 0.97 62%, 1 82%, 1)`;

/**
 * The sheen a shimmer sweeps across a button, over the label it passes under: the accent with a
 * fifth of the pole further from that label mixed in, at half its strength. The accent alone, or
 * the primary's fill lightened as the prototype drew it, took the label under its 4.5:1 at the
 * sheen's peak — 2.42:1 on the default palette's primary, 3.65 on Matrix's dark secondary and 4.48
 * on Glass's dark primary, measured for this button. A fifth of the far pole keeps every label at
 * 5.64:1 or more, and leaves the band 1.48:1 or more from the fill under Glass, whose taste sweeps
 * it.
 */
const sheenOnPrimary = css`rgb(
    from color-mix(
            in oklab,
            ${reference('--ui-color-accent')},
            ${unsafeCSS(farPole(String(reference('--ui-color-primary-contrast'))))} 20%
        )
        r g b / 0.5
)`;

/** The sheen over a secondary button, whose label is the text. */
const sheenOverSurface = css`rgb(
    from color-mix(
            in oklab,
            ${reference('--ui-color-accent')},
            ${unsafeCSS(farPole(String(reference('--ui-color-text'))))} 20%
        )
        r g b / 0.5
)`;

// Stryker disable all: the shimmer's property is registered once, at import, in the page's one
// registry — so in the warm process Stryker switches mutants in, the original registration stands
// before any mutant is active, and none of them changes what a test can see. Outside the runner's
// reach, not an equivalent mutant.
try {
    // The property the shimmer moves its sheen through: registered, so it moves rather than jumps,
    // and its own, so a picture the layer already paints stays where it is.
    CSS.registerProperty({
        name: '--ui-fx-shimmer',
        syntax: '<percentage>',
        inherits: false,
        initialValue: '150%',
    });
} catch {
    // Registered already, by another copy of this package on the page, which stands.
}
// Stryker restore all

/**
 * The cast: the pointer as a light, the shadow falling away from it the further the further the
 * pointer is from the middle, and on a dark page, where a shadow barely shows, the light spilling
 * round the side the pointer is on — as strong as the pointer is near, at half the card's size.
 */
const cast = css`calc(var(--ui-fx-pointer-nx, 0) * -0.5rem)
        calc(var(--ui-fx-pointer-ny, 0) * -0.5rem + 0.25rem) 0.875rem -0.125rem
        light-dark(
            rgb(0 0 0 / calc(0.3 * var(--ui-fx-pointer-near, 0))),
            rgb(0 0 0 / calc(0.85 * var(--ui-fx-pointer-near, 0)))
        ),
    calc(var(--ui-fx-pointer-nx, 0) * 0.75rem) calc(var(--ui-fx-pointer-ny, 0) * 0.75rem) 1.5rem
        0.125rem
        light-dark(
            transparent,
            rgb(from ${reference('--ui-color-accent')} r g b / calc(0.35 * var(--ui-fx-pointer-near, 0)))
        )`;

/**
 * The spotlight: a light where the pointer is, a quarter as strong as the sheen and fading out over
 * 4rem, as strong as the pointer is near.
 */
const spotlight = css`radial-gradient(
    circle 4rem at var(--ui-fx-pointer-x, -999px) var(--ui-fx-pointer-y, -999px),
    rgb(from var(--ui-fx-sheen) r g b / calc(var(--ui-fx-pointer-near, 0) * 0.24)),
    transparent
)`;

/**
 * The ripple: a circle of the sheen's light from where the press landed, as far out toward the
 * farthest corner as it has spread — src/ripple.ts spreads it. A third as strong as it starts, as
 * RFC 0004's prototype drew it, and faded to nothing as it reaches the corner.
 */
const ripple = css`radial-gradient(
    circle farthest-corner at var(--ui-fx-ripple-x) var(--ui-fx-ripple-y),
    rgb(from var(--ui-fx-sheen) r g b / calc((1 - var(--ui-fx-ripple)) * 0.32))
        calc(var(--ui-fx-ripple) * 100%),
    transparent calc(var(--ui-fx-ripple) * 100% + 1px)
)`;

/**
 * The spotlight over a field: its tint where the pointer is, as strong as the pointer is near, out
 * over 16rem, as the card draws it. A field's lights are its tint, since a light in the text's
 * colour darkened the ground under the placeholder past 4.5:1 where it fell — measured for RFC
 * 0004 — and over the tint every palette's text and placeholder hold it.
 */
const spotlitTint = css`radial-gradient(
    16rem circle at var(--ui-fx-pointer-x, -999px) var(--ui-fx-pointer-y, -999px),
    light-dark(
        oklch(
            from color-mix(in oklab, ${reference('--ui-color-surface-control')} 88%, ${reference('--ui-color-accent')})
                max(l, 0.98) c h / calc(max(alpha, 0.6) * var(--ui-fx-pointer-near, 0))
        ),
        oklch(
            from color-mix(in oklab, ${reference('--ui-color-surface-control')} 90%, ${reference('--ui-color-accent')})
                l c h / calc(max(alpha, 0.6) * var(--ui-fx-pointer-near, 0))
        )
    ),
    transparent 70%
)`;

/**
 * The accent pushed toward the pole further from the page — darker on a light one, lighter on a
 * dark one — which the edge's band is drawn in over a surface, so it stands apart from an edge
 * that is the accent already, as a glowing theme's is.
 */
const far = css`light-dark(
    oklch(from ${reference('--ui-color-accent')} calc(l - 0.1) c h),
    oklch(from ${reference('--ui-color-accent')} calc(l + 0.2) c h)
)`;

/** The glow: a light of the accent, blurred round the button's boundary. */
const glow = css`0 0 0.75rem 0.125rem rgb(from ${reference('--ui-color-accent')} r g b / 0.5)`;

/**
 * The tint: a little of the accent in a secondary button's own fill. Held light in the light
 * scheme, which keeps the label's contrast where the hover colour's darkening would have spent
 * it, and at least 0.6 opaque over a fill a theme lets the page through, as Glass's is.
 */
const tint = css`light-dark(
    oklch(
        from color-mix(in oklab, ${reference('--ui-color-surface-control')} 88%, ${reference('--ui-color-accent')})
            max(l, 0.98) c h / max(alpha, 0.6)
    ),
    oklch(
        from color-mix(in oklab, ${reference('--ui-color-surface-control')} 90%, ${reference('--ui-color-accent')})
            l c h / max(alpha, 0.6)
    )
)`;

/**
 * The effects that move a field's shadow, its fill or its place, each by the moment it answers:
 * what a field's boundary transitions with once one of them is chosen. The burst, the flash and the
 * split are animations, which need none.
 */
const fieldMoves = [
    ['hover-fill', 'tint'],
    ['hover-shadow', 'raise'],
    ['hover-shadow', 'glow'],
    ['focus-fill', 'tint'],
    ['focus-shadow', 'raise'],
    ['focus-move', 'lift'],
] as const;

/**
 * A press on a button: breaks it, and spreads its ripple, wherever its sheet chose either. One
 * listener for both, bound to the button's `pointerdown` and `keydown`, since a template binds one
 * listener to an event.
 */
export function pressed(event: PointerEvent | KeyboardEvent): void {
    press(event);
    spread(event);
}

/**
 * The sheet of a button's effects, for the component whose tag less `ui-` is `component`: each
 * effect drawn under that component's query, so its own taste reaches it.
 *
 * Built once for each component, as the component is defined. A function, where the note on
 * `drawn` below keeps helpers out of the sheet, and safe where that helper was not: emptied by a
 * mutant, it hands Lit no sheet rather than handing the `css` tag an undefined, so the import stands
 * and the component fails as it renders, which every test that renders one notices.
 */
export function buttonEffects(component: string): CSSResult {
    /**
     * The condition one of the effects is drawn under, by moment and effect.
     *
     * Each rule below wraps it in `unsafeCSS` where it uses it, rather than through a helper of
     * its own: a helper whose body a mutant empties hands the `css` tag an undefined, which it
     * refuses, and the import goes down with it, which the runner grades as a survivor — measured,
     * on `src/button.ts`'s first run.
     */
    const drawn = query(component);

    /** True wherever any of those is chosen, by a consumer or a taste. */
    const moving = unsafeCSS(moves.map(([moment, effect]) => drawn(moment, effect)).join(' or '));

    /** Where the fill under the pointer is the tint. */
    const pointerTint = unsafeCSS(drawn('hover-fill', 'tint'));

    /**
     * Where the pointer leaves the fill as it rests: `none`, and the spotlight, whose light is the
     * pointer's answer in the hover colour's place. Parenthesised whole, so it can be joined to another
     * condition by `and`.
     */
    const pointerRest = unsafeCSS(
        `(${['none', 'spotlight'].map((effect) => drawn('hover-fill', effect)).join(' or ')})`,
    );

    /** Where the fill at the focus is the hover colour. */
    const focusHighlight = unsafeCSS(drawn('focus-fill', 'highlight'));

    /**
     * Where a press brings no colour of its own: `none`, and the ripple, whose circle is the press's
     * answer in the pressed colour's place. Parenthesised whole, so it can be joined to another
     * condition by `and`.
     */
    const pressRest = unsafeCSS(
        `(${['none', 'ripple'].map((effect) => drawn('press-fill', effect)).join(' or ')})`,
    );

    /**
     * Where a choice for the pointer's shadow takes the place of the glow a theme lights a button
     * with under the pointer, which is that moment's answer from before effects existed: `none`
     * among them, since `none` is nothing.
     */
    const pointerShadow = unsafeCSS(
        ['none', 'raise', 'glow', 'cast']
            .map((effect) => drawn('hover-shadow', effect))
            .join(' or '),
    );

    /**
     * Where the edge under the pointer is left as it rests: `none`, and the edge, whose band is the
     * pointer's answer in the place of the edge a theme gives the pointer.
     */
    const pointerBorder = unsafeCSS(
        ['none', 'edge'].map((effect) => drawn('hover-border', effect)).join(' or '),
    );

    /** Where a light that follows the pointer is chosen, which the pointer engine follows it for. */
    const following = unsafeCSS(
        [
            drawn('hover-fill', 'spotlight'),
            drawn('hover-shadow', 'cast'),
            drawn('hover-border', 'edge'),
        ].join(' or '),
    );

    /** Where a choice for the focus's shadow does the same at the focus, which wins over the pointer. */
    const focusShadow = unsafeCSS(
        ['none', 'raise', 'burst', 'inner']
            .map((effect) => drawn('focus-shadow', effect))
            .join(' or '),
    );

    return css`
        /* RFC 0004's effects. Which one runs is a consumer's choice, or a theme's taste where
           nobody chose: src/motion.ts says how, and the button draws each under its query. All
           of them are drawn on the real button, where the pointer, the focus and the press are
           the platform's own states — a press by Space included, which the host never sees.

           What they move transitions only once one of them is chosen, so with none the colour
           is still the only thing that moves. A press lands at once, since the two rules above
           take every duration to 0s while it holds, and letting go runs each property back on
           its own length and curve: the squeeze springs past its rest on the emphasis curve. */
        @container ${moving} {
            button {
                transition-property: background-color, box-shadow, translate, scale;
                transition-duration:
                    ${reference('--ui-duration-state')}, ${reference('--ui-duration-effect')},
                    ${reference('--ui-duration-effect')}, ${reference('--ui-duration-effect')};
                transition-timing-function:
                    ${reference('--ui-easing-state')}, ${reference('--ui-easing-enter')},
                    ${reference('--ui-easing-enter')}, ${reference('--ui-easing-emphasis')};
            }
        }

        /* The fill, where a choice changed it. The colours above stay what every moment nobody
           chose draws, and what an engine without style queries draws. The pointer's and the
           focus's rules here stand out of a press, so the press, which is drawn over both, keeps
           its own; the focus's come after the pointer's, which it wins over.

           tint: a little of the accent in the secondary's fill. The primary's fill is the accent
           already, and a little more of it left the fill as it was — measured for RFC 0004 on
           Matrix's primary — so its tint is the hover colour it already goes to. */
        @container ${pointerTint} {
            button.secondary:not(:disabled):hover:not(:active) {
                background: ${tint};
            }
        }

        /* none under the pointer: nothing, so the fill stays as it rests. */
        @container ${pointerRest} {
            button.primary:not(:disabled):hover:not(:active) {
                background: ${reference('--ui-color-primary')};
            }

            button.secondary:not(:disabled):hover:not(:active) {
                background: ${reference('--ui-color-surface-control')};
            }
        }

        /* highlight at the focus: the hover colour, for as long as the focus stays. */
        @container ${focusHighlight} {
            button.primary:not(:disabled):focus-visible:not(:active) {
                background: ${reference('--ui-color-primary-hover')};
            }

            button.secondary:not(:disabled):focus-visible:not(:active) {
                background: ${reference('--ui-color-hover')};
            }
        }

        /* none under a press, and the ripple, whose circle takes the pressed colour's place: no
           colour of its own, so the fill stays as the pointer and the focus left it — at rest,
           then under the pointer, then at the focus, each over the last, as the colours above
           are. */
        @container ${pressRest} {
            button.primary:not(:disabled):active {
                background: ${reference('--ui-color-primary')};
            }

            button.secondary:not(:disabled):active {
                background: ${reference('--ui-color-surface-control')};
            }

            button.primary:not(:disabled):hover:active {
                background: ${reference('--ui-color-primary-hover')};
            }

            button.secondary:not(:disabled):hover:active {
                background: ${reference('--ui-color-hover')};
            }
        }

        @container ${pressRest} and ${pointerTint} {
            button.secondary:not(:disabled):hover:active {
                background: ${tint};
            }
        }

        @container ${pressRest} and ${pointerRest} {
            button.primary:not(:disabled):hover:active {
                background: ${reference('--ui-color-primary')};
            }

            button.secondary:not(:disabled):hover:active {
                background: ${reference('--ui-color-surface-control')};
            }
        }

        @container ${pressRest} and ${focusHighlight} {
            button.primary:not(:disabled):focus-visible:active {
                background: ${reference('--ui-color-primary-hover')};
            }

            button.secondary:not(:disabled):focus-visible:active {
                background: ${reference('--ui-color-hover')};
            }
        }

        /* The light drawn under the label, the shimmer's sheen and the spotlight's at its own
           strength, and the edge's band, in each variant's colours for them. */
        button.primary {
            --ui-fx-sheen: ${sheenOnPrimary};
            --ui-fx-band: ${offPrimary};
        }

        button.secondary {
            --ui-fx-sheen: ${sheenOverSurface};
            --ui-fx-band: ${far};
        }

        /* The lights that follow the pointer, which the pointer engine follows for — src/
           pointer.ts — where the sheet chose one, the pointer can hover and the button can be
           used. The sheet decides and the script reads: it is handed a duration it reads no other
           way, so the collapse takes it to nothing and nothing follows. */
        @media (hover: hover) {
            @container ${following} {
                button:not(:disabled) {
                    --ui-fx-follow: ${reference('--ui-duration-effect')};
                }
            }
        }

        /* spotlight: a light where the pointer is, a quarter as strong as the sheen and fading out
           over 4rem, as strong as the pointer is near. On the layer under the label, in the light
           the sheen is drawn in, so the label keeps its 4.5:1 under it as under the sheen. The
           focus wins. */
        @container ${unsafeCSS(drawn('hover-fill', 'spotlight'))} {
            button:not(:disabled):where(:not(:focus-visible))::after {
                background-image: ${spotlight};
            }
        }

        /* cast: the pointer's shadow, on the button's own, at rest as under the pointer, since it
           is as strong as the pointer is near. The focus wins, and a press is drawn over it. */
        @container ${unsafeCSS(drawn('hover-shadow', 'cast'))} {
            button:not(:disabled):where(:not(:focus-visible)) {
                box-shadow: ${cast};
            }
        }

        /* edge: a band on the edge from its outer side in, lit where the pointer is nearest and as
           strong as the pointer is near — on a layer of its own, since the band is cut to the edge
           and the layer under the label carries the lights cut to nothing. The focus wins. */
        .edge {
            position: absolute;
            inset: -1px;
            padding: 2px;
            border-radius: inherit;
            background: radial-gradient(
                ellipse 100% 100% at var(--ui-fx-pointer-x, -999px) var(--ui-fx-pointer-y, -999px),
                var(--ui-fx-band),
                transparent
            );
            /* Cut to the band: the box less its content box. Safari reads no content-box in the
               mask, prefixed or not, but its own prefixed mask's, so that one comes first and the
               standard one after it, which the other engines take and Safari drops. */
            -webkit-mask:
                linear-gradient(#000 0 0) content-box,
                linear-gradient(#000 0 0);
            -webkit-mask-composite: xor;
            mask:
                linear-gradient(#000 0 0) content-box exclude,
                linear-gradient(#000 0 0);
            opacity: 0;
            pointer-events: none;
        }

        @container ${unsafeCSS(drawn('hover-border', 'edge'))} {
            button:not(:disabled):where(:not(:focus-visible)) .edge {
                opacity: var(--ui-fx-pointer-near, 0);
            }
        }

        /* The edge a theme gives the pointer is that moment's answer from before effects existed,
           so the band, or none, takes its place: the edge stays as it rests. */
        @container ${pointerBorder} {
            button:not(:disabled):hover::after {
                border-color: ${reference('--ui-color-border-button')};
            }
        }

        /* shimmer: a sheen swept across the button at the focus, ten degrees off upright and
           three quarters as wide as the button, from before its start to past its end, four
           rounds of the loop's period, and then at rest before the start: a focus can rest for
           minutes, and four rounds stay inside the five seconds a loop that settles keeps to. On
           the layer under the label, through a property of its own. */
        @container ${unsafeCSS(drawn('focus-fill', 'shimmer'))} {
            button:focus-visible::after {
                background-image: linear-gradient(
                    100deg,
                    transparent 35%,
                    var(--ui-fx-sheen) 50%,
                    transparent 65%
                );
                background-size: 250% 100%;
                background-repeat: no-repeat;
                background-position: var(--ui-fx-shimmer) 0;
                animation: ui-shimmer ${reference('--ui-duration-loop')} linear
                    ${reference('--ui-iteration-settle')};
            }
        }

        @keyframes ui-shimmer {
            from {
                --ui-fx-shimmer: 150%;
            }

            to {
                --ui-fx-shimmer: -50%;
            }
        }

        /* ripple: a circle spread once from where the press landed, which src/ripple.ts starts as
           it lands. The sheet decides and the script only reads: the time and curve on a button
           that can be used, so a host's own time reaches the circle and the collapse takes it to
           nothing — a flourish's, on the curve an arrival takes. While the circle spreads it is the
           picture on the layer under the label, in the place of the shimmer's sweep, which runs on
           underneath and shows again once it is over; and over the spotlight, whose light and the
           circle's stay inside the sheen's strength together, so the label keeps its 4.5:1 under
           both as under the sheen. After the shimmer and the spotlight, which it outranks there. */
        @container ${unsafeCSS(drawn('press-fill', 'ripple'))} {
            button:not(:disabled) {
                --ui-fx-ripple-time: ${reference('--ui-duration-flourish')};
                --ui-fx-ripple-curve: ${reference('--ui-easing-enter')};
            }

            button[data-ripple]::after {
                background: ${ripple} no-repeat;
            }
        }

        @container ${unsafeCSS(drawn('press-fill', 'ripple'))} and ${unsafeCSS(drawn('hover-fill', 'spotlight'))} {
            button[data-ripple]:where(:not(:focus-visible))::after {
                background:
                    ${ripple} no-repeat,
                    ${spotlight};
            }
        }

        /* The glow a theme lights a button with under the pointer is that moment's answer from
           before effects existed, so a choice for the pointer's shadow takes its place, and the
           glow the button rests with stays under it. At the focus a choice for the focus's
           shadow does, since the focus wins. */
        @container ${pointerShadow} {
            button:not(:disabled):hover::before {
                box-shadow: ${reference('--ui-elevation-control')};
            }
        }

        @container ${focusShadow} {
            button:not(:disabled):focus-visible::before {
                box-shadow: ${reference('--ui-elevation-control')};
            }
        }

        /* The raise and the glow under the pointer, which only a pointer that hovers can ask
           for: a tap on a touch screen leaves the hover behind, and the shadow would stay with
           it. The focus wins — a button the reader can see the focus on is drawn as the focus
           chose, and a pointer resting there changes nothing — and the :where() keeps these
           rules at a press's weight, so a press, written after them, is drawn over them. */
        @media (hover: hover) {
            @container ${unsafeCSS(drawn('hover-shadow', 'raise'))} {
                button:not(:disabled):hover:where(:not(:focus-visible)) {
                    box-shadow: ${raise};
                }
            }

            @container ${unsafeCSS(drawn('hover-shadow', 'glow'))} {
                button:not(:disabled):hover:where(:not(:focus-visible)) {
                    box-shadow: ${glow};
                }
            }
        }

        @container ${unsafeCSS(drawn('focus-shadow', 'raise'))} {
            button:focus-visible {
                box-shadow: ${raise};
            }
        }

        /* inner: the light held inside the boundary, for as long as the focus stays. */
        @container ${unsafeCSS(drawn('focus-shadow', 'inner'))} {
            button.secondary:focus-visible {
                box-shadow: ${inner};
            }

            button.primary:focus-visible {
                box-shadow: ${innerOnPrimary};
            }
        }

        /* burst: light bursting out round the button as the reader sees the focus arrive, and
           gone. An animation, so it starts each time the focus is seen arriving and plays out
           on its own; nothing holds once it is over. Only the light round the button moves: the
           reference brightens the button itself at the peak too, and on the light scheme's
           primary that took the white label from 5.17:1 to 2.32:1 — measured for RFC 0004. */
        @container ${unsafeCSS(drawn('focus-shadow', 'burst'))} {
            button:focus-visible {
                animation: ui-burst ${reference('--ui-duration-flourish')}
                    ${reference('--ui-easing-enter')};
            }
        }

        @keyframes ui-burst {
            from {
                box-shadow: 0 0 0 0 rgb(from ${reference('--ui-color-accent')} r g b / 0.8);
            }

            to {
                box-shadow: 0 0 15px 10px rgb(from ${reference('--ui-color-accent')} r g b / 0);
            }
        }

        /* Two pixels up, the ring with it, for as long as the focus stays. */
        @container ${unsafeCSS(drawn('focus-move', 'lift'))} {
            button:focus-visible {
                translate: 0 -2px;
            }
        }

        /* The press: transitions rather than animations, so letting go runs them back where an
           animation would be cut short the moment the press ended — RFC 0004's S7. */
        @container ${unsafeCSS(drawn('press-move', 'squish'))} {
            button:not(:disabled):active {
                scale: 0.96;
            }
        }

        /* spring: pressed in further than the squish, and let go on the reference's spring over
           a flourish's time, which plays out on its own once the press ends. In at once, as the
           squish is: a press takes every duration to 0s while it holds. */
        @container ${unsafeCSS(drawn('press-move', 'spring'))} {
            button {
                transition-duration:
                    ${reference('--ui-duration-state')}, ${reference('--ui-duration-effect')},
                    ${reference('--ui-duration-effect')}, ${reference('--ui-duration-flourish')};
                transition-timing-function:
                    ${reference('--ui-easing-state')}, ${reference('--ui-easing-enter')},
                    ${reference('--ui-easing-enter')}, ${spring};
            }

            button:not(:disabled):active {
                scale: 0.9;
            }
        }

        @container ${unsafeCSS(drawn('press-shadow', 'sink'))} {
            button:not(:disabled):active {
                box-shadow: ${sink};
            }
        }

        /* The shatter, which a filter draws as the press lands — src/shatter.ts. The sheet decides
           and the script only reads what it decided: the choice on a button that can be used, and
           the time and curve its pieces go back together on, so a host's own time reaches them
           and the collapse takes it to nothing. Before the press, which the script reads as it
           lands. A move's curve, which does not pass its end: on one that does, the pieces settled
           a pixel either way of where they came to rest, and the cracks flickered — measured for
           RFC 0004. */
        @container ${unsafeCSS(drawn('press-move', 'shatter'))} {
            button:not(:disabled) {
                --ui-fx-press: shatter;
                --ui-fx-press-time: ${reference('--ui-duration-effect')};
                --ui-fx-press-curve: ${reference('--ui-easing-move')};
            }
        }

        /* The focus ring glided over from the control the reader saw it on last, which the
           page's ring flies — src/ring.ts. The sheet decides and the script only reads what it
           decided: the choice while the reader can see the focus, and the flight's time and curve
           resolved on the button, so a host's own time reaches the flight and the collapse takes
           it to nothing. Never in forced colours, where the ring is the system's and nothing
           flies. */
        @media (forced-colors: none) {
            @container ${unsafeCSS(drawn('focus-ring', 'glide'))} {
                button:focus-visible {
                    --ui-fx-ring: glide;
                    --ui-fx-ring-time: ${reference('--ui-duration-travel')};
                    --ui-fx-ring-curve: ${reference('--ui-easing-move')};
                }
            }

            /* The glitch, which the page's ring plays over the button's own: shaken, and split
               into two lines thrown either way in the danger and the info, RFC 0004's glitch
               colours. A flourish, on a straight clock, since its steps are counted along it. */
            @container ${unsafeCSS(drawn('focus-ring', 'glitch'))} {
                button:focus-visible {
                    --ui-fx-ring: glitch;
                    --ui-fx-ring-time: ${reference('--ui-duration-flourish')};
                    --ui-fx-ring-curve: linear;
                    --ui-fx-ring-left: ${reference('--ui-color-danger')};
                    --ui-fx-ring-right: ${reference('--ui-color-info')};
                }
            }

            /* The refocus, which the page's ring plays over the button's own: brought into focus
               from a blur as the focus arrives, and blurred away as it leaves — as a surface comes
               into focus and goes out of it, on the curves an arrival and a departure take, over a
               quarter again an effect's time. */
            @container ${unsafeCSS(drawn('focus-ring', 'refocus'))} {
                button:focus-visible {
                    --ui-fx-ring: refocus;
                    --ui-fx-ring-time: ${reference('--ui-duration-effect')};
                    --ui-fx-ring-curve: ${reference('--ui-easing-enter')};
                    --ui-fx-ring-exit: ${reference('--ui-easing-exit')};
                }
            }
        }
    `;
}

/**
 * The sheet of a field's effects, for the component whose tag less `ui-` is `component`: each
 * effect drawn under that component's query, so its own taste reaches it — the input's, the
 * textarea's and the select's. `able` is what the control is when the pointer can change it,
 * besides under it: not disabled, and where the reader types, not read-only — a select has no
 * read-only to guard against, so its sheet names none.
 *
 * **What it asks of the component.** Its control is the element `component` names — an `<input>`,
 * a `<textarea>` or a `<select>` — and the one child of a `.glow` box in its shadow root, the box a
 * theme's glow is drawn on, with the control's size and corner; and `arrive()` is bound to the
 * control's focus, with `watch()` called as the component connects. The sheet comes after the
 * component's own.
 *
 * **Nothing moves the control on its own.** A field is where the reference measured motion getting in the way
 * of the reader, who is typing or choosing there: an effect changes what is round the control, or
 * moves the box it sits in, the ring with it. The pointer's effects are drawn on a field the
 * pointer can change and yield to the focus, which in a field is where the reader is acting.
 *
 * Built once for each component, as it is defined: a function, and safe as one, for the reason
 * {@link buttonEffects} gives.
 *
 * **A field is a form's control, so it answers what a form's control does**: its label at the
 * focus, and an error — the border and the fill of a field whose control reads
 * `aria-invalid="true"`, which is what a screen reader reads too. The message comes as it did.
 */
export function fieldEffects(component: string, able: string): CSSResult {
    /** The condition one of the effects is drawn under, by moment and effect — see `drawn` above. */
    const drawn = query(component);

    /** The control, the element the component's name names. */
    const control = unsafeCSS(component);

    /** What the control is when the pointer can change it. */
    const pointable = unsafeCSS(able);

    /** True wherever any of the effects that move a field is chosen, by a consumer or a taste. */
    const moving = unsafeCSS(
        fieldMoves.map(([moment, effect]) => drawn(moment, effect)).join(' or '),
    );

    /** True wherever a light that follows the pointer is chosen, which the engine follows for. */
    const following = unsafeCSS(
        [
            drawn('hover-fill', 'spotlight'),
            drawn('hover-shadow', 'cast'),
            drawn('hover-border', 'edge'),
        ].join(' or '),
    );

    return css`
        /* What they move transitions only once one of them is chosen, so with none the boundary
           is still the only thing that moves: the shadow and the fill on the control's own, and
           the place on the box round it, each over an effect's time on the curve an arrival
           takes. */
        @container ${moving} {
            ${control} {
                transition-property: border-color, box-shadow, background-color;
                transition-duration:
                    ${reference('--ui-duration-state')}, ${reference('--ui-duration-effect')},
                    ${reference('--ui-duration-effect')};
                transition-timing-function:
                    ${reference('--ui-easing-state')}, ${reference('--ui-easing-enter')},
                    ${reference('--ui-easing-enter')};
            }

            .glow {
                transition: translate ${reference('--ui-duration-effect')}
                    ${reference('--ui-easing-enter')};
            }
        }

        /* The control's one list of animations, read from the kinds that animate it: its shadow's,
           which the focus's burst writes; the focus's fill's, which the shimmer writes; and an
           error's fill's, which the flash writes. One list, since an element has one, and two
           rules writing it leave one effect unplayed; a kind that plays nothing reads as none. */
        ${control} {
            animation:
                var(--ui-fx-run-shadow, none), var(--ui-fx-run-fill, none),
                var(--ui-fx-run-error, none);
        }

        /* The pointer's, on a field the pointer can change — not one that cannot be used or written
           in — which only a pointer that hovers can ask for: a tap leaves the hover behind, and
           what it drew would stay with it. The focus wins.

           raise: the button's drop, under the control. glow: the button's light of the accent,
           blurred round the control. tint: the button's, a little of the accent in the fill, which
           every component's lights are drawn in and over which every shipped palette's text and
           placeholder hold 4.5:1 — measured for RFC 0004. none, for the boundary: today's
           darkening taken away, so it stays as it rests, and a field in error keeps its red, which
           the darkening covers. */
        @media (hover: hover) {
            @container ${unsafeCSS(drawn('hover-shadow', 'raise'))} {
                ${control}:hover${pointable}:not(:focus-visible) {
                    box-shadow: ${raise};
                }
            }

            @container ${unsafeCSS(drawn('hover-shadow', 'glow'))} {
                ${control}:hover${pointable}:not(:focus-visible) {
                    box-shadow: ${glow};
                }
            }

            @container ${unsafeCSS(drawn('hover-fill', 'tint'))} {
                ${control}:hover${pointable}:not(:focus-visible) {
                    background-color: ${tint};
                }
            }

            @container ${unsafeCSS(drawn('hover-border', 'none'))} {
                ${control}:hover${pointable}:not(:focus-visible) {
                    border-color: ${reference('--ui-color-border')};
                }

                ${control}[aria-invalid='true']:hover${pointable}:not(:focus-visible) {
                    border-color: ${reference('--ui-color-danger')};
                }
            }
        }

        @container ${unsafeCSS(drawn('focus-shadow', 'raise'))} {
            ${control}:focus-visible {
                box-shadow: ${raise};
            }
        }

        /* The lights that follow the pointer, which the pointer engine follows for — src/pointer.ts
           — bound to the box round the control, so the control and the box's own layer both read
           where the pointer is. Handed a duration it reads no other way, where the sheet chose a
           light, the pointer can hover and can change the field, so the collapse takes it to
           nothing and nothing follows. */
        @media (hover: hover) {
            @container ${following} {
                .glow:has(> ${control}${pointable}) {
                    --ui-fx-follow: ${reference('--ui-duration-effect')};
                }
            }
        }

        /* spotlight: the field's tint where the pointer is, as strong as it is near, at rest as
           under the pointer, as the button's light is. In front of what the control hands over as
           behind it. The focus wins. */
        @container ${unsafeCSS(drawn('hover-fill', 'spotlight'))} {
            ${control}${pointable}:not(:focus-visible) {
                background-image: ${spotlitTint}, var(--ui-fx-behind, none);
                background-size: auto, var(--ui-fx-behind-size, auto);
                background-position:
                    0 0,
                    var(--ui-fx-behind-position, 0 0);
                background-repeat: no-repeat;
            }
        }

        /* cast: the button's, on the control's own shadow, as strong as the pointer is near,
           whether it is over the field or not. The focus wins. */
        @container ${unsafeCSS(drawn('hover-shadow', 'cast'))} {
            ${control}${pointable}:not(:focus-visible) {
                box-shadow: ${cast};
            }
        }

        /* edge: a band in the accent pushed off the page, lit along the boundary nearest the
           pointer and as strong as it is near, on the layer round the box — the one an error's
           border draws on, which the band leaves to a field in error. Cut to the band as the
           button's is, Safari's prefixed mask first and the standard one after, for the reason the
           button's gives. The focus wins. */
        @container ${unsafeCSS(drawn('hover-border', 'edge'))} {
            .glow:not(:has(> [aria-invalid='true']))::before {
                padding: 2px;
                background: radial-gradient(
                    ellipse 100% 100% at var(--ui-fx-pointer-x, -999px)
                        var(--ui-fx-pointer-y, -999px),
                    ${far},
                    transparent
                );
                -webkit-mask:
                    linear-gradient(#000 0 0) content-box,
                    linear-gradient(#000 0 0);
                -webkit-mask-composite: xor;
                mask:
                    linear-gradient(#000 0 0) content-box exclude,
                    linear-gradient(#000 0 0);
                opacity: 0;
            }

            .glow:has(
                    > ${control}${pointable}:not(:focus-visible):not([aria-invalid='true'])
                )::before {
                opacity: var(--ui-fx-pointer-near, 0);
            }
        }

        /* inner: the button's light held inside the boundary, for as long as the focus stays. */
        @container ${unsafeCSS(drawn('focus-shadow', 'inner'))} {
            ${control}:focus-visible {
                box-shadow: ${inner};
            }
        }

        /* shimmer: the button's sheen swept across the control at the focus, under the text it
           passes beneath, four rounds of the loop's period and then at rest, through the property
           the button's moves through. In the light a button sweeps over a surface, as a field's
           text is a surface's, the text and the placeholder taking the halo below while it sweeps.
           In front of whatever the control paints in its background, which a component hands over
           as --ui-fx-behind, its size and its place — the select's caret — and which reads as
           nothing where it hands none over. */
        @container ${unsafeCSS(drawn('focus-fill', 'shimmer'))} {
            ${control}:focus-visible {
                background-image:
                    linear-gradient(
                        100deg,
                        transparent 35%,
                        ${sheenOverSurface} 50%,
                        transparent 65%
                    ),
                    var(--ui-fx-behind, none);
                background-size:
                    250% 100%,
                    var(--ui-fx-behind-size, auto);
                background-position:
                    var(--ui-fx-shimmer) 0,
                    var(--ui-fx-behind-position, 0 0);
                background-repeat: no-repeat;
                --ui-fx-run-fill:
                    ui-shimmer ${reference('--ui-duration-loop')} linear
                        ${reference('--ui-iteration-settle')},
                    ui-halo ${reference('--ui-duration-loop')} linear
                        ${reference('--ui-iteration-settle')};
            }
        }

        /* The halo a field's text and placeholder take for as long as a light passes under them —
           the shimmer's sheen, the flash's danger — in the fill made opaque. The sheen took a
           field's placeholder to 2.8:1 at its peak in every theme and scheme, and the flash to
           3.49:1 at its start on Matrix's light page, since its colour clears 4.5:1 at rest and no
           more. A halo that fills the letters' inner details is the text's background, WCAG says,
           so the text keeps the contrast it has at rest, and the light still shows round it.
           Played beside the light rather than held, since over a fill a theme lets the page
           through the opaque halo shows round the text. The placeholder inherits it. */
        @keyframes ui-halo {
            from,
            to {
                text-shadow:
                    0 0 1px rgb(from ${reference('--ui-color-surface-control')} r g b / 1),
                    0 0 2px rgb(from ${reference('--ui-color-surface-control')} r g b / 1),
                    0 0 3px rgb(from ${reference('--ui-color-surface-control')} r g b / 1),
                    0 0 4px rgb(from ${reference('--ui-color-surface-control')} r g b / 1);
            }
        }

        @keyframes ui-shimmer {
            from {
                --ui-fx-shimmer: 150%;
            }

            to {
                --ui-fx-shimmer: -50%;
            }
        }

        /* tint at the focus: the pointer's, for as long as the focus stays. */
        @container ${unsafeCSS(drawn('focus-fill', 'tint'))} {
            ${control}:focus-visible {
                background-color: ${tint};
            }
        }

        /* burst: the button's light bursting out round the control as the reader sees the focus
           arrive, and gone, on the shadow's place in the control's list. */
        @container ${unsafeCSS(drawn('focus-shadow', 'burst'))} {
            ${control}:focus-visible {
                --ui-fx-run-shadow: ui-burst ${reference('--ui-duration-flourish')}
                    ${reference('--ui-easing-enter')};
            }
        }

        @keyframes ui-burst {
            from {
                box-shadow: 0 0 0 0 rgb(from ${reference('--ui-color-accent')} r g b / 0.8);
            }

            to {
                box-shadow: 0 0 15px 10px rgb(from ${reference('--ui-color-accent')} r g b / 0);
            }
        }

        /* lift: the box round the control two pixels up, the control and its ring with it, for as
           long as the focus stays. */
        @container ${unsafeCSS(drawn('focus-move', 'lift'))} {
            .glow:has(> :focus-visible) {
                translate: 0 -2px;
            }
        }

        /* accent: the label in the accent with a fifth of the text's colour mixed in, so it still
           reads as a label, while the focus stays: the accent alone was 4.31:1 on Matrix's light
           page and on Glass's dark one, under the 4.5:1 text clears, and a fifth of the text took
           every theme and scheme to 5.4:1 or more — measured for RFC 0004. On the label's own
           transition, over an effect's time on the state's curve. */
        @container ${unsafeCSS(drawn('focus-label', 'accent'))} {
            label {
                transition: color ${reference('--ui-duration-effect')}
                    ${reference('--ui-easing-state')};
            }

            label:has(+ .glow > :focus-visible) {
                color: color-mix(
                    in oklab,
                    ${reference('--ui-color-accent')} 80%,
                    ${reference('--ui-color-text')}
                );
            }
        }

        /* glow: a light of the accent behind the label, which leaves its colour as it is, while
           the focus stays. */
        @container ${unsafeCSS(drawn('focus-label', 'glow'))} {
            label {
                transition: text-shadow ${reference('--ui-duration-effect')}
                    ${reference('--ui-easing-state')};
            }

            label:has(+ .glow > :focus-visible) {
                text-shadow: 0 0 0.5rem rgb(from ${reference('--ui-color-accent')} r g b / 0.7);
            }
        }

        /* The layer an error's border draws on, and the pointer's band on a field with no error:
           round the box, which it is laid out against, and taking no pointer, so the field itself
           never moves. */
        @container ${unsafeCSS(drawn('invalid-border', 'pulse'))} or ${unsafeCSS(drawn('invalid-border', 'split'))} or ${unsafeCSS(drawn('invalid-border', 'glow'))} or ${unsafeCSS(drawn('hover-border', 'edge'))} {
            .glow {
                position: relative;
            }

            .glow::before {
                content: '';
                position: absolute;
                inset: 0;
                border-radius: inherit;
                pointer-events: none;
            }
        }

        /* pulse: a band of the danger sent out from a field in error and fading, four rounds of a
           flourish and then at rest, as a loop does for a state that stands for as long as the
           reader leaves it. */
        @container ${unsafeCSS(drawn('invalid-border', 'pulse'))} {
            .glow:has(> [aria-invalid='true'])::before {
                animation: ui-pulse-danger ${reference('--ui-duration-flourish')}
                    ${reference('--ui-easing-enter')} ${reference('--ui-iteration-settle')};
            }
        }

        /* split: the boundary split into the danger and the info where it is, thrown a few pixels
           either way and back, as the glitch splits the ring. Its rounds are an effect's, about
           half the pulse's, so it plays twice as many and ends close to it, then rests. */
        @container ${unsafeCSS(drawn('invalid-border', 'split'))} {
            .glow:has(> [aria-invalid='true'])::before {
                animation: ui-split ${reference('--ui-duration-effect')} linear
                    calc(${reference('--ui-iteration-settle')} * 2);
            }
        }

        /* glow: a light of the danger held round a field in error, as the button's glow is held
           round it in the accent, for as long as the error stands; not round one that cannot be
           used, which lights nothing. */
        @container ${unsafeCSS(drawn('invalid-border', 'glow'))} {
            .glow:has(> [aria-invalid='true']:not(:disabled))::before {
                box-shadow: 0 0 0.75rem 0.125rem
                    rgb(from ${reference('--ui-color-danger')} r g b / 0.5);
            }
        }

        @keyframes ui-split {
            20% {
                box-shadow:
                    -3px 0 0 0 ${reference('--ui-color-danger')},
                    3px 0 0 0 ${reference('--ui-color-info')};
            }

            40% {
                box-shadow:
                    3px 0 0 0 ${reference('--ui-color-danger')},
                    -3px 0 0 0 ${reference('--ui-color-info')};
            }

            60% {
                box-shadow:
                    -2px 1px 0 0 ${reference('--ui-color-danger')},
                    2px -1px 0 0 ${reference('--ui-color-info')};
            }

            80% {
                box-shadow:
                    1px 0 0 0 ${reference('--ui-color-danger')},
                    -1px 0 0 0 ${reference('--ui-color-info')};
            }
        }

        @keyframes ui-pulse-danger {
            from {
                box-shadow: 0 0 0 0 rgb(from ${reference('--ui-color-danger')} r g b / 0.5);
            }

            to {
                box-shadow: 0 0 0 12px rgb(from ${reference('--ui-color-danger')} r g b / 0);
            }
        }

        /* flash: a field in error tinted from a fifth of the danger back to its fill, four rounds of
           a flourish on the curve a departure takes. Mixed into the fill rather than laid over it,
           since a field has text in it to read: laid over, the text of a field in error fell to
           3.14:1 at each round's start on Matrix's light page, and mixed in it holds 4.74:1 at the
           least, in every theme and scheme — measured for RFC 0004. The placeholder takes the halo
           below for as long as the flash plays. */
        @container ${unsafeCSS(drawn('invalid-fill', 'flash'))} {
            ${control}[aria-invalid='true'] {
                --ui-fx-run-error:
                    ui-flash ${reference('--ui-duration-flourish')} ${reference('--ui-easing-exit')}
                        ${reference('--ui-iteration-settle')},
                    ui-halo ${reference('--ui-duration-flourish')} linear
                        ${reference('--ui-iteration-settle')};
            }
        }

        @keyframes ui-flash {
            from {
                background-color: color-mix(
                    in oklab,
                    ${reference('--ui-color-danger')} 20%,
                    ${reference('--ui-color-surface-control')}
                );
            }
        }

        /* The focus ring glided over from the control the reader saw it on last, which the page's
           ring flies — src/ring.ts — as the button hands it the flight: the choice while the
           reader can see the focus, and its time and curve, never in forced colours. */
        @media (forced-colors: none) {
            @container ${unsafeCSS(drawn('focus-ring', 'glide'))} {
                ${control}:focus-visible {
                    --ui-fx-ring: glide;
                    --ui-fx-ring-time: ${reference('--ui-duration-travel')};
                    --ui-fx-ring-curve: ${reference('--ui-easing-move')};
                }
            }

            /* The refocus, as the button hands it: brought into focus from a blur as the focus
               arrives, and blurred away as it leaves, over a quarter again an effect's time. */
            @container ${unsafeCSS(drawn('focus-ring', 'refocus'))} {
                ${control}:focus-visible {
                    --ui-fx-ring: refocus;
                    --ui-fx-ring-time: ${reference('--ui-duration-effect')};
                    --ui-fx-ring-curve: ${reference('--ui-easing-enter')};
                    --ui-fx-ring-exit: ${reference('--ui-easing-exit')};
                }
            }

            /* The glitch, as the button hands it: shaken, and split into two lines thrown either
               way in the danger and the info, a flourish on a straight clock. */
            @container ${unsafeCSS(drawn('focus-ring', 'glitch'))} {
                ${control}:focus-visible {
                    --ui-fx-ring: glitch;
                    --ui-fx-ring-time: ${reference('--ui-duration-flourish')};
                    --ui-fx-ring-curve: linear;
                    --ui-fx-ring-left: ${reference('--ui-color-danger')};
                    --ui-fx-ring-right: ${reference('--ui-color-info')};
                }
            }
        }
    `;
}

/**
 * The lights a drawn control draws round itself, each on its `::after` from a property of its
 * own: what lays that layer out once one is chosen.
 */
const controlLights = [
    ['hover-shadow', 'raise'],
    ['hover-shadow', 'glow'],
    ['hover-shadow', 'cast'],
    ['focus-shadow', 'raise'],
    ['focus-shadow', 'inner'],
    ['invalid-border', 'glow'],
] as const;

/**
 * The cast at a drawn control's scale, a quarter of the card's where the button's is half: the
 * pointer as a light, the shadow falling away from it, and on a dark page the light spilling round
 * the side the pointer is on, as strong as the pointer is near.
 */
const controlCast = css`calc(var(--ui-fx-pointer-nx, 0) * -0.25rem)
        calc(var(--ui-fx-pointer-ny, 0) * -0.25rem + 0.125rem) 0.4375rem -0.0625rem
        light-dark(
            rgb(0 0 0 / calc(0.3 * var(--ui-fx-pointer-near, 0))),
            rgb(0 0 0 / calc(0.85 * var(--ui-fx-pointer-near, 0)))
        ),
    calc(var(--ui-fx-pointer-nx, 0) * 0.375rem) calc(var(--ui-fx-pointer-ny, 0) * 0.375rem) 0.75rem
        0.0625rem
        light-dark(
            transparent,
            rgb(from ${reference('--ui-color-accent')} r g b / calc(0.35 * var(--ui-fx-pointer-near, 0)))
        )`;

/**
 * The effects that draw in the sheen a drawn control is handed, in its own light: the shimmer at
 * the focus and the spotlight under the pointer.
 */
const controlSheened = [
    ['focus-fill', 'shimmer'],
    ['hover-fill', 'spotlight'],
] as const;

/** The lights that follow the pointer, which the pointer engine follows a drawn control for. */
const controlFollowing = [
    ['hover-fill', 'spotlight'],
    ['hover-shadow', 'cast'],
    ['hover-border', 'edge'],
] as const;

/**
 * The effects that leave a drawn control's boundary as it rests under the pointer: none, and the
 * edge, whose band is the pointer's answer in the darkening's place.
 */
const controlResting = [
    ['hover-border', 'none'],
    ['hover-border', 'edge'],
] as const;

/** The accent moved toward a full control's mark, which stands off the fill the accent is. */
const offAccent = css`color-mix(
    in oklab,
    ${reference('--ui-color-accent')},
    ${reference('--ui-color-accent-contrast')} 40%
)`;

/**
 * The inner light at a drawn control's scale, a quarter of the button's: a line of the accent along
 * the inside of the boundary, and its light from it.
 */
const controlInner = css`inset 0 0 0 1px ${reference('--ui-color-accent')},
    inset 0 0 0.375rem 0.0625rem rgb(from ${reference('--ui-color-accent')} r g b / 0.5)`;

/** The inner light over a full control, in the accent moved toward its mark. */
const controlInnerOnAccent = css`inset 0 0 0 1px ${offAccent},
    inset 0 0 0.375rem 0.0625rem rgb(from ${offAccent} r g b / 0.5)`;

/**
 * The sheen a shimmer sweeps across a full control, under its mark: the accent with a fifth of the
 * pole further from the mark mixed in, at half its strength, as a primary button's is from its
 * label.
 */
const sheenOnAccent = css`rgb(
    from color-mix(
            in oklab,
            ${reference('--ui-color-accent')},
            ${unsafeCSS(farPole(String(reference('--ui-color-accent-contrast'))))} 20%
        )
        r g b / 0.5
)`;

/**
 * The effects that draw a drawn control's boundary or its fill under the pointer, which an error's
 * red outlasts: what the red is drawn after once one is chosen.
 */
const controlPointing = [
    ['hover-border', 'none'],
    ['hover-border', 'edge'],
    ['hover-fill', 'highlight'],
    ['hover-fill', 'tint'],
] as const;

/**
 * The reference's spring for a switch's thumb: a `linear()` curve that carries it a fifth of its
 * way past its place, back a little short of it, and to rest by four fifths of the time.
 */
const bounce = css`linear(0, 0.45 7%, 0.98 15%, 1.18 22%, 1.22 26%, 1.15 32%, 0.97 44%, 0.94 52%, 1.01 66%, 1 78%, 1)`;

/**
 * The sheet of a drawn control's effects, for the component whose tag less `ui-` is `component`:
 * each effect drawn under that component's query, so its own taste reaches it — the checkbox's,
 * the switch's, and the radio's, which `ui-radio-group` draws the radios of.
 *
 * **What it asks of the component.** Its control is the `<input>` in its shadow root, drawn with
 * `appearance: none`, its mark on its `::before` — the tick, the dot — and its lights on its
 * `::after`, alone in a `<span class="frame">` that is its size and has its corners, with the text
 * that labels it the frame's next sibling; a switch's carries `role="switch"` and draws its thumb as
 * a background layer, whose `background-position` is the third of its transitions. `checked()` from
 * `src/check.ts` is called from the control's `change` listener, `arrive()` is bound to its focus
 * and `follow()` to the frame's `pointerover`, with `watch()` called as the component connects. The
 * sheet comes after the component's own.
 *
 * Built once for each component, as it is defined: a function, and safe as one, for the reason
 * {@link buttonEffects} gives.
 */
export function controlEffects(component: string): CSSResult {
    /** The condition one of the effects is drawn under, by moment and effect — see `drawn` above. */
    const drawn = query(component);

    /** True wherever any of the lights round the control is chosen. */
    const lit = unsafeCSS(
        controlLights.map(([moment, effect]) => drawn(moment, effect)).join(' or '),
    );

    /** True wherever an effect draws the boundary or the fill under the pointer. */
    const pointing = unsafeCSS(
        controlPointing.map(([moment, effect]) => drawn(moment, effect)).join(' or '),
    );

    /** True wherever an effect leaves the boundary as it rests under the pointer. */
    const resting = unsafeCSS(
        controlResting.map(([moment, effect]) => drawn(moment, effect)).join(' or '),
    );

    /** True wherever an effect draws in the sheen the control is handed. */
    const sheened = unsafeCSS(
        controlSheened.map(([moment, effect]) => drawn(moment, effect)).join(' or '),
    );

    /** True wherever a light that follows the pointer is chosen. */
    const following = unsafeCSS(
        controlFollowing.map(([moment, effect]) => drawn(moment, effect)).join(' or '),
    );

    return css`
        /* lift moves the control's place, so its place transitions once it is chosen, beside what
           the control already moves: its colours on the state's time, and the switch's thumb with
           them, and its place on an effect's, on the curve an arrival takes. Ahead of the check's
           rules, which outrank these by coming later: the mark's takes the colours out, and the
           spring times the switch's. */
        @container ${unsafeCSS(drawn('focus-move', 'lift'))} {
            input {
                transition-property: background-color, border-color, translate;
                transition-duration:
                    ${reference('--ui-duration-state')}, ${reference('--ui-duration-state')},
                    ${reference('--ui-duration-effect')};
                transition-timing-function:
                    ${reference('--ui-easing-state')}, ${reference('--ui-easing-state')},
                    ${reference('--ui-easing-enter')};
            }

            input[role='switch'] {
                transition-property: background-color, border-color, background-position, translate;
                transition-duration:
                    ${reference('--ui-duration-state')}, ${reference('--ui-duration-state')},
                    ${reference('--ui-duration-state')}, ${reference('--ui-duration-effect')};
                transition-timing-function:
                    ${reference('--ui-easing-state')}, ${reference('--ui-easing-state')},
                    ${reference('--ui-easing-state')}, ${reference('--ui-easing-enter')};
            }
        }

        /* The lights round the control, on its ::after, since its own shadow is the theme's glow:
           the pointer's, the focus's outside the boundary and inside it, and an error's, each from a
           property of its own, so all of them draw at once and the glow stays under them. The
           inner light's place rests on inset shadows, so it moves into its own rather than jumping.
           Moved on an effect's time. */
        @container ${lit} {
            input {
                position: relative;
            }

            input::after {
                content: '';
                position: absolute;
                inset: -1px;
                border-radius: inherit;
                box-shadow:
                    var(--ui-fx-lit-pointer, 0 0 #0000), var(--ui-fx-lit-focus, 0 0 #0000),
                    var(--ui-fx-lit-inner, inset 0 0 #0000, inset 0 0 #0000),
                    var(--ui-fx-lit-error, 0 0 #0000);
                transition: box-shadow ${reference('--ui-duration-effect')}
                    ${reference('--ui-easing-enter')};
            }
        }

        /* The pointer's, on a control the pointer can change and without the focus, which they
           yield to, where the pointer can hover: a tap leaves the hover behind.

           none, for the boundary: today's answer taken away — the boundary darkening on an empty
           control and the fill deepening on a full one — back to the colours at rest; a control in
           error keeps its red, on the control or on the set it is in; the edge leaves it so too,
           its band the answer in the darkening's place. highlight, for the fill: the
           hover colour, a secondary button's on an empty control and the deeper accent on a full
           one, after the boundary's, so a full control's fill is the fill's to choose. A full
           control's boundary goes with its fill, as it does today: left at the accent it drew a
           ring round a control that is only being pointed at. tint: the button's and a field's, a
           little of the accent in an empty control's fill, and the deeper accent in a full one's,
           as highlight draws it: in the empty control's tint a full one lost the accent under the
           pointer, and its mark with it — measured for RFC 0004, under Matrix. raise and glow: the
           button's drop and its light of the accent, on the lights' layer. Whatever draws the
           boundary or the fill, a control in error keeps its red, drawn after them all.

           A full control is a checked one, or a checkbox in the mixed state, which is drawn full: a
           radio is indeterminate wherever its group has no choice. In error each keeps the boundary
           it rests in — the red round a checked control, which comes after it, and the accent round
           a mixed one, whose own rule outweighs the red as the mixed state's does at rest. */
        @media (hover: hover) {
            @container ${resting} {
                input:hover:not(:disabled):not(:focus-visible) {
                    border-color: ${reference('--ui-color-border')};
                }

                input:checked:hover:not(:disabled):not(:focus-visible),
                input[type='checkbox']:indeterminate:hover:not(:disabled):not(:focus-visible) {
                    background-color: ${reference('--ui-color-accent')};
                    border-color: ${reference('--ui-color-accent')};
                }
            }

            @container ${unsafeCSS(drawn('hover-fill', 'highlight'))} {
                input:hover:not(:disabled):not(:focus-visible) {
                    background-color: ${reference('--ui-color-hover')};
                }

                input:checked:hover:not(:disabled):not(:focus-visible),
                input[type='checkbox']:indeterminate:hover:not(:disabled):not(:focus-visible) {
                    background-color: ${reference('--ui-color-accent-hover')};
                    border-color: ${reference('--ui-color-accent-hover')};
                }
            }

            @container ${unsafeCSS(drawn('hover-fill', 'tint'))} {
                input:hover:not(:disabled):not(:focus-visible) {
                    background-color: ${tint};
                }

                input:checked:hover:not(:disabled):not(:focus-visible),
                input[type='checkbox']:indeterminate:hover:not(:disabled):not(:focus-visible) {
                    background-color: ${reference('--ui-color-accent-hover')};
                    border-color: ${reference('--ui-color-accent-hover')};
                }
            }

            @container ${pointing} {
                input[aria-invalid='true']:hover:not(:disabled):not(:focus-visible),
                [aria-invalid='true'] input:hover:not(:disabled):not(:focus-visible) {
                    border-color: ${reference('--ui-color-danger')};
                }
            }

            @container ${unsafeCSS(drawn('hover-shadow', 'raise'))} {
                input:hover:not(:disabled):not(:focus-visible) {
                    --ui-fx-lit-pointer: ${raise};
                }
            }

            @container ${unsafeCSS(drawn('hover-shadow', 'glow'))} {
                input:hover:not(:disabled):not(:focus-visible) {
                    --ui-fx-lit-pointer: ${glow};
                }
            }

            /* The lights that follow the pointer, which the pointer engine follows for —
               src/pointer.ts — bound to the frame round the control, so the control, its layers
               and the frame's own all read where the pointer is in the control's box. Handed a
               duration it reads no other way, where a light is chosen and the control can be used,
               so the collapse takes it to nothing and nothing follows. */
            @container ${following} {
                .frame:has(> input:not(:disabled)) {
                    --ui-fx-follow: ${reference('--ui-duration-effect')};
                }
            }

            /* spotlight: the button's, a light where the pointer is, a quarter as strong as the
               sheen and fading out over 4rem, as strong as the pointer is near, at rest as under
               the pointer. In the sheen the control is handed and under its mark, as the button's
               lies under its label, so the mark holds what it holds under the sheen, at half the
               strength or less. Never on a switch, for the shimmer's reason. The focus wins. */
            @container ${unsafeCSS(drawn('hover-fill', 'spotlight'))} {
                input:not([role='switch']):not(:disabled):not(:focus-visible) {
                    background-image: ${spotlight};
                }
            }

            /* cast: the card's at a drawn control's scale, on the lights' layer, as strong as the
               pointer is near, whether it is over the control or not. The focus wins. */
            @container ${unsafeCSS(drawn('hover-shadow', 'cast'))} {
                input:not(:disabled):not(:focus-visible) {
                    --ui-fx-lit-pointer: ${controlCast};
                }
            }

            /* edge: a band on the boundary from its outer side in, lit where the pointer is nearest
               and as strong as it is near, on the frame's own layer — the control's two are its
               mark and its lights, and a band cut to the boundary would cut the lights with it. In
               the accent pushed off the page, and over a full control in the accent moved toward
               its mark, as over a primary button. After the control, so drawn over its boundary,
               and taking no pointer, so the control keeps its hover to its edge. Cut to the band as
               the button's is, Safari's prefixed mask first. Never round a control in error, which
               keeps its red, and the focus wins. */
            @container ${unsafeCSS(drawn('hover-border', 'edge'))} {
                .frame {
                    position: relative;
                }

                .frame::after {
                    content: '';
                    position: absolute;
                    inset: -1px;
                    padding: 2px;
                    border-radius: inherit;
                    pointer-events: none;
                    background: radial-gradient(
                        ellipse 100% 100% at var(--ui-fx-pointer-x, -999px)
                            var(--ui-fx-pointer-y, -999px),
                        var(--ui-fx-band),
                        transparent
                    );
                    -webkit-mask:
                        linear-gradient(#000 0 0) content-box,
                        linear-gradient(#000 0 0);
                    -webkit-mask-composite: xor;
                    mask:
                        linear-gradient(#000 0 0) content-box exclude,
                        linear-gradient(#000 0 0);
                    opacity: 0;
                    --ui-fx-band: ${far};
                }

                .frame:has(> input:checked)::after,
                .frame:has(> input[type='checkbox']:indeterminate)::after {
                    --ui-fx-band: ${offAccent};
                }

                .frame:has(> input:not(:disabled):not(:focus-visible))::after {
                    opacity: var(--ui-fx-pointer-near, 0);
                }

                /* As heavy as the rule above, and after it. */
                .frame:has(> input[aria-invalid='true']:not(:disabled))::after,
                [aria-invalid='true'] .frame:has(> input:not(:disabled))::after {
                    opacity: 0;
                }
            }
        }

        @container ${unsafeCSS(drawn('focus-shadow', 'raise'))} {
            input:focus-visible {
                --ui-fx-lit-focus: ${raise};
            }
        }

        /* highlight, for the fill at the focus: the pointer's, for as long as the focus stays — the
           hover colour in an empty control and the deeper accent in a full one, its boundary with
           it, and a control in error keeping its red after them. */
        @container ${unsafeCSS(drawn('focus-fill', 'highlight'))} {
            input:focus-visible {
                background-color: ${reference('--ui-color-hover')};
            }

            input:checked:focus-visible,
            input[type='checkbox']:indeterminate:focus-visible {
                background-color: ${reference('--ui-color-accent-hover')};
                border-color: ${reference('--ui-color-accent-hover')};
            }

            input[aria-invalid='true']:focus-visible,
            [aria-invalid='true'] input:focus-visible {
                border-color: ${reference('--ui-color-danger')};
            }
        }

        /* burst: the button's light bursting out round the control as the reader sees the focus
           arrive, and gone, on the focus's shadow's place in the control's list, at the button's
           size, which is a drawn control's: 10px out and 15px soft. */
        @container ${unsafeCSS(drawn('focus-shadow', 'burst'))} {
            input:focus-visible {
                --ui-fx-run-focus-shadow: ui-burst ${reference('--ui-duration-flourish')}
                    ${reference('--ui-easing-enter')};
            }
        }

        @keyframes ui-burst {
            from {
                box-shadow: 0 0 0 0 rgb(from ${reference('--ui-color-accent')} r g b / 0.8);
            }

            to {
                box-shadow: 0 0 15px 10px rgb(from ${reference('--ui-color-accent')} r g b / 0);
            }
        }

        /* inner: a light of the accent held inside the boundary at the focus, as a field's is, its
           blur at a drawn control's scale; over a full control in the accent moved toward its mark,
           as over a primary button: in the accent, over the accent, none of it showed — measured
           for RFC 0004. */
        @container ${unsafeCSS(drawn('focus-shadow', 'inner'))} {
            input:focus-visible {
                --ui-fx-lit-inner: ${controlInner};
            }

            input:checked:focus-visible,
            input[type='checkbox']:indeterminate:focus-visible {
                --ui-fx-lit-inner: ${controlInnerOnAccent};
            }
        }

        /* shimmer: a sheen swept across the control at the focus, ten degrees off upright and three
           quarters as wide as it, four rounds of the loop's period and then at rest, as the button
           sweeps it. Under the mark, on the control's own background, as the button's lies under
           its label: drawn over it, the sheen took a full control's mark to 2.47:1 at its peak, and
           under it the mark holds 5.82:1 or more in every palette — measured. Never on a switch:
           its thumb is a layer of the same background,
           which a sheen could only pass over, and an off thumb fell from 3:1 to 1.06:1 under any
           band — measured, so it is left out where it cannot be drawn honestly. In the sheen the
           control is handed below. */
        @container ${unsafeCSS(drawn('focus-fill', 'shimmer'))} {
            input:not([role='switch']):focus-visible {
                background-image: linear-gradient(
                    100deg,
                    transparent 35%,
                    var(--ui-fx-sheen) 50%,
                    transparent 65%
                );
                background-size: 250% 100%;
                background-position: var(--ui-fx-shimmer) 0;
                background-repeat: no-repeat;
                --ui-fx-run-focus-fill: ui-shimmer ${reference('--ui-duration-loop')} linear
                    ${reference('--ui-iteration-settle')};
            }
        }

        /* The sheen the shimmer and the spotlight draw in: over an empty control the one a
           secondary button sweeps, and over a full one the accent with a fifth of the pole further
           from its mark, as a primary button's is from its label. */
        @container ${sheened} {
            input {
                --ui-fx-sheen: ${sheenOverSurface};
            }

            input:checked,
            input[type='checkbox']:indeterminate {
                --ui-fx-sheen: ${sheenOnAccent};
            }
        }

        @keyframes ui-shimmer {
            from {
                --ui-fx-shimmer: 150%;
            }

            to {
                --ui-fx-shimmer: -50%;
            }
        }

        /* lift: the control two pixels up, its mark, its lights and its ring with it, for as long
           as the focus stays. */
        @container ${unsafeCSS(drawn('focus-move', 'lift'))} {
            input:focus-visible {
                translate: 0 -2px;
            }
        }

        /* The focus ring glided over from the control the reader saw it on last, as the button
           hands it the flight — src/ring.ts — never in forced colours. */
        @media (forced-colors: none) {
            @container ${unsafeCSS(drawn('focus-ring', 'glide'))} {
                input:focus-visible {
                    --ui-fx-ring: glide;
                    --ui-fx-ring-time: ${reference('--ui-duration-travel')};
                    --ui-fx-ring-curve: ${reference('--ui-easing-move')};
                }
            }

            /* The glitch, as the button hands it: shaken, and split into two lines thrown either
               way in the danger and the info, a flourish on a straight clock. */
            @container ${unsafeCSS(drawn('focus-ring', 'glitch'))} {
                input:focus-visible {
                    --ui-fx-ring: glitch;
                    --ui-fx-ring-time: ${reference('--ui-duration-flourish')};
                    --ui-fx-ring-curve: linear;
                    --ui-fx-ring-left: ${reference('--ui-color-danger')};
                    --ui-fx-ring-right: ${reference('--ui-color-info')};
                }
            }

            /* The refocus, as the button hands it: brought into focus from a blur as the focus
               arrives, and blurred away as it leaves, over a quarter again an effect's time. */
            @container ${unsafeCSS(drawn('focus-ring', 'refocus'))} {
                input:focus-visible {
                    --ui-fx-ring: refocus;
                    --ui-fx-ring-time: ${reference('--ui-duration-effect')};
                    --ui-fx-ring-curve: ${reference('--ui-easing-enter')};
                    --ui-fx-ring-exit: ${reference('--ui-easing-exit')};
                }
            }
        }

        /* accent: the control's label in the accent with a fifth of the text's colour mixed in, as a
           field's label takes it and for the floor that measured, while the focus stays. The label
           is the text beside the control, the frame's next sibling. On its own transition, over an
           effect's time on the state's curve. */
        @container ${unsafeCSS(drawn('focus-label', 'accent'))} {
            .frame + span {
                transition: color ${reference('--ui-duration-effect')}
                    ${reference('--ui-easing-state')};
            }

            .frame:has(> input:focus-visible) + span {
                color: color-mix(
                    in oklab,
                    ${reference('--ui-color-accent')} 80%,
                    ${reference('--ui-color-text')}
                );
            }
        }

        /* glow: a light of the accent behind the control's label, which leaves its colour as it
           is, while the focus stays, as a field's. */
        @container ${unsafeCSS(drawn('focus-label', 'glow'))} {
            .frame + span {
                transition: text-shadow ${reference('--ui-duration-effect')}
                    ${reference('--ui-easing-state')};
            }

            .frame:has(> input:focus-visible) + span {
                text-shadow: 0 0 0.5rem rgb(from ${reference('--ui-color-accent')} r g b / 0.7);
            }
        }

        /* The control's one list of animations, read from the kinds that animate it, each from a
           property of its own, so none takes another's away: the focus's shadow, which the burst
           writes; the focus's fill, which the shimmer writes; an error's boundary, which the pulse
           and the split write; and an error's fill.
           The two shadows are added to what is under it, so they go beside the glow a theme lights
           the control with rather than in its place — measured for RFC 0004 in all three engines.
           Chromium alone loses a glow written from currentColor while one is added to it, as
           Matrix's is: its ring and glow go for the burst's flourish and the split's rounds, and
           come back. A kind that plays nothing reads as none. */
        input {
            animation:
                var(--ui-fx-run-focus-shadow, none), var(--ui-fx-run-focus-fill, none),
                var(--ui-fx-run-error-border, none), var(--ui-fx-run-error-fill, none);
            animation-composition: add, replace, add, replace;
        }

        /* pulse: a band of the danger sent out from a control in error, or from each control of a
           set in error, and fading, four rounds of a flourish that settle, as a field's does. To
           10px rather than a field's 12: the pulse is one shape in a drawn control's size and a
           button's, RFC 0004 says, and a field takes the button's. */
        @container ${unsafeCSS(drawn('invalid-border', 'pulse'))} {
            input[aria-invalid='true'],
            [aria-invalid='true'] input {
                --ui-fx-run-error-border: ui-pulse-danger ${reference('--ui-duration-flourish')}
                    ${reference('--ui-easing-enter')} ${reference('--ui-iteration-settle')};
            }
        }

        @keyframes ui-pulse-danger {
            from {
                box-shadow: 0 0 0 0 rgb(from ${reference('--ui-color-danger')} r g b / 0.5);
            }

            to {
                box-shadow: 0 0 0 10px rgb(from ${reference('--ui-color-danger')} r g b / 0);
            }
        }

        /* glow: a light of the danger held round a control in error, or each control of a set in
           error, as the glow is held round it in the accent, for as long as the error stands; not
           round one that cannot be used, which lights nothing. On the lights' layer, beside the
           focus's. */
        @container ${unsafeCSS(drawn('invalid-border', 'glow'))} {
            input[aria-invalid='true']:not(:disabled),
            [aria-invalid='true'] input:not(:disabled) {
                --ui-fx-lit-error: 0 0 0.75rem 0.125rem
                    rgb(from ${reference('--ui-color-danger')} r g b / 0.5);
            }
        }

        /* split: the boundary split into the danger and the info where it is, thrown a few pixels
           either way and back, as a field's is, on the error boundary's place in the list. Its
           rounds are an effect's, about half the pulse's, so it plays twice as many and ends close
           to it, then rests. */
        @container ${unsafeCSS(drawn('invalid-border', 'split'))} {
            input[aria-invalid='true'],
            [aria-invalid='true'] input {
                --ui-fx-run-error-border: ui-split ${reference('--ui-duration-effect')} linear
                    calc(${reference('--ui-iteration-settle')} * 2);
            }
        }

        @keyframes ui-split {
            20% {
                box-shadow:
                    -3px 0 0 0 ${reference('--ui-color-danger')},
                    3px 0 0 0 ${reference('--ui-color-info')};
            }

            40% {
                box-shadow:
                    3px 0 0 0 ${reference('--ui-color-danger')},
                    -3px 0 0 0 ${reference('--ui-color-info')};
            }

            60% {
                box-shadow:
                    -2px 1px 0 0 ${reference('--ui-color-danger')},
                    2px -1px 0 0 ${reference('--ui-color-info')};
            }

            80% {
                box-shadow:
                    1px 0 0 0 ${reference('--ui-color-danger')},
                    -1px 0 0 0 ${reference('--ui-color-info')};
            }
        }

        /* flash: a control in error, or each control of a set in error, tinted from a fifth of the
           danger back to its fill, four rounds of a flourish on the curve a departure takes. The
           field's, mixed into the surface, so the two look alike, as RFC 0004 decided, and kept
           over what it costs: at each round's start the mark of a full control is all but lost,
           1.05:1 to 1.90:1 against the tint in every palette but Matrix's light one, and an off
           switch's thumb falls from 3.15:1 to 2.31:1 at the least — measured. Both come back as
           the round fades, and the flash settles. */
        @container ${unsafeCSS(drawn('invalid-fill', 'flash'))} {
            input[aria-invalid='true'],
            [aria-invalid='true'] input {
                --ui-fx-run-error-fill: ui-flash ${reference('--ui-duration-flourish')}
                    ${reference('--ui-easing-exit')} ${reference('--ui-iteration-settle')};
            }
        }

        @keyframes ui-flash {
            from {
                background-color: color-mix(
                    in oklab,
                    ${reference('--ui-color-danger')} 20%,
                    ${reference('--ui-color-surface-control')}
                );
            }
        }

        /* draw and pop: the mark src/check.ts plays on the control's ::before as the reader checks
           it. The sheet decides and the script only reads: the effect, and the time and curve it
           plays over, on a control that can be used. The tick drawn over an effect's time on the
           curve an arrival takes; the dot popped in on the emphasis curve, which passes its rest. */
        @container ${unsafeCSS(drawn('check', 'draw'))} {
            input:not(:disabled) {
                --ui-fx-check: draw;
                --ui-fx-check-time: ${reference('--ui-duration-effect')};
                --ui-fx-check-curve: ${reference('--ui-easing-enter')};
            }
        }

        @container ${unsafeCSS(drawn('check', 'pop'))} {
            input:not(:disabled) {
                --ui-fx-check: pop;
                --ui-fx-check-time: ${reference('--ui-duration-effect')};
                --ui-fx-check-curve: ${reference('--ui-easing-emphasis')};
            }
        }

        /* While the mark plays the control takes its colour at once, for the reason src/check.ts
           gives: its colours leave the transitions, which ends their fade where it was going. */
        input[data-check] {
            transition-property: none;
        }

        /* spring: the switch's thumb carried past its place and back on the reference's spring,
           over a flourish, on a track that takes its colour at once. On the emphasis curve over
           the state's fade, the thumb went 1.1px past a travel of 14px, white on a track still
           pale, and read as the slide it stood in for — measured for RFC 0004; the spring takes it
           about 3px past, short on the way back, and to rest. */
        @container ${unsafeCSS(drawn('check', 'spring'))} {
            input[role='switch'] {
                transition-duration:
                    0s, 0s, ${reference('--ui-duration-flourish')},
                    ${reference('--ui-duration-effect')};
                transition-timing-function:
                    linear, linear, ${bounce}, ${reference('--ui-easing-enter')};
            }
        }
    `;
}

/**
 * A surface's raise: the theme's lift drawn a second time, with a drop under it, in the accent a
 * theme lights a glow in. A shadow barely shows on a dark page, which nothing is much darker than,
 * so there the drop is near black and wider, and the boundary catches the light, brightest along
 * the top — RFC 0004's prototype, as its review settled it.
 */
const surfaceRaise = css`
    ${reference('--ui-elevation-raised')},
    inset 0 1px 0 light-dark(transparent, rgb(255 255 255 / 0.22)),
    inset 0 0 0 1px light-dark(transparent, rgb(255 255 255 / 0.12)),
    0 0.75rem 1.75rem -0.5rem light-dark(rgb(0 0 0 / 0.35), transparent),
    0 1rem 2.5rem -0.25rem light-dark(transparent, rgb(0 0 0 / 0.9)),
    0 0.25rem 0.75rem light-dark(transparent, rgb(0 0 0 / 0.5))
`;

/** A surface's glow: a light of the accent round it, at a surface's size. */
const surfaceGlow = css`0 0 1rem 0.125rem rgb(from ${reference('--ui-color-accent')} r g b / 0.45),
    0 0 2.5rem 0.5rem rgb(from ${reference('--ui-color-accent')} r g b / 0.25)`;

/**
 * A surface's tint: a little of the accent in its own fill, as a field's is in its own. Held light
 * in the light scheme and at a tenth in the dark, so every shipped palette's text and muted text
 * hold 4.5:1 over it, and at least 0.6 opaque over a surface a theme lets the page through, where
 * at the glass's own opacity nothing showed — measured for RFC 0004, the card at both of Glass's
 * page limits.
 */
const surfaceTint = css`light-dark(
    oklch(
        from color-mix(in oklab, ${reference('--ui-color-surface-raised')} 88%, ${reference('--ui-color-accent')})
            max(l, 0.98) c h / max(alpha, 0.6)
    ),
    oklch(
        from color-mix(in oklab, ${reference('--ui-color-surface-raised')} 90%, ${reference('--ui-color-accent')})
            l c h / max(alpha, 0.6)
    )
)`;

/**
 * A surface's cast: the pointer as a light, the shadow falling away from it the further the further
 * the pointer is from the middle, and on a dark page, where a shadow barely shows, the light spilling
 * round the side the pointer is on — the card's own, of which a button's and a field's are half. It
 * reaches past a glow a theme may already draw round the surface. Faded in on its layer, as strong
 * as the pointer is near.
 */
const surfaceCast = css`calc(var(--ui-fx-pointer-nx, 0) * -1rem)
        calc(var(--ui-fx-pointer-ny, 0) * -1rem + 0.5rem) 1.75rem -0.25rem
        light-dark(rgb(0 0 0 / 0.3), rgb(0 0 0 / 0.85)),
    calc(var(--ui-fx-pointer-nx, 0) * 1.5rem) calc(var(--ui-fx-pointer-ny, 0) * 1.5rem) 3rem 0.25rem
        light-dark(transparent, rgb(from ${reference('--ui-color-accent')} r g b / 0.35))`;

/**
 * A surface's spotlight: its tint where the pointer is, in a circle 16rem out that fades to nothing
 * seven tenths of the way. The tint rather than the accent, so what rests on the surface holds the
 * contrast the tint was measured at.
 */
const surfaceSpotlight = css`radial-gradient(
    16rem circle at var(--ui-fx-pointer-x, -999px) var(--ui-fx-pointer-y, -999px),
    ${surfaceTint},
    transparent 70%
)`;

/**
 * A surface's sheen, the shimmer's: its tint swept across it, where a button sweeps the accent. The
 * accent's sheen took a surface's muted text, at its peak, to 1.97:1, and under 4.5:1 in every
 * shipped palette and scheme — measured. A field's answer, a halo round its text, would be inherited
 * by everything a surface holds, and ring a light label on a fill of its own in the surface's colour.
 * Over the tint every shipped palette's text and muted text hold 4.5:1, as they do under the
 * surface's other lights.
 */
const surfaceSheen = css`linear-gradient(100deg, transparent 35%, ${surfaceTint} 50%, transparent 65%)`;

/**
 * The effects drawn under a surface's content, on a layer a stacking context of the surface's own
 * has to keep over its fill: its fills, and the light held inside its boundary. Where one is chosen,
 * the surface is isolated.
 */
const surfaceUnder = [
    ['hover-fill', 'tint'],
    ['hover-fill', 'spotlight'],
    ['focus-fill', 'tint'],
    ['focus-fill', 'shimmer'],
    ['focus-shadow', 'inner'],
] as const;

/** The effects that follow the pointer, which the pointer engine follows a surface for. */
const surfaceFollowing = [
    ['hover-fill', 'spotlight'],
    ['hover-shadow', 'cast'],
    ['hover-border', 'edge'],
    ['hover-move', 'tilt'],
] as const;

/** The effects that move the surface itself, which its host transitions once one is chosen. */
const surfaceMoves = [
    ['focus-move', 'lift'],
    ['hover-move', 'tilt'],
] as const;

/**
 * The sheet of a surface's effects, for the component whose tag less `ui-` is `component`: what the
 * pointer and a focus on something the surface holds do to it, each drawn under that component's
 * query — the card's, and the toast's to come.
 *
 * **Each moment draws on a layer of its own**, which the component renders empty into its shadow
 * root, one per kind and moment: `<span data-layer="fill">`, `"shadow"` and `"border"` for the
 * pointer, and `"focus-fill"` and `"focus-shadow"` for the focus. A layer holds its effect's picture
 * at all times and fades in and out by its opacity alone, so a picture is never taken away under a
 * fade; and the pointer's and the focus's are apart, so each keeps its own. Not the theme's shadow
 * moved: a theme may write its glow in currentColor, as Matrix does, and Chromium carried such a
 * glow through transparent for the length of a transition, so the card went dark and lit again —
 * measured for RFC 0004.
 *
 * **A fill lies under the content, and so does a light held inside the boundary, and that takes a
 * stacking context.** A layer under the content but over the surface's own fill needs the surface
 * isolated, and an isolated surface keeps what it holds from stacking over what follows it: a
 * host's own dropdown with a `z-index`, one that is no popover, falls under the next card. So the
 * surface is isolated only where one of them is chosen — under Matrix and Glass, the second of which
 * isolates it already with its glass — and the default theme leaves it as it was.
 *
 * **The lights that follow the pointer read where it is from the engine**, `src/pointer.ts`, which
 * the sheet hands a duration on the host where one of them is chosen and the pointer can hover. The
 * spotlight and the cast fade in on their layers as strong as the pointer is near, and so does the
 * edge, a band the border's layer is cut to, over the content, where the content never reaches. The
 * tilt turns the host toward the pointer, which takes a transform, and a transformed host is a
 * stacking context and the box what it holds that is fixed is placed in, as Glass's glass makes it
 * already.
 *
 * **What it asks of the component.** Its surface is its host, laid out against itself, holding the
 * layers, marked `data-focus-visible` while a focus the reader can see is in it, by `held()` from
 * `src/held.ts` bound to its `focusin` and `released()` to its `focusout`, and followed by `follow()`
 * from `src/pointer.ts` bound to its `pointerover`. The sheet comes after the component's own. An
 * effect drawn on the host — a move, the isolation, and the duration the engine is handed — is drawn
 * under a query that asks the host's surroundings and never the host itself: a choice written on the
 * one card alone does not reach it, nor a fill chosen there, which then lies behind the card's own,
 * nor a light that follows the pointer, which the engine is then never handed — RFC 0004's S8, which
 * the card leaves marked.
 *
 * Built once for each component, as it is defined: a function, and safe as one, for the reason
 * {@link buttonEffects} gives.
 */
export function surfaceEffects(component: string): CSSResult {
    /** The condition one of the effects is drawn under, by moment and effect — see `drawn` above. */
    const drawn = query(component);

    /** True wherever one of `effects` is chosen, by a consumer or a taste. */
    const chosen = (effects: readonly (readonly [string, string])[]): CSSResult =>
        unsafeCSS(effects.map(([moment, effect]) => drawn(moment, effect)).join(' or '));

    return css`
        /* A layer per moment and kind that draws, over the boundary, taking no pointer, and
           invisible until an effect gives it something to fade in. */
        [data-layer] {
            position: absolute;
            inset: -1px;
            border-radius: inherit;
            pointer-events: none;
            opacity: 0;
        }

        /* A fill, inside the boundary and under the content. */
        [data-layer='fill'],
        [data-layer='focus-fill'] {
            inset: 0;
            z-index: -1;
        }

        /* A border, cut to a band over the boundary and a pixel inside it: the layer less its
           content box. Safari reads no content-box in the mask, prefixed or not, but its own
           prefixed mask's, so that one comes first and the standard one after it, which the other
           engines take and Safari drops. */
        [data-layer='border'] {
            padding: 2px;
            -webkit-mask:
                linear-gradient(#000 0 0) content-box,
                linear-gradient(#000 0 0);
            -webkit-mask-composite: xor;
            mask:
                linear-gradient(#000 0 0) content-box exclude,
                linear-gradient(#000 0 0);
        }

        /* The stacking context what lies under the content takes, only where some of it is
           chosen. */
        @container ${chosen(surfaceUnder)} {
            :host {
                isolation: isolate;
            }
        }

        /* The lights that follow the pointer, and the tilt, which the pointer engine follows the
           surface for — src/pointer.ts. Handed a duration it reads no other way, where one of them
           is chosen and the pointer can hover, so the collapse takes it to nothing and nothing
           follows. */
        @media (hover: hover) {
            @container ${chosen(surfaceFollowing)} {
                :host {
                    --ui-fx-follow: ${reference('--ui-duration-effect')};
                }
            }
        }

        /* What moves the surface itself transitions only once one of them is chosen: its place
           over an effect's time on the curve an arrival takes, and its turn toward the pointer
           over the time a movement that follows it takes, on a straight clock. */
        @container ${chosen(surfaceMoves)} {
            :host {
                transition-property: translate, transform;
                transition-duration:
                    ${reference('--ui-duration-effect')}, ${reference('--ui-duration-follow')};
                transition-timing-function: ${reference('--ui-easing-enter')}, linear;
            }
        }

        /* tint under the pointer, a little of the accent in the surface's own fill, faded in over
           the state's time; and at a focus the reader can see in it, on its own layer. */
        @container ${unsafeCSS(drawn('hover-fill', 'tint'))} {
            [data-layer='fill'] {
                background-color: ${surfaceTint};
                transition: opacity ${reference('--ui-duration-state')}
                    ${reference('--ui-easing-state')};
            }

            @media (hover: hover) {
                :host(:hover:not([data-focus-visible])) [data-layer='fill'] {
                    opacity: 1;
                }
            }
        }

        @container ${unsafeCSS(drawn('focus-fill', 'tint'))} {
            [data-layer='focus-fill'] {
                background-color: ${surfaceTint};
                transition: opacity ${reference('--ui-duration-state')}
                    ${reference('--ui-easing-state')};
            }

            :host([data-focus-visible]) [data-layer='focus-fill'] {
                opacity: 1;
            }
        }

        /* spotlight: the tint where the pointer is, as strong as it is near, whether it is over the
           surface or on its way off it. The focus wins. */
        @container ${unsafeCSS(drawn('hover-fill', 'spotlight'))} {
            [data-layer='fill'] {
                background-image: ${surfaceSpotlight};
            }

            :host(:not([data-focus-visible])) [data-layer='fill'] {
                opacity: var(--ui-fx-pointer-near, 0);
            }
        }

        /* shimmer: the surface's sheen swept across it at a focus the reader can see in it, ten
           degrees off upright and three quarters as wide as the surface, from before its start to
           past its end, four rounds of the loop's period and then at rest before the start, on the
           focus's layer, through the property the button's moves through. */
        @container ${unsafeCSS(drawn('focus-fill', 'shimmer'))} {
            [data-layer='focus-fill'] {
                background-image: ${surfaceSheen};
                background-size: 250% 100%;
                background-position: var(--ui-fx-shimmer) 0;
                background-repeat: no-repeat;
            }

            :host([data-focus-visible]) [data-layer='focus-fill'] {
                opacity: 1;
                animation: ui-shimmer ${reference('--ui-duration-loop')} linear
                    ${reference('--ui-iteration-settle')};
            }
        }

        @keyframes ui-shimmer {
            from {
                --ui-fx-shimmer: 150%;
            }

            to {
                --ui-fx-shimmer: -50%;
            }
        }

        /* glow under the pointer: a light of the accent round the surface, faded in as the raise
           is. A halo and no ring: a ring at the boundary read as a border, which is another kind's
           to draw. */
        @container ${unsafeCSS(drawn('hover-shadow', 'glow'))} {
            [data-layer='shadow'] {
                box-shadow: ${surfaceGlow};
                transition: opacity ${reference('--ui-duration-effect')}
                    ${reference('--ui-easing-enter')};
            }

            @media (hover: hover) {
                :host(:hover:not([data-focus-visible])) [data-layer='shadow'] {
                    opacity: 1;
                }
            }
        }

        /* raise under the pointer, faded in on its layer over an effect's time on the curve an
           arrival takes, where the pointer can hover: a tap leaves the hover behind. Never while
           a focus the reader can see is in the surface, which wins. */
        @container ${unsafeCSS(drawn('hover-shadow', 'raise'))} {
            [data-layer='shadow'] {
                color: ${reference('--ui-color-accent')};
                box-shadow: ${surfaceRaise};
                transition: opacity ${reference('--ui-duration-effect')}
                    ${reference('--ui-easing-enter')};
            }

            @media (hover: hover) {
                :host(:hover:not([data-focus-visible])) [data-layer='shadow'] {
                    opacity: 1;
                }
            }
        }

        /* cast: the surface's shadow thrown away from the pointer, on its layer, as strong as the
           pointer is near. The focus wins. */
        @container ${unsafeCSS(drawn('hover-shadow', 'cast'))} {
            [data-layer='shadow'] {
                box-shadow: ${surfaceCast};
            }

            :host(:not([data-focus-visible])) [data-layer='shadow'] {
                opacity: var(--ui-fx-pointer-near, 0);
            }
        }

        /* raise at a focus the reader can see in the surface, on its own layer. */
        @container ${unsafeCSS(drawn('focus-shadow', 'raise'))} {
            [data-layer='focus-shadow'] {
                color: ${reference('--ui-color-accent')};
                box-shadow: ${surfaceRaise};
                transition: opacity ${reference('--ui-duration-effect')}
                    ${reference('--ui-easing-enter')};
            }

            :host([data-focus-visible]) [data-layer='focus-shadow'] {
                opacity: 1;
            }
        }

        /* inner: the button's light held inside the boundary, under the content, for as long as a
           focus the reader can see is in the surface, faded in as the raise is. */
        @container ${unsafeCSS(drawn('focus-shadow', 'inner'))} {
            [data-layer='focus-shadow'] {
                z-index: -1;
                box-shadow: ${inner};
                transition: opacity ${reference('--ui-duration-effect')}
                    ${reference('--ui-easing-enter')};
            }

            :host([data-focus-visible]) [data-layer='focus-shadow'] {
                opacity: 1;
            }
        }

        /* burst: the button's light bursting out round the surface as the focus arrives in it, and
           gone, on the focus's layer, at the button's size. */
        @container ${unsafeCSS(drawn('focus-shadow', 'burst'))} {
            :host([data-focus-visible]) [data-layer='focus-shadow'] {
                opacity: 1;
                animation: ui-burst ${reference('--ui-duration-flourish')}
                    ${reference('--ui-easing-enter')};
            }
        }

        @keyframes ui-burst {
            from {
                box-shadow: 0 0 0 0 rgb(from ${reference('--ui-color-accent')} r g b / 0.8);
            }

            to {
                box-shadow: 0 0 15px 10px rgb(from ${reference('--ui-color-accent')} r g b / 0);
            }
        }

        /* edge: the band lit where the pointer is nearest, in the accent pushed off the page, its
           light fading over the surface's own width across and its own height down, as strong as
           the pointer is near. The layer's box is the surface's, so the pointer is where the engine
           writes it. The focus wins. */
        @container ${unsafeCSS(drawn('hover-border', 'edge'))} {
            [data-layer='border'] {
                background-image: radial-gradient(
                    ellipse 100% 100% at var(--ui-fx-pointer-x, -999px)
                        var(--ui-fx-pointer-y, -999px),
                    ${far},
                    transparent
                );
            }

            :host(:not([data-focus-visible])) [data-layer='border'] {
                opacity: var(--ui-fx-pointer-near, 0);
            }
        }

        /* lift: the whole surface a quarter rem up, the button's two pixels at a surface's give,
           for as long as a focus the reader can see is in it — on the host, which S8 leaves out of
           reach of a choice made on the one surface. */
        @container ${unsafeCSS(drawn('focus-move', 'lift'))} {
            :host([data-focus-visible]) {
                translate: 0 -0.25rem;
            }
        }

        /* tilt: the whole surface turned toward the pointer, five degrees at most each way, as far
           as the pointer is from the middle and as strong as it is near, seen from 60rem off — on
           the host, as the lift is, and only where the pointer can hover. The focus wins, and the
           surface turns back flat. */
        @media (hover: hover) {
            @container ${unsafeCSS(drawn('hover-move', 'tilt'))} {
                :host(:not([data-focus-visible])) {
                    transform: perspective(60rem)
                        rotateX(
                            calc(var(--ui-fx-pointer-ny, 0) * var(--ui-fx-pointer-near, 0) * -5deg)
                        )
                        rotateY(
                            calc(var(--ui-fx-pointer-nx, 0) * var(--ui-fx-pointer-near, 0) * 5deg)
                        );
                }
            }
        }
    `;
}

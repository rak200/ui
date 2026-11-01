/**
 * The effects a component draws — RFC 0004's: one sheet for each kind of control, which a
 * component of that kind adopts. A button's, for what the pointer, the focus and a press do to it;
 * and a field's, for what the pointer and the focus do to a control a reader types or chooses in,
 * {@link fieldEffects}, which the rest of this docblock leaves to its own.
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
           which the focus's burst writes, and an error's fill's, which the flash writes. One list,
           since an element has one, and two rules writing it leave one effect unplayed; a kind
           that plays nothing reads as none. */
        ${control} {
            animation: var(--ui-fx-run-shadow, none), var(--ui-fx-run-error, none);
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

        /* The layer an error's border draws on: round the box, which it is laid out against, and
           taking no pointer, so the field itself never moves. */
        @container ${unsafeCSS(drawn('invalid-border', 'pulse'))} or ${unsafeCSS(drawn('invalid-border', 'split'))} {
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
           least, in every theme and scheme — measured for RFC 0004. An empty field's placeholder
           does not: its colour clears 4.5:1 at rest and no more, so the first frames of each round
           take it to 3.49:1 at the least, on Matrix's light page, and no share of the danger that
           still shows holds it there. The one dip the package accepts; tests/tokens.test.ts holds
           it to 3:1. */
        @container ${unsafeCSS(drawn('invalid-fill', 'flash'))} {
            ${control}[aria-invalid='true'] {
                --ui-fx-run-error: ui-flash ${reference('--ui-duration-flourish')}
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

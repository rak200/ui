import { LitElement, css, html, unsafeCSS, type TemplateResult } from 'lit';
import { Description } from './description.js';
import { query } from './motion.js';
import { reference } from './reference.js';
import { arrive, watch } from './ring.js';
import { press } from './shatter.js';

/** How much visual weight a button carries. */
export type ButtonVariant = 'primary' | 'secondary';

/**
 * The condition one of the button's effects is drawn under, by moment and effect — RFC 0004.
 *
 * Each sheet below wraps it in `unsafeCSS` where it uses it, rather than through a helper of this
 * module's own: the sheet is built once, at import, so a helper's body is code no test calls
 * while it runs, and the one mutant that empties it took the import down, which the runner grades
 * as a survivor — measured, on this module's first run.
 */
const drawn = query('button');

/**
 * The effects that move the button's shadow, its place or its size, each by the moment it
 * answers. Its fill always moves on the state's own transition, and the burst is an animation,
 * which needs none.
 */
const effects = [
    ['hover-shadow', 'raise'],
    ['hover-shadow', 'glow'],
    ['focus-shadow', 'raise'],
    ['focus-shadow', 'inner'],
    ['focus-move', 'lift'],
    ['press-move', 'squish'],
    ['press-move', 'spring'],
    ['press-shadow', 'sink'],
] as const;

/** True wherever any of those is chosen, by a consumer or a taste. */
const moving = unsafeCSS(effects.map(([moment, effect]) => drawn(moment, effect)).join(' or '));

/** Where the fill under the pointer is the tint. */
const pointerTint = unsafeCSS(drawn('hover-fill', 'tint'));

/** Where the pointer leaves the fill as it rests. */
const pointerNone = unsafeCSS(drawn('hover-fill', 'none'));

/** Where the fill at the focus is the hover colour. */
const focusHighlight = unsafeCSS(drawn('focus-fill', 'highlight'));

/** Where a press brings no colour of its own. */
const pressNone = unsafeCSS(drawn('press-fill', 'none'));

/**
 * Where a choice for the pointer's shadow takes the place of the glow a theme lights a button
 * with under the pointer, which is that moment's answer from before effects existed: `none`
 * among them, since `none` is nothing.
 */
const pointerShadow = unsafeCSS(
    ['none', 'raise', 'glow'].map((effect) => drawn('hover-shadow', effect)).join(' or '),
);

/** Where a choice for the focus's shadow does the same at the focus, which wins over the pointer. */
const focusShadow = unsafeCSS(
    ['none', 'raise', 'burst', 'inner'].map((effect) => drawn('focus-shadow', effect)).join(' or '),
);

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
 * A button.
 *
 * It delegates to a real `<button>` in its shadow root rather than reimplementing one,
 * which is what makes the keyboard behaviour, the accessible name and the disabled
 * semantics the platform's job instead of this file's. No state machine is involved
 * because a button has no state to model.
 *
 * @example
 * ```html
 * <ui-button variant="primary">Save</ui-button>
 * ```
 */
export class UiButton extends LitElement {
    /** The styles its shadow root adopts. */
    static override readonly styles = css`
        :host {
            display: inline-block;
        }

        button {
            font: inherit;
            font-family: ${reference('--ui-font')};
            border: 1px solid transparent;
            border-radius: ${reference('--ui-radius')};
            padding: ${reference('--ui-space')} calc(${reference('--ui-space')} * 2);
            cursor: pointer;
            /* Measured in WebKit and in Chromium under a phone viewport: the platform
           paints its own wash on tap — 40% black in WebKit, the Android blue in
           Chromium — over whatever the component decided, so the pressed colour below
           arrives underneath it and is not what a finger sees.

           Removing it is only correct because the pressed state exists. Until it did,
           this wash was the ONLY response a touch got, and turning it off would have
           left a button that answers a finger with nothing. */
            -webkit-tap-highlight-color: transparent;
            /* Only the colour moves. The focus ring is deliberately not in this list:
           delaying the affordance that says *this is where you are* is the opposite of
           what it exists to do. */
            transition: background-color ${reference('--ui-duration-state')}
                ${reference('--ui-easing-state')};
            /* What a theme's glow is laid out against. */
            position: relative;
        }

        /* What a theme's glow is drawn on: a layer over the button rather than the button,
           because a theme writes the glow in currentColor and a button's own colour is its
           label. inset: -1px reaches back over the border, so the glow hugs the boundary. */
        button::before {
            content: '';
            position: absolute;
            inset: -1px;
            border-radius: inherit;
            color: ${reference('--ui-color-accent')};
            box-shadow: ${reference('--ui-elevation-control')};
        }

        button:not(:disabled):hover::before {
            box-shadow: ${reference('--ui-elevation-control-hover')};
        }

        /* The edge, and the lift a theme gives a button, on a layer of their own over the
           border the button keeps as room. The layer's colour is the variant's — the text on
           a secondary button, nothing on a primary — and the edge defaults to it, so each
           draws what it drew before until a theme softens the edge. A button hovers on its
           fill, and on its edge too where a theme gives the pointer one: a translucent fill's
           own hover is the least of what moves. */
        button::after {
            content: '';
            position: absolute;
            inset: -1px;
            border: 1px solid ${reference('--ui-color-border-button')};
            border-radius: inherit;
            box-shadow: ${reference('--ui-elevation-button')};
            transition: border-color ${reference('--ui-duration-state')}
                ${reference('--ui-easing-state')};
        }

        button.primary::after {
            color: transparent;
        }

        button:not(:disabled):hover::after {
            border-color: ${reference('--ui-color-border-button-hover')};
        }

        button:disabled {
            cursor: not-allowed;
            opacity: 0.5;
        }

        /* Nothing that cannot be used glows: a glow says a control is there to be reached. */
        button:disabled::before {
            box-shadow: none;
        }

        /* A visible focus ring is not decoration: removing it is the single most common
       way a component stops being usable by keyboard. */
        button:focus-visible {
            outline: 2px solid ${reference('--ui-color-focus')};
            outline-offset: 2px;
        }

        /* The primary's own four names, which are the accent's until a theme fills the
           button apart from the checked controls — Glass inverts it. */
        button.primary {
            background: ${reference('--ui-color-primary')};
            color: ${reference('--ui-color-primary-contrast')};
        }

        /* A control's fill, as a field's: a theme may let the page through it. */
        button.secondary {
            background: ${reference('--ui-color-surface-control')};
            color: ${reference('--ui-color-text')};
        }

        /* The :not(:disabled) guard is measured rather than assumed: a disabled button
       still matches :hover and :active, so without it the button would light up under a
       pointer that cannot activate it. Ordering does not substitute for the guard — both
       rules below outrank the resting one on specificity whatever their position. */
        button.primary:not(:disabled):hover {
            background: ${reference('--ui-color-primary-hover')};
        }

        button.secondary:not(:disabled):hover {
            background: ${reference('--ui-color-hover')};
        }

        /* A press is over in about 100ms, so an entering transition of 150ms would land
       after the finger has left and the pressed colour would never be seen. Zero here
       rather than a second token: it is a fact about how long a click lasts, not a
       decision a host would want to retune. And the pressed state is never the only
       feedback a component gives — activating by Enter produces no :active at all. */
        button.primary:not(:disabled):active {
            background: ${reference('--ui-color-primary-pressed')};
            transition-duration: 0s;
        }

        button.secondary:not(:disabled):active {
            background: ${reference('--ui-color-pressed')};
            transition-duration: 0s;
        }

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
        @container ${pointerNone} {
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

        /* none under a press: no colour of its own, so the fill stays as the pointer and the
           focus left it — at rest, then under the pointer, then at the focus, each over the
           last, as the colours above are. */
        @container ${pressNone} {
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

        @container ${pressNone} and ${pointerTint} {
            button.secondary:not(:disabled):hover:active {
                background: ${tint};
            }
        }

        @container ${pressNone} and ${pointerNone} {
            button.primary:not(:disabled):hover:active {
                background: ${reference('--ui-color-primary')};
            }

            button.secondary:not(:disabled):hover:active {
                background: ${reference('--ui-color-surface-control')};
            }
        }

        @container ${pressNone} and ${focusHighlight} {
            button.primary:not(:disabled):focus-visible:active {
                background: ${reference('--ui-color-primary-hover')};
            }

            button.secondary:not(:disabled):focus-visible:active {
                background: ${reference('--ui-color-hover')};
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

    /** The properties Lit observes on this element. */
    static override readonly properties = {
        variant: { type: String, reflect: true },
        disabled: { type: Boolean, reflect: true },
    };

    /**
     * How much visual weight the button carries.
     *
     * A plain field, not the `accessor` keyword: `accessor` is an auto-accessor, the
     * browser the suite runs in does not implement it, and the transform leaves it in
     * place — the module then fails to parse. The classic Lit pattern, a `static
     * properties` map beside plain fields with `useDefineForClassFields: false`, needs
     * neither the keyword nor decorators.
     */
    variant: ButtonVariant = 'primary';

    /** Whether the button rejects interaction. Reflected, so CSS can select on it. */
    disabled = false;

    /**
     * The sentence a `<ui-tooltip>` handed over, and the node its `<button>` points at.
     *
     * **Built in the field initialiser**, which runs inside the constructor: the tooltip
     * waits on `customElements.whenDefined` before it hands anything over and that
     * resolves after the constructor, so this is in time where a listener added on first
     * render would not be.
     *
     * Private, because a writable `description` is the option RFC 0006 rejected twice
     * over: it makes the host write a sentence the tooltip is already holding, and a
     * property written before an element upgrades shadows its accessor permanently on
     * anything not built on Lit. What is public here is the event, which reports whether
     * anyone took it.
     */
    readonly #description = new Description(this);

    /**
     * Starts watching the page's focus as the first button connects, so the ring the reader saw
     * before the button's first focus is already recorded when the glide needs it.
     */
    override connectedCallback(): void {
        super.connectedCallback();
        watch();
    }

    /** A native `<button>` around the default slot, described by what a tooltip hands it. */
    override render(): TemplateResult {
        return html`
            <button
                class=${this.variant}
                ?disabled=${this.disabled}
                aria-describedby=${this.#description.described()}
                part="button"
                @focus=${arrive}
                @pointerdown=${press}
                @keydown=${press}
            >
                <slot></slot>
            </button>
            ${this.#description.carrier()}
        `;
    }
}

// Stryker disable next-line StringLiteral: the registration runs once, at import,
// inside the warm process Stryker switches mutants in — so by the time a mutant on this
// line is active the element is already defined under the original name, and no test can
// observe the change. Outside the runner's reach, not an equivalent mutant.
customElements.define('ui-button', UiButton);

declare global {
    interface HTMLElementTagNameMap {
        'ui-button': UiButton;
    }
}

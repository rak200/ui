import { LitElement, css, html, unsafeCSS, type TemplateResult } from 'lit';
import { Description } from './description.js';
import { query } from './motion.js';
import { reference } from './reference.js';

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

/** The effects the button draws, each by the moment it answers. */
const effects = [
    ['hover-shadow', 'raise'],
    ['focus-shadow', 'raise'],
    ['focus-move', 'lift'],
    ['press-move', 'squish'],
    ['press-shadow', 'sink'],
] as const;

/** True wherever any of the button's effects is chosen, by a consumer or a taste. */
const moving = unsafeCSS(effects.map(([moment, effect]) => drawn(moment, effect)).join(' or '));

/**
 * The raise: a drop under the button, two layers as the elevation step's are. On a dark page,
 * where a shadow barely shows, the wider layer is the accent's.
 */
const raise = css`0 2px 4px -1px light-dark(rgb(0 0 0 / 0.25), rgb(0 0 0 / 0.6)),
    0 6px 14px -4px
        light-dark(rgb(0 0 0 / 0.35), rgb(from ${reference('--ui-color-accent')} r g b / 0.45))`;

/** The sink: the shadow gone inside, as if the button were pressed into the page. */
const sink = css`inset 0 2px 5px light-dark(rgb(0 0 0 / 0.35), rgb(0 0 0 / 0.7))`;

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

        /* The raise under the pointer, which only a pointer that hovers can ask for: a tap on a
           touch screen leaves the hover behind, and the shadow would stay with it. The focus
           wins — a button the reader can see the focus on is drawn as the focus chose, and a
           pointer resting there changes nothing — and the :where() keeps this rule at a press's
           weight, so a press, written after it, is drawn over it. */
        @media (hover: hover) {
            @container ${unsafeCSS(drawn('hover-shadow', 'raise'))} {
                button:not(:disabled):hover:where(:not(:focus-visible)) {
                    box-shadow: ${raise};
                }
            }
        }

        @container ${unsafeCSS(drawn('focus-shadow', 'raise'))} {
            button:focus-visible {
                box-shadow: ${raise};
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

        @container ${unsafeCSS(drawn('press-shadow', 'sink'))} {
            button:not(:disabled):active {
                box-shadow: ${sink};
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

    /** A native `<button>` around the default slot, described by what a tooltip hands it. */
    override render(): TemplateResult {
        return html`
            <button
                class=${this.variant}
                ?disabled=${this.disabled}
                aria-describedby=${this.#description.described()}
                part="button"
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

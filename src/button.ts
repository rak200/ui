import { LitElement, css, html, type TemplateResult } from 'lit';
import { Description } from './description.js';
import { reference } from './reference.js';

/** How much visual weight a button carries. */
export type ButtonVariant = 'primary' | 'secondary';

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

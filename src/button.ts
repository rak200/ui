import { LitElement, css, html, type TemplateResult } from 'lit';
import { reference } from './reference.js';

/** How much visual weight a button carries. */
export type ButtonVariant = 'primary' | 'secondary';

/**
 * A button.
 *
 * It delegates to a real `<button>` in its shadow root rather than reimplementing one,
 * which is what makes the keyboard behaviour, the accessible name and the disabled
 * semantics the platform's job instead of this file's. No state machine is involved
 * because a button has no state to model — Zag arrives with the first component that
 * does.
 *
 * @example
 * ```html
 * <ui-button variant="primary">Save</ui-button>
 * ```
 */
export class UiButton extends LitElement {
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
            /* Only the colour moves. The focus ring is deliberately not in this list:
           delaying the affordance that says *this is where you are* is the opposite of
           what it exists to do. */
            transition: background-color ${reference('--ui-duration-state')}
                ${reference('--ui-easing-state')};
        }

        button:disabled {
            cursor: not-allowed;
            opacity: 0.5;
        }

        /* A visible focus ring is not decoration: removing it is the single most common
       way a component stops being usable by keyboard. */
        button:focus-visible {
            outline: 2px solid ${reference('--ui-color-focus')};
            outline-offset: 2px;
        }

        button.primary {
            background: ${reference('--ui-color-accent')};
            color: ${reference('--ui-color-accent-contrast')};
        }

        button.secondary {
            background: ${reference('--ui-color-surface')};
            color: ${reference('--ui-color-text')};
            border-color: currentcolor;
        }

        /* The :not(:disabled) guard is measured rather than assumed: a disabled button
       still matches :hover and :active, so without it the button would light up under a
       pointer that cannot activate it. Ordering does not substitute for the guard — both
       rules below outrank the resting one on specificity whatever their position. */
        button.primary:not(:disabled):hover {
            background: ${reference('--ui-color-accent-hover')};
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
            background: ${reference('--ui-color-accent-pressed')};
            transition-duration: 0s;
        }

        button.secondary:not(:disabled):active {
            background: ${reference('--ui-color-pressed')};
            transition-duration: 0s;
        }
    `;

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

    override render(): TemplateResult {
        return html`
            <button class=${this.variant} ?disabled=${this.disabled} part="button">
                <slot></slot>
            </button>
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

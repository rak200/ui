import { LitElement, css, html, type TemplateResult } from 'lit';

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
 * <rak-button variant="primary">Save</rak-button>
 * ```
 */
export class RakButton extends LitElement {
    static override readonly styles = css`
        :host {
            display: inline-block;
        }

        button {
            font: inherit;
            font-family: var(--rak-font, system-ui, sans-serif);
            border: 1px solid transparent;
            border-radius: var(--rak-radius, 0.375rem);
            padding: var(--rak-space, 0.5rem) calc(var(--rak-space, 0.5rem) * 2);
            cursor: pointer;
        }

        button:disabled {
            cursor: not-allowed;
            opacity: 0.5;
        }

        /* A visible focus ring is not decoration: removing it is the single most common
       way a component stops being usable by keyboard. */
        button:focus-visible {
            outline: 2px solid var(--rak-color-focus, #f59e0b);
            outline-offset: 2px;
        }

        button.primary {
            background: var(--rak-color-accent, #2563eb);
            color: var(--rak-color-accent-contrast, #ffffff);
        }

        button.secondary {
            background: var(--rak-color-surface, #ffffff);
            color: var(--rak-color-text, #1f2937);
            border-color: currentcolor;
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
customElements.define('rak-button', RakButton);

declare global {
    interface HTMLElementTagNameMap {
        'rak-button': RakButton;
    }
}

import { LitElement, css, html, type CSSResult, type TemplateResult } from 'lit';
import { reference } from './reference.js';

/**
 * What a styled native control looks like, which both elements share.
 *
 * One stylesheet naming both `input` and `textarea` rather than one per element: the two
 * differ in what they accept and in one rule about resizing, and duplicating the whole
 * box to express that would be two copies of a contract with nothing comparing them.
 */
const control = css`
    :host {
        display: block;
    }

    /* Everything below reaches a control the *host* wrote, through ::slotted. That is the
       whole shape of this component and it is forced rather than preferred — the control
       has to stay in the light DOM, where the label and the description ui-field writes
       can resolve against it. Measured, in this suite's own instrument: the same control
       rendered into a shadow root is an axe label violation at critical impact, and the
       aria-describedby pointing at it dangles.

       ::slotted reaches a pseudo-element of a slotted node too, which is what makes the
       placeholder rule below possible — measured, because the selector looks like it
       should not work. */
    ::slotted(input),
    ::slotted(textarea) {
        box-sizing: border-box;
        inline-size: 100%;
        font: inherit;
        font-family: ${reference('--ui-font')};
        color: ${reference('--ui-color-text')};
        background: ${reference('--ui-color-surface')};
        border: 1px solid ${reference('--ui-color-border')};
        border-radius: ${reference('--ui-radius')};
        padding: ${reference('--ui-space')};
        /* Only the boundary moves. The focus ring is deliberately not in this list, for
           the reason src/button.ts gives beside its own: delaying the affordance that
           says *this is where you are* is the opposite of what it exists to do. */
        transition: border-color ${reference('--ui-duration-state')}
            ${reference('--ui-easing-state')};
    }

    ::slotted(input)::placeholder,
    ::slotted(textarea)::placeholder {
        color: ${reference('--ui-color-text-muted')};
        /* Firefox lowers a placeholder's opacity by default, which would take the colour
           below the 4.5:1 it was chosen to clear — a contrast floor undone by a rule
           nobody wrote. */
        opacity: 1;
    }

    /* The boundary completes the mix it already started: the resting border is the
       surface half way to the text, and hovering finishes the trip. A hover colour of its
       own would be a fourth name for a point on a line the token layer already draws.

       The guards are measured rather than assumed, the same way ui-button's are: a
       disabled control still matches :hover, and a readonly one accepts a pointer it will
       do nothing with. */
    ::slotted(input:hover:not(:disabled):not([readonly])),
    ::slotted(textarea:hover:not(:disabled):not([readonly])) {
        border-color: ${reference('--ui-color-text')};
    }

    /* A visible focus ring is not decoration: removing it is the single most common way a
       component stops being usable by keyboard. */
    ::slotted(input:focus-visible),
    ::slotted(textarea:focus-visible) {
        outline: 2px solid ${reference('--ui-color-focus')};
        outline-offset: 2px;
    }

    ::slotted(input:disabled),
    ::slotted(textarea:disabled) {
        cursor: not-allowed;
        opacity: 0.5;
    }

    /* The error state is not this component's to decide, and it does not decide it:
       ui-field sets aria-invalid on the control as part of the wiring it already
       owns, and this rule reads it. So the message under the field and the box around it
       cannot disagree about whether there is an error — there is one source and it is the
       one a screen reader is already using. */
    ::slotted(input[aria-invalid='true']),
    ::slotted(textarea[aria-invalid='true']) {
        border-color: ${reference('--ui-color-danger')};
    }
`;

/**
 * A styled native form control.
 *
 * The control is the host's own, slotted in rather than rendered here, and that is the
 * single decision this component is made of. {@link UiInput} and {@link UiTextarea} carry
 * the appearance; the element inside carries everything else.
 */
class UiControl extends LitElement {
    override render(): TemplateResult {
        return html`<slot></slot>`;
    }
}

/**
 * A text input, styled by the token layer rather than replaced.
 *
 * **The `<input>` is yours.** You write it, you set its attributes, and it stays in the
 * light DOM — so `type`, `required`, `readonly`, `name` and `value` are the platform's
 * business and there is no pass-through layer to fall out of step with them. It reaches a
 * form submit for the same reason: a native control inside a `<form>` participates
 * because it is a native control inside a `<form>`, with no `ElementInternals` and no
 * value mirroring. That was the open question on the issue, and the answer is that the
 * shape the accessibility rule forced happens to be the shape that answers it.
 *
 * Composes with {@link UiField}, which finds the control through this wrapper and wires
 * the label, the help, the error and `aria-invalid` to it.
 *
 * @example
 * ```html
 * <ui-field>
 *   <label slot="label">Amount</label>
 *   <ui-input><input type="number" name="amount" /></ui-input>
 *   <span slot="help">In BRL, two decimals.</span>
 * </ui-field>
 * ```
 */
export class UiInput extends UiControl {
    static override readonly styles: CSSResult = control;
}

/**
 * A multi-line text control, styled by the token layer rather than replaced.
 *
 * Everything {@link UiInput} says applies. What differs is two rules: a height to start
 * at, and resizing left on the vertical axis — a control that cannot grow is one people
 * fight, and one that grows sideways breaks the layout around it.
 *
 * @example
 * ```html
 * <ui-field>
 *   <label slot="label">Notes</label>
 *   <ui-textarea><textarea name="notes" rows="4"></textarea></ui-textarea>
 * </ui-field>
 * ```
 */
export class UiTextarea extends UiControl {
    static override readonly styles: CSSResult[] = [
        control,
        css`
            ::slotted(textarea) {
                min-block-size: calc(${reference('--ui-space')} * 10);
                resize: vertical;
            }
        `,
    ];
}

// Stryker disable next-line StringLiteral: the registration runs once, at import, inside
// the warm process Stryker switches mutants in — so by the time a mutant on this line is
// active the element is already defined under the original name, and no test can observe
// the change. Outside the runner's reach, not an equivalent mutant.
customElements.define('ui-input', UiInput);

// Stryker disable next-line StringLiteral: the same, for the same reason.
customElements.define('ui-textarea', UiTextarea);

declare global {
    interface HTMLElementTagNameMap {
        'ui-input': UiInput;
        'ui-textarea': UiTextarea;
    }
}

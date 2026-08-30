import { LitElement, css, html, type CSSResult, type TemplateResult } from 'lit';
import { reference } from './reference.js';

/**
 * The size both controls are drawn at, and a floor rather than a preference.
 *
 * A native checkbox is 13x13 in this engine, measured, which is under WCAG 2.2's
 * **2.5.8 Target Size (Minimum)** of 24x24 — and escapes it only through that criterion's
 * *user agent control* exception, which covers a target whose size the author has not
 * modified. Drawing it ourselves gives that exception up, so the floor becomes ours to
 * hold, and `max()` is what holds it: a host who shrinks `--ui-space` restyles everything
 * else and cannot shrink a control below the floor without saying so in their own CSS.
 */
const size = css`max(24px, calc(${reference('--ui-space')} * 3))`;

/**
 * The tick, as a mask rather than a picture — and that is what keeps it a token decision.
 *
 * A `data:` URI freezes whatever is inside it, so an SVG drawn with `stroke='#fff'` would
 * be one hardcoded colour in a package whose rule is that a host can override every visual
 * decision. **A mask has no colour**: only its alpha is read, so the black below is a
 * shape and never a value. What the tick shows is the surface behind the control, punched
 * out of the accent fill by `mask-composite: exclude`.
 *
 * The alternative was a mark rendered into the shadow root, and it is not available:
 * `:host(:has(input:checked))` is invalid in this engine — `CSS.supports` says so, so it
 * is a selector that does not exist rather than one that fails to update — and shadow CSS
 * has no other way to read a slotted control's state. Only `::slotted(input:checked)`
 * does, which means the control has to paint its own mark.
 */
const tick = css`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12.5l4.5 4.5L19 7'/%3E%3C/svg%3E")`;

/** A mask layer covering the whole control, which the mark is then subtracted from. */
const whole = css`linear-gradient(#000, #000)`;

/**
 * What a drawn boolean control looks like, which both elements share.
 *
 * The control is the host's own `<input type="checkbox">`, slotted, for the reason
 * `src/input.ts` gives at length: an IDREF does not cross a shadow boundary, so a control
 * rendered in here could not be labelled by the `<label>` beside it. Everything below
 * reaches it through `::slotted`.
 *
 * **`appearance: none` is the whole cost of this component**, and it is taken knowingly.
 * It buys one drawing for the pair — the same border, radius, focus ring and accent the
 * rest of the kit already uses — and the alternative buys none: there is no native switch
 * to delegate to. `<input type="checkbox" switch>` is unsupported in this engine,
 * measured, so a switch is drawn whatever the checkbox does, and a delegated checkbox
 * beside a drawn switch would argue cosmetically for a difference that is semantic.
 *
 * What it gives up is named where it is paid back: the indeterminate mark below, the
 * target-size floor at {@link size}, and the forced-colors block at the end.
 */
const toggle = css`
    :host {
        display: inline-flex;
    }

    ::slotted(input) {
        appearance: none;
        box-sizing: border-box;
        /* The user agent puts 3px around a checkbox. Left in, it would sit inside the
           host box and put the control off centre in any layout that aligns to it. */
        margin: 0;
        block-size: ${size};
        background-color: ${reference('--ui-color-surface')};
        background-repeat: no-repeat;
        border: 1px solid ${reference('--ui-color-border')};
        cursor: pointer;
        /* The focus ring is deliberately not in this list, for the reason src/button.ts
           gives beside its own: delaying the affordance that says *this is where you are*
           is the opposite of what it exists to do. */
        transition:
            background-color ${reference('--ui-duration-state')} ${reference('--ui-easing-state')},
            border-color ${reference('--ui-duration-state')} ${reference('--ui-easing-state')};
    }

    ::slotted(input:checked) {
        background-color: ${reference('--ui-color-accent')};
        border-color: ${reference('--ui-color-accent')};
    }

    /* Unchecked, the boundary finishes the mix it already started — the same hover
       ui-input has, because it is the same boundary. Checked, the boundary is not what
       the eye is on, so the fill moves instead, the way ui-button's does.

       The disabled guard is measured rather than assumed: a disabled control still
       matches :hover. */
    ::slotted(input:hover:not(:disabled)) {
        border-color: ${reference('--ui-color-text')};
    }

    ::slotted(input:checked:hover:not(:disabled)) {
        background-color: ${reference('--ui-color-accent-hover')};
        border-color: ${reference('--ui-color-accent-hover')};
    }

    /* A visible focus ring is not decoration: removing it is the single most common way a
       component stops being usable by keyboard. */
    ::slotted(input:focus-visible) {
        outline: 2px solid ${reference('--ui-color-focus')};
        outline-offset: 2px;
    }

    ::slotted(input:disabled) {
        cursor: not-allowed;
        opacity: 0.5;
    }

    /* The error state is not this component's to decide: ui-field sets aria-invalid on
       the control as part of the wiring it already owns, and this rule reads it — so the
       message under the field and the control cannot disagree about whether there is an
       error. Only the boundary moves; a red fill on a switch would read as *on*. */
    ::slotted(input[aria-invalid='true']) {
        border-color: ${reference('--ui-color-danger')};
    }

    /* Forced colors replaces every author colour with one from the user's palette, so
       the accent that says *checked* becomes the same Canvas as the surface that says
       *not* — the state disappears, silently, for the people who turned the mode on to
       see states more clearly. Measured in this engine. System colours are the ones
       forced colors keeps, so the checked states name Highlight and the difference
       survives; the mark keeps working untouched, because a mask has no colour to force.

       Opacity is not a colour and is not forced, so the disabled control would still be
       half-transparent against a palette chosen for contrast. GrayText is what that mode
       has for *unavailable*, and it is a colour rather than a veil. */
    @media (forced-colors: active) {
        ::slotted(input:checked),
        ::slotted(input:indeterminate) {
            background-color: Highlight;
            border-color: Highlight;
        }

        ::slotted(input:disabled) {
            border-color: GrayText;
            opacity: 1;
        }
    }
`;

/**
 * A boolean control, drawn from the token layer rather than replaced.
 *
 * The `<input type="checkbox">` is the host's own and stays in the light DOM; this element
 * is the box around it. {@link UiCheckbox} and {@link UiSwitch} differ in what they draw
 * and in what they announce, never in what they are made of.
 */
class UiToggle extends LitElement {
    override render(): TemplateResult {
        return html`<slot></slot>`;
    }
}

/**
 * A checkbox, styled by the token layer rather than replaced.
 *
 * **The `<input>` is yours.** You write it, you set its attributes, and it stays in the
 * light DOM — so `name`, `checked`, `required` and `disabled` are the platform's business,
 * and it reaches a form submit because it is a native control inside a `<form>`. The same
 * shape `<ui-input>` has, for the same reason.
 *
 * **The indeterminate state is drawn, and that is not a feature being added.**
 * `appearance: none` takes the platform's dash away with the rest of the drawing, so a
 * control the host set `indeterminate` on would render as *unchecked* — a wrong answer
 * rather than a missing one. The dash below is what stops that, and nothing here invites
 * a tri-state that APG says is rare.
 *
 * Composes with {@link UiField}, which finds the control through this wrapper and wires
 * the label, the help, the error and `aria-invalid` to it.
 *
 * @example
 * ```html
 * <ui-field>
 *   <label slot="label">Send a receipt</label>
 *   <ui-checkbox><input type="checkbox" name="receipt" /></ui-checkbox>
 * </ui-field>
 * ```
 */
export class UiCheckbox extends UiToggle {
    static override readonly styles: CSSResult[] = [
        toggle,
        css`
            ::slotted(input) {
                inline-size: ${size};
                border-radius: ${reference('--ui-radius')};
            }

            /* The mark is a hole: the whole control, minus the shape, so what shows
               through is whatever the control sits on. The docblock on the mask constant
               above says why a hole rather than a colour. */
            ::slotted(input:checked) {
                mask-image: ${whole}, ${tick};
                mask-composite: exclude;
                mask-size: 100% 100%;
                mask-repeat: no-repeat;
            }

            /* A dash needs no drawing: a rectangle is a gradient with a size. */
            ::slotted(input:indeterminate) {
                background-color: ${reference('--ui-color-accent')};
                border-color: ${reference('--ui-color-accent')};
                mask-image: ${whole}, ${whole};
                mask-composite: exclude;
                mask-size:
                    100% 100%,
                    calc(${size} / 2) calc(${size} / 12);
                mask-position: center;
                mask-repeat: no-repeat;
            }
        `,
    ];
}

/**
 * A switch, which is a checkbox that says *on* and *off* rather than *checked*.
 *
 * **The difference is semantic and the drawing follows it**, which is the order that
 * matters: a switch takes effect immediately and a checkbox is a value you submit, so the
 * two are not one component with two skins. `role="switch"` is what carries that to a
 * screen reader, and this element sets it on the slotted control rather than asking the
 * host to remember — forgetting it would leave a control that looks like a switch and
 * announces as a checkbox, with nothing anywhere to read. A role the host wrote is never
 * overwritten, the same way {@link UiField} never overwrites an `id` it did not generate.
 *
 * There is no native switch to delegate to: `<input type="checkbox" switch>` is
 * unsupported in the engine this suite measures, so the element is a checkbox with a role
 * and a drawing. A host who wants the mixed state wants {@link UiCheckbox} — `switch` has
 * no third value, so this element does not draw one.
 *
 * @example
 * ```html
 * <ui-field>
 *   <label slot="label">Email notifications</label>
 *   <ui-switch><input type="checkbox" name="notify" checked /></ui-switch>
 * </ui-field>
 * ```
 */
export class UiSwitch extends UiToggle {
    static override readonly styles: CSSResult[] = [
        toggle,
        css`
            ::slotted(input) {
                inline-size: calc(${size} * 5 / 3);
                /* Any radius at or above half the block size rounds the ends fully, so
                   the whole size is a pill at every size this control can take. */
                border-radius: ${size};
                /* The track carries the boundary a checkbox gets from its border, so it
                   is the border token: the value chosen to clear 3:1 against the
                   surface, which is what WCAG 1.4.11 asks of a control's boundary. The
                   border is left to the shared sheet, which already paints it that exact
                   colour — restating it here changed no pixel, which is how it was
                   found: as a mutant no test could possibly kill. */
                background-color: ${reference('--ui-color-border')};
                /* The thumb is a background layer rather than an element, because an
                   element would have to live in the shadow root and could not be told
                   the control is on. A closest-side radius comes from the layer's
                   own size, so one number moves the thumb. */
                background-image: radial-gradient(
                    circle closest-side,
                    ${reference('--ui-color-surface')} 100%,
                    transparent 100%
                );
                background-size: calc(${size} * 2 / 3);
                background-position: calc(${size} / 6) center;
                transition:
                    background-color ${reference('--ui-duration-state')}
                        ${reference('--ui-easing-state')},
                    border-color ${reference('--ui-duration-state')}
                        ${reference('--ui-easing-state')},
                    background-position ${reference('--ui-duration-state')}
                        ${reference('--ui-easing-state')};
            }

            ::slotted(input:checked) {
                background-position: calc(100% - ${size} / 6) center;
            }
        `,
    ];

    override render(): TemplateResult {
        return html`<slot @slotchange=${this.#announce}></slot>`;
    }

    /**
     * Marks the slotted control a switch for anything reading the accessibility tree.
     *
     * On `slotchange` rather than once, because the host may replace the control — a
     * framework re-render is indistinguishable from that here, and a switch that
     * announces itself correctly only until the first re-render is worse than one that
     * never did.
     */
    #announce(): void {
        const control = this.querySelector('input');

        if (control !== null && !control.hasAttribute('role')) {
            control.setAttribute('role', 'switch');
        }
    }
}

// Stryker disable next-line StringLiteral: the registration runs once, at import, inside
// the warm process Stryker switches mutants in — so by the time a mutant on this line is
// active the element is already defined under the original name, and no test can observe
// the change. Outside the runner's reach, not an equivalent mutant.
customElements.define('ui-checkbox', UiCheckbox);

// Stryker disable next-line StringLiteral: the same, for the same reason.
customElements.define('ui-switch', UiSwitch);

declare global {
    interface HTMLElementTagNameMap {
        'ui-checkbox': UiCheckbox;
        'ui-switch': UiSwitch;
    }
}

import { LitElement, css, html, type TemplateResult } from 'lit';
import { reference } from './reference.js';

/** Which way a group lays its options out, and announces that it did. */
export type RadioOrientation = 'vertical' | 'horizontal';

/**
 * The size the control is drawn at, and a floor rather than a preference.
 *
 * The same measurement `src/checkbox.ts` carries, taken again on this element: a native
 * radio is 13x13 in this engine, which is under WCAG 2.2's **2.5.8 Target Size (Minimum)**
 * of 24x24 and escapes it only through that criterion's *user agent control* exception.
 * Drawing it ourselves gives the exception up, so the floor becomes ours to hold, and
 * `max()` is what holds it: a host who shrinks `--ui-space` cannot take this control below
 * the floor without saying so in their own CSS.
 *
 * Written out rather than imported from the checkbox, for the reason `src/select.ts` gives
 * about the box it shares with `src/input.ts` — and answered the same way, on the same
 * terms: `tests/radio.test.ts` mounts both controls and asserts they agree on the size,
 * the boundary, the fill and the focus ring, so something compares them and it fails when
 * they drift.
 */
const size = css`max(24px, calc(${reference('--ui-space')} * 3))`;

/** A mask layer covering the whole control, which the mark is then subtracted from. */
const whole = css`linear-gradient(#000, #000)`;

/**
 * The mark, as a hole rather than a dot — the same decision `src/checkbox.ts` explains at
 * length, reached here without a picture at all.
 *
 * A checkbox's tick needs a path and therefore a `data:` URI; a radio's mark is a circle,
 * which is a gradient with a size. What both share is that the mark is **absent** rather
 * than coloured: `mask-composite: exclude` punches it out of the accent fill, so what
 * shows through is whatever the control sits on, and no colour is frozen anywhere a host
 * could not override it.
 */
const mark = css`radial-gradient(circle closest-side, #000 100%, transparent 100%)`;

/**
 * One option's control, drawn from the token layer rather than replaced.
 *
 * **The `<input type="radio">` is yours.** You write it, you set its `name`, `value`,
 * `checked` and `disabled`, and it stays in the light DOM — the shape every control in
 * this kit has, and forced by the same constraint: an ARIA relationship by IDREF does not
 * cross a shadow boundary, so a control rendered in here could not be labelled by the
 * `<label>` around it.
 *
 * **This element carries no state and no name.** It is a drawing, and everything that
 * makes a set of radios *a group* — one tab stop, arrow keys that move and select, one
 * value out of the set — is the platform's, because they are native radios sharing a
 * `name`. Wrapping each one changes none of that: measured in this suite, a group whose
 * radios sit inside custom elements is still one group.
 *
 * @example
 * ```html
 * <label>
 *   <ui-radio><input type="radio" name="plan" value="free" /></ui-radio>
 *   Free
 * </label>
 * ```
 */
export class UiRadio extends LitElement {
    static override readonly styles = css`
        :host {
            display: inline-flex;
        }

        /* Everything below reaches a control the *host* wrote, through ::slotted — the
           whole shape of this component, and the same one ui-checkbox has.

           appearance: none is its whole cost, and it is taken for the reason
           ARCHITECTURE.md states as a debt rather than a free hand: it removes the
           platform's dot, its target size and its behaviour under forced colors in one
           declaration, and each of those is answered below. What it buys is a radio that
           belongs beside the checkbox this kit already draws — a native 13px radio next to
           a drawn 24px checkbox would argue cosmetically for a difference that is
           semantic. */
        ::slotted(input) {
            appearance: none;
            box-sizing: border-box;
            /* The user agent puts 3px around a radio. Left in, it would sit inside the
               host box and put the control off centre in any layout that aligns to it. */
            margin: 0;
            inline-size: ${size};
            block-size: ${size};
            /* A circle, and the one measurement here that is not a token: the shape is
               what tells a radio from a checkbox before either is read, so it cannot
               follow --ui-radius without a square radio becoming possible. */
            border-radius: 50%;
            background-color: ${reference('--ui-color-surface')};
            background-repeat: no-repeat;
            border: 1px solid ${reference('--ui-color-border')};
            cursor: pointer;
            /* The focus ring is deliberately not in this list, for the reason
               src/button.ts gives beside its own: delaying the affordance that says *this
               is where you are* is the opposite of what it exists to do. */
            transition:
                background-color ${reference('--ui-duration-state')}
                    ${reference('--ui-easing-state')},
                border-color ${reference('--ui-duration-state')} ${reference('--ui-easing-state')};
        }

        /* The mark is a hole: the whole control, minus the circle, so what shows through
           is whatever the control sits on. The docblock on the mask constant says why a
           hole rather than a colour. */
        ::slotted(input:checked) {
            background-color: ${reference('--ui-color-accent')};
            border-color: ${reference('--ui-color-accent')};
            mask-image: ${whole}, ${mark};
            mask-composite: exclude;
            mask-size:
                100% 100%,
                calc(${size} / 2);
            mask-position: center;
            mask-repeat: no-repeat;
        }

        /* Unselected, the boundary finishes the mix it already started — the same hover
           ui-input and ui-checkbox have, because it is the same boundary. Selected, the
           boundary is not what the eye is on, so the fill moves instead, the way
           ui-button's does.

           The disabled guard is measured rather than assumed: a disabled control still
           matches :hover. */
        ::slotted(input:hover:not(:disabled)) {
            border-color: ${reference('--ui-color-text')};
        }

        ::slotted(input:checked:hover:not(:disabled)) {
            background-color: ${reference('--ui-color-accent-hover')};
            border-color: ${reference('--ui-color-accent-hover')};
        }

        /* A visible focus ring is not decoration: removing it is the single most common
           way a component stops being usable by keyboard — and on a radio group it is the
           only thing that says which option an arrow key just moved to. */
        ::slotted(input:focus-visible) {
            outline: 2px solid ${reference('--ui-color-focus')};
            outline-offset: 2px;
        }

        ::slotted(input:disabled) {
            cursor: not-allowed;
            opacity: 0.5;
        }

        /* There is no error rule here, and its absence is the decision: what a radio group
           gets wrong is the *choice*, not one option, so ui-radio-group paints the state
           for the whole set. It does it by retargeting the boundary token over its own
           subtree, which this rule reads without knowing anything about it. */

        /* Forced colors replaces every author colour with one from the user's palette, so
           the accent that says *selected* becomes the same Canvas as the surface that says
           *not* — the state disappears, silently, for the people who turned the mode on to
           see states more clearly. System colours are the ones forced colors keeps, so the
           selected state names Highlight and the difference survives; the mark keeps
           working untouched, because a mask has no colour to force.

           Opacity is not a colour and is not forced, so the disabled control would still
           be half-transparent against a palette chosen for contrast. GrayText is what that
           mode has for *unavailable*, and it is a colour rather than a veil. */
        @media (forced-colors: active) {
            ::slotted(input:checked) {
                background-color: Highlight;
                border-color: Highlight;
            }

            ::slotted(input:disabled) {
                border-color: GrayText;
                opacity: 1;
            }
        }
    `;

    override render(): TemplateResult {
        return html`<slot></slot>`;
    }
}

/**
 * A set of radios, laid out and named as one thing.
 *
 * **It hand-rolls no roving tabindex and it brings no state machine**, and that is this
 * element's whole claim rather than a gap in it. Issue #15 asked which of the two it would
 * be, because the APG **Radio Group** pattern — one tab stop, arrow keys that move *and*
 * select, wrapping at the ends — is the first behaviour in the v0 cut that could have
 * justified Zag. Neither was needed: native radios sharing a `name` **are** that pattern,
 * and this suite measures it here rather than trusting it, wrappers and all.
 *
 * That is the test `ROADMAP.md` states, applied: Zag arrives where the platform has **no
 * element** for the pattern, not merely where the pattern has state. `ui-menu` is where
 * that question is open; a radio group is not.
 *
 * **What is left for this element is what the platform leaves out**: the layout, the
 * `role` that makes a set of radios a group to a screen reader, and the group-level name,
 * description and error state — which {@link UiField} wires onto *this* element rather
 * than onto an option, because a `<label for>` naming one radio names one option and
 * leaves the group anonymous.
 *
 * @example
 * ```html
 * <ui-field>
 *   <label slot="label">Plan</label>
 *   <ui-radio-group>
 *     <label><ui-radio><input type="radio" name="plan" value="free" /></ui-radio> Free</label>
 *     <label><ui-radio><input type="radio" name="plan" value="pro" /></ui-radio> Pro</label>
 *   </ui-radio-group>
 * </ui-field>
 * ```
 */
export class UiRadioGroup extends LitElement {
    static override readonly styles = css`
        :host {
            display: flex;
            flex-direction: column;
            gap: calc(${reference('--ui-space')} / 2);
        }

        /* Laid out by the attribute rather than by the host's own CSS, so the drawing and
           the announcement cannot disagree: orientation sets both this rule and
           aria-orientation, and a host who reached for flex-direction instead would
           change one of the two. */
        :host([orientation='horizontal']) {
            flex-direction: row;
            flex-wrap: wrap;
            column-gap: calc(${reference('--ui-space')} * 2);
        }

        /* The error, painted for the whole set by retargeting the boundary token over this
           subtree — which is the override surface the token layer already publishes,
           pointed at the group's own descendants instead of at a page.

           A custom property inherits through a shadow boundary and a selector does not, so
           this is what reaches a control two elements down that this sheet cannot name:
           ::slotted() stops at the group's own children, :host-context() is not
           cross-engine, and :host(:has(...)) is invalid in this engine. The value still
           arrives as a token reference, so a host who retunes danger retunes this too.

           aria-invalid is not written here: ui-field sets it as part of the wiring it
           already owns, so the message under the group and the boundary around its options
           cannot disagree about whether there is an error. */
        :host([aria-invalid='true']) {
            --ui-color-border: ${reference('--ui-color-danger')};
        }
    `;

    static override readonly properties = {
        orientation: { type: String, reflect: true },
    };

    /**
     * Which way the options are laid out.
     *
     * A plain field rather than the `accessor` keyword, for the reason `src/button.ts`
     * gives beside its own: the browser this suite runs in does not implement
     * auto-accessors, and the module would fail to parse.
     */
    orientation: RadioOrientation = 'vertical';

    /**
     * Marks the element a group before anything asks what it is.
     *
     * In `connectedCallback` rather than at first render, and the timing is the point:
     * {@link UiField} reads this attribute to decide that the group — and not the first
     * radio inside it — is the thing to name, and it does so on its own first update,
     * which lands before this element's. Set a microtask later, the role would arrive
     * after the only reader that needs it.
     *
     * A `role` the host wrote is never overwritten, the same way `<ui-switch>` never
     * overwrites one on the control it announces.
     */
    override connectedCallback(): void {
        super.connectedCallback();

        if (!this.hasAttribute('role')) {
            this.setAttribute('role', 'radiogroup');
        }
    }

    /**
     * Keeps the announced orientation on the drawn one.
     *
     * Written unconditionally rather than only for the horizontal case: the default a
     * screen reader assumes for a `radiogroup` is not something a component should have an
     * opinion about, and the attribute costs nothing to state.
     */
    override willUpdate(): void {
        this.setAttribute('aria-orientation', this.orientation);
    }

    override render(): TemplateResult {
        return html`<slot></slot>`;
    }
}

// Stryker disable next-line StringLiteral: the registration runs once, at import, inside
// the warm process Stryker switches mutants in — so by the time a mutant on this line is
// active the element is already defined under the original name, and no test can observe
// the change. Outside the runner's reach, not an equivalent mutant.
customElements.define('ui-radio', UiRadio);

// Stryker disable next-line StringLiteral: the same, for the same reason.
customElements.define('ui-radio-group', UiRadioGroup);

declare global {
    interface HTMLElementTagNameMap {
        'ui-radio': UiRadio;
        'ui-radio-group': UiRadioGroup;
    }
}

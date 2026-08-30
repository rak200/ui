import { LitElement, css, html, type CSSResult, type TemplateResult } from 'lit';
import { reference } from './reference.js';

/**
 * One arm of the caret, and the gap it keeps from the edge.
 *
 * A fraction of the space token rather than a literal, so the mark scales with everything
 * else a host retunes — and small enough that the two arms plus their gap fit inside the
 * padding reserved for them below.
 */
const arm = css`calc(${reference('--ui-space')} * 0.75)`;

/**
 * The room the caret needs, which the text must not run into.
 *
 * The caret ends one space from the edge and is two arms wide, so this is that plus one
 * more space of air. Written as the sum rather than as a number, because a number would be
 * right at the default space token and wrong at every other.
 */
const clearance = css`calc(${reference('--ui-space')} * 2 + ${arm} * 2)`;

/**
 * A native `<select>`, styled by the token layer rather than replaced.
 *
 * **The `<select>` is yours.** You write it and its `<option>`s, and it stays in the light
 * DOM — the same shape {@link UiInput} has, and forced by the same constraint: an ARIA
 * relationship by IDREF does not cross a shadow boundary, so a control rendered in here
 * could not be labelled by the `<label>` beside it. It reaches a form submit because it is
 * a native control inside a `<form>`.
 *
 * **The native element is the decision, not a shortcut.** A custom listbox is an
 * accessibility project of its own, and it would have to reimplement the platform picker
 * a phone already opens — which is the part a consumer notices most and a library gets
 * wrong most. RFC 0016 defers that listbox, and this element is not a step toward it.
 *
 * **What the platform still refuses is documented rather than worked around**, in
 * `docs/select.md`: the drop-down list is drawn by the operating system and no rule here
 * reaches inside it.
 *
 * ## Why the box is written out rather than shared
 *
 * `src/input.ts` carries the same box and says that duplicating it would be *two copies of
 * a contract with nothing comparing them*. That objection is answered on its own terms
 * rather than dodged: `tests/select.test.ts` mounts both and asserts they agree on the
 * boundary, the radius, the padding, the font and the focus ring. Something compares them,
 * and it fails when they drift.
 *
 * Sharing was the alternative and it costs the thing this file exists for — a consumer
 * looking for `<ui-select>` finds `select.ts`, `select.stories.ts`, `select.test.ts` and
 * `select.md`, rather than a select folded into the input's page under the input's name.
 *
 * @example
 * ```html
 * <ui-field>
 *   <label slot="label">Currency</label>
 *   <ui-select>
 *     <select name="currency">
 *       <option value="brl">Real</option>
 *       <option value="usd">Dollar</option>
 *     </select>
 *   </ui-select>
 * </ui-field>
 * ```
 */
export class UiSelect extends LitElement {
    static override readonly styles: CSSResult = css`
        :host {
            display: block;
        }

        /* The box, which src/input.ts also draws and tests/select.test.ts compares. */
        ::slotted(select) {
            box-sizing: border-box;
            inline-size: 100%;
            font: inherit;
            font-family: ${reference('--ui-font')};
            color: ${reference('--ui-color-text')};
            background-color: ${reference('--ui-color-surface')};
            border: 1px solid ${reference('--ui-color-border')};
            border-radius: ${reference('--ui-radius')};
            padding: ${reference('--ui-space')};
            /* A select opens something when clicked, so it is a pointer rather than a
               caret — the one place this box disagrees with the input's on purpose. */
            cursor: pointer;
            /* Only the boundary moves. The focus ring is deliberately not in this list,
               for the reason src/button.ts gives beside its own. */
            transition: border-color ${reference('--ui-duration-state')}
                ${reference('--ui-easing-state')};
        }

        /* Taking the platform's own drawing off is what makes the box possible at all: a
           select left at appearance: auto keeps the operating system's chevron and, off
           this engine, ignores much of what is set above — so the control beside a text
           field would stop matching it exactly where a kit is supposed to. What that
           costs is the chevron, which is drawn below.

           It does NOT cost the picker. appearance: none changes how the closed control
           is painted and nothing about what opens, so a phone still opens its own wheel. */
        ::slotted(select) {
            appearance: none;
            padding-inline-end: ${clearance};
            background-repeat: no-repeat;
        }

        /* The caret is two triangles rather than a picture, and that is what keeps its
           colour a token: gradients take var(), and an SVG in a data: URI would
           freeze whatever colour was drawn into it. src/checkbox.ts solved the same
           problem the other way, by making its mark a hole — which is not available here,
           because a mask would clip the option text with it.

           A multiple select is a list rather than a drop-down, and a caret on a list
           points at nothing, so it is guarded rather than drawn everywhere. */
        ::slotted(select:not([multiple])) {
            background-image:
                linear-gradient(45deg, transparent 50%, ${reference('--ui-color-text-muted')} 50%),
                linear-gradient(135deg, ${reference('--ui-color-text-muted')} 50%, transparent 50%);
            background-size: ${arm} ${arm};
            background-position:
                right calc(${reference('--ui-space')} + ${arm}) center,
                right ${reference('--ui-space')} center;
        }

        /* Direction is the control's own, not the page's, and background-position has no
           logical form — so the one physical thing in this sheet is mirrored explicitly.
           The padding needs no rule: padding-inline-end already follows. Measured, both
           halves. */
        ::slotted(select:not([multiple]):dir(rtl)) {
            background-position:
                left ${reference('--ui-space')} center,
                left calc(${reference('--ui-space')} + ${arm}) center;
        }

        /* The boundary completes the mix it already started, the same way ui-input's does
           and against the same token.

           There is no [readonly] guard here and its absence is measured rather than
           forgotten: readOnly is not a property of a select at all, so the input's
           second guard would be a rule about an attribute the platform never sets. */
        ::slotted(select:hover:not(:disabled)) {
            border-color: ${reference('--ui-color-text')};
        }

        /* A visible focus ring is not decoration: removing it is the single most common
           way a component stops being usable by keyboard. */
        ::slotted(select:focus-visible) {
            outline: 2px solid ${reference('--ui-color-focus')};
            outline-offset: 2px;
        }

        ::slotted(select:disabled) {
            cursor: not-allowed;
            opacity: 0.5;
        }

        /* The error state is not this component's to decide: ui-field sets aria-invalid on
           the control as part of the wiring it already owns, and this rule reads it. */
        ::slotted(select[aria-invalid='true']) {
            border-color: ${reference('--ui-color-danger')};
        }
    `;

    override render(): TemplateResult {
        return html`<slot></slot>`;
    }
}

// Stryker disable next-line StringLiteral: the registration runs once, at import, inside
// the warm process Stryker switches mutants in — so by the time a mutant on this line is
// active the element is already defined under the original name, and no test can observe
// the change. Outside the runner's reach, not an equivalent mutant.
customElements.define('ui-select', UiSelect);

declare global {
    interface HTMLElementTagNameMap {
        'ui-select': UiSelect;
    }
}

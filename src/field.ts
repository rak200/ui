import { LitElement, css, html, type TemplateResult } from 'lit';
import { reference } from './reference.js';

/** Distinguishes one field's generated ids from another's. */
let sequence = 0;

/**
 * Form plumbing: a label bound to a control, help and error text bound through
 * `aria-describedby`, and `aria-invalid` while the field is in error.
 *
 * Written once here rather than per control. Every form component in the v0 cut needs the
 * same wiring, and five copies of it are five chances to get one subtly wrong.
 *
 * **Everything is slotted, and that is forced rather than chosen.** An ARIA relationship
 * by IDREF does not cross a shadow boundary: a `<label for>` rendered in this element's
 * shadow root leaves `control.labels` empty, and an `aria-describedby` pointing into it
 * dangles. So the label, the control, the help and the error all live in the host's tree,
 * where the association is the platform's job — and this element only generates the ids
 * and points them at each other.
 *
 * **The control may sit below a wrapper**, and the same constraint is why: `<ui-input>` is
 * a box around a control that had to stay in the light DOM, so this element looks through
 * it. See {@link UiField.#control} — and the one wrapper it does *not* look through, which
 * is a wrapper carrying a `role`, because a group is the control rather than a box for one.
 *
 * **Not every control can be labelled the platform's way**, and `<ui-radio-group>` is the
 * first that cannot: `<label for>` reaches a labelable element and nothing else, so the
 * name arrives as `aria-labelledby` there. See {@link UiField.#name}.
 *
 * @example
 * ```html
 * <ui-field>
 *   <label slot="label">Amount</label>
 *   <input type="number" />
 *   <span slot="help">In BRL, two decimals.</span>
 *   <span slot="error">Amount is required.</span>
 * </ui-field>
 * ```
 */
export class UiField extends LitElement {
    static override readonly styles = css`
        :host {
            display: block;
            font-family: ${reference('--ui-font')};
        }

        .stack {
            display: flex;
            flex-direction: column;
            gap: calc(${reference('--ui-space')} / 2);
        }

        slot[name='help']::slotted(*) {
            color: ${reference('--ui-color-text')};
            font-size: 0.875em;
        }

        /* Colour is not the only cue — the error text says what is wrong, and
       aria-invalid marks the control regardless of styling. */
        slot[name='error']::slotted(*) {
            color: ${reference('--ui-color-danger')};
            font-size: 0.875em;
        }
    `;

    /** The prefix for this instance's generated ids, allocated on first association. */
    #uid?: string;

    /**
     * Watches the light DOM for anything that changes the association.
     *
     * Built here rather than on connection so it is never absent: a disconnect that has to
     * ask whether the observer exists is a branch no test can reach.
     */
    readonly #observer = new MutationObserver(() => {
        this.#associate();
    });

    override connectedCallback(): void {
        super.connectedCallback();

        // The host may swap the error text without adding or removing an element, which is
        // what a re-render looks like from here — so characterData matters as much as
        // childList, and both can happen below a wrapper.
        this.#observer.observe(this, { childList: true, characterData: true, subtree: true });
    }

    override disconnectedCallback(): void {
        this.#observer.disconnect();
        super.disconnectedCallback();
    }

    override firstUpdated(): void {
        this.#associate();
    }

    override render(): TemplateResult {
        return html`
            <div class="stack" part="stack">
                <slot name="label"></slot>
                <slot></slot>
                <slot name="help"></slot>
                <slot name="error"></slot>
            </div>
        `;
    }

    /** The light-DOM child filling a slot, or `undefined` when nothing does. */
    #slotted(name: string | null): HTMLElement | undefined {
        const selector = name === null ? ':scope > :not([slot])' : `:scope > [slot='${name}']`;
        const found = this.querySelector(selector);

        return found instanceof HTMLElement ? found : undefined;
    }

    /**
     * The control this field is about, which a wrapper may stand in front of.
     *
     * `<ui-input>` is such a wrapper, and it is one because the control has to stay in the
     * light DOM for the IDREFs below to resolve at all — so the box that styles it can
     * only ever sit around it, never instead of it. The label points at the control and
     * never at the box: `<label for>` aimed at a custom element labels nothing, which axe
     * reports at critical impact.
     *
     * A control written as a direct child, which is every call site that predates the
     * wrapper, matches nothing to descend into and is returned as it is.
     */
    #control(): HTMLElement | undefined {
        const slotted = this.#slotted(null);

        // A wrapper carrying a `role` is claiming to *be* the widget rather than to box
        // one, and the descent stops there. `<ui-radio-group>` is the first: it sets
        // `role="radiogroup"` on itself, and the thing this field names is that group —
        // looking through it would reach the first radio, which names one option and
        // leaves the group anonymous.
        if (slotted?.hasAttribute('role') === true) {
            return slotted;
        }

        return slotted?.querySelector('input, textarea, select') ?? slotted;
    }

    /**
     * Points the label, the help and the error at the control.
     *
     * A host-supplied `id` is never overwritten — it may already be referenced by something
     * this element cannot see.
     */
    #associate(): void {
        const control = this.#control();

        if (control === undefined) {
            return;
        }

        // Stryker disable next-line UpdateOperator: the contract is that two fields on one
        // page get different ids, and a decrementing counter delivers that as well as an
        // incrementing one — `ui-field--1` is as valid an id as `ui-field-1`. No input
        // distinguishes the two, so this is an equivalent mutant rather than a weak test.
        const uid = (this.#uid ??= `ui-field-${String(++sequence)}`);

        if (control.id === '') {
            control.id = `${uid}-control`;
        }

        this.#name(control, this.#slotted('label'), `${uid}-label`);

        const help = this.#describer(this.#slotted('help'), `${uid}-help`);
        const error = this.#describer(this.#slotted('error'), `${uid}-error`);

        // The error comes first: a screen reader announces descriptions in order, and the
        // user needs to know what is wrong before reading how the value should look.
        //
        // The error SUPPLEMENTS the help rather than replacing it. Help text is usually the
        // format requirement, which is exactly the error suggestion the user needs in order
        // to recover (WCAG 3.3.3) — dropping it at the moment it becomes useful is the
        // opposite of helping.
        //
        // And a description this field did not write survives all of it, which is the same
        // courtesy the `id` above gets and for the same reason: something this element
        // cannot see may have put it there. `<ui-tooltip>` is the first to do so, and it
        // was measured being erased — not on the first association, which runs before the
        // tooltip wires, but on the next one, when a re-render moves the help text and the
        // list is rebuilt from what this field alone knows about.
        const described = [error, help, ...this.#foreign(control, uid, [error, help])].filter(
            (id) => id !== undefined,
        );

        if (described.length > 0) {
            control.setAttribute('aria-describedby', described.join(' '));
        } else {
            control.removeAttribute('aria-describedby');
        }

        if (error === undefined) {
            control.removeAttribute('aria-invalid');
        } else {
            control.setAttribute('aria-invalid', 'true');
        }
    }

    /**
     * The ids already describing `control` that this field is not responsible for.
     *
     * Everything it could have written is excluded rather than remembered: the two ids it
     * generates from `uid`, and whatever the help and error elements are called right now,
     * which may be ids the host supplied. What is left belongs to somebody else and is
     * carried forward in place rather than dropped.
     */
    #foreign(control: HTMLElement, uid: string, mine: (string | undefined)[]): string[] {
        const written = new Set([...mine, `${uid}-help`, `${uid}-error`]);

        return (control.getAttribute('aria-describedby') ?? '')
            .split(' ')
            .filter((id) => id !== '' && !written.has(id));
    }

    /**
     * Gives the control its accessible name from whatever fills the label slot.
     *
     * **`<label for>` is preferred wherever it reaches**, because it is the platform's own
     * association and it does two things `aria-labelledby` does not: it names the control
     * and it makes the label a click target for it. It only reaches a **labelable**
     * element, though, and `<ui-radio-group>` is not one — a `<label for>` aimed at a
     * custom element labels nothing, which axe reports at critical impact.
     *
     * Which elements are labelable is asked of the platform rather than listed here: those
     * are exactly the ones it gives a `labels` collection to. A list kept in this file
     * would be one the next labelable element ages out of, silently.
     *
     * The name is dropped when the slot empties, the way `aria-describedby` is: a group
     * left pointing at a label that is no longer there has a dangling IDREF, which is the
     * one failure mode nobody sees — the group simply stops having a name.
     *
     * @param fallbackId - Given to the label only on the path that needs one to point at.
     * A host-supplied id survives, the same way the control's and the describers' do.
     */
    #name(control: HTMLElement, label: HTMLElement | undefined, fallbackId: string): void {
        if ('labels' in control) {
            if (label instanceof HTMLLabelElement) {
                label.htmlFor = control.id;
            }

            return;
        }

        if (label === undefined) {
            control.removeAttribute('aria-labelledby');

            return;
        }

        if (label.id === '') {
            label.id = fallbackId;
        }

        control.setAttribute('aria-labelledby', label.id);
    }

    /**
     * The id to describe the control by, or `undefined` when the element is absent or has
     * nothing to say. An element rendered empty — the shape a framework produces for
     * "no error yet" — must not mark the control invalid.
     */
    #describer(element: HTMLElement | undefined, fallbackId: string): string | undefined {
        if (element === undefined || element.textContent.trim() === '') {
            return undefined;
        }

        if (element.id === '') {
            element.id = fallbackId;
        }

        return element.id;
    }
}

// Stryker disable next-line StringLiteral: the registration runs once, at import, inside
// the warm process Stryker switches mutants in — so by the time a mutant on this line is
// active the element is already defined under the original name, and no test can observe
// the change. Outside the runner's reach, not an equivalent mutant.
customElements.define('ui-field', UiField);

declare global {
    interface HTMLElementTagNameMap {
        'ui-field': UiField;
    }
}

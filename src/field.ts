import { LitElement, css, html, type TemplateResult } from 'lit';

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
            font-family: var(--ui-font, system-ui, sans-serif);
        }

        .stack {
            display: flex;
            flex-direction: column;
            gap: calc(var(--ui-space, 0.5rem) / 2);
        }

        slot[name='help']::slotted(*) {
            color: var(--ui-color-text, #1f2937);
            font-size: 0.875em;
        }

        /* Colour is not the only cue — the error text says what is wrong, and
       aria-invalid marks the control regardless of styling. */
        slot[name='error']::slotted(*) {
            color: var(--ui-color-danger, #b91c1c);
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
     * Points the label, the help and the error at the control.
     *
     * A host-supplied `id` is never overwritten — it may already be referenced by something
     * this element cannot see.
     */
    #associate(): void {
        const control = this.#slotted(null);

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

        const label = this.#slotted('label');

        if (label instanceof HTMLLabelElement) {
            label.htmlFor = control.id;
        }

        const help = this.#describer(this.#slotted('help'), `${uid}-help`);
        const error = this.#describer(this.#slotted('error'), `${uid}-error`);

        // The error comes first: a screen reader announces descriptions in order, and the
        // user needs to know what is wrong before reading how the value should look.
        //
        // The error SUPPLEMENTS the help rather than replacing it. Help text is usually the
        // format requirement, which is exactly the error suggestion the user needs in order
        // to recover (WCAG 3.3.3) — dropping it at the moment it becomes useful is the
        // opposite of helping.
        const described = [error, help].filter((id) => id !== undefined);

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

import { LitElement, css, html, nothing, type CSSResult, type TemplateResult } from 'lit';
import { reference } from './reference.js';

/**
 * What a styled native control looks like, which both elements share.
 *
 * One stylesheet naming both `input` and `textarea` rather than one per element: the two
 * differ in what they accept and in one rule about resizing, and duplicating the whole
 * box to express that would be two copies of a contract with nothing comparing them.
 *
 * **Every rule reaches a control this element renders**, which RFC 0005 decided. The
 * `::slotted()` these rules were written with was forced by the control having to sit in
 * the host's tree, where the label could reach it — and what a relationship actually needs
 * is for every end of it to share a tree scope, which a `<label for>` and its control in
 * one shadow root satisfy. So the label, the help and the error came inside with it.
 */
const field = css`
    :host {
        display: block;
        font-family: ${reference('--ui-font')};
    }

    /* The rhythm ui-field used to own, now owned by the control it was wrapping. */
    .stack {
        display: flex;
        flex-direction: column;
        gap: calc(${reference('--ui-space')} / 2);
    }

    label {
        color: ${reference('--ui-color-text')};
    }

    input,
    textarea {
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

    input::placeholder,
    textarea::placeholder {
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
    input:hover:not(:disabled):not([readonly]),
    textarea:hover:not(:disabled):not([readonly]) {
        border-color: ${reference('--ui-color-text')};
    }

    /* A visible focus ring is not decoration: removing it is the single most common way a
       component stops being usable by keyboard. */
    input:focus-visible,
    textarea:focus-visible {
        outline: 2px solid ${reference('--ui-color-focus')};
        outline-offset: 2px;
    }

    input:disabled,
    textarea:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }

    :host([disabled]) label {
        color: ${reference('--ui-color-text-muted')};
    }

    /* Read off the control's own aria-invalid rather than off a host attribute: it is the
       same source a screen reader uses, and it is the rule this file already carried when
       ui-field was the one writing it. Not :host([error]) — a reflected string property
       whose default is empty puts an empty attribute on the host, and an
       attribute-presence selector matches every element. Measured on ui-checkbox. */
    input[aria-invalid='true'],
    textarea[aria-invalid='true'] {
        border-color: ${reference('--ui-color-danger')};
    }

    .help {
        color: ${reference('--ui-color-text')};
        font-size: ${reference('--ui-text-supporting')};
    }

    /* Colour is not the only cue — the message says what is wrong, and aria-invalid marks
       the control whatever the styling does. */
    .error {
        color: ${reference('--ui-color-danger')};
        font-size: ${reference('--ui-text-supporting')};
    }
`;

/**
 * Omitted rather than written blank, which is a rule and not a preference.
 *
 * An empty attribute is not a neutral one: `pattern=""` is the empty expression and
 * matches only the empty string, so a field carrying it is invalid for every value a
 * person can type. Measured, as a control that reported `patternMismatch` with no pattern
 * in sight. The same shape bit `<ui-checkbox>` from the other side, where `error=""`
 * matched an attribute-presence selector on every element.
 */
function attribute(value: string): string | typeof nothing {
    return value === '' ? nothing : value;
}

/**
 * A styled native form control, and the wiring that used to sit around it.
 *
 * **The control is this element's**, rendered into its shadow root together with its
 * label, its help text and its message — so the IDREFs resolve in one tree scope and
 * `<ui-field>` has nothing left to point at. What a host writes is the tag and its
 * attributes.
 *
 * **The element is the form control**, through `ElementInternals`: an `<input>` in a
 * shadow root has no form owner, so the value reaches a submit because this element passes
 * it on. **Constraint validation is not reimplemented** — the inner control still computes
 * its own, `type="email"` and `min` and `pattern` included, and this element hands the
 * whole `ValidityState` over with the message the engine wrote. Measured: a bad address
 * reports `typeMismatch` with the browser's own wording.
 */
class UiTextField extends LitElement {
    static readonly formAssociated = true;

    /**
     * Focus is delegated, so `focus()` and `reportValidity()` reach the control.
     *
     * Neither is optional: the host is not a focusable element, and the second is what the
     * browser calls itself when a form with an invalid control is submitted. Measured, on
     * `<ui-checkbox>` first.
     */
    static override readonly shadowRootOptions = {
        ...LitElement.shadowRootOptions,
        delegatesFocus: true,
    };

    static override readonly properties = {
        label: { type: String, reflect: true },
        help: { type: String, reflect: true },
        error: { type: String, reflect: true },
        name: { type: String, reflect: true },
        value: { type: String },
        placeholder: { type: String, reflect: true },
        autocomplete: { type: String, reflect: true },
        minlength: { type: String, reflect: true },
        maxlength: { type: String, reflect: true },
        required: { type: Boolean, reflect: true },
        disabled: { type: Boolean, reflect: true },
        readonly: { type: Boolean, reflect: true },
    };

    /**
     * The accessible name, and the text above the control.
     *
     * A plain field rather than the `accessor` keyword, for the reason `src/button.ts`
     * gives beside its own — and so for every property below.
     */
    label = '';

    /** Supporting text under the control, which survives an error rather than yielding. */
    help = '';

    /** The message, which paints the boundary and is announced with the control. */
    error = '';

    /**
     * The name the value is submitted under.
     *
     * **Reflected, and that is a requirement rather than a convenience.** A form names a
     * form-associated custom element's entry from the content attribute, so a host who set
     * only the property would submit nothing at all — silently.
     */
    name = '';

    /**
     * What the control holds.
     *
     * **Not reflected**, the way a native control's `value` IDL attribute is not: the
     * content attribute is the *default* a reset returns to, and one that followed every
     * keystroke would make the default whatever was last typed.
     */
    value = '';

    /** The hint inside an empty control, which is never a substitute for the label. */
    placeholder = '';

    /** What the browser may fill this with. Empty means the attribute is not written. */
    autocomplete = '';

    /** The shortest accepted value, as the attribute spells it. */
    minlength = '';

    /** The longest accepted value, likewise. */
    maxlength = '';

    /** Whether a form is invalid while the control is empty. */
    required = false;

    /** Whether the control refuses interaction, and submits nothing. */
    disabled = false;

    /** Whether the control shows a value it will not let you change. */
    readonly = false;

    readonly #internals = this.attachInternals();

    /** The validity, taken from the control that computed it. */
    #publish(control: HTMLInputElement | HTMLTextAreaElement): void {
        if (this.error !== '') {
            this.#internals.setValidity({ customError: true }, this.error, control);

            return;
        }

        // The whole ValidityState, handed over as the platform computed it — so `min`,
        // `pattern`, `type="email"` and whatever the platform adds next are validated by
        // the thing that already knows how, with the message it already wrote.
        this.#internals.setValidity(control.validity, control.validationMessage, control);
    }

    /**
     * The value and the validity, which move together here or disagree anywhere.
     *
     * **Iterated rather than asserted**, and there is exactly one control to iterate:
     * `render()` puts it there unconditionally. Written as a query and a null check, the
     * check would be a branch no test could reach — which is a coverage hole and an
     * immortal mutant at once, rather than safety. A loop over what was rendered is total.
     */
    override updated(): void {
        this.#internals.setFormValue(this.value);

        for (const control of this.renderRoot.querySelectorAll<
            HTMLInputElement | HTMLTextAreaElement
        >('input, textarea')) {
            this.#publish(control);
        }
    }

    /**
     * Mirrors what the person typed back into the property it came from.
     *
     * `input` is composed and leaves the shadow root on its own, retargeted to this
     * element; `change` is not, so the one the control fires stops at the boundary and is
     * re-dispatched. Measured on `<ui-checkbox>`, and the same both times.
     */
    protected readonly typed = (event: Event): void => {
        this.value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    };

    protected readonly changed = (): void => {
        this.dispatchEvent(new Event('change', { bubbles: true }));
    };

    /**
     * A form reset, which returns to the content attribute — `defaultValue` exactly, and
     * a usable default only because `value` is not reflected onto it.
     */
    formResetCallback(): void {
        this.value = this.getAttribute('value') ?? '';
    }

    /** A `<fieldset disabled>` above this element, which reaches it and nothing below. */
    formDisabledCallback(disabled: boolean): void {
        this.disabled = disabled;
    }

    /** Restoring after a back-navigation, where the browser hands the value back. */
    formStateRestoreCallback(state: string | null): void {
        this.value = state ?? '';
    }

    /** The form this element participates in, for a host that needs it. */
    get form(): HTMLFormElement | null {
        return this.#internals.form;
    }

    /** Whether the control currently satisfies its constraints. */
    get validity(): ValidityState {
        return this.#internals.validity;
    }

    /** The message a form would report for it, empty while the control is valid. */
    get validationMessage(): string {
        return this.#internals.validationMessage;
    }

    /**
     * The label, the help and the message, with the control between them.
     *
     * The control is passed in rather than produced by an overridable hook, for the reason
     * `src/checkbox.ts` gives at its own: a hook whose base implementation returns a
     * default cannot be told from one that returns nothing, and the mutation floor is what
     * reports the difference.
     *
     * **The error is described before the help**, and the help is not replaced by it: a
     * screen reader announces descriptions in order, and help text is usually the format
     * requirement — which is the very suggestion a reader needs in order to recover
     * (WCAG 3.3.3). `<ui-field>` decided that and this carries it.
     */
    protected frame(control: TemplateResult): TemplateResult {
        return html`
            <div class="stack" part="stack">
                <label for="control" part="label">${this.label}</label>
                ${control}
                ${
                    this.help === ''
                        ? nothing
                        : html`<span class="help" id="help" part="help">${this.help}</span>`
                }
                ${
                    this.error === ''
                        ? nothing
                        : html`<span class="error" id="error" part="error">${this.error}</span>`
                }
            </div>
        `;
    }

    /** The ids describing the control, in the order a reader needs them. */
    protected described(): string | typeof nothing {
        return attribute(
            [this.error === '' ? '' : 'error', this.help === '' ? '' : 'help']
                .filter((id) => id !== '')
                .join(' '),
        );
    }

    /** Whether the control announces itself as invalid, which the boundary reads. */
    protected invalid(): string | typeof nothing {
        return this.error === '' ? nothing : 'true';
    }
}

/**
 * A text input, drawn from the token layer rather than replaced.
 *
 * **You write the tag, not a control.** RFC 0005 reversed the rule this element was built
 * on: the `<input>`, its `<label>`, its help text and its message are rendered together in
 * one shadow root, so the IDREFs resolve and there is nothing left for `<ui-field>` to
 * wire. The attributes below are the platform's own, and the ones it computes with —
 * `type`, `pattern`, `min`, `max`, `step` — are handed to a real `<input>` that validates
 * them itself.
 *
 * @example
 * ```html
 * <ui-input label="Amount" help="In BRL, two decimals." type="number" name="amount"></ui-input>
 * ```
 */
export class UiInput extends UiTextField {
    static override readonly styles: CSSResult = field;

    static override readonly properties = {
        ...UiTextField.properties,
        type: { type: String, reflect: true },
        inputmode: { type: String, reflect: true },
        pattern: { type: String, reflect: true },
        min: { type: String, reflect: true },
        max: { type: String, reflect: true },
        step: { type: String, reflect: true },
    };

    /** Which control the platform draws, and which constraints it then applies. */
    type = 'text';

    /** Which keyboard a touch device offers, where `type` is not the right lever. */
    inputmode = '';

    /** The expression the value must match. Empty means no attribute is written. */
    pattern = '';

    /** The lowest accepted value, likewise. */
    min = '';

    /** The highest accepted value, likewise. */
    max = '';

    /** The granularity the value must fall on, likewise. */
    step = '';

    override render(): TemplateResult {
        return this.frame(html`
            <input
                id="control"
                part="control"
                type=${this.type}
                .value=${this.value}
                name=${attribute(this.name)}
                placeholder=${attribute(this.placeholder)}
                autocomplete=${attribute(this.autocomplete)}
                inputmode=${attribute(this.inputmode)}
                pattern=${attribute(this.pattern)}
                minlength=${attribute(this.minlength)}
                maxlength=${attribute(this.maxlength)}
                min=${attribute(this.min)}
                max=${attribute(this.max)}
                step=${attribute(this.step)}
                ?required=${this.required}
                ?disabled=${this.disabled}
                ?readonly=${this.readonly}
                aria-invalid=${this.invalid()}
                aria-describedby=${this.described()}
                @input=${this.typed}
                @change=${this.changed}
            />
        `);
    }
}

/**
 * A multi-line text control, drawn from the token layer rather than replaced.
 *
 * Everything {@link UiInput} says applies. What differs is two rules — a height to start
 * at, and resizing left on the vertical axis, because a control that cannot grow is one
 * people fight and one that grows sideways breaks the layout around it — and that a
 * `<textarea>` has no `type` and no `pattern` to validate against.
 *
 * @example
 * ```html
 * <ui-textarea label="Notes" name="notes" rows="4"></ui-textarea>
 * ```
 */
export class UiTextarea extends UiTextField {
    static override readonly styles: CSSResult[] = [
        field,
        css`
            textarea {
                min-block-size: calc(${reference('--ui-space')} * 10);
                resize: vertical;
            }
        `,
    ];

    static override readonly properties = {
        ...UiTextField.properties,
        rows: { type: String, reflect: true },
    };

    /** How many lines the control starts at. Empty leaves the platform's own default. */
    rows = '';

    override render(): TemplateResult {
        return this.frame(html`
            <textarea
                id="control"
                part="control"
                .value=${this.value}
                name=${attribute(this.name)}
                placeholder=${attribute(this.placeholder)}
                autocomplete=${attribute(this.autocomplete)}
                minlength=${attribute(this.minlength)}
                maxlength=${attribute(this.maxlength)}
                rows=${attribute(this.rows)}
                ?required=${this.required}
                ?disabled=${this.disabled}
                ?readonly=${this.readonly}
                aria-invalid=${this.invalid()}
                aria-describedby=${this.described()}
                @input=${this.typed}
                @change=${this.changed}
            ></textarea>
        `);
    }
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

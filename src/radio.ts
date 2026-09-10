import { LitElement, css, html, nothing, type CSSResult, type TemplateResult } from 'lit';
import { reference } from './reference.js';

/** Which way a group lays its options out, and announces that it did. */
export type RadioOrientation = 'vertical' | 'horizontal';

// Stryker disable next-line StringLiteral: both ends of this event read the constant — the
// declaration dispatches it and the group listens for it — so a different name, the empty
// string included, still meets itself. Nothing outside this module names it, which is what
// makes the mutant provably equivalent rather than merely uncaught.
const announcement = 'ui-radio-changed';

/**
 * The name the rendered controls share, which is what makes them one group.
 *
 * It never leaves this shadow root and never reaches a form: a radio group with no form
 * owner is scoped by its **tree**, so one literal is safe in every instance on a page —
 * two groups carrying it are two groups, measured. What a form submits is the host's own
 * `name`, through `ElementInternals`.
 */
const grouping = 'option';

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
 * One choice in a {@link UiRadioGroup}: a value, and the text beside it.
 *
 * **It draws nothing.** The group renders the real `<input type="radio">` and the
 * `<label>` around it, because a `role="radiogroup"`, the name pointing at it and the
 * controls it contains have to share one tree scope — `ARCHITECTURE.md`, *A relationship
 * needs one tree scope*. So this element exists to be read rather than to be seen, the way
 * `<ui-option>` does for `<ui-select>`.
 *
 * @example
 * ```html
 * <ui-radio value="free">Free</ui-radio>
 * ```
 */
export class UiRadio extends LitElement {
    static override readonly styles: CSSResult = css`
        :host {
            display: none;
        }
    `;

    static override readonly properties = {
        value: { type: String, reflect: true },
        checked: { type: Boolean, reflect: true },
        disabled: { type: Boolean, reflect: true },
    };

    /** What the group submits while this choice is the one in force. */
    value = '';

    /** Whether this is the choice a group with no `value` starts on, and resets to. */
    checked = false;

    /** Whether this one choice refuses interaction, the rest of the set staying live. */
    disabled = false;

    /**
     * Tells the group something changed, on every update and on every slot change.
     *
     * A property write is not something a `MutationObserver` reports, which is what makes a
     * declaration this package owns different from an element a host wrote: the property is
     * reactive here. It bubbles because the choices are the group's own light-DOM children,
     * and it is dispatched from `updated()` rather than from `disconnectedCallback`, which
     * has no path left to bubble along.
     */
    override updated(): void {
        this.#announce();
    }

    readonly #announce = (): void => {
        this.dispatchEvent(new Event(announcement, { bubbles: true }));
    };

    override render(): TemplateResult {
        return html`<slot @slotchange=${this.#announce}></slot>`;
    }
}

/**
 * A set of choices, laid out and named as one thing.
 *
 * **It hand-rolls no roving tabindex and it brings no state machine.** Native radios
 * sharing a `name` **are** the APG **Radio Group** pattern — one tab stop, arrow keys that
 * move *and* select, wrapping at the ends, and left/right swapped under `dir="rtl"` — and
 * that holds inside a shadow root, where the group is scoped by its tree because the
 * controls have no form owner. `tests/radio.test.ts` measures it rather than trusting it.
 * `ARCHITECTURE.md`, *Behaviour is delegated*, carries why no machine arrived.
 *
 * **What it owns is what the platform leaves out**: the drawing, the layout, the group's
 * own name, help and message, and form participation through `ElementInternals` — a
 * control in a shadow root has no form owner, so the element answers for the value, the
 * validity and the three form lifecycle callbacks.
 *
 * @example
 * ```html
 * <ui-radio-group label="Plan" name="plan" help="Change it any time.">
 *   <ui-radio value="free">Free</ui-radio>
 *   <ui-radio value="pro" checked>Pro</ui-radio>
 * </ui-radio-group>
 * ```
 */
export class UiRadioGroup extends LitElement {
    static override readonly styles: CSSResult = css`
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

        .label {
            color: ${reference('--ui-color-text')};
        }

        :host([disabled]) .label {
            color: ${reference('--ui-color-text-muted')};
        }

        .options {
            display: flex;
            flex-direction: column;
            gap: calc(${reference('--ui-space')} / 2);
        }

        /* Laid out by the attribute rather than by the host's own CSS, so the drawing and
           the announcement cannot disagree: orientation sets both this rule and
           aria-orientation, and a host who reached for flex-direction instead would change
           one of the two. */
        :host([orientation='horizontal']) .options {
            flex-direction: row;
            flex-wrap: wrap;
            column-gap: calc(${reference('--ui-space')} * 2);
        }

        /* The label CONTAINS its control, so there is no IDREF to resolve and no id to
           generate — the same shape src/checkbox.ts takes, and the reason the click target
           covers the text for free. align-items rather than center: an option whose text
           wraps to two lines should keep its control on the first. */
        .option {
            display: flex;
            align-items: center;
            gap: calc(${reference('--ui-space')} / 2);
            color: ${reference('--ui-color-text')};
            cursor: pointer;
        }

        .option:has(input:disabled) {
            color: ${reference('--ui-color-text-muted')};
            cursor: not-allowed;
        }

        /* appearance: none is this component's whole cost, and it is taken for the reason
           ARCHITECTURE.md states as a debt rather than a free hand: it removes the
           platform's dot, its target size and its behaviour under forced colors in one
           declaration, and each of those is answered below. What it buys is a radio that
           belongs beside the checkbox this kit already draws — a native 13px radio next to
           a drawn 24px checkbox would argue cosmetically for a difference that is
           semantic. */
        input {
            appearance: none;
            box-sizing: border-box;
            flex: none;
            /* The user agent puts 3px around a radio. Left in, it would put the control
               off centre against the text beside it. */
            margin: 0;
            inline-size: ${size};
            block-size: ${size};
            /* A circle, and the one measurement here that is not a token: the shape is what
               tells a radio from a checkbox before either is read, so it cannot follow
               --ui-radius without a square radio becoming possible. */
            border-radius: 50%;
            background-color: ${reference('--ui-color-surface')};
            background-repeat: no-repeat;
            border: 1px solid ${reference('--ui-color-border')};
            cursor: inherit;
            /* The focus ring is deliberately not in this list, for the reason
               src/button.ts gives beside its own: delaying the affordance that says *this
               is where you are* is the opposite of what it exists to do. */
            transition:
                background-color ${reference('--ui-duration-state')}
                    ${reference('--ui-easing-state')},
                border-color ${reference('--ui-duration-state')} ${reference('--ui-easing-state')};
        }

        /* The mark is a hole: the whole control, minus the circle, so what shows through is
           whatever the control sits on. The docblock on the mask constant says why a hole
           rather than a colour. */
        input:checked {
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
        input:hover:not(:disabled) {
            border-color: ${reference('--ui-color-text')};
        }

        input:checked:hover:not(:disabled) {
            background-color: ${reference('--ui-color-accent-hover')};
            border-color: ${reference('--ui-color-accent-hover')};
        }

        /* A visible focus ring is not decoration: removing it is the single most common way
           a component stops being usable by keyboard — and on a radio group it is the only
           thing that says which option an arrow key just moved to. */
        input:focus-visible {
            outline: 2px solid ${reference('--ui-color-focus')};
            outline-offset: 2px;
        }

        input:disabled {
            cursor: not-allowed;
            opacity: 0.5;
        }

        /* The error is the SET's, not one option's: what a radio group gets wrong is the
           choice. Read off the rendered aria-invalid rather than a reflected attribute on
           the host, which is the trap ui-checkbox measured — Lit reflects an empty string
           default as an empty attribute, and an attribute-presence selector matches every
           element.

           This used to retarget --ui-color-border over the whole subtree, because no
           selector in this sheet could reach a control two elements down in the host's
           tree. The controls are in here now, so the rule names them. */
        .options[aria-invalid='true'] input {
            border-color: ${reference('--ui-color-danger')};
        }

        .help {
            color: ${reference('--ui-color-text')};
            font-size: ${reference('--ui-text-supporting')};
        }

        /* Colour is not the only cue — the message says what is wrong, and aria-invalid
           marks the group whatever the styling does. */
        .error {
            color: ${reference('--ui-color-danger')};
            font-size: ${reference('--ui-text-supporting')};
        }

        /* Forced colors replaces every author colour with one from the user's palette, so
           the accent that says *selected* becomes the same Canvas as the surface that says
           *not* — the state disappears, silently, for the people who turned the mode on to
           see states more clearly. System colours are the ones forced colors keeps, so the
           selected state names Highlight and the difference survives; the mark keeps
           working untouched, because a mask has no colour to force.

           Opacity is not a colour and is not forced, so the disabled control would still be
           half-transparent against a palette chosen for contrast. GrayText is what that
           mode has for *unavailable*, and it is a colour rather than a veil. */
        @media (forced-colors: active) {
            input:checked {
                background-color: Highlight;
                border-color: Highlight;
            }

            input:disabled {
                border-color: GrayText;
                opacity: 1;
            }
        }
    `;

    static readonly formAssociated = true;

    /**
     * Focus is delegated, so `focus()` and `reportValidity()` reach a control — the host is
     * not a focusable element. Measured with the group: the delegation lands on the first
     * option rather than making all of them tab stops, because the roving one is still the
     * platform's.
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
        // Stryker disable next-line ObjectLiteral: `{}` is what Lit's default converter
        // already does for a string — `type` only switches the converter for Boolean,
        // Number, Object and Array — and `reflect` defaults to false either way. The
        // declaration is written out to say which of the two `value` is, not to change it.
        value: { type: String },
        orientation: { type: String, reflect: true },
        required: { type: Boolean, reflect: true },
        disabled: { type: Boolean, reflect: true },
    };

    /**
     * The accessible name, and the text above the set.
     *
     * A plain field rather than the `accessor` keyword, for the reason `src/button.ts`
     * gives beside its own — and so for every property below.
     */
    label = '';

    /** Supporting text under the set, which survives an error rather than yielding. */
    help = '';

    /** The message, which paints the boundaries and is announced with the group. */
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
     * The choice currently made.
     *
     * **Empty means _the declared default_ rather than _nothing_**, which is what lets a
     * `<ui-radio checked>` mean what `<input checked>` means and a reset return to it.
     * Not reflected, the way a native control's `checked` IDL attribute is not.
     */
    value = '';

    /** Which way the options are laid out, and what the group announces it did. */
    orientation: RadioOrientation = 'vertical';

    /** Whether a form is invalid while no choice is made. */
    required = false;

    /** Whether the whole set refuses interaction, and submits nothing. */
    disabled = false;

    readonly #internals = this.attachInternals();

    readonly #redraw = (): void => {
        this.requestUpdate();
    };

    override connectedCallback(): void {
        super.connectedCallback();

        // The half a slot cannot report: a property write on a choice. It reaches here by
        // bubbling, because the choices are this element's own light-DOM children.
        //
        // There is deliberately no removal in `disconnectedCallback`. A listener an element
        // holds on *itself* cannot outlive it, and `#redraw` is one stable reference, so
        // re-adding it on a reconnect is discarded rather than doubled.
        this.addEventListener(announcement, this.#redraw);
    }

    /** Every choice a host declared, in the order they were written. */
    #choices(): UiRadio[] {
        return [...this.querySelectorAll('ui-radio')];
    }

    /**
     * The choice in force: the host's `value` where it names one, the declared default
     * otherwise.
     *
     * The fallback is the platform's own rule read off the declarations — the first choice
     * marked `checked`, and failing that nothing at all, which is what a native set with no
     * checked radio in it does. A radio group differs from a `<select>` exactly here: it
     * has an empty state and a drop-down does not.
     */
    #chosen(): string {
        const choices = this.#choices();

        if (choices.some((choice) => choice.value === this.value)) {
            return this.value;
        }

        return choices.find((choice) => choice.checked)?.value ?? '';
    }

    /** The validity, taken from a control that computed it. */
    #publish(control: HTMLInputElement): void {
        if (this.error !== '') {
            this.#internals.setValidity({ customError: true }, this.error, control);

            return;
        }

        this.#internals.setValidity(control.validity, control.validationMessage, control);
    }

    /**
     * The value and the validity, which move together here or disagree anywhere.
     *
     * The first control is the one asked, and it is the one the browser would focus when a
     * form reports an invalid group. Iterated rather than asserted, for the reason
     * `src/input.ts` gives beside the same shape: a null branch here is unreachable, which
     * is a coverage hole and an immortal mutant at once.
     */
    override updated(): void {
        this.#internals.setFormValue(this.#chosen());

        for (const control of this.renderRoot.querySelectorAll('input')) {
            this.#publish(control);

            return;
        }

        // A group with no choices declared has nothing to validate against and nothing to
        // submit, which is a state a host can reach by writing an empty element.
        this.#internals.setValidity({});
    }

    /** A choice made by hand, mirrored back and re-dispatched. */
    readonly #changed = (event: Event): void => {
        this.value = (event.target as HTMLInputElement).value;
        this.dispatchEvent(new Event('change', { bubbles: true }));
    };

    /** A form reset, which returns to the choice the declarations name. */
    formResetCallback(): void {
        this.value = '';
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

    /** Whether the group currently satisfies its constraints. */
    get validity(): ValidityState {
        return this.#internals.validity;
    }

    /** The message a form would report for it, empty while the group is valid. */
    get validationMessage(): string {
        return this.#internals.validationMessage;
    }

    /** The ids describing the group, in the order a reader needs them. */
    #described(): string | typeof nothing {
        const ids = [this.error === '' ? '' : 'error', this.help === '' ? '' : 'help'].filter(
            (id) => id !== '',
        );

        return ids.length === 0 ? nothing : ids.join(' ');
    }

    /**
     * One declaration, as the label and control the platform needs.
     *
     * **`.checked` is a property binding and `?checked` would be wrong**, which is not a
     * style choice: on a radio the content attribute is `defaultChecked`, so once the
     * control has been interacted with — or once anything has set the property — the
     * attribute stops driving the live state. Measured, as a reset that redrew the
     * declared default and left the control on the choice the reader had made.
     */
    #draw(choice: UiRadio, chosen: string): TemplateResult {
        return html`<label class="option" part="option">
            <input
                type="radio"
                part="control"
                name=${grouping}
                value=${choice.value}
                .checked=${choice.value === chosen}
                ?disabled=${this.disabled || choice.disabled}
                ?required=${this.required}
                @change=${this.#changed}
            />
            <span part="option-label">${choice.textContent}</span>
        </label>`;
    }

    override render(): TemplateResult {
        const chosen = this.#chosen();

        return html`
            <div class="stack" part="stack">
                <span class="label" id="label" part="label">${this.label}</span>
                <div
                    class="options"
                    part="options"
                    role="radiogroup"
                    aria-labelledby="label"
                    aria-orientation=${this.orientation}
                    aria-invalid=${this.error === '' ? nothing : 'true'}
                    aria-describedby=${this.#described()}
                >
                    ${this.#choices().map((choice) => this.#draw(choice, chosen))}
                </div>
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
                <!-- The structural half, which slotchange reports and no observer has to.
                     What it holds draws nothing: a declaration is display: none. -->
                <slot @slotchange=${this.#redraw}></slot>
            </div>
        `;
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

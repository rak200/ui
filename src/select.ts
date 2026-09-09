import { LitElement, css, html, nothing, type CSSResult, type TemplateResult } from 'lit';
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
 * The event a declaration fires when anything about it changes.
 *
 * **Private to this file**, and a mechanism rather than an API: a host listens to
 * `<ui-select>`, never to this.
 */
const announcement = 'ui-option-changed';

/**
 * What {@link UiOption} and {@link UiOptgroup} have in common, which is that they draw
 * nothing.
 *
 * **A declaration rather than a control**, and the first of its kind here: every other
 * element in this package renders something a person can see. These two exist so that the
 * choices a host writes stay markup, while the thing the platform actually needs — real
 * `<option>` elements inside a real `<select>` — is built from them.
 *
 * They announce themselves on every update, and that is the half a `MutationObserver`
 * cannot do: `option.selected = true` is a property write, and no observer reports one.
 * Measured on the shape this replaced, where the control simply never moved. Because these
 * are this package's own elements the property is reactive, so the announcement is the
 * platform's own change detection rather than a watcher over somebody else's element.
 *
 * **Arriving and leaving are announced from the slot rather than from a callback**, and
 * that is measured rather than chosen: an event dispatched from `disconnectedCallback` has
 * no path left to bubble along — the option is already out of the tree, and the removal
 * never reached the select. A slot reports both directions, which is the thing it exists
 * to tell you.
 *
 * **Each declaration carries its own slot, and that is why**: a slot reports only the
 * nodes assigned to *it*, so `<ui-select>`'s own slot sees a choice added or removed at the
 * top level and sees nothing at all when one moves inside an `<ui-optgroup>`. Measured, as
 * a removal from inside a group that left the control showing a choice that was gone.
 */
class UiDeclaration extends LitElement {
    static override readonly styles: CSSResult = css`
        :host {
            display: none;
        }
    `;

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
 * One choice in a {@link UiSelect}.
 *
 * The text is what the reader sees; `value` is what a form submits. `selected` is the
 * **default** — the choice the control starts on and returns to on reset — which is what
 * `selected` means on a native `<option>`.
 *
 * @example
 * ```html
 * <ui-option value="brl">Real</ui-option>
 * ```
 */
export class UiOption extends UiDeclaration {
    static override readonly properties = {
        value: { type: String, reflect: true },
        selected: { type: Boolean, reflect: true },
        disabled: { type: Boolean, reflect: true },
    };

    /**
     * What a form submits when this is the choice made.
     *
     * A plain field rather than the `accessor` keyword, for the reason `src/button.ts`
     * gives beside its own.
     */
    value = '';

    /** Whether this is the choice the control starts on. */
    selected = false;

    /** Whether this choice can be made at all. */
    disabled = false;
}

/**
 * A named set of choices, which the platform draws as a heading inside the list.
 *
 * @example
 * ```html
 * <ui-optgroup label="Americas">
 *   <ui-option value="brl">Real</ui-option>
 * </ui-optgroup>
 * ```
 */
export class UiOptgroup extends UiDeclaration {
    static override readonly properties = {
        label: { type: String, reflect: true },
        disabled: { type: Boolean, reflect: true },
    };

    /** The heading the platform draws above the set. */
    label = '';

    /** Whether every choice in the set is unavailable. */
    disabled = false;
}

/**
 * A native `<select>`, styled by the token layer rather than replaced.
 *
 * **The `<select>` is this element's**, rendered into its shadow root with its label, its
 * help and its message, so the IDREFs resolve in one tree scope. What a host writes is the
 * tag, its attributes, and the choices — as {@link UiOption} and {@link UiOptgroup}.
 *
 * **The choices could not stay as `<option>`s**, and that is measured rather than
 * preferred: a `<slot>` inside a `<select>` assigns the nodes and the select sees none of
 * them. `HTMLSelectElement.options` is built from its own children, not from the flattened
 * tree — `options.length` was `0`, `value` empty and `selectedIndex` `-1`, with two options
 * assigned. So the choices are declarations this package owns, and the `<option>` elements
 * the platform needs are built from them.
 *
 * The element joins the form itself, through `ElementInternals`: a control in a shadow root
 * has no form owner.
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
 * <ui-select label="Currency" name="currency">
 *   <ui-option value="brl">Real</ui-option>
 *   <ui-option value="usd">Dollar</ui-option>
 * </ui-select>
 * ```
 */
export class UiSelect extends LitElement {
    static override readonly styles: CSSResult = css`
        :host {
            display: block;
        }

        /* The box, which src/input.ts also draws and tests/select.test.ts compares. */
        select {
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
        select {
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
        select:not([multiple]) {
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
        select:not([multiple]):dir(rtl) {
            background-position:
                left ${reference('--ui-space')} center,
                left calc(${reference('--ui-space')} + ${arm}) center;
        }

        /* The boundary completes the mix it already started, the same way ui-input's does
           and against the same token.

           There is no [readonly] guard here and its absence is measured rather than
           forgotten: readOnly is not a property of a select at all, so the input's
           second guard would be a rule about an attribute the platform never sets. */
        select:hover:not(:disabled) {
            border-color: ${reference('--ui-color-text')};
        }

        /* A visible focus ring is not decoration: removing it is the single most common
           way a component stops being usable by keyboard. */
        select:focus-visible {
            outline: 2px solid ${reference('--ui-color-focus')};
            outline-offset: 2px;
        }

        select:disabled {
            cursor: not-allowed;
            opacity: 0.5;
        }

        /* Read off the control's own aria-invalid, which this element now writes: it is
           the same source a screen reader uses. Not :host([error]) — a reflected string
           property whose default is empty puts an empty attribute on the host, and an
           attribute-presence selector matches every element. Measured on ui-checkbox. */
        select[aria-invalid='true'] {
            border-color: ${reference('--ui-color-danger')};
        }

        /* The rhythm ui-field used to own, written out here rather than shared with
           src/input.ts for the reason the docblock above gives about the box — and
           compared by tests/select.test.ts on the same terms. */
        .stack {
            display: flex;
            flex-direction: column;
            gap: calc(${reference('--ui-space')} / 2);
        }

        label {
            color: ${reference('--ui-color-text')};
        }

        :host([disabled]) label {
            color: ${reference('--ui-color-text-muted')};
        }

        .help {
            color: ${reference('--ui-color-text')};
            font-size: ${reference('--ui-text-supporting')};
        }

        /* Colour is not the only cue — the message says what is wrong, and aria-invalid
           marks the control whatever the styling does. */
        .error {
            color: ${reference('--ui-color-danger')};
            font-size: ${reference('--ui-text-supporting')};
        }
    `;

    static readonly formAssociated = true;

    /**
     * Focus is delegated, so `focus()` and `reportValidity()` reach the control — the host
     * is not a focusable element, and the second is what the browser calls itself when a
     * form with an invalid control is submitted.
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
        required: { type: Boolean, reflect: true },
        disabled: { type: Boolean, reflect: true },
        multiple: { type: Boolean, reflect: true },
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
     * The choice currently made.
     *
     * **Empty means _the declared default_ rather than _nothing_**, which is what lets an
     * `<ui-option selected>` mean what `<option selected>` means and a reset return to it.
     * Not reflected, the way a native control's `value` IDL attribute is not.
     */
    value = '';

    /** Whether a form is invalid while no choice is made. */
    required = false;

    /** Whether the control refuses interaction, and submits nothing. */
    disabled = false;

    /** Whether the control is a list rather than a drop-down. */
    multiple = false;

    readonly #internals = this.attachInternals();

    readonly #redraw = (): void => {
        this.requestUpdate();
    };

    override connectedCallback(): void {
        super.connectedCallback();

        // The half a slot cannot report: a property write on a choice. It reaches here by
        // bubbling, because the choices are this element's own light-DOM children.
        this.addEventListener(announcement, this.#redraw);
    }

    override disconnectedCallback(): void {
        this.removeEventListener(announcement, this.#redraw);
        super.disconnectedCallback();
    }

    /** Every choice a host declared, groups included, in the order they were written. */
    #options(): UiOption[] {
        return [...this.querySelectorAll('ui-option')];
    }

    /**
     * The choice in force: the host's `value` where it names one, the declared default
     * otherwise.
     *
     * The fallback is the platform's own rule, read off the declarations — the first
     * choice marked `selected`, and failing that the first choice at all, which is what a
     * native `<select>` does with no `selected` option in it.
     */
    #chosen(): string {
        const options = this.#options();

        if (options.some((option) => option.value === this.value)) {
            return this.value;
        }

        return (options.find((option) => option.selected) ?? options[0])?.value ?? '';
    }

    /** The validity, taken from the control that computed it. */
    #publish(control: HTMLSelectElement): void {
        if (this.error !== '') {
            this.#internals.setValidity({ customError: true }, this.error, control);

            return;
        }

        this.#internals.setValidity(control.validity, control.validationMessage, control);
    }

    /**
     * The value and the validity, which move together here or disagree anywhere.
     *
     * **Iterated rather than asserted**, and there is exactly one control to iterate —
     * `render()` puts it there unconditionally. A query and a null check would put a branch
     * here that no test could reach, which is a coverage hole and an immortal mutant at
     * once rather than safety. `src/input.ts` carries the same shape for the same reason.
     */
    override updated(): void {
        this.#internals.setFormValue(this.#chosen());

        for (const control of this.renderRoot.querySelectorAll('select')) {
            this.#publish(control);
        }
    }

    /**
     * `change` is re-dispatched because it is non-composed and stops at the shadow
     * boundary; `input` is composed and leaves on its own, retargeted. Measured on
     * `<ui-checkbox>`, and the same here.
     */
    readonly #changed = (event: Event): void => {
        this.value = (event.target as HTMLSelectElement).value;
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

    /** Whether the control currently satisfies its constraints. */
    get validity(): ValidityState {
        return this.#internals.validity;
    }

    /** The message a form would report for it, empty while the control is valid. */
    get validationMessage(): string {
        return this.#internals.validationMessage;
    }

    /** The ids describing the control, in the order a reader needs them. */
    #described(): string | typeof nothing {
        const ids = [this.error === '' ? '' : 'error', this.help === '' ? '' : 'help'].filter(
            (id) => id !== '',
        );

        return ids.length === 0 ? nothing : ids.join(' ');
    }

    /** One declaration, as the element the platform needs. */
    #draw(node: Element, chosen: string): TemplateResult {
        if (node instanceof UiOptgroup) {
            return html`<optgroup label=${node.label} ?disabled=${node.disabled}>
                ${[...node.children].map((child) => this.#draw(child, chosen))}
            </optgroup>`;
        }

        if (node instanceof UiOption) {
            return html`<option
                value=${node.value}
                ?selected=${node.value === chosen}
                ?disabled=${node.disabled}
            >
                ${node.textContent}
            </option>`;
        }

        return html``;
    }

    override render(): TemplateResult {
        const chosen = this.#chosen();

        return html`
            <div class="stack" part="stack">
                <label for="control" part="label">${this.label}</label>
                <select
                    id="control"
                    part="control"
                    name=${this.name === '' ? nothing : this.name}
                    ?required=${this.required}
                    ?disabled=${this.disabled}
                    ?multiple=${this.multiple}
                    aria-invalid=${this.error === '' ? nothing : 'true'}
                    aria-describedby=${this.#described()}
                    @change=${this.#changed}
                >
                    ${[...this.children].map((node) => this.#draw(node, chosen))}
                </select>
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
customElements.define('ui-select', UiSelect);

// Stryker disable next-line StringLiteral: the same, for the same reason.
customElements.define('ui-option', UiOption);

// Stryker disable next-line StringLiteral: the same, for the same reason.
customElements.define('ui-optgroup', UiOptgroup);

declare global {
    interface HTMLElementTagNameMap {
        'ui-select': UiSelect;
        'ui-option': UiOption;
        'ui-optgroup': UiOptgroup;
    }
}

import { LitElement, css, html, nothing, type CSSResult, type TemplateResult } from 'lit';
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
 */
const tick = css`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12.5l4.5 4.5L19 7'/%3E%3C/svg%3E")`;

/** A mask layer covering the whole control, which the mark is then subtracted from. */
const whole = css`linear-gradient(#000, #000)`;

/**
 * What a drawn boolean control looks like, which both elements share.
 *
 * **The control and its label are rendered together, in this element's shadow root.** RFC
 * 0005 settled that and measured why: an ARIA relationship needs every end of it inside one
 * tree scope, and the arrangement that strands a control is the one that puts the control on
 * one side of a shadow boundary and its label on the other — not the fact that the control
 * is rendered. With the `<label>` and the `<input>` in the same root the association is the
 * platform's, and so is everything that follows from it: the toggle, the <kbd>Space</kbd>
 * key, the click target over the label text, and the rule that a link inside a label
 * follows the link rather than toggling. None of that is written in this file, which is the
 * point of the shape.
 *
 * The state is this element's own, so these rules read `input:checked` directly. The
 * `::slotted(input:checked)` this file used to be built on was forced by
 * `:host(:has(input:checked))` being invalid in this engine, and that constraint went with
 * the slotted control.
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
    /* A column, because the error sits under the control rather than beside it — and
       flex-start rather than the default stretch, so a message wider than the label does
       not widen the label, which is the click target. */
    :host {
        display: inline-flex;
        flex-direction: column;
        align-items: flex-start;
        gap: calc(${reference('--ui-space')} / 2);
        font-family: ${reference('--ui-font')};
    }

    /* The label is the whole pair's worth of click target, which a host used to have to
       build by wrapping the component in a <label> of their own.

       flex rather than inline-flex, and the difference is one the platform erases: a flex
       item's display is blockified, so inline-flex here would compute to flex anyway — a
       declaration no rendering could tell from this one. */
    label {
        display: flex;
        align-items: center;
        gap: ${reference('--ui-space')};
        cursor: pointer;
        color: ${reference('--ui-color-text')};
    }

    input {
        appearance: none;
        box-sizing: border-box;
        /* The user agent puts 3px around a checkbox. Left in, it would sit inside the
           host box and put the control off centre in any layout that aligns to it. */
        margin: 0;
        flex: none;
        block-size: ${size};
        background-color: ${reference('--ui-color-surface')};
        background-repeat: no-repeat;
        border: 1px solid ${reference('--ui-color-border')};
        cursor: inherit;
        /* The focus ring is deliberately not in this list, for the reason src/button.ts
           gives beside its own: delaying the affordance that says *this is where you are*
           is the opposite of what it exists to do. */
        transition:
            background-color ${reference('--ui-duration-state')} ${reference('--ui-easing-state')},
            border-color ${reference('--ui-duration-state')} ${reference('--ui-easing-state')};
    }

    input:checked {
        background-color: ${reference('--ui-color-accent')};
        border-color: ${reference('--ui-color-accent')};
    }

    /* Unchecked, the boundary finishes the mix it already started — the same hover
       ui-input has, because it is the same boundary. Checked, the boundary is not what
       the eye is on, so the fill moves instead, the way ui-button's does.

       The disabled guard is measured rather than assumed: a disabled control still
       matches :hover. */
    input:hover:not(:disabled) {
        border-color: ${reference('--ui-color-text')};
    }

    input:checked:hover:not(:disabled) {
        background-color: ${reference('--ui-color-accent-hover')};
        border-color: ${reference('--ui-color-accent-hover')};
    }

    /* A visible focus ring is not decoration: removing it is the single most common way a
       component stops being usable by keyboard. */
    input:focus-visible {
        outline: 2px solid ${reference('--ui-color-focus')};
        outline-offset: 2px;
    }

    input:disabled {
        opacity: 0.5;
    }

    /* Read off the host rather than through :has(), because the property is reflected and
       the host attribute is therefore the same fact one selector earlier. */
    :host([disabled]) label {
        cursor: not-allowed;
        color: ${reference('--ui-color-text-muted')};
    }

    /* Read off the control's own aria-invalid rather than off a host attribute, which is
       the same source a screen reader uses and the same rule this file carried when
       ui-field was the one writing it. One property now feeds all three — the boundary,
       the message and setValidity — so they cannot disagree. Only the boundary moves; a
       red fill on a switch would read as *on*.

       Not :host([error]): a reflected string property whose default is empty puts an
       empty attribute on the host, and an attribute-presence selector matches it. */
    input[aria-invalid='true'] {
        border-color: ${reference('--ui-color-danger')};
    }

    .error {
        color: ${reference('--ui-color-danger')};
        font-size: ${reference('--ui-text-supporting')};
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

/**
 * A boolean control, drawn from the token layer rather than replaced.
 *
 * {@link UiCheckbox} and {@link UiSwitch} differ in what they draw and in what they
 * announce, never in what they are made of. Both render a native `<input type="checkbox">`
 * inside a `<label>` in this element's shadow root, so every behaviour a boolean control
 * has stays the platform's — see the docblock on the shared styles above.
 *
 * **The element is the form control**, through `ElementInternals`. An `<input>` inside a
 * shadow root has no form owner, so the value reaches a submit because this element passes
 * it on and never because the input did.
 *
 * That is the entire price, and it is worth listing because it is smaller than it looks:
 * `setFormValue`, `setValidity`, the three form lifecycle callbacks a form can no longer
 * perform directly, and a re-dispatch of `change`, which is non-composed. **None of it is
 * accessibility** — the role, the checked state, the tab stop and what `disabled` does to
 * it are all still the platform's, because the control really is one.
 */
class UiToggle extends LitElement {
    static readonly formAssociated = true;

    /**
     * Focus is delegated, so `focus()` and `reportValidity()` reach the control.
     *
     * Neither is optional: the host is not a focusable element, so without this a call to
     * either lands on something that cannot take focus and does nothing — and the second
     * one is what the browser does on its own when a form with an invalid control is
     * submitted.
     */
    static override readonly shadowRootOptions = {
        ...LitElement.shadowRootOptions,
        delegatesFocus: true,
    };

    static override readonly properties = {
        label: { type: String, reflect: true },
        name: { type: String, reflect: true },
        value: { type: String, reflect: true },
        checked: { type: Boolean },
        disabled: { type: Boolean, reflect: true },
        required: { type: Boolean, reflect: true },
        error: { type: String, reflect: true },
    };

    /**
     * The short road to a label. `slot="label"` overrides it where markup is needed.
     *
     * A plain field rather than the `accessor` keyword, for the reason `src/button.ts`
     * gives beside its own — and so for every property below.
     */
    label = '';

    /**
     * The name the value is submitted under.
     *
     * **Reflected, and that is a requirement rather than a convenience.** A form reads a
     * form-associated custom element's name from the content attribute, so a host who sets
     * only the property would submit nothing at all — silently, with a value published and
     * no entry to carry it.
     */
    name = '';

    /** What a checked control submits, which the platform spells `on` by default. */
    value = 'on';

    /**
     * Whether the control is on.
     *
     * **Not reflected, which is the platform's own answer rather than an omission.** A
     * native checkbox's `checked` IDL attribute does not reflect either: the content
     * attribute is the *default*, which is what a form reset returns to, and an attribute
     * that followed every click would make the default whatever the user last did. A host
     * stylesheet reaches the live state through `::part(box):checked`.
     */
    checked = false;

    /** Whether the control rejects interaction. Reflected, the way the platform's is. */
    disabled = false;

    /** Whether a form is invalid while this control is off. Reflected, likewise. */
    required = false;

    /** The error message, which paints the boundary and is announced with the control. */
    error = '';

    readonly #internals = this.attachInternals();

    /** The form value and the validity, which move together here or disagree anywhere. */
    #publish(): void {
        this.#internals.setFormValue(this.checked ? this.value : null);

        if (this.error !== '') {
            this.#internals.setValidity({ customError: true }, this.error);
        } else if (this.required && !this.checked) {
            this.#internals.setValidity(
                { valueMissing: true },
                'Please tick this box if you want to proceed.',
            );
        } else {
            this.#internals.setValidity({});
        }
    }

    /**
     * Published after every render, and after the first one too — Lit calls this on the
     * initial update as well, which is why there is no `firstUpdated` beside it. A second
     * call from there would be a statement no test could distinguish from its own absence.
     */
    override updated(): void {
        this.#publish();
    }

    /**
     * What the inner control announces itself as, where the platform needs telling.
     *
     * Empty here, and the attribute is then omitted rather than written blank: an
     * `<input type="checkbox">` already announces `checkbox`, and restating it would be
     * this component overriding the platform with the platform. {@link UiSwitch} is the
     * one that has something to add.
     */
    protected readonly controlRole: string = '';

    /**
     * The listener, as a field rather than a method, which is this repository's shape for
     * one — `src/toast.ts` carries the same. What it delegates to is a method, so a
     * subclass can extend the mirroring without restating the binding.
     *
     * **The `change` is re-dispatched rather than left to bubble**, because it does not:
     * `change` is one of the events the platform marks non-composed, so the one the inner
     * control fires stops at the shadow boundary and a host listening on the tag would
     * hear nothing. `input` needs no such help — it is composed, and arrives retargeted to
     * this element on its own.
     */
    protected readonly changed = (event: Event): void => {
        this.sync(event.target as HTMLInputElement);
        this.dispatchEvent(new Event('change', { bubbles: true }));
    };

    /**
     * Mirrors the platform's own state back into the properties it came from.
     *
     * Read off the control rather than inverted from what was there: the platform is what
     * just changed it, and asking is the only way to stay right about a state this element
     * did not decide.
     */
    protected sync(control: HTMLInputElement): void {
        this.checked = control.checked;
    }

    /**
     * A form reset, which the platform calls and this element cannot see any other way.
     *
     * The content attribute is what it returns to, which is exactly `defaultChecked` on a
     * native control — and it stays a usable default only because `checked` is not
     * reflected onto it.
     */
    formResetCallback(): void {
        this.checked = this.hasAttribute('checked');
    }

    /** A `<fieldset disabled>` above this element, which reaches it and nothing below. */
    formDisabledCallback(disabled: boolean): void {
        this.disabled = disabled;
    }

    /** Restoring after a back-navigation, where the browser hands the value back. */
    formStateRestoreCallback(state: string | null): void {
        this.checked = state !== null;
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

    override render(): TemplateResult {
        return this.template(false);
    }

    /**
     * The whole drawing, with the one thing the two elements disagree on passed in.
     *
     * **A parameter rather than an overridable hook**, and the difference is one the
     * mutation floor found: a hook returning `false` is indistinguishable from a hook
     * returning nothing, because `input.indeterminate` coerces `undefined` to `false` — so
     * no test could tell the base implementation from its own absence. Passed at the call
     * site it is a value, and `<ui-switch>` reading back an unmixed control is what checks
     * it.
     *
     * The mixed state is bound rather than written onto the control after render, which is
     * what keeps this element free of a query whose null branch nothing could reach.
     */
    protected template(mixed: boolean): TemplateResult {
        return html`
            <label part="label">
                <input
                    type="checkbox"
                    part="box"
                    role=${this.controlRole === '' ? nothing : this.controlRole}
                    .checked=${this.checked}
                    .indeterminate=${mixed}
                    ?disabled=${this.disabled}
                    ?required=${this.required}
                    aria-invalid=${this.error === '' ? nothing : 'true'}
                    aria-describedby=${this.error === '' ? nothing : 'error'}
                    @change=${this.changed}
                />
                <span part="text"><slot name="label">${this.label}</slot></span>
            </label>
            ${
                this.error === ''
                    ? nothing
                    : html`<span class="error" id="error" part="error">${this.error}</span>`
            }
        `;
    }
}

/**
 * A checkbox, styled by the token layer rather than replaced.
 *
 * **The control is this element's**, which RFC 0005 decided and reversed an earlier rule to
 * do: the `<input>` and its `<label>` are rendered together in one shadow root, so `name`,
 * `checked`, `required` and `disabled` are properties here rather than attributes a host
 * writes on a control it supplies.
 *
 * **The indeterminate state is drawn, and that is not a feature being added.**
 * `appearance: none` takes the platform's dash away with the rest of the drawing, so a
 * control the host set `indeterminate` on would render as *unchecked* — a wrong answer
 * rather than a missing one. The dash below is what stops that, and nothing here invites
 * a tri-state that APG says is rare.
 *
 * @example
 * ```html
 * <ui-checkbox label="Send a receipt" name="receipt"></ui-checkbox>
 * ```
 *
 * @example A label an attribute cannot hold.
 * ```html
 * <ui-checkbox name="terms">
 *   <span slot="label">I accept the <a href="/terms">terms</a></span>
 * </ui-checkbox>
 * ```
 */
export class UiCheckbox extends UiToggle {
    static override readonly properties = {
        ...UiToggle.properties,
        indeterminate: { type: Boolean },
    };

    /**
     * The mixed state, which the platform stopped drawing once `appearance` was removed.
     *
     * It takes an attribute where the platform offers none, which is this element having
     * become the control rather than a box around one — and it is not reflected, for the
     * reason `checked` is not.
     */
    indeterminate = false;

    static override readonly styles: CSSResult[] = [
        toggle,
        css`
            input {
                inline-size: ${size};
                border-radius: ${reference('--ui-radius')};
            }

            /* The mark is a hole: the whole control, minus the shape, so what shows
               through is whatever the control sits on. The docblock on the mask constant
               above says why a hole rather than a colour. */
            input:checked {
                mask-image: ${whole}, ${tick};
                mask-composite: exclude;
                mask-size: 100% 100%;
                mask-repeat: no-repeat;
            }

            /* A dash needs no drawing: a rectangle is a gradient with a size. */
            input:indeterminate {
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

            /* The mixed state's forced-colors override lives here rather than beside the
               checked one in the shared sheet, and the cascade is why: the rule above is
               in a later sheet at equal specificity, so a Highlight declared back there
               loses to the accent declared here — and the accent is exactly what forced
               colors replaces with the surface, taking the state away for the reader who
               turned the mode on to see it. Measured, as a test the shared block passed
               for :checked and could not pass for this one. */
            @media (forced-colors: active) {
                input:indeterminate {
                    background-color: Highlight;
                    border-color: Highlight;
                }
            }
        `,
    ];

    override render(): TemplateResult {
        return this.template(this.indeterminate);
    }

    /**
     * A toggle answers the question the mixed state was asking, and the platform has
     * already cleared it on the control — so this reads it back rather than assuming.
     * Without it the next render would put the mixed state straight back.
     */
    protected override sync(control: HTMLInputElement): void {
        super.sync(control);
        this.indeterminate = control.indeterminate;
    }
}

/**
 * A switch, which is a checkbox that says *on* and *off* rather than *checked*.
 *
 * **The difference is semantic and the drawing follows it**, which is the order that
 * matters: a switch takes effect immediately and a checkbox is a value you submit, so the
 * two are not one component with two skins. `role="switch"` is what carries that to a
 * screen reader, and this element writes it on the control it renders — so a host has
 * nothing to remember and nothing to forget.
 *
 * There is no native switch to delegate to: `<input type="checkbox" switch>` is
 * unsupported in the engine this suite measures, so the element is a checkbox with a role
 * and a drawing. A host who wants the mixed state wants {@link UiCheckbox} — `switch` has
 * no third value, so this element does not draw one and offers no property for one.
 *
 * @example
 * ```html
 * <ui-switch label="Email notifications" name="notify" checked></ui-switch>
 * ```
 */
export class UiSwitch extends UiToggle {
    static override readonly styles: CSSResult[] = [
        toggle,
        css`
            input {
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
                /* The thumb is a background layer rather than an element, because the
                   layer moves with one number where an element would need a second rule
                   to be told the control is on. A closest-side radius comes from the
                   layer's own size. */
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

            input:checked {
                background-position: calc(100% - ${size} / 6) center;
            }
        `,
    ];

    protected override readonly controlRole: string = 'switch';
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

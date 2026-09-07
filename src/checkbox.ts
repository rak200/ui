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
 */
const tick = css`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12.5l4.5 4.5L19 7'/%3E%3C/svg%3E")`;

/** A mask layer covering the whole control, which the mark is then subtracted from. */
const whole = css`linear-gradient(#000, #000)`;

/**
 * What a drawn boolean control looks like, which both elements share.
 *
 * **The control and its label are both rendered here**, which RFC 0005 settled and
 * measured. An ARIA relationship needs every end in one tree scope; putting the control
 * inside and leaving the label outside is the arrangement that strands it, not the fact
 * that the control is inside. With both here the `<label>` contains the `<input>`, so the
 * association is the platform's — and so are the toggle, the Space key, the click target
 * over the label text, and the rule that a link inside the label follows the link instead.
 * None of that is written in this file, which is the point of the shape.
 *
 * The state is now this element's own, so these rules read `input:checked` directly. The
 * `::slotted(input:checked)` this file used to be built on was forced by
 * `:host(:has(input:checked))` being invalid in this engine, and that constraint is gone
 * with the slotted control.
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
        font-family: ${reference('--ui-font')};
    }

    /* The label is the whole element's worth of click target, which is what a host used
       to get by wrapping the pair in a <label> of their own. */
    label {
        display: inline-flex;
        align-items: center;
        gap: ${reference('--ui-space')};
        cursor: pointer;
        color: ${reference('--ui-color-text')};
    }

    label:has(input:disabled) {
        cursor: not-allowed;
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

    label:has(input:disabled) {
        color: ${reference('--ui-color-text-muted')};
    }

    /* The error state is drawn from this element's own invalidity rather than from an
       attribute a second component wrote: the host sets the error, the same value reaches
       setValidity, and the message under the control and the boundary around it cannot
       disagree. Only the boundary moves; a red fill on a switch would read as *on*. */
    :host([error]) input {
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
        input:checked,
        input:indeterminate {
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
 * **The element is the form control**, through `ElementInternals`: the inner `<input>` is
 * in a shadow root and therefore has no form owner, so the value reaches a submit because
 * this element passes it on, and never because the input did.
 */
class UiToggle extends LitElement {
    static readonly formAssociated = true;

    static override readonly properties = {
        label: { type: String },
        name: { type: String },
        value: { type: String },
        checked: { type: Boolean, reflect: true },
        disabled: { type: Boolean, reflect: true },
        required: { type: Boolean, reflect: true },
        error: { type: String, reflect: true },
    };

    /** The short road for a label. A `slot="label"` overrides it where markup is needed. */
    label = '';

    /** The name the value is submitted under. */
    name = '';

    /** What a checked control submits, which the platform spells `on` by default. */
    value = 'on';

    /** Whether the control is on. Reflected, so a host stylesheet can select on it. */
    checked = false;

    /** Whether the control rejects interaction. Reflected, for the same reason. */
    disabled = false;

    /** Whether a form is invalid while this control is off. */
    required = false;

    /** The error message, which paints the boundary and is announced with the control. */
    error = '';

    readonly #internals = this.attachInternals();

    /**
     * The state the element was created with, which a form reset returns to.
     *
     * Read once rather than on every reset: `checked` is a live property by then, so
     * asking it later would return the state being reset away from.
     */
    #initial = false;

    override connectedCallback(): void {
        super.connectedCallback();
        this.#initial = this.checked;
    }

    override firstUpdated(): void {
        this.#publish();
    }

    override updated(): void {
        this.#publish();
    }

    /** The form value and the validity, which move together or disagree. */
    #publish(): void {
        this.#internals.setFormValue(this.checked ? this.value : null);

        const control = this.renderRoot.querySelector('input');

        if (this.error !== '') {
            this.#internals.setValidity({ customError: true }, this.error, control ?? undefined);
        } else if (this.required && !this.checked) {
            this.#internals.setValidity(
                { valueMissing: true },
                'Please tick this box if you want to proceed.',
                control ?? undefined,
            );
        } else {
            this.#internals.setValidity({});
        }
    }

    /**
     * What the inner control announces itself as.
     *
     * An `<input type="checkbox">` announces `checkbox` on its own, so writing it here
     * changes nothing — and writing it unconditionally is what lets {@link UiSwitch} change
     * one word instead of restating the whole template.
     */
    protected readonly controlRole: string = 'checkbox';

    /**
     * The listener, as a field rather than a method, which is this repository's shape for
     * one — `src/toast.ts` carries the same. What it delegates to is a method, so a
     * subclass can extend the mirroring without restating the binding.
     */
    protected readonly changed = (event: Event): void => {
        this.sync(event.target as HTMLInputElement);
    };

    /**
     * Mirrors the platform's own state back into the properties it is reflected from.
     *
     * Read off the control rather than inverted from what was there: the platform is what
     * just changed it, and asking is the only way to stay right about states this element
     * did not decide.
     */
    protected sync(control: HTMLInputElement): void {
        this.checked = control.checked;
    }

    /**
     * A form reset, which the platform calls and this element cannot see any other way.
     *
     * `formResetCallback` and its two siblings are the whole of what moving the control
     * into the shadow root costs: a native control in a `<form>` is reset, disabled and
     * restored by the form itself, and one this element owns is this element's to answer
     * for.
     */
    formResetCallback(): void {
        this.checked = this.#initial;
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

    override render(): TemplateResult {
        return html`
            <label part="label">
                <input
                    type="checkbox"
                    part="box"
                    role=${this.controlRole}
                    .checked=${this.checked}
                    ?disabled=${this.disabled}
                    ?required=${this.required}
                    aria-describedby=${this.error === '' ? '' : 'error'}
                    @change=${this.changed}
                />
                <span part="text"><slot name="label">${this.label}</slot></span>
            </label>
            ${
                this.error === ''
                    ? ''
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
 * writes on a control it supplies. The value reaches a submit through `ElementInternals`,
 * because an input inside a shadow root has no form owner.
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
        indeterminate: { type: Boolean, reflect: true },
    };

    /** The mixed state, which the platform stopped drawing once `appearance` was removed. */
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
        `,
    ];

    /**
     * Puts the mixed state onto the control, which no attribute can carry.
     *
     * `indeterminate` is an IDL property with no content attribute, so the template cannot
     * bind it and this is the only place it can be set. Written on every update rather
     * than on change, because a host may set it at any time.
     */
    override updated(): void {
        super.updated();

        const control = this.renderRoot.querySelector('input');

        if (control !== null) {
            control.indeterminate = this.indeterminate;
        }
    }

    /**
     * A toggle answers the question the mixed state was asking, and the platform has
     * already cleared it on the control — so this reads it back rather than assuming.
     * Without it `updated()` would put the mixed state straight back.
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
 * no third value, so this element does not draw one.
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

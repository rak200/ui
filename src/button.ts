import { LitElement, css, html, nothing, type TemplateResult } from 'lit';
import { reference } from './reference.js';

/** How much visual weight a button carries. */
export type ButtonVariant = 'primary' | 'secondary';

/**
 * A button.
 *
 * It delegates to a real `<button>` in its shadow root rather than reimplementing one,
 * which is what makes the keyboard behaviour, the accessible name and the disabled
 * semantics the platform's job instead of this file's. No state machine is involved
 * because a button has no state to model.
 *
 * @example
 * ```html
 * <ui-button variant="primary">Save</ui-button>
 * ```
 */
export class UiButton extends LitElement {
    static override readonly styles = css`
        :host {
            display: inline-block;
        }

        button {
            font: inherit;
            font-family: ${reference('--ui-font')};
            border: 1px solid transparent;
            border-radius: ${reference('--ui-radius')};
            padding: ${reference('--ui-space')} calc(${reference('--ui-space')} * 2);
            cursor: pointer;
            /* Measured in WebKit and in Chromium under a phone viewport: the platform
           paints its own wash on tap — 40% black in WebKit, the Android blue in
           Chromium — over whatever the component decided, so the pressed colour below
           arrives underneath it and is not what a finger sees.

           Removing it is only correct because the pressed state exists. Until it did,
           this wash was the ONLY response a touch got, and turning it off would have
           left a button that answers a finger with nothing. */
            -webkit-tap-highlight-color: transparent;
            /* Only the colour moves. The focus ring is deliberately not in this list:
           delaying the affordance that says *this is where you are* is the opposite of
           what it exists to do. */
            transition: background-color ${reference('--ui-duration-state')}
                ${reference('--ui-easing-state')};
        }

        button:disabled {
            cursor: not-allowed;
            opacity: 0.5;
        }

        /* A visible focus ring is not decoration: removing it is the single most common
       way a component stops being usable by keyboard. */
        button:focus-visible {
            outline: 2px solid ${reference('--ui-color-focus')};
            outline-offset: 2px;
        }

        button.primary {
            background: ${reference('--ui-color-accent')};
            color: ${reference('--ui-color-accent-contrast')};
        }

        button.secondary {
            background: ${reference('--ui-color-surface')};
            color: ${reference('--ui-color-text')};
            border-color: currentcolor;
        }

        /* The :not(:disabled) guard is measured rather than assumed: a disabled button
       still matches :hover and :active, so without it the button would light up under a
       pointer that cannot activate it. Ordering does not substitute for the guard — both
       rules below outrank the resting one on specificity whatever their position. */
        button.primary:not(:disabled):hover {
            background: ${reference('--ui-color-accent-hover')};
        }

        button.secondary:not(:disabled):hover {
            background: ${reference('--ui-color-hover')};
        }

        /* A press is over in about 100ms, so an entering transition of 150ms would land
       after the finger has left and the pressed colour would never be seen. Zero here
       rather than a second token: it is a fact about how long a click lasts, not a
       decision a host would want to retune. And the pressed state is never the only
       feedback a component gives — activating by Enter produces no :active at all. */
        button.primary:not(:disabled):active {
            background: ${reference('--ui-color-accent-pressed')};
            transition-duration: 0s;
        }

        button.secondary:not(:disabled):active {
            background: ${reference('--ui-color-pressed')};
            transition-duration: 0s;
        }

        /* The sentence a tooltip handed over: present to a screen reader and absent to
       everybody else. It is already on screen — in the tip, which is the whole point of
       the handoff — so drawing it again would show it twice.

       display:none would be the shorter way and it is the one this package will not take.
       The accessible description of a hidden element that is DIRECTLY referenced is
       computed anyway, by specification; whether every engine does it is a claim this
       toolchain cannot check, because no instrument here reads an accessibility tree.
       docs/select.md already settles what to do with a feature that cannot be verified,
       and the clip below has nothing left to disagree about: the node is in the tree in
       every engine, and painted in none.

       No offsets with the absolute, deliberately: an out-of-flow box with none stays at
       its static position, so it neither travels nor grows the scrollable area. */
        #description {
            position: absolute;
            inline-size: 1px;
            block-size: 1px;
            margin: -1px;
            padding: 0;
            overflow: hidden;
            clip-path: inset(50%);
            white-space: nowrap;
        }
    `;

    static override readonly properties = {
        variant: { type: String, reflect: true },
        disabled: { type: Boolean, reflect: true },
    };

    /**
     * How much visual weight the button carries.
     *
     * A plain field, not the `accessor` keyword: `accessor` is an auto-accessor, the
     * browser the suite runs in does not implement it, and the transform leaves it in
     * place — the module then fails to parse. The classic Lit pattern, a `static
     * properties` map beside plain fields with `useDefineForClassFields: false`, needs
     * neither the keyword nor decorators.
     */
    variant: ButtonVariant = 'primary';

    /** Whether the button rejects interaction. Reflected, so CSS can select on it. */
    disabled = false;

    /**
     * The sentence a `<ui-tooltip>` handed over, empty until one does.
     *
     * **Private, and the update is asked for by hand rather than declared.** A declared
     * reactive property is one a host can write, and a writable `description` is the
     * option RFC 0006 rejected twice over: it makes the host write the same sentence a
     * tooltip is already holding, and a property written before an element upgrades
     * shadows its accessor permanently on anything not built on Lit — reading back a
     * value it never delivered. What is public here is the event, which reports whether
     * anyone took it.
     */
    #description = '';

    constructor() {
        super();

        // In the constructor rather than on connection, because the listener has to exist
        // by the time an upgrade is observable: the tooltip waits on
        // `customElements.whenDefined`, which resolves after this has run.
        this.addEventListener('ui-describe', this.#describe);
    }

    /**
     * Takes the tip's sentence and renders it where an IDREF can reach it.
     *
     * An `aria-describedby` written in the host's tree cannot name a node in here — one
     * IDREF, one tree scope — which is the failure #156 measured and this is the answer
     * RFC 0006 chose. `preventDefault()` is the whole of the acknowledgement: the
     * dispatch's return value is what tells the tooltip whether to warn, so a malformed
     * payload is left unclaimed on purpose rather than accepted and ignored.
     */
    readonly #describe = (event: Event): void => {
        // The payload is tested and the event's class is not, which is narrower than it
        // looks: a plain `Event` carries no `detail` at all, so the type test below stops
        // one as surely as an `instanceof` would. The guard that used to be here is gone
        // because the mutation floor could not kill it — nothing reached it that the next
        // line did not already turn away, which makes it dead weight rather than defence.
        const handed: unknown = (event as CustomEvent<unknown>).detail;

        if (typeof handed !== 'string') {
            return;
        }

        event.preventDefault();

        this.#description = handed;
        this.requestUpdate();
    };

    override render(): TemplateResult {
        return html`
            <button
                class=${this.variant}
                ?disabled=${this.disabled}
                aria-describedby=${this.#description === '' ? nothing : 'description'}
                part="button"
            >
                <slot></slot>
            </button>
            ${
                this.#description === ''
                    ? nothing
                    : html`<span id="description">${this.#description}</span>`
            }
        `;
    }
}

// Stryker disable next-line StringLiteral: the registration runs once, at import,
// inside the warm process Stryker switches mutants in — so by the time a mutant on this
// line is active the element is already defined under the original name, and no test can
// observe the change. Outside the runner's reach, not an equivalent mutant.
customElements.define('ui-button', UiButton);

declare global {
    interface HTMLElementTagNameMap {
        'ui-button': UiButton;
    }
}

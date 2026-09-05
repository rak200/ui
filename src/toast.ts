import { LitElement, css, html, type TemplateResult } from 'lit';
import { reference } from './reference.js';

/** What a toast is telling the reader, which decides how it looks *and* how it is announced. */
export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

/** The class the exit is carried by, on the toast for exactly as long as the exit runs. */
const closing = 'closing';

/**
 * How long a toast that is not an error stays, in milliseconds.
 *
 * **Deliberately not a token, and that is the sharpest thing in this file.** Every
 * `--ui-duration-*` name is collapsed to `0.01ms` by `tokenStyleSheet()` when the reader
 * has asked for less motion — which is right for a transition and catastrophic for a dwell
 * time: a notice would vanish before it could be read, and only for the people least able
 * to chase it. A duration a component *waits* is not motion, so it is an attribute with a
 * default rather than a name in the scale.
 *
 * Five seconds is read off a rate rather than chosen: a short notice is eight or ten words,
 * and 180 words a minute is the unhurried end of silent reading — about three seconds — with
 * the rest of it spent noticing that something arrived at all.
 */
const dwell = 5000;

/**
 * The live regions a toast is announced through, and the box the stack is drawn in.
 *
 * **One container, two regions, and the count is the number of politenesses rather than
 * the number of messages.** A live region has to be in the document *before* the text is
 * put into it — a region that arrives with its content already inside is the single most
 * common way a toast is never announced — so the regions are rendered on connection and
 * never removed, and a toast is added to whichever one its variant names.
 *
 * That is the whole reason there are two. `aria-live` cannot vary per message inside one
 * region, and giving each toast its own `aria-live` would make every message its own
 * region root, which is the shape this component exists to avoid. Two regions that outlive
 * every message answer *politeness is per toast* without ever creating one.
 *
 * **Neither region carries `role="alert"` or `role="status"`**, and that is not a shortcut.
 * Both roles imply `aria-atomic="true"`, so every arrival re-announces the whole stack —
 * three toasts up means the third one reads all three. `aria-live` alone leaves
 * `aria-atomic` at its `false` default, which announces the toast that arrived and nothing
 * else. The semantics of `role="alert"` are `aria-live="assertive"` plus that atomicity;
 * this keeps the half that is right for a stack.
 *
 * ## Where it sits
 *
 * A `popover`, for the reason `<ui-tooltip>` is one: the top layer escapes every stacking
 * context and every `overflow: hidden` above it, so this package still names no `z-index`
 * and opens no layering category — the third overlay in a row not to. `manual`, because an
 * `auto` popover light-dismisses, and a toast that vanished on the next click somewhere
 * else would be a notice the user never read.
 *
 * It is shown once, on connection, and never hidden — which costs the one thing promotion
 * would have bought. A modal `<dialog>` opened *after* the toaster connects sits above it
 * in the top layer, and re-promoting the stack per message would fix that ordering and
 * break the announcement, by taking the region out of the tree and putting it back with
 * content already in it. The trade is not close, and it is not the real limit anyway: a
 * modal makes the rest of the document **inert**, so a toaster outside an open modal is out
 * of the accessibility tree whichever layer it is in. `docs/toast.md` says where to put one
 * for a page that toasts from inside a dialog.
 *
 * @example
 * ```html
 * <ui-toaster></ui-toaster>
 * ```
 */
export class UiToaster extends LitElement {
    static override readonly styles = css`
        :host {
            /* The user agent's own popover box is a centred panel with a border and a
               padding of its own. All of it is displaced, because what this is is a
               corner of the viewport rather than a dialog. */
            position: fixed;
            inset-block: auto 0;
            inset-inline: auto 0;
            margin: 0;
            border: none;
            background: none;
            /* The stack is wider than a phrase and narrower than the page. Capped in the
               space token so it scales with everything else a host retunes, and floored
               against the viewport so a narrow screen gets the margin rather than a
               horizontal scrollbar. */
            box-sizing: border-box;
            inline-size: min(100%, calc(${reference('--ui-space')} * 44));
            padding: calc(${reference('--ui-space')} * 2);
            /* The box covers a corner of the page whether or not it holds anything, so it
               takes no clicks; a toast puts them back on itself. Without this a page has a
               dead zone in the corner for as long as a toaster is on it. */
            pointer-events: none;
        }

        /* display is named under :popover-open and nowhere else, and that is the rule
           src/dialog.ts states beside its own: the user agent hides a closed popover with
           display: none, and a rule here that names display unconditionally outranks it —
           so a toaster whose popover never opened would render in the page flow instead of
           being invisible. */
        :host(:popover-open) {
            display: flex;
            flex-direction: column;
            gap: ${reference('--ui-space')};
        }

        /* The polite region is first and the assertive one second, so an error sits nearest
           the corner the stack grows from — which is where the eye already is. The order is
           a rendering decision and nothing else: what a screen reader does with either
           region is decided by its aria-live, not by which came first. */
        div {
            display: flex;
            flex-direction: column;
            gap: ${reference('--ui-space')};
            min-inline-size: 0;
        }

        slot::slotted(*) {
            pointer-events: auto;
        }
    `;

    override connectedCallback(): void {
        super.connectedCallback();

        // Written here rather than in the template, because it is the host's own attribute
        // and Lit renders into the shadow root. Set before it is shown, which is the order
        // showPopover() requires: it throws on an element carrying no popover attribute.
        this.setAttribute('popover', 'manual');

        // No guard, and none is reachable: removing a showing popover from the document
        // hides it, so an element arriving at connectedCallback is never already open.
        this.showPopover();
    }

    override render(): TemplateResult {
        return html`
            <div aria-live="polite" part="polite"><slot name="polite"></slot></div>
            <div aria-live="assertive" part="assertive"><slot name="assertive"></slot></div>
        `;
    }
}

/**
 * One message in a {@link UiToaster}.
 *
 * ## The variant decides three things, and that is the design
 *
 * `variant` is not only how the toast looks. It decides how urgently the message is
 * announced and whether it expires, because those three answers are one answer: **an error
 * is the message the reader has to see, hear, and keep.** So `danger` is announced
 * assertively and never times out, and every other variant is polite and does.
 *
 * The alternative was a second attribute for politeness, and it was rejected for what it
 * makes possible rather than for what it costs: two knobs can disagree, and a polite error
 * or an assertive success is a defect nothing reports. The issue behind this component
 * asked for `assertive` to be *reserved for errors* — a rule the API can hold is worth more
 * than a rule the documentation states. What it gives up is stated in `docs/toast.md`:
 * there is no way to write an assertive success.
 *
 * **The colour is redundant and must stay redundant.** WCAG 1.4.1 asks that colour never be
 * the only carrier of information, and here it never is: the message says what happened and
 * the edge agrees with it. That is also what makes the component correct under
 * `forced-colors`, where the edge goes flat and nothing is lost.
 *
 * ## Dismissal
 *
 * Manual always, timed unless the toast is an error or `duration` is `0`. There is
 * deliberately no way to remove the dismiss button: a toast that cannot be dismissed *and*
 * does not expire is a permanent obstruction, and that combination is one attribute away in
 * every kit that offers the knob.
 *
 * The timer stops while the pointer is over the toast or the focus is inside it, and starts
 * again when both have left — a notice must not expire while it is being read, which is
 * WCAG 2.2.1 aimed at the only time limit this component has.
 *
 * **A dismissed toast removes itself.** `ui-dismiss` is dispatched first, while the element
 * is still in the tree so the event can reach a listener above it; a framework rendering a
 * list of toasts drops the entry there rather than leaving the element to be put back.
 *
 * @example
 * ```html
 * <ui-toaster>
 *   <ui-toast variant="success">Saved.</ui-toast>
 * </ui-toaster>
 * ```
 */
export class UiToast extends LitElement {
    static override readonly styles = css`
        :host {
            display: flex;
            align-items: flex-start;
            gap: ${reference('--ui-space')};
            box-sizing: border-box;
            padding: ${reference('--ui-space')} calc(${reference('--ui-space')} * 1.5);
            border: 1px solid ${reference('--ui-color-border')};
            /* The edge, and the shorthand after the border above rather than a colour
               beside it: the width and the style are this rule's as much as the hue is.
               info reads the accent, which is the colour a page already answers with. */
            border-inline-start: calc(${reference('--ui-space')} / 2) solid
                ${reference('--ui-color-accent')};
            border-radius: ${reference('--ui-radius')};
            background: ${reference('--ui-color-surface')};
            color: ${reference('--ui-color-text')};
            font-family: ${reference('--ui-font')};
            /* Lifted, because it sits over the page rather than in it — and bounded as
               well as lifted, for the reason src/card.ts gives: a shadow is one value in
               both schemes and does almost nothing on a dark page, where the derived
               boundary is what separates the surface from what is under it. */
            box-shadow: ${reference('--ui-elevation-raised')};
            /* The toaster takes no clicks so it does not steal a corner of the page. This
               is the part that is not the corner. */
            pointer-events: auto;

            opacity: 1;
            translate: 0 0;
            transition:
                opacity ${reference('--ui-duration-state')} ${reference('--ui-easing-enter')},
                translate ${reference('--ui-duration-state')} ${reference('--ui-easing-enter')};
        }

        :host([variant='success']) {
            border-inline-start-color: ${reference('--ui-color-success')};
        }

        :host([variant='warning']) {
            border-inline-start-color: ${reference('--ui-color-warning')};
        }

        :host([variant='danger']) {
            border-inline-start-color: ${reference('--ui-color-danger')};
        }

        /* Where the entrance comes from. Without it there is nothing to transition out of:
           a toast goes from not rendered to laid out in one frame, and a transition needs a
           before-change style that an unrendered element does not have. */
        @starting-style {
            :host {
                opacity: 0;
                translate: 0 calc(${reference('--ui-space')} * 2);
            }
        }

        /* The exit, driven from a class rather than from the element leaving: the removal
           is what this is waiting for, so an exit keyed on it would never run. */
        :host(.closing) {
            opacity: 0;
            translate: 0 calc(${reference('--ui-space')} * 2);
            transition-timing-function: ${reference('--ui-easing-exit')};
        }

        div {
            /* The message takes the room the button does not, and may wrap inside it — a
               flex item refuses to shrink below its content without this. */
            flex: 1;
            min-inline-size: 0;
        }

        button {
            flex: none;
            display: grid;
            place-items: center;
            /* WCAG 2.2 2.5.8 asks 24 by 24, and an icon-only button is the shape that
               lands under it: the glyph is drawn at 1.25em, which is 20 pixels at the
               default text size. The platform floors nothing, so this does. */
            min-inline-size: 24px;
            min-block-size: 24px;
            margin: 0;
            padding: 0;
            border: none;
            border-radius: ${reference('--ui-radius')};
            background: none;
            /* Inherited so the glyph, sized in em, is the size of the text beside it. */
            font: inherit;
            color: ${reference('--ui-color-text-muted')};
            cursor: pointer;
            transition: background-color ${reference('--ui-duration-state')}
                ${reference('--ui-easing-state')};
        }

        /* A hover and a focus ring, and no pressed step — which is where every component
           here stops except ui-button. Pressing a button *is* the action, so its own
           pressed colour is the feedback for the thing being done; dismissing a notice is
           secondary, and a third colour for it would be a rule the suite cannot reach.
           Measured: a scripted pointer cannot be driven onto a box in the top layer from
           inside the frame the suite runs in, so an :active here would ship unmeasured. */
        button:hover {
            background: ${reference('--ui-color-hover')};
        }

        /* A visible focus ring is not decoration: removing it is the single most common way
           a component stops being usable by keyboard. */
        button:focus-visible {
            outline: 2px solid ${reference('--ui-color-focus')};
            outline-offset: 2px;
        }

        svg {
            inline-size: ${reference('--ui-icon-size')};
            block-size: ${reference('--ui-icon-size')};
            stroke-width: ${reference('--ui-icon-stroke')};
        }
    `;

    static override readonly properties = {
        variant: { type: String, reflect: true },
        duration: { type: Number },
        dismissLabel: { type: String, attribute: 'dismiss-label' },
    };

    /**
     * What this toast is telling the reader.
     *
     * Reflected, because it is what the stylesheet selects on — and because it is the
     * attribute a host reads back to find out how the toast will behave.
     *
     * A plain field rather than the `accessor` keyword, for the reason `src/button.ts`
     * states beside its own.
     */
    variant: ToastVariant = 'info';

    /**
     * How long the toast waits before dismissing itself, in milliseconds; `0` never.
     *
     * Ignored when the variant is `danger`, which never expires. Not a token, for the
     * reason the default carries: every duration name collapses under reduced motion, and
     * a dwell time that collapsed would take the notice away from the reader who asked for
     * less movement.
     */
    duration = dwell;

    /**
     * The accessible name of the dismiss button.
     *
     * This package's one user-facing string, and an attribute precisely because it is one:
     * a page that is not in English replaces it rather than forking the component. It names
     * the button and never appears on screen, which is why there is no way to leave it
     * empty — an unnamed control is the failure this default exists to prevent.
     */
    dismissLabel = 'Dismiss';

    /** The pending auto-dismissal; `0` when there is none, which is what `clearTimeout` reads. */
    #timer = 0;

    /**
     * Takes every listener off at once, for the reason `src/tooltip.ts` gives beside its
     * own: half of these leak invisibly if they are removed by name, and one `abort()` is
     * one thing to get right.
     */
    #listeners = new AbortController();

    /** Holds the clock while the toast is being read, which is the whole of WCAG 2.2.1 here. */
    readonly #hold = (): void => {
        this.#stop();
    };

    /** Starts it again once the pointer and the focus have both left. */
    readonly #resume = (): void => {
        this.#start();
    };

    /**
     * Dismisses on Escape.
     *
     * Bound to this element rather than to the document, which is the opposite of what
     * `<ui-tooltip>` needed and for the opposite reason: a tooltip is shown by a pointer
     * that leaves the focus elsewhere, and a toast is only reached by putting focus in it.
     * A document listener here would dismiss a toast the reader was not looking at.
     */
    readonly #onKey = (event: KeyboardEvent): void => {
        if (event.key === 'Escape') {
            this.dismiss();
        }
    };

    override connectedCallback(): void {
        super.connectedCallback();

        // Synchronously, and that is the point of doing it here as well as on update: a
        // custom element upgrades with its attributes already read, so the toast is in the
        // region its variant names in the same task it was inserted — nothing ever observes
        // it in the other one, and no message is announced twice by being moved.
        this.#route();

        // A fresh one per connection: an aborted signal stays aborted, so a toast a
        // framework moved in the tree would come back deaf.
        this.#listeners = new AbortController();

        const watched = { signal: this.#listeners.signal };

        this.addEventListener('pointerenter', this.#hold, watched);
        this.addEventListener('pointerleave', this.#resume, watched);
        this.addEventListener('focusin', this.#hold, watched);
        this.addEventListener('focusout', this.#resume, watched);
        this.addEventListener('keydown', this.#onKey, watched);

        this.#start();
    }

    override disconnectedCallback(): void {
        this.#stop();
        this.#listeners.abort();

        super.disconnectedCallback();
    }

    override willUpdate(): void {
        // Unconditionally rather than on a change to `variant`: routing is writing the
        // value the variant already implies, so doing it every update and doing it only
        // when the variant moved are the same write — and the guard would be a branch no
        // input can tell apart from its absence.
        this.#route();
    }

    override render(): TemplateResult {
        return html`
            <div part="message"><slot></slot></div>
            <button
                type="button"
                part="dismiss"
                aria-label=${this.dismissLabel}
                @click=${this.dismiss}
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    aria-hidden="true"
                >
                    <path d="M18 6 6 18M6 6l12 12" />
                </svg>
            </button>
        `;
    }

    /**
     * Runs the exit, announces it, and takes the toast off the page.
     *
     * Bound as a field so it can be handed to a listener and called as a method without
     * either losing `this`.
     */
    readonly dismiss = (): void => {
        void this.#exit();
    };

    /**
     * Puts the toast in the region its variant names.
     *
     * The `slot` attribute is the routing, which is what makes it observable: a host can
     * read back which region a toast landed in without this component exporting a second
     * name for it. The regions are `<ui-toaster>`'s, and a toast outside one simply carries
     * an attribute that assigns it to nothing.
     */
    #route(): void {
        this.slot = this.variant === 'danger' ? 'assertive' : 'polite';
    }

    /** Starts the clock, unless this toast has none to start. */
    #start(): void {
        // An error is never taken away from the reader, and `0` is how a host asks for the
        // same thing on any other variant.
        if (this.variant === 'danger' || this.duration === 0) {
            return;
        }

        this.#stop();

        this.#timer = window.setTimeout(this.dismiss, this.duration);
    }

    /** Stops it, whether or not one was running. */
    #stop(): void {
        window.clearTimeout(this.#timer);

        this.#timer = 0;
    }

    /** Fades the toast out, tells whoever is listening, and then removes it. */
    async #exit(): Promise<void> {
        // Dismissed twice — the button clicked while the clock was already up, say — is one
        // dismissal. Without this the second pass fires a second `ui-dismiss` for a toast
        // that has already left.
        if (this.classList.contains(closing)) {
            return;
        }

        this.#stop();
        this.classList.add(closing);

        // `finished` rejects when an animation is cancelled, so what this waits for is
        // settlement rather than fulfilment. `getAnimations` flushes the pending style
        // change before it answers, so the transition the line above started is in the list.
        await Promise.allSettled(this.getAnimations().map((animation) => animation.finished));

        // Before the removal, and that order is forced rather than preferred: a listener on
        // the toaster or on anything above it hears a bubbling event only while the element
        // is still in the tree.
        this.dispatchEvent(new Event('ui-dismiss', { bubbles: true, composed: true }));

        this.remove();
    }
}

// Stryker disable next-line StringLiteral: the registration runs once, at import, inside
// the warm process Stryker switches mutants in — so by the time a mutant on this line is
// active the element is already defined under the original name, and no test can observe
// the change. Outside the runner's reach, not an equivalent mutant.
customElements.define('ui-toaster', UiToaster);

// Stryker disable next-line StringLiteral: as above.
customElements.define('ui-toast', UiToast);

declare global {
    interface HTMLElementTagNameMap {
        'ui-toaster': UiToaster;
        'ui-toast': UiToast;
    }
}

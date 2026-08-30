import { LitElement, css, html, type TemplateResult } from 'lit';
import { reference } from './reference.js';

/** The class the exit is carried by, on the dialog for exactly as long as the exit runs. */
const closing = 'closing';

/** How many dialogs are holding the page still. */
let locks = 0;

/**
 * The inline values the first hold displaced, given back by the last release.
 *
 * No initial value, deliberately: nothing reads it before {@link hold} writes it, and an
 * initialiser here would be a value no test could ever observe.
 */
let displaced: { overflow: string; gutter: string };

/**
 * The `scrollbar-gutter` to hold while the page is locked.
 *
 * **The question is not whether the page scrolls**, which is what this asked first and
 * what `tests/manual/scroll-lock.mjs` caught. A page can scroll and still have no gutter
 * to keep — an overlay scrollbar takes no layout space — and reserving one there pulls the
 * content in by the width of a scrollbar that was never there: the same shift, in the
 * other direction, measured at -15px. The question is whether the scrollbar is *taking
 * space*, and the viewport minus the content width is what answers it.
 *
 * **Taken as arguments rather than read from `window`, and that is the floors talking.**
 * The suite's engine reports no scrollbar width at all, so the reserving branch is
 * unreachable from anything this code could measure itself — and a branch no test can
 * reach is a branch no floor can hold. As a function of two numbers it is decided here and
 * checked directly, while the call site keeps no branch of its own.
 *
 * @param viewport - The viewport's width, scrollbar included.
 * @param content - The width available to content, scrollbar excluded.
 * @param current - What the host already had, returned untouched when there is nothing to
 * reserve — so a page that sets its own gutter keeps it through the lock.
 */
export function reservedGutter(viewport: number, content: number, current: string): string {
    return viewport > content ? 'stable' : current;
}

/**
 * Writes the two properties the lock is made of, and the only place either is named.
 *
 * **Handed an element rather than reaching for `document.documentElement`**, for the same
 * reason {@link reservedGutter} is handed numbers. In the engine the suite runs, the root's
 * gutter never changes: the scrollbar takes no space, so the value written is always the
 * value already there and the write is a no-op that nothing can observe — the property name
 * becomes a string no test compares against anything. On an element handed in, both writes
 * are observable, and the names are checked rather than assumed.
 *
 * @param root - The element the lock is written on; `document.documentElement` in use.
 * @param overflow - What to set `overflow` to; the empty string removes the declaration.
 * @param gutter - What to set `scrollbar-gutter` to; likewise.
 */
export function applyLock(root: HTMLElement, overflow: string, gutter: string): void {
    root.style.overflow = overflow;
    root.style.setProperty('scrollbar-gutter', gutter);
}

/**
 * Holds the page still behind a modal, and gives it back when the last one leaves.
 *
 * `<dialog>` gives a modal the top layer, an inert background, a focus trap and focus
 * restoration. It does not stop the page behind it scrolling, and that is the one piece of
 * modality left to write.
 *
 * **The gutter is reserved rather than the scrollbar measured**, which is the difference
 * between a rule and an arithmetic nothing can check. `overflow: hidden` takes the
 * scrollbar away and the page jumps left by its width; the usual answer adds that width
 * back as padding — and the browser this suite runs in has overlay scrollbars, so the
 * width is `0`, every sign error in that arithmetic passes, and the check is theatre.
 * `scrollbar-gutter: stable` asks the browser to keep the space it was already using,
 * with no number to get wrong — {@link reservedGutter} decides whether there is any.
 *
 * Counted rather than flagged, because a dialog opening a dialog is ordinary — a confirm
 * over a form — and the second one closing must not give the page back while the first is
 * still up.
 */
function hold(): void {
    locks += 1;

    if (locks > 1) {
        return;
    }

    const root = document.documentElement;

    displaced = {
        overflow: root.style.overflow,
        gutter: root.style.getPropertyValue('scrollbar-gutter'),
    };

    applyLock(
        root,
        'hidden',
        reservedGutter(window.innerWidth, root.clientWidth, displaced.gutter),
    );
}

/** Gives the page back, once the last dialog has closed. */
function release(): void {
    locks -= 1;

    if (locks > 0) {
        return;
    }

    const root = document.documentElement;

    // What the host had, not what this module would have chosen. A page that sets its own
    // `overflow` or reserves its own gutter gets it back rather than being cleared.
    applyLock(root, displaced.overflow, displaced.gutter);
}

/** One of the dialog's slots — named, or the default one when the name is empty. */
function slot(name = ''): HTMLSlotElement {
    return Object.assign(document.createElement('slot'), { name });
}

/**
 * The shadow content, which is static all the way down: a `<dialog>` and three slots.
 *
 * Built here rather than queried out of the render root, and the reason is the floors
 * this repository holds. `renderRoot.querySelector('dialog')` is typed `| null`, and that
 * null is unreachable in a component that renders the element unconditionally — an
 * unreachable branch is one no test can cover and no mutant can be killed on, against a
 * coverage floor of 100 and a mutation floor of 100. The honest way to satisfy both is to
 * not create the branch.
 */
function build(): HTMLDialogElement {
    const dialog = document.createElement('dialog');

    dialog.setAttribute('part', 'dialog');
    dialog.append(slot('title'), slot(), slot('actions'));

    return dialog;
}

/**
 * A modal dialog.
 *
 * It delegates to a real `<dialog>` and opens it with `showModal()`, which is what makes
 * the top layer, the inert background, the focus trap, <kbd>Esc</kbd> and — the half
 * everyone forgets — **focus returning to whatever opened it** the platform's job rather
 * than this file's. What is written here is the part the platform leaves out: the scroll
 * lock, the accessible name across the shadow boundary, and an exit that can be seen.
 *
 * **This is where RFC 0016 expected Zag to arrive, and it does not.** Zag was adopted for
 * dismissable layers and focus trapping, and its dialog machine implements both over a
 * `<div>` — which means giving up the top layer and taking a JS focus trap in exchange for
 * one the user agent enforces. *The platform owns what the platform is good at* is the
 * older rule and the stronger one here. Zag arrives with the first component the platform
 * gives nothing for; `ARCHITECTURE.md` carries that decision for a consumer, and
 * `ROADMAP.md` names the component.
 *
 * @example
 * ```html
 * <ui-dialog>
 *   <h2 slot="title">Delete account</h2>
 *   <p>This cannot be undone.</p>
 *   <ui-button slot="actions" variant="secondary">Cancel</ui-button>
 *   <ui-button slot="actions">Delete</ui-button>
 * </ui-dialog>
 * ```
 */
export class UiDialog extends LitElement {
    static override readonly styles = css`
        /* The dialog is promoted to the top layer, so the host must take no space of its
           own: a <ui-dialog> laid out in the flow would leave a gap on every page where
           the dialog is closed. */
        :host {
            display: contents;
        }

        /* display is named under [open] and nowhere else, and that is not a style
           choice. The user agent closes a dialog with display: none; a rule here that
           names display unconditionally outranks it, and the closed dialog simply stays
           on the page. The attribute is still there through the exit below, which is what
           lets the transition run at all. */
        dialog[open] {
            display: flex;
            flex-direction: column;
            gap: calc(${reference('--ui-space')} * 2);
        }

        dialog {
            /* The user agent's own 2px border and white background are decisions this
               component owns. Nothing is raised underneath: elevation arrives with the
               component that needs to read as lifted, and a panel over a scrim is already
               separated from the page by the scrim. */
            border: none;
            border-radius: ${reference('--ui-radius')};
            padding: calc(${reference('--ui-space')} * 3);
            background: ${reference('--ui-color-surface')};
            color: ${reference('--ui-color-text')};
            font-family: ${reference('--ui-font')};

            /* A cap is a layout decision rather than a visual one, so it is not a token
               and opens no category. A host that wants another size reaches
               ::part(dialog), which is the surface for what the token set does not name.

               border-box, and the mutation floor is what found this: a dialog is
               content-box by default, so the cap applied to the content alone and the
               padding was added on top of it — the panel then ran wider than the cap by
               six spacing steps, and the clearance the calc promises was not the
               clearance it left. */
            box-sizing: border-box;
            max-inline-size: min(32rem, calc(100% - ${reference('--ui-space')} * 8));

            opacity: 1;
            transition: opacity ${reference('--ui-duration-state')}
                ${reference('--ui-easing-enter')};
        }

        /* Where the entrance comes *from*. Without it there is nothing to transition out
           of: the dialog goes from display: none to laid out in a single frame, and a
           transition needs a before-change style that an unrendered element does not
           have. */
        @starting-style {
            dialog[open] {
                opacity: 0;
            }
        }

        dialog::backdrop {
            background: ${reference('--ui-color-scrim')};
            opacity: 1;
            transition: opacity ${reference('--ui-duration-state')}
                ${reference('--ui-easing-enter')};
        }

        @starting-style {
            dialog[open]::backdrop {
                opacity: 0;
            }
        }

        /* The exit, driven from the class rather than from [open] going away: the
           platform removes a closed dialog in the same frame it is closed, so an exit
           waiting on the attribute would never be seen. Both halves are declared together
           because moving together is what lets #exit await one of them. */
        dialog.closing,
        dialog.closing::backdrop {
            opacity: 0;
            transition-timing-function: ${reference('--ui-easing-exit')};
        }

        /* showModal() focuses the dialog itself when nothing inside it can take focus,
           and a focused thing with no ring is the most common way a component stops being
           usable by keyboard. */
        dialog:focus-visible {
            outline: 2px solid ${reference('--ui-color-focus')};
            outline-offset: 2px;
        }

        /* A heading's own margin would add to the padding and to the gap above it. This
           resets the user agent's default and yields to a decision: for slotted content
           the outer tree wins, so a host's own rule for the element still beats this. */
        slot[name='title']::slotted(*) {
            margin: 0;
        }

        /* A slot is display: contents until something says otherwise, which is what
           makes this the line that turns three buttons into a row. */
        slot[name='actions'] {
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-end;
            gap: ${reference('--ui-space')};
        }
    `;

    static override readonly properties = {
        open: { type: Boolean, reflect: true },
    };

    /**
     * Whether the dialog is showing.
     *
     * **The single source of truth, and the only one.** {@link show} and {@link close} set
     * it, <kbd>Esc</kbd> sets it, and the component reacts to it — so an attribute, a
     * property and a method are three ways of saying one thing rather than three paths
     * that can disagree. Reflected, so a host stylesheet can select on it.
     *
     * A plain field rather than the `accessor` keyword, for the reason `src/button.ts`
     * states beside its own.
     */
    open = false;

    /** The real `<dialog>` this component is a shell around. */
    readonly #dialog = build();

    /**
     * Watches the light DOM for a title that changed without the element changing.
     *
     * Built here rather than on connection so it is never absent: a disconnect that has to
     * ask whether the observer exists is a branch no test can reach.
     */
    readonly #observer = new MutationObserver(() => {
        this.#label();
    });

    constructor() {
        super();

        this.#dialog.addEventListener('cancel', (event) => {
            // Esc reaches a modal as `cancel`, and letting it through closes in the same
            // frame — the exit this component just gained would never be seen. Prevented
            // and routed back through `open`, so however a close was asked for it leaves
            // by the one door.
            event.preventDefault();
            this.open = false;
        });

        this.#dialog.addEventListener('close', () => {
            // The announcement only. The platform fires `close` as a *queued task* rather
            // than synchronously, so this runs a turn after the dialog actually closed —
            // which is fine for telling a host, and was wrong for giving the page back:
            // the lock outlived the dialog by a task, and a second dialog opening inside
            // that window counted against a page nobody was holding any more. Measured on
            // Node 22 in CI and not on Node 24, which is what a timing dependency looks
            // like from the outside. {@link UiDialog.#shut} owns the release instead, at
            // both of the synchronous points where this element closes the dialog.
            this.open = false;
            this.dispatchEvent(new Event('ui-close', { bubbles: true, composed: true }));
        });
    }

    override connectedCallback(): void {
        super.connectedCallback();

        // The title may be replaced, or its text rewritten in place without any element
        // changing, which is what a host's re-render looks like from here — so
        // characterData matters as much as childList, and both can happen below a wrapper.
        this.#observer.observe(this, { childList: true, characterData: true, subtree: true });
    }

    override disconnectedCallback(): void {
        this.#observer.disconnect();

        // Removing an open dialog takes it out of the top layer and announces nothing, so
        // the page would stay held by a dialog that is no longer anywhere.
        this.#shut();

        super.disconnectedCallback();
    }

    override firstUpdated(): void {
        this.#label();
    }

    override updated(): void {
        // Compared against the platform's own state rather than against Lit's changed
        // properties, and it has to be: on the first update Lit reports every initialised
        // property as changed, so a dialog that has never been open would run the closing
        // path and announce a close that never happened. It is also what makes a re-render
        // for any other reason a no-op instead of a second `showModal()`, which throws.
        if (this.open === this.#dialog.open) {
            return;
        }

        if (this.open) {
            this.#enter();
        } else {
            void this.#exit();
        }
    }

    override render(): TemplateResult {
        return html`${this.#dialog}`;
    }

    /**
     * Opens the dialog.
     *
     * Sugar over `open = true` rather than a second way in — a method that opened by its
     * own route would be a state the attribute does not describe.
     */
    show(): void {
        this.open = true;
    }

    /** Closes the dialog, running the exit. Sugar over `open = false`, for the same reason. */
    close(): void {
        this.open = false;
    }

    /**
     * Puts the dialog in the top layer.
     *
     * `showModal()` rather than the `open` attribute, and the distance between the two is
     * the whole component: the attribute opens a dialog *in the flow*, with no top layer,
     * no inert background, no focus trap and no focus restoration. It is the one way to
     * get something that looks modal and traps nobody — which is why this host's `open` is
     * never bound onto the inner element's.
     */
    #enter(): void {
        this.#dialog.showModal();
        hold();
    }

    /** Runs the exit, and closes once it has finished. */
    async #exit(): Promise<void> {
        const dialog = this.#dialog;

        dialog.classList.add(closing);

        // `finished` rejects when an animation is cancelled, which is exactly what
        // reopening mid-exit does — so what this waits for is settlement rather than
        // fulfilment. `getAnimations` flushes the pending style change before it answers,
        // so the transition the line above started is already in the list.
        //
        // The backdrop is not in that list: a pseudo-element needs `subtree: true`,
        // measured. It does not need to be — the panel and the scrim move the same
        // property over the same duration token, so they start together and end together,
        // and awaiting one is awaiting both. `tests/dialog.test.ts` asserts that shared
        // duration rather than leaving it to this paragraph.
        await Promise.allSettled(dialog.getAnimations().map((animation) => animation.finished));

        dialog.classList.remove(closing);

        // Reopened while the exit was running. The dialog never left the top layer, so
        // there is nothing to close, and taking the class back off is the whole of the
        // way back.
        if (this.open) {
            return;
        }

        this.#shut();
    }

    /**
     * Closes the dialog and gives the page back, in that order and in one place.
     *
     * Both ways out run through here — the exit above and the disconnect below — so the
     * release is paired with the close rather than with the event the close will later
     * fire. The guard is the platform's own state rather than a flag this element keeps:
     * a dialog that is not open is holding nothing, so calling this twice gives the page
     * back once.
     */
    #shut(): void {
        if (!this.#dialog.open) {
            return;
        }

        this.#dialog.close();
        release();
    }

    /**
     * Names the dialog after its own title.
     *
     * **A copy of the text rather than a reference to the element, and that is forced.**
     * APG names a modal with `aria-labelledby` pointing at its heading, and an IDREF does
     * not cross a shadow boundary — so a `<dialog>` in this shadow root cannot point at a
     * heading in the host's tree. `ui-field` answers the same constraint by leaving every
     * associated element in the light DOM; a dialog cannot, because the element that has
     * to reach the top layer is the one this component renders. What does cross is a
     * string, so the name is copied and the observer above keeps the copy honest.
     */
    #label(): void {
        const title = this.querySelector(':scope > [slot="title"]');
        const label = title?.textContent.trim() ?? '';

        // A dialog with no title has no accessible name, and a blank `aria-label` would be
        // worse than none: a screen reader announces "dialog" either way, and an attribute
        // that is present and empty is the shape that makes an audit read as handled.
        if (label === '') {
            this.#dialog.removeAttribute('aria-label');
        } else {
            this.#dialog.setAttribute('aria-label', label);
        }
    }
}

// Stryker disable next-line StringLiteral: the registration runs once, at import, inside
// the warm process Stryker switches mutants in — so by the time a mutant on this line is
// active the element is already defined under the original name, and no test can observe
// the change. Outside the runner's reach, not an equivalent mutant.
customElements.define('ui-dialog', UiDialog);

declare global {
    interface HTMLElementTagNameMap {
        'ui-dialog': UiDialog;
    }
}

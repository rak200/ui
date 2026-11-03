import { LitElement, css, html, unsafeCSS, type TemplateResult } from 'lit';
import { kinds, query } from './motion.js';
import { enter, exit, mend } from './passage.js';
import { rain } from './rain.js';
import { reference } from './reference.js';

/** The class the exit is carried by, on the dialog for exactly as long as the exit runs. */
const closing = 'closing';

/** The query each of the panel's effects is drawn under: the consumer's choice, else a taste. */
const drawn = query('dialog');

/** The queries an entrance and an exit drawn in script are under: the panel's pieces or grain. */
const arriving = ['materialize', 'dissolve'].map((effect) => drawn('enter', effect)).join(' or ');
const leaving = ['erode', 'dissolve'].map((effect) => drawn('exit', effect)).join(' or ');

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
 * A state machine over a `<div>` would mean giving up the top layer to re-acquire a focus
 * trap the user agent already enforces — see `ARCHITECTURE.md`, *Behaviour is delegated*
 * (#122).
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
    /** The styles its shadow root adopts. */
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
               component owns, and the border it owns is the edge of what floats over the page,
               which is the card's derived boundary until the reader asks for more contrast.
               The scrim alone does not part the panel from the page in every scheme — over
               the dark surface it leaves 1.10:1 — and the border stands 4.36:1 from the
               page under the scrim and 3.95 from the panel, measured for RFC 0003. Nothing
               is raised underneath: elevation arrives with the component that needs to read
               as lifted, and the boundary is what parts this one. */
            border: 1px solid ${reference('--ui-color-border-overlay')};
            border-radius: ${reference('--ui-radius')};
            padding: calc(${reference('--ui-space')} * 3);
            /* A raised surface, as a card is: what a theme raises translucent, it raises here
               over the scrim. */
            background: ${reference('--ui-color-surface-raised')};
            backdrop-filter: ${reference('--ui-backdrop-raised')};
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
           because moving together is what lets #exit await one of them — over the state's
           step, whatever step the scrim came in over, so a scrim that came in slower is
           never cut short. */
        dialog.closing,
        dialog.closing::backdrop {
            opacity: 0;
            transition-duration: ${reference('--ui-duration-state')};
            transition-timing-function: ${reference('--ui-easing-exit')};
        }

        /* The scrim's moment, RFC 0004's: today's fade, or none, which puts it there at once
           and takes it away at once. */
        @container ${unsafeCSS(drawn('backdrop', 'none'))} {
            dialog::backdrop {
                transition: none;
            }
        }

        /* blur: the page behind blurs as the scrim comes in, over the dialog's step, and comes
           back into focus as it goes. */
        @container ${unsafeCSS(drawn('backdrop', 'blur'))} {
            dialog::backdrop {
                backdrop-filter: blur(4px);
                transition:
                    opacity ${reference('--ui-duration-modal')} ${reference('--ui-easing-enter')},
                    backdrop-filter ${reference('--ui-duration-modal')}
                        ${reference('--ui-easing-enter')};
            }

            @starting-style {
                dialog[open]::backdrop {
                    backdrop-filter: blur(0);
                }
            }

            dialog.closing::backdrop {
                backdrop-filter: blur(0);
            }
        }

        /* Whether the theme raises its surfaces as glass: the backdrop filter of a raised
           surface, read through the token's fallback, since a theme's name does not reach a
           shadow root. Where the reader asks for more contrast or less transparency the glass
           stands down and leaves the token with no value at all, which the fallback reads as
           none, where a query on the token itself took it for glass and left the page with no
           scrim — measured for RFC 0004. */
        :host {
            --ui-fx-glass: ${reference('--ui-backdrop-raised')};
        }

        /* Under glass, the blur alone, with no scrim colour over it, which would tint the page
           the glass is there to let through. */
        @container ${unsafeCSS(drawn('backdrop', 'blur'))} and (not style(--ui-fx-glass: none)) {
            dialog::backdrop {
                background: transparent;
            }
        }

        /* char-rain: the reference's falling code at three depths over the scrim, each a tile
           src/rain.ts draws in the accent, read off the scrim here, since a picture cannot read a
           token — handed to the script, which lays the tiles on the dialog for the scrim to read.
           It comes in as the blur does, over the dialog's step, and falls as a loop that settles
           runs, slowing to rest within the five seconds WCAG 2.2.2 lets motion run unstoppable,
           a still wall of code for as long as the dialog is open. Forced colours keep a picture
           where they take a gradient away, so the rain stands down there itself, and nothing is
           drawn. */
        dialog {
            --ui-fx-backdrop: none;
        }

        @container ${unsafeCSS(drawn('backdrop', 'char-rain'))} {
            dialog {
                --ui-fx-backdrop: char-rain;
            }

            dialog::backdrop {
                color: ${reference('--ui-color-accent')};
                background: var(--ui-fx-rain, none), ${reference('--ui-color-scrim')};
                transition: opacity ${reference('--ui-duration-modal')}
                    ${reference('--ui-easing-enter')};
                animation: ui-rain
                    calc(${reference('--ui-duration-loop')} * ${reference('--ui-iteration-settle')})
                    cubic-bezier(0.33, 0.33, 0.5, 1);
            }

            @media (forced-colors: active) {
                dialog {
                    --ui-fx-backdrop: none;
                }

                dialog::backdrop {
                    background-image: none;
                    animation: none;
                }
            }
        }

        /* Each depth falls from a whole number of its tiles above and comes to rest where it
           started, the nearest fastest: a tile every round of the loop for it, three in four for
           the middle, one in two behind. */
        @keyframes ui-rain {
            from {
                background-position:
                    0 calc(${reference('--ui-iteration-settle')} * -600px),
                    0 calc(${reference('--ui-iteration-settle')} * -390px),
                    0 calc(${reference('--ui-iteration-settle')} * -220px),
                    0 0;
            }
        }

        /* The panel's passage, RFC 0004's: the effect the dialog chose for each moment and how it
           runs, handed to src/passage.ts as a surface hands its own. Its own, never one inherited
           from a surface round the dialog, which would cut the panel as that surface's; and every
           effect takes the dialog's step whole, rather than in proportion to the time the review
           judged a card's at, since a dialog is opened to be used and closed to get back to the
           page, and the reader waits on it both ways. */
        dialog {
            --ui-fx-enter: none;
            --ui-fx-exit: none;
            --ui-fx-fit: whole;
        }

        /* none: the panel there at once as the dialog opens, and gone at once as it closes. The
           scrim keeps the fade it has today. */
        @container ${unsafeCSS(drawn('enter', 'none'))} {
            dialog[open]:not(.closing) {
                transition: none;
            }
        }

        @container ${unsafeCSS(drawn('exit', 'none'))} {
            dialog.closing {
                transition: none;
            }
        }

        /* materialize and erode: the panel put together from pieces appearing where they belong,
           at random, and broken into pieces vanishing where they are — drawn in script, on the
           panel where the top layer holds it, handed each moment's curve. */
        @container ${unsafeCSS(drawn('enter', 'materialize'))} {
            dialog {
                --ui-fx-enter: materialize;
                --ui-fx-enter-time: ${reference('--ui-duration-modal')};
                --ui-fx-enter-curve: ${reference('--ui-easing-enter')};
            }
        }

        @container ${unsafeCSS(drawn('exit', 'erode'))} {
            dialog {
                --ui-fx-exit: erode;
                --ui-fx-exit-time: ${reference('--ui-duration-modal')};
                --ui-fx-exit-curve: ${reference('--ui-easing-exit')};
            }
        }

        /* dissolve: the panel brought out of a fine grain and dissolved into one, on a straight
           clock, as a surface's is, and the scrim going with it on that clock. */
        @container ${unsafeCSS(drawn('enter', 'dissolve'))} {
            dialog {
                --ui-fx-enter: dissolve;
                --ui-fx-enter-time: ${reference('--ui-duration-modal')};
                --ui-fx-enter-curve: linear;
            }
        }

        @container ${unsafeCSS(drawn('exit', 'dissolve'))} {
            dialog {
                --ui-fx-exit: dissolve;
                --ui-fx-exit-time: ${reference('--ui-duration-modal')};
                --ui-fx-exit-curve: linear;
            }

            dialog.closing::backdrop {
                transition-timing-function: linear;
            }
        }

        /* Under a moment drawn in script the panel's own fade stands down, since it would fade
           what the pieces or the grain draw; under an exit the panel stands whole, as the exit
           takes it away itself. The scrim leaves with it, over the time the pieces or the grain
           take, so neither is left on the page without the other. */
        @container ${unsafeCSS(arriving)} {
            dialog[open]:not(.closing) {
                transition: none;
            }
        }

        @container ${unsafeCSS(leaving)} {
            dialog.closing {
                opacity: 1;
                transition: none;
            }

            dialog.closing::backdrop {
                transition-duration: ${reference('--ui-duration-modal')};
            }
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

    /** The properties Lit observes on this element. */
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

    /** The rain this dialog has drawn, by the colour and the density it was drawn at. */
    readonly #rains = new Map<string, Promise<string>>();

    /** Builds the dialog, and routes Esc and every close through `open`, announcing `ui-close`. */
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
            //
            // **That turn is also long enough to open the dialog again**, and an event that
            // lands on an open dialog reports a close that is already over. Followed, it
            // shuts the dialog the page has just reopened, measured; announced, it would
            // tell a host that an open dialog is closed.
            if (this.#dialog.open) {
                return;
            }

            this.open = false;
            this.dispatchEvent(new Event('ui-close', { bubbles: true, composed: true }));
        });
    }

    /** Starts watching the title, so a rewritten one renames the dialog. */
    override connectedCallback(): void {
        super.connectedCallback();

        // The title may be replaced, or its text rewritten in place without any element
        // changing, which is what a host's re-render looks like from here — so
        // characterData matters as much as childList, and both can happen below a wrapper.
        this.#observer.observe(this, { childList: true, characterData: true, subtree: true });
    }

    /** Stops watching the title, and gives the page back if the dialog was open. */
    override disconnectedCallback(): void {
        this.#observer.disconnect();

        // Removing an open dialog takes it out of the top layer and announces nothing, so
        // the page would stay held by a dialog that is no longer anywhere.
        this.#shut();

        // Stryker disable next-line CallExpression: the reading `src/toast.ts` carries at
        // its own, verified again here rather than inherited. In Lit this reaches exactly
        // two things — `__controllers`, and `__childPart.setConnected(false)`, which speaks
        // only to async directives — and this element has neither: nothing registers a
        // reactive controller and the template uses no async directive. So no input
        // distinguishes the call from its absence. It stays because Lit documents the super
        // call as the extension point it reserves for later additions: the day this element
        // grows a controller or an async directive the mutant stops being equivalent, and
        // nothing else would say so.
        super.disconnectedCallback();
    }

    /** Names the dialog after its title, the first time it renders. */
    override firstUpdated(): void {
        this.#label();
    }

    /** Opens or closes the real `<dialog>` when `open` disagrees with it. */
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

    /** The real `<dialog>` this element is a shell around. */
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
        // The entrance a sheet cannot draw, where the dialog's chose one: its pieces or its grain,
        // on the panel the top layer has laid out by now.
        enter(this.#dialog);
        this.#rain();
    }

    /**
     * Lays the rain over the scrim where the dialog's sheet chose it, drawn in the accent the
     * scrim resolves to now.
     *
     * **After the frame the dialog is first drawn in**: a task asked for from that frame's
     * callback, since the drawing holds the page for tens of milliseconds, which the opening
     * should not wait on. The rain comes in while the scrim does. Each colour and density is
     * drawn once a dialog, so only a theme, a scheme or a display changed since an opening draws
     * it again.
     */
    #rain(): void {
        const dialog = this.#dialog;

        if (
            getComputedStyle(dialog).getPropertyValue(`${kinds.animated}backdrop`) !== 'char-rain'
        ) {
            return;
        }

        const colour = getComputedStyle(dialog, '::backdrop').color;
        const key = `${colour} at ${String(devicePixelRatio)}`;

        requestAnimationFrame(() => {
            setTimeout(() => {
                void this.#lay(key, colour);
            }, 0);
        });
    }

    /**
     * Lays the rain drawn for `key` on the dialog for the scrim to read, drawing it in `colour`
     * first where this dialog has not.
     */
    async #lay(key: string, colour: string): Promise<void> {
        const layers = this.#rains.get(key) ?? rain(colour);

        this.#rains.set(key, layers);
        this.#dialog.style.setProperty(`${kinds.animated}rain`, await layers);
    }

    /** Runs the exit, and closes once it has finished. */
    async #exit(): Promise<void> {
        const dialog = this.#dialog;

        dialog.classList.add(closing);
        // The exit a sheet cannot draw, on clocks of the panel's own, which the wait below waits
        // out with the rest.
        exit(dialog);

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

        // Reopened while the exit was running. The dialog never left the top layer, so there
        // is nothing to close: taking the class back off brings the panel back where the sheet
        // draws it, and the entrance runs again where a script draws it, which also gives back a
        // panel an exit drawn so has left in pieces.
        if (this.open) {
            enter(dialog);
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
        // The panel as it was, whatever passage was drawn on it, for the next opening.
        mend(this.#dialog);
    }

    /**
     * Names the dialog after its own title.
     *
     * **A copy of the text rather than a reference to the element, and that is forced.**
     * APG names a modal with `aria-labelledby` pointing at its heading, and an IDREF does
     * not cross a shadow boundary — so a `<dialog>` in this shadow root cannot point at a
     * heading in the host's tree. Every other component answers that by rendering both ends
     * itself; a dialog cannot, because the element that has to reach the top layer is the
     * one this component renders. What does cross is a string, so the name is copied and
     * the observer above keeps the copy honest.
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

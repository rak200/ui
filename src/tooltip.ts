import { LitElement, css, html, unsafeCSS, type TemplateResult } from 'lit';
import { query } from './motion.js';
import { arrived, left } from './next.js';
import { reference } from './reference.js';
import { halt, ready, write } from './typing.js';

/** Distinguishes one tooltip's generated id from another's. */
let sequence = 0;

/** Which side of its trigger the tip landed on, read from where the platform put it. */
const side = 'data-side';

/** The query each of the tip's effects is drawn under: the consumer's choice, else a taste. */
const drawn = query('tooltip');

/**
 * What makes a trigger's shadow root the thing the browser actually focuses.
 *
 * A tab stop the host wrote counts with the natives: what decides this is that focus lands
 * inside the boundary, not how the element was made able to take it.
 */
const focusable = 'a[href], button, input, select, textarea, [tabindex]';

/**
 * What a tooltip written inside one describes: the button or the link it lies in, which is what
 * the reader points at and focuses. A menu's item is one, which the menu takes as an item only
 * where it is the menu's own child, so a tooltip cannot be written round it.
 */
const holders = 'button, a[href]';

/**
 * One trigger, one tip, and what wiring the pair set up: the observer that keeps the copy fresh
 * between them, and what a tip inside its trigger is kept from.
 *
 * Named so the pair can be **compared as one thing**. What a deferred handoff has to ask
 * is *am I still the current wiring?*, and asking it of the object rather than of a field
 * of the object is both the honest question and the one with no absent case: a cleared
 * wiring is unequal to this one, where reading a field of it has to be guarded first.
 */
interface Wiring {
    readonly trigger: HTMLElement;
    readonly tip: HTMLElement;
    readonly observer: MutationObserver;
    /**
     * Whether the tip lies inside its trigger, as in a tooltip written inside a button or a
     * link, where its text is kept out of the trigger's name and a click on it from the trigger.
     */
    readonly within: boolean;
    /** The tip's `aria-hidden` before it was wired, which letting go of it puts back. */
    readonly hidden: string | null;
    /** What the wiring listens to on the tip, which letting go of it ends. */
    readonly listening: AbortController;
}

/**
 * The ids already describing a trigger, as a list rather than the attribute's string.
 *
 * Both halves of the wiring read it — one to add an id, the other to take the same one
 * back out — and they have to agree about what the string means. The empty filter is what
 * makes an absent attribute an empty list: `''.split(' ')` is `['']`, and a list with one
 * empty entry joins back with a leading space.
 */
function describing(trigger: HTMLElement): string[] {
    return (trigger.getAttribute('aria-describedby') ?? '').split(' ').filter((id) => id !== '');
}

/**
 * Keeps a click on a tip from the trigger it lies inside. The tip is no part of the button or the
 * link it describes, though it lies in it, so a click on it chooses nothing and follows nothing:
 * cancelled, no link is followed and no form sent, and stopped, nothing listening on the trigger
 * or round it hears it — a menu, which a click on its item closes.
 */
function contain(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
}

/**
 * Supplementary text on hover and on keyboard focus.
 *
 * **Everything is slotted**, for a measured reason: an IDREF does not cross a shadow
 * boundary, so a tip rendered in here could not be the target of the trigger's
 * `aria-describedby`. The trigger is the child with no `slot`; the tip is `slot="tip"`.
 *
 * ## Inside a button or a link
 *
 * **Written inside one, round its label, a tooltip describes the button or the link**, whatever
 * it holds itself: that is what the reader points at and focuses. It is the composition for a
 * trigger whose place is fixed — a menu's item, which the menu takes as an item only where it is
 * the menu's own child. The tip then lies inside its trigger, which costs two things a tip beside
 * it does not: its text would join the trigger's name while it shows, read out after the
 * trigger's own words — measured, in all three engines — and a click on it would click the
 * trigger. So the tip is hidden from the name, where an id still reaches it as the description,
 * and a click on it is kept from the trigger.
 *
 * ## What the platform does, and what is left
 *
 * The tip is a **popover**, which buys the two things a hand-rolled overlay gets wrong:
 * it is promoted to the top layer, so it escapes `overflow: hidden` and every stacking
 * context above it — measured — and it needs no `z-index`, which is why the second overlay
 * in this package brings no layering category either.
 *
 * `popover="manual"` rather than `auto`, and the difference is the point: an `auto`
 * popover light-dismisses, and dismissing one closes the others — so a tooltip appearing
 * over an open menu would close the menu. What `manual` costs is Escape, which it does not
 * handle: measured, a manual popover stays open on Escape. So this element wires it, which
 * WCAG 2.2's **1.4.13 Content on Hover or Focus** requires anyway.
 *
 * ## Where the tip lands
 *
 * **The platform places it**, by CSS anchor positioning: above its trigger and centred on it,
 * below where there is no room above, pulled inside the viewport at either edge, and kept against
 * its trigger through every scroll with no script. #300 measured the CSS putting the tip where
 * thirty lines of arithmetic used to, in all three engines, and the floor rose to meet it.
 *
 * **The tip is shown from its trigger**, `showPopover({ source })`, which makes the trigger its
 * anchor with no name. A name this sheet gave the trigger reached only a child it wraps, never a
 * button it lies inside, and an `anchor-name` of the host's on the trigger replaced it.
 *
 * **Two things stay script.** The CSS writes nowhere which side it took, which `data-side` hands
 * a host who draws an arrow and the tip's motion reads, so the side is read off the two boxes as
 * the tip shows, and again on every scroll and resize. And where the tip's direction is not the
 * page's, Firefox mirrors a centred tip off the screen — Mozilla 2019601, in every form #300's
 * follow-up measured — so the tip is marked an island as it shows, and the sheet hangs it from
 * its trigger's leading edge there.
 *
 * A positioning dependency was the other option the issue named. It solves scroll containers,
 * virtual anchors and continuous auto-update, none of which a tooltip against a real element
 * needs — and it would be this package's second runtime dependency, where RFC 0016's adoption
 * was a *behaviour* library and not a layout one.
 *
 * @example
 * ```html
 * <ui-tooltip>
 *   <button type="button">Save</button>
 *   <span slot="tip">Saves without closing the dialog.</span>
 * </ui-tooltip>
 * ```
 */
export class UiTooltip extends LitElement {
    /** The styles its shadow root adopts. */
    static override readonly styles = css`
        /* No box of its own: a wrapper that laid something out would move the trigger it
           wraps, and every call site would have to undo it. */
        :host {
            display: contents;
        }

        /* The tip is the host's own element, reached through ::slotted — the shape every
           component in this kit has. position: fixed is what the popover already is;
           it is restated because the anchor positioning below places the tip against the
           viewport, and a reader of those rules should not have to know which stylesheet
           made it fixed.

           max-content up to a ceiling: a tip is a phrase, and a phrase that wraps at the
           width of whatever it happens to sit near is unreadable. The ceiling is in the
           space token so it scales with everything else a host retunes. */
        slot[name='tip']::slotted(*) {
            position: fixed;
            margin: 0;
            /* Every inset let go, so the anchor is the only thing that places the tip: a popover
               is at inset: 0 from the user agent's sheet, which holds it to the viewport. */
            inset: auto;
            inline-size: max-content;
            max-inline-size: calc(${reference('--ui-space')} * 40);
            padding: calc(${reference('--ui-space')} / 2) ${reference('--ui-space')};
            font-family: ${reference('--ui-font')};
            font-size: ${reference('--ui-text-supporting')};
            /* The pair, never half of it: a surface without the colour chosen against it
               inherits whatever the page set, and the contrast measured for that pair
               stops holding. */
            color: ${reference('--ui-color-text')};
            /* A raised surface, as a card is. */
            background: ${reference('--ui-color-surface-raised')};
            backdrop-filter: ${reference('--ui-backdrop-raised')};
            border: 1px solid ${reference('--ui-color-border-overlay')};
            border-radius: ${reference('--ui-radius')};
            /* On the tip itself, where the card and the menu draw theirs on a layer in the
               accent: the tip is the host's element, so nothing of this component's sits
               around it to carry another colour, and a shadow a theme writes in
               currentColor is lit in the tip's text. */
            box-shadow: ${reference('--ui-elevation-raised')};
        }

        /* Where the tip lands, the platform's own: above its trigger and centred on it, below it
           where there is no room above, and pulled inside the viewport at either edge — placed in
           the task that shows it, and kept against its trigger through every scroll. The anchor
           is the element the tip is shown from, its trigger, so it needs no name. */
        slot[name='tip']::slotted(*) {
            position-anchor: auto;
            position-area: block-start;
            position-try-fallbacks: flip-block;
        }

        /* The gap between the tip and its trigger: a margin on the side the trigger is on, which
           the flip moves to the other side with the tip, so the gap and the side cannot disagree.

           It is deliberately small. WCAG 2.2's 1.4.13 asks that a pointer be able to
           travel onto the tip without it vanishing, and it travels across this gap — the
           tip stays open because it is a DOM child of this element, so entering it never
           leaves the host, but only if the pointer does not leave through the gap on the
           way. */
        slot[name='tip']::slotted(*) {
            margin-block-end: calc(${reference('--ui-space')} / 2);
        }

        /* An island, where the tip's direction is not the page's: it hangs from its trigger's
           leading edge rather than centring over it, turning to the other edge where that runs
           off the screen. Firefox mirrors position-area's inline alignment there and put a centred
           tip off the screen in every form measured — Mozilla 2019601 — where anchored insets are
           not mirrored. */
        :host(:state(island)) slot[name='tip']::slotted(*) {
            position-area: none;
            inset: auto;
            bottom: anchor(top);
            left: anchor(left);
            position-try-fallbacks:
                flip-block,
                flip-inline,
                flip-block flip-inline;
        }

        :host(:state(island)) slot[name='tip']::slotted(:dir(rtl)) {
            left: auto;
            right: anchor(right);
        }

        /* Which side of the tip its trigger is on, as a sign on the block axis, which what moves a
           tip toward its trigger or away reads. The side is read off where the tip landed, after
           its first style, so an entrance comes from the side the tip last landed on — above its
           trigger, where a tip goes first, until it has landed below. */
        slot[name='tip']::slotted(*) {
            --ui-fx-toward: 1;
        }

        slot[name='tip']::slotted([data-side='block-end']) {
            --ui-fx-toward: -1;
        }

        /* RFC 0004's: how a tip comes and goes, each a transition, so a tip the reader leaves
           before it has arrived turns back from where it is, and one pointed at again as it
           leaves comes back from where it got to. Each moves, blurs or fades the tip. Nothing is
           drawn where nothing is chosen, as a tooltip drew nothing before. */

        /* rise: from a quarter rem nearer its trigger, toward where it sits, as it fades in. */
        @container ${unsafeCSS(drawn('enter', 'rise'))} {
            slot[name='tip']::slotted(:popover-open) {
                transition:
                    opacity ${reference('--ui-duration-overlay')} ${reference('--ui-easing-enter')},
                    transform ${reference('--ui-duration-overlay')}
                        ${reference('--ui-easing-enter')};
            }

            @starting-style {
                slot[name='tip']::slotted(:popover-open) {
                    opacity: 0;
                    transform: translateY(calc(var(--ui-fx-toward) * 0.25rem));
                }
            }
        }

        /* refocus: out of focus by half a rem and sharpening over an overlay's step and a
           quarter, there by half the way. */
        @container ${unsafeCSS(drawn('enter', 'refocus'))} {
            slot[name='tip']::slotted(:popover-open) {
                transition:
                    filter calc(${reference('--ui-duration-overlay')} * 1.25)
                        ${reference('--ui-easing-enter')},
                    opacity calc(${reference('--ui-duration-overlay')} * 0.625)
                        ${reference('--ui-easing-enter')};
            }

            @starting-style {
                slot[name='tip']::slotted(:popover-open) {
                    filter: blur(0.5rem);
                    opacity: 0;
                }
            }
        }

        /* Leaving, the tip is held on the page while it goes, its display and its overlay
           transitioned as discrete values, and only where an exit is chosen, so a tip with none
           is gone at once. Chromium alone holds a popover so: Firefox takes it away at once
           while it reports allow-discrete as supported, and WebKit, which holds a plain element
           that way, takes a popover away at once — measured for RFC 0004 — so elsewhere a tip
           is gone at once whatever is chosen. */

        /* sink: back toward its trigger as it fades — the rise, run the other way. */
        @container ${unsafeCSS(drawn('exit', 'sink'))} {
            slot[name='tip']::slotted(:not(:popover-open)) {
                opacity: 0;
                transform: translateY(calc(var(--ui-fx-toward) * 0.25rem));
                transition:
                    opacity ${reference('--ui-duration-overlay')} ${reference('--ui-easing-exit')},
                    transform ${reference('--ui-duration-overlay')} ${reference('--ui-easing-exit')},
                    display ${reference('--ui-duration-overlay')} allow-discrete,
                    overlay ${reference('--ui-duration-overlay')} allow-discrete;
            }
        }

        /* defocus: blurring away by as much as the refocus sharpens from, over as long, and gone
           over its second half. */
        @container ${unsafeCSS(drawn('exit', 'defocus'))} {
            slot[name='tip']::slotted(:not(:popover-open)) {
                filter: blur(0.5rem);
                opacity: 0;
                transition:
                    filter calc(${reference('--ui-duration-overlay')} * 1.25)
                        ${reference('--ui-easing-exit')},
                    opacity calc(${reference('--ui-duration-overlay')} * 0.625)
                        ${reference('--ui-easing-exit')}
                        calc(${reference('--ui-duration-overlay')} * 0.625),
                    display calc(${reference('--ui-duration-overlay')} * 1.25) allow-discrete,
                    overlay calc(${reference('--ui-duration-overlay')} * 1.25) allow-discrete;
            }
        }

        /* The tip's own hand-offs to the typing and to the next tip, never ones inherited from
           a surface round the tooltip, which would type a tip nobody chose to; and a time of
           nothing where the glide is not chosen, so a time is always there to read. */
        slot[name='tip']::slotted(*) {
            --ui-fx-enter: none;
            --ui-fx-next: none;
            --ui-fx-next-time: 0ms;
            --ui-fx-next-curve: linear;
        }

        /* glide: a tip opened as another closes glides over from where the other was, both
           their effects ended first — src/next.ts, over the overlay's step on a move's curve. */
        @container ${unsafeCSS(drawn('next', 'glide'))} {
            slot[name='tip']::slotted(*) {
                --ui-fx-next: glide;
                --ui-fx-next-time: ${reference('--ui-duration-overlay')};
                --ui-fx-next-curve: ${reference('--ui-easing-move')};
            }
        }

        /* typing: the tip's text typed out a character at a time behind a caret of the accent, a
           character every tenth of an overlay's step — drawn in script, src/typing.ts, through
           highlights, so handed over only where the engine draws them: elsewhere the tip shows
           whole, at once. */
        @supports selector(::highlight(ui-untyped)) {
            @container ${unsafeCSS(drawn('enter', 'typing'))} {
                slot[name='tip']::slotted(*) {
                    --ui-fx-enter: typing;
                    --ui-fx-enter-time: ${reference('--ui-duration-overlay')};
                }
            }
        }

        /* glitch: the tip flickering out in bands, side to side, its text split into the danger
           and the info as a button's label splits, each step held until the next, over the
           overlay's step. It moves only along its line, so the box it rests in is the one the
           platform placed. */
        @container ${unsafeCSS(drawn('exit', 'glitch'))} {
            slot[name='tip']::slotted(:not(:popover-open)) {
                animation: ui-tip-glitch-out ${reference('--ui-duration-overlay')} steps(1, end)
                    forwards;
                transition:
                    display ${reference('--ui-duration-overlay')} allow-discrete,
                    overlay ${reference('--ui-duration-overlay')} allow-discrete;
            }
        }

        @keyframes ui-tip-glitch-out {
            0% {
                opacity: 1;
            }

            20% {
                transform: translateX(2px);
                clip-path: inset(20% -3rem 25% -3rem);
                text-shadow:
                    1px 0 ${reference('--ui-color-danger')},
                    -1px 0 ${reference('--ui-color-info')};
            }

            40% {
                opacity: 0.5;
                transform: translateX(-3px);
                clip-path: inset(40% -3rem 0 -3rem);
                text-shadow:
                    -2px 0 ${reference('--ui-color-danger')},
                    2px 0 ${reference('--ui-color-info')};
            }

            60% {
                opacity: 1;
                transform: translateX(3px);
                clip-path: inset(0 -3rem 55% -3rem);
                text-shadow:
                    2px 0 ${reference('--ui-color-danger')},
                    -2px 0 ${reference('--ui-color-info')};
            }

            80%,
            100% {
                opacity: 0;
                transform: translateX(3px);
                clip-path: inset(0 -3rem 55% -3rem);
            }
        }
    `;

    /** Whether the tip is currently shown, which decides what the listeners cost. */
    #shown = false;

    /**
     * The pair this element last wired, so a change can be told from a re-notification.
     *
     * Both slots report, and at first assignment both report the same pair — so without
     * this the wiring would run twice and the warning would be said twice for one trigger.
     * It is also what makes the reference removable: an id can only be taken back out of a
     * list the element does not own if the element remembers which id was its own, and
     * which trigger it put there. #189
     */
    #wired: Wiring | undefined;

    /**
     * Whether the reader dismissed the tip and has not left the trigger since.
     *
     * Separate from {@link UiTooltip.#shown}, because hidden and dismissed are not the same
     * state and 1.4.13 only asks about the second. Without it a dismissal survives exactly
     * as long as nothing moves focus — measured on `<ui-menu>`, where Escape closes the menu,
     * the component restores focus to the trigger it rendered, and the tip came back in the
     * same turn as the key that shut it. #169
     */
    #dismissed = false;

    /**
     * What is watching while the tip is open, dropped in one call when it closes.
     *
     * These three are added on show rather than on connection because two of them are
     * per-frame: a page holding fifty tooltips would run fifty no-op scroll handlers for
     * every frame of every scroll, and at most one tooltip is ever open.
     *
     * Built here rather than on the first show so it is never absent: a close that has to
     * ask whether the controller exists is a branch no test can reach, because nothing
     * closes what was never opened.
     */
    #watching = new AbortController();

    /** Re-places the tip under anything that moves the trigger while it is open. */
    readonly #reflow = (): void => {
        this.#side();
    };

    /**
     * Dismisses on Escape, which is 1.4.13's first requirement and `manual`'s one gap.
     *
     * On the document rather than on this element: a tip shown by the pointer leaves the
     * focus wherever it was, so a key listener bound here would never hear the key that is
     * supposed to dismiss it.
     *
     * **The key is claimed when it dismissed something, and left alone when it did not.**
     * One Escape reaches every layer at once: unclaimed, it shut the tip and closed the
     * `<ui-dialog>` around it in the same press — and 1.4.13 wants a dismissal that does
     * *not* move focus, where closing a modal returns focus to whatever opened it. Claiming
     * it gives the reader the convention they already have, the topmost thing closing
     * first, and the next press reaching the next layer down. **Nothing tests whether there
     * was something to dismiss**, because this listener only exists while there is: it is
     * added on show and dropped on hide, so an Escape with no tip open never reaches here.
     *
     * `preventDefault()` and nothing else: the close request is the key's default action,
     * so cancelling it here is enough — measured, against both a modal `<dialog>` and a
     * `popover="auto"`, from this listener's own bubble phase. `stopPropagation()` would
     * add nothing at the document and would take the key from anything else listening.
     */
    readonly #dismiss = (event: KeyboardEvent): void => {
        if (event.key !== 'Escape') {
            return;
        }

        event.preventDefault();

        this.#dismissed = true;
        this.#hide();
    };

    /** The tooltip's states: `island`, while its tip's direction is not the page's. */
    readonly #internals = this.attachInternals();

    /**
     * Takes every listener off at once, and the reason is not brevity.
     *
     * Removing them one by one needs the event name repeated at both ends, and half of
     * those repetitions cannot be checked: a leaked `pointerenter` is caught the moment it
     * fires, because it opens a popover that is no longer in a document and that throws —
     * but a leaked `pointerleave` reaches `#hide`, which returns at its own guard, and
     * nothing anywhere can tell it happened. One `abort()` is one thing to get right, and
     * a leak of it is observable through the half that is.
     */
    #listeners = new AbortController();

    /** Listens for the pointer and the focus, and wires the trigger to the tip. */
    override connectedCallback(): void {
        super.connectedCallback();

        // A fresh one per connection: an aborted signal stays aborted, so a tooltip a
        // framework moves in the tree would come back deaf.
        this.#listeners = new AbortController();

        // One options object for the four, and that is the same argument as the controller
        // itself: written per call, each `{ signal }` is its own thing to get right, and
        // half of them cannot be checked — a leaked `pointerleave` reaches `#hide`, which
        // returns at its own guard, and nothing can tell. Shared, all four ride on the one
        // that does report: a leaked `pointerenter` opens a popover that is no longer in a
        // document, which throws.
        const watched = { signal: this.#listeners.signal };

        // Inside a button or a link, that is what the reader points at and focuses, anywhere on
        // it and not only on the label this element holds; and it holds the tip too, so the
        // pointer travelling onto the tip has not left it. Round a trigger, this holds both.
        const region = this.closest<HTMLElement>(holders) ?? this;

        region.addEventListener('pointerenter', this.#onPointer, watched);
        region.addEventListener('pointerleave', this.#onLeave, watched);
        region.addEventListener('focusin', this.#onFocus, watched);
        region.addEventListener('focusout', this.#onLeave, watched);

        // A tooltip a framework moved in the tree comes back wired. `disconnectedCallback`
        // withdraws the description, and nothing fires a `slotchange` on reconnection to
        // put it back — the same argument the fresh `AbortController` above is here for.
        this.#associate();
    }

    /** Hides the tip, drops its listeners, and stops describing the trigger. */
    override disconnectedCallback(): void {
        // Removed while shown, the tip takes the window listeners with it. A tooltip that
        // a framework unmounted mid-hover would otherwise keep re-placing an element that
        // is no longer in a document.
        this.#hide();
        this.#listeners.abort();

        // The trigger is this element's own child, so it usually leaves with it and has
        // nobody left to describe. What this is for is the host that moves the trigger out
        // first, and the framework that unmounts this element alone.
        this.#unwire();

        super.disconnectedCallback();
    }

    /** The trigger, from the default slot, and the tip, from `tip`. */
    override render(): TemplateResult {
        return html`
            <slot @slotchange=${this.#associate}></slot>
            <slot name="tip" @slotchange=${this.#associate}></slot>
        `;
    }

    /**
     * The element the tip is about: the button or the link this element is written inside, or
     * else the one child carrying no `slot` attribute.
     */
    #trigger(): HTMLElement | undefined {
        const found = this.closest(holders) ?? this.querySelector(':scope > :not([slot])');

        return found instanceof HTMLElement ? found : undefined;
    }

    /** The tip itself, which is the host's own element and stays in their tree. */
    #tip(): HTMLElement | undefined {
        const found = this.querySelector(":scope > [slot='tip']");

        return found instanceof HTMLElement ? found : undefined;
    }

    /**
     * Makes the tip a popover, names it, and points the trigger at it.
     *
     * **Both slots report**, because a framework re-render replaces an element rather than
     * mutating it and either end can be the one replaced — a tip that is only wired the
     * first time stops being announced at a moment nothing reports, and a trigger that is
     * only described the first time is a *new* trigger nothing describes at all. The
     * second half was measured: replacing the trigger fires the default slot, which this
     * element did not listen to. #189
     *
     * **The previous wiring is undone before the next one is made**, and that is the whole
     * of the removal: the guard below returns when there is nothing to wire, so before
     * {@link UiTooltip.#unwire} existed the one code path that knew the tip was gone was
     * the path that did nothing about it — leaving the trigger pointing at an id that
     * resolves to nothing, and leaving this element believing it owned an entry a later
     * render would append beside.
     *
     * A `role` or an `id` the host wrote is never overwritten. `aria-describedby` is
     * **added to** rather than replaced: the trigger may already be described by something
     * this element cannot see, and a description that silently replaced another is the
     * failure nobody sees.
     */
    readonly #associate = (): void => {
        const trigger = this.#trigger();
        const tip = this.#tip();
        const wired = this.#wired;

        if (wired !== undefined && wired.trigger === trigger && wired.tip === tip) {
            return;
        }

        this.#unwire();

        if (trigger === undefined || tip === undefined) {
            return;
        }

        if (tip.id === '') {
            // Stryker disable next-line UpdateOperator: two tooltips on one page must get
            // different ids, and a decrementing counter delivers that as well as an
            // incrementing one. No input distinguishes them — an equivalent mutant.
            tip.id = `ui-tooltip-${String(++sequence)}`;
        }

        if (!tip.hasAttribute('role')) {
            tip.setAttribute('role', 'tooltip');
        }

        tip.setAttribute('popover', 'manual');

        const described = describing(trigger);

        if (!described.includes(tip.id)) {
            trigger.setAttribute('aria-describedby', [...described, tip.id].join(' '));
        }

        // The sentence crosses to the trigger as a **copy**, so unlike the IDREF beside it
        // it goes stale the moment the host touches the original — and `slotchange` fires
        // when the tip element is *replaced* and for **neither** in-place edit, measured:
        // not text rewritten through `textContent`, not a node appended to it. The three
        // options are one decision: an edit can land on a descendant as readily as on the
        // tip itself.
        //
        // It rides in the wiring rather than beside it so there is one thing to be absent
        // rather than two — and the pair is what it speaks for, so a disconnected observer
        // and a cleared pair cannot come apart. One per tooltip, over this element's own
        // slotted child: the bridge this proposal rejected owed one observer **per
        // control**, over a node each control had to resolve an id in first. RFC 0006
        const observer = new MutationObserver((): void => {
            this.#hand(wiring);
        });

        // A tip inside its trigger, as in a tooltip written inside a button or a link, would join
        // the trigger's name while it shows and pass a click on it to the trigger. Hidden, it is
        // still the description: an id reaches a hidden element as it reaches a shown one.
        const within = trigger.contains(tip);
        const wiring: Wiring = {
            trigger,
            tip,
            observer,
            within,
            hidden: tip.ariaHidden,
            listening: new AbortController(),
        };

        if (within) {
            tip.ariaHidden = 'true';
            tip.addEventListener('click', contain, { signal: wiring.listening.signal });
        }

        observer.observe(tip, { characterData: true, childList: true, subtree: true });

        this.#wired = wiring;

        this.#offer(wiring);
    };

    /**
     * Hands the sentence over, once the trigger is in a state where refusal means refusal.
     *
     * A dispatch at an element that has not upgraded is heard by nobody and comes back
     * **uncancelled** — which is exactly what a trigger that accepts no text returns. The
     * two are indistinguishable, so warning on that answer would warn at an element that
     * would have accepted. Measured, and measured again for the recovery: the upgrade fires
     * no `slotchange`, no hook and no event at all, so this promise is the only signal there
     * is and waiting on it is a requirement rather than a refinement. RFC 0006
     *
     * **What is waited for is the trigger's upgrade, not its definition.** Markup written
     * into the page — through `innerHTML` on an element in it, `insertAdjacentHTML`, a
     * template's content cloned, `DOMParser` — upgrades as it connects, in tree order, so
     * this element connects before its trigger has upgraded, with the definition already
     * there. Handed over then, the sentence reached nobody and no warning was said, in the
     * three engines (#411). An element that has not upgraded is still a plain `HTMLElement`,
     * with its definition or without it, and `whenDefined` resolves at once for a definition
     * that is there, after the upgrades the insertion queued, so one wait takes in both. The
     * prototype is read rather than `:defined` matched: a selector is a string, and an
     * emptied one throws, here inside `connectedCallback`, where a throw reaches no test.
     *
     * **The hyphen test is load-bearing rather than a shortcut**: `whenDefined` refuses a
     * name that could never be a custom element, and an `<abbr>` or a `<b>` is a plain
     * `HTMLElement` too, so the name has to be answered before the registry is asked.
     *
     * **It refuses by rejecting rather than by throwing**, which is the part that decides
     * where the failure lands. The promise is voided here, so a rejection surfaces as an
     * `unhandledrejection` on the window and through no other channel — not as an
     * exception this call could catch, and not in anything watching for `error`. Measured,
     * as a mutant on the hyphen that produced 55 errors in `tests/tooltip.test.ts` and
     * failed no test that was only listening to the first channel.
     */
    #offer(wiring: Wiring): void {
        const name = wiring.trigger.localName;

        if (
            name.includes('-') &&
            Reflect.getPrototypeOf(wiring.trigger) === HTMLElement.prototype
        ) {
            void customElements.whenDefined(name).then((): void => {
                // The wiring can have moved on while the trigger was upgrading, and this
                // element only ever speaks for the one it is holding now.
                if (this.#wired === wiring) {
                    this.#hand(wiring);
                }
            });

            return;
        }

        this.#hand(wiring);
    }

    /**
     * The dispatch itself, carrying whatever the tip says right now.
     *
     * **The most recent dispatch wins and a trigger never accumulates**: a tooltip has one
     * tip, so this is a value being written rather than an item being added — and
     * accumulation would owe a withdrawal per sentence, which this element has nothing to
     * identify one by.
     *
     * **The advertisement is the return value.** A control that takes the text calls
     * `preventDefault()`, so `dispatchEvent` comes back `false` exactly when someone
     * accepted — which is why the warning below needs no roster of elements, and this
     * proposal already recorded that a roster ages exactly like the sentence it replaced.
     */
    #hand(wiring: Wiring): void {
        // The markup around the sentence is not the sentence: a tip written across lines
        // carries its indentation into `textContent`, and what the trigger renders is
        // announced rather than laid out.
        if (!this.#say(wiring.trigger, wiring.tip.textContent.trim())) {
            this.#complain(wiring.trigger);
        }
    }

    /**
     * The dispatch, which is the entire protocol.
     *
     * **One site for both directions**, the sentence and its withdrawal, and that is not
     * only tidiness: the flags are the contract, and written twice only one copy would be
     * read back. `cancelable` is what lets a control answer at all — without it
     * `preventDefault()` does nothing and every trigger reads as refusing — so it belongs
     * where the answer is consumed rather than beside a call that ignores it.
     *
     * @returns whether a control took it, which is the whole of the advertisement: the
     *   acknowledgement is `preventDefault()`, so no roster of elements is needed — and
     *   this proposal already recorded that a roster ages exactly like the sentence it
     *   replaced. RFC 0006
     */
    #say(trigger: HTMLElement, sentence: string): boolean {
        return !trigger.dispatchEvent(
            new CustomEvent('ui-describe', { detail: sentence, cancelable: true }),
        );
    }

    /**
     * Takes back the one id this element wrote, and leaves every other one alone.
     *
     * The attribute is removed rather than left empty when nothing else was in it, because
     * an empty `aria-describedby` is not the same shape as an absent one — `src/input.ts`
     * keeps a whole helper for that distinction — and a trigger this element found bare
     * should be bare again when it lets go. So is a tip it hid: it takes clicks again, and
     * its `aria-hidden` is what it was.
     */
    #unwire(): void {
        const wired = this.#wired;

        if (wired === undefined) {
            return;
        }

        this.#wired = undefined;
        wired.observer.disconnect();
        wired.listening.abort();
        wired.tip.ariaHidden = wired.hidden;

        // The withdrawal, on the same event rather than a second name: `detail` is a
        // string whose empty value means *absent*, which is the shape `help` and `error`
        // already have everywhere else in this package. Without it a control keeps
        // pointing at text describing a tip the reader can no longer summon, which is
        // worse than never having had it because it reads as current.
        //
        // The answer is not read here, and that is deliberate: a trigger that refuses to
        // let go is not a trigger the description failed to reach, so {@link
        // UiTooltip.#complain} has nothing to say about it. RFC 0006
        this.#say(wired.trigger, '');

        const remaining = describing(wired.trigger).filter((id) => id !== wired.tip.id);

        if (remaining.length === 0) {
            wired.trigger.removeAttribute('aria-describedby');

            return;
        }

        wired.trigger.setAttribute('aria-describedby', remaining.join(' '));
    }

    /**
     * Says out loud that the description will not arrive.
     *
     * A trigger that focuses a control inside its own shadow root strands the reference:
     * an IDREF resolves within one tree scope, and the tip is in the host's tree while the
     * element a screen reader reads is not. Nothing about the page looks wrong — the tip
     * shows and places itself correctly — which is the whole reason this is said rather
     * than left to be found later. #156
     *
     * **Every element in this package now takes the handoff**, so what is left for this to
     * reach is a trigger someone else wrote — and that is the shape it was always built
     * for: the answer is the dispatch's return value rather than a roster of tags, which
     * is why the rollout closing changed nothing here.
     *
     * **The condition is the focusable descendant, not the shadow root.** A component
     * whose shadow content is decoration is named and described on the host itself, and is
     * correct as it stands.
     */
    #complain(trigger: HTMLElement): void {
        const inside = trigger.shadowRoot?.querySelector(focusable) ?? null;

        if (inside === null) {
            return;
        }

        console.warn(
            `<ui-tooltip> described <${trigger.localName}>, and the description will not ` +
                `arrive: it focuses a control inside its own shadow root, which an id in ` +
                `your tree cannot reach. Where the text has to be announced, the trigger has ` +
                `to be a control you wrote — a native <button>, <a href> or form control.`,
        );
    }

    /**
     * Shows on the pointer, except the pointer a touch screen reports.
     *
     * There is no hover on a touch screen, so a tap fires `pointerenter` and then focus —
     * and showing on both means the tip arrives, is dismissed by the tap that follows, and
     * arrives again. Focus is the one that survives, so this defers to it.
     */
    readonly #onPointer = (event: PointerEvent): void => {
        if (event.pointerType !== 'touch') {
            this.#show();
        }
    };

    readonly #onFocus = (): void => {
        this.#show();
    };

    /**
     * Closes when the reader really leaves, and only then.
     *
     * **A `focusout` here does not mean focus left.** It also fires when focus moves between
     * two nodes inside this element that retarget differently — `<ui-menu>` opening its own
     * slotted items is the case in this package — and treating that as a departure closed
     * and reopened the tip on one keystroke. `relatedTarget` is where focus went, so a node
     * this element still contains means nothing left. A `pointerleave` never fires with the
     * pointer still inside, so the same guard is simply true there.
     *
     * A departure is also what clears the dismissal: 1.4.13 asks that dismissed content stay
     * dismissed until the trigger is left, not until the next event of any kind.
     */
    readonly #onLeave = (event: FocusEvent | PointerEvent): void => {
        if (this.#holds(event.relatedTarget)) {
            return;
        }

        this.#dismissed = false;
        this.#hide();
    };

    /** Whether a node focus or the pointer moved to is still inside this element. */
    #holds(node: EventTarget | null): boolean {
        return node instanceof Node && this.contains(node);
    }

    /**
     * Opens the tip, shown from its trigger, and starts watching whatever can move the trigger.
     * Only a tip that was wired, which is a tip with a trigger: one with none was never made a
     * popover, so showing it would throw.
     */
    #show(): void {
        const wired = this.#wired;

        if (wired === undefined || this.#shown || this.#dismissed) {
            return;
        }

        const { trigger, tip } = wired;

        this.#shown = true;
        // Its text hidden before it is first drawn, where the typing is chosen, and typed out
        // once it is placed, at the width it will be read at.
        ready(tip);
        this.#island(tip);
        // The element it is shown from is its anchor, which the sheet places it against.
        tip.showPopover({ source: trigger });
        this.#side();
        write(tip);
        // Over from where the tip that closed just before it was, where it is the next.
        arrived(tip);

        this.#watching = new AbortController();

        // Shared for the same reason the four above are, and it pays off in the same
        // direction: a leaked `keydown` is invisible — every later Escape returns at
        // `#hide`'s guard — while a leaked `resize` re-places a tip that is not on screen,
        // which a test reads straight off the written inset.
        const watched = { signal: this.#watching.signal };

        // Capturing, because the thing that scrolls is rarely the window: a scroll inside
        // any ancestor moves the trigger and no event reaches the window from it.
        //
        // Not `passive`, and its absence is deliberate rather than an omission: `scroll` is
        // not cancelable, so the flag changes nothing a test could observe — and an option
        // no input can distinguish is one the mutation floor has to be told to ignore. The
        // cheaper answer is not to write it.
        window.addEventListener('scroll', this.#reflow, { capture: true, ...watched });
        window.addEventListener('resize', this.#reflow, watched);
        document.addEventListener('keydown', this.#dismiss, watched);
    }

    /** Closes the tip and stops watching. */
    #hide(): void {
        if (!this.#shown) {
            return;
        }

        this.#shown = false;

        const tip = this.#tip();

        if (tip !== undefined) {
            // Where it is drawn as it starts to go, for a tip opened just after to glide from.
            left(tip);
            tip.hidePopover();
            // The typing stopped where it got to, for the exit to take away.
            halt(tip);
        }

        this.#watching.abort();
    }

    /**
     * Marks the tooltip an island while its tip's direction is not the page's, for the sheet to
     * place the tip by its trigger's edges there: read as the tip shows, before it is first drawn.
     */
    #island(tip: HTMLElement): void {
        if (
            getComputedStyle(tip).direction === getComputedStyle(document.documentElement).direction
        ) {
            this.#internals.states.delete('island');
        } else {
            this.#internals.states.add('island');
        }
    }

    /**
     * Writes which side of its trigger the tip landed on, read off where the platform put it: above
     * or below by the two middles, which none of the tip's effects moves across.
     */
    #side(): void {
        const trigger = this.#trigger();
        const tip = this.#tip();

        if (trigger === undefined || tip === undefined) {
            return;
        }

        const anchor = trigger.getBoundingClientRect();
        const box = tip.getBoundingClientRect();

        tip.setAttribute(
            side,
            // Stryker disable next-line EqualityOperator: equivalent — two middles level are a tip
            // laid over its trigger's middle, which the platform never places it at.
            box.top + box.height / 2 < anchor.top + anchor.height / 2 ? 'block-start' : 'block-end',
        );
    }
}

// Stryker disable next-line StringLiteral: the registration runs once, at import, inside
// the warm process Stryker switches mutants in — so by the time a mutant on this line is
// active the element is already defined under the original name, and no test can observe
// the change. Outside the runner's reach, not an equivalent mutant.
customElements.define('ui-tooltip', UiTooltip);

declare global {
    interface HTMLElementTagNameMap {
        'ui-tooltip': UiTooltip;
    }
}

import { LitElement, css, html, type TemplateResult } from 'lit';
import { place } from './placement.js';
import { reference } from './reference.js';

/** Distinguishes one tooltip's generated id from another's. */
let sequence = 0;

/** How far the tip sits from the trigger, and which way the script placed it. */
const side = 'data-side';

/**
 * What makes a trigger's shadow root the thing the browser actually focuses.
 *
 * A tab stop the host wrote counts with the natives: what decides this is that focus lands
 * inside the boundary, not how the element was made able to take it.
 */
const focusable = 'a[href], button, input, select, textarea, [tabindex]';

/**
 * The ids already describing a trigger, as a list rather than the attribute's string.
 *
 * Both halves of the wiring read it — one to add an id, the other to take the same one
 * back out — and they have to agree about what the string means. The empty filter is what
 * makes an absent attribute an empty list: `''.split(' ')` is `['']`, and a list with one
 * empty entry joins back with a leading space.
 */
/**
 * One trigger, one tip, and the observer that keeps the copy fresh between them.
 *
 * Named so the three can be **compared as one thing**. What a deferred handoff has to ask
 * is *am I still the current wiring?*, and asking it of the object rather than of a field
 * of the object is both the honest question and the one with no absent case: a cleared
 * wiring is unequal to this one, where reading a field of it has to be guarded first.
 */
interface Wiring {
    readonly trigger: HTMLElement;
    readonly tip: HTMLElement;
    readonly observer: MutationObserver;
}

function describing(trigger: HTMLElement): string[] {
    return (trigger.getAttribute('aria-describedby') ?? '').split(' ').filter((id) => id !== '');
}

/**
 * Supplementary text on hover and on keyboard focus.
 *
 * **Everything is slotted**, for a measured reason: an IDREF does not cross a shadow
 * boundary, so a tip rendered in here could not be the target of the trigger's
 * `aria-describedby`. The trigger is the child with no `slot`; the tip is `slot="tip"`.
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
 * ## Why the placement is written here
 *
 * The issue asked whether a clipping tooltip is solved with CSS anchor positioning or with
 * a dependency. Measured in this engine, anchor positioning is **entirely present** —
 * `anchor-name`, `position-anchor`, `position-area` and `position-try-fallbacks` all
 * parse, and an anchored popover really is placed against its anchor rather than merely
 * accepting the rule. It is still not adopted, and the reason is the one `docs/select.md`
 * gives about `appearance: base-select`: a feature one engine has makes a kit look like
 * two kits.
 *
 * **Here that is not a cosmetic difference but a broken component.** Measured: a popover
 * whose anchor rules are ignored does not fall back to somewhere near the trigger — it is
 * `position: fixed` at `inset: 0`, which is the corner of the screen. And the flip at a
 * viewport edge is `position-try-fallbacks`, so an engine without it needs the script
 * anyway. Adopting the CSS would mean writing the placement *and* a second code path for
 * it, which is two answers to one problem.
 *
 * A positioning dependency was the other option the issue named. It solves scroll
 * containers, virtual anchors and continuous auto-update, none of which a tooltip against
 * a real element needs — and it would be this package's second runtime dependency, where
 * RFC 0016's adoption was a *behaviour* library and not a layout one.
 *
 * So the placement is thirty lines of arithmetic, measured at the edges by a suite that
 * runs in a real browser. When anchor positioning is available broadly it replaces them and
 * the tests stay: they assert where the tip lands, not who put it there.
 *
 * **The arithmetic itself is one module over**, in `src/placement.ts`. It was written here
 * first and moved when `<ui-menu>` needed the same thing pointing the other way — which is
 * what issue #23 asked for in as many words: two answers to one problem is one too many.
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
    static override readonly styles = css`
        /* No box of its own: a wrapper that laid something out would move the trigger it
           wraps, and every call site would have to undo it. */
        :host {
            display: contents;
        }

        /* The tip is the host's own element, reached through ::slotted — the shape every
           component in this kit has. position: fixed is what the popover already is;
           it is restated because the script writes inset-block-start and
           inset-inline-start against the viewport, and a reader of those two lines
           should not have to know which stylesheet made them mean that.

           max-content up to a ceiling: a tip is a phrase, and a phrase that wraps at the
           width of whatever it happens to sit near is unreadable. The ceiling is in the
           space token so it scales with everything else a host retunes. */
        slot[name='tip']::slotted(*) {
            position: fixed;
            margin: 0;
            inline-size: max-content;
            max-inline-size: calc(${reference('--ui-space')} * 40);
            padding: calc(${reference('--ui-space')} / 2) ${reference('--ui-space')};
            font-family: ${reference('--ui-font')};
            font-size: ${reference('--ui-text-supporting')};
            /* The pair, never half of it: a surface without the colour chosen against it
               inherits whatever the page set, and the contrast measured for that pair
               stops holding. */
            color: ${reference('--ui-color-text')};
            background: ${reference('--ui-color-surface')};
            border: 1px solid ${reference('--ui-color-border')};
            border-radius: ${reference('--ui-radius')};
            box-shadow: ${reference('--ui-elevation-raised')};
        }

        /* The gap between the tip and its trigger, in CSS because it is a token and the
           script has no way to resolve one: a custom property reads back as it was
           written, so 0.5rem would arrive at a function that needs pixels.

           It is deliberately small. WCAG 2.2's 1.4.13 asks that a pointer be able to
           travel onto the tip without it vanishing, and it travels across this gap — the
           tip stays open because it is a DOM child of this element, so entering it never
           leaves the host, but only if the pointer does not leave through the gap on the
           way. */
        slot[name='tip']::slotted([data-side='block-start']) {
            translate: 0 calc(${reference('--ui-space')} / -2);
        }

        slot[name='tip']::slotted([data-side='block-end']) {
            translate: 0 calc(${reference('--ui-space')} / 2);
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
        this.#place();
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

        this.addEventListener('pointerenter', this.#onPointer, watched);
        this.addEventListener('pointerleave', this.#onLeave, watched);
        this.addEventListener('focusin', this.#onFocus, watched);
        this.addEventListener('focusout', this.#onLeave, watched);

        // A tooltip a framework moved in the tree comes back wired. `disconnectedCallback`
        // withdraws the description, and nothing fires a `slotchange` on reconnection to
        // put it back — the same argument the fresh `AbortController` above is here for.
        this.#associate();
    }

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

    override render(): TemplateResult {
        return html`
            <slot @slotchange=${this.#associate}></slot>
            <slot name="tip" @slotchange=${this.#associate}></slot>
        `;
    }

    /** The element the tip is about: the one child carrying no `slot` attribute. */
    #trigger(): HTMLElement | undefined {
        const found = this.querySelector(':scope > :not([slot])');

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

        const wiring: Wiring = { trigger, tip, observer };

        observer.observe(tip, { characterData: true, childList: true, subtree: true });

        this.#wired = wiring;

        this.#offer(wiring);
    };

    /**
     * Hands the sentence over, once the trigger is in a state where refusal means refusal.
     *
     * A dispatch at an element whose definition has not arrived is heard by nobody and
     * comes back **uncancelled** — which is exactly what a trigger that accepts no text
     * returns. The two are indistinguishable, so warning on that answer would warn at an
     * element that would have accepted. Measured, and measured again for the recovery:
     * the upgrade fires no `slotchange`, no hook and no event at all, so this promise is
     * the only signal there is and waiting on it is a requirement rather than a
     * refinement. RFC 0006
     *
     * **The hyphen test is load-bearing rather than a shortcut**: `whenDefined` refuses a
     * name that could never be a custom element, so `<button>` has to be answered before
     * the registry is asked about it.
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

        if (name.includes('-') && customElements.get(name) === undefined) {
            void customElements.whenDefined(name).then((): void => {
                // The wiring can have moved on while the definition was travelling, and
                // this element only ever speaks for the one it is holding now.
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
     * should be bare again when it lets go.
     */
    #unwire(): void {
        const wired = this.#wired;

        if (wired === undefined) {
            return;
        }

        this.#wired = undefined;
        wired.observer.disconnect();

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

    /** Opens the tip and starts watching whatever can move its trigger. */
    #show(): void {
        const tip = this.#tip();

        if (tip === undefined || this.#shown || this.#dismissed) {
            return;
        }

        this.#shown = true;
        tip.showPopover();
        this.#place();

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
        this.#tip()?.hidePopover();

        this.#watching.abort();
    }

    /**
     * Puts the tip above its trigger, below it when there is no room, and inside the
     * viewport either way.
     *
     * Read rather than assumed: the tip's own box is measured after it is shown, because
     * its height depends on how its text wrapped at this width in this font — a number
     * this file cannot know and must not guess. What it does with the two boxes is
     * `src/placement.ts`, which `<ui-menu>` reads as well.
     */
    #place(): void {
        const trigger = this.#trigger();
        const tip = this.#tip();

        if (trigger === undefined || tip === undefined) {
            return;
        }

        const root = document.documentElement;
        const placement = place(
            trigger.getBoundingClientRect(),
            tip.getBoundingClientRect(),
            { width: root.clientWidth, height: root.clientHeight },
            'block-start',
            'center',
        );

        tip.setAttribute(side, placement.side);
        tip.style.insetBlockStart = `${String(placement.blockStart)}px`;
        tip.style.insetInlineStart = `${String(placement.inlineStart)}px`;
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

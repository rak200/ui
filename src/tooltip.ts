import { LitElement, css, html, type TemplateResult } from 'lit';
import { reference } from './reference.js';

/** Distinguishes one tooltip's generated id from another's. */
let sequence = 0;

/** How far the tip sits from the trigger, and which way the script placed it. */
const side = 'data-side';

/**
 * Supplementary text on hover and on keyboard focus.
 *
 * **Everything is slotted**, the way `<ui-field>` slots everything and for the same
 * measured reason: an IDREF does not cross a shadow boundary, so a tip rendered in here
 * could not be the target of the trigger's `aria-describedby`. The trigger is the child
 * with no `slot`; the tip is `slot="tip"`.
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
 * So the placement is thirty lines here, measured at the edges by a suite that runs in a
 * real browser. When anchor positioning is available broadly it replaces them and the
 * tests stay: they assert where the tip lands, not who put it there.
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
            font-size: 0.875em;
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
     * What is watching while the tip is open, dropped in one call when it closes.
     *
     * These three are added on show rather than on connection because two of them are
     * per-frame: a page holding fifty tooltips would run fifty no-op scroll handlers for
     * every frame of every scroll, and at most one tooltip is ever open.
     *
     * Built here rather than on the first show so it is never absent — the reason
     * `src/field.ts` builds its observer the same way: a close that has to ask whether the
     * controller exists is a branch no test can reach, because nothing closes what was
     * never opened.
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
     */
    readonly #dismiss = (event: KeyboardEvent): void => {
        if (event.key === 'Escape') {
            this.#hide();
        }
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
    }

    override disconnectedCallback(): void {
        // Removed while shown, the tip takes the window listeners with it. A tooltip that
        // a framework unmounted mid-hover would otherwise keep re-placing an element that
        // is no longer in a document.
        this.#hide();
        this.#listeners.abort();

        super.disconnectedCallback();
    }

    override render(): TemplateResult {
        return html`
            <slot></slot>
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
     * On `slotchange` as well as at first render, because a framework re-render replaces
     * the element rather than mutating it — and a tip that is only wired the first time is
     * one that stops being announced at a moment nothing reports.
     *
     * A `role` or an `id` the host wrote is never overwritten, the same courtesy
     * `<ui-field>` and `<ui-switch>` extend. `aria-describedby` is **added to** rather than
     * replaced: the trigger may already be described by a field's help text, and a
     * description that silently replaced another is the failure nobody sees.
     */
    readonly #associate = (): void => {
        const trigger = this.#trigger();
        const tip = this.#tip();

        if (trigger === undefined || tip === undefined) {
            return;
        }

        if (tip.id === '') {
            // Stryker disable next-line UpdateOperator: two tooltips on one page must get
            // different ids, and a decrementing counter delivers that as well as an
            // incrementing one. No input distinguishes them — an equivalent mutant, the
            // same one `src/field.ts` carries beside its own counter.
            tip.id = `ui-tooltip-${String(++sequence)}`;
        }

        if (!tip.hasAttribute('role')) {
            tip.setAttribute('role', 'tooltip');
        }

        tip.setAttribute('popover', 'manual');

        const described = (trigger.getAttribute('aria-describedby') ?? '')
            .split(' ')
            .filter((id) => id !== '');

        if (!described.includes(tip.id)) {
            trigger.setAttribute('aria-describedby', [...described, tip.id].join(' '));
        }
    };

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

    readonly #onLeave = (): void => {
        this.#hide();
    };

    /** Opens the tip and starts watching whatever can move its trigger. */
    #show(): void {
        const tip = this.#tip();

        if (tip === undefined || this.#shown) {
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
     * this file cannot know and must not guess.
     */
    #place(): void {
        const trigger = this.#trigger();
        const tip = this.#tip();

        if (trigger === undefined || tip === undefined) {
            return;
        }

        const anchor = trigger.getBoundingClientRect();
        const box = tip.getBoundingClientRect();
        const above = anchor.top >= box.height;

        tip.setAttribute(side, above ? 'block-start' : 'block-end');
        tip.style.insetBlockStart = `${String(above ? anchor.top - box.height : anchor.bottom)}px`;
        // Centred on the trigger, then pulled back inside the viewport — in that order,
        // because a tip centred on a trigger near the edge is a tip half off the screen.
        // `Math.max` last so a tip wider than the viewport starts at the leading edge
        // rather than at a negative one.
        tip.style.insetInlineStart = `${String(
            Math.max(
                0,
                Math.min(
                    anchor.left + anchor.width / 2 - box.width / 2,
                    document.documentElement.clientWidth - box.width,
                ),
            ),
        )}px`;
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

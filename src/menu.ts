import { LitElement, css, html, type TemplateResult } from 'lit';
import { place } from './placement.js';
import { reference } from './reference.js';

/**
 * The panel's id, and it needs no counter behind it.
 *
 * `src/tooltip.ts` and `src/field.ts` both number theirs, because the elements they point
 * at are the host's and share the document's tree scope. Both ends of this reference are
 * rendered here, so the id is scoped to one shadow root and two menus on a page cannot
 * collide — which is the same property that lets `aria-controls` resolve at all.
 */
const panelId = 'menu';

/** Which way the panel went, for a host that wants to select on it. */
const side = 'data-side';

/**
 * How long a typeahead buffer survives a pause, in milliseconds.
 *
 * Not a token, for the reason the dwell in `src/toast.ts` is not one: every
 * `--ui-duration-*` name collapses under reduced motion, and this is a reader's typing
 * rhythm rather than a movement. Half a second is the interval the platform's own
 * `<select>` typeahead uses.
 */
const rhythm = 500;

/** The namespace an svg has to be created in, which `document.createElement` does not use. */
const svgNS = 'http://www.w3.org/2000/svg';

/** One of the component's slots — named, or the default one when the name is empty. */
function slot(name = ''): HTMLSlotElement {
    return Object.assign(document.createElement('slot'), { name });
}

/**
 * The chevron, drawn here rather than imported from `src/icons/`.
 *
 * A component may not require a host to import a glyph module in order for its own control
 * to have a mark — the argument `src/toast.ts` makes beside its dismiss cross. It is the
 * adopted set's geometry on the adopted set's grid, so it reads as one of them, and it
 * turns over when the menu opens because a caret that never moves says nothing.
 */
function caret(): SVGSVGElement {
    const mark = document.createElementNS(svgNS, 'svg');
    const stroke = document.createElementNS(svgNS, 'path');

    stroke.setAttribute('d', 'm6 9 6 6 6-6');
    mark.setAttribute('viewBox', '0 0 24 24');
    mark.setAttribute('fill', 'none');
    mark.setAttribute('stroke', 'currentColor');
    mark.setAttribute('stroke-linecap', 'round');
    mark.setAttribute('stroke-linejoin', 'round');
    // The name is the trigger's own text; a mark repeating it is a second thing to hear.
    mark.setAttribute('aria-hidden', 'true');
    mark.append(stroke);

    return mark;
}

/**
 * A menu button: one trigger, one menu, and the ARIA relationship between them.
 *
 * **The trigger is rendered here rather than slotted, which is the opposite of every other
 * component in this kit** — and the reason is the one issue #23 gave: the relationship
 * cannot be miswired by a consumer if the consumer never writes it. `aria-haspopup`,
 * `aria-expanded` and `aria-controls` all live on an element this file owns, pointing at
 * another element this file owns, inside one tree scope where an IDREF resolves.
 *
 * **The items stay yours.** They are native `<button>`s and `<a href>`s in your tree, so
 * activation, the accessible name and the disabled state are the platform's; this file
 * writes `role="menuitem"` and a tabindex on them and nothing else. Containment is what
 * crosses the boundary here — a slotted item really is inside the `role="menu"` panel,
 * which `ARCHITECTURE.md` records under `<ui-toaster>` and which a reference could not do.
 *
 * ## What the platform does, and what is left
 *
 * The panel is `popover="auto"`, and that is most of the pattern. Measured, in this
 * component's own arrangement: it takes the top layer, it light-dismisses on a click
 * elsewhere, and **Escape closes it** — which is where `<ui-tooltip>` had to write a key
 * handler, because a `manual` popover does not. An `auto` popover also closes any other
 * open one, which is right for a menu and was exactly wrong for a tip.
 *
 * What the platform does **not** give, measured in the same run:
 *
 * - **Focus does not come back.** With the trigger in this shadow root and the focus on a
 *   slotted item, Escape leaves the focus on `<body>` rather than returning it — the same
 *   arrangement in one flat tree does return it. So the return trip is written here, and
 *   only where the reader did not choose to go elsewhere: a click outside the menu has
 *   already put the focus where it belongs.
 * - **`aria-expanded`, `role` and the tabindex.** An invoker gets no attribute of its own.
 * - **The single tab stop, and the keys inside it.** Every item is a real button, so
 *   without a tabindex the menu is a row of tab stops rather than an APG menu.
 *
 * ## Why this did not bring Zag either
 *
 * RFC 0016 adopted Zag for behaviour, `ROADMAP.md` named this component as the nearest
 * candidate, and Zag ships a menu machine — so this is a refusal rather than an absence of
 * an option, and it is the fourth. `ARCHITECTURE.md` carries it; the short form is that the
 * test asks where the **accessible behaviour** is the expensive part, and the measurement
 * above splits it: the layer, the dismissal, Escape and the ordering against other open
 * layers are all the platform's. What is left is a roving tabindex and four keys, which the
 * `<ui-radio-group>` refusal already named as not the trigger.
 *
 * The second reason is the issue's own: Zag's menu positions through `@zag-js/popper`,
 * which is Floating UI. Adopting it would put a second placement in a package whose first
 * one is measured, documented and shared — and *two answers to one problem is one too
 * many* is the issue's sentence, not this file's.
 *
 * @example
 * ```html
 * <ui-menu>
 *   <span slot="trigger">Actions</span>
 *   <button type="button">Rename</button>
 *   <hr />
 *   <button type="button" disabled>Delete</button>
 * </ui-menu>
 * ```
 */
export class UiMenu extends LitElement {
    static override readonly styles = css`
        :host {
            display: inline-block;
        }

        /* The trigger is a secondary ui-button, written out rather than shared — the same
           trade src/select.ts made against ui-input's box, and answered the same way: the
           duplication is real, and tests/menu.test.ts measures this box against that one
           rather than trusting the two to stay in step. Sharing would mean either slotting
           a ui-button, which puts the ARIA relationship back in the consumer's hands, or a
           mixin, which is a second inheritance axis for one rule set. */
        button {
            display: inline-flex;
            align-items: center;
            gap: calc(${reference('--ui-space')} / 2);
            font: inherit;
            font-family: ${reference('--ui-font')};
            border: 1px solid currentcolor;
            border-radius: ${reference('--ui-radius')};
            padding: ${reference('--ui-space')} calc(${reference('--ui-space')} * 2);
            background: ${reference('--ui-color-surface')};
            color: ${reference('--ui-color-text')};
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            transition: background-color ${reference('--ui-duration-state')}
                ${reference('--ui-easing-state')};
        }

        button:hover {
            background: ${reference('--ui-color-hover')};
        }

        /* Zero rather than a second token, for the reason src/button.ts states beside its
           own: a press is over in about 100ms, so an entering transition of 150ms would
           land after the finger has left. */
        button:active {
            background: ${reference('--ui-color-pressed')};
            transition-duration: 0s;
        }

        button:focus-visible {
            outline: 2px solid ${reference('--ui-color-focus')};
            outline-offset: 2px;
        }

        /* One dimension, not two: an svg carrying a viewBox is a replaced element with an
           intrinsic ratio, so a square glyph given a width takes the same height from it.
           src/toast.ts carries the measurement that made this a rule. */
        svg {
            flex: none;
            inline-size: ${reference('--ui-icon-size')};
            stroke-width: ${reference('--ui-icon-stroke')};
            color: ${reference('--ui-color-text-muted')};
            transition: rotate ${reference('--ui-duration-state')} ${reference('--ui-easing-state')};
        }

        :host([open]) svg {
            rotate: 180deg;
        }

        /* The panel's own box. position: fixed is what the popover already is; it is
           restated because the script writes the two insets against the viewport, and a
           reader of those lines should not have to know which stylesheet made them mean
           that. */
        [popover] {
            position: fixed;
            margin: 0;
            inset: auto;
            box-sizing: border-box;
            min-inline-size: max-content;
            max-inline-size: calc(${reference('--ui-space')} * 44);
            padding: calc(${reference('--ui-space')} / 2);
            border: 1px solid ${reference('--ui-color-border')};
            border-radius: ${reference('--ui-radius')};
            background: ${reference('--ui-color-surface')};
            color: ${reference('--ui-color-text')};
            font-family: ${reference('--ui-font')};
            /* Lifted and bounded both, for the reason src/card.ts gives: a shadow is one
               value in both schemes and does almost nothing on a dark page, where the
               derived boundary is what separates the surface from what is under it. */
            box-shadow: ${reference('--ui-elevation-raised')};
        }

        /* display is named under :popover-open and nowhere else, and that is the trap
           src/dialog.ts fell into once: the user agent hides a closed popover with
           display: none, and an author rule naming display unconditionally outranks it. */
        [popover]:popover-open {
            display: flex;
            flex-direction: column;
        }

        /* The gap between the panel and its trigger, in CSS because it is a token and the
           script has no way to resolve one: a custom property reads back as it was
           written, so 0.5rem would arrive at a function that needs pixels. */
        [popover][data-side='block-end'] {
            translate: 0 calc(${reference('--ui-space')} / 2);
        }

        [popover][data-side='block-start'] {
            translate: 0 calc(${reference('--ui-space')} / -2);
        }

        /* An item is the host's own control, reached through ::slotted — so what is set
           here is the only thing this component decides about it: that it fills the row,
           reads left to right, and answers a pointer. */
        ::slotted(button),
        ::slotted(a) {
            display: block;
            inline-size: 100%;
            box-sizing: border-box;
            text-align: start;
            font: inherit;
            border: none;
            border-radius: ${reference('--ui-radius')};
            padding: calc(${reference('--ui-space')} / 2) ${reference('--ui-space')};
            background: none;
            color: inherit;
            text-decoration: none;
            cursor: pointer;
            transition: background-color ${reference('--ui-duration-state')}
                ${reference('--ui-easing-state')};
        }

        /* The :not() guards are measured rather than assumed, the same way src/button.ts
           measured its own: a disabled control still matches :hover, so without them an
           item that cannot be chosen would light up under a pointer. */
        ::slotted(button:not(:disabled):hover),
        ::slotted(a:not([aria-disabled='true']):hover) {
            background: ${reference('--ui-color-hover')};
        }

        ::slotted(button:focus-visible),
        ::slotted(a:focus-visible) {
            outline: 2px solid ${reference('--ui-color-focus')};
            outline-offset: -2px;
        }

        ::slotted(button:disabled),
        ::slotted([aria-disabled='true']) {
            color: ${reference('--ui-color-text-muted')};
            cursor: not-allowed;
        }

        /* An hr already claims role="separator" — measured — so the platform owns what it
           means and this owns only what it looks like. */
        ::slotted(hr) {
            border: none;
            border-block-start: 1px solid ${reference('--ui-color-border')};
            margin: calc(${reference('--ui-space')} / 2) 0;
        }
    `;

    static override readonly properties = {
        open: { type: Boolean, reflect: true },
    };

    /**
     * Whether the menu is showing.
     *
     * Reflected, so a host stylesheet can select on it — and so the caret above can turn
     * without this file writing a class. Settable: the platform's own state is the source
     * of truth and {@link UiMenu.updated} reconciles the two, which is the shape
     * `src/dialog.ts` uses and for the same reason.
     *
     * A plain field rather than the `accessor` keyword, for the reason `src/button.ts`
     * states beside its own.
     */
    open = false;

    /** The button this component owns, so the relationship below cannot be miswired. */
    readonly #trigger = document.createElement('button');

    /** The menu itself, in the same tree scope as the trigger that names it. */
    readonly #panel = document.createElement('div');

    /** What a pending typeahead has collected, and the clock that forgets it. */
    #typed = '';

    #forgetting = 0;

    /** Whether the next open should land on the last item rather than the first. */
    #fromEnd = false;

    /**
     * Whether the close should hand the focus back.
     *
     * Set only by the two ways out that leave the reader inside the menu — Escape, and
     * choosing an item. A click elsewhere is the third way out and deliberately does not
     * set it: the reader has already said where they want to be, and moving them to the
     * trigger would take it away from them.
     */
    #returning = false;

    /** Re-places the panel under anything that moves the trigger while it is open. */
    readonly #reflow = (): void => {
        this.#place();
    };

    /** What is watching while the menu is open, dropped in one call when it closes. */
    #watching = new AbortController();

    constructor() {
        super();

        const trigger = this.#trigger;
        const panel = this.#panel;

        // No `type` is set here, and that is measured rather than forgotten: a `<button>`
        // in a shadow root has no form owner — `.form` is null and a click submits nothing —
        // so `type="button"` would defend against a submission the shadow boundary already
        // makes impossible. The platform is the guarantee; a line restating it is one more
        // thing that can rot.
        trigger.setAttribute('part', 'trigger');
        trigger.setAttribute('aria-haspopup', 'menu');
        trigger.setAttribute('aria-controls', panelId);
        // The platform's own invoker, rather than a click handler that opens it. A click on
        // the trigger of an open `auto` popover light-dismisses it *and* reaches the
        // handler, so a hand-rolled toggle closes and reopens in one click — the platform's
        // invoker logic is written for exactly that and this file should not have a second
        // copy of it.
        trigger.setAttribute('popovertarget', panelId);
        trigger.addEventListener('keydown', this.#onTriggerKey);
        trigger.append(slot('trigger'), caret());

        panel.id = panelId;
        panel.setAttribute('part', 'menu');
        panel.setAttribute('role', 'menu');
        panel.setAttribute('popover', 'auto');
        panel.addEventListener('toggle', this.#onToggle);
        panel.addEventListener('keydown', this.#onMenuKey);
        panel.addEventListener('click', this.#onChoose);

        const items = slot();
        items.addEventListener('slotchange', this.#wire);
        panel.append(items);
    }

    override disconnectedCallback(): void {
        // Removed while open, the panel takes the window listeners with it. A menu a
        // framework unmounted would otherwise keep re-placing an element that is no longer
        // in a document.
        this.#watching.abort();

        super.disconnectedCallback();
    }

    override updated(): void {
        this.#trigger.setAttribute('aria-expanded', String(this.open));

        // Compared against the platform's own state rather than against Lit's changed
        // properties, and it has to be: on the first update Lit reports every initialised
        // property as changed, so a menu that has never been open would run the closing
        // path. It is also what makes the invoker's own toggle a no-op here rather than a
        // second `showPopover()` on a panel that is already open.
        //
        // Stryker disable next-line ConditionalExpression,BlockStatement: measured in the
        // engine the suite runs — a redundant `showPopover()` or `hidePopover()` RETURNS
        // rather than throwing, so with this guard gone nothing a test here can reach
        // behaves differently. It stays anyway, because the engine is not the contract:
        // the invoker sets `open` to what the platform has ALREADY done, so every click
        // would make one redundant call, and an engine that refuses one would throw on the
        // most ordinary interaction this component has. Marked rather than deleted so the
        // next reader finds the measurement instead of taking it again.
        if (this.open === this.#panel.matches(':popover-open')) {
            return;
        }

        if (this.open) {
            this.#panel.showPopover();
        } else {
            this.#panel.hidePopover();
        }
    }

    override render(): TemplateResult {
        return html`${this.#trigger}${this.#panel}`;
    }

    /** The items, which are the host's own controls rather than anything rendered here. */
    #items(): HTMLElement[] {
        return [
            ...this.querySelectorAll<HTMLElement>(
                ':scope > button:not([slot]), :scope > a[href]:not([slot])',
            ),
        ];
    }

    /** The ones a reader can actually land on, which is what every key below moves over. */
    #enabled(): HTMLElement[] {
        return this.#items().filter((item) => !item.matches('[disabled], [aria-disabled="true"]'));
    }

    /**
     * Makes each item a menu item, and makes the menu one tab stop.
     *
     * On `slotchange` as well as at first render, because a framework re-render replaces
     * the element rather than mutating it — and an item that is only wired the first time
     * is one that silently stops being reachable.
     *
     * `tabindex="-1"` on every item, not a roving `0`: a popup menu is only reachable while
     * it is open, so the tab stop is the trigger and the items are moved between by the
     * keys below. That is also what makes Tab leave rather than walk the menu, which is
     * what the APG pattern asks for and what the platform does with real buttons otherwise.
     */
    readonly #wire = (): void => {
        for (const item of this.#items()) {
            item.setAttribute('role', 'menuitem');
            item.setAttribute('tabindex', '-1');
        }
    };

    /** Opens onto an end of the list, which is the one thing a click cannot ask for. */
    readonly #onTriggerKey = (event: KeyboardEvent): void => {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
            return;
        }

        // Or the page scrolls under the menu that just opened.
        event.preventDefault();

        this.#fromEnd = event.key === 'ArrowUp';
        this.open = true;
    };

    readonly #onMenuKey = (event: KeyboardEvent): void => {
        switch (event.key) {
            case 'ArrowDown':
                this.#step(1);
                break;
            case 'ArrowUp':
                this.#step(-1);
                break;
            case 'Home':
                this.#edge(false);
                break;
            case 'End':
                this.#edge(true);
                break;
            case 'Escape':
                // The platform closes it; this only says where the focus should land.
                this.#returning = true;
                return;
            case 'Tab':
                // The focus is already leaving and the default is what carries it there.
                // Closing without preventing is the whole of the APG rule.
                this.open = false;
                return;
            default:
                if (event.key.length !== 1) {
                    return;
                }

                this.#type(event.key);
                break;
        }

        event.preventDefault();
    };

    /** Choosing an item closes the menu, which is what makes it a menu rather than a panel. */
    readonly #onChoose = (event: MouseEvent): void => {
        const chosen = event.target;

        if (!(chosen instanceof HTMLElement) || !this.#enabled().includes(chosen)) {
            return;
        }

        this.#returning = true;
        this.open = false;
    };

    /**
     * Follows the platform's own state, whichever way it moved.
     *
     * The invoker, a click elsewhere and Escape all close the panel without going through
     * {@link UiMenu.open}, so this is where the property learns what happened rather than
     * the other way round.
     */
    readonly #onToggle = (event: ToggleEvent): void => {
        this.open = event.newState === 'open';

        if (!this.open) {
            this.#watching.abort();
            this.#give();

            return;
        }

        this.#place();
        this.#edge(this.#fromEnd);
        this.#fromEnd = false;

        this.#watching = new AbortController();

        const watched = { signal: this.#watching.signal };

        // Capturing, because the thing that scrolls is rarely the window: a scroll inside
        // any ancestor moves the trigger and no event reaches the window from it.
        window.addEventListener('scroll', this.#reflow, { capture: true, ...watched });
        window.addEventListener('resize', this.#reflow, watched);
    };

    /**
     * Hands the focus back to the trigger, where the platform does not.
     *
     * Measured, in this component's own arrangement: with the trigger in this shadow root
     * and the focus on a slotted item, closing leaves the focus on `<body>` — the same
     * markup in one flat tree returns it to the invoker. So this is a gap rather than a
     * duplication of something the platform already did.
     */
    #give(): void {
        if (!this.#returning) {
            return;
        }

        this.#returning = false;
        this.#trigger.focus();
    }

    /** Moves by one, wrapping at either end, which is what the APG pattern asks for. */
    #step(offset: number): void {
        const items = this.#enabled();
        const at = items.findIndex((item) => item === document.activeElement);

        // A menu with no enabled item leaves the modulo undefined and the lookup empty,
        // which is the same nothing a guard would return — so there is no guard.
        items[(at + offset + items.length) % items.length]?.focus();
    }

    /** Jumps to one end, which is Home and End and also where an opening menu lands. */
    #edge(last: boolean): void {
        const items = this.#enabled();

        (last ? items[items.length - 1] : items[0])?.focus();
    }

    /**
     * Moves to the next item whose label starts with what has been typed.
     *
     * The search starts *after* the current item and wraps, which is what makes a repeated
     * letter cycle through the items that share it — and what lets a growing buffer still
     * find the item it is already on, by coming back round to it.
     */
    #type(character: string): void {
        window.clearTimeout(this.#forgetting);

        this.#typed += character.toLowerCase();
        this.#forgetting = window.setTimeout(() => {
            this.#typed = '';
        }, rhythm);

        const items = this.#enabled();
        const at = items.findIndex((item) => item === document.activeElement);
        const after = items.slice(at + 1);
        // Stryker disable next-line MethodExpression: dropping the arguments makes this the
        // whole list, and the search cannot tell the difference — `order` would then be the
        // original array followed by entries the `find` has already rejected, so it stops at
        // the same item or at none. Provably equivalent, which is the only reason to ignore
        // one; the argument itself is NOT ignored, and `tests/menu.test.ts` kills a mutant on
        // it by searching backwards past the item under the focus.
        const wrapped = items.slice(0, at + 1);
        const order = [...after, ...wrapped];

        order
            .find((item) => item.textContent.trim().toLowerCase().startsWith(this.#typed))
            ?.focus();
    }

    /**
     * Hangs the panel from its trigger, above it when there is no room below, and inside
     * the viewport either way.
     *
     * The arithmetic is `src/placement.ts`, which `<ui-tooltip>` reads as well — the issue
     * behind this component asked for one answer rather than two, and what differs between
     * the two callers is a preferred side and an alignment.
     */
    #place(): void {
        const root = document.documentElement;
        const placement = place(
            this.#trigger.getBoundingClientRect(),
            this.#panel.getBoundingClientRect(),
            { width: root.clientWidth, height: root.clientHeight },
            'block-end',
            'inline-start',
        );

        this.#panel.setAttribute(side, placement.side);
        this.#panel.style.insetBlockStart = `${String(placement.blockStart)}px`;
        this.#panel.style.insetInlineStart = `${String(placement.inlineStart)}px`;
    }
}

// Stryker disable next-line StringLiteral: the registration runs once, at import, inside
// the warm process Stryker switches mutants in — so by the time a mutant on this line is
// active the element is already defined under the original name, and no test can observe
// the change. Outside the runner's reach, not an equivalent mutant.
customElements.define('ui-menu', UiMenu);

declare global {
    interface HTMLElementTagNameMap {
        'ui-menu': UiMenu;
    }
}

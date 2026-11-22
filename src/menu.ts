import { LitElement, css, html, unsafeCSS, type CSSResult, type TemplateResult } from 'lit';
import { Description } from './description.js';
import { buttonEffects, panelEffects, pressed, type Panel } from './effects.js';
import { follow } from './pointer.js';
import { reference } from './reference.js';
import { arrive, watch } from './ring.js';

/** Which of the trigger's edges the panel hangs from: its leading edge, or its trailing one. */
export type MenuAlign = 'start' | 'end';

/**
 * The panel's id, and it needs no counter behind it.
 *
 * `src/tooltip.ts` numbers its own, because the element it points at is the host's and
 * shares the document's tree scope. Both ends of this reference are
 * rendered here, so the id is scoped to one shadow root and two menus on a page cannot
 * collide — which is the same property that lets `aria-controls` resolve at all.
 */
const panelId = 'menu';

/** Which way the panel went, for a host that wants to select on it. */
const side = 'data-side';

/** What a menu takes as an item: a button or a link of the host's, its own or in a section. */
const taken =
    ':scope > button:not([slot]), :scope > a[href]:not([slot]), :scope > ui-menu, :scope > [role="group"] > button, :scope > [role="group"] > a[href], :scope > [role="group"] > ui-menu';

/** The ids the menu gives the descriptions it names, numbered across the page. */
let sequence = 0;

/** The roles of an item that ticks, which the host writes and the menu keeps. */
const ticking = '[role="menuitemcheckbox"], [role="menuitemradio"]';

/** The checkbox's tick, as `src/checkbox.ts` masks it, which a checked item that ticks as one draws. */
const tick = css`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12.5l4.5 4.5L19 7'/%3E%3C/svg%3E")`;

/** The radio's dot, as `src/radio.ts` masks it, which a checked item that ticks as a radio draws. */
const dot = css`radial-gradient(circle closest-side, #000 100%, transparent 100%)`;

/**
 * An item's box: it fills the row, reads from its start, answers a pointer, and is no shorter
 * than the 24px WCAG 2.2's 2.5.8 asks of a target — see the comment where the menu's own sheet
 * writes it for its items.
 */
const box = css`
    --ui-fx-line: 1;
    display: block;
    inline-size: 100%;
    min-block-size: 24px;
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
`;

/** An item that ticks keeps a column at its start, as wide as a line is tall, for its tick. */
const column = css`
    position: relative;
    padding-inline-start: calc(${reference('--ui-space')} * 1.5 + 1em);
`;

/** The tick, drawn in the item's own text in that column while the item is checked. */
const drawn = css`
    content: '';
    position: absolute;
    inset-block: 0;
    inset-inline-start: ${reference('--ui-space')};
    inline-size: 1em;
    background-color: currentColor;
    mask-position: center;
    mask-repeat: no-repeat;
`;

/**
 * The rules for what a section holds, which cannot live in the menu's shadow root.
 *
 * **A section is a `role="group"` of the host's**, among the menu's children, holding items and the
 * heading that names it, which `::slotted()` does not reach: it matches what a slot was given and
 * nothing below it. So these rules are adopted into the tree the menu is in, which `getRootNode()`
 * finds, as `<ui-table>` adopts its own, and draw an item in a section as the menu's own sheet draws
 * one of its children. They are written at no weight, so a rule of the host's for its own button
 * outweighs them, as it outweighs `::slotted()`'s; and every selector names a menu, so nothing
 * outside one is touched.
 *
 * **The heading is whatever in the section is no item**, which the section names itself by with
 * `aria-labelledby`: drawn as a section's title, in the muted text at the supporting size, and
 * passed over by the keys, which move over items alone.
 *
 * **What an item holds is drawn here too**, its own children or a section's, for the same reason:
 * a shortcut, the host's `<kbd>`, at the item's end on its label's line, in the muted text and the
 * label's own size, so the two stand on one baseline; and a description, the host's element marked
 * `data-ui-description`, on a line of its own under the label, from where the label starts, in the
 * muted text at the supporting size. Under the pointer both take the item's own text. The shortcut floats to the end rather than the item turning
 * into a grid, which would lay an icon and the label beside it out apart.
 */
export const rules: CSSResult = css`
    :where(ui-menu > :is(button, a) > kbd, ui-menu > [role='group'] > :is(button, a) > kbd) {
        float: inline-end;
        margin-inline-start: calc(${reference('--ui-space')} * 2);
        font: inherit;
        color: ${reference('--ui-color-text-muted')};
    }

    :where(
        ui-menu > :is(button, a) > [data-ui-description],
        ui-menu > [role='group'] > :is(button, a) > [data-ui-description]
    ) {
        display: block;
        color: ${reference('--ui-color-text-muted')};
        font-size: ${reference('--ui-text-supporting')};
    }

    /* Under the pointer both take the item's own text: on the fill an item takes there the muted
       text fell to 3.28:1 in a palette of the shipped ones, where at rest it holds 4.5:1. */
    :where(
        ui-menu
            > :is(button:not(:disabled), a:not([aria-disabled='true'])):hover
            > :is(kbd, [data-ui-description]),
        ui-menu
            > [role='group']
            > :is(button:not(:disabled), a:not([aria-disabled='true'])):hover
            > :is(kbd, [data-ui-description])
    ) {
        color: inherit;
    }

    :where(ui-menu > [role='group'] > :is(button, a)) {
        ${box}
    }

    :where(ui-menu > [role='group'] > [hidden]) {
        display: none;
    }

    :where(
        ui-menu > [role='group'] > :is(button:not(:disabled), a:not([aria-disabled='true'])):hover
    ) {
        background: ${reference('--ui-color-hover')};
    }

    :where(ui-menu > [role='group'] > :is(button, a):focus-visible) {
        outline: 2px solid ${reference('--ui-color-focus')};
        outline-offset: -2px;
    }

    :where(ui-menu > [role='group'] > :is(button:disabled, [aria-disabled='true'])) {
        color: ${reference('--ui-color-text-muted')};
        cursor: not-allowed;
    }

    :where(ui-menu > [role='group'] > :not(button, a, [hidden])) {
        display: block;
        padding: calc(${reference('--ui-space')} / 2) ${reference('--ui-space')};
        color: ${reference('--ui-color-text-muted')};
        font-size: ${reference('--ui-text-supporting')};
    }

    :where(ui-menu > [role='group'] > :is(${unsafeCSS(ticking)})) {
        ${column}
    }

    :where(ui-menu > [role='group'] > [role='menuitemcheckbox'][aria-checked='true'])::before {
        ${drawn}
        mask-image: ${tick};
        mask-size: 1em;
    }

    :where(ui-menu > [role='group'] > [role='menuitemradio'][aria-checked='true'])::before {
        ${drawn}
        mask-image: ${dot};
        mask-size: 0.5em;
    }

    @media (forced-colors: active) {
        :where(ui-menu > [role='group'] > [aria-checked='true'])::before {
            background-color: CanvasText;
        }
    }
`;

/** One sheet for the whole page, adopted once into each tree a menu joins — see {@link rules}. */
const sheet = new CSSStyleSheet();
sheet.replaceSync(rules.cssText);

// Stryker disable all: read once, at import, into the styles the class is defined with — so in the
// warm process Stryker switches mutants in, the original selectors stand before any mutant is
// active. panelEffects() itself is graded where tests/effects.test.ts builds it at test time.
/**
 * Where the panel's parts are, for its effects: the popover, the items the host slots into it,
 * which are its children with no slot of their own, and the trigger's caret, turned as it opens.
 */
const parts: Panel = {
    panel: '[popover]',
    open: '[popover]:popover-open',
    closed: '[popover]:not(:popover-open)',
    above: "[popover][data-side='block-start']",
    items: '[popover]:popover-open slot::slotted(:not([slot]))',
    item: (place) =>
        `[popover]:popover-open slot::slotted(:nth-child(${String(place)} of :not([slot])))`,
    rest: '[popover]:popover-open slot::slotted(:nth-child(n + 7 of :not([slot])))',
    caret: 'svg',
    turned: ':host([open]) svg',
};
// Stryker restore all

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
 * The span the edge's band is drawn on, which the button's effects ask of a button: a layer of the
 * trigger's own, since the band is cut to the edge. Hidden, as the caret is: it says nothing.
 */
function band(): HTMLSpanElement {
    const edge = document.createElement('span');

    edge.className = 'edge';
    edge.setAttribute('aria-hidden', 'true');

    return edge;
}

/**
 * How long the pointer rests on a submenu's trigger before it opens, and how long an open submenu
 * waits for the pointer on its way across: Radix's, which RFC 0010 took. A reading of the pointer,
 * not motion, so no token, and nothing reduced motion collapses.
 */
const resting = 100;

/** How long an open submenu waits for the pointer on its way to it — see {@link resting}. */
const crossing = 300;

/** A point on the screen, as a pointer reads it. */
interface Point {
    readonly x: number;
    readonly y: number;
}

/** Whether a point lies inside a polygon, by the crossings of a ray cast from it. */
function inside(area: readonly Point[], x: number, y: number): boolean {
    let within = false;

    for (const [at, here] of area.entries()) {
        const there = area.at(at - 1) ?? here;

        if (
            here.y > y !== there.y > y &&
            // Stryker disable next-line EqualityOperator: equivalent — a closed polygon has as many
            // crossings on one side of a point as on the other, odd or even, so `>=` reads the same
            // answer off the other side; and `<=` reads another only for a point exactly on an
            // edge, the line between on the way and off it, which is no more one than the other.
            x < ((there.x - here.x) * (y - here.y)) / (there.y - here.y) + here.x
        ) {
            within = !within;
        }
    }

    return within;
}

/** What an item is typed to: its label, a submenu's by the label of its trigger. */
function label(item: HTMLElement): string {
    const text =
        item instanceof UiMenu
            ? item.querySelector(':scope > [slot="trigger"]')?.textContent
            : item.textContent;

    return (text ?? '').trim().toLowerCase();
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
 * **An item may tick, and items may be gathered in sections**, RFC 0010's, both written by the
 * host: an item the host makes `menuitemcheckbox` or `menuitemradio` keeps that role, its
 * `aria-checked` turned by a press, a radio's one at a time in its section; and a section is a
 * `role="group"` among the menu's children, named by a heading it holds, its items taken and moved
 * through as the menu's own are, and drawn by {@link rules}, which `::slotted()` cannot be.
 *
 * **A menu written in another is a submenu**, RFC 0010's: its trigger is drawn as an item of the
 * menu round it, under the `submenu` state, reached by that menu's keys, and its panel opens beside
 * it, by the arrow toward the inline end, a press, or the pointer resting on it for {@link resting},
 * and waits for the pointer on its way across for {@link crossing} at most. The layer and its
 * dismissal are the platform's: a popover in another's panel is its child among the open popovers.
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
 * No state machine here either, and the measurement above is why: what a machine would
 * have replaced is a roving tabindex and four keys. `ARCHITECTURE.md`, *Behaviour is
 * delegated*, carries that decision for the whole package (#122).
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
    /** The styles its shadow root adopts. */
    static override readonly styles = [
        css`
            :host {
                display: inline-block;
            }

            /* The trigger is a secondary ui-button, its box written out rather than shared — the
           same trade src/select.ts made against ui-input's box, and answered the same way: the
           duplication is real, and tests/menu.test.ts measures this box against that one
           rather than trusting the two to stay in step. Sharing would mean either slotting
           a ui-button, which puts the ARIA relationship back in the consumer's hands, or a
           mixin, which is a second inheritance axis for one rule set. Its effects are not
           written out: they are the sheet src/effects.ts builds for every component that is
           a button, adopted after this one under the menu's own taste name, and measured
           against the button's in the same suite. */
            button {
                display: inline-flex;
                align-items: center;
                gap: calc(${reference('--ui-space')} / 2);
                font: inherit;
                font-family: ${reference('--ui-font')};
                border: 1px solid transparent;
                border-radius: ${reference('--ui-radius')};
                padding: ${reference('--ui-space')} calc(${reference('--ui-space')} * 2);
                background: ${reference('--ui-color-surface-control')};
                color: ${reference('--ui-color-text')};
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
                transition: background-color ${reference('--ui-duration-state')}
                    ${reference('--ui-easing-state')};
                /* What a theme's glow is laid out against, and a stacking context of its own, so
               the layer under the label is drawn over the trigger's fill, as src/button.ts
               lays it. */
                position: relative;
                isolation: isolate;
            }

            /* What a theme's glow is drawn on, as src/button.ts draws it and for its reason. */
            button::before {
                content: '';
                position: absolute;
                inset: -1px;
                border-radius: inherit;
                color: ${reference('--ui-color-accent')};
                box-shadow: ${reference('--ui-elevation-control')};
            }

            button:hover {
                background: ${reference('--ui-color-hover')};
            }

            button:hover::before {
                box-shadow: ${reference('--ui-elevation-control-hover')};
            }

            /* The edge and a theme's lift, on a layer in the text, as src/button.ts draws a
           secondary button's and for its reason. */
            button::after {
                content: '';
                position: absolute;
                /* Under the label, so what a fill effect paints on this layer lights the fill and
               never the label, as src/button.ts lays it. */
                z-index: -1;
                inset: -1px;
                border: 1px solid ${reference('--ui-color-border-button')};
                border-radius: inherit;
                box-shadow: ${reference('--ui-elevation-button')};
                transition: border-color ${reference('--ui-duration-state')}
                    ${reference('--ui-easing-state')};
            }

            button:hover::after {
                border-color: ${reference('--ui-color-border-button-hover')};
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
           src/toast.ts carries the measurement that made this a rule. And no taller than the
           label's line: half of what the line has to spare over the caret goes above it and
           half below, as the toast and the button centre an icon, so a face whose line is
           shorter than the caret does not make the trigger taller than the button it is drawn
           as — Matrix's took it to 38px beside a 36px button, measured. */
            svg {
                flex: none;
                margin-block: calc((1lh - ${reference('--ui-icon-size')}) / 2);
                inline-size: ${reference('--ui-icon-size')};
                stroke-width: ${reference('--ui-icon-stroke')};
                color: ${reference('--ui-color-text-muted')};
                transition: rotate ${reference('--ui-duration-state')}
                    ${reference('--ui-easing-state')};
            }

            :host([open]) svg {
                rotate: 180deg;
            }

            /* The line an icon in the label is fitted to: one of the label's, as a button fits one,
           so a trigger holding an icon is as tall as the button it is drawn as, and the icon and
           the label sit on its middle — src/icon.ts says how the icon takes it. Unfitted, the
           icon stood 3.5 to 5px above the label's middle in a trigger 2 to 4.5px taller,
           measured in the three engines, #395. The label is an element of yours, which
           ::slotted() reaches and nothing inside it, so the fit is handed on by inheritance, to
           an icon wherever the label holds one, and an icon slotted beside the label takes it
           the same. Taken by an icon from its parent alone, through a property that does not
           inherit, it still reached icons deeper in WebKit, measured — so a layout of yours
           inside the label or an item is yours to leave unfitted, as docs/menu.md says. */
            ::slotted([slot='trigger']) {
                --ui-fx-line: 1;
            }

            /* The panel's own box. position: fixed is what the popover already is; it is
           restated because the anchored insets below place it against the viewport, and a
           reader of those rules should not have to know which stylesheet made it fixed. */
            [popover] {
                position: fixed;
                margin: 0;
                inset: auto;
                box-sizing: border-box;
                min-inline-size: max-content;
                max-inline-size: calc(${reference('--ui-space')} * 44);
                padding: calc(${reference('--ui-space')} / 2);
                /* Not the popover's own overflow: auto. The boundary's layer below reaches a pixel
               past the padding box on purpose, and that gave every open panel a pixel to
               scroll and a scrollbar to show it — measured, 121×109 of 122×110. A menu is as
               tall as its items, so nothing here scrolls. */
                overflow: visible;
                /* Here rather than under :popover-open with the display: a host that holds the
               panel through its close with a transition of display keeps the display, and a
               direction scoped to the open state let go of it first — measured, the items
               laid out in a row, 280×63 for 123×111, for the whole of the exit. */
                flex-direction: column;
                border: 1px solid ${reference('--ui-color-border-overlay')};
                border-radius: ${reference('--ui-radius')};
                /* A raised surface, as a card is. */
                background: ${reference('--ui-color-surface-raised')};
                backdrop-filter: ${reference('--ui-backdrop-raised')};
                color: ${reference('--ui-color-text')};
                font-family: ${reference('--ui-font')};
            }

            /* Lifted and bounded both, for the reason src/card.ts gives: a shadow is one value
           in both schemes and does almost nothing on a dark page, where the derived
           boundary is what separates the surface from what is under it. On a layer in the
           accent, as the card's is and for its reason, which takes no pointer so the items
           are still what is chosen. */
            [popover]::before {
                content: '';
                position: absolute;
                inset: -1px;
                border-radius: inherit;
                pointer-events: none;
                color: ${reference('--ui-color-accent')};
                box-shadow: ${reference('--ui-elevation-raised')};
            }

            /* display is named under :popover-open and nowhere else, and that is the trap
           src/dialog.ts fell into once: the user agent hides a closed popover with
           display: none, and an author rule naming display unconditionally outranks it. */
            [popover]:popover-open {
                display: flex;
            }

            /* Where the panel lands, the platform's own: below its trigger from the trigger's
           leading edge, above it where there is no room below, and from the trigger's other
           edge where the panel would run off the screen — placed as it is shown, and kept
           against the trigger through every scroll. By anchored insets rather than an area,
           since Firefox mirrors an area's inline alignment in a part of the page whose
           direction is not the page's, and put the panel at the screen's other edge — Mozilla
           2019601. The trigger is the host, named from this shadow root, so its name is this
           menu's alone; and the host is where the trigger rests, so a transform a host gives the
           trigger's part does not move the panel. */
            :host {
                anchor-name: --menu;
            }

            [popover] {
                position-anchor: --menu;
                top: anchor(bottom);
                left: anchor(left);
                position-try-fallbacks:
                    flip-block,
                    flip-inline,
                    flip-block flip-inline;
            }

            :host(:dir(rtl)) [popover] {
                left: auto;
                right: anchor(right);
            }

            /* align="end": from the trigger's trailing edge, which right to left is its left edge,
               turning to the leading edge by the same flip where it would run off the screen. */
            :host([align='end']) [popover] {
                left: auto;
                right: anchor(right);
            }

            :host([align='end']:dir(rtl)) [popover] {
                right: auto;
                left: anchor(left);
            }

            /* submenu: a menu written in another is drawn as one of its items. Its trigger fills
               the row with an item's box, its caret turned toward the inline end, where the panel
               opens; and it stands down the effects of a button the trigger answers on a menu of
               its own, which no item takes — under the menu's own name, so a choice above it
               reaches what it holds as before. */
            :host(:state(submenu)) {
                display: block;
                --ui-motion-menu-hover-fill: none;
                --ui-motion-menu-hover-border: none;
                --ui-motion-menu-hover-shadow: none;
                --ui-motion-menu-focus-fill: none;
                --ui-motion-menu-focus-move: none;
                --ui-motion-menu-focus-ring: none;
                --ui-motion-menu-focus-shadow: none;
                --ui-motion-menu-press-fill: none;
                --ui-motion-menu-press-move: none;
                --ui-motion-menu-press-shadow: none;
                /* And the caret's turn as its panel opens, which flips it where it points down. */
                --ui-motion-menu-caret: none;
            }

            :host(:state(submenu)) [part~='trigger'] {
                ${box}
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${reference('--ui-space')};
                isolation: auto;
            }

            :host(:state(submenu)) [part~='trigger']::before,
            :host(:state(submenu)) [part~='trigger']::after {
                content: none;
            }

            /* Lit under the pointer, as an item is, and while its panel is open, so the item the
               open panel hangs from is the one lit. */
            :host(:state(submenu)) [part~='trigger']:is(:hover, :active),
            :host(:state(submenu)[open]) [part~='trigger'] {
                background: ${reference('--ui-color-hover')};
            }

            :host(:state(submenu)) [part~='trigger']:focus-visible {
                outline-offset: -2px;
            }

            /* Turned toward where the panel opens, and kept there as it opens: heavier than the
               turn a menu's caret takes as its own panel opens below it. */
            :host(:state(submenu)) svg,
            :host(:state(submenu)[open]) svg {
                rotate: -90deg;
            }

            :host(:state(submenu):dir(rtl)) svg,
            :host(:state(submenu)[open]:dir(rtl)) svg {
                rotate: 90deg;
            }

            /* The panel beside its trigger, its first item level with it — the panel's padding and
               its edge above the item — and clear of the edge of the panel round it, by that
               panel's padding and edge; toward the inline end, turned to the start and up where it
               would run off the screen, by the platform's flips. */
            :host(:state(submenu)) [popover] {
                top: calc(anchor(top) - ${reference('--ui-space')} / 2 - 1px);
                left: anchor(right);
                margin: 0;
                margin-inline-start: calc(${reference('--ui-space')} / 2 + 1px);
                position-try-fallbacks:
                    flip-inline,
                    flip-block,
                    flip-block flip-inline;
            }

            :host(:state(submenu):dir(rtl)) [popover] {
                left: auto;
                right: anchor(left);
            }

            /* The gap between the panel and its trigger: a margin on the side the trigger is on,
           which the flip moves to the other side with the panel. */
            [popover] {
                margin-block-start: calc(${reference('--ui-space')} / 2);
            }

            /* An item is the host's own control, reached through ::slotted — so what is set
           here is the only thing this component decides about it: that it fills the row,
           reads left to right, and answers a pointer. And that it is no shorter than the 24px
           WCAG 2.2's 2.5.8 asks of a target: items sit one against the next, so the
           criterion's spacing exception does not save one, and the compact density comes
           within a pixel of it — RFC 0008 — so a host's own compact space would take an item
           under it. And the line an icon in the item is fitted to, one of the item's, handed on
           as the trigger's label hands its own, so an item holding an icon is as tall as one
           without. */
            ::slotted(button),
            ::slotted(a) {
                ${box}
            }

            /* An item written hidden is not drawn, as the platform draws nothing hidden. The
           display above is this root's own rule, which outweighs the browser's [hidden] as any
           author's does, so it showed, in the three engines (#412). This says it again,
           heavier by its attribute. */
            ::slotted([hidden]) {
                display: none;
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

            /* An item that ticks, menuitemcheckbox or menuitemradio as the host wrote it, keeps a
               column at its start for its tick, drawn while aria-checked says it is checked: the
               checkbox's tick and the radio's dot, in the item's own text. An item in a section is
               drawn the same by the rules the menu adopts, which ::slotted() does not reach. */
            ::slotted(:is(${unsafeCSS(ticking)})) {
                ${column}
            }

            ::slotted([role='menuitemcheckbox'][aria-checked='true'])::before {
                ${drawn}
                mask-image: ${tick};
                mask-size: 1em;
            }

            ::slotted([role='menuitemradio'][aria-checked='true'])::before {
                ${drawn}
                mask-image: ${dot};
                mask-size: 0.5em;
            }

            /* Forced colours force a background back to the canvas, a mask's with it, so the tick
               names the system's text, which the mode keeps — as heavy as the rules above, which
               it follows. */
            @media (forced-colors: active) {
                ::slotted(:is(${unsafeCSS(ticking)})[aria-checked='true'])::before {
                    background-color: CanvasText;
                }
            }

            /* An hr already claims role="separator" — measured — so the platform owns what it
           means and this owns only what it looks like. */
            ::slotted(hr) {
                border: none;
                border-block-start: 1px solid ${reference('--ui-color-border')};
                margin: calc(${reference('--ui-space')} / 2) 0;
            }
        `,
        buttonEffects('menu'),
        // How the panel opens and closes and the caret turns, after the trigger's, as a select's
        // list does: one sheet for every panel hung from a trigger.
        panelEffects('menu', parts),
    ];

    /** The properties Lit observes on this element. */
    static override readonly properties = {
        open: { type: Boolean, reflect: true },
        align: { type: String, reflect: true },
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

    /**
     * Which of the trigger's edges the panel hangs from: `start`, its leading edge, the default, or
     * `end`, its trailing one. Either turns to the other where the panel would run off the screen.
     * Reflected.
     */
    align: MenuAlign = 'start';

    /** The button this component owns, so the relationship below cannot be miswired. */
    readonly #trigger = document.createElement('button');

    /**
     * The sentence a `<ui-tooltip>` hands over, and the node the trigger points at.
     *
     * This element is the hardest place the protocol goes and it is taken second on
     * purpose: it renders its own trigger, drives a popover, already holds an
     * `aria-controls` reference and hand-writes the focus return across a shadow
     * boundary. A protocol that broke here first would not say whether the protocol or
     * the menu was at fault — so `<ui-button>`, which has none of that, proved it. RFC 0006
     *
     * The trigger is built with `document.createElement`, so the reference is written in
     * {@link UiMenu.updated} beside `aria-expanded` rather than bound in the template.
     */
    readonly #description = new Description(this);

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

    /** Where the menu keeps its states: `submenu`, while it is written in another menu. */
    readonly #internals = this.attachInternals();

    /**
     * The menu this one is written in, or in a section of, which makes it a submenu, whose trigger
     * is an item of that menu and whose panel opens beside it: none where it is a menu of its own.
     */
    #above: UiMenu | undefined;

    /** The submenu's opening, once the pointer has rested on its trigger. */
    #opening = 0;

    /** Whether the pointer opened the menu, which leaves the focus where it was. */
    #pointed = false;

    /** Ends the wait for the pointer on its way to an open submenu, which it leaves as it is. */
    #crossed: (() => void) | undefined;

    /** The submenu, written in this menu, that waits for the pointer on its way to it. */
    #waiting: UiMenu | undefined;

    /**
     * The panel's height as it was last measured open, which foretells its side before it opens:
     * a closed popover measures nothing. None until the first open, which then hangs below its
     * trigger, as a panel does wherever it fits.
     */
    #height = 0;

    /** Reads the panel's side again under anything that moves the trigger while it is open. */
    readonly #reflow = (): void => {
        this.#side();
    };

    /** What is watching while the menu is open, dropped in one call when it closes. */
    #watching = new AbortController();

    /** Builds the trigger and the panel, and wires the one to the other as a menu button. */
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
        trigger.addEventListener('pointerenter', this.#onRest);
        trigger.addEventListener('pointerleave', this.#onDepart);
        // A secondary button's effects, which the trigger answers as that button does: the
        // sheet draws them by the class and on the band, and the scripts they need are bound
        // as ui-button binds them — src/effects.ts says what it asks of a button.
        trigger.className = 'secondary';
        trigger.addEventListener('focus', arrive);
        follow(trigger);
        trigger.addEventListener('pointerdown', pressed);
        trigger.addEventListener('keydown', pressed);
        trigger.append(slot('trigger'), caret(), band());

        panel.id = panelId;
        panel.setAttribute('part', 'menu');
        panel.setAttribute('role', 'menu');
        panel.setAttribute('popover', 'auto');
        panel.addEventListener('beforetoggle', this.#onBeforeToggle);
        panel.addEventListener('toggle', this.#onToggle);
        panel.addEventListener('keydown', this.#onMenuKey);
        panel.addEventListener('pointerenter', this.#onArrive);
        panel.addEventListener('click', this.#onTick, { capture: true });
        panel.addEventListener('click', this.#onChoose);

        const items = slot();
        items.addEventListener('slotchange', this.#wire);
        panel.append(items);
    }

    /**
     * Adopts the rules for what a section holds into the tree it joined, and starts watching the
     * page's focus as the first menu connects, so the ring the reader saw before the trigger's first
     * focus is already recorded when the glide needs it.
     */
    override connectedCallback(): void {
        super.connectedCallback();

        // `connectedCallback` runs when the element is connected to a document, so the root is a
        // `Document` or a `ShadowRoot`, both of which carry `adoptedStyleSheets`.
        const root = this.getRootNode() as Document | ShadowRoot;

        if (!root.adoptedStyleSheets.includes(sheet)) {
            root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
        }

        this.#nest();

        // Stryker disable next-line CallExpression: watch() adds the page's two listeners, and in
        // the warm process Stryker switches mutants in, a run before has already added them, so the
        // call gone changes nothing a test can see. Outside the runner's reach, not an equivalent
        // mutant: on a page with menus and no button, nothing else would add them, and the
        // trigger's ring would never glide.
        watch();
    }

    /** Drops the listeners an open panel holds on the window. */
    override disconnectedCallback(): void {
        // Removed while open, the panel takes the window listeners with it. A menu a
        // framework unmounted would otherwise keep re-placing an element that is no longer
        // in a document.
        this.#watching.abort();
        window.clearTimeout(this.#opening);
        this.#crossed?.();

        // Stryker disable next-line CallExpression: this reaches exactly two things in Lit
        // and this element has neither — `__controllers` is empty, because nothing here
        // registers a reactive controller, and `__childPart.setConnected(false)` speaks
        // only to async directives, which this template does not use. `Description` is a
        // plain object rather than a `ReactiveController` for precisely that reason: it
        // needs `requestUpdate` and no lifecycle hook, so it adds nothing here to
        // disconnect. The same annotation is in `src/toast.ts` with the same reading, and
        // the call stays for the same reason: Lit documents it as the extension point it
        // reserves for later additions, so the day this element grows a controller the
        // mutant stops being equivalent and nothing else would say so.
        super.disconnectedCallback();
    }

    /** Mirrors `open` onto the trigger, and shows or hides the panel when the two disagree. */
    override updated(): void {
        this.#trigger.setAttribute('aria-expanded', String(this.open));
        this.#description.point(this.#trigger);

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

    /** The trigger, the panel, and the description the trigger points at. */
    override render(): TemplateResult {
        // The carrier sits beside the trigger rather than inside the panel: the panel is a
        // popover and the reference has to resolve from where the reader's focus lands,
        // which is the trigger's own tree scope and not the layer above it.
        return html`${this.#trigger}${this.#panel}${this.#description.carrier()}`;
    }

    /**
     * The items, which are the host's own controls rather than anything rendered here: its children,
     * and the children of a section among them, in the order they are written, so the keys pass
     * through sections as through the rest.
     */
    #items(): HTMLElement[] {
        return [...this.querySelectorAll<HTMLElement>(taken)];
    }

    /**
     * The ones a reader can actually land on, which is what every key below moves over.
     *
     * **An item that is not drawn is passed over**, written `hidden` or hidden by the page.
     * Moving onto one asked it for the focus, which an element that is not drawn refuses, so
     * the focus stayed where it was and the next press asked the same item again: the arrows
     * never got past it, in the three engines (#412). `checkVisibility()` reads both, and
     * every key, every click and the opening ask while the panel is open, where whatever it
     * holds that can be drawn is drawn.
     */
    #enabled(): HTMLElement[] {
        return this.#items().filter(
            (item) => item.checkVisibility() && !item.matches('[disabled], [aria-disabled="true"]'),
        );
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
            // A submenu draws its own trigger as an item, which is what it is reached by.
            if (item instanceof UiMenu) {
                continue;
            }

            // An item that ticks keeps the role the host wrote, and says it is unchecked where the
            // host wrote nothing, since the state is one the role requires.
            if (item.matches(ticking)) {
                if (!item.hasAttribute('aria-checked')) {
                    item.setAttribute('aria-checked', 'false');
                }
            } else {
                item.setAttribute('role', 'menuitem');
            }

            item.setAttribute('tabindex', '-1');
            this.#describe(item);
        }
    };

    /** The id each item's description was given in its `aria-describedby`, where the menu wrote it. */
    readonly #described = new WeakMap<HTMLElement, string>();

    /**
     * Names an item's description in its `aria-describedby`, and hides it from the item's name.
     *
     * The description is inside the item, so it is part of the name the item's content gives it;
     * hidden there, it stays out of the name, and `aria-describedby` reaches a hidden node it names,
     * so the item is described by it. The id the host gave it is kept, and one is given where it has
     * none; an id of the host's own in `aria-describedby` stays beside it, and the one the menu wrote
     * goes where the description has.
     */
    #describe(item: HTMLElement): void {
        const description = item.querySelector<HTMLElement>(':scope > [data-ui-description]');
        const written = this.#described.get(item);
        const ids = (item.getAttribute('aria-describedby') ?? '')
            .split(' ')
            .filter((id) => id !== '' && id !== written);

        if (description === null) {
            this.#described.delete(item);
        } else {
            if (description.id === '') {
                // Stryker disable next-line UpdateOperator: two descriptions on one page must get
                // different ids, and a decrementing counter delivers that as well as an
                // incrementing one. No input distinguishes them — an equivalent mutant.
                description.id = `ui-menu-description-${String(++sequence)}`;
            }

            description.setAttribute('aria-hidden', 'true');
            this.#described.set(item, description.id);

            if (!ids.includes(description.id)) {
                ids.push(description.id);
            }
        }

        if (ids.length === 0) {
            item.removeAttribute('aria-describedby');
        } else {
            item.setAttribute('aria-describedby', ids.join(' '));
        }
    }

    /**
     * Turns an item that ticks: a checkbox's state turns over, and a radio's goes to it from the
     * other radios of its section — or of the menu's own children, outside a section — and the item
     * announces `change`, which a press with the space bar fires where it fires no click.
     */
    #tick(item: HTMLElement): void {
        if (item.getAttribute('role') === 'menuitemcheckbox') {
            item.setAttribute('aria-checked', String(item.getAttribute('aria-checked') !== 'true'));
        } else {
            for (const other of this.#items()) {
                if (
                    other.parentElement === item.parentElement &&
                    other.matches('[role="menuitemradio"]')
                ) {
                    other.setAttribute('aria-checked', String(other === item));
                }
            }
        }

        item.dispatchEvent(new Event('change', { bubbles: true }));
    }

    /**
     * Ticks the item a click lands on, before anything else hears the click: in capture, on the
     * panel, which the click passes on its way to the item, so a listener on the item reads the state
     * the click set. The click goes on to close the menu, as any item's does.
     */
    readonly #onTick = (event: MouseEvent): void => {
        const path = event.composedPath();
        const item = this.#enabled().find((one) => path.includes(one));

        if (item?.matches(ticking) === true) {
            this.#tick(item);
        }
    };

    /** Opens onto an end of the list, which is the one thing a click cannot ask for. */
    readonly #onTriggerKey = (event: KeyboardEvent): void => {
        // A submenu's trigger is an item of the menu round it, which the arrows up and down move
        // over, and opens it by the arrow toward the inline end, as the APG's menu has it.
        if (this.#above !== undefined) {
            if (event.key === this.#toward()) {
                event.preventDefault();
                this.open = true;
            }

            return;
        }

        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
            return;
        }

        // Or the page scrolls under the menu that just opened.
        event.preventDefault();

        this.#fromEnd = event.key === 'ArrowUp';
        this.open = true;
    };

    readonly #onMenuKey = (event: KeyboardEvent): void => {
        // A key a submenu's panel took already, on its way out through this panel.
        if (event.defaultPrevented) {
            return;
        }

        // The arrow back, in a submenu: it closes, and the focus goes back to its trigger.
        if (this.#above !== undefined && event.key === this.#back()) {
            this.#returning = true;
            this.open = false;
            event.preventDefault();

            return;
        }

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
                // The platform closes it; this only says where the focus should land. A
                // submenu's keeps it from the menu round it, which the platform leaves open.
                this.#returning = true;

                if (this.#above !== undefined) {
                    event.stopPropagation();
                }

                return;
            case 'Tab':
                // The focus is already leaving and the default is what carries it there.
                // Closing without preventing is the whole of the APG rule.
                this.open = false;
                return;
            case ' ':
                // Part of a search in progress, so a label with a space in it can be typed
                // whole. Otherwise the key is the item's, as it is anywhere: a button clicks
                // itself on it, and the click closes the menu as Enter's does. A link is
                // followed on Enter and never on Space, and an item's activation stays the
                // platform's, so on a link the key does nothing, and moves no page under the
                // open menu either.
                // An item that ticks is ticked by the space bar and keeps the menu open, as the APG
                // asks, where Enter and a click tick it and close it as any item's do.
                if (this.#typed !== '') {
                    this.#type(event.key);
                } else if (event.target instanceof HTMLElement && event.target.matches(ticking)) {
                    this.#tick(event.target);
                } else if (event.target instanceof HTMLButtonElement) {
                    return;
                }

                break;
            default:
                if (event.key.length !== 1) {
                    return;
                }

                this.#type(event.key);
                break;
        }

        event.preventDefault();
    };

    /**
     * Choosing an item closes the menu, which is what makes it a menu rather than a panel.
     *
     * **The item is found on the click's path, not as its target.** A click names what it
     * landed on, and on an item that holds an icon or anything else of yours that is what the
     * item holds: compared with the items, a click on an item's icon chose it — the platform
     * clicked the item — and left the menu open over it.
     */
    readonly #onChoose = (event: MouseEvent): void => {
        const path = event.composedPath();
        const item = this.#enabled().find((one) => path.includes(one));

        // A submenu's trigger opens it; only a choice made in its panel closes this one too.
        if (item === undefined || (item instanceof UiMenu && !path.includes(item.#panel))) {
            return;
        }

        this.#returning = true;
        this.open = false;
    };

    /**
     * Writes the side the panel opens on before it is shown, which `toggle` alone does a frame
     * late.
     *
     * `toggle` comes in a task of its own, and a frame can be drawn before it: measured, the
     * first frame after a click drew the panel before `toggle` came. The platform places the panel
     * as it is shown, but writes nowhere which side it took, and an entrance comes from the side
     * written as it is first drawn. So the side is foretold here by the height the panel had when
     * it was last open, and read on `toggle` from where the panel landed. Only on the way in: a
     * panel on its way out leaves from the side the reader saw it on.
     */
    readonly #onBeforeToggle = (event: ToggleEvent): void => {
        if (event.newState === 'open') {
            this.#predict();
        }
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
            // The pointer's way to a submenu ends as it closes, whatever closed it.
            this.#crossed?.();
            this.#give();

            return;
        }

        // Again as it opens, for an item written into a section after the menu first wired its
        // items: a slot reports its own children, and a section's are not.
        this.#wire();
        this.#side();

        // Opened by the pointer resting on a submenu's trigger, the focus stays where it was, so
        // the submenu can close behind the pointer without dropping it.
        if (!this.#pointed) {
            this.#edge(this.#fromEnd);
        }

        this.#pointed = false;
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

    /**
     * Opens a submenu once the pointer has rested on its trigger, unless another submenu of the same
     * menu waits for the pointer on its way across, which what it crosses does not take from it. A
     * touch is no pointer resting: a tap opens the submenu as a press of its trigger does.
     */
    readonly #onRest = (event: PointerEvent): void => {
        const above = this.#above;

        if (above === undefined || event.pointerType === 'touch') {
            return;
        }

        // Back on the trigger, the submenu it opened no longer waits.
        this.#crossed?.();
        this.#opening = window.setTimeout(() => {
            if (!this.open && above.#waiting === undefined) {
                this.#pointed = true;
                this.open = true;
            }
        }, resting);
    };

    /**
     * Waits, as the pointer leaves an open submenu's trigger, for it to reach the submenu: across the
     * triangle from where it left, five pixels back, to the corners of the submenu's near edge, for
     * {@link crossing} at most. It closes the submenu as the pointer leaves that triangle or the time
     * runs out, and the wait ends where the pointer reaches the submenu or comes back to its trigger,
     * and as the submenu closes. Radix's area takes the submenu's far corners too, which only a
     * pointer over the submenu reaches, and its arrival there has ended the wait already.
     */
    readonly #onDepart = (event: PointerEvent): void => {
        window.clearTimeout(this.#opening);

        const above = this.#above;

        if (above === undefined || !this.open || event.pointerType === 'touch') {
            return;
        }

        const box = this.#panel.getBoundingClientRect();
        // Whether the submenu hangs ahead of its trigger or, turned, behind it: a panel a host
        // hangs flush against the trigger starts where the trigger ends, and is ahead.
        const ahead = box.left >= this.#trigger.getBoundingClientRect().right;
        const near = ahead ? box.left : box.right;
        const area: Point[] = [
            { x: event.clientX + (ahead ? -5 : 5), y: event.clientY },
            { x: near, y: box.top },
            { x: near, y: box.bottom },
        ];
        const watching = new AbortController();
        // Closing is all the wait does as it fails: the submenu closing is what ends it.
        const timer = window.setTimeout(() => {
            this.open = false;
        }, crossing);

        this.#crossed?.();
        this.#crossed = (): void => {
            watching.abort();
            window.clearTimeout(timer);
            this.#crossed = undefined;
            above.#waiting = undefined;
        };
        above.#waiting = this;

        document.addEventListener(
            'pointermove',
            (moved: PointerEvent) => {
                if (!inside(area, moved.clientX, moved.clientY)) {
                    this.open = false;
                }
            },
            { signal: watching.signal },
        );
    };

    /** The pointer has reached the submenu it was on its way to, which waits for it no longer. */
    readonly #onArrive = (): void => {
        this.#crossed?.();
    };

    /**
     * Makes the menu a submenu where it is written in another, or in a section of one, and a menu of
     * its own where it is not: its trigger an item of the menu round it, reached by that menu's keys
     * and out of the tab order, and drawn as an item, under the `submenu` state.
     */
    #nest(): void {
        const parent = this.parentElement;
        const trigger = this.#trigger;

        this.#above =
            parent instanceof UiMenu
                ? parent
                : parent?.matches('[role="group"]') === true &&
                    parent.parentElement instanceof UiMenu
                  ? parent.parentElement
                  : undefined;

        if (this.#above === undefined) {
            this.#internals.states.delete('submenu');
            trigger.removeAttribute('role');
            trigger.removeAttribute('tabindex');
        } else {
            this.#internals.states.add('submenu');
            trigger.setAttribute('role', 'menuitem');
            trigger.setAttribute('tabindex', '-1');
        }
    }

    /** The arrow toward the inline end, which opens a submenu: right, and left right to left. */
    #toward(): string {
        return this.matches(':dir(rtl)') ? 'ArrowLeft' : 'ArrowRight';
    }

    /** The arrow back, toward the inline start, which closes a submenu. */
    #back(): string {
        return this.matches(':dir(rtl)') ? 'ArrowRight' : 'ArrowLeft';
    }

    /**
     * {@inheritDoc HTMLElement.focus} The focus goes to the trigger, which is what the menu is
     * reached by, and how the menu round a submenu moves onto it.
     */
    override focus(options?: FocusOptions): void {
        this.#trigger.focus(options);
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

        order.find((item) => label(item).startsWith(this.#typed))?.focus();
    }

    /**
     * Writes the side the panel will open on: below where the room under its trigger holds the
     * panel and its gap as it was last open, and above where it does not, which is where the
     * platform's flip takes it.
     */
    #predict(): void {
        const room = document.documentElement.clientHeight - this.getBoundingClientRect().bottom;
        const gap = Number.parseFloat(getComputedStyle(this.#panel).marginBlockStart);

        this.#panel.setAttribute(side, room >= this.#height + gap ? 'block-end' : 'block-start');
    }

    /**
     * Writes which side of its trigger the panel landed on, read off where the platform put it,
     * and remembers its height for the next time it opens: above or below by the two middles,
     * which none of the panel's effects moves across.
     */
    #side(): void {
        const anchor = this.getBoundingClientRect();
        const box = this.#panel.getBoundingClientRect();

        this.#height = box.height;
        this.#panel.setAttribute(
            side,
            // Stryker disable next-line EqualityOperator: equivalent — two middles level are a
            // panel laid over its trigger's middle, which the platform never places it at.
            box.top + box.height / 2 < anchor.top + anchor.height / 2 ? 'block-start' : 'block-end',
        );
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

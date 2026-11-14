/**
 * Whether the keys reach an element — internal: the rule a tooltip's trigger is read by, and the
 * one a diagnosis will ask of it too. RFC 0011, #424
 *
 * **What the keys reach is what the platform stops at as the reader presses Tab**, the element or
 * anything it holds, in its own tree or in a shadow root drawn under it, **and what the arrows move
 * to inside a widget that takes one tab stop for everything it holds**. A `<ui-button>` takes no
 * focus itself and is reached by the control it draws, a box round a button is reached by the
 * button, and a `<ui-menu>`'s item, which Tab passes by, is reached by the arrows. RFC 0011 measured
 * the Tab half against where Tab lands in Chromium 153, Firefox 155 and WebKit 26.5, at eleven
 * triggers, and it matched at each.
 *
 * **The element is read by its kind, never matched against a selector**, since what calls this
 * runs from a listener, and a selector a slip empties throws where no test is listening.
 */

/**
 * The roles of a widget the arrows move through: a toolbar, a menu and a menu bar, a list box, a tab
 * list, a tree, a grid and a radio group. Each takes one tab stop for everything it holds, writes
 * `tabindex="-1"` on the rest and moves the focus among them itself, so Tab passes an item by and
 * the keys still reach it. A `<ui-menu>`'s items are `<button>`s with `tabindex="-1"`, slotted into
 * a panel with `role="menu"`.
 */
const widgets = new Set([
    'grid',
    'listbox',
    'menu',
    'menubar',
    'radiogroup',
    'tablist',
    'toolbar',
    'tree',
    'treegrid',
]);

/**
 * The element a node is drawn in: the slot it is assigned to, else its parent, else the host of
 * the shadow root it is in. Anything else a node can sit in, a page or a fragment, has no host,
 * which ends the walk below.
 */
function drawnIn(node: Element): unknown {
    return node.assignedSlot ?? node.parentElement ?? (node.getRootNode() as ShadowRoot).host;
}

/**
 * Whether a widget the arrows move through holds an element, wherever it is drawn: a menu draws
 * its panel in a shadow root and slots its items into it.
 *
 * **The step is the loop's own**, so a body a slip empties still walks to the end, rather than
 * holding the page while the runner waits it out.
 */
function roved(element: Element): boolean {
    for (let node = drawnIn(element); node instanceof Element; node = drawnIn(node)) {
        // `String()` reads a missing role as `null`, which no role in the set is.
        if (widgets.has(String(node.getAttribute('role')))) {
            return true;
        }
    }

    return false;
}

/** A control a page can disable. */
function control(
    element: Element,
): element is HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
    return (
        element instanceof HTMLButtonElement ||
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement
    );
}

/**
 * Whether the platform stops at an element itself as the reader presses Tab.
 *
 * **A `tabindex` written decides it**, at 0 or more, or at any value inside a widget the arrows
 * move through. Where none is, the elements that take one by themselves do: a link with an `href`,
 * an enabled control, a frame, a summary and an editable element. `tabIndex` alone cannot say it,
 * since an `<a>` with no `href` reports 0 and the keys pass it by, in the three engines.
 */
function stops(element: Element): boolean {
    if (element.hasAttribute('tabindex')) {
        return (element instanceof HTMLElement && element.tabIndex >= 0) || roved(element);
    }

    if (control(element)) {
        return !element.disabled;
    }

    return (
        ((element instanceof HTMLAnchorElement || element instanceof HTMLAreaElement) &&
            element.hasAttribute('href')) ||
        element instanceof HTMLIFrameElement ||
        element.localName === 'summary' ||
        (element instanceof HTMLElement && element.isContentEditable)
    );
}

/** Whether the keys reach an element or anything it holds, across the shadow roots under it. */
export function reached(element: Element): boolean {
    const root = element.shadowRoot;
    const held = root === null ? [...element.children] : [...element.children, ...root.children];

    return stops(element) || held.some(reached);
}

/**
 * Whether a trigger is one the keys never reach and that is no disabled control.
 *
 * **A disabled control is left out**: a tip on one is common, and meant to say why the control is
 * disabled, and RFC 0011 left it to `docs/tooltip.md`.
 */
export function unreachable(trigger: Element): boolean {
    return !(control(trigger) && trigger.disabled) && !reached(trigger);
}

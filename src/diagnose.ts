/**
 * `diagnose()`: everything the components can tell is wrong under a root, as data, said only when
 * a page asks. RFC 0011, #426
 *
 * **An entry of its own**, `@rak200/ui/diagnose.js`, beside the glyphs', so a page that never asks
 * loads none of it: nothing in the package imports this module, and the lines only a diagnosis says
 * are written here rather than in the components.
 *
 * **Asked, what is missing can be said.** No component knows when a page is done, so a tip, an
 * item or a glyph missing as it connects may still arrive, and RFC 0011 measured one arriving half a
 * second later and working. A page that asks says it is done, so the diagnosis says what is
 * missing, and what is written wrong besides.
 *
 * **It reads each element by its tag**, as the page wrote it, and walks into every shadow root it
 * can open, so the document reaches the components an app's own shell holds. What it shares with a
 * component is imported rather than written twice: whether the keys reach a trigger, whether a
 * trigger strands its description, whether a glyph is registered, and what each line that speaks
 * always says.
 *
 * **It leaves to axe the names axe reports**: an icon-only `<ui-button>`, a menu's trigger, a field,
 * a select and a checkbox with none, each critical there, so a page that runs both reads each once.
 * axe judges no radio group's name, and a dialog's only as best practice, so those two are here.
 */

import { info } from './console.js';
import { stranded } from './description.js';
import { registered } from './icon.js';
import * as lines from './lines.js';
import { unreachable } from './reach.js';

/** One thing the diagnosis found wrong. */
export interface Finding {
    /** Its code, which `docs/console.md` explains under a heading of its own. */
    readonly code: string;

    /** The element it is about, which the devtools reveal where the finding is logged. */
    readonly element: Element;

    /** What happened, what it costs and the way out, as a log line says it, without code or link. */
    readonly message: string;
}

/** How a page asks for a diagnosis. */
export interface DiagnoseOptions {
    /**
     * Whether to log what is new among the findings, at `info`, through the console manager. A
     * finding a warning or an earlier log has said is left out, and so is one the page has quieted
     * where the element is, with `data-ui-quiet`. The findings come back whole either way.
     */
    readonly log?: boolean;
}

/** A finding, and the cause the console manager remembers it by, once a page. */
interface Found {
    readonly finding: Finding;
    readonly cause: string;
}

/**
 * Notes a finding. Its cause is the element's tag, or for a value the page wrote, that value: an
 * icon's name, a density's.
 */
function note(
    found: Found[],
    code: string,
    element: Element,
    message: string,
    cause = element.localName,
): void {
    found.push({ finding: { code, element, message }, cause });
}

/** What a menu takes as an item, as `src/menu.ts` reads its children: a submenu among them. */
const item = 'button:not([slot]), a[href]:not([slot]), ui-menu';

/** A section of a menu's, whose items `src/menu.ts` takes as its own, and whose heading names it. */
const section = '[role="group"]';

/**
 * What a menu holds that is no item and no mistake: its trigger, a separator, and what a framework
 * writes beside the items without meaning one. Alpine keeps a `<template>` before the items it
 * writes, so a check that took one for a mistake would speak at every menu Alpine writes, which
 * RFC 0011 measured.
 */
const quiet = '[slot], hr, template, script, style';

/** A menu's children that are not items, what it is handed through a slot, and a menu with none. */
function menu(element: Element, found: Found[]): void {
    let meant = false;

    for (const child of element.children) {
        if (child.matches(quiet)) {
            continue;
        }

        meant = true;

        if (child.localName === 'slot') {
            note(
                found,
                'ui-menu:forwarded',
                child,
                `<ui-menu> is handed items through a <slot>, and takes none of them: it takes as ` +
                    `items only the <button>, the <a href> and the <ui-menu> written as its own ` +
                    `children or in a section it holds, so what the slot forwards is drawn as written and passed ` +
                    `over by the keys. Write the items as the menu's own children, in the tree the ` +
                    `menu is in.`,
            );
        } else if (!child.matches(item) && !child.matches(section)) {
            note(
                found,
                'ui-menu:not-an-item',
                child,
                `<ui-menu> holds a <${child.localName}> that is not an item: the menu takes as ` +
                    `items only the <button>, the <a href> and the <ui-menu> written as its own ` +
                    `children or in a section it holds, a role="group", so what this one holds is drawn as written, ` +
                    `passed over by the keys and left out of the menu's choices. Write each item ` +
                    `as the menu's own child, and what was round it, such as a tooltip, inside it.`,
            );
        }
    }

    if (!meant) {
        note(
            found,
            'ui-menu:no-items',
            element,
            `<ui-menu> holds no item, so it opens an empty panel. Write its items as its own ` +
                `children, each a <button> or an <a href>.`,
        );
    }
}

/**
 * A tooltip with no tip, and the two lines a tooltip speaks always, about the trigger it finds as
 * `src/tooltip.ts` finds it: the button or the link it lies in, or else its first child that is no
 * tip. A tooltip with no tip describes nothing, so its trigger is not asked about.
 */
function tooltip(element: Element, found: Found[]): void {
    if (element.querySelector(":scope > [slot='tip']") === null) {
        note(
            found,
            'ui-tooltip:no-tip',
            element,
            `<ui-tooltip> has no tip, so it describes nothing and shows nothing: the tip is the ` +
                `element written in it with slot="tip". Write one, or take the tooltip away.`,
        );

        return;
    }

    const trigger =
        element.closest('button, a[href]') ?? element.querySelector(':scope > :not([slot])');

    if (trigger === null) {
        return;
    }

    if (stranded(trigger)) {
        note(found, 'ui-tooltip:stranded', trigger, lines.stranded(trigger.localName));
    }

    if (unreachable(trigger)) {
        note(found, 'ui-tooltip:unreachable', trigger, lines.unreachable(trigger.localName));
    }
}

/** A toast outside a toaster, as `src/toast.ts` reads its parent. */
function toast(element: Element, found: Found[]): void {
    if (element.parentElement?.localName !== 'ui-toaster') {
        note(found, 'ui-toast:outside', element, lines.outside());
    }
}

/**
 * An icon that draws nothing it was asked to, as `src/icon.ts` reads it, and without its wait: a
 * page that asks says it is done, so a glyph not registered by then is not on its way.
 */
function icon(element: Element, found: Found[]): void {
    const name = element.getAttribute('name') ?? '';

    if (name !== '' && !registered(name) && element.children.length === 0) {
        note(found, 'ui-icon:unregistered', element, lines.unregistered(name), name);
    }
}

/** An `<option>` in a select, which draws only the `<ui-option>`s it holds. */
function select(element: Element, found: Found[]): void {
    for (const option of element.querySelectorAll('option')) {
        note(
            found,
            'ui-select:option',
            option,
            `<ui-select> holds an <option>, which it does not draw: its choices are the ` +
                `<ui-option> elements written in it, so this one is left out of the list and ` +
                `cannot be chosen. Write each choice as a <ui-option>.`,
        );
    }
}

/** A radio outside a group, which draws only the `<ui-radio>`s it holds. */
function radio(element: Element, found: Found[]): void {
    if (element.closest('ui-radio-group') === null) {
        note(
            found,
            'ui-radio:outside',
            element,
            `<ui-radio> is outside a <ui-radio-group>, so nothing draws it: a choice is drawn ` +
                `by the group it is written in. Write it inside its <ui-radio-group>.`,
        );
    }
}

/** A radio group with no label, whose name axe does not judge. */
function group(element: Element, found: Found[]): void {
    if ((element.getAttribute('label') ?? '').trim() === '') {
        note(
            found,
            'ui-radio-group:unnamed',
            element,
            `<ui-radio-group> has no label, so a screen reader announces its choices as a ` +
                `group with no name. Give it one with label="…".`,
        );
    }
}

/** A dialog with no title, whose name axe judges only as best practice. */
function dialog(element: Element, found: Found[]): void {
    const title = element.querySelector(":scope > [slot='title']");

    if ((title?.textContent ?? '').trim() === '') {
        note(
            found,
            'ui-dialog:unnamed',
            element,
            `<ui-dialog> has no title, so it opens with no name for a screen reader to ` +
                `announce. Write its heading in it with slot="title".`,
        );
    }
}

/**
 * A density the package does not have. There is one, `compact`, and no way to name another, so an
 * unknown one is a typo, where an unknown theme may be the page's own and is nothing to say.
 */
function density(element: Element, found: Found[]): void {
    const value = element.getAttribute('data-ui-density');

    if (value !== null && value !== 'compact') {
        note(
            found,
            'ui-density:unknown',
            element,
            `data-ui-density="${value}" names a density the package does not have, so the ` +
                `region keeps the default space and text. The one density is compact: write ` +
                `data-ui-density="compact".`,
            value,
        );
    }
}

/** The checks each element is asked, by its tag. */
const checks = new Map([
    ['ui-menu', menu],
    ['ui-tooltip', tooltip],
    ['ui-toast', toast],
    ['ui-icon', icon],
    ['ui-select', select],
    ['ui-radio', radio],
    ['ui-radio-group', group],
    ['ui-dialog', dialog],
]);

/** The elements a shadow root an element has opened holds, where it has one. */
function* drawn(element: Element): Generator<Element> {
    const root = element.shadowRoot;

    if (root !== null) {
        yield* within(root);
    }
}

/** Every element under a root, each followed by those its own shadow root holds. */
function* within(root: ParentNode): Generator<Element> {
    for (const element of root.querySelectorAll('*')) {
        yield element;
        yield* drawn(element);
    }
}

/**
 * Everything the components can tell is wrong under `root`, the document by default, as data.
 *
 * The root is walked into every shadow root it can open, and an element root is asked about as
 * well as what it holds. Nothing is printed unless the page asks for it with `log`, and the
 * findings come back whole whatever is logged and whatever the page has quieted.
 *
 * @returns Each finding in tree order, an element's own before what it holds: empty where every
 *   component is written the way it works, which is what a test asserts.
 */
export function diagnose(root: ParentNode = document, options: DiagnoseOptions = {}): Finding[] {
    const found: Found[] = [];
    const elements =
        root instanceof Element ? [root, ...drawn(root), ...within(root)] : within(root);

    for (const element of elements) {
        checks.get(element.localName)?.(element, found);
        density(element, found);
    }

    if (options.log === true) {
        for (const { finding, cause } of found) {
            info(finding.code, cause, finding.message, finding.element);
        }
    }

    return found.map(({ finding }) => finding);
}

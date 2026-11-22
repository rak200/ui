/**
 * `diagnose()`: what it finds under a root, as data, and what it logs when asked. RFC 0011, #426
 *
 * Every situation RFC 0011 measured is mounted here as a page writes it, and gives the finding the
 * RFC lists, or none: what a host writes in a menu, what four frameworks leave between its items,
 * the rest the components could say, and the five names axe reports, which the diagnosis leaves to
 * axe. Each message is compared in full.
 */

import { ReactiveElement } from 'lit';
import { afterEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { diagnose, type Finding } from '../src/diagnose.js';
import * as lines from '../src/lines.js';
import '../src/index.js';
import '../src/icons/x.js';

/** A trigger of someone else's, drawing a control in its own shadow root. */
class FocusesInside extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML = '<button type="button">Save</button>';
    }
}

customElements.define('test-diagnose-focuses-inside', FocusesInside);

/** A page's own component that forwards its items to the menu it draws, as RFC 0011 measured. */
class Actions extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML =
            '<ui-menu><span slot="trigger">Actions</span><slot></slot></ui-menu>';
    }
}

customElements.define('test-diagnose-actions', Actions);

/** An app's own shell, holding a menu written wrong in its shadow root. */
class Shell extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML =
            '<ui-menu><span slot="trigger">Actions</span><div><button type="button">Rename</button></div></ui-menu>';
    }
}

customElements.define('test-diagnose-shell', Shell);

/** A component of the page's own that draws a toast at the top of its shadow root. */
class DrawsAToast extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML =
            '<ui-toast duration="0">Draft saved.</ui-toast>';
    }
}

customElements.define('test-diagnose-draws-a-toast', DrawsAToast);

/** What each line only the diagnosis says reads, word for word. */
const said = {
    notAnItem: (tag: string): string =>
        `<ui-menu> holds a <${tag}> that is not an item: the menu takes as items only the ` +
        `<button>, the <a href> and the <ui-menu> written as its own children or in a section it ` +
        `holds, a role="group", so what this one holds is drawn as written, passed over by the keys and ` +
        `left out of the menu's choices. Write each item as the menu's own child, and what was ` +
        `round it, such as a tooltip, inside it.`,
    forwarded:
        '<ui-menu> is handed items through a <slot>, and takes none of them: it takes as items ' +
        'only the <button>, the <a href> and the <ui-menu> written as its own children or in a section it holds, ' +
        'so what the slot forwards is drawn as written and passed over by the keys. Write the ' +
        "items as the menu's own children, in the tree the menu is in.",
    noItems:
        '<ui-menu> holds no item, so it opens an empty panel. Write its items as its own ' +
        'children, each a <button> or an <a href>.',
    noTip:
        '<ui-tooltip> has no tip, so it describes nothing and shows nothing: the tip is the ' +
        'element written in it with slot="tip". Write one, or take the tooltip away.',
    option:
        '<ui-select> holds an <option>, which it does not draw: its choices are the <ui-option> ' +
        'elements written in it, so this one is left out of the list and cannot be chosen. ' +
        'Write each choice as a <ui-option>.',
    radio:
        '<ui-radio> is outside a <ui-radio-group>, so nothing draws it: a choice is drawn by the ' +
        'group it is written in. Write it inside its <ui-radio-group>.',
    group:
        '<ui-radio-group> has no label, so a screen reader announces its choices as a group ' +
        'with no name. Give it one with label="…".',
    dialog:
        '<ui-dialog> has no title, so it opens with no name for a screen reader to announce. ' +
        'Write its heading in it with slot="title".',
    density: (value: string): string =>
        `data-ui-density="${value}" names a density the package does not have, so the region ` +
        `keeps the default space and text. The one density is compact: write ` +
        `data-ui-density="compact".`,
};

/** `markup`, mounted as a page writes it, once every component it holds has drawn. */
async function mount(markup: string): Promise<HTMLElement> {
    const host = document.createElement('div');

    host.innerHTML = markup;
    document.body.append(host);

    for (const element of host.querySelectorAll('*')) {
        if (element instanceof ReactiveElement) {
            await element.updateComplete;
        }
    }

    return host;
}

/** The one element `selector` finds under `root`, so a fixture typo fails where it happened. */
function only(root: ParentNode, selector: string): Element {
    const found = root.querySelector(selector);

    if (found === null) {
        throw new Error(`no ${selector} in the fixture`);
    }

    return found;
}

/** A shadow root a fixture opened, which a diagnosis walks into. */
function opened(element: Element): ShadowRoot {
    const root = element.shadowRoot;

    if (root === null) {
        throw new Error(`no shadow root on <${element.localName}>`);
    }

    return root;
}

/**
 * Compares findings, each element by identity: an equality check reads two elements written
 * alike as one, and which element a finding is about is the half the devtools reveal.
 */
function expectFound(actual: readonly Finding[], expected: readonly Finding[]): void {
    expect(actual).toEqual(expected);

    for (const [index, finding] of expected.entries()) {
        expect(actual[index]?.element, `finding ${String(index)}`).toBe(finding.element);
    }
}

/** A menu with its trigger, holding `items`. */
const menu = (items: string): string =>
    `<ui-menu><span slot="trigger">Actions</span>${items}</ui-menu>`;

afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
});

describe('a menu, as RFC 0011 measured what a host writes in one', () => {
    it.each([
        [
            'items, an <hr>, a link and a disabled item',
            menu(
                '<button type="button">Rename</button><hr /><a href="#open">Open</a>' +
                    '<button type="button" disabled>Delete</button>',
            ),
        ],
        [
            'a hidden item',
            menu(
                '<button type="button" hidden>Archive</button><button type="button">Rename</button>',
            ),
        ],
        [
            'a <template> beside the items',
            menu(
                '<template><button type="button">Later</button></template>' +
                    '<button type="button">Rename</button>',
            ),
        ],
        [
            'a <style> and a <script>',
            menu(
                '<style>button { font: inherit; }</style><script type="application/json">{}</script>' +
                    '<button type="button">Rename</button>',
            ),
        ],
        [
            'a tooltip inside an item',
            menu(
                '<button type="button"><ui-tooltip>Rename<span slot="tip">Rename the invoice</span></ui-tooltip></button>',
            ),
        ],
        [
            'a submit button joined to a form outside, by form',
            '<form id="elsewhere"></form>' +
                menu('<button type="submit" form="elsewhere">Send</button>'),
        ],
    ])('finds nothing in %s', async (_name, markup) => {
        expect(diagnose(await mount(markup))).toEqual([]);
    });

    it.each([
        [
            'a tooltip round an item',
            menu(
                '<ui-tooltip><button type="button">Rename</button><span slot="tip">Rename it</span></ui-tooltip>' +
                    '<button type="button">Duplicate</button>',
            ),
            'ui-tooltip',
        ],
        [
            'a form round a submit button',
            menu(
                '<form><button type="submit">Send</button></form><button type="button">Rename</button>',
            ),
            'form',
        ],
        [
            'a <div> round two items',
            menu(
                '<div><button type="button">Rename</button><button type="button">Duplicate</button></div>' +
                    '<button type="button">Delete</button>',
            ),
            'div',
        ],
        [
            'a list round the items',
            menu('<ul><li><button type="button">Rename</button></li></ul>'),
            'ul',
        ],
        [
            'a checkbox in a label',
            menu(
                '<label><input type="checkbox" /> Pinned</label><button type="button">Rename</button>',
            ),
            'label',
        ],
        [
            'an <a> with no href',
            menu('<a>Open</a><button type="button">Rename</button>'),
            'ui-menu > a',
        ],
        [
            'a <span> naming a section',
            menu('<span>Recent</span><button type="button">Rename</button>'),
            'ui-menu > span:not([slot])',
        ],
        [
            'an <h3> naming a section',
            menu('<h3>Recent</h3><button type="button">Rename</button>'),
            'h3',
        ],
    ])('finds what is not an item in %s', async (_name, markup, selector) => {
        const host = await mount(markup);
        const child = only(host, selector);

        expectFound(diagnose(host), [
            {
                code: 'ui-menu:not-an-item',
                element: child,
                message: said.notAnItem(child.localName),
            },
        ]);
    });

    it('takes a section for no mistake, and a menu that holds only sections for one with items', async () => {
        const section =
            '<div role="group" aria-labelledby="sort"><span id="sort">Sort by</span>' +
            '<button type="button" role="menuitemradio" aria-checked="true">Name</button></div>';

        expect(
            diagnose(await mount(menu(`${section}<button type="button">Reset</button>`))),
        ).toEqual([]);
        expect(diagnose(await mount(menu(section))), 'sections alone').toEqual([]);
    });

    it('takes a submenu for an item, a menu written in another', async () => {
        const submenu =
            '<ui-menu><span slot="trigger">Share</span><button type="button">Copy the link</button></ui-menu>';

        expect(
            diagnose(await mount(menu(`<button type="button">Rename</button>${submenu}`))),
        ).toEqual([]);
    });

    it("finds each of a component's own elements round an item", async () => {
        const host = await mount(
            menu(
                '<x-item><button type="button">Rename</button></x-item>' +
                    '<x-item><button type="button">Duplicate</button></x-item>',
            ),
        );
        const [first, second] = host.querySelectorAll('x-item');

        if (first === undefined || second === undefined) {
            throw new Error('the fixture holds two x-item elements');
        }

        expectFound(diagnose(host), [
            { code: 'ui-menu:not-an-item', element: first, message: said.notAnItem('x-item') },
            { code: 'ui-menu:not-an-item', element: second, message: said.notAnItem('x-item') },
        ]);
    });

    it("finds the slot a page's component forwards its items to its menu through", async () => {
        const host = await mount(
            '<test-diagnose-actions><button type="button">Rename</button></test-diagnose-actions>',
        );
        const slot = only(opened(only(host, 'test-diagnose-actions')), 'ui-menu > slot');

        expectFound(diagnose(host), [
            { code: 'ui-menu:forwarded', element: slot, message: said.forwarded },
        ]);
    });

    it('finds a menu that holds no item, with its trigger and without it', async () => {
        const host = await mount(`${menu('<hr />')}<ui-menu></ui-menu>`);
        const [first, second] = host.querySelectorAll('ui-menu');

        if (first === undefined || second === undefined) {
            throw new Error('the fixture holds two menus');
        }

        expectFound(diagnose(host), [
            { code: 'ui-menu:no-items', element: first, message: said.noItems },
            { code: 'ui-menu:no-items', element: second, message: said.noItems },
        ]);
    });
});

describe('what four frameworks leave between the items, which RFC 0011 measured', () => {
    it.each([
        ['Lit, comments', menu('<!--?lit$1$--><button type="button">Rename</button><!--?-->')],
        [
            'Alpine, a <template> before them',
            menu(
                '<template x-for="item in items"><button type="button" x-text="item"></button></template>' +
                    '<button type="button">Rename</button>',
            ),
        ],
        [
            'Vue, empty text',
            menu('<button type="button">Rename</button>  <button type="button">Duplicate</button>'),
        ],
        ['React, nothing', menu('<button type="button">Rename</button>')],
    ])('finds nothing in what %s', async (_name, markup) => {
        expect(diagnose(await mount(markup))).toEqual([]);
    });
});

describe('a tooltip', () => {
    it('finds one with no tip, and asks nothing of its trigger', async () => {
        const host = await mount('<ui-tooltip><span>Draft</span></ui-tooltip>');

        expectFound(diagnose(host), [
            { code: 'ui-tooltip:no-tip', element: only(host, 'ui-tooltip'), message: said.noTip },
        ]);
    });

    it('finds a trigger the keys never reach, in the words the warning says', async () => {
        const host = await mount(
            '<ui-tooltip><span>Draft</span><span slot="tip">Saved two minutes ago.</span></ui-tooltip>',
        );

        expectFound(diagnose(host), [
            {
                code: 'ui-tooltip:unreachable',
                element: only(host, 'ui-tooltip > span:not([slot])'),
                message: lines.unreachable('span'),
            },
        ]);
    });

    it('finds the button a tooltip lies in, where the keys never reach it', async () => {
        const host = await mount(
            '<button type="button" tabindex="-1"><ui-tooltip>Save<span slot="tip">Saves.</span></ui-tooltip></button>',
        );

        expectFound(diagnose(host), [
            {
                code: 'ui-tooltip:unreachable',
                element: only(host, 'button'),
                message: lines.unreachable('button'),
            },
        ]);
    });

    it('finds a trigger that strands its description, in the words the warning says', async () => {
        // The tooltip says it as it wires the trigger, which is asked for here.
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        const host = await mount(
            '<ui-tooltip><test-diagnose-focuses-inside></test-diagnose-focuses-inside><span slot="tip">Saves.</span></ui-tooltip>',
        );

        expectFound(diagnose(host), [
            {
                code: 'ui-tooltip:stranded',
                element: only(host, 'test-diagnose-focuses-inside'),
                message: lines.stranded('test-diagnose-focuses-inside'),
            },
        ]);
    });

    it.each([
        ['a <button>', '<button type="button">Save</button>'],
        ['an <a href>', '<a href="#saved">Saved</a>'],
        ['a <ui-button>, which takes the sentence', '<ui-button>Save</ui-button>'],
        [
            'a disabled <button>, which the docs answer',
            '<button type="button" disabled>Save</button>',
        ],
    ])('finds nothing on %s', async (_name, trigger) => {
        const host = await mount(
            `<ui-tooltip>${trigger}<span slot="tip">Saves the draft.</span></ui-tooltip>`,
        );

        expect(diagnose(host)).toEqual([]);
    });

    it('finds nothing in one with a tip and no trigger, which describes nothing', async () => {
        const host = await mount('<ui-tooltip><span slot="tip">Saves.</span></ui-tooltip>');

        expect(diagnose(host)).toEqual([]);
    });

    it('finds nothing in a link inside a tip, which Tab reaches as it should', async () => {
        const host = await mount(
            '<ui-tooltip><button type="button">Help</button><span slot="tip">See <a href="#docs">the docs</a>.</span></ui-tooltip>',
        );

        expect(diagnose(host)).toEqual([]);
    });
});

describe('a toast', () => {
    it('finds one outside a toaster, in the words the warning says', async () => {
        // The toast says it as it connects, which is asked for here.
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        const host = await mount('<main><ui-toast duration="0">Invoice sent.</ui-toast></main>');

        expectFound(diagnose(host), [
            { code: 'ui-toast:outside', element: only(host, 'ui-toast'), message: lines.outside() },
        ]);
    });

    it('finds one at the top of a shadow root, which has no parent element', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        const host = await mount('<test-diagnose-draws-a-toast></test-diagnose-draws-a-toast>');
        const toast = only(opened(only(host, 'test-diagnose-draws-a-toast')), 'ui-toast');

        expectFound(diagnose(host), [
            { code: 'ui-toast:outside', element: toast, message: lines.outside() },
        ]);
    });

    it('finds nothing in a toaster', async () => {
        const host = await mount(
            '<ui-toaster><ui-toast duration="0">Invoice sent.</ui-toast></ui-toaster>',
        );

        expect(diagnose(host)).toEqual([]);
    });
});

describe('an icon', () => {
    it('finds a name with no glyph registered, without the wait the warning takes', async () => {
        const host = await mount('<ui-icon name="pencl"></ui-icon>');

        expectFound(diagnose(host), [
            {
                code: 'ui-icon:unregistered',
                element: only(host, 'ui-icon'),
                message: lines.unregistered('pencl'),
            },
        ]);
    });

    it.each([
        ['a registered glyph', '<ui-icon name="x"></ui-icon>'],
        ['no name at all', '<ui-icon></ui-icon>'],
        [
            'a mark slotted in its place',
            '<ui-icon name="our-mark" label="Our mark"><svg viewBox="0 0 24 24"><path d="M12 2 2 22h20Z" /></svg></ui-icon>',
        ],
    ])('finds nothing for %s', async (_name, markup) => {
        expect(diagnose(await mount(markup))).toEqual([]);
    });
});

describe('the rest the components could say, which RFC 0011 measured', () => {
    it('finds each <option> in a select, which draws only its <ui-option>s', async () => {
        const host = await mount(
            '<ui-select label="Size"><option>Small</option><option>Large</option></ui-select>',
        );
        const [small, large] = host.querySelectorAll('option');

        if (small === undefined || large === undefined) {
            throw new Error('the fixture holds two options');
        }

        expectFound(diagnose(host), [
            { code: 'ui-select:option', element: small, message: said.option },
            { code: 'ui-select:option', element: large, message: said.option },
        ]);
    });

    it('finds a radio outside a group', async () => {
        const host = await mount('<ui-radio value="monthly">Monthly</ui-radio>');

        expectFound(diagnose(host), [
            { code: 'ui-radio:outside', element: only(host, 'ui-radio'), message: said.radio },
        ]);
    });

    it.each([
        ['no label', '<ui-radio-group><ui-radio value="a">Monthly</ui-radio></ui-radio-group>'],
        [
            'a label of white space',
            '<ui-radio-group label="  "><ui-radio value="a">Monthly</ui-radio></ui-radio-group>',
        ],
    ])('finds a radio group with %s', async (_name, markup) => {
        const host = await mount(markup);

        expectFound(diagnose(host), [
            {
                code: 'ui-radio-group:unnamed',
                element: only(host, 'ui-radio-group'),
                message: said.group,
            },
        ]);
    });

    it.each([
        ['no title', '<ui-dialog><p>Delete the account?</p></ui-dialog>'],
        [
            'a title of white space',
            '<ui-dialog><h2 slot="title"> </h2><p>Delete the account?</p></ui-dialog>',
        ],
    ])('finds a dialog with %s', async (_name, markup) => {
        const host = await mount(markup);

        expectFound(diagnose(host), [
            { code: 'ui-dialog:unnamed', element: only(host, 'ui-dialog'), message: said.dialog },
        ]);
    });

    it('finds a density the package does not have', async () => {
        const host = await mount('<section data-ui-density="compacted"></section>');

        expectFound(diagnose(host), [
            {
                code: 'ui-density:unknown',
                element: only(host, 'section'),
                message: said.density('compacted'),
            },
        ]);
    });

    it.each([
        [
            'a radio in a group, and a group with a label',
            '<ui-radio-group label="Plan"><ui-radio value="a">Monthly</ui-radio></ui-radio-group>',
        ],
        [
            'a select of <ui-option>s',
            '<ui-select label="Size"><ui-option value="s">Small</ui-option></ui-select>',
        ],
        [
            'a dialog with a title',
            '<ui-dialog><h2 slot="title">Delete account</h2><p>Delete it?</p></ui-dialog>',
        ],
        ['the compact density', '<section data-ui-density="compact"></section>'],
        [
            'a theme the package does not ship, which may be the page own',
            '<div data-ui-theme="yours"></div>',
        ],
        ['a placeholder as a field only name', '<ui-input placeholder="Name"></ui-input>'],
    ])('finds nothing in %s', async (_name, markup) => {
        expect(diagnose(await mount(markup))).toEqual([]);
    });
});

describe('the five names axe reports, which the diagnosis leaves to axe', () => {
    it.each([
        ['an icon-only <ui-button>', '<ui-button><ui-icon name="x"></ui-icon></ui-button>'],
        [
            "a menu's trigger",
            '<ui-menu><span slot="trigger"></span><button type="button">Rename</button></ui-menu>',
        ],
        ['a <ui-input>', '<ui-input></ui-input>'],
        ['a <ui-select>', '<ui-select><ui-option value="s">Small</ui-option></ui-select>'],
        ['a <ui-checkbox>', '<ui-checkbox></ui-checkbox>'],
    ])('finds nothing in %s with no name', async (_name, markup) => {
        expect(diagnose(await mount(markup))).toEqual([]);
    });
});

describe('the walk', () => {
    it("finds what an app's own shadow root holds, from the document", async () => {
        const host = await mount('<test-diagnose-shell></test-diagnose-shell>');
        const box = only(opened(only(host, 'test-diagnose-shell')), 'ui-menu > div');
        const expected = [
            { code: 'ui-menu:not-an-item', element: box, message: said.notAnItem('div') },
        ];

        expectFound(diagnose(document), expected);
        expectFound(diagnose(), expected);
    });

    it('asks an element root about itself, and about what its shadow root holds', async () => {
        const host = await mount('<ui-menu></ui-menu><test-diagnose-shell></test-diagnose-shell>');
        const shell = only(host, 'test-diagnose-shell');

        expectFound(diagnose(only(host, 'ui-menu')), [
            { code: 'ui-menu:no-items', element: only(host, 'ui-menu'), message: said.noItems },
        ]);
        expectFound(diagnose(shell), [
            {
                code: 'ui-menu:not-an-item',
                element: only(opened(shell), 'ui-menu > div'),
                message: said.notAnItem('div'),
            },
        ]);
    });

    it('reads a page whose components have not upgraded, as the page wrote it', () => {
        // A document the parser made has no browsing context, so nothing in it upgrades and no
        // property is reflected: an icon with no name and a group with no label carry no
        // attribute at all, which reads as empty.
        const page = new DOMParser().parseFromString(
            '<ui-icon></ui-icon><ui-icon name="pencl"></ui-icon>' +
                '<ui-radio-group><ui-radio value="a">Monthly</ui-radio></ui-radio-group>',
            'text/html',
        );
        const [, named] = page.querySelectorAll('ui-icon');

        if (named === undefined) {
            throw new Error('the page holds two icons');
        }

        expect(only(page, 'ui-icon').hasAttribute('name'), 'not upgraded').toBe(false);
        expectFound(diagnose(page), [
            {
                code: 'ui-icon:unregistered',
                element: named,
                message: lines.unregistered('pencl'),
            },
            {
                code: 'ui-radio-group:unnamed',
                element: only(page, 'ui-radio-group'),
                message: said.group,
            },
        ]);
    });

    it("finds nothing in a template's content, which is no part of the page", async () => {
        const host = await mount('<template><ui-menu></ui-menu><ui-radio></ui-radio></template>');

        expect(diagnose(host)).toEqual([]);
    });

    it("finds in tree order, an element's own findings before what it holds", async () => {
        const host = await mount(
            '<section data-ui-density="tight"><ui-menu data-ui-density="snug"></ui-menu></section>',
        );
        const section = only(host, 'section');
        const held = only(host, 'ui-menu');

        expectFound(diagnose(host), [
            { code: 'ui-density:unknown', element: section, message: said.density('tight') },
            { code: 'ui-menu:no-items', element: held, message: said.noItems },
            { code: 'ui-density:unknown', element: held, message: said.density('snug') },
        ]);
    });
});

describe('logging', () => {
    /** The console's `info`, which is where a diagnosis logs, taken for the test. */
    function hear(): MockInstance<Console['info']> {
        return vi.spyOn(console, 'info').mockImplementation(() => undefined);
    }

    it('prints nothing unless asked, and returns the findings', async () => {
        const heard = hear();
        const host = await mount('<ui-menu></ui-menu>');

        expect(diagnose(host)).toHaveLength(1);
        expect(heard).not.toHaveBeenCalled();
    });

    it('logs each finding at info, through the manager, with its code, its link and its element', async () => {
        const heard = hear();
        const host = await mount('<ui-menu></ui-menu>');

        diagnose(host, { log: true });

        expect(heard).toHaveBeenCalledOnce();
        expect(heard).toHaveBeenCalledWith(
            `[ui-menu:no-items] ${said.noItems} ` +
                'https://github.com/rak200/ui/blob/master/docs/console.md#ui-menuno-items',
            only(host, 'ui-menu'),
        );
    });

    it('says each finding once, logged twice, and returns them all both times', async () => {
        const heard = hear();
        const host = await mount('<ui-menu></ui-menu>');

        expect(diagnose(host, { log: true })).toHaveLength(1);
        expect(diagnose(host, { log: true })).toHaveLength(1);
        expect(heard).toHaveBeenCalledOnce();
    });

    it('says a cause once a page, and each other cause besides', async () => {
        const heard = hear();
        const host = await mount(
            menu('<div></div><div></div><h3>Recent</h3><button type="button">Rename</button>') +
                '<ui-icon name="pencl"></ui-icon><ui-icon name="pencl"></ui-icon><ui-icon name="trsh"></ui-icon>' +
                '<p data-ui-density="tight"></p><p data-ui-density="tight"></p><p data-ui-density="snug"></p>',
        );

        expect(diagnose(host, { log: true })).toHaveLength(9);
        expect(heard.mock.calls.map(([line]) => String(line).split(' ')[0])).toEqual([
            '[ui-menu:not-an-item]',
            '[ui-menu:not-an-item]',
            '[ui-icon:unregistered]',
            '[ui-icon:unregistered]',
            '[ui-density:unknown]',
            '[ui-density:unknown]',
        ]);
        expect(String(heard.mock.calls[1]?.[0])).toContain('holds a <h3>');
        expect(String(heard.mock.calls[3]?.[0])).toContain('name="trsh"');
        expect(String(heard.mock.calls[5]?.[0])).toContain('"snug"');
    });

    it('never says what a warning has said', async () => {
        const warned = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const heard = hear();
        const host = await mount('<main><ui-toast duration="0">Invoice sent.</ui-toast></main>');

        expect(warned).toHaveBeenCalledOnce();
        expect(diagnose(host, { log: true })).toHaveLength(1);
        expect(heard).not.toHaveBeenCalled();
    });

    it('leaves out what the page quieted where the element is, and still returns it', async () => {
        const heard = hear();
        const host = await mount('<div data-ui-quiet="ui-menu:no-items"><ui-menu></ui-menu></div>');

        expect(diagnose(host, { log: true })).toHaveLength(1);
        expect(heard).not.toHaveBeenCalled();
    });
});

describe('the entry', () => {
    it("is @rak200/ui/diagnose.js, an entry of its own, and the barrel's is not", async () => {
        const entry = await import('@rak200/ui/diagnose.js');
        const barrel = await import('@rak200/ui');

        expect(entry.diagnose).toBe(diagnose);
        expect('diagnose' in barrel).toBe(false);
    });
});

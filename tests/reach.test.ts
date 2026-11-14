/**
 * Whether the keys reach an element, which is what a tooltip's trigger is read by. RFC 0011, #424
 *
 * The cases are the eleven RFC 0011 measured against where Tab lands in three engines, the kinds of
 * element the rule names besides, and an item of each widget the arrows move through, each read
 * straight off the rule with no console between.
 */

import { ReactiveElement } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { reached, unreachable } from '../src/reach.js';
import '../src/button.js';
import '../src/menu.js';

/** A control drawn in a shadow root, as a component of someone else's draws one. */
class DrawsAButton extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML = '<button type="button">Save</button>';
    }
}

customElements.define('test-draws-a-button', DrawsAButton);

/** A widget the arrows move through, drawn in a shadow root with its items slotted in, as a menu is. */
class DrawsAToolbar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML =
            '<div role="toolbar" aria-label="Format"><slot></slot></div>';
    }
}

customElements.define('test-draws-a-toolbar', DrawsAToolbar);

/** An item drawn in a shadow root, taken out of the tab order as a widget round it would take it. */
class DrawsAnItem extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML =
            '<button type="button" tabindex="-1">Bold</button>';
    }
}

customElements.define('test-draws-an-item', DrawsAnItem);

/** The element of `markup` that `selector` finds, its first by default, mounted and drawn. */
async function element(markup: string, selector = ':scope > *'): Promise<Element> {
    const host = document.createElement('div');

    host.innerHTML = markup;
    document.body.append(host);

    for (const each of host.querySelectorAll('*')) {
        if (each instanceof ReactiveElement) {
            await each.updateComplete;
        }
    }

    const found = host.querySelector(selector);

    if (found === null) {
        throw new Error(`no ${selector} in the fixture`);
    }

    return found;
}

afterEach(() => {
    document.body.replaceChildren();
});

describe('the keys reach', () => {
    it.each([
        ['a <button>', '<button type="button">Save</button>'],
        ['an <a href>', '<a href="#saved">Saved</a>'],
        ['an <area href>', '<area href="#saved" alt="Saved" />'],
        ['an <input>', '<input aria-label="Name" />'],
        ['a <select>', '<select aria-label="Size"><option>Small</option></select>'],
        ['a <textarea>', '<textarea aria-label="Note"></textarea>'],
        ['an <iframe>', '<iframe title="A frame"></iframe>'],
        ['a <details>, by its <summary>', '<details><summary>More</summary>Hidden.</details>'],
        ['an editable element', '<span contenteditable="true">Draft</span>'],
        ['an element with tabindex="0"', '<span tabindex="0">Draft</span>'],
        ['a <ui-button>, by the control it draws', '<ui-button>Save</ui-button>'],
        [
            'a <ui-menu>, by its trigger',
            '<ui-menu><span slot="trigger">Actions</span><button type="button">Rename</button></ui-menu>',
        ],
        ['a control drawn in a shadow root', '<test-draws-a-button></test-draws-a-button>'],
        ['a box round a button', '<div><button type="button">Save</button></div>'],
        ['a box round a <ui-button>', '<div><ui-button>Save</ui-button></div>'],
    ])('%s', async (_name, markup) => {
        expect(reached(await element(markup))).toBe(true);
    });
});

describe('the keys never reach', () => {
    it.each([
        ['a <span>', '<span>Draft</span>'],
        ['an <a> with no href', '<a>Draft</a>'],
        ['an element with tabindex="-1"', '<span tabindex="-1">Draft</span>'],
        ['a disabled <button>', '<button type="button" disabled>Save</button>'],
        ['a disabled <input>', '<input aria-label="Name" disabled />'],
        ['a box round a <span>', '<div><span>Draft</span></div>'],
    ])('%s', async (_name, markup) => {
        expect(reached(await element(markup))).toBe(false);
    });
});

describe('the arrows reach, inside a widget that takes one tab stop for all it holds', () => {
    it.each([
        'grid',
        'listbox',
        'menu',
        'menubar',
        'radiogroup',
        'tablist',
        'toolbar',
        'tree',
        'treegrid',
    ])('an element with tabindex="-1" in a %s', async (role) => {
        const item = await element(
            `<div role="${role}"><span tabindex="-1">Item</span></div>`,
            '[tabindex]',
        );

        expect(reached(item)).toBe(true);
    });

    it('an element with tabindex="-1" in a group inside one', async () => {
        const item = await element(
            '<div role="toolbar"><div role="group"><button type="button" tabindex="-1">Bold</button></div></div>',
            '[tabindex]',
        );

        expect(reached(item)).toBe(true);
    });

    it('an item slotted into one drawn in a shadow root, as a menu slots its items', async () => {
        const item = await element(
            '<test-draws-a-toolbar><span tabindex="-1">Bold</span></test-draws-a-toolbar>',
            '[tabindex]',
        );

        expect(reached(item)).toBe(true);
    });

    it('an item drawn in a shadow root, in one round the host', async () => {
        const drawn = await element(
            '<div role="toolbar"><test-draws-an-item></test-draws-an-item></div>',
            'test-draws-an-item',
        );

        expect(reached(drawn)).toBe(true);
    });
});

describe('the arrows never reach', () => {
    it('an element with tabindex="-1" in a group, which no arrow moves through', async () => {
        const item = await element(
            '<div role="group"><span tabindex="-1">Item</span></div>',
            '[tabindex]',
        );

        expect(reached(item)).toBe(false);
    });

    it('an item drawn in a shadow root, with no widget round the host', async () => {
        const drawn = await element(
            '<div><test-draws-an-item></test-draws-an-item></div>',
            'test-draws-an-item',
        );

        expect(reached(drawn)).toBe(false);
    });

    it('an element in one that takes no focus at all', async () => {
        const item = await element('<div role="toolbar"><span>Bold</span></div>', 'span');

        expect(reached(item)).toBe(false);
    });
});

describe('a trigger the warning is about', () => {
    it('is one the keys never reach', async () => {
        expect(unreachable(await element('<span>Draft</span>'))).toBe(true);
    });

    it("is never a disabled control, which is the docs' alone", async () => {
        expect(unreachable(await element('<button type="button" disabled>Save</button>'))).toBe(
            false,
        );
    });

    it('is never one the keys reach', async () => {
        expect(unreachable(await element('<button type="button">Save</button>'))).toBe(false);
    });
});

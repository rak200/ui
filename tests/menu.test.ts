import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
// The playwright provider is what puts `send` on `CDPSession` — see `button.test.ts`,
// which needs the same line for the same reason.
import type {} from '@vitest/browser-playwright';
import { expectAccessible } from './a11y.js';
import { mountStory } from './stories.js';
import meta, { AtTheEdge, Disabled, Links, Menu } from '../stories/menu.stories.js';
import '../src/menu.js';
import '../src/button.js';
import { reference } from '../src/reference.js';
import type { DerivedToken, Token } from '../src/tokens.js';
import type { UiMenu } from '../src/menu.js';

/** The markup the behavioural tests use, unless one needs a different shape. */
const fixture = `
    <ui-menu>
        <span slot="trigger">Actions</span>
        <button type="button">Rename</button>
        <button type="button">Duplicate</button>
        <hr />
        <button type="button" disabled>Delete</button>
        <button type="button">Export</button>
    </ui-menu>
`;

/** Long enough for the typeahead buffer to be forgotten, which is half a second. */
const forgotten = 700;

async function mount(markup: string): Promise<HTMLElement> {
    const host = document.createElement('div');
    host.innerHTML = markup;
    document.body.append(host);

    for (const element of host.querySelectorAll('ui-menu, ui-button')) {
        await (element as UiMenu).updateComplete;
    }

    return host;
}

/** The one element a selector has to match, so a fixture typo fails where it happened. */
function only(host: ParentNode, selector: string): HTMLElement {
    const found = host.querySelector<HTMLElement>(selector);

    if (found === null) {
        throw new Error(`no ${selector} in the fixture`);
    }

    return found;
}

const menu = (host: ParentNode): UiMenu => only(host, 'ui-menu') as UiMenu;

/** A component's own element, which is the whole point of this one: nobody can miswire it. */
function inner(element: Element, selector: string): HTMLElement {
    const found = element.shadowRoot?.querySelector<HTMLElement>(selector) ?? null;

    if (found === null) {
        throw new Error(`${element.tagName} rendered no ${selector}`);
    }

    return found;
}

const trigger = (element: UiMenu): HTMLElement => inner(element, 'button');
const panel = (element: UiMenu): HTMLElement => inner(element, '[popover]');
const caret = (element: UiMenu): HTMLElement => inner(element, 'svg');

/** The items, which are the host's own controls. */
function items(host: ParentNode): HTMLElement[] {
    return [...host.querySelectorAll<HTMLElement>('ui-menu > button, ui-menu > a')];
}

/** One item, by position, so a fixture that lost one fails where it happened. */
function item(host: ParentNode, index: number): HTMLElement {
    const found = items(host)[index];

    if (found === undefined) {
        throw new Error(`no item ${String(index)} in the fixture`);
    }

    return found;
}

/**
 * A key, dispatched so the event itself can be read back afterwards.
 *
 * `userEvent.keyboard` is what a reader does and is what the rest of this file uses. This
 * is for the one thing it cannot hand back — the event — and what that carries is whether
 * the handler reached its last line. A handler that threw halfway leaves the focus exactly
 * where a handler that found nothing leaves it, and the browser swallows the error, so
 * `defaultPrevented` is the only place the difference shows.
 */
function keydown(element: HTMLElement, key: string): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    element.dispatchEvent(event);

    return event;
}

/** What has the focus, said as the label a reader would recognise. */
function focused(): string {
    return document.activeElement?.textContent.trim() ?? '(nothing)';
}

/** Opens the menu the way a reader does, and settles the frame the placement needs. */
async function open(element: UiMenu): Promise<void> {
    await userEvent.click(trigger(element));
    await settle();
}

/** Lets a toggle, a placement and a focus move land before anything reads them. */
async function settle(): Promise<void> {
    await new Promise((resolve) => {
        requestAnimationFrame(() => {
            resolve(null);
        });
    });
}

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

/**
 * What a token computes to here, so an assertion names the token rather than its value.
 *
 * Comparing against the literal would compare the component's CSS with the constant that
 * produced it — a check no change of value can fail.
 */
function resolved(token: Token | DerivedToken): string {
    const probe = document.createElement('div');
    probe.style.color = String(reference(token));
    document.body.append(probe);

    try {
        return getComputedStyle(probe).color;
    } finally {
        probe.remove();
    }
}

/** Holds the pointer down, or lets go, for the one state a hover cannot reach. */
async function press(element: Element, down: boolean): Promise<void> {
    const box = element.getBoundingClientRect();

    await cdp().send('Input.dispatchMouseEvent', {
        type: down ? 'mousePressed' : 'mouseReleased',
        x: box.left + box.width / 2,
        y: box.top + box.height / 2,
        button: 'left',
        buttons: down ? 1 : 0,
        clickCount: 1,
    });
}

/** Moves the pointer out of the way, because nothing in the page can — see checkbox.test.ts. */
async function parkPointer(): Promise<void> {
    await cdp().send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1, buttons: 0 });
}

beforeEach(parkPointer);

afterEach(async () => {
    await press(document.body, false);
    await parkPointer();

    document.body.replaceChildren();
});

describe('ui-menu', () => {
    it('registers itself as a custom element', () => {
        expect(customElements.get('ui-menu')).toBeDefined();
    });

    it('owns both ends of the relationship, which is what makes it unmiswirable', async () => {
        const host = await mount(fixture);
        const element = menu(host);

        expect(trigger(element).getAttribute('aria-haspopup')).toBe('menu');
        expect(trigger(element).getAttribute('aria-controls')).toBe(panel(element).id);
        expect(trigger(element).getAttribute('popovertarget')).toBe(panel(element).id);
        // Both ends in one tree scope, which is the only reason an IDREF resolves at all
        // here — `ARCHITECTURE.md` carries the measurement that it never crosses.
        expect(element.shadowRoot?.getElementById(panel(element).id)).toBe(panel(element));
    });

    it('needs no counter behind the id, because a shadow root is its own tree scope', async () => {
        const host = await mount(`${fixture}${fixture}`);
        const both = [...host.querySelectorAll<UiMenu>('ui-menu')];
        const [first, second] = both;

        if (first === undefined || second === undefined) {
            throw new Error('the fixture did not mount two menus');
        }

        expect(panel(first).id).toBe(panel(second).id);
        expect(first.shadowRoot?.getElementById(panel(first).id)).toBe(panel(first));
    });

    it('makes the panel a menu, and an auto popover', async () => {
        const host = await mount(fixture);

        expect(panel(menu(host)).getAttribute('role')).toBe('menu');
        expect(panel(menu(host)).getAttribute('popover')).toBe('auto');
    });

    it('leaves the items in the light DOM, where they stay yours', async () => {
        const host = await mount(fixture);

        for (const item of items(host)) {
            expect(item.parentElement).toBe(menu(host));
        }

        expect(menu(host).shadowRoot?.querySelector('[role=menuitem]')).toBeNull();
    });

    it('makes each item a menu item, and the menu one tab stop', async () => {
        const host = await mount(fixture);

        for (const item of items(host)) {
            expect(item.getAttribute('role'), item.textContent).toBe('menuitem');
            expect(item.getAttribute('tabindex'), item.textContent).toBe('-1');
        }
    });

    it('wires an item a framework added later', async () => {
        const host = await mount(fixture);
        const added = document.createElement('button');
        added.type = 'button';
        added.textContent = 'Archive';

        menu(host).append(added);
        await settle();

        expect(added.getAttribute('role')).toBe('menuitem');
        expect(added.getAttribute('tabindex')).toBe('-1');
    });

    it('leaves a separator alone, which already claims the role it needs', async () => {
        // Measured: an `<hr>` carries an implicit `role="separator"`, so what it means is
        // the platform's and only what it looks like is this component's.
        const host = await mount(fixture);

        expect(only(host, 'hr').hasAttribute('role')).toBe(false);
        expect(only(host, 'hr').hasAttribute('tabindex')).toBe(false);
    });

    it('names display under the open state only, so a closed menu takes no space', async () => {
        // The user agent hides a closed popover with `display: none`, and an author rule
        // naming `display` unconditionally outranks it — the trap `src/dialog.ts` fell into.
        const host = await mount(fixture);

        expect(getComputedStyle(panel(menu(host))).display).toBe('none');

        await open(menu(host));

        expect(getComputedStyle(panel(menu(host))).display).toBe('flex');
    });

    it('takes the top layer rather than a z-index', async () => {
        const host = await mount(fixture);
        await open(menu(host));

        expect(getComputedStyle(panel(menu(host))).zIndex).toBe('auto');
        expect(
            String((customElements.get('ui-menu') as unknown as { styles: unknown }).styles),
        ).not.toContain('z-index');
    });

    it('is accessible, closed and open', async () => {
        const host = await mount(fixture);

        await expectAccessible(host);

        await open(menu(host));

        await expectAccessible(host);
    });
});

describe('opening and closing', () => {
    it('opens on a click, and lands on the first item', async () => {
        const host = await mount(fixture);

        await open(menu(host));

        expect(menu(host).open).toBe(true);
        expect(trigger(menu(host)).getAttribute('aria-expanded')).toBe('true');
        expect(focused()).toBe('Rename');
    });

    it('says it is closed before anything has opened it', async () => {
        const host = await mount(fixture);

        expect(menu(host).open).toBe(false);
        expect(trigger(menu(host)).getAttribute('aria-expanded')).toBe('false');
    });

    it('closes on a second click rather than reopening', async () => {
        // A click on the trigger of an open `auto` popover light-dismisses it *and* reaches
        // any handler, so a hand-rolled toggle closes and reopens in one click. The
        // platform's own invoker is what this delegates to, and this is the assertion that
        // says so.
        const host = await mount(fixture);

        await open(menu(host));
        await userEvent.click(trigger(menu(host)));
        await settle();

        expect(menu(host).open).toBe(false);
    });

    it('opens onto the first item on ArrowDown', async () => {
        const host = await mount(fixture);

        trigger(menu(host)).focus();
        await userEvent.keyboard('{ArrowDown}');
        await settle();

        expect(menu(host).open).toBe(true);
        expect(focused()).toBe('Rename');
    });

    it('opens onto the last item on ArrowUp, which is the one thing a click cannot ask', async () => {
        const host = await mount(fixture);

        trigger(menu(host)).focus();
        await userEvent.keyboard('{ArrowUp}');
        await settle();

        expect(focused()).toBe('Export');
    });

    it('forgets which end the last opening asked for', async () => {
        const host = await mount(fixture);
        const element = menu(host);

        trigger(element).focus();
        await userEvent.keyboard('{ArrowUp}');
        await settle();

        expect(focused(), 'ArrowUp asked for the end').toBe('Export');

        await userEvent.keyboard('{Escape}');
        await settle();
        await open(element);

        expect(focused(), 'and a plain click asks for nothing').toBe('Rename');
    });

    it('leaves every other key on the trigger alone', async () => {
        const host = await mount(fixture);

        trigger(menu(host)).focus();
        await userEvent.keyboard('x');
        await settle();

        expect(menu(host).open).toBe(false);
    });

    it('closes on Escape and hands the focus back', async () => {
        const host = await mount(fixture);
        await open(menu(host));

        await userEvent.keyboard('{Escape}');
        await settle();

        expect(menu(host).open).toBe(false);
        expect(menu(host).shadowRoot?.activeElement, 'back on the trigger').toBe(
            trigger(menu(host)),
        );
    });

    it('closes when an item is chosen, and hands the focus back', async () => {
        const host = await mount(fixture);
        await open(menu(host));

        await userEvent.click(item(host, 1));
        await settle();

        expect(menu(host).open).toBe(false);
        expect(menu(host).shadowRoot?.activeElement).toBe(trigger(menu(host)));
    });

    it('stays open when the click lands on the panel rather than an item', async () => {
        const host = await mount(fixture);
        await open(menu(host));

        panel(menu(host)).click();
        await settle();

        expect(menu(host).open).toBe(true);
    });

    it('ignores a click on an item that cannot be chosen', async () => {
        const host = await mount(fixture);
        await open(menu(host));

        // Dispatched rather than pointed at: a disabled button swallows a real click, and
        // what is being checked is the component's own filter rather than the platform's.
        const disabled = only(host, 'button[disabled]');
        disabled.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        await settle();

        expect(menu(host).open).toBe(true);
    });

    it('closes on a click elsewhere, and leaves the focus where the reader put it', async () => {
        // The third way out, and the one that must not hand the focus back: the reader has
        // already said where they want to be.
        const host = await mount(
            `${fixture}<button type="button" id="elsewhere">Elsewhere</button>`,
        );
        await open(menu(host));

        await userEvent.click(only(host, '#elsewhere'));
        await settle();

        expect(menu(host).open).toBe(false);
        expect(document.activeElement).toBe(only(host, '#elsewhere'));
    });

    it('hands the focus back once rather than from then on', async () => {
        const host = await mount(
            `${fixture}<button type="button" id="elsewhere">Elsewhere</button>`,
        );
        const element = menu(host);

        await open(element);
        await userEvent.keyboard('{Escape}');
        await settle();

        expect(element.shadowRoot?.activeElement, 'the first close hands it back').toBe(
            trigger(element),
        );

        await open(element);
        await userEvent.click(only(host, '#elsewhere'));
        await settle();

        expect(document.activeElement, 'the second leaves it where the reader put it').toBe(
            only(host, '#elsewhere'),
        );
    });

    it('closes on Tab, and lets the focus carry on out', async () => {
        const host = await mount(fixture);
        await open(menu(host));

        await userEvent.keyboard('{Tab}');
        await settle();

        expect(menu(host).open).toBe(false);
    });

    it('opens and closes from the property, for a host that drives it', async () => {
        const host = await mount(fixture);

        menu(host).open = true;
        await menu(host).updateComplete;
        await settle();

        expect(panel(menu(host)).matches(':popover-open')).toBe(true);
        expect(menu(host).hasAttribute('open'), 'reflected, so CSS can select on it').toBe(true);

        menu(host).open = false;
        await menu(host).updateComplete;
        await settle();

        expect(panel(menu(host)).matches(':popover-open')).toBe(false);
        expect(menu(host).hasAttribute('open')).toBe(false);
    });
});

describe('the keys inside it', () => {
    it('moves down and up', async () => {
        const host = await mount(fixture);
        await open(menu(host));

        await userEvent.keyboard('{ArrowDown}');

        expect(focused()).toBe('Duplicate');

        await userEvent.keyboard('{ArrowUp}');

        expect(focused()).toBe('Rename');
    });

    it('steps over an item that cannot be chosen', async () => {
        const host = await mount(fixture);
        await open(menu(host));

        await userEvent.keyboard('{ArrowDown}{ArrowDown}');

        expect(focused()).toBe('Export');
    });

    it('wraps at either end', async () => {
        const host = await mount(fixture);
        await open(menu(host));

        await userEvent.keyboard('{ArrowUp}');

        expect(focused(), 'up from the first').toBe('Export');

        await userEvent.keyboard('{ArrowDown}');

        expect(focused(), 'down from the last').toBe('Rename');
    });

    it('jumps to either end', async () => {
        const host = await mount(fixture);
        await open(menu(host));

        await userEvent.keyboard('{End}');

        expect(focused()).toBe('Export');

        await userEvent.keyboard('{Home}');

        expect(focused()).toBe('Rename');
    });

    it('keeps the page still under the menu', async () => {
        // Without `preventDefault` an arrow key scrolls the page behind an open menu, which
        // is the same defect in every hand-rolled one.
        const host = await mount(fixture);
        await open(menu(host));

        const arrow = new KeyboardEvent('keydown', {
            key: 'ArrowDown',
            bubbles: true,
            cancelable: true,
        });
        item(host, 0).dispatchEvent(arrow);

        expect(arrow.defaultPrevented).toBe(true);
    });

    it('goes to the item a letter names', async () => {
        const host = await mount(fixture);
        await open(menu(host));

        await userEvent.keyboard('e');

        expect(focused()).toBe('Export');
    });

    it('cycles through the items that share a letter', async () => {
        const host = await mount(`
            <ui-menu>
                <span slot="trigger">Actions</span>
                <button type="button">Rename</button>
                <button type="button">Restore</button>
                <button type="button">Revert</button>
            </ui-menu>
        `);
        await open(menu(host));

        await userEvent.keyboard('r');

        expect(focused(), 'the next one, not the one already under the focus').toBe('Restore');

        await wait(forgotten);
        await userEvent.keyboard('r');

        expect(focused()).toBe('Revert');
    });

    it('narrows as more is typed', async () => {
        const host = await mount(fixture);
        await open(menu(host));

        await userEvent.keyboard('du');

        expect(focused()).toBe('Duplicate');
    });

    it('wraps the whole way round, past the item before the current one', async () => {
        const host = await mount(fixture);
        await open(menu(host));

        await userEvent.keyboard('{End}');

        expect(focused(), 'the search starts from the last item').toBe('Export');

        await userEvent.keyboard('du');

        expect(focused(), 'and comes back round to one it has already passed').toBe('Duplicate');
    });

    it('forgets what was typed after a pause', async () => {
        const host = await mount(fixture);
        await open(menu(host));

        await userEvent.keyboard('d');

        expect(focused(), 'Delete is disabled, so Duplicate is what d finds').toBe('Duplicate');

        await wait(forgotten);
        await userEvent.keyboard('e');

        expect(focused(), 'a fresh buffer rather than "de"').toBe('Export');
    });

    it('reads the label a reader sees, not the whitespace the host indented it with', async () => {
        const host = await mount(`
            <ui-menu>
                <span slot="trigger">Actions</span>
                <button type="button">Export</button>
                <button type="button">
                    Rename
                </button>
            </ui-menu>
        `);
        await open(menu(host));

        await userEvent.keyboard('r');

        expect(focused(), 'the item is found by its text, not by its indentation').toBe('Rename');
    });

    it('skips an item that cannot be chosen, whatever it is called', async () => {
        const host = await mount(fixture);
        await open(menu(host));

        await userEvent.keyboard('de');

        expect(focused(), 'Delete matches and is disabled').toBe('Duplicate');
    });

    it('ignores a key that is not a character', async () => {
        const host = await mount(fixture);
        await open(menu(host));

        await userEvent.keyboard('{Shift}');

        expect(focused()).toBe('Rename');
        // And is left to the page, which the focus cannot see: a buffer that swallowed
        // `PageDown` would move the focus nowhere either, while taking the key away from
        // whatever the page scrolls with it.
        expect(keydown(panel(menu(host)), 'PageDown').defaultPrevented).toBe(false);
    });

    it('does nothing when there is nothing to move over', async () => {
        const host = await mount(`
            <ui-menu>
                <span slot="trigger">Actions</span>
                <button type="button" disabled>Delete</button>
            </ui-menu>
        `);
        await open(menu(host));

        // Every path below divides by the item count or indexes past the end, and this is
        // the count that makes that arithmetic undefined rather than merely useless. Read
        // through the event rather than through the focus, for the reason `keydown` carries:
        // a handler that threw and a handler that found nothing leave the focus in the same
        // place, and only the line after the throw tells them apart.
        panel(menu(host)).focus();

        for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End', 'a']) {
            expect(keydown(panel(menu(host)), key).defaultPrevented, key).toBe(true);
        }

        expect(menu(host).open).toBe(true);
    });
});

describe('where the panel lands', () => {
    it('hangs from the trigger, one half-space below it', async () => {
        const host = await mount(fixture);
        await open(menu(host));

        const anchor = trigger(menu(host)).getBoundingClientRect();
        const box = panel(menu(host)).getBoundingClientRect();

        expect(panel(menu(host)).getAttribute('data-side')).toBe('block-end');
        expect(box.top - anchor.bottom).toBeCloseTo(4, 0);
        expect(box.left).toBeCloseTo(anchor.left, 0);
    });

    it('flips above when there is no room below', async () => {
        const host = await mount(
            `<div style="position: fixed; inset-block-end: 0; inset-inline-start: 0">${fixture}</div>`,
        );
        await open(menu(host));

        const anchor = trigger(menu(host)).getBoundingClientRect();
        const box = panel(menu(host)).getBoundingClientRect();

        expect(panel(menu(host)).getAttribute('data-side')).toBe('block-start');
        expect(anchor.top - box.bottom).toBeCloseTo(4, 0);
    });

    it('stays inside the viewport at the trailing edge', async () => {
        const host = await mount(
            `<div style="position: fixed; inset-block-start: 0; inset-inline-end: 0">${fixture}</div>`,
        );
        await open(menu(host));

        const box = panel(menu(host)).getBoundingClientRect();

        expect(box.right).toBeLessThanOrEqual(document.documentElement.clientWidth + 1);
    });

    it('follows the trigger when the page moves under it', async () => {
        const host = await mount(`<div style="block-size: 200vh">${fixture}</div>`);
        await open(menu(host));

        const before = panel(menu(host)).style.insetBlockStart;

        window.scrollTo(0, 120);
        await settle();

        expect(panel(menu(host)).style.insetBlockStart).not.toBe(before);

        window.scrollTo(0, 0);
    });

    it('follows the trigger when an ancestor scrolls under it', async () => {
        // A scroll event does not bubble from the element that scrolled, so a listener on
        // the window hears one from inside the page only while it is capturing — and the
        // thing that scrolls is rarely the window.
        const host = await mount(`
            <div id="scroller" style="block-size: 120px; overflow: auto">
                ${fixture}
                <div style="block-size: 600px"></div>
            </div>
        `);
        await open(menu(host));

        const before = panel(menu(host)).style.insetBlockStart;

        only(host, '#scroller').scrollTop = 60;
        await settle();
        await settle();

        expect(panel(menu(host)).style.insetBlockStart).not.toBe(before);
    });

    it('follows the trigger when the viewport changes shape', async () => {
        const host = await mount(fixture);
        await open(menu(host));

        only(host, 'ui-menu').style.marginInlineStart = '80px';
        window.dispatchEvent(new Event('resize'));
        await settle();

        const anchor = trigger(menu(host)).getBoundingClientRect();

        expect(panel(menu(host)).getBoundingClientRect().left).toBeCloseTo(anchor.left, 0);
    });

    it('stops following once it is closed', async () => {
        const host = await mount(fixture);
        await open(menu(host));

        await userEvent.keyboard('{Escape}');
        await settle();

        const before = panel(menu(host)).style.insetInlineStart;

        only(host, 'ui-menu').style.marginInlineStart = '80px';
        window.dispatchEvent(new Event('resize'));
        await settle();

        expect(panel(menu(host)).style.insetInlineStart).toBe(before);
    });

    it('stops following a menu a framework took off the page while it was open', async () => {
        const host = await mount(fixture);
        const element = menu(host);
        await open(element);

        const before = panel(element).style.insetBlockStart;
        element.remove();

        window.dispatchEvent(new Event('resize'));
        await settle();

        // The BLOCK inset, and that is the whole assertion rather than a second one: a
        // detached trigger measures as a zero-sized box at the origin, and the panel hangs
        // from the trigger's far edge — so this is the inset that was not zero already and
        // the one a leaked listener would flatten. Measured: removing the element fires no
        // `toggle`, so nothing else in this component drops those listeners.
        expect(panel(element).style.insetBlockStart).toBe(before);
        expect(before, 'a menu that was never placed would pass this vacuously').not.toBe('0px');
    });
});

/**
 * Every value the component paints, read back from the token it was written with.
 *
 * **Each assertion retunes the token and reads the property**, rather than comparing the
 * property against the default the layer already declares: comparing against the default
 * compares this package with itself, and passes for a rule that names the wrong token, or
 * no token at all. `src/toast.ts` learned that from thirty surviving mutants.
 */
describe('the values, all of which come from the token layer', () => {
    it('draws the trigger as the secondary button it is', async () => {
        // Measured against the real thing rather than asserted to match it, which is the
        // mechanism `tests/select.test.ts` uses against `ui-input`'s box: the duplication
        // is real, so the check is that the two agree rather than that one exists.
        const host = await mount(`${fixture}<ui-button variant="secondary">Actions</ui-button>`);
        const mine = getComputedStyle(trigger(menu(host)));
        const theirs = getComputedStyle(inner(only(host, 'ui-button'), 'button'));

        for (const property of [
            'paddingTop',
            'paddingRight',
            'borderRadius',
            'borderTopWidth',
            'borderTopStyle',
            'borderTopColor',
            'backgroundColor',
            'color',
            'fontFamily',
        ] as const) {
            expect(mine[property], property).toBe(theirs[property]);
        }
    });

    it('takes the trigger box from the host', async () => {
        const host = await mount(fixture);
        const element = menu(host);

        element.style.setProperty('--ui-space', '10px');
        element.style.setProperty('--ui-radius', '11px');
        element.style.setProperty('--ui-color-surface', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-color-text', 'rgb(4, 5, 6)');
        element.style.setProperty('--ui-font', 'Courier');
        element.style.setProperty('--ui-duration-state', '0.4s');
        element.style.setProperty('--ui-easing-state', 'linear');

        const styles = getComputedStyle(trigger(element));

        expect(styles.columnGap).toBe('5px');
        expect(styles.padding).toBe('10px 20px');
        expect(styles.borderRadius).toBe('11px');
        expect(styles.backgroundColor).toBe('rgb(1, 2, 3)');
        expect(styles.color).toBe('rgb(4, 5, 6)');
        expect(styles.borderTopColor, 'currentcolor, so the edge follows the text').toBe(
            'rgb(4, 5, 6)',
        );
        expect(styles.fontFamily).toBe('Courier');
        expect(styles.transitionProperty).toBe('background-color');
        expect(styles.transitionDuration).toBe('0.4s');
        expect(styles.transitionTimingFunction).toBe('linear');
    });

    it('answers a pointer and a press, from the host own colours', async () => {
        const host = await mount(fixture);
        const element = menu(host);

        element.style.setProperty('--ui-duration-state', '0s');
        element.style.setProperty('--ui-color-hover', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-color-pressed', 'rgb(4, 5, 6)');

        await userEvent.hover(trigger(element));

        expect(getComputedStyle(trigger(element)).backgroundColor, 'hovered').toBe('rgb(1, 2, 3)');

        await press(trigger(element), true);

        expect(getComputedStyle(trigger(element)).backgroundColor, 'pressed').toBe('rgb(4, 5, 6)');
        expect(getComputedStyle(trigger(element)).transitionDuration, 'and at once').toBe('0s');

        await press(document.body, false);
    });

    it('takes the focus ring from the host', async () => {
        const host = await mount(fixture);
        const element = menu(host);

        element.style.setProperty('--ui-color-focus', 'rgb(1, 2, 3)');
        await userEvent.tab();

        const styles = getComputedStyle(trigger(element));

        expect(element.shadowRoot?.activeElement, 'the tab reached it').toBe(trigger(element));
        expect(styles.outlineColor).toBe('rgb(1, 2, 3)');
        expect(styles.outlineStyle).toBe('solid');
        expect(styles.outlineWidth).toBe('2px');
    });

    it('draws the caret on the adopted grid, and turns it over when the menu opens', async () => {
        const host = await mount(fixture);
        const element = menu(host);

        element.style.setProperty('--ui-icon-size', '30px');
        element.style.setProperty('--ui-icon-stroke', '7');
        element.style.setProperty('--ui-color-text-muted', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-duration-state', '0.4s');
        element.style.setProperty('--ui-easing-state', 'linear');

        const mark = caret(element);
        const styles = getComputedStyle(mark);

        expect(mark.getAttribute('viewBox')).toBe('0 0 24 24');
        expect(mark.getAttribute('aria-hidden'), 'the trigger already says it').toBe('true');
        expect(mark.querySelector('path')?.getAttribute('d')).toMatch(/\d/);
        expect(styles.inlineSize).toBe('30px');
        expect(styles.blockSize, 'the viewBox ratio gives the other one').toBe('30px');
        expect(styles.strokeWidth).toBe('7px');
        expect(styles.fill, 'the geometry is strokes, not areas').toBe('none');
        expect(styles.stroke).toBe('rgb(1, 2, 3)');
        // The adopted set draws every glyph with rounded ends and joins, and a caret that
        // does not is a caret that reads as foreign beside the icons a host already has.
        expect(styles.strokeLinecap).toBe('round');
        expect(styles.strokeLinejoin).toBe('round');
        expect(styles.rotate, 'flat while it is closed').toBe('none');
        expect(styles.transitionProperty, 'only the turn moves').toBe('rotate');
        expect(styles.transitionDuration).toBe('0.4s');
        expect(styles.transitionTimingFunction).toBe('linear');

        // Collapsed before the menu opens, so what is read below is where the turn ends
        // rather than a frame somewhere along it.
        element.style.setProperty('--ui-duration-state', '0s');
        await open(element);

        expect(getComputedStyle(caret(element)).rotate).toBe('180deg');
    });

    it('takes the panel box from the host', async () => {
        const host = await mount(fixture);
        const element = menu(host);

        element.style.setProperty('--ui-space', '10px');
        element.style.setProperty('--ui-radius', '11px');
        element.style.setProperty('--ui-color-border', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-color-surface', 'rgb(4, 5, 6)');
        element.style.setProperty('--ui-color-text', 'rgb(7, 8, 9)');
        element.style.setProperty('--ui-font', 'Courier');
        element.style.setProperty('--ui-elevation-raised', 'rgb(1, 2, 3) 0px 4px 8px 0px');
        await open(element);

        const styles = getComputedStyle(panel(element));

        expect(styles.padding).toBe('5px');
        expect(styles.maxInlineSize).toBe('440px');
        expect(styles.borderTopColor).toBe('rgb(1, 2, 3)');
        expect(styles.borderRadius).toBe('11px');
        expect(styles.backgroundColor).toBe('rgb(4, 5, 6)');
        expect(styles.color).toBe('rgb(7, 8, 9)');
        expect(styles.fontFamily).toBe('Courier');
        expect(styles.boxShadow).toBe('rgb(1, 2, 3) 0px 4px 8px 0px');
        expect(styles.translate, 'the gap, which the script cannot resolve').toBe('0px 5px');
    });

    it('takes the gap above from the host when it flips', async () => {
        const host = await mount(
            `<div style="position: fixed; inset-block-end: 0; inset-inline-start: 0">${fixture}</div>`,
        );
        menu(host).style.setProperty('--ui-space', '10px');
        await open(menu(host));

        expect(getComputedStyle(panel(menu(host))).translate).toBe('0px -5px');
    });

    it('takes an item from the host', async () => {
        const host = await mount(fixture);
        const element = menu(host);

        element.style.setProperty('--ui-space', '10px');
        element.style.setProperty('--ui-radius', '11px');
        element.style.setProperty('--ui-duration-state', '0.4s');
        element.style.setProperty('--ui-easing-state', 'linear');
        element.style.setProperty('--ui-color-text-muted', 'rgb(1, 2, 3)');
        await open(element);

        const styles = getComputedStyle(item(host, 0));

        expect(styles.padding).toBe('5px 10px');
        expect(styles.borderRadius).toBe('11px');
        expect(styles.textAlign).toBe('start');
        expect(styles.transitionProperty).toBe('background-color');
        expect(styles.transitionDuration).toBe('0.4s');
        expect(styles.transitionTimingFunction).toBe('linear');
        expect(
            getComputedStyle(only(host, 'button[disabled]')).color,
            'an item that cannot be chosen says so',
        ).toBe('rgb(1, 2, 3)');
    });

    it('answers a pointer on an item, and never on one that cannot be chosen', async () => {
        const host = await mount(fixture);
        const element = menu(host);

        element.style.setProperty('--ui-duration-state', '0s');
        element.style.setProperty('--ui-color-hover', 'rgb(1, 2, 3)');
        await open(element);

        const resting = getComputedStyle(item(host, 0)).backgroundColor;

        await userEvent.hover(item(host, 0));

        expect(resting, 'transparent until it is pointed at').toBe('rgba(0, 0, 0, 0)');
        expect(getComputedStyle(item(host, 0)).backgroundColor).toBe('rgb(1, 2, 3)');

        // The `:not()` guard, measured rather than assumed: a disabled control still
        // matches `:hover`.
        await userEvent.hover(only(host, 'button[disabled]'));

        expect(getComputedStyle(only(host, 'button[disabled]')).backgroundColor).toBe(
            'rgba(0, 0, 0, 0)',
        );
    });

    it('rings a focused item from the host own colour', async () => {
        const host = await mount(fixture);
        const element = menu(host);

        element.style.setProperty('--ui-color-focus', 'rgb(1, 2, 3)');
        trigger(element).focus();
        await userEvent.keyboard('{ArrowDown}');
        await settle();

        const styles = getComputedStyle(item(host, 0));

        expect(styles.outlineColor).toBe('rgb(1, 2, 3)');
        // Inward, because an item fills the panel and a ring outside it would be clipped by
        // the very box it sits in.
        expect(styles.outlineOffset).toBe('-2px');
    });

    it('takes the separator from the host', async () => {
        const host = await mount(fixture);
        const element = menu(host);

        element.style.setProperty('--ui-space', '10px');
        element.style.setProperty('--ui-color-border', 'rgb(1, 2, 3)');
        await open(element);

        const styles = getComputedStyle(only(host, 'hr'));

        expect(styles.borderBlockStartColor).toBe('rgb(1, 2, 3)');
        expect(styles.borderBlockStartWidth).toBe('1px');
        expect(styles.marginBlockStart).toBe('5px');
    });

    it('paints a link the same as a button, because an item is an item', async () => {
        const host = await mount(`
            <ui-menu>
                <span slot="trigger">Go to</span>
                <a href="#overview">Overview</a>
            </ui-menu>
        `);
        await open(menu(host));

        const styles = getComputedStyle(only(host, 'a'));

        expect(styles.textDecorationLine).toBe('none');
        expect(styles.color).toBe(resolved('--ui-color-text'));
        expect(styles.display).toBe('block');
    });

    it('exposes the two parts a host restyles through', async () => {
        const host = await mount(fixture);

        expect(trigger(menu(host)).getAttribute('part')).toBe('trigger');
        expect(panel(menu(host)).getAttribute('part')).toBe('menu');
    });
});

describe('menu stories', () => {
    it.each([
        ['Menu', Menu],
        ['Disabled', Disabled],
        ['Links', Links],
        ['AtTheEdge', AtTheEdge],
    ] as const)('renders %s accessibly', async (name, story) => {
        await expectAccessible(await mountStory(story, meta, name));
    });

    it('opens the composed story, which is the playground being exercised', async () => {
        const container = await mountStory(Menu, meta, 'Menu');
        const element = menu(container);

        await open(element);

        expect(element.open).toBe(true);
        await expectAccessible(container);
    });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
// The playwright provider is what puts `send` on `CDPSession` — see `button.test.ts`,
// which needs the same line for the same reason.
import type {} from '@vitest/browser-playwright';
import { expectAccessible } from './a11y.js';
import { escaped } from './escaped.js';
import { pointTo } from './pointing.js';
import { mountStory } from './stories.js';
import meta, {
    AlignedToTheEnd,
    AtTheEdge,
    Disabled,
    Links,
    Menu,
    ShortcutsAndDescriptions,
    TicksAndSections,
    WithASubmenu,
    ContextMenu,
} from '../stories/menu.stories.js';
import '../src/menu.js';
import '../src/button.js';
import '../src/tooltip.js';
import { reference } from '../src/reference.js';
import { tokenStyleSheet, type DerivedToken, type Token } from '../src/tokens.js';
import { glass, matrix, themeStyleSheet } from '../src/theme.js';
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

/** The component's own forgetting interval, which one test has to straddle rather than clear. */
const rhythm = 500;

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

/**
 * Waits for whatever the opening set moving to finish: the items, which are the host's own, and
 * the trigger and its caret, in the menu's root, which the host's animations do not take in.
 *
 * A story's sheet carries the default taste, under which the items cascade in, each a little after
 * the one before. axe read part-way through finds an item's text too faint, a different item each
 * time: a fifth of the way into its fade, an item reads 1.88:1.
 */
async function still(element: UiMenu): Promise<void> {
    const moving = [
        ...element.getAnimations({ subtree: true }),
        ...(element.shadowRoot?.getAnimations() ?? []),
    ];

    await Promise.allSettled(moving.map((animation) => animation.finished));
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

    it('keeps its items in a column while a host holds it through its close', async () => {
        // An exit is the host's to write, through the part: a transition of display holds the
        // panel on the page as it closes, and the direction has to hold with the display.
        const host = await mount(`
            <style>
                ui-menu::part(menu) {
                    transition:
                        display 10s allow-discrete,
                        overlay 10s allow-discrete;
                }
            </style>
            ${fixture}
        `);
        await open(menu(host));

        await userEvent.keyboard('{Escape}');
        await settle();

        expect(getComputedStyle(panel(menu(host))).display).toBe('flex');
        expect(item(host, 1).getBoundingClientRect().top).toBeGreaterThan(
            item(host, 0).getBoundingClientRect().bottom - 1,
        );
    });

    it('has nothing to scroll, though its boundary reaches past its edge', async () => {
        // The boundary's layer reaches a pixel past the padding box on purpose, and a popover
        // scrolls what overflows it: that pixel was a scrollbar on every open panel.
        const host = await mount(fixture);
        await open(menu(host));

        const box = panel(menu(host));
        box.scrollTop = 10;
        box.scrollLeft = 10;

        expect([box.scrollTop, box.scrollLeft]).toEqual([0, 0]);
    });

    it('takes the top layer rather than a z-index', async () => {
        const host = await mount(fixture);
        await open(menu(host));

        expect(getComputedStyle(panel(menu(host))).zIndex).toBe('auto');
        // The one z-index the sheet names is the trigger's layer under its label: -1, inside the
        // trigger's own stacking context, which lifts nothing over the page.
        expect(
            String((customElements.get('ui-menu') as unknown as { styles: unknown }).styles).match(
                /z-index:[^;]+/g,
            ),
        ).toEqual(['z-index: -1']);
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

    it('closes when the click lands on what an item holds, its icon, and hands the focus back', async () => {
        const host = await mount(`
            <ui-menu>
                <span slot="trigger">Actions</span>
                <button type="button"><ui-icon><svg viewBox="0 0 24 24"></svg></ui-icon> Rename</button>
                <button type="button">Duplicate</button>
            </ui-menu>
        `);
        await open(menu(host));

        // Dispatched at the glyph, which a click on the icon names as what it landed on: a
        // pointer driven at a box that small lands where the runner scales it to.
        only(host, 'svg').dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
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

describe('the keys the trigger takes', () => {
    it('opens on an arrow without letting the page move under it', async () => {
        // The key opens the menu AND is the page's own scroll key, so leaving it
        // unclaimed opens a panel over content that has just slid out from under it.
        const host = await mount(fixture);
        const element = menu(host);

        // After the menu, so the page can scroll and the trigger is already at the top —
        // focusing something below the fold would scroll on its own and say nothing.
        const tall = document.createElement('div');
        tall.style.blockSize = '400vh';
        document.body.append(tall);

        trigger(element).focus();
        const before = window.scrollY;

        // Through CDP rather than `userEvent`, and that is the difference between a test
        // and a test-shaped assertion: the driver's synthetic key runs the listeners and
        // performs no default action at all, so this assertion held with
        // `preventDefault()` taken out. Measured, by doing exactly that.
        for (const type of ['rawKeyDown', 'keyUp'] as const) {
            await cdp().send('Input.dispatchKeyEvent', {
                type,
                key: 'ArrowDown',
                code: 'ArrowDown',
                windowsVirtualKeyCode: 40,
                nativeVirtualKeyCode: 40,
            });
        }

        await element.updateComplete;
        await new Promise((resolve) => {
            setTimeout(resolve, 100);
        });

        expect(element.open, 'it opened').toBe(true);
        expect(window.scrollY, 'and the page stayed where it was').toBe(before);

        tall.remove();
        window.scrollTo(0, 0);
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

    it('keeps the buffer alive while the reader is still typing', async () => {
        // The clock is restarted on every keystroke, not set once on the first. Without
        // that, the timer from the first letter fires mid-word and the buffer the reader
        // is still building is thrown away underneath them.
        //
        // Driven with the synchronous helper and fake timers, deliberately: the real
        // window between "the first clock would have fired" and "the current one has not"
        // is 200ms wide, and a test that has to land inside it is a test that races the
        // thing it measures. `toast.test.ts` carries what that costs.
        const host = await mount(`
            <ui-menu>
                <span slot="trigger">Actions</span>
                <button type="button">Export</button>
                <button type="button">Pin</button>
            </ui-menu>
        `);

        const element = menu(host);
        await open(element);

        const panelOf = panel(element);
        vi.useFakeTimers();

        try {
            keydown(panelOf, 'e');
            vi.advanceTimersByTime(rhythm - 200);

            keydown(panelOf, 'x');
            vi.advanceTimersByTime(rhythm - 200);

            // Past the first keystroke's clock and short of this one's, which is the only
            // window where restarting it and setting it once tell different stories.
            keydown(panelOf, 'p');

            expect(focused(), 'the whole word, not the last letter of it').toBe('Export');
        } finally {
            vi.useRealTimers();
        }
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

describe('an item that is not drawn', () => {
    /** A menu whose second and last items are hidden, the way `how` hides them. #412 */
    const hiding = (how: string): string => `
        <ui-menu>
            <span slot="trigger">Actions</span>
            <button type="button">Rename</button>
            <button type="button" ${how}>Secret</button>
            <button type="button">Duplicate</button>
            <button type="button" ${how}>Shred</button>
        </ui-menu>
    `;

    it('draws none written hidden, though the item rule gives each a display of its own', async () => {
        const host = await mount(hiding('hidden'));
        await open(menu(host));

        for (const hidden of [item(host, 1), item(host, 3)]) {
            expect(getComputedStyle(hidden).display, hidden.textContent).toBe('none');
            expect(hidden.getBoundingClientRect().height, hidden.textContent).toBe(0);
        }
    });

    it.each([
        ['written hidden', 'hidden'],
        ['the page hides', 'style="display: none"'],
    ])('passes over one %s, with the arrows, the ends and typing', async (_how, attribute) => {
        const host = await mount(hiding(attribute));
        await open(menu(host));

        await userEvent.keyboard('{ArrowDown}');

        expect(focused(), 'the arrow down').toBe('Duplicate');

        await userEvent.keyboard('{ArrowDown}');

        expect(focused(), 'the arrow down, round from the last').toBe('Rename');

        await userEvent.keyboard('{End}');

        expect(focused(), 'End').toBe('Duplicate');

        await userEvent.keyboard('{Home}s');

        expect(focused(), 'typing the letter both begin with').toBe('Rename');
    });

    it('reaches an item again once hidden comes off it', async () => {
        const host = await mount(hiding('hidden'));
        item(host, 1).hidden = false;
        await open(menu(host));

        await userEvent.keyboard('{ArrowDown}');

        expect(focused()).toBe('Secret');
    });
});

describe('choosing from the keyboard', () => {
    /**
     * Two labels that share a word, and a link: the shape #298 was measured on, where Space
     * chose no item at all because the typeahead took it.
     */
    const spaced = `
        <ui-menu>
            <span slot="trigger">Actions</span>
            <button type="button">Rename</button>
            <button type="button">Open</button>
            <button type="button">Open recent</button>
            <a href="#linked">Linked page</a>
        </ui-menu>
    `;

    /** Counts the clicks an item takes, and keeps a followed link from leaving the test page. */
    function clicks(target: HTMLElement): { count: number } {
        const seen = { count: 0 };

        target.addEventListener('click', (event) => {
            seen.count += 1;
            event.preventDefault();
        });

        return seen;
    }

    it('chooses a button on Enter, and hands the focus back', async () => {
        const host = await mount(spaced);
        const element = menu(host);
        const rename = clicks(item(host, 0));
        await open(element);

        await userEvent.keyboard('{Enter}');
        await settle();

        expect(rename.count, 'clicked').toBe(1);
        expect(element.open).toBe(false);
        expect(element.shadowRoot?.activeElement).toBe(trigger(element));
    });

    it('chooses a button on Space, as Enter does', async () => {
        const host = await mount(spaced);
        const element = menu(host);
        const rename = clicks(item(host, 0));
        await open(element);

        await userEvent.keyboard(' ');
        await settle();

        expect(rename.count, 'clicked').toBe(1);
        expect(element.open).toBe(false);
        expect(element.shadowRoot?.activeElement).toBe(trigger(element));
    });

    it('leaves Space to the button once a search has been forgotten', async () => {
        const host = await mount(spaced);
        const element = menu(host);
        const opened = clicks(item(host, 1));
        await open(element);

        await userEvent.keyboard('o');

        expect(focused()).toBe('Open');

        await wait(forgotten);
        await userEvent.keyboard(' ');
        await settle();

        expect(opened.count, 'clicked').toBe(1);
        expect(element.open).toBe(false);
    });

    it('keeps a space in a search in progress, so a label can be typed whole', async () => {
        const host = await mount(spaced);
        const element = menu(host);
        const opened = clicks(item(host, 1));
        await open(element);

        await userEvent.keyboard('open r');

        expect(focused()).toBe('Open recent');
        expect(opened.count, 'the space clicked nothing on its way past').toBe(0);
        expect(element.open).toBe(true);
    });

    it('keeps the search going across a space, as across a letter', async () => {
        // A reader who pauses at the word break is still searching: the space restarts the
        // clock a letter restarts. Without it the buffer runs out before the r, and a fresh r
        // finds Rename. Fake timers and the synchronous helper, for the reason the buffer test
        // above gives.
        const host = await mount(spaced);
        const element = menu(host);
        await open(element);

        const panelOf = panel(element);
        vi.useFakeTimers();

        try {
            for (const key of 'open') {
                keydown(panelOf, key);
            }

            vi.advanceTimersByTime(rhythm - 100);
            keydown(panelOf, ' ');
            vi.advanceTimersByTime(rhythm - 100);
            keydown(panelOf, 'r');

            expect(focused(), 'the whole of "open r", not a fresh r').toBe('Open recent');
        } finally {
            vi.useRealTimers();
        }
    });

    it('keeps no space for the next letter when no search was in progress', async () => {
        const host = await mount(spaced);
        await open(menu(host));

        await userEvent.keyboard('{End}');

        expect(focused()).toBe('Linked page');

        await userEvent.keyboard(' o');

        expect(focused(), 'the letter searches on its own').toBe('Open');
    });

    it('follows a link on Enter, and hands the focus back', async () => {
        const host = await mount(spaced);
        const element = menu(host);
        const linked = clicks(item(host, 3));
        await open(element);

        await userEvent.keyboard('{End}{Enter}');
        await settle();

        expect(linked.count, 'followed').toBe(1);
        expect(element.open).toBe(false);
        expect(element.shadowRoot?.activeElement).toBe(trigger(element));
    });

    it('does nothing with Space on a link, and keeps the page still under the menu', async () => {
        const host = await mount(spaced);
        const element = menu(host);
        const linked = clicks(item(host, 3));
        await open(element);

        await userEvent.keyboard('{End} ');
        await settle();

        expect(linked.count, 'not followed').toBe(0);
        expect(element.open).toBe(true);
        expect(focused()).toBe('Linked page');
        // Whether the page could have moved is read off the event, as the arrows' is above.
        expect(keydown(item(host, 3), ' ').defaultPrevented).toBe(true);
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

    it('hangs from the trigger right edge in a right-to-left part of the page', async () => {
        // Away from the middle, where a panel mirrored across the viewport would land back
        // under its own trigger: it used to open as far from the left as its trigger is from
        // the right.
        const host = await mount(
            `<div dir="rtl" style="padding-inline-start: 40px">${fixture}</div>`,
        );
        await open(menu(host));

        const anchor = trigger(menu(host)).getBoundingClientRect();
        const box = panel(menu(host)).getBoundingClientRect();

        expect(box.top - anchor.bottom).toBeCloseTo(4, 0);
        expect(box.right).toBeCloseTo(anchor.right, 0);
    });

    it('hangs from the trigger right edge in a right-to-left page', async () => {
        document.documentElement.dir = 'rtl';

        try {
            const host = await mount(`<div style="padding-inline-start: 40px">${fixture}</div>`);
            await open(menu(host));

            const anchor = trigger(menu(host)).getBoundingClientRect();
            const box = panel(menu(host)).getBoundingClientRect();

            expect(box.right).toBeCloseTo(anchor.right, 0);
        } finally {
            document.documentElement.removeAttribute('dir');
        }
    });

    it('hangs from where the trigger rests, whatever moves it as it opens', async () => {
        // A host can move the trigger through its part, and a transform is drawn where it went
        // and laid out where it was: grown under the pointer that opens the menu, the trigger
        // goes back once the pointer is in the panel, and the panel stays where it was hung.
        const host = await mount(
            `<style>ui-menu::part(trigger):hover { scale: 1.1; }</style>${fixture}`,
        );
        await open(menu(host));
        await userEvent.hover(item(host, 0));
        await settle();

        const anchor = trigger(menu(host)).getBoundingClientRect();
        const box = panel(menu(host)).getBoundingClientRect();

        expect(box.top - anchor.bottom).toBeCloseTo(4, 0);
        expect(box.left).toBeCloseTo(anchor.left, 0);
    });

    it('is placed as it is shown, rather than a frame later at the corner', async () => {
        // `toggle` comes in a task of its own and a frame can be drawn before it, so nothing
        // here waits: what is read is the panel the first frame would draw.
        const host = await mount(fixture);

        trigger(menu(host)).click();

        const anchor = trigger(menu(host)).getBoundingClientRect();
        const box = panel(menu(host)).getBoundingClientRect();

        expect(panel(menu(host)).matches(':popover-open')).toBe(true);
        expect(panel(menu(host)).getAttribute('data-side')).toBe('block-end');
        expect(box.top - anchor.bottom).toBeCloseTo(4, 0);
        expect(box.left).toBeCloseTo(anchor.left, 0);

        await settle();
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

    it('opens again on the side it last took, from the frame it opens in', async () => {
        // A closed popover measures nothing, so the panel is placed as it is shown by the size
        // it had when it was last open: by none, a menu that flipped would open below.
        const host = await mount(
            `<div style="position: fixed; inset-block-end: 0; inset-inline-start: 0">${fixture}</div>`,
        );
        await open(menu(host));
        await userEvent.keyboard('{Escape}');
        await settle();

        trigger(menu(host)).click();

        const anchor = trigger(menu(host)).getBoundingClientRect();
        const box = panel(menu(host)).getBoundingClientRect();

        expect(panel(menu(host)).getAttribute('data-side')).toBe('block-start');
        expect(anchor.top - box.bottom).toBeCloseTo(4, 0);

        await settle();
    });

    it('leaves on the side the reader saw it on, whatever moved under it', async () => {
        // Foretold on the way in and not on the way out: taken to the bottom as it closes, a
        // panel foretold again would turn above as its exit begins.
        const host = await mount(
            `<div id="spot" style="position: fixed; inset-block-start: 0; inset-inline-start: 0">${fixture}</div>`,
        );
        await open(menu(host));

        expect(panel(menu(host)).getAttribute('data-side')).toBe('block-end');

        const spot = only(host, '#spot');
        spot.style.insetBlockStart = 'auto';
        spot.style.insetBlockEnd = '0';
        await userEvent.keyboard('{Escape}');
        await settle();

        expect(panel(menu(host)).getAttribute('data-side')).toBe('block-end');
    });

    it.each([
        ['holds the panel and its gap', 0, 'block-end'],
        ['falls a pixel short of them', 1, 'block-start'],
    ] as const)(
        'foretells its side as it is shown where the room below %s',
        async (_room, short, side) => {
            // The panel's height as it was last open, and its gap, half the space token: the
            // room the platform needs below before it flips the panel above.
            const host = await mount(
                `<div id="spot" style="position: fixed; display: flex; inset-block-start: 0; inset-inline-start: 0">${fixture}</div>`,
            );
            await open(menu(host));

            const height = panel(menu(host)).getBoundingClientRect().height;

            await userEvent.keyboard('{Escape}');
            await settle();

            const spot = only(host, '#spot');
            spot.style.insetBlockStart = 'auto';
            spot.style.insetBlockEnd = `${String(height + 4 - short)}px`;

            trigger(menu(host)).click();

            expect(panel(menu(host)).getAttribute('data-side'), 'as it is shown').toBe(side);

            await settle();

            expect(panel(menu(host)).getAttribute('data-side'), 'and where it landed').toBe(side);
        },
    );
    it("stays inside the viewport at the trailing edge, hung from its trigger's other edge", async () => {
        // An item long enough that the panel, hung from the trigger's leading edge, would run off
        // the screen: so it turns to the trigger's other edge.
        const host = await mount(`
            <div style="position: fixed; inset-block-start: 0; inset-inline-end: 0">
                <ui-menu>
                    <span slot="trigger">More</span>
                    <button type="button">Rename this document to something longer</button>
                </ui-menu>
            </div>
        `);
        await open(menu(host));

        const anchor = trigger(menu(host)).getBoundingClientRect();
        const box = panel(menu(host)).getBoundingClientRect();

        expect(box.width, 'wider than the room from the leading edge').toBeGreaterThan(
            document.documentElement.clientWidth - anchor.left,
        );
        expect(box.right).toBeLessThanOrEqual(document.documentElement.clientWidth + 1);
        expect(box.right).toBeCloseTo(anchor.right, 0);
    });
    it('follows the trigger when the page moves under it', async () => {
        const host = await mount(`<div style="block-size: 200vh">${fixture}</div>`);
        await open(menu(host));

        window.scrollTo(0, 120);
        await settle();

        const anchor = trigger(menu(host)).getBoundingClientRect();
        const box = panel(menu(host)).getBoundingClientRect();

        window.scrollTo(0, 0);

        expect(box.top - anchor.bottom, 'still against the trigger, its gap and all').toBeCloseTo(
            4,
            0,
        );
    });
    it('follows the trigger when an ancestor scrolls under it', async () => {
        // A scroll event does not bubble from the element that scrolled, so a listener on
        // the window hears one from inside the page only while it is capturing — and the
        // thing that scrolls is rarely the window. The platform follows it with no listener;
        // the listener reads the side.
        const host = await mount(`
            <div id="scroller" style="block-size: 120px; overflow: auto">
                ${fixture}
                <div style="block-size: 600px"></div>
            </div>
        `);
        await open(menu(host));

        only(host, '#scroller').scrollTop = 6;
        await settle();
        await settle();

        const anchor = trigger(menu(host)).getBoundingClientRect();
        const box = panel(menu(host)).getBoundingClientRect();

        expect(box.top - anchor.bottom, 'still against the trigger, its gap and all').toBeCloseTo(
            4,
            0,
        );
        expect(panel(menu(host)).getAttribute('data-side')).toBe('block-end');
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

    it('reads its side again when the window resizes, once the platform has flipped it', async () => {
        const host = await mount(
            `<div id="spot" style="position: fixed; inset-block-start: 0; inset-inline-start: 0">${fixture}</div>`,
        );
        await open(menu(host));

        expect(panel(menu(host)).getAttribute('data-side'), 'below, with room').toBe('block-end');

        // Taken to the bottom while it is open: the platform flips the panel as the page lays
        // out, and the resize is what reads the side it took.
        const spot = only(host, '#spot');
        spot.style.insetBlockStart = 'auto';
        spot.style.insetBlockEnd = '0';
        window.dispatchEvent(new Event('resize'));
        await settle();

        expect(panel(menu(host)).getAttribute('data-side')).toBe('block-start');
    });

    it.each([
        ['below, where it has room', 'inset-block-start: 0', 'block-end'],
        ['above, flipped at the bottom', 'inset-block-end: 0', 'block-start'],
    ] as const)(
        'reads its side by the two middles under a trigger taller than half its panel: %s',
        async (_where, inset, side) => {
            // A menu far taller than half its panel, so a side read off anything but the trigger's
            // middle — its top, or a point past its bottom — reads the other side.
            const host = await mount(
                `<div style="position: fixed; ${inset}; inset-inline-start: 0"><style>ui-menu { display: inline-block; block-size: 160px; }</style>${fixture}</div>`,
            );
            await open(menu(host));

            expect(panel(menu(host)).getAttribute('data-side')).toBe(side);
        },
    );
    it('stops following once it is closed', async () => {
        // A closed panel measures nothing at the origin, whose middle is above any trigger's,
        // so a listener left on would read the panel below as above.
        const host = await mount(fixture);
        await open(menu(host));

        await userEvent.keyboard('{Escape}');
        await settle();

        expect(panel(menu(host)).getAttribute('data-side'), 'below').toBe('block-end');

        window.dispatchEvent(new Event('resize'));
        await settle();

        expect(panel(menu(host)).getAttribute('data-side'), 'nothing read it').toBe('block-end');
    });
    it('stops following a menu a framework took off the page while it was open', async () => {
        // Measured: removing the element fires no `toggle`, so nothing else in this component
        // drops those listeners. A removed menu measures nothing at the origin, trigger and
        // panel alike, whose middles are level, which reads as below — on a panel the reader
        // saw above.
        const host = await mount(
            `<div style="position: fixed; inset-block-end: 0; inset-inline-start: 0">${fixture}</div>`,
        );
        const element = menu(host);
        await open(element);

        expect(panel(element).getAttribute('data-side'), 'above, at the bottom').toBe(
            'block-start',
        );

        element.remove();
        window.dispatchEvent(new Event('resize'));
        await settle();

        expect(panel(element).getAttribute('data-side'), 'nothing read it').toBe('block-start');
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
/** The menu hung from the trigger's trailing edge, RFC 0010's, where the host asks with `align`. */
describe("hung from the trigger's trailing edge, where the host asks", () => {
    /** A menu whose panel is wider than its trigger, hung from `align`, in a part of the page `around` styles. */
    function wide(align: string, around: string): string {
        return `
            <div ${around}>
                <ui-menu ${align}>
                    <span slot="trigger">Actions</span>
                    <button type="button">A much longer item than the trigger</button>
                    <button type="button">Duplicate</button>
                </ui-menu>
            </div>
        `;
    }

    it('hangs from the leading edge until it is asked otherwise', async () => {
        const host = await mount(fixture);

        expect(menu(host).align).toBe('start');
        expect(menu(host).getAttribute('align'), 'reflected').toBe('start');
    });

    it.each([
        ['left to right, at its right', 'ltr'],
        ['right to left, at its left', 'rtl'],
    ] as const)(
        'hangs from the trigger\'s trailing edge under align="end", %s',
        async (_, direction) => {
            const host = await mount(
                wide('align="end"', `dir="${direction}" style="padding-inline-start: 300px"`),
            );

            await open(menu(host));

            const anchor = trigger(menu(host)).getBoundingClientRect();
            const box = panel(menu(host)).getBoundingClientRect();

            expect(box.width, 'wider than the trigger').toBeGreaterThan(anchor.width);
            expect(box.top - anchor.bottom, 'below it').toBeCloseTo(4, 0);
            expect(panel(menu(host)).getAttribute('data-side'), 'the side it says').toBe(
                'block-end',
            );

            if (direction === 'ltr') {
                expect(box.right).toBeCloseTo(anchor.right, 0);
            } else {
                expect(box.left).toBeCloseTo(anchor.left, 0);
            }
        },
    );

    it.each([
        ['left to right, at the left of the screen', 'ltr'],
        ['right to left, at the right of the screen', 'rtl'],
    ] as const)(
        'turns to the leading edge where the trailing one would run off the screen, %s',
        async (_, direction) => {
            const host = await mount(wide('align="end"', `dir="${direction}"`));

            await open(menu(host));

            const anchor = trigger(menu(host)).getBoundingClientRect();
            const box = panel(menu(host)).getBoundingClientRect();

            if (direction === 'ltr') {
                expect(box.left).toBeCloseTo(anchor.left, 0);
            } else {
                expect(box.right).toBeCloseTo(anchor.right, 0);
            }
        },
    );

    it('takes align from the attribute, and reflects it', async () => {
        const host = await mount(fixture);
        const element = menu(host);

        element.setAttribute('align', 'end');

        expect(element.align).toBe('end');

        element.align = 'start';
        await element.updateComplete;

        expect(element.getAttribute('align')).toBe('start');
    });

    it('is accessible open, hung from the trailing edge', async () => {
        const host = await mount(wide('align="end"', 'style="padding-inline-start: 300px"'));

        await open(menu(host));
        await still(menu(host));

        await expectAccessible(host);
    });
});

/**
 * Items that tick, and sections, RFC 0010's: `menuitemcheckbox` and `menuitemradio` with
 * `aria-checked` on the host's items, and a `role="group"` of the host's named by a heading it holds.
 */
describe('items that tick, and sections', () => {
    const ticked = `
        <ui-menu>
            <span slot="trigger">View</span>
            <button type="button" role="menuitemcheckbox" aria-checked="true">Show the ruler</button>
            <button type="button" role="menuitemcheckbox">Show the grid</button>
            <hr />
            <div role="group" aria-labelledby="sort">
                <span id="sort">Sort by</span>
                <button type="button" role="menuitemradio" aria-checked="true">Name</button>
                <button type="button" role="menuitemradio" aria-checked="false">Date</button>
            </div>
            <div role="group" aria-labelledby="size">
                <span id="size">Size</span>
                <button type="button" role="menuitemradio" aria-checked="false">Small</button>
                <button type="button" role="menuitemradio" aria-checked="true">Large</button>
            </div>
            <button type="button">Reset</button>
        </ui-menu>
    `;

    /** An item of the fixture's, by its text. */
    function named(host: ParentNode, text: string): HTMLElement {
        const found = [...host.querySelectorAll<HTMLElement>('ui-menu button')].find(
            (button) => button.textContent.trim() === text,
        );

        if (found === undefined) {
            throw new Error(`no item named ${text}`);
        }

        return found;
    }

    /** Whether an item says it is checked. */
    function checked(host: ParentNode, text: string): string | null {
        return named(host, text).getAttribute('aria-checked');
    }

    /** Opens the menu from the keys, onto its first item. */
    async function fromTheKeys(element: UiMenu): Promise<void> {
        trigger(element).focus();
        await userEvent.keyboard('{ArrowDown}');
        await settle();
    }

    it('keeps the role the host wrote on an item that ticks, and says it is unchecked where the host wrote nothing', async () => {
        const host = await mount(ticked);

        expect(named(host, 'Show the grid').getAttribute('role')).toBe('menuitemcheckbox');
        expect(checked(host, 'Show the grid'), 'unchecked, said').toBe('false');
        expect(checked(host, 'Show the ruler'), 'as the host wrote it').toBe('true');
        expect(named(host, 'Date').getAttribute('role')).toBe('menuitemradio');
        expect(named(host, 'Reset').getAttribute('role'), 'an item that does not tick').toBe(
            'menuitem',
        );

        for (const text of ['Show the ruler', 'Name', 'Large', 'Reset']) {
            expect(named(host, text).getAttribute('tabindex'), text).toBe('-1');
        }
    });

    it('ticks a checkbox over on a click, and closes the menu as any item does', async () => {
        const host = await mount(ticked);

        await open(menu(host));
        await userEvent.click(named(host, 'Show the grid'));

        expect(checked(host, 'Show the grid')).toBe('true');
        expect(menu(host).open, 'closed').toBe(false);

        await open(menu(host));
        await userEvent.click(named(host, 'Show the grid'));

        expect(checked(host, 'Show the grid'), 'and back').toBe('false');
    });

    it('ticks a radio on a click, one at a time in its section, and leaves the other section alone', async () => {
        const host = await mount(ticked);

        await open(menu(host));
        await userEvent.click(named(host, 'Date'));

        expect([checked(host, 'Name'), checked(host, 'Date')]).toEqual(['false', 'true']);
        expect([checked(host, 'Small'), checked(host, 'Large')], 'the other section').toEqual([
            'false',
            'true',
        ]);
    });

    it("ticks a radio among the menu's own children apart from the radios in a section", async () => {
        const host = await mount(`
            <ui-menu>
                <span slot="trigger">View</span>
                <button type="button" role="menuitemradio" aria-checked="true">Light</button>
                <button type="button" role="menuitemradio" aria-checked="false">Dark</button>
                <div role="group" aria-labelledby="zoom">
                    <span id="zoom">Zoom</span>
                    <button type="button" role="menuitemradio" aria-checked="true">Fit</button>
                </div>
            </ui-menu>
        `);

        await open(menu(host));
        await userEvent.click(named(host, 'Dark'));

        expect([checked(host, 'Light'), checked(host, 'Dark')]).toEqual(['false', 'true']);
        expect(checked(host, 'Fit'), 'in a section of its own').toBe('true');
    });

    it('lets a listener on the item read the state the click set, and announces change', async () => {
        const host = await mount(ticked);
        const item = named(host, 'Show the grid');
        const read: (string | null)[] = [];
        const changed: EventTarget[] = [];

        item.addEventListener('click', () => {
            read.push(item.getAttribute('aria-checked'));
        });
        menu(host).addEventListener('change', (event) => {
            if (event.target !== null) {
                changed.push(event.target);
            }
        });

        await open(menu(host));
        await userEvent.click(item);

        expect(read, 'the state the click set').toEqual(['true']);
        expect(changed, 'announced from the item').toEqual([item]);
    });

    it('ticks an item with the space bar and keeps the menu open, announcing change', async () => {
        const host = await mount(ticked);
        const changed: EventTarget[] = [];

        menu(host).addEventListener('change', (event) => {
            if (event.target !== null) {
                changed.push(event.target);
            }
        });

        await fromTheKeys(menu(host));

        expect(focused()).toBe('Show the ruler');

        await userEvent.keyboard(' ');

        expect(checked(host, 'Show the ruler'), 'ticked over').toBe('false');
        expect(menu(host).open, 'still open').toBe(true);

        await userEvent.keyboard(' ');

        expect(checked(host, 'Show the ruler'), 'and back').toBe('true');
        expect(changed).toEqual([named(host, 'Show the ruler'), named(host, 'Show the ruler')]);

        await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');

        expect(focused()).toBe('Date');

        await userEvent.keyboard(' ');

        expect([checked(host, 'Name'), checked(host, 'Date')], 'a radio').toEqual([
            'false',
            'true',
        ]);
        expect(menu(host).open, 'still open').toBe(true);
    });

    it('ticks an item with Enter and closes the menu', async () => {
        const host = await mount(ticked);

        await fromTheKeys(menu(host));
        await userEvent.keyboard('{ArrowDown}{Enter}');
        await settle();

        expect(checked(host, 'Show the grid')).toBe('true');
        expect(menu(host).open, 'closed').toBe(false);
    });

    it('leaves an item that ticks and cannot be used as it is', async () => {
        const host = await mount(`
            <ui-menu>
                <span slot="trigger">View</span>
                <button type="button" role="menuitemcheckbox" aria-checked="false" aria-disabled="true">Locked</button>
                <button type="button">Reset</button>
            </ui-menu>
        `);

        await open(menu(host));
        named(host, 'Locked').click();

        expect(checked(host, 'Locked')).toBe('false');
    });

    it('takes the items of a section as its own, the keys passing through sections and over their headings', async () => {
        const host = await mount(ticked);
        const seen: string[] = [];

        await fromTheKeys(menu(host));

        for (let step = 0; step < 7; step += 1) {
            seen.push(focused());
            await userEvent.keyboard('{ArrowDown}');
        }

        expect(seen).toEqual([
            'Show the ruler',
            'Show the grid',
            'Name',
            'Date',
            'Small',
            'Large',
            'Reset',
        ]);

        await userEvent.keyboard('{End}');

        expect(focused(), 'End').toBe('Reset');

        await userEvent.keyboard('s');

        expect(focused(), 'typed').toBe('Show the ruler');

        await wait(forgotten);
        await userEvent.keyboard('l');

        expect(focused(), 'typed, into a section').toBe('Large');
    });

    it('wires an item written into a section after the menu did, as it opens', async () => {
        const host = await mount(ticked);
        const late = document.createElement('button');

        late.type = 'button';
        late.textContent = 'Kind';
        only(host, '[aria-labelledby="sort"]').append(late);

        await open(menu(host));

        expect([late.getAttribute('role'), late.getAttribute('tabindex')]).toEqual([
            'menuitem',
            '-1',
        ]);
    });

    it('draws the tick of a checked item in its text: the checkbox tick for a checkbox, the radio dot for a radio', async () => {
        const host = await mount(ticked);

        await open(menu(host));

        for (const [text, mask] of [
            ['Show the ruler', 'svg'],
            ['Name', 'radial-gradient'],
            ['Large', 'radial-gradient'],
        ] as const) {
            const before = getComputedStyle(named(host, text), '::before');

            expect(before.content, text).toBe('""');
            expect(before.maskImage, text).toContain(mask);
            expect(before.backgroundColor, `${text}, in its text`).toBe(
                getComputedStyle(named(host, text)).color,
            );
        }

        for (const text of ['Show the grid', 'Date', 'Small']) {
            expect(getComputedStyle(named(host, text), '::before').content, text).toBe('none');
        }
    });

    it('keeps a column at the start of an item that ticks, for its tick, in a section or not', async () => {
        const host = await mount(ticked);

        menu(host).style.setProperty('--ui-space', '8px');
        menu(host).style.fontSize = '16px';

        expect(getComputedStyle(named(host, 'Show the grid')).paddingLeft).toBe('28px');
        expect(getComputedStyle(named(host, 'Date')).paddingLeft).toBe('28px');
        expect(
            getComputedStyle(named(host, 'Reset')).paddingLeft,
            'an item that does not tick',
        ).toBe('8px');
        expect(
            getComputedStyle(named(host, 'Show the ruler'), '::before').left,
            'its tick, at the start of the column',
        ).toBe('8px');
        expect(getComputedStyle(named(host, 'Name'), '::before').left, 'in a section').toBe('8px');
    });

    it('rings a focused item in a section from the host own colour, as one of its own', async () => {
        const host = await mount(ticked);
        const element = menu(host);

        element.style.setProperty('--ui-color-focus', 'rgb(1, 2, 3)');
        await fromTheKeys(element);
        // Past the menu's own two items and the separator, onto the first section's first.
        await userEvent.keyboard('{ArrowDown}{ArrowDown}');

        const styles = getComputedStyle(named(host, 'Name'));

        expect(document.activeElement, 'on it').toBe(named(host, 'Name'));
        expect(styles.outlineColor).toBe('rgb(1, 2, 3)');
        expect(styles.outlineOffset).toBe('-2px');
    });

    it('mutes an item in a section that cannot be chosen, as one of its own', async () => {
        const host = await mount(`
            <ui-menu>
                <span slot="trigger">View</span>
                <div role="group" aria-labelledby="sort">
                    <span id="sort">Sort by</span>
                    <button type="button" disabled>Name</button>
                    <a href="#date" aria-disabled="true">Date</a>
                </div>
            </ui-menu>
        `);

        menu(host).style.setProperty('--ui-color-text-muted', 'rgb(4, 5, 6)');

        for (const blocked of host.querySelectorAll<HTMLElement>(
            '[role="group"] > :is(button, a)',
        )) {
            const styles = getComputedStyle(blocked);

            expect(styles.color, blocked.textContent).toBe('rgb(4, 5, 6)');
            expect(styles.cursor, blocked.textContent).toBe('not-allowed');
        }
    });

    it('draws an item in a section as one of its own, by the rules it adopts', async () => {
        const host = await mount(ticked);

        await open(menu(host));

        const own = getComputedStyle(named(host, 'Reset'));
        const inSection = getComputedStyle(named(host, 'Small'));

        for (const property of [
            'display',
            'minBlockSize',
            'paddingTop',
            'paddingRight',
            'borderTopLeftRadius',
            'textAlign',
            'cursor',
            'transitionDuration',
        ] as const) {
            expect(inSection[property], property).toBe(own[property]);
        }
    });

    it('lights an item in a section under the pointer as one of its own', async () => {
        const host = await mount(ticked);

        menu(host).style.setProperty('--ui-duration-state', '0s');
        await open(menu(host));
        await userEvent.hover(named(host, 'Small'));

        const probe = document.createElement('div');

        probe.style.backgroundColor = String(reference('--ui-color-hover'));
        document.body.append(probe);

        const hover = getComputedStyle(probe).backgroundColor;

        probe.remove();

        expect(getComputedStyle(named(host, 'Small')).backgroundColor).toBe(hover);
    });

    it("pads the heading of a section as an item is padded, so it starts where an item's label does", async () => {
        const host = await mount(ticked);

        menu(host).style.setProperty('--ui-space', '10px');

        const heading = getComputedStyle(only(host, '#sort'));

        expect([heading.paddingTop, heading.paddingLeft]).toEqual(['5px', '10px']);
    });

    it("leaves every item as it is on a click that lands on a section's heading, or on no item, and throws nothing", async () => {
        const host = await mount(ticked);
        const before = ['Show the ruler', 'Show the grid', 'Name', 'Date'].map((text) =>
            checked(host, text),
        );

        await open(menu(host));

        const thrown = await escaped(() => {
            only(host, '#sort').click();
            panel(menu(host)).click();
        });

        expect(thrown, 'nothing thrown').toEqual([]);
        expect(
            ['Show the ruler', 'Show the grid', 'Name', 'Date'].map((text) => checked(host, text)),
            'every item as it was',
        ).toEqual(before);
        expect(menu(host).open, 'still open').toBe(true);
    });

    it('draws the heading of a section as its title, in the muted text at the supporting size', async () => {
        const host = await mount(ticked);

        menu(host).style.setProperty('--ui-text-supporting', '11px');

        const heading = getComputedStyle(only(host, '#sort'));

        expect(heading.display).toBe('block');
        expect(heading.color).toBe(resolved('--ui-color-text-muted'));
        expect(heading.fontSize).toBe('11px');
    });

    it('gives a rule of the host for its own button the last word in a section', async () => {
        const host = await mount(`<style>.mine { padding: 3px; }</style>${ticked}`);

        named(host, 'Small').classList.add('mine');

        expect(getComputedStyle(named(host, 'Small')).paddingTop).toBe('3px');
    });

    it('adopts the rules for a section once into the tree it joins, a shadow root as well', async () => {
        await mount(ticked);

        const before = document.adoptedStyleSheets.length;

        await mount(ticked);

        expect(document.adoptedStyleSheets.length, 'once for two menus').toBe(before);

        const outer = document.createElement('div');
        const root = outer.attachShadow({ mode: 'open' });
        const kept = new CSSStyleSheet();

        root.adoptedStyleSheets = [kept];
        document.body.append(outer);
        root.innerHTML = ticked;
        await (only(root, 'ui-menu') as UiMenu).updateComplete;

        expect(root.adoptedStyleSheets, 'beside the sheet the root had').toHaveLength(2);
        expect(root.adoptedStyleSheets[0], 'which it keeps').toBe(kept);
        expect(getComputedStyle(only(root, '#sort')).display, 'drawn there').toBe('block');
    });

    it("draws the tick in the system's text under forced colours, which take its fill", async () => {
        await cdp().send('Emulation.setEmulatedMedia', {
            features: [{ name: 'forced-colors', value: 'active' }],
        });

        try {
            const host = await mount(ticked);
            const probe = document.createElement('div');

            probe.style.color = 'CanvasText';
            document.body.append(probe);

            const text = getComputedStyle(probe).color;

            probe.remove();

            await open(menu(host));

            expect(matchMedia('(forced-colors: active)').matches, 'the mode is on').toBe(true);
            expect(
                getComputedStyle(named(host, 'Show the ruler'), '::before').backgroundColor,
            ).toBe(text);
            expect(getComputedStyle(named(host, 'Large'), '::before').backgroundColor).toBe(text);
        } finally {
            await cdp().send('Emulation.setEmulatedMedia', { features: [] });
        }
    });

    it('is accessible open with items that tick and sections, and with the focus in a section', async () => {
        const host = await mount(ticked);

        await open(menu(host));
        await still(menu(host));
        await expectAccessible(host);

        named(host, 'Date').focus();
        await expectAccessible(host);
    });
});

/**
 * A shortcut and a description on an item, RFC 0010's: the host's `<kbd>` and its element marked
 * `data-ui-description`, drawn by rules the menu adopts into the host's tree.
 */
describe('a shortcut and a description on an item', () => {
    /** A menu whose first item has both, written in `direction`, with a section of its own. */
    function marked(direction: 'ltr' | 'rtl' = 'ltr'): string {
        return `
            <div dir="${direction}" style="padding-inline-start: 240px">
                <ui-menu>
                    <span slot="trigger">File</span>
                    <button type="button">Rename <kbd>F2</kbd><span data-ui-description>Give the file a new name.</span></button>
                    <button type="button">Delete</button>
                    <div role="group" aria-labelledby="share">
                        <span id="share">Share</span>
                        <button type="button">Copy the link <kbd>Ctrl+L</kbd><span data-ui-description>Anyone with it can open the file.</span></button>
                    </div>
                </ui-menu>
            </div>
        `;
    }

    /** The first item of the fixture, which has both. */
    function first(host: ParentNode): HTMLElement {
        return only(host, 'ui-menu > button');
    }

    it.each([
        ['left to right, at the right', 'ltr'],
        ['right to left, at the left', 'rtl'],
    ] as const)(
        "draws the shortcut at the item's end on its label's line, and the description under the label, %s",
        async (_, direction) => {
            const host = await mount(marked(direction));

            await open(menu(host));

            const item = first(host).getBoundingClientRect();
            const kbd = only(first(host), 'kbd').getBoundingClientRect();
            const description = only(first(host), '[data-ui-description]').getBoundingClientRect();
            const padding = Number.parseFloat(getComputedStyle(first(host)).paddingLeft);
            const label = document.createRange();

            label.setStart(first(host).firstChild ?? first(host), 0);
            label.setEnd(first(host).firstChild ?? first(host), 'Rename'.length);

            const text = label.getBoundingClientRect();

            if (direction === 'ltr') {
                expect(kbd.right, 'at the end').toBeCloseTo(item.right - padding, 0);
                expect(description.left, 'from where the label starts').toBeCloseTo(text.left, 0);
            } else {
                expect(kbd.left, 'at the end').toBeCloseTo(item.left + padding, 0);
                expect(description.right, 'from where the label starts').toBeCloseTo(text.right, 0);
            }

            expect(kbd.top, "on the label's line").toBeCloseTo(text.top, 0);
            expect(description.top >= text.bottom - 1, 'under the label').toBe(true);
        },
    );

    it('draws both in the muted text, the shortcut at the label size and the description at the supporting size', async () => {
        const host = await mount(marked());

        menu(host).style.setProperty('--ui-text-supporting', '11px');
        first(host).style.fontSize = '17px';

        const kbd = getComputedStyle(only(first(host), 'kbd'));
        const description = getComputedStyle(only(first(host), '[data-ui-description]'));

        expect([kbd.color, kbd.fontSize, kbd.fontFamily]).toEqual([
            resolved('--ui-color-text-muted'),
            '17px',
            getComputedStyle(first(host)).fontFamily,
        ]);
        expect([description.color, description.fontSize, description.display]).toEqual([
            resolved('--ui-color-text-muted'),
            '11px',
            'block',
        ]);
    });

    it("gives both the item's own text under the pointer, where the muted text would fall short", async () => {
        const host = await mount(marked());

        await open(menu(host));
        await userEvent.hover(first(host));

        const text = getComputedStyle(first(host)).color;

        expect(getComputedStyle(only(first(host), 'kbd')).color).toBe(text);
        expect(getComputedStyle(only(first(host), '[data-ui-description]')).color).toBe(text);

        const inSection = only(host, '[role="group"] > button');

        await userEvent.hover(inSection);

        expect(getComputedStyle(only(inSection, 'kbd')).color, 'in a section').toBe(
            getComputedStyle(inSection).color,
        );
        expect(getComputedStyle(only(first(host), 'kbd')).color, 'once it has left').toBe(
            resolved('--ui-color-text-muted'),
        );
    });

    it('sets the shortcut apart from the label by twice the space', async () => {
        const host = await mount(marked());

        menu(host).style.setProperty('--ui-space', '7px');

        expect(getComputedStyle(only(first(host), 'kbd')).marginLeft).toBe('14px');
    });

    it('draws them in an item of a section the same', async () => {
        const host = await mount(marked());
        const item = only(host, '[role="group"] > button');

        expect(getComputedStyle(only(item, 'kbd')).cssFloat).toBe(
            getComputedStyle(only(first(host), 'kbd')).cssFloat,
        );
        expect(getComputedStyle(only(item, '[data-ui-description]')).display).toBe('block');
    });

    it('describes the item with its description, hidden from its name, and leaves the shortcut in the name', async () => {
        const host = await mount(marked());
        const description = only(first(host), '[data-ui-description]');

        expect(description.id, 'given an id').not.toBe('');
        expect(first(host).getAttribute('aria-describedby'), 'named').toBe(description.id);
        expect(description.getAttribute('aria-hidden'), 'out of the name').toBe('true');
        expect(only(first(host), 'kbd').hasAttribute('aria-hidden'), 'the shortcut heard').toBe(
            false,
        );

        const other = only(only(host, '[role="group"]'), '[data-ui-description]');

        expect(other.id, 'an id of its own').not.toBe(description.id);
        expect(only(host, '[role="group"] > button').getAttribute('aria-describedby')).toBe(
            other.id,
        );
    });

    it('keeps the id a host gave its description, and an id of its own beside it', async () => {
        const host = await mount(`
            <ui-menu>
                <span slot="trigger">File</span>
                <button type="button" aria-describedby="elsewhere">Rename <span id="mine" data-ui-description>New name.</span></button>
            </ui-menu>
            <p id="elsewhere">Renaming keeps the history.</p>
        `);

        expect(first(host).getAttribute('aria-describedby')).toBe('elsewhere mine');
    });

    it('names a description once where the host listed its id already', async () => {
        const host = await mount(`
            <ui-menu>
                <span slot="trigger">File</span>
                <button type="button" aria-describedby="mine">Rename <span id="mine" data-ui-description>New name.</span></button>
            </ui-menu>
        `);

        expect(first(host).getAttribute('aria-describedby')).toBe('mine');
    });

    it('forgets the id it wrote once the description has gone, and leaves the host the same id later', async () => {
        const host = await mount(`
            <ui-menu>
                <span slot="trigger">File</span>
                <button type="button">Rename <span id="mine" data-ui-description>New name.</span></button>
            </ui-menu>
            <p id="elsewhere-mine">Renaming keeps the history.</p>
        `);
        const item = first(host);

        only(item, '[data-ui-description]').remove();
        await open(menu(host));

        expect(item.hasAttribute('aria-describedby'), 'gone with it').toBe(false);

        await userEvent.keyboard('{Escape}');
        await settle();

        only(host, '#elsewhere-mine').id = 'mine';
        item.setAttribute('aria-describedby', 'mine');
        await open(menu(host));

        expect(item.getAttribute('aria-describedby'), "the host's own, kept").toBe('mine');
    });

    it('takes the reference away as the description goes, and gives it again as one comes', async () => {
        const host = await mount(marked());
        const item = first(host);

        only(item, '[data-ui-description]').remove();
        await open(menu(host));

        expect(item.hasAttribute('aria-describedby'), 'gone with it').toBe(false);

        await userEvent.keyboard('{Escape}');
        await settle();

        const again = document.createElement('span');

        again.dataset['uiDescription'] = '';
        again.textContent = 'A new name.';
        item.append(again);
        await open(menu(host));

        expect(item.getAttribute('aria-describedby'), 'named again').toBe(again.id);
    });

    it('keeps the shortcut and the description in an item with an icon on its line', async () => {
        const host = await mount(`
            <ui-menu>
                <span slot="trigger">File</span>
                <button type="button"><ui-icon><svg viewBox="0 0 24 24"></svg></ui-icon> Edit <kbd>Ctrl+E</kbd></button>
            </ui-menu>
        `);

        await open(menu(host));

        const icon = only(first(host), 'ui-icon').getBoundingClientRect();
        const kbd = only(first(host), 'kbd').getBoundingClientRect();

        expect(Math.abs(icon.top + icon.height / 2 - (kbd.top + kbd.height / 2)) < 4).toBe(true);
    });

    it('is accessible open with shortcuts and descriptions, and with the focus on one', async () => {
        const host = await mount(marked());

        await open(menu(host));
        await still(menu(host));
        await expectAccessible(host);

        only(host, '[role="group"] > button').focus();
        await expectAccessible(host);
    });
});

/**
 * Submenus, RFC 0010's: a `<ui-menu>` written in another is a submenu, its trigger an item of the menu
 * round it and its panel beside that item. The pointer is dispatched where a point matters, since a
 * driven pointer lands where the frame the suite runs in is drawn, which the runner scales.
 */
describe('submenus', () => {
    /** A menu holding a submenu between two items, written in `direction`. */
    function nested(direction: 'ltr' | 'rtl' = 'ltr', around = ''): string {
        return `
            <div dir="${direction}" style="padding-inline-start: 40px; ${around}">
                <ui-menu id="outer">
                    <span slot="trigger">File</span>
                    <button type="button">Rename</button>
                    <ui-menu id="share">
                        <span slot="trigger">Share</span>
                        <button type="button">Copy the link</button>
                        <button type="button">Email</button>
                    </ui-menu>
                    <button type="button">Delete</button>
                </ui-menu>
            </div>
        `;
    }

    /** A menu holding two submenus, one after the other. */
    const pair = `
        <ui-menu id="outer">
            <span slot="trigger">File</span>
            <ui-menu id="share"><span slot="trigger">Share</span><button type="button">Copy the link</button></ui-menu>
            <ui-menu id="export"><span slot="trigger">Export</span><button type="button">As PDF</button></ui-menu>
        </ui-menu>
    `;

    /** One of the fixture's menus, by its id. */
    function byId(host: ParentNode, id: string): UiMenu {
        return only(host, `#${id}`) as UiMenu;
    }

    /** A pointer event as a mouse sends it, at a point. */
    function pointer(type: string, x = 0, y = 0, kind = 'mouse'): PointerEvent {
        return new PointerEvent(type, { clientX: x, clientY: y, pointerType: kind, bubbles: true });
    }

    /** What has the focus inside a menu's own root. */
    function shadowFocus(element: UiMenu): Element | null {
        return element.shadowRoot?.activeElement ?? null;
    }

    /** The middle of an element's box. */
    function middleOf(element: Element): { x: number; y: number } {
        const box = element.getBoundingClientRect();

        return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    }

    it('draws a menu written in another as one of its items: a menuitem out of the tab order', async () => {
        const host = await mount(nested());
        const share = byId(host, 'share');

        expect(share.matches(':state(submenu)'), 'a submenu').toBe(true);
        expect(trigger(share).getAttribute('role')).toBe('menuitem');
        expect(trigger(share).getAttribute('tabindex')).toBe('-1');
        expect(byId(host, 'outer').matches(':state(submenu)'), 'the menu round it').toBe(false);
        expect(trigger(byId(host, 'outer')).hasAttribute('role'), 'its own trigger').toBe(false);
        expect(share.hasAttribute('role'), 'nothing written on the element').toBe(false);
    });

    it('takes a menu written in a section of another for a submenu too', async () => {
        const host = await mount(`
            <ui-menu>
                <span slot="trigger">File</span>
                <div role="group" aria-labelledby="more"><span id="more">More</span>
                    <ui-menu id="share"><span slot="trigger">Share</span><button type="button">Copy the link</button></ui-menu>
                </div>
            </ui-menu>
        `);

        expect(byId(host, 'share').matches(':state(submenu)')).toBe(true);
    });

    it('leaves a menu that leaves another a menu of its own', async () => {
        const host = await mount(nested());
        const share = byId(host, 'share');

        document.body.append(share);
        await share.updateComplete;

        expect(share.matches(':state(submenu)')).toBe(false);
        expect(trigger(share).hasAttribute('role')).toBe(false);
        expect(trigger(share).hasAttribute('tabindex')).toBe(false);
    });

    it('takes a menu written straight into a shadow root for a menu of its own, throwing nothing', async () => {
        const outer = document.createElement('div');
        const root = outer.attachShadow({ mode: 'open' });

        document.body.append(outer);

        try {
            const thrown = await escaped(async () => {
                root.innerHTML = `<ui-menu><span slot="trigger">File</span><button type="button">Rename</button></ui-menu>`;
                await (only(root, 'ui-menu') as UiMenu).updateComplete;
            });

            expect(thrown, 'nothing thrown').toEqual([]);
            expect(only(root, 'ui-menu').matches(':state(submenu)')).toBe(false);
        } finally {
            outer.remove();
        }
    });

    it.each([
        ['left to right', 'ltr', 'ArrowRight', 'ArrowLeft'],
        ['right to left', 'rtl', 'ArrowLeft', 'ArrowRight'],
    ] as const)(
        'opens a submenu onto its first item by the arrow toward the inline end, and closes it back onto its trigger by the other, %s',
        async (_, direction, toward, back) => {
            const host = await mount(nested(direction));
            const outer = byId(host, 'outer');
            const share = byId(host, 'share');

            trigger(outer).focus();
            await userEvent.keyboard('{ArrowDown}');
            await settle();
            await userEvent.keyboard('{ArrowDown}');

            expect(document.activeElement, 'on its trigger').toBe(share);

            await userEvent.keyboard(`{${toward}}`);
            await settle();

            expect(share.open, 'open').toBe(true);
            expect(focused(), 'onto its first item').toBe('Copy the link');

            await userEvent.keyboard(`{${back}}`);
            await settle();

            expect([share.open, outer.open], 'closed, the menu round it open').toEqual([
                false,
                true,
            ]);
            expect(document.activeElement, 'back on its trigger').toBe(share);
            expect(shadowFocus(share), 'its trigger').toBe(trigger(share));
        },
    );

    it.each([
        ['left to right', 'ltr', 'ArrowRight', 'ArrowLeft'],
        ['right to left', 'rtl', 'ArrowLeft', 'ArrowRight'],
    ] as const)(
        'opens and closes a submenu of a submenu by the arrows, leaving the one round it open, %s',
        async (_, direction, toward, back) => {
            const host = await mount(`
                <div dir="${direction}" style="padding-inline-start: 40px">
                    <ui-menu id="outer">
                        <span slot="trigger">File</span>
                        <ui-menu id="share">
                            <span slot="trigger">Share</span>
                            <button type="button">Copy the link</button>
                            <ui-menu id="post">
                                <span slot="trigger">Post</span>
                                <button type="button">To the team</button>
                            </ui-menu>
                        </ui-menu>
                    </ui-menu>
                </div>
            `);
            const share = byId(host, 'share');
            const post = byId(host, 'post');

            trigger(byId(host, 'outer')).focus();
            await userEvent.keyboard('{ArrowDown}');
            await settle();
            await userEvent.keyboard(`{${toward}}`);
            await settle();
            await userEvent.keyboard(`{ArrowDown}{${toward}}`);
            await settle();

            expect([post.open, share.open], 'open, and the one round it').toEqual([true, true]);
            expect(focused(), 'onto its first item').toBe('To the team');

            await userEvent.keyboard(`{${back}}`);
            await settle();

            expect([post.open, share.open], 'closed alone').toEqual([false, true]);
            expect(document.activeElement, 'back on its trigger').toBe(post);
        },
    );

    it('leaves a menu of its own open, the focus where it is, on the arrows to either side', async () => {
        const host = await mount(nested());
        const outer = byId(host, 'outer');

        trigger(outer).focus();
        await userEvent.keyboard('{ArrowDown}');
        await settle();
        await userEvent.keyboard('{ArrowLeft}{ArrowRight}');
        await settle();

        expect(outer.open).toBe(true);
        expect(focused()).toBe('Rename');
    });

    it('takes the arrow that opens a submenu, which would scroll the page under it otherwise', async () => {
        const host = await mount(nested());

        await open(byId(host, 'outer'));

        expect(keydown(trigger(byId(host, 'share')), 'ArrowRight').defaultPrevented).toBe(true);
    });

    it('moves over a submenu with the arrows up and down rather than opening it', async () => {
        const host = await mount(nested());
        const outer = byId(host, 'outer');

        trigger(outer).focus();
        await userEvent.keyboard('{ArrowDown}');
        await settle();
        await userEvent.keyboard('{ArrowDown}{ArrowDown}');

        expect(byId(host, 'share').open).toBe(false);
        expect(focused()).toBe('Delete');
    });

    it('closes a submenu by Escape and leaves the menu round it open, the focus on its trigger', async () => {
        const host = await mount(nested());
        const share = byId(host, 'share');

        trigger(byId(host, 'outer')).focus();
        await userEvent.keyboard('{ArrowDown}');
        await settle();
        await userEvent.keyboard('{ArrowDown}{ArrowRight}');
        await settle();
        await userEvent.keyboard('{Escape}');
        await settle();

        expect([share.open, byId(host, 'outer').open]).toEqual([false, true]);
        expect(document.activeElement).toBe(share);
    });

    it('keeps an Escape in a submenu from the menu round it, which would take the focus back as it closed later', async () => {
        // Above the menu, where no panel opens over it.
        const host = await mount(
            `<button type="button" id="elsewhere">Elsewhere</button>${nested()}`,
        );
        const outer = byId(host, 'outer');

        trigger(outer).focus();
        await userEvent.keyboard('{ArrowDown}');
        await settle();
        await userEvent.keyboard('{ArrowDown}{ArrowRight}');
        await settle();
        await userEvent.keyboard('{Escape}');
        await settle();
        await userEvent.click(only(host, '#elsewhere'));
        await settle();

        expect(outer.open, 'closed by the click').toBe(false);
        expect(document.activeElement, 'where the click put it').toBe(only(host, '#elsewhere'));
    });

    it('leaves an Escape in a menu of its own to the page', async () => {
        const host = await mount(nested());
        let heard = 0;
        const listen = (event: KeyboardEvent): void => {
            heard += event.key === 'Escape' ? 1 : 0;
        };

        document.addEventListener('keydown', listen);

        try {
            trigger(byId(host, 'outer')).focus();
            await userEvent.keyboard('{ArrowDown}');
            await settle();
            await userEvent.keyboard('{Escape}');
        } finally {
            document.removeEventListener('keydown', listen);
        }

        expect(heard).toBe(1);
    });

    it('closes both on a choice made in a submenu, the focus going back to the first trigger', async () => {
        const host = await mount(nested());
        const outer = byId(host, 'outer');

        trigger(outer).focus();
        await userEvent.keyboard('{ArrowDown}');
        await settle();
        await userEvent.keyboard('{ArrowDown}{ArrowRight}');
        await settle();
        await userEvent.keyboard('{Enter}');
        await settle();

        expect([byId(host, 'share').open, outer.open]).toEqual([false, false]);
        expect(document.activeElement).toBe(outer);
    });

    it('opens a submenu by a press of its trigger, leaving the menu round it open', async () => {
        const host = await mount(nested());

        await open(byId(host, 'outer'));
        trigger(byId(host, 'share')).click();
        // The property follows the platform's own state, which `toggle` brings a task later.
        await vi.waitFor(() => {
            expect(byId(host, 'share').open).toBe(true);
        });

        expect(byId(host, 'outer').open, 'the menu round it').toBe(true);
    });

    it("types to a submenu's trigger by its label", async () => {
        const host = await mount(nested());

        trigger(byId(host, 'outer')).focus();
        await userEvent.keyboard('{ArrowDown}');
        await settle();
        await userEvent.keyboard('s');

        expect(document.activeElement).toBe(byId(host, 'share'));
    });

    it('types past a submenu whose trigger has no label, throwing nothing', async () => {
        const host = await mount(`
            <ui-menu id="outer">
                <span slot="trigger">File</span>
                <button type="button">Rename</button>
                <ui-menu><button type="button">Copy the link</button></ui-menu>
                <button type="button">Delete</button>
            </ui-menu>
        `);

        trigger(byId(host, 'outer')).focus();
        await userEvent.keyboard('{ArrowDown}');
        await settle();

        const thrown = await escaped(async () => {
            await userEvent.keyboard('s');
        });

        expect(thrown, 'nothing thrown').toEqual([]);
        expect(focused(), 'where it was').toBe('Rename');
    });

    it.each([
        ['left to right', 'ltr', '-90deg'],
        ['right to left', 'rtl', '90deg'],
    ] as const)(
        'draws its trigger as an item, the caret turned toward where the panel opens, %s',
        async (_, direction, turned) => {
            const host = await mount(nested(direction));
            const share = byId(host, 'share');

            share.style.setProperty('--ui-space', '10px');

            const drawn = getComputedStyle(trigger(share));

            expect(drawn.display).toBe('flex');
            expect([drawn.paddingTop, drawn.paddingLeft]).toEqual(['5px', '10px']);
            expect(drawn.columnGap, 'the caret apart from the label by the space').toBe('10px');
            expect(drawn.backgroundColor, 'no fill at rest').toBe('rgba(0, 0, 0, 0)');
            expect(getComputedStyle(trigger(share), '::after').content, 'no edge').toBe('none');
            expect(getComputedStyle(caret(share)).rotate).toBe(turned);

            await open(byId(host, 'outer'));
            share.open = true;
            await settle();

            expect(getComputedStyle(caret(share)).rotate, 'kept as it opens').toBe(turned);
        },
    );

    it('stands down the effects of a button its trigger answers on a menu of its own', async () => {
        const host = await mount(nested());
        const share = getComputedStyle(byId(host, 'share'));

        for (const moment of [
            'hover-fill',
            'hover-border',
            'hover-shadow',
            'focus-fill',
            'focus-move',
            'focus-ring',
            'focus-shadow',
            'press-fill',
            'press-move',
            'press-shadow',
            'caret',
        ]) {
            expect(share.getPropertyValue(`--ui-motion-menu-${moment}`), moment).toBe('none');
        }
    });

    it('lights its trigger while its panel is open', async () => {
        const host = await mount(nested());
        const share = byId(host, 'share');

        share.style.setProperty('--ui-duration-state', '0s');
        await open(byId(host, 'outer'));
        share.open = true;
        await settle();

        const probe = document.createElement('div');

        probe.style.backgroundColor = String(reference('--ui-color-hover'));
        document.body.append(probe);

        const hover = getComputedStyle(probe).backgroundColor;

        probe.remove();

        expect(getComputedStyle(trigger(share)).backgroundColor).toBe(hover);
    });

    it.each([
        ['left to right, to its right', 'ltr'],
        ['right to left, to its left', 'rtl'],
    ] as const)(
        'hangs its panel beside its trigger, clear of the menu round it, its first item level with it, %s',
        async (_, direction) => {
            const host = await mount(nested(direction));
            const share = byId(host, 'share');

            share.style.setProperty('--ui-space', '8px');
            await open(byId(host, 'outer'));
            share.open = true;
            await settle();

            const anchor = trigger(share).getBoundingClientRect();
            const box = panel(share).getBoundingClientRect();
            const first = only(share, 'button').getBoundingClientRect();

            if (direction === 'ltr') {
                expect(box.left).toBeCloseTo(anchor.right + 5, 0);
            } else {
                expect(box.right).toBeCloseTo(anchor.left - 5, 0);
            }

            expect(first.top, 'its first item level').toBeCloseTo(anchor.top, 0);
        },
    );

    it('turns its panel toward the inline start where it would run off the screen', async () => {
        const host = await mount(nested('ltr', 'display: flex; justify-content: flex-end'));
        const share = byId(host, 'share');

        await open(byId(host, 'outer'));
        share.open = true;
        await settle();

        expect(panel(share).getBoundingClientRect().right).toBeLessThanOrEqual(
            trigger(share).getBoundingClientRect().left,
        );
    });

    it('opens a submenu once the pointer has rested on its trigger, and leaves the focus where it was', async () => {
        const host = await mount(nested());
        const share = byId(host, 'share');

        await open(byId(host, 'outer'));

        const before = document.activeElement;

        trigger(share).dispatchEvent(pointer('pointerenter'));
        await wait(50);

        expect(share.open, 'not yet').toBe(false);

        await wait(100);

        expect(share.open, 'rested').toBe(true);
        expect(document.activeElement, 'the focus where it was').toBe(before);
    });

    it('opens nothing when the pointer goes before it has rested, nor for a touch', async () => {
        const host = await mount(nested());
        const share = byId(host, 'share');

        await open(byId(host, 'outer'));
        trigger(share).dispatchEvent(pointer('pointerenter'));
        await wait(50);
        trigger(share).dispatchEvent(pointer('pointerleave'));
        await wait(100);

        expect(share.open, 'gone before').toBe(false);

        trigger(share).dispatchEvent(pointer('pointerenter', 0, 0, 'touch'));
        await wait(150);

        expect(share.open, 'a touch').toBe(false);
    });

    it('opens the submenu the pointer rests on after passing over the trigger of another', async () => {
        const host = await mount(pair);
        const exported = byId(host, 'export');

        await open(byId(host, 'outer'));
        trigger(byId(host, 'share')).dispatchEvent(pointer('pointerenter'));
        await wait(50);
        trigger(byId(host, 'share')).dispatchEvent(pointer('pointerleave'));
        trigger(exported).dispatchEvent(pointer('pointerenter'));
        await wait(150);

        expect([byId(host, 'share').open, exported.open]).toEqual([false, true]);
    });

    it('leaves a submenu a press opened open as a touch lifts off its trigger', async () => {
        const host = await mount(nested());
        const share = byId(host, 'share');

        await open(byId(host, 'outer'));
        trigger(share).click();
        // Open as the touch lifts, which `toggle` says a task after the press.
        await vi.waitFor(() => {
            expect(share.open).toBe(true);
        });

        const middle = middleOf(trigger(share));

        trigger(share).dispatchEvent(pointer('pointerleave', middle.x, middle.y, 'touch'));
        await wait(350);

        expect(share.open).toBe(true);
    });

    it('keeps a menu of its own open as the pointer leaves its trigger, and opens nothing as it rests there', async () => {
        const host = await mount(nested());
        const outer = byId(host, 'outer');
        const thrown = await escaped(async () => {
            trigger(outer).dispatchEvent(pointer('pointerenter'));
            await wait(150);

            expect(outer.open, 'rested on').toBe(false);

            await open(outer);
            trigger(outer).dispatchEvent(
                pointer('pointerleave', ...Object.values(middleOf(trigger(outer)))),
            );
            await wait(350);
        });

        expect(thrown, 'nothing thrown').toEqual([]);
        expect(outer.open, 'left').toBe(true);
    });

    it.each([
        ['left to right', 'ltr', 1],
        ['right to left', 'rtl', -1],
    ] as const)(
        'keeps an open submenu while the pointer crosses toward it, and closes it as the pointer leaves the way, %s',
        async (_, direction, toward) => {
            const host = await mount(nested(direction));
            const share = byId(host, 'share');

            await open(byId(host, 'outer'));
            share.open = true;
            await settle();

            const from = trigger(share).getBoundingClientRect();
            const box = panel(share).getBoundingClientRect();
            const exit = {
                x: toward > 0 ? from.right - 2 : from.left + 2,
                y: from.top + from.height / 2,
            };
            const near = toward > 0 ? box.left : box.right;

            trigger(share).dispatchEvent(pointer('pointerleave', exit.x, exit.y));
            // On the way to its lower corner.
            document.dispatchEvent(
                pointer('pointermove', (exit.x + near) / 2, (exit.y + box.bottom) / 2 - 2),
            );

            expect(share.open, 'on the way').toBe(true);

            // Straight down, off the way.
            document.dispatchEvent(pointer('pointermove', exit.x - toward * 20, from.bottom + 20));

            expect(share.open, 'off it').toBe(false);
        },
    );

    it('keeps an open submenu while the pointer crosses on a slant up toward it, close by its corner', async () => {
        // Low on the page, where a crossing figured from the sum of two heights rather than their
        // difference would lie a pixel off the submenu's edge.
        const host = await mount(nested('ltr', 'margin-block-start: 120px'));
        const share = byId(host, 'share');

        await open(byId(host, 'outer'));
        share.open = true;
        await settle();

        const from = trigger(share).getBoundingClientRect();
        const box = panel(share).getBoundingClientRect();
        const exit = { x: from.right - 2, y: from.top + from.height / 2 };

        trigger(share).dispatchEvent(pointer('pointerleave', exit.x, exit.y));
        // A pixel above where it left, and two short of the submenu.
        document.dispatchEvent(pointer('pointermove', box.left - 2, exit.y - 1));

        expect(share.open).toBe(true);
    });

    it.each([
        ['left to right', 'ltr', 1],
        ['right to left', 'rtl', -1],
    ] as const)(
        'takes five pixels back from where the pointer left for the way, %s',
        async (_, direction, toward) => {
            const host = await mount(nested(direction));
            const share = byId(host, 'share');

            await open(byId(host, 'outer'));
            share.open = true;
            await settle();

            const from = trigger(share).getBoundingClientRect();
            const exit = {
                x: toward > 0 ? from.right - 2 : from.left + 2,
                y: from.top + from.height / 2,
            };

            trigger(share).dispatchEvent(pointer('pointerleave', exit.x, exit.y));
            document.dispatchEvent(pointer('pointermove', exit.x - toward * 3, exit.y));

            expect(share.open, 'three pixels back').toBe(true);

            document.dispatchEvent(pointer('pointermove', exit.x - toward * 7, exit.y));

            expect(share.open, 'seven pixels back').toBe(false);
        },
    );

    it('takes a submenu a host hangs flush against its trigger for one ahead of it', async () => {
        const host = await mount(`
            <style>#share::part(menu) { margin-inline-start: 0 }</style>
            ${nested()}
        `);
        const share = byId(host, 'share');

        await open(byId(host, 'outer'));
        share.open = true;
        await settle();

        const from = trigger(share).getBoundingClientRect();
        const box = panel(share).getBoundingClientRect();

        expect(box.left, 'flush').toBe(from.right);

        trigger(share).dispatchEvent(pointer('pointerleave', from.right - 2, from.bottom - 1));
        // Down across the item below, toward the submenu's lower part.
        document.dispatchEvent(pointer('pointermove', from.right - 1, from.bottom + 2));

        expect(share.open).toBe(true);
    });

    it('closes an open submenu once the wait runs out, and keeps it where the pointer reaches it or comes back', async () => {
        const host = await mount(nested());
        const share = byId(host, 'share');
        const from = (): { x: number; y: number } => {
            const box = trigger(share).getBoundingClientRect();

            return { x: box.right - 2, y: box.top + box.height / 2 };
        };

        await open(byId(host, 'outer'));
        share.open = true;
        await settle();
        trigger(share).dispatchEvent(pointer('pointerleave', from().x, from().y));
        await wait(200);

        expect(share.open, 'waiting still').toBe(true);

        await wait(150);

        expect(share.open, 'the wait run out').toBe(false);

        share.open = true;
        await settle();
        trigger(share).dispatchEvent(pointer('pointerleave', from().x, from().y));
        panel(share).dispatchEvent(
            pointer('pointerenter', ...Object.values(middleOf(panel(share)))),
        );
        await wait(350);

        expect(share.open, 'reached').toBe(true);

        trigger(share).dispatchEvent(pointer('pointerleave', from().x, from().y));
        trigger(share).dispatchEvent(pointer('pointerenter', from().x, from().y));
        await wait(350);

        expect(share.open, 'come back to').toBe(true);
    });

    it('waits for nothing once the pointer has reached an open submenu, wherever the pointer goes after', async () => {
        const host = await mount(nested());
        const share = byId(host, 'share');

        await open(byId(host, 'outer'));
        share.open = true;
        await settle();

        const from = trigger(share).getBoundingClientRect();
        const thrown = await escaped(async () => {
            // Reached with no wait to end, as a submenu opened by a press is.
            panel(share).dispatchEvent(pointer('pointerenter'));
            trigger(share).dispatchEvent(
                pointer('pointerleave', from.right - 2, from.top + from.height / 2),
            );
            panel(share).dispatchEvent(pointer('pointerenter'));
            // Far off the way, as the pointer goes on past the submenu.
            document.dispatchEvent(pointer('pointermove', 0, 0));
            await wait(350);
        });

        expect(thrown, 'nothing thrown').toEqual([]);
        expect(share.open, 'still open').toBe(true);
    });

    it('opens nothing once a submenu the pointer rested on is taken out', async () => {
        const host = await mount(nested());
        const share = byId(host, 'share');

        await open(byId(host, 'outer'));

        const thrown = await escaped(async () => {
            trigger(share).dispatchEvent(pointer('pointerenter'));
            await wait(50);
            share.remove();
            await wait(100);
        });

        expect(thrown, 'nothing thrown').toEqual([]);
        expect(share.open, 'never opened').toBe(false);
    });

    it('opens nothing the pointer crosses while a submenu waits for it', async () => {
        const host = await mount(pair);
        const share = byId(host, 'share');
        const exported = byId(host, 'export');

        await open(byId(host, 'outer'));
        share.open = true;
        await settle();

        const from = trigger(share).getBoundingClientRect();

        trigger(share).dispatchEvent(pointer('pointerleave', from.right - 2, from.bottom - 2));
        trigger(exported).dispatchEvent(pointer('pointerenter'));
        await wait(150);

        expect(exported.open, 'crossed').toBe(false);

        await wait(250);
        trigger(exported).dispatchEvent(pointer('pointerenter'));
        await wait(150);

        expect(exported.open, 'once the wait has ended').toBe(true);
    });

    it('is accessible open with a submenu open, and with the focus in it', async () => {
        const host = await mount(nested());

        trigger(byId(host, 'outer')).focus();
        await userEvent.keyboard('{ArrowDown}');
        await settle();
        await userEvent.keyboard('{ArrowDown}{ArrowRight}');
        await settle();
        await still(byId(host, 'share'));

        await expectAccessible(host);
    });
});

/**
 * Opened at the pointer, RFC 0010's: a context menu, `<ui-menu context>` written in what it serves,
 * opened at the pointer by `contextmenu` and at the focused element by the menu key and Shift+F10.
 * The events are dispatched at the points that matter, for the frame's scale.
 */
describe('opened at the pointer, a context menu', () => {
    /** An area served by a context menu, with a button in it, written in `direction`. */
    function served(
        direction: 'ltr' | 'rtl' = 'ltr',
        style = 'padding: 20px; block-size: 120px',
    ): string {
        return `
            <div id="area" dir="${direction}" style="${style}">
                <button type="button" id="inside">Focused</button>
                <ui-menu context>
                    <button type="button">Paste</button>
                    <button type="button">Select all</button>
                </ui-menu>
            </div>
        `;
    }

    /** A secondary click at a point, as `contextmenu` reaches the page, with the button up or down. */
    function secondary(x: number, y: number, buttons = 0): MouseEvent {
        return new MouseEvent('contextmenu', {
            clientX: x,
            clientY: y,
            buttons,
            bubbles: true,
            cancelable: true,
            composed: true,
        });
    }

    /**
     * Lets an opening land: its frame, and the task its `toggle` comes in, which moves the focus and
     * which a dispatched event, unlike a driven press, does not wait for.
     */
    async function shown(): Promise<void> {
        await settle();
        await wait(0);
    }

    /** Where the panel's corner at the point is, in the direction it opens toward. */
    function corner(element: UiMenu, direction: 'ltr' | 'rtl' = 'ltr'): { x: number; y: number } {
        const box = panel(element).getBoundingClientRect();

        return { x: direction === 'ltr' ? box.left : box.right, y: box.top };
    }

    it('opens at the pointer on a secondary click in what it serves, keeping the platform menu shut', async () => {
        const host = await mount(served());
        const click = secondary(60, 50);

        only(host, '#area').dispatchEvent(click);
        await shown();

        expect(click.defaultPrevented, 'the platform menu kept shut').toBe(true);
        expect(menu(host).open).toBe(true);
        expect(corner(menu(host)).x).toBeCloseTo(60, 0);
        expect(corner(menu(host)).y).toBeCloseTo(50, 0);
        expect(focused(), 'the focus in it').toBe('Paste');

        await userEvent.keyboard('{Escape}');
        window.dispatchEvent(new PointerEvent('pointerup'));
        await shown();

        expect(menu(host).open, 'not again as the next button comes up').toBe(false);
    });

    it('opens once the secondary button is up, where it came with the button down', async () => {
        const host = await mount(served());

        only(host, '#area').dispatchEvent(secondary(60, 50, 2));
        await settle();

        expect(menu(host).open, 'the button down').toBe(false);

        window.dispatchEvent(new PointerEvent('pointerup'));
        await wait(0);
        await settle();

        expect(menu(host).open, 'up').toBe(true);
        expect(corner(menu(host)).x).toBeCloseTo(60, 0);

        await userEvent.keyboard('{Escape}');
        window.dispatchEvent(new PointerEvent('pointerup'));
        await shown();

        expect(menu(host).open, 'once').toBe(false);
    });

    it.each([
        ['the menu key', '{ContextMenu}'],
        ['Shift+F10', '{Shift>}{F10}{/Shift}'],
    ])(
        'opens at the focused element on %s, once, and gives it the focus back on Escape',
        async (_, keys) => {
            const host = await mount(served());
            const button = only(host, '#inside');
            let heard = 0;

            only(host, '#area').addEventListener('contextmenu', () => {
                heard += 1;
            });
            button.focus();
            await userEvent.keyboard(keys);
            await settle();

            const middle = button.getBoundingClientRect();

            expect(menu(host).open).toBe(true);
            expect(corner(menu(host)).x).toBeCloseTo(middle.left + middle.width / 2, 0);
            expect(corner(menu(host)).y).toBeCloseTo(middle.top + middle.height / 2, 0);
            expect(heard, 'no contextmenu besides').toBe(0);

            await userEvent.keyboard('{Escape}');
            await settle();

            expect(document.activeElement, 'the focus given back').toBe(button);
        },
    );

    it('opens for no other key, nor for F10 without Shift', async () => {
        const host = await mount(served());

        only(host, '#inside').focus();
        await userEvent.keyboard('{F10}{Shift>}{F9}{/Shift}');
        await settle();

        expect(menu(host).open).toBe(false);
    });

    it('leaves what happens in the menu to it', async () => {
        const host = await mount(served());

        only(host, '#area').dispatchEvent(secondary(60, 50));
        await settle();

        const inside = secondary(200, 200);

        only(menu(host), 'button').dispatchEvent(inside);
        only(menu(host), 'button').dispatchEvent(
            new KeyboardEvent('keydown', { key: 'ContextMenu', bubbles: true, cancelable: true }),
        );

        expect(inside.defaultPrevented, 'left to it').toBe(false);
        expect(corner(menu(host)).x, 'where it was').toBeCloseTo(60, 0);
    });

    it('moves an open context menu to where it is asked for again, keeping where the focus goes back', async () => {
        const host = await mount(served());
        const button = only(host, '#inside');

        button.focus();
        await userEvent.keyboard('{ContextMenu}');
        await settle();
        only(host, '#area').dispatchEvent(secondary(120, 90));
        await settle();

        expect(menu(host).open).toBe(true);
        expect(corner(menu(host)).x).toBeCloseTo(120, 0);
        expect(corner(menu(host)).y).toBeCloseTo(90, 0);

        await userEvent.keyboard('{Escape}');
        await settle();

        expect(document.activeElement, 'to what had it as the menu first opened').toBe(button);
    });

    it('turns back inside the screen near its edges', async () => {
        const host = await mount(served('ltr', 'position: fixed; inset: 0'));

        only(host, '#area').dispatchEvent(secondary(window.innerWidth - 4, window.innerHeight - 4));
        await settle();

        const box = panel(menu(host)).getBoundingClientRect();

        expect(box.right, 'inside on the right').toBeLessThanOrEqual(window.innerWidth);
        expect(box.bottom, 'and at the bottom').toBeLessThanOrEqual(window.innerHeight);
    });

    it('opens toward the inline end right to left', async () => {
        const host = await mount(served('rtl'));

        only(host, '#area').dispatchEvent(secondary(220, 50));
        await settle();

        expect(corner(menu(host), 'rtl').x).toBeCloseTo(220, 0);
    });

    it('draws no trigger, and takes no box where it is written', async () => {
        const host = await mount(served());

        expect(getComputedStyle(trigger(menu(host))).display).toBe('none');
        expect(getComputedStyle(menu(host)).display).toBe('contents');
    });

    it('leaves the menu on Escape where nothing had the focus as it opened', async () => {
        const host = await mount(served());

        only(host, '#area').dispatchEvent(secondary(60, 50));
        await settle();

        expect(focused()).toBe('Paste');

        await userEvent.keyboard('{Escape}');
        await settle();

        expect(menu(host).contains(document.activeElement), 'out of the menu').toBe(false);
    });

    it('opens for nothing where it no longer serves: moved out, or no longer a context menu', async () => {
        const host = await mount(served());
        const element = menu(host);

        element.context = false;
        await element.updateComplete;

        const off = secondary(60, 50);

        only(host, '#area').dispatchEvent(off);

        expect([off.defaultPrevented, element.open], 'no longer one').toEqual([false, false]);

        element.context = true;
        await element.updateComplete;

        // Into an element of its own beside the area, which serves what that element holds alone.
        const elsewhere = document.createElement('div');

        document.body.append(elsewhere);
        elsewhere.append(element);

        const moved = secondary(60, 50);

        only(host, '#area').dispatchEvent(moved);

        expect([moved.defaultPrevented, element.open], 'moved out').toEqual([false, false]);

        elsewhere.dispatchEvent(secondary(10, 10));
        await shown();

        expect(element.open, 'serving where it went').toBe(true);
    });

    it('leaves the element it served alone once taken out', async () => {
        const host = await mount(served());
        const element = menu(host);

        element.remove();

        const thrown = await escaped(async () => {
            const after = secondary(60, 50);

            only(host, '#area').dispatchEvent(after);

            expect(after.defaultPrevented, 'the platform menu its own again').toBe(false);

            await shown();
        });

        expect(thrown, 'nothing thrown').toEqual([]);
        expect(element.open, 'never opened').toBe(false);
    });

    it('leaves the focus to a dialog an item opened, throwing nothing', async () => {
        const host = await mount(`
            ${served()}
            <dialog id="asked"><input id="field" aria-label="Name" /></dialog>
        `);
        const dialog = only(host, '#asked') as HTMLDialogElement;

        // What the item does: it opens a dialog, which takes the focus to its field.
        only(menu(host), 'button').addEventListener('click', () => {
            dialog.showModal();
        });
        only(host, '#inside').focus();
        await userEvent.keyboard('{ContextMenu}');
        await settle();

        const thrown = await escaped(async () => {
            await userEvent.keyboard('{Enter}');
            await settle();
        });

        expect(thrown, 'nothing thrown').toEqual([]);
        expect(document.activeElement, 'in the dialog').toBe(only(host, '#field'));

        dialog.close();
    });

    it('takes the focus back, throwing nothing, from a choice made where it holds no focus', async () => {
        const host = await mount(served());
        const button = only(host, '#inside');

        button.focus();
        await userEvent.keyboard('{ContextMenu}');
        await settle();
        // Out of the menu, which stays open, for a choice the host makes by script.
        button.focus();

        const thrown = await escaped(async () => {
            only(menu(host), 'button').click();
            await shown();
        });

        expect(thrown, 'nothing thrown').toEqual([]);
        expect(menu(host).open, 'closed').toBe(false);
        expect(document.activeElement, 'where it was').toBe(button);
    });

    it('gives a menu of its own the focus back on its trigger, whatever had it as the menu opened', async () => {
        const host = await mount(
            `${fixture}<button type="button" id="elsewhere">Elsewhere</button>`,
        );
        const element = menu(host);

        only(host, '#elsewhere').focus();
        element.open = true;
        await settle();
        await userEvent.keyboard('{Escape}');
        await settle();

        expect(document.activeElement, 'the menu').toBe(element);
        expect(element.shadowRoot?.activeElement, 'its trigger').toBe(trigger(element));
    });

    it('serves nothing written straight into a shadow root, throwing nothing', async () => {
        const outer = document.createElement('div');
        const root = outer.attachShadow({ mode: 'open' });

        document.body.append(outer);

        const thrown = await escaped(async () => {
            root.innerHTML = `<ui-menu context><button type="button">Paste</button></ui-menu>`;
            await (only(root, 'ui-menu') as UiMenu).updateComplete;
        });

        expect(thrown, 'nothing thrown').toEqual([]);
    });

    it('takes context from the attribute, and reflects it', async () => {
        const host = await mount(fixture);
        const element = menu(host);

        element.setAttribute('context', '');

        expect(element.context).toBe(true);

        element.context = false;
        await element.updateComplete;

        expect(element.hasAttribute('context')).toBe(false);
    });

    it('is accessible open', async () => {
        const host = await mount(served());

        only(host, '#area').dispatchEvent(secondary(60, 50));
        await settle();
        await still(menu(host));

        await expectAccessible(host);
    });
});

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

    it.each([
        ['the page leaves it', ''],
        ['a line shorter than the caret', 'line-height: 1'],
        ['a line twice the text', 'line-height: 2'],
    ])('stands as tall as the secondary button it is, on %s', async (_, style) => {
        // The caret is an icon's size, which a face with a short line, Matrix's, sets taller
        // than the label: it made the trigger 2px taller than a button beside it.
        const host = await mount(
            `<div style="${style}">${fixture}<ui-button variant="secondary">Actions</ui-button></div>`,
        );
        const mine = trigger(menu(host)).getBoundingClientRect();
        const theirs = inner(only(host, 'ui-button'), 'button').getBoundingClientRect();

        expect(mine.height).toBeCloseTo(theirs.height, 1);
        expect(
            caret(menu(host)).getBoundingClientRect().top +
                caret(menu(host)).getBoundingClientRect().height / 2,
            'the caret, on its middle',
        ).toBeCloseTo(mine.top + mine.height / 2, 1);
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
        expect(
            getComputedStyle(trigger(element), '::after').borderTopColor,
            'drawn in the text, so the edge follows it',
        ).toBe('rgb(4, 5, 6)');
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
        element.style.setProperty('--ui-color-border-overlay', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-color-surface-raised', 'rgb(4, 5, 6)');
        element.style.setProperty('--ui-backdrop-raised', 'blur(10px)');
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
        expect(styles.backdropFilter).toBe('blur(10px)');
        expect(styles.color).toBe('rgb(7, 8, 9)');
        expect(styles.fontFamily).toBe('Courier');
        // On a layer over the panel, lit in the accent, and in the way of no item.
        const lift = getComputedStyle(panel(element), '::before');

        expect(lift.boxShadow).toBe('rgb(1, 2, 3) 0px 4px 8px 0px');
        expect(styles.boxShadow, 'and none on the panel').toBe('none');
        expect(lift.position).toBe('absolute');
        expect(lift.top).toBe('-1px');
        expect(lift.borderTopLeftRadius).toBe('11px');
        expect(lift.pointerEvents).toBe('none');
        expect(styles.marginBlockStart, 'the gap, on its trigger side').toBe('5px');
    });

    it('lights a lift written in currentColor in the accent, not in the text', async () => {
        const host = await mount(fixture);
        const element = menu(host);

        element.style.setProperty('--ui-elevation-raised', '0 0 0 1px currentColor');
        element.style.setProperty('--ui-color-accent', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-color-text', 'rgb(7, 8, 9)');
        await open(element);

        expect(getComputedStyle(panel(element), '::before').boxShadow).toBe(
            'rgb(1, 2, 3) 0px 0px 0px 1px',
        );
    });

    it('takes the gap above from the host when it flips', async () => {
        const host = await mount(
            `<div style="position: fixed; inset-block-end: 0; inset-inline-start: 0">${fixture}</div>`,
        );
        menu(host).style.setProperty('--ui-space', '10px');
        await open(menu(host));

        const anchor = trigger(menu(host)).getBoundingClientRect();
        const box = panel(menu(host)).getBoundingClientRect();

        expect(anchor.top - box.bottom).toBeCloseTo(5, 0);
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

    it("keeps an item on the 24px WCAG 2.2's 2.5.8 asks, however small a host makes it", async () => {
        // Items sit one against the next, so the criterion's spacing exception saves none, and
        // RFC 0008's compact density comes within a pixel of the floor.
        const host = await mount(fixture);
        const element = menu(host);

        element.style.setProperty('--ui-space', '0px');
        element.style.fontSize = '8px';
        await open(element);

        expect(item(host, 0).getBoundingClientRect().height).toBe(24);
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

/**
 * An icon in the trigger's label or in an item, #395: fitted to the line it is on, as a button
 * fits one, so each is as tall as one without an icon, with the icon and the label on its middle.
 * Compared rather than written down: a trigger against a secondary button and a trigger with no
 * icon in the same line of text, where they align by their baselines, and an item against one
 * with no icon in the same menu — each label against one with the same text, whose glyphs are
 * snapped to the same pixels.
 */
describe("an icon in the trigger's label or in an item", () => {
    /** An icon with a mark of the test's own, so no registry is asked for a glyph. */
    const glyph = '<ui-icon><svg viewBox="0 0 24 24"></svg></ui-icon>';

    /** The lines the menu is measured on, the compact density as it writes the space and text. */
    const lines = [
        ['the page leaves it', ''],
        ['a line no taller than the text', 'line-height: 1'],
        ['a line twice the text', 'line-height: 2'],
        ['an icon larger than the line', '--ui-icon-size: 2em'],
        ['smaller text', 'font-size: 12px'],
        ['the compact density', '--ui-space: 0.375rem; font-size: 0.875em'],
    ] as const;

    /** Where a trigger holds its icon, and the way its line runs. */
    const labels = [
        ['before the label', `<span slot="trigger">${glyph} More</span>`, 'ltr'],
        ['after it', `<span slot="trigger">More ${glyph}</span>`, 'ltr'],
        ['before it, right to left', `<span slot="trigger">${glyph} More</span>`, 'rtl'],
        [
            'alone',
            '<span slot="trigger"><ui-icon label="More"><svg viewBox="0 0 24 24"></svg></ui-icon></span>',
            'ltr',
        ],
        ['inside an element of yours', `<span slot="trigger"><b>${glyph} More</b></span>`, 'ltr'],
        [
            'slotted beside the label',
            '<ui-icon slot="trigger"><svg viewBox="0 0 24 24"></svg></ui-icon><span slot="trigger">More</span>',
            'ltr',
        ],
    ] as const;

    /** The middle of a box, top to bottom. */
    const middle = (box: DOMRect): number => box.top + box.height / 2;

    /** How far the middle of `inside` lies below the middle of `box`. */
    const offset = (inside: DOMRect, box: DOMRect): number => middle(inside) - middle(box);

    /** The first text a node holds, measured as it is drawn. */
    function text(node: Node): DOMRect {
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);

        for (let found = walker.nextNode(); found !== null; found = walker.nextNode()) {
            const content = found.textContent ?? '';

            if (content.trim() !== '') {
                const start = content.indexOf(content.trim());
                const range = document.createRange();
                range.setStart(found, start);
                range.setEnd(found, start + content.trim().length);

                return range.getBoundingClientRect();
            }
        }

        throw new Error('the node holds no text');
    }

    /** The icon a node holds. */
    const icon = (node: ParentNode): DOMRect => only(node, 'ui-icon').getBoundingClientRect();

    it.each(
        lines.flatMap(([on, style]) =>
            labels.map(
                ([where, label, direction]) =>
                    [where, on, label, `${style}; direction: ${direction}`] as const,
            ),
        ),
    )(
        'keeps a trigger with an icon %s as tall as the button it is, on %s',
        async (_, __, label, style) => {
            const host = await mount(
                `<p style="margin: 0; white-space: nowrap; ${style}">${[
                    '<ui-button variant="secondary">More</ui-button>',
                    '<ui-menu id="labelled"><span slot="trigger">More</span><button type="button">Rename</button></ui-menu>',
                    `<ui-menu id="iconed">${label}<button type="button">Rename</button></ui-menu>`,
                ].join(' ')}</p>`,
            );
            const labelled = only(host, '#labelled') as UiMenu;
            const iconed = only(host, '#iconed') as UiMenu;
            const box = trigger(iconed).getBoundingClientRect();
            const by = inner(only(host, 'ui-button'), 'button').getBoundingClientRect();
            const words = [...iconed.querySelectorAll('[slot="trigger"]')].find(
                (node) => node.textContent.trim() !== '',
            );

            expect(offset(icon(iconed), box), "the icon, on the trigger's middle").toBeCloseTo(
                0,
                1,
            );

            if (words !== undefined) {
                expect(
                    offset(text(words), box),
                    'the label, where a trigger with no icon holds it',
                ).toBeCloseTo(
                    offset(
                        text(only(labelled, '[slot="trigger"]')),
                        trigger(labelled).getBoundingClientRect(),
                    ),
                    1,
                );
            }

            expect(box.height, 'as tall as the button').toBeCloseTo(by.height, 1);
            expect(box.top, 'on the same baseline').toBeCloseTo(by.top, 1);
        },
    );

    it.each(lines)('keeps an item with an icon as tall as one without, on %s', async (_, style) => {
        const host = await mount(
            `<div style="${style}"><ui-menu><span slot="trigger">More</span>${[
                '<button type="button">Rename</button>',
                `<button type="button">${glyph} Rename</button>`,
                `<button type="button">Rename ${glyph}</button>`,
                `<button type="button" dir="rtl">${glyph} Rename</button>`,
                '<button type="button"><ui-icon label="Rename"><svg viewBox="0 0 24 24"></svg></ui-icon></button>',
                `<button type="button"><span>${glyph} Rename</span></button>`,
            ].join('')}</ui-menu></div>`,
        );

        await open(menu(host));

        const [bare, ...iconed] = items(host);

        if (bare === undefined || iconed.length !== 5) {
            throw new Error('the menu holds fewer items than it was given');
        }

        const by = bare.getBoundingClientRect();

        for (const each of iconed) {
            const box = each.getBoundingClientRect();

            expect(box.height, 'as tall').toBeCloseTo(by.height, 1);
            expect(offset(icon(each), box), "the icon, on the item's middle").toBeCloseTo(0, 1);

            if (each.textContent.trim() !== '') {
                expect(
                    offset(text(each), box),
                    'the label, where an item with none holds it',
                ).toBeCloseTo(offset(text(bare), by), 1);
            }
        }
    });
});

/**
 * RFC 0006's second rollout step, first element. `<ui-menu>` renders its own trigger, so an
 * `aria-describedby` written in the host's tree names a node the trigger cannot resolve —
 * the tooltip hands the sentence over and this element renders it where the reference does.
 *
 * It is taken first in step 2 because it is the hardest place the protocol goes: a popover,
 * an `aria-controls` reference of its own, and a focus return written by hand across the
 * shadow boundary. Anything the protocol breaks here is worth learning at the start.
 */
/**
 * The glow a theme lights a control with, on the trigger as on a button: a layer over it,
 * because a theme writes the glow in `currentColor` and the trigger's own colour is its text.
 */
describe('the glow a theme lights', () => {
    const glow = '0 0 0 1px currentColor';

    /** What the layer the glow is drawn on computes to. */
    function lit(element: UiMenu): CSSStyleDeclaration {
        return getComputedStyle(trigger(element), '::before');
    }

    it('lights nothing by default', async () => {
        const host = await mount(fixture);

        expect(lit(menu(host)).boxShadow).toBe('none');
    });

    it('lights the trigger in the accent, against its boundary', async () => {
        const host = await mount(fixture);
        const element = menu(host);

        element.style.setProperty('--ui-elevation-control', glow);
        element.style.setProperty('--ui-color-accent', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-radius', '11px');

        expect(lit(element).boxShadow).toBe('rgb(1, 2, 3) 0px 0px 0px 1px');
        expect(lit(element).position).toBe('absolute');
        expect(lit(element).top).toBe('-1px');
        expect(lit(element).left).toBe('-1px');
        expect(lit(element).borderTopLeftRadius).toBe('11px');
    });

    it('lights to the hover glow under the pointer, the resting one until a theme says', async () => {
        const host = await mount(fixture);
        const element = menu(host);

        element.style.setProperty('--ui-elevation-control', glow);
        element.style.setProperty('--ui-color-accent', 'rgb(1, 2, 3)');
        await userEvent.hover(trigger(element));

        expect(lit(element).boxShadow).toBe('rgb(1, 2, 3) 0px 0px 0px 1px');

        element.style.setProperty('--ui-elevation-control-hover', '0 0 0 2px currentColor');

        expect(lit(element).boxShadow).toBe('rgb(1, 2, 3) 0px 0px 0px 2px');
    });
});

/** The trigger's edge and a theme's lift, as a secondary `ui-button` draws them. */
describe('the edge, and the lift a theme gives', () => {
    /** What the layer the edge is drawn on computes to. */
    function edged(element: UiMenu): CSSStyleDeclaration {
        return getComputedStyle(trigger(element), '::after');
    }

    it('takes the edge and the lift from the host, and the fill from the controls', async () => {
        const host = await mount(fixture);
        const element = menu(host);
        element.style.setProperty('--ui-color-border-button', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-elevation-button', 'rgb(4, 5, 6) 0px 1px 3px 0px');
        element.style.setProperty('--ui-color-surface-control', 'rgb(7, 8, 9)');

        expect(edged(element).borderTopColor).toBe('rgb(1, 2, 3)');
        expect(edged(element).boxShadow).toBe('rgb(4, 5, 6) 0px 1px 3px 0px');
        expect(edged(element).top).toBe('-1px');
        expect(getComputedStyle(trigger(element)).backgroundColor).toBe('rgb(7, 8, 9)');
    });

    it('goes to the edge a theme gives the pointer', async () => {
        const host = await mount(fixture);
        const element = menu(host);
        element.style.setProperty('--ui-color-border-button', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-color-border-button-hover', 'rgb(7, 8, 9)');
        element.style.setProperty('--ui-duration-state', '0s');

        expect(edged(element).borderTopColor, 'at rest').toBe('rgb(1, 2, 3)');

        await userEvent.hover(trigger(element));

        expect(edged(element).borderTopColor, 'under the pointer').toBe('rgb(7, 8, 9)');
    });

    it('moves the edge with the motion the host sets', async () => {
        const host = await mount(fixture);
        const element = menu(host);
        element.style.setProperty('--ui-duration-state', '0.4s');
        element.style.setProperty('--ui-easing-state', 'linear');

        expect(edged(element).transitionProperty).toBe('border-color');
        expect(edged(element).transitionDuration).toBe('0.4s');
        expect(edged(element).transitionTimingFunction).toBe('linear');
    });
});

/**
 * The button's effects, which the trigger answers as the secondary button it is — RFC 0004.
 *
 * Measured against a secondary `ui-button` rather than asserted value by value, as the box is
 * above: the two adopt one sheet, so the check is that the trigger is drawn as the button is in
 * every state, and `tests/button.test.ts` pins what the button draws.
 */
describe("the button's effects, which the trigger answers as a secondary button does", () => {
    /**
     * Every duration the sheet's effects move over, taken out so a read is where an effect lands.
     * Never for a script's effect: each reads its time off the trigger, and a time of nothing is
     * the collapse's, under which nothing flies, follows, breaks or spreads.
     */
    const stilled = {
        '--ui-duration-effect': '0s',
        '--ui-duration-state': '0s',
        '--ui-duration-flourish': '0s',
    } as const;

    /** The colours and lights a theme gives, retuned so each effect shows wherever it draws. */
    const tuned = {
        ...stilled,
        '--ui-elevation-control': '0 0 0 1px currentColor',
        '--ui-elevation-control-hover': '0 0 0 2px currentColor',
        '--ui-color-border-button': 'rgb(1, 2, 3)',
        '--ui-color-border-button-hover': 'rgb(4, 5, 6)',
        '--ui-color-surface-control': 'rgb(250, 250, 250)',
        '--ui-color-hover': 'rgb(7, 8, 9)',
        '--ui-color-pressed': 'rgb(10, 11, 12)',
        '--ui-color-accent': 'rgb(0, 0, 255)',
    } as const;

    /** A secondary button labelled as the trigger is. */
    const secondary = '<ui-button variant="secondary">Actions</ui-button>';

    afterEach(() => {
        // A ring still in the air lands, so nothing flies on into the next test.
        for (const flight of document.querySelector('[data-ui-ring]')?.getAnimations() ?? []) {
            flight.finish();
        }
    });

    /** Mounts `markup` with the effects `choices` names, and the tokens `tokens` sets. */
    async function chosen(
        markup: string,
        choices: Readonly<Record<string, string>>,
        tokens: Readonly<Record<string, string>> = {},
    ): Promise<HTMLElement> {
        const host = await mount(markup);

        for (const [name, value] of Object.entries(tokens)) {
            host.style.setProperty(name, value);
        }

        for (const [moment, effect] of Object.entries(choices)) {
            host.style.setProperty(`--ui-motion-${moment}`, effect);
        }

        return host;
    }

    /** The control a mounted fixture holds: the menu's trigger, or the button's own. */
    function control(host: HTMLElement): HTMLElement {
        const owner = only(host, 'ui-menu, ui-button');

        return inner(owner, 'button');
    }

    /** What the effects paint on a control as it is now: on it, and on its two layers. */
    function painted(target: HTMLElement): readonly string[] {
        const own = getComputedStyle(target);
        const before = getComputedStyle(target, '::before');
        const after = getComputedStyle(target, '::after');

        return [
            own.backgroundColor,
            own.boxShadow,
            own.translate,
            own.scale,
            own.animationName,
            own.isolation,
            before.boxShadow,
            after.borderTopColor,
            after.backgroundImage,
            after.animationName,
            after.zIndex,
        ];
    }

    /** What a control's effects paint at rest, under the pointer, at the focus and pressed. */
    async function states(target: HTMLElement): Promise<readonly (readonly string[])[]> {
        const rest = painted(target);

        await userEvent.hover(target);

        const hovered = painted(target);

        await parkPointer();
        await userEvent.tab();

        const focused = painted(target);

        target.blur();
        await press(target, true);

        const held = painted(target);

        await press(target, false);
        await parkPointer();

        return [rest, hovered, focused, held];
    }

    it.each([
        [
            "the default theme's taste",
            {
                'hover-shadow': 'raise',
                'focus-move': 'lift',
                'focus-shadow': 'raise',
                'press-move': 'squish',
                'press-shadow': 'sink',
            },
        ],
        [
            "Matrix's",
            {
                'hover-fill': 'tint',
                'hover-shadow': 'glow',
                'focus-fill': 'highlight',
                'focus-shadow': 'burst',
                'press-fill': 'none',
            },
        ],
        [
            "Glass's",
            {
                'focus-move': 'none',
                'focus-fill': 'shimmer',
                'focus-shadow': 'inner',
                'press-move': 'spring',
            },
        ],
        [
            'none for every moment a theme answers',
            {
                'hover-fill': 'none',
                'hover-shadow': 'none',
                'hover-border': 'none',
                'press-fill': 'none',
            },
        ],
    ])('draws the trigger as a secondary button, under %s', async (_whose, choices) => {
        const trigger = await chosen(fixture, choices, tuned);
        const mine = await states(control(trigger));

        trigger.remove();

        const button = await chosen(secondary, choices, tuned);
        const theirs = await states(control(button));

        expect(mine).toEqual(theirs);
    });

    it.each([
        ['hover-fill', 'spotlight', ['--ui-fx-follow']],
        ['press-move', 'shatter', ['--ui-fx-press', '--ui-fx-press-time', '--ui-fx-press-curve']],
        ['press-fill', 'ripple', ['--ui-fx-ripple-time', '--ui-fx-ripple-curve']],
    ])(
        'hands the scripts what a secondary button hands them, where %s is %s',
        async (moment, effect, names) => {
            const handed = (host: HTMLElement): readonly string[] =>
                names.map((name) => getComputedStyle(control(host)).getPropertyValue(name));
            const trigger = await chosen(fixture, { [moment]: effect });
            const button = await chosen(secondary, { [moment]: effect });

            expect(
                handed(trigger).every((value) => value !== ''),
                'something handed',
            ).toBe(true);
            expect(handed(trigger)).toEqual(handed(button));
        },
    );

    it.each(['glide', 'glitch', 'refocus'])(
        'hands the ring what a secondary button hands it at the focus, where the ring is %s',
        async (effect) => {
            const handed = async (host: HTMLElement): Promise<readonly string[]> => {
                await userEvent.tab();

                const styles = getComputedStyle(control(host));

                return ['', '-time', '-curve'].map((name) =>
                    styles.getPropertyValue(`--ui-fx-ring${name}`),
                );
            };
            const trigger = await chosen(fixture, { 'focus-ring': effect });
            const mine = await handed(trigger);

            trigger.remove();

            const button = await chosen(secondary, { 'focus-ring': effect });

            expect(mine[0], 'the ring chosen').toBe(effect);
            expect(mine).toEqual(await handed(button));
        },
    );

    it("flies the page's ring to the trigger as the focus arrives there", async () => {
        await chosen(fixture, { 'focus-ring': 'glitch' });

        await userEvent.tab();

        expect(document.querySelector('[data-ui-ring]:popover-open')).not.toBeNull();
    });

    it('hands the trigger where the pointer is, and lights its band there', async () => {
        const host = await chosen(fixture, { 'hover-border': 'edge' });
        const target = control(host);

        await pointTo(target, 20, 10);
        await settle();

        try {
            expect(target.style.getPropertyValue('--ui-fx-pointer-near')).toBe('1');
            expect(getComputedStyle(inner(menu(host), '.edge')).opacity).toBe('1');
        } finally {
            // Far off, so the engine lets go of the trigger before the next test.
            document.dispatchEvent(
                new PointerEvent('pointermove', { clientX: -10000, clientY: -10000 }),
            );
            await settle();
        }
    });

    it('spreads a ripple from where the pointer pressed the trigger, and from the middle for a key', async () => {
        const host = await chosen(fixture, { 'press-fill': 'ripple' });
        const target = control(host);
        const box = target.getBoundingClientRect();

        target.dispatchEvent(
            new PointerEvent('pointerdown', {
                bubbles: true,
                composed: true,
                button: 0,
                clientX: box.left + box.width / 4,
                clientY: box.top + box.height / 2,
            }),
        );

        expect(target.hasAttribute('data-ripple'), 'spreading').toBe(true);
        expect(target.style.getPropertyValue('--ui-fx-ripple-x'), 'where it was pressed').toBe(
            '25%',
        );

        keydown(target, ' ');

        expect(target.style.getPropertyValue('--ui-fx-ripple-x'), 'from the middle').toBe('50%');
    });

    it('breaks the trigger under a press, where the shatter is chosen', async () => {
        const host = await chosen(fixture, { 'press-move': 'shatter' });
        const target = control(host);
        const box = target.getBoundingClientRect();
        const at = { clientX: box.left + 20, clientY: box.top + 10 };

        target.dispatchEvent(
            new PointerEvent('pointerdown', { bubbles: true, composed: true, button: 0, ...at }),
        );

        try {
            expect(target.style.filter).toBe('url("#ui-break")');
        } finally {
            window.dispatchEvent(new PointerEvent('pointerup', at));
        }
    });

    it.each([
        ["the menu's own taste", '--ui-taste-menu-focus-move', '0px -2px'],
        ["the button's", '--ui-taste-button-focus-move', 'none'],
    ])('reads %s for the trigger', async (_whose, name, translate) => {
        const host = await chosen(fixture, {}, stilled);
        host.style.setProperty(name, 'lift');

        await userEvent.tab();

        expect(getComputedStyle(control(host)).translate).toBe(translate);
    });

    it('draws the band on a span of the trigger a reader is not told of, as the caret is', async () => {
        const host = await mount(fixture);
        const edge = inner(menu(host), '.edge');

        expect(edge.parentElement, 'in the trigger').toBe(trigger(menu(host)));
        expect(edge.getAttribute('aria-hidden')).toBe('true');
    });

    it("answers Glass's taste on the trigger: a light inside at the focus, a spring and a ripple", async () => {
        const style = document.createElement('style');
        style.textContent = tokenStyleSheet() + themeStyleSheet(glass);
        document.body.append(style);

        // The press's spring and the light inside land at once; the ripple keeps its own time,
        // a flourish's, which it reads.
        const host = await chosen(
            fixture,
            {},
            {
                '--ui-duration-effect': '0s',
                '--ui-duration-state': '0s',
            },
        );
        host.setAttribute('data-ui-theme', glass.name);

        const target = control(host);

        await userEvent.tab();

        expect(getComputedStyle(target).boxShadow, 'a light inside').toMatch(/ inset$/);
        expect(getComputedStyle(target).translate, 'no lift').toBe('none');

        target.blur();
        await press(target, true);

        expect(getComputedStyle(target).scale, 'sprung in').toBe('0.9');
        expect(target.hasAttribute('data-ripple'), 'a ripple').toBe(true);
    });
});

/** What each of `elements` moves as the sheet set it going: transitions by property, animations by name. */
function moved(...elements: Element[]): string[] {
    return elements
        .flatMap((element) => element.getAnimations())
        .map((each) =>
            each instanceof CSSTransition
                ? each.transitionProperty
                : each instanceof CSSAnimation
                  ? each.animationName
                  : 'something else',
        )
        .sort();
}

describe("the panel's motion, RFC 0004's", () => {
    it.each([
        [
            'the default theme',
            '',
            ['opacity', 'transform'],
            ['transform'],
            ['clip-path', 'display', 'overlay'],
        ],
        [
            'Matrix',
            themeStyleSheet(matrix),
            [],
            ['transform', 'ui-panel-glitch-in'],
            ['display', 'overlay', 'ui-panel-glitch-out'],
        ],
        [
            'Glass',
            themeStyleSheet(glass),
            [],
            ['filter', 'opacity', 'transform'],
            ['display', 'filter', 'opacity', 'overlay'],
        ],
    ] as const)(
        "opens and closes its panel and turns its caret as %s's taste says",
        async (_name, sheet, items, opening, closing) => {
            const style = document.createElement('style');
            style.textContent = tokenStyleSheet() + sheet;
            document.body.append(style);
            const theme = sheet === '' ? '' : _name.toLowerCase();
            // Slowed, so everything is still moving when it is read, however long the click takes.
            const host = await mount(
                `<div data-ui-theme="${theme}" style="--ui-duration-overlay: 10s">${fixture}</div>`,
            );
            const element = menu(host);

            await userEvent.click(trigger(element));

            expect(moved(item(host, 0)), 'the first item').toEqual(items);
            expect(moved(panel(element), caret(element)), 'the panel and the caret').toEqual(
                opening,
            );

            for (const each of [panel(element), caret(element)].flatMap((one) =>
                one.getAnimations(),
            )) {
                each.finish();
            }

            panel(element).hidePopover();

            expect(moved(panel(element)), 'closing').toEqual(closing);
        },
    );
});

describe('the description a tooltip hands over', () => {
    /** Dispatches the handoff the way `<ui-tooltip>` does, and reports whether it was taken. */
    function hand(element: UiMenu, detail: unknown): boolean {
        return !element.dispatchEvent(new CustomEvent('ui-describe', { detail, cancelable: true }));
    }

    it('renders the sentence where its own trigger can reach it', async () => {
        const host = await mount(fixture);
        const element = menu(host);

        expect(trigger(element).hasAttribute('aria-describedby'), 'bare until handed').toBe(false);

        expect(hand(element, 'Everything you can do to this file.'), 'taken').toBe(true);
        await element.updateComplete;

        const described = trigger(element).getAttribute('aria-describedby');
        const carrier = element.shadowRoot?.getElementById(String(described));

        expect(described).toBe('description');
        expect(carrier?.textContent).toBe('Everything you can do to this file.');
    });

    it('keeps the carrier out of the panel, which is a layer of its own', async () => {
        // The reference has to resolve from where the reader's focus lands. The panel is a
        // popover in the top layer and the trigger is not, so a carrier rendered inside it
        // would describe from the wrong side of the thing that opens and closes.
        const host = await mount(fixture);
        const element = menu(host);

        hand(element, 'Everything you can do to this file.');
        await element.updateComplete;

        const carrier = element.shadowRoot?.getElementById('description');

        expect(carrier).not.toBeNull();
        expect(panel(element).contains(carrier ?? null), 'not inside the popover').toBe(false);
    });

    it('does not disturb the references the trigger already carries', async () => {
        // This element holds `aria-controls` and `aria-expanded` on the same node, and the
        // description is written beside them on every update.
        const host = await mount(fixture);
        const element = menu(host);

        hand(element, 'Everything you can do to this file.');
        await element.updateComplete;

        const button = trigger(element);

        expect(button.getAttribute('aria-haspopup')).toBe('menu');
        expect(button.getAttribute('aria-expanded')).toBe('false');
        expect(button.getAttribute('aria-controls')).toBe(panel(element).id);
    });

    it('takes the description away when the sentence is withdrawn', async () => {
        const host = await mount(fixture);
        const element = menu(host);

        hand(element, 'Everything you can do to this file.');
        await element.updateComplete;

        expect(hand(element, ''), 'the withdrawal is taken too').toBe(true);
        await element.updateComplete;

        expect(trigger(element).hasAttribute('aria-describedby')).toBe(false);
        expect(element.shadowRoot?.getElementById('description')).toBeNull();
    });

    it('leaves a payload that is not a sentence unclaimed', async () => {
        const host = await mount(fixture);
        const element = menu(host);

        expect(hand(element, 42)).toBe(false);
        await element.updateComplete;

        expect(trigger(element).hasAttribute('aria-describedby')).toBe(false);
    });

    it('arrives from a real tooltip, and survives the menu being opened', async () => {
        // The measurement RFC 0006 took on this element: opening it moves focus out of the
        // menu's root and back into the tooltip's subtree. What that costs the dismissal is
        // #169's problem; what it must not cost is the description.
        const host = await mount(`
            <div style="padding-block: 6rem">
                <ui-tooltip>
                    <ui-menu>
                        <span slot="trigger">Actions</span>
                        <button type="button">Rename</button>
                    </ui-menu>
                    <span slot="tip">Everything you can do to this file.</span>
                </ui-tooltip>
            </div>
        `);

        const element = menu(host);
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });
        await element.updateComplete;

        expect(trigger(element).getAttribute('aria-describedby')).toBe('description');

        await userEvent.click(trigger(element));
        await element.updateComplete;

        expect(element.open, 'it still opens').toBe(true);
        expect(trigger(element).getAttribute('aria-describedby')).toBe('description');
        expect(element.shadowRoot?.getElementById('description')?.textContent).toBe(
            'Everything you can do to this file.',
        );

        await expectAccessible(host);
    });
});

/**
 * A tooltip on an item: written inside it, round its label, since the menu takes an item only as
 * its own child — one written round the item takes it out of the menu.
 */
describe('a tooltip on an item', () => {
    it('keeps the item an item, whose tip shows as the keys land on it, and chooses it from its label', async () => {
        const host = await mount(`
            <div style="padding-block: 6rem">
                <ui-menu>
                    <span slot="trigger">Actions</span>
                    <button type="button">
                        <ui-tooltip>Rename<span slot="tip">Rename the invoice</span></ui-tooltip>
                    </button>
                    <button type="button">Duplicate</button>
                </ui-menu>
            </div>
        `);
        const element = menu(host);
        const tip = only(host, '[slot="tip"]');

        await open(element);

        expect(item(host, 0).getAttribute('role'), 'an item').toBe('menuitem');
        expect(document.activeElement, 'the keys landed on it').toBe(item(host, 0));
        expect(tip.matches(':popover-open'), 'its tip shown').toBe(true);

        await expectAccessible(host);

        await userEvent.keyboard('{ArrowDown}');

        expect(tip.matches(':popover-open'), 'gone as the keys move on').toBe(false);

        // Where a click on the label lands: the tooltip, which the item holds.
        only(host, 'ui-tooltip').dispatchEvent(
            new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }),
        );
        await settle();

        expect(element.open, 'chosen').toBe(false);
    });
});

describe('menu stories', () => {
    it.each([
        ['Menu', Menu],
        ['Disabled', Disabled],
        ['Links', Links],
        ['AtTheEdge', AtTheEdge],
        ['AlignedToTheEnd', AlignedToTheEnd],
        ['TicksAndSections', TicksAndSections],
        ['ShortcutsAndDescriptions', ShortcutsAndDescriptions],
        ['WithASubmenu', WithASubmenu],
        ['ContextMenu', ContextMenu],
    ] as const)('renders %s accessibly', async (name, story) => {
        await expectAccessible(await mountStory(story, meta, name));
    });

    it('opens the composed story, which is the playground being exercised', async () => {
        const container = await mountStory(Menu, meta, 'Menu');
        const element = menu(container);

        await open(element);
        await still(element);

        expect(element.open).toBe(true);
        await expectAccessible(container);
    });
});

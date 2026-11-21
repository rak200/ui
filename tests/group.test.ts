import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectAccessible } from './a11y.js';
import { mountStory } from './stories.js';
import meta, { Group, RightToLeft, Toolbar } from '../stories/group.stories.js';
import '../src/button.js';
import '../src/group.js';
import type { UiButton } from '../src/button.js';
import type { UiButtonGroup } from '../src/group.js';

/** A toolbar of three buttons between two of the page's, so Tab has somewhere to come from. */
const bar = `
    <button type="button" id="before">Before</button>
    <ui-button-group label="Alignment" toolbar>
        <ui-button type="button" id="left">Left</ui-button>
        <ui-button type="button" id="centre">Centre</ui-button>
        <ui-button type="button" id="right">Right</ui-button>
    </ui-button-group>
    <button type="button" id="after">After</button>
`;

/** Mounts a fixture and waits for the group and its buttons to render. */
async function mount(markup: string, into: ParentNode = document.body): Promise<HTMLElement> {
    const host = document.createElement('div');
    host.innerHTML = markup;
    into.append(host);

    for (const element of host.querySelectorAll<UiButtonGroup | UiButton>(
        'ui-button-group, ui-button',
    )) {
        await element.updateComplete;
    }

    return host;
}

/** The group, which is the element under test. */
function group(host: ParentNode): UiButtonGroup {
    const element = host.querySelector('ui-button-group');

    if (element === null) {
        throw new Error('no group in the fixture');
    }

    return element;
}

/** The buttons the group holds, in their order. */
function buttons(host: ParentNode): UiButton[] {
    return [...host.querySelectorAll<UiButton>('ui-button-group > ui-button')];
}

/** One button, by its id. */
function button(host: ParentNode, id: string): UiButton {
    const found = host.querySelector<UiButton>(`#${id}`);

    if (found === null) {
        throw new Error(`no button ${id}`);
    }

    return found;
}

/** The button a `<ui-button>` draws in its root. */
function inner(element: UiButton): HTMLButtonElement {
    const found = element.shadowRoot?.querySelector('button');

    if (found === null || found === undefined) {
        throw new Error('the ui-button rendered no button');
    }

    return found;
}

/** Each button's stop, as the group wrote it. */
function stops(host: ParentNode): (string | null)[] {
    return buttons(host).map((one) => one.getAttribute('tabindex'));
}

/** Which element the page's focus is on, by its id. */
function focused(): string {
    return document.activeElement?.id ?? 'none';
}

/** The role the group's root draws round the buttons. */
function role(host: ParentNode): HTMLElement {
    const found = group(host).shadowRoot?.querySelector<HTMLElement>('[part="group"]');

    if (found === null || found === undefined) {
        throw new Error('the group drew no role');
    }

    return found;
}

/** A microtask and a frame, so an observer's record and the rove after it are in. */
async function settled(): Promise<void> {
    await new Promise(requestAnimationFrame);
}

afterEach(() => {
    document.body.replaceChildren();
});

describe('ui-button-group', () => {
    it('draws a group round the buttons, named by its label, and a toolbar where it is one', async () => {
        const host = await mount(
            '<ui-button-group label="View"><ui-button>Day</ui-button><ui-button>Week</ui-button></ui-button-group>',
        );

        expect(role(host).getAttribute('role')).toBe('group');
        expect(role(host).getAttribute('aria-label')).toBe('View');
        expect(
            role(host).querySelector('slot')?.assignedElements(),
            'the buttons inside it',
        ).toEqual(buttons(host));

        group(host).label = '';
        group(host).toolbar = true;
        await group(host).updateComplete;

        expect(role(host).hasAttribute('aria-label'), 'no name, none written').toBe(false);
        expect(role(host).getAttribute('role')).toBe('toolbar');
        expect(group(host).hasAttribute('toolbar'), 'reflected').toBe(true);

        group(host).label = 'Days';
        await group(host).updateComplete;

        expect(group(host).getAttribute('label'), 'reflected').toBe('Days');

        const unnamed = await mount(
            '<ui-button-group><ui-button>Day</ui-button></ui-button-group>',
        );

        expect(role(unnamed).hasAttribute('aria-label'), 'none written, none drawn').toBe(false);
    });

    it('squares the corners the buttons share, and meets their edges as one line', async () => {
        const host = await mount(bar);
        const [first, middle, last] = buttons(host).map((one) => getComputedStyle(inner(one)));

        group(host).style.setProperty('--ui-radius', '7px');

        expect([first?.borderTopLeftRadius, first?.borderTopRightRadius]).toEqual(['7px', '0px']);
        expect([first?.borderBottomLeftRadius, first?.borderBottomRightRadius]).toEqual([
            '7px',
            '0px',
        ]);
        expect([middle?.borderTopLeftRadius, middle?.borderTopRightRadius]).toEqual(['0px', '0px']);
        expect([middle?.borderBottomLeftRadius, middle?.borderBottomRightRadius]).toEqual([
            '0px',
            '0px',
        ]);
        expect([last?.borderTopLeftRadius, last?.borderTopRightRadius]).toEqual(['0px', '7px']);
        expect([last?.borderBottomLeftRadius, last?.borderBottomRightRadius]).toEqual([
            '0px',
            '7px',
        ]);

        const [one, two, three] = buttons(host).map((each) => each.getBoundingClientRect());

        expect((two?.left ?? 0) - (one?.right ?? 0), 'one pixel back').toBe(-1);
        expect((three?.left ?? 0) - (two?.right ?? 0)).toBe(-1);
    });

    it('turns the corners with the row, right to left', async () => {
        const host = await mount(`<div dir="rtl">${bar}</div>`);
        const [first, , last] = buttons(host).map((one) => getComputedStyle(inner(one)));

        group(host).style.setProperty('--ui-radius', '7px');

        expect([first?.borderTopLeftRadius, first?.borderTopRightRadius]).toEqual(['0px', '7px']);
        expect([last?.borderTopLeftRadius, last?.borderTopRightRadius]).toEqual(['7px', '0px']);
    });

    it('draws the button under the pointer, or holding the focus, over its neighbours', async () => {
        const host = await mount(bar);

        expect(getComputedStyle(button(host, 'centre')).zIndex).toBe('auto');

        await userEvent.hover(inner(button(host, 'centre')));

        expect(getComputedStyle(button(host, 'centre')).zIndex, 'under the pointer').toBe('1');

        button(host, 'right').focus();

        expect(getComputedStyle(button(host, 'right')).zIndex, 'holding the focus').toBe('1');
    });

    it('adopts its rules once into the tree it joins, a shadow root as well', async () => {
        await mount(bar);

        const before = document.adoptedStyleSheets.length;

        await mount(bar);

        expect(document.adoptedStyleSheets.length, 'once for two groups').toBe(before);

        const outer = document.createElement('div');
        const root = outer.attachShadow({ mode: 'open' });

        document.body.append(outer);

        const inside = await mount(bar, root);

        expect(root.adoptedStyleSheets).toHaveLength(1);

        group(inside).style.setProperty('--ui-radius', '7px');

        expect(
            getComputedStyle(inner(button(inside, 'left'))).borderTopRightRadius,
            'joined there',
        ).toBe('0px');
    });

    it('has no violations as a group', async () => {
        await expectAccessible(await mountStory(Group, meta, 'Group'));
    });

    it('has no violations as a toolbar', async () => {
        await expectAccessible(await mountStory(Toolbar, meta, 'Toolbar'));
    });

    it('has no violations right to left', async () => {
        await expectAccessible(await mountStory(RightToLeft, meta, 'RightToLeft'));
    });
});

describe('a toolbar', () => {
    it('is one tab stop, on the first button the keys reach', async () => {
        const host = await mount(bar);

        expect(stops(host)).toEqual(['0', '-1', '-1']);

        button(document, 'before').focus();
        await userEvent.tab();

        expect(focused()).toBe('left');

        await userEvent.tab();

        expect(focused(), 'and Tab leaves it').toBe('after');

        await userEvent.tab({ shift: true });

        expect(focused(), 'back to its one stop').toBe('left');
    });

    it('moves by the arrows, wrapping at either end, and by Home and End', async () => {
        const host = await mount(bar);

        button(host, 'left').focus();

        const path: string[] = [];

        for (const key of [
            '{ArrowRight}',
            '{ArrowRight}',
            '{ArrowRight}',
            '{ArrowLeft}',
            '{Home}',
            '{End}',
        ]) {
            await userEvent.keyboard(key);
            path.push(focused());
        }

        expect(path).toEqual(['centre', 'right', 'left', 'right', 'left', 'right']);
        expect(stops(host), 'the stop with the focus').toEqual(['-1', '-1', '0']);
    });

    it('turns the arrows right to left', async () => {
        const host = await mount(`<div dir="rtl">${bar}</div>`);

        button(host, 'left').focus();
        await userEvent.keyboard('{ArrowLeft}');

        expect(focused(), 'the next, to the left').toBe('centre');

        await userEvent.keyboard('{ArrowRight}');

        expect(focused(), 'the previous, to the right').toBe('left');
    });

    it('keeps the stop where the reader was, by the pointer too', async () => {
        const host = await mount(bar);

        await userEvent.click(inner(button(host, 'right')));

        expect(stops(host)).toEqual(['-1', '-1', '0']);

        button(document, 'before').focus();
        await userEvent.tab();

        expect(focused(), 'Tab comes back to it').toBe('right');
    });

    it('keeps the stop where it was, when the focus comes to something in it that is no button', async () => {
        const host = await mount(bar);
        const field = document.createElement('input');

        field.setAttribute('aria-label', 'Size');
        group(host).append(field);
        button(host, 'right').focus();
        field.focus();

        expect(stops(host)).toEqual(['-1', '-1', '0']);
    });

    it('passes a disabled button by, reaches one marked aria-disabled, and moves the stop off one disabled', async () => {
        const host = await mount(bar);

        button(host, 'centre').disabled = true;
        await button(host, 'centre').updateComplete;
        button(host, 'left').focus();
        await userEvent.keyboard('{ArrowRight}');

        expect(focused(), 'passed by').toBe('right');

        button(host, 'centre').disabled = false;
        button(host, 'centre').setAttribute('aria-disabled', 'true');
        await button(host, 'centre').updateComplete;
        await userEvent.keyboard('{ArrowLeft}');

        expect(focused(), 'reached').toBe('centre');

        button(host, 'right').focus();
        button(host, 'right').disabled = true;
        await button(host, 'right').updateComplete;
        await settled();

        expect(stops(host), 'the stop moved to the first the keys reach').toEqual([
            '0',
            '-1',
            '-1',
        ]);
    });

    it('follows a button written or taken away', async () => {
        const host = await mount(bar);
        const added = document.createElement('ui-button');

        added.textContent = 'Justify';
        group(host).append(added);
        await added.updateComplete;
        await settled();

        expect(stops(host)).toEqual(['0', '-1', '-1', '-1']);

        button(host, 'left').remove();
        await settled();

        expect(stops(host), 'the stop moved on').toEqual(['0', '-1', '-1']);
    });

    it('writes no stop on a group that is no toolbar, and takes away what it wrote', async () => {
        const host = await mount(bar);

        group(host).toolbar = false;
        await group(host).updateComplete;

        expect(stops(host)).toEqual([null, null, null]);

        button(host, 'left').focus();
        await userEvent.keyboard('{ArrowRight}');

        expect(focused(), 'no arrows either').toBe('left');
    });

    it('leaves every other key to the button, and a key from no button to whoever sent it', async () => {
        const host = await mount(bar);
        const press = (target: EventTarget, key: string): boolean =>
            target.dispatchEvent(
                new KeyboardEvent('keydown', {
                    key,
                    bubbles: true,
                    composed: true,
                    cancelable: true,
                }),
            );

        expect(press(inner(button(host, 'left')), 'Enter'), 'Enter is the button’s').toBe(true);
        expect(press(inner(button(host, 'left')), 'ArrowDown'), 'a key it does not take').toBe(
            true,
        );
        expect(press(inner(button(host, 'left')), 'ArrowRight'), 'an arrow it takes').toBe(false);

        const stray = document.createElement('span');

        group(host).append(stray);

        expect(press(stray, 'ArrowRight'), 'from no button').toBe(true);
    });

    it('lets go of the buttons once it leaves the page', async () => {
        const host = await mount(bar);
        const toolbar = group(host);

        toolbar.remove();
        button(toolbar, 'left').disabled = true;
        await button(toolbar, 'left').updateComplete;
        await settled();

        expect(stops(toolbar), 'nothing roved').toEqual(['0', '-1', '-1']);
    });
});

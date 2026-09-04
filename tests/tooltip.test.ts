import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
// The playwright provider is what puts `send` on `CDPSession` — see `button.test.ts`,
// which needs the same line for the same reason.
import type {} from '@vitest/browser-playwright';
import { expectAccessible } from './a11y.js';
import { mountStory } from './stories.js';
import meta, { AtTheEdge, Inside, OnAField, Tooltip } from '../stories/tooltip.stories.js';
import '../src/tooltip.js';
import '../src/field.js';
import '../src/input.js';
import type { UiTooltip } from '../src/tooltip.js';

/** The markup the behavioural tests use, unless one needs a different shape. */
const fixture = `
    <ui-tooltip>
        <button type="button">Save</button>
        <span slot="tip">Saves without closing the dialog.</span>
    </ui-tooltip>
`;

/**
 * Mounts a fixture, pushed down the page so there is room above the trigger.
 *
 * The default placement is above, and a trigger at the very top of the viewport flips —
 * which is a case with its own test rather than the shape every other test should inherit.
 */
async function mount(markup: string, offset = '120px'): Promise<HTMLElement> {
    const host = document.createElement('div');
    host.style.marginBlockStart = offset;
    host.innerHTML = markup;
    document.body.append(host);

    for (const element of host.querySelectorAll('ui-tooltip, ui-field, ui-input')) {
        await (element as UiTooltip).updateComplete;
    }

    await new Promise((resolve) => {
        setTimeout(resolve, 0);
    });

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

const trigger = (host: ParentNode): HTMLElement => only(host, 'button, input');
const tip = (host: ParentNode): HTMLElement => only(host, '[slot=tip]');

/** Lets a placement land: the element is shown, then measured, then moved. */
async function painted(): Promise<void> {
    await new Promise((resolve) => {
        requestAnimationFrame(() => {
            resolve(null);
        });
    });
}

/** The component's own stylesheet, as text, for the rules no rendering can show. */
function styleText(): string {
    return String((customElements.get('ui-tooltip') as unknown as { styles: unknown }).styles);
}

/** Moves the pointer out of the way, because nothing in the page can — see checkbox.test.ts. */
async function parkPointer(): Promise<void> {
    await cdp().send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: window.innerWidth - 1,
        y: window.innerHeight - 1,
        buttons: 0,
    });
}

beforeEach(parkPointer);

afterEach(async () => {
    await parkPointer();

    document.body.replaceChildren();
});

describe('ui-tooltip', () => {
    it('registers itself as a custom element', () => {
        expect(customElements.get('ui-tooltip')).toBeDefined();
    });

    it('leaves both the trigger and the tip in the light DOM', async () => {
        const host = await mount(fixture);
        const element = only(host, 'ui-tooltip');

        expect(trigger(host).parentElement).toBe(element);
        expect(tip(host).parentElement).toBe(element);
        expect(element.shadowRoot?.querySelector('button')).toBeNull();
    });

    it('lays nothing out, so wrapping a trigger does not move it', async () => {
        const host = await mount(fixture);

        expect(getComputedStyle(only(host, 'ui-tooltip')).display).toBe('contents');
    });

    it('makes the tip a popover, names it, and points the trigger at it', async () => {
        const host = await mount(fixture);

        expect(tip(host).getAttribute('popover')).toBe('manual');
        expect(tip(host).getAttribute('role')).toBe('tooltip');
        expect(tip(host).id).toMatch(/\S/);
        expect(trigger(host).getAttribute('aria-describedby')).toBe(tip(host).id);
    });

    it('numbers each tooltip separately, so two on one page do not collide', async () => {
        const host = await mount(`${fixture}${fixture}`);
        const [first, second] = host.querySelectorAll('[slot=tip]');

        expect(first?.id).not.toBe(second?.id);
    });

    it('keeps an id and a role the host wrote', async () => {
        const host = await mount(`
            <ui-tooltip>
                <button type="button">Save</button>
                <span slot="tip" id="chosen" role="note">Saves.</span>
            </ui-tooltip>
        `);

        expect(tip(host).id).toBe('chosen');
        expect(tip(host).getAttribute('role')).toBe('note');
        expect(trigger(host).getAttribute('aria-describedby')).toBe('chosen');
    });

    it('adds to a description the trigger already had, rather than replacing it', async () => {
        // A control inside a `<ui-field>` is already described by its help text, and a
        // description that silently replaced another is the failure nobody sees.
        const host = await mount(`
            <ui-tooltip>
                <button type="button" aria-describedby="elsewhere">Save</button>
                <span slot="tip">Saves.</span>
            </ui-tooltip>
            <span id="elsewhere">Something else</span>
        `);

        expect(trigger(host).getAttribute('aria-describedby')).toBe(`elsewhere ${tip(host).id}`);
    });

    it('says nothing twice when it is wired again', async () => {
        const host = await mount(fixture);
        const element = only(host, 'ui-tooltip');
        const replacement = document.createElement('span');
        replacement.slot = 'tip';
        replacement.textContent = 'Saves.';

        element.append(replacement);
        tip(host).remove();
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        const described = trigger(host).getAttribute('aria-describedby') ?? '';

        expect(described.split(' ')).toEqual([...new Set(described.split(' '))]);
        expect(described).toContain(replacement.id);
    });

    it('survives a field re-describing the same control', async () => {
        // Two components writing one attribute. `ui-field` rebuilds the list from what it
        // knows about, and it carries forward what it did not write — measured here rather
        // than trusted, because the erasure happened on the *second* association and a
        // test that only mounted would have passed.
        const host = await mount(`
            <ui-field>
                <label slot="label">Amount</label>
                <ui-tooltip>
                    <input type="number" />
                    <span slot="tip">Two decimals.</span>
                </ui-tooltip>
                <span slot="help">In BRL.</span>
            </ui-field>
        `);

        only(host, '[slot=help]').textContent = 'In BRL, please.';
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(trigger(host).getAttribute('aria-describedby')?.split(' ')).toContain(tip(host).id);
    });

    it('names the same tip once, however often it is wired again', async () => {
        // The tip is taken out and put back — a re-render that keeps the element rather
        // than replacing it. The id it already has must not be appended a second time, or
        // the description grows one copy per render.
        const host = await mount(fixture);
        const element = only(host, 'ui-tooltip');
        const same = tip(host);

        same.remove();
        element.append(same);
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(trigger(host).getAttribute('aria-describedby')).toBe(same.id);
    });

    it('does nothing at all when there is no trigger to describe', async () => {
        const host = await mount('<ui-tooltip><span slot="tip">Saves.</span></ui-tooltip>');

        expect(tip(host).hasAttribute('popover'), 'nothing was wired').toBe(false);
        expect(tip(host).id).toBe('');
    });

    it('does nothing at all when there is no tip to show', async () => {
        const host = await mount('<ui-tooltip><button type="button">Save</button></ui-tooltip>');

        await userEvent.hover(trigger(host));

        expect(trigger(host).hasAttribute('aria-describedby')).toBe(false);
    });
});

describe('when it shows', () => {
    it('shows on the pointer and hides when it leaves', async () => {
        const host = await mount(fixture);

        expect(tip(host).matches(':popover-open'), 'closed to begin with').toBe(false);

        await userEvent.hover(trigger(host));

        expect(tip(host).matches(':popover-open')).toBe(true);

        await userEvent.unhover(trigger(host));

        expect(tip(host).matches(':popover-open')).toBe(false);
    });

    it('shows on keyboard focus, which is the half a hover-only tooltip loses', async () => {
        const host = await mount(fixture);

        await userEvent.tab();

        expect(document.activeElement, 'tab reached the trigger').toBe(trigger(host));
        expect(tip(host).matches(':popover-open')).toBe(true);

        await userEvent.tab();

        expect(tip(host).matches(':popover-open'), 'and closes when focus leaves').toBe(false);
    });

    it('defers to focus on a touch screen, where there is no hover to answer', async () => {
        const host = await mount(fixture);

        trigger(host).dispatchEvent(
            new PointerEvent('pointerenter', { pointerType: 'touch', bubbles: false }),
        );
        only(host, 'ui-tooltip').dispatchEvent(
            new PointerEvent('pointerenter', { pointerType: 'touch' }),
        );

        expect(tip(host).matches(':popover-open')).toBe(false);
    });

    it('dismisses on Escape without moving the focus, which 1.4.13 asks for', async () => {
        const host = await mount(fixture);

        await userEvent.tab();

        expect(tip(host).matches(':popover-open')).toBe(true);

        await userEvent.keyboard('{Escape}');

        expect(tip(host).matches(':popover-open')).toBe(false);
        expect(document.activeElement, 'the focus stayed put').toBe(trigger(host));
    });

    it('ignores a key that is not Escape', async () => {
        const host = await mount(fixture);

        await userEvent.tab();
        await userEvent.keyboard('a');

        expect(tip(host).matches(':popover-open')).toBe(true);
    });

    it('stays open when the pointer travels onto the tip itself', async () => {
        // 1.4.13's second requirement: the tip is a DOM child of this element, so entering
        // it never leaves the host — which is what makes hoverable free rather than a
        // safe-area calculation.
        const host = await mount(fixture);

        await userEvent.hover(trigger(host));
        await painted();
        await userEvent.hover(tip(host));

        expect(tip(host).matches(':popover-open')).toBe(true);
    });

    it('opens once, however many times it is asked', async () => {
        // `showPopover()` on a popover that is already open throws, and it throws inside an
        // event listener where nothing would report it — so the guard is asserted through
        // the error it prevents rather than through a state nobody can see.
        const host = await mount(fixture);
        const thrown: string[] = [];
        const capture = (event: ErrorEvent): void => {
            thrown.push(event.message);
        };

        window.addEventListener('error', capture);

        try {
            await userEvent.hover(trigger(host));
            await userEvent.tab();
        } finally {
            window.removeEventListener('error', capture);
        }

        expect(thrown, 'the second request was refused rather than thrown').toEqual([]);
        expect(tip(host).matches(':popover-open')).toBe(true);

        await userEvent.keyboard('{Escape}');

        expect(tip(host).matches(':popover-open'), 'one dismissal is enough').toBe(false);
    });

    it('opens again after it has closed', async () => {
        const host = await mount(fixture);

        await userEvent.hover(trigger(host));
        await userEvent.unhover(trigger(host));

        expect(tip(host).matches(':popover-open'), 'closed').toBe(false);

        await userEvent.hover(trigger(host));

        expect(tip(host).matches(':popover-open'), 'and open again').toBe(true);
    });

    it('re-places when the window resizes, not only when something scrolls', async () => {
        const host = await mount(`<div id="mover">${fixture}</div>`);

        trigger(host).focus();
        await painted();

        const before = tip(host).style.insetBlockStart;

        // Padding rather than margin, and that is not a detail: an adjoining top margin
        // collapses into the wrapper's own, so the trigger would not have moved and the
        // test would have failed against working code.
        only(host, '#mover').style.paddingBlockStart = '40px';
        window.dispatchEvent(new Event('resize'));
        await painted();

        expect(tip(host).style.insetBlockStart).not.toBe(before);
    });

    it('stops following the trigger once it is closed', async () => {
        // The listeners are removed with the same options they were added with, which is
        // what makes the removal actually remove: a capturing listener taken off without
        // the flag stays on, and the tip would keep being placed while hidden.
        const host = await mount(`
            <div id="scroller" style="block-size: 80px; overflow: auto">
                <div style="block-size: 400px; padding-block-start: 40px">
                    <ui-tooltip>
                        <button type="button">Save</button>
                        <span slot="tip">Saves.</span>
                    </ui-tooltip>
                </div>
            </div>
        `);

        await userEvent.hover(trigger(host));
        await painted();
        await userEvent.unhover(trigger(host));

        const parked = tip(host).style.insetBlockStart;
        const scroller = only(host, '#scroller');
        const scrolled = new Promise((resolve) => {
            scroller.addEventListener('scroll', resolve, { once: true });
        });

        scroller.scrollTop = 30;
        await scrolled;
        await painted();

        window.dispatchEvent(new Event('resize'));
        await painted();

        expect(tip(host).style.insetBlockStart, 'nothing moved it').toBe(parked);
    });

    it('answers nothing once it has left the document', async () => {
        // The listeners come off with it. Left on, the first pointer or focus event to
        // reach a detached element would call `showPopover()` on a node that is not in a
        // document, which throws inside a listener where nothing would report it.
        const host = await mount(fixture);
        const element = only(host, 'ui-tooltip');
        const button = trigger(host);
        const shown = tip(host);
        const thrown: string[] = [];
        const capture = (event: ErrorEvent): void => {
            thrown.push(event.message);
        };

        await userEvent.hover(trigger(host));
        element.remove();
        window.addEventListener('error', capture);

        try {
            element.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
            element.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
            button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
            element.dispatchEvent(new PointerEvent('pointerleave'));
            element.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
            await painted();
        } finally {
            window.removeEventListener('error', capture);
        }

        expect(thrown).toEqual([]);
        expect(shown.matches(':popover-open')).toBe(false);
    });

    it('works again after a framework moves it in the tree', async () => {
        // Removal has to put the state back as well as take the listeners off. Left
        // thinking it is still shown, the tooltip refuses to open at its own guard — and
        // it refuses silently, which is the shape of every bug in this file worth having a
        // test for.
        const host = await mount(fixture);
        const element = only(host, 'ui-tooltip');
        const parent = element.parentElement;

        trigger(host).focus();

        expect(tip(host).matches(':popover-open'), 'open to begin with').toBe(true);

        element.remove();
        parent?.append(element);
        await (element as UiTooltip).updateComplete;
        trigger(host).focus();

        expect(tip(host).matches(':popover-open'), 'it opens again').toBe(true);
    });

    it('stops placing the moment it leaves the document, not when it is next asked', async () => {
        // The window listeners are what a removal has to take with it. Left on, they keep
        // calling the placement against a trigger that is no longer laid out — every rect
        // is zero — and the tip is dragged to the corner of a page it is not on. Read off
        // the written inset, because a detached element has no rendering to compare.
        const host = await mount(fixture);
        const element = only(host, 'ui-tooltip');

        // Shown by the pointer, and that is the half that needs the removal to act:
        // removing a *focused* element fires `focusout`, so the focus path already closes
        // itself and would have proved nothing. Measured, as a test that passed against a
        // `disconnectedCallback` with no body in it.
        await userEvent.hover(trigger(host));
        await painted();

        // Held before the removal takes it out of the fixture.
        const shown = tip(host);
        const placed = shown.style.insetBlockStart;

        expect(placed, 'it was placed to begin with').toMatch(/\d/);

        element.remove();
        window.dispatchEvent(new Event('resize'));
        await painted();

        expect(shown.style.insetBlockStart, 'nothing placed it again').toBe(placed);
    });

    it('closes without complaint when the pointer leaves after an Escape', async () => {
        // `hidePopover()` on a popover that is not showing throws, and leaving the trigger
        // after dismissing it is the ordinary way to arrive there.
        const host = await mount(fixture);
        const thrown: string[] = [];
        const capture = (event: ErrorEvent): void => {
            thrown.push(event.message);
        };

        await userEvent.hover(trigger(host));
        await userEvent.keyboard('{Escape}');
        window.addEventListener('error', capture);

        try {
            await userEvent.unhover(trigger(host));
            await painted();
        } finally {
            window.removeEventListener('error', capture);
        }

        expect(thrown, 'the second dismissal was refused rather than thrown').toEqual([]);
    });

    it('takes its listeners with it when it is removed mid-hover', async () => {
        const host = await mount(fixture);
        const element = only(host, 'ui-tooltip');

        await userEvent.hover(trigger(host));

        // Held before the removal takes it out of the fixture: what is asserted is the
        // state of the element that *was* shown, not the absence of a lookup.
        const shown = tip(host);
        const thrown: string[] = [];
        const capture = (event: ErrorEvent): void => {
            thrown.push(event.message);
        };

        window.addEventListener('error', capture);

        try {
            element.remove();
            window.dispatchEvent(new Event('resize'));
            await painted();
        } finally {
            window.removeEventListener('error', capture);
        }

        expect(thrown, 'nothing is still placing a detached element').toEqual([]);
        expect(shown.matches(':popover-open')).toBe(false);
    });
});

describe('where it lands', () => {
    it('sits above the trigger, centred on it', async () => {
        // Centred in the page on purpose: a trigger near an edge is clamped instead, which
        // is the case two tests below rather than a wrinkle in this one.
        const host = await mount(
            `<div style="display: flex; justify-content: center">${fixture}</div>`,
        );

        await userEvent.hover(trigger(host));
        await painted();

        const anchor = trigger(host).getBoundingClientRect();
        const box = tip(host).getBoundingClientRect();

        expect(box.bottom, 'above, with the gap the token sets').toBeLessThan(anchor.top);
        expect(anchor.top - box.bottom).toBeGreaterThan(0);
        expect((box.left + box.right) / 2).toBeCloseTo((anchor.left + anchor.right) / 2, 0);
        expect(tip(host).getAttribute('data-side')).toBe('block-start');
    });

    it('goes above when the room is exactly enough, which is where the boundary sits', async () => {
        // The comparison is `>=`, and this is the input that tells it from `>`: a tip whose
        // height is exactly the room above it fits, flush against the trigger.
        const host = await mount(
            `
            <div style="position: absolute; inset-block-start: 32px">
                <ui-tooltip>
                    <button type="button">Save</button>
                    <span slot="tip" style="block-size: 32px; box-sizing: border-box">Saves.</span>
                </ui-tooltip>
            </div>
        `,
            '0px',
        );

        await userEvent.hover(trigger(host));
        await painted();

        expect(trigger(host).getBoundingClientRect().top, 'the room is the tip height').toBe(32);
        expect(tip(host).getBoundingClientRect().height).toBe(32);
        expect(tip(host).getAttribute('data-side')).toBe('block-start');
    });

    it('flips below when there is no room above', async () => {
        const host = await mount(fixture, '0px');

        await userEvent.hover(trigger(host));
        await painted();

        const anchor = trigger(host).getBoundingClientRect();
        const box = tip(host).getBoundingClientRect();

        expect(box.top).toBeGreaterThan(anchor.bottom);
        expect(tip(host).getAttribute('data-side')).toBe('block-end');
    });

    it('styles the gap from the side it wrote, so the two cannot disagree', async () => {
        const host = await mount(fixture);

        await userEvent.hover(trigger(host));

        const written = tip(host)
            .getAttributeNames()
            .find((name) => name.startsWith('data-'));

        expect(written, 'the script wrote a side').toMatch(/\S/);
        expect(styleText(), 'and the sheet reads that same name').toContain(`[${String(written)}=`);
    });

    it('stays inside the viewport at the leading edge', async () => {
        const host = await mount(`
            <div style="position: absolute; inset-inline-start: 0">
                <ui-tooltip>
                    <button type="button">S</button>
                    <span slot="tip">A description long enough to run off the edge on its own.</span>
                </ui-tooltip>
            </div>
        `);

        await userEvent.hover(trigger(host));
        await painted();

        expect(tip(host).getBoundingClientRect().left).toBeGreaterThanOrEqual(0);
    });

    it('stays inside the viewport at the trailing edge', async () => {
        const host = await mount(`
            <div style="position: absolute; inset-inline-end: 0">
                <ui-tooltip>
                    <button type="button">S</button>
                    <span slot="tip">A description long enough to run off the edge on its own.</span>
                </ui-tooltip>
            </div>
        `);

        await userEvent.hover(trigger(host));
        await painted();

        const box = tip(host).getBoundingClientRect();

        expect(box.right).toBeLessThanOrEqual(document.documentElement.clientWidth + 1);
    });

    it('follows the trigger when an ancestor scrolls, not only the window', async () => {
        const host = await mount(`
            <div id="scroller" style="block-size: 80px; overflow: auto">
                <div style="block-size: 400px; padding-block-start: 40px">
                    <ui-tooltip>
                        <button type="button">Save</button>
                        <span slot="tip">Saves.</span>
                    </ui-tooltip>
                </div>
            </div>
        `);

        // Shown by focus rather than by the pointer, and that is the test learning
        // something: scrolling moves the trigger out from under the pointer, the browser
        // dispatches the boundary event that follows, and the tip closes before the
        // placement it was supposed to be running. Measured — the first version of this
        // test passed against a *closed* tip, because a hidden popover has a rect of zero
        // and zero is not where it was.
        trigger(host).focus();
        await painted();

        // The written inset rather than the measured rect: what is under test is that the
        // placement ran again, and a rect can move for reasons that are not this component.
        const before = tip(host).style.insetBlockStart;

        expect(before, 'it was placed to begin with').toMatch(/\d/);

        const scroller = only(host, '#scroller');
        const scrolled = new Promise((resolve) => {
            scroller.addEventListener('scroll', resolve, { once: true });
        });

        scroller.scrollTop = 30;
        await scrolled;
        await painted();

        const anchor = trigger(host).getBoundingClientRect();
        const box = tip(host).getBoundingClientRect();

        expect(tip(host).style.insetBlockStart, 'it was placed again').not.toBe(before);
        expect(box.bottom, 'and it is still against the trigger').toBeLessThan(anchor.top);
    });

    it('places nothing once the tip is gone, rather than throwing at a scroll', async () => {
        // Reachable, and only from here: `#show` refuses to open without a tip, so the
        // guard inside the placement is for the window that opens when a framework
        // re-renders the tip away while it is on screen and something then scrolls.
        const host = await mount(fixture);

        await userEvent.hover(trigger(host));
        await painted();

        const thrown: string[] = [];
        const capture = (event: ErrorEvent): void => {
            thrown.push(event.message);
        };

        window.addEventListener('error', capture);

        try {
            tip(host).remove();
            window.dispatchEvent(new Event('resize'));
            await painted();
        } finally {
            window.removeEventListener('error', capture);
        }

        expect(thrown).toEqual([]);
    });

    it('places nothing once the trigger is gone either', async () => {
        const host = await mount(fixture);

        await userEvent.hover(trigger(host));
        await painted();

        const thrown: string[] = [];
        const capture = (event: ErrorEvent): void => {
            thrown.push(event.message);
        };

        window.addEventListener('error', capture);

        try {
            trigger(host).remove();
            window.dispatchEvent(new Event('resize'));
            await painted();
        } finally {
            window.removeEventListener('error', capture);
        }

        expect(thrown).toEqual([]);
    });

    it('escapes an ancestor that clips, because the platform lifts it out', async () => {
        const host = await mount(`
            <div style="overflow: hidden; block-size: 24px; inline-size: 40px">
                <ui-tooltip>
                    <button type="button">Save</button>
                    <span slot="tip">Saves without closing the dialog.</span>
                </ui-tooltip>
            </div>
        `);

        await userEvent.hover(trigger(host));
        await painted();

        expect(
            tip(host).getBoundingClientRect().width,
            'wider than the box that clips',
        ).toBeGreaterThan(40);
    });
});

describe('the drawing', () => {
    it('is a small raised surface, drawn from the token layer', async () => {
        const host = await mount(fixture);

        await userEvent.hover(trigger(host));

        const styles = getComputedStyle(tip(host));

        expect(styles.position).toBe('fixed');
        expect(styles.margin).toBe('0px');
        expect(styles.backgroundColor).toBe('rgb(255, 255, 255)');
        expect(styles.color).toBe('rgb(31, 41, 55)');
        expect(styles.borderTopWidth).toBe('1px');
        expect(styles.borderRadius).toBe('6px');
        expect(styles.padding).toBe('4px 8px');
        expect(styles.fontFamily).toContain('system-ui');
        expect(styles.boxShadow, 'the category ui-card brought').toMatch(/rgba?\(/);
    });

    it('keeps a phrase on one line up to a ceiling, rather than to whatever it sits near', async () => {
        const host = await mount(fixture);

        await userEvent.hover(trigger(host));

        expect(getComputedStyle(tip(host)).maxInlineSize).toBe('320px');
    });

    it('takes every value it paints with from the host', async () => {
        const host = await mount(fixture);
        const element = only(host, 'ui-tooltip');

        element.style.setProperty('--ui-color-surface', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-color-border', 'rgb(4, 5, 6)');
        element.style.setProperty('--ui-radius', '11px');
        element.style.setProperty('--ui-space', '10px');

        await userEvent.hover(trigger(host));

        const styles = getComputedStyle(tip(host));

        expect(styles.backgroundColor).toBe('rgb(1, 2, 3)');
        expect(styles.borderTopColor).toBe('rgb(4, 5, 6)');
        expect(styles.borderRadius).toBe('11px');
        expect(styles.padding).toBe('5px 10px');
        expect(styles.maxInlineSize).toBe('400px');
    });
});

/**
 * The stories are the playground, and mounting them here is what puts it behind the gate.
 * `expectAccessible` is called per story: a tooltip on a form control and one at the edge
 * of the viewport are different markup, and each can fail on its own.
 */
describe('accessibility', () => {
    it('has no violations on a button', async () => {
        await expectAccessible(await mountStory(Tooltip, meta, 'Tooltip'));
    });

    it('has no violations on a field control', async () => {
        await expectAccessible(await mountStory(OnAField, meta, 'OnAField'));
    });

    it('has no violations at the edge of the viewport', async () => {
        await expectAccessible(await mountStory(AtTheEdge, meta, 'AtTheEdge'));
    });

    it('has no violations inside something that clips', async () => {
        await expectAccessible(await mountStory(Inside, meta, 'Inside'));
    });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cdp } from 'vitest/browser';
// The playwright provider is what puts `send` on `CDPSession` — see `tokens.test.ts`.
import type {} from '@vitest/browser-playwright';
import { follow } from '../src/pointer.js';

/**
 * A control 100px by 40px a sheet chose a light that follows the pointer for, as a component's
 * sheet hands it over, inside a column that scrolls. Laid away from the page's corner, so where the
 * pointer is in its own pixels is not where it is in the page's.
 */
function mount(handed = '240ms'): HTMLButtonElement {
    const column = document.createElement('div');
    column.style.cssText = 'height: 120px; overflow: auto; margin: 20px 0 0 30px';
    column.innerHTML = `
        <div style="height: 400px; padding-top: 10px">
            <button style="display: block; box-sizing: border-box; width: 100px; height: 40px; margin: 0">
                Follows
            </button>
        </div>`;
    document.body.append(column);

    const control = column.querySelector('button');

    if (control === null) {
        throw new Error('no button in the fixture');
    }

    control.style.setProperty('--ui-fx-follow', handed);
    control.addEventListener('pointerover', follow);

    return control;
}

/** A frame, after which the engine has written what the moves before it asked for. */
async function frame(): Promise<void> {
    await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
            resolve();
        });
    });
}

/** The pointer coming over the control at `x`, `y` in its own pixels. */
function over(control: HTMLElement, x: number, y: number): void {
    const box = control.getBoundingClientRect();

    control.dispatchEvent(
        new PointerEvent('pointerover', {
            bubbles: true,
            composed: true,
            clientX: box.left + x,
            clientY: box.top + y,
        }),
    );
}

/** The pointer moving to `x`, `y` in the control's own pixels, as a move anywhere on the page. */
function move(control: HTMLElement, x: number, y: number): void {
    const box = control.getBoundingClientRect();

    document.dispatchEvent(
        new PointerEvent('pointermove', {
            bubbles: true,
            clientX: box.left + x,
            clientY: box.top + y,
        }),
    );
}

/** What the engine has handed the control: how near, the offset across and down, and the point. */
function handed(control: HTMLElement): readonly string[] {
    return ['near', 'nx', 'ny', 'x', 'y'].map((name) =>
        control.style.getPropertyValue(`--ui-fx-pointer-${name}`),
    );
}

beforeEach(async () => {
    // The real pointer at the far corner of the page, where no fixture is laid: one left over a
    // control as it is laid gets a pointerover of the browser's own, at the real pointer's point,
    // which the tests' own dispatched points would lose to — measured, on a full run.
    await cdp().send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: innerWidth - 1,
        y: innerHeight - 1,
        buttons: 0,
    });
});

afterEach(async () => {
    // Far off every control, so the engine lets go of each before the next test.
    document.dispatchEvent(
        new PointerEvent('pointermove', { bubbles: true, clientX: -10000, clientY: -10000 }),
    );
    await frame();
    vi.restoreAllMocks();
    document.body.replaceChildren();
});

describe('the pointer engine', () => {
    it('hands a control where the pointer is over it: near, its offset from the middle, its pixels', async () => {
        const control = mount();

        over(control, 30, 10);
        await frame();

        expect(handed(control)).toEqual(['1', '-0.4', '-0.5', '30px', '10px']);
    });

    it('follows a move anywhere on the page once the pointer has come over the control', async () => {
        const control = mount();

        over(control, 30, 10);
        await frame();
        move(control, 75, 30);
        await frame();

        expect(handed(control)).toEqual(['1', '0.5', '0.5', '75px', '30px']);
    });

    it('fades how near over 96px outside the box, and holds the offset at its edges', async () => {
        const control = mount();

        over(control, 30, 10);
        await frame();
        move(control, 148, 20);
        await frame();

        expect(handed(control), 'right of it').toEqual(['0.5', '1', '0', '148px', '20px']);

        move(control, -24, -32);
        await frame();

        // 40px out from the corner: 24 across and 32 up.
        expect(handed(control), 'off its corner').toEqual([
            String(1 - 40 / 96),
            '-1',
            '-1',
            '-24px',
            '-32px',
        ]);
    });

    it('lets go of a control the pointer has gone far enough from', async () => {
        const control = mount();

        over(control, 30, 10);
        await frame();
        move(control, 196, 20);
        await frame();

        expect(handed(control)[0], 'gone').toBe('0');

        move(control, 30, 10);
        await frame();

        expect(handed(control), 'not followed again until the pointer comes back over it').toEqual([
            '0',
            '1',
            '0',
            '196px',
            '20px',
        ]);
    });

    it('writes once a frame, however many moves it follows', async () => {
        const control = mount();
        const asked = vi.spyOn(window, 'requestAnimationFrame');

        over(control, 30, 10);
        move(control, 40, 10);
        move(control, 50, 10);

        expect(asked).toHaveBeenCalledTimes(1);

        await frame();

        expect(handed(control)[3]).toBe('50px');
    });

    it('measures the box again when its column scrolls, which only a capturing listener hears', async () => {
        const control = mount();
        const column = control.parentElement?.parentElement;

        over(control, 30, 10);
        await frame();
        column?.scrollBy(0, 5);
        column?.dispatchEvent(new Event('scroll'));
        await frame();

        // The pointer has not moved, and the control has, 5px up under it: the scroll alone asks
        // for the frame that writes it.
        expect(handed(control)[4]).toBe('15px');
    });

    it('measures the box again on a resize', async () => {
        const control = mount();

        over(control, 30, 10);
        await frame();
        control.style.marginLeft = '10px';
        window.dispatchEvent(new Event('resize'));
        await frame();

        // The resize alone asks for the frame that writes where the control moved to.
        expect(handed(control)[3]).toBe('20px');
    });

    it.each([
        ['a sheet that chose no light', ''],
        ['the collapse, which took its time to 0.01ms', '0.01ms'],
        ['a host who took its time to nothing', '0s'],
    ])('follows nothing under %s', async (_where, time) => {
        const control = mount(time);

        over(control, 30, 10);
        await frame();

        expect(handed(control)).toEqual(['', '', '', '', '']);
    });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cdp } from 'vitest/browser';
// The playwright provider is what puts `send` on `CDPSession` — see `tokens.test.ts`.
import type {} from '@vitest/browser-playwright';
import { html, render } from 'lit';
import { seen } from './pointing.js';
import { follow, followed } from '../src/pointer.js';

/**
 * A control 100px by 40px a sheet chose a light that follows the pointer for, as a component's
 * sheet hands it over, inside a column that scrolls — not yet handed to the engine. Laid away from
 * the page's corner, so where the pointer is in its own pixels is not where it is in the page's.
 */
function laid(handed = '240ms'): HTMLButtonElement {
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

    return control;
}

/** The control laid and handed to the engine, once the engine has seen it on the window. */
async function mount(handed = '240ms'): Promise<HTMLButtonElement> {
    const control = laid(handed);

    follow(control);
    await seen(control);

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

/**
 * The pointer moving to `x`, `y` in the control's own pixels, as a move anywhere on the page, which
 * is all the engine listens to.
 */
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

/** What a control the engine has never written holds. */
const nothing = ['', '', '', '', ''];

beforeEach(async () => {
    // The real pointer at the far corner of the page, where no fixture is laid: a move of its own
    // over a control would hand the engine the real pointer's point, which the tests' own
    // dispatched points would lose to.
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
        const control = await mount();

        move(control, 30, 10);
        await frame();

        expect(handed(control)).toEqual(['1', '-0.4', '-0.5', '30px', '10px']);
    });

    it('follows the pointer as it nears the control, before it has come over it', async () => {
        const control = await mount();

        move(control, 300, 20);
        await frame();

        expect(handed(control), '200px off').toEqual(nothing);

        move(control, 148, 20);
        await frame();

        expect(handed(control), '48px off').toEqual(['0.5', '1', '0', '148px', '20px']);
    });

    it('fades how near over 96px outside the box, and holds the offset at its edges', async () => {
        const control = await mount();

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

    it('lets go of a control the pointer has gone far enough from, and follows it again as it nears', async () => {
        const control = await mount();

        move(control, 30, 10);
        await frame();
        move(control, 196, 20);
        await frame();

        expect(handed(control), 'gone').toEqual(['0', '1', '0', '196px', '20px']);

        move(control, 300, 20);
        await frame();

        expect(handed(control), 'written once as it went, and no more').toEqual([
            '0',
            '1',
            '0',
            '196px',
            '20px',
        ]);

        move(control, 148, 20);
        await frame();

        expect(handed(control), 'back').toEqual(['0.5', '1', '0', '148px', '20px']);
    });

    it('writes once a frame, however many moves it follows', async () => {
        const control = await mount();
        await frame();

        const asked = vi.spyOn(window, 'requestAnimationFrame');

        move(control, 30, 10);
        move(control, 40, 10);
        move(control, 50, 10);

        expect(asked).toHaveBeenCalledTimes(1);

        await frame();

        expect(handed(control)[3]).toBe('50px');
    });

    it("reads a control's sheet once, and again only once a second has passed", async () => {
        const clock = vi.spyOn(performance, 'now').mockReturnValue(5000);
        const control = await mount();

        move(control, 30, 10);
        await frame();

        const read = vi.spyOn(window, 'getComputedStyle');

        clock.mockReturnValue(5999);
        move(control, 40, 10);
        await frame();

        expect(read, 'within the second').not.toHaveBeenCalledWith(control);
        expect(handed(control)[3], 'followed all the same').toBe('40px');

        clock.mockReturnValue(6000);
        move(control, 50, 10);
        await frame();

        expect(read, 'a second on').toHaveBeenCalledWith(control);
    });

    it('measures no control whose sheet chose no light, wherever the pointer is', async () => {
        const control = await mount('');
        const box = control.getBoundingClientRect();
        const measured = vi.spyOn(control, 'getBoundingClientRect');

        document.dispatchEvent(
            new PointerEvent('pointermove', {
                bubbles: true,
                clientX: box.left + 30,
                clientY: box.top + 10,
            }),
        );
        await frame();

        expect(measured).not.toHaveBeenCalled();
    });

    it('measures the box again when its column scrolls, which only a capturing listener hears', async () => {
        const control = await mount();
        const column = control.parentElement?.parentElement;

        move(control, 30, 10);
        await frame();
        column?.scrollBy(0, 5);
        column?.dispatchEvent(new Event('scroll'));
        await frame();

        // The pointer has not moved, and the control has, 5px up under it: the scroll alone asks
        // for the frame that writes it.
        expect(handed(control)[4]).toBe('15px');
    });

    it('measures the box again on a resize', async () => {
        const control = await mount();

        move(control, 30, 10);
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
        const control = await mount(time);

        move(control, 30, 10);
        await frame();

        expect(handed(control)).toEqual(nothing);
    });

    it('follows a light chosen meanwhile, and lets go of one taken away, a second on', async () => {
        // Chosen and taken away by a script, as a theme switched or a control disabled are, which
        // nothing on the page reports.
        const clock = vi.spyOn(performance, 'now').mockReturnValue(5000);
        const control = await mount('');

        move(control, 30, 10);
        await frame();
        control.style.setProperty('--ui-fx-follow', '240ms');
        move(control, 40, 10);
        await frame();

        expect(handed(control), 'chosen, as it was read').toEqual(nothing);

        clock.mockReturnValue(6000);
        move(control, 50, 10);
        await frame();

        expect(handed(control), 'chosen, read again').toEqual(['1', '0', '-0.5', '50px', '10px']);

        control.style.setProperty('--ui-fx-follow', '0s');
        move(control, 60, 10);
        await frame();

        expect(handed(control)[0], 'taken away, as it was read').toBe('1');

        clock.mockReturnValue(7000);
        move(control, 70, 10);
        await frame();

        expect(handed(control), 'taken away, read again').toEqual([
            '0',
            '0.4',
            '-0.5',
            '70px',
            '10px',
        ]);
    });

    it('reads the sheet of a control again as the pointer comes over it', async () => {
        const control = await mount('');

        move(control, 30, 10);
        await frame();
        control.style.setProperty('--ui-fx-follow', '240ms');
        control.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, composed: true }));
        move(control, 40, 10);
        await frame();

        expect(handed(control)).toEqual(['1', '-0.2', '-0.5', '40px', '10px']);
    });

    it('reads the sheet of a control again as it comes back onto the window', async () => {
        // Within the second the answer is kept for, so only the arrival has it read again.
        vi.spyOn(performance, 'now').mockReturnValue(5000);
        const control = await mount('');

        move(control, 30, 10);
        await frame();
        control.style.display = 'none';
        await seen(control);
        control.style.setProperty('--ui-fx-follow', '240ms');
        control.style.display = 'block';
        await seen(control);
        await frame();

        expect(handed(control)).toEqual(['1', '-0.4', '-0.5', '30px', '10px']);
    });

    it('follows a control that comes onto the page under a pointer that has not moved', async () => {
        const control = laid();
        const box = control.getBoundingClientRect();

        control.style.display = 'none';
        follow(control);
        await seen(control);
        document.dispatchEvent(
            new PointerEvent('pointermove', {
                bubbles: true,
                clientX: box.left + 30,
                clientY: box.top + 10,
            }),
        );
        await frame();

        expect(handed(control), 'not drawn').toEqual(nothing);

        control.style.display = 'block';
        await seen(control);
        await frame();

        expect(handed(control), 'drawn').toEqual(['1', '-0.4', '-0.5', '30px', '10px']);
    });

    it('writes nothing more to a control taken off the page, and lets go of it as it comes back', async () => {
        const control = await mount();
        const parent = control.parentElement;

        move(control, 30, 10);
        await frame();
        control.remove();
        // A frame for the engine's observer to find it gone, and one for the report to arrive.
        await frame();
        await frame();
        // Far off, where a control still measured would be written once more as it was let go of.
        document.dispatchEvent(
            new PointerEvent('pointermove', {
                bubbles: true,
                clientX: innerWidth - 1,
                clientY: innerHeight - 1,
            }),
        );
        await frame();

        expect(handed(control), 'off the page').toEqual(['1', '-0.4', '-0.5', '30px', '10px']);

        parent?.append(control);
        await seen(control);
        await frame();

        expect(handed(control)[0], 'back, and far from the pointer').toBe('0');
    });

    it('follows the element a template writes it on, as the template is drawn', async () => {
        const host = document.createElement('div');
        host.style.cssText = 'margin: 20px 0 0 30px';
        document.body.append(host);
        render(
            html`<span
                style="display: block; width: 100px; height: 40px; --ui-fx-follow: 240ms"
                ${followed()}
            ></span>`,
            host,
        );

        const span = host.querySelector('span');

        if (span === null) {
            throw new Error('the template drew no span');
        }

        await seen(span);
        move(span, 30, 10);
        await frame();

        expect(handed(span)).toEqual(['1', '-0.4', '-0.5', '30px', '10px']);
    });
});

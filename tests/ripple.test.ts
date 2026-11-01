import { afterEach, describe, expect, it } from 'vitest';
import { spread } from '../src/ripple.js';

/**
 * A control 100px by 40px a sheet chose the ripple for, as a component's sheet hands it over, with
 * the layer the circle is drawn on. Laid away from the page's corner, so where it was pressed in its
 * own box is not where it was pressed in the page.
 */
function mount(time = '520ms', curve = 'linear'): HTMLButtonElement {
    const style = document.createElement('style');
    style.textContent = 'button::after { content: ""; }';
    document.body.append(style);

    const control = document.createElement('button');
    control.textContent = 'Ripples';
    control.style.cssText =
        'display: block; box-sizing: border-box; width: 100px; height: 40px; margin: 20px 0 0 30px';
    control.style.setProperty('--ui-fx-ripple-time', time);
    control.style.setProperty('--ui-fx-ripple-curve', curve);
    control.addEventListener('pointerdown', spread);
    control.addEventListener('keydown', spread);
    document.body.append(control);

    return control;
}

/** The pointer's `button` going down over the control at `x`, `y` in its own pixels. */
function down(control: HTMLElement, x: number, y: number, button = 0): void {
    const box = control.getBoundingClientRect();

    control.dispatchEvent(
        new PointerEvent('pointerdown', {
            bubbles: true,
            composed: true,
            button,
            clientX: box.left + x,
            clientY: box.top + y,
        }),
    );
}

/** `key` going down on the control, or repeating its down where it is held. */
function key(control: HTMLElement, name: string, repeat = false): void {
    control.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, composed: true, key: name, repeat }),
    );
}

/** The circles running on the control. */
function ripples(control: HTMLElement): Animation[] {
    return control.getAnimations({ subtree: true });
}

/** Where the circle starts, as the control was handed it. */
function point(control: HTMLElement): readonly string[] {
    return ['x', 'y'].map((axis) => control.style.getPropertyValue(`--ui-fx-ripple-${axis}`));
}

/** How far the circle has spread on the layer it is drawn on. */
function spreadTo(control: HTMLElement): string {
    return getComputedStyle(control, '::after').getPropertyValue('--ui-fx-ripple');
}

afterEach(() => {
    for (const animation of document.getAnimations()) {
        animation.cancel();
    }

    document.body.replaceChildren();
});

describe('the ripple', () => {
    it("spreads from where the pointer's primary button went down, as fractions of the box", () => {
        const control = mount();

        down(control, 30, 10);

        expect(point(control)).toEqual(['30%', '25%']);
        expect(control.hasAttribute('data-ripple'), 'marked while it spreads').toBe(true);
        expect(
            ripples(control).map((animation) => (animation.effect as KeyframeEffect).pseudoElement),
            'one circle, on the layer it is drawn on',
        ).toEqual(['::after']);
    });

    it('reads the point off the box as it is drawn, so a press that scales the control leaves it', () => {
        const control = mount();
        control.style.scale = '0.5';

        const box = control.getBoundingClientRect();

        control.dispatchEvent(
            new PointerEvent('pointerdown', {
                bubbles: true,
                button: 0,
                clientX: box.left + box.width * 0.3,
                clientY: box.top + box.height * 0.25,
            }),
        );

        expect(point(control)).toEqual(['30%', '25%']);
    });

    it.each([
        ['Space', ' '],
        ['Enter', 'Enter'],
    ])('spreads from the middle for %s', (_name, name) => {
        const control = mount();

        key(control, name);

        expect(point(control)).toEqual(['50%', '50%']);
        expect(ripples(control)).toHaveLength(1);
    });

    it('runs from a point to the farthest corner over the time and on the curve it is handed', () => {
        const control = mount('400ms', 'ease-in');

        down(control, 30, 10);

        const [circle] = ripples(control);

        expect(circle?.effect?.getTiming()).toMatchObject({ duration: 400, easing: 'ease-in' });

        circle?.pause();

        if (circle !== undefined) {
            circle.currentTime = 0;
        }

        expect(spreadTo(control), 'a point').toBe('0');

        circle?.finish();

        // Over, and back at rest where the property rests: spread, and faded to nothing.
        expect(spreadTo(control), 'at rest').toBe('1');
    });

    it('spreads halfway at half its time on a straight curve', () => {
        const control = mount();

        down(control, 30, 10);

        const [circle] = ripples(control);

        circle?.pause();

        if (circle !== undefined) {
            circle.currentTime = 260;
        }

        expect(spreadTo(control)).toBe('0.5');
    });

    it.each([
        [
            "the pointer's other button",
            (control: HTMLElement) => {
                down(control, 30, 10, 2);
            },
        ],
        [
            'another key',
            (control: HTMLElement) => {
                key(control, 'a');
            },
        ],
    ])('spreads nothing for %s', (_what, act) => {
        const control = mount();

        act(control);

        expect(ripples(control)).toEqual([]);
        expect(control.hasAttribute('data-ripple')).toBe(false);
        expect(point(control)).toEqual(['', '']);
    });

    it('spreads nothing more for a key held down, which repeats its down', () => {
        const control = mount();

        key(control, ' ');

        const first = ripples(control);

        key(control, ' ', true);

        expect(ripples(control)).toEqual(first);
        expect(first[0]?.playState).toBe('running');
    });

    it.each([
        ['a sheet that chose no ripple', ''],
        ['the collapse, which took its time to 0.01ms', '0.01ms'],
        ['a host who took its time to nothing', '0s'],
    ])('spreads nothing under %s', (_where, time) => {
        const control = mount(time);

        down(control, 30, 10);

        expect(ripples(control)).toEqual([]);
        expect(control.hasAttribute('data-ripple')).toBe(false);
    });

    it('starts over from a press that lands while it is spreading, and keeps the mark', async () => {
        const control = mount();

        down(control, 30, 10);

        const [first] = ripples(control);
        // Read before it is given up: a cancelled animation hands out a new promise.
        const ending = first?.finished;

        down(control, 75, 30);

        expect(first?.playState, 'the first given up').toBe('idle');
        expect(ripples(control)).toHaveLength(1);
        expect(point(control)).toEqual(['75%', '75%']);

        // The first's end, a cancellation, has come and gone.
        await ending?.catch(() => undefined);

        expect(control.hasAttribute('data-ripple')).toBe(true);
    });

    it('takes the mark off once the circle has spread', async () => {
        const control = mount();

        down(control, 30, 10);

        const [circle] = ripples(control);

        circle?.finish();
        await circle?.finished;

        expect(control.hasAttribute('data-ripple')).toBe(false);
    });

    it('takes the mark off where something else cancels the circle', async () => {
        const control = mount();

        down(control, 30, 10);

        const [circle] = ripples(control);
        const ending = circle?.finished;

        circle?.cancel();
        await ending?.catch(() => undefined);

        expect(control.hasAttribute('data-ripple')).toBe(false);
    });
});

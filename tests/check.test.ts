import { afterEach, describe, expect, it } from 'vitest';
import { checked } from '../src/check.js';

/**
 * A drawn control a sheet chose a mark for, as a component's sheet hands it over: an
 * `<input type="checkbox">` drawn by hand, its mark on its `::before` while it is checked.
 */
function mount(effect: string, time = '520ms', curve = 'linear'): HTMLInputElement {
    const style = document.createElement('style');
    style.textContent = `
        input { appearance: none; position: relative; width: 24px; height: 24px; margin: 0;
            transition: background-color 1s; }
        input:checked { background-color: rgb(0, 0, 255); }
        input:checked::before { content: ''; position: absolute; inset: 0; }
        input[data-check] { transition-property: none; }
    `;
    document.body.append(style);

    const control = document.createElement('input');
    control.type = 'checkbox';
    control.style.setProperty('--ui-fx-check', effect);
    control.style.setProperty('--ui-fx-check-time', time);
    control.style.setProperty('--ui-fx-check-curve', curve);
    control.addEventListener('change', checked);
    document.body.append(control);

    return control;
}

/** The reader's change: the control set as a click would set it, and its `change` fired. */
function change(control: HTMLInputElement, to: boolean): void {
    control.checked = to;
    control.dispatchEvent(new Event('change', { bubbles: true }));
}

/** The marks playing on the control's `::before`. */
function marks(control: HTMLInputElement): Animation[] {
    return control.getAnimations({ subtree: true });
}

/** The one mark playing, held `time` milliseconds in. */
function held(control: HTMLInputElement, time: number): Animation {
    const [mark] = marks(control);

    if (mark === undefined) {
        throw new Error('no mark is playing');
    }

    mark.pause();
    mark.currentTime = time;

    return mark;
}

afterEach(() => {
    for (const animation of document.getAnimations()) {
        animation.cancel();
    }

    document.body.replaceChildren();
});

describe('the check', () => {
    it('draws the tick on from its start to its end as the reader checks the control', () => {
        const control = mount('draw');

        change(control, true);

        const mark = held(control, 0);

        expect((mark.effect as KeyframeEffect).pseudoElement, 'on the mark').toBe('::before');
        expect(getComputedStyle(control, '::before').clipPath, 'not yet drawn').toBe(
            'inset(0px 100% 0px 0px)',
        );

        mark.currentTime = 260;

        expect(getComputedStyle(control, '::before').clipPath, 'half drawn').toBe(
            'inset(0px 50% 0px 0px)',
        );
    });

    it('pops the dot in from a fifth of its size', () => {
        const control = mount('pop');

        change(control, true);
        held(control, 0);

        expect(getComputedStyle(control, '::before').scale, 'a fifth').toBe('0.2');

        held(control, 260);

        expect(getComputedStyle(control, '::before').scale, 'halfway').toBe('0.6');
    });

    it('plays over the time and on the curve the sheet hands over', () => {
        const control = mount('draw', '400ms', 'ease-in');

        change(control, true);

        expect(marks(control)[0]?.effect?.getTiming()).toMatchObject({
            duration: 400,
            easing: 'ease-in',
        });
    });

    it('plays nothing as the reader clears the control', () => {
        const control = mount('draw');
        control.checked = true;

        change(control, false);

        expect(marks(control)).toEqual([]);
        expect(control.hasAttribute('data-check')).toBe(false);
    });

    it.each([
        ['a sheet that chose no mark', '', '520ms'],
        ['a mark the script does not know', 'spin', '520ms'],
        ['the collapse, which took its time to 0.01ms', 'draw', '0.01ms'],
        ['a host who took its time to nothing', 'draw', '0s'],
    ])('plays nothing under %s', (_where, effect, time) => {
        const control = mount(effect, time);

        change(control, true);

        expect(marks(control)).toEqual([]);
        expect(control.hasAttribute('data-check')).toBe(false);
    });

    it('takes the control its colour at once while the mark plays, by the mark it carries', () => {
        const control = mount('draw');

        change(control, true);

        expect(control.hasAttribute('data-check'), 'marked').toBe(true);
        expect(getComputedStyle(control).backgroundColor, 'at once').toBe('rgb(0, 0, 255)');
    });

    it('takes the mark off once the mark has played', async () => {
        const control = mount('draw');

        change(control, true);

        const [mark] = marks(control);

        mark?.finish();
        await mark?.finished;

        expect(control.hasAttribute('data-check')).toBe(false);
    });

    it('takes the mark off where something else cancels the mark', async () => {
        const control = mount('draw');

        change(control, true);

        const [mark] = marks(control);
        // Read before it is given up: a cancelled animation hands out a new promise.
        const ending = mark?.finished;

        mark?.cancel();
        await ending?.catch(() => undefined);

        expect(control.hasAttribute('data-check')).toBe(false);
    });

    it('plays over from the start where a check lands while the mark plays, and keeps the mark', async () => {
        const control = mount('draw');

        change(control, true);

        const [first] = marks(control);
        const ending = first?.finished;

        change(control, false);
        change(control, true);

        expect(first?.playState, 'the first given up').toBe('idle');
        expect(marks(control)).toHaveLength(1);

        await ending?.catch(() => undefined);

        expect(control.hasAttribute('data-check')).toBe(true);
    });
});

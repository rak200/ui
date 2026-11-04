import { afterEach, describe, expect, it, vi } from 'vitest';
import { arrived, left } from '../src/next.js';

/** What a sheet hands a tip it chose the glide for: a time and a curve each its own. */
const handed = '--ui-fx-next: glide; --ui-fx-next-time: 800ms; --ui-fx-next-curve: steps(2)';

/** A tip of the suite's own, its box at `x`, `y`, `width` by `height`, on `side` of its trigger. */
function made(
    [x, y, width, height]: readonly [number, number, number, number],
    style = handed,
    side = 'block-start',
): HTMLElement {
    const tip = document.createElement('span');
    tip.style.cssText = `position: fixed; left: ${String(x)}px; top: ${String(y)}px; width: ${String(width)}px; height: ${String(height)}px; ${style}`;
    tip.setAttribute('data-side', side);
    document.body.append(tip);

    return tip;
}

/** Sets the page's clock to `now`, in milliseconds. */
function at(now: number): void {
    vi.spyOn(performance, 'now').mockReturnValue(now);
}

/** The glide set going on `tip`: where it starts and ends, its time, curve, and how it adds. */
function glide(tip: HTMLElement): (readonly unknown[])[] {
    return tip.getAnimations().map((animation) => {
        const effect = animation.effect as KeyframeEffect;
        const timing = effect.getTiming();

        return [
            effect.getKeyframes().map((frame) => frame['translate']),
            timing.duration,
            timing.easing,
            effect.composite,
        ];
    });
}

afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
    // What the last test left noted, taken by a tip of no one's.
    arrived(document.createElement('span'));
});

describe('the next tip', () => {
    it('glides over from where the other was, by its middle and the bottom edge, above its trigger', () => {
        const other = made([0, 100, 100, 20]);
        const next = made([200, 120, 60, 30]);

        at(1000);
        left(other);
        at(1200);
        arrived(next);

        // Middles 50 and 230; bottoms 120 and 150.
        expect(glide(next)).toEqual([[['-180px -30px', '0px'], 800, 'steps(2)', 'add']]);
    });

    it('glides by the top edge below its trigger', () => {
        const other = made([0, 100, 100, 20]);
        const next = made([200, 140, 60, 30], handed, 'block-end');

        at(1000);
        left(other);
        arrived(next);

        // Tops 100 and 140.
        expect(glide(next)[0]?.[0]).toEqual(['-180px -40px', '0px']);
    });

    it('ends both their effects first, the other gone and the next arrived', () => {
        const other = made([0, 100, 100, 20]);
        const next = made([200, 120, 60, 30]);
        const going = other.animate([{ opacity: 0 }], 10000);
        const coming = next.animate([{ opacity: 0 }], 10000);

        at(1000);
        left(other);
        arrived(next);

        expect([going.playState, coming.playState]).toEqual(['finished', 'finished']);
    });

    it('is the next as late as 300ms after the other closed', () => {
        const other = made([0, 100, 100, 20]);
        const next = made([200, 120, 60, 30]);

        at(1000);
        left(other);
        at(1300);
        arrived(next);

        expect(glide(next)).toHaveLength(1);
    });

    it.each([
        ['nobody chose the glide', '', false, 1000, 1200],
        ['it opened later than 300ms after', handed, false, 1000, 1301],
        ['the other was taken off the page', handed, true, 1000, 1200],
    ] as const)('is not the next where %s', (_name, style, removed, closed, opened) => {
        const other = made([0, 100, 100, 20]);
        const next = made([200, 120, 60, 30], style);
        const going = other.animate([{ opacity: 0 }], 10000);

        at(closed);
        left(other);

        if (removed) {
            other.remove();
        }

        at(opened);
        arrived(next);

        expect([glide(next), going.playState]).toEqual([[], 'running']);
    });

    it('is not the next to itself, shown again', () => {
        const tip = made([0, 100, 100, 20]);

        at(1000);
        left(tip);
        arrived(tip);

        expect(glide(tip)).toEqual([]);
    });

    it('hands over once, to the first tip that opens', () => {
        const other = made([0, 100, 100, 20]);
        const next = made([200, 120, 60, 30]);
        const after = made([400, 120, 60, 30]);

        at(1000);
        left(other);
        arrived(next);
        arrived(after);

        expect([glide(next), glide(after)].map((each) => each.length)).toEqual([1, 0]);
    });

    it('glides from nowhere before any tip has closed', () => {
        const tip = made([0, 100, 100, 20]);

        at(1000);
        arrived(tip);

        expect(glide(tip)).toEqual([]);
    });
});

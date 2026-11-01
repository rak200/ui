/**
 * The press's ripple — RFC 0004's: a circle spread once from where the control was pressed, out to
 * its farthest corner, fading as it goes.
 *
 * **It starts as the press lands and plays out on its own.** What a sheet draws under `:active`
 * goes when the press does, and a click is over in about 100ms — RFC 0004's S7 — so the circle is
 * started from here and finishes whatever the press does after it. From where the pointer's primary
 * button went down, and from the middle for Space and for Enter, whose click holds no press but is
 * the reader pressing the control all the same. A key held repeats its down, which spreads nothing
 * more.
 *
 * **The sheet draws it, and this only moves it.** The circle is a picture the sheet paints on the
 * control's `::after`, by a registered number that runs from 0, a point as strong as the circle
 * gets, to 1, the farthest corner reached and the circle faded to nothing. This writes where it
 * starts, as fractions of the control's box — a press that scales the control scales the box with
 * it, and leaves the fractions as they were — and runs the number over the time and curve the sheet
 * hands over. While it runs, the control carries `data-ripple`, so the sheet can draw the circle in
 * the place of what that layer draws otherwise.
 *
 * **The sheet decides, and this only reads.** A component declares `--ui-fx-ripple-time` and
 * `--ui-fx-ripple-curve` on its control, under the ripple's query, while it can be used. So it
 * ripples exactly where the sheet chose it, and never in an engine without style queries; under
 * reduced motion the time is the collapse's 0.01ms, and nothing ripples.
 *
 * Internal — it is not re-exported from `src/index.ts`.
 */

import { kinds, milliseconds } from './motion.js';

/** The time under which the collapse took the ripple: reduced motion's 0.01ms, or none. */
const collapsed = 0.01;

/** The ripple each control last started, so the one a press starts over leaves the mark alone. */
const playing = new WeakMap<HTMLElement, Animation>();

// Stryker disable all: the circle's property is registered once, at import, in the page's one
// registry — so in the warm process Stryker switches mutants in, the original registration stands
// before any mutant is active, and none of them changes what a test can see. Outside the runner's
// reach, not an equivalent mutant.
try {
    // How far the circle has spread: registered, so it moves rather than jumps, and resting at its
    // end, where it has faded to nothing.
    CSS.registerProperty({
        name: '--ui-fx-ripple',
        syntax: '<number>',
        inherits: false,
        initialValue: '1',
    });
} catch {
    // Registered already, by another copy of this package on the page, which stands.
}
// Stryker restore all

/**
 * Spreads the ripple on the control a press reached, where its sheet chose the ripple. Bound to the
 * control's `pointerdown` and `keydown` as it is: a pointer's primary button going down, or Space or
 * Enter going down. A press that lands while one is still spreading starts it over from there.
 */
export function spread(event: PointerEvent | KeyboardEvent): void {
    const control = event.currentTarget as HTMLElement;
    const style = getComputedStyle(control);
    const time = milliseconds(style.getPropertyValue(`${kinds.animated}ripple-time`));
    const pointer = event instanceof PointerEvent;
    const pressed = pointer
        ? event.button === 0
        : !event.repeat && (event.key === ' ' || event.key === 'Enter');

    if (!pressed || !(time > collapsed)) {
        return;
    }

    const box = control.getBoundingClientRect();

    control.style.setProperty(
        `${kinds.animated}ripple-x`,
        pointer ? `${String(((event.clientX - box.left) / box.width) * 100)}%` : '50%',
    );
    control.style.setProperty(
        `${kinds.animated}ripple-y`,
        pointer ? `${String(((event.clientY - box.top) / box.height) * 100)}%` : '50%',
    );
    playing.get(control)?.cancel();
    control.toggleAttribute('data-ripple', true);

    const ripple = control.animate(
        { [`${kinds.animated}ripple`]: [0, 1] },
        {
            duration: time,
            easing: style.getPropertyValue(`${kinds.animated}ripple-curve`),
            pseudoElement: '::after',
        },
    );
    // Over when it ends, and when something else cancels it; one a press started over is not.
    const over = (): void => {
        if (playing.get(control) === ripple) {
            control.removeAttribute('data-ripple');
        }
    };

    playing.set(control, ripple);
    void ripple.finished.then(over, over);
}

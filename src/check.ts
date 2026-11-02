/**
 * The check's mark — RFC 0004's: the tick drawn on and the dot popped in as the reader checks a
 * drawn control, and never as it renders checked.
 *
 * **It plays on the reader's change, in script.** An animation a sheet draws under `:checked`
 * plays as the control renders checked, and again whenever a script checks it; `change` is the
 * event a reader's check fires and a script's write does not. So the mark is played from here, on
 * the control's own `::before`, where the component paints it — the checkbox's tick, the radio's
 * dot. Clearing a control plays nothing: the mark goes as it did.
 *
 * **The sheet decides, and this only reads.** A component declares `--ui-fx-check` — `draw` or
 * `pop` — with the time and curve the mark plays over, on its control, under the check's query,
 * while it can be used. So the mark plays exactly where the sheet chose it, and never in an engine
 * without style queries; under reduced motion the time is the collapse's 0.01ms, and nothing plays.
 *
 * **The control takes its colour at once while the mark plays.** Faded in, the box was still near
 * white while the white mark was drawn on it, and the mark was whole by the time the fill showed
 * it — measured for RFC 0004. The click has begun that fade before the change arrives, so the
 * control carries `data-check` while the mark plays, which the sheet reads to take the colours out
 * of its transitions: a transition whose property leaves the list ends where it was going.
 *
 * Internal — it is not re-exported from `src/index.ts`.
 */

import { kinds, milliseconds } from './motion.js';

/** The time under which the collapse took the mark: reduced motion's 0.01ms, or none. */
const collapsed = 0.01;

/**
 * What each mark plays on the control's `::before`, by the effect its sheet names. The tick drawn
 * from its start to its end, to a whole inset rather than to the mark's own clip, which is none: a
 * shape does not interpolate with none, so the tick was hidden for half the draw and then shown
 * whole — measured for RFC 0004. The dot grown from a fifth of its size.
 */
const marks = new Map<string, PropertyIndexedKeyframes>([
    ['draw', { clipPath: ['inset(0 100% 0 0)', 'inset(0 0 0 0)'] }],
    ['pop', { scale: [0.2, 1] }],
]);

/** The mark each control last played, so the one a check plays over leaves the mark alone. */
const playing = new WeakMap<HTMLInputElement, Animation>();

/**
 * Plays the mark on the control a reader's change reached, where its sheet chose one and the change
 * left it checked. Called from the component's own `change` listener, with that listener's event,
 * whose `currentTarget` is the control. A check that lands while a mark is still playing plays it
 * over from the start.
 */
export function checked(event: Event): void {
    const control = event.currentTarget as HTMLInputElement;
    const style = getComputedStyle(control);
    const frames = marks.get(style.getPropertyValue(`${kinds.animated}check`));
    const time = milliseconds(style.getPropertyValue(`${kinds.animated}check-time`));

    if (!control.checked || frames === undefined || !(time > collapsed)) {
        return;
    }

    playing.get(control)?.cancel();
    control.toggleAttribute('data-check', true);

    const mark = control.animate(frames, {
        duration: time,
        easing: style.getPropertyValue(`${kinds.animated}check-curve`),
        pseudoElement: '::before',
    });
    // Over when it ends, and when something else cancels it; one a check played over is not.
    const over = (): void => {
        if (playing.get(control) === mark) {
            control.removeAttribute('data-check');
        }
    };

    playing.set(control, mark);
    void mark.finished.then(over, over);
}

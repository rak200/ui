/**
 * The pointer engine — RFC 0004's: where the pointer is, for the lights that follow it.
 *
 * **One listener, and one write a frame.** A control whose sheet chose a light that follows the
 * pointer is followed from the moment the pointer comes over it until the pointer is far enough
 * away that its light has gone, {@link reach} pixels out. Its box is measured as the pointer
 * arrives rather than on every move, and again when a scroll or a resize moves it under a pointer
 * that may not have moved. Each frame the pointer moved in, the control is handed where the pointer
 * is, in its own pixels and as a fraction of the way from its middle to its edges, and how near it
 * is. Measured for RFC 0004 at 0.5 to 1.4ms a move, for the one control the pointer is over, not
 * for every instance on the page.
 *
 * **The sheet decides, and this only reads.** A component declares `--ui-fx-follow` on its
 * control, a duration, under the queries of the lights it draws, where the pointer can hover and
 * the control can be used. So nothing follows a pointer that cannot hover, or a control that cannot
 * be used, and under reduced motion the duration is the collapse's and nothing follows: the engine
 * reads no other duration, so it finds the collapse in this one, never in the media query.
 *
 * Internal — it is not re-exported from `src/index.ts`.
 */

import { kinds, milliseconds } from './motion.js';

/** How far from a control the pointer is still near it, in pixels: its light fades out over this. */
const reach = 96;

/** The time under which the collapse took the following: reduced motion's 0.01ms, or none. */
const collapsed = 0.01;

/** The controls followed now, each with its box as last measured. */
const followed = new Map<HTMLElement, DOMRect>();

/** Where the pointer was last, across, in the page's pixels. */
let x = 0;

/** Where the pointer was last, down. */
let y = 0;

/** Whether a frame is already asked for, so a frame writes once however many moves it follows. */
let pending = false;

/** A number held between -1 and 1. */
function within(value: number): number {
    return Math.max(-1, Math.min(1, value));
}

/**
 * Hands `control` where the pointer is from its `box`, and returns how near it is: 1 over the box,
 * and less the further out, to nothing {@link reach} pixels away.
 */
function write(control: HTMLElement, box: DOMRect): number {
    const outside = Math.hypot(
        Math.max(box.left - x, 0, x - box.right),
        Math.max(box.top - y, 0, y - box.bottom),
    );
    const near = Math.max(0, 1 - outside / reach);

    control.style.setProperty(`${kinds.animated}pointer-near`, String(near));
    control.style.setProperty(
        `${kinds.animated}pointer-nx`,
        String(within((x - box.left - box.width / 2) / (box.width / 2))),
    );
    control.style.setProperty(
        `${kinds.animated}pointer-ny`,
        String(within((y - box.top - box.height / 2) / (box.height / 2))),
    );
    control.style.setProperty(`${kinds.animated}pointer-x`, `${String(x - box.left)}px`);
    control.style.setProperty(`${kinds.animated}pointer-y`, `${String(y - box.top)}px`);

    return near;
}

/** Writes every followed control, and lets go of each the pointer has gone far enough from. */
function frame(): void {
    pending = false;

    for (const [control, box] of followed) {
        if (write(control, box) === 0) {
            followed.delete(control);
        }
    }
}

/** Asks for a frame, unless one is asked for already. */
function schedule(): void {
    if (!pending) {
        pending = true;
        requestAnimationFrame(frame);
    }
}

/** Where the pointer moved to. */
function moved(event: PointerEvent): void {
    x = event.clientX;
    y = event.clientY;
    schedule();
}

/** Measures every followed control again, since a scroll or a resize moved it. */
function measure(): void {
    for (const control of followed.keys()) {
        followed.set(control, control.getBoundingClientRect());
    }

    schedule();
}

/**
 * Follows the pointer over the control a `pointerover` event reached, where its sheet chose a
 * light that follows it. Its listener's event, so a component binds it as it is. The engine's own
 * listeners go on the page as the first control is followed, and a second call adds nothing,
 * since a listener added twice is one. A scroll is heard capturing, so a column's own, which does
 * not reach the window, is heard too.
 */
export function follow(event: PointerEvent): void {
    const control = event.currentTarget as HTMLElement;
    const time = milliseconds(
        getComputedStyle(control).getPropertyValue(`${kinds.animated}follow`),
    );

    if (!(time > collapsed)) {
        return;
    }

    followed.set(control, control.getBoundingClientRect());
    x = event.clientX;
    y = event.clientY;
    schedule();
    document.addEventListener('pointermove', moved);
    addEventListener('scroll', measure, true);
    addEventListener('resize', measure);
}

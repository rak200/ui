/**
 * The toaster's stack — RFC 0004's: how the toasts a change leaves standing move into their place
 * when another arrives or leaves, rather than jumping there.
 *
 * **Measured before the change, moved after it, from where each stood.** A sheet cannot animate a
 * move the layout made, so the stack does what RFC 0004's prototype did, the reference's glide: it
 * knows where each toast stood, lets the layout move them, and plays each from where it stood to
 * where it stands. A toast leaving announces it with `ui-dismiss` while it still holds its place,
 * which is when the others are measured; once it has gone, each is moved from there. A toast
 * arriving is reported once it is in the stack, so the others are measured with it taken out of the
 * layout, and moved at the next frame, once it is drawn and has the size it will keep.
 *
 * **Where each stands leaves out whatever moves it**: the stack's own place in the viewport and the
 * toast's offset in it, which no translate, transform or animation shifts. So a move that starts
 * while another runs, or while a toast slides in, starts from where the layout put the toast, and
 * is added to whatever else moves it.
 *
 * **The sheet decides, and this only reads.** A toast hands `--ui-fx-stack: spring` with the time
 * and the curve it moves on, under its toaster's query, which reads where the toaster stands. So a
 * toast moves only where its toaster chose that, and under reduced motion the time is the collapse's
 * and nothing moves.
 *
 * Internal — it is not re-exported from `src/index.ts`.
 */

import { kinds, milliseconds } from './motion.js';

/** The time under which the collapse took the move: reduced motion's 0.01ms, or none. */
const collapsed = 0.01;

/** Where `toast` stands in `toaster`'s stack, in the viewport, leaving out whatever moves it. */
function standing(toaster: HTMLElement, toast: HTMLElement): number {
    return toaster.getBoundingClientRect().top + toast.offsetTop;
}

/**
 * What in `toaster` holds a place in its stack: every toast not on its way out. Whatever else a host
 * put there is measured too and moves nothing, since only a toast is handed a move.
 */
function standingIn(toaster: HTMLElement): HTMLElement[] {
    return [...toaster.children].filter(
        (each) => !each.matches(':state(leaving)'),
    ) as HTMLElement[];
}

/**
 * Writes where each of `toasts` stands now into `stood`: a map filled by setting, so nothing a later
 * frame reads back was ever written as a literal.
 */
function measure(
    toaster: HTMLElement,
    toasts: readonly HTMLElement[],
    stood: Map<HTMLElement, number>,
): void {
    for (const toast of toasts) {
        stood.set(toast, standing(toaster, toast));
    }
}

/**
 * Moves each toast `stood` names from where it stood to where it stands now, as its sheet chose: on
 * its translate, added to whatever moves it already, and only where it moved at all.
 */
function settle(toaster: HTMLElement, stood: ReadonlyMap<HTMLElement, number>): void {
    for (const [toast, top] of stood) {
        const style = getComputedStyle(toast);
        const time = milliseconds(style.getPropertyValue(`${kinds.animated}stack-time`));
        const moved = top - standing(toaster, toast);

        if (
            style.getPropertyValue(`${kinds.animated}stack`) === 'spring' &&
            time > collapsed &&
            moved !== 0
        ) {
            // From where it stood, to where it stands: the end is the toast as it is, added to.
            toast.animate([{ offset: 0, translate: `0 ${String(moved)}px` }], {
                duration: time,
                easing: style.getPropertyValue(`${kinds.animated}stack-curve`),
                composite: 'add',
            });
        }
    }
}

/**
 * Watches `toaster`'s stack, and moves its toasts into their place as one arrives or leaves, for as
 * long as the toaster lives: the watcher is held by the toaster it watches, and goes with it.
 */
export function watch(toaster: HTMLElement): void {
    /** Where the others stood as one began to go: measured while it still held its place. */
    const leaving = new Map<HTMLElement, number>();

    const going = (): void => {
        measure(toaster, standingIn(toaster), leaving);
    };

    const watcher = new MutationObserver((records) => {
        const arrived = records
            .flatMap((record) => [...record.addedNodes])
            .filter(
                (node): node is HTMLElement =>
                    node instanceof HTMLElement && node.localName === 'ui-toast',
            );

        // One gone: each of the others from where it stood as it began to go.
        settle(toaster, leaving);
        leaving.clear();

        // The others as they stood, any newcomers taken out of the layout for the reading, and moved
        // at the next frame, once the newcomers are drawn at the size they keep. With none, nothing
        // stands anywhere else by then, and nothing moves.
        const displays = new Map<HTMLElement, string>();

        for (const toast of arrived) {
            displays.set(toast, toast.style.display);
            toast.style.display = 'none';
        }

        const stood = new Map<HTMLElement, number>();

        measure(
            toaster,
            standingIn(toaster).filter((toast) => !arrived.includes(toast)),
            stood,
        );

        for (const [toast, display] of displays) {
            toast.style.display = display;
        }

        requestAnimationFrame(() => {
            settle(toaster, stood);
        });
    });

    // Capturing, so the measuring is done before anything a host listens with on the toast.
    toaster.addEventListener('ui-dismiss', going, true);
    watcher.observe(toaster, { childList: true });
}

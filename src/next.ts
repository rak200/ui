/**
 * The next tip — RFC 0004's, every theme's: a tip that opens soon after another closed glides over
 * from where the other was, so along a row of triggers one tip seems to follow the pointer.
 *
 * **The page notes where each tip was and when as it closes**, and a tip that opens within 300ms
 * of it — about the time a pointer takes to cross to a trigger beside it, and the delay a tooltip
 * library skips its own after — is the next. Both their effects are ended once it is placed, the
 * other's exit and its own entrance, typing included, and it is moved from where the other was by
 * its middle and the edge nearest its trigger, added to what places it, over the overlay's step on
 * a move's curve. The window is a reading of the pointer rather than motion, so it is not a token
 * and does not collapse; under reduced motion the glide's own time does.
 *
 * **Only a tip still on the page hands over**: one taken off it has nowhere to glide from. The
 * same tip shown again is not the next, and a tip hands over once.
 *
 * **The sheet decides, and this only reads.** A tooltip hands its tip `--ui-fx-next: glide` with
 * the time and the curve, and nothing — with a time of nothing — where the glide is not chosen.
 * Nothing called as any tip shows or goes can throw: the tip before the first is a sentinel rather
 * than `undefined`, and a time handed over always reads as a number.
 *
 * Internal — it is not re-exported from `src/index.ts`.
 */

import { kinds, milliseconds } from './motion.js';

/** How soon after one tip closes another opening is the next, in milliseconds. */
const soon = 300;

/** A tip that closed: where it was drawn as it closed, and when. */
interface Closed {
    readonly tip: Element;
    readonly box: DOMRect;
    readonly at: number;
}

/**
 * The tip before the first: an element on no page, which no tip glides from. Written with nothing a
 * mutant could turn, since it is made once, at import, before any mutant is active.
 */
const nowhere: Closed = { tip: new Image(), box: new DOMRect(), at: 0 };

/** The tip that closed last, which the next one to open glides from. */
let last = nowhere;

/** Notes that `tip` is closing, and where it is drawn as it starts to go. */
export function left(tip: HTMLElement): void {
    last = { tip, box: tip.getBoundingClientRect(), at: performance.now() };
}

/**
 * Glides `tip`, shown and placed, over from where the tip that closed just before it was, where its
 * sheet chose the glide: both their effects ended first, so neither is drawn moving again.
 */
export function arrived(tip: HTMLElement): void {
    const from = last;
    const style = getComputedStyle(tip);

    last = nowhere;

    if (
        style.getPropertyValue(`${kinds.animated}next`) !== 'glide' ||
        from.tip === tip ||
        !from.tip.isConnected ||
        performance.now() - from.at > soon
    ) {
        return;
    }

    for (const animation of [...from.tip.getAnimations(), ...tip.getAnimations()]) {
        animation.finish();
    }

    const box = tip.getBoundingClientRect();
    // Its middle from the other's, and the edge nearest its trigger from the other's: the bottom
    // of a tip above its trigger, the top of one below it.
    const across = from.box.left + from.box.width / 2 - (box.left + box.width / 2);
    const down =
        tip.getAttribute('data-side') === 'block-end'
            ? from.box.top - box.top
            : from.box.bottom - box.bottom;

    tip.animate([{ translate: `${String(across)}px ${String(down)}px` }, { translate: '0 0' }], {
        duration: milliseconds(style.getPropertyValue(`${kinds.animated}next-time`)),
        easing: style.getPropertyValue(`${kinds.animated}next-curve`),
        composite: 'add',
    });
}

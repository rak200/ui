/**
 * The pointer engine — RFC 0004's: where the pointer is, for the lights that follow it.
 *
 * **A light comes in as the pointer nears, as it goes as the pointer leaves.** A component hands the
 * engine each element it draws a light that follows the pointer on — {@link followed} in its
 * template, or {@link follow} — and the engine follows one from the moment the pointer comes within
 * {@link reach} pixels of its box until it is that far off again, so each light rises over the
 * distance it fades over. Followed from its `pointerover`, a light came on only once the pointer was
 * over the element, and at its full strength.
 *
 * **It measures only the elements that draw a light.** An observer keeps the elements handed over
 * that are on the window, the only ones the pointer can be near, and the engine reads whether each
 * one's sheet chose a light that follows the pointer, keeping the answer for {@link kept}
 * milliseconds. Each frame the pointer moved in, or the page scrolled or resized under it, it
 * measures the elements that draw one, and only then writes each the pointer is near: where the
 * pointer is, in the element's own pixels and as a fraction of the way from its middle to its edges,
 * and how near it is. Every read comes before every write, so no write lays the page out again for
 * the next read. Where no sheet chose a light, as under the default theme, it measures no box, and
 * reads each sheet once a second while the pointer moves.
 *
 * **An answer is kept a second because nothing says when it changes.** A theme switched, an effect
 * chosen, a control disabled, the reader's setting for reduced motion: nothing tells a page that a
 * sheet chose otherwise, and a script can do any of them with no action of the reader's. So a light
 * chosen meanwhile is followed, and one taken away let go of, within a second, and at once for an
 * element that comes onto the window or that the pointer comes over, whose sheet is read again then.
 * Kept for good, an answer read under one theme outlived the switch to another: the lights a theme
 * chose followed the pointer under one that chose none.
 *
 * **The sheet decides, and this only reads.** A component declares `--ui-fx-follow` on the element,
 * a duration, under the queries of the lights it draws, where the pointer can hover and the control
 * can be used. So nothing follows a pointer that cannot hover, or a control that cannot be used, and
 * under reduced motion the duration is the collapse's and nothing follows: the engine reads no other
 * duration, so it finds the collapse in this one, never in the media query.
 *
 * Internal — it is not re-exported from `src/index.ts`.
 */

import { noChange } from 'lit';
import { Directive, directive, type ElementPart } from 'lit/directive.js';
import { kinds, milliseconds } from './motion.js';

/** How far from an element the pointer is near it, in pixels: its light comes in and goes over this. */
const reach = 96;

/** The time under which the collapse took the following: reduced motion's 0.01ms, or none. */
const collapsed = 0.01;

/** The elements handed over that are on the window: the only ones the pointer can be near. */
const around = new Set<HTMLElement>();

/**
 * The elements followed now, which the pointer was near at the last frame. Held weakly, so one taken
 * off the page while it was followed goes with the page, and is let go of as it comes back.
 */
const following = new WeakSet<HTMLElement>();

/** How long an answer read off a sheet is kept, in milliseconds: a reading, and so no token. */
const kept = 1000;

/** Whether each element's sheet chose a light that follows the pointer, as last read. */
const known = new WeakMap<HTMLElement, boolean>();

/** When each element's sheet was last read, on the page's clock. */
const read = new WeakMap<HTMLElement, number>();

/** Where the pointer was last, across, in the page's pixels: near nothing until it moves. */
let x = Number.NEGATIVE_INFINITY;

/** Where the pointer was last, down. */
let y = Number.NEGATIVE_INFINITY;

/** Whether a frame is already asked for, so a frame writes once however many moves it follows. */
let pending = false;

/** A number held between -1 and 1. */
function within(value: number): number {
    return Math.max(-1, Math.min(1, value));
}

/**
 * Whether `element`'s sheet chose a light that follows the pointer: as last read, or read now where
 * it was never read, or not for {@link kept} milliseconds.
 */
function draws(element: HTMLElement): boolean {
    const now = performance.now();

    if (now - (read.get(element) ?? Number.NEGATIVE_INFINITY) >= kept) {
        known.set(
            element,
            milliseconds(getComputedStyle(element).getPropertyValue(`${kinds.animated}follow`)) >
                collapsed,
        );
        read.set(element, now);
    }

    return known.get(element) === true;
}

/** How near the pointer is to `box`: 1 over it, less the further out, nothing {@link reach} away. */
function nearness(box: DOMRect): number {
    const outside = Math.hypot(
        Math.max(box.left - x, 0, x - box.right),
        Math.max(box.top - y, 0, y - box.bottom),
    );

    return Math.max(0, 1 - outside / reach);
}

/** Hands `element` where the pointer is from its `box`, and how `near` it is. */
function write(element: HTMLElement, box: DOMRect, near: number): void {
    element.style.setProperty(`${kinds.animated}pointer-near`, String(near));
    element.style.setProperty(
        `${kinds.animated}pointer-nx`,
        String(within((x - box.left - box.width / 2) / (box.width / 2))),
    );
    element.style.setProperty(
        `${kinds.animated}pointer-ny`,
        String(within((y - box.top - box.height / 2) / (box.height / 2))),
    );
    element.style.setProperty(`${kinds.animated}pointer-x`, `${String(x - box.left)}px`);
    element.style.setProperty(`${kinds.animated}pointer-y`, `${String(y - box.top)}px`);
}

/**
 * Measures each element on the window that draws a light, and each that drew one at the last frame,
 * then writes each the pointer is near, and once more each it has gone far enough from, or whose
 * light was taken away, which it lets go of.
 */
function frame(): void {
    pending = false;

    const boxes = new Map<HTMLElement, DOMRect>();
    const nears = new Map<HTMLElement, number>();

    for (const element of around) {
        const chosen = draws(element);

        if (chosen || following.has(element)) {
            const box = element.getBoundingClientRect();

            boxes.set(element, box);
            nears.set(element, chosen ? nearness(box) : 0);
        }
    }

    for (const [element, box] of boxes) {
        const near = nears.get(element) ?? 0;

        if (near > 0) {
            following.add(element);
            write(element, box, near);
        } else if (following.delete(element)) {
            write(element, box, near);
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

/**
 * Has what the sheet chose read again, at the next frame, for each element the pointer has come
 * over: the move that brought it there asks for that frame.
 */
function entered(event: PointerEvent): void {
    for (const target of event.composedPath()) {
        read.delete(target as HTMLElement);
    }
}

/**
 * Keeps {@link around} to the elements on the window, reading again what the sheet chose for each
 * that comes onto it, and draws from there, so one that comes onto it under a pointer that has not
 * moved is followed as it arrives.
 */
function observed(entries: readonly IntersectionObserverEntry[]): void {
    for (const { target, isIntersecting } of entries) {
        if (isIntersecting) {
            read.delete(target as HTMLElement);
            around.add(target as HTMLElement);
        } else {
            around.delete(target as HTMLElement);
        }
    }

    schedule();
}

/** The one observer every element handed over is observed by. */
const observer = new IntersectionObserver(observed);

/**
 * Follows the pointer for `element` from as it comes within {@link reach} pixels of its box, where
 * its sheet chose a light that follows it. A component hands it each element it draws such a light
 * on, and a second call adds nothing: an element observed twice is observed once, and a listener
 * added twice is one. The engine's own listeners go on the page with the first. A scroll is heard
 * capturing, so a column's own, which does not reach the window, is heard too.
 */
export function follow(element: HTMLElement): void {
    observer.observe(element);
    document.addEventListener('pointermove', moved);
    document.addEventListener('pointerover', entered);
    addEventListener('scroll', schedule, true);
    addEventListener('resize', schedule);
}

/** Hands the engine the element it is written on, each time the template it is in is drawn. */
class Follow extends Directive {
    /** Nothing, which nothing reads. */
    override render(): void {
        // An element's directive is drawn by update(), which never asks this for anything.
    }

    /** Follows the element, which adds nothing once it is followed. */
    override update(part: ElementPart): typeof noChange {
        follow(part.element as HTMLElement);

        return noChange;
    }
}

/**
 * Follows the element it is written on, as {@link follow} does — `<span ${followed()}>` — so a
 * component hands over an element its template draws as the template draws it.
 */
export const followed = directive(Follow);

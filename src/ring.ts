/**
 * The ring the page flies — RFC 0004's: the focus ring carried over from the control the reader
 * saw it on last to the one the focus reached, for the effects an outline cannot draw.
 *
 * **An outline is drawn round its own element, whole and sharp, and moves only with it**, so a ring
 * that leaves one control and lands on another is one ring of the page's own: a popover laid where
 * the control's ring is, moved with the control frame by frame while the control's outline is put
 * away, and hidden itself once it lands, where the outline is back. The ring the reader sees from
 * the first frame is the ring that stays.
 *
 * **In the top layer**, so a ring on a modal dialog's controls flies over the dialog as well, and
 * **styled on the node**, as `src/description.ts`'s clip is, so the host's page needs no sheet for
 * it. `aria-hidden`, and nothing a pointer lands on: it says nothing the control's own ring does
 * not.
 *
 * **The sheet decides, and this only reads.** A component declares `--ui-fx-ring: glide` on its
 * control while the reader can see the focus on it, under the glide's query, with the flight's
 * time and curve resolved there too. So the ring flies exactly where the sheet chose it — a choice
 * at any scope, or a theme's taste — and never in an engine without style queries or in forced
 * colours, which the sheet leaves out. Under reduced motion the time is the collapse's 0.01ms and
 * nothing flies, the ring being there at once: the collapse is found in a value it sets, never in
 * the media query, which is what RFC 0004's fifth question asks.
 *
 * **A glide leaves only from a ring the reader saw, and only for where the focus went.** The
 * focus's departure records where its ring was and what the focus went to; an arrival anywhere
 * else — a click, a script's focus, the page's first — is the ring at once. Never after a time:
 * WebKit dispatched the arrival 36ms to 65ms after the departure, measured for RFC 0004, so a time
 * is too short there and long enough elsewhere to fly from a focus that went nowhere.
 *
 * Internal — it is not re-exported from `src/index.ts`.
 */

import { kinds } from './motion.js';

/** A ring's four corners, clockwise from the top left. */
type Corners = readonly [number, number, number, number];

/** A ring's box: where it is, how big, and its corners. */
interface Round {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly corners: Corners;
}

/** Where the ring the reader saw last was when the focus left it, and what the focus went to. */
interface Departure {
    readonly to: EventTarget;
    readonly from: (width: number, offset: number) => Round | undefined;
}

/** The ring in the air: the control it lands on, where it is now, and its landing. */
interface Trip {
    readonly control: HTMLElement;
    now: Round;
    readonly end: () => void;
}

/**
 * A departure from no ring the reader saw, which no glide leaves from: toward a target of its own,
 * which is on no arrival's path.
 */
const nowhere: Departure = { to: new EventTarget(), from: () => undefined };

/** The time under which the collapse took the flight: reduced motion's 0.01ms, or none at all. */
const collapsed = 0.01;

/** The control the reader can see the focus on, while it has it. */
let seen: Element | undefined;

/** The ring the reader saw last, as the focus left it. */
let left: Departure = nowhere;

/** The ring in the air, if one is. */
let flying: Trip | undefined;

/** The page's flown ring, made the first time one flies, and again if the page took it away. */
let flier: HTMLElement | undefined;

/** Whether the page's focus is being watched yet. */
let watching = false;

/**
 * One corner of the ring an outline `out` past the boundary draws: round as the element's, and a
 * square one square.
 */
function corner(radius: string, out: number): number {
    const drawn = Number.parseFloat(radius);

    return drawn > 0 ? drawn + out : 0;
}

/** The ring an outline `width` wide and `offset` off the boundary draws round `element` now. */
function round(element: Element, width: number, offset: number): Round {
    const box = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const out = offset + width;

    return {
        x: box.x - out,
        y: box.y - out,
        width: box.width + 2 * out,
        height: box.height + 2 * out,
        corners: [
            corner(style.borderTopLeftRadius, out),
            corner(style.borderTopRightRadius, out),
            corner(style.borderBottomRightRadius, out),
            corner(style.borderBottomLeftRadius, out),
        ],
    };
}

/** The ring `progress` of the way from one ring to another. */
function between(from: Round, to: Round, progress: number): Round {
    const along = (start: number, end: number): number => start + (end - start) * progress;

    return {
        x: along(from.x, to.x),
        y: along(from.y, to.y),
        width: along(from.width, to.width),
        height: along(from.height, to.height),
        corners: [
            along(from.corners[0], to.corners[0]),
            along(from.corners[1], to.corners[1]),
            along(from.corners[2], to.corners[2]),
            along(from.corners[3], to.corners[3]),
        ],
    };
}

/** A duration as CSS writes one, in milliseconds. */
function milliseconds(value: string): number {
    const time = Number.parseFloat(value);

    return value.endsWith('ms') ? time : time * 1000;
}

/** The page's flown ring, laid in the page and styled on itself. */
function aloft(): HTMLElement {
    const ring = document.createElement('div');
    ring.popover = 'manual';
    ring.ariaHidden = 'true';
    ring.dataset['uiRing'] = '';
    ring.style.cssText =
        'position:fixed;inset:auto;margin:0;padding:0;box-sizing:border-box;border-style:solid;background:none;overflow:visible;pointer-events:none';
    document.body.append(ring);

    return ring;
}

/** Lays the flown ring over a ring. */
function lay(ring: HTMLElement, at: Round): void {
    ring.style.left = `${String(at.x)}px`;
    ring.style.top = `${String(at.y)}px`;
    ring.style.width = `${String(at.width)}px`;
    ring.style.height = `${String(at.height)}px`;
    ring.style.borderRadius = at.corners.map((one) => `${String(one)}px`).join(' ');
}

/**
 * Watches the page's focus, once: where the reader can see it, and where its ring was as it left.
 * A component that offers the glide calls this as it connects, so the departure before its first
 * arrival is already recorded. Capturing, so a page that stops either event on its way up does not
 * stop it reaching here.
 */
export function watch(): void {
    if (watching) {
        return;
    }

    watching = true;
    document.addEventListener(
        'focusin',
        (event) => {
            const target = event.composedPath()[0] as Element;

            seen = target.matches(':focus-visible') ? target : undefined;
        },
        true,
    );
    document.addEventListener(
        'focusout',
        (event) => {
            const target = event.composedPath()[0] as Element;
            const to = event.relatedTarget ?? nowhere.to;

            if (flying?.control === target) {
                // Leaving while the ring is still landing: it goes on from where it had got to.
                const { now } = flying;

                flying.end();
                left = { to, from: () => now };
            } else if (target === seen) {
                // Not where it is no longer drawn: a closed dialog's control is a box of nothing.
                left = {
                    to,
                    from: (width, offset) =>
                        target.getClientRects().length === 0
                            ? undefined
                            : round(target, width, offset),
                };
            } else {
                left = nowhere;
            }

            seen = undefined;
        },
        true,
    );
}

/**
 * Flies the page's ring onto the control a `focus` event reached, from the ring the reader saw
 * last, where the control's sheet chose the glide. Anywhere else it does nothing, and the control's
 * own ring is there at once. Its listener's event, so a component binds it as it is.
 */
export function arrive(event: FocusEvent): void {
    const path = event.composedPath();
    const control = path[0] as HTMLElement;
    const style = getComputedStyle(control);
    const width = Number.parseFloat(style.outlineWidth);
    const offset = Number.parseFloat(style.outlineOffset);
    const time = milliseconds(style.getPropertyValue(`${kinds.animated}ring-time`));
    // Only for where the focus went: the departure's target is the control or a host around it.
    const from = path.includes(left.to) ? left.from(width, offset) : undefined;

    if (
        style.getPropertyValue(`${kinds.animated}ring`) !== 'glide' ||
        !(time > collapsed) ||
        from === undefined
    ) {
        return;
    }

    flying?.end();

    const ring = flier?.isConnected === true ? flier : aloft();

    flier = ring;
    ring.style.borderWidth = `${String(width)}px`;
    ring.style.borderColor = style.outlineColor;
    lay(ring, from);
    ring.showPopover();
    control.style.setProperty('outline-style', 'none');

    // An effect with no keyframes is a clock, its progress already eased by the curve.
    const timing = new KeyframeEffect(ring, null, {
        duration: time,
        easing: style.getPropertyValue(`${kinds.animated}ring-curve`),
    });
    const clock = new Animation(timing, document.timeline);
    const trip: Trip = {
        control,
        now: from,
        end: () => {
            // Once: a landing can still arrive after the reader moved on and a new ring took off.
            if (flying === trip) {
                flying = undefined;
                clock.cancel();
                control.style.removeProperty('outline-style');
                ring.hidePopover();
            }
        },
    };

    flying = trip;

    const step = (): void => {
        if (flying === trip) {
            trip.now = between(
                from,
                round(control, width, offset),
                timing.getComputedTiming().progress ?? 1,
            );
            lay(ring, trip.now);
            requestAnimationFrame(step);
        }
    };

    clock.play();
    requestAnimationFrame(step);
    void clock.finished.then(trip.end, () => undefined);
}

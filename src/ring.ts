/**
 * The ring the page flies — RFC 0004's: the focus ring carried over from the control the reader
 * saw it on last to the one the focus reached, or shaken where it is, for the effects an outline
 * cannot draw.
 *
 * **An outline is drawn round its own element, whole and sharp, and moves only with it**, so a ring
 * that leaves one control and lands on another, or jumps about its own, is one ring of the page's
 * own: a popover laid where the control's ring is, moved with the control frame by frame while the
 * control's outline is put away, and hidden itself once it lands, where the outline is back. The
 * ring the reader sees from the first frame is the ring that stays.
 *
 * **In the top layer**, so a ring on a modal dialog's controls flies over the dialog as well, and
 * **styled on the node**, as `src/description.ts`'s clip is, so the host's page needs no sheet for
 * it. `aria-hidden`, and nothing a pointer lands on: it says nothing the control's own ring does
 * not.
 *
 * **The sheet decides, and this only reads.** A component declares `--ui-fx-ring` on its control
 * while the reader can see the focus on it — `glide` or `glitch`, under that effect's query — with
 * the flight's time and curve resolved there too, and for the glitch the colours of its two lines.
 * So the ring flies exactly where the sheet chose it — a choice at any scope, or a theme's taste —
 * and never in an engine without style queries or in forced colours, which the sheet leaves out. Under reduced motion the time is the collapse's 0.01ms and
 * nothing flies, the ring being there at once: the collapse is found in a value it sets, never in
 * the media query, which is what RFC 0004's fifth question asks.
 *
 * **A glide leaves only from a ring the reader saw, and only for where the focus went.** The
 * focus's departure records where its ring was and what the focus went to; an arrival anywhere
 * else — a click, a script's focus, the page's first — is the ring at once. Never after a time:
 * WebKit dispatched the arrival 36ms to 65ms after the departure, measured for RFC 0004, so a time
 * is too short there and long enough elsewhere to fly from a focus that went nowhere.
 *
 * **A glitch shakes the control's own ring**, wherever the focus came from: jumped a pixel or three
 * each way at each step, split three times into two lines thrown either way, and back where the
 * control's ring is before it lands. Drawn a frame at a time from the flight's clock, as the glide
 * is laid, so the shake stays on a control that moves while it plays. The lines' colours are
 * handed over as written, and resolved in the control's own scheme, which the ring takes.
 *
 * **A refocus brings the control's own ring into focus from a blur**, wherever the focus came from,
 * and blurs it away as the focus leaves, on a second ring of the page's own, since the next
 * control's may be coming into focus meanwhile: as a surface comes into focus and goes out of it,
 * a quarter again the time handed over, the blur sized to a line. The ring is whole from the first
 * frame as it arrives, and fades only over the second half as it goes.
 *
 * Internal — it is not re-exported from `src/index.ts`.
 */

import { kinds, milliseconds } from './motion.js';

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

/** The ring in the air: the control it lands on, where it is now, and its landing. */
interface Trip {
    readonly control: HTMLElement;
    now: Round;
    readonly end: () => void;
}

/** A ring the reader saw come into focus: its control, and what it was drawn with as it came. */
interface Leaving {
    readonly control: Element;
    readonly width: number;
    readonly offset: number;
    readonly colour: string;
    readonly time: number;
    /** The curve it blurs away on. */
    readonly curve: string;
}

/** The page's flown ring, and the two lines a glitch splits it into. */
interface Flier {
    readonly ring: HTMLElement;
    /** The line thrown left, and the one thrown right. */
    readonly lines: readonly [HTMLElement, HTMLElement];
}

/**
 * The glitch's shake: how far the ring jumps, and the point of the flight it holds there until —
 * RFC 0004's, a step about every twelfth. Past the last, it is back where the control's ring is.
 */
const shake: readonly (readonly [jump: string, until: number])[] = [
    ['-2px 0', 0.08],
    ['2px 1px', 0.16],
    ['-3px -1px', 0.25],
    ['1px 0', 0.33],
    ['3px 1px', 0.41],
    ['-1px -1px', 0.5],
    ['2px 0', 0.58],
    ['-2px 1px', 0.66],
    ['1px -1px', 0.75],
    ['-1px 0', 0.83],
    ['1px 0', 0.91],
];

/** The spans of the flight a glitch splits the ring in, each from where it starts to where it ends. */
const splits: readonly (readonly [start: number, end: number])[] = [
    [0.08, 0.16],
    [0.33, 0.41],
    [0.58, 0.66],
];

/**
 * A ring coming into focus, from the blur it starts at to the ring as it is. The offset is written:
 * a lone keyframe is otherwise the last, and the ring went the other way — measured.
 */
const sharpen: Keyframe[] = [{ filter: 'blur(3px)', offset: 0 }];

/** A ring going out of focus, from the ring as it is to the blur it ends at. */
const blurred: Keyframe[] = [{ filter: 'blur(3px)', offset: 1 }];

/** A ring fading out, from the ring as it is. */
const faded: Keyframe[] = [{ opacity: 0, offset: 1 }];

/** How much longer than the time handed over a ring takes to come into focus, or to go out of it. */
const refocusing = 1.25;

/** A target on no arrival's path: where a focus that left no ring the reader saw went. */
const nowhere = new EventTarget();

/** The time under which the collapse took the flight: reduced motion's 0.01ms, or none at all. */
const collapsed = 0.01;

/** The control the reader can see the focus on, while it has it. */
let seen: Element | undefined;

/** What the focus went to as it left the ring the reader saw last. */
let towards: EventTarget = nowhere;

/** Where that ring was, for an outline `width` wide and `offset` off its control. */
let ringed: (width: number, offset: number) => Round | undefined = () => undefined;

/** The ring in the air, if one is. */
let flying: Trip | undefined;

/** The page's flown ring, made the first time one flies, and again if the page took it away. */
let flier: Flier | undefined;

/** The ring the reader saw come into focus last, until the focus leaves it. */
let refocused: Leaving | undefined;

/** The second ring, which a refocused ring blurs away on, made as the first is. */
let fading: HTMLElement | undefined;

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

/** One of the glitch's lines, thrown `aside` off the ring it is drawn over, and hidden. */
function line(aside: string): HTMLElement {
    const drawn = document.createElement('div');
    drawn.style.cssText =
        'position:absolute;box-sizing:border-box;border-style:solid;border-radius:inherit;opacity:0;pointer-events:none';
    drawn.style.translate = aside;

    return drawn;
}

/** A ring of the page's own, laid in the page and styled on itself. */
function blank(): HTMLElement {
    const ring = document.createElement('div');
    ring.popover = 'manual';
    ring.ariaHidden = 'true';
    ring.toggleAttribute('data-ui-ring');
    ring.style.cssText =
        'position:fixed;inset:auto;margin:0;padding:0;box-sizing:border-box;border-style:solid;background:none;overflow:visible;pointer-events:none';
    document.body.append(ring);

    return ring;
}

/** The page's flown ring, with the glitch's two lines. */
function aloft(): Flier {
    const ring = blank();
    const lines = [line('-3px 0'), line('3px 0')] as const;

    ring.append(...lines);

    return { ring, lines };
}

/**
 * Blurs away a ring the reader saw come into focus, on the second ring, where it is round its
 * control as the focus leaves — but not round a control no longer drawn, a box of nothing.
 */
function defocus({ control, width, offset, colour, time, curve }: Leaving): void {
    if (control.getClientRects().length === 0) {
        return;
    }

    const ring = fading?.isConnected === true ? fading : blank();
    const length = time * refocusing;

    fading = ring;

    for (const playing of ring.getAnimations()) {
        playing.cancel();
    }

    lay(ring, round(control, width, offset));
    ring.style.borderWidth = `${String(width)}px`;
    ring.style.borderColor = colour;
    // Put away first, so a ring still blurring from the last departure comes up again.
    ring.hidePopover();
    ring.showPopover();

    const going = ring.animate(blurred, { duration: length, easing: curve, fill: 'forwards' });

    ring.animate(faded, {
        duration: length / 2,
        delay: length / 2,
        easing: curve,
        fill: 'forwards',
    });
    // `hidePopover()`, not `togglePopover(false)`: a page that took the ring out of the document
    // has hidden it already, which the one finds and the other throws on — measured, as a
    // rejection in this callback, where it reaches nobody.
    void going.finished.then(
        () => {
            ring.hidePopover();
        },
        () => undefined,
    );
}

/** Shakes the flown ring and shows its lines as the glitch has them at `progress`. */
function jolt({ ring, lines }: Flier, progress: number): void {
    const shown = splits.some(([start, end]) => start <= progress && progress < end);

    ring.style.translate = shake.find(([, until]) => progress < until)?.[0] ?? 'none';

    for (const one of lines) {
        one.style.opacity = shown ? '0.8' : '0';
    }
}

/** Lays the flown ring over a ring. */
function lay(ring: HTMLElement, at: Round): void {
    ring.style.left = `${String(at.x)}px`;
    ring.style.top = `${String(at.y)}px`;
    ring.style.width = `${String(at.width)}px`;
    ring.style.height = `${String(at.height)}px`;
    ring.style.borderRadius = at.corners.map((one) => `${String(one)}px`).join(' ');
}

/** Where the reader can see the focus arrive. */
function heardIn(event: FocusEvent): void {
    const target = event.composedPath()[0] as Element;

    seen = target.matches(':focus-visible') ? target : undefined;
}

/** Where the focus left a ring the reader saw, and what it went to. */
function heardOut(event: FocusEvent): void {
    const target = event.composedPath()[0] as Element;
    const to = event.relatedTarget ?? nowhere;

    if (refocused?.control === target) {
        defocus(refocused);
        refocused = undefined;
    }

    if (flying?.control === target) {
        // Leaving while the ring is still landing: it goes on from where it had got to.
        const { now } = flying;

        flying.end();
        towards = to;
        ringed = () => now;
    } else if (target === seen) {
        towards = to;
        // Not where it is no longer drawn: a closed dialog's control is a box of nothing.
        ringed = (width, offset) =>
            target.getClientRects().length === 0 ? undefined : round(target, width, offset);
    } else {
        towards = nowhere;
    }

    seen = undefined;
}

/**
 * Watches the page's focus: where the reader can see it, and where its ring was as it left. A
 * component that offers the glide calls this as it connects, so the departure before its first
 * arrival is already recorded; a second call adds nothing, since a listener added twice is one.
 * Capturing, so a page that stops either event on its way up does not stop it reaching here.
 */
export function watch(): void {
    // Stryker disable next-line BooleanLiteral: the capturing listener an earlier run added is
    // still on the page in the warm process Stryker switches mutants in, and heardIn records the
    // same element whichever phase runs it, so a bubbling one added beside it changes nothing a
    // test can see. Outside the runner's reach, not an equivalent mutant: the departure's flag
    // beside it is killed, since heardOut run twice forgets the ring it had just recorded.
    document.addEventListener('focusin', heardIn, true);
    document.addEventListener('focusout', heardOut, true);
}

/**
 * Flies the page's ring onto the control a `focus` event reached, where the control's sheet chose a
 * flight: the glide from the ring the reader saw last, or the glitch over the control's own.
 * Anywhere else it does nothing, and the control's own ring is there at once. Its listener's event,
 * so a component binds it as it is.
 */
export function arrive(event: FocusEvent): void {
    const path = event.composedPath();
    const control = path[0] as HTMLElement;
    const style = getComputedStyle(control);
    const kind = style.getPropertyValue(`${kinds.animated}ring`);
    const width = Number.parseFloat(style.outlineWidth);
    const offset = Number.parseFloat(style.outlineOffset);
    const time = milliseconds(style.getPropertyValue(`${kinds.animated}ring-time`));
    // The glide only for where the focus went: the departure's target is the control or a host
    // around it. The glitch and the refocus wherever the focus came from, since each starts where
    // it lands.
    const left = kind === 'glide' && path.includes(towards) ? ringed(width, offset) : undefined;
    const from = kind === 'glitch' || kind === 'refocus' ? round(control, width, offset) : left;

    if (!(time > collapsed) || from === undefined) {
        return;
    }

    flying?.end();

    const drawn = flier?.ring.isConnected === true ? flier : aloft();
    const { ring, lines } = drawn;
    const [thrownLeft, thrownRight] = lines;

    flier = drawn;
    ring.style.borderWidth = `${String(width)}px`;
    ring.style.borderColor = style.outlineColor;
    ring.style.colorScheme = style.colorScheme;
    ring.style.removeProperty('translate');
    thrownLeft.style.borderColor = style.getPropertyValue(`${kinds.animated}ring-left`);
    thrownRight.style.borderColor = style.getPropertyValue(`${kinds.animated}ring-right`);

    for (const one of lines) {
        one.style.inset = `${String(-width)}px`;
        one.style.borderWidth = `${String(width)}px`;
        one.style.opacity = '0';
    }

    ring.showPopover();
    control.style.setProperty('outline-style', 'none');

    // An effect with no keyframes is a clock, its progress already eased by the curve. The ring is
    // laid by the first frame's step, which runs before that frame is painted; a refocus's clock
    // brings it into focus as well.
    const timing = new KeyframeEffect(ring, kind === 'refocus' ? sharpen : null, {
        duration: kind === 'refocus' ? time * refocusing : time,
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

    if (kind === 'refocus') {
        refocused = {
            control,
            width,
            offset,
            colour: style.outlineColor,
            time,
            curve: style.getPropertyValue(`${kinds.animated}ring-exit`),
        };
    }

    // The glide is laid along the way from where it left; the glitch and the refocus stay on the
    // control's ring, wherever the control has got to, and the glitch is shaken there.
    const step = (): void => {
        if (flying === trip) {
            const progress = timing.getComputedTiming().progress ?? 1;

            trip.now = between(
                from,
                round(control, width, offset),
                kind === 'glide' ? progress : 1,
            );
            lay(ring, trip.now);

            if (kind === 'glitch') {
                jolt(drawn, progress);
            }

            requestAnimationFrame(step);
        }
    };

    clock.play();
    requestAnimationFrame(step);
    void clock.finished.then(trip.end, () => undefined);
}

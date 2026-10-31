/**
 * `ui-dialog`: what the entrance, the exit and the backdrop can do.
 *
 * **The entrance and the exit take the card's entrance**, each with a direction and a curve
 * beside it as kinds of their own: `--ui-motion-exit: slide` beside
 * `--ui-motion-exit-direction: left` slides the dialog out to the left. An exit's direction is
 * the way it leaves, so a dialog that came in from the left can go on to the right. An exit is
 * its entrance run the other way, under a name that says so where the entrance's would not: a
 * rise sinks, a refocus defocuses, and what converged scatters.
 *
 * **Every effect takes one step**, whatever it changes, where the card's each take a step by what
 * they change; the scrim, the pieces and the grain take it too. A dialog is opened to be used and
 * closed to get back to the page, so a reader waits on its motion both ways.
 *
 * The component closes once every animation on its `<dialog>` has finished, so an exit effect is
 * waited out by the code that is already there. Both moments are drawn on that `<dialog>`, inside
 * the shadow root, which every scope reaches: the limit S8 found on the card's host is not here.
 */
import { UiDialog } from '../../../../src/dialog.js';
import { reference } from '../../../../src/reference.js';
import {
    attributes,
    chosen,
    curve,
    dissolve,
    duration,
    inner,
    pieces,
    prototype,
    queries,
    restore,
    travel,
    type Effect,
    type Firing,
    type Order,
} from '../motion.js';

/** The query each effect is drawn under: the consumer's choice, else the theme's taste. */
const is = queries('dialog');

/** The step every effect here takes: 200ms, between two of the reference's. */
const step = '--ui-duration-150';

/** One depth of the rain: how big a character is, how strongly it is drawn, and its tile. */
interface Depth {
    readonly size: number;
    readonly strength: number;
    readonly width: number;
    readonly height: number;
    /** How far it falls in a round of the loop, in pixels: a tile for the nearest, three in four
     *  of one for the middle, one in two behind. */
    readonly pace: number;
}

/**
 * The rain's depths, nearest first. Each tile has a size of its own, so the three do not repeat
 * together: with one size for all, the repeat lined up across them and showed.
 */
const [near, middle, far]: readonly [Depth, Depth, Depth] = [
    { size: 18, strength: 1, width: 640, height: 600, pace: 600 },
    { size: 13, strength: 0.7, width: 520, height: 520, pace: 390 },
    { size: 9, strength: 0.45, width: 400, height: 440, pace: 220 },
];

/** A point on a curve, across and up. */
type Point = readonly [number, number];

/** The rain's curve, from its start to where it rests. */
const settling: readonly [Point, Point, Point, Point] = [
    [0, 0],
    [0.33, 0.33],
    [0.5, 1],
    [1, 1],
];

/**
 * A column's fall of `tiles` periods, as keyframes on the rain's curve: cut where each period has
 * gone by, every part on its own piece of the curve, so the parts make the one fall. A column comes
 * down a period and is put back a period up at once, where its code is the same, so it is not seen
 * to jump.
 */
function falling(tiles: number): string {
    const along = (a: Point, b: Point, t: number): Point => [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
    ];
    // The curve's polar form: where de Casteljau's three steps go, taken at three parameters. A
    // piece of the curve has the pieces' own control points at its two ends' parameters.
    const polar = (u: number, v: number, w: number): Point => {
        const [p0, p1, p2, p3] = settling;
        const [a, b, c] = [along(p0, p1, u), along(p1, p2, u), along(p2, p3, u)];

        return along(along(a, b, v), along(b, c, v), w);
    };
    // Where along the curve a share of the fall has gone by.
    const at = (share: number): number => {
        let [low, high] = [0, 1];

        for (let step = 0; step < 40; step += 1) {
            const middle = (low + high) / 2;
            [low, high] = polar(middle, middle, middle)[1] < share ? [middle, high] : [low, middle];
        }

        return (low + high) / 2;
    };
    const cuts = Array.from({ length: tiles + 1 }, (_, index) =>
        index === 0 ? 0 : index === tiles ? 1 : at(index / tiles),
    );
    const percent = (time: number): string => `${(time * 100).toFixed(2)}%`;
    const frames = cuts.slice(0, -1).map((from, index) => {
        const to = cuts[index + 1] ?? 1;
        const [start, first, second, end] = [
            polar(from, from, from),
            polar(from, from, to),
            polar(from, to, to),
            polar(to, to, to),
        ];
        const across = (point: Point): string =>
            ((point[0] - start[0]) / (end[0] - start[0])).toFixed(3);
        const up = (point: Point): string =>
            ((point[1] - start[1]) / (end[1] - start[1])).toFixed(3);
        const shape = `cubic-bezier(${across(first)}, ${up(first)}, ${across(second)}, ${up(second)})`;
        const back = index === 0 ? '0%' : percent(start[0] + 0.0001);
        const down =
            index === tiles - 1
                ? ''
                : `
    ${percent(end[0])} {
        translate: 0 0;
        animation-timing-function: step-start;
    }`;

        return `
    ${back} {
        translate: 0 -100%;
        animation-timing-function: ${shape};
    }${down}`;
    });

    return `@keyframes ui-fall-${String(tiles)} {${frames.join('')}
    100% {
        translate: 0 0;
    }
}`;
}

/**
 * A copy of a dialog's panel, for a piece to show its cell of: the `<dialog>` the component
 * renders, laid out in place rather than lifted, under the component's own sheet, over copies of
 * what the host was given. Not a copy of the host: a `ui-dialog` copied while open opens itself,
 * and holds the page still as it does.
 */
const panel = (host: HTMLElement, dialog: HTMLElement) => (): HTMLElement => {
    const copy = document.createElement('div');
    // A box of its own, which the piece cuts and fades: the component's sheet gives its host
    // none, for the top layer's sake.
    copy.style.display = 'block';
    const root = copy.attachShadow({ mode: 'open' });
    const own = UiDialog.styles.styleSheet;
    root.adoptedStyleSheets = own === undefined ? [] : [own];

    const shown = dialog.cloneNode() as HTMLElement;
    shown.removeAttribute('class');
    // The panel's own content and not the columns' layer, which is the dialog's child and no part
    // of its panel: copied with the rest, it went into each of the thirty-six pieces, and opening
    // took 316ms of script where it takes 44 without it — measured.
    shown.append(
        ...[...dialog.childNodes]
            .filter((child) => !(child instanceof HTMLElement && 'rain' in child.dataset))
            .map((child) => child.cloneNode(true)),
    );
    // The copy's whole box, with nothing to come in from: the component's fade would.
    shown.style.cssText =
        'position: absolute; inset: 0; width: auto; height: auto; max-inline-size: none; max-block-size: none; margin: 0; transition: none; backdrop-filter: none;';
    // The panel's glass on the copy itself, which is what fades: an ancestor whose opacity moves
    // is a backdrop root, which the glass cannot see past — as the pieces say of their cells.
    const glass = getComputedStyle(dialog);
    copy.style.backdropFilter = glass.backdropFilter;
    copy.style.borderRadius = glass.borderRadius;
    root.append(shown);
    copy.append(...[...host.children].map((child) => child.cloneNode(true)));

    return copy;
};

/** The panel put together from pieces of itself as the dialog opens, over it in the top layer. */
const assemble =
    (order: Order) =>
    ({ host }: Firing): void => {
        const dialog = inner(host, 'dialog');

        if (dialog === null) {
            return;
        }

        const way = travel(host, 'enter') ?? [1, 0];

        pieces({
            host,
            surface: dialog,
            copy: panel(host, dialog),
            order,
            // The disintegration this runs backwards blew the other way.
            wind: [-way[0], -way[1]],
            together: true,
            easing: curve(host, 'enter'),
            length: duration(host, step),
        });
    };

/** What the reader last acted on: the control the focus was on as a key went down, or what the
 *  pointer pressed, since a button a click does not focus, as WebKit's is not, is still where the
 *  reader was. */
let acted: Element | undefined;

document.addEventListener(
    'pointerdown',
    (event) => {
        const target = event.composedPath()[0];
        acted = target instanceof Element ? target : undefined;
    },
    { capture: true },
);
document.addEventListener(
    'keydown',
    () => {
        let at = document.activeElement;

        while (at?.shadowRoot?.activeElement) {
            at = at.shadowRoot.activeElement;
        }

        acted = at ?? undefined;
    },
    { capture: true },
);

/** What a reader opens a dialog from: the control round the label or the icon they pressed. */
const controls =
    'button, a[href], input, select, textarea, summary, [role="button"], [role="menuitem"]';

/** What each dialog was opened from, as its opening found it, kept for its exit: the focus goes
 *  back there as the dialog closes. */
const openers = new WeakMap<HTMLElement, Element>();

/**
 * What the reader opened a dialog from, as it opens: what they last acted on, taken up the tree
 * it is drawn in to the control it is part of — the button round the icon the pointer pressed.
 * Nothing where that is inside the dialog, gone or not drawn, or where no gesture is behind the
 * opening, as none is behind a script's call. Read once, so an opening after it finds nothing.
 */
function openedFrom(host: HTMLElement): Element | undefined {
    const from = acted;
    acted = undefined;

    let within = false;

    for (
        let at: Node | null = from ?? null;
        at !== null;
        at = at instanceof ShadowRoot ? at.host : at.parentNode
    ) {
        within ||= at === host;
    }

    if (
        from === undefined ||
        within ||
        !from.isConnected ||
        from.getClientRects().length === 0 ||
        !navigator.userActivation.isActive
    ) {
        return undefined;
    }

    for (let at: Element | null = from; at !== null;) {
        if (at.matches(controls)) {
            return at;
        }

        const root = at.getRootNode();
        at = at.assignedSlot ?? at.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
    }

    return from;
}

/**
 * The glide's flight: from the control the dialog was opened from, at its size and in its place,
 * to the panel's own, and as the dialog closes back into that control, which the focus goes back
 * to. The panel is scaled as one, so its text keeps its shape — as far as it takes to cover the
 * control, then cut to the control's box and corners across the side it covers past it. Measured
 * with nothing written, which the keyframes read as the panel where it rests. From, and back to, a
 * little smaller in its own place, as the zoom is, where it was opened from nothing, or where that
 * control is gone or no longer drawn by the time it closes.
 */
const glide = ({ host }: Firing): void => {
    const dialog = inner(host, 'dialog');

    if (dialog === null) {
        return;
    }

    for (const name of ['--ui-glide-at', '--ui-glide-scale', '--ui-glide-cut']) {
        dialog.style.removeProperty(name);
    }

    const from = openers.get(host);

    if (from === undefined || !from.isConnected || from.getClientRects().length === 0) {
        dialog.style.setProperty('--ui-glide-scale', '0.96');

        return;
    }

    const box = dialog.getBoundingClientRect();
    const control = from.getBoundingClientRect();
    const scale = Math.max(control.width / box.width, control.height / box.height);
    const x = control.x + control.width / 2 - (box.x + box.width / 2);
    const y = control.y + control.height / 2 - (box.y + box.height / 2);
    const across = (box.width - control.width / scale) / 2;
    const down = (box.height - control.height / scale) / 2;
    const radius = getComputedStyle(
        from.shadowRoot?.querySelector(controls) ?? from,
    ).borderTopLeftRadius;
    const corner =
        (radius.endsWith('%')
            ? (Number.parseFloat(radius) / 100) * Math.min(control.width, control.height)
            : Number.parseFloat(radius)) / scale;
    const round = (Number.isFinite(corner) ? corner : 0).toFixed(1);
    dialog.style.setProperty('--ui-glide-at', `${x.toFixed(1)}px ${y.toFixed(1)}px`);
    dialog.style.setProperty('--ui-glide-scale', scale.toFixed(4));
    dialog.style.setProperty(
        '--ui-glide-cut',
        `inset(${down.toFixed(1)}px ${across.toFixed(1)}px round ${round}px)`,
    );
};

/**
 * The reveal's circle: where it grows from, the middle of what the reader opened the dialog from,
 * in the dialog's own box, and how far, 3rem past the corner farthest from there, as the circle's
 * reaches past the farthest from the middle. From the middle where it was opened from nothing the
 * reader acted on, as a script's call is, or from inside the dialog.
 */
const reveal = ({ host }: Firing): void => {
    const dialog = inner(host, 'dialog');
    const from = openers.get(host);

    if (dialog === null) {
        return;
    }

    dialog.style.removeProperty('--ui-reveal-at');
    dialog.style.removeProperty('--ui-reveal-to');

    if (from === undefined) {
        return;
    }

    const box = dialog.getBoundingClientRect();
    const opener = from.getBoundingClientRect();
    const x = opener.x + opener.width / 2 - box.x;
    const y = opener.y + opener.height / 2 - box.y;
    const far = Math.max(
        ...[
            [0, 0],
            [box.width, 0],
            [0, box.height],
            [box.width, box.height],
        ].map(([cx = 0, cy = 0]) => Math.hypot(cx - x, cy - y)),
    );
    const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
    dialog.style.setProperty('--ui-reveal-at', `${x.toFixed(1)}px ${y.toFixed(1)}px`);
    dialog.style.setProperty('--ui-reveal-to', `${(far + 3 * rem).toFixed(1)}px`);
};

/**
 * The panel broken into pieces as the dialog closes: the reference's disintegration, forward.
 * The pieces are beside the dialog rather than in it, and the dialog closes as the last goes.
 */
const disintegrate =
    (order: Order) =>
    ({ host }: Firing): void => {
        const dialog = inner(host, 'dialog');

        if (dialog === null) {
            return;
        }

        pieces({
            host,
            surface: dialog,
            copy: panel(host, dialog),
            order,
            wind: travel(host, 'exit') ?? [1, 0],
            together: false,
            easing: curve(host, 'exit'),
            length: duration(host, step),
        });
    };

/**
 * The panel brought out of grain as the dialog opens, or dissolved into it as the dialog closes:
 * the card's dissolve, on the `<dialog>` itself. No copy, so it stays where it is, in the top
 * layer, until the grain is gone.
 */
const grain =
    (together: boolean) =>
    ({ host }: Firing): void => {
        const dialog = inner(host, 'dialog');

        if (dialog === null) {
            return;
        }

        dissolve({
            host,
            surface: dialog,
            together,
            easing: curve(host, together ? 'enter' : 'exit'),
            length: duration(host, step),
        });
    };

const sheet = String.raw`
/* ——— The entrance and the exit.

   Animations, as the card's entrance is: each brings its own curve, on the one step, and leaves
   nothing behind when it is done — a reveal's clip goes with it. The component's fade is a
   transition, which would run beside an animation and win, a transition outranking an animation
   in the cascade, so each effect turns it off for its moment.

   An exit starts from a panel that is there and holds its last frame until the component closes
   the dialog: the component's own exit is a fade to nothing, which every effect here draws in
   its place.

   The direction and the curve are values the keyframes read, as on the card. Each effect sets
   its own direction; a chosen one comes later in the sheet, and wins. ——— */
@container ${is('enter', 'none')} {
    dialog[open]:not(.closing) {
        transition: none;
    }
}

@container ${is('enter', 'rise')} {
    dialog {
        --ui-enter-x: 0;
        --ui-enter-y: -1;
    }

    dialog[open]:not(.closing) {
        transition: none;
        animation: ui-enter-rise var(${step})
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

@container ${is('enter', 'zoom')} {
    dialog[open]:not(.closing) {
        transition: none;
        animation: ui-enter-zoom var(${step})
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

/* drop: its bounce is its curve, which a chosen one does not replace. */
@container ${is('enter', 'drop')} {
    dialog[open]:not(.closing) {
        transition: none;
        animation: ui-drop var(${step}) linear;
    }
}

@container ${is('enter', 'slide')} {
    dialog {
        --ui-enter-x: 1;
        --ui-enter-y: 0;
    }

    dialog[open]:not(.closing) {
        transition: none;
        animation: ui-enter-slide var(${step})
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

@container ${is('enter', 'flip-vertical')} {
    dialog[open]:not(.closing) {
        transition: none;
        animation: ui-enter-flip-vertical var(${step})
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

@container ${is('enter', 'flip-horizontal')} {
    dialog[open]:not(.closing) {
        transition: none;
        animation: ui-enter-flip-horizontal var(${step})
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

@container ${is('enter', 'wipe')} {
    dialog {
        --ui-enter-x: 1;
        --ui-enter-y: 0;
    }

    dialog[open]:not(.closing) {
        transition: none;
        animation: ui-enter-wipe var(${step})
            var(--ui-enter-curve, var(--ui-easing-move)) backwards;
    }
}

@container ${is('enter', 'circle')} {
    dialog {
        --ui-enter-x: 0;
        --ui-enter-y: 0;
    }

    dialog[open]:not(.closing) {
        transition: none;
        animation: ui-enter-circle var(${step})
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

/* reveal: the circle's, grown from what the reader opened the dialog from, as the script works it
   out, or from its middle. */
@container ${is('enter', 'reveal')} {
    dialog[open]:not(.closing) {
        transition: none;
        animation: ui-enter-reveal var(${step})
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

/* glide: flown from what the reader opened the dialog from, as the script works it out, on the
   curve the ring's glide flies on. */
@container ${is('enter', 'glide')} {
    dialog[open]:not(.closing) {
        transition: none;
        animation: ui-enter-glide var(${step})
            var(--ui-enter-curve, var(--ui-easing-move)) backwards;
    }
}

@container ${is('enter', 'curtain')} {
    dialog {
        --ui-enter-x: 1;
        --ui-enter-y: 0;
    }

    dialog[open]:not(.closing) {
        transition: none;
        animation: ui-enter-curtain var(${step})
            var(--ui-enter-curve, var(--ui-easing-move)) backwards;
    }
}

@container ${is('enter', 'refocus')} {
    dialog[open]:not(.closing) {
        transition: none;
        animation: ui-enter-refocus var(${step})
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

/* wind, converge, materialize: the pieces are a script's, over the panel in the top layer. The
   panel is where it will be, transparent until they have landed, and there at once then. So is
   a dissolving one, under the grain a script moves. */
@container ${is('enter', 'wind')} or ${is('enter', 'converge')} or
    ${is('enter', 'materialize')} or ${is('enter', 'dissolve')} {
    dialog[open]:not(.closing) {
        transition: none;
    }
}

@container ${is('exit', 'none')} {
    dialog.closing {
        transition: none;
    }
}

@container ${is('exit', 'sink')} {
    dialog {
        --ui-exit-x: 0;
        --ui-exit-y: 1;
    }

    dialog.closing {
        --ui-exit-length: var(${step});
        opacity: 1;
        transition: none;
        animation: ui-exit-sink var(--ui-exit-length)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'zoom')} {
    dialog.closing {
        --ui-exit-length: var(${step});
        opacity: 1;
        transition: none;
        animation: ui-exit-zoom var(--ui-exit-length)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'slide')} {
    dialog {
        --ui-exit-x: 1;
        --ui-exit-y: 0;
    }

    dialog.closing {
        --ui-exit-length: var(${step});
        opacity: 1;
        transition: none;
        animation: ui-exit-slide var(--ui-exit-length)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'flip-vertical')} {
    dialog.closing {
        --ui-exit-length: var(${step});
        opacity: 1;
        transition: none;
        animation: ui-exit-flip-vertical var(--ui-exit-length)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'flip-horizontal')} {
    dialog.closing {
        --ui-exit-length: var(${step});
        opacity: 1;
        transition: none;
        animation: ui-exit-flip-horizontal var(--ui-exit-length)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'wipe')} {
    dialog {
        --ui-exit-x: 1;
        --ui-exit-y: 0;
    }

    dialog.closing {
        --ui-exit-length: var(${step});
        opacity: 1;
        transition: none;
        animation: ui-exit-wipe var(--ui-exit-length)
            var(--ui-exit-curve, var(--ui-easing-move)) forwards;
    }
}

@container ${is('exit', 'circle')} {
    dialog {
        --ui-exit-x: 0;
        --ui-exit-y: 0;
    }

    dialog.closing {
        --ui-exit-length: var(${step});
        opacity: 1;
        transition: none;
        animation: ui-exit-circle var(--ui-exit-length)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'glide')} {
    dialog.closing {
        --ui-exit-length: var(${step});
        opacity: 1;
        transition: none;
        animation: ui-exit-glide var(--ui-exit-length)
            var(--ui-exit-curve, var(--ui-easing-move)) forwards;
    }
}

@container ${is('exit', 'curtain')} {
    dialog {
        --ui-exit-x: 1;
        --ui-exit-y: 0;
    }

    dialog.closing {
        --ui-exit-length: var(${step});
        opacity: 1;
        transition: none;
        animation: ui-exit-curtain var(--ui-exit-length)
            var(--ui-exit-curve, var(--ui-easing-move)) forwards;
    }
}

@container ${is('exit', 'defocus')} {
    dialog.closing {
        --ui-exit-length: var(${step});
        opacity: 1;
        transition: none;
        animation: ui-exit-defocus var(--ui-exit-length)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

/* wind, scatter, erode: the pieces are a script's, and the panel goes at once under them. What
   the component waits on here holds the dialog open while they fly, and its scrim fades with
   them. */
@container ${is('exit', 'wind')} or ${is('exit', 'scatter')} or
    ${is('exit', 'erode')} {
    dialog.closing {
        --ui-exit-length: var(${step});
        transition: none;
        animation: ui-held var(--ui-exit-length) linear;
    }
}

/* dissolve: the grain is drawn on the panel itself, so the dialog stays open until it has gone,
   for as long as the script's dissolve runs. The scrim goes on the grain's curve, which is
   linear unless one is chosen. */
@container ${is('exit', 'dissolve')} {
    dialog.closing {
        --ui-exit-length: var(${step});
        opacity: 1;
        transition: none;
        animation: ui-kept var(--ui-exit-length) linear;
    }

    dialog.closing::backdrop {
        transition-timing-function: var(--ui-exit-curve, linear);
    }
}

/* The scrim leaves with the panel, over the length of the exit the panel takes, so neither is
   left on the page without the other. An exit with no length of its own, today's fade or none,
   leaves it the state's step, as today. */
dialog.closing::backdrop {
    transition-duration: var(--ui-exit-length, ${reference('--ui-duration-state')});
}

/* A direction chosen, for either moment: the way the effect travels. */
@container ${is('enter-direction', 'up')} {
    dialog {
        --ui-enter-x: 0;
        --ui-enter-y: -1;
    }
}

@container ${is('enter-direction', 'down')} {
    dialog {
        --ui-enter-x: 0;
        --ui-enter-y: 1;
    }
}

@container ${is('enter-direction', 'left')} {
    dialog {
        --ui-enter-x: -1;
        --ui-enter-y: 0;
    }
}

@container ${is('enter-direction', 'right')} {
    dialog {
        --ui-enter-x: 1;
        --ui-enter-y: 0;
    }
}

@container ${is('exit-direction', 'up')} {
    dialog {
        --ui-exit-x: 0;
        --ui-exit-y: -1;
    }
}

@container ${is('exit-direction', 'down')} {
    dialog {
        --ui-exit-x: 0;
        --ui-exit-y: 1;
    }
}

@container ${is('exit-direction', 'left')} {
    dialog {
        --ui-exit-x: -1;
        --ui-exit-y: 0;
    }
}

@container ${is('exit-direction', 'right')} {
    dialog {
        --ui-exit-x: 1;
        --ui-exit-y: 0;
    }
}

/* A curve chosen, for either moment. Today's fade takes it too. */
@container ${is('enter-curve', 'linear')} {
    dialog {
        --ui-enter-curve: linear;
    }

    dialog[open]:not(.closing) {
        transition-timing-function: linear;
    }
}

@container ${is('enter-curve', 'ease-in-out')} {
    dialog {
        --ui-enter-curve: ease-in-out;
    }

    dialog[open]:not(.closing) {
        transition-timing-function: ease-in-out;
    }
}

@container ${is('exit-curve', 'linear')} {
    dialog {
        --ui-exit-curve: linear;
    }

    dialog.closing {
        transition-timing-function: linear;
    }
}

@container ${is('exit-curve', 'ease-in-out')} {
    dialog {
        --ui-exit-curve: ease-in-out;
    }

    dialog.closing {
        transition-timing-function: ease-in-out;
    }
}

/* backdrop */
@container ${is('backdrop', 'none')} {
    dialog::backdrop {
        transition: none;
    }
}

@container ${is('backdrop', 'blur')} {
    dialog::backdrop {
        backdrop-filter: blur(4px);
        transition:
            opacity var(${step}) var(--ui-easing-enter),
            backdrop-filter var(${step}) var(--ui-easing-enter);
    }

    @starting-style {
        dialog[open]::backdrop {
            backdrop-filter: blur(0);
        }
    }

    dialog.closing::backdrop {
        backdrop-filter: blur(0);
    }
}

/* blur, under a theme that raises its surfaces as glass: the blur alone, with no scrim colour
   over it, which would tint the page the glass is there to let through. The theme's name does
   not reach a shadow root; its glass does, as the backdrop filter of a raised surface, read
   through the token's fallback. Where the reader asks for less transparency or more contrast,
   the glass stands down by leaving the token with no value at all, and a query on the token
   itself took that for glass and left the page with no scrim, measured. */
:host {
    --ui-glass: var(--ui-backdrop-raised, none);
}

@container ${is('backdrop', 'blur')} and (not style(--ui-glass: none)) {
    dialog::backdrop {
        background: transparent;
    }
}

/* frost: the reference's frosted glass over the whole page, a long blur and more colour, with
   no scrim over it in any theme. It grows in as the blur does. */
@container ${is('backdrop', 'frost')} {
    dialog::backdrop {
        background: transparent;
        backdrop-filter: blur(12px) saturate(1.7);
        transition:
            opacity var(${step}) var(--ui-easing-enter),
            backdrop-filter var(${step}) var(--ui-easing-enter);
    }

    @starting-style {
        dialog[open]::backdrop {
            backdrop-filter: blur(0) saturate(1);
        }
    }

    dialog.closing::backdrop {
        backdrop-filter: blur(0) saturate(1);
    }
}

/* refract: the reference's lens, which pushes the page about by noise rather than blurring it,
   so an edge behind it bends. A filter's reference is looked up in the dialog's own tree, so
   the lens is rendered into the shadow root. It comes in with the scrim, which keeps its colour
   under glass too: Firefox draws nothing for a backdrop filter that names an SVG filter, a
   blur beside it included, and CSS.supports says it does, so the colour is what Firefox shows. */
@container ${is('backdrop', 'refract')} {
    dialog::backdrop {
        backdrop-filter: url(#ui-lens);
        transition: opacity var(${step}) var(--ui-easing-enter);
    }
}

/* The patterns, drawn over the scrim in the theme's accent, so each takes on the theme it is
   under. Each slides 2.5rem into place as the scrim comes in and on as it goes: a pattern that
   repeats ends where it would have been, and nothing moves once it is there. */
dialog {
    --ui-pattern: rgb(from var(--ui-color-accent) r g b / 0.3);
}

@container ${is('backdrop', 'stripes')} {
    dialog::backdrop {
        background:
            linear-gradient(
                    45deg,
                    var(--ui-pattern) 25%,
                    transparent 25% 50%,
                    var(--ui-pattern) 50% 75%,
                    transparent 75%
                )
                0 0 / 2.5rem 2.5rem,
            ${reference('--ui-color-scrim')};
        transition:
            opacity var(${step}) var(--ui-easing-enter),
            background-position var(${step}) var(--ui-easing-enter);
    }

    @starting-style {
        dialog[open]::backdrop {
            background-position:
                -2.5rem 0,
                0 0;
        }
    }

    dialog.closing::backdrop {
        background-position:
            2.5rem 0,
            0 0;
    }
}

/* grid: squared paper, its lines stronger than a stripe, being a pixel wide. */
@container ${is('backdrop', 'grid')} {
    dialog::backdrop {
        background:
            linear-gradient(to right, rgb(from var(--ui-color-accent) r g b / 0.5) 1px, transparent 1px)
                0 0 / 2.5rem 2.5rem,
            linear-gradient(to bottom, rgb(from var(--ui-color-accent) r g b / 0.5) 1px, transparent 1px)
                0 0 / 2.5rem 2.5rem,
            ${reference('--ui-color-scrim')};
        transition:
            opacity var(${step}) var(--ui-easing-enter),
            background-position var(${step}) var(--ui-easing-enter);
    }

    @starting-style {
        dialog[open]::backdrop {
            background-position:
                -2.5rem -2.5rem,
                -2.5rem -2.5rem,
                0 0;
        }
    }

    dialog.closing::backdrop {
        background-position:
            2.5rem 2.5rem,
            2.5rem 2.5rem,
            0 0;
    }
}

@container ${is('backdrop', 'checker')} {
    dialog::backdrop {
        background:
            repeating-conic-gradient(var(--ui-pattern) 0 25%, transparent 0 50%) 0 0 / 5rem 5rem,
            ${reference('--ui-color-scrim')};
        transition:
            opacity var(${step}) var(--ui-easing-enter),
            background-position var(${step}) var(--ui-easing-enter);
    }

    @starting-style {
        dialog[open]::backdrop {
            background-position:
                -2.5rem -2.5rem,
                0 0;
        }
    }

    dialog.closing::backdrop {
        background-position:
            2.5rem 2.5rem,
            0 0;
    }
}

/* char-rain: the reference's falling code, at three depths over the scrim, each a tile the page
   draws in the colour the theme's accent resolves to. It falls as a loop that settles runs,
   slowing to rest within the five seconds WCAG 2.2.2 lets motion run unstoppable, and stays a
   still wall of code for as long as the dialog is open. Forced colours keep a picture where
   they take a gradient away, so the rain stands down there itself. */
@container ${is('backdrop', 'char-rain')} {
    dialog::backdrop {
        background:
            var(--ui-rain, none),
            ${reference('--ui-color-scrim')};
        transition: opacity var(${step}) var(--ui-easing-enter);
        animation: ui-rain calc(var(--ui-duration-loop) * var(--ui-iteration-settle))
            cubic-bezier(0.33, 0.33, 0.5, 1);
    }

    @media (forced-colors: active) {
        dialog::backdrop {
            background-image: none;
            animation: none;
        }
    }
}

/* char-columns: the falling code as the reference's loading columns draw theirs, characters set
   in type, in a column each moved by a transform, the colour the accent's own. The backdrop
   cannot hold them, having no children, so a layer of the dialog's own does: shown as the dialog
   is about to open, it goes into the top layer before the dialog, under it and under its
   backdrop, and none of what the dialog's entrance and exit do to the dialog reaches it there.
   The scrim comes down to it, under the columns, and the backdrop above them is left clear. The
   layer comes in as the scrim would and goes with the panel, on the exit's length, which it
   inherits from the dialog. Each column falls a distance of its own, slowing to rest within the
   five seconds WCAG 2.2.2 allows, and the columns stand down under forced colours, as the rain
   does. They are more to draw while they fall than the rain, in software and on a GPU alike, and a
   dialog closed meanwhile waits longer for them: #292 holds what was measured. */
[data-rain] {
    display: none;
    position: fixed;
    inset: 0;
    width: auto;
    height: auto;
    margin: 0;
    padding: 0;
    border: 0;
    overflow: hidden;
    contain: strict;
    background: ${reference('--ui-color-scrim')};
    color: var(--ui-color-accent);
    font-family: 'Courier New', Courier, ui-monospace, monospace;
    font-weight: bold;
    line-height: 1.3;
    pointer-events: none;
    user-select: none;
    opacity: 1;
    transition: opacity var(${step}) var(--ui-easing-enter);
}

dialog.closing > [data-rain] {
    opacity: 0;
    transition-duration: var(--ui-exit-length, ${reference('--ui-duration-state')});
    transition-timing-function: var(--ui-easing-exit);
}

@container ${is('exit', 'dissolve')} {
    dialog.closing > [data-rain] {
        transition-timing-function: var(--ui-exit-curve, linear);
    }
}

@container ${is('backdrop', 'char-columns')} {
    dialog::backdrop {
        background: transparent;
    }

    [data-rain]:popover-open {
        display: block;
    }

    @starting-style {
        [data-rain]:popover-open {
            opacity: 0;
        }
    }
}

/* The columns, a frame behind the layer, fading in over the step. */
[data-rain] > div {
    display: none;
    opacity: 1;
    transition: opacity var(${step}) var(--ui-easing-enter);
}

[data-rain][data-falling] > div {
    display: block;
}

/* Under forced colours the columns stand down, as the rain does: the scrim alone. */
@media (forced-colors: active) {
    [data-rain][data-falling] > div {
        display: none;
    }
}

@starting-style {
    [data-rain][data-falling] > div {
        opacity: 0;
    }
}

/* A column, a period of its code tall, which it falls as many times as its depth's fall says. */
[data-rain] > div > div {
    position: absolute;
    top: 0;
    animation: var(--ui-fall) calc(var(--ui-duration-loop) * var(--ui-iteration-settle)) linear;
}

/* A trail, a character to a line, lit at its head and fading in four steps toward its tail. */
[data-rain] span {
    position: absolute;
    inset-inline: 0;
    white-space: pre;
    text-align: center;
}

[data-rain] span[data-mirrored] {
    scale: -1 1;
}

[data-rain] i {
    font-style: normal;
    text-shadow: 0 0 0.6em currentColor;
}

[data-rain] i:nth-of-type(1) {
    color: rgb(from var(--ui-color-accent) r g b / 0.18);
}

[data-rain] i:nth-of-type(2) {
    color: rgb(from var(--ui-color-accent) r g b / 0.38);
}

[data-rain] i:nth-of-type(3) {
    color: rgb(from var(--ui-color-accent) r g b / 0.58);
}

[data-rain] i:nth-of-type(4) {
    color: rgb(from var(--ui-color-accent) r g b / 0.78);
}

[data-rain] b {
    color: color-mix(in srgb, white 65%, var(--ui-color-accent));
    text-shadow: 0 0 0.6em var(--ui-color-accent);
}

/* A step below, as the entrance has always risen. */
@keyframes ui-enter-rise {
    from {
        opacity: 0;
        translate: calc(var(--ui-enter-x) * -1rem) calc(var(--ui-enter-y) * -1rem);
    }
}

@keyframes ui-enter-zoom {
    from {
        opacity: 0;
        scale: 0.96;
    }
}

@keyframes ui-drop {
    0% {
        opacity: 0;
        translate: 0 -4rem;
        animation-timing-function: ease-in;
    }
    45% {
        opacity: 1;
        translate: 0 0;
        animation-timing-function: ease-out;
    }
    70% {
        translate: 0 -0.75rem;
        animation-timing-function: ease-in;
    }
    88% {
        translate: 0 0;
        animation-timing-function: ease-out;
    }
    95% {
        translate: 0 -0.2rem;
        animation-timing-function: ease-in;
    }
    100% {
        translate: 0 0;
    }
}

/* Its own size behind, and whole by two fifths of the way. */
@keyframes ui-enter-slide {
    from {
        opacity: 0;
        translate: calc(var(--ui-enter-x) * -100%) calc(var(--ui-enter-y) * -100%);
    }
    40% {
        opacity: 1;
    }
}

/* Edge-on, at 90°, turning until it faces the reader. */
@keyframes ui-enter-flip-vertical {
    from {
        transform: perspective(60rem) rotateX(90deg);
    }
}

@keyframes ui-enter-flip-horizontal {
    from {
        transform: perspective(60rem) rotateY(90deg);
    }
}

/* The reveals end 3rem past the panel, so the focus ring round it is uncovered with it rather
   than all at once when the clip goes. The wipe's edge sweeps the way it travels. */
@keyframes ui-enter-wipe {
    from {
        clip-path: inset(
            calc(max(0, -1 * var(--ui-enter-y)) * 100%)
            calc(max(0, var(--ui-enter-x)) * 100%)
            calc(max(0, var(--ui-enter-y)) * 100%)
            calc(max(0, -1 * var(--ui-enter-x)) * 100%)
        );
    }
    to {
        clip-path: inset(-3rem);
    }
}

/* From the middle, or from the edge it travels away from, out to 3rem past the farthest corner
   and no further: the card's circle, whose sheet says why. */
@keyframes ui-enter-circle {
    from {
        clip-path: circle(
            0 at calc(50% - var(--ui-enter-x) * 50%) calc(50% - var(--ui-enter-y) * 50%)
        );
    }
    to {
        clip-path: circle(
            calc(
                (1 + max(var(--ui-enter-x), -1 * var(--ui-enter-x), var(--ui-enter-y),
                    -1 * var(--ui-enter-y))) * 70.71% + 3rem
            )
            at calc(50% - var(--ui-enter-x) * 50%) calc(50% - var(--ui-enter-y) * 50%)
        );
    }
}

/* The circle's, from where the script put it, and out as far: from the middle without one. */
@keyframes ui-enter-reveal {
    from {
        clip-path: circle(0 at var(--ui-reveal-at, 50% 50%));
    }
    to {
        clip-path: circle(var(--ui-reveal-to, calc(70.71% + 3rem)) at var(--ui-reveal-at, 50% 50%));
    }
}

/* From the control the script measured, at its size and in its place and cut to its shape, out to
   3rem past the panel as the reveals end, and there by a quarter of the way. With nothing written
   it starts where the panel rests, which is where the script measures it. */
@keyframes ui-enter-glide {
    from {
        opacity: 0;
        translate: var(--ui-glide-at, 0 0);
        scale: var(--ui-glide-scale, 1);
        clip-path: var(--ui-glide-cut, inset(-3rem));
    }
    25% {
        opacity: 1;
    }
    to {
        clip-path: inset(-3rem);
    }
}

/* From a line through the middle outward, across the axis it travels on. */
@keyframes ui-enter-curtain {
    from {
        clip-path: inset(
            calc(max(var(--ui-enter-y), -1 * var(--ui-enter-y)) * 50%)
            calc(max(var(--ui-enter-x), -1 * var(--ui-enter-x)) * 50%)
        );
    }
    to {
        clip-path: inset(-3rem);
    }
}

/* Out of focus by half a rem and sharpening, there by half the way: the card's refocus, whose
   sheet says why no deeper. */
@keyframes ui-enter-refocus {
    from {
        filter: blur(0.5rem);
        opacity: 0;
    }
    50% {
        opacity: 1;
    }
}

/* The exits, each its entrance run the other way: from a panel that is there to none. */
@keyframes ui-exit-sink {
    to {
        opacity: 0;
        translate: calc(var(--ui-exit-x) * 1rem) calc(var(--ui-exit-y) * 1rem);
    }
}

@keyframes ui-exit-zoom {
    to {
        opacity: 0;
        scale: 0.96;
    }
}

/* Whole for three fifths of the way, then gone with the last of it. */
@keyframes ui-exit-slide {
    60% {
        opacity: 1;
    }
    to {
        opacity: 0;
        translate: calc(var(--ui-exit-x) * 100%) calc(var(--ui-exit-y) * 100%);
    }
}

/* Turning on the way it came in, until it is edge-on. */
@keyframes ui-exit-flip-vertical {
    to {
        transform: perspective(60rem) rotateX(-90deg);
    }
}

@keyframes ui-exit-flip-horizontal {
    to {
        transform: perspective(60rem) rotateY(-90deg);
    }
}

/* The edge sweeps the way it travels, covering what it passes. */
@keyframes ui-exit-wipe {
    from {
        clip-path: inset(-3rem);
    }
    to {
        clip-path: inset(
            calc(max(0, var(--ui-exit-y)) * 100%)
            calc(max(0, -1 * var(--ui-exit-x)) * 100%)
            calc(max(0, -1 * var(--ui-exit-y)) * 100%)
            calc(max(0, var(--ui-exit-x)) * 100%)
        );
    }
}

/* Closing on the middle, or on the edge it travels to, from 3rem past the farthest corner. */
@keyframes ui-exit-circle {
    from {
        clip-path: circle(
            calc(
                (1 + max(var(--ui-exit-x), -1 * var(--ui-exit-x), var(--ui-exit-y),
                    -1 * var(--ui-exit-y))) * 70.71% + 3rem
            )
            at calc(50% + var(--ui-exit-x) * 50%) calc(50% + var(--ui-exit-y) * 50%)
        );
    }
    to {
        clip-path: circle(
            0 at calc(50% + var(--ui-exit-x) * 50%) calc(50% + var(--ui-exit-y) * 50%)
        );
    }
}

/* Back into the control the script measured, the entrance run the other way. */
@keyframes ui-exit-glide {
    from {
        clip-path: inset(-3rem);
    }
    75% {
        opacity: 1;
    }
    to {
        opacity: 0;
        translate: var(--ui-glide-at, 0 0);
        scale: var(--ui-glide-scale, 1);
        clip-path: var(--ui-glide-cut, inset(-3rem));
    }
}

/* Closing to a line through the middle, across the axis it travels on. */
@keyframes ui-exit-curtain {
    from {
        clip-path: inset(-3rem);
    }
    to {
        clip-path: inset(
            calc(max(var(--ui-exit-y), -1 * var(--ui-exit-y)) * 50%)
            calc(max(var(--ui-exit-x), -1 * var(--ui-exit-x)) * 50%)
        );
    }
}

/* Blurring away by as much as the entrance sharpens from, and gone over the second half. */
@keyframes ui-exit-defocus {
    50% {
        opacity: 1;
    }
    to {
        filter: blur(0.5rem);
        opacity: 0;
    }
}

/* Nothing to draw: the panel has gone already, and this only holds the dialog open. */
@keyframes ui-held {
    to {
        opacity: 0;
    }
}

/* Nothing to draw either, the panel kept as it is while a script draws on it. */
@keyframes ui-kept {
    to {
        opacity: 1;
    }
}

/* Each depth falls a whole number of its tiles and comes to rest where it started, the nearest
   fastest: a tile every round of the loop for it, three in four for the middle, one in two behind. */
@keyframes ui-rain {
    from {
        background-position:
            0 calc(var(--ui-iteration-settle) * -${String(near.pace)}px),
            0 calc(var(--ui-iteration-settle) * -${String(middle.pace)}px),
            0 calc(var(--ui-iteration-settle) * -${String(far.pace)}px),
            0 0;
    }
}

/* Each column falls a whole number of its periods, as a depth of the rain falls a whole number of
   its tiles: one to four, by how many rounds the loop takes to rest. */
${[1, 2, 3, 4].map(falling).join('\n\n')}
`;

/** The way a moment's effect travels, a kind of its own beside the effect. */
const direction = (moment: 'enter' | 'exit'): readonly Effect[] => [
    {
        name: 'none',
        today: true,
        says:
            moment === 'enter'
                ? 'Each effect’s own: up for a rise, right for a slide, a wipe and the wind, out from the middle for a circle, across for a curtain.'
                : 'Each effect’s own: down for a sink, right for a slide, a wipe and the wind, into the middle for a circle, across for a curtain.',
    },
    { name: 'up', says: moment === 'enter' ? 'Travels up, from below.' : 'Leaves upward.' },
    { name: 'down', says: moment === 'enter' ? 'Travels down, from above.' : 'Leaves downward.' },
    {
        name: 'left',
        says: moment === 'enter' ? 'Travels left, from the right.' : 'Leaves to the left.',
    },
    {
        name: 'right',
        says: moment === 'enter' ? 'Travels right, from the left.' : 'Leaves to the right.',
    },
];

/** The curve a moment's effect runs on, a kind of its own beside the effect. */
const curves: readonly Effect[] = [
    {
        name: 'none',
        today: true,
        says: 'Each effect’s own: quick and settling, or a reveal’s even sweep.',
    },
    { name: 'linear', says: 'At one speed from start to end.' },
    { name: 'ease-in-out', says: 'Gathers speed, then settles.' },
];

prototype({
    tags: ['ui-dialog'],
    sheet,
    moments: [
        {
            name: 'enter',
            label: 'Entrance',
            on: 'opening',
            kinds: [
                {
                    name: '',
                    label: 'Effect',
                    effects: [
                        { name: 'fade', today: true, says: 'Fades in, on the state’s step.' },
                        { name: 'none', says: 'There at once.' },
                        {
                            name: 'rise',
                            directed: true,
                            says: 'Fades in from a little way off, below it unless a direction says otherwise.',
                        },
                        { name: 'zoom', says: 'Fades in from a little smaller.' },
                        {
                            name: 'drop',
                            says: 'Falls in from above and bounces to rest, on a curve of its own.',
                        },
                        {
                            name: 'slide',
                            directed: true,
                            says: 'Slides in from its own size away, from the left unless a direction says otherwise.',
                        },
                        {
                            name: 'flip-vertical',
                            says: 'Turns in from edge-on, top over bottom, until it faces the reader.',
                        },
                        {
                            name: 'flip-horizontal',
                            says: 'Turns in from edge-on, side over side, until it faces the reader.',
                        },
                        {
                            name: 'wipe',
                            directed: true,
                            says: 'Uncovered by an edge sweeping across it, from the left unless a direction says otherwise.',
                        },
                        {
                            name: 'circle',
                            directed: true,
                            says: 'Uncovered by a circle growing from its middle, or from the edge a direction leaves.',
                        },
                        {
                            name: 'reveal',
                            says: 'Uncovered by a circle growing from what opened it: the control the focus was on, or the one the pointer pressed; from its middle when nothing was.',
                            fire: reveal,
                        },
                        {
                            name: 'glide',
                            says: 'Glides from what opened it, at that control’s size and in its place, to its own: the control the focus was on, or the one the pointer pressed; from a little smaller when nothing was.',
                            fire: glide,
                        },
                        {
                            name: 'curtain',
                            directed: true,
                            says: 'Uncovered from its middle outward, as a curtain opens: across it, or up and down for those directions.',
                        },
                        {
                            name: 'refocus',
                            says: 'Comes into focus: blurred and faint, then sharp.',
                        },
                        {
                            name: 'wind',
                            directed: true,
                            fire: assemble('wind'),
                            says: 'Put together from pieces of itself blown in on a wind, from the left unless a direction says otherwise.',
                        },
                        {
                            name: 'converge',
                            fire: assemble('middle'),
                            says: 'Put together from pieces flying in from all round, the outermost first.',
                        },
                        {
                            name: 'materialize',
                            fire: assemble('random'),
                            says: 'Put together from pieces appearing where they belong, at random.',
                        },
                        {
                            name: 'dissolve',
                            fire: grain(true),
                            says: 'Comes out of a fine grain, the whole panel at once, until no grain is missing.',
                        },
                    ],
                },
                { name: 'direction', label: 'Direction', effects: direction('enter') },
                { name: 'curve', label: 'Curve', effects: curves },
            ],
        },
        {
            name: 'exit',
            label: 'Exit',
            on: 'closing',
            kinds: [
                {
                    name: '',
                    label: 'Effect',
                    effects: [
                        { name: 'fade', today: true, says: 'Fades out, on the state’s step.' },
                        { name: 'none', says: 'Gone at once.' },
                        {
                            name: 'sink',
                            directed: true,
                            says: 'Fades out going a little way off, down unless a direction says otherwise.',
                        },
                        { name: 'zoom', says: 'Fades out, getting smaller.' },
                        {
                            name: 'slide',
                            directed: true,
                            says: 'Slides out its own size away, to the right unless a direction says otherwise.',
                        },
                        {
                            name: 'flip-vertical',
                            says: 'Turns away, top over bottom, until it is edge-on.',
                        },
                        {
                            name: 'flip-horizontal',
                            says: 'Turns away, side over side, until it is edge-on.',
                        },
                        {
                            name: 'wipe',
                            directed: true,
                            says: 'Covered by an edge sweeping across it, rightward unless a direction says otherwise.',
                        },
                        {
                            name: 'circle',
                            directed: true,
                            says: 'Covered as a circle closes on its middle, or on the edge a direction goes to.',
                        },
                        {
                            name: 'glide',
                            says: 'Glides back into what opened it, where the focus goes back to; getting a little smaller where that is gone.',
                            fire: glide,
                        },
                        {
                            name: 'curtain',
                            directed: true,
                            says: 'Covered from its edges inward, as a curtain closes: across it, or up and down for those directions.',
                        },
                        {
                            name: 'defocus',
                            says: 'Goes out of focus: sharp, then blurred and faint.',
                        },
                        {
                            name: 'wind',
                            directed: true,
                            fire: disintegrate('wind'),
                            says: 'Broken into pieces blown away on a wind, to the right unless a direction says otherwise; blown down, the top goes first.',
                        },
                        {
                            name: 'scatter',
                            fire: disintegrate('middle'),
                            says: 'Broken into pieces flying out from its middle, the innermost first.',
                        },
                        {
                            name: 'erode',
                            fire: disintegrate('random'),
                            says: 'Broken into pieces vanishing where they are, at random.',
                        },
                        {
                            name: 'dissolve',
                            fire: grain(false),
                            says: 'Dissolves into a fine grain, the whole panel at once, and closes when none is left.',
                        },
                    ],
                },
                { name: 'direction', label: 'Direction', effects: direction('exit') },
                { name: 'curve', label: 'Curve', effects: curves },
            ],
        },
        {
            name: 'backdrop',
            label: 'Backdrop',
            effects: [
                { name: 'fade', today: true, says: 'The scrim fades in and out.' },
                { name: 'none', says: 'The scrim is there at once.' },
                {
                    name: 'blur',
                    says: 'The page behind blurs as the scrim comes in; under glass, the blur alone.',
                },
                {
                    name: 'frost',
                    says: 'The page behind turns to frosted glass, blurred a long way and more colourful, with no scrim.',
                },
                {
                    name: 'refract',
                    says: 'The page behind bends as through rippled glass, under the scrim. Firefox draws the scrim alone.',
                },
                {
                    name: 'stripes',
                    says: 'Diagonal stripes in the theme’s accent over the scrim, sliding into place.',
                },
                {
                    name: 'grid',
                    says: 'Squared paper in the theme’s accent over the scrim, sliding into place.',
                },
                {
                    name: 'checker',
                    says: 'A checkerboard in the theme’s accent over the scrim, sliding into place.',
                },
                {
                    name: 'char-rain',
                    says: 'Falling code in the theme’s accent, at three depths over the scrim, slowing to rest within five seconds as a still wall of it.',
                },
                {
                    name: 'char-columns',
                    says: 'Falling code in the theme’s accent, at three depths over the scrim, each column at a speed of its own, slowing to rest within five seconds as a still wall of it.',
                },
            ],
        },
    ],
    refused: [
        {
            name: 'liquid',
            why: 'the page behind rippling, its lens moved for as long as the dialog is open. That can be minutes, and WCAG 2.2.2 lets motion run five seconds before a reader must be able to stop it, which here only closing the dialog would do.',
        },
        {
            name: 'shake',
            why: 'answering a dismissal the dialog refuses by shaking it. Every ui-dialog closes on Escape and on its actions, so there is no refusal to answer.',
        },
    ],
});

/*
 * The two moments, announced where the component would fire them itself, from #enter() and
 * #exit(): the page watches what those write on the <dialog> — the open attribute, and the class
 * the exit is carried by — and dispatches the moment from inside it. A watcher's callback runs
 * before the next frame, so the pieces are there in the first frame the panel would have been.
 * Whatever pieces are still flying from the last moment end first.
 */
/**
 * The lens a refracting backdrop draws through, the reference's own: noise read as a map of how
 * far to push each pixel of what is behind.
 */
const lens = (): SVGSVGElement => {
    const svg = 'http://www.w3.org/2000/svg';
    const holder = document.createElementNS(svg, 'svg');
    attributes(holder, {
        'aria-hidden': 'true',
        style: 'position: absolute; width: 0; height: 0;',
    });
    const filter = document.createElementNS(svg, 'filter');
    attributes(filter, { id: 'ui-lens', x: '-20%', y: '-20%', width: '140%', height: '140%' });
    const noise = document.createElementNS(svg, 'feTurbulence');
    attributes(noise, {
        type: 'fractalNoise',
        baseFrequency: '0.018 0.05',
        numOctaves: '2',
        seed: '9',
        result: 'noise',
    });
    const push = document.createElementNS(svg, 'feDisplacementMap');
    attributes(push, {
        in: 'SourceGraphic',
        in2: 'noise',
        scale: '24',
        xChannelSelector: 'R',
        yChannelSelector: 'G',
    });
    filter.append(noise, push);
    holder.append(filter);

    return holder;
};

/** The characters the reference's falling code is written in. */
const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * One depth of falling code, as a tile that repeats without a seam: columns of characters, each
 * trail lit at its head and fading towards its tail, wrapped round the tile's height, with a
 * character mirrored now and then, as the film's are. Drawn on a canvas, in the colour the
 * theme's accent resolves to, because a picture cannot read a token; and a canvas rather than an
 * SVG, so its glow is drawn once rather than on every frame the rain moves.
 *
 * Handed to the sheet by a blob URL rather than written into it: as data URLs, the three depths
 * came to 1.1MB or more in the property the backdrop reads them from, and opening the dialog took
 * 212 to 230ms in Chromium and 64 to 129ms in Firefox, on the page with every component, where
 * their blob URLs, under a kilobyte, took 28 to 57ms and 39 to 51ms — measured. The press that
 * opened it played on meanwhile, and the dialog came after it.
 */
function depth(colour: string, { size, strength, width: wide, height }: Depth): Promise<string> {
    const ratio = Math.min(devicePixelRatio, 2);
    // A row's height divides the tile's, so the tile repeats on a whole row.
    const line = height / Math.round(height / (size * 1.3));
    const rows = Math.round(height / line);
    const pitch = Math.round(size * 1.15);
    const columns = Math.round(wide / pitch);
    const width = columns * pitch;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const context = canvas.getContext('2d');

    if (context === null) {
        return Promise.resolve('none');
    }

    context.scale(ratio, ratio);
    context.font = `bold ${String(size)}px 'Courier New', Courier, ui-monospace, monospace`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.shadowColor = colour;
    context.shadowBlur = size * 0.6;
    const glow = size;

    /** Draws one character, and again across each edge its glow reaches past. */
    const stamp = (glyph: string, x: number, y: number, mirrored: boolean): void => {
        const across = [0, ...(x < glow ? [width] : []), ...(x > width - glow ? [-width] : [])];
        const down = [0, ...(y < glow ? [height] : []), ...(y > height - glow ? [-height] : [])];

        for (const dx of across) {
            for (const dy of down) {
                context.save();
                context.translate(x + dx, y + dy);
                context.scale(mirrored ? -1 : 1, 1);
                context.fillText(glyph, 0, 0);
                context.restore();
            }
        }
    };

    for (let column = 0; column < columns; column += 1) {
        // Up to two trails a column, so a tall tile is not sparse.
        for (let trail = 0; trail < 2; trail += 1) {
            if (Math.random() < 0.35) {
                continue;
            }

            const length = 6 + Math.floor(Math.random() * rows * 0.45);
            const head = Math.floor(Math.random() * rows);

            for (let behind = 0; behind < length; behind += 1) {
                const row = (head - behind + rows) % rows;
                const glyph = glyphs.charAt(Math.floor(Math.random() * glyphs.length));
                const mirrored = Math.random() < 0.3;
                const x = column * pitch + pitch / 2;
                const y = row * line + line / 2;
                context.fillStyle = colour;
                context.globalAlpha =
                    strength * (behind === 0 ? 1 : 0.08 + 0.8 * (1 - behind / length));
                stamp(glyph, x, y, mirrored);

                if (behind === 0) {
                    // The head, lit nearly white over its own colour.
                    context.fillStyle = 'white';
                    context.globalAlpha = strength * 0.65;
                    stamp(glyph, x, y, mirrored);
                }
            }
        }
    }

    return new Promise((resolve) => {
        canvas.toBlob((tile) => {
            resolve(
                tile === null
                    ? 'none'
                    : `url("${URL.createObjectURL(tile)}") 0 0 / ${String(width)}px ${String(height)}px`,
            );
        });
    });
}

/**
 * The falling code as columns of type, laid out for a viewport: for each depth, farthest first so
 * the nearest is drawn over it, a column every pitch across. A column is a period of its code
 * tall, a whole number of rows near its depth's tile, give or take two fifths, and falls as many
 * of its periods as the depth falls tiles, so the nearer falls faster, and one column faster than
 * the next. Its trails go round the period clear of one another, and repeat a period apart from a
 * period above it to the foot of the viewport, which is as far as its turning back could show. A
 * trail is the tile's: as long, as far apart, lit at its head, fading toward its tail in four
 * steps of a quarter of it each, and mirrored now and then, whole.
 */
function columns(holder: HTMLElement, width: number, height: number, settle: number): void {
    const glyph = (): string => glyphs.charAt(Math.floor(Math.random() * glyphs.length));
    const laid: HTMLElement[] = [];

    for (const { size, strength, height: tile, pace } of [far, middle, near]) {
        const line = size * 1.3;
        const pitch = Math.round(size * 1.15);
        // The tile's rows, which a trail's length and the gap after it are counted in.
        const rows = Math.round(tile / line);
        const tiles = Math.min(4, Math.max(1, Math.round((settle * pace) / tile)));

        for (let left = 0; left < width; left += pitch) {
            const cycle = Math.max(7, Math.round((tile * (0.6 + Math.random() * 0.8)) / line));
            const period = cycle * line;
            const column = document.createElement('div');
            column.style.cssText = `left: ${String(left)}px; width: ${String(pitch)}px; height: ${period.toFixed(2)}px; font-size: ${String(size)}px; opacity: ${String(strength)}; --ui-fall: ui-fall-${String(tiles)};`;
            const start = Math.floor(Math.random() * cycle);

            for (let row = start; ;) {
                const length = Math.min(6 + Math.floor(Math.random() * rows * 0.45), cycle - 1);

                if (row + length >= start + cycle) {
                    break;
                }

                const trail = document.createElement('span');
                const body = Array.from({ length: length - 1 }, glyph);

                for (let step = 0; step < 4; step += 1) {
                    const part = document.createElement('i');
                    part.textContent = body
                        .slice(
                            Math.round((step * body.length) / 4),
                            Math.round(((step + 1) * body.length) / 4),
                        )
                        .map((one) => `${one}\n`)
                        .join('');
                    trail.append(part);
                }

                const head = document.createElement('b');
                head.textContent = glyph();
                trail.append(head);

                if (Math.random() < 0.3) {
                    trail.dataset['mirrored'] = '';
                }

                // Every copy of it that reaches the period above the column or the viewport.
                for (let top = row - cycle; top * line < period + height; top += cycle) {
                    if ((top + length) * line > 0) {
                        const copy = trail.cloneNode(true) as HTMLElement;
                        copy.style.top = `${(top * line).toFixed(2)}px`;
                        column.append(copy);
                    }
                }

                row += length + 1 + Math.floor(Math.random() * rows);
            }

            laid.push(column);
        }
    }

    holder.replaceChildren(...laid);
}

/** The rain's three depths in one accent, drawn once for every dialog that asks for it. */
const rains = new Map<string, Promise<string>>();

/** The rain's depths, nearest first, for a colour the accent resolved to. */
function rain(colour: string): Promise<string> {
    let layers = rains.get(colour);

    if (layers === undefined) {
        layers = Promise.all([near, middle, far].map((one) => depth(colour, one))).then((all) =>
            all.join(', '),
        );
        rains.set(colour, layers);
    }

    return layers;
}

for (const host of document.querySelectorAll('ui-dialog')) {
    void host.updateComplete.then(() => {
        const dialog = inner(host, 'dialog');

        if (dialog === null) {
            return;
        }

        // Where the component would render it: from the document, the backdrop filter reached
        // nothing, measured in Chromium, the one engine that draws it.
        host.shadowRoot?.append(lens());

        // The rain in the accent as it resolves here, drawn again when a theme or a scheme
        // changes it.
        const accent = document.createElement('span');
        accent.hidden = true;
        accent.style.color = 'var(--ui-color-accent)';
        host.shadowRoot?.append(accent);
        let drawn = '';
        const paint = (): void => {
            const colour = getComputedStyle(accent).color;

            if (colour !== drawn) {
                drawn = colour;
                void rain(colour).then((layers) => {
                    // A later colour may have been asked for while this one was drawn.
                    if (drawn === colour) {
                        dialog.style.setProperty('--ui-rain', layers);
                    }
                });
            }
        };
        paint();
        new MutationObserver(() => {
            paint();
            requestAnimationFrame(paint);
        }).observe(document.documentElement, { attributes: true });
        matchMedia('(prefers-color-scheme: dark)').addEventListener('change', paint);

        // The columns' layer, shown before the dialog enters the top layer, so it lands under
        // it, and hidden as the dialog leaves. The columns are laid out ahead of the opening,
        // while nothing waits on them: as the page starts, and as the theme changes, wherever
        // they are chosen; and on opening, for a choice or a viewport they were not laid out
        // for. They come in a frame behind the dialog.
        const layer = document.createElement('div');
        layer.dataset['rain'] = '';
        layer.popover = 'manual';
        layer.inert = true;
        layer.setAttribute('aria-hidden', 'true');
        const holder = document.createElement('div');
        layer.append(holder);
        dialog.append(layer);
        let laid = '';
        const prepare = (): void => {
            if (chosen(dialog, 'backdrop') !== 'char-columns') {
                return;
            }

            const settle = Number.parseFloat(
                getComputedStyle(dialog).getPropertyValue('--ui-iteration-settle'),
            );
            const size = `${String(innerWidth)}x${String(innerHeight)}x${String(settle)}`;

            if (size !== laid) {
                laid = size;
                columns(holder, innerWidth, innerHeight, settle);
            }
        };
        setTimeout(prepare, 0);
        new MutationObserver(() => {
            setTimeout(prepare, 0);
        }).observe(document.documentElement, { attributes: true });
        dialog.addEventListener('beforetoggle', (event) => {
            if (!(event instanceof ToggleEvent)) {
                return;
            }

            if (event.newState === 'open') {
                prepare();
                delete layer.dataset['falling'];
                layer.showPopover();
                // After the frame the dialog is first drawn in: a task asked for from that frame's
                // callback. A second callback asked for from the first never ran in WebKit, and the
                // columns stayed hidden — measured.
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        if (layer.matches(':popover-open')) {
                            layer.dataset['falling'] = '';
                        }
                    }, 0);
                });
            } else if (layer.matches(':popover-open')) {
                layer.hidePopover();
            }
        });

        const announce = (moment: 'opening' | 'closing'): void => {
            restore(dialog);

            // Found at every opening, whatever the entrance: an exit may fly back to it.
            if (moment === 'opening') {
                const from = openedFrom(host);

                if (from === undefined) {
                    openers.delete(host);
                } else {
                    openers.set(host, from);
                }
            }

            dialog.dispatchEvent(new Event(moment, { bubbles: true, composed: true }));
        };

        new MutationObserver((records) => {
            for (const record of records) {
                if (record.attributeName === 'open') {
                    if (record.oldValue === null && dialog.hasAttribute('open')) {
                        announce('opening');
                    }
                } else if (
                    dialog.classList.contains('closing') &&
                    !(record.oldValue ?? '').split(' ').includes('closing')
                ) {
                    announce('closing');
                }
            }
        }).observe(dialog, { attributeFilter: ['open', 'class'], attributeOldValue: true });
    });
}

for (const button of document.querySelectorAll<HTMLElement>('[data-open]')) {
    button.addEventListener('click', () => {
        const dialog = document.querySelector(button.dataset['open'] ?? '');

        if (dialog instanceof UiDialog) {
            dialog.show();
        }
    });
}

for (const button of document.querySelectorAll<HTMLElement>('[data-close]')) {
    button.addEventListener('click', () => {
        button.closest('ui-dialog')?.close();
    });
}

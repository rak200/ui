/**
 * What the drawn controls share — `ui-checkbox`, `ui-switch` and the radios `ui-radio-group`
 * renders: what the pointer, focus and an error can do, each by the kind of change it makes, as a
 * field's are, and the buttons that put a page's required ones in error. The components draw the
 * three alike, the radio beside the checkbox, so each of these effects is drawn alike on all three,
 * and a choice made for the page reads the same on every one. The fields take the buttons, the
 * keyframes and the lights too, the card and the button the orbit, the comet and the trace, and
 * with the table and the icon the shimmer and the scan, so an effect of one name looks the same on
 * whatever it is drawn.
 *
 * Each kind draws on a layer of its own, so effects of different kinds draw at once: the control's
 * own shadow, which is the glow a theme lights it with and which the rings are added to; the
 * `::after` laid over the control, which the lights round it are drawn on; two layers the label
 * lays over the control, for the pointer's bands and the focus's, since the control's `::before`
 * is its mark; its fill, its size, the label's text and the message. Every kind that animates the
 * control writes its animation into a property of its own, and the control's one list reads them
 * all.
 */
import { reference } from '../../../src/reference.js';
import { focus, hover } from './moments.js';
import { replay, type Firing, type Moment } from './motion.js';

/** Where one element's shared rules apply. */
export interface Drawn {
    /** The query its effects are drawn under: the consumer's choice, else its taste. */
    readonly is: (moment: string, effect: string) => string;
    /** What its rules start with: its host, so an element that shares its sheet with another
     *  draws only its own; the host while the page's record says its focus is one the reader can
     *  see; and the host while it says there is no such focus in it. */
    readonly host: string;
    readonly focused: string;
    readonly calm: string;
    /** A control in error, as the element marks one. */
    readonly invalid: string;
    /** What a control matches when it is filled. */
    readonly filled: string;
    /** The control's own corner, which the focus's bands follow outside the ring. */
    readonly radius: string;
    /** How the trace's line reaches past the control's own edge over a full control, so the
     *  fill's antialiased edge is under the line: the curve drawn tighter where the control has
     *  corners, the line a little wider all round where it is all curve. */
    readonly past: string;
    /** The label the control sits at the start of, and the label's text. */
    readonly label: string;
    readonly text: string;
    /** The control's size, across and down, as the component draws it. */
    readonly width: string;
    readonly height: string;
}

/** The lights an effect of one name draws round whatever it lights, a field or a control. */
export const lights = {
    /** A soft band of the accent, reaching past the focus's ring. */
    halo: '0 0 0 0.5rem rgb(from var(--ui-color-accent) r g b / 0.16)',
    /** A light of the accent, blurred round the boundary. */
    glow: '0 0 0.75rem 0.125rem rgb(from var(--ui-color-accent) r g b / 0.5)',
    /** The same light in the danger, for an error. */
    danger: '0 0 0.75rem 0.125rem rgb(from var(--ui-color-danger) r g b / 0.5)',
    /** The button's raise: a drop under it, which on a dark page, where a shadow barely shows, is
     *  the accent's. */
    raise: String.raw`0 2px 4px -1px light-dark(rgb(0 0 0 / 0.25), rgb(0 0 0 / 0.6)),
            0 6px 14px -4px light-dark(rgb(0 0 0 / 0.35), rgb(from var(--ui-color-accent) r g b / 0.45))`,
    /** The button's sink: its shadow gone inside, as if pressed into the page. */
    sink: 'inset 0 2px 5px light-dark(rgb(0 0 0 / 0.35), rgb(0 0 0 / 0.7))',
    /** A light of the accent held inside the boundary, its blur at the scale of what it lights. */
    inner: (blur: string): string =>
        `inset 0 0 0 1px var(--ui-color-accent), inset 0 0 ${blur} rgb(from var(--ui-color-accent) r g b / 0.22)`,
    /**
     * The card's cast, at `scale` of the card's: the pointer as a light, the shadow falling away from
     * it the further the further the pointer is from the middle, and on a dark page, where a shadow
     * barely shows, the light spilling round the side the pointer is on. As strong as `strength`,
     * which a layer with no opacity of its own to fade by takes from how near the pointer is.
     */
    cast: (scale: number, strength = '1'): string => {
        const at = (length: number): string => `${String(length * scale)}rem`;
        const alpha = (value: number): string => `calc(${String(value)} * ${strength})`;

        return String.raw`calc(var(--ui-pointer-nx) * -${at(1)}) calc(var(--ui-pointer-ny) * -${at(1)} + ${at(0.5)}) ${at(1.75)}
                -${at(0.25)} light-dark(rgb(0 0 0 / ${alpha(0.3)}), rgb(0 0 0 / ${alpha(0.85)})),
            calc(var(--ui-pointer-nx) * ${at(1.5)}) calc(var(--ui-pointer-ny) * ${at(1.5)}) ${at(3)} ${at(0.25)}
                light-dark(transparent, rgb(from var(--ui-color-accent) r g b / ${alpha(0.35)}))`;
    },
    /** The breathe's light, the button's: `colour` as strong as its registered progress, out to
     *  `reach`. */
    breath: (colour: string, reach: string): string =>
        `0 0 calc(var(--ui-breath) * ${reach}) rgb(from ${colour} r g b / var(--ui-breath))`,
} as const;

/** The glass a theme frosts its raised surfaces with: none where it has none, and no value at all
 *  where Glass stands down, which the fallback reads as none. */
export const glass = reference('--ui-backdrop-raised').cssText;

/**
 * The accent pushed toward the far pole from the page — darker on a light one, lighter on a dark
 * one — which the edge and the trace draw in, so they stand apart from an edge that is already the
 * accent, as a glowing theme's is: a band in the accent itself vanished into Matrix's.
 */
export const far = String.raw`light-dark(
    oklch(from var(--ui-color-accent) calc(l - 0.1) c h),
    oklch(from var(--ui-color-accent) calc(l + 0.2) c h)
)`;

/** 1 where a colour's relative luminance, as relative colour syntax reads it, is under the point
 *  where white and black stand equally far from it, and 0 from there on: the step the package
 *  reads the accent's label off the accent with. */
const dark = 'clamp(0, (0.1791 - (0.2126 * r + 0.7152 * g + 0.0722 * b)) * infinity, 1)';

/**
 * The accent two fifths of the way to the pole further from `colour`: lighter over a dark colour
 * and darker over a light one. What a light drawn over something already coloured is drawn in,
 * where the accent a step from the page can be lost in it.
 */
export function off(colour: string): string {
    return `color-mix(in oklab, var(--ui-color-accent), color(from ${colour} srgb-linear ${dark} ${dark} ${dark} / 1) 40%)`;
}

/**
 * A colour of a running light, `by` degrees round the hue wheel from the accent's own hue, opaque
 * whatever the accent's alpha, at one lightness on each page — 0.66 on a light one and 0.8 on a
 * dark one — and at a chroma past sRGB, which every engine clips channel by channel, alike in all
 * three — measured.
 */
const turned = (by: number): string =>
    `light-dark(${['0.66', '0.8'].map((l) => `oklch(from var(--ui-color-accent) ${l} 0.25 calc(h + ${String(by)}) / 1)`).join(', ')})`;

/** The movement's transitions on a drawn control, which its page gives the control and the label's
 *  layers take, so they move with it: the zoom's scale, the lift's and the lean's place, and the
 *  tilt's turn, whose short linear step only smooths it between the pointer engine's frames. */
const growing = String.raw`scale var(--ui-duration-200) var(--ui-easing-emphasis),
                translate var(--ui-duration-200) var(--ui-easing-enter),
                transform var(--ui-duration-100) linear`;

/** The breathe, the button's, as a component runs it and a layer held where it is runs it beside:
 *  under the pointer for as long as it rests, and at the focus four rounds. */
export const breathe = {
    loop: 'ui-breathe var(--ui-duration-loop) var(--ui-easing-state) var(--ui-iteration-loop) alternate',
    settle: 'ui-breathe var(--ui-duration-loop) var(--ui-easing-state) var(--ui-iteration-settle) alternate',
} as const;

/** A running light's head: six hues a sixth of the wheel apart from a twelfth past the accent's,
 *  spread from 78.5% of a lap to 96%. */
const head = [30, 90, 150, 210, 270, 330]
    .map((by, i) => `${turned(by)} ${String(78.5 + 3.5 * i)}%`)
    .join(', ');

/**
 * A light running round from the accent: a tail in the accent's own hue that fades to nothing
 * behind it, and the head, which runs on round the hue wheel from there. Over a fill in the accent,
 * the hues nearest the fill's are at the light's two ends, and the hue opposite it is at the head's
 * middle. Interpolated round the hue wheel rather than across it, so the colours between two hues
 * keep their chroma.
 */
const running = `conic-gradient(in oklch from var(--ui-orbit), transparent 0 55%, ${turned(0)} 75%, ${head}, transparent)`;

/**
 * The orbit, the card's, as every component that offers it draws it: a light that runs round on
 * the boundary and never past it, in a band from the boundary's outer edge `width` px in, three
 * laps and then it fades. A lap takes 1.6s, a third longer than the card's took, and three of them
 * end where four of the loop's 1.2s do, inside the five seconds a loop that settles keeps to.
 */
export const orbit = {
    width: 2,
    light: running,
    run: String.raw`ui-orbit calc(var(--ui-duration-loop) * 4 / 3) linear
                calc(var(--ui-iteration-settle) * 3 / 4),
            ui-rest var(--ui-duration-200) var(--ui-easing-exit)
                calc(var(--ui-duration-loop) * var(--ui-iteration-settle)) forwards`,
} as const;

/**
 * The comet, the button's, as every component that offers it draws it: the orbit's light, run round
 * clear of the boundary in a band `width` px wide whose outer edge is `reach` px out — from 2px out
 * to 5px, over where the focus ring is drawn. It is drawn after the control, so it passes over the
 * ring rather than under it, in all three engines — measured. Its tail is the orbit's, the accent's
 * hue as bright as the head, rather than the accent the ring takes: where the ring is the accent,
 * which is every theme and scheme but Matrix's dark one, the tail in the accent was 1.00 to 1.01:1
 * from the ring, and as bright as the head it is 1.16 to 2.97:1 — measured. A lap takes 2.4s. Under
 * the pointer it runs for as long as the pointer rests and is held where it was when the pointer
 * leaves, so the next pass picks it up there; at the focus, which can rest for minutes, it runs two
 * laps, in the time a loop that settles takes, and fades.
 */
export const comet = {
    reach: 5,
    width: 3,
    light: orbit.light,
    /** Under the pointer, paused until the pointer rests there. */
    loop: 'ui-orbit calc(var(--ui-duration-loop) * 2) linear var(--ui-iteration-loop) paused',
    /** At the focus. */
    run: String.raw`ui-orbit calc(var(--ui-duration-loop) * 2) linear
                calc(var(--ui-iteration-settle) / 2),
            ui-rest var(--ui-duration-200) var(--ui-easing-exit)
                calc(var(--ui-duration-loop) * var(--ui-iteration-settle)) forwards`,
} as const;

/**
 * The trace, the card's, as every component that offers it draws it: the boundary drawn round once,
 * clockwise from the top, and undrawn the same way as its moment ends, in the orbit's band and in
 * the accent a step from the page, the edge's light. The band is wider than the boundary, so it
 * grows into the component from the boundary's outer edge rather than out of it, and the gap the
 * focus ring keeps stays clear. The angle is a registered property, transitioned, so the line is
 * drawn on from wherever it is.
 */
export const trace = {
    width: orbit.width,
    /** The line, in the colour a component gives it where its band is over a fill, in
     *  `--ui-band-ink`, else a step from the page. */
    light: `conic-gradient(var(--ui-band-ink, ${far}) var(--ui-trace), transparent 0)`,
    /**
     * Over a fill: the accent moved off the fill. A step from the page is a step from a fill that
     * is the accent, and over Matrix's dark primary, its own green, the line stood 1.04:1 from
     * it; moved off the fill, 2.11:1 or more over every primary, and 1.71:1 or more over a full
     * checkbox, switch or radio, the least where Glass lets the page through the fill — measured.
     */
    over: off,
    transition: '--ui-trace calc(var(--ui-duration-400) * 1.5) var(--ui-easing-move)',
} as const;

/**
 * The edge, the card's, as every component that offers it draws it: the orbit's band lit where the
 * pointer is nearest, as strongly as the pointer is near, in the accent a step from the page, or
 * over a fill in the colour the component gives the trace there. The light fades out over the
 * component's own width across and its own height down, so from one side it reaches the other at
 * nothing, round a card and round a checkbox alike, where a light of one size had been set for
 * each: 20rem round the card, and 7rem round the button. At the focus, which has no pointer, the
 * band is lit as a pointer in the middle would light it.
 */
export const edge = {
    width: orbit.width,
    /** Centred where the pointer is in the band's own box, which a component's layer is. */
    light: `radial-gradient(ellipse 100% 100% at var(--ui-pointer-x) var(--ui-pointer-y), var(--ui-band-ink, ${far}), transparent)`,
    /** Centred in the middle of that box, at the focus. */
    middle: `radial-gradient(ellipse 100% 100% at 50% 50%, var(--ui-band-ink, ${far}), transparent)`,
} as const;

/**
 * What a shimmer's sheen and a scan's band are drawn in, the button's: over a surface, the accent
 * at half its strength; over a fill, that fill lifted toward white. Not the colour a fill's label or
 * mark is drawn in, which is black on a light fill, and crossed the button as a shadow.
 */
export const sheen = {
    over: 'rgb(from var(--ui-color-accent) r g b / 0.5)',
    on: (fill: string): string => `oklch(from ${fill} calc(l + 0.35) calc(c * 0.4) h / 0.55)`,
    /**
     * Over strokes drawn in `colour`, an icon's: the accent, two fifths of the way to the pole
     * further from that colour, so lighter over a dark glyph and darker over a light one. The sheen
     * over a surface moved strokes little. Matrix draws its dark scheme's strokes in the accent,
     * and there it left them as they were and lifted only their edges, 1.40:1 at most; Glass's
     * black strokes it moved 1.30:1 at most. At its middle this moves the strokes 3.65:1 or more,
     * in every theme and scheme, in all three engines — measured.
     */
    against: off,
} as const;

/**
 * The shimmer, the button's, as every component that offers it draws it: a sheen ten degrees off
 * upright, three quarters as wide as what it crosses, swept across it from before its start to
 * past its end. Under the pointer a sweep takes 1.5s and comes round again for as long as the
 * pointer rests; at the focus, which can rest for minutes, it sweeps four times at the loop's 1.2s,
 * inside the five seconds a loop that settles keeps to, and rests before the start. It moves
 * through a property of its own, so a picture a control already paints behind it stays where it is.
 */
export const shimmer = {
    image: (colour: string): string =>
        `linear-gradient(100deg, transparent 35%, ${colour} 50%, transparent 65%)`,
    size: '250% 100%',
    position: 'var(--ui-shimmer) 0',
    /** Under the pointer. */
    loop: 'ui-shimmer calc(var(--ui-duration-loop) * 1.25) linear var(--ui-iteration-loop)',
    /** At the focus. */
    run: 'ui-shimmer var(--ui-duration-loop) linear var(--ui-iteration-settle)',
} as const;

/**
 * The scan, the button's, as every component that offers it draws it: a thin band of light that
 * crosses what it lights from above it to below it, once, as its moment arrives. Two fifths of the
 * height, as on the button, and never more than a rem, so across a card it is still a line. It
 * moves through a property of its own, as the shimmer does.
 */
export const scan = {
    image: (colour: string): string => `linear-gradient(transparent, ${colour}, transparent)`,
    size: '100% min(40%, 1rem)',
    position: '0 var(--ui-scan)',
    run: 'ui-scan var(--ui-duration-400) var(--ui-easing-state)',
} as const;

/**
 * The ripple, the button's, as every component that offers it draws it: a circle of the
 * component's own ink, at a third of its strength, spread once from a point out to the farthest
 * corner and fading as it goes. From where the pointer came in, which a script publishes, or from
 * the middle, which needs none. The circle runs on registered properties, so one animation draws it
 * on whatever layer the component paints it on.
 */
export const ripple = {
    /** A circle of `colour`, from `at` out to the farthest corner as far as its progress. */
    image: (colour: string, at = 'var(--ui-ripple-x) var(--ui-ripple-y)'): string =>
        `radial-gradient(circle farthest-corner at ${at}, ${colour} calc(var(--ui-ripple-progress) * 100%), transparent calc(var(--ui-ripple-progress) * 100% + 1px))`,
    /** A component's own ink, at a third of its strength as the circle starts, fading as it goes:
     *  the button's, over a fill whose label it is. */
    ink: (ink: string): string => `rgb(from ${ink} r g b / calc(var(--ui-ripple-alpha) * 0.32))`,
    run: 'ui-ripple var(--ui-duration-400) var(--ui-easing-enter)',
} as const;

/** Where the pointer is, in the box of whatever the pointer engine writes it on. */
const pointed = 'var(--ui-pointer-x) var(--ui-pointer-y)';

/** The spotlight, the button's: a light in the component's own ink where the pointer is, a quarter
 *  of its strength there and fading out over 4rem, as strong as the pointer is near; at the focus,
 *  in the middle `at` names, as strong as `near` says. */
export const spot = (ink: string, at = pointed, near = 'var(--ui-pointer-near)'): string =>
    `radial-gradient(circle 4rem at ${at}, rgb(from ${ink} r g b / calc(${near} * 0.24)), transparent)`;

/** The spotlight over a surface, the card's: `colour` round where the pointer is, or round the
 *  middle `at` names, out over 16rem. */
export const spotlit = (colour: string, at = pointed): string =>
    `radial-gradient(16rem circle at ${at}, ${colour}, transparent 70%)`;

/** The flood's circle, the button's: `ink` from a point, its own centre unless `at` names one, out
 *  to the farthest corner as far as its registered progress, which a component transitions. */
export const flooded = (ink: string, at = 'var(--ui-flood-x) var(--ui-flood-y)'): string =>
    `radial-gradient(circle farthest-corner at ${at}, ${ink} calc(var(--ui-flood) * 101% - 1px), transparent calc(var(--ui-flood) * 101%))`;

/**
 * The tint, the card's, as every component that offers it draws it over a surface: the surface
 * taking a little of the accent, at `strength`. How far it goes is what the text on the surface
 * allows, and two shipped palettes allow little in the light scheme: Matrix's muted text clears
 * 4.5:1 there by 6%, and Glass's error message is at its floor over the darkest page the theme
 * takes. A plain 8% of the accent left them at 4.32 and 4.06:1 on the card, and a field's plain 6%
 * its placeholder at 4.42:1 on Matrix's light page. So the light mix is held at a lightness of at
 * least 0.98, and the dark one is 10%: at the card's 15%, a field's placeholder fell to 4.43:1 on
 * Glass's dark page. Every shipped palette's muted text and placeholder then hold 4.54:1 or more
 * over the tint, on the card and on a field, in both schemes — measured, the card at both of
 * Glass's page limits.
 *
 * A translucent surface takes it at 0.6 at least, laid over its own glass: at the glass's opacity
 * the light mix is white over white glass, and nothing showed.
 */
export const tinted = (surface: string, strength = '1'): string => String.raw`light-dark(
    oklch(
        from color-mix(in oklab, ${surface} 88%, var(--ui-color-accent))
        max(l, 0.98) c h / calc(max(alpha, 0.6) * ${strength})
    ),
    oklch(
        from color-mix(in oklab, ${surface} 90%, var(--ui-color-accent))
        l c h / calc(max(alpha, 0.6) * ${strength})
    )
)`;

/** A little of the accent mixed into a fill that is no surface, a button's primary, whose label is
 *  set against the fill itself: the tint's floor would turn a fill in the accent white. */
export const mixed = (fill: string): string =>
    `color-mix(in oklab, var(--ui-color-accent) 6%, ${fill})`;

/** How far a flood's circle has grown, on the layer or on the `::after` it is drawn on, as the
 *  button's is: the layer's own stays at nothing there, and read off it alone, the button's circle
 *  never showed, so it never glided — measured. */
const grown = (layer: HTMLElement): number =>
    Math.max(
        Number(getComputedStyle(layer).getPropertyValue('--ui-flood')) || 0,
        Number(getComputedStyle(layer, '::after').getPropertyValue('--ui-flood')) || 0,
    );

/**
 * Publishes where the pointer came onto a component, for a flood to spread from, and then where it
 * leaves, for the flood to drain toward: measured once each way rather than followed, so the
 * circle's centre holds still while it grows, and held to the box, since the first point a fast
 * pointer is seen at outside it can be a long way off. A circle that shows glides its centre to the
 * new point, turning round partway or draining; an empty one has it set at once, because gliding
 * there the circle set out from where the pointer had last left — measured on the card.
 *
 * The centre is the flood's own, `--ui-flood-x` and `--ui-flood-y`, rather than the one a ripple is
 * thrown from, which has to be where the press is at once: on one centre, a press moved a button's
 * flood still growing from the left edge over to where it was pressed, at the right — measured.
 * `off` is what the pointer leaves, the host unless it holds more than the flood answers: the
 * menu's holds its panel, which the pointer leaves the trigger for.
 */
export function floods(
    at: (host: HTMLElement) => HTMLElement | null,
    off: (host: HTMLElement) => HTMLElement | null = (host) => host,
): (firing: Firing) => void {
    return ({ host, event }) => {
        const layer = at(host);

        if (layer === null || !(event instanceof PointerEvent)) {
            return;
        }

        const point = (moved: PointerEvent): void => {
            const box = layer.getBoundingClientRect();
            const x = Math.min(Math.max(moved.clientX - box.left, 0), box.width);
            const y = Math.min(Math.max(moved.clientY - box.top, 0), box.height);
            layer.toggleAttribute('data-gliding', grown(layer) > 0);
            layer.style.setProperty('--ui-flood-x', `${x.toFixed(1)}px`);
            layer.style.setProperty('--ui-flood-y', `${y.toFixed(1)}px`);
        };

        point(event);
        off(host)?.addEventListener('pointerleave', point, { once: true });
    };
}

/**
 * Publishes the middle of a component for a flood to spread from as the focus arrives, which has
 * no point to come in at, and to drain back to as it leaves: gliding there where the circle shows,
 * as the pointer's does.
 */
export function centres(at: (host: HTMLElement) => HTMLElement | null): (firing: Firing) => void {
    return ({ host }) => {
        const layer = at(host);

        if (layer === null) {
            return;
        }

        const box = layer.getBoundingClientRect();
        layer.toggleAttribute('data-gliding', grown(layer) > 0);
        layer.style.setProperty('--ui-flood-x', `${(box.width / 2).toFixed(1)}px`);
        layer.style.setProperty('--ui-flood-y', `${(box.height / 2).toFixed(1)}px`);
    };
}

/**
 * The focus's own names for what it plays. An element matches an animation by its name, so where
 * the pointer's and the focus's play on one element, the focus's under the pointer's name took the
 * pointer's over rather than starting as the focus arrived: a field's burst the pointer had played
 * was not played again, and a checkbox's neon went on from where it had got to, or after six
 * seconds under the pointer had ended — measured. So the focus plays its keyframes under names of
 * their own, `ui-focus-` before the pointer's, as the pulse has had a name for each moment. What
 * the focus holds is a state rather than an animation, and goes on from the pointer's where both
 * chose it.
 */
export const focal = {
    /** A sheet's keyframes, again under the focus's names. */
    frames: (css: string): string => css.replaceAll('@keyframes ui-', '@keyframes ui-focus-'),
    /** An animation list, played under the focus's names. */
    run: (run: string): string => run.replaceAll(/(?<![\w-])ui-(?=[a-z])/gu, 'ui-focus-'),
} as const;

/**
 * Publishes where the pointer came onto a component, for a ripple to spread from, held to the box.
 */
export function enters(at: (host: HTMLElement) => HTMLElement | null): (firing: Firing) => void {
    return ({ host, event }) => {
        const layer = at(host);

        if (layer === null || !(event instanceof PointerEvent)) {
            return;
        }

        const box = layer.getBoundingClientRect();
        const x = Math.min(Math.max(event.clientX - box.left, 0), box.width);
        const y = Math.min(Math.max(event.clientY - box.top, 0), box.height);
        layer.style.setProperty('--ui-ripple-x', `${x.toFixed(1)}px`);
        layer.style.setProperty('--ui-ripple-y', `${y.toFixed(1)}px`);
    };
}

/** The shimmer's sweep, the scan's crossing and the ripple's circle, for every sheet that draws
 *  any. */
export const sweeps = String.raw`
/* The sheen, from before the start to past the end: at 150% of what is left once the picture's own
   width is taken, all of it lies before the start, and at -50% all of it lies past the end. */
@keyframes ui-shimmer {
    from {
        --ui-shimmer: 150%;
    }
    to {
        --ui-shimmer: -50%;
    }
}

/* The band, from a rem above to a rem below, which is never less than the band is tall. */
@keyframes ui-scan {
    from {
        --ui-scan: -1rem;
    }
    to {
        --ui-scan: calc(100% + 1rem);
    }
}

/* A plain number, which the gradient scales its reach by: Firefox does not interpolate a registered
   property toward a var(), and a size animated to the button's measured reach jumped from nothing
   to the whole of it halfway through — measured. */
/* The breathe's light coming and going: its strength alone moves, a registered number, so no engine
   interpolates a shadow — the button's note. From no light at all, so a loop that settles on an
   even count leaves the layer on the theme's own glow, with nothing to jump back to. */
@keyframes ui-breathe-glow {
    from {
        --ui-breath: 0;
    }
    to {
        --ui-breath: 1;
    }
}

@keyframes ui-ripple {
    from {
        --ui-ripple-progress: 0;
        --ui-ripple-alpha: 1;
    }
    to {
        --ui-ripple-progress: 1;
        --ui-ripple-alpha: 0;
    }
}
`;

/**
 * The underline and the sweep, the field's, as every component that offers them draws them: a line
 * of the accent 2px high along the bottom edge, on the boundary and into the component, between the
 * corners' curves, drawn out from the middle or from where the text starts. Over a fill, in the
 * colour a component gives the trace there. Drawn out through its clip rather than its scale, so a
 * layer the component moves keeps its own scale.
 */
export const line = {
    drawn: String.raw`
        inset: auto var(--ui-radius) 0;
        block-size: 2px;
        padding: 0;
        border-radius: 1px;
        background: var(--ui-band-ink, var(--ui-color-accent));
        mask: none;`,
    /** Before it is drawn out: from the middle, from the start, and from a start on the right. */
    underline: 'inset(0 50%)',
    sweep: 'inset(0 100% 0 0)',
    mirrored: 'inset(0 0 0 100%)',
    transition: 'clip-path var(--ui-duration-200) var(--ui-easing-enter)',
} as const;

/**
 * The rings a moment throws out past a component, the button's, as every component that offers
 * them draws them, in 520ms. The explode is one ring, 8px thick and soft from the start, flown out
 * from the boundary and blurring as it goes; the shockwave a circle 2px wide, and the bloom a disc
 * of the accent, each from under the component's middle to past its farthest corner by half as far
 * again as the explode's ring flies. In the colour a component gives them in `--ui-thrown-ink`,
 * else in the layer's own.
 */
export const thrown = {
    /** The explode's ring, round the boundary. */
    explode: String.raw`
        outline: 8px solid transparent;
        animation: ui-explode var(--ui-duration-400) var(--ui-easing-state);`,
    /** The circles' layer, a dot of 2px at the component's middle, under it, whose rounded
     *  corner the outline and the shadow both grow with, so either comes out round. */
    dot: String.raw`
        inset: auto;
        left: calc(50% - 1px);
        top: calc(50% - 1px);
        width: 2px;
        height: 2px;
        padding: 0;
        border-radius: 1px;
        background: none;
        mask: none;
        z-index: -1;`,
    shockwave: String.raw`
        outline: 2px solid transparent;
        animation: ui-shockwave var(--ui-duration-400) var(--ui-easing-enter);`,
    bloom: 'animation: ui-bloom var(--ui-duration-400) var(--ui-easing-enter);',
} as const;

/**
 * Throws a circle out from under a component, publishing first where it starts and how far it goes
 * — from half the box's height, under it, to past its farthest corner by half as far again as the
 * explode's ring flies — and then marks the element the circle is drawn on, under `mark`. A
 * circle's reach is in proportion to the component, and only a measurement has its size.
 */
export function waves(
    box: (host: HTMLElement) => HTMLElement | null,
    on: (host: HTMLElement) => HTMLElement | null,
    mark = 'data-border',
    pseudo?: string,
): (name: 'shockwave' | 'bloom') => (firing: Firing) => void {
    return (name) =>
        ({ host }) => {
            const measured = box(host);
            const target = on(host);

            if (measured === null || target === null) {
                return;
            }

            const { offsetWidth: width, offsetHeight: height } = measured;
            const corner = Math.hypot(width, height) / 2;
            target.style.setProperty('--ui-wave-from', `${(height / 2).toFixed(1)}px`);
            target.style.setProperty('--ui-wave-to', `calc(${corner.toFixed(1)}px + 4.5rem)`);
            // Half the box, across and down, for a layer that cuts the box out of its circle.
            target.style.setProperty('--ui-wave-x', `${(width / 2).toFixed(1)}px`);
            target.style.setProperty('--ui-wave-y', `${(height / 2).toFixed(1)}px`);
            replay(target, name, mark, pseudo);
        };
}

/**
 * The movements a moment plays once or in rounds, the button's, as every component that offers them
 * draws them: two beats outward, a stretch that settles, a swell that comes and goes, and a turn in
 * from edge-on, on the side a component publishes in `--ui-flip-width` and `--ui-flip-height`. How
 * far the beats, the stretch and the swell go is `--ui-give`, a share of the button's: a field or a
 * card three times a button's width takes a quarter, so it grows by what a button does and not
 * across its neighbours. The glitch jumps and splits what it moves into the danger and the info,
 * which Matrix's dark scheme makes a terminal's red and cyan; an error's message takes it too.
 */
export const moves = String.raw`
@keyframes ui-glitch {
    0%,
    100% {
        transform: none;
    }
    20% {
        transform: translate(-4px, 2px) skewX(-5deg);
        text-shadow: 2px -2px var(--ui-color-danger);
    }
    40% {
        transform: translate(4px, -2px) skewX(5deg);
        text-shadow: -2px 2px var(--ui-color-info);
    }
    60% {
        transform: translate(-2px, -2px) skewX(0deg);
    }
    80% {
        transform: translate(2px, 2px) skewX(3deg);
    }
}

@keyframes ui-heartbeat {
    0%,
    28%,
    70%,
    100% {
        scale: 1;
    }
    14% {
        scale: calc(1 + 0.24 * var(--ui-give, 1));
    }
    42% {
        scale: calc(1 + 0.18 * var(--ui-give, 1));
    }
}

@keyframes ui-rubber {
    0%,
    100% {
        scale: 1 1;
    }
    30% {
        scale: calc(1 + 0.25 * var(--ui-give, 1)) calc(1 - 0.25 * var(--ui-give, 1));
    }
    40% {
        scale: calc(1 - 0.25 * var(--ui-give, 1)) calc(1 + 0.25 * var(--ui-give, 1));
    }
    50% {
        scale: calc(1 + 0.15 * var(--ui-give, 1)) calc(1 - 0.15 * var(--ui-give, 1));
    }
    65% {
        scale: calc(1 - 0.05 * var(--ui-give, 1)) calc(1 + 0.05 * var(--ui-give, 1));
    }
    75% {
        scale: calc(1 + 0.05 * var(--ui-give, 1)) calc(1 - 0.05 * var(--ui-give, 1));
    }
}

@keyframes ui-breathe {
    from {
        scale: 1;
    }
    to {
        scale: calc(1 + 0.06 * var(--ui-give, 1));
    }
}

@keyframes ui-flip-vertical {
    from {
        transform: perspective(calc(var(--ui-flip-height) * 10)) rotateX(90deg);
    }
    40% {
        transform: perspective(calc(var(--ui-flip-height) * 10)) rotateX(-20deg);
    }
    70% {
        transform: perspective(calc(var(--ui-flip-height) * 10)) rotateX(10deg);
    }
    90% {
        transform: perspective(calc(var(--ui-flip-height) * 10)) rotateX(-5deg);
    }
    to {
        transform: perspective(calc(var(--ui-flip-height) * 10)) rotateX(0deg);
    }
}

@keyframes ui-flip-horizontal {
    from {
        transform: perspective(calc(var(--ui-flip-width) * 10)) rotateY(90deg);
    }
    40% {
        transform: perspective(calc(var(--ui-flip-width) * 10)) rotateY(-20deg);
    }
    70% {
        transform: perspective(calc(var(--ui-flip-width) * 10)) rotateY(10deg);
    }
    90% {
        transform: perspective(calc(var(--ui-flip-width) * 10)) rotateY(-5deg);
    }
    to {
        transform: perspective(calc(var(--ui-flip-width) * 10)) rotateY(0deg);
    }
}
`;

/** The pointer's, an error's and focus's rules for one element. */
export function rules({
    is,
    host,
    focused,
    calm,
    invalid,
    filled,
    radius,
    past,
    label,
    text,
    width,
    height,
}: Drawn): string {
    /** The label of the control a reader can see the focus on. Read off the host's record and
     *  the label's own :focus-within rather than off :has(> input:focus-visible), which Firefox
     *  matched and drew none of the rules under as the focus arrived, by Tab as by a script's
     *  focus() — measured. */
    const lit = `${focused} ${label}:focus-within`;

    /** A label in a state, read the same way: in a host with no focus the reader can see, or round
     *  a control without the focus, since the pointer yields to it, and never round a disabled
     *  control. */
    const under = (state: string, after: readonly string[]): string =>
        [`${calm} ${label}`, `${host} ${label}:not(:focus-within)`]
            .flatMap((each) =>
                after.map((part) => `${each}${state}:not(:has(> input:disabled))${part}`),
            )
            .join(',\n        ');

    /** The pointer's layer on a label the pointer rests on. */
    const resting = under(':hover', ['::before']);

    /** What a movement under the pointer moves: the control and the label's two layers, which are
     *  its boundary. */
    const moved = (state: string): string => under(state, [' > input', '::before', '::after']);

    /** A shimmer's sheen or a scan's band, in a colour, as the layer it lights paints it. */
    const swept = (sweep: 'shimmer' | 'scan', colour: string): string => {
        const { image, size, position } = sweep === 'shimmer' ? shimmer : scan;

        return String.raw`
            background-image: ${image(colour)};
            background-size: ${size};
            background-repeat: no-repeat;
            background-position: ${position};`;
    };

    /** The label's layer, `d` px out from the control's edge all round, the band's padding inside
     *  that: sized by its content, the layer took the padding on beyond it, and every band ran
     *  twice its width further out on the right and at the bottom than on the left and at the
     *  top — measured. */
    const out = (d: number): string => String.raw`
        box-sizing: border-box;
        inset-inline-start: -${d}px;
        inset-block-start: calc(50% - ${height} / 2 - ${d}px);
        inline-size: calc(${width} + ${2 * d}px);
        block-size: calc(${height} + ${2 * d}px);
        border-radius: calc(${radius} + ${d}px);
        mask:
            linear-gradient(#000 0 0) content-box exclude,
            linear-gradient(#000 0 0);`;

    /** What a fill under the pointer or at the focus is drawn in, on an empty control and on a full
     *  one: the hover colour, the deeper accent a full one hovers in, and the ink over each — the
     *  text's colour, and the mark's on the accent. */
    const hover = reference('--ui-color-hover').cssText;
    const deeper = reference('--ui-color-accent-hover').cssText;
    const ink = reference('--ui-color-text').cssText;
    const marked = reference('--ui-color-accent-contrast').cssText;

    /** The tint over an empty control's surface, and a ripple from a control's middle in an ink. */
    const surfaceTint = tinted(reference('--ui-color-surface-control').cssText);
    const middle = (each: string): string => ripple.image(ripple.ink(each), '50% 50%');

    /** A control the pointer rests on, which the pointer's effects are drawn on: never a disabled
     *  one, and never one with the focus, which they yield to. */
    const pointer = ':hover:not(:disabled):not(:focus-visible)';

    /** A control the focus is on, as specific as one the pointer rests on, which the component
     *  darkens: a disabled control takes no focus, so the guard only weighs. */
    const focusing = ':focus-visible:not(:disabled)';

    /** A fill's colours on a control in one state: the empty control's, then the full one's. */
    const coloured = (state: string, empty: string, full?: string): string =>
        String.raw`
        ${host} input${state} {
            background-color: ${empty};
        }${
            full === undefined
                ? ''
                : String.raw`

        ${host} input${filled}${state} {
            background-color: ${full};
        }`
        }`;

    /** A picture on the lights' layer over a control in one state, in the ink for an empty control
     *  and for a full one. */
    const drawn = (state: string, image: (ink: string) => string): string => String.raw`
        ${host} input${state}::after {
            background-image: ${image(ink)};
        }

        ${host} input${filled}${state}::after {
            background-image: ${image(marked)};
        }`;

    /** A circle's layer, at the middle of the control at the label's start, from half its height
     *  to past its farthest corner by half as far again as its explode's ring flies: the size the
     *  sheet already has, so no script measures it. */
    const centred = String.raw`${thrown.dot}
        left: auto;
        inset-inline-start: calc(${width} / 2 - 1px);
        --ui-wave-from: calc(${height} / 2);
        --ui-wave-to: calc(hypot(${width}, ${height}) / 2 + 2.25rem);
        color: var(--ui-color-accent);`;

    return String.raw`
/* The control's one list of animations, read from the kinds that animate it, each from a property
   of its own, so none takes another's away: the pointer's border, shadow, fill and movement, the
   focus's border, shadow, fill and movement, and an error's border and fill. The focus's play
   under its own names, so its arrival starts them where the pointer's played the same. A movement
   the control plays is the button's, at the button's give, a drawn control being as small as one,
   and a flip turns it at its own side. A ring is added to the glow a theme lights the control
   with rather than drawn in its place: added, a shadow list goes beside the one under it in all
   three engines — measured. The one shadow Chromium loses is that glow: written from
   currentColor, it comes out transparent once added to, where Firefox and WebKit keep it. */
${host} input {
    animation:
        var(--ui-run-pointer, none),
        var(--ui-run-pointer-shadow, none),
        var(--ui-run-pointer-fill, none),
        var(--ui-run-pointer-move, none),
        var(--ui-run-focus-border, none),
        var(--ui-run-focus-shadow, none),
        var(--ui-run-focus-rest, none),
        var(--ui-run-focus-fill, none),
        var(--ui-run-focus-move, none),
        var(--ui-run-error-border, none),
        var(--ui-run-error-fill, none);
    animation-composition: add, add, replace, replace, add, add, add, replace, replace, add, replace;
    --ui-flip-width: ${width};
    --ui-flip-height: ${height};
}

/* The lights round the control, on its ::after, since its own shadow is the theme's glow: the
   pointer's, the focus's outside the boundary and inside it, and an error's, each from a property
   of its own, so all of them draw at once. */
${host} input::after {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    pointer-events: none;
    box-shadow:
        var(--ui-lit-pointer, 0 0 #0000),
        var(--ui-lit-focus, 0 0 #0000),
        var(--ui-lit-inner, inset 0 0 #0000, inset 0 0 #0000),
        var(--ui-lit-error, 0 0 #0000);
    transition: box-shadow var(--ui-duration-200) var(--ui-easing-enter);
}

/* The check's pulse, as a change fires it, checked or cleared: a ring of the accent leaving the
   boundary, on the lights' layer and added to them, since the control's own list is the pointer's,
   the focus's and an error's. */
${host} input[data-fx='pulse']::after {
    animation: ui-pulse var(--ui-duration-400) var(--ui-easing-enter);
    animation-composition: add;
}

/* The pointer's bands and the focus's, on two layers the label lays over the control from where
   the control starts. The pointer's is the label's ::before, which comes before the control, so it
   is raised over it: the orbit runs on the control's own boundary. Both are always there, empty
   until an effect draws on one: a ::before that a choice brought and took away stayed in Firefox's
   layout as a flex item, with the label's gap before the control, which it moved 8px — measured.
   Isolated, so a circle drawn under the control stays over what is round the label instead of going
   behind it. The give a movement takes is the button's, whatever holds the control: a card's, a
   quarter, is inherited. */
${host} ${label} {
    position: relative;
    isolation: isolate;
    --ui-give: 1;
}

${host} ${label}::before,
${host} ${label}::after {
    content: '';
    position: absolute;
    pointer-events: none;
}

${host} ${label}::before {
    z-index: 1;
}

/* ——— The pointer, where there is one that hovers: a tap leaves :hover on what it touched. ——— */
@media (hover: hover) {
    /* movement: breathe, on the pointer's layer, which the control's movement moves with it. Before
       the borders, so a band that plays on the layer plays in its place; the orbit and the comet,
       which go on while the pointer rests, are composed with it after them. */
    @container ${is('hover-move', 'breathe')} {
        ${resting} {
            animation: ${breathe.loop};
        }
    }

    /* border: highlight is what the component does today — the boundary darkens on an empty
       control and the fill deepens on a full one — so it is no rule here. none takes it away, back
       to the colours at rest, and a control in error keeps its red. The boundary's colour is
       derived, so it is read through its formula, as the component reads it: written bare it had
       no value, and the boundary took the accent — measured. Every effect of the pointer's is
       drawn on a control without the focus, which they all yield to. */
    @container ${is('hover-border', 'none')} {
        ${host} input${pointer} {
            border-color: ${reference('--ui-color-border')};
        }

        ${host} input${filled}${pointer} {
            background-color: var(--ui-color-accent);
            border-color: var(--ui-color-accent);
        }

        ${host} ${invalid}${pointer} {
            border-color: var(--ui-color-danger);
        }
    }

    /* border: accent, the boundary in the accent, and round a full control in the accent moved off
       its fill, as the trace is, the fill kept at rest; a control in error keeps its red. */
    @container ${is('hover-border', 'accent')} {
        ${host} input${pointer} {
            border-color: var(--ui-color-accent);
        }

        ${host} input${filled}${pointer} {
            background-color: var(--ui-color-accent);
            border-color: ${trace.over('var(--ui-color-accent)')};
        }

        ${host} ${invalid}${pointer} {
            border-color: var(--ui-color-danger);
        }
    }

    /* border: pulse, a ring of the accent leaving the boundary once as the pointer arrives. */
    @container ${is('hover-border', 'pulse')} {
        ${host} input${pointer} {
            --ui-run-pointer: ui-pulse var(--ui-duration-400) var(--ui-easing-enter);
        }
    }

    /* border: explode, shockwave and bloom, the button's, once as the pointer arrives, on the
       pointer's layer: the ring round the control, the circles from under its middle. */
    @container ${is('hover-border', 'explode')} {
        ${host} ${label}::before {${out(0)}
            mask: none;
            color: var(--ui-color-accent);
        }

        ${resting} {${thrown.explode}
        }
    }

    @container ${is('hover-border', 'shockwave')} or ${is('hover-border', 'bloom')} {
        ${host} ${label}::before {${centred}
        }
    }

    @container ${is('hover-border', 'shockwave')} {
        ${resting} {${thrown.shockwave}
        }
    }

    @container ${is('hover-border', 'bloom')} {
        ${resting} {${thrown.bloom}
        }
    }

    /* border: orbit, a light run round on the control's boundary, three laps, then it fades. */
    @container ${is('hover-border', 'orbit')} {
        ${host} ${label}::before {${out(0)}
            padding: ${orbit.width}px;
            background: ${orbit.light};
            opacity: 0;
            transition:
                opacity var(--ui-duration-200) var(--ui-easing-exit),
                ${growing};
        }

        ${resting} {
            opacity: 1;
            animation: ${orbit.run};
        }
    }

    /* border: trace, the card's: the boundary drawn round once, from the top, on the orbit's band,
       and undrawn the same way as the pointer leaves. */
    @container ${is('hover-border', 'trace')} {
        ${host} ${label}::before {${out(0)}
            padding: ${trace.width}px;
            background: ${trace.light};
            transition:
                ${trace.transition},
                ${growing};
        }

        ${resting} {
            --ui-trace: 360deg;
        }
    }

    /* border: edge, the card's: the band lit where the pointer is nearest, from where the pointer
       is in the control's own box, which the pointer engine writes on the label. Never on a
       disabled control, and yielding to the focus, as the other bands do. */
    @container ${is('hover-border', 'edge')} {
        ${host} ${label}::before {${out(0)}
            padding: ${edge.width}px;
            background: ${edge.light};
            opacity: 0;
            transition: ${growing};
        }

        ${calm} ${label}:not(:has(> input:disabled))::before,
        ${host} ${label}:not(:focus-within):not(:has(> input:disabled))::before {
            opacity: var(--ui-pointer-near);
        }
    }

    /* border: comet, a comet run round clear of the boundary for as long as the pointer rests,
       held where it was when the pointer leaves. */
    @container ${is('hover-border', 'comet')} {
        ${host} ${label}::before {${out(comet.reach)}
            padding: ${comet.width}px;
            background: ${comet.light};
            opacity: 0;
            transition:
                opacity var(--ui-duration-200) var(--ui-easing-state),
                ${growing};
            animation: ${comet.loop};
        }

        ${resting} {
            opacity: 1;
            animation-play-state: running;
        }
    }

    /* shadow: halo and glow, which yield to the focus, as a field's do. */
    @container ${is('hover-shadow', 'halo')} {
        ${host} input:hover:not(:disabled):not(:focus-visible) {
            --ui-lit-pointer: ${lights.halo};
        }
    }

    @container ${is('hover-shadow', 'glow')} {
        ${host} input:hover:not(:disabled):not(:focus-visible) {
            --ui-lit-pointer: ${lights.glow};
        }
    }

    /* shadow: highlight, the glow a theme gives the pointer, the control's own shadow, as the
       button's is; raise, sink, inner and cast, the button's and the card's at a quarter of its
       size, on the lights' layer as the halo is; neon and breathe, for as long as the pointer
       rests, and burst, once, as it arrives, on the control's own shadow, added to the theme's
       glow, as a ring is. All yield to the focus. */
    @container ${is('hover-shadow', 'highlight')} {
        ${host} input${pointer} {
            box-shadow: ${reference('--ui-elevation-control-hover')};
        }
    }

    ${(
        [
            ['raise', lights.raise],
            ['sink', lights.sink],
            ['inner', lights.inner('0.375rem')],
        ] as const
    )
        .map(
            ([effect, light]) => String.raw`@container ${is('hover-shadow', effect)} {
        ${host} input${pointer} {
            --ui-lit-pointer: ${light};
        }
    }`,
        )
        .join('\n\n    ')}

    @container ${is('hover-shadow', 'cast')} {
        ${host} input:not(:disabled):not(:focus-visible) {
            --ui-lit-pointer: ${lights.cast(0.25, 'var(--ui-pointer-near)')};
        }
    }

    @container ${is('hover-shadow', 'neon')} {
        ${host} input${pointer} {
            --ui-run-pointer-shadow: ui-neon var(--ui-duration-loop) var(--ui-easing-state)
                var(--ui-iteration-loop) alternate;
        }
    }

    @container ${is('hover-shadow', 'breathe')} {
        ${host} input${pointer} {
            --ui-lit-pointer: ${lights.breath('var(--ui-color-accent)', '8px')};
            --ui-run-pointer-shadow: ui-breathe-glow var(--ui-duration-loop) var(--ui-easing-state)
                var(--ui-iteration-loop) alternate;
        }
    }

    @container ${is('hover-shadow', 'burst')} {
        ${host} input${pointer} {
            --ui-run-pointer-shadow: ui-burst var(--ui-duration-400) var(--ui-easing-enter);
        }
    }

    /* fill: shimmer and scan, the button's, on the layer the lights are drawn on, over the mark and
       the switch's thumb: a sheen swept across for as long as the pointer rests, or a band crossing
       down once as it arrives. Over a full control, in its fill lifted toward white, as on the
       button's primary. Both yield to the focus, as the shadow's do. */
    @container ${is('hover-fill', 'shimmer')} {
        ${host} input:hover:not(:disabled):not(:focus-visible)::after {${swept('shimmer', sheen.over)}
        }

        ${host} input${filled}:hover:not(:disabled):not(:focus-visible)::after {
            background-image: ${shimmer.image(sheen.on('var(--ui-color-accent)'))};
        }

        ${host} input:hover:not(:disabled):not(:focus-visible) {
            --ui-run-pointer-fill: ${shimmer.loop};
        }
    }

    @container ${is('hover-fill', 'scan')} {
        ${host} input:hover:not(:disabled):not(:focus-visible)::after {${swept('scan', sheen.over)}
        }

        ${host} input${filled}:hover:not(:disabled):not(:focus-visible)::after {
            background-image: ${scan.image(sheen.on('var(--ui-color-accent)'))};
        }

        ${host} input:hover:not(:disabled):not(:focus-visible) {
            --ui-run-pointer-fill: ${scan.run};
        }
    }

    /* fill: highlight, the hover colour, and on a full control the deeper accent it hovers in;
       tint, the card's, a little of the accent in an empty control's fill. Both yield to the focus,
       as the other fills do, and are drawn after the border's rules, so a full control's fill is
       the fill kind's to choose. */
    @container ${is('hover-fill', 'highlight')} {${coloured(pointer, hover, deeper)}
    }

    @container ${is('hover-fill', 'tint')} {${coloured(pointer, surfaceTint)}
    }

    /* fill: spotlight, the button's: a light of the control's ink where the pointer is, from where
       it is in the control's own box, which the pointer engine writes on the label. */
    @container ${is('hover-fill', 'spotlight')} {${drawn(pointer, spot)}
    }

    /* fill: flood and ripple, the button's, from the control's middle: a few pixels from where the
       pointer came in, on a control this small, and the same middle on every choice in a group,
       whose one arrival the script hears is the group's, not the choice's. The flood's circle is
       there at rest, empty, so it drains as the pointer leaves. */
    @container ${is('hover-fill', 'flood')} {
        ${host} input::after {
            background-image: ${flooded(hover, '50% 50%')};
            transition:
                box-shadow var(--ui-duration-200) var(--ui-easing-enter),
                --ui-flood var(--ui-duration-400) var(--ui-easing-move);
        }

        ${host} input${filled}::after {
            background-image: ${flooded(deeper, '50% 50%')};
        }

        ${host} input${pointer}::after {
            --ui-flood: 1;
        }
    }

    @container ${is('hover-fill', 'ripple')} {${drawn(pointer, middle)}

        ${host} input${pointer} {
            --ui-run-pointer-fill: ${ripple.run};
        }
    }

    /* fill: blur, the focus's, under the pointer. */
    @container ${is('hover-fill', 'blur')} {
        ${host} input${pointer} {
            backdrop-filter: ${glass};
        }
    }

    /* label: accent and glow, the focus's, under the pointer, and yielding to the focus. */
    @container ${is('hover-label', 'accent')} {
        ${host} ${text} {
            transition: color var(--ui-duration-200) var(--ui-easing-state);
        }

        ${calm} ${label}:hover:not(:has(> input:disabled)) > ${text},
        ${host} ${label}:not(:focus-within):hover:not(:has(> input:disabled)) > ${text} {
            color: color-mix(in oklab, var(--ui-color-accent) 80%, var(--ui-color-text));
        }
    }

    @container ${is('hover-label', 'glow')} {
        ${host} ${text} {
            transition: text-shadow var(--ui-duration-200) var(--ui-easing-state);
        }

        ${calm} ${label}:hover:not(:has(> input:disabled)) > ${text},
        ${host} ${label}:not(:focus-within):hover:not(:has(> input:disabled)) > ${text} {
            text-shadow: 0 0 0.5rem rgb(from var(--ui-color-accent) r g b / 0.7);
        }
    }

    /* movement: zoom, a tenth larger, which on a control this small is under 3px, while the pointer
       rests on the label, as the borders read it. The label's two layers are the control's
       boundary, whatever border is drawn on them, so they grow with it, on its transition: at their
       own size, they stayed where the control had been, and the trace and the orbit on its boundary
       stood inside it. Read off the control's own :hover, Firefox left the layers at their own size
       where the focus had come first, until something else restyled them — measured. */
    @container ${is('hover-move', 'zoom')} {
        ${moved(':hover')} {
            scale: 1.1;
        }
    }

    /* movement: lift, the button's two pixels, and the lean and the tilt toward the pointer, at a
       control's size, held where the label's two layers are as the zoom is; breathe, which comes
       round for as long as the pointer rests, the pointer's layer with it, as written before the
       borders; and the beat, the stretch, the flips and the glitch, once, as the pointer arrives,
       which a band has no need to follow, as on the button. All yield to the focus. */
    @container ${is('hover-move', 'lift')} {
        ${moved(':hover')} {
            translate: 0 -2px;
        }
    }

    @container ${is('hover-move', 'magnetic')} {
        ${moved('')} {
            translate: calc(var(--ui-pointer-nx) * var(--ui-pointer-near) * 2px)
                calc(var(--ui-pointer-ny) * var(--ui-pointer-near) * 2px);
        }
    }

    @container ${is('hover-move', 'tilt')} {
        ${moved('')} {
            transform: perspective(500px)
                rotateY(calc(var(--ui-pointer-nx) * var(--ui-pointer-near) * 14deg))
                rotateX(calc(var(--ui-pointer-ny) * var(--ui-pointer-near) * -14deg));
        }
    }

    @container ${is('hover-move', 'breathe')} {
        ${under(':hover', [' > input'])} {
            --ui-run-pointer-move: ${breathe.loop};
        }
    }

    @container ${is('hover-move', 'breathe')} and ${is('hover-border', 'orbit')} {
        ${resting} {
            animation: ${orbit.run}, ${breathe.loop};
        }
    }

    @container ${is('hover-move', 'breathe')} and ${is('hover-border', 'comet')} {
        ${resting} {
            animation: ${comet.loop}, ${breathe.loop};
            animation-play-state: running;
        }
    }

    ${(
        [
            ['heartbeat', 'ui-heartbeat var(--ui-duration-300) var(--ui-easing-state)'],
            ['rubber', 'ui-rubber var(--ui-duration-400) linear'],
            [
                'flip-vertical',
                'ui-flip-vertical calc(var(--ui-duration-400) * 1.5) var(--ui-easing-enter)',
            ],
            [
                'flip-horizontal',
                'ui-flip-horizontal calc(var(--ui-duration-400) * 1.5) var(--ui-easing-enter)',
            ],
            ['glitch', 'ui-glitch var(--ui-duration-200) linear'],
        ] as const
    )
        .map(
            ([effect, run]) => String.raw`@container ${is('hover-move', effect)} {
        ${under(':hover', [' > input'])} {
            --ui-run-pointer-move: ${run};
        }
    }`,
        )
        .join('\n\n    ')}
}

/* ——— Focus. Every effect keeps the ring, drawn at once, as the component draws it today. ——— */

/* The focus wins: a control the focus is on is drawn as the focus chose, and the pointer resting on
   it changes nothing, what the component does today under it included — the boundary's darkening,
   and the deeper fill of a full control, back to the colours at rest and red kept in error. As
   specific as that darkening and after it, as every border and fill the focus draws is. */
${host} input${focusing} {
    border-color: ${reference('--ui-color-border')};
}

${host} input${filled}${focusing} {
    background-color: var(--ui-color-accent);
    border-color: var(--ui-color-accent);
}

${host} ${invalid}${focusing} {
    border-color: var(--ui-color-danger);
}

/* border: pulse, the ring at once and the pointer's pulse out across it, in the ring's colour. */
@container ${is('focus-border', 'pulse')} {
    ${host} input:focus-visible {
        --ui-run-focus-border: ui-pulse-focus var(--ui-duration-400) var(--ui-easing-enter);
    }
}

/* border: highlight and accent, the pointer's, held inside the ring: the darkening the component
   draws under the pointer, or the accent, moved off a full control's fill; red kept in error. */
@container ${is('focus-border', 'highlight')} {
    ${host} input${focusing} {
        border-color: ${reference('--ui-color-text')};
    }

    ${host} input${filled}${focusing} {
        background-color: ${reference('--ui-color-accent-hover')};
        border-color: ${reference('--ui-color-accent-hover')};
    }
}

@container ${is('focus-border', 'accent')} {
    ${host} input${focusing} {
        border-color: var(--ui-color-accent);
    }

    ${host} input${filled}${focusing} {
        border-color: ${trace.over('var(--ui-color-accent)')};
    }
}

@container ${is('focus-border', 'highlight')} or ${is('focus-border', 'accent')} {
    ${host} ${invalid}${focusing} {
        border-color: var(--ui-color-danger);
    }
}

/* border: explode, shockwave and bloom, the pointer's, as the focus arrives, on the focus's
   layer. */
@container ${is('focus-border', 'explode')} {
    ${host} ${label}::after {${out(0)}
        mask: none;
        color: var(--ui-color-accent);
    }

    ${lit}::after {${thrown.explode}
    }
}

@container ${is('focus-border', 'shockwave')} or ${is('focus-border', 'bloom')} {
    ${host} ${label}::after {${centred}
    }
}

@container ${is('focus-border', 'shockwave')} {
    ${lit}::after {${thrown.shockwave}
    }
}

@container ${is('focus-border', 'bloom')} {
    ${lit}::after {${thrown.bloom}
    }
}

/* border: orbit, the pointer's, a light run round on the control's boundary, three laps, then it
   fades. */
@container ${is('focus-border', 'orbit')} {
    ${lit}::after {${out(0)}
        padding: ${orbit.width}px;
        background: ${orbit.light};
        animation: ${orbit.run};
        transition: ${growing};
    }
}

/* border: comet, the pointer's, run round clear of the boundary and over the ring, two laps, then
   it fades. */
@container ${is('focus-border', 'comet')} {
    ${lit}::after {${out(comet.reach)}
        padding: ${comet.width}px;
        background: ${comet.light};
        animation: ${comet.run};
        transition: ${growing};
    }
}

/* border: trace, the pointer's: the boundary drawn round once inside the ring, from the top, and
   undrawn the same way as the focus leaves. */
@container ${is('focus-border', 'trace')} {
    ${host} ${label}::after {${out(0)}
        padding: ${trace.width}px;
        background: ${trace.light};
        transition:
            ${trace.transition},
            ${growing};
    }

    ${lit}::after {
        --ui-trace: 360deg;
    }
}

/* border: edge, the pointer's, the band lit as a pointer in the middle of the control would light
   it, faded in as the focus arrives. */
@container ${is('focus-border', 'edge')} {
    ${host} ${label}::after {${out(0)}
        padding: ${edge.width}px;
        background: ${edge.middle};
        opacity: 0;
        transition:
            opacity var(--ui-duration-200) var(--ui-easing-enter),
            ${growing};
    }

    ${lit}::after {
        opacity: 1;
    }
}

/* Where the pointer and the focus both chose the trace, it is drawn once, on the pointer's layer,
   for either, so a line the pointer drew stays drawn as the focus arrives, rather than being
   undrawn on one layer while it is drawn again on the other. Where there is a pointer, as the
   pointer's layer is. */
@media (hover: hover) {
    @container ${is('hover-border', 'trace')} and ${is('focus-border', 'trace')} {
        ${lit}::before {
            --ui-trace: 360deg;
        }

        ${host} ${label}::after {
            visibility: hidden;
        }
    }
}

/* The trace and the edge over a full control, on both of the label's layers, in the accent moved
   off the fill, and reaching past the fill's own edge: drawn on that edge exactly, the fill's
   antialiased curve showed round the line in the fill's colour, which the line moved off it stands
   apart from, on every one of these controls, in all three engines. With the checkbox's corners
   2px tighter, none of it showed in Chromium and WebKit and a third of it in Firefox; round the
   switch and the radio, with the line half a pixel wider, what was left was half as strong or
   less — measured. */
@container ${is('hover-border', 'trace')} or ${is('focus-border', 'trace')} or
    ${is('hover-border', 'edge')} or ${is('focus-border', 'edge')} {
    ${host} ${label}:has(> input${filled}) {
        --ui-band-ink: ${trace.over('var(--ui-color-accent)')};
    }

    ${host} ${label}:has(> input${filled})::before,
    ${host} ${label}:has(> input${filled})::after {${past}
    }
}

@container ${is('focus-shadow', 'halo')} {
    ${host} input:focus-visible {
        --ui-lit-focus: ${lights.halo};
    }
}

@container ${is('focus-shadow', 'glow')} {
    ${host} input:focus-visible {
        --ui-lit-focus: ${lights.glow};
    }
}

/* inner: lit from inside the boundary, as a field is, its blur at the scale of a control this
   small. */
@container ${is('focus-shadow', 'inner')} {
    ${host} input:focus-visible {
        --ui-lit-inner: ${lights.inner('0.375rem')};
    }
}

/* neon: a lit line round the boundary and a glow that swells from close round it to a wide halo,
   four times. Its last round ends on its lit line, so it fades from there. */
@container ${is('focus-shadow', 'neon')} {
    ${host} input:focus-visible {
        --ui-run-focus-shadow: ${focal.run('ui-neon var(--ui-duration-loop) var(--ui-easing-state) var(--ui-iteration-settle) alternate')};
        --ui-run-focus-rest: ${focal.run('ui-neon-rest var(--ui-duration-200) var(--ui-easing-exit) calc(var(--ui-duration-loop) * var(--ui-iteration-settle))')};
    }
}

/* highlight, raise and sink, the pointer's, while the focus stays; breathe, four rounds and then
   at rest, and burst, once, as the focus arrives. */
@container ${is('focus-shadow', 'highlight')} {
    ${host} input:focus-visible {
        box-shadow: ${reference('--ui-elevation-control-hover')};
    }
}

@container ${is('focus-shadow', 'raise')} {
    ${host} input:focus-visible {
        --ui-lit-focus: ${lights.raise};
    }
}

@container ${is('focus-shadow', 'sink')} {
    ${host} input:focus-visible {
        --ui-lit-focus: ${lights.sink};
    }
}

@container ${is('focus-shadow', 'breathe')} {
    ${host} input:focus-visible {
        --ui-lit-focus: ${lights.breath('var(--ui-color-accent)', '8px')};
        --ui-run-focus-shadow: ${focal.run('ui-breathe-glow var(--ui-duration-loop) var(--ui-easing-state) var(--ui-iteration-settle) alternate')};
    }
}

@container ${is('focus-shadow', 'burst')} {
    ${host} input:focus-visible {
        --ui-run-focus-shadow: ${focal.run('ui-burst var(--ui-duration-400) var(--ui-easing-enter)')};
    }
}

/* Where the pointer and the focus both chose one of the lights, it is drawn once, from the focus's
   property, for either, so it holds as the focus arrives and as it leaves, rather than fading out
   of one property while it fades into the other. */
@media (hover: hover) {
    ${(
        [
            ['halo', '--ui-lit-focus', lights.halo],
            ['glow', '--ui-lit-focus', lights.glow],
            ['raise', '--ui-lit-focus', lights.raise],
            ['sink', '--ui-lit-focus', lights.sink],
            ['inner', '--ui-lit-inner', lights.inner('0.375rem')],
        ] as const
    )
        .map(
            ([
                effect,
                slot,
                light,
            ]) => String.raw`@container ${is('hover-shadow', effect)} and ${is('focus-shadow', effect)} {
        ${host} input${pointer} {
            --ui-lit-pointer: initial;
            ${slot}: ${light};
        }
    }`,
        )
        .join('\n\n    ')}
}

/* fill: shimmer and scan, the pointer's, as the focus arrives: four sweeps and then at rest, or a
   band crossing down once. */
@container ${is('focus-fill', 'shimmer')} {
    ${host} input:focus-visible::after {${swept('shimmer', sheen.over)}
    }

    ${host} input${filled}:focus-visible::after {
        background-image: ${shimmer.image(sheen.on('var(--ui-color-accent)'))};
    }

    ${host} input:focus-visible {
        --ui-run-focus-fill: ${focal.run(shimmer.run)};
    }
}

@container ${is('focus-fill', 'scan')} {
    ${host} input:focus-visible::after {${swept('scan', sheen.over)}
    }

    ${host} input${filled}:focus-visible::after {
        background-image: ${scan.image(sheen.on('var(--ui-color-accent)'))};
    }

    ${host} input:focus-visible {
        --ui-run-focus-fill: ${focal.run(scan.run)};
    }
}

/* fill: blur, the page behind the control blurred through the theme's glass while it has the
   focus. Drawn for Glass, whose control lets the page through; where there is no glass, nothing
   changes. */
@container ${is('focus-fill', 'blur')} {
    ${host} input:focus-visible {
        backdrop-filter: ${glass};
    }
}

/* fill: highlight, tint and ripple, the pointer's, while the focus stays, or as it arrives. */
@container ${is('focus-fill', 'highlight')} {${coloured(focusing, hover, deeper)}
}

@container ${is('focus-fill', 'tint')} {${coloured(focusing, surfaceTint)}
}

@container ${is('focus-fill', 'ripple')} {${drawn(':focus-visible', middle)}

    ${host} input:focus-visible {
        --ui-run-focus-fill: ${focal.run(ripple.run)};
    }
}

/* fill: spotlight and flood, the pointer's, from the middle, as the focus has no point of its own:
   a light held there, or the hover colour spread from there as the focus arrives and drained back
   as it leaves, as the pointer's is on a control this small. */
@container ${is('focus-fill', 'spotlight')} {${drawn(':focus-visible', (each) => spot(each, '50% 50%', '1'))}
}

@container ${is('focus-fill', 'flood')} {
    ${host} input::after {
        background-image: ${flooded(hover, '50% 50%')};
        transition:
            box-shadow var(--ui-duration-200) var(--ui-easing-enter),
            --ui-flood var(--ui-duration-400) var(--ui-easing-move);
    }

    ${host} input${filled}::after {
        background-image: ${flooded(deeper, '50% 50%')};
    }

    ${host} input:focus-visible::after {
        --ui-flood: 1;
    }
}

/* label: accent, the label in the accent, a fifth of the way to the text's colour, as a field's
   is. */
@container ${is('focus-label', 'accent')} {
    ${host} ${text} {
        transition: color var(--ui-duration-200) var(--ui-easing-state);
    }

    ${lit} > ${text} {
        color: color-mix(in oklab, var(--ui-color-accent) 80%, var(--ui-color-text));
    }
}

@container ${is('focus-label', 'glow')} {
    ${host} ${text} {
        transition: text-shadow var(--ui-duration-200) var(--ui-easing-state);
    }

    ${lit} > ${text} {
        text-shadow: 0 0 0.5rem rgb(from var(--ui-color-accent) r g b / 0.7);
    }
}

/* movement: lift and zoom, the pointer's, while the focus stays, the label's layers with them;
   breathe, four rounds, the focus's layer breathing beside the control; and the beat, the stretch,
   the flips and the glitch, once, as the focus arrives. */
@container ${is('focus-move', 'lift')} {
    ${lit} > input,
    ${lit}::before,
    ${lit}::after {
        translate: 0 -2px;
    }
}

@container ${is('focus-move', 'zoom')} {
    ${lit} > input,
    ${lit}::before,
    ${lit}::after {
        scale: 1.1;
    }
}

@container ${is('focus-move', 'breathe')} {
    ${lit} > input {
        --ui-run-focus-move: ${focal.run(breathe.settle)};
    }

    ${lit}::after {
        animation: ${breathe.settle};
    }
}

@container ${is('focus-move', 'breathe')} and ${is('focus-border', 'orbit')} {
    ${lit}::after {
        animation: ${orbit.run}, ${breathe.settle};
    }
}

@container ${is('focus-move', 'breathe')} and ${is('focus-border', 'comet')} {
    ${lit}::after {
        animation: ${comet.run}, ${breathe.settle};
    }
}

${(
    [
        ['heartbeat', 'ui-heartbeat var(--ui-duration-300) var(--ui-easing-state)'],
        ['rubber', 'ui-rubber var(--ui-duration-400) linear'],
        [
            'flip-vertical',
            'ui-flip-vertical calc(var(--ui-duration-400) * 1.5) var(--ui-easing-enter)',
        ],
        [
            'flip-horizontal',
            'ui-flip-horizontal calc(var(--ui-duration-400) * 1.5) var(--ui-easing-enter)',
        ],
        ['glitch', 'ui-glitch var(--ui-duration-200) linear'],
    ] as const
)
    .map(
        ([effect, run]) => String.raw`@container ${is('focus-move', effect)} {
    ${lit} > input {
        --ui-run-focus-move: ${focal.run(run)};
    }
}`,
    )
    .join('\n\n')}

/* ——— Invalid. The boundary was already red, and nothing moves: the control stays where the
   reader aimed. Each effect on the control plays a loop that settles, as an error stands for as
   long as the reader leaves it; the message's own play once, but the glitch, which never takes the
   message away. The split's and the glitch's rounds are about half the pulse's and the flash's, so
   they play twice as many and end close to them: at four, the two ended at 960ms while the pulse
   and the flash ran on to 2080ms, in all three engines — measured. ——— */
@container ${is('invalid-border', 'pulse')} {
    ${host} ${invalid} {
        --ui-run-error-border: ui-pulse-danger var(--ui-duration-400) var(--ui-easing-enter)
            var(--ui-iteration-settle);
    }
}

/* glow, a red light held round the control for as long as it is invalid. Never on a disabled
   control, as the component's own glow is not. */
@container ${is('invalid-border', 'glow')} {
    ${host} ${invalid}:not(:disabled) {
        --ui-lit-error: ${lights.danger};
    }
}

/* split, drawn for the Matrix theme, in the danger and the info the button's glitch splits into:
   the boundary splits where it is, since a target leaving where the reader aimed is what the
   shake was left out for. */
@container ${is('invalid-border', 'split')} {
    ${host} ${invalid} {
        --ui-run-error-border: ui-split var(--ui-duration-200) linear
            calc(var(--ui-iteration-settle) * 2);
    }
}

/* flash, the control tinted red and faded back to its fill, from the danger mixed into the
   surface as a field's is. */
@container ${is('invalid-fill', 'flash')} {
    ${host} ${invalid} {
        --ui-run-error-fill: ui-flash var(--ui-duration-400) var(--ui-easing-exit)
            var(--ui-iteration-settle);
    }
}

@container ${is('invalid-message', 'fade')} {
    ${host} .error {
        animation: ui-fade var(--ui-duration-200) var(--ui-easing-enter);
    }
}

@container ${is('invalid-message', 'drop')} {
    ${host} .error {
        animation: ui-drop var(--ui-duration-300) var(--ui-easing-emphasis);
    }
}

/* type, the message typed out from its start: a mask stepped across it a character's width at a
   time, which in a monospaced face is a letter. */
@container ${is('invalid-message', 'type')} {
    ${host} .error {
        mask-image: linear-gradient(to right, #000 var(--ui-typed), transparent 0);
        animation: ui-type calc(var(--ui-duration-400) * 2) steps(40, end);
    }
}

@container ${is('invalid-message', 'glitch')} {
    ${host} .error {
        animation: ui-glitch var(--ui-duration-200) linear calc(var(--ui-iteration-settle) * 2);
    }
}
`;
}

/** The keyframes those rules play, and a field's: once in a sheet, however many elements it
 *  draws. */
export const keyframes = String.raw`
/* From a fifth of the danger mixed into the surface rather than the danger laid over it, since a
   field has text in it to read: laid over, it took the text of a field in error to 3.14:1 at each
   round's start, on Matrix's light page, and mixed in, to 4.74:1 at the least, in every theme and
   scheme — measured. A control takes the field's, so the two look alike. */
@keyframes ui-flash {
    from {
        background-color: color-mix(
            in oklab,
            var(--ui-color-danger) 20%,
            ${reference('--ui-color-surface-control').cssText}
        );
    }
}

@keyframes ui-split {
    20% {
        box-shadow:
            -3px 0 0 0 var(--ui-color-danger),
            3px 0 0 0 var(--ui-color-info);
    }
    40% {
        box-shadow:
            3px 0 0 0 var(--ui-color-danger),
            -3px 0 0 0 var(--ui-color-info);
    }
    60% {
        box-shadow:
            -2px 1px 0 0 var(--ui-color-danger),
            2px -1px 0 0 var(--ui-color-info);
    }
    80% {
        box-shadow:
            1px 0 0 0 var(--ui-color-danger),
            -1px 0 0 0 var(--ui-color-info);
    }
}

@keyframes ui-type {
    from {
        --ui-typed: 0ch;
    }
    to {
        --ui-typed: 40ch;
    }
}

@keyframes ui-drop {
    from {
        translate: 0 -0.5rem;
        opacity: 0;
    }
}

@keyframes ui-fade {
    from {
        opacity: 0;
    }
}

${sweeps}

@keyframes ui-orbit {
    to {
        --ui-orbit: 360deg;
    }
}

@keyframes ui-rest {
    to {
        opacity: 0;
    }
}
`;

/**
 * The pulse and the neon's rounds and the explode's ring, sized for what they light: `small` for a
 * drawn control, 24px across, and `wide` for one the size of a button or larger — the button, a
 * field and a card. The shape and the colours are one; only the reach grows with the control.
 *
 * The neon's line holds through the whole loop, so the trough is lit too: a glow alone, 2px at its
 * lowest, drew next to nothing there on a light page, and the loop read as a faint flicker. In the
 * accent, written out rather than as currentColor: Chromium does not interpolate a shadow whose
 * colour is derived from currentColor, by rgb(from) or color-mix(). It holds the first value to
 * halfway and jumps — measured; Firefox and WebKit interpolate it.
 */
export const sized = {
    small: `${pulse(10)}\n${neon([4, 1, 10, 2], [8, 2, 24, 6])}\n${rings('1.5rem')}\n${burst(15, 10)}`,
    wide: `${pulse(12)}\n${neon([6, 1, 16, 3], [12, 3, 40, 10])}\n${rings('3rem')}\n${burst(30, 20)}`,
} as const;

/**
 * The burst's keyframes, the button's: light bursting out round the component and gone, from the
 * accent at four fifths to nothing `blur` px soft and `spread` px out. Only the light round it
 * moves: the reference brightens the button itself at the peak too, and on the light scheme's
 * primary that took the white label from 5.17:1 to 2.32:1 — measured.
 */
function burst(blur: number, spread: number): string {
    return String.raw`
@keyframes ui-burst {
    from {
        box-shadow: 0 0 0 0 rgb(from var(--ui-color-accent) r g b / 0.8);
    }
    to {
        box-shadow: 0 0 ${String(blur)}px ${String(spread)}px rgb(from var(--ui-color-accent) r g b / 0);
    }
}`;
}

/**
 * The explode's ring, flown `reach` out, and the circles' keyframes. The ring starts centred on the
 * boundary, half over the component, and soft: begun just outside, its blur left it at half
 * strength where the button ends and strongest 4px out, which read as a gap between the two —
 * measured on the button. A drawn control's flies half as far as the rest, as its pulse reaches
 * less.
 */
function rings(reach: string): string {
    const ink = (alpha: number): string =>
        `rgb(from var(--ui-thrown-ink, currentColor) r g b / ${String(alpha)})`;

    return String.raw`
/* The ring is gone by nine tenths; the last tenth only brings the blur back down. */
@keyframes ui-explode {
    from {
        outline-offset: -4px;
        outline-color: ${ink(1)};
        filter: blur(4px);
    }
    40% {
        outline-color: ${ink(0.85)};
    }
    90% {
        outline-color: ${ink(0)};
        filter: blur(16px);
    }
    to {
        outline-offset: ${reach};
        outline-color: ${ink(0)};
        filter: blur(0);
    }
}

@keyframes ui-shockwave {
    from {
        outline-offset: var(--ui-wave-from);
        outline-color: ${ink(1)};
    }
    50% {
        outline-color: ${ink(0.7)};
    }
    to {
        outline-offset: var(--ui-wave-to);
        outline-color: ${ink(0)};
    }
}

@keyframes ui-bloom {
    from {
        box-shadow: 0 0 0 var(--ui-wave-from) rgb(from var(--ui-color-accent) r g b / 0.45);
    }
    to {
        box-shadow: 0 0 0 var(--ui-wave-to) rgb(from var(--ui-color-accent) r g b / 0);
    }
}`;
}

/**
 * The pulse's keyframes: a band leaving the boundary out to `reach` px and fading, in the colour of
 * what it answers — the pointer and a press in the accent, the focus in its own colour, an error in
 * the danger. One shape in three colours, each under a name of its own, since a drawn control plays
 * a focus's and an error's at once, from one list.
 */
function pulse(reach: number): string {
    const ring = (name: string, colour: string): string => String.raw`
@keyframes ${name} {
    from {
        box-shadow: 0 0 0 0 rgb(from ${colour} r g b / 0.5);
    }
    to {
        box-shadow: 0 0 0 ${String(reach)}px rgb(from ${colour} r g b / 0);
    }
}`;

    return [
        ring('ui-pulse', 'var(--ui-color-accent)'),
        ring('ui-pulse-focus', 'var(--ui-color-focus)'),
        ring('ui-pulse-danger', 'var(--ui-color-danger)'),
    ].join('\n');
}

/** The neon's keyframes, from its near lights to its far. */
function neon(
    [nearBlur, nearSpread, farBlur, farSpread]: readonly number[],
    [peakBlur, peakSpread, haloBlur, haloSpread]: readonly number[],
): string {
    const near = String.raw`
            0 0 0 1px var(--ui-color-accent),
            0 0 ${nearBlur}px ${nearSpread}px rgb(from var(--ui-color-accent) r g b / 0.7),
            0 0 ${farBlur}px ${farSpread}px rgb(from var(--ui-color-accent) r g b / 0.35)`;

    return String.raw`
@keyframes ui-neon {
    from {
        box-shadow:${near};
    }
    to {
        box-shadow:
            0 0 0 1px var(--ui-color-accent),
            0 0 ${peakBlur}px ${peakSpread}px var(--ui-color-accent),
            0 0 ${haloBlur}px ${haloSpread}px rgb(from var(--ui-color-accent) r g b / 0.5);
    }
}

/* From where an even count of rounds leaves the neon, to what the control rests on. */
@keyframes ui-neon-rest {
    from {
        box-shadow:${near};
    }
}
`;
}

/** Why a drawn control leaves the line along a bottom edge out. */
const along =
    'the control is too small and too round to have a bottom edge a line could run along: the radio has none, and the checkbox’s runs a few pixels between its corners.';
const lined = { underline: along, sweep: along };

/** The pointer's, focus's and an error's moments, each by kind, with what a click would do said
 *  for the page's own controls. */
export function moments(preview: string): readonly Moment[] {
    return [
        hover('control', {
            move: {
                draws: [
                    'lift',
                    'zoom',
                    'magnetic',
                    'tilt',
                    'breathe',
                    'heartbeat',
                    'rubber',
                    'flip-vertical',
                    'flip-horizontal',
                    'glitch',
                ],
            },
            fill: {
                draws: [
                    'highlight',
                    'tint',
                    { name: 'preview', says: preview },
                    'spotlight',
                    {
                        name: 'flood',
                        says: 'The hover colour spreads from the middle of the control as the pointer arrives, and drains back as it leaves.',
                    },
                    'shimmer',
                    {
                        name: 'ripple',
                        says: 'Once, as the pointer arrives: a circle spreads from the middle of the control.',
                    },
                    'scan',
                    'blur',
                ],
            },
            shadow: {
                draws: [
                    'highlight',
                    'raise',
                    'sink',
                    'halo',
                    'glow',
                    'inner',
                    'cast',
                    'neon',
                    'breathe',
                    'burst',
                ],
            },
            border: {
                today: 'highlight',
                draws: [
                    {
                        name: 'highlight',
                        says: 'The boundary darkens on an empty control, and the fill deepens on a full one.',
                    },
                    'accent',
                    'edge',
                    'orbit',
                    'trace',
                    'comet',
                    'pulse',
                    'shockwave',
                    'bloom',
                    'explode',
                ],
                refuses: lined,
            },
            label: { draws: ['accent', 'glow'] },
        }),
        focus('control', {
            move: {
                draws: [
                    'lift',
                    'zoom',
                    'breathe',
                    'heartbeat',
                    'rubber',
                    'flip-vertical',
                    'flip-horizontal',
                    'glitch',
                ],
            },
            fill: {
                draws: [
                    'highlight',
                    'tint',
                    'preview',
                    'spotlight',
                    {
                        name: 'flood',
                        says: 'The hover colour spreads from the middle of the control as the focus arrives, and drains back as it leaves.',
                    },
                    'shimmer',
                    'ripple',
                    'scan',
                    'blur',
                ],
            },
            shadow: {
                draws: [
                    'highlight',
                    'raise',
                    'sink',
                    'halo',
                    'glow',
                    'inner',
                    'neon',
                    'breathe',
                    'burst',
                ],
            },
            border: {
                draws: [
                    'highlight',
                    'accent',
                    'edge',
                    'orbit',
                    'trace',
                    'comet',
                    'pulse',
                    'shockwave',
                    'bloom',
                    'explode',
                ],
                refuses: lined,
            },
            label: { draws: ['accent', 'glow'] },
        }),
        {
            name: 'invalid',
            label: 'Invalid',
            kinds: [
                {
                    name: 'border',
                    label: 'Border',
                    effects: [
                        { name: 'none', today: true, says: 'The boundary turns red.' },
                        {
                            name: 'pulse',
                            settles: true,
                            says: 'A red ring leaves the boundary, four times, then rests; nothing moves.',
                        },
                        {
                            name: 'glow',
                            says: 'A red light held round the control for as long as it is invalid.',
                        },
                        {
                            name: 'split',
                            settles: true,
                            says: 'The boundary splits into two colours where it is, eight times, then rests. Drawn for Matrix.',
                        },
                    ],
                },
                {
                    name: 'fill',
                    label: 'Fill',
                    effects: [
                        { name: 'none', today: true, says: 'The control keeps its fill.' },
                        {
                            name: 'flash',
                            settles: true,
                            says: 'The control is tinted red and fades back, four times, then rests.',
                        },
                    ],
                },
                {
                    name: 'message',
                    label: 'Message',
                    effects: [
                        { name: 'none', today: true, says: 'The message is there at once.' },
                        { name: 'fade', says: 'The message fades in.' },
                        {
                            name: 'drop',
                            says: 'The message falls into place under the control, past it and back.',
                        },
                        {
                            name: 'type',
                            says: 'The message is typed out from its start, a letter at a time.',
                        },
                        {
                            name: 'glitch',
                            settles: true,
                            says: 'The message jumps and splits into two colours, eight times, then rests. Drawn for Matrix.',
                        },
                    ],
                },
            ],
        },
    ];
}

/** An element a page requires an answer of, with what validating reads and writes on it. */
export interface Field extends HTMLElement {
    error: string;
    readonly updateComplete: Promise<boolean>;
}

/** The next frame. */
const frame = (): Promise<void> =>
    new Promise((resolve) => {
        requestAnimationFrame(() => {
            resolve();
        });
    });

/**
 * Wires a page's two buttons. Validate puts each required element left unanswered in error and
 * takes it off the rest; Play the error again does the same from nothing in error, so the effect
 * chosen for an error plays again — it starts as the error does, so every error is taken off and
 * drawn gone first.
 *
 * An error is taken off with the empty string, as the checkbox's page says: the attribute taken
 * away left the property null, which both elements still rendered as an error — measured.
 */
export function validation(
    selector: string,
    answered: (field: Field) => boolean,
    message: string,
): void {
    const fields = (): Field[] => [...document.querySelectorAll<Field>(selector)];

    const validate = (): void => {
        for (const field of fields()) {
            field.error = answered(field) ? '' : message;
        }
    };

    const again = async (): Promise<void> => {
        const all = fields();

        for (const field of all) {
            field.error = '';
        }

        await Promise.all(all.map((field) => field.updateComplete));

        // Each control's style read back without the error, so it is worked out before the
        // error comes back and the effect starts again.
        for (const field of all) {
            const controls = field.shadowRoot?.querySelectorAll('input, textarea, select') ?? [];

            for (const control of controls) {
                getComputedStyle(control).getPropertyValue('animation-name');
            }
        }

        await frame();
        validate();
    };

    for (const button of document.querySelectorAll<HTMLElement>('[data-validate]')) {
        button.addEventListener('click', validate);
    }

    for (const button of document.querySelectorAll<HTMLElement>('[data-again]')) {
        button.addEventListener('click', () => {
            void again();
        });
    }
}

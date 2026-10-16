/**
 * What the drawn controls share — `ui-checkbox`, `ui-switch` and the radios `ui-radio-group`
 * renders: what the pointer, focus and an error can do, each by the kind of change it makes, as a
 * field's are, and the buttons that put a page's required ones in error. The components draw the
 * three alike, the radio beside the checkbox, so each of these effects is drawn alike on all three,
 * and a choice made for the page reads the same on every one. The fields take the buttons, the
 * keyframes and the lights too, and the card and the button the orbit and the comet, and with the
 * table and the icon the shimmer and the scan, so an effect of one name looks the same on whatever
 * it is drawn.
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
import type { Moment } from './motion.js';

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
} as const;

/** The glass a theme frosts its raised surfaces with: none where it has none, and no value at all
 *  where Glass stands down, which the fallback reads as none. */
export const glass = reference('--ui-backdrop-raised').cssText;

/**
 * The accent pushed toward the far pole from the page — darker on a light one, lighter on a dark
 * one — which every effect on the boundary draws in, so it stands apart from an edge that is
 * already the accent, as a glowing theme's is: a band in the accent itself vanished into Matrix's.
 */
export const far = String.raw`light-dark(
    oklch(from var(--ui-color-accent) calc(l - 0.1) c h),
    oklch(from var(--ui-color-accent) calc(l + 0.2) c h)
)`;

/** A light running round: its `head`, and behind it a `tail` that fades to nothing. */
const running = (tail: string, head: string): string =>
    `conic-gradient(from var(--ui-orbit), transparent 0 55%, ${tail} 75%, ${head} 88%, transparent)`;

/**
 * The orbit, the card's, as every component that offers it draws it: a light that runs round on
 * the boundary and never past it, in a band from the boundary's outer edge `width` px in, three
 * laps and then it fades. A lap takes 1.6s, a third longer than the card's took, and three of them
 * end where four of the loop's 1.2s do, inside the five seconds a loop that settles keeps to.
 */
export const orbit = {
    width: 2,
    light: running(far, 'var(--ui-color-info)'),
    run: String.raw`ui-orbit calc(var(--ui-duration-loop) * 4 / 3) linear
                calc(var(--ui-iteration-settle) * 3 / 4),
            ui-rest var(--ui-duration-200) var(--ui-easing-exit)
                calc(var(--ui-duration-loop) * var(--ui-iteration-settle)) forwards`,
} as const;

/**
 * The comet, the button's, as every component that offers it draws it: the orbit's light, run
 * round clear of the boundary in a band `width` px wide whose outer edge is `reach` px out — from
 * 2px out to 5px, over where the focus ring is drawn. It is drawn after the control, so it passes
 * over the ring rather than under it, in all three engines — measured. Its tail is the accent a
 * step from the page rather than the accent the ring takes: where the ring is the accent, which is
 * every theme and scheme but Matrix's dark one, the tail was 1.00 to 1.01:1 from the ring in the
 * accent and is 1.35 to 1.86:1 a step from it — measured. A lap takes 2.4s. Under the pointer it
 * runs for as long as the pointer rests and is held where it was when the pointer leaves, so the
 * next pass picks it up there; at the focus, which can rest for minutes, it runs two laps, in the
 * time a loop that settles takes, and fades.
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
 * What a shimmer's sheen and a scan's band are drawn in, the button's: over a surface, the accent
 * at half its strength; over a fill, that fill lifted toward white. Not the colour a fill's label or
 * mark is drawn in, which is black on a light fill, and crossed the button as a shadow.
 */
export const sheen = {
    over: 'rgb(from var(--ui-color-accent) r g b / 0.5)',
    on: (fill: string): string => `oklch(from ${fill} calc(l + 0.35) calc(c * 0.4) h / 0.55)`,
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

/** The shimmer's sweep and the scan's crossing, for every sheet that draws either. */
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

    /** The pointer's layer on a label the pointer rests on, read the same way: in a host with no
     *  focus the reader can see, or round a control without the focus, since the pointer yields
     *  to it, and never on a disabled control. */
    const resting = [`${calm} ${label}`, `${host} ${label}:not(:focus-within)`]
        .map((each) => `${each}:hover:not(:has(> input:disabled))::before`)
        .join(',\n        ');

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

    return String.raw`
/* The control's one list of animations, read from the kinds that animate it, each from a property
   of its own, so none takes another's away: the pointer's border and fill, the focus's border,
   shadow and fill, and an error's border and fill. A ring is added to the glow a theme lights the
   control with rather than drawn in its place: added, a shadow list goes beside the one under it in
   all three engines — measured. The one shadow Chromium loses is that glow: written from
   currentColor, it comes out transparent once added to, where Firefox and WebKit keep it. */
${host} input {
    animation:
        var(--ui-run-pointer, none),
        var(--ui-run-pointer-fill, none),
        var(--ui-run-focus-border, none),
        var(--ui-run-focus-shadow, none),
        var(--ui-run-focus-rest, none),
        var(--ui-run-focus-fill, none),
        var(--ui-run-error-border, none),
        var(--ui-run-error-fill, none);
    animation-composition: add, replace, add, add, add, replace, add, replace;
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
   layout as a flex item, with the label's gap before the control, which it moved 8px — measured. */
${host} ${label} {
    position: relative;
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
    /* border: highlight is what the component does today — the boundary darkens on an empty
       control and the fill deepens on a full one — so it is no rule here. none takes it away, back
       to the colours at rest, and a control in error keeps its red. The boundary's colour is
       derived, so it is read through its formula, as the component reads it: written bare it had
       no value, and the boundary took the accent — measured. */
    @container ${is('hover-border', 'none')} {
        ${host} input:hover:not(:disabled) {
            border-color: ${reference('--ui-color-border')};
        }

        ${host} input${filled}:hover:not(:disabled) {
            background-color: var(--ui-color-accent);
            border-color: var(--ui-color-accent);
        }

        ${host} ${invalid}:hover:not(:disabled) {
            border-color: var(--ui-color-danger);
        }
    }

    /* border: pulse, a ring of the accent leaving the boundary once as the pointer arrives. */
    @container ${is('hover-border', 'pulse')} {
        ${host} input:hover:not(:disabled) {
            --ui-run-pointer: ui-pulse var(--ui-duration-400) var(--ui-easing-enter);
        }
    }

    /* border: orbit, a light run round on the control's boundary, three laps, then it fades. */
    @container ${is('hover-border', 'orbit')} {
        ${host} ${label}::before {${out(0)}
            padding: ${orbit.width}px;
            background: ${orbit.light};
            opacity: 0;
            transition: opacity var(--ui-duration-200) var(--ui-easing-exit);
        }

        ${resting} {
            opacity: 1;
            animation: ${orbit.run};
        }
    }

    /* border: comet, a comet run round clear of the boundary for as long as the pointer rests,
       held where it was when the pointer leaves. */
    @container ${is('hover-border', 'comet')} {
        ${host} ${label}::before {${out(comet.reach)}
            padding: ${comet.width}px;
            background: ${comet.light};
            opacity: 0;
            transition: opacity var(--ui-duration-200) var(--ui-easing-state);
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

    /* movement: zoom, a tenth larger, which on a control this small is under 3px. */
    @container ${is('hover-move', 'zoom')} {
        ${host} input:hover:not(:disabled) {
            scale: 1.1;
        }
    }
}

/* ——— Focus. Every effect keeps the ring, drawn at once, as the component draws it today. ——— */

/* border: pulse, the ring at once and the pointer's pulse out across it, in the ring's colour. */
@container ${is('focus-border', 'pulse')} {
    ${host} input:focus-visible {
        --ui-run-focus-border: ui-pulse-focus var(--ui-duration-400) var(--ui-easing-enter);
    }
}

/* border: orbit, the pointer's, a light run round on the control's boundary, three laps, then it
   fades. */
@container ${is('focus-border', 'orbit')} {
    ${lit}::after {${out(0)}
        padding: ${orbit.width}px;
        background: ${orbit.light};
        animation: ${orbit.run};
    }
}

/* border: comet, the pointer's, run round clear of the boundary and over the ring, two laps, then
   it fades. */
@container ${is('focus-border', 'comet')} {
    ${lit}::after {${out(comet.reach)}
        padding: ${comet.width}px;
        background: ${comet.light};
        animation: ${comet.run};
    }
}

/* border: trace, a line of the accent drawn round once, clockwise from the top, and undrawn the
   same way as the focus leaves. A field draws it inside its boundary; a control this small has its
   mark and its thumb there, so the line runs outside the ring, as far from it as the ring is from
   the boundary and as wide: 2px, from 6px out to 8px. */
@container ${is('focus-border', 'trace')} {
    ${host} ${label}::after {${out(8)}
        padding: 2px;
        background: conic-gradient(var(--ui-color-accent) var(--ui-trace), transparent 0);
        transition: --ui-trace calc(var(--ui-duration-400) * 1.5) var(--ui-easing-move);
    }

    ${lit}::after {
        --ui-trace: 360deg;
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
        --ui-lit-inner:
            inset 0 0 0 1px var(--ui-color-accent),
            inset 0 0 0.375rem rgb(from var(--ui-color-accent) r g b / 0.22);
    }
}

/* neon: a lit line round the boundary and a glow that swells from close round it to a wide halo,
   four times. Its last round ends on its lit line, so it fades from there. */
@container ${is('focus-shadow', 'neon')} {
    ${host} input:focus-visible {
        --ui-run-focus-shadow: ui-neon var(--ui-duration-loop) var(--ui-easing-state)
            var(--ui-iteration-settle) alternate;
        --ui-run-focus-rest: ui-neon-rest var(--ui-duration-200) var(--ui-easing-exit)
            calc(var(--ui-duration-loop) * var(--ui-iteration-settle));
    }
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
        --ui-run-focus-fill: ${shimmer.run};
    }
}

@container ${is('focus-fill', 'scan')} {
    ${host} input:focus-visible::after {${swept('scan', sheen.over)}
    }

    ${host} input${filled}:focus-visible::after {
        background-image: ${scan.image(sheen.on('var(--ui-color-accent)'))};
    }

    ${host} input:focus-visible {
        --ui-run-focus-fill: ${scan.run};
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

/* ——— Invalid. The boundary was already red, and nothing moves: the control stays where the
   reader aimed. Each effect on the control plays a loop that settles, as an error stands for as
   long as the reader leaves it; the message's own play once, but the glitch, which never takes the
   message away. ——— */
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
        --ui-run-error-border: ui-split var(--ui-duration-200) linear var(--ui-iteration-settle);
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
        animation: ui-glitch var(--ui-duration-200) linear var(--ui-iteration-settle);
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
 * The pulse and the neon's rounds, sized for what they light: `small` for a drawn control, 24px
 * across, and `wide` for one the size of a button or larger — the button, a field and a card. The
 * shape and the colours are one; only the reach grows with the control.
 *
 * The neon's line holds through the whole loop, so the trough is lit too: a glow alone, 2px at its
 * lowest, drew next to nothing there on a light page, and the loop read as a faint flicker. In the
 * accent, written out rather than as currentColor: Chromium does not interpolate a shadow whose
 * colour is derived from currentColor, by rgb(from) or color-mix(). It holds the first value to
 * halfway and jumps — measured; Firefox and WebKit interpolate it.
 */
export const sized = {
    small: `${pulse(10)}\n${neon([4, 1, 10, 2], [8, 2, 24, 6])}`,
    wide: `${pulse(12)}\n${neon([6, 1, 16, 3], [12, 3, 40, 10])}`,
} as const;

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

/** The pointer's, focus's and an error's moments, each by kind, with what a click would do said
 *  for the page's own controls. */
export function moments(preview: string): readonly Moment[] {
    return [
        {
            name: 'hover',
            label: 'Pointer over',
            kinds: [
                {
                    name: 'border',
                    label: 'Border',
                    effects: [
                        {
                            name: 'highlight',
                            today: true,
                            says: 'The boundary darkens on an empty control, and the fill deepens on a full one.',
                        },
                        { name: 'none', says: 'The control keeps its colours.' },
                        {
                            name: 'pulse',
                            says: 'A ring of the accent leaves the boundary once as the pointer arrives.',
                        },
                        {
                            name: 'orbit',
                            settles: true,
                            says: 'A light runs round on the boundary, three times, then rests.',
                        },
                        {
                            name: 'comet',
                            loops: true,
                            says: 'A comet of light runs round clear of the boundary, and waits where it was when the pointer leaves.',
                        },
                    ],
                },
                {
                    name: 'shadow',
                    label: 'Shadow',
                    effects: [
                        { name: 'none', today: true, says: 'Nothing round the control.' },
                        { name: 'halo', says: 'A soft band of the accent round the control.' },
                        { name: 'glow', says: 'A light of the accent round the control.' },
                    ],
                },
                {
                    name: 'fill',
                    label: 'Fill',
                    effects: [
                        { name: 'none', today: true, says: 'The control keeps its fill.' },
                        { name: 'preview', says: preview },
                        {
                            name: 'shimmer',
                            loops: true,
                            says: 'A sheen sweeps across, and comes round again.',
                        },
                        {
                            name: 'scan',
                            says: 'Once, as the pointer arrives: a band of light crosses the control, top to bottom.',
                        },
                    ],
                },
                {
                    name: 'move',
                    label: 'Movement',
                    effects: [
                        { name: 'none', today: true, says: 'The control keeps its size.' },
                        { name: 'zoom', says: 'The control a tenth larger.' },
                    ],
                },
            ],
        },
        {
            name: 'focus',
            label: 'Focus',
            kinds: [
                {
                    name: 'border',
                    label: 'Border',
                    effects: [
                        { name: 'none', today: true, says: 'The ring, drawn at once.' },
                        {
                            name: 'pulse',
                            says: 'The ring, then a ring of its colour leaves the boundary once.',
                        },
                        {
                            name: 'orbit',
                            settles: true,
                            says: 'A light runs round on the boundary, three laps, then fades.',
                        },
                        {
                            name: 'comet',
                            settles: true,
                            says: 'A comet runs round clear of the boundary, over the ring, two laps, then fades.',
                        },
                        {
                            name: 'trace',
                            says: 'A line of the accent drawn round once outside the ring, from the top, apart from it.',
                        },
                    ],
                },
                {
                    name: 'shadow',
                    label: 'Shadow',
                    effects: [
                        {
                            name: 'none',
                            today: true,
                            says: 'Nothing round the control but the ring.',
                        },
                        { name: 'halo', says: 'A soft band of the accent round the control.' },
                        { name: 'glow', says: 'A light of the accent held round the control.' },
                        {
                            name: 'inner',
                            says: 'A light of the accent held inside the boundary.',
                        },
                        {
                            name: 'neon',
                            settles: true,
                            says: 'A lit line and a glow that swells to a wide halo, four times, then rests.',
                        },
                    ],
                },
                {
                    name: 'fill',
                    label: 'Fill',
                    effects: [
                        { name: 'none', today: true, says: 'The control keeps its fill.' },
                        {
                            name: 'shimmer',
                            settles: true,
                            says: 'A sheen sweeps across, four times, then rests.',
                        },
                        {
                            name: 'scan',
                            says: 'As the focus arrives, a band of light crosses the control once, top to bottom.',
                        },
                        {
                            name: 'blur',
                            says: 'The page behind the control blurred through the theme’s glass while it has the focus; where there is no glass, nothing changes. Drawn for Glass.',
                        },
                    ],
                },
                {
                    name: 'label',
                    label: 'Label',
                    effects: [
                        { name: 'none', today: true, says: 'The label keeps its colour.' },
                        {
                            name: 'accent',
                            says: 'The label takes the accent, a fifth of the way to the text’s colour, while the control has the focus.',
                        },
                        {
                            name: 'glow',
                            says: 'A light of the accent round the label while the control has the focus.',
                        },
                    ],
                },
            ],
        },
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
                            says: 'The boundary splits into two colours where it is, four times, then rests. Drawn for Matrix.',
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
                            says: 'The message jumps and splits into two colours, four times, then rests. Drawn for Matrix.',
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

/**
 * What a field can do, shared by the input's page and the select's — `ui-input`, `ui-textarea` and
 * `ui-select`: what the pointer, focus and an error can do, each by the kind of change it makes, as
 * the button's are. The components draw the box alike, the select's written to match the input's,
 * so each effect is drawn alike on all three. A field is where the reference measured motion
 * getting in the way, so nothing here moves the control: the effects change its boundary, what is
 * round it, its fill, its label and its message.
 *
 * Each kind draws on a layer of its own, so effects of different kinds draw at once: the control's
 * boundary, shadow and fill; the box round the control, whose `::after` the focus's border draws
 * on and whose `::before` an error's does, and the pointer's band on a field with no error; the
 * label; and the message. Three kinds animate the control itself, so each writes its animations
 * into a property of its own and the control's one list reads all three, which none can then take
 * from another.
 */
import { reference } from '../../../src/reference.js';
import {
    aside,
    centres,
    comet,
    edge,
    enters,
    far,
    flights,
    flooded,
    floods,
    focal,
    glass,
    keyframes,
    lights,
    line,
    moves,
    orbit,
    rainbow,
    ringRules,
    ripple,
    scan,
    sheen,
    shimmer,
    sized,
    spotlit,
    thrown,
    tinted,
    trace,
    waves,
} from './controls.js';
import { focus, hover } from './moments.js';
import { inner, queries, type Moment, type Refusal } from './motion.js';

/** One page's fields, as the sheet draws on them. */
export interface Fields {
    /** The controls the elements render: `input` and `textarea`, or `select`. */
    readonly controls: readonly string[];
    /** What a control the pointer can change is besides being under it, as the component writes
     *  its own darkening. */
    readonly able: string;
    /** What a control already paints in its background, which a sweep's light goes in front of. */
    readonly behind?: Behind;
}

/** What a control paints in its background, as its component writes it. */
export interface Behind {
    /** The controls that paint it. */
    readonly where: string;
    readonly image: string;
    readonly size: string;
    /** Where it sits, and where it sits in a control whose direction is right to left. */
    readonly position: string;
    readonly mirrored: string;
}

/** The control's surface, which a tint is mixed into. */
const surface = reference('--ui-color-surface-control').cssText;

/** The box round the control, edge for edge, drawn on by a border's effects. */
const round = String.raw`
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        pointer-events: none;`;

/** The band a border's light runs in, its mask leaving only the band. */
const band = String.raw`
        content: '';
        position: absolute;
        mask:
            linear-gradient(#000 0 0) content-box exclude,
            linear-gradient(#000 0 0);
        pointer-events: none;`;

/** The orbit's band, on the boundary from its outer edge in. */
const onEdge = String.raw`${band}
        inset: 0;
        padding: ${orbit.width}px;
        border-radius: inherit;
        background: ${orbit.light};`;

/** The trace's band, the orbit's. */
const traced = String.raw`${band}
        inset: 0;
        padding: ${trace.width}px;
        border-radius: inherit;
        background: ${trace.light};
        transition: ${trace.transition};`;

/** The rainbow's band, the trace's, whole, in the trace's colour turned round the hue wheel. */
const turning = String.raw`${band}
        inset: 0;
        padding: ${trace.width}px;
        border-radius: inherit;
        background: ${rainbow.colour(`var(--ui-band-ink, ${far})`)};`;

/** The comet's band, clear of the boundary. */
const clear = String.raw`${band}
        inset: -${comet.reach}px;
        padding: ${comet.width}px;
        border-radius: calc(var(--ui-radius) + ${comet.reach}px);
        background: ${comet.light};`;

/**
 * The sheet as one element carries it, under the name it asks for its tastes by: the input's
 * `--ui-taste-input-<moment>`, the textarea's `--ui-taste-textarea-<moment>`, the select's
 * `--ui-taste-select-<moment>`.
 */
export function sheet({ controls, able, behind }: Fields, name: string): string {
    /** The query each effect is drawn under: the consumer's choice, else the theme's taste. */
    const is = queries(name);

    /** A control the pointer can change, under it. */
    const pointed = `:hover${able}`;

    /** The controls, as the elements render them, in one state. */
    const both = (state: string): string =>
        controls.map((control) => `${control}${state}`).join(', ');

    /** What a pointer's shadow and fill are drawn on: a field without the focus, which they
     *  yield to, since in a field the focus is where the reader is acting. */
    const unfocused = `${pointed}:not(:focus-visible)`;

    /** The layer the pointer's band is drawn on, the one an error's border draws on, which it
     *  has while the field is not in error; and that layer round a field the pointer rests on. */
    const free = ".glow:not(:has(> [aria-invalid='true']))::before";
    const resting = `.glow:has(> ${unfocused}:not([aria-invalid='true']))::before`;

    /** A shimmer's sheen or a scan's band on the controls in one state: the first of their
     *  backgrounds, and in front of what a control already paints behind it, both ways round. The
     *  light moves through a property of its own, so what is behind it stays where it is. */
    const swept = (state: string, sweep: 'shimmer' | 'scan'): string => {
        const { image, size, position } = sweep === 'shimmer' ? shimmer : scan;
        const light = image(sheen.over);
        const before =
            behind === undefined
                ? ''
                : String.raw`

    ${behind.where}${state} {
        background-image: ${light}, ${behind.image};
        background-size: ${size}, ${behind.size};
        background-position: ${position}, ${behind.position};
    }

    ${behind.where}${state}:dir(rtl) {
        background-position: ${position}, ${behind.mirrored};
    }`;

        return String.raw`
    ${both(state)} {
        background-image: ${light};
        background-size: ${size};
        background-repeat: no-repeat;
        background-position: ${position};
    }${before}`;
    };

    /** A picture over the whole of the controls in one state, in front of what a control already
     *  paints behind it, both ways round. */
    const over = (state: string, image: string): string => {
        const before =
            behind === undefined
                ? ''
                : String.raw`

    ${behind.where}${state} {
        background-image: ${image}, ${behind.image};
        background-size: 100% 100%, ${behind.size};
        background-repeat: no-repeat;
        background-position: 0 0, ${behind.position};
    }

    ${behind.where}${state}:dir(rtl) {
        background-position: 0 0, ${behind.mirrored};
    }`;

        return String.raw`
    ${both(state)} {
        background-image: ${image};
    }${before}`;
    };

    return String.raw`
/* The box round the control is what the focus's border and an error's are laid out against, and
   what a circle the pointer or the focus throws is drawn under the control in: isolated, so one
   drawn under it stays over what is round the field instead of going behind it. It is what a
   movement moves, the control and its borders with it, and the label and the message stay where
   they are. A field is three buttons wide, so its beat, its stretch and its swell go a quarter of
   the button's way, and its zoom and its tilt are the card's. */
.glow {
    position: relative;
    isolation: isolate;
    --ui-give: 0.25;
    transition-property: translate, scale, transform;
    transition-duration: var(--ui-duration-200), var(--ui-duration-200), var(--ui-duration-100);
    transition-timing-function: var(--ui-easing-enter), var(--ui-easing-enter), linear;
}

/* The control's transitions, for what the kinds change on it, and its one list of animations,
   read from the six kinds that animate it: the pointer's fill, the shadow, which the pointer's
   and the focus's take in turn, the focus's fill, an error's fill and its border, and the focus's
   ring. The focus's play under their own names, so its arrival starts them where the pointer's
   played the same. */
${both('')} {
    transition-property: border-color, box-shadow, background-color, backdrop-filter;
    transition-duration: ${reference('--ui-duration-state')}, var(--ui-duration-200), var(--ui-duration-200), var(--ui-duration-200);
    transition-timing-function: var(--ui-easing-state), var(--ui-easing-enter), var(--ui-easing-enter), var(--ui-easing-enter);
    animation: var(--ui-run-hover, none), var(--ui-run-shadow, none), var(--ui-run-fill, none), var(--ui-run-error, none), var(--ui-run-error-border, none), var(--ui-run-ring, none);
}

/* hover-move: the field moved under the pointer, never while it has the focus, which the reader
   types at. lift, the button's two pixels, and zoom, the card's three hundredths; breathe, which
   comes round for as long as the pointer rests; heartbeat, rubber and glitch, once, as it
   arrives. magnetic and tilt follow the pointer as it nears, the button's few pixels and the
   card's few degrees. */
@media (hover: hover) {
    @container ${is('hover-move', 'lift')} {
        .glow:has(> ${unfocused}) {
            translate: 0 -2px;
        }
    }

    @container ${is('hover-move', 'zoom')} {
        .glow:has(> ${unfocused}) {
            scale: 1.03;
        }
    }

    @container ${is('hover-move', 'breathe')} {
        .glow:has(> ${unfocused}) {
            animation: ui-breathe var(--ui-duration-loop) var(--ui-easing-state)
                var(--ui-iteration-loop) alternate;
        }
    }

    @container ${is('hover-move', 'heartbeat')} {
        .glow:has(> ${unfocused}) {
            animation: ui-heartbeat var(--ui-duration-300) var(--ui-easing-state);
        }
    }

    @container ${is('hover-move', 'rubber')} {
        .glow:has(> ${unfocused}) {
            animation: ui-rubber var(--ui-duration-400) linear;
        }
    }

    @container ${is('hover-move', 'glitch')} {
        .glow:has(> ${unfocused}) {
            animation: ui-glitch var(--ui-duration-200) linear;
        }
    }

    @container ${is('hover-move', 'magnetic')} {
        .glow:has(> ${able}:not(:focus-visible)) {
            translate: calc(var(--ui-pointer-nx) * var(--ui-pointer-near) * 6px)
                calc(var(--ui-pointer-ny) * var(--ui-pointer-near) * 4px);
        }
    }

    @container ${is('hover-move', 'tilt')} {
        .glow:has(> ${able}:not(:focus-visible)) {
            transform: perspective(60rem)
                rotateX(calc(var(--ui-pointer-ny) * var(--ui-pointer-near) * -5deg))
                rotateY(calc(var(--ui-pointer-nx) * var(--ui-pointer-near) * 5deg));
        }
    }
}

/* hover-fill: flood, the card's: the tint spreads from where the pointer came in, and drains toward
   where it leaves, so its circle is there at rest, empty. Its centre glides only where the script
   finds the circle showing, as the card's does. At the focus, from the middle, which the focus's
   arrival publishes, and back to it. */
@container ${is('hover-fill', 'flood')} or ${is('focus-fill', 'flood')} {${over('', flooded(tinted(surface)))}

    ${both('')} {
        transition-property: border-color, box-shadow, background-color, backdrop-filter, --ui-flood;
        transition-duration: ${reference('--ui-duration-state')}, var(--ui-duration-200), var(--ui-duration-200), var(--ui-duration-200), var(--ui-duration-400);
        transition-timing-function: var(--ui-easing-state), var(--ui-easing-enter), var(--ui-easing-enter), var(--ui-easing-enter), var(--ui-easing-move);
    }

    ${both('[data-gliding]')} {
        transition-property: border-color, box-shadow, background-color, backdrop-filter, --ui-flood,
            --ui-flood-x, --ui-flood-y;
        transition-duration: ${reference('--ui-duration-state')}, var(--ui-duration-200), var(--ui-duration-200), var(--ui-duration-200), var(--ui-duration-400), var(--ui-duration-400), var(--ui-duration-400);
        transition-timing-function: var(--ui-easing-state), var(--ui-easing-enter), var(--ui-easing-enter), var(--ui-easing-enter), var(--ui-easing-move), var(--ui-easing-move), var(--ui-easing-move);
    }

}

@container ${is('hover-fill', 'flood')} {
    @media (hover: hover) {
        ${both(unfocused)} {
            --ui-flood: 1;
        }
    }
}

@container ${is('focus-fill', 'flood')} {
    ${both(':focus-visible')} {
        --ui-flood: 1;
    }
}

/* ——— The pointer, where there is one that hovers: a tap leaves :hover on what it touched. ——— */
@media (hover: hover) {
    /* border: none takes today's darkening away, and accent puts the accent in its place. A field
       in error keeps its red under either, which today's darkening covers. Like every effect of the
       pointer's, on a field without the focus, which they yield to. */
    @container ${is('hover-border', 'none')} {
        ${both(unfocused)} {
            border-color: ${reference('--ui-color-border')};
        }
    }

    @container ${is('hover-border', 'accent')} {
        ${both(unfocused)} {
            border-color: var(--ui-color-accent);
        }
    }

    @container ${is('hover-border', 'none')} or ${is('hover-border', 'accent')} {
        ${both(`[aria-invalid='true']${unfocused}`)} {
            border-color: var(--ui-color-danger);
        }
    }

    /* orbit and comet, the drawn controls': a light run round on the boundary, three laps, then it
       fades, or a comet run round clear of it for as long as the pointer rests, held where it was
       when the pointer leaves. On the layer an error's border draws on, which the pointer leaves
       to a field in error. Shown through a property of its own rather than through the opacity,
       which the error's layer holds at full: eased, the opacity ran down from there each time an
       error was taken away, the band drawn where it stood, in all three engines — measured. */
    @container ${is('hover-border', 'orbit')} {
        ${free} {${onEdge}
            opacity: var(--ui-shown);
            transition: --ui-shown var(--ui-duration-200) var(--ui-easing-exit);
        }

        ${resting} {
            --ui-shown: 1;
            animation: ${orbit.run};
        }
    }

    @container ${is('hover-border', 'comet')} {
        ${free} {${clear}
            opacity: var(--ui-shown);
            transition: --ui-shown var(--ui-duration-200) var(--ui-easing-state);
            animation: ${comet.loop};
        }

        ${resting} {
            --ui-shown: 1;
            animation-play-state: running;
        }
    }

    /* trace, the card's: the boundary drawn round once, from the top, on the orbit's band, and
       undrawn the same way as the pointer leaves. On the same layer, and yielding as the bands do. */
    @container ${is('hover-border', 'trace')} {
        ${free} {${traced}
        }

        ${resting} {
            --ui-trace: 360deg;
        }
    }

    /* rainbow, the button's: the trace's band, whole, its colour turned round the hue wheel for as
       long as the pointer rests, and the field's fill and text as they were. On the same layer,
       shown as the orbit is. */
    @container ${is('hover-border', 'rainbow')} {
        ${free} {${turning}
            opacity: var(--ui-shown);
            transition: --ui-shown ${reference('--ui-duration-state')} ${reference('--ui-easing-state')};
        }

        ${resting} {
            --ui-shown: 1;
            animation: ${rainbow.loop};
        }
    }

    /* edge, the card's: the band lit where the pointer is nearest, from where the pointer is in the
       box round the control, which the pointer engine writes on that box. On the same layer, on a
       field the pointer can change, and yielding to an error and to the focus as the bands do. */
    @container ${is('hover-border', 'edge')} {
        ${free} {${band}
            inset: 0;
            padding: ${edge.width}px;
            border-radius: inherit;
            background: ${edge.light};
            opacity: 0;
        }

        .glow:has(> :is(${controls.join(', ')})${able}:not(:focus-visible):not([aria-invalid='true']))::before {
            opacity: var(--ui-pointer-near);
        }
    }

    /* pulse, the button's and the drawn controls': a ring of the accent leaving the boundary once
       as the pointer arrives, on the same layer, and yielding as the bands do. */
    @container ${is('hover-border', 'pulse')} {
        ${free} {${round}
        }

        ${resting} {
            animation: ui-pulse var(--ui-duration-400) var(--ui-easing-enter);
        }
    }

    /* underline and sweep, the focus's: a line of the accent along the bottom edge, drawn out from
       the middle or from where the text starts, on the same layer, and yielding as the bands do. */
    @container ${is('hover-border', 'underline')} or ${is('hover-border', 'sweep')} {
        ${free} {
            content: '';
            position: absolute;${line.drawn}
            pointer-events: none;
            clip-path: ${line.underline};
            transition: ${line.transition};
        }

        ${resting} {
            clip-path: inset(0);
        }
    }

    @container ${is('hover-border', 'sweep')} {
        ${free} {
            clip-path: ${line.sweep};
        }

        .glow:dir(rtl):not(:has(> [aria-invalid='true']))::before {
            clip-path: ${line.mirrored};
        }
    }

    /* explode, the button's: one ring thrown out from the boundary once as the pointer arrives. */
    @container ${is('hover-border', 'explode')} {
        ${free} {${round}
            color: var(--ui-color-accent);
        }

        ${resting} {${thrown.explode}
        }
    }

    @container ${is('hover-shadow', 'halo')} {
        ${both(unfocused)} {
            box-shadow: ${lights.halo};
        }
    }

    @container ${is('hover-shadow', 'glow')} {
        ${both(unfocused)} {
            box-shadow: ${lights.glow};
        }
    }

    /* highlight, the glow a theme gives the pointer, where it gives one, the button's: on the box
       round the control, where the theme lights the field at rest, in the accent or the danger in
       error. On the control, whose own colour is its text, Matrix's came out in the text's dark
       green, over the ring at rest, where the button's and the checkbox's are the accent's —
       measured. raise, sink and inner, the button's and the focus's; neon and breathe, which come
       round for as long as the pointer rests, on the shadow's own animation, which the focus's runs
       on where the pointer yields to it; and burst, once, as the pointer arrives. */
    @container ${is('hover-shadow', 'highlight')} {
        .glow:has(> ${unfocused}) {
            box-shadow: ${reference('--ui-elevation-control-hover')};
        }
    }

    @container ${is('hover-shadow', 'raise')} {
        ${both(unfocused)} {
            box-shadow: ${lights.raise};
        }
    }

    @container ${is('hover-shadow', 'sink')} {
        ${both(unfocused)} {
            box-shadow: ${lights.sink};
        }
    }

    @container ${is('hover-shadow', 'inner')} {
        ${both(unfocused)} {
            box-shadow: ${lights.inner('0.75rem', '0.125rem')};
        }
    }

    @container ${is('hover-shadow', 'neon')} {
        ${both(unfocused)} {
            --ui-run-shadow: ui-neon var(--ui-duration-loop) var(--ui-easing-state)
                var(--ui-iteration-loop) alternate;
        }
    }

    @container ${is('hover-shadow', 'breathe')} {
        ${both(unfocused)} {
            box-shadow: ${lights.breath('var(--ui-color-accent)', '15px')};
            --ui-run-shadow: ui-breathe-glow var(--ui-duration-loop) var(--ui-easing-state)
                var(--ui-iteration-loop) alternate;
        }
    }

    @container ${is('hover-shadow', 'burst')} {
        ${both(unfocused)} {
            --ui-run-shadow: ui-burst var(--ui-duration-400) var(--ui-easing-enter);
        }
    }

    /* cast, the card's at half its size, from where the pointer is in the box round the control,
       as strong as it is near, whether it is over the field or not, as the card's is. */
    @container ${is('hover-shadow', 'cast')} {
        ${both(`${able}:not(:focus-visible)`)} {
            box-shadow: ${lights.cast(0.5, 'var(--ui-pointer-near)')};
        }
    }

    /* label: accent and glow, the focus's, under the pointer, and yielding to the focus. */
    @container ${is('hover-label', 'accent')} {
        label {
            transition: color var(--ui-duration-200) var(--ui-easing-state);
        }

        label:has(+ .glow > ${unfocused}) {
            color: color-mix(in oklab, var(--ui-color-accent) 80%, var(--ui-color-text));
        }
    }

    @container ${is('hover-label', 'glow')} {
        label {
            transition: text-shadow var(--ui-duration-200) var(--ui-easing-state);
        }

        label:has(+ .glow > ${unfocused}) {
            text-shadow: 0 0 0.5rem rgb(from var(--ui-color-accent) r g b / 0.7);
        }
    }

    /* tint, the card's, a little of the accent in the field's fill, as at the focus. */
    @container ${is('hover-fill', 'tint')} {
        ${both(unfocused)} {
            background-color: ${tinted(surface)};
        }
    }

    /* spotlight, the card's: the tint where the pointer is, from where it is in the box round the
       control, which the pointer engine writes there. The field's lights are its tint, as the
       card's are: drawn in the text's colour, as a button's are in its label's, a light took the
       placeholder under 4.5:1 where it fell — measured. */
    @container ${is('hover-fill', 'spotlight')} {${over(unfocused, spotlit(tinted(surface, 'var(--ui-pointer-near)')))}
    }

    /* ripple, the button's, in the tint: once, as the pointer arrives, a circle from where it came
       in. */
    @container ${is('hover-fill', 'ripple')} {${over(unfocused, ripple.image(tinted(surface, 'var(--ui-ripple-alpha)')))}

        ${both(unfocused)} {
            --ui-run-hover: ${ripple.run};
        }
    }

    /* blur, the focus's: the page behind the field through the theme's glass, under the pointer. */
    @container ${is('hover-fill', 'blur')} {
        ${both(unfocused)} {
            backdrop-filter: ${glass};
        }
    }

    /* shimmer and scan, the button's: a sheen swept across for as long as the pointer rests, or a
       band crossing down once as it arrives. Both yield to the focus, as the shadow's do. */
    @container ${is('hover-fill', 'shimmer')} {${swept(unfocused, 'shimmer')}

        ${both(unfocused)} {
            --ui-run-hover: ${shimmer.loop};
        }
    }

    @container ${is('hover-fill', 'scan')} {${swept(unfocused, 'scan')}

        ${both(unfocused)} {
            --ui-run-hover: ${scan.run};
        }
    }
}

/* The circles the pointer and the focus throw, the button's, each while one plays: the pointer's on
   its layer, round a field without the focus or an error, and the focus's on its own. */
.glow[data-pointer-border]:not(:has(> :focus-visible)):not(:has(> [aria-invalid='true']))::before,
.glow[data-focus-border]::after {${round}${thrown.dot}
    color: var(--ui-color-accent);
}

.glow[data-pointer-border='shockwave']:not(:has(> :focus-visible)):not(:has(> [aria-invalid='true']))::before,
.glow[data-focus-border='shockwave']::after {${thrown.shockwave}
}

.glow[data-pointer-border='bloom']:not(:has(> :focus-visible)):not(:has(> [aria-invalid='true']))::before,
.glow[data-focus-border='bloom']::after {${thrown.bloom}
}

/* ——— Focus. Every effect keeps the ring, drawn at once, as the component draws it today. ——— */

/* The focus wins: a field the focus is on is drawn as the focus chose, and the pointer resting on
   it changes nothing, what the component does today under it included — the boundary's darkening,
   back to the boundary at rest, and red on a field in error. As specific as that darkening and
   after it, as the focus's own borders are. */
${both(":focus-visible:not(:disabled):not([aria-invalid='true'])")} {
    border-color: ${reference('--ui-color-border')};
}

${both(":focus-visible:not(:disabled)[aria-invalid='true']")} {
    border-color: var(--ui-color-danger);
}

/* border: accent, the boundary in the accent inside the ring, and red still on a field in error.
   As specific as the component's darkening under the pointer, and after it, so a focused field
   keeps its accent under the pointer. highlight is that darkening, held at the focus. */
@container ${is('focus-border', 'accent')} {
    ${both(":focus-visible:not(:disabled):not([aria-invalid='true'])")} {
        border-color: var(--ui-color-accent);
    }
}

@container ${is('focus-border', 'highlight')} {
    ${both(":focus-visible:not(:disabled):not([aria-invalid='true'])")} {
        border-color: ${reference('--ui-color-text')};
    }
}

/* underline and sweep: a line of the accent along the bottom edge, drawn out from the middle, or
   from where the text starts. */
@container ${is('focus-border', 'underline')} or ${is('focus-border', 'sweep')} {
    .glow::after {
        content: '';
        position: absolute;${line.drawn}
        pointer-events: none;
        clip-path: ${line.underline};
        transition: ${line.transition};
    }

    .glow:has(> :focus-visible)::after {
        clip-path: inset(0);
    }
}

@container ${is('focus-border', 'sweep')} {
    .glow::after {
        clip-path: ${line.sweep};
    }

    .glow:dir(rtl)::after {
        clip-path: ${line.mirrored};
    }
}

/* explode, the pointer's, as the focus arrives, out past the ring. */
@container ${is('focus-border', 'explode')} {
    .glow::after {${round}
        color: var(--ui-color-accent);
    }

    .glow:has(> :focus-visible)::after {${thrown.explode}
    }
}

/* trace, the pointer's: the boundary drawn round once inside the ring, from the top, and undrawn
   the same way as the focus leaves. On the boundary and into the field, never out of it: drawn
   across the boundary from 2px out to 1px in, the line filled the gap the ring keeps, and the ring,
   the line and the boundary ran together as one line 5px wide, in every theme — measured. */
@container ${is('focus-border', 'trace')} {
    .glow::after {${traced}
    }

    .glow:has(> :focus-visible)::after {
        --ui-trace: 360deg;
    }
}

/* rainbow, the pointer's, faded in, twice round, and at rest in the trace's colour. Not on a field
   in error, whose boundary stays red, as the accent leaves it. */
@container ${is('focus-border', 'rainbow')} {
    .glow::after {${turning}
        opacity: 0;
        transition: opacity var(--ui-duration-200) var(--ui-easing-enter);
    }

    .glow:has(> :focus-visible:not([aria-invalid='true']))::after {
        opacity: 1;
        animation: ${focal.run(rainbow.run)};
    }
}

/* edge, the pointer's: the band lit as a pointer in the middle of the field would light it, faded
   in. */
@container ${is('focus-border', 'edge')} {
    .glow::after {${band}
        inset: 0;
        padding: ${edge.width}px;
        border-radius: inherit;
        background: ${edge.middle};
        opacity: 0;
        transition: opacity var(--ui-duration-200) var(--ui-easing-enter);
    }

    .glow:has(> :focus-visible)::after {
        opacity: 1;
    }
}

/* Where the pointer and the focus both chose a line that holds, it is drawn once, on the focus's
   layer, for either, so a line the pointer drew stays drawn as the focus arrives, rather than being
   undrawn on one layer while it is drawn again on the other. Under the pointer it stays off a
   field in error, as on its own layer, which is the error's. */
@media (hover: hover) {
    @container ${is('hover-border', 'trace')} and ${is('focus-border', 'trace')} {
        .glow:has(> ${unfocused}:not([aria-invalid='true']))::after {
            --ui-trace: 360deg;
        }

        ${free} {
            visibility: hidden;
        }
    }

    @container (${is('hover-border', 'underline')} and ${is('focus-border', 'underline')}) or
        (${is('hover-border', 'sweep')} and ${is('focus-border', 'sweep')}) {
        .glow:has(> ${unfocused}:not([aria-invalid='true']))::after {
            clip-path: inset(0);
        }

        ${free} {
            visibility: hidden;
        }
    }
}

/* pulse: the ring at once, then the pointer's pulse out across it in the ring's colour, as the
   drawn controls' is. */
@container ${is('focus-border', 'pulse')} {
    .glow::after {${round}
    }

    .glow:has(> :focus-visible)::after {
        animation: ui-pulse-focus var(--ui-duration-400) var(--ui-easing-enter);
    }
}

/* orbit and comet, the pointer's: a light run round on the boundary, three laps, or a comet run
   round clear of it and over the ring, two laps, and then either fades. */
@container ${is('focus-border', 'orbit')} {
    .glow::after {${onEdge}
        opacity: 0;
    }

    .glow:has(> :focus-visible)::after {
        opacity: 1;
        animation: ${orbit.run};
    }
}

@container ${is('focus-border', 'comet')} {
    .glow::after {${clear}
        opacity: 0;
    }

    .glow:has(> :focus-visible)::after {
        opacity: 1;
        animation: ${comet.run};
    }
}

@container ${is('focus-shadow', 'halo')} {
    ${both(':focus-visible')} {
        box-shadow: ${lights.halo};
    }
}

@container ${is('focus-shadow', 'glow')} {
    ${both(':focus-visible')} {
        box-shadow: ${lights.glow};
    }
}

/* inner: lit from inside the boundary rather than round it. */
@container ${is('focus-shadow', 'inner')} {
    ${both(':focus-visible')} {
        box-shadow: ${lights.inner('0.75rem', '0.125rem')};
    }
}

/* highlight, raise and sink, the pointer's, while the focus stays; breathe, four rounds and then
   at rest, and burst, once, as the focus arrives. */
@container ${is('focus-shadow', 'highlight')} {
    .glow:has(> :focus-visible) {
        box-shadow: ${reference('--ui-elevation-control-hover')};
    }
}

@container ${is('focus-shadow', 'raise')} {
    ${both(':focus-visible')} {
        box-shadow: ${lights.raise};
    }
}

@container ${is('focus-shadow', 'sink')} {
    ${both(':focus-visible')} {
        box-shadow: ${lights.sink};
    }
}

@container ${is('focus-shadow', 'breathe')} {
    ${both(':focus-visible')} {
        box-shadow: ${lights.breath('var(--ui-color-accent)', '15px')};
        --ui-run-shadow: ${focal.run('ui-breathe-glow var(--ui-duration-loop) var(--ui-easing-state) var(--ui-iteration-settle) alternate')};
    }
}

@container ${is('focus-shadow', 'burst')} {
    ${both(':focus-visible')} {
        --ui-run-shadow: ${focal.run('ui-burst var(--ui-duration-400) var(--ui-easing-enter)')};
    }
}

/* neon: the drawn controls' — a lit line and a glow that swells to a wide halo, four times, and
   from its last round, which ends on the lit line, a fade to nothing. */
@container ${is('focus-shadow', 'neon')} {
    ${both(':focus-visible')} {
        --ui-run-shadow: ${focal.run('ui-neon var(--ui-duration-loop) var(--ui-easing-state) var(--ui-iteration-settle) alternate, ui-neon-rest var(--ui-duration-200) var(--ui-easing-exit) calc(var(--ui-duration-loop) * var(--ui-iteration-settle))')};
    }
}

@container ${is('focus-fill', 'tint')} {
    ${both(':focus-visible')} {
        background-color: ${tinted(surface)};
    }
}

/* spotlight, the pointer's: the tint lit round the middle, as a focus has no point to come in
   at. */
@container ${is('focus-fill', 'spotlight')} {${over(':focus-visible', spotlit(tinted(surface), '50% 50%'))}
}

/* ripple, the pointer's, as the focus arrives, from the middle. */
@container ${is('focus-fill', 'ripple')} {${over(':focus-visible', ripple.image(tinted(surface, 'var(--ui-ripple-alpha)'), '50% 50%'))}

    ${both(':focus-visible')} {
        --ui-run-fill: ${focal.run(ripple.run)};
    }
}

/* shimmer and scan, the pointer's, as the focus arrives: four sweeps and then at rest, or a band
   crossing down once. In front of the select's caret, which stays where it is. */
@container ${is('focus-fill', 'shimmer')} {${swept(':focus-visible', 'shimmer')}

    ${both(':focus-visible')} {
        --ui-run-fill: ${focal.run(shimmer.run)};
    }
}

@container ${is('focus-fill', 'scan')} {${swept(':focus-visible', 'scan')}

    ${both(':focus-visible')} {
        --ui-run-fill: ${focal.run(scan.run)};
    }
}

/* blur: the page behind the field blurred through the theme's glass while it has the focus. Only
   Glass lets the page through a field, so only Glass has anything to blur; where there is no
   glass, nothing changes. Drawn for Glass. */
@container ${is('focus-fill', 'blur')} {
    ${both(':focus-visible')} {
        backdrop-filter: ${glass};
    }
}

/* focus-move: lift and zoom while the focus stays, and heartbeat, rubber and glitch, once, as it
   arrives: what moves the field while the reader types at it is left out. */
@container ${is('focus-move', 'lift')} {
    .glow:has(> :focus-visible) {
        translate: 0 -2px;
    }
}

@container ${is('focus-move', 'zoom')} {
    .glow:has(> :focus-visible) {
        scale: 1.03;
    }
}

@container ${is('focus-move', 'heartbeat')} {
    .glow:has(> :focus-visible) {
        animation: ${focal.run('ui-heartbeat var(--ui-duration-300) var(--ui-easing-state)')};
    }
}

@container ${is('focus-move', 'rubber')} {
    .glow:has(> :focus-visible) {
        animation: ${focal.run('ui-rubber var(--ui-duration-400) linear')};
    }
}

@container ${is('focus-move', 'glitch')} {
    .glow:has(> :focus-visible) {
        animation: ${focal.run('ui-glitch var(--ui-duration-200) linear')};
    }
}

/* accent: the label in the accent, a fifth of the way to the text's colour, so it still reads as a
   label: the accent alone was 4.31:1 on Matrix's light page and on Glass's dark one, under the
   4.5:1 text clears, and a fifth of the text took every theme and scheme to 5.4:1 or more —
   measured. */
@container ${is('focus-label', 'accent')} {
    label {
        transition: color var(--ui-duration-200) var(--ui-easing-state);
    }

    label:has(+ .glow > :focus-visible) {
        color: color-mix(in oklab, var(--ui-color-accent) 80%, var(--ui-color-text));
    }
}

@container ${is('focus-label', 'glow')} {
    label {
        transition: text-shadow var(--ui-duration-200) var(--ui-easing-state);
    }

    label:has(+ .glow > :focus-visible) {
        text-shadow: 0 0 0.5rem rgb(from var(--ui-color-accent) r g b / 0.7);
    }
}

/* ——— Invalid, after the focus, so an error's fill is drawn over a focus's. The boundary was
   already red, and the field never moves: the reference's shake took it from where the reader
   aimed, so the shake here is the boundary's, where it is. Each effect on the field plays a loop
   that settles, as an error stands for as long as the reader leaves it, but the shake, which plays
   once, as the reference's did; the message's own play once, but the glitch, which never takes the
   message away. The split's and the glitch's rounds are about half the pulse's and the flash's, so
   they play twice as many and end close to them, as the drawn controls' do. ——— */
@container ${is('invalid-border', 'pulse')} or ${is('invalid-border', 'glow')} or
    ${is('invalid-border', 'split')} or ${is('invalid-border', 'shake')} {
    .glow::before {${round}
    }
}

@container ${is('invalid-border', 'pulse')} {
    .glow:has(> [aria-invalid='true'])::before {
        animation: ui-pulse-danger var(--ui-duration-400) var(--ui-easing-enter)
            var(--ui-iteration-settle);
    }
}

@container ${is('invalid-border', 'glow')} {
    .glow:has(> [aria-invalid='true']:not(:disabled))::before {
        box-shadow: ${lights.danger};
    }
}

/* split: the boundary split into the danger and the info where it is, as the drawn controls'
   glitch splits theirs. */
@container ${is('invalid-border', 'split')} {
    .glow:has(> [aria-invalid='true'])::before {
        animation: ui-split var(--ui-duration-200) linear calc(var(--ui-iteration-settle) * 2);
    }
}

/* shake: the boundary shaken a pixel or three each way, in the half second the reference's shake
   took, on the layer an error's border draws on, over the boundary; the field's own is clear for as
   long, so the line that moves is the only one there, and at rest the two lie one over the other. */
@container ${is('invalid-border', 'shake')} {
    ${both("[aria-invalid='true']")} {
        --ui-run-error-border: ui-clear var(--ui-duration-400);
    }

    .glow:has(> [aria-invalid='true'])::before {
        box-shadow: inset 0 0 0 1px var(--ui-color-danger);
        animation: ui-shake var(--ui-duration-400) steps(1, end);
    }
}

/* flash: from a fifth of the danger mixed into the surface, which the keyframes say why. */
@container ${is('invalid-fill', 'flash')} {
    ${both("[aria-invalid='true']")} {
        --ui-run-error: ui-flash var(--ui-duration-400) var(--ui-easing-exit)
            var(--ui-iteration-settle);
    }
}

@container ${is('invalid-fill', 'tint')} {
    ${both("[aria-invalid='true']")} {
        background-color: color-mix(in oklab, var(--ui-color-danger) 6%, ${surface});
    }
}

@container ${is('invalid-message', 'fade')} {
    .error {
        animation: ui-fade var(--ui-duration-200) var(--ui-easing-enter);
    }
}

@container ${is('invalid-message', 'drop')} {
    .error {
        animation: ui-drop var(--ui-duration-300) var(--ui-easing-emphasis);
    }
}

/* type: the message typed out from its start, a mask stepped across it a character's width at a
   time, as the drawn controls' is. */
@container ${is('invalid-message', 'type')} {
    .error {
        mask-image: linear-gradient(to right, #000 var(--ui-typed), transparent 0);
        animation: ui-type calc(var(--ui-duration-400) * 2) steps(40, end);
    }
}

@container ${is('invalid-message', 'glitch')} {
    .error {
        animation: ui-glitch var(--ui-duration-200) linear calc(var(--ui-iteration-settle) * 2);
    }
}

${ringRules(
    both(':focus-visible'),
    is,
    reference('--ui-color-focus').cssText,
    (query, run) => String.raw`@container ${query} {
    ${both(':focus-visible')} {
        --ui-run-ring: ${run};
    }
}`,
)}

${keyframes}

${moves}

${sized.wide}

${focal.frames(keyframes + moves + sized.wide)}
`;
}

/** The control a field renders. */
const control = (host: HTMLElement): HTMLElement | null => inner(host, 'input, textarea, select');

/** Why a field leaves the flips out: they turn its text away from the reader for half their run,
 *  as the reader aims at it or types in it. */
const turned =
    'it turns the field’s text away from the reader for half its run, as the reader aims at it or types in it.';

/** Why a field leaves the breathe out at the focus: the focus is where the reader types. */
const typed =
    'it swells and settles the field four times while the reader types in it, and the text being typed swells with it.';

/** Why a field leaves the hover colour out: its placeholder is set against its own fill. */
const hovered =
    'the hover colour is chosen against a control’s label, and under a field’s placeholder it fell to 3.28:1 on Matrix’s light page, and under 4.5:1 in five themes and schemes of six — measured.';

/** Why a field leaves the preview out: what it shows is what a click would change. */
const unchanged =
    'a click puts the caret in the field and changes nothing it could show beforehand.';

/** Throws a circle out from under the field, on the layer its moment draws on. */
const circle = (mark: string, pseudo: string) =>
    waves(control, (host) => inner(host, '.glow'), mark, pseudo);
const pointerWave = circle('data-pointer-border', '::before');
const focusWave = circle('data-focus-border', '::after');

/** The moments a field offers, and each kind's effects. */
export const moments: readonly Moment[] = [
    hover('field', {
        move: {
            draws: ['lift', 'zoom', 'magnetic', 'tilt', 'breathe', 'heartbeat', 'rubber', 'glitch'],
            refuses: { 'flip-vertical': turned, 'flip-horizontal': turned },
        },
        fill: {
            draws: [
                'tint',
                'spotlight',
                { name: 'flood', fire: floods(control) },
                'shimmer',
                { name: 'ripple', fire: enters(control) },
                'scan',
                'blur',
            ],
            refuses: { highlight: hovered, preview: unchanged },
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
                { name: 'highlight', says: 'The boundary darkens to the text’s colour.' },
                'accent',
                'rainbow',
                'edge',
                'orbit',
                'trace',
                'comet',
                'underline',
                'sweep',
                'pulse',
                { name: 'shockwave', fire: pointerWave('shockwave') },
                { name: 'bloom', fire: pointerWave('bloom') },
                'explode',
            ],
        },
        label: { draws: ['accent', 'glow'] },
    }),
    focus('field', {
        move: {
            draws: ['lift', 'zoom', 'heartbeat', 'rubber', 'glitch'],
            refuses: { breathe: typed, 'flip-vertical': turned, 'flip-horizontal': turned },
        },
        fill: {
            draws: [
                'tint',
                'spotlight',
                { name: 'flood', fire: centres(control) },
                'shimmer',
                'ripple',
                'scan',
                'blur',
            ],
            refuses: { highlight: hovered, preview: unchanged },
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
                'rainbow',
                'edge',
                'orbit',
                'trace',
                'comet',
                'underline',
                'sweep',
                'pulse',
                { name: 'shockwave', fire: focusWave('shockwave') },
                { name: 'bloom', fire: focusWave('bloom') },
                'explode',
            ],
        },
        label: { draws: ['accent', 'glow'] },
        ring: {
            draws: [
                aside('input, textarea, select'),
                'slim',
                'bold',
                'tight',
                'inset',
                'dashed',
                'double',
                'breathe',
                'implode',
                'rainbow',
                ...flights('input, textarea, select'),
            ],
        },
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
                        says: 'A red light held round the field for as long as it is invalid.',
                    },
                    {
                        name: 'split',
                        settles: true,
                        says: 'The boundary splits into two colours where it is, eight times, then rests. Drawn for Matrix.',
                    },
                    {
                        name: 'shake',
                        says: 'The boundary shakes, a pixel or three each way, for half a second; the field and its text stay where they are.',
                    },
                ],
            },
            {
                name: 'fill',
                label: 'Fill',
                effects: [
                    { name: 'none', today: true, says: 'The field keeps its fill.' },
                    {
                        name: 'flash',
                        settles: true,
                        says: 'The field is tinted red and fades back, four times, then rests.',
                    },
                    {
                        name: 'tint',
                        says: 'A touch of red held in the fill for as long as the field is invalid.',
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
                        says: 'The message falls into place under the field, past it and back.',
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

/** What a field leaves out, whichever field it is. */
export const refused: readonly Refusal[] = [
    {
        name: 'message slide',
        why: 'a message that opens and pushes the next field down moves the reader’s next target, which the reference measured; the space is reserved instead, and that is layout, not an effect.',
    },
    {
        name: 'decode',
        why: 'scrambles the message through other characters before it settles, which rewrites the text the field is described by while it may be being read.',
    },
];

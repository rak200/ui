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
import { comet, glass, keyframes, lights, orbit, scan, sheen, shimmer, sized } from './controls.js';
import { queries, type Moment, type Refusal } from './motion.js';

/** One page's fields, as the sheet draws on them. */
export interface Fields {
    /** The controls the elements render: `input` and `textarea`, or `select`. */
    readonly controls: readonly string[];
    /** A control the pointer can change, as the component writes its own darkening. */
    readonly pointed: string;
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
export function sheet({ controls, pointed, behind }: Fields, name: string): string {
    /** The query each effect is drawn under: the consumer's choice, else the theme's taste. */
    const is = queries(name);

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

    return String.raw`
/* The box round the control is what the focus's border and an error's are laid out against. */
.glow {
    position: relative;
}

/* The control's transitions, for what the kinds change on it, and its one list of animations,
   read from the four kinds that animate it: the pointer's fill, the focus's shadow and fill, and an
   error's fill. */
${both('')} {
    transition-property: border-color, box-shadow, background-color, backdrop-filter;
    transition-duration: ${reference('--ui-duration-state')}, var(--ui-duration-200), var(--ui-duration-200), var(--ui-duration-200);
    transition-timing-function: var(--ui-easing-state), var(--ui-easing-enter), var(--ui-easing-enter), var(--ui-easing-enter);
    animation: var(--ui-run-hover, none), var(--ui-run-shadow, none), var(--ui-run-fill, none), var(--ui-run-error, none);
}

/* ——— The pointer, where there is one that hovers: a tap leaves :hover on what it touched. ——— */
@media (hover: hover) {
    /* border: none takes today's darkening away, and accent puts the accent in its place. A field
       in error keeps its red under either, which today's darkening covers. */
    @container ${is('hover-border', 'none')} {
        ${both(pointed)} {
            border-color: ${reference('--ui-color-border')};
        }
    }

    @container ${is('hover-border', 'accent')} {
        ${both(pointed)} {
            border-color: var(--ui-color-accent);
        }
    }

    @container ${is('hover-border', 'none')} or ${is('hover-border', 'accent')} {
        ${both(`[aria-invalid='true']${pointed}`)} {
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

    /* pulse, the button's and the drawn controls': a ring of the accent leaving the boundary once
       as the pointer arrives, on the same layer, and yielding as the bands do. */
    @container ${is('hover-border', 'pulse')} {
        ${free} {${round}
        }

        ${resting} {
            animation: ui-pulse var(--ui-duration-400) var(--ui-easing-enter);
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

    @container ${is('hover-fill', 'tint')} {
        ${both(unfocused)} {
            background-color: ${reference('--ui-color-hover')};
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

/* ——— Focus. Every effect keeps the ring, drawn at once, as the component draws it today. ——— */

/* border: accent, the boundary in the accent inside the ring, and red still on a field in error.
   As specific as the component's darkening under the pointer, and after it, so a focused field
   keeps its accent under the pointer. */
@container ${is('focus-border', 'accent')} {
    ${both(":focus-visible:not(:disabled):not([aria-invalid='true'])")} {
        border-color: var(--ui-color-accent);
    }
}

/* underline and sweep: a line of the accent along the bottom edge, drawn out from the middle, or
   from where the text starts. */
@container ${is('focus-border', 'underline')} or ${is('focus-border', 'sweep')} {
    .glow::after {
        content: '';
        position: absolute;
        inset-inline: var(--ui-radius);
        inset-block-end: 0;
        block-size: 2px;
        border-radius: 1px;
        background: var(--ui-color-accent);
        pointer-events: none;
        scale: 0 1;
        transition: scale var(--ui-duration-200) var(--ui-easing-enter);
    }

    .glow:has(> :focus-visible)::after {
        scale: 1 1;
    }
}

@container ${is('focus-border', 'sweep')} {
    .glow::after {
        transform-origin: left;
    }

    .glow:dir(rtl)::after {
        transform-origin: right;
    }
}

/* trace: a line of the accent drawn round once inside the boundary, clockwise from the top, and
   undrawn the same way as the focus leaves. 2px wide and 2px in from the boundary, as the ring is
   2px wide and 2px out from it: drawn across the boundary, from 2px out to 1px in, as the button's
   is, it filled the gap the ring keeps, and the ring, the line and the boundary ran together as one
   line 5px wide, in every theme — measured. */
@container ${is('focus-border', 'trace')} {
    .glow::after {${band}
        inset: 3px;
        padding: 2px;
        border-radius: max(0px, calc(var(--ui-radius) - 3px));
        background: conic-gradient(var(--ui-color-accent) var(--ui-trace), transparent 0);
        transition: --ui-trace calc(var(--ui-duration-400) * 1.5) var(--ui-easing-move);
    }

    .glow:has(> :focus-visible)::after {
        --ui-trace: 360deg;
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
        box-shadow:
            inset 0 0 0 1px var(--ui-color-accent),
            inset 0 0 0.75rem rgb(from var(--ui-color-accent) r g b / 0.22);
    }
}

/* neon: the drawn controls' — a lit line and a glow that swells to a wide halo, four times, and
   from its last round, which ends on the lit line, a fade to nothing. */
@container ${is('focus-shadow', 'neon')} {
    ${both(':focus-visible')} {
        --ui-run-shadow:
            ui-neon var(--ui-duration-loop) var(--ui-easing-state) var(--ui-iteration-settle)
                alternate,
            ui-neon-rest var(--ui-duration-200) var(--ui-easing-exit)
                calc(var(--ui-duration-loop) * var(--ui-iteration-settle));
    }
}

@container ${is('focus-fill', 'tint')} {
    ${both(':focus-visible')} {
        background-color: color-mix(in oklab, var(--ui-color-accent) 6%, ${surface});
    }
}

/* shimmer and scan, the pointer's, as the focus arrives: four sweeps and then at rest, or a band
   crossing down once. In front of the select's caret, which stays where it is. */
@container ${is('focus-fill', 'shimmer')} {${swept(':focus-visible', 'shimmer')}

    ${both(':focus-visible')} {
        --ui-run-fill: ${shimmer.run};
    }
}

@container ${is('focus-fill', 'scan')} {${swept(':focus-visible', 'scan')}

    ${both(':focus-visible')} {
        --ui-run-fill: ${scan.run};
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
   already red, and nothing moves: the shake was left out for leaving where the reader aimed. Each
   effect on the field plays a loop that settles, as an error stands for as long as the reader
   leaves it; the message's own play once, but the glitch, which never takes the message away. ——— */
@container ${is('invalid-border', 'pulse')} or ${is('invalid-border', 'glow')} or
    ${is('invalid-border', 'split')} {
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
        animation: ui-split var(--ui-duration-200) linear var(--ui-iteration-settle);
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
        animation: ui-glitch var(--ui-duration-200) linear var(--ui-iteration-settle);
    }
}

${keyframes}

${sized.wide}
`;
}

/** The moments a field offers, and each kind's effects. */
export const moments: readonly Moment[] = [
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
                        says: 'The boundary darkens to the text’s colour.',
                    },
                    { name: 'none', says: 'The boundary keeps its colour.' },
                    { name: 'accent', says: 'The boundary takes the accent.' },
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
                    { name: 'none', today: true, says: 'Nothing round the field.' },
                    { name: 'halo', says: 'A soft band of the accent round the field.' },
                    { name: 'glow', says: 'A light of the accent round the field.' },
                ],
            },
            {
                name: 'fill',
                label: 'Fill',
                effects: [
                    { name: 'none', today: true, says: 'The field keeps its fill.' },
                    { name: 'tint', says: 'The field takes the hover colour.' },
                    {
                        name: 'shimmer',
                        loops: true,
                        says: 'A sheen sweeps across, and comes round again.',
                    },
                    {
                        name: 'scan',
                        says: 'Once, as the pointer arrives: a band of light crosses the field, top to bottom.',
                    },
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
                        name: 'accent',
                        says: 'The ring, and the boundary inside it in the accent.',
                    },
                    {
                        name: 'underline',
                        says: 'A line of the accent drawn out from the middle along the bottom edge.',
                    },
                    {
                        name: 'sweep',
                        says: 'A line of the accent drawn along the bottom edge from where the text starts.',
                    },
                    {
                        name: 'trace',
                        says: 'A line of the accent drawn round once inside the boundary, from the top, apart from the boundary and the ring.',
                    },
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
                ],
            },
            {
                name: 'shadow',
                label: 'Shadow',
                effects: [
                    {
                        name: 'none',
                        today: true,
                        says: 'Nothing round the field but the ring.',
                    },
                    {
                        name: 'halo',
                        says: 'A soft ring of the accent fades in round the field.',
                    },
                    { name: 'glow', says: 'A light of the accent held round the field.' },
                    { name: 'inner', says: 'A light of the accent held inside the boundary.' },
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
                    { name: 'none', today: true, says: 'The field keeps its fill.' },
                    {
                        name: 'tint',
                        says: 'A touch of the accent in the fill while the field has the focus.',
                    },
                    {
                        name: 'shimmer',
                        settles: true,
                        says: 'A sheen sweeps across, four times, then rests.',
                    },
                    {
                        name: 'scan',
                        says: 'As the focus arrives, a band of light crosses the field once, top to bottom.',
                    },
                    {
                        name: 'blur',
                        says: 'The page behind the field blurred through the theme’s glass while it has the focus; where there is no glass, nothing changes. Drawn for Glass.',
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
                        says: 'The label takes the accent, a fifth of the way to the text’s colour, while the field has the focus.',
                    },
                    {
                        name: 'glow',
                        says: 'A light of the accent round the label while the field has the focus.',
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
                        says: 'A red light held round the field for as long as it is invalid.',
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
                        says: 'The message jumps and splits into two colours, four times, then rests. Drawn for Matrix.',
                    },
                ],
            },
        ],
    },
];

/** What a field leaves out, whichever field it is. */
export const refused: readonly Refusal[] = [
    {
        name: 'shake',
        why: 'the reference measured 7px of travel for half a second: the field leaves where the reader aimed, and the red boundary already says what the shake says.',
    },
    {
        name: 'message slide',
        why: 'a message that opens and pushes the next field down moves the reader’s next target, which the reference measured; the space is reserved instead, and that is layout, not an effect.',
    },
    {
        name: 'decode',
        why: 'scrambles the message through other characters before it settles, which rewrites the text the field is described by while it may be being read.',
    },
];

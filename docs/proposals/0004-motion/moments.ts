/**
 * The pointer over a component and the focus on it: one list of effects for the two moments, and
 * for every component that answers them.
 *
 * **The list is the moments', not a component's.** Each kind — where the component is, its fill,
 * its shadow, its border, and its label where it has one apart from the control — offers the same
 * effects in the same order wherever it is offered, under one name that means one effect, and at
 * the focus as under the pointer. A component says which of them it draws, which it does today, and
 * what is its own about one: the script that runs it, a host it is drawn on, what its own today's
 * does. One it does not draw yet is marked so in its panel, and one it never will is marked with
 * why, so the list a page shows is the list every page shows.
 *
 * **What follows the pointer is said again for the focus**, which arrives with no pointer: a light
 * or a colour placed where the pointer is is said there to start from the middle, as the ripple
 * does, and an effect that is the pointer's direction — leaning, drawing toward, casting away — is
 * left out at the focus. A component the focus is never on, a card, answers a focus on something it
 * holds instead, which draws its own ring, so each line is said without one.
 *
 * **The ring is a kind of the focus's alone**, and only of a component the focus is on: nothing
 * under the pointer has one, nor does a card round what has the focus in it. Its today's is the ring
 * every control draws, `solid`, and every effect of it shows a ring from the first frame, since the
 * ring says where the reader is and a ring that arrives late says it late. Its `none` takes the ring
 * away where a shadow or a border the focus holds stays round the component, and stands it aside
 * while one the focus plays, until it has settled; never in forced colours, where those are gone and
 * the ring is all that is left.
 */
import type { Effect, Firing, Kind as Shown, Moment } from './motion.js';

/** A kind of change the two moments make, each a property of its own. */
type Kind = 'move' | 'fill' | 'shadow' | 'border' | 'label';

/** The component a line is said of: its own word for itself, and whether the focus is on it, drawn
 *  as its ring, rather than on something in it, which draws its own. */
interface Subject {
    readonly noun: string;
    readonly ring: boolean;
}

/** What an effect does under one moment, said once for every component. */
interface Rendition {
    /** What it does, in a line; said of the component where the line names it or its ring. */
    readonly says: string | ((it: Subject) => string);
    readonly follows?: true;
    readonly loops?: true;
    readonly settles?: true;
}

/** One effect of the list: what it does under the pointer, and at the focus, or why no component
 *  draws it there. */
interface Listed {
    readonly name: string;
    readonly hover: Rendition;
    readonly focus: Rendition | string;
}

/** What is a component's own about an effect it draws. */
export interface Own {
    readonly name: string;
    /** It runs in script on the moment's event — S7. */
    readonly fire?: (firing: Firing) => void;
    /** Drawn on the host itself, which a choice made on the host cannot reach — S8. */
    readonly host?: true;
    /** What it does on this component, where the list's line would not say it: what a component
     *  does today is its own, and so is what a drawn control's click would do. */
    readonly says?: string;
}

/** What a component draws of one kind, for one moment. */
export interface Drawn {
    /** What it does today, which renders with no choice: `none` unless named. */
    readonly today?: string;
    /** Each effect it draws besides `none`, which every component draws: by name, or with what is
     *  its own about it. */
    readonly draws: readonly (string | Own)[];
    /** Each effect it never draws, with why. */
    readonly refuses?: Readonly<Record<string, string>>;
}

/** What a component draws of each kind, for one moment. A kind it leaves out is shown with nothing
 *  drawn yet, but the label, which only a component with a label apart from its control has, and
 *  the ring, which only the focus has. */
export type Drawing = Readonly<Partial<Record<Kind | 'ring', Drawn>>>;

/** Why an effect that is the pointer's direction is left out at the focus. */
const directionless = 'it is which way the pointer is, and a focus has no pointer.';

/** The list, by kind, in the order every panel shows it. */
const listed: Readonly<Record<Kind, readonly Listed[]>> = {
    move: [
        {
            name: 'none',
            hover: { says: 'Stays where it is.' },
            focus: { says: 'Stays where it is.' },
        },
        {
            name: 'lift',
            hover: { says: 'Rises a little.' },
            focus: {
                says: ({ ring }) =>
                    `Stands a little up${ring ? ', ring and all,' : ''} while the focus is in it.`,
            },
        },
        {
            name: 'zoom',
            hover: { says: 'Grows a little.' },
            focus: {
                says: ({ ring }) =>
                    `Grows a little${ring ? ', ring and all,' : ''} while the focus is in it.`,
            },
        },
        {
            name: 'magnetic',
            hover: { follows: true, says: 'Drawn a little toward the pointer as it nears.' },
            focus: directionless,
        },
        {
            name: 'tilt',
            hover: {
                follows: true,
                says: 'Turns toward the pointer in depth; with the fill’s spotlight, it catches the light where the pointer is.',
            },
            focus: directionless,
        },
        {
            name: 'breathe',
            hover: {
                loops: true,
                says: 'Swells and settles; with the shadow’s breathe, a glow comes and goes with it.',
            },
            focus: { settles: true, says: 'Swells and settles, four times, then rests.' },
        },
        {
            name: 'heartbeat',
            hover: { says: 'Once, as the pointer arrives: two beats.' },
            focus: { says: 'As the focus arrives: two beats.' },
        },
        {
            name: 'rubber',
            hover: { says: 'Once, as the pointer arrives: stretches and settles.' },
            focus: { says: 'As the focus arrives: stretches and settles.' },
        },
        {
            name: 'flip-vertical',
            hover: {
                says: 'Once, as the pointer arrives: turns in from edge-on, top over bottom.',
            },
            focus: {
                says: ({ ring }) =>
                    `As the focus arrives: turns in from edge-on, top over bottom${ring ? ', ring and all' : ''}.`,
            },
        },
        {
            name: 'flip-horizontal',
            hover: { says: 'Once, as the pointer arrives: turns in from edge-on, side over side.' },
            focus: {
                says: ({ ring }) =>
                    `As the focus arrives: turns in from edge-on, side over side${ring ? ', ring and all' : ''}.`,
            },
        },
        {
            name: 'glitch',
            hover: {
                says: 'Once, as the pointer arrives: what it shows jumps and splits into two colours. Drawn for Matrix.',
            },
            focus: {
                says: 'As the focus arrives: what it shows jumps and splits into two colours. Drawn for Matrix.',
            },
        },
    ],
    fill: [
        {
            name: 'none',
            hover: { says: 'Keeps its own fill.' },
            focus: { says: 'Keeps its own fill.' },
        },
        {
            name: 'highlight',
            hover: { says: 'Takes the hover colour.' },
            focus: { says: 'Takes the hover colour while the focus is in it.' },
        },
        {
            name: 'tint',
            hover: { says: 'Takes a little of the accent.' },
            focus: { says: 'Takes a little of the accent while the focus is in it.' },
        },
        {
            name: 'preview',
            hover: { says: 'The hover colour, and what a click would do, faintly.' },
            focus: { says: 'The hover colour, and what Space would do, faintly.' },
        },
        {
            name: 'spotlight',
            hover: { follows: true, says: 'A light under the pointer, fading with distance.' },
            focus: { says: 'A light in the middle, fading with distance.' },
        },
        {
            name: 'flood',
            hover: {
                says: 'Colour spreads from where the pointer came in, and drains toward where it leaves.',
            },
            focus: {
                says: 'Colour spreads from the middle as the focus arrives, and drains back as it leaves.',
            },
        },
        {
            name: 'shimmer',
            hover: { loops: true, says: 'A sheen sweeps across, and comes round again.' },
            focus: { settles: true, says: 'A sheen sweeps across, four times, then rests.' },
        },
        {
            name: 'ripple',
            hover: {
                says: 'Once, as the pointer arrives: a circle spreads from where it came in.',
            },
            focus: { says: 'As the focus arrives: a circle spreads from the middle.' },
        },
        {
            name: 'scan',
            hover: {
                says: ({ noun }) =>
                    `Once, as the pointer arrives: a band of light crosses the ${noun}, top to bottom.`,
            },
            focus: {
                says: ({ noun }) =>
                    `As the focus arrives: a band of light crosses the ${noun}, top to bottom.`,
            },
        },
        {
            name: 'blur',
            hover: {
                says: ({ noun }) =>
                    `The page behind the ${noun} blurred through the theme’s glass; where there is no glass, nothing changes. Drawn for Glass.`,
            },
            focus: {
                says: ({ noun }) =>
                    `The page behind the ${noun} blurred through the theme’s glass while the focus is in it; where there is no glass, nothing changes. Drawn for Glass.`,
            },
        },
    ],
    shadow: [
        {
            name: 'none',
            hover: { says: 'No shadow but the theme’s own, where it gives one.' },
            focus: { says: 'No shadow but the theme’s own, where it gives one.' },
        },
        {
            name: 'highlight',
            hover: { says: 'The shadow or glow the theme gives the pointer, where it gives one.' },
            focus: {
                says: 'The shadow or glow the theme gives the pointer, where it gives one, while the focus is in it.',
            },
        },
        {
            name: 'raise',
            hover: { says: 'Stands off the page, a shadow dropping under it.' },
            focus: {
                says: 'Stands off the page while the focus is in it, a shadow dropping under it.',
            },
        },
        {
            name: 'sink',
            hover: { says: 'Sinks into the page, its shadow gone inside.' },
            focus: {
                says: 'Sinks into the page while the focus is in it, its shadow gone inside.',
            },
        },
        {
            name: 'halo',
            hover: { says: ({ noun }) => `A soft band of the accent round the ${noun}.` },
            focus: {
                says: ({ noun }) =>
                    `A soft band of the accent round the ${noun} while the focus is in it.`,
            },
        },
        {
            name: 'glow',
            hover: { says: ({ noun }) => `A light of the accent round the ${noun}.` },
            focus: {
                says: ({ noun }) =>
                    `A light of the accent held round the ${noun} while the focus is in it.`,
            },
        },
        {
            name: 'inner',
            hover: { says: 'A light of the accent inside the boundary.' },
            focus: {
                says: 'A light of the accent held inside the boundary while the focus is in it.',
            },
        },
        {
            name: 'cast',
            hover: {
                follows: true,
                says: 'The pointer as a light: the shadow falls away from it, and on a dark page, where a shadow barely shows, the light spills round the side the pointer is on.',
            },
            focus: directionless,
        },
        {
            name: 'neon',
            hover: {
                loops: true,
                says: 'A lit line round the boundary, its glow swelling to a wide halo and back.',
            },
            focus: {
                settles: true,
                says: 'A lit line round the boundary, its glow swelling to a wide halo, four times, then rests.',
            },
        },
        {
            name: 'breathe',
            hover: {
                loops: true,
                says: 'A glow that comes and goes; with the movement’s breathe, it swells with it.',
            },
            focus: { settles: true, says: 'A glow that comes and goes, four times, then rests.' },
        },
        {
            name: 'burst',
            hover: { says: 'Once, as the pointer arrives: light bursts out round it.' },
            focus: { says: 'As the focus arrives: light bursts out round it.' },
        },
    ],
    border: [
        {
            name: 'none',
            hover: { says: 'The boundary the theme draws.' },
            focus: {
                says: ({ ring }) =>
                    ring
                        ? 'The ring, drawn at once.'
                        : 'Nothing: what has the focus in it draws its own ring.',
            },
        },
        {
            name: 'highlight',
            hover: { says: 'The boundary takes the colour it has under the pointer.' },
            focus: {
                says: ({ ring }) =>
                    `${ring ? 'The ring, and the boundary' : 'The boundary'} in the colour it has under the pointer.`,
            },
        },
        {
            name: 'accent',
            hover: { says: 'The boundary takes the accent.' },
            focus: {
                says: ({ ring }) =>
                    `${ring ? 'The ring, and the boundary inside it' : 'The boundary'} in the accent.`,
            },
        },
        {
            name: 'edge',
            hover: {
                follows: true,
                says: 'A band of the boundary lights up where the pointer is nearest.',
            },
            focus: {
                says: ({ ring }) =>
                    `${ring ? 'The ring, and the' : 'The'} band of the boundary lit from the middle.`,
            },
        },
        {
            name: 'orbit',
            hover: {
                settles: true,
                says: 'A light runs round on the boundary, three laps, then fades.',
            },
            focus: {
                settles: true,
                says: 'A light runs round on the boundary, three laps, then fades.',
            },
        },
        {
            name: 'trace',
            hover: {
                says: 'The boundary is drawn round once, from the top, and undrawn as the pointer leaves.',
            },
            focus: {
                says: ({ ring }) =>
                    `${ring ? 'The ring, and the boundary inside it' : 'The boundary'} drawn round once, from the top, and undrawn as the focus leaves.`,
            },
        },
        {
            name: 'comet',
            hover: {
                loops: true,
                says: 'A comet of light runs round clear of the boundary, and waits where it was when the pointer leaves.',
            },
            focus: {
                settles: true,
                says: ({ ring }) =>
                    `A comet runs round clear of the boundary${ring ? ', over the ring' : ''}, two laps, then fades.`,
            },
        },
        {
            name: 'underline',
            hover: {
                says: 'A line of the accent drawn out from the middle along the bottom edge.',
            },
            focus: {
                says: ({ ring }) =>
                    `${ring ? 'The ring, and a' : 'A'} line of the accent drawn out from the middle along the bottom edge.`,
            },
        },
        {
            name: 'sweep',
            hover: {
                says: 'A line of the accent drawn along the bottom edge from where the text starts.',
            },
            focus: {
                says: ({ ring }) =>
                    `${ring ? 'The ring, and a' : 'A'} line of the accent drawn along the bottom edge from where the text starts.`,
            },
        },
        {
            name: 'pulse',
            hover: {
                says: 'Once, as the pointer arrives: a ring of the accent leaves the boundary and fades.',
            },
            focus: {
                says: ({ ring }) =>
                    ring
                        ? 'The ring at once, then a ring of its colour leaves the boundary and fades.'
                        : 'As the focus arrives: a ring of the focus’s colour leaves the boundary and fades.',
            },
        },
        {
            name: 'shockwave',
            hover: {
                says: ({ noun }) =>
                    `Once, as the pointer arrives: a thin circle ripples far out from under the ${noun}.`,
            },
            focus: {
                says: ({ noun, ring }) =>
                    `As the focus arrives: a thin circle ripples far out ${ring ? 'past the ring' : `from under the ${noun}`}.`,
            },
        },
        {
            name: 'bloom',
            hover: {
                says: ({ noun }) =>
                    `Once, as the pointer arrives: a filled disc ripples far out from under the ${noun}.`,
            },
            focus: {
                says: ({ noun, ring }) =>
                    `As the focus arrives: a filled disc ripples far out ${ring ? 'past the ring' : `from under the ${noun}`}.`,
            },
        },
        {
            name: 'explode',
            hover: {
                says: 'Once, as the pointer arrives: a thick ring is thrown far out from the boundary.',
            },
            focus: {
                says: ({ ring }) =>
                    `As the focus arrives: a thick ring is thrown far out ${ring ? 'past the ring' : 'from the boundary'}.`,
            },
        },
    ],
    label: [
        {
            name: 'none',
            hover: { says: 'The label keeps its colour.' },
            focus: { says: 'The label keeps its colour.' },
        },
        {
            name: 'accent',
            hover: { says: 'The label takes the accent, a fifth of the way to the text’s colour.' },
            focus: {
                says: ({ noun }) =>
                    `The label takes the accent, a fifth of the way to the text’s colour, while the focus is in the ${noun}.`,
            },
        },
        {
            name: 'glow',
            hover: { says: 'A light of the accent round the label.' },
            focus: {
                says: ({ noun }) =>
                    `A light of the accent round the label while the focus is in the ${noun}.`,
            },
        },
    ],
};

/**
 * The ring's list, the focus's alone: what the ring a component draws round itself does as the
 * focus arrives and while it stays. Every one shows a ring from the first frame.
 */
const ringed: readonly { readonly name: string; readonly focus: Rendition }[] = [
    {
        name: 'none',
        focus: {
            says: 'No ring where a shadow or a border the focus holds stays round the component, and none while one the focus plays, until it has settled; otherwise, and in forced colours, the ring stays.',
        },
    },
    {
        name: 'solid',
        focus: { says: 'The ring, 2px of the focus’s colour, 2px off the boundary.' },
    },
    { name: 'slim', focus: { says: 'The ring at 1px, and 4px off the boundary.' } },
    { name: 'bold', focus: { says: 'The ring at 3px.' } },
    { name: 'tight', focus: { says: 'The ring on the boundary, with no gap.' } },
    {
        name: 'inset',
        focus: { says: 'The ring 4px inside the boundary, in the colour of what it is on.' },
    },
    { name: 'dashed', focus: { says: 'The ring in dashes.' } },
    { name: 'double', focus: { says: 'The ring as two thin lines.' } },
    {
        name: 'breathe',
        focus: { settles: true, says: 'The ring’s gap swells and closes, four times, then rests.' },
    },
    {
        name: 'implode',
        focus: {
            says: 'As the focus arrives: the ring closes in from further out, faint, and holds.',
        },
    },
    {
        name: 'glitch',
        focus: {
            says: 'As the focus arrives: the ring shakes where it is and splits into two colours, then holds.',
        },
    },
    {
        name: 'glide',
        focus: {
            says: 'As the focus arrives: the ring glides over from where the reader saw it last, then holds; a focus from nowhere they saw has its ring at once.',
        },
    },
    {
        name: 'trace',
        focus: {
            says: 'As the focus arrives: the ring drawn round once, from the top, over a faint one.',
        },
    },
    {
        name: 'refocus',
        focus: {
            says: 'As the focus arrives: the ring comes into focus from a blur; as it leaves, it blurs away.',
        },
    },
];

/**
 * The focus's shadows and borders that stay round a component for as long as the focus does, which
 * the ring's `none` stands aside for for as long. Measured in Chromium on the button, a
 * field and a checkbox with the ring taken away, under each theme and scheme, as what each leaves
 * once it settles: these change at least the control's perimeter in pixels by 1.1:1 or more, the
 * glow and the halo six times that or more, and none reaches the 3:1 WCAG 1.4.11 asks of a focus
 * indicator in a light scheme, which the review took. On a drawn control the raise changes three
 * quarters of the box's perimeter under Glass in the dark, so a drawn control's ring stands aside
 * for the other four. The highlight leaves what the theme gives the pointer, which can be nothing;
 * the inner light, the sink, the neon, the breathe, the accent and the lines along the bottom leave
 * little or nothing; and what plays once leaves nothing.
 */
export const held = {
    shadow: ['halo', 'glow', 'raise'],
    border: ['trace', 'edge'],
} as const;

/**
 * The focus's shadows and borders that play and then settle or end, leaving nothing: the neon, the
 * breathe, the orbit and the comet a few rounds, and the burst and the rings thrown out once. The
 * ring's `none` stands aside while one of them plays, and is back once everything the focus started
 * has settled, so where nothing stays the focus is still never left unseen.
 */
export const played: { readonly shadow: readonly string[]; readonly border: readonly string[] } = {
    shadow: ['neon', 'breathe', 'burst'],
    border: ['orbit', 'comet', 'pulse', 'shockwave', 'bloom', 'explode'],
};

/** Each kind's name in a panel. */
const labels: Readonly<Record<Kind | 'ring', string>> = {
    move: 'Movement',
    fill: 'Fill',
    shadow: 'Shadow',
    border: 'Border',
    label: 'Label',
    ring: 'Ring',
};

/**
 * One kind as a component draws it: every effect of its list, each drawn, not drawn yet, or never,
 * with why. `given` is the effect the component draws without naming it, and does today where it
 * names none: `none` for every kind but the ring, whose today's is the ring itself.
 */
function shown(
    kind: Kind | 'ring',
    list: readonly {
        readonly name: string;
        readonly rendition: Rendition | string;
        readonly hover: Rendition;
    }[],
    it: Subject,
    drawn: Drawn | undefined,
    given: string,
): Shown {
    const own = new Map(
        (drawn?.draws ?? []).map((entry): [string, Own] =>
            typeof entry === 'string' ? [entry, { name: entry }] : [entry.name, entry],
        ),
    );

    return {
        name: kind,
        label: labels[kind],
        effects: list.map(({ name, rendition, hover }): Effect => {
            // Where no component draws it at this moment, it is said as the pointer's.
            const { says: line, ...flags } = typeof rendition === 'string' ? hover : rendition;
            const says = typeof line === 'string' ? line : line(it);
            const mine = own.get(name);

            if (typeof rendition === 'string') {
                return { name, says, ...flags, refused: rendition };
            }

            if (mine === undefined && name !== given) {
                const refusal = drawn?.refuses?.[name];

                return refusal === undefined
                    ? { name, says, ...flags, yet: true }
                    : { name, says, ...flags, refused: refusal };
            }

            return {
                name,
                says: mine?.says ?? says,
                ...flags,
                ...((drawn?.today ?? given) === name ? { today: true } : {}),
                ...(mine?.fire === undefined ? {} : { fire: mine.fire }),
                ...(mine?.host === true ? { host: true } : {}),
            };
        }),
    };
}

/** One moment as a component draws it: every kind of the list, each with the list's effects, and
 *  for each effect what the component draws, or that it does not draw it yet, or why it never
 *  will — and at the focus on a component, its ring. */
function moment(name: 'hover' | 'focus', it: Subject, drawing: Drawing): Moment {
    const kinds = (Object.keys(listed) as Kind[])
        .filter((kind) => kind !== 'label' || drawing.label !== undefined)
        .map((kind) =>
            shown(
                kind,
                listed[kind].map((effect) => ({ ...effect, rendition: effect[name] })),
                it,
                drawing[kind],
                'none',
            ),
        );

    if (name === 'focus' && it.ring) {
        kinds.push(
            shown(
                'ring',
                ringed.map((effect) => ({
                    ...effect,
                    rendition: effect.focus,
                    hover: effect.focus,
                })),
                it,
                drawing.ring,
                'solid',
            ),
        );
    }

    return name === 'hover'
        ? { name, label: 'Pointer over', on: 'enter', kinds }
        : { name, label: it.ring ? 'Focus' : 'Focus within', on: 'focus', kinds };
}

/** The pointer over a component, as the component draws it; `noun` is its own word for itself. */
export function hover(noun: string, drawing: Drawing): Moment {
    return moment('hover', { noun, ring: true }, drawing);
}

/** The focus a reader can see on a component, as the component draws it; or, `within`, on
 *  something in it, which draws its own ring: a card holding a button the reader has reached. */
export function focus(noun: string, drawing: Drawing, within = false): Moment {
    return moment('focus', { noun, ring: !within }, drawing);
}

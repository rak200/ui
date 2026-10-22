/**
 * What a panel that hangs from its trigger does as it opens and as it closes, and what the
 * trigger's caret does: `ui-menu`'s panel, and the list `ui-select` opens where the engine lets the
 * page draw it. One set for both, so a menu and a list open alike.
 *
 * **Nothing here changes the panel's size.** The menu measures the panel to place it, so an
 * entrance that started scaled would be measured instead of the panel: the effects fade it, move
 * it, uncover it, blur it, make it jump and bring its items in one after another, and none scales
 * it or turns it. The items move inside it, which its size does not see.
 *
 * **What comes from the trigger's side reads which side that is.** A component that places the
 * panel itself writes the side before the panel's first style, as the menu does. One whose panel
 * the platform places, as the select's list is, has it below, where the platform puts it unless
 * there is no room: a rule cannot read which side the platform took.
 *
 * An exit holds the panel on screen while it runs — `display` and `overlay` transitioned as
 * discrete values — and only when one is chosen, so a panel with no exit still closes at once.
 */
import { reference } from '../../../src/reference.js';
import type { Moment } from './motion.js';

/** Where one component's panel, its items and its caret are, as its shadow root has them. */
export interface Panel {
    /** The panel, open or closed; open; and closed, which an exit is drawn on. */
    readonly panel: string;
    readonly open: string;
    readonly closed: string;
    /** The panel hanging above its trigger, where the component knows it does. */
    readonly above?: string;
    /** The panel in right-to-left text. */
    readonly rtl: string;
    /** The items while the panel is open, and the one at a place among them, from the first, or
     *  every one from the seventh on. */
    readonly items: string;
    readonly item: (place: number, rest: boolean) => string;
    /** The caret, and the caret while the panel is open. */
    readonly caret: string;
    readonly turned: string;
    /** The component's name, which the panel's own keyframes are written under. */
    readonly name: string;
}

/** What a component calls its panel and the items in it, as its moments describe them. */
export interface Words {
    readonly panel: string;
    readonly items: string;
    /** What splits in two colours in the glitch: the menu's labels, the select's choices. */
    readonly labels: string;
}

/** The colours the glitch splits into, the button's own. */
const danger = reference('--ui-color-danger').cssText;
const info = reference('--ui-color-info').cssText;

/** The spring's own curve, the tooltip's: past where it goes and back, settled by two thirds. */
const spring =
    'linear(0, 0.195 5%, 0.59 10%, 0.955 15%, 1.174 20%, 1.233 25%, 1.184 30%, 1.091 35%, 1.007 40%, 0.958 45%, 0.946 50%, 0.958 55%, 0.98 60%, 0.999 65%, 1.01 70%, 1.013 75%, 1.007 82.5%, 1)';

/** Each item's wait in the cascade, by its place among the items, and every item from the seventh
 *  on waits as the seventh does. */
function cascade(item: Panel['item']): string {
    return Array.from({ length: 7 }, (_, index) => index + 1)
        .map(
            (place) => `
    ${item(place, place === 7)} {
        transition-delay:
            calc(var(--ui-duration-50) / 2 * ${String(place)}),
            calc(var(--ui-duration-50) / 2 * ${String(place)}),
            0s;
    }`,
        )
        .join('\n');
}

/** The rules a panel's opening, its closing and its caret are drawn under, each under its query. */
export function panel(where: Panel, is: (moment: string, effect: string) => string): string {
    /** Which way the trigger is, where the panel hangs above it. */
    const above =
        where.above === undefined
            ? ''
            : `${where.above} {
    --ui-toward: 1;
}

`;

    return String.raw`
/* Which way the trigger is from the panel, as a sign on the block axis, and which way the panel
   reads, on the inline one: what moves or uncovers the panel toward its trigger or along its
   lines reads these. */
${where.panel} {
    --ui-toward: -1;
    --ui-reading: 1;
}

${above}${where.rtl} {
    --ui-reading: -1;
}

/* An exit that covers the panel covers it from an open clip, 3rem clear of the shadow the panel
   casts, past what each theme's reaches: Glass's falls 32px. Here, ahead of the entrances, for
   the reason the tooltip's page gives: written after a reveal's start, the open clip was the
   start, and nothing was uncovered. */
@container ${is('exit', 'fold')} or ${is('exit', 'curtain')} or ${is('exit', 'wipe')} {
    ${where.open} {
        clip-path: inset(-3rem);
    }
}

/* ——— Opening. ——— */
@container ${is('enter', 'fade')} {
    ${where.open} {
        transition: opacity var(--ui-duration-200) var(--ui-easing-enter);
    }

    @starting-style {
        ${where.open} {
            opacity: 0;
        }
    }
}

/* drop: from the trigger's side, toward where it hangs. */
@container ${is('enter', 'drop')} {
    ${where.open} {
        transition:
            opacity var(--ui-duration-200) var(--ui-easing-enter),
            transform var(--ui-duration-200) var(--ui-easing-enter);
    }

    @starting-style {
        ${where.open} {
            opacity: 0;
            transform: translateY(calc(var(--ui-toward) * 0.5rem));
        }
    }
}

/* spring: from further, past where it hangs and back, on a curve of its own. */
@container ${is('enter', 'spring')} {
    ${where.open} {
        transition:
            opacity var(--ui-duration-150) var(--ui-easing-enter),
            transform var(--ui-duration-300) ${spring};
    }

    @starting-style {
        ${where.open} {
            opacity: 0;
            transform: translateY(calc(var(--ui-toward) * 0.75rem));
        }
    }
}

/* A reveal changes which parts of the panel there are and leaves the rest where it was. Open, the
   clip stands clear of the shadow, so the shadow the panel is lifted by is not cut. */
@container ${is('enter', 'unfold')} {
    ${where.open} {
        clip-path: inset(-3rem);
        transition: clip-path var(--ui-duration-200) var(--ui-easing-enter);
    }

    @starting-style {
        ${where.open} {
            clip-path: inset(
                calc(max(0, var(--ui-toward)) * 100%) -3rem
                    calc(max(0, -1 * var(--ui-toward)) * 100%) -3rem
            );
        }
    }
}

/* curtain: from a line down its middle, outward across it. */
@container ${is('enter', 'curtain')} {
    ${where.open} {
        clip-path: inset(-3rem);
        transition: clip-path var(--ui-duration-200) var(--ui-easing-move);
    }

    @starting-style {
        ${where.open} {
            clip-path: inset(-3rem 50%);
        }
    }
}

/* wipe: along its lines, from where they start to be read. */
@container ${is('enter', 'wipe')} {
    ${where.open} {
        clip-path: inset(-3rem);
        transition: clip-path var(--ui-duration-200) var(--ui-easing-move);
    }

    @starting-style {
        ${where.open} {
            clip-path: inset(
                -3rem calc(max(0, var(--ui-reading)) * 100%) -3rem
                    calc(max(0, -1 * var(--ui-reading)) * 100%)
            );
        }
    }
}

/* refocus: out of focus by half a rem and sharpening, and there by half the way. */
@container ${is('enter', 'refocus')} {
    ${where.open} {
        transition:
            filter calc(var(--ui-duration-200) * 1.25) var(--ui-easing-enter),
            opacity calc(var(--ui-duration-200) * 0.625) var(--ui-easing-enter);
    }

    @starting-style {
        ${where.open} {
            filter: blur(0.5rem);
            opacity: 0;
        }
    }
}

/* glitch: in jumps, its labels split into two colours, as the tooltip's tip does. */
@container ${is('enter', 'glitch')} {
    ${where.open} {
        animation: ui-${where.name}-glitch-in var(--ui-duration-200) steps(1, end);
    }
}

/* cascade: the panel at once, and its items into it one after another, each from the trigger's
   side. A pointer that lands on one as it arrives still lights it, on the state's own step. */
@container ${is('enter', 'cascade')} {
    ${where.items} {
        transition:
            opacity var(--ui-duration-150) var(--ui-easing-enter),
            transform var(--ui-duration-150) var(--ui-easing-enter),
            background-color ${reference('--ui-duration-state')} var(--ui-easing-state);
    }
${cascade(where.item)}

    @starting-style {
        ${where.items} {
            opacity: 0;
            transform: translateY(calc(var(--ui-toward) * 0.25rem));
        }
    }
}

/* ——— Closing. Every exit leaves from where the panel was placed, so each knows its side. ——— */
@container ${is('exit', 'fade')} {
    ${where.closed} {
        opacity: 0;
        transition:
            opacity var(--ui-duration-200) var(--ui-easing-exit),
            display var(--ui-duration-200) allow-discrete,
            overlay var(--ui-duration-200) allow-discrete;
    }
}

@container ${is('exit', 'lift')} {
    ${where.closed} {
        opacity: 0;
        transform: translateY(-0.5rem);
        transition:
            opacity var(--ui-duration-200) var(--ui-easing-exit),
            transform var(--ui-duration-200) var(--ui-easing-exit),
            display var(--ui-duration-200) allow-discrete,
            overlay var(--ui-duration-200) allow-discrete;
    }
}

/* fold: covered back toward the trigger. */
@container ${is('exit', 'fold')} {
    ${where.closed} {
        clip-path: inset(
            calc(max(0, var(--ui-toward)) * 100%) -3rem
                calc(max(0, -1 * var(--ui-toward)) * 100%) -3rem
        );
        transition:
            clip-path var(--ui-duration-200) var(--ui-easing-exit),
            display var(--ui-duration-200) allow-discrete,
            overlay var(--ui-duration-200) allow-discrete;
    }
}

/* curtain: closed from its edges to a line down its middle. */
@container ${is('exit', 'curtain')} {
    ${where.closed} {
        clip-path: inset(-3rem 50%);
        transition:
            clip-path var(--ui-duration-200) var(--ui-easing-move),
            display var(--ui-duration-200) allow-discrete,
            overlay var(--ui-duration-200) allow-discrete;
    }
}

/* wipe: covered along its lines, from where they start to be read. */
@container ${is('exit', 'wipe')} {
    ${where.closed} {
        clip-path: inset(
            -3rem calc(max(0, -1 * var(--ui-reading)) * 100%) -3rem
                calc(max(0, var(--ui-reading)) * 100%)
        );
        transition:
            clip-path var(--ui-duration-200) var(--ui-easing-move),
            display var(--ui-duration-200) allow-discrete,
            overlay var(--ui-duration-200) allow-discrete;
    }
}

/* defocus: blurring away by as much as the refocus sharpens from, and gone over the second
   half. */
@container ${is('exit', 'defocus')} {
    ${where.closed} {
        filter: blur(0.5rem);
        opacity: 0;
        transition:
            filter calc(var(--ui-duration-200) * 1.25) var(--ui-easing-exit),
            opacity calc(var(--ui-duration-200) * 0.625) var(--ui-easing-exit)
                calc(var(--ui-duration-200) * 0.625),
            display calc(var(--ui-duration-200) * 1.25) allow-discrete,
            overlay calc(var(--ui-duration-200) * 1.25) allow-discrete;
    }
}

@container ${is('exit', 'glitch')} {
    ${where.closed} {
        animation: ui-${where.name}-glitch-out var(--ui-duration-200) steps(1, end) forwards;
        transition:
            display var(--ui-duration-200) allow-discrete,
            overlay var(--ui-duration-200) allow-discrete;
    }
}

/* Each step of the glitch holds until the next: the panel shows in bands, side to side, and only
   moves along its lines, so it is placed by the box it rests in. */
@keyframes ui-${where.name}-glitch-in {
    0% {
        opacity: 0;
    }
    15% {
        opacity: 1;
        transform: translateX(-3px);
        clip-path: inset(0 -3rem 55% -3rem);
        text-shadow:
            2px 0 ${danger},
            -2px 0 ${info};
    }
    35% {
        opacity: 0.5;
        transform: translateX(3px);
        clip-path: inset(40% -3rem 0 -3rem);
        text-shadow:
            -2px 0 ${danger},
            2px 0 ${info};
    }
    55% {
        opacity: 1;
        transform: translateX(-1px);
        clip-path: inset(20% -3rem 25% -3rem);
        text-shadow:
            1px 0 ${danger},
            -1px 0 ${info};
    }
    75%,
    100% {
        opacity: 1;
        transform: none;
        clip-path: inset(-3rem);
        text-shadow: none;
    }
}

/* The entrance's bands the other way, flickering out. */
@keyframes ui-${where.name}-glitch-out {
    0% {
        opacity: 1;
    }
    20% {
        transform: translateX(2px);
        clip-path: inset(20% -3rem 25% -3rem);
        text-shadow:
            1px 0 ${danger},
            -1px 0 ${info};
    }
    40% {
        opacity: 0.5;
        transform: translateX(-3px);
        clip-path: inset(40% -3rem 0 -3rem);
        text-shadow:
            -2px 0 ${danger},
            2px 0 ${info};
    }
    60% {
        opacity: 1;
        transform: translateX(3px);
        clip-path: inset(0 -3rem 55% -3rem);
        text-shadow:
            2px 0 ${danger},
            -2px 0 ${info};
    }
    80%,
    100% {
        opacity: 0;
        transform: translateX(3px);
        clip-path: inset(0 -3rem 55% -3rem);
    }
}

/* ——— The caret: today it turns over on the state's step. ——— */
@container ${is('caret', 'none')} {
    ${where.caret} {
        transition: none;
    }
}

@container ${is('caret', 'spring')} {
    ${where.caret} {
        transition: rotate var(--ui-duration-300) var(--ui-easing-emphasis);
    }
}

/* flip: over its middle line, edge-on halfway, as a card is turned over. Pointing up at the end,
   as the turn leaves it. */
@container ${is('caret', 'flip')} {
    ${where.caret} {
        transform: perspective(3rem) rotateX(0deg);
        transition: transform var(--ui-duration-300) var(--ui-easing-move);
    }

    ${where.turned} {
        rotate: none;
        transform: perspective(3rem) rotateX(180deg);
    }
}

/* tick: in four steps, as a dial clicks round. */
@container ${is('caret', 'tick')} {
    ${where.caret} {
        transition: rotate var(--ui-duration-300) steps(4, end);
    }
}

/* spin: round once and a half, landing turned over, and back the same way. */
@container ${is('caret', 'spin')} {
    ${where.caret} {
        transition: rotate var(--ui-duration-400) var(--ui-easing-move);
    }

    ${where.turned} {
        rotate: 540deg;
    }
}
`;
}

/** A panel's moments, in the words of the component that opens it. */
export function moments({ panel, items, labels }: Words): readonly Moment[] {
    return [
        {
            name: 'enter',
            label: 'Open',
            effects: [
                { name: 'none', today: true, says: `The ${panel} is there at once.` },
                { name: 'fade', says: `The ${panel} fades in.` },
                { name: 'drop', says: 'Fades in, coming from the trigger’s side.' },
                { name: 'spring', says: 'Comes from further, past where it hangs and back.' },
                { name: 'unfold', says: 'Uncovered from the trigger’s side outward.' },
                { name: 'curtain', says: 'Uncovered from a line down its middle.' },
                { name: 'wipe', says: 'Uncovered along its lines, from where they are read.' },
                { name: 'refocus', says: 'Comes into focus as it fades in.' },
                {
                    name: 'glitch',
                    says: `Jumps in, in bands, its ${labels} split in two colours.`,
                },
                {
                    name: 'cascade',
                    says: `The ${panel} at once, and its ${items} into it one after another.`,
                },
            ],
        },
        {
            name: 'exit',
            label: 'Close',
            effects: [
                { name: 'none', today: true, says: 'Gone at once.' },
                { name: 'fade', says: 'Fades out.' },
                { name: 'lift', says: 'Fades out, rising away.' },
                { name: 'fold', says: 'Covered back toward the trigger.' },
                { name: 'curtain', says: 'Covered from its edges to a line down its middle.' },
                { name: 'wipe', says: 'Covered along its lines, from where they are read.' },
                { name: 'defocus', says: 'Blurs away, and is gone over the second half.' },
                { name: 'glitch', says: 'Flickers out in bands.' },
            ],
        },
        {
            name: 'caret',
            label: 'Caret',
            effects: [
                { name: 'turn', today: true, says: 'Turns over on the state’s step.' },
                { name: 'none', says: 'Flips at once.' },
                { name: 'spring', says: 'Turns over, past and back.' },
                { name: 'flip', says: 'Flips over its middle line, edge-on halfway.' },
                { name: 'tick', says: 'Turns over in four steps, as a dial clicks.' },
                { name: 'spin', says: 'Spins round once and a half.' },
            ],
        },
    ];
}

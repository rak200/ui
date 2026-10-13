/**
 * What the drawn controls share — `ui-checkbox`, `ui-switch` and the radios `ui-radio-group`
 * renders: what the pointer, an error and focus can do, and the buttons that put a page's required
 * ones in error. The components draw the three alike, the radio beside the checkbox, so each of
 * these effects is drawn alike on all three, and a choice made for the page reads the same on
 * every one.
 */
import { reference } from '../../../src/reference.js';
import type { Moment } from './motion.js';

/** Where one element's shared rules apply. */
export interface Drawn {
    /** The query its effects are drawn under: the consumer's choice, else its taste. */
    readonly is: (moment: string, effect: string) => string;
    /** What its rules start with: its host, so an element that shares its sheet with another
     *  draws only its own. */
    readonly host: string;
    /** A control in error, as the element marks one. */
    readonly invalid: string;
    /** What a control matches when it is filled. */
    readonly filled: string;
    /** The control's own corner, which the orbit's band follows 7px out. */
    readonly radius: string;
}

/** The halo's soft band of the accent, half a rem round the control. */
const band = 'box-shadow: 0 0 0 0.5rem rgb(from var(--ui-color-accent) r g b / 0.16);';

/** The glow's light of the accent, blurred round the control. */
const light = 'box-shadow: 0 0 0.75rem 0.125rem rgb(from var(--ui-color-accent) r g b / 0.5);';

/** The control's ::after laid over it, edge for edge: its ::before is the mark. */
const over = String.raw`
        content: '';
        position: absolute;
        inset: -1px;
        border-radius: inherit;
        pointer-events: none;`;

/** The focus's halo, held for as long as the focus is there. */
const halo = String.raw`${over}
        opacity: 1;
        ${band}`;

/** The focus's orbit: a light run round the control just outside the ring, four laps, then it
 *  fades. The ring is 2px out and 2px wide, so the band runs from 4px out to 7px. */
const orbit = (radius: string): string => String.raw`
        content: '';
        position: absolute;
        inset: -8px;
        padding: 3px;
        border-radius: calc(${radius} + 7px);
        background: conic-gradient(
            from var(--ui-orbit),
            transparent 0 55%,
            var(--ui-color-accent) 75%,
            var(--ui-color-info) 88%,
            transparent
        );
        mask:
            linear-gradient(#000 0 0) content-box exclude,
            linear-gradient(#000 0 0);
        pointer-events: none;
        opacity: 1;
        box-shadow: none;
        animation:
            ui-orbit var(--ui-duration-loop) linear var(--ui-iteration-settle),
            ui-rest var(--ui-duration-200) var(--ui-easing-exit)
                calc(var(--ui-duration-loop) * var(--ui-iteration-settle)) forwards;`;

/** What an error's effects play on the control itself, which a focus's can play beside. */
const erring = {
    pulse: 'ui-alarm var(--ui-duration-400) var(--ui-easing-enter) var(--ui-iteration-settle)',
    flash: 'ui-flash var(--ui-duration-400) var(--ui-easing-exit) var(--ui-iteration-settle)',
    glitch: 'ui-split var(--ui-duration-200) linear var(--ui-iteration-settle)',
} as const;

/** What a focus's effects play on the control itself: the beacon's wave, and the neon's rounds
 *  and the fade from where they leave it. */
const focusing = {
    beacon: ['ui-beacon var(--ui-duration-400) var(--ui-easing-enter)'],
    neon: [
        'ui-neon var(--ui-duration-loop) var(--ui-easing-state) var(--ui-iteration-settle) alternate',
        'ui-neon-rest var(--ui-duration-200) var(--ui-easing-exit) calc(var(--ui-duration-loop) * var(--ui-iteration-settle))',
    ],
} as const;

/** The pointer's, an error's and focus's rules for one element. */
export function rules({ is, host, invalid, filled, radius }: Drawn): string {
    /** The pointer's effects that draw on the ::after the focus's halo and orbit draw on. */
    const pointer = `(${is('hover', 'halo')} or ${is('hover', 'glow')} or ${is('hover', 'pulse')})`;

    /** Each pair of an error's and a focus's effects on the control itself: the two listed, the
     *  error's first, and the focus's added to it. */
    const both = Object.entries(erring)
        .flatMap(([error, plays]) =>
            Object.entries(focusing).map(
                ([focus, lights]) => String.raw`
@container ${is('invalid', error)} and ${is('focus', focus)} {
    ${host} ${invalid}:focus-visible {
        animation: ${[plays, ...lights].join(', ')};
        animation-composition: replace${', add'.repeat(lights.length)};
    }
}`,
            ),
        )
        .join('\n');

    return String.raw`
/* pointer: highlight is the hover colour the component draws today, so it is no rule here. none
   takes it away, back to the colours at rest — the danger boundary and a full control's accent
   too, which the hover colour covers today. Every other effect keeps it, as every focus effect
   keeps the ring. The boundary's colour is derived, so it is read through its formula, as the
   component reads it: written bare it had no value, and the boundary took the accent — measured. */
@container ${is('hover', 'none')} {
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

/* pointer: halo, glow, pulse and zoom. Every hover state here sits under hover: hover, as the
   card's and the button's do: a tap leaves :hover on whatever it touched. */
@media (hover: hover) {
    @container (${is('hover', 'halo')} or ${is('hover', 'glow')}) {
        ${host} input::after {${over}
            opacity: 0;
            transition: opacity var(--ui-duration-200) var(--ui-easing-enter);
        }

        ${host} input:hover:not(:disabled)::after {
            opacity: 1;
        }
    }

    @container ${is('hover', 'halo')} {
        ${host} input::after {
            ${band}
        }
    }

    @container ${is('hover', 'glow')} {
        ${host} input::after {
            ${light}
        }
    }

    /* pulse: a ring of the accent leaves the boundary once, as the pointer arrives. */
    @container ${is('hover', 'pulse')} {
        ${host} input:hover:not(:disabled)::after {${over}
            animation: ui-pulse var(--ui-duration-400) var(--ui-easing-enter);
        }
    }

    /* zoom: a tenth larger, which on a control this small is under 3px. */
    @container ${is('hover', 'zoom')} {
        ${host} input:hover:not(:disabled) {
            scale: 1.1;
        }
    }
}

/* invalid: pulse. The boundary was already red; a ring leaves it, and the control stays where
   the reader aimed. Each effect that draws on the control itself plays a loop that settles, as
   an error stands for as long as the reader leaves it; the message's own play once, since one
   played again would take the message away while it is read. */
@container ${is('invalid', 'pulse')} {
    ${host} ${invalid} {
        animation: ${erring.pulse};
    }
}

/* invalid: glow, a red light held round the control for as long as it is invalid, in place of
   the glow a theme lights it with, which the component turns red there. Never on a disabled
   control, as the component's own glow is not. */
@container ${is('invalid', 'glow')} {
    ${host} ${invalid}:not(:disabled) {
        box-shadow: 0 0 0.75rem 0.125rem rgb(from var(--ui-color-danger) r g b / 0.5);
    }
}

/* invalid: flash, the control tinted red and faded back to its fill. */
@container ${is('invalid', 'flash')} {
    ${host} ${invalid} {
        animation: ${erring.flash};
    }
}

/* invalid: glitch, drawn for the Matrix theme, in the danger and the info the button's glitch
   splits into. The message jumps and splits; the boundary splits where it is, since a target
   leaving where the reader aimed is what the shake was left out for. */
@container ${is('invalid', 'glitch')} {
    ${host} ${invalid} {
        animation: ${erring.glitch};
    }

    ${host} .error {
        animation: ui-glitch var(--ui-duration-200) linear var(--ui-iteration-settle);
    }
}

/* invalid: type, the message typed out from its start: a mask stepped across it a character's
   width at a time, which in a monospaced face is a letter. */
@container ${is('invalid', 'type')} {
    ${host} .error {
        mask-image: linear-gradient(to right, #000 var(--ui-typed), transparent 0);
        animation: ui-type calc(var(--ui-duration-400) * 2) steps(40, end);
    }
}

/* invalid: drop, the message falling into place under the controls, past it and back. */
@container ${is('invalid', 'drop')} {
    ${host} .error {
        animation: ui-drop var(--ui-duration-300) var(--ui-easing-emphasis);
    }
}

/* focus: beacon, after the ring and outside it. */
@container ${is('focus', 'beacon')} {
    ${host} input:focus-visible {
        animation: ${focusing.beacon.join(', ')};
    }
}

/* focus: neon, a lit line round the boundary and a glow that swells from close round it to a wide
   halo, four times. Its last round ends on its lit line, so it fades from there. */
@container ${is('focus', 'neon')} {
    ${host} input:focus-visible {
        animation: ${focusing.neon.join(', ')};
    }
}

/* An error and a focus on one control. Each declares the control's one list of animations, so one
   took the other's away: on the radio the error's rule is the more specific, and the focus never
   played on a radio in error; on the checkbox and the switch the focus's comes later, and an error
   that came while the control had the focus never played on it — measured. So where both play on
   the control, one rule lists both, and the focus's shadows are added to what is drawn under them
   rather than drawn in its place: the error's ring, or the red glow, which they hid otherwise.
   Added, a shadow list goes beside the one under it in all three engines — measured. The one
   shadow Chromium loses is the glow a theme lights the control with: written from currentColor,
   it comes out transparent once added to, where Firefox and WebKit keep it red. */
@container (${is('focus', 'beacon')} or ${is('focus', 'neon')}) {
    ${host} ${invalid}:focus-visible {
        animation-composition: add;
    }
}
${both}

/* focus: halo and orbit, on the ::after the pointer's halo, glow and pulse draw on. Where one of
   those is chosen, the focus's yields to it while the pointer is on the control, as the button's
   does: the pointer is drawn over the focus. */
@container ${is('focus', 'halo')} and (not ${pointer}) {
    ${host} input:focus-visible::after {${halo}
    }
}

@container ${is('focus', 'halo')} and ${pointer} {
    ${host} input:focus-visible:where(:not(:hover))::after {${halo}
    }
}

@container ${is('focus', 'orbit')} and (not ${pointer}) {
    ${host} input:focus-visible::after {${orbit(radius)}
    }
}

@container ${is('focus', 'orbit')} and ${pointer} {
    ${host} input:focus-visible:where(:not(:hover))::after {${orbit(radius)}
    }
}
`;
}

/** The keyframes those rules play: once in a sheet, however many elements it draws. */
export const keyframes = String.raw`
@keyframes ui-pulse {
    from {
        box-shadow: 0 0 0 0 rgb(from var(--ui-color-accent) r g b / 0.5);
    }
    to {
        box-shadow: 0 0 0 0.5rem rgb(from var(--ui-color-accent) r g b / 0);
    }
}

@keyframes ui-alarm {
    from {
        box-shadow: 0 0 0 0 rgb(from var(--ui-color-danger) r g b / 0.5);
    }
    to {
        box-shadow: 0 0 0 0.5rem rgb(from var(--ui-color-danger) r g b / 0);
    }
}

@keyframes ui-flash {
    from {
        background-color: rgb(from var(--ui-color-danger) r g b / 0.4);
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

@keyframes ui-beacon {
    from {
        box-shadow: 0 0 0 2px rgb(from var(--ui-color-focus) r g b / 0.55);
    }
    to {
        box-shadow: 0 0 0 10px rgb(from var(--ui-color-focus) r g b / 0);
    }
}

@keyframes ui-neon {
    from {
        box-shadow:
            0 0 0 1px var(--ui-color-accent),
            0 0 4px 1px rgb(from var(--ui-color-accent) r g b / 0.7),
            0 0 10px 2px rgb(from var(--ui-color-accent) r g b / 0.35);
    }
    to {
        box-shadow:
            0 0 0 1px var(--ui-color-accent),
            0 0 8px 2px var(--ui-color-accent),
            0 0 24px 6px rgb(from var(--ui-color-accent) r g b / 0.5);
    }
}

/* From where an even count of rounds leaves the neon, to what the control rests on. */
@keyframes ui-neon-rest {
    from {
        box-shadow:
            0 0 0 1px var(--ui-color-accent),
            0 0 4px 1px rgb(from var(--ui-color-accent) r g b / 0.7),
            0 0 10px 2px rgb(from var(--ui-color-accent) r g b / 0.35);
    }
}

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

/** The pointer's, an error's and focus's moments, with what a click would do said for the page's
 *  own controls. */
export function moments(preview: string): readonly Moment[] {
    return [
        {
            name: 'hover',
            label: 'Pointer over',
            effects: [
                {
                    name: 'highlight',
                    today: true,
                    says: 'The boundary darkens on an empty control, and the fill deepens on a full one.',
                },
                { name: 'none', says: 'Nothing changes under the pointer.' },
                {
                    name: 'halo',
                    says: 'The hover colour, and a soft band of the accent round the control.',
                },
                {
                    name: 'glow',
                    says: 'The hover colour, and a light of the accent round the control.',
                },
                {
                    name: 'pulse',
                    says: 'The hover colour, and a ring of the accent leaving the boundary once as the pointer arrives.',
                },
                { name: 'zoom', says: 'The hover colour, and the control a tenth larger.' },
                { name: 'preview', says: preview },
            ],
        },
        {
            name: 'invalid',
            label: 'Invalid',
            effects: [
                { name: 'none', today: true, says: 'The boundary and the message turn red.' },
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
                    name: 'flash',
                    settles: true,
                    says: 'The control is tinted red and fades back to its fill, four times, then rests.',
                },
                {
                    name: 'glitch',
                    settles: true,
                    says: 'The message jumps and splits into two colours, and so does the boundary, which stays where it is — four times, then rests. Drawn for Matrix.',
                },
                {
                    name: 'type',
                    says: 'The message is typed out from its start, a letter at a time.',
                },
                {
                    name: 'drop',
                    says: 'The message falls into place under the control, past it and back.',
                },
            ],
        },
        {
            name: 'focus',
            label: 'Focus',
            effects: [
                { name: 'none', today: true, says: 'The ring, drawn at once.' },
                { name: 'beacon', says: 'The ring at once, then a wave past it.' },
                {
                    name: 'halo',
                    says: 'The ring at once, over a soft band of the accent held round the control.',
                },
                {
                    name: 'neon',
                    settles: true,
                    says: 'The ring at once, and a lit line inside it whose glow swells to a wide halo, four times, then rests.',
                },
                {
                    name: 'orbit',
                    settles: true,
                    says: 'The ring at once, and a light running round just outside it, four laps, then it fades.',
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
            for (const control of field.shadowRoot?.querySelectorAll('input') ?? []) {
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

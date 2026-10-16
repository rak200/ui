/**
 * `ui-checkbox` and `ui-switch`: what checking, the pointer, an error and focus can do.
 *
 * The mark's effects start from the change a reader makes, in script, so a box that renders
 * checked never plays them; everything they move is in the sheet.
 */
import { reference } from '../../../../src/reference.js';
import { keyframes, moments, rules, sized, validation, type Field } from '../controls.js';
import { inner, prototype, queries, replay } from '../motion.js';

/** The query each of the checkbox's effects is drawn under, and each of the switch's: the
 *  consumer's choice, else the theme's taste for that element. */
const checkbox = queries('checkbox');
const toggle = queries('switch');

/** The size both are drawn at, as the component writes it and keeps to itself. */
const size = `max(24px, calc(${reference('--ui-space').cssText} * 3))`;

/** The tick the checkbox paints its mark with, which the component keeps to itself too. */
const tick = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12.5l4.5 4.5L19 7'/%3E%3C/svg%3E")`;

/** The pace of the colours and the thumb, as the component writes it. */
const state = reference('--ui-duration-state').cssText;
const ease = reference('--ui-easing-state').cssText;

/** The thumb's spring: a linear() curve that carries it a fifth of its way past its place, back a
 *  little short of it, and to rest by four fifths of the time. */
const bounce =
    'linear(0, 0.45 7%, 0.98 15%, 1.18 22%, 1.22 26%, 1.15 32%, 0.97 44%, 0.94 52%, 1.01 66%, 1 78%, 1)';

/** Plays one mark effect, when the change left the box checked. */
const mark =
    (name: string) =>
    ({ host }: { host: HTMLElement }): void => {
        const input = inner(host, 'input');

        if (input instanceof HTMLInputElement && input.checked) {
            replay(input, name);
        }
    };

/** Sends the pulse out from the control as the change checks it or clears it, on the layer the
 *  control's lights are drawn on. */
const ring = ({ host }: { host: HTMLElement }): void => {
    const input = inner(host, 'input');

    if (input !== null) {
        replay(input, 'pulse', 'data-fx', '::after');
    }
};

const sheet = String.raw`
/* The controls' own transitions, written again with the zoom's and the blur's beside them: an
   element has one list, so a property this sheet eases goes in with the component's, and the
   check's effects below change them by place — the colours, the switch's thumb, then the scale.
   The switch is what its ::after is laid out against, as the checkbox already is for its mark. */
:host(ui-checkbox) input {
    transition-property: background-color, border-color, scale, backdrop-filter;
    transition-duration: ${state}, ${state}, var(--ui-duration-200), var(--ui-duration-200);
    transition-timing-function: ${ease}, ${ease}, var(--ui-easing-emphasis), var(--ui-easing-enter);
}

:host(ui-switch) input {
    position: relative;
    transition-property: background-color, border-color, background-position, scale, backdrop-filter;
    transition-duration: ${state}, ${state}, ${state}, var(--ui-duration-200), var(--ui-duration-200);
    transition-timing-function: ${ease}, ${ease}, ${ease}, var(--ui-easing-emphasis), var(--ui-easing-enter);
}

/* check: fade is what both do today — the colours fade, and the switch's thumb slides as they do
   — so it is no rule here. none takes the state's transitions away, and the state changes at
   once. */
@container ${checkbox('check', 'none')} {
    :host(ui-checkbox) input {
        transition-duration: 0s, 0s, var(--ui-duration-200), var(--ui-duration-200);
    }
}

@container ${toggle('check', 'none')} {
    :host(ui-switch) input {
        transition-duration: 0s, 0s, 0s, var(--ui-duration-200), var(--ui-duration-200);
    }
}

/* check: pop and draw, on the mark the checkbox paints in its ::before. The box takes its colour
   at once while either plays: faded in, the box was still near white while the white mark grew or
   was drawn on it, and the mark was whole by the time the fill showed it — measured. The click
   has begun the fade before the mark is set, so the colours are taken out of the list, which ends
   the fade where it was going. */
:host(ui-checkbox) input[data-fx='pop'],
:host(ui-checkbox) input[data-fx='draw'] {
    transition-property: scale, backdrop-filter;
    transition-duration: var(--ui-duration-200);
    transition-timing-function: var(--ui-easing-emphasis), var(--ui-easing-enter);
}

input[data-fx='pop']::before {
    animation: ui-pop var(--ui-duration-200) var(--ui-easing-emphasis);
}

input[data-fx='draw']::before {
    animation: ui-draw var(--ui-duration-200) var(--ui-easing-enter);
}

/* check: spring, the switch's thumb passing its place and coming back, over a track that takes
   its colour at once. On the emphasis curve, over the state's fade, the thumb went 1.1px past a
   travel of 14px, white on a track still pale, and read as the slide it stood in for — measured;
   the bounce takes it about 3px past, short on the way back, and to rest. */
@container ${toggle('check', 'spring')} {
    :host(ui-switch) input {
        transition-duration: 0s, 0s, var(--ui-duration-400), var(--ui-duration-200),
            var(--ui-duration-200);
        transition-timing-function: linear, linear, ${bounce}, var(--ui-easing-emphasis),
            var(--ui-easing-enter);
    }
}

/* pointer: preview, what a click would do, faintly: the tick, pale, in an empty box, and the
   thumb leaning 3px toward the other side. */
@media (hover: hover) {
    @container ${checkbox('hover-fill', 'preview')} {
        :host(ui-checkbox) input:not(:checked, :indeterminate)::before {
            content: '';
            position: absolute;
            inset: -1px;
            background-color: var(--ui-color-accent);
            mask-image: ${tick};
            mask-size: 100% 100%;
            mask-repeat: no-repeat;
            opacity: 0;
            transition: opacity var(--ui-duration-200) var(--ui-easing-enter);
        }

        :host(ui-checkbox) input:not(:checked, :indeterminate):hover:not(:disabled)::before {
            opacity: 0.4;
        }
    }

    @container ${toggle('hover-fill', 'preview')} {
        :host(ui-switch) input:hover:not(:disabled) {
            background-position: calc(${size} / 6 + 3px) center;
        }

        :host(ui-switch) input:checked:hover:not(:disabled) {
            background-position: calc(100% - ${size} / 6 - 3px) center;
        }
    }
}

${rules({
    is: checkbox,
    host: ':host(ui-checkbox)',
    focused: ':host(ui-checkbox[data-focus-visible])',
    calm: ':host(ui-checkbox:not([data-focus-visible]))',
    invalid: "input[aria-invalid='true']",
    filled: ':is(:checked, :indeterminate)',
    radius: reference('--ui-radius').cssText,
    label: 'label',
    text: "[part='text']",
    width: size,
    height: size,
})}

${rules({
    is: toggle,
    host: ':host(ui-switch)',
    focused: ':host(ui-switch[data-focus-visible])',
    calm: ':host(ui-switch:not([data-focus-visible]))',
    invalid: "input[aria-invalid='true']",
    filled: ':checked',
    radius: size,
    label: 'label',
    text: "[part='text']",
    width: `calc(${size} * 5 / 3)`,
    height: size,
})}

@keyframes ui-pop {
    from {
        scale: 0.3;
    }
}

/* To a whole inset rather than to the mark's own clip, which is none: a shape does not interpolate
   with none, so the tick was hidden for half the draw and then shown whole — measured. */
@keyframes ui-draw {
    from {
        clip-path: inset(0 100% 0 0);
    }
    to {
        clip-path: inset(0 0 0 0);
    }
}

${keyframes}

${sized.small}
`;

prototype({
    tags: ['ui-checkbox', 'ui-switch'],
    sheet,
    moments: [
        {
            name: 'check',
            label: 'Check',
            on: 'change',
            effects: [
                {
                    name: 'fade',
                    today: true,
                    says: 'The fill fades to its new colour, and the switch’s thumb slides across as it does.',
                },
                {
                    name: 'none',
                    says: 'Changes at once — the fill, the mark and the thumb — with nothing moving.',
                },
                {
                    name: 'pop',
                    only: 'ui-checkbox',
                    says: 'The box takes its colour at once and the mark grows into place.',
                    fire: mark('pop'),
                },
                {
                    name: 'draw',
                    only: 'ui-checkbox',
                    says: 'The box takes its colour at once and the tick is drawn left to right.',
                    fire: mark('draw'),
                },
                {
                    name: 'spring',
                    only: 'ui-switch',
                    says: 'The track takes its colour at once; the thumb springs past its place and back.',
                },
                {
                    name: 'pulse',
                    says: 'The fill fades as it does today, and a ring of the accent leaves the control.',
                    fire: ring,
                },
            ],
        },
        ...moments(
            'The hover colour, and what a click would do, faintly: a pale tick in an empty box, the thumb leaning toward the other side.',
        ),
    ],
    refused: [
        {
            name: 'shake',
            why: 'the reference measured it on a field: the target leaves where the reader aimed for half a second, and says nothing the red boundary does not.',
        },
        {
            name: 'jelly',
            why: 'wobbles the control after the state has changed, which is past the 220ms the reference holds a toggle to; the spring says the same in one swing.',
        },
    ],
});

validation(
    'ui-checkbox[required], ui-switch[required]',
    (control) => (control as Field & { checked: boolean }).checked,
    'Required to continue.',
);

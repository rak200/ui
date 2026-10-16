/**
 * `ui-radio-group`: what choosing, the pointer, an error and focus can do. The choice is made on
 * the group, which is the element that renders the controls; a `ui-radio` is a declaration and
 * draws nothing of its own.
 *
 * The pointer, an error and focus are drawn as the checkbox's are, from the rules the drawn
 * controls share; what is the radio's own is choosing, and the dot a click would leave.
 */
import { reference } from '../../../../src/reference.js';
import { keyframes, moments, rules, sized, validation } from '../controls.js';
import { inner, prototype, queries, replay } from '../motion.js';

/** The query each effect is drawn under: the consumer's choice, else the theme's taste. */
const is = queries('radio-group');

/** The size the controls are drawn at, as the component writes it and keeps to itself. */
const size = `max(24px, calc(${reference('--ui-space').cssText} * 3))`;

/** The dot the control paints its mark with, a circle the component keeps to itself too. */
const dot = 'radial-gradient(circle closest-side, #000 100%, transparent 100%)';

/** The pace of the colours, as the component writes it. */
const state = reference('--ui-duration-state').cssText;
const ease = reference('--ui-easing-state').cssText;

/** Plays one mark effect on the control the change chose. */
const mark =
    (name: string) =>
    ({ host }: { host: HTMLElement }): void => {
        const input = inner(host, 'input:checked');

        if (input !== null) {
            replay(input, name);
        }
    };

const sheet = String.raw`
/* The control's own transitions, written again with the zoom's and the blur's beside them, as the
   checkbox's are: an element has one list, so a property this sheet eases goes in with the
   component's. */
:host input {
    transition-property: background-color, border-color, scale, backdrop-filter;
    transition-duration: ${state}, ${state}, var(--ui-duration-200), var(--ui-duration-200);
    transition-timing-function: ${ease}, ${ease}, var(--ui-easing-emphasis), var(--ui-easing-enter);
}

/* check: fade is what the control does today — the chosen one's fill fades in and the one it
   leaves fades out — so it is no rule here. none takes the colours' transitions away, and the
   choice changes at once. */
@container ${is('check', 'none')} {
    :host input {
        transition-duration: 0s, 0s, var(--ui-duration-200), var(--ui-duration-200);
    }
}

/* check: pop and draw, on the dot the control paints in its ::before. The control takes its
   colour at once while either plays, as the checkbox's box does and for its reason: the dot is
   the fill's label, drawn in the colour that reads on the fill. */
:host input[data-fx='pop'],
:host input[data-fx='draw'] {
    transition-property: scale, backdrop-filter;
    transition-duration: var(--ui-duration-200);
    transition-timing-function: var(--ui-easing-emphasis), var(--ui-easing-enter);
}

input[data-fx='pop']::before {
    animation: ui-pop var(--ui-duration-200) var(--ui-easing-emphasis);
}

/* draw: the dot swept round from the top, as a hand goes round a clock — the tick's draw, for a
   mark with no line to be drawn along. A second mask over the dot's, the two intersected. */
input[data-fx='draw']::before {
    mask-image: ${dot}, conic-gradient(#000 var(--ui-swept), transparent 0);
    mask-size: calc(${size} / 2), 100% 100%;
    mask-position: center;
    mask-repeat: no-repeat;
    mask-composite: intersect;
    animation: ui-draw var(--ui-duration-200) var(--ui-easing-enter);
}

/* pointer: preview, what a click would do, faintly: the dot, pale, in an empty control. */
@media (hover: hover) {
    @container ${is('hover-fill', 'preview')} {
        :host input:not(:checked)::before {
            content: '';
            position: absolute;
            inset: -1px;
            background-color: var(--ui-color-accent);
            mask-image: ${dot};
            mask-size: calc(${size} / 2);
            mask-position: center;
            mask-repeat: no-repeat;
            opacity: 0;
            transition: opacity var(--ui-duration-200) var(--ui-easing-enter);
        }

        :host input:not(:checked):hover:not(:disabled)::before {
            opacity: 0.4;
        }
    }
}

${rules({
    is,
    host: ':host',
    focused: ':host([data-focus-visible])',
    calm: ':host(:not([data-focus-visible]))',
    invalid: ".options[aria-invalid='true'] input",
    filled: ':checked',
    radius: '50%',
    label: 'label.option',
    text: "[part='option-label']",
    width: size,
    height: size,
})}

@keyframes ui-pop {
    from {
        scale: 0.2;
    }
}

@keyframes ui-draw {
    from {
        --ui-swept: 0deg;
    }
    to {
        --ui-swept: 360deg;
    }
}

${keyframes}

${sized.small}
`;

prototype({
    tags: ['ui-radio-group'],
    sheet,
    moments: [
        {
            name: 'check',
            label: 'Choose',
            on: 'change',
            effects: [
                {
                    name: 'fade',
                    today: true,
                    says: 'The chosen control’s fill fades in and the one it leaves fades out; the dot is there at once.',
                },
                {
                    name: 'none',
                    says: 'Changes at once — the fills and the dot — with nothing moving.',
                },
                {
                    name: 'pop',
                    says: 'The control takes its colour at once and the dot grows into place.',
                    fire: mark('pop'),
                },
                {
                    name: 'draw',
                    says: 'The control takes its colour at once and the dot is swept round from the top.',
                    fire: mark('draw'),
                },
            ],
        },
        ...moments(
            'The hover colour, and what a click would do, faintly: a pale dot in an empty control.',
        ),
    ],
    refused: [
        {
            name: 'travel',
            why: 'a dot that slides from the old choice to the new one has to be measured across options the platform owns the order of — wrapping lines, right to left — and the reference shows how often a measured indicator lands wrong; the fill already says which one.',
        },
        {
            name: 'shake',
            why: 'moves the targets the reader is choosing between.',
        },
    ],
});

validation(
    'ui-radio-group[required]',
    (group) => group.shadowRoot?.querySelector('input:checked') !== null,
    'Pick a plan to continue.',
);

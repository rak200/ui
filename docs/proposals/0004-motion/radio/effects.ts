/**
 * `ui-radio-group`: what choosing, the pointer, an error and focus can do. The choice is made on
 * the group, which is the element that renders the controls; a `ui-radio` is a declaration and
 * draws nothing of its own.
 *
 * The pointer, an error and focus are drawn as the checkbox's are, from the rules the drawn
 * controls share; what is the radio's own is choosing, and the dot a click would leave.
 */
import { reference } from '../../../../src/reference.js';
import { focal, keyframes, moments, moves, rules, sized, validation } from '../controls.js';
import { duration, easing, inner, prototype, queries, replay, still } from '../motion.js';

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

/** Sends the pulse out from the control the change chose, on the layer its lights are drawn on. */
const ring = ({ host }: { host: HTMLElement }): void => {
    const input = inner(host, 'input:checked');

    if (input !== null) {
        replay(input, 'pulse', 'data-fx', '::after');
    }
};

/** The control each group had chosen as the reader went to change it: read as a key goes down or a
 *  pointer presses in the group, before the platform moves the choice, so a travel knows where it
 *  leaves from. */
const left = new WeakMap<HTMLElement, HTMLInputElement>();

for (const type of ['pointerdown', 'keydown']) {
    document.addEventListener(
        type,
        (event) => {
            const host = event
                .composedPath()
                .find(
                    (node): node is HTMLElement =>
                        node instanceof HTMLElement && node.localName === 'ui-radio-group',
                );
            const input = host === undefined ? null : inner(host, 'input:checked');

            if (host !== undefined && input instanceof HTMLInputElement) {
                left.set(host, input);
            }
        },
        { capture: true },
    );
}

/** The chosen control flown over the page, laid in it the first time a choice travels, and the
 *  end of the flight it is on. */
let traveller: HTMLElement | undefined;
let landing: (() => void) | undefined;

/**
 * Flies the choice from the control the reader left to the one they chose, as the ring's glide
 * flies: a disc drawn as a chosen control is, laid over the one left and moved frame by frame to
 * the one chosen, each measured where it is drawn as the disc goes, so options on lines that wrap
 * and text that runs right to left are wherever the platform put them. The control left is empty
 * at once, and the one chosen is drawn empty until the disc lands on it, then full at once, since
 * what moved between them is the choice. A first choice, with nothing to leave, is made at once,
 * as every one is under reduced motion and in forced colours.
 */
const travel = ({ host }: { host: HTMLElement }): void => {
    const to = inner(host, 'input:checked');
    const from = left.get(host);
    left.delete(host);

    if (
        !(to instanceof HTMLInputElement) ||
        from === undefined ||
        from === to ||
        !from.isConnected ||
        still() ||
        matchMedia('(forced-colors: active)').matches
    ) {
        return;
    }

    landing?.();

    // Both marked before anything is read, so the change's colours are not eased, and what the
    // change had started easing finished: a transition running to the colour a control now has
    // runs on, whatever duration it is given after — measured.
    from.dataset['fx'] = 'left';
    to.dataset['fx'] = 'travel';

    for (const animation of [...from.getAnimations(), ...to.getAnimations()]) {
        if (animation instanceof CSSTransition) {
            animation.finish();
        }
    }

    traveller ??= document.body.appendChild(
        Object.assign(document.createElement('div'), { popover: 'manual', ariaHidden: 'true' }),
    );
    const disc = traveller;
    const style = getComputedStyle(to);
    const mark = getComputedStyle(to, '::before');
    const fill =
        style.getPropertyValue('--ui-color-accent').trim() ||
        reference('--ui-color-accent').cssText;
    disc.style.cssText = [
        'position: fixed',
        'inset: auto',
        'margin: 0',
        'padding: 0',
        'box-sizing: border-box',
        'overflow: visible',
        'pointer-events: none',
        'border-radius: 50%',
        `border: ${style.borderTopWidth} solid ${fill}`,
        `background: radial-gradient(circle closest-side, ${mark.backgroundColor} 100%, transparent 100%) center / ${mark.maskSize} no-repeat, ${fill}`,
        `box-shadow: ${style.boxShadow}`,
    ].join('; ');

    const lay = (progress: number): void => {
        const a = from.getBoundingClientRect();
        const b = to.getBoundingClientRect();
        const along = (start: number, end: number): string =>
            `${(start + (end - start) * progress).toFixed(2)}px`;
        disc.style.left = along(a.x, b.x);
        disc.style.top = along(a.y, b.y);
        disc.style.width = along(a.width, b.width);
        disc.style.height = along(a.height, b.height);
    };

    // The one chosen drawn as the one left now is: written on it, since the colours a chosen
    // control takes under the pointer and at the focus outweigh any rule of the travel's own.
    const empty = getComputedStyle(from);
    to.style.backgroundColor = empty.backgroundColor;
    to.style.borderColor = empty.borderTopColor;
    lay(0);
    disc.showPopover();

    const clock = disc.animate(null, {
        duration: duration(host, '--ui-duration-300'),
        easing: easing(host, '--ui-easing-move'),
    });
    const end = (): void => {
        if (landing !== end) {
            return;
        }

        landing = undefined;
        clock.cancel();
        disc.hidePopover();
        // Full at once, read back before the transitions return, so they find nothing to ease.
        to.dataset['fx'] = 'landed';
        to.style.removeProperty('background-color');
        to.style.removeProperty('border-color');
        getComputedStyle(to).getPropertyValue('background-color');
        delete from.dataset['fx'];
        requestAnimationFrame(() => {
            if (to.dataset['fx'] === 'landed') {
                delete to.dataset['fx'];
            }
        });
    };
    landing = end;

    const step = (): void => {
        const progress = clock.effect?.getComputedTiming().progress;

        if (landing !== end || progress === null || progress === undefined) {
            return;
        }

        lay(progress);
        requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
    clock.finished.then(end, () => undefined);
};

const sheet = String.raw`
/* The control's own transitions, written again with the zoom's and the blur's beside them, as the
   checkbox's are: an element has one list, so a property this sheet eases goes in with the
   component's. */
:host input {
    transition-property: background-color, border-color, scale, backdrop-filter, translate, transform;
    transition-duration: ${state}, ${state}, var(--ui-duration-200), var(--ui-duration-200),
        var(--ui-duration-200), var(--ui-duration-100);
    transition-timing-function: ${ease}, ${ease}, var(--ui-easing-emphasis), var(--ui-easing-enter),
        var(--ui-easing-enter), linear;
}

/* check: fade is what the control does today — the chosen one's fill fades in and the one it
   leaves fades out — so it is no rule here. none takes the colours' transitions away, and the
   choice changes at once. */
@container ${is('check', 'none')} {
    :host input {
        transition-duration: 0s, 0s, var(--ui-duration-200), var(--ui-duration-200),
            var(--ui-duration-200), var(--ui-duration-100);
    }
}

/* check: pop and draw, on the dot the control paints in its ::before. The control takes its
   colour at once while either plays, as the checkbox's box does and for its reason: the dot is
   the fill's label, drawn in the colour that reads on the fill. */
:host input[data-fx='pop'],
:host input[data-fx='draw'] {
    transition-property: scale, backdrop-filter, translate, transform;
    transition-duration: var(--ui-duration-200), var(--ui-duration-200), var(--ui-duration-200),
        var(--ui-duration-100);
    transition-timing-function: var(--ui-easing-emphasis), var(--ui-easing-enter),
        var(--ui-easing-enter), linear;
}

input[data-fx='pop']::before {
    animation: ui-pop var(--ui-duration-200) var(--ui-easing-emphasis);
}

/* check: travel, the choice flown from one control to the other by the script, which draws the one
   chosen empty under the flight: the control left empty at once, and the one chosen full at once
   as the flight lands, its mark hidden till then. */
:host input:is([data-fx='left'], [data-fx='travel'], [data-fx='landed']) {
    transition-duration: 0s, 0s, var(--ui-duration-200), var(--ui-duration-200),
        var(--ui-duration-200), var(--ui-duration-100);
}

:host input[data-fx='travel']::before {
    visibility: hidden;
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

/* pointer: preview, what a click would do, faintly: the dot, pale, in an empty control. At the
   focus, what Space would do, the same way. */
@container ${is('hover-fill', 'preview')} or ${is('focus-fill', 'preview')} {
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
}

@media (hover: hover) {
    @container ${is('hover-fill', 'preview')} {
        :host input:not(:checked):hover:not(:disabled)::before {
            opacity: 0.4;
        }
    }
}

@container ${is('focus-fill', 'preview')} {
    :host input:not(:checked):focus-visible::before {
        opacity: 0.4;
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
    past: String.raw`
        /* Half a pixel past the edge of the 24px the radio is drawn at, turned as the switch's is,
           for Firefox. */
        transform: scale(calc(25 / 24)) rotate(0.001deg);`,
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

${moves}

${sized.small}

${focal.frames(keyframes + moves + sized.small)}
`;

prototype({
    tags: ['ui-radio-group'],
    // Each choice in the group, so the edge is lit round the one the pointer is nearest.
    bounded: 'input',
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
                {
                    name: 'pulse',
                    says: 'The fills fade as they do today, and a ring of the accent leaves the chosen control.',
                    fire: ring,
                },
                {
                    name: 'travel',
                    says: 'The choice flies from the control left to the one chosen, which takes it as it lands; a first choice is made at once.',
                    fire: travel,
                },
            ],
        },
        ...moments(
            'The hover colour, and what a click would do, faintly: a pale dot in an empty control.',
        ),
    ],
    refused: [
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

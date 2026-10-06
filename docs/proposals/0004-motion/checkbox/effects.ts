/**
 * `ui-checkbox` and `ui-switch`: what checking, an error and focus can do.
 *
 * The mark's effects start from the change a reader makes, in script, so a box that renders
 * checked never plays them; everything they move is in the sheet.
 */
import { inner, prototype, replay } from '../motion.js';

/** Plays one mark effect, when the change left the box checked. */
const mark =
    (name: string) =>
    ({ host }: { host: HTMLElement }): void => {
        const input = inner(host, 'input');

        if (input instanceof HTMLInputElement && input.checked) {
            replay(input, name);
        }
    };

const sheet = String.raw`
/* check: pop and draw, on the mark the checkbox paints in its ::before. */
input[data-fx='pop']::before {
    animation: ui-pop var(--ui-duration-200) var(--ui-easing-emphasis);
}

input[data-fx='draw']::before {
    animation: ui-draw var(--ui-duration-200) var(--ui-easing-enter);
}

/* check: spring, the switch's thumb passing its place and settling back. */
@container style(--ui-motion-check: spring) {
    :host(ui-switch) input {
        transition-duration: var(--ui-duration-state), var(--ui-duration-state), var(--ui-duration-200);
        transition-timing-function: var(--ui-easing-state), var(--ui-easing-state), var(--ui-easing-emphasis);
    }
}

/* invalid: pulse. The boundary was already red; a ring leaves it once, and the control stays
   where the reader aimed. */
@container style(--ui-motion-invalid: pulse) {
    input[aria-invalid='true'] {
        animation: ui-alarm var(--ui-duration-400) var(--ui-easing-exit);
    }
}

/* focus: beacon, after the ring and outside it. */
@container style(--ui-motion-focus: beacon) {
    input:focus-visible {
        animation: ui-beacon var(--ui-duration-400) var(--ui-easing-exit);
    }
}

@keyframes ui-pop {
    from {
        scale: 0.3;
    }
}

@keyframes ui-draw {
    from {
        clip-path: inset(0 100% 0 0);
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

@keyframes ui-beacon {
    from {
        box-shadow: 0 0 0 2px rgb(from var(--ui-color-focus) r g b / 0.55);
    }
    to {
        box-shadow: 0 0 0 10px rgb(from var(--ui-color-focus) r g b / 0);
    }
}
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
                    name: 'none',
                    today: true,
                    says: 'The fill and the mark change colour; the thumb slides.',
                },
                {
                    name: 'pop',
                    only: 'ui-checkbox',
                    says: 'The mark grows into place.',
                    fire: mark('pop'),
                },
                {
                    name: 'draw',
                    only: 'ui-checkbox',
                    says: 'The tick is drawn left to right.',
                    fire: mark('draw'),
                },
                {
                    name: 'spring',
                    only: 'ui-switch',
                    says: 'The thumb passes its place and settles back.',
                },
            ],
        },
        {
            name: 'invalid',
            label: 'Invalid',
            effects: [
                { name: 'none', today: true, says: 'The boundary and the message turn red.' },
                { name: 'pulse', says: 'A red ring leaves the boundary once; nothing moves.' },
            ],
        },
        {
            name: 'focus',
            label: 'Focus',
            effects: [
                { name: 'none', today: true, says: 'The ring, drawn at once.' },
                { name: 'beacon', says: 'The ring at once, then a wave past it.' },
            ],
        },
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

for (const button of document.querySelectorAll<HTMLElement>('[data-validate]')) {
    button.addEventListener('click', () => {
        for (const control of document.querySelectorAll(
            'ui-checkbox[required], ui-switch[required]',
        )) {
            if ((control as HTMLElement & { checked: boolean }).checked) {
                control.removeAttribute('error');
            } else {
                control.setAttribute('error', 'Required to continue.');
            }
        }
    });
}

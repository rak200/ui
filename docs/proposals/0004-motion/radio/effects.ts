/**
 * `ui-radio-group`: what choosing, an error and focus can do. The choice is made on the group,
 * which is the element that renders the controls; a `ui-radio` is a declaration and draws
 * nothing of its own.
 */
import { inner, prototype, replay } from '../motion.js';

const sheet = String.raw`
/* check: pop, on the dot the control paints in its ::before. */
input[data-fx='pop']::before {
    animation: ui-pop var(--ui-duration-200) var(--ui-easing-emphasis);
}

@container style(--ui-motion-invalid: pulse) {
    .options[aria-invalid='true'] input {
        animation: ui-alarm var(--ui-duration-400) var(--ui-easing-exit);
    }
}

@container style(--ui-motion-focus: beacon) {
    input:focus-visible {
        animation: ui-beacon var(--ui-duration-400) var(--ui-easing-exit);
    }
}

@keyframes ui-pop {
    from {
        scale: 0.2;
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
    tags: ['ui-radio-group'],
    sheet,
    moments: [
        {
            name: 'check',
            label: 'Choose',
            on: 'change',
            effects: [
                { name: 'none', today: true, says: 'The chosen control fills, the dot appears.' },
                {
                    name: 'pop',
                    says: 'The dot grows into place.',
                    fire: ({ host }) => {
                        const input = inner(host, 'input:checked');

                        if (input !== null) {
                            replay(input, 'pop');
                        }
                    },
                },
            ],
        },
        {
            name: 'invalid',
            label: 'Invalid',
            effects: [
                { name: 'none', today: true, says: 'The boundaries and the message turn red.' },
                { name: 'pulse', says: 'A red ring leaves each control once; nothing moves.' },
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
            name: 'travel',
            why: 'a dot that slides from the old choice to the new one has to be measured across options the platform owns the order of — wrapping lines, right to left — and the reference shows how often a measured indicator lands wrong; the fill already says which one.',
        },
        {
            name: 'shake',
            why: 'moves the targets the reader is choosing between.',
        },
    ],
});

for (const button of document.querySelectorAll<HTMLElement>('[data-validate]')) {
    button.addEventListener('click', () => {
        for (const group of document.querySelectorAll('ui-radio-group[required]')) {
            if (group.shadowRoot?.querySelector('input:checked') === null) {
                group.setAttribute('error', 'Pick a plan to continue.');
            } else {
                group.removeAttribute('error');
            }
        }
    });
}

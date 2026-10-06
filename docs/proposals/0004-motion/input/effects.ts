/**
 * `ui-input` and `ui-textarea`: what focus and an error can do. A field is where the
 * reference measured motion getting in the way, so the catalogue here is short and nothing in
 * it moves the control.
 */
import { prototype } from '../motion.js';

const sheet = String.raw`
input,
textarea {
    transition-property: border-color, box-shadow;
    transition-duration: var(--ui-duration-state), var(--ui-duration-200);
    transition-timing-function: var(--ui-easing-state), var(--ui-easing-enter);
}

/* focus: halo, a soft ring of the accent around the field, beside the focus ring. */
@container style(--ui-motion-focus: halo) {
    input:focus-visible,
    textarea:focus-visible {
        box-shadow: 0 0 0 0.25rem rgb(from var(--ui-color-accent) r g b / 0.22);
    }
}

/* focus: underline, a line of the accent drawn out from the middle along the bottom edge. */
@container style(--ui-motion-focus: underline) {
    .glow {
        position: relative;
    }

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

/* invalid: pulse. The ring leaves the boundary once, and the field stays where it was. */
@container style(--ui-motion-invalid: pulse) {
    input[aria-invalid='true'],
    textarea[aria-invalid='true'] {
        animation: ui-alarm var(--ui-duration-400) var(--ui-easing-exit);
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
`;

prototype({
    tags: ['ui-input', 'ui-textarea'],
    sheet,
    moments: [
        {
            name: 'focus',
            label: 'Focus',
            effects: [
                { name: 'none', today: true, says: 'The ring, drawn at once.' },
                { name: 'halo', says: 'A soft ring of the accent fades in around the field.' },
                { name: 'underline', says: 'A line of the accent is drawn along the bottom edge.' },
            ],
        },
        {
            name: 'invalid',
            label: 'Invalid',
            effects: [
                { name: 'none', today: true, says: 'The boundary and the message turn red.' },
                {
                    name: 'pulse',
                    says: 'A red ring leaves the boundary once; the field stays put.',
                },
            ],
        },
    ],
    refused: [
        {
            name: 'shake',
            why: 'the reference measured 7px of travel for half a second: the field leaves where the reader aimed, and the red boundary already says what the shake says.',
        },
        {
            name: 'floating label',
            why: 'moves the field’s name into it on focus — text the reader has just read, moving while they type under it.',
        },
        {
            name: 'message slide',
            why: 'a message that opens and pushes the next field down moves the reader’s next target, which the reference measured; the space is reserved instead, and that is layout, not an effect.',
        },
    ],
});

for (const button of document.querySelectorAll<HTMLElement>('[data-validate]')) {
    button.addEventListener('click', () => {
        for (const field of document.querySelectorAll(
            'ui-input[required], ui-textarea[required]',
        )) {
            if ((field as HTMLElement & { value: string }).value === '') {
                field.setAttribute('error', 'Fill this in to continue.');
            } else {
                field.removeAttribute('error');
            }
        }
    });
}

/**
 * `ui-select`: what focus and an error can do. The list itself is the platform's popup, which
 * no style reaches in two engines of three, so opening it is not a moment this catalogue has.
 */
import { prototype } from '../motion.js';

const sheet = String.raw`
select {
    transition-property: border-color, box-shadow;
    transition-duration: var(--ui-duration-state), var(--ui-duration-200);
    transition-timing-function: var(--ui-easing-state), var(--ui-easing-enter);
}

@container style(--ui-motion-focus: halo) {
    select:focus-visible {
        box-shadow: 0 0 0 0.25rem rgb(from var(--ui-color-accent) r g b / 0.22);
    }
}

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

@container style(--ui-motion-invalid: pulse) {
    select[aria-invalid='true'] {
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
    tags: ['ui-select'],
    sheet,
    moments: [
        {
            name: 'focus',
            label: 'Focus',
            effects: [
                { name: 'none', today: true, says: 'The ring, drawn at once.' },
                { name: 'halo', says: 'A soft ring of the accent fades in around the box.' },
                { name: 'underline', says: 'A line of the accent is drawn along the bottom edge.' },
            ],
        },
        {
            name: 'invalid',
            label: 'Invalid',
            effects: [
                { name: 'none', today: true, says: 'The boundary and the message turn red.' },
                { name: 'pulse', says: 'A red ring leaves the boundary once; the box stays put.' },
            ],
        },
    ],
    refused: [
        {
            name: 'opening the list',
            why: 'the list is the platform’s popup; docs/select.md publishes what it refuses, and appearance: base-select, which would hand it over, is in one engine.',
        },
        {
            name: 'shake',
            why: 'moves the box the reader aimed at, for the reason the input’s page gives.',
        },
    ],
});

for (const button of document.querySelectorAll<HTMLElement>('[data-validate]')) {
    button.addEventListener('click', () => {
        for (const select of document.querySelectorAll('ui-select[required]')) {
            if ((select as HTMLElement & { value: string }).value === '') {
                select.setAttribute('error', 'Choose one to continue.');
            } else {
                select.removeAttribute('error');
            }
        }
    });
}

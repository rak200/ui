/**
 * `ui-dialog`: what the entrance, the exit and the backdrop can do.
 *
 * The component closes once every animation on its `<dialog>` has finished, so an exit effect
 * is waited out by the code that is already there; each one moves on one duration so they end
 * together. The entrance and exit are on the `<dialog>` inside the shadow root, which every
 * scope reaches.
 */
import { UiDialog } from '../../../../src/dialog.js';
import { prototype } from '../motion.js';

const sheet = String.raw`
/* entrance */
@container style(--ui-motion-enter: none) {
    dialog[open]:not(.closing) {
        transition: none;
    }
}

@container style(--ui-motion-enter: rise) {
    dialog[open]:not(.closing) {
        transition:
            opacity var(--ui-duration-300) var(--ui-easing-enter),
            translate var(--ui-duration-300) var(--ui-easing-enter);
    }

    @starting-style {
        dialog[open] {
            opacity: 0;
            translate: 0 1rem;
        }
    }
}

@container style(--ui-motion-enter: zoom) {
    dialog[open]:not(.closing) {
        transition:
            opacity var(--ui-duration-300) var(--ui-easing-enter),
            scale var(--ui-duration-300) var(--ui-easing-enter);
    }

    @starting-style {
        dialog[open] {
            opacity: 0;
            scale: 0.96;
        }
    }
}

@container style(--ui-motion-enter: drop) {
    dialog[open]:not(.closing) {
        animation: ui-drop var(--ui-duration-400) linear;
    }
}

/* iris: uncovered from the middle outward, as a circle grows. Open, the circle clears the
   corners and the focus ring past them. */
@container style(--ui-motion-enter: iris) {
    dialog[open]:not(.closing) {
        clip-path: circle(150% at 50% 50%);
        transition:
            opacity var(--ui-duration-300) var(--ui-easing-enter),
            clip-path var(--ui-duration-300) var(--ui-easing-enter);
    }

    @starting-style {
        dialog[open] {
            clip-path: circle(0% at 50% 50%);
        }
    }
}

/* exit */
@container style(--ui-motion-exit: none) {
    dialog.closing {
        transition: none;
    }
}

@container style(--ui-motion-exit: sink) {
    dialog.closing {
        translate: 0 1rem;
        transition:
            opacity var(--ui-duration-200) var(--ui-easing-exit),
            translate var(--ui-duration-200) var(--ui-easing-exit);
    }
}

@container style(--ui-motion-exit: zoom) {
    dialog.closing {
        scale: 0.96;
        transition:
            opacity var(--ui-duration-200) var(--ui-easing-exit),
            scale var(--ui-duration-200) var(--ui-easing-exit);
    }
}

/* backdrop */
@container style(--ui-motion-backdrop: none) {
    dialog::backdrop {
        transition: none;
    }
}

@container style(--ui-motion-backdrop: blur) {
    dialog::backdrop {
        backdrop-filter: blur(4px);
        transition:
            opacity var(--ui-duration-300) var(--ui-easing-enter),
            backdrop-filter var(--ui-duration-300) var(--ui-easing-enter);
    }

    @starting-style {
        dialog[open]::backdrop {
            backdrop-filter: blur(0);
        }
    }

    dialog.closing::backdrop {
        backdrop-filter: blur(0);
    }
}

@keyframes ui-drop {
    0% {
        opacity: 0;
        translate: 0 -4rem;
        animation-timing-function: ease-in;
    }
    45% {
        opacity: 1;
        translate: 0 0;
        animation-timing-function: ease-out;
    }
    70% {
        translate: 0 -0.75rem;
        animation-timing-function: ease-in;
    }
    88% {
        translate: 0 0;
        animation-timing-function: ease-out;
    }
    95% {
        translate: 0 -0.2rem;
        animation-timing-function: ease-in;
    }
    100% {
        translate: 0 0;
    }
}
`;

prototype({
    tags: ['ui-dialog'],
    sheet,
    moments: [
        {
            name: 'enter',
            label: 'Entrance',
            effects: [
                { name: 'fade', today: true, says: 'Fades in, on the state’s step.' },
                { name: 'none', says: 'There at once.' },
                { name: 'rise', says: 'Fades in from a little below.' },
                { name: 'zoom', says: 'Fades in from a little smaller.' },
                { name: 'drop', says: 'Falls in from above and bounces to rest.' },
                { name: 'iris', says: 'Uncovered from the middle outward.' },
            ],
        },
        {
            name: 'exit',
            label: 'Exit',
            effects: [
                { name: 'fade', today: true, says: 'Fades out, on the state’s step.' },
                { name: 'none', says: 'Gone at once.' },
                { name: 'sink', says: 'Fades out, going down.' },
                { name: 'zoom', says: 'Fades out, getting smaller.' },
            ],
        },
        {
            name: 'backdrop',
            label: 'Backdrop',
            effects: [
                { name: 'fade', today: true, says: 'The scrim fades in and out.' },
                { name: 'none', says: 'The scrim is there at once.' },
                { name: 'blur', says: 'The page behind blurs as the scrim comes in.' },
            ],
        },
    ],
    refused: [
        {
            name: 'reveal from the click',
            why: 'a circle that opens from where the trigger was clicked needs the point, which the dialog does not have: it is opened by a call, from a key as often as from a pointer.',
        },
        {
            name: 'shake',
            why: 'answering a dismissal the dialog refuses by shaking it. Every ui-dialog closes on Escape and on its actions, so there is no refusal to answer.',
        },
    ],
});

for (const button of document.querySelectorAll<HTMLElement>('[data-open]')) {
    button.addEventListener('click', () => {
        const dialog = document.querySelector(button.dataset['open'] ?? '');

        if (dialog instanceof UiDialog) {
            dialog.show();
        }
    });
}

for (const button of document.querySelectorAll<HTMLElement>('[data-close]')) {
    button.addEventListener('click', () => {
        button.closest('ui-dialog')?.close();
    });
}

/**
 * `ui-menu`: what opening, closing and the caret can do.
 *
 * **Nothing here changes the panel's size.** The menu measures the panel to place it, so an
 * entrance that started scaled would be measured instead of the panel: opacity, a transform
 * and a clip are what the effects use, and none of them is in the box the script reads.
 *
 * An exit holds the panel on screen while it runs — `display` and `overlay` transitioned as
 * discrete values — and only when one is chosen, so a menu with no exit still closes at once.
 */
import { prototype } from '../motion.js';

const sheet = String.raw`
@container style(--ui-motion-enter: fade) {
    [popover]:popover-open {
        transition: opacity var(--ui-duration-200) var(--ui-easing-enter);
    }

    @starting-style {
        [popover]:popover-open {
            opacity: 0;
        }
    }
}

@container style(--ui-motion-enter: drop) {
    [popover]:popover-open {
        transition:
            opacity var(--ui-duration-200) var(--ui-easing-enter),
            transform var(--ui-duration-200) var(--ui-easing-enter);
    }

    @starting-style {
        [popover]:popover-open {
            opacity: 0;
            transform: translateY(-0.5rem);
        }

        [popover][data-side='block-start']:popover-open {
            transform: translateY(0.5rem);
        }
    }
}

/* unfold: the clip opens from the trigger's side. Open, it clears the shadow's reach, so the
   layer the menu lifts itself on is not cut. */
@container style(--ui-motion-enter: unfold) {
    [popover]:popover-open {
        clip-path: inset(-1rem);
        transition: clip-path var(--ui-duration-200) var(--ui-easing-enter);
    }

    @starting-style {
        [popover]:popover-open {
            clip-path: inset(-1rem -1rem 100% -1rem);
        }

        [popover][data-side='block-start']:popover-open {
            clip-path: inset(100% -1rem -1rem -1rem);
        }
    }
}

@container style(--ui-motion-exit: fade) {
    [popover]:not(:popover-open) {
        opacity: 0;
        transition:
            opacity var(--ui-duration-200) var(--ui-easing-exit),
            display var(--ui-duration-200) allow-discrete,
            overlay var(--ui-duration-200) allow-discrete;
    }
}

@container style(--ui-motion-exit: lift) {
    [popover]:not(:popover-open) {
        opacity: 0;
        transform: translateY(-0.5rem);
        transition:
            opacity var(--ui-duration-200) var(--ui-easing-exit),
            transform var(--ui-duration-200) var(--ui-easing-exit),
            display var(--ui-duration-200) allow-discrete,
            overlay var(--ui-duration-200) allow-discrete;
    }
}

@container style(--ui-motion-exit: fold) {
    [popover]:popover-open {
        clip-path: inset(-1rem);
    }

    [popover]:not(:popover-open) {
        clip-path: inset(-1rem -1rem 100% -1rem);
        transition:
            clip-path var(--ui-duration-200) var(--ui-easing-exit),
            display var(--ui-duration-200) allow-discrete,
            overlay var(--ui-duration-200) allow-discrete;
    }
}

/* caret: today it turns over on the state's step. */
@container style(--ui-motion-caret: none) {
    svg {
        transition: none;
    }
}

@container style(--ui-motion-caret: spring) {
    svg {
        transition: rotate var(--ui-duration-300) var(--ui-easing-emphasis);
    }
}
`;

prototype({
    tags: ['ui-menu'],
    sheet,
    moments: [
        {
            name: 'enter',
            label: 'Open',
            effects: [
                { name: 'none', today: true, says: 'The panel is there at once.' },
                { name: 'fade', says: 'The panel fades in.' },
                { name: 'drop', says: 'Fades in, coming from the trigger’s side.' },
                { name: 'unfold', says: 'Uncovered from the trigger’s side outward.' },
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
            ],
        },
        {
            name: 'caret',
            label: 'Caret',
            effects: [
                { name: 'turn', today: true, says: 'Turns over on the state’s step.' },
                { name: 'none', says: 'Flips at once.' },
                { name: 'spring', says: 'Turns over, past and back.' },
            ],
        },
    ],
    refused: [
        {
            name: 'zoom',
            why: 'a panel that starts scaled is measured scaled: the menu places the panel by its size, read the moment it opens.',
        },
        {
            name: 'dim the others',
            why: 'fading every item but the one under the pointer puts their text under the 4.5:1 the menu clears, for as long as the pointer is in it.',
        },
    ],
});

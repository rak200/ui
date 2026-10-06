/**
 * `ui-tooltip`: what appearing and leaving can do.
 *
 * The tip is the host's own element, reached through `::slotted()`, and placed by script with
 * `translate` — so the effects use opacity and a transform, which leave both alone.
 */
import { prototype } from '../motion.js';

const sheet = String.raw`
@container style(--ui-motion-enter: fade) {
    slot[name='tip']::slotted(:popover-open) {
        transition: opacity var(--ui-duration-200) var(--ui-easing-enter);
    }

    @starting-style {
        slot[name='tip']::slotted(:popover-open) {
            opacity: 0;
        }
    }
}

/* rise: from a little nearer the trigger, toward where it sits. */
@container style(--ui-motion-enter: rise) {
    slot[name='tip']::slotted(:popover-open) {
        transition:
            opacity var(--ui-duration-200) var(--ui-easing-enter),
            transform var(--ui-duration-200) var(--ui-easing-enter);
    }

    /* The side is written by the script that places the tip, after the tip first renders, so
       the start cannot wait for it: above the trigger, where the tooltip places a tip first,
       is the default, and a tip below says so once it has been placed there before. */
    @starting-style {
        slot[name='tip']::slotted(:popover-open) {
            opacity: 0;
            transform: translateY(0.25rem);
        }

        slot[name='tip']::slotted([data-side='block-end']:popover-open) {
            transform: translateY(-0.25rem);
        }
    }
}

@container style(--ui-motion-exit: fade) {
    slot[name='tip']::slotted(:not(:popover-open)) {
        opacity: 0;
        transition:
            opacity var(--ui-duration-200) var(--ui-easing-exit),
            display var(--ui-duration-200) allow-discrete,
            overlay var(--ui-duration-200) allow-discrete;
    }
}
`;

prototype({
    tags: ['ui-tooltip'],
    sheet,
    moments: [
        {
            name: 'enter',
            label: 'Appear',
            effects: [
                { name: 'none', today: true, says: 'The tip is there at once.' },
                { name: 'fade', says: 'The tip fades in.' },
                { name: 'rise', says: 'Fades in, moving away from the trigger.' },
            ],
        },
        {
            name: 'exit',
            label: 'Leave',
            effects: [
                { name: 'none', today: true, says: 'Gone at once.' },
                { name: 'fade', says: 'Fades out — and can still be pointed at while it does.' },
            ],
        },
    ],
    refused: [
        {
            name: 'zoom',
            why: 'the tooltip places the tip by its size, read the moment it shows; a tip that starts scaled is placed by the wrong size.',
        },
        {
            name: 'delay',
            why: 'waiting before showing is a timing decision, not motion, and WCAG 1.4.13 already has a say in it.',
        },
    ],
});

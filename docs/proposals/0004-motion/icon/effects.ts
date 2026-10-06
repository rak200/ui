/**
 * `ui-icon`: what an entrance and the pointer can do. An icon has no moment of its own past
 * those two — the button around it is what is pressed.
 */
import '../../../../src/icons/check.js';
import '../../../../src/icons/circle-alert.js';
import '../../../../src/icons/search.js';
import '../../../../src/icons/settings.js';
import '../../../../src/icons/star.js';
import '../../../../src/icons/trash-2.js';
import { prototype } from '../motion.js';

const sheet = String.raw`
svg {
    transition-property: scale, rotate, opacity;
    transition-duration: var(--ui-duration-200), var(--ui-duration-200), var(--ui-duration-300);
    transition-timing-function: var(--ui-easing-emphasis), var(--ui-easing-emphasis), var(--ui-easing-enter);
}

@container style(--ui-motion-hover: pop) {
    :host(:hover) svg {
        scale: 1.15;
    }
}

@container style(--ui-motion-hover: turn) {
    :host(:hover) svg {
        rotate: 15deg;
    }
}

/* draw: each stroke drawn from its start. The dash is longer than any stroke in a 24-unit
   glyph, so the whole stroke is one dash, hidden by the offset and then shown. */
@container style(--ui-motion-enter: draw) {
    svg > * {
        stroke-dasharray: 120;
        stroke-dashoffset: 0;
        transition: stroke-dashoffset var(--ui-duration-400) var(--ui-easing-enter);
    }

    @starting-style {
        svg > * {
            stroke-dashoffset: 120;
        }
    }
}

@container style(--ui-motion-enter: fade) {
    @starting-style {
        svg {
            opacity: 0;
        }
    }
}
`;

prototype({
    tags: ['ui-icon'],
    sheet,
    moments: [
        {
            name: 'enter',
            label: 'Entrance',
            effects: [
                { name: 'none', today: true, says: 'There when it renders.' },
                { name: 'draw', says: 'Each stroke drawn from its start.' },
                { name: 'fade', says: 'Fades in.' },
            ],
        },
        {
            name: 'hover',
            label: 'Pointer over',
            effects: [
                { name: 'none', today: true, says: 'Nothing moves.' },
                { name: 'pop', says: 'Grows a little, past and back.' },
                { name: 'turn', says: 'Turns a few degrees.' },
            ],
        },
    ],
    refused: [
        {
            name: 'spin',
            why: 'turning for as long as something loads is a state the icon would have to be told about, not a moment it answers — a busy state is a decision of its own.',
        },
        {
            name: 'morph',
            why: 'one glyph becoming another needs both drawn with the same commands, which a vendored set does not promise.',
        },
    ],
});

const glyphs = ['check', 'search', 'trash-2', 'circle-alert', 'settings', 'star'];

for (const button of document.querySelectorAll<HTMLElement>('[data-icon]')) {
    button.addEventListener('click', () => {
        const target = document.querySelector(button.dataset['icon'] ?? '');

        if (target === null) {
            return;
        }

        const icon = document.createElement('ui-icon');
        icon.setAttribute(
            'name',
            glyphs[target.querySelectorAll('ui-icon').length % glyphs.length] ?? 'check',
        );
        target.append(icon);
    });
}

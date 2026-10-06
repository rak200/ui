/**
 * `ui-table`: what the row under the pointer and a row the host adds can do.
 *
 * The table's rules are adopted into the tree the host's table is in, not into a shadow root,
 * so these go there too — and the keyframes and the rows are then in one tree, which is what
 * S5 asks. A row's container is its `tbody`, which inherits the choice from the `ui-table`
 * around it, so every scope reaches it.
 */
import { reference } from '../../../../src/reference.js';
import { prototype } from '../motion.js';

// The tint a new row arrives in, registered so it can be transitioned to nothing.
try {
    CSS.registerProperty({
        name: '--ui-row-tint',
        syntax: '<color>',
        inherits: false,
        initialValue: 'transparent',
    });
} catch {
    // Registered by an earlier load, which is all that is needed.
}

// The derived hover colour, written the way a component writes it: the formula rides in the
// fallback, so it resolves against the grounds where the row is.
const hover = reference('--ui-color-hover').cssText;

const sheet = String.raw`
/* :nth-child(n) matches every row, and lifts these to the stripe rule's weight, which this
   sheet then follows. */
@container style(--ui-motion-hover: highlight) {
    ui-table tbody tr:nth-child(n) {
        transition: background-color var(--ui-duration-50) var(--ui-easing-state);
    }

    ui-table tbody tr:nth-child(n):hover {
        background-color: ${hover};
    }
}

@container style(--ui-motion-enter: fade) {
    ui-table tbody tr:nth-child(n) {
        transition: opacity var(--ui-duration-300) var(--ui-easing-enter);
    }

    @starting-style {
        ui-table tbody tr:nth-child(n) {
            opacity: 0;
        }
    }
}

/* glow: the row arrives tinted with the accent and the tint drains away, so the eye finds
   what changed after it has happened. */
@container style(--ui-motion-enter: glow) {
    ui-table tbody tr:nth-child(n) {
        background-image: linear-gradient(var(--ui-row-tint), var(--ui-row-tint));
        transition: --ui-row-tint var(--ui-duration-400) var(--ui-easing-exit);
    }

    @starting-style {
        ui-table tbody tr:nth-child(n) {
            --ui-row-tint: rgb(from var(--ui-color-accent) r g b / 0.28);
        }
    }
}
`;

prototype({
    tags: ['ui-table'],
    where: 'document',
    sheet,
    moments: [
        {
            name: 'hover',
            label: 'Row under the pointer',
            effects: [
                { name: 'none', today: true, says: 'Nothing changes.' },
                { name: 'highlight', says: 'The row takes the hover colour.' },
            ],
        },
        {
            name: 'enter',
            label: 'A row added',
            effects: [
                { name: 'none', today: true, says: 'The row is there.' },
                { name: 'fade', says: 'The row fades in.' },
                { name: 'glow', says: 'The row arrives in the accent’s tint, which drains away.' },
            ],
        },
    ],
    refused: [
        {
            name: 'rows sliding into place',
            why: 'a row is the host’s, laid out by the table’s own algorithm; moving it means measuring every row before and after a change the host made, which is the host’s code, not the component’s.',
        },
        {
            name: 'numbers rolling',
            why: 'a figure that counts up to its value shows values that were never true on the way; the reference’s page on changing data argues it out.',
        },
    ],
});

let added = 0;

for (const button of document.querySelectorAll<HTMLElement>('[data-row]')) {
    button.addEventListener('click', () => {
        const body = document.querySelector(`${button.dataset['row'] ?? ''} tbody`);

        if (body === null) {
            return;
        }

        added += 1;
        const row = document.createElement('tr');

        for (const value of [
            `#${String(1040 + added)}`,
            'Added now',
            `R$ ${String(added * 120)},00`,
        ]) {
            const cell = document.createElement('td');
            cell.textContent = value;
            row.append(cell);
        }

        body.prepend(row);
    });
}

/**
 * `ui-table`: what the row under the pointer and a row the host adds can do.
 *
 * The table's rules are adopted into the tree the host's table is in, not into a shadow root,
 * so these go there too — and the keyframes and the rows are then in one tree, which is what
 * S5 asks. A row's container is its `tbody`, which inherits the choice from the `ui-table`
 * around it, so every scope reaches it.
 */
import { reference } from '../../../../src/reference.js';
import { scan, sheen, shimmer, sweeps } from '../controls.js';
import { prototype, queries } from '../motion.js';

/** The query each effect is drawn under: the consumer's choice, else the theme's taste. */
const is = queries('table');

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

// The text's colour, the rule between rows, and the glass a theme frosts its raised surfaces
// with — none where it has none, and no value at all where Glass stands down.
const text = reference('--ui-color-text').cssText;
const rule = reference('--ui-color-border').cssText;
const glass = reference('--ui-backdrop-raised').cssText;

/** Where there is glass: the token written, and written as something other than none. */
const glassy = '(style(--ui-backdrop-raised) and (not style(--ui-backdrop-raised: none)))';

const sheet = String.raw`
/* :nth-child(n) matches every row, and lifts these to the stripe rule's weight, which this
   sheet then follows. */
@container ${is('hover', 'highlight')} {
    ui-table tbody tr:nth-child(n) {
        transition: background-color var(--ui-duration-50) var(--ui-easing-state);
    }

    ui-table tbody tr:nth-child(n):hover {
        background-color: ${hover};
    }
}

/* frost: the row turns to the theme's glass under the pointer, what is behind it blurred and
   its colour lifted, under a veil of the text's colour, in place of the hover colour, which
   Glass makes opaque and which hid the page its glass lets through. Drawn for Glass. Where
   there is no glass — another theme, or Glass standing down — it is the hover colour: over a
   table made opaque, the veil left a striped row under 1.2:1 from itself, short of the 1.25 a
   state owes — measured. */
@container ${is('hover', 'frost')} {
    ui-table tbody tr:nth-child(n) {
        transition: background-color var(--ui-duration-50) var(--ui-easing-state);
    }

    ui-table tbody tr:nth-child(n):hover {
        background-color: ${hover};
    }
}

/* Over the glass, the veil is the text at 0.12, which held the row 1.33:1 or more from itself
   at rest over the pages Glass holds, where the opaque hover colour held 1.26 — measured. The
   blur is the row's: each cell blurred apart broke the page behind at every cell's edge. And
   the rules the table draws between rows went under the glass and were blurred away, so the
   row draws them again inside its cells — measured. */
@container ${is('hover', 'frost')} and ${glassy} {
    ui-table tbody tr:nth-child(n):hover {
        background-color: rgb(from ${text} r g b / 0.12);
        backdrop-filter: ${glass};
    }

    ui-table tbody tr:nth-child(n):hover > * {
        box-shadow:
            inset 0 1px 0 ${rule},
            inset 0 -1px 0 ${rule};
    }
}

/* shimmer and scan, the button's, on the row under a pointer that hovers: a sheen swept across the
   row for as long as the pointer rests there, or a band crossing it down once as the pointer
   arrives. */
@media (hover: hover) {
    @container ${is('hover', 'shimmer')} {
        ui-table tbody tr:nth-child(n):hover {
            background-image: ${shimmer.image(sheen.over)};
            background-size: ${shimmer.size};
            background-repeat: no-repeat;
            background-position: ${shimmer.position};
            animation: ${shimmer.loop};
        }
    }

    @container ${is('hover', 'scan')} {
        ui-table tbody tr:nth-child(n):hover {
            background-image: ${scan.image(sheen.over)};
            background-size: ${scan.size};
            background-repeat: no-repeat;
            background-position: ${scan.position};
            animation: ${scan.run};
        }
    }
}

@container ${is('enter', 'fade')} {
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
@container ${is('enter', 'glow')} {
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

${sweeps}`;

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
                {
                    name: 'frost',
                    says: 'The row turns to the theme’s glass: what is behind it blurred, under a veil of the text’s colour; where there is no glass, the hover colour. Drawn for Glass.',
                },
                {
                    name: 'shimmer',
                    loops: true,
                    says: 'A sheen sweeps across the row, and comes round again.',
                },
                {
                    name: 'scan',
                    says: 'Once, as the pointer arrives: a band of light crosses the row, top to bottom.',
                },
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

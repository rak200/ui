/**
 * `ui-button`: what a press, the pointer and focus can each do.
 *
 * The sheet is what the component would carry. Each effect sits under the style query for its
 * moment, on the `<button>` inside the shadow root — never on the host, which S8 found a
 * choice made on the host itself cannot reach.
 */
import { inner, prototype, replay } from '../motion.js';

const sheet = String.raw`
/* Every property an effect moves, transitioned once. Nothing here moves until an effect
   asks it to, so with no choice the button does what it does today. */
button {
    transition-property: background-color, scale, translate;
    transition-duration: var(--ui-duration-state), var(--ui-duration-200), var(--ui-duration-200);
    transition-timing-function: var(--ui-easing-state), var(--ui-easing-emphasis), var(--ui-easing-enter);
}

/* press: squish. A transition rather than an animation, so letting go runs it back instead of
   cutting it — S7. Pressing in is immediate, as the pressed colour is. */
@container style(--ui-motion-press: squish) {
    button:not(:disabled):active {
        scale: 0.96;
    }
}

/* press: ripple, pulse and rubber are animations the script starts on the click, which a key
   press produces too, so they finish whatever the state does. */
@container style(--ui-motion-press: ripple) {
    button.primary,
    button.secondary {
        /* !important stands in for one more layer in the variant rules, whose shorthand
           would otherwise reset it on hover. */
        background-image: radial-gradient(
            circle at var(--ui-ripple-x) var(--ui-ripple-y),
            rgb(from currentColor r g b / var(--ui-ripple-alpha)) var(--ui-ripple-size),
            transparent calc(var(--ui-ripple-size) + 1px)
        ) !important;
    }
}

button[data-fx='ripple'] {
    animation: ui-ripple var(--ui-duration-400) var(--ui-easing-enter);
}

button[data-fx='pulse']::after {
    animation: ui-pulse var(--ui-duration-400) var(--ui-easing-exit);
}

button[data-fx='rubber'] {
    animation: ui-rubber var(--ui-duration-400) linear;
}

/* hover: lift. Two pixels: the target moves under a pointer that is already on it, so the
   distance stays well inside the button. */
@container style(--ui-motion-hover: lift) {
    button:not(:disabled):hover {
        translate: 0 -2px;
    }
}

/* hover: spotlight. A light where the pointer is, fading with distance, in the label's
   colour so it reads on either variant. */
@container style(--ui-motion-hover: spotlight) {
    button.primary,
    button.secondary {
        background-image: radial-gradient(
            circle 4rem at var(--ui-pointer-x) var(--ui-pointer-y),
            rgb(from currentColor r g b / calc(var(--ui-pointer-near) * 0.24)),
            transparent
        ) !important;
    }
}

/* Both at once: one background-image, two layers. */
@container style(--ui-motion-press: ripple) and style(--ui-motion-hover: spotlight) {
    button.primary,
    button.secondary {
        background-image:
            radial-gradient(
                circle at var(--ui-ripple-x) var(--ui-ripple-y),
                rgb(from currentColor r g b / var(--ui-ripple-alpha)) var(--ui-ripple-size),
                transparent calc(var(--ui-ripple-size) + 1px)
            ),
            radial-gradient(
                circle 4rem at var(--ui-pointer-x) var(--ui-pointer-y),
                rgb(from currentColor r g b / calc(var(--ui-pointer-near) * 0.24)),
                transparent
            ) !important;
    }
}

/* hover: magnetic. Leans toward the pointer as it nears, a few pixels at most. */
@container style(--ui-motion-hover: magnetic) {
    button:not(:disabled) {
        translate: calc(var(--ui-pointer-nx) * var(--ui-pointer-near) * 6px)
            calc(var(--ui-pointer-ny) * var(--ui-pointer-near) * 4px);
    }
}

/* focus: beacon. The ring is drawn at once, as today; the beacon spreads out past it
   afterwards and fades, so it can only add to the ring, never stand in for it. */
@container style(--ui-motion-focus: beacon) {
    button:focus-visible::after {
        animation: ui-beacon var(--ui-duration-400) var(--ui-easing-exit);
    }
}

@keyframes ui-ripple {
    from {
        --ui-ripple-size: 0px;
        --ui-ripple-alpha: 0.32;
    }
    to {
        --ui-ripple-size: var(--ui-ripple-reach);
        --ui-ripple-alpha: 0;
    }
}

@keyframes ui-pulse {
    from {
        box-shadow: 0 0 0 0 rgb(from var(--ui-color-accent) r g b / 0.5);
    }
    to {
        box-shadow: 0 0 0 10px rgb(from var(--ui-color-accent) r g b / 0);
    }
}

@keyframes ui-rubber {
    0%, 100% { scale: 1 1; }
    30% { scale: 1.1 0.9; }
    45% { scale: 0.93 1.07; }
    60% { scale: 1.04 0.96; }
    78% { scale: 0.99 1.01; }
}

@keyframes ui-beacon {
    from {
        box-shadow: 0 0 0 2px rgb(from var(--ui-color-focus) r g b / 0.55);
    }
    to {
        box-shadow: 0 0 0 12px rgb(from var(--ui-color-focus) r g b / 0);
    }
}
`;

prototype({
    tags: ['ui-button'],
    sheet,
    moments: [
        {
            name: 'press',
            label: 'Press',
            on: 'click',
            effects: [
                {
                    name: 'none',
                    today: true,
                    says: 'The pressed colour, at once, and nothing moves.',
                },
                { name: 'squish', says: 'Shrinks while held and springs back on release.' },
                {
                    name: 'ripple',
                    says: 'A circle spreads from where the pointer went down, or from the centre for a key.',
                    fire: ({ host, event }) => {
                        const target = inner(host, 'button');

                        if (target === null) {
                            return;
                        }

                        const box = target.getBoundingClientRect();
                        const pointer = event instanceof MouseEvent && event.detail > 0;
                        const x = pointer ? event.clientX - box.left : box.width / 2;
                        const y = pointer ? event.clientY - box.top : box.height / 2;
                        const reach = Math.hypot(
                            Math.max(x, box.width - x),
                            Math.max(y, box.height - y),
                        );

                        target.style.setProperty('--ui-ripple-x', `${x.toFixed(1)}px`);
                        target.style.setProperty('--ui-ripple-y', `${y.toFixed(1)}px`);
                        target.style.setProperty('--ui-ripple-reach', `${reach.toFixed(1)}px`);
                        replay(target, 'ripple');
                    },
                },
                {
                    name: 'pulse',
                    says: 'A ring leaves the edge and fades.',
                    fire: ({ host }) => {
                        const target = inner(host, 'button');

                        if (target !== null) {
                            replay(target, 'pulse');
                        }
                    },
                },
                {
                    name: 'rubber',
                    says: 'Stretches and settles, like something soft that was hit.',
                    fire: ({ host }) => {
                        const target = inner(host, 'button');

                        if (target !== null) {
                            replay(target, 'rubber');
                        }
                    },
                },
            ],
        },
        {
            name: 'hover',
            label: 'Pointer over',
            effects: [
                { name: 'none', today: true, says: 'The hover colour, and nothing moves.' },
                { name: 'lift', says: 'Rises two pixels.' },
                {
                    name: 'spotlight',
                    follows: true,
                    says: 'A light under the pointer, fading with distance.',
                },
                {
                    name: 'magnetic',
                    follows: true,
                    says: 'Leans a few pixels toward the pointer as it nears.',
                },
            ],
        },
        {
            name: 'focus',
            label: 'Focus',
            effects: [
                { name: 'none', today: true, says: 'The ring, drawn at once.' },
                {
                    name: 'beacon',
                    says: 'The ring at once, then a wave that spreads past it and fades.',
                },
            ],
        },
    ],
    refused: [
        {
            name: 'shake',
            why: 'answering an error by moving the button the reader is still pointing at; the reference measures what that costs on a field, and the button is the same target.',
        },
        {
            name: 'glitch',
            why: 'skews the label and splits its colour while it runs, which is text being read made illegible on purpose. A theme that wants it is asking for a look, not for a moment.',
        },
        {
            name: 'flash',
            why: 'two flashes in 0.6s is past three a second, the rate WCAG 2.3.1 counts; small enough to pass on area, and nothing a press needs.',
        },
        {
            name: 'explode',
            why: 'it ends with the button gone. Removing something is the moment of whatever held it — a list, a dialog — not of the control that asked.',
        },
    ],
});

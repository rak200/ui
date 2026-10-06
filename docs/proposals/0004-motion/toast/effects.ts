/**
 * `ui-toast` and `ui-toaster`: what the entrance, the exit and the stack can do.
 *
 * **The toast's surface is its host**, as the card's is, and every effect that moves a toast
 * moves the host — so S8 shows here too: a choice made on a toast itself, or on every
 * `ui-toast`, does not reach them. The toaster, or anything around it, does, and a toaster is
 * the natural place for the choice anyway: it is the stack's.
 *
 * A toast removes itself once every animation on it has finished, so an exit is waited out by
 * the code that is already there. The stack's glide is the one piece of script, and it is the
 * reference's: measure the toasts before one leaves, let the layout move them, then animate
 * each from where it was.
 */
import { chosen, duration, easing, prototype } from '../motion.js';

const sheet = String.raw`
@container style(--ui-motion-enter: none) {
    :host(:not(.closing)) {
        transition: none;
    }
}

@container style(--ui-motion-enter: fade) {
    @starting-style {
        :host {
            opacity: 0;
            translate: 0 0;
        }
    }
}

@container style(--ui-motion-enter: slide) {
    @starting-style {
        :host {
            opacity: 0;
            translate: 2rem 0;
        }
    }
}

@container style(--ui-motion-enter: pop) {
    :host(:not(.closing)) {
        transition:
            opacity var(--ui-duration-200) var(--ui-easing-enter),
            translate var(--ui-duration-200) var(--ui-easing-enter),
            scale var(--ui-duration-200) var(--ui-easing-emphasis);
    }

    @starting-style {
        :host {
            opacity: 0;
            translate: 0 0;
            scale: 0.9;
        }
    }
}

@container style(--ui-motion-enter: drop) {
    :host(:not(.closing)) {
        animation: ui-drop var(--ui-duration-400) linear;
    }
}

@container style(--ui-motion-exit: none) {
    :host(.closing) {
        transition: none;
    }
}

@container style(--ui-motion-exit: fade) {
    :host(.closing) {
        translate: 0 0;
    }
}

@container style(--ui-motion-exit: slide) {
    :host(.closing) {
        translate: 2rem 0;
    }
}

@keyframes ui-drop {
    0% {
        opacity: 0;
        translate: 0 -2rem;
        animation-timing-function: ease-in;
    }
    45% {
        opacity: 1;
        translate: 0 0;
        animation-timing-function: ease-out;
    }
    70% {
        translate: 0 -0.5rem;
        animation-timing-function: ease-in;
    }
    100% {
        translate: 0 0;
    }
}
`;

prototype({
    tags: ['ui-toast', 'ui-toaster'],
    sheet,
    moments: [
        {
            name: 'enter',
            label: 'Entrance',
            effects: [
                { name: 'rise', today: true, host: true, says: 'Fades in from a little below.' },
                { name: 'none', host: true, says: 'There at once.' },
                { name: 'fade', host: true, says: 'Fades in where it lands.' },
                { name: 'slide', host: true, says: 'Comes in from the edge of the page.' },
                { name: 'pop', host: true, says: 'Fades in from smaller, past its size and back.' },
                { name: 'drop', host: true, says: 'Falls in and bounces once.' },
            ],
        },
        {
            name: 'exit',
            label: 'Exit',
            effects: [
                { name: 'sink', today: true, host: true, says: 'Fades out, going down.' },
                { name: 'none', host: true, says: 'Gone at once.' },
                { name: 'fade', host: true, says: 'Fades out where it is.' },
                { name: 'slide', host: true, says: 'Leaves toward the edge of the page.' },
            ],
        },
        {
            name: 'stack',
            label: 'The stack',
            effects: [
                { name: 'none', today: true, says: 'When one leaves, the others jump into place.' },
                {
                    name: 'glide',
                    says: 'When one leaves, the others glide into place from where they were.',
                },
            ],
        },
    ],
    refused: [
        {
            name: 'disintegrate',
            why: 'the reference’s own cost page puts it in particles; a notice that leaves should leave quickly, and the stack is still being read.',
        },
        {
            name: 'heartbeat',
            why: 'a notice that keeps beating to be looked at is the assertive region’s job, and that is announced, not animated.',
        },
    ],
});

/** The stack's glide: measured before a toast leaves, animated after the layout moved. */
for (const toaster of document.querySelectorAll('ui-toaster')) {
    const before = new Map<Element, DOMRect>();

    new MutationObserver((records) => {
        for (const record of records) {
            if (record.type === 'attributes' && record.target instanceof Element) {
                if (record.target.classList.contains('closing')) {
                    for (const toast of toaster.querySelectorAll('ui-toast')) {
                        before.set(toast, toast.getBoundingClientRect());
                    }
                }
            }

            if (record.type === 'childList' && record.removedNodes.length > 0) {
                if (chosen(toaster, 'stack') === 'glide') {
                    for (const [toast, box] of before) {
                        const moved = box.top - toast.getBoundingClientRect().top;

                        if (toast.isConnected && Math.abs(moved) >= 1) {
                            toast.animate(
                                [{ translate: `0 ${String(moved)}px` }, { translate: '0 0' }],
                                {
                                    duration: duration(toast, '--ui-duration-200'),
                                    easing: easing(toast, '--ui-easing-move'),
                                    composite: 'add',
                                },
                            );
                        }
                    }
                }

                before.clear();
            }
        }
    }).observe(toaster, {
        attributes: true,
        attributeFilter: ['class'],
        subtree: true,
        childList: true,
    });
}

let count = 0;

for (const button of document.querySelectorAll<HTMLElement>('[data-toast]')) {
    button.addEventListener('click', () => {
        const toaster = document.querySelector(button.dataset['toast'] ?? '');

        if (toaster === null) {
            return;
        }

        count += 1;
        const toast = document.createElement('ui-toast');
        const variants = ['info', 'success', 'warning', 'danger'] as const;
        toast.setAttribute('variant', variants[count % variants.length] ?? 'info');
        toast.setAttribute('duration', '6000');
        toast.textContent = `Notice ${String(count)}`;

        if (
            button.dataset['id'] !== undefined &&
            document.getElementById(button.dataset['id']) === null
        ) {
            toast.id = button.dataset['id'];
            toast.textContent = 'This one is #chosen';
        }

        toaster.append(toast);
    });
}

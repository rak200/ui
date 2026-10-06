/**
 * `ui-card`: what the pointer and an entrance can do.
 *
 * **The card's surface is its host**, and S8 is what that costs: an effect that moves the
 * whole card is written on `:host`, which a choice made on the card itself — its type or the
 * one instance — cannot reach. Those are marked; the ones on the host's pseudo-elements reach
 * every scope. Moving the surface into the shadow root would lift the limit.
 */
import { prototype } from '../motion.js';

const sheet = String.raw`
:host {
    transition-property: translate, transform, opacity;
    transition-duration: var(--ui-duration-200), var(--ui-duration-50), var(--ui-duration-300);
    transition-timing-function: var(--ui-easing-enter), linear, var(--ui-easing-enter);
}

:host::before {
    transition: box-shadow var(--ui-duration-200) var(--ui-easing-enter);
}

/* hover: raise. The shadow layer deepens over whatever the theme lights it with. */
@container style(--ui-motion-hover: raise) {
    :host(:hover)::before {
        box-shadow:
            var(--ui-elevation-raised, var(--ui-elevation-100)),
            0 0.75rem 1.75rem -0.75rem rgb(0 0 0 / 0.35);
    }
}

/* hover: lift, on the host. */
@container style(--ui-motion-hover: lift) {
    :host(:hover) {
        translate: 0 -0.25rem;
    }
}

/* hover: spotlight, a light under the pointer, on a layer that takes no pointer. */
@container style(--ui-motion-hover: spotlight) {
    :host::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        pointer-events: none;
        background: radial-gradient(
            16rem circle at var(--ui-pointer-x) var(--ui-pointer-y),
            rgb(from var(--ui-color-accent) r g b / 0.14),
            transparent 70%
        );
        opacity: var(--ui-pointer-near);
    }
}

/* hover: edge, the boundary lit where the pointer is nearest. */
@container style(--ui-motion-hover: edge) {
    :host::after {
        content: '';
        position: absolute;
        inset: -1px;
        padding: 1px;
        border-radius: inherit;
        pointer-events: none;
        background: radial-gradient(
            12rem circle at calc(var(--ui-pointer-x) + 1px) calc(var(--ui-pointer-y) + 1px),
            var(--ui-color-accent),
            transparent 70%
        );
        mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
        mask-composite: exclude;
        opacity: var(--ui-pointer-near);
    }
}

/* hover: tilt, on the host. */
@container style(--ui-motion-hover: tilt) {
    :host {
        transform: perspective(60rem)
            rotateX(calc(var(--ui-pointer-ny) * var(--ui-pointer-near) * -5deg))
            rotateY(calc(var(--ui-pointer-nx) * var(--ui-pointer-near) * 5deg));
    }
}

/* entrance: rise and fade, from where @starting-style says it comes — on the host. */
@container style(--ui-motion-enter: rise) {
    @starting-style {
        :host {
            opacity: 0;
            translate: 0 0.75rem;
        }
    }
}

@container style(--ui-motion-enter: fade) {
    @starting-style {
        :host {
            opacity: 0;
        }
    }
}
`;

prototype({
    tags: ['ui-card'],
    sheet,
    moments: [
        {
            name: 'hover',
            label: 'Pointer over',
            effects: [
                { name: 'none', today: true, says: 'Nothing moves.' },
                { name: 'raise', says: 'The shadow deepens, as if the card came forward.' },
                { name: 'lift', host: true, says: 'Rises a quarter of a step.' },
                { name: 'spotlight', follows: true, says: 'A light under the pointer.' },
                {
                    name: 'edge',
                    follows: true,
                    says: 'The boundary lights where the pointer is nearest.',
                },
                {
                    name: 'tilt',
                    follows: true,
                    host: true,
                    says: 'Leans toward the pointer, a few degrees.',
                },
            ],
        },
        {
            name: 'enter',
            label: 'Entrance',
            effects: [
                { name: 'none', today: true, says: 'Appears where it lands.' },
                { name: 'rise', host: true, says: 'Fades in from a little below.' },
                { name: 'fade', host: true, says: 'Fades in where it lands.' },
            ],
        },
    ],
    refused: [
        {
            name: 'flip',
            why: 'turns the content away from the reader for half its run, and a card’s content is what is being read.',
        },
        {
            name: 'turning border',
            why: 'a border that keeps rotating for as long as the pointer rests is motion with no end that the reader did not ask to keep.',
        },
    ],
});

for (const button of document.querySelectorAll<HTMLElement>('[data-add]')) {
    button.addEventListener('click', () => {
        const target = document.querySelector(button.dataset['add'] ?? '');
        const card = document.querySelector('template#card');

        if (target !== null && card instanceof HTMLTemplateElement) {
            target.append(card.content.cloneNode(true));
        }
    });
}

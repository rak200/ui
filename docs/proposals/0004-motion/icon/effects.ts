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
import { reference } from '../../../../src/reference.js';
import { scan, sheen, shimmer, sweeps } from '../controls.js';
import { chosen, prototype, queries } from '../motion.js';

/** The query each effect is drawn under: the consumer's choice, else the theme's taste. */
const is = queries('icon');

/** The size the icon is drawn at, which a blur and a glow are measured in. */
const size = reference('--ui-icon-size').cssText;

/** The weight of its strokes, as the component draws them. */
const stroke = reference('--ui-icon-stroke').cssText;

/** How far the pulse's band reaches past the strokes, in the glyph's own units — a twenty-fourth
 *  of the icon's size each — so it grows with the icon, as the pulse's reach grows with a control. */
const reach = 4;

/** The colours the glitch splits into, the button's own. */
const danger = reference('--ui-color-danger').cssText;
const info = reference('--ui-color-info').cssText;

const sheet = String.raw`
/* One list for everything the svg eases, the entrances' and the pointer's alike: the scale and
   the turn on the emphasis, which carries them past and back, and the rest on the way in. */
svg {
    transition-property: scale, rotate, opacity, translate, filter, stroke-width;
    transition-duration:
        var(--ui-duration-200), var(--ui-duration-200), var(--ui-duration-300),
        var(--ui-duration-300), var(--ui-duration-300), var(--ui-duration-200);
    transition-timing-function:
        var(--ui-easing-emphasis), var(--ui-easing-emphasis), var(--ui-easing-enter),
        var(--ui-easing-enter), var(--ui-easing-enter), var(--ui-easing-enter);
}

@container ${is('hover', 'pop')} {
    :host(:hover) svg {
        scale: 1.15;
    }
}

@container ${is('hover', 'turn')} {
    :host(:hover) svg {
        rotate: 15deg;
    }
}

@container ${is('hover', 'lift')} {
    :host(:hover) svg {
        translate: 0 -10%;
    }
}

/* glow: a drop shadow, which follows the strokes where a box shadow would light the square
   round them, in the accent the controls' glow is drawn in. In the colour the icon is drawn in,
   it was a grey smudge round a dark icon in the light scheme — measured. It is held round the
   host unlit, so the pointer brings up its colour alone, at the pace of the controls' glow:
   grown from none, its reach came up with its colour, and 72ms in it had lit under a third of
   its light, where held it has lit 44% — measured in Chromium and Firefox. On the host, which
   leaves the svg's filter to the entrance. */
@container ${is('hover', 'glow')} {
    :host {
        filter: drop-shadow(0 0 calc(${size} / 8) rgb(from var(--ui-color-accent) r g b / 0));
        transition: filter var(--ui-duration-200) var(--ui-easing-enter);
    }

    :host(:hover) {
        filter: drop-shadow(0 0 calc(${size} / 8) rgb(from var(--ui-color-accent) r g b / 0.8));
    }
}

/* embolden: the button left it out because a bolder label is a wider button. A heavier stroke
   stays inside the glyph's own square, so nothing beside the icon moves. A length, since the
   bare number a calc() left Firefox took for no value, and the stroke went thin — measured. */
@container ${is('hover', 'embolden')} {
    :host(:hover) svg {
        stroke-width: calc(${stroke} * 1.5px);
    }
}

/* wiggle: either way and back, smaller each time, once as the pointer arrives. The button left
   out a swing that goes on for as long as the pointer rests. */
@container ${is('hover', 'wiggle')} {
    :host(:hover) svg {
        animation: ui-wiggle var(--ui-duration-400) var(--ui-easing-move);
    }
}

/* glitch: the glyph jumps and splits into two colours once, as the button's label does: in drop
   shadows, since a stroke has no text shadow. Drawn for Matrix. */
@container ${is('hover', 'glitch')} {
    :host(:hover) svg {
        animation: ui-glitch var(--ui-duration-200) linear;
    }
}

/* shimmer and scan, the button's, on a layer over the glyph cut to its strokes, which the page
   cuts as the pointer arrives: a sheen swept across the strokes for as long as the pointer rests,
   or a band crossing them down once. Isolated, so the pulse's copy can go under the glyph and stay
   over what the page put under the icon. */
:host {
    position: relative;
    isolation: isolate;
}

[data-sheen] {
    position: absolute;
    inset: 0;
    mask-size: 100% 100%;
    mask-repeat: no-repeat;
    pointer-events: none;
}

@media (hover: hover) {
    @container ${is('hover', 'shimmer')} {
        :host(:hover) [data-sheen] {
            background-image: ${shimmer.image(sheen.over)};
            background-size: ${shimmer.size};
            background-repeat: no-repeat;
            background-position: ${shimmer.position};
            animation: ${shimmer.loop};
        }
    }

    @container ${is('hover', 'scan')} {
        :host(:hover) [data-sheen] {
            background-image: ${scan.image(sheen.over)};
            background-size: ${scan.size};
            background-repeat: no-repeat;
            background-position: ${scan.position};
            animation: ${scan.run};
        }
    }
}

/* pulse: the button's, a ring of the accent leaving the boundary once as the pointer arrives, and
   the boundary here is the strokes', as the glow's light is: a copy of the glyph under it, which
   the page makes as the pointer arrives, its strokes widened to ${reach} units either side and faded
   out. Faded as one, so where two strokes meet they are not drawn twice as strong. Nothing the
   glyph's entrance eases reaches the copy, which comes in as the pointer does. */
[data-pulse] {
    position: absolute;
    inset: 0;
    z-index: -1;
    overflow: visible;
    opacity: 0;
    pointer-events: none;
}

[data-pulse] * {
    fill: none;
    stroke: var(--ui-color-accent);
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: none;
}

@media (hover: hover) {
    @container ${is('hover', 'pulse')} {
        :host(:hover) [data-pulse] {
            animation: ui-pulse-fade var(--ui-duration-400) var(--ui-easing-enter);
        }

        :host(:hover) [data-pulse] * {
            animation: ui-pulse-widen var(--ui-duration-400) var(--ui-easing-enter);
        }
    }
}

/* draw: each stroke drawn from its start. The dash is longer than any stroke in a 24-unit
   glyph, so the whole stroke is one dash, hidden by the offset and then shown. */
@container ${is('enter', 'draw')} {
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

@container ${is('enter', 'fade')} {
    @starting-style {
        svg {
            opacity: 0;
        }
    }
}

/* pop: from a third of its size, carried past it and back by the scale's emphasis. */
@container ${is('enter', 'pop')} {
    @starting-style {
        svg {
            scale: 0.3;
            opacity: 0;
        }
    }
}

@container ${is('enter', 'rise')} {
    @starting-style {
        svg {
            translate: 0 30%;
            opacity: 0;
        }
    }
}

/* refocus: blurred by an eighth of its size, as the card is by half a rem. */
@container ${is('enter', 'refocus')} {
    @starting-style {
        svg {
            filter: blur(calc(${size} / 8));
            opacity: 0;
        }
    }
}

@keyframes ui-pulse-fade {
    from {
        opacity: 0.5;
    }
    to {
        opacity: 0;
    }
}

@keyframes ui-pulse-widen {
    from {
        stroke-width: calc(${stroke} * 1px);
    }
    to {
        stroke-width: calc(${stroke} * 1px + ${2 * reach}px);
    }
}

@keyframes ui-wiggle {
    20% {
        rotate: 14deg;
    }
    40% {
        rotate: -10deg;
    }
    60% {
        rotate: 6deg;
    }
    80% {
        rotate: -3deg;
    }
}

@keyframes ui-glitch {
    0%,
    100% {
        transform: none;
    }
    20% {
        transform: translate(-4px, 2px) skewX(-5deg);
        filter: drop-shadow(2px -2px ${danger});
    }
    40% {
        transform: translate(4px, -2px) skewX(5deg);
        filter: drop-shadow(-2px 2px ${info});
    }
    60% {
        transform: translate(-2px, -2px) skewX(0deg);
    }
    80% {
        transform: translate(2px, 2px) skewX(3deg);
    }
}

${sweeps}`;

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
                { name: 'pop', says: 'Grows in from a third of its size, past it and back.' },
                { name: 'rise', says: 'Fades in from a little below.' },
                { name: 'refocus', says: 'Comes into focus: blurred and faint, then sharp.' },
            ],
        },
        {
            name: 'hover',
            label: 'Pointer over',
            effects: [
                { name: 'none', today: true, says: 'Nothing moves.' },
                { name: 'pop', says: 'Grows a little, past and back.' },
                { name: 'turn', says: 'Turns a few degrees.' },
                { name: 'lift', says: 'Rises a tenth of its size.' },
                { name: 'glow', says: 'A light of the accent round its strokes.' },
                {
                    name: 'wiggle',
                    says: 'Rocks either way, less each time, once, then holds still.',
                },
                { name: 'embolden', says: 'Its strokes half again as heavy.' },
                {
                    name: 'glitch',
                    says: 'Jumps and splits into two colours, once. Drawn for Matrix.',
                },
                {
                    name: 'shimmer',
                    loops: true,
                    says: 'A sheen sweeps across its strokes, and comes round again.',
                },
                {
                    name: 'scan',
                    says: 'Once, as the pointer arrives: a band of light crosses its strokes, top to bottom.',
                },
                {
                    name: 'pulse',
                    says: 'Once, as the pointer arrives: a ring of the accent leaves its strokes and fades.',
                },
            ],
        },
    ],
    refused: [
        {
            name: 'spin',
            why: 'turning for as long as something loads is a state the icon would have to be told about, not a moment it answers — a busy state is a decision of its own.',
        },
        {
            name: 'draw, under the pointer',
            why: 'drawn again as the pointer arrives, the strokes are taken away before they come back: the dash starts past the end of every one — 120 units, where the longest stroke of these glyphs is 68 — so the icon goes missing just where the reader is pointing.',
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

/** The glyph each icon's sheen layer was last cut to. */
const cuts = new WeakMap<Element, string>();

/**
 * Cuts the sheen's layer to the icon's strokes, as the pointer arrives on an icon that sweeps one:
 * a mask is a picture, and a picture cannot read the glyph the page draws, so the page draws it
 * into one — the icon's own `<svg>`, or the one slotted in its place, its strokes in black at the
 * weight and with the ends the page draws them with. Again when the glyph has changed since.
 */
function cut(host: HTMLElement): void {
    const root = host.shadowRoot;
    const svg = root?.querySelector('svg:not([data-pulse])') ?? host.querySelector(':scope > svg');

    if (root === null || svg === null || !['shimmer', 'scan'].includes(chosen(host, 'hover'))) {
        return;
    }

    const drawn = getComputedStyle(svg);
    const copy = svg.cloneNode(true) as SVGSVGElement;
    copy.removeAttribute('style');
    copy.setAttribute('fill', 'none');
    copy.setAttribute('stroke', '#000');
    copy.setAttribute('stroke-width', drawn.strokeWidth);
    copy.setAttribute('stroke-linecap', drawn.strokeLinecap);
    copy.setAttribute('stroke-linejoin', drawn.strokeLinejoin);
    const markup = new XMLSerializer().serializeToString(copy);

    if (cuts.get(host) === markup) {
        return;
    }

    cuts.set(host, markup);
    let layer = root.querySelector<HTMLElement>('[data-sheen]');

    if (layer === null) {
        layer = document.createElement('span');
        layer.dataset['sheen'] = '';
        layer.setAttribute('aria-hidden', 'true');
        root.append(layer);
    }

    layer.style.maskImage = `url("data:image/svg+xml,${encodeURIComponent(markup)}")`;
}

/** The glyph each icon's pulse was last copied from. */
const copies = new WeakMap<Element, string>();

/**
 * Copies the icon's glyph under it for the pulse to widen, as the pointer arrives on an icon that
 * pulses: the icon's own `<svg>`, or the one slotted in its place, its geometry and no more, since
 * the sheet draws the copy. Before the component's own nodes, which a render of its own clears.
 * Again when the glyph has changed since.
 */
function copy(host: HTMLElement): void {
    const root = host.shadowRoot;
    const svg = root?.querySelector('svg:not([data-pulse])') ?? host.querySelector(':scope > svg');

    if (root === null || svg === null || chosen(host, 'hover') !== 'pulse') {
        return;
    }

    const drawn = root.querySelector('[data-pulse]');

    if (drawn !== null && copies.get(host) === svg.innerHTML) {
        return;
    }

    copies.set(host, svg.innerHTML);
    drawn?.remove();
    const layer = svg.cloneNode(true) as SVGSVGElement;
    layer.removeAttribute('part');
    layer.removeAttribute('style');
    layer.setAttribute('data-pulse', '');
    layer.setAttribute('aria-hidden', 'true');
    root.prepend(layer);
}

document.addEventListener('pointerover', (event) => {
    for (const target of event.composedPath()) {
        if (target instanceof HTMLElement && target.localName === 'ui-icon') {
            cut(target);
            copy(target);
        }
    }
});

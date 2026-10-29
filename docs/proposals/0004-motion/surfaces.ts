/**
 * What a surface draws under the pointer and at a focus in it — `ui-card` and `ui-toast`, each a
 * surface that is its host: its fill, its shadow and its border, each on a layer of its own, which
 * the page renders into the shadow root as the component would. One layer of each for the pointer
 * and one for the focus, so the two are chosen apart and drawn at once; the fill and the shadow
 * under the content, so neither veils the text, and the border over it. Its movement moves the
 * host, which each component writes for itself: what else moves its host is its own.
 *
 * Every rule a state decides starts with the component's host in that state, so a sheet another
 * element adopts too, as the toaster adopts the toast's, lights nothing of its own.
 */
import { reference } from '../../../src/reference.js';
import {
    comet,
    edge,
    far,
    lights,
    line,
    orbit,
    rainbow,
    ripple,
    scan,
    sheen,
    shimmer,
    spotlit,
    thrown,
    tinted,
    trace,
} from './controls.js';

/** Where one surface's rules apply. */
export interface Surface {
    /** The query its effects are drawn under: the consumer's choice, else its taste. */
    readonly is: (moment: string, effect: string) => string;
    /** Its host with no focus the reader can see in it, which the pointer's effects are drawn on,
     *  since they yield to one; and the same host with the pointer resting on it. */
    readonly unfocused: string;
    readonly resting: string;
    /** Its host with a focus the reader can see in it, as the page marks one. */
    readonly focused: string;
    /** Its host in right-to-left text. */
    readonly rtl: string;
}

/** A surface's raise: the theme's lift drawn a second time, with a drop under it, and on a dark
 *  page, where a shadow barely shows, the boundary catching the light. */
const raised = String.raw`
        color: ${reference('--ui-color-accent')};
        box-shadow:
            ${reference('--ui-elevation-raised')},
            inset 0 1px 0 light-dark(transparent, rgb(255 255 255 / 0.22)),
            inset 0 0 0 1px light-dark(transparent, rgb(255 255 255 / 0.12)),
            0 0.75rem 1.75rem -0.5rem light-dark(rgb(0 0 0 / 0.35), transparent),
            0 1rem 2.5rem -0.25rem light-dark(transparent, rgb(0 0 0 / 0.9)),
            0 0.25rem 0.75rem light-dark(transparent, rgb(0 0 0 / 0.5));`;

/** A surface's glow: a light of the accent round it, at a surface's size. */
const glowing = String.raw`0 0 1rem 0.125rem rgb(from var(--ui-color-accent) r g b / 0.45),
            0 0 2.5rem 0.5rem rgb(from var(--ui-color-accent) r g b / 0.25)`;

/** A surface's tint: what it is raised on, taking a little of the accent. */
const tint = tinted(reference('--ui-color-surface-raised').cssText);

/** The layers, one per kind that draws, before any effect gives one something. */
export const layered = String.raw`
/* A layer per kind that draws, over the boundary, taking no pointer, and invisible until an
   effect gives it something. The fill and the shadow are under the content, so neither veils
   the text; the border is over it, where the content never reaches. */
[data-layer] {
    position: absolute;
    inset: -1px;
    z-index: -1;
    border-radius: inherit;
    pointer-events: none;
    opacity: 0;
}

/* Inside the boundary, which a fill would paint out. */
[data-layer='fill'],
[data-layer='focus-fill'] {
    inset: 0;
}

/* A band: 2px over the edge and just inside, the rest masked out. The pointer's border and the
   focus's each have one, so the two can be chosen apart. */
[data-layer='border'],
[data-layer='focus-border'] {
    z-index: auto;
    padding: 2px;
    mask:
        linear-gradient(#000 0 0) content-box,
        linear-gradient(#000 0 0);
    mask-composite: exclude;
}
`;

/** The pointer's and a focus's fill, shadow and border on one surface. */
export function surface({ is, unfocused, resting, focused, rtl }: Surface): string {
    return String.raw`
/* hover-shadow: raise. The theme's lift drawn a second time, with a drop under it, and faded
   in. Not by moving the theme's own layer: Matrix's glow is written from currentColor, and
   Chromium carried that glow through transparent for the length of the transition, so the
   card went dark and lit again on every hover — measured. An opacity has no colour to carry.

   A shadow barely shows on a dark page, which nothing is much darker than. So in the dark
   scheme the drop is near black and wider, and the boundary catches the light, brightest
   along the top. Not by lighting the card from inside, which showed most: that is the fill's
   to change, and with the tint's it took Matrix's muted text to 3.95:1 — measured. */
@container ${is('hover-shadow', 'raise')} {
    [data-layer='shadow'] {${raised}
        transition: opacity var(--ui-duration-200) var(--ui-easing-enter);
    }

    @media (hover: hover) {
        ${resting} [data-layer='shadow'] {
            opacity: 1;
        }
    }
}

/* hover-shadow: glow, a halo of the accent round the surface, faded in as raise is. A halo and no
   ring: a ring at the boundary read as a border, which is another kind's to draw. */
@container ${is('hover-shadow', 'glow')} {
    [data-layer='shadow'] {
        box-shadow: ${glowing};
        transition: opacity var(--ui-duration-200) var(--ui-easing-enter);
    }

    @media (hover: hover) {
        ${resting} [data-layer='shadow'] {
            opacity: 1;
        }
    }
}

/* hover-shadow: cast. The pointer as a light: the shadow falls away from it, the further the
   further the pointer is from the middle, and the light spills round the side the pointer is
   on. A page shows one of the two: a light one the shadow, a dark one the light — on Matrix's
   near black a shadow showed nothing at all. The light is the accent's, and nothing in the
   light scheme, where it would be light on a light page. It reaches well past the glow a
   theme may already draw round the surface, or Matrix's swallows it. */
@container ${is('hover-shadow', 'cast')} {
    [data-layer='shadow'] {
        box-shadow:
            calc(var(--ui-pointer-nx) * -1rem) calc(var(--ui-pointer-ny) * -1rem + 0.5rem) 1.75rem
                -0.25rem light-dark(rgb(0 0 0 / 0.3), rgb(0 0 0 / 0.85)),
            calc(var(--ui-pointer-nx) * 1.5rem) calc(var(--ui-pointer-ny) * 1.5rem) 3rem 0.25rem
                light-dark(transparent, rgb(from var(--ui-color-accent) r g b / 0.35));
    }

    ${unfocused} [data-layer='shadow'] {
        opacity: var(--ui-pointer-near);
    }
}

/* hover-shadow: sink, halo and inner, the button's and a field's, faded in as the raise is; neon
   and breathe, which come round for as long as the pointer rests; and burst, once, as it arrives. */
${(
    [
        ['sink', lights.sink],
        ['halo', lights.halo],
        ['inner', lights.inner('0.75rem', '0.125rem')],
    ] as const
)
    .map(
        ([effect, light]) => String.raw`@container ${is('hover-shadow', effect)} {
    [data-layer='shadow'] {
        box-shadow: ${light};
        transition: opacity var(--ui-duration-200) var(--ui-easing-enter);
    }

    @media (hover: hover) {
        ${resting} [data-layer='shadow'] {
            opacity: 1;
        }
    }
}`,
    )
    .join('\n\n')}

@container ${is('hover-shadow', 'neon')} {
    @media (hover: hover) {
        ${resting} [data-layer='shadow'] {
            opacity: 1;
            animation: ui-neon var(--ui-duration-loop) var(--ui-easing-state) var(--ui-iteration-loop)
                alternate;
        }
    }
}

@container ${is('hover-shadow', 'breathe')} {
    [data-layer='shadow'] {
        box-shadow: ${lights.breath('var(--ui-color-accent)', '15px')};
    }

    @media (hover: hover) {
        ${resting} [data-layer='shadow'] {
            opacity: 1;
            animation: ui-breathe-glow var(--ui-duration-loop) var(--ui-easing-state)
                var(--ui-iteration-loop) alternate;
        }
    }
}

@container ${is('hover-shadow', 'burst')} {
    @media (hover: hover) {
        ${resting} [data-layer='shadow'] {
            opacity: 1;
            animation: ui-burst var(--ui-duration-400) var(--ui-easing-enter);
        }
    }
}

/* ——— A focus in the surface, on its own layer, as its fill's and its border's are. ——— */
${(
    [
        ['raise', raised],
        ['sink', `box-shadow: ${lights.sink};`],
        ['halo', `box-shadow: ${lights.halo};`],
        ['glow', `box-shadow: ${glowing};`],
        ['inner', `box-shadow: ${lights.inner('0.75rem', '0.125rem')};`],
    ] as const
)
    .map(
        ([effect, light]) => String.raw`@container ${is('focus-shadow', effect)} {
    [data-layer='focus-shadow'] {${light}
        transition: opacity var(--ui-duration-200) var(--ui-easing-enter);
    }

    ${focused} [data-layer='focus-shadow'] {
        opacity: 1;
    }
}`,
    )
    .join('\n\n')}

/* neon and breathe, four rounds and then at rest, and burst, once, as at every focus. */
@container ${is('focus-shadow', 'neon')} {
    ${focused} [data-layer='focus-shadow'] {
        opacity: 1;
        animation:
            ui-neon var(--ui-duration-loop) var(--ui-easing-state) var(--ui-iteration-settle) alternate,
            ui-neon-rest var(--ui-duration-200) var(--ui-easing-exit)
                calc(var(--ui-duration-loop) * var(--ui-iteration-settle));
    }
}

@container ${is('focus-shadow', 'breathe')} {
    [data-layer='focus-shadow'] {
        box-shadow: ${lights.breath('var(--ui-color-accent)', '15px')};
    }

    ${focused} [data-layer='focus-shadow'] {
        opacity: 1;
        animation: ui-breathe-glow var(--ui-duration-loop) var(--ui-easing-state)
            var(--ui-iteration-settle) alternate;
    }
}

@container ${is('focus-shadow', 'burst')} {
    ${focused} [data-layer='focus-shadow'] {
        opacity: 1;
        animation: ui-burst var(--ui-duration-400) var(--ui-easing-enter);
    }
}

/* hover-fill: tint, the surface taking on the accent. */
@container ${is('hover-fill', 'tint')} {
    [data-layer='fill'] {
        background-color: ${tint};
        transition: opacity ${reference('--ui-duration-state')} var(--ui-easing-state);
    }

    @media (hover: hover) {
        ${resting} [data-layer='fill'] {
            opacity: 1;
        }
    }
}

/* hover-fill: spotlight, the same tint under the pointer only. The tint's colour rather than
   the accent's own, so the text over it holds what the tint measured. */
@container ${is('hover-fill', 'spotlight')} {
    [data-layer='fill'] {
        background: ${spotlit(tint)};
    }

    ${unfocused} [data-layer='fill'] {
        opacity: var(--ui-pointer-near);
    }
}

/* hover-fill: flood. The tint spreads from where the pointer came onto the surface, a circle
   growing until it covers the surface, and drains toward where the pointer leaves. At 150% of the
   box's own measure the circle covers the box from any point on its edge, so a reader who asked
   for less motion gets the tint whole, at once. The radius grows with the button's registered
   progress rather than the clip's own transition, which carried the centre along with it; the
   centre glides only where the script finds the circle showing. */
@container ${is('hover-fill', 'flood')} {
    [data-layer='fill'] {
        background-color: ${tint};
        opacity: 1;
        clip-path: circle(calc(var(--ui-flood) * 150%) at var(--ui-flood-x) var(--ui-flood-y));
        transition: --ui-flood var(--ui-duration-400) var(--ui-easing-move);
    }

    [data-layer='fill'][data-gliding] {
        transition-property: --ui-flood, --ui-flood-x, --ui-flood-y;
    }

    @media (hover: hover) {
        ${resting} [data-layer='fill'] {
            --ui-flood: 1;
        }
    }
}

/* hover-fill: shimmer and scan, the button's, on the fill's layer: a sheen swept across the
   surface for as long as the pointer rests, or a band crossing it down once as the pointer
   arrives — a line across a surface, at no more than a rem. */
@container ${is('hover-fill', 'shimmer')} {
    [data-layer='fill'] {
        background-image: ${shimmer.image(sheen.over)};
        background-size: ${shimmer.size};
        background-repeat: no-repeat;
        background-position: ${shimmer.position};
    }

    @media (hover: hover) {
        ${resting} [data-layer='fill'] {
            opacity: 1;
            animation: ${shimmer.loop};
        }
    }
}

@container ${is('hover-fill', 'scan')} {
    [data-layer='fill'] {
        background-image: ${scan.image(sheen.over)};
        background-size: ${scan.size};
        background-repeat: no-repeat;
        background-position: ${scan.position};
    }

    @media (hover: hover) {
        ${resting} [data-layer='fill'] {
            opacity: 1;
            animation: ${scan.run};
        }
    }
}

/* hover-fill: ripple, the button's, in the tint the surface's other lights are drawn in: once, as the
   pointer arrives, a circle spreads from where it came in. */
@container ${is('hover-fill', 'ripple')} {
    [data-layer='fill'] {
        background-image: ${ripple.image(tinted(reference('--ui-color-surface-raised').cssText, 'var(--ui-ripple-alpha)'))};
    }

    @media (hover: hover) {
        ${resting} [data-layer='fill'] {
            opacity: 1;
            animation: ${ripple.run};
        }
    }
}

/* ——— A focus in the surface, on its own layer, as its border's is. ——— */
@container ${is('focus-fill', 'tint')} {
    [data-layer='focus-fill'] {
        background-color: ${tint};
        transition: opacity ${reference('--ui-duration-state')} ${reference('--ui-easing-state')};
    }

    ${focused} [data-layer='focus-fill'] {
        opacity: 1;
    }
}

/* shimmer, four sweeps and then at rest, and scan, once, as at every focus. */
@container ${is('focus-fill', 'shimmer')} {
    [data-layer='focus-fill'] {
        background-image: ${shimmer.image(sheen.over)};
        background-size: ${shimmer.size};
        background-repeat: no-repeat;
        background-position: ${shimmer.position};
    }

    ${focused} [data-layer='focus-fill'] {
        opacity: 1;
        animation: ${shimmer.run};
    }
}

@container ${is('focus-fill', 'scan')} {
    [data-layer='focus-fill'] {
        background-image: ${scan.image(sheen.over)};
        background-size: ${scan.size};
        background-repeat: no-repeat;
        background-position: ${scan.position};
    }

    ${focused} [data-layer='focus-fill'] {
        opacity: 1;
        animation: ${scan.run};
    }
}

/* ripple: as the focus arrives, from the middle, as a focus has no point to come in at. */
@container ${is('focus-fill', 'ripple')} {
    [data-layer='focus-fill'] {
        background-image: ${ripple.image(tinted(reference('--ui-color-surface-raised').cssText, 'var(--ui-ripple-alpha)'), '50% 50%')};
    }

    ${focused} [data-layer='focus-fill'] {
        opacity: 1;
        animation: ${ripple.run};
    }
}

/* spotlight and flood, the pointer's, from the middle, as a focus has no point to come in at: the
   tint lit round the middle, faded in, or spread from there as the focus arrives and drained back
   as it leaves. At 71% of the box's own measure, a circle from the middle reaches its farthest
   corner. */
@container ${is('focus-fill', 'spotlight')} {
    [data-layer='focus-fill'] {
        background: ${spotlit(tint, '50% 50%')};
        transition: opacity var(--ui-duration-200) var(--ui-easing-enter);
    }

    ${focused} [data-layer='focus-fill'] {
        opacity: 1;
    }
}

@container ${is('focus-fill', 'flood')} {
    [data-layer='focus-fill'] {
        background-color: ${tint};
        opacity: 1;
        clip-path: circle(calc(var(--ui-flood) * 71%) at 50% 50%);
        transition: --ui-flood var(--ui-duration-400) var(--ui-easing-move);
    }

    ${focused} [data-layer='focus-fill'] {
        --ui-flood: 1;
    }
}

/* hover-border: edge, the band lit where the pointer is nearest: the definition every component
   that offers it draws, fading out over the surface's own width across and its own height down, so a
   pointer in the middle of one still lights every side, and one at a side lights the far one at
   nothing. The layer's box is the surface's, so the pointer is where the engine writes it. */
@container ${is('hover-border', 'edge')} {
    [data-layer='border'] {
        background: ${edge.light};
    }

    ${unfocused} [data-layer='border'] {
        opacity: var(--ui-pointer-near);
    }
}

/* hover-border: trace. The band drawn round once, clockwise from the top, and undrawn the same
   way when the pointer leaves: the definition every component that offers it draws. */
@container ${is('hover-border', 'trace')} {
    [data-layer='border'] {
        background: ${trace.light};
        opacity: 1;
        transition: ${trace.transition};
    }

    @media (hover: hover) {
        ${resting} [data-layer='border'] {
            --ui-trace: 360deg;
        }
    }
}

/* hover-border: rainbow. The band in the trace's colour turned round the hue wheel for as long as
   the pointer rests, in and out on the state's step, and what the surface holds as it was: the
   definition every component that offers it draws. */
@container ${is('hover-border', 'rainbow')} {
    [data-layer='border'] {
        background: ${rainbow.colour(`var(--ui-band-ink, ${far})`)};
        transition: opacity ${reference('--ui-duration-state')} ${reference('--ui-easing-state')};
    }

    @media (hover: hover) {
        ${resting} [data-layer='border'] {
            opacity: 1;
            animation: ${rainbow.loop};
        }
    }
}

/* hover-border: orbit. A light from the accent round the hue wheel runs round the band, on the
   boundary and never past it, three laps, and then it fades. */
@container ${is('hover-border', 'orbit')} {
    [data-layer='border'] {
        background: ${orbit.light};
        transition: opacity var(--ui-duration-200) var(--ui-easing-exit);
    }

    @media (hover: hover) {
        ${resting} [data-layer='border'] {
            opacity: 1;
            animation: ${orbit.run};
        }
    }
}

/* hover-border: comet. The button's: a comet from the accent round the hue wheel runs round clear
   of the boundary for as long as the pointer rests, and is held where it was when the pointer
   leaves. The layer's box is the border's, a pixel out from the box it is placed in. */
@container ${is('hover-border', 'comet')} {
    [data-layer='border'] {
        inset: -${comet.reach + 1}px;
        padding: ${comet.width}px;
        border-radius: calc(${reference('--ui-radius')} + ${comet.reach}px);
        background: ${comet.light};
        transition: opacity var(--ui-duration-200) var(--ui-easing-state);
        animation: ${comet.loop};
    }

    @media (hover: hover) {
        ${resting} [data-layer='border'] {
            opacity: 1;
            animation-play-state: running;
        }
    }
}

/* hover-border: pulse. The button's: a ring of the accent leaving the boundary once as the pointer
   arrives, in the reach a button's takes. A shadow round the layer, which the band's mask would
   cut away, so the layer is the whole box here. */
@container ${is('hover-border', 'pulse')} {
    [data-layer='border'] {
        padding: 0;
        mask: none;
        opacity: 1;
    }

    @media (hover: hover) {
        ${resting} [data-layer='border'] {
            animation: ui-pulse var(--ui-duration-400) var(--ui-easing-enter);
        }
    }
}

/* hover-border: highlight and accent. The boundary finishes the mix it started, to the text's
   colour, as a field's does under the pointer, or takes the accent: a band the boundary's own
   width, laid over it on the border's layer, so a choice made on the component itself reaches it. */
@container ${is('hover-border', 'highlight')} or ${is('hover-border', 'accent')} {
    [data-layer='border'] {
        padding: 1px;
        transition: opacity ${reference('--ui-duration-state')} ${reference('--ui-easing-state')};
    }

    @media (hover: hover) {
        ${resting} [data-layer='border'] {
            opacity: 1;
        }
    }
}

@container ${is('hover-border', 'highlight')} {
    [data-layer='border'] {
        background: ${reference('--ui-color-text')};
    }
}

@container ${is('hover-border', 'accent')} {
    [data-layer='border'] {
        background: var(--ui-color-accent);
    }
}

/* hover-border: underline and sweep, the field's: a line of the accent along the bottom edge,
   drawn out from the middle or from where the text starts, over the boundary, which is outside the
   box the layer is placed in. */
@container ${is('hover-border', 'underline')} or ${is('hover-border', 'sweep')} {
    [data-layer='border'] {${line.drawn}
        inset-block-end: -1px;
        opacity: 1;
        clip-path: ${line.underline};
        transition: ${line.transition};
    }

    @media (hover: hover) {
        ${resting} [data-layer='border'] {
            clip-path: inset(0);
        }
    }
}

@container ${is('hover-border', 'sweep')} {
    [data-layer='border'] {
        clip-path: ${line.sweep};
    }

    ${rtl} [data-layer='border'] {
        clip-path: ${line.mirrored};
    }
}

/* hover-border: explode, the button's: one ring thrown out from the boundary once as the pointer
   arrives, round the whole box, in the accent. */
@container ${is('hover-border', 'explode')} {
    [data-layer='border'] {
        padding: 0;
        color: var(--ui-color-accent);
        mask: none;
        opacity: 1;
    }

    @media (hover: hover) {
        ${resting} [data-layer='border'] {${thrown.explode}
        }
    }
}

/* The circles the pointer and the focus throw, the button's, each on its moment's layer while it
   plays: from under the surface's middle to past its farthest corner, in the accent. The
   surface is its host's own background, which every layer is drawn over, so its box is cut out of
   the circle, which then comes out from under it as it does from under a button. */
[data-layer][data-border='shockwave'],
[data-layer][data-border='bloom'] {${thrown.dot}
    color: var(--ui-color-accent);
    opacity: 1;
    clip-path: polygon(
        evenodd,
        -200vmax -200vmax,
        200vmax -200vmax,
        200vmax 200vmax,
        -200vmax 200vmax,
        -200vmax -200vmax,
        calc(1px - var(--ui-wave-x)) calc(1px - var(--ui-wave-y)),
        calc(1px + var(--ui-wave-x)) calc(1px - var(--ui-wave-y)),
        calc(1px + var(--ui-wave-x)) calc(1px + var(--ui-wave-y)),
        calc(1px - var(--ui-wave-x)) calc(1px + var(--ui-wave-y)),
        calc(1px - var(--ui-wave-x)) calc(1px - var(--ui-wave-y))
    );
}

[data-layer][data-border='shockwave'] {${thrown.shockwave}
}

[data-layer][data-border='bloom'] {${thrown.bloom}
}

/* ——— A focus in the surface, on what it holds: a button the reader has reached, which draws its
   own ring. The page marks the host for a focus the reader can see in it. Each border draws on
   the focus's layer, as the pointer's do on theirs. ——— */
@container ${is('focus-border', 'highlight')} or ${is('focus-border', 'accent')} {
    [data-layer='focus-border'] {
        padding: 1px;
        transition: opacity ${reference('--ui-duration-state')} ${reference('--ui-easing-state')};
    }

    ${focused} [data-layer='focus-border'] {
        opacity: 1;
    }
}

@container ${is('focus-border', 'highlight')} {
    [data-layer='focus-border'] {
        background: ${reference('--ui-color-text')};
    }
}

@container ${is('focus-border', 'accent')} {
    [data-layer='focus-border'] {
        background: var(--ui-color-accent);
    }
}

/* edge, the pointer's: the band lit as a pointer in the middle of the surface would light it, faded
   in. */
@container ${is('focus-border', 'edge')} {
    [data-layer='focus-border'] {
        background: ${edge.middle};
        transition: opacity var(--ui-duration-200) var(--ui-easing-enter);
    }

    ${focused} [data-layer='focus-border'] {
        opacity: 1;
    }
}

@container ${is('focus-border', 'orbit')} {
    [data-layer='focus-border'] {
        background: ${orbit.light};
        transition: opacity var(--ui-duration-200) var(--ui-easing-exit);
    }

    ${focused} [data-layer='focus-border'] {
        opacity: 1;
        animation: ${orbit.run};
    }
}

@container ${is('focus-border', 'trace')} {
    [data-layer='focus-border'] {
        background: ${trace.light};
        opacity: 1;
        transition: ${trace.transition};
    }

    ${focused} [data-layer='focus-border'] {
        --ui-trace: 360deg;
    }
}

/* rainbow: the pointer's, faded in, twice round, and at rest in the trace's colour. */
@container ${is('focus-border', 'rainbow')} {
    [data-layer='focus-border'] {
        background: ${rainbow.colour(`var(--ui-band-ink, ${far})`)};
        transition: opacity var(--ui-duration-200) var(--ui-easing-enter);
    }

    ${focused} [data-layer='focus-border'] {
        opacity: 1;
        animation: ${rainbow.run};
    }
}

/* comet: the pointer's, two laps and then it fades, as at every focus. */
@container ${is('focus-border', 'comet')} {
    [data-layer='focus-border'] {
        inset: -${comet.reach + 1}px;
        padding: ${comet.width}px;
        border-radius: calc(${reference('--ui-radius')} + ${comet.reach}px);
        background: ${comet.light};
    }

    ${focused} [data-layer='focus-border'] {
        opacity: 1;
        animation: ${comet.run};
    }
}

@container ${is('focus-border', 'underline')} or ${is('focus-border', 'sweep')} {
    [data-layer='focus-border'] {${line.drawn}
        inset-block-end: -1px;
        opacity: 1;
        clip-path: ${line.underline};
        transition: ${line.transition};
    }

    ${focused} [data-layer='focus-border'] {
        clip-path: inset(0);
    }
}

@container ${is('focus-border', 'sweep')} {
    [data-layer='focus-border'] {
        clip-path: ${line.sweep};
    }

    ${rtl} [data-layer='focus-border'] {
        clip-path: ${line.mirrored};
    }
}

/* pulse: in the focus's own colour, as the focus's pulse is everywhere, out from the surface. */
@container ${is('focus-border', 'pulse')} {
    [data-layer='focus-border'] {
        padding: 0;
        mask: none;
        opacity: 1;
    }

    ${focused} [data-layer='focus-border'] {
        animation: ui-pulse-focus var(--ui-duration-400) var(--ui-easing-enter);
    }
}

@container ${is('focus-border', 'explode')} {
    [data-layer='focus-border'] {
        padding: 0;
        color: var(--ui-color-accent);
        mask: none;
        opacity: 1;
    }

    ${focused} [data-layer='focus-border'] {${thrown.explode}
    }
}

/* Where the pointer and the focus both chose an effect that holds, it is drawn once, on the
   pointer's layer, for either, so it holds from one to the other rather than fading out of one
   layer while it fades into the other; the focus's layer stays out. */
${(
    [
        ['fill', ['tint'], 'opacity: 1;'],
        ['shadow', ['raise', 'sink', 'halo', 'glow', 'inner'], 'opacity: 1;'],
        ['border', ['highlight', 'accent'], 'opacity: 1;'],
        ['border', ['trace'], '--ui-trace: 360deg;'],
        ['border', ['underline', 'sweep'], 'clip-path: inset(0);'],
    ] as const
)
    .flatMap(([kind, effects, shown]) =>
        effects.map(
            (
                effect,
            ) => String.raw`@container ${is(`hover-${kind}`, effect)} and ${is(`focus-${kind}`, effect)} {
    ${focused} [data-layer='${kind}'] {
        ${shown}
    }

    [data-layer='focus-${kind}'] {
        visibility: hidden;
    }
}`,
        ),
    )
    .join('\n\n')}

${rainbow.frames}
`;
}

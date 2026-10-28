/**
 * `ui-toast` and `ui-toaster`: what the pointer, a focus in a toast, the entrance, the exit, the
 * time a toast stays and the stack can do.
 *
 * **The pointer's and a focus's effects are the card's**, by kind, each but the movement on a layer
 * the page renders into the toast and not into the toaster, by the rules every surface shares, in
 * `surfaces.ts`. Its movements go on its transform, and its one list of animations reads its
 * entrance and its exit from one property and a movement from another, as the card's does.
 *
 * **The entrance and the exit take the card's too**, each with a direction and a curve beside it as
 * kinds of their own, and two slides of their own: one that bounces off where it lands, and one
 * that springs past it and back. A toast stands in a corner of the page, so whatever travels
 * comes in from the page's right edge and leaves toward it, unless a direction says otherwise.
 *
 * **The toast's surface is its host**, as the card's is, and every effect that moves a toast
 * moves the host — so S8 shows here too: a choice made on a toast itself, or on every
 * `ui-toast`, does not reach them. The toaster, or anything around it, does, and a toaster is
 * the natural place for the choice anyway: it is the stack's. The pieces and the grain a script
 * draws are read where the sheet's are, so they miss the same choices. The time left is drawn
 * inside the toast, which every choice reaches.
 *
 * A toast removes itself once every animation on it has finished, so an exit is waited out by
 * the code that is already there, and one a script draws is held for by an animation that draws
 * nothing. The stack moves the reference's way, the glide's: measure the toasts before one arrives
 * or leaves, let the layout move them, then animate each from where it was.
 */
import { reference } from '../../../../src/reference.js';
import { UiToast } from '../../../../src/toast.js';
import { enters, floods, focal, moves, sized, sweeps, waves } from '../controls.js';
import { focus, hover } from '../moments.js';
import {
    around,
    chosen,
    curve,
    dissolve,
    duration,
    easing,
    inner,
    pieces,
    prototype,
    queries,
    restore,
    travel,
    type Effect,
    type Firing,
    type Order,
} from '../motion.js';
import { layered, surface } from '../surfaces.js';

/** The query each effect is drawn under: the consumer's choice, else the theme's taste. */
const is = queries('toast');

/** The step the pieces and the grain take, either way, and what holds a toast for them. */
const step = '--ui-duration-400';

/** The curves the component's own transitions take, which a chosen one stands in for, and their
 *  length. */
const enter = reference('--ui-easing-enter').cssText;
const exit = reference('--ui-easing-exit').cssText;
const state = reference('--ui-duration-state').cssText;

/** A toast without a focus the reader can see in it, which the pointer's effects are drawn on,
 *  since they yield to it; the same toast with the pointer resting on it; and one with such a focus
 *  in it. Each names the toast, the sheet being the toaster's too. Under :where(), so each weighs
 *  what it did. */
const unfocused = ':host(ui-toast:where(:not([data-focus-visible])))';
const resting = ':host(ui-toast:hover:where(:not([data-focus-visible])))';
const focused = ':host(ui-toast[data-focus-visible])';

/** Throws a circle out from under the toast, on the pointer's border layer or the focus's. */
const wave = waves(
    (host) => host,
    (host) => inner(host, "[data-layer='border']"),
);
const focusWave = waves(
    (host) => host,
    (host) => inner(host, "[data-layer='focus-border']"),
);

/** The colour of the toast's edge, opaque, as its icon is drawn in it. */
const edge = `rgb(from ${reference('--ui-color-toast-edge').cssText} r g b / 1)`;

/** Where a toast's own sheet reads its choices: its effects are drawn on its host — S8. */
const reading = (host: HTMLElement): Element => around(host) ?? host;

/**
 * How a toast is cut into pieces: about the reference's thirty-six, each about as tall as it is
 * wide. Six by six cut a toast, several times wider than it is tall, into slivers 7px high.
 */
const grid = (host: HTMLElement): readonly [number, number] => {
    const columns = Math.max(
        1,
        Math.round(Math.sqrt((36 * host.offsetWidth) / Math.max(1, host.offsetHeight))),
    );

    return [Math.max(1, Math.round(36 / columns)), columns];
};

/**
 * A copy of a toast for a piece to show its cell of: what the component rendered, under its own
 * sheet, over copies of what the host was given. Not a copy of the host: a `ui-toast` copied is a
 * toast, which puts itself into a region of the toaster and starts a clock of its own.
 */
const copyOf = (host: HTMLElement) => (): HTMLElement => {
    const copy = document.createElement('div');
    copy.setAttribute('variant', host.getAttribute('variant') ?? 'info');
    // The component's rise, which a copy has nothing to rise from.
    copy.style.transition = 'none';
    const root = copy.attachShadow({ mode: 'open' });
    const own = UiToast.styles.styleSheet;
    root.adoptedStyleSheets = own === undefined ? [] : [own];
    root.append(...[...(host.shadowRoot?.childNodes ?? [])].map((node) => node.cloneNode(true)));
    copy.append(...[...host.childNodes].map((node) => node.cloneNode(true)));

    return copy;
};

/**
 * Puts the toast together from pieces of itself as it arrives, by the harness's pieces, after its
 * toaster: beside the toast, a piece is assigned to none of the toaster's slots.
 */
const assemble =
    (order: Order) =>
    ({ host }: Firing): void => {
        // In from the page's right edge, travelling left.
        const way = travel(reading(host), 'enter') ?? [-1, 0];

        pieces({
            host,
            after: host.closest('ui-toaster') ?? undefined,
            surface: host,
            copy: copyOf(host),
            order,
            // The disintegration this runs backwards blew the other way.
            wind: [-way[0], -way[1]],
            together: true,
            easing: curve(reading(host), 'enter'),
            length: duration(host, step),
            grid: grid(host),
        });
    };

/** Breaks the toast into pieces of itself as it goes, the wind blowing the way the exit travels. */
const disintegrate =
    (order: Order) =>
    ({ host }: Firing): void => {
        pieces({
            host,
            after: host.closest('ui-toaster') ?? undefined,
            surface: host,
            copy: copyOf(host),
            order,
            wind: travel(reading(host), 'exit') ?? [1, 0],
            together: false,
            easing: curve(reading(host), 'exit'),
            length: duration(host, step),
            grid: grid(host),
        });
    };

/** The toast brought out of grain as it arrives, or dissolved into it as it goes. */
const grain =
    (together: boolean) =>
    ({ host }: Firing): void => {
        dissolve({
            host,
            surface: host,
            together,
            easing: curve(reading(host), together ? 'enter' : 'exit'),
            length: duration(host, step),
        });
    };

const sheet = String.raw`
/* The sheet is adopted into the toaster's shadow root too, so every rule names the element it is
   for: a :host the toaster matched would move the whole stack. */

/* The toaster draws a toast that moves past its box there, rather than scrolling to it: the
   platform gives a popover overflow: auto, and a toast sliding its own width past the toaster
   scrolled it, under a scrollbar, for as long as the slide ran — measured. */
:host(ui-toaster) {
    overflow: visible;
}

/* The toast is what moves, and the layers stack inside it, as a card's do: isolated, so a layer
   under the message stays over the toast's own fill instead of going behind it.

   What the pointer or a focus in it moves the toast by goes on its transform, which no entrance
   starts from. The card's go on its translate and its scale too, but the component's rise starts
   the toast's translate from below, and a transition there at its arrival would outrank an
   entrance's animation in the cascade. The movement's transition is kept beside whatever an
   entrance leaves running, on the card's length. */
:host(ui-toast) {
    isolation: isolate;
    --ui-toast-moved: transform var(--ui-duration-200) var(--ui-easing-enter);
}

/* The host's one list of animations, read, as the card's is, from a property for its entrance and
   its exit and one for a movement the pointer or the focus plays. A beat, a stretch and a swell go
   the card's quarter of the button's way: a toast is about as many buttons wide, 320px against the
   113px of the button that raises one on its page. */
:host(ui-toast) {
    animation: var(--ui-toast-passage, none), var(--ui-toast-move, none);
    --ui-give: 0.25;
}

/* The component's own transitions, today's rise and sink and the fades that keep them, on the
   curve a reader chose, or else on the component's; and on the way in, the movement's beside
   them. */
:host(ui-toast:not(.closing)) {
    transition:
        opacity ${state} var(--ui-enter-curve, ${enter}),
        translate ${state} var(--ui-enter-curve, ${enter}),
        var(--ui-toast-moved);
}

:host(ui-toast.closing) {
    transition-timing-function: var(--ui-exit-curve, ${exit});
}

${layered}

/* The focus wins, as on a card: a toast the reader can see the focus in is drawn as the focus
   chose, and the pointer resting on it changes nothing, nor does its arrival fire anything. Every
   hover state sits under hover: hover, as the card's do: a tap leaves :hover on whatever it
   touched. */

/* hover-move: lift and zoom, a quarter of a rem up or three hundredths larger, as the card's. */
@media (hover: hover) {
    @container ${is('hover-move', 'lift')} {
        ${resting} {
            transform: translateY(-0.25rem);
        }
    }

    @container ${is('hover-move', 'zoom')} {
        ${resting} {
            transform: scale(1.03);
        }
    }
}

/* hover-move: tilt, turned toward the pointer, on the card's quick transition, since it follows
   the pointer; and magnetic, drawn toward the pointer as it nears, half a step at most. */
@container ${is('hover-move', 'tilt')} {
    :host(ui-toast) {
        --ui-toast-moved: transform var(--ui-duration-50) linear;
    }

    ${unfocused} {
        transform: perspective(60rem)
            rotateX(calc(var(--ui-pointer-ny) * var(--ui-pointer-near) * -5deg))
            rotateY(calc(var(--ui-pointer-nx) * var(--ui-pointer-near) * 5deg));
    }
}

@container ${is('hover-move', 'magnetic')} {
    ${unfocused} {
        transform: translate(
            calc(var(--ui-pointer-nx) * var(--ui-pointer-near) * 0.5rem),
            calc(var(--ui-pointer-ny) * var(--ui-pointer-near) * 0.375rem)
        );
    }
}

/* hover-move: heartbeat, rubber and glitch, the button's, once, as the pointer arrives; and at the
   focus, as the focus arrives in the toast, with its lift and its zoom. The focus's play under
   their own names, as the card's do. */
@media (hover: hover) {
    @container ${is('hover-move', 'heartbeat')} {
        ${resting} {
            --ui-toast-move: ui-heartbeat var(--ui-duration-300) var(--ui-easing-state);
        }
    }

    @container ${is('hover-move', 'rubber')} {
        ${resting} {
            --ui-toast-move: ui-rubber var(--ui-duration-400) linear;
        }
    }

    @container ${is('hover-move', 'glitch')} {
        ${resting} {
            --ui-toast-move: ui-glitch var(--ui-duration-200) linear;
        }
    }
}

@container ${is('focus-move', 'lift')} {
    ${focused} {
        transform: translateY(-0.25rem);
    }
}

@container ${is('focus-move', 'zoom')} {
    ${focused} {
        transform: scale(1.03);
    }
}

@container ${is('focus-move', 'heartbeat')} {
    ${focused} {
        --ui-toast-move: ${focal.run('ui-heartbeat var(--ui-duration-300) var(--ui-easing-state)')};
    }
}

@container ${is('focus-move', 'rubber')} {
    ${focused} {
        --ui-toast-move: ${focal.run('ui-rubber var(--ui-duration-400) linear')};
    }
}

@container ${is('focus-move', 'glitch')} {
    ${focused} {
        --ui-toast-move: ${focal.run('ui-glitch var(--ui-duration-200) linear')};
    }
}

${surface({ is, unfocused, resting, focused, rtl: ':host(ui-toast:dir(rtl))' })}

/* ——— The entrance.

   fade and pop start the component's transition from somewhere else. Every other effect is an
   animation, as the card's entrance is, held at its first frame only while it waits; it turns
   today's transitions off for its moment, keeping the movement's, a transition outranking an
   animation in the cascade. The
   direction and the curve are values the keyframes read. Each effect sets its own direction; a
   chosen one comes later in the sheet, and wins. ——— */
@container ${is('enter', 'none')} {
    :host(ui-toast:not(.closing)) {
        transition: var(--ui-toast-moved);
    }
}

@container ${is('enter', 'fade')} {
    @starting-style {
        :host(ui-toast) {
            opacity: 0;
            translate: 0 0;
        }
    }
}

/* pop: from smaller, carried past its size and back by the scale's emphasis, which a chosen
   curve does not replace. */
@container ${is('enter', 'pop')} {
    :host(ui-toast:not(.closing)) {
        transition:
            opacity var(--ui-duration-200) var(--ui-easing-enter),
            translate var(--ui-duration-200) var(--ui-easing-enter),
            scale var(--ui-duration-200) var(--ui-easing-emphasis),
            var(--ui-toast-moved);
    }

    @starting-style {
        :host(ui-toast) {
            opacity: 0;
            translate: 0 0;
            scale: 0.9;
        }
    }
}

@container ${is('enter', 'zoom')} {
    :host(ui-toast:not(.closing)) {
        transition: var(--ui-toast-moved);
        --ui-toast-passage: ui-enter-zoom var(--ui-duration-200)
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

/* drop: its bounce is its curve, which a chosen one does not replace. */
@container ${is('enter', 'drop')} {
    :host(ui-toast:not(.closing)) {
        transition: var(--ui-toast-moved);
        --ui-toast-passage: ui-drop var(--ui-duration-400) linear backwards;
    }
}

@container ${is('enter', 'slide')} {
    :host(ui-toast) {
        --ui-enter-x: -1;
        --ui-enter-y: 0;
    }

    :host(ui-toast:not(.closing)) {
        transition: var(--ui-toast-moved);
        --ui-toast-passage: ui-enter-slide var(--ui-duration-300)
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

/* The slides that bounce and spring: their curve is the effect, as the drop's is. */
@container ${is('enter', 'slide-bounce')} {
    :host(ui-toast) {
        --ui-enter-x: -1;
        --ui-enter-y: 0;
    }

    :host(ui-toast:not(.closing)) {
        transition: var(--ui-toast-moved);
        --ui-toast-passage: ui-enter-slide-bounce var(--ui-duration-400) linear backwards;
    }
}

@container ${is('enter', 'slide-elastic')} {
    :host(ui-toast) {
        --ui-enter-x: -1;
        --ui-enter-y: 0;
    }

    :host(ui-toast:not(.closing)) {
        transition: var(--ui-toast-moved);
        --ui-toast-passage: ui-enter-slide-elastic var(--ui-duration-400) linear backwards;
    }
}

@container ${is('enter', 'flip-vertical')} {
    :host(ui-toast:not(.closing)) {
        transition: var(--ui-toast-moved);
        --ui-toast-passage: ui-enter-flip-vertical var(--ui-duration-300)
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

@container ${is('enter', 'flip-horizontal')} {
    :host(ui-toast:not(.closing)) {
        transition: var(--ui-toast-moved);
        --ui-toast-passage: ui-enter-flip-horizontal var(--ui-duration-300)
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

@container ${is('enter', 'wipe')} {
    :host(ui-toast) {
        --ui-enter-x: -1;
        --ui-enter-y: 0;
    }

    :host(ui-toast:not(.closing)) {
        transition: var(--ui-toast-moved);
        --ui-toast-passage: ui-enter-wipe var(--ui-duration-300)
            var(--ui-enter-curve, var(--ui-easing-move)) backwards;
    }
}

@container ${is('enter', 'circle')} {
    :host(ui-toast) {
        --ui-enter-x: 0;
        --ui-enter-y: 0;
    }

    :host(ui-toast:not(.closing)) {
        transition: var(--ui-toast-moved);
        --ui-toast-passage: ui-enter-circle var(--ui-duration-300)
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

@container ${is('enter', 'curtain')} {
    :host(ui-toast) {
        --ui-enter-x: 1;
        --ui-enter-y: 0;
    }

    :host(ui-toast:not(.closing)) {
        transition: var(--ui-toast-moved);
        --ui-toast-passage: ui-enter-curtain var(--ui-duration-300)
            var(--ui-enter-curve, var(--ui-easing-move)) backwards;
    }
}

@container ${is('enter', 'refocus')} {
    :host(ui-toast:not(.closing)) {
        transition: var(--ui-toast-moved);
        --ui-toast-passage: ui-enter-refocus calc(var(--ui-duration-300) * 1.25)
            var(--ui-enter-curve, var(--ui-easing-enter)) backwards;
    }
}

/* wind, converge, materialize, dissolve: a script draws them, over the toast in the top layer or
   on it, and the toast is where it will be from the start. */
@container ${is('enter', 'wind')} or ${is('enter', 'converge')} or
    ${is('enter', 'materialize')} or ${is('enter', 'dissolve')} {
    :host(ui-toast:not(.closing)) {
        transition: var(--ui-toast-moved);
    }
}

/* ——— The exit, under the class the component carries it by, a step quicker than its entrance.
   The component's own is a fade going down, toward the style it ends at: every animation here
   starts from a toast that is there instead, and holds its last frame until the toast has gone.
   The direction is the way it leaves. ——— */
@container ${is('exit', 'none')} {
    :host(ui-toast.closing) {
        transition: none;
    }
}

@container ${is('exit', 'fade')} {
    :host(ui-toast.closing) {
        translate: 0 0;
    }
}

@container ${is('exit', 'zoom')} {
    :host(ui-toast.closing) {
        opacity: 1;
        translate: 0 0;
        transition: none;
        --ui-toast-passage: ui-exit-zoom var(--ui-duration-150)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'slide')} {
    :host(ui-toast) {
        --ui-exit-x: 1;
        --ui-exit-y: 0;
    }

    :host(ui-toast.closing) {
        opacity: 1;
        translate: 0 0;
        transition: none;
        --ui-toast-passage: ui-exit-slide var(--ui-duration-200)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'slide-bounce')} {
    :host(ui-toast) {
        --ui-exit-x: 1;
        --ui-exit-y: 0;
    }

    :host(ui-toast.closing) {
        opacity: 1;
        translate: 0 0;
        transition: none;
        --ui-toast-passage: ui-exit-slide-bounce var(--ui-duration-300) linear forwards;
    }
}

@container ${is('exit', 'slide-elastic')} {
    :host(ui-toast) {
        --ui-exit-x: 1;
        --ui-exit-y: 0;
    }

    :host(ui-toast.closing) {
        opacity: 1;
        translate: 0 0;
        transition: none;
        --ui-toast-passage: ui-exit-slide-elastic var(--ui-duration-300) linear forwards;
    }
}

@container ${is('exit', 'flip-vertical')} {
    :host(ui-toast.closing) {
        opacity: 1;
        translate: 0 0;
        transition: none;
        --ui-toast-passage: ui-exit-flip-vertical var(--ui-duration-200)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'flip-horizontal')} {
    :host(ui-toast.closing) {
        opacity: 1;
        translate: 0 0;
        transition: none;
        --ui-toast-passage: ui-exit-flip-horizontal var(--ui-duration-200)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'wipe')} {
    :host(ui-toast) {
        --ui-exit-x: 1;
        --ui-exit-y: 0;
    }

    :host(ui-toast.closing) {
        opacity: 1;
        translate: 0 0;
        transition: none;
        --ui-toast-passage: ui-exit-wipe var(--ui-duration-200)
            var(--ui-exit-curve, var(--ui-easing-move)) forwards;
    }
}

@container ${is('exit', 'circle')} {
    :host(ui-toast) {
        --ui-exit-x: 0;
        --ui-exit-y: 0;
    }

    :host(ui-toast.closing) {
        opacity: 1;
        translate: 0 0;
        transition: none;
        --ui-toast-passage: ui-exit-circle var(--ui-duration-200)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

@container ${is('exit', 'curtain')} {
    :host(ui-toast) {
        --ui-exit-x: 1;
        --ui-exit-y: 0;
    }

    :host(ui-toast.closing) {
        opacity: 1;
        translate: 0 0;
        transition: none;
        --ui-toast-passage: ui-exit-curtain var(--ui-duration-200)
            var(--ui-exit-curve, var(--ui-easing-move)) forwards;
    }
}

@container ${is('exit', 'defocus')} {
    :host(ui-toast.closing) {
        opacity: 1;
        translate: 0 0;
        transition: none;
        --ui-toast-passage: ui-exit-defocus calc(var(--ui-duration-200) * 1.25)
            var(--ui-exit-curve, var(--ui-easing-exit)) forwards;
    }
}

/* wind, scatter, erode: the pieces are a script's, and the toast stands aside under them, where
   it was, held on the page while they fly; the stack closes up once they have gone. */
@container ${is('exit', 'wind')} or ${is('exit', 'scatter')} or ${is('exit', 'erode')} {
    :host(ui-toast.closing) {
        opacity: 1;
        translate: 0 0;
        transition: none;
        --ui-toast-passage: ui-held var(${step}) linear;
    }
}

/* dissolve: the grain is drawn on the toast itself, which stays where it is until none is left. */
@container ${is('exit', 'dissolve')} {
    :host(ui-toast.closing) {
        opacity: 1;
        translate: 0 0;
        transition: none;
        --ui-toast-passage: ui-kept var(${step}) linear;
    }
}

/* A direction chosen, for either moment: the way the effect travels. */
@container ${is('enter-direction', 'up')} {
    :host(ui-toast) {
        --ui-enter-x: 0;
        --ui-enter-y: -1;
    }
}

@container ${is('enter-direction', 'down')} {
    :host(ui-toast) {
        --ui-enter-x: 0;
        --ui-enter-y: 1;
    }
}

@container ${is('enter-direction', 'left')} {
    :host(ui-toast) {
        --ui-enter-x: -1;
        --ui-enter-y: 0;
    }
}

@container ${is('enter-direction', 'right')} {
    :host(ui-toast) {
        --ui-enter-x: 1;
        --ui-enter-y: 0;
    }
}

@container ${is('exit-direction', 'up')} {
    :host(ui-toast) {
        --ui-exit-x: 0;
        --ui-exit-y: -1;
    }
}

@container ${is('exit-direction', 'down')} {
    :host(ui-toast) {
        --ui-exit-x: 0;
        --ui-exit-y: 1;
    }
}

@container ${is('exit-direction', 'left')} {
    :host(ui-toast) {
        --ui-exit-x: -1;
        --ui-exit-y: 0;
    }
}

@container ${is('exit-direction', 'right')} {
    :host(ui-toast) {
        --ui-exit-x: 1;
        --ui-exit-y: 0;
    }
}

/* A curve chosen, for either moment. */
@container ${is('enter-curve', 'linear')} {
    :host(ui-toast) {
        --ui-enter-curve: linear;
    }
}

@container ${is('enter-curve', 'ease-in-out')} {
    :host(ui-toast) {
        --ui-enter-curve: ease-in-out;
    }
}

@container ${is('exit-curve', 'linear')} {
    :host(ui-toast) {
        --ui-exit-curve: linear;
    }
}

@container ${is('exit-curve', 'ease-in-out')} {
    :host(ui-toast) {
        --ui-exit-curve: ease-in-out;
    }
}

/* ——— The time left: what is left of the time a toast stays, as a line along its foot in its
   edge's colour, opaque, as its icon is, or as a ring round its dismiss button in the button's
   own, as its cross is. Inside the toast — a pseudo-element of its host and of its button — so
   every choice reaches it. Its length is the toast's own, written on it, and a toast that stays
   until it is dismissed has none. It holds full while the pointer or the focus is on the toast
   and starts again from full when both have gone, as the component's clock does.

   The time is no duration token and does not collapse, so for a reader who asked for less motion
   it would move for the whole of it: it stands down instead. A component would ask the reader's
   setting; the frame's switch writes the tokens the setting does, so the sheet asks one of those,
   the loop's count, which is 1 under both. ——— */
@container ${is('dwell', 'bar')} and style(--ui-dwell) and (not style(--ui-iteration-loop: 1)) {
    :host(ui-toast)::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: linear-gradient(currentColor 0 0) left bottom / 100% 2px no-repeat;
        color: ${edge};
        pointer-events: none;
        animation: ui-dwell var(--ui-dwell) linear forwards;
    }

    :host(ui-toast:dir(rtl))::after {
        background-position: right bottom;
    }

    :host(ui-toast:is(:hover, :focus-within))::after {
        animation: none;
    }
}

@container ${is('dwell', 'ring')} and style(--ui-dwell) and (not style(--ui-iteration-loop: 1)) {
    :host(ui-toast) button {
        position: relative;
    }

    :host(ui-toast) button::after {
        content: '';
        position: absolute;
        inset: -3px;
        border-radius: 50%;
        background: conic-gradient(currentColor var(--ui-swept), transparent 0);
        mask: radial-gradient(closest-side, transparent calc(100% - 2px), #000 calc(100% - 2px));
        pointer-events: none;
        animation: ui-dwell-ring var(--ui-dwell) linear forwards;
    }

    :host(ui-toast:is(:hover, :focus-within)) button::after {
        animation: none;
    }
}

@keyframes ui-enter-zoom {
    from {
        opacity: 0;
        scale: 0.96;
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

/* Its own size behind, and whole by two fifths of the way. */
@keyframes ui-enter-slide {
    from {
        opacity: 0;
        translate: calc(var(--ui-enter-x) * -100%) calc(var(--ui-enter-y) * -100%);
    }
    40% {
        opacity: 1;
    }
}

/* Its own size behind, gathering speed until it strikes where it lands at half the way, then
   thrown back off it 0.75rem and 0.25rem, the drop's bounce on its side. In rem, as the drop's
   is, so a slide up its own short height bounces as far as one across its width. */
@keyframes ui-enter-slide-bounce {
    0% {
        opacity: 0;
        translate: calc(var(--ui-enter-x) * -100%) calc(var(--ui-enter-y) * -100%);
        animation-timing-function: ease-in;
    }
    30% {
        opacity: 1;
    }
    50% {
        translate: 0 0;
        animation-timing-function: ease-out;
    }
    68% {
        translate: calc(var(--ui-enter-x) * -0.75rem) calc(var(--ui-enter-y) * -0.75rem);
        animation-timing-function: ease-in;
    }
    84% {
        translate: 0 0;
        animation-timing-function: ease-out;
    }
    92% {
        translate: calc(var(--ui-enter-x) * -0.25rem) calc(var(--ui-enter-y) * -0.25rem);
        animation-timing-function: ease-in;
    }
    100% {
        translate: 0 0;
    }
}

/* Its own size behind, flung past where it lands by 1rem and pulled back either side of it, each
   swing under half the last. */
@keyframes ui-enter-slide-elastic {
    0% {
        opacity: 0;
        translate: calc(var(--ui-enter-x) * -100%) calc(var(--ui-enter-y) * -100%);
        animation-timing-function: ease-out;
    }
    30% {
        opacity: 1;
    }
    42% {
        translate: calc(var(--ui-enter-x) * 1rem) calc(var(--ui-enter-y) * 1rem);
        animation-timing-function: ease-in-out;
    }
    60% {
        translate: calc(var(--ui-enter-x) * -0.5rem) calc(var(--ui-enter-y) * -0.5rem);
        animation-timing-function: ease-in-out;
    }
    76% {
        translate: calc(var(--ui-enter-x) * 0.2rem) calc(var(--ui-enter-y) * 0.2rem);
        animation-timing-function: ease-in-out;
    }
    90% {
        translate: calc(var(--ui-enter-x) * -0.07rem) calc(var(--ui-enter-y) * -0.07rem);
        animation-timing-function: ease-in-out;
    }
    100% {
        translate: 0 0;
    }
}

/* Edge-on, at 90°, turning until it faces the reader. */
@keyframes ui-enter-flip-vertical {
    from {
        transform: perspective(60rem) rotateX(90deg);
    }
}

@keyframes ui-enter-flip-horizontal {
    from {
        transform: perspective(60rem) rotateY(90deg);
    }
}

/* The reveals end 3rem past the toast, so a theme's glow is uncovered with it rather than all at
   once when the clip goes: the card's, whose sheet says why. */
@keyframes ui-enter-wipe {
    from {
        clip-path: inset(
            calc(max(0, -1 * var(--ui-enter-y)) * 100%)
            calc(max(0, var(--ui-enter-x)) * 100%)
            calc(max(0, var(--ui-enter-y)) * 100%)
            calc(max(0, -1 * var(--ui-enter-x)) * 100%)
        );
    }
    to {
        clip-path: inset(-3rem);
    }
}

@keyframes ui-enter-circle {
    from {
        clip-path: circle(
            0 at calc(50% - var(--ui-enter-x) * 50%) calc(50% - var(--ui-enter-y) * 50%)
        );
    }
    to {
        clip-path: circle(
            calc(
                (1 + max(var(--ui-enter-x), -1 * var(--ui-enter-x), var(--ui-enter-y),
                    -1 * var(--ui-enter-y))) * 70.71% + 3rem
            )
            at calc(50% - var(--ui-enter-x) * 50%) calc(50% - var(--ui-enter-y) * 50%)
        );
    }
}

@keyframes ui-enter-curtain {
    from {
        clip-path: inset(
            calc(max(var(--ui-enter-y), -1 * var(--ui-enter-y)) * 50%)
            calc(max(var(--ui-enter-x), -1 * var(--ui-enter-x)) * 50%)
        );
    }
    to {
        clip-path: inset(-3rem);
    }
}

/* Out of focus by half a rem and sharpening, there by half the way: the card's refocus. */
@keyframes ui-enter-refocus {
    from {
        filter: blur(0.5rem);
        opacity: 0;
    }
    50% {
        opacity: 1;
    }
}

/* The exits, each its entrance run the other way: from a toast that is there to none. */
@keyframes ui-exit-zoom {
    to {
        opacity: 0;
        scale: 0.96;
    }
}

/* Whole for three fifths of the way, then gone with the last of it. */
@keyframes ui-exit-slide {
    60% {
        opacity: 1;
    }
    to {
        opacity: 0;
        translate: calc(var(--ui-exit-x) * 100%) calc(var(--ui-exit-y) * 100%);
    }
}

/* The entrance's bounce run backward: off where it is toward the way it leaves, 0.25rem and then
   0.75rem, and away, each curve the entrance's reversed. */
@keyframes ui-exit-slide-bounce {
    0% {
        translate: 0 0;
        animation-timing-function: ease-out;
    }
    8% {
        translate: calc(var(--ui-exit-x) * 0.25rem) calc(var(--ui-exit-y) * 0.25rem);
        animation-timing-function: ease-in;
    }
    16% {
        translate: 0 0;
        animation-timing-function: ease-out;
    }
    32% {
        translate: calc(var(--ui-exit-x) * 0.75rem) calc(var(--ui-exit-y) * 0.75rem);
        animation-timing-function: ease-in;
    }
    50% {
        translate: 0 0;
        animation-timing-function: ease-out;
    }
    70% {
        opacity: 1;
        animation-timing-function: ease-out;
    }
    100% {
        opacity: 0;
        translate: calc(var(--ui-exit-x) * 100%) calc(var(--ui-exit-y) * 100%);
    }
}

/* The entrance's spring run backward: swinging either side of where it is, wider each time,
   pulled back 1rem against the way it leaves, and flung out. */
@keyframes ui-exit-slide-elastic {
    0% {
        translate: 0 0;
        animation-timing-function: ease-in-out;
    }
    10% {
        translate: calc(var(--ui-exit-x) * 0.07rem) calc(var(--ui-exit-y) * 0.07rem);
        animation-timing-function: ease-in-out;
    }
    24% {
        translate: calc(var(--ui-exit-x) * -0.2rem) calc(var(--ui-exit-y) * -0.2rem);
        animation-timing-function: ease-in-out;
    }
    40% {
        translate: calc(var(--ui-exit-x) * 0.5rem) calc(var(--ui-exit-y) * 0.5rem);
        animation-timing-function: ease-in-out;
    }
    58% {
        translate: calc(var(--ui-exit-x) * -1rem) calc(var(--ui-exit-y) * -1rem);
        animation-timing-function: ease-in;
    }
    70% {
        opacity: 1;
        animation-timing-function: ease-in;
    }
    100% {
        opacity: 0;
        translate: calc(var(--ui-exit-x) * 100%) calc(var(--ui-exit-y) * 100%);
    }
}

/* Turning on the way it came in, until it is edge-on. */
@keyframes ui-exit-flip-vertical {
    to {
        transform: perspective(60rem) rotateX(-90deg);
    }
}

@keyframes ui-exit-flip-horizontal {
    to {
        transform: perspective(60rem) rotateY(-90deg);
    }
}

@keyframes ui-exit-wipe {
    from {
        clip-path: inset(-3rem);
    }
    to {
        clip-path: inset(
            calc(max(0, var(--ui-exit-y)) * 100%)
            calc(max(0, -1 * var(--ui-exit-x)) * 100%)
            calc(max(0, -1 * var(--ui-exit-y)) * 100%)
            calc(max(0, var(--ui-exit-x)) * 100%)
        );
    }
}

@keyframes ui-exit-circle {
    from {
        clip-path: circle(
            calc(
                (1 + max(var(--ui-exit-x), -1 * var(--ui-exit-x), var(--ui-exit-y),
                    -1 * var(--ui-exit-y))) * 70.71% + 3rem
            )
            at calc(50% + var(--ui-exit-x) * 50%) calc(50% + var(--ui-exit-y) * 50%)
        );
    }
    to {
        clip-path: circle(
            0 at calc(50% + var(--ui-exit-x) * 50%) calc(50% + var(--ui-exit-y) * 50%)
        );
    }
}

@keyframes ui-exit-curtain {
    from {
        clip-path: inset(-3rem);
    }
    to {
        clip-path: inset(
            calc(max(var(--ui-exit-y), -1 * var(--ui-exit-y)) * 50%)
            calc(max(var(--ui-exit-x), -1 * var(--ui-exit-x)) * 50%)
        );
    }
}

@keyframes ui-exit-defocus {
    50% {
        opacity: 1;
    }
    to {
        filter: blur(0.5rem);
        opacity: 0;
    }
}

/* Nothing to draw: the toast has stood aside already, and this only holds it on the page. */
@keyframes ui-held {
    to {
        opacity: 0;
    }
}

/* Nothing to draw either, the toast kept as it is while a script draws on it. */
@keyframes ui-kept {
    to {
        opacity: 1;
    }
}

@keyframes ui-dwell {
    to {
        background-size: 0% 2px;
    }
}

@keyframes ui-dwell-ring {
    from {
        --ui-swept: 360deg;
    }
    to {
        --ui-swept: 0deg;
    }
}

@keyframes ui-orbit {
    to {
        --ui-orbit: 360deg;
    }
}

${sized.wide}

${sweeps}

${moves}

${focal.frames(moves)}

@keyframes ui-rest {
    to {
        opacity: 0;
    }
}
`;

/** The way a moment's effect travels, a kind of its own beside the effect. */
const direction = (moment: 'enter' | 'exit'): readonly Effect[] => [
    {
        name: 'none',
        today: true,
        says:
            moment === 'enter'
                ? 'Each effect’s own: leftward, in from the page’s right edge, for the slides, a wipe and the wind; out from the middle for a circle; across for a curtain.'
                : 'Each effect’s own: rightward, out toward the page’s right edge, for the slides, a wipe and the wind; into the middle for a circle; across for a curtain.',
    },
    {
        name: 'up',
        host: true,
        says: moment === 'enter' ? 'Travels up, from below.' : 'Leaves upward.',
    },
    {
        name: 'down',
        host: true,
        says: moment === 'enter' ? 'Travels down, from above.' : 'Leaves downward.',
    },
    {
        name: 'left',
        host: true,
        says: moment === 'enter' ? 'Travels left, from the right.' : 'Leaves to the left.',
    },
    {
        name: 'right',
        host: true,
        says: moment === 'enter' ? 'Travels right, from the left.' : 'Leaves to the right.',
    },
];

/** The curve a moment's effect runs on, a kind of its own beside the effect. */
const curves = (moment: 'enter' | 'exit'): readonly Effect[] => [
    {
        name: 'none',
        today: true,
        says:
            moment === 'enter'
                ? 'Each effect’s own: quick at first and settling, or a reveal’s even sweep. A pop, a drop, a bounce and the elastic keep theirs whatever is chosen.'
                : 'Each effect’s own: slow to start and quick to go, or a cover’s even sweep. A bounce and the elastic keep theirs whatever is chosen.',
    },
    { name: 'linear', host: true, says: 'At one speed from start to end.' },
    { name: 'ease-in-out', host: true, says: 'Gathers speed, then settles.' },
];

/** Why the toast leaves the hover colour out: its icon is drawn in the variant's colour. */
const hovered =
    'the hover colour is chosen against a control’s label, and under the toast’s icon, which owes 3:1 as the one thing that tells a variant by more than its colour, it fell to 2.70:1 under Glass in the light scheme, in three variants of four — measured.';

/** Why the toast leaves the theme's own pointer shadow out: there is none for a raised surface. */
const unlit =
    'no theme gives a raised surface a shadow of its own under the pointer: the token layer has the toast’s elevation at rest, and none for the pointer.';

/** Why the toast leaves the preview out: what it shows is what a click would change. */
const unchanged = 'a click on the toast changes nothing of its own for it to show beforehand.';

/** Why the toast leaves the blur out: it is the glass already, wherever a theme makes it glass. */
const glassy =
    'the toast is the theme’s glass already: it blurs the page behind it at rest wherever a theme makes it glass, and nothing is left for the effect to add.';

/** Why the toast leaves the breathe out: what it swells is what is being read. */
const swelled =
    'it swells and settles the toast’s message round after round, and a toast’s message is what is being read.';

/** Why the toast leaves the flips out. */
const turned =
    'it turns the message away from the reader for half its run, and a toast’s message is what is being read: the entrance has it, before there is anything to read.';

prototype({
    tags: ['ui-toast', 'ui-toaster'],
    sheet,
    layers: ['fill', 'focus-fill', 'shadow', 'focus-shadow', 'border', 'focus-border'],
    layered: 'ui-toast',
    moments: [
        {
            ...hover('toast', {
                move: {
                    draws: [
                        { name: 'lift', host: true },
                        { name: 'zoom', host: true },
                        { name: 'magnetic', host: true },
                        { name: 'tilt', host: true },
                        { name: 'heartbeat', host: true },
                        { name: 'rubber', host: true },
                        { name: 'glitch', host: true },
                    ],
                    refuses: {
                        breathe: swelled,
                        'flip-vertical': turned,
                        'flip-horizontal': turned,
                    },
                },
                fill: {
                    draws: [
                        'tint',
                        'spotlight',
                        {
                            name: 'flood',
                            fire: floods((host) => inner(host, "[data-layer='fill']")),
                        },
                        'shimmer',
                        {
                            name: 'ripple',
                            fire: enters((host) => inner(host, "[data-layer='fill']")),
                        },
                        'scan',
                    ],
                    refuses: { highlight: hovered, preview: unchanged, blur: glassy },
                },
                shadow: {
                    draws: [
                        'raise',
                        'sink',
                        'halo',
                        'glow',
                        'inner',
                        'cast',
                        'neon',
                        'breathe',
                        'burst',
                    ],
                    refuses: { highlight: unlit },
                },
                border: {
                    draws: [
                        'highlight',
                        'accent',
                        'rainbow',
                        'edge',
                        'orbit',
                        'trace',
                        'comet',
                        'underline',
                        'sweep',
                        'pulse',
                        { name: 'shockwave', fire: wave('shockwave') },
                        { name: 'bloom', fire: wave('bloom') },
                        'explode',
                    ],
                },
            }),
            only: 'ui-toast',
        },
        {
            ...focus(
                'toast',
                {
                    move: {
                        draws: [
                            { name: 'lift', host: true },
                            { name: 'zoom', host: true },
                            { name: 'heartbeat', host: true },
                            { name: 'rubber', host: true },
                            { name: 'glitch', host: true },
                        ],
                        refuses: {
                            breathe: swelled,
                            'flip-vertical': turned,
                            'flip-horizontal': turned,
                        },
                    },
                    fill: {
                        draws: ['tint', 'spotlight', 'flood', 'shimmer', 'ripple', 'scan'],
                        refuses: { highlight: hovered, preview: unchanged, blur: glassy },
                    },
                    shadow: {
                        draws: [
                            'raise',
                            'sink',
                            'halo',
                            'glow',
                            'inner',
                            'neon',
                            'breathe',
                            'burst',
                        ],
                        refuses: { highlight: unlit },
                    },
                    border: {
                        draws: [
                            'highlight',
                            'accent',
                            'rainbow',
                            'edge',
                            'orbit',
                            'trace',
                            'comet',
                            'underline',
                            'sweep',
                            'pulse',
                            { name: 'shockwave', fire: focusWave('shockwave') },
                            { name: 'bloom', fire: focusWave('bloom') },
                            'explode',
                        ],
                    },
                },
                true,
            ),
            only: 'ui-toast',
        },
        {
            name: 'enter',
            label: 'Entrance',
            on: 'arrive',
            only: 'ui-toast',
            kinds: [
                {
                    name: '',
                    label: 'Effect',
                    effects: [
                        {
                            name: 'rise',
                            today: true,
                            host: true,
                            says: 'Fades in from a little below, on the state’s step.',
                        },
                        { name: 'none', host: true, says: 'There at once.' },
                        { name: 'fade', host: true, says: 'Fades in where it lands.' },
                        {
                            name: 'slide',
                            host: true,
                            directed: true,
                            says: 'Slides in from its own size away, from the page’s right edge unless a direction says otherwise.',
                        },
                        {
                            name: 'slide-bounce',
                            host: true,
                            directed: true,
                            says: 'Slides in and bounces back off where it lands, twice, less the second time, on a curve of its own.',
                        },
                        {
                            name: 'slide-elastic',
                            host: true,
                            directed: true,
                            says: 'Slides in past where it lands and springs back, as on elastic, swinging either side of it until it settles, on a curve of its own.',
                        },
                        {
                            name: 'pop',
                            host: true,
                            says: 'Fades in from smaller, past its size and back.',
                        },
                        { name: 'zoom', host: true, says: 'Fades in from a little smaller.' },
                        {
                            name: 'drop',
                            host: true,
                            says: 'Falls in and bounces once, on a curve of its own.',
                        },
                        {
                            name: 'flip-vertical',
                            host: true,
                            says: 'Turns in from edge-on, top over bottom, until it faces the reader.',
                        },
                        {
                            name: 'flip-horizontal',
                            host: true,
                            says: 'Turns in from edge-on, side over side, until it faces the reader.',
                        },
                        {
                            name: 'wipe',
                            host: true,
                            directed: true,
                            says: 'Uncovered by an edge sweeping across it, from the page’s right edge unless a direction says otherwise.',
                        },
                        {
                            name: 'circle',
                            host: true,
                            directed: true,
                            says: 'Uncovered by a circle growing from its middle, or from the edge a direction leaves.',
                        },
                        {
                            name: 'curtain',
                            host: true,
                            directed: true,
                            says: 'Uncovered from its middle outward, as a curtain opens: across it, or up and down for those directions.',
                        },
                        {
                            name: 'refocus',
                            host: true,
                            says: 'Comes into focus: blurred and faint, then sharp.',
                        },
                        {
                            name: 'wind',
                            host: true,
                            directed: true,
                            fire: assemble('wind'),
                            says: 'Put together from pieces of itself blown in on a wind, from the page’s right edge unless a direction says otherwise.',
                        },
                        {
                            name: 'converge',
                            host: true,
                            fire: assemble('middle'),
                            says: 'Put together from pieces flying in from all round, the outermost first.',
                        },
                        {
                            name: 'materialize',
                            host: true,
                            fire: assemble('random'),
                            says: 'Put together from pieces appearing where they belong, at random.',
                        },
                        {
                            name: 'dissolve',
                            host: true,
                            fire: grain(true),
                            says: 'Comes out of a fine grain, the whole toast at once, until no grain is missing.',
                        },
                    ],
                },
                { name: 'direction', label: 'Direction', effects: direction('enter') },
                { name: 'curve', label: 'Curve', effects: curves('enter') },
            ],
        },
        {
            name: 'exit',
            label: 'Exit',
            on: 'closing',
            only: 'ui-toast',
            kinds: [
                {
                    name: '',
                    label: 'Effect',
                    effects: [
                        {
                            name: 'sink',
                            today: true,
                            host: true,
                            says: 'Fades out going down, on the state’s step.',
                        },
                        { name: 'none', host: true, says: 'Gone at once.' },
                        { name: 'fade', host: true, says: 'Fades out where it is.' },
                        {
                            name: 'slide',
                            host: true,
                            directed: true,
                            says: 'Slides out its own size away, toward the page’s right edge unless a direction says otherwise.',
                        },
                        {
                            name: 'slide-bounce',
                            host: true,
                            directed: true,
                            says: 'Bounces toward the way it leaves and back, twice, higher the second time, then slides out: the entrance’s bounce run backward.',
                        },
                        {
                            name: 'slide-elastic',
                            host: true,
                            directed: true,
                            says: 'Swings either side of where it is, wider each time, draws back as on elastic and is flung out: the entrance’s spring run backward.',
                        },
                        { name: 'zoom', host: true, says: 'Fades out, getting smaller.' },
                        {
                            name: 'flip-vertical',
                            host: true,
                            says: 'Turns away, top over bottom, until it is edge-on.',
                        },
                        {
                            name: 'flip-horizontal',
                            host: true,
                            says: 'Turns away, side over side, until it is edge-on.',
                        },
                        {
                            name: 'wipe',
                            host: true,
                            directed: true,
                            says: 'Covered by an edge sweeping across it, toward the page’s right edge unless a direction says otherwise.',
                        },
                        {
                            name: 'circle',
                            host: true,
                            directed: true,
                            says: 'Covered as a circle closes on its middle, or on the edge a direction goes to.',
                        },
                        {
                            name: 'curtain',
                            host: true,
                            directed: true,
                            says: 'Covered from its edges inward, as a curtain closes: across it, or up and down for those directions.',
                        },
                        {
                            name: 'defocus',
                            host: true,
                            says: 'Goes out of focus: sharp, then blurred and faint.',
                        },
                        {
                            name: 'wind',
                            host: true,
                            directed: true,
                            fire: disintegrate('wind'),
                            says: 'Broken into pieces blown away on a wind, toward the page’s right edge unless a direction says otherwise; blown down, the top goes first.',
                        },
                        {
                            name: 'scatter',
                            host: true,
                            fire: disintegrate('middle'),
                            says: 'Broken into pieces flying out from its middle, the innermost first.',
                        },
                        {
                            name: 'erode',
                            host: true,
                            fire: disintegrate('random'),
                            says: 'Broken into pieces vanishing where they are, at random.',
                        },
                        {
                            name: 'dissolve',
                            host: true,
                            fire: grain(false),
                            says: 'Dissolves into a fine grain, the whole toast at once, and goes when none is left.',
                        },
                    ],
                },
                { name: 'direction', label: 'Direction', effects: direction('exit') },
                { name: 'curve', label: 'Curve', effects: curves('exit') },
            ],
        },
        {
            name: 'dwell',
            label: 'Time left',
            only: 'ui-toast',
            effects: [
                { name: 'none', today: true, says: 'Nothing shows how long it stays.' },
                {
                    name: 'bar',
                    says: 'A line along its foot runs down with its time, and is full again whenever its clock starts again. An error, which stays, has none.',
                },
                {
                    name: 'ring',
                    says: 'A ring round its dismiss button runs down with its time, and is full again whenever its clock starts again. An error, which stays, has none.',
                },
            ],
        },
        {
            name: 'stack',
            label: 'The stack',
            only: 'ui-toaster',
            effects: [
                {
                    name: 'none',
                    today: true,
                    says: 'When one arrives or leaves, the others jump into place.',
                },
                {
                    name: 'glide',
                    says: 'When one arrives or leaves, the others glide into place from where they were.',
                },
                {
                    name: 'stagger',
                    says: 'The others glide into place one after another, the nearest to the change first.',
                },
                {
                    name: 'spring',
                    says: 'The others move into place past it and back.',
                },
                {
                    name: 'drop',
                    says: 'When one leaves, the others fall into its place and bounce once as they land; pushed up by one arriving, they glide.',
                },
            ],
        },
    ],
    refused: [
        {
            name: 'heartbeat',
            why: 'a notice that keeps beating to be looked at is the assertive region’s job, and that is announced, not animated.',
        },
        {
            name: 'typed in',
            why: 'the message written a character at a time, as Matrix’s terminal does. Typed by a clip, it cannot follow the message onto a second line; typed by a script, it is written into the live region the toast is announced through, which reads out what is written into it.',
        },
        {
            name: 'piled',
            why: 'the toasts stacked behind the newest and fanned out under the pointer: what every notice but the newest says is hidden until the pointer opens the pile, and a notice is on the page to be read.',
        },
    ],
});

/** Where a toast stands in its toaster's stack, in the viewport, leaving out whatever moves it. */
const standing = (toaster: Element, toast: HTMLElement): number =>
    toaster.getBoundingClientRect().top + toast.offsetTop;

/**
 * Moves the toasts a change leaves standing from where each stood to where it stands now, by the
 * stack's effect: a script's, as the reference's glide is, since a sheet cannot animate a move the
 * layout made. Each move is added to whatever is moving the toast already, so one made while
 * another runs starts where the toast is. They are taken nearest to the change first, which is the
 * order a stagger keeps.
 */
const settle = (
    toaster: Element,
    moves: readonly (readonly [HTMLElement, number])[],
    at: number,
): void => {
    const effect = chosen(toaster, 'stack');
    const near = [...moves]
        .filter(([toast, moved]) => toast.isConnected && Math.abs(moved) >= 1)
        .sort(
            ([one], [other]) =>
                Math.abs(standing(toaster, one) - at) - Math.abs(standing(toaster, other) - at),
        );

    for (const [index, [toast, moved]] of near.entries()) {
        const from = `0 ${String(moved)}px`;

        if (effect === 'drop' && moved < 0) {
            // Above where it lands, so it falls into place: gathering speed, then off it once,
            // 0.5rem, as the drop's entrance bounces.
            toast.animate(
                [
                    { offset: 0, translate: from, easing: 'ease-in' },
                    { offset: 0.55, translate: '0 0', easing: 'ease-out' },
                    { offset: 0.78, translate: '0 -0.5rem', easing: 'ease-in' },
                    { offset: 1, translate: '0 0' },
                ],
                { duration: duration(toast, '--ui-duration-300'), composite: 'add' },
            );
        } else if (effect === 'spring') {
            toast.animate([{ translate: from }, { translate: '0 0' }], {
                duration: duration(toast, '--ui-duration-300'),
                easing: easing(toast, '--ui-easing-emphasis'),
                composite: 'add',
            });
        } else if (effect === 'glide' || effect === 'stagger' || effect === 'drop') {
            // A stagger holds each where it stood until its turn.
            toast.animate([{ translate: from }, { translate: '0 0' }], {
                duration: duration(toast, '--ui-duration-200'),
                easing: easing(toast, '--ui-easing-move'),
                delay: effect === 'stagger' ? index * duration(toast, '--ui-duration-50') : 0,
                fill: 'backwards',
                composite: 'add',
            });
        }
    }
};

/*
 * What the component would do itself, which the page does from outside it: write the time a toast
 * stays where its sheet reads it; announce the exit as it starts, off the class the exit is carried
 * by, as the dialog's page does; move the stack; and put a toast that has gone back whole, so no
 * grain is left behind it. A watcher's callback runs before the next frame, so the pieces are there
 * in the first frame the toast would have been.
 */
for (const toaster of document.querySelectorAll('ui-toaster')) {
    /** Where each toast stood as one began to leave. */
    const before = new Map<HTMLElement, number>();

    new MutationObserver((records) => {
        const arrived: UiToast[] = [];

        for (const record of records) {
            const toast = record.target;

            if (
                record.type === 'attributes' &&
                toast instanceof UiToast &&
                toast.classList.contains('closing') &&
                !(record.oldValue ?? '').split(' ').includes('closing')
            ) {
                for (const each of toaster.querySelectorAll('ui-toast')) {
                    before.set(each, standing(toaster, each));
                }

                // An entrance still running ends first.
                restore(toast);
                toast.dispatchEvent(new Event('closing', { bubbles: true, composed: true }));
            }

            if (record.type !== 'childList') {
                continue;
            }

            for (const node of record.addedNodes) {
                if (node instanceof UiToast) {
                    arrived.push(node);

                    if (node.variant !== 'danger' && node.duration > 0) {
                        node.style.setProperty('--ui-dwell', `${String(node.duration)}ms`);
                    }
                }
            }

            const gone = [...record.removedNodes].filter(
                (node): node is UiToast => node instanceof UiToast && !node.isConnected,
            );

            for (const node of gone) {
                restore(node);
            }

            const [leaving] = gone;

            if (leaving !== undefined) {
                settle(
                    toaster,
                    [...before]
                        .filter(([each]) => each.isConnected)
                        .map(([each, stood]) => [each, stood - standing(toaster, each)] as const),
                    before.get(leaving) ?? 0,
                );
                before.clear();
            }
        }

        const staying = [...toaster.querySelectorAll('ui-toast')].filter(
            (each) => !arrived.includes(each),
        );
        const [first] = arrived;

        if (first === undefined || staying.length === 0) {
            return;
        }

        // Where the others stood, measured with the newcomers taken out of the layout, and where
        // they stand, at the next frame, once the sheet a newcomer's entrance is drawn by is in its
        // shadow root: measured at once, the layout spent a fade's and a pop's starting style, and
        // the toast rose as it does today — measured.
        for (const each of arrived) {
            each.style.display = 'none';
        }

        const stood = staying.map((each) => [each, standing(toaster, each)] as const);

        for (const each of arrived) {
            each.style.removeProperty('display');
        }

        requestAnimationFrame(() => {
            settle(
                toaster,
                stood.map(([each, top]) => [each, top - standing(toaster, each)] as const),
                standing(toaster, first),
            );

            // A toast already leaving is measured again, so it moves the stack from here.
            for (const each of before.keys()) {
                before.set(each, standing(toaster, each));
            }
        });
    }).observe(toaster, {
        attributes: true,
        attributeFilter: ['class'],
        attributeOldValue: true,
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

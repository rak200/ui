/**
 * `ui-tooltip`: what appearing, leaving and passing from one tip to the next can do.
 *
 * The tip is the host's own element, reached through `::slotted()`, and placed by script with
 * two insets and `translate` — by the box it has as it shows, transform and all. So nothing here
 * changes its size: the effects fade it, move it, uncover it, blur it, make it jump and type it,
 * and none scales it or turns it.
 *
 * Every entrance and exit but the glitch and the typing is a transition, so a tip the reader
 * leaves before it has arrived turns back from where it is, and one pointed at again as it leaves
 * comes back from where it got to. The glitch jumps, which a transition cannot, so it is
 * keyframes.
 *
 * Two are a script's, where the component would carry them. The typing never writes the tip's
 * text, which the tooltip hands its trigger again whenever it changes: what is not typed yet is a
 * highlight drawn in no colour, and the caret one drawn in the accent. And the next tip: the page
 * notes where each tip was and when as it closes, and a tip that opens soon after another closed
 * ends both their effects before either is drawn again — and glides from where the other was, for
 * `glide`.
 */
import { reference } from '../../../../src/reference.js';
import { chosen, duration, easing, prototype, queries, still } from '../motion.js';

/** The query each effect is drawn under: the consumer's choice, else the theme's taste. */
const is = queries('tooltip');

/** The colours the glitch splits into, the button's own. */
const danger = reference('--ui-color-danger').cssText;
const info = reference('--ui-color-info').cssText;

/**
 * What the typing draws, in the tree the tip's text is in — the host's, where the table's rules go
 * too: a highlight rule in the tooltip's shadow root reached a slotted tip's text in Chromium and
 * WebKit, and not in Firefox, measured. The text not typed yet in no colour, and the caret a block
 * of the accent behind the character it is about to type.
 */
const typist = new CSSStyleSheet();
typist.replaceSync(`
::highlight(ui-untyped) {
    color: transparent;
}

::highlight(ui-caret) {
    color: transparent;
    background-color: ${reference('--ui-color-accent').cssText};
}
`);
document.adoptedStyleSheets = [...document.adoptedStyleSheets, typist];

/**
 * The spring's own curve: past where it goes by nearly a quarter of the way at a quarter of the
 * time, short of it by a twentieth at half, and settled by two thirds. A damped spring's, sampled.
 */
const spring =
    'linear(0, 0.195 5%, 0.59 10%, 0.955 15%, 1.174 20%, 1.233 25%, 1.184 30%, 1.091 35%, 1.007 40%, 0.958 45%, 0.946 50%, 0.958 55%, 0.98 60%, 0.999 65%, 1.01 70%, 1.013 75%, 1.007 82.5%, 1)';

const sheet = String.raw`
/* Which side of the tip its trigger is on, as a sign on the block axis, and which way the tip
   reads, on the inline one: what moves or uncovers a tip toward its trigger or along its line
   reads these. */
slot[name='tip']::slotted(*) {
    --ui-toward: 1;
    --ui-reading: 1;
}

slot[name='tip']::slotted([data-side='block-end']) {
    --ui-toward: -1;
}

slot[name='tip']::slotted(:dir(rtl)) {
    --ui-reading: -1;
}

/* An exit that covers the tip covers it from an open clip, 3rem clear of the shadow the tip
   casts, past what each theme's shadow reaches. Here, ahead of the entrances: a reveal's start
   comes after it, so it is the start a tip that is uncovered as it opens takes — written after
   it, the open clip was the start too, and nothing was uncovered, in all three engines. */
@container ${is('exit', 'fold')} or ${is('exit', 'curtain')} or ${is('exit', 'wipe')} {
    slot[name='tip']::slotted(:popover-open) {
        clip-path: inset(-3rem);
    }
}

/* ——— Appearing. The side is written by the script that places the tip, after the tip's first
   style, so an entrance cannot wait for it: a tip comes from the side it was last placed on —
   above the trigger, where the tooltip places a tip first, until it has been placed below. ——— */
@container ${is('enter', 'fade')} {
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
@container ${is('enter', 'rise')} {
    slot[name='tip']::slotted(:popover-open) {
        transition:
            opacity var(--ui-duration-200) var(--ui-easing-enter),
            transform var(--ui-duration-200) var(--ui-easing-enter);
    }

    @starting-style {
        slot[name='tip']::slotted(:popover-open) {
            opacity: 0;
            transform: translateY(calc(var(--ui-toward) * 0.25rem));
        }
    }
}

/* spring: from twice as near, past where it sits and back, on a curve of its own. */
@container ${is('enter', 'spring')} {
    slot[name='tip']::slotted(:popover-open) {
        transition:
            opacity var(--ui-duration-150) var(--ui-easing-enter),
            transform var(--ui-duration-300) ${spring};
    }

    @starting-style {
        slot[name='tip']::slotted(:popover-open) {
            opacity: 0;
            transform: translateY(calc(var(--ui-toward) * 0.5rem));
        }
    }
}

/* A reveal changes which parts of the tip there are and leaves the rest where it was. The tip
   casts its own shadow, so open, the clip stands 3rem clear of it, past what each theme's
   shadow reaches. Every reveal and every cover is an inset, so any of them takes over from any
   other. */
@container ${is('enter', 'unfold')} {
    slot[name='tip']::slotted(:popover-open) {
        clip-path: inset(-3rem);
        transition: clip-path var(--ui-duration-200) var(--ui-easing-enter);
    }

    @starting-style {
        slot[name='tip']::slotted(:popover-open) {
            clip-path: inset(
                calc(max(0, var(--ui-toward)) * 100%) -3rem
                    calc(max(0, -1 * var(--ui-toward)) * 100%) -3rem
            );
        }
    }
}

/* curtain: from a line through its middle, outward across it. */
@container ${is('enter', 'curtain')} {
    slot[name='tip']::slotted(:popover-open) {
        clip-path: inset(-3rem);
        transition: clip-path var(--ui-duration-200) var(--ui-easing-move);
    }

    @starting-style {
        slot[name='tip']::slotted(:popover-open) {
            clip-path: inset(-3rem 50%);
        }
    }
}

/* wipe: along its line, from where it starts to be read. */
@container ${is('enter', 'wipe')} {
    slot[name='tip']::slotted(:popover-open) {
        clip-path: inset(-3rem);
        transition: clip-path var(--ui-duration-200) var(--ui-easing-move);
    }

    @starting-style {
        slot[name='tip']::slotted(:popover-open) {
            clip-path: inset(
                -3rem calc(max(0, var(--ui-reading)) * 100%) -3rem
                    calc(max(0, -1 * var(--ui-reading)) * 100%)
            );
        }
    }
}

/* refocus: out of focus by half a rem and sharpening, and there by half the way. */
@container ${is('enter', 'refocus')} {
    slot[name='tip']::slotted(:popover-open) {
        transition:
            filter calc(var(--ui-duration-200) * 1.25) var(--ui-easing-enter),
            opacity calc(var(--ui-duration-200) * 0.625) var(--ui-easing-enter);
    }

    @starting-style {
        slot[name='tip']::slotted(:popover-open) {
            filter: blur(0.5rem);
            opacity: 0;
        }
    }
}

/* glitch: in jumps, its text split into two colours, as the button's label does: the danger and
   the info, which Matrix's dark scheme makes a terminal's red and cyan. */
@container ${is('enter', 'glitch')} {
    slot[name='tip']::slotted(:popover-open) {
        animation: ui-tip-glitch-in var(--ui-duration-200) steps(1, end);
    }
}

/* ——— Leaving. The tip is held on the page while it goes, display and overlay transitioned as
   discrete values, and only when an exit is chosen, so a tip with none is still gone at once.
   Every exit leaves from where the tip was placed, so each knows its side. ——— */
@container ${is('exit', 'fade')} {
    slot[name='tip']::slotted(:not(:popover-open)) {
        opacity: 0;
        transition:
            opacity var(--ui-duration-200) var(--ui-easing-exit),
            display var(--ui-duration-200) allow-discrete,
            overlay var(--ui-duration-200) allow-discrete;
    }
}

/* sink: back toward the trigger as it fades — the rise, run the other way. */
@container ${is('exit', 'sink')} {
    slot[name='tip']::slotted(:not(:popover-open)) {
        opacity: 0;
        transform: translateY(calc(var(--ui-toward) * 0.25rem));
        transition:
            opacity var(--ui-duration-200) var(--ui-easing-exit),
            transform var(--ui-duration-200) var(--ui-easing-exit),
            display var(--ui-duration-200) allow-discrete,
            overlay var(--ui-duration-200) allow-discrete;
    }
}

/* fold: covered back toward the trigger. */
@container ${is('exit', 'fold')} {
    slot[name='tip']::slotted(:not(:popover-open)) {
        clip-path: inset(
            calc(max(0, var(--ui-toward)) * 100%) -3rem
                calc(max(0, -1 * var(--ui-toward)) * 100%) -3rem
        );
        transition:
            clip-path var(--ui-duration-200) var(--ui-easing-exit),
            display var(--ui-duration-200) allow-discrete,
            overlay var(--ui-duration-200) allow-discrete;
    }
}

/* curtain: closed from its edges to a line through its middle. */
@container ${is('exit', 'curtain')} {
    slot[name='tip']::slotted(:not(:popover-open)) {
        clip-path: inset(-3rem 50%);
        transition:
            clip-path var(--ui-duration-200) var(--ui-easing-move),
            display var(--ui-duration-200) allow-discrete,
            overlay var(--ui-duration-200) allow-discrete;
    }
}

/* wipe: covered along its line, from where it starts to be read. */
@container ${is('exit', 'wipe')} {
    slot[name='tip']::slotted(:not(:popover-open)) {
        clip-path: inset(
            -3rem calc(max(0, -1 * var(--ui-reading)) * 100%) -3rem
                calc(max(0, var(--ui-reading)) * 100%)
        );
        transition:
            clip-path var(--ui-duration-200) var(--ui-easing-move),
            display var(--ui-duration-200) allow-discrete,
            overlay var(--ui-duration-200) allow-discrete;
    }
}

/* defocus: blurring away by as much as the refocus sharpens from, and gone over the second
   half. */
@container ${is('exit', 'defocus')} {
    slot[name='tip']::slotted(:not(:popover-open)) {
        filter: blur(0.5rem);
        opacity: 0;
        transition:
            filter calc(var(--ui-duration-200) * 1.25) var(--ui-easing-exit),
            opacity calc(var(--ui-duration-200) * 0.625) var(--ui-easing-exit)
                calc(var(--ui-duration-200) * 0.625),
            display calc(var(--ui-duration-200) * 1.25) allow-discrete,
            overlay calc(var(--ui-duration-200) * 1.25) allow-discrete;
    }
}

@container ${is('exit', 'glitch')} {
    slot[name='tip']::slotted(:not(:popover-open)) {
        animation: ui-tip-glitch-out var(--ui-duration-200) steps(1, end) forwards;
        transition:
            display var(--ui-duration-200) allow-discrete,
            overlay var(--ui-duration-200) allow-discrete;
    }
}

/* Each step of the glitch holds until the next: the tip shows in bands, side to side, and only
   moves along its line, so it is placed by the box it rests in. */
@keyframes ui-tip-glitch-in {
    0% {
        opacity: 0;
    }
    15% {
        opacity: 1;
        transform: translateX(-3px);
        clip-path: inset(0 -3rem 55% -3rem);
        text-shadow:
            2px 0 ${danger},
            -2px 0 ${info};
    }
    35% {
        opacity: 0.5;
        transform: translateX(3px);
        clip-path: inset(40% -3rem 0 -3rem);
        text-shadow:
            -2px 0 ${danger},
            2px 0 ${info};
    }
    55% {
        opacity: 1;
        transform: translateX(-1px);
        clip-path: inset(20% -3rem 25% -3rem);
        text-shadow:
            1px 0 ${danger},
            -1px 0 ${info};
    }
    75%,
    100% {
        opacity: 1;
        transform: none;
        clip-path: inset(-3rem);
        text-shadow: none;
    }
}

/* The entrance's bands the other way, flickering out. */
@keyframes ui-tip-glitch-out {
    0% {
        opacity: 1;
    }
    20% {
        transform: translateX(2px);
        clip-path: inset(20% -3rem 25% -3rem);
        text-shadow:
            1px 0 ${danger},
            -1px 0 ${info};
    }
    40% {
        opacity: 0.5;
        transform: translateX(-3px);
        clip-path: inset(40% -3rem 0 -3rem);
        text-shadow:
            -2px 0 ${danger},
            2px 0 ${info};
    }
    60% {
        opacity: 1;
        transform: translateX(3px);
        clip-path: inset(0 -3rem 55% -3rem);
        text-shadow:
            2px 0 ${danger},
            -2px 0 ${info};
    }
    80%,
    100% {
        opacity: 0;
        transform: translateX(3px);
        clip-path: inset(0 -3rem 55% -3rem);
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
                {
                    name: 'spring',
                    says: 'Fades in, moving away from the trigger, past where it sits and back, on a curve of its own.',
                },
                { name: 'unfold', says: 'Uncovered from the trigger’s side outward.' },
                { name: 'curtain', says: 'Uncovered from its middle outward, as a curtain opens.' },
                {
                    name: 'wipe',
                    says: 'Uncovered along its line, from where it starts to be read.',
                },
                { name: 'refocus', says: 'Comes into focus: blurred and faint, then sharp.' },
                {
                    name: 'glitch',
                    says: 'Arrives in jumps and bands, its text split into two colours, and steadies.',
                },
                {
                    name: 'typing',
                    says: 'Its surface at once, and its text typed into it a character at a time, behind a caret, onto every line it wraps to.',
                },
            ],
        },
        {
            name: 'exit',
            label: 'Leave',
            effects: [
                { name: 'none', today: true, says: 'Gone at once.' },
                { name: 'fade', says: 'Fades out — and can still be pointed at while it does.' },
                { name: 'sink', says: 'Fades out, moving back toward the trigger.' },
                { name: 'fold', says: 'Covered back toward the trigger.' },
                {
                    name: 'curtain',
                    says: 'Covered from its edges to its middle, as a curtain closes.',
                },
                { name: 'wipe', says: 'Covered along its line, from where it starts to be read.' },
                { name: 'defocus', says: 'Goes out of focus: sharp, then blurred and faint.' },
                { name: 'glitch', says: 'Jumps and splits into bands, and flickers out.' },
            ],
        },
        {
            name: 'next',
            label: 'The next tip',
            effects: [
                {
                    name: 'none',
                    today: true,
                    says: 'A tip that opens as another closes appears as any tip does, and the other leaves as it would.',
                },
                {
                    name: 'instant',
                    says: 'A tip that opens as another closes is there at once, and the other gone at once: along a row of triggers, only the first tip’s entrance plays.',
                },
                {
                    name: 'glide',
                    says: 'A tip that opens as another closes glides from where the other was to its own place, and the other is gone at once: along a row of triggers, one tip seems to follow the pointer.',
                },
            ],
        },
    ],
    refused: [
        {
            name: 'zoom, pop and the flips',
            why: 'the tooltip places a tip by the box it has as it shows, transform and all, and again whenever the page scrolls under it. A tip that started at 0.9 of its size was placed 11px off its trigger’s middle and 3px into the gap, and one that started edge-on, 26px over its trigger, in all three engines — measured.',
        },
        {
            name: 'delay',
            why: 'waiting before showing is a timing decision, not motion, and WCAG 1.4.13 already has a say in it.',
        },
        {
            name: 'the pieces and the grain',
            why: 'a theme’s entrance reaches every component that offers it, so offered here, Matrix’s pieces and Glass’s grain would put a tip together, a script and its copies or its filter each time, on every pass of the pointer over a trigger, for a phrase on screen a moment.',
        },
        {
            name: 'following the pointer',
            why: 'a tip that moves with the pointer is one the pointer can never reach, which WCAG 2.2’s 1.4.13 asks of content shown on hover.',
        },
    ],
});

/** The tip that closed last: where it was drawn as it closed, and when. */
let last: { readonly tip: HTMLElement; readonly box: DOMRect; readonly at: number } | undefined;

/**
 * How soon after one tip closes another opening is the next: about the time a pointer takes to
 * cross to a trigger beside it, and the delay a tooltip library skips its own after.
 */
const soon = 300;

/** How far each tip being typed has got: one pointed at again as it leaves goes on from there. */
const typed = new WeakMap<HTMLElement, number>();

/** The frame each tip being typed waits on, so leaving can stop it where it is. */
const typing = new WeakMap<HTMLElement, number>();

/** What each tip being typed has yet to type, and the character its caret stands on. */
const marked = new WeakMap<HTMLElement, { readonly untyped: Range; readonly caret: Range }>();

/** Every tip's text not typed yet, and every caret, as the highlights the typist's rules draw. */
const untyped = new Highlight();
const carets = new Highlight();
CSS.highlights.set('ui-untyped', untyped);
CSS.highlights.set('ui-caret', carets);

/** Takes the typing off a tip, which then draws its text as it always does. */
const untype = (tip: HTMLElement): void => {
    const frame = typing.get(tip);

    if (frame !== undefined) {
        cancelAnimationFrame(frame);
    }

    const ranges = marked.get(tip);

    if (ranges !== undefined) {
        untyped.delete(ranges.untyped);
        carets.delete(ranges.caret);
    }

    typing.delete(tip);
    typed.delete(tip);
    marked.delete(tip);
};

/** Hides all of a tip's text, before it is placed: the typing starts from nothing. */
const blank = (tip: HTMLElement): void => {
    const ranges = marked.get(tip) ?? { untyped: new Range(), caret: new Range() };
    ranges.untyped.selectNodeContents(tip);
    ranges.caret.collapse(true);
    untyped.add(ranges.untyped);
    carets.add(ranges.caret);
    marked.set(tip, ranges);
};

/**
 * Each character a tip draws, in reading order, as the text node it is in and where: a space the
 * line broke at, or one the layout collapsed, is drawn nowhere and takes no time to type.
 */
const characters = (tip: HTMLElement): (readonly [Text, number])[] => {
    const found: (readonly [Text, number])[] = [];
    const range = new Range();
    const walker = document.createTreeWalker(tip, NodeFilter.SHOW_TEXT);

    for (let node = walker.nextNode(); node instanceof Text; node = walker.nextNode()) {
        for (let index = 0; index < node.length; index += 1) {
            range.setStart(node, index);
            range.setEnd(node, index + 1);

            if ([...range.getClientRects()].some((box) => box.width > 0)) {
                found.push([node, index]);
            }
        }
    }

    return found;
};

/**
 * Types a tip from `from` characters on, a character every third of the shortest step — 25ms —
 * which the collapse takes to nothing with the rest. The ranges are the text's own, so the typing
 * follows it onto every line it wraps to, and goes wherever the tip does.
 */
const type = (tip: HTMLElement, from: number): void => {
    const all = characters(tip);
    const last = all.at(-1);
    const ranges = marked.get(tip);
    const pace = duration(tip, '--ui-duration-50') / 3;
    const begun = performance.now() - from * pace;
    let drawn = -1;

    const step = (now: number): void => {
        const count = Math.max(0, Math.floor((now - begun) / pace));
        const next = all[count];

        if (next === undefined || last === undefined || ranges === undefined) {
            untype(tip);

            return;
        }

        if (count !== drawn) {
            drawn = count;
            typed.set(tip, count);
            ranges.caret.setStart(...next);
            ranges.caret.setEnd(next[0], next[1] + 1);
            ranges.untyped.setStart(next[0], next[1] + 1);
            ranges.untyped.setEnd(last[0], last[1] + 1);

            // Each taken out of its highlight and put back: over a tip in the top layer, WebKit
            // drew a range moved where it was once, and then not again — measured.
            for (const [highlight, range] of [
                [untyped, ranges.untyped],
                [carets, ranges.caret],
            ] as const) {
                highlight.delete(range);
                highlight.add(range);
            }
        }

        typing.set(tip, requestAnimationFrame(step));
    };

    step(performance.now());
};

/*
 * The typing and the next tip, which the component would carry. A tip is told apart from the one
 * before it as it opens, before its first style. Where the choice for the next tip is `instant` or
 * `glide`, both their effects are ended once it is placed — the other's exit and its entrance,
 * before either is drawn — and `glide` then moves it from where the other was, by the edge nearest
 * the trigger and the middle, added to what places it. Where the entrance is `typing`, the tip
 * opens with nothing typed and the typing starts once it is placed; a tip that leaves stops where
 * it got to, which its exit takes away, and one pointed at again before it has gone goes on.
 */
document.addEventListener(
    'beforetoggle',
    (event) => {
        const tip = event.target;

        if (
            !(event instanceof ToggleEvent) ||
            !(tip instanceof HTMLElement) ||
            tip.slot !== 'tip' ||
            tip.parentElement?.localName !== 'ui-tooltip'
        ) {
            return;
        }

        if (event.newState === 'closed') {
            last = { tip, box: tip.getBoundingClientRect(), at: performance.now() };
            const frame = typing.get(tip);

            if (frame !== undefined) {
                cancelAnimationFrame(frame);
                typing.delete(tip);
            }

            return;
        }

        const from = last;
        last = undefined;
        const next = chosen(tip, 'next', 'tooltip');
        const handed =
            from !== undefined &&
            from.tip !== tip &&
            performance.now() - from.at <= soon &&
            (next === 'instant' || next === 'glide');
        const types = !handed && !still() && chosen(tip, 'enter', 'tooltip') === 'typing';
        // Still on the page, as it leaves: the typing goes on from where it got to.
        const going = getComputedStyle(tip).display === 'none' ? undefined : typed.get(tip);

        if (!types) {
            untype(tip);
        } else if (going === undefined) {
            blank(tip);
        }

        // Once the tooltip has shown and placed it: the event is dispatched from inside the call
        // that shows it, and the microtask waits for the code that called it.
        queueMicrotask(() => {
            if (types) {
                type(tip, going ?? 0);
            }

            if (from === undefined || !handed) {
                return;
            }

            for (const animation of [...from.tip.getAnimations(), ...tip.getAnimations()]) {
                animation.finish();
            }

            if (next === 'glide') {
                const box = tip.getBoundingClientRect();
                const x = from.box.left + from.box.width / 2 - (box.left + box.width / 2);
                const y =
                    tip.dataset['side'] === 'block-end'
                        ? from.box.top - box.top
                        : from.box.bottom - box.bottom;

                tip.animate(
                    [{ translate: `${String(x)}px ${String(y)}px` }, { translate: '0 0' }],
                    {
                        duration: duration(tip, '--ui-duration-200'),
                        easing: easing(tip, '--ui-easing-move'),
                        composite: 'add',
                    },
                );
            }
        });
    },
    { capture: true },
);

/**
 * The tip's typing — RFC 0004's, Matrix's entrance for a tooltip: the tip's text typed out a
 * character at a time, behind a caret of the accent.
 *
 * **It never writes the tip's text**, which the tooltip hands its trigger again whenever it
 * changes and which a reader of the page meets whole: what is not typed yet is a highlight drawn
 * in no colour, and the caret one drawn in the accent, through the CSS Custom Highlight API. The
 * ranges are the text's own, so the typing follows the text onto every line it wraps to and goes
 * wherever the tip does; a space the line broke at, or one the layout collapsed, is drawn nowhere
 * and takes no time to type.
 *
 * **The rules are written in the tree the text is in**: a highlight rule in the tooltip's shadow
 * root reached a slotted tip's text in Chromium and WebKit and not in Firefox — measured for RFC
 * 0004 — so the sheet is adopted into the tip's own root, as the table's rules are.
 *
 * **The sheet decides, and this only types.** The tooltip hands its tip `--ui-fx-enter: typing`
 * and the overlay's time only where the engine draws highlights, so an engine without them never
 * reaches the drawing here and shows every tip whole. A character takes a tenth of that time, 24ms
 * at its default, and under the collapse nothing is typed. The clock is an animation of the tip's
 * own, so a test holds it where it likes; a tip that leaves as it is typed stops where it got to,
 * which its exit takes away, and one pointed at again before it has gone goes on from there.
 *
 * **Nothing called as a tip shows or goes can throw for a tip nobody types**, however a test's
 * mutant turns a guard: a throw from a listener reaches no test and is graded as an error. So no
 * state is read that could be missing on that path, and the page's highlights are written only
 * once a tip has been typed.
 *
 * Internal — it is not re-exported from `src/index.ts`.
 */

import { kinds, milliseconds } from './motion.js';
import { reference } from './reference.js';

/** The time under which the collapse took the typing: reduced motion's 0.01ms, or none. */
const collapsed = 0.01;

/** The name the typing's clock goes by among a tip's animations. */
const clock = 'ui-typing';

/**
 * What the typing draws, in the tree the text is in: the text not typed yet in no colour, and the
 * caret a block of the accent behind the character it is about to type.
 */
const rules = new CSSStyleSheet();

// Stryker disable all: written once, at import, into the one sheet every tree a tip is typed in
// adopts — so in the warm process Stryker switches mutants in, the original rules stand before any
// mutant is active, and none of them changes what a test can see. Outside the runner's reach, not
// an equivalent mutant.
rules.replaceSync(`
::highlight(ui-untyped) {
    color: transparent;
}

::highlight(ui-caret) {
    color: transparent;
    background-color: ${String(reference('--ui-color-accent'))};
}
`);
// Stryker restore all

/** Each tip being typed, or stopped part way as it left: what is not typed yet, and its caret. */
const marks = new Map<HTMLElement, readonly [untyped: Range, caret: Range]>();

/** Where each tip stopped as it left part way, on its clock: what a tip pointed at again goes on from. */
const stopped = new WeakMap<HTMLElement, number>();

/**
 * Writes every tip's ranges into the page's two highlights, anew: over a tip in the top layer,
 * WebKit drew a range moved where it was once and not again — measured for RFC 0004.
 */
function draw(): void {
    const all = [...marks.values()];

    CSS.highlights.set('ui-untyped', new Highlight(...all.map(([untyped]) => untyped)));
    CSS.highlights.set('ui-caret', new Highlight(...all.map(([, caret]) => caret)));
}

/**
 * The time a character of `tip` takes, in milliseconds, as its sheet handed it: a tenth of the
 * overlay's, or none where it handed no typing, or the collapse took it.
 */
function pace(tip: HTMLElement): number {
    const style = getComputedStyle(tip);
    const time = milliseconds(style.getPropertyValue(`${kinds.animated}enter-time`));

    return style.getPropertyValue(`${kinds.animated}enter`) === 'typing' && time > collapsed
        ? time / 10
        : 0;
}

/** The clocks `tip` is typed on: one while it is typed, and none once it has been. */
function clocks(tip: HTMLElement): Animation[] {
    return tip.getAnimations().filter((each) => each.id === clock);
}

/** The text nodes under `node`, in reading order. */
function texts(node: Node): Text[] {
    return node instanceof Text ? [node] : [...node.childNodes].flatMap(texts);
}

/**
 * Each character `tip` draws, in reading order, as the text node it is in and where: a space the
 * line broke at, or one the layout collapsed, is drawn nowhere and left out.
 */
function characters(tip: HTMLElement): (readonly [Text, number])[] {
    const range = new Range();

    return texts(tip).flatMap((node) =>
        [...Array(node.length).keys()]
            .filter((at) => {
                range.setStart(node, at);
                range.setEnd(node, at + 1);

                return [...range.getClientRects()].some((box) => box.width > 0);
            })
            .map((at) => [node, at] as const),
    );
}

/**
 * Readies `tip` to be typed as it shows, where its sheet chose the typing: every character hidden,
 * or, where it is still on the page leaving, as far as it had got. Where the typing is not chosen,
 * it takes off whatever typing was left on the tip from before, and touches nothing else.
 */
export function ready(tip: HTMLElement): void {
    if (pace(tip) === 0) {
        // Written only where it had something to take off, so a page that types nothing never
        // reaches the highlights, which an engine without them does not have.
        if (marks.delete(tip)) {
            draw();
        }

        return;
    }

    const root = tip.getRootNode() as Document | ShadowRoot;

    if (!root.adoptedStyleSheets.includes(rules)) {
        root.adoptedStyleSheets = [...root.adoptedStyleSheets, rules];
    }

    // Still on the page, leaving part way through: the typing goes on from where it stopped.
    if (marks.has(tip) && getComputedStyle(tip).display !== 'none') {
        return;
    }

    const untyped = new Range();
    const caret = new Range();

    // The caret drawn nowhere yet: a range is made collapsed.
    untyped.selectNodeContents(tip);
    stopped.delete(tip);
    marks.set(tip, [untyped, caret]);
    draw();
}

/**
 * Types `tip` out, once it is shown and placed, on a clock of its own: from where it stopped where
 * it was pointed at again as it left, and from its first character otherwise. Once every character
 * is typed, the typing comes off and the tip draws its text as it always does.
 */
export function write(tip: HTMLElement): void {
    const time = pace(tip);

    if (time === 0) {
        return;
    }

    const all = characters(tip);
    const untyped = new Range();
    const caret = new Range();
    const typing = tip.animate(null, { id: clock, duration: all.length * time });

    typing.currentTime = stopped.get(tip) ?? 0;
    marks.set(tip, [untyped, caret]);

    /** Copies the clock into the ranges, and asks for the next frame while it runs or is held. */
    const frame = (): void => {
        // Stopped as the tip left: it stays as the last frame drew it, for the exit to take away.
        if (typing.playState === 'idle') {
            return;
        }

        const next = all[Math.floor(Number(typing.currentTime) / time)];

        if (next === undefined) {
            marks.delete(tip);
            draw();

            return;
        }

        // Where there is a next character there is a last, which the fallback says to the types.
        const last = all.at(-1) ?? next;

        caret.setStart(...next);
        caret.setEnd(next[0], next[1] + 1);
        untyped.setStart(next[0], next[1] + 1);
        untyped.setEnd(last[0], last[1] + 1);
        draw();
        requestAnimationFrame(frame);
    };

    frame();
}

/** Stops `tip`'s typing where it got to, as the tip leaves: its exit takes away what is drawn. */
export function halt(tip: HTMLElement): void {
    for (const each of clocks(tip)) {
        stopped.set(tip, Number(each.currentTime));
        each.cancel();
    }
}

import { afterEach, describe, expect, it } from 'vitest';
import { halt, ready, write } from '../src/typing.js';

/** What a sheet hands a tip it chose the typing for: the overlay's default time. */
const typed = '--ui-fx-enter: typing; --ui-fx-enter-time: 240ms';

/** Every tip a test mounted, whose typing is taken off after it. */
const mounted: HTMLElement[] = [];

/** A tip of the suite's own, holding `text`, with `style` written on it. */
function made(text: string, style = typed): HTMLElement {
    const tip = document.createElement('span');
    tip.style.cssText = `display: inline-block; font: 16px monospace; ${style}`;
    tip.textContent = text;
    document.body.append(tip);
    mounted.push(tip);

    return tip;
}

/** The typing's clock on `tip`, where it has one. */
function clock(tip: HTMLElement): Animation | undefined {
    return tip.getAnimations().find((each) => each.id === 'ui-typing');
}

/** What a highlight draws now, as the text each of its ranges holds. */
function drawn(name: string): string[] {
    return [...(CSS.highlights.get(name) ?? [])].map((range) => (range as Range).toString());
}

/** Holds `tip`'s clock at `time`, and waits a frame for the ranges to be drawn there. */
async function hold(tip: HTMLElement, time: number): Promise<void> {
    const typing = clock(tip);

    typing?.pause();

    if (typing !== undefined) {
        typing.currentTime = time;
    }

    await new Promise(requestAnimationFrame);
}

afterEach(() => {
    // Taken off, as a tip whose typing is no longer chosen has it taken off, so no test reads
    // another's ranges in the page's highlights.
    for (const tip of mounted.splice(0)) {
        tip.style.removeProperty('--ui-fx-enter');
        ready(tip);
        tip.remove();
    }
});

describe('the typing', () => {
    it('hides every character of a tip before it shows, with no caret drawn yet', () => {
        const tip = made('Hello world');

        ready(tip);

        expect([drawn('ui-untyped'), drawn('ui-caret')]).toEqual([['Hello world'], ['']]);
    });

    it.each([
        [240, 24],
        [500, 50],
    ] as const)(
        'types it on a clock of its own, a character every tenth of the %sms handed over',
        (time, pace) => {
            const tip = made(
                'Hello world',
                `--ui-fx-enter: typing; --ui-fx-enter-time: ${String(time)}ms`,
            );

            ready(tip);
            write(tip);

            expect(clock(tip)?.effect?.getTiming().duration).toBe(11 * pace);
        },
    );

    it('stands the caret on the character it is about to type, the rest not typed yet', async () => {
        const tip = made('Hello world');

        ready(tip);
        write(tip);
        await hold(tip, 24 * 2.5);

        expect([drawn('ui-caret'), drawn('ui-untyped')]).toEqual([['l'], ['lo world']]);
    });

    it('types no space the layout collapsed, which is drawn nowhere', async () => {
        const tip = made('a  b');

        ready(tip);
        write(tip);

        expect(clock(tip)?.effect?.getTiming().duration, 'three characters').toBe(3 * 24);

        await hold(tip, 24 * 2.5);

        expect([drawn('ui-caret'), drawn('ui-untyped')]).toEqual([['b'], ['']]);
    });

    it('takes the typing off once every character is typed, and the tip draws its text whole', async () => {
        const tip = made('Hello world');

        ready(tip);
        write(tip);
        clock(tip)?.finish();
        await new Promise(requestAnimationFrame);

        expect([drawn('ui-untyped'), drawn('ui-caret')]).toEqual([[], []]);
    });

    it('stops where it got to as the tip leaves, and goes on from there pointed at again on the page', async () => {
        const tip = made('Hello world');

        ready(tip);
        write(tip);
        await hold(tip, 24 * 2.5);
        halt(tip);
        await new Promise(requestAnimationFrame);

        expect(clock(tip), 'stopped').toBeUndefined();
        expect(drawn('ui-caret'), 'where it got to').toEqual(['l']);

        ready(tip);
        write(tip);

        expect(clock(tip)?.currentTime, 'going on').toBe(24 * 2.5);
        expect(drawn('ui-caret')).toEqual(['l']);
    });

    it('starts over from nothing once the tip has gone', async () => {
        const tip = made('Hello world');

        ready(tip);
        write(tip);
        await hold(tip, 24 * 2.5);
        halt(tip);
        tip.style.display = 'none';

        ready(tip);

        expect(drawn('ui-untyped'), 'all of it hidden again').toEqual(['Hello world']);

        tip.style.display = 'inline-block';
        write(tip);

        expect(clock(tip)?.currentTime).toBe(0);
    });

    it.each([
        ['nobody chose the typing for', ''],
        ['the collapse took the typing from', '--ui-fx-enter: typing; --ui-fx-enter-time: 0.01ms'],
    ])('touches no highlight and runs no clock for a tip %s', (_name, style) => {
        const sentinel = new Highlight();
        CSS.highlights.set('ui-untyped', sentinel);
        const tip = made('Hello world', style);

        ready(tip);
        write(tip);
        halt(tip);

        expect([CSS.highlights.get('ui-untyped') === sentinel, clock(tip)]).toEqual([
            true,
            undefined,
        ]);
    });

    it('takes the typing off a tip typed before, once it is no longer chosen', async () => {
        const tip = made('Hello world');

        ready(tip);
        write(tip);
        await hold(tip, 24 * 2.5);
        halt(tip);
        tip.style.removeProperty('--ui-fx-enter');

        ready(tip);

        expect([drawn('ui-untyped'), drawn('ui-caret')]).toEqual([[], []]);
    });

    it('writes its rules once into the tree the tip is in, the text not typed in no colour and the caret in the accent', () => {
        const host = document.createElement('div');
        const root = host.attachShadow({ mode: 'open' });
        const tip = document.createElement('span');
        tip.style.cssText = typed;
        tip.textContent = 'Hello world';
        root.append(tip);
        document.body.append(host);
        mounted.push(tip);

        ready(tip);
        ready(tip);

        const sheets = root.adoptedStyleSheets.filter((sheet) =>
            [...sheet.cssRules].some((rule) => rule.cssText.includes('::highlight(ui-caret)')),
        );
        const text = [...(sheets[0]?.cssRules ?? [])].map((rule) => rule.cssText);

        expect(sheets, 'once').toHaveLength(1);
        expect(text[0]).toBe('::highlight(ui-untyped) { color: transparent; }');
        expect(text[1]).toMatch(
            /^::highlight\(ui-caret\) \{ color: transparent; background-color: var\(--ui-color-accent, /,
        );

        host.remove();
    });
});

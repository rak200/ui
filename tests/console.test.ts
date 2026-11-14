/**
 * The console manager, which every line the package says goes through. RFC 0011, #423.
 *
 * The suite forgets what the manager has said before each test, in `silence.ts`; the codes and
 * causes here are made fresh too, so a test reads only the lines it said.
 */

import { afterEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { error, forget, info, log, warn } from '../src/console.js';

/** The four levels, by the name each is quieted under. */
const levels = { log, info, warn, error } as const;

/** Each level's name, for the tests that run once for every one. */
const names = ['log', 'info', 'warn', 'error'] as const;

/** A word of its own for the run, for a code's case or a cause. */
function fresh(stem: string): string {
    return `${stem}-${crypto.randomUUID().slice(0, 8)}`;
}

/** A code of its own for the run, in the shape every code takes. */
function code(): string {
    return `ui-test:${fresh('case')}`;
}

/** Takes the calls at every level, so what the console was told is the test's to read. */
function hear(): Record<(typeof names)[number], MockInstance<Console['log']>> {
    return {
        log: vi.spyOn(console, 'log').mockImplementation(() => undefined),
        info: vi.spyOn(console, 'info').mockImplementation(() => undefined),
        warn: vi.spyOn(console, 'warn').mockImplementation(() => undefined),
        error: vi.spyOn(console, 'error').mockImplementation(() => undefined),
    };
}

/** Writes what the page quiets, as a page writes it on its root. */
function quiet(words: string): void {
    document.documentElement.setAttribute('data-ui-quiet', words);
}

const element = document.createElement('div');

afterEach(() => {
    document.documentElement.removeAttribute('data-ui-quiet');
    document.body.replaceChildren();
    vi.restoreAllMocks();
});

/** An element in the page, inside a region that quiets `words`. */
function region(words: string): { region: HTMLElement; inside: HTMLElement } {
    const around = document.createElement('section');
    const inside = document.createElement('span');

    around.setAttribute('data-ui-quiet', words);
    around.append(inside);
    document.body.append(around);

    return { region: around, inside };
}

describe('a line', () => {
    it.each(names)('is said at %s through the console call of that name, and no other', (name) => {
        const heard = hear();

        levels[name](code(), fresh('cause'), 'It happened.', element);

        for (const other of names) {
            expect(heard[other], other).toHaveBeenCalledTimes(other === name ? 1 : 0);
        }
    });

    it('starts with its code, ends with the link to its entry, and hands the element over', () => {
        const heard = hear();
        const word = fresh('case');

        warn(`ui-test:${word}`, fresh('cause'), 'What happened, and the way out.', element);

        expect(heard.warn).toHaveBeenCalledWith(
            `[ui-test:${word}] What happened, and the way out. ` +
                `https://github.com/rak200/ui/blob/master/docs/console.md#ui-test${word}`,
            element,
        );
    });

    it('is said once a page for its code and cause, wherever the repeat falls', () => {
        const heard = hear();
        const first = code();
        const second = code();
        const cause = fresh('cause');

        warn(first, cause, 'The first.', element);
        warn(second, cause, 'Another, between them.', element);
        warn(first, cause, 'The first, again.', element);

        expect(heard.warn).toHaveBeenCalledTimes(2);
        expect(String(heard.warn.mock.calls[0]?.[0])).toContain('The first.');
        expect(String(heard.warn.mock.calls[1]?.[0])).toContain('Another, between them.');
    });

    it('is said again for another cause under the same code', () => {
        const heard = hear();
        const one = code();

        warn(one, fresh('cause'), 'One cause.', element);
        warn(one, fresh('cause'), 'Another cause.', element);

        expect(heard.warn).toHaveBeenCalledTimes(2);
    });
});

describe('quieting', () => {
    it.each(names)('quiets every line at %s, and no other level', (name) => {
        const heard = hear();
        const other = name === 'warn' ? 'info' : 'warn';

        quiet(name);
        levels[name](code(), fresh('cause'), 'Quieted.', element);
        levels[other](code(), fresh('cause'), 'Said.', element);

        expect(heard[name], 'the level quieted').not.toHaveBeenCalled();
        expect(heard[other], 'another level').toHaveBeenCalledOnce();
    });

    it('quiets a code, and no other', () => {
        const heard = hear();
        const quieted = code();

        quiet(quieted);
        warn(quieted, fresh('cause'), 'Quieted.', element);
        warn(code(), fresh('cause'), 'Said.', element);

        expect(heard.warn).toHaveBeenCalledOnce();
        expect(String(heard.warn.mock.calls[0]?.[0])).toContain('Said.');
    });

    it('quiets everything the package says, at every level, with all', () => {
        const heard = hear();

        quiet('all');

        for (const name of names) {
            levels[name](code(), fresh('cause'), 'Quieted.', element);
        }

        for (const name of names) {
            expect(heard[name], name).not.toHaveBeenCalled();
        }
    });

    it('reads a list, a code and a level written together', () => {
        const heard = hear();
        const quieted = code();

        quiet(`${quieted} info`);
        warn(quieted, fresh('cause'), 'Quieted by its code.', element);
        info(code(), fresh('cause'), 'Quieted by its level.', element);
        warn(code(), fresh('cause'), 'Said.', element);

        expect(heard.info).not.toHaveBeenCalled();
        expect(heard.warn).toHaveBeenCalledOnce();
        expect(String(heard.warn.mock.calls[0]?.[0])).toContain('Said.');
    });

    it('reads a list written across lines', () => {
        const heard = hear();
        const quieted = code();

        quiet(`info\n\t${quieted}`);
        warn(quieted, fresh('cause'), 'Quieted.', element);

        expect(heard.warn).not.toHaveBeenCalled();
    });

    it('reads the attribute at every line, so a change applies to the lines after it', () => {
        const heard = hear();
        const one = code();

        quiet(one);
        warn(one, fresh('cause'), 'Quieted.', element);
        document.documentElement.removeAttribute('data-ui-quiet');
        warn(one, fresh('cause'), 'Said, once the quiet went.', element);

        expect(heard.warn).toHaveBeenCalledOnce();
        expect(String(heard.warn.mock.calls[0]?.[0])).toContain('Said, once the quiet went.');
    });

    it('remembers nothing it quieted, so the same cause speaks once the quiet is lifted', () => {
        const heard = hear();
        const one = code();
        const cause = fresh('cause');

        quiet('all');
        warn(one, cause, 'Quieted.', element);
        document.documentElement.removeAttribute('data-ui-quiet');
        warn(one, cause, 'Said now.', element);

        expect(heard.warn).toHaveBeenCalledOnce();
        expect(String(heard.warn.mock.calls[0]?.[0])).toContain('Said now.');
    });
});

describe('quieting a region', () => {
    it('quiets a line about an element inside a region that names it, and not one outside', () => {
        const heard = hear();
        const quieted = code();
        const { inside } = region(quieted);
        const outside = document.createElement('span');

        document.body.append(outside);
        warn(quieted, fresh('cause'), 'Quieted, inside.', inside);
        warn(quieted, fresh('cause'), 'Said, outside.', outside);

        expect(heard.warn).toHaveBeenCalledOnce();
        expect(String(heard.warn.mock.calls[0]?.[0])).toContain('Said, outside.');
    });

    it('quiets a line about the element the region is written on', () => {
        const heard = hear();
        const quieted = code();
        const { region: around } = region(quieted);

        warn(quieted, fresh('cause'), 'Quieted.', around);

        expect(heard.warn).not.toHaveBeenCalled();
    });

    it('quiets a level for what is inside, and leaves another level said', () => {
        const heard = hear();
        const { inside } = region('warn');

        warn(code(), fresh('cause'), 'Quieted.', inside);
        info(code(), fresh('cause'), 'Said.', inside);

        expect(heard.warn).not.toHaveBeenCalled();
        expect(heard.info).toHaveBeenCalledOnce();
    });

    it('quiets across the shadow root the element is drawn in', () => {
        const heard = hear();
        const quieted = code();
        const { inside: host } = region(quieted);
        const drawn = document.createElement('span');

        host.attachShadow({ mode: 'open' }).append(drawn);
        warn(quieted, fresh('cause'), 'Quieted, from inside a shadow root.', drawn);

        expect(heard.warn).not.toHaveBeenCalled();
    });
});

describe('forgetting', () => {
    it('lets a line already said be said again, which only the suite asks for', () => {
        const heard = hear();
        const one = code();
        const cause = fresh('cause');

        warn(one, cause, 'Said.', element);
        warn(one, cause, 'Remembered, so not said.', element);
        forget();
        warn(one, cause, 'Said again, once forgotten.', element);

        expect(heard.warn).toHaveBeenCalledTimes(2);
        expect(String(heard.warn.mock.calls[1]?.[0])).toContain('Said again, once forgotten.');
    });
});

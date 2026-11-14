/**
 * The suite's silence: a console call no test expected fails the test it was made in.
 *
 * **Nothing failed on one before**, and RFC 0011 measured what that let through: 29 calls across
 * the suite, 21 of them Lit's and eight the package's own, none asked for and one of them wrong. A
 * console a test can write to unasked is one whose lines nobody reads, which is the noise the
 * proposal keeps out of a page's. #422
 *
 * **A test that means a line says so by replacing the method it expects**, as the suite always
 * has: `vi.spyOn(console, 'warn').mockImplementation(...)` takes the call before it reaches the
 * record here, and the `vi.restoreAllMocks()` each file runs after a test puts this method back.
 *
 * **Lit's dev-mode warning is the one line set aside, by its code.** Lit says it once a page in its
 * development build, which the suite loads, and it is Lit's to say rather than ours to answer.
 *
 * **The record lives on the console itself**, so a second run of this file in one page shares it
 * rather than wrapping each method twice and hearing every call two times over.
 *
 * Suite scaffolding rather than a unit, as `escaped.ts` beside it is, so the mirror does not cover
 * it.
 */

import { afterAll, afterEach, expect } from 'vitest';

/** Every level a test could write at, each of them watched. */
const levels = ['debug', 'error', 'info', 'log', 'warn'] as const;

/** Lit's own line, which carries its code in the link it ends with. */
const lit = 'lit.dev/msg/dev-mode';

/** Where the record is kept on the console, under a name one realm shares. */
const mark: unique symbol = Symbol.for('@rak200/ui:silence');

/** One call no test expected: its level, what it said, and the frame that said it. */
interface Heard {
    readonly level: (typeof levels)[number];
    readonly text: string;
    readonly from: string;
}

/** The console, with the record this file keeps on it. */
interface Watched extends Console {
    [mark]?: Heard[];
}

/** What one argument said, as a person reading the failure would want it. */
function spoken(datum: unknown): string {
    return typeof datum === 'string' ? datum : Object.prototype.toString.call(datum);
}

/** The first frame outside this file, which is the line that made the call. */
function frame(): string {
    return (
        (new Error().stack ?? '')
            .split('\n')
            .map((line) => line.trim())
            .find((line) => line.startsWith('at ') && !line.includes('silence.ts')) ??
        'a frame the stack did not name'
    );
}

/** Wraps every level once, so each call is recorded and still printed. */
function watch(watched: Watched): Heard[] {
    const heard: Heard[] = [];

    for (const level of levels) {
        const original = watched[level].bind(watched);

        watched[level] = (...data: unknown[]): void => {
            const text = data.map(spoken).join(' ');

            if (!text.includes(lit)) {
                heard.push({ level, text, from: frame() });
            }

            original(...data);
        };
    }

    return heard;
}

/** The record this realm keeps, made the first time this file runs in it and shared after. */
function record(watched: Watched): Heard[] {
    const kept = watched[mark];

    if (kept !== undefined) {
        return kept;
    }

    const made = watch(watched);

    watched[mark] = made;

    return made;
}

const heard = record(console);

/** Fails on whatever was said since the record was last read, and empties it. */
function answer(): void {
    const said = heard.splice(0).map((one) => `${one.level}: ${one.text}\n    ${one.from}`);

    expect(said, 'a console call no test expected').toEqual([]);
}

afterEach(answer);

// A timer that fires after a file's last test still writes to this record, and nothing after it
// would read it.
afterAll(answer);

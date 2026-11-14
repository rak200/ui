/**
 * The console manager — internal: every line the package says goes through here, in place of
 * `console` itself, and nothing else in `src/` calls the console, which `eslint.config.js` holds.
 *
 * **Each component used to decide for itself.** The icon said that a name drew nothing once an
 * icon, so a typo copied down a list was a line for each, and the tooltip said that a description
 * would not arrive again at every edit of its tip, neither with a code. RFC 0011 measured both, and
 * made the decision this module's: a line is said once a page for each code and cause, however
 * far from the first its repeat falls, with the code first, a link to the code's entry in
 * `docs/console.md` last, and the element handed over for the devtools to reveal. #423
 *
 * **A page quiets it from its root**, with `data-ui-quiet` on `<html>`: a code, a level, or `all`.
 * The attribute is read at every line, so a page that changes it changes the lines after, and a
 * line quieted is not remembered, so it speaks once the quiet is lifted.
 *
 * **Each level is a call of its own**, which is what keeps every path here from throwing: a level
 * read off a string would hand a slip `console['']` to call, from inside a component's update,
 * where a throw reaches no test. The four calls are the four lines `no-console` sets aside.
 *
 * **The memory outlives a test.** It is module state, in a page the suite and the mutation runner
 * keep between tests and between mutants, so a test that expects a line says it under a cause of its
 * own.
 */

/** A level of the console's own, which is also the word that quiets it. */
type Level = 'log' | 'info' | 'warn' | 'error';

/** Where each code is explained, under a heading GitHub anchors with the code's colon left out. */
const docs = 'https://github.com/rak200/ui/blob/master/docs/console.md#';

/** What has been said this page, by code and cause. */
const said = new Set<string>();

/** Whether the page has quieted a line, by its code, by its level, or all of them. */
function quieted(code: string, level: Level): boolean {
    // `String()` reads a missing attribute as `null`, a word no code and no level is, so a page
    // that quiets nothing needs no branch here. The split is at every space rather than at runs of
    // them: the empty words two spaces leave match no code and no level, so the two are one.
    const words = String(document.documentElement.getAttribute('data-ui-quiet')).split(/\s/);

    return words.includes('all') || words.includes(level) || words.includes(code);
}

/** Says a line through `speak`, unless the page has quieted it or heard it already. */
function say(
    level: Level,
    speak: (line: string) => void,
    code: string,
    cause: string,
    message: string,
): void {
    if (quieted(code, level)) {
        return;
    }

    const key = `${code} ${cause}`;

    if (said.has(key)) {
        return;
    }

    said.add(key);
    speak(`[${code}] ${message} ${docs}${code.replace(':', '')}`);
}

/* eslint-disable no-console -- every line the package says is said by one of these four, once */

/**
 * Says a line that is none of the other three, at `log`. No line takes it yet.
 *
 * @param code - What the line is, `component:case`, which `docs/console.md` explains.
 * @param cause - What it is about, so a repeat of the same cause is left out.
 * @param message - What happened, what it costs, and the way out.
 * @param element - The element it is about, handed to the devtools to reveal.
 */
export function log(code: string, cause: string, message: string, element: Element): void {
    say(
        'log',
        (line) => {
            console.log(line, element);
        },
        code,
        cause,
        message,
    );
}

/**
 * Says what the page asked to hear, at `info`, which the diagnosis's log will be.
 *
 * @param code - What the line is, `component:case`, which `docs/console.md` explains.
 * @param cause - What it is about, so a repeat of the same cause is left out.
 * @param message - What happened, what it costs, and the way out.
 * @param element - The element it is about, handed to the devtools to reveal.
 */
export function info(code: string, cause: string, message: string, element: Element): void {
    say(
        'info',
        (line) => {
            console.info(line, element);
        },
        code,
        cause,
        message,
    );
}

/**
 * Says a mistake of the page's that the page can mend, at `warn`.
 *
 * @param code - What the line is, `component:case`, which `docs/console.md` explains.
 * @param cause - What it is about, so a repeat of the same cause is left out.
 * @param message - What happened, what it costs, and the way out.
 * @param element - The element it is about, handed to the devtools to reveal.
 */
export function warn(code: string, cause: string, message: string, element: Element): void {
    say(
        'warn',
        (line) => {
            console.warn(line, element);
        },
        code,
        cause,
        message,
    );
}

/**
 * Says a failure of the package's own, at `error`, never a mistake of the page's, which a monitor
 * would read as one. No line takes it yet.
 *
 * @param code - What the line is, `component:case`, which `docs/console.md` explains.
 * @param cause - What it is about, so a repeat of the same cause is left out.
 * @param message - What happened, what it costs, and the way out.
 * @param element - The element it is about, handed to the devtools to reveal.
 */
export function error(code: string, cause: string, message: string, element: Element): void {
    say(
        'error',
        (line) => {
            console.error(line, element);
        },
        code,
        cause,
        message,
    );
}

/* eslint-enable no-console */

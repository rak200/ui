/**
 * The accessibility assertion the component suite is built on.
 *
 * RFC 0016 puts **axe in CI** in the quality bar. It belongs to the `test` verb rather
 * than a ninth one: the task vocabulary is closed at eight, and this is the suite
 * asserting something more about the same subject, not a new kind of work.
 *
 * Not a unit of the library and so not mirrored from `src/`: it is the suite's own
 * scaffolding, and `a11y.test.ts` beside it tests the assertion rather than a component.
 *
 * The ruleset it runs under is declared in `a11y-ruleset.ts`, free of the test runner and
 * with the reason for the split; the impact bar below is the half that stays here, because
 * nothing else reads it.
 */

import axe, { type ImpactValue, type Result } from 'axe-core';
import { expect } from 'vitest';
import { ruleset } from './a11y-ruleset.js';

/**
 * The impacts that do *not* fail the suite.
 *
 * The bar is serious-and-critical — those are the ones that stop somebody using the
 * component at all — but it is written as its complement on purpose. An impact axe leaves
 * ungraded, or one a future release adds, then blocks by default instead of slipping
 * through a list nobody remembered to extend.
 */
const tolerated: readonly ImpactValue[] = ['minor', 'moderate'];

/** Structurally, a Lit element: something whose first render resolves a promise. */
interface Renderable {
    readonly updateComplete: Promise<unknown>;
}

function isRenderable(node: Element): node is Element & Renderable {
    return 'updateComplete' in node;
}

/**
 * Waits for every element under `root` that renders asynchronously.
 *
 * A custom element upgrades synchronously on insertion but renders on a microtask, so
 * axe run any earlier would inspect an empty shadow root and pass everything.
 *
 * Exported because the same wait is what a mounted story needs before anything reads its
 * shadow root, and one definition read twice cannot disagree with itself.
 */
export async function rendered(root: ParentNode): Promise<void> {
    await Promise.all(
        [...root.querySelectorAll('*')].filter(isRenderable).map((node) => node.updateComplete),
    );
}

/** Renders violations so a failure is actionable without re-running axe by hand. */
function report(violations: readonly Result[]): string {
    const detail = violations
        .map((violation) => {
            const nodes = violation.nodes.map((node) => `      ${node.html}`).join('\n');

            return [
                `  ${violation.id} (${violation.impact ?? 'unknown'}) — ${violation.help}`,
                `    ${violation.helpUrl}`,
                nodes,
            ].join('\n');
        })
        .join('\n');

    return `axe found ${String(violations.length)} blocking violation(s):\n${detail}`;
}

/**
 * Returns every violation axe reported for `subject`, blocking or not.
 *
 * Markup is mounted here and removed again, so nothing leaks into the next test. An
 * element is inspected where it already stands and is **not** removed: whoever mounted it
 * owns it, and a story mounted for several assertions must survive the first one.
 *
 * @param subject - HTML for the subject, mounted as-is, or an element already in the
 * document. Custom elements in markup must already be registered, which importing the
 * component module does.
 */
export async function findViolations(subject: string | Element): Promise<Result[]> {
    if (typeof subject !== 'string') {
        await rendered(subject);

        return (await axe.run(subject, ruleset)).violations;
    }

    const container = document.createElement('div');
    container.innerHTML = subject;
    document.body.append(container);

    try {
        await rendered(container);

        return (await axe.run(container, ruleset)).violations;
    } finally {
        container.remove();
    }
}

/**
 * The subset of `violations` that fails the suite.
 *
 * Split out from the assertion and exported so the bar itself is testable. Within this
 * ruleset a mounted fragment produces almost nothing below `serious` — the page-structure
 * rules that would are exactly the ones the tag list drops — so the filter cannot be
 * demonstrated against a live page, and a threshold that can never be shown to hold is
 * one nobody has checked.
 */
export function blockingViolations(violations: readonly Result[]): Result[] {
    return violations.filter((violation) => !tolerated.includes(violation.impact ?? null));
}

/**
 * Checks `subject` and fails the test on any blocking violation.
 *
 * This is the one line a component test writes: no fixture, no teardown, no axe setup
 * repeated per component. A mounted story is passed straight in, which is what makes the
 * playground's stories cases of this bar rather than a display beside it.
 *
 * **Call it at least once per component, and once per state that changes the markup.**
 * A single call proves the default rendering and nothing else — a disabled control, an
 * error message, an expanded panel each emit different markup, and each can fail on its
 * own. The two knobs are the bar above and the ruleset in `a11y-ruleset.ts`; narrowing
 * either is a change to the file that declares it, with its reason, never a per-test
 * opt-out that leaves the suite claiming a conformance it stopped checking.
 *
 * @param subject - Markup or a mounted element, as {@link findViolations} takes it.
 * @throws If axe reports a violation of `serious` or `critical` impact, with the rule, its
 * help URL and the offending markup in the message.
 */
export async function expectAccessible(subject: string | Element): Promise<void> {
    const blocking = blockingViolations(await findViolations(subject));

    if (blocking.length > 0) {
        expect.fail(report(blocking));
    }
}

/**
 * The accessibility assertion the component suite is built on.
 *
 * RFC 0016 puts **axe in CI** in the quality bar. It belongs to the `test` verb rather
 * than a ninth one: the task vocabulary is closed at eight, and this is the suite
 * asserting something more about the same subject, not a new kind of work.
 *
 * It lives outside `src/` deliberately. Three tools are keyed on `src/**`— the build
 * emits it, coverage counts it, Stryker mutates it — and a test helper is none of those
 * things. Inside `src/` it would ship to consumers with `axe-core` behind it; here it is
 * what it says it is, the suite's own scaffolding.
 */

import axe, { type ImpactValue, type Result, type RunOptions } from 'axe-core';
import { expect } from 'vitest';

/**
 * The ruleset, named rather than left to the default.
 *
 * axe's default set includes its best-practice rules — `region`, `landmark-one-main`,
 * `page-has-heading-one` — which describe the structure of a *page*. A component mounted
 * on its own can never satisfy them, so leaving them on would mean either a permanently
 * red suite or a pile of per-rule exclusions. The WCAG A/AA tags are the narrower claim
 * that is actually about the component, and they are the conformance target rather than
 * a convenience: nothing is excluded rule by rule.
 */
const ruleset: RunOptions = {
    runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
    },
    resultTypes: ['violations'],
};

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
 */
async function rendered(root: ParentNode): Promise<void> {
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
 * Mounts `markup` in the real document and returns every violation axe reported, blocking
 * or not.
 *
 * The fixture is created and removed here, so nothing leaks into the next test.
 *
 * @param markup - HTML for the subject, mounted as-is. Custom elements in it must already
 * be registered, which importing the component module does.
 */
export async function findViolations(markup: string): Promise<Result[]> {
    const container = document.createElement('div');
    container.innerHTML = markup;
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
 * Mounts `markup` and fails the test on any blocking violation.
 *
 * This is the one line a component test writes: no fixture, no teardown, no axe setup
 * repeated per component.
 *
 * @param markup - HTML for the subject, as {@link findViolations} takes it.
 * @throws If axe reports a violation of `serious` or `critical` impact, with the rule, its
 * help URL and the offending markup in the message.
 */
export async function expectAccessible(markup: string): Promise<void> {
    const blocking = blockingViolations(await findViolations(markup));

    if (blocking.length > 0) {
        expect.fail(report(blocking));
    }
}

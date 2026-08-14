/**
 * The axe ruleset, in a module free of the test runner.
 *
 * Split out of `a11y.ts` rather than declared there, because RFC 0001 gives it a second
 * reader: the playground's accessibility panel takes the same axe `RunOptions` type this
 * declares, and `a11y.ts` imports `vitest` — reading the ruleset from there would pull the
 * test runner into the Storybook bundle. One constant, two readers, nothing that can
 * drift.
 *
 * **The suite is the gate and the panel only displays.** The second reader configures
 * `test: 'off'`, so a bar that disagrees with this one cannot be introduced by turning the
 * panel into a gate of its own.
 *
 * It sits under `tests/` rather than in a directory of its own because `.gitattributes` is
 * an `exact` seed: a new top-level directory cannot be given `export-ignore` here, and
 * `tests/` already carries it. Like `a11y.ts` beside it, this is the suite's own
 * scaffolding rather than a unit, so the mirror does not cover it.
 */

import type { RunOptions } from 'axe-core';

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
export const ruleset: RunOptions = {
    runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
    },
    resultTypes: ['violations'],
};

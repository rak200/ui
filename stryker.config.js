import base from '@rak200/coding-standard-ts/stryker';

export default {
    ...base,

    // The generated glyph modules are excluded from mutation, and NOT from here: each one
    // carries its own `// Stryker disable all`, emitted by `tests/manual/vendor-icons.mjs`,
    // which states the reason beside the single statement it covers.
    //
    // A negation in this file would have been the obvious place and it does not work. A
    // pull request runs `--mutate` over the changed files, and that argument REPLACES this
    // list rather than adding to it — so the exclusion held on a full local run and was
    // silently dropped on the path that gates every pull request. Measured, as a 2.87%
    // score over four thousand mutants on path coordinates that nobody meant to make.
    //
    // The negation below is the same exclusion for the OTHER path. A full run passes no
    // `--mutate` at all, so it reads this list — and without the negation it would
    // instrument 2052 files to create four thousand mutants it then ignores. The pull
    // request path cannot be served from here, because its `--mutate` replaces this list;
    // `tests/tooling/mutate-changed.mjs`, the `mutation` verb's binding, takes the
    // generated tree out of that argument instead.
    //
    // So the rule is written three times, and none of the three is redundant: here for a
    // full run, in the verb's wrapper for a diff run, and in each generated module for
    // whatever reaches Stryker anyway. The first two are speed; the third is the floor.
    mutate: [...base.mutate, '!src/icons/**'],

    //
    // What is actually at risk is the *element*, and it stays mutated: `src/icon.ts` is in
    // scope, and the suite imports three glyph modules the way a host imports them. The
    // generated half is covered by `tsc` instead — `tsconfig.json` includes `src`, so all
    // two thousand modules and the barrel are typechecked by `analyse`, and a module that
    // failed to emit reds there. A glyph whose coordinates drifted is a question for the
    // diff against upstream, not for a mutant.

    // Stryker counts a timed-out mutant as killed, and at the stock timeout that is a lie
    // here: a browser-mode suite is slow enough that a mutant which merely makes a control
    // hard to find — one `userEvent.hover` retrying against a box the mutation moved —
    // runs past the limit and is scored as dead. Measured on `src/select.ts`: the stock
    // timeout reported 100% with 7 timeouts, and the same code at 120s reported 91.67%
    // with 0 timeouts and 2 real survivors. Two of those seven were not kills at all.
    //
    // The floor is never lowered to accommodate a survivor, and a timeout that hides one
    // lowers it without anybody typing a smaller number. Costs nothing measured: both runs
    // took the same three minutes, because the mutants that were timing out finish well
    // inside this.
    //
    // Probably belongs upstream in `@rak200/coding-standard-ts`, which is where the rest of
    // this config comes from — it is a property of running the suite in a browser, not of
    // this repository.
    //
    // **What this does not answer**: every file already on master was scored under the
    // stock timeout, so any of them may carry a survivor a timeout was hiding. Only
    // `src/checkbox.ts` is known clear, its last run having reported no timeouts at all.
    // Settling the rest takes a full run, which is what the pipeline's manual
    // `workflow_dispatch` mutation job is for and where it is expected to happen — before
    // a significant release, not on the pull-request path.
    timeoutMS: 120_000,
};

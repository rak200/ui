import base from '@rak200/coding-standard-ts/stryker';

export default {
    ...base,

    // The generated glyph modules are data, not logic: `register('x', svg`…`)` and nothing
    // else, emitted from a pinned upstream by `tests/manual/vendor-icons.mjs`. Mutating
    // them produces some four thousand mutants on path coordinates, and killing one would
    // mean asserting the drawing of a particular glyph — two thousand assertions about
    // shapes nobody in this repository drew.
    //
    // What is actually at risk is the *element*, and it stays mutated: `src/icon.ts` is in
    // scope, and the suite imports three glyph modules the way a host imports them. The
    // generated half is covered by `tsc` instead — `tsconfig.json` includes `src`, so all
    // two thousand modules and the barrel are typechecked by `analyse`, and a module that
    // failed to emit reds there. A glyph whose coordinates drifted is a question for the
    // diff against upstream, not for a mutant.
    mutate: [...base.mutate, '!src/icons/**'],

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

/**
 * Runs something and hands back every error that escaped into a listener or a timer.
 *
 * **An exception thrown inside an event listener reaches nobody.** It does not propagate to
 * whatever dispatched the event — the platform reports it on the window instead, and a timer's
 * the same way. So a component that throws where it should have returned leaves every assertion
 * around it passing, and the mutation floor does not catch it either: Stryker sees a run that
 * *errored* rather than a test that *failed*, records `RuntimeError`, and **leaves the mutant out
 * of the score entirely**. Eight mutants on the tooltip's handoff, show and hide paths came back
 * that way from a full run — ungraded, and with nothing complaining that they had not been graded.
 *
 * **A second reader is why it is a module**: the tooltip's suite captured through it alone, and
 * the button's and the form's implicit submission act a task after a click or a key, where a
 * form that is not there is a throw nobody would see.
 */
export async function escaped(run: () => Promise<void> | void): Promise<string[]> {
    const thrown: string[] = [];

    const caught = (event: ErrorEvent): void => {
        thrown.push(event.message);
    };

    // **Both channels, and the second is not symmetry for its own sake.** A synchronous
    // throw inside a listener arrives as `error`; a rejected promise nobody awaited arrives
    // as `unhandledrejection` and nowhere else. `customElements.whenDefined` on a name that
    // could never be a custom element *rejects* rather than throws — measured, as a mutant
    // that produced 55 errors in the tooltip's suite and failed no test that was only watching
    // the first channel.
    const rejected = (event: PromiseRejectionEvent): void => {
        thrown.push(String(event.reason));
    };

    // **Attaching is the whole of the handling.** Vitest's browser runner reports a window
    // error as unhandled only while the page has no listener of its own for that event, so
    // for as long as these two are attached what escapes is this helper's to judge — and the
    // assertion on what it returns is what turns a throw into a failure. Nothing has to be
    // cancelled: measured, as the tooltip's 228 mutants graded with none of them erroring and
    // no `preventDefault()` anywhere in the capture.
    window.addEventListener('error', caught);
    window.addEventListener('unhandledrejection', rejected);

    try {
        await run();
        // A rejection is delivered on a later turn than the call that made it, so a check
        // that ran straight after `run()` would read an empty list and call it silence.
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });
    } finally {
        window.removeEventListener('error', caught);
        window.removeEventListener('unhandledrejection', rejected);
    }

    return thrown;
}

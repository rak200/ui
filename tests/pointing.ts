/**
 * The pointer where the pointer engine hears it — `src/pointer.ts` — for a component's suite.
 *
 * **The engine follows an element once its observer has seen it on the window**, and hears the
 * pointer only from moves on the page. So a test waits for the observer's report before it moves
 * the pointer, and moves it by dispatching a move at the point it names rather than by driving it: a
 * driven pointer lands where the runner's scaled frame is drawn, off the point the test names.
 *
 * **A second reader is why it is a module**: the report arrives in a task of its own, after a frame,
 * and every component the engine follows has a suite that has to wait for it in the same way.
 */

/**
 * Once the engine's observer has reported `target` as it is now, or an element handed to the engine
 * before it was. An observer of the test's own is reported to in the same task as the engine's, but
 * first, and with a microtask checkpoint between the two — measured in Chromium — so the engine's
 * report is in once that task is over.
 */
export async function seen(target: Element): Promise<void> {
    await new Promise<void>((resolve) => {
        const watcher = new IntersectionObserver(() => {
            watcher.disconnect();
            setTimeout(resolve, 0);
        });

        watcher.observe(target);
    });
}

/**
 * The pointer come over `target` at `x`, `y` in its own pixels once the engine has seen it, and a
 * frame let pass, after which the engine has written where the pointer is. A `pointerover` on it
 * first, as a real pointer arriving gives one, which has the engine read its sheet again: a test that
 * chose a theme or a time after the element was drawn did so with no action of a reader's.
 */
export async function pointTo(target: Element, x: number, y: number): Promise<void> {
    await seen(target);

    const box = target.getBoundingClientRect();
    const at = { bubbles: true, composed: true, clientX: box.left + x, clientY: box.top + y };

    target.dispatchEvent(new PointerEvent('pointerover', at));
    document.dispatchEvent(new PointerEvent('pointermove', at));
    await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
            resolve();
        });
    });
}

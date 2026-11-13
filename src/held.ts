/**
 * A focus the reader can see, held by a surface — RFC 0004's: a card answers a focus on something
 * it holds, a button in its footer, which its sheet draws from a mark this writes on its host.
 *
 * **Marked in script, because no selector reads it in every engine.** `:host(:has(:focus-visible))`
 * reached what a host holds in Firefox and matched nothing in Chromium, and `:host(:focus-within)`
 * reached it in both and could not tell a focus the reader can see from one a click left —
 * measured. So the surface listens to the focus arriving and leaving inside it, and marks its host
 * with `data-focus-visible` while the focus it holds is one the reader can see.
 *
 * **A focus that moves inside the surface leaves the mark where it is.** It leaves one thing the
 * surface holds and arrives at another, and a mark taken off as it left and put back as it arrived
 * started the surface's answer over at each step, Matrix's burst and Glass's sweep, in Chromium,
 * Firefox and WebKit — measured. So the departure reads where the focus is going, off its
 * `relatedTarget`, and takes the mark off only where that is outside the surface, or nowhere, as
 * when the page loses the focus; the arrival writes the mark again, which changes it only where
 * the focus starts or stops being one the reader can see.
 *
 * Internal — it is not re-exported from `src/index.ts`.
 */

/**
 * Marks the surface a focus arrived in where that focus is one the reader can see. Its listener's
 * event, `focusin` on the surface's host, whose `currentTarget` is the host; the focus is read off
 * the arrival's composed path, so a control inside another component's shadow root is the one
 * asked.
 */
export function held(event: FocusEvent): void {
    const host = event.currentTarget as HTMLElement;
    const target = event.composedPath()[0] as Element;

    host.toggleAttribute('data-focus-visible', target.matches(':focus-visible'));
}

/**
 * Takes the mark off the surface a focus left, where it went outside the surface or nowhere. Its
 * listener's event, `focusout` on the surface's host, whose `relatedTarget` is where the focus is
 * going, retargeted into the host's tree: a control inside another component the surface holds is
 * that component there, which the host contains, and one inside the surface's own shadow root is
 * the host.
 */
export function released(event: FocusEvent): void {
    const host = event.currentTarget as HTMLElement;

    if (!host.contains(event.relatedTarget as Node | null)) {
        host.removeAttribute('data-focus-visible');
    }
}

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
 * Internal — it is not re-exported from `src/index.ts`.
 */

/**
 * Marks the surface a focus arrived in while that focus is one the reader can see, and takes the
 * mark off as the focus leaves. Its listener's event, `focusin` and `focusout` on the surface's
 * host, whose `currentTarget` is the host; the focus is read off the arrival's composed path, so
 * a control inside another component's shadow root is the one asked. A focus that moves from one
 * thing in the surface to another leaves and arrives, so the mark follows it.
 */
export function held(event: FocusEvent): void {
    const host = event.currentTarget as HTMLElement;
    const target = event.composedPath()[0] as Element;

    host.toggleAttribute(
        'data-focus-visible',
        event.type === 'focusin' && target.matches(':focus-visible'),
    );
}

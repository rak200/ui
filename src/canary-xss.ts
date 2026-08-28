/**
 * Canary for RFC 0017 step 5 — a deliberate XSS sink, to gate the CodeQL step.
 * Reads DOM text and reinterprets it as HTML. Never merged.
 */
export function renderFromHash(host: HTMLElement): void {
    host.innerHTML = window.location.hash.slice(1);
}

/**
 * Canary for RFC 0017 step 5 — a deliberate XSS sink, to gate the CodeQL step.
 * Reads DOM text and reinterprets it as HTML. Never merged.
 */
export function renderFromHash(host: HTMLElement): void {
    host.innerHTML = window.location.hash.slice(1);
}

/** Canary — a boundary no test pins, so the `>` mutant survives. */
export function canaryThreshold(n: number): boolean {
    return n > 10;
}

/**
 * What each line that speaks always says — internal: the one wording a component warns with and
 * `diagnose()` finds by, so one mistake is never said two ways. RFC 0011, #426
 *
 * **Each is the message alone**: the console manager writes the code before it and the link after
 * it. The lines only a diagnosis says are written beside their checks in `src/diagnose.ts`, which a
 * page that never asks never loads.
 */

/** An icon whose name has no glyph registered, as `ui-icon:unregistered`. */
export function unregistered(name: string): string {
    return (
        `<ui-icon name="${name}"> drew nothing: no glyph is registered under that name. ` +
        `Import it — import '@rak200/ui/icons/${name}.js' — or slot an <svg> of your own.`
    );
}

/** A trigger the description a tooltip hands it will not reach, as `ui-tooltip:stranded`. */
export function stranded(tag: string): string {
    return (
        `<ui-tooltip> described <${tag}>, and the description will not arrive: it focuses a ` +
        `control inside its own shadow root, which an id in your tree cannot reach. Where the ` +
        `text has to be announced, the trigger has to be a control you wrote — a native ` +
        `<button>, <a href> or form control.`
    );
}

/** A trigger the keys never reach, as `ui-tooltip:unreachable`. */
export function unreachable(tag: string): string {
    return (
        `<ui-tooltip> describes a <${tag}> the keys never reach: it takes no tab stop, so only ` +
        `a pointer shows the tip. Write the trigger as a <button> or an <a href>, which take one.`
    );
}

/** A toast written outside a toaster, as `ui-toast:outside`. */
export function outside(): string {
    return (
        `<ui-toast> is outside a <ui-toaster>, so nothing announces it: the regions that do are ` +
        `the toaster's. Write it inside the page's <ui-toaster>.`
    );
}

/**
 * Where an overlay lands, as arithmetic rather than as a rendering.
 *
 * **One answer to one problem, which is what issue #23 asked for.** `<ui-tooltip>` settled
 * how this package places a `popover` — by hand, over the top layer, with CSS anchor
 * positioning measured as present in this engine and deliberately declined; its docblock
 * carries the whole argument. `<ui-menu>` needs the same thing pointing the other way, so
 * the answer moved here rather than being written twice. A component with two placements is
 * a component that is wrong in one of them.
 *
 * **Taken as numbers rather than as elements, and that is the floors talking** — the same
 * reason `reservedGutter` in `src/dialog.ts` is handed two widths instead of a window. A
 * function of four boxes is decided here and checked directly, at the edges that a rendered
 * page can only reach by luck: an anchor with exactly the tip's height above it, a box wider
 * than the viewport, a menu at the last pixel of the screen. The callers keep no branch of
 * their own.
 *
 * Internal — not re-exported from `src/index.ts`, because what a consumer positions is their
 * own element, and this is how two of ours find each other.
 */

/** Which way an overlay went, which is also what a component writes for a host to select on. */
export type Side = 'block-start' | 'block-end';

/** How the overlay lines up with its anchor along the inline axis. */
export type Align = 'center' | 'inline-start';

/** As much of a box as a placement needs, which is what makes this checkable without one. */
export interface Box {
    readonly top: number;
    readonly left: number;
    readonly width: number;
    readonly height: number;
}

/** Where the overlay goes: the side it took, and the two insets to write. */
export interface Placement {
    readonly side: Side;
    readonly blockStart: number;
    readonly inlineStart: number;
}

/** The other one. A placement has two sides and flipping is what the second one is for. */
function opposite(side: Side): Side {
    return side === 'block-start' ? 'block-end' : 'block-start';
}

/**
 * Puts `box` beside `anchor` on the side it asked for, on the other side when there is no
 * room, and inside the viewport either way.
 *
 * @param anchor - The element being pointed at, in viewport coordinates.
 * @param box - The overlay, measured **after** it is shown: its height depends on how its
 * text wrapped at this width in this font, which no caller can know and none should guess.
 * @param viewport - The visible area, scrollbar excluded — `document.documentElement`'s
 * client size rather than `window.inner*`, so a reserved scrollbar is not counted as room.
 * @param prefer - Where it goes when it fits. A tip goes above its trigger; a menu hangs
 * below its button.
 * @param align - `center` for something that points at the anchor, `inline-start` for
 * something that hangs from it.
 */
export function place(
    anchor: Box,
    box: Box,
    viewport: { readonly width: number; readonly height: number },
    prefer: Side,
    align: Align,
): Placement {
    const room =
        prefer === 'block-start' ? anchor.top : viewport.height - (anchor.top + anchor.height);
    const side = room >= box.height ? prefer : opposite(prefer);

    // Looked up by name rather than compared against one, and that is a measurement rather
    // than a style: `align === 'center' ? … : anchor.left` sends every OTHER name down the
    // same arm, so the caller that passes `inline-start` could pass anything at all — an
    // empty string included — and this would compute the same number. Keyed by the name,
    // each one reaches its own value and no other name reaches either.
    const lined = {
        center: anchor.left + anchor.width / 2 - box.width / 2,
        'inline-start': anchor.left,
    }[align];

    return {
        side,
        blockStart: side === 'block-start' ? anchor.top - box.height : anchor.top + anchor.height,
        // Lined up first, then pulled back inside — in that order, because a box centred on
        // an anchor near the edge is a box half off the screen. `Math.max` last, so a box
        // wider than the viewport starts at the leading edge rather than at a negative one.
        inlineStart: Math.max(0, Math.min(lined, viewport.width - box.width)),
    };
}

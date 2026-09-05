import { describe, expect, it } from 'vitest';
import { place, type Box } from '../src/placement.js';

/** A viewport big enough that nothing clamps unless a case asks it to. */
const viewport = { width: 1000, height: 800 };

/** An anchor in the middle of it, which every case moves rather than rebuilds. */
function anchor(over: Partial<Box> = {}): Box {
    return { top: 300, left: 400, width: 100, height: 40, ...over };
}

/** The overlay, likewise. */
function box(over: Partial<Box> = {}): Box {
    return { top: 0, left: 0, width: 200, height: 120, ...over };
}

describe('place', () => {
    it('takes the side it was asked for when the room is there', () => {
        expect(place(anchor(), box(), viewport, 'block-end', 'center').side).toBe('block-end');
        expect(place(anchor(), box(), viewport, 'block-start', 'center').side).toBe('block-start');
    });

    it('hangs a block-end overlay off the anchor bottom', () => {
        const placed = place(anchor(), box(), viewport, 'block-end', 'inline-start');

        expect(placed.blockStart).toBe(340);
    });

    it('sits a block-start overlay on top of the anchor', () => {
        const placed = place(anchor(), box(), viewport, 'block-start', 'inline-start');

        expect(placed.blockStart).toBe(180);
    });

    it('flips when the preferred side has no room', () => {
        // 60 above and 700 below: a 120-tall box does not fit above.
        const tight = anchor({ top: 60 });

        expect(place(tight, box(), viewport, 'block-start', 'center').side).toBe('block-end');

        // And the mirror: 700 above, 60 below.
        const low = anchor({ top: 700 });

        expect(place(low, box(), viewport, 'block-end', 'center').side).toBe('block-start');
    });

    it('keeps the preferred side on exactly enough room, which is where the comparison is', () => {
        // The boundary rather than a value either side of it: at exactly the box height the
        // overlay fits, and a strict comparison would flip a placement that was correct.
        const exact = anchor({ top: 120 });

        expect(place(exact, box(), viewport, 'block-start', 'center').side).toBe('block-start');
        expect(place(anchor({ top: 119 }), box(), viewport, 'block-start', 'center').side).toBe(
            'block-end',
        );
    });

    it('measures the room below against the viewport rather than the document', () => {
        // 800 tall, an anchor ending at 700, a 120-tall box: 100 of room is not enough.
        const low = anchor({ top: 660 });

        expect(place(low, box(), viewport, 'block-end', 'center').side).toBe('block-start');
        expect(place(low, box({ height: 100 }), viewport, 'block-end', 'center').side).toBe(
            'block-end',
        );
    });

    it('centres on the anchor when asked to', () => {
        // 400 + 100/2 - 200/2.
        expect(place(anchor(), box(), viewport, 'block-end', 'center').inlineStart).toBe(350);
    });

    it('lines up with the anchor leading edge when asked to', () => {
        expect(place(anchor(), box(), viewport, 'block-end', 'inline-start').inlineStart).toBe(400);
    });

    it('pulls a box back inside the trailing edge', () => {
        const late = anchor({ left: 900 });

        expect(place(late, box(), viewport, 'block-end', 'inline-start').inlineStart).toBe(800);
        expect(place(late, box(), viewport, 'block-end', 'center').inlineStart).toBe(800);
    });

    it('pulls a box back inside the leading edge, which centring is what reaches', () => {
        const early = anchor({ left: 0 });

        expect(place(early, box(), viewport, 'block-end', 'center').inlineStart).toBe(0);
    });

    it('starts a box wider than the viewport at the leading edge rather than a negative one', () => {
        // The clamps run trailing-then-leading, and this is the case that says why: pulling
        // a 1200-wide box inside a 1000-wide viewport puts it at -200, and the second clamp
        // is what brings it back to 0.
        const wide = box({ width: 1200 });

        expect(place(anchor(), wide, viewport, 'block-end', 'inline-start').inlineStart).toBe(0);
        expect(place(anchor(), wide, viewport, 'block-end', 'center').inlineStart).toBe(0);
    });
});

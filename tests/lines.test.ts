/**
 * What each line that speaks always says, word for word: the wording a component warns with and
 * `diagnose()` finds by. RFC 0011, #426
 */

import { describe, expect, it } from 'vitest';
import * as lines from '../src/lines.js';

describe('the lines that speak always', () => {
    it("say an icon's name drew nothing, and how to import its glyph", () => {
        expect(lines.unregistered('pencl')).toBe(
            '<ui-icon name="pencl"> drew nothing: no glyph is registered under that name. ' +
                "Import it — import '@rak200/ui/icons/pencl.js' — or slot an <svg> of your own.",
        );
    });

    it("say a trigger's description will not arrive, and what to write instead", () => {
        expect(lines.stranded('x-save-button')).toBe(
            '<ui-tooltip> described <x-save-button>, and the description will not arrive: it ' +
                'focuses a control inside its own shadow root, which an id in your tree cannot ' +
                'reach. Where the text has to be announced, the trigger has to be a control you ' +
                'wrote — a native <button>, <a href> or form control.',
        );
    });

    it('say the keys never reach a trigger, and what takes a tab stop', () => {
        expect(lines.unreachable('span')).toBe(
            '<ui-tooltip> describes a <span> the keys never reach: it takes no tab stop, so only ' +
                'a pointer shows the tip. Write the trigger as a <button> or an <a href>, which ' +
                'take one.',
        );
    });

    it('say nothing announces a toast outside a toaster, and where to write it', () => {
        expect(lines.outside()).toBe(
            '<ui-toast> is outside a <ui-toaster>, so nothing announces it: the regions that do ' +
                "are the toaster's. Write it inside the page's <ui-toaster>.",
        );
    });
});

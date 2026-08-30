// Generated from lucide-static@1.37.0 by tests/manual/vendor-icons.mjs. Do not edit.
import { svg } from 'lit';
import { register } from '../icon.js';

// Stryker disable all: the registration below runs once, at import, inside the warm
// process Stryker switches mutants in — so by the time a mutant on it is active the
// glyph is already registered under its original name and geometry. Outside the
// runner's reach, the category `src/button.ts` names beside `customElements.define`.
//
// `all` rather than `next-line`, and the file holds one statement so the two cover
// the same ground: prettier wraps the longer calls across four lines, and
// `next-line` then covers `register(` while the strings under it stay mutated —
// measured, as 3790 live mutants on a green local run. See vendor-icons.mjs for why
// this is emitted per file rather than excluded in `stryker.config.js`.
register(
    'usb',
    svg`<circle cx="10" cy="7" r="1" /> <circle cx="4" cy="20" r="1" /> <path d="M4.7 19.3 19 5" /> <path d="m21 3-3 1 2 2Z" /> <path d="M9.26 7.68 5 12l2 5" /> <path d="m10 14 5 2 3.5-3.5" /> <path d="m18 12 1-1 1 1-1 1Z" />`,
);

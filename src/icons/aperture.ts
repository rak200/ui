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
    'aperture',
    svg`<circle cx="12" cy="12" r="10" /> <path d="m14.31 8 5.74 9.94" /> <path d="M9.69 8h11.48" /> <path d="m7.38 12 5.74-9.94" /> <path d="M9.69 16 3.95 6.06" /> <path d="M14.31 16H2.83" /> <path d="m16.62 12-5.74 9.94" />`,
);

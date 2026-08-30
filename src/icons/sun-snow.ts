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
    'sun-snow',
    svg`<path d="M10 21v-1" /> <path d="M10 4V3" /> <path d="M10 9a3 3 0 0 0 0 6" /> <path d="m14 20 1.25-2.5L18 18" /> <path d="m14 4 1.25 2.5L18 6" /> <path d="m17 21-3-6 1.5-3H22" /> <path d="m17 3-3 6 1.5 3" /> <path d="M2 12h1" /> <path d="m20 10-1.5 2 1.5 2" /> <path d="m3.64 18.36.7-.7" /> <path d="m4.34 6.34-.7-.7" />`,
);

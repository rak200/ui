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
    'castle',
    svg`<path d="M10 5V3" /> <path d="M14 5V3" /> <path d="M15 21v-3a3 3 0 0 0-6 0v3" /> <path d="M18 3v8" /> <path d="M18 5H6" /> <path d="M22 11H2" /> <path d="M22 9v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9" /> <path d="M6 3v8" />`,
);

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
    'vault',
    svg`<rect width="18" height="18" x="3" y="3" rx="2" /> <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" /> <path d="m7.9 7.9 2.7 2.7" /> <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" /> <path d="m13.4 10.6 2.7-2.7" /> <circle cx="7.5" cy="16.5" r=".5" fill="currentColor" /> <path d="m7.9 16.1 2.7-2.7" /> <circle cx="16.5" cy="16.5" r=".5" fill="currentColor" /> <path d="m13.4 13.4 2.7 2.7" /> <circle cx="12" cy="12" r="2" />`,
);

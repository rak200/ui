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
    'repeat-off',
    svg`<path d="M11.656 6H21l-4-4" /> <path d="M17.898 17.898A4 4 0 0 1 17 18H3l4-4" /> <path d="m2 2 20 20" /> <path d="M21 13v1a4 4 0 0 1-.171 1.159" /> <path d="m21 6-4 4" /> <path d="M3 11v-1a4 4 0 0 1 3.102-3.898" /> <path d="m7 22-4-4" />`,
);

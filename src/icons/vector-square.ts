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
    'vector-square',
    svg`<path d="M19.5 7a24 24 0 0 1 0 10" /> <path d="M4.5 7a24 24 0 0 0 0 10" /> <path d="M7 19.5a24 24 0 0 0 10 0" /> <path d="M7 4.5a24 24 0 0 1 10 0" /> <rect x="17" y="17" width="5" height="5" rx="1" /> <rect x="17" y="2" width="5" height="5" rx="1" /> <rect x="2" y="17" width="5" height="5" rx="1" /> <rect x="2" y="2" width="5" height="5" rx="1" />`,
);

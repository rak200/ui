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
    'diameter',
    svg`<circle cx="19" cy="19" r="2" /> <circle cx="5" cy="5" r="2" /> <path d="M6.48 3.66a10 10 0 0 1 13.86 13.86" /> <path d="m6.41 6.41 11.18 11.18" /> <path d="M3.66 6.48a10 10 0 0 0 13.86 13.86" />`,
);

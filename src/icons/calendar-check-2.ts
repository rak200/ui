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
    'calendar-check-2',
    svg`<path d="M 19 3 L 5 3" /> <path d="M 21 13 L 21 5" /> <path d="M 21 5 A2 2 0 0 0 19 3" /> <path d="M 3 19 A2 2 0 0 0 5 21" /> <path d="M 3 5 L 3 19" /> <path d="M 5 3 A2 2 0 0 0 3 5" /> <path d="m16 19 2 2 4-4" /> <path d="M16 2v3" /> <path d="M3 9h18" /> <path d="M5 21 L12.5 21" /> <path d="M8 2v3" />`,
);

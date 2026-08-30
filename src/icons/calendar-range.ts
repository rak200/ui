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
    'calendar-range',
    svg`<rect x="3" y="3" width="18" height="18" rx="2" /> <path d="M16 2v3" /> <path d="M3 9h18" /> <path d="M8 2v3" /> <path d="M17 13h-6" /> <path d="M13 17H7" /> <path d="M7 13h.01" /> <path d="M17 17h.01" />`,
);

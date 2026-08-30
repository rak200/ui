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
    'boom-box',
    svg`<path d="M4 9V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" /> <path d="M8 8v1" /> <path d="M12 8v1" /> <path d="M16 8v1" /> <rect width="20" height="12" x="2" y="9" rx="2" /> <circle cx="8" cy="15" r="2" /> <circle cx="16" cy="15" r="2" />`,
);

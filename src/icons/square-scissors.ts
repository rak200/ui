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
    'square-scissors',
    svg`<path d="m17 17-2.18-2.18" /> <path d="M9.56 14.44 17 7" /> <path d="M9.56 9.56 12 12" /> <circle cx="8.5" cy="15.5" r="1.5" /> <circle cx="8.5" cy="8.5" r="1.5" /> <rect x="3" y="3" width="18" height="18" rx="2" />`,
);

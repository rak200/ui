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
    'waypoints',
    svg`<path d="m10.586 5.414-5.172 5.172" /> <path d="m18.586 13.414-5.172 5.172" /> <path d="M6 12h12" /> <circle cx="12" cy="20" r="2" /> <circle cx="12" cy="4" r="2" /> <circle cx="20" cy="12" r="2" /> <circle cx="4" cy="12" r="2" />`,
);

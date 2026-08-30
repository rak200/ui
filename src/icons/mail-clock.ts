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
    'mail-clock',
    svg`<path d="M16 14v2.2l1.6 1" /> <path d="m22 7-.759.484" /> <path d="M6.835 20H4a2 2 0 01-2-2V6a2 2 0 012-2h16a2 2 0 012 2v2" /> <path d="M7.605 10.567 2 7" /> <circle cx="16" cy="16" r="6" />`,
);

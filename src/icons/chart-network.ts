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
    'chart-network',
    svg`<path d="m13.11 7.664 1.78 2.672" /> <path d="m14.162 12.788-3.324 1.424" /> <path d="m20 4-6.06 1.515" /> <path d="M3 3v16a2 2 0 0 0 2 2h16" /> <circle cx="12" cy="6" r="2" /> <circle cx="16" cy="12" r="2" /> <circle cx="9" cy="15" r="2" />`,
);

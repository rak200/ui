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
    'book-key',
    svg`<path d="M13 2H6.5A2.5 2.5 0 0 0 4 4.5v15" /> <path d="M17 2v6" /> <path d="M17 4h2" /> <path d="M20 15.2V21a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" /> <circle cx="17" cy="10" r="2" />`,
);

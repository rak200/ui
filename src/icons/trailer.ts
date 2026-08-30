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
    'trailer',
    svg`<path d="M10 11.341V10" /> <path d="M14 13v-3" /> <path d="M18 17V8a2 2 0 00-2-2H4a2 2 0 00-2 2v7a2 2 0 002 2h2" /> <path d="M22 15v1a1 1 0 01-1 1H10" /> <path d="M6 11.341V10" /> <circle cx="8" cy="17" r="2" />`,
);

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
    'eye-dashed',
    svg`<path d="M13.054 18.946a11 11 0 0 1-2.11 0" /> <path d="M13.054 5.054a11 11 0 0 0-2.11-.001" /> <path d="M17.072 6.274a11 11 0 0 1 1.753 1.173" /> <path d="M18.825 16.552a11 11 0 0 1-1.753 1.174" /> <path d="M2.514 13.303a11 11 0 0 1-.452-.954 1 1 0 0 1 0-.697 11 11 0 0 1 .45-.955" /> <path d="M21.485 10.697a11 11 0 0 1 .453.955 1 1 0 0 1 0 .697 11 11 0 0 1-.453.954" /> <path d="M5.173 7.448a11 11 0 0 1 1.753-1.174" /> <path d="M6.926 17.726a11 11 0 0 1-1.753-1.174" /> <circle cx="12" cy="12" r="3" />`,
);

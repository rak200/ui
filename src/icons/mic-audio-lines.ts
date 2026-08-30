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
    'mic-audio-lines',
    svg`<path d="M10 3v2.341" /> <path d="M12 17v4" /> <path d="M14 5v.341" /> <path d="M18 5v13" /> <path d="M2 10v3" /> <path d="M22 10v3" /> <path d="M6 6v11" /> <path d="M9 21h6" /> <rect width="4" height="8" x="10" y="9" rx="2" />`,
);

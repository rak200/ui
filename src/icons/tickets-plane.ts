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
    'tickets-plane',
    svg`<path d="M10.5 17h1.227a2 2 0 0 0 1.345-.52L18 12" /> <path d="m12 13.5 3.794.506" /> <path d="m3.173 8.18 11-5a2 2 0 0 1 2.647.993L18.56 8" /> <path d="M6 10V8" /> <path d="M6 14v1" /> <path d="M6 19v2" /> <rect x="2" y="8" width="20" height="13" rx="2" />`,
);

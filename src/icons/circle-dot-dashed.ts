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
    'circle-dot-dashed',
    svg`<path d="M10.1 2.18a9.93 9.93 0 0 1 3.8 0" /> <path d="M17.6 3.71a9.95 9.95 0 0 1 2.69 2.7" /> <path d="M21.82 10.1a9.93 9.93 0 0 1 0 3.8" /> <path d="M20.29 17.6a9.95 9.95 0 0 1-2.7 2.69" /> <path d="M13.9 21.82a9.94 9.94 0 0 1-3.8 0" /> <path d="M6.4 20.29a9.95 9.95 0 0 1-2.69-2.7" /> <path d="M2.18 13.9a9.93 9.93 0 0 1 0-3.8" /> <path d="M3.71 6.4a9.95 9.95 0 0 1 2.7-2.69" /> <circle cx="12" cy="12" r="1" />`,
);

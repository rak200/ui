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
    'align-center-horizontal',
    svg`<path d="M2 12h20" /> <path d="M10 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4" /> <path d="M10 8V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v4" /> <path d="M20 16v1a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-1" /> <path d="M14 8V7c0-1.1.9-2 2-2h2a2 2 0 0 1 2 2v1" />`,
);

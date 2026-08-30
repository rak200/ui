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
    'hand-grab',
    svg`<path d="M18 11.5V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1.4" /> <path d="M14 10V8a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" /> <path d="M10 9.9V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v5" /> <path d="M6 14a2 2 0 0 0-2-2a2 2 0 0 0-2 2" /> <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8 2 2 0 1 1 4 0" />`,
);

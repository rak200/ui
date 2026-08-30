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
    'radio-off',
    svg`<path d="M13.414 13.414a2 2 0 1 1-2.828-2.828" /> <path d="M16.247 7.761a6 6 0 0 1 1.744 4.572" /> <path d="M19.075 4.933a10 10 0 0 1 2.234 10.72" /> <path d="m2 2 20 20" /> <path d="M4.925 19.067a10 10 0 0 1 0-14.134" /> <path d="M7.753 16.239a6 6 0 0 1 0-8.478" />`,
);

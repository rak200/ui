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
    'alarm-clock-off',
    svg`<path d="M6.87 6.87a8 8 0 1 0 11.26 11.26" /> <path d="M19.9 14.25a8 8 0 0 0-9.15-9.15" /> <path d="m22 6-3-3" /> <path d="M6.26 18.67 4 21" /> <path d="m2 2 20 20" /> <path d="M4 4 2 6" />`,
);

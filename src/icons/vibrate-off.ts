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
    'vibrate-off',
    svg`<path d="m2 8 2 2-2 2 2 2-2 2" /> <path d="m22 8-2 2 2 2-2 2 2 2" /> <path d="M8 8v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2" /> <path d="M16 10.34V6c0-.55-.45-1-1-1h-4.34" /> <line x1="2" x2="22" y1="2" y2="22" />`,
);

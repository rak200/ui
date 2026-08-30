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
    'database-plus',
    svg`<path d="M19 16v6" /> <path d="M21 12.536V5" /> <path d="M22 19h-6" /> <path d="M3 12A9 3 0 0 0 15.1824 14.8061" /> <path d="M3 5V19A9 3 0 0 0 13.318 21.968" /> <ellipse cx="12" cy="5" rx="9" ry="3" />`,
);

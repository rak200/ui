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
    'bug-off',
    svg`<path d="M12 20v-8" /> <path d="M12.656 7H14a4 4 0 0 1 4 4v1.344" /> <path d="M14.12 3.88 16 2" /> <path d="M17.123 17.123A6 6 0 0 1 6 14v-3a4 4 0 0 1 1.72-3.287" /> <path d="m2 2 20 20" /> <path d="M21 5a4 4 0 0 1-3.55 3.97" /> <path d="M22 13h-3.344" /> <path d="M3 21a4 4 0 0 1 3.81-4" /> <path d="M3 5a4 4 0 0 0 3.55 3.97" /> <path d="M6 13H2" /> <path d="m8 2 1.88 1.88" /> <path d="M9.712 4.06A3 3 0 0 1 15 6v1.13" />`,
);

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
    'memory-stick',
    svg`<path d="M12 12v-2" /> <path d="M12 18v-2" /> <path d="M16 12v-2" /> <path d="M16 18v-2" /> <path d="M2 11h1.5" /> <path d="M20 18v-2" /> <path d="M20.5 11H22" /> <path d="M4 18v-2" /> <path d="M8 12v-2" /> <path d="M8 18v-2" /> <rect x="2" y="6" width="20" height="10" rx="2" />`,
);

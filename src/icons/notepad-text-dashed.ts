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
    'notepad-text-dashed',
    svg`<path d="M8 2v4" /> <path d="M12 2v4" /> <path d="M16 2v4" /> <path d="M16 4h2a2 2 0 0 1 2 2v2" /> <path d="M20 12v2" /> <path d="M20 18v2a2 2 0 0 1-2 2h-1" /> <path d="M13 22h-2" /> <path d="M7 22H6a2 2 0 0 1-2-2v-2" /> <path d="M4 14v-2" /> <path d="M4 8V6a2 2 0 0 1 2-2h2" /> <path d="M8 10h6" /> <path d="M8 14h8" /> <path d="M8 18h5" />`,
);

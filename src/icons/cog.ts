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
    'cog',
    svg`<path d="M11 10.27 7 3.34" /> <path d="m11 13.73-4 6.93" /> <path d="M12 22v-2" /> <path d="M12 2v2" /> <path d="M14 12h8" /> <path d="m17 20.66-1-1.73" /> <path d="m17 3.34-1 1.73" /> <path d="M2 12h2" /> <path d="m20.66 17-1.73-1" /> <path d="m20.66 7-1.73 1" /> <path d="m3.34 17 1.73-1" /> <path d="m3.34 7 1.73 1" /> <circle cx="12" cy="12" r="2" /> <circle cx="12" cy="12" r="8" />`,
);

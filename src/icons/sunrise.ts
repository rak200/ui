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
    'sunrise',
    svg`<path d="M12 2v8" /> <path d="m4.93 10.93 1.41 1.41" /> <path d="M2 18h2" /> <path d="M20 18h2" /> <path d="m19.07 10.93-1.41 1.41" /> <path d="M22 22H2" /> <path d="m8 6 4-4 4 4" /> <path d="M16 18a4 4 0 0 0-8 0" />`,
);

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
    'ship-wheel',
    svg`<circle cx="12" cy="12" r="8" /> <path d="M12 2v7.5" /> <path d="m19 5-5.23 5.23" /> <path d="M22 12h-7.5" /> <path d="m19 19-5.23-5.23" /> <path d="M12 14.5V22" /> <path d="M10.23 13.77 5 19" /> <path d="M9.5 12H2" /> <path d="M10.23 10.23 5 5" /> <circle cx="12" cy="12" r="2.5" />`,
);

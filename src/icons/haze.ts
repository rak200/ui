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
    'haze',
    svg`<path d="m5.2 6.2 1.4 1.4" /> <path d="M2 13h2" /> <path d="M20 13h2" /> <path d="m17.4 7.6 1.4-1.4" /> <path d="M22 17H2" /> <path d="M22 21H2" /> <path d="M16 13a4 4 0 0 0-8 0" /> <path d="M12 5V2.5" />`,
);

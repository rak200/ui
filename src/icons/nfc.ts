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
    'nfc',
    svg`<path d="M6 8.32a7.43 7.43 0 0 1 0 7.36" /> <path d="M9.46 6.21a11.76 11.76 0 0 1 0 11.58" /> <path d="M12.91 4.1a15.91 15.91 0 0 1 .01 15.8" /> <path d="M16.37 2a20.16 20.16 0 0 1 0 20" />`,
);

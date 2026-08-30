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
    'parking-circle-off',
    svg`<path d="M12.656 7H13a3 3 0 0 1 2.984 3.307" /> <path d="M13 13H9" /> <path d="M19.071 19.071A1 1 0 0 1 4.93 4.93" /> <path d="m2 2 20 20" /> <path d="M8.357 2.687a10 10 0 0 1 12.956 12.956" /> <path d="M9 17V9" />`,
);

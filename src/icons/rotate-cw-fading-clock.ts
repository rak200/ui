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
    'rotate-cw-fading-clock',
    svg`<path d="M12 3a9.75 9.75 0 0 1 6.74 2.74" /> <path d="M18.74 5.74 21 8" /> <path d="M21 8V3" /> <path d="M7.5 19.794c-6-3.464-6-12.124 0-15.588" /> <path d="M7.5 4.206A9 9 0 0 1 12 3" /> <path d="M12 7v5l4 2" /> <path d="M14 20.775A9 9 0 0 1 12 21" /> <path d="M19 17.656a9 9 0 0 1-1.5 1.456" /> <path d="M21 12a9 9 0 0 1-.228 2" /> <path d="M21 8h-5" />`,
);

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
    'brain-cog',
    svg`<path d="m10.852 14.772-.383.923" /> <path d="m10.852 9.228-.383-.923" /> <path d="m13.148 14.772.382.924" /> <path d="m13.531 8.305-.383.923" /> <path d="m14.772 10.852.923-.383" /> <path d="m14.772 13.148.923.383" /> <path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 0 0-5.63-1.446 3 3 0 0 0-.368 1.571 4 4 0 0 0-2.525 5.771" /> <path d="M17.998 5.125a4 4 0 0 1 2.525 5.771" /> <path d="M19.505 10.294a4 4 0 0 1-1.5 7.706" /> <path d="M4.032 17.483A4 4 0 0 0 11.464 20c.18-.311.892-.311 1.072 0a4 4 0 0 0 7.432-2.516" /> <path d="M4.5 10.291A4 4 0 0 0 6 18" /> <path d="M6.002 5.125a3 3 0 0 0 .4 1.375" /> <path d="m9.228 10.852-.923-.383" /> <path d="m9.228 13.148-.923.383" /> <circle cx="12" cy="12" r="3" />`,
);

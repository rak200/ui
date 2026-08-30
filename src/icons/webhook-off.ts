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
    'webhook-off',
    svg`<path d="M17 17h-5c-1.09-.02-1.94.92-2.5 1.9A3 3 0 1 1 2.57 15" /> <path d="M9 3.4a4 4 0 0 1 6.52.66" /> <path d="m6 17 3.1-5.8a2.5 2.5 0 0 0 .057-2.05" /> <path d="M20.3 20.3a4 4 0 0 1-2.3.7" /> <path d="M18.6 13a4 4 0 0 1 3.357 3.414" /> <path d="m12 6 .6 1" /> <path d="m2 2 20 20" />`,
);

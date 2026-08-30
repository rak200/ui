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
    'microchip',
    svg`<path d="M10 12h4" /> <path d="M10 17h4" /> <path d="M10 7h4" /> <path d="M18 12h2" /> <path d="M18 18h2" /> <path d="M18 6h2" /> <path d="M4 12h2" /> <path d="M4 18h2" /> <path d="M4 6h2" /> <rect x="6" y="2" width="12" height="20" rx="2" />`,
);

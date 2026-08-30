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
    'route-off',
    svg`<circle cx="6" cy="19" r="3" /> <path d="M9 19h8.5c.4 0 .9-.1 1.3-.2" /> <path d="M5.2 5.2A3.5 3.53 0 0 0 6.5 12H12" /> <path d="m2 2 20 20" /> <path d="M21 15.3a3.5 3.5 0 0 0-3.3-3.3" /> <path d="M15 5h-4.3" /> <circle cx="18" cy="5" r="3" />`,
);

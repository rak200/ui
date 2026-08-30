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
    'sun-dim',
    svg`<circle cx="12" cy="12" r="4" /> <path d="M12 4h.01" /> <path d="M20 12h.01" /> <path d="M12 20h.01" /> <path d="M4 12h.01" /> <path d="M17.657 6.343h.01" /> <path d="M17.657 17.657h.01" /> <path d="M6.343 17.657h.01" /> <path d="M6.343 6.343h.01" />`,
);

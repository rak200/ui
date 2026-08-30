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
    'calculator',
    svg`<rect width="16" height="20" x="4" y="2" rx="2" /> <line x1="8" x2="16" y1="6" y2="6" /> <line x1="16" x2="16" y1="14" y2="18" /> <path d="M16 10h.01" /> <path d="M12 10h.01" /> <path d="M8 10h.01" /> <path d="M12 14h.01" /> <path d="M8 14h.01" /> <path d="M12 18h.01" /> <path d="M8 18h.01" />`,
);

// Generated from lucide-static@1.37.0 by tests/manual/vendor-icons.mjs. Do not edit.
import { svg } from 'lit';
import { register } from '../icon.js';

// Stryker disable next-line all: the registration runs once, at import, inside the
// warm process Stryker switches mutants in, so by the time a mutant on this line is
// active the glyph is already registered under its original name and geometry —
// outside the runner's reach, the same category `src/button.ts` names beside
// `customElements.define`. It is emitted per file rather than excluded in
// `stryker.config.js` because a pull request runs `--mutate` over the changed
// files, and that argument replaces the config's list rather than adding to it.
register(
    'bus-front',
    svg`<path d="M4 6 2 7" /> <path d="M10 6h4" /> <path d="m22 7-2-1" /> <rect width="16" height="16" x="4" y="3" rx="2" /> <path d="M4 11h16" /> <path d="M8 15h.01" /> <path d="M16 15h.01" /> <path d="M6 19v2" /> <path d="M18 21v-2" />`,
);

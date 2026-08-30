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
    'blinds',
    svg`<path d="M3 3h18" /> <path d="M20 7H8" /> <path d="M20 11H8" /> <path d="M10 19h10" /> <path d="M8 15h12" /> <path d="M4 3v14" /> <circle cx="4" cy="19" r="2" />`,
);

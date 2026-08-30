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
    'baggage-claim',
    svg`<path d="M22 18H6a2 2 0 0 1-2-2V7a2 2 0 0 0-2-2" /> <path d="M17 14V4a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v10" /> <rect width="13" height="8" x="8" y="6" rx="1" /> <circle cx="18" cy="20" r="2" /> <circle cx="9" cy="20" r="2" />`,
);

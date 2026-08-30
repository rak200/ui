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
    'database-x',
    svg`<path d="m17 17 5 5" /> <path d="M19.323 13.744A9 3 0 0 0 21 12" /> <path d="M21 13.127V5" /> <path d="m22 17-5 5" /> <path d="M3 12A9 3 0 0 0 13.563 14.954" /> <path d="M3 5V19A9 3 0 0 0 13 21.981" /> <ellipse cx="12" cy="5" rx="9" ry="3" />`,
);

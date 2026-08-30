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
    'castle',
    svg`<path d="M10 5V3" /> <path d="M14 5V3" /> <path d="M15 21v-3a3 3 0 0 0-6 0v3" /> <path d="M18 3v8" /> <path d="M18 5H6" /> <path d="M22 11H2" /> <path d="M22 9v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9" /> <path d="M6 3v8" />`,
);

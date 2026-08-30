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
    'robot-vacuum',
    svg`<path d="M11 17h2" /> <path d="M12 12h.01" /> <path d="M17 12a5 5 0 00-10 0" /> <path d="M19 2v2.8" /> <path d="M2 5h2.8" /> <path d="M22 5h-2.8" /> <path d="M5 2v2.8" /> <circle cx="12" cy="12" r="10" />`,
);

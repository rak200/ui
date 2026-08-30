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
    'cable-car',
    svg`<path d="M10 3h.01" /> <path d="M14 2h.01" /> <path d="m2 9 20-5" /> <path d="M12 12V6.5" /> <rect width="16" height="10" x="4" y="12" rx="3" /> <path d="M9 12v5" /> <path d="M15 12v5" /> <path d="M4 17h16" />`,
);

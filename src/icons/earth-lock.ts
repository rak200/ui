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
    'earth-lock',
    svg`<path d="M7 3.34V5a3 3 0 0 0 3 3" /> <path d="M11 21.95V18a2 2 0 0 0-2-2 2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05" /> <path d="M21.54 15H17a2 2 0 0 0-2 2v4.54" /> <path d="M12 2a10 10 0 1 0 9.54 13" /> <path d="M20 6V4a2 2 0 1 0-4 0v2" /> <rect width="8" height="5" x="14" y="6" rx="1" />`,
);

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
    'birdhouse',
    svg`<path d="M12 18v4" /> <path d="m17 18 1.956-11.468" /> <path d="m3 8 7.82-5.615a2 2 0 0 1 2.36 0L21 8" /> <path d="M4 18h16" /> <path d="M7 18 5.044 6.532" /> <circle cx="12" cy="10" r="2" />`,
);

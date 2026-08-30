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
    'angry',
    svg`<path d="M15 12v-1.584" /> <path d="M17 10a5 5 0 00-3 1" /> <path d="M7 10a5 5 0 013 1" /> <path d="M9 12v-1.584" /> <path d="M9 17a5 5 0 016.001 0" /> <circle cx="12" cy="12" r="10" />`,
);

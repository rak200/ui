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
    'zodiac-cancer',
    svg`<path d="M21 14.5A9 6.5 0 0 1 5.5 19" /> <path d="M3 9.5A9 6.5 0 0 1 18.5 5" /> <circle cx="17.5" cy="14.5" r="3.5" /> <circle cx="6.5" cy="9.5" r="3.5" />`,
);

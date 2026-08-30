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
    'scissors-line-dashed',
    svg`<path d="M5.42 9.42 8 12" /> <circle cx="4" cy="8" r="2" /> <path d="m14 6-8.58 8.58" /> <circle cx="4" cy="16" r="2" /> <path d="M10.8 14.8 14 18" /> <path d="M16 12h-2" /> <path d="M22 12h-2" />`,
);

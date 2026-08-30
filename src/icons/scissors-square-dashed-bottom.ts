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
    'scissors-square-dashed-bottom',
    svg`<path d="M14 21h1" /> <path d="m17 17-2.18-2.18" /> <path d="M5 21a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2" /> <path d="M9 21h1" /> <path d="M9.56 14.44 17 7" /> <path d="M9.56 9.56 12 12" /> <circle cx="8.5" cy="15.5" r="1.5" /> <circle cx="8.5" cy="8.5" r="1.5" />`,
);

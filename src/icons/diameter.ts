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
    'diameter',
    svg`<circle cx="19" cy="19" r="2" /> <circle cx="5" cy="5" r="2" /> <path d="M6.48 3.66a10 10 0 0 1 13.86 13.86" /> <path d="m6.41 6.41 11.18 11.18" /> <path d="M3.66 6.48a10 10 0 0 0 13.86 13.86" />`,
);

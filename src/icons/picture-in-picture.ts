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
    'picture-in-picture',
    svg`<path d="M2 10h6V4" /> <path d="m2 4 6 6" /> <path d="M21 10V7a2 2 0 0 0-2-2h-7" /> <path d="M3 14v2a2 2 0 0 0 2 2h3" /> <rect x="12" y="14" width="10" height="7" rx="1" />`,
);

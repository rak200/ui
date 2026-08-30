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
    'combine',
    svg`<path d="M14 3a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1" /> <path d="M19 3a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1" /> <path d="m7 15 3 3" /> <path d="m7 21 3-3H5a2 2 0 0 1-2-2v-2" /> <rect x="14" y="14" width="7" height="7" rx="1" /> <rect x="3" y="3" width="7" height="7" rx="1" />`,
);

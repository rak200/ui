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
    'table-rows-split',
    svg`<path d="M14 10h2" /> <path d="M15 22v-8" /> <path d="M15 2v4" /> <path d="M2 10h2" /> <path d="M20 10h2" /> <path d="M3 19h18" /> <path d="M3 22v-6a2 2 135 0 1 2-2h14a2 2 45 0 1 2 2v6" /> <path d="M3 2v2a2 2 45 0 0 2 2h14a2 2 135 0 0 2-2V2" /> <path d="M8 10h2" /> <path d="M9 22v-8" /> <path d="M9 2v4" />`,
);

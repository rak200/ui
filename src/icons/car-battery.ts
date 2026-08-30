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
    'car-battery',
    svg`<path d="M14 13h4" /> <path d="M16 15v-4" /> <path d="M18 5v2" /> <path d="M6 13h4" /> <path d="M6 5v2" /> <rect x="2" y="7" width="20" height="12" rx="2" />`,
);

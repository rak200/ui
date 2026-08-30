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
    'decimals-arrow-right',
    svg`<path d="M10 18h10" /> <path d="m17 21 3-3-3-3" /> <path d="M3 11h.01" /> <rect x="15" y="3" width="5" height="8" rx="2.5" /> <rect x="6" y="3" width="5" height="8" rx="2.5" />`,
);

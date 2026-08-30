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
    'arrow-up-z-a',
    svg`<path d="m3 8 4-4 4 4" /> <path d="M7 4v16" /> <path d="M15 4h5l-5 6h5" /> <path d="M15 20v-3.5a2.5 2.5 0 0 1 5 0V20" /> <path d="M20 18h-5" />`,
);

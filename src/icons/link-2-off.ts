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
    'link-2-off',
    svg`<path d="M9 17H7A5 5 0 0 1 7 7" /> <path d="M15 7h2a5 5 0 0 1 4 8" /> <line x1="8" x2="12" y1="12" y2="12" /> <line x1="2" x2="22" y1="2" y2="22" />`,
);

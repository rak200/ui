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
    'user-search',
    svg`<circle cx="10" cy="7" r="4" /> <path d="M10.3 15H7a4 4 0 0 0-4 4v2" /> <circle cx="17" cy="17" r="3" /> <path d="m21 21-1.9-1.9" />`,
);

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
    'cigarette-off',
    svg`<path d="M12 12H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h13" /> <path d="M18 8c0-2.5-2-2.5-2-5" /> <path d="m2 2 20 20" /> <path d="M21 12a1 1 0 0 1 1 1v2a1 1 0 0 1-.5.866" /> <path d="M22 8c0-2.5-2-2.5-2-5" /> <path d="M7 12v4" />`,
);

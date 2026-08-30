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
    'switch-camera',
    svg`<path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" /> <path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" /> <circle cx="12" cy="12" r="3" /> <path d="m18 22-3-3 3-3" /> <path d="m6 2 3 3-3 3" />`,
);

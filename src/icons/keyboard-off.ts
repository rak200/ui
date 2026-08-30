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
    'keyboard-off',
    svg`<path d="M 20 4 A2 2 0 0 1 22 6" /> <path d="M 22 6 L 22 16.41" /> <path d="M 7 16 L 16 16" /> <path d="M 9.69 4 L 20 4" /> <path d="M14 8h.01" /> <path d="M18 8h.01" /> <path d="m2 2 20 20" /> <path d="M20 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2" /> <path d="M6 8h.01" /> <path d="M8 12h.01" />`,
);

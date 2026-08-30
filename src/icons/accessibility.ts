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
    'accessibility',
    svg`<circle cx="16" cy="4" r="1" /> <path d="m18 19 1-7-6 1" /> <path d="m5 8 3-3 5.5 3-2.36 3.5" /> <path d="M4.24 14.5a5 5 0 0 0 6.88 6" /> <path d="M13.76 17.5a5 5 0 0 0-6.88-6" />`,
);

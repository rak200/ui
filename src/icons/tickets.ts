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
    'tickets',
    svg`<path d="m3.173 8.18 11-5a2 2 0 0 1 2.647.993L18.56 8" /> <path d="M6 10V8" /> <path d="M6 14v1" /> <path d="M6 19v2" /> <rect x="2" y="8" width="20" height="13" rx="2" />`,
);

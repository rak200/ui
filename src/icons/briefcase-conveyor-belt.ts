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
    'briefcase-conveyor-belt',
    svg`<path d="M10 20v2" /> <path d="M14 20v2" /> <path d="M18 20v2" /> <path d="M21 20H3" /> <path d="M6 20v2" /> <path d="M8 16V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v12" /> <rect x="4" y="6" width="16" height="10" rx="2" />`,
);

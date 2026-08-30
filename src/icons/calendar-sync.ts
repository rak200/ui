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
    'calendar-sync',
    svg`<path d="M11 10v4h4" /> <path d="m11 14 1.535-1.605a5 5 0 018 1.5" /> <path d="M16 2v3" /> <path d="m21 18-1.535 1.605a5 5 0 01-8-1.5" /> <path d="M21 22v-4h-4" /> <path d="M21 8.517V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h3.517" /> <path d="M3 9h4" /> <path d="M8 2v3" />`,
);

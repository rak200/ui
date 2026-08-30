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
    'shower-head',
    svg`<path d="m4 4 2.5 2.5" /> <path d="M13.5 6.5a4.95 4.95 0 0 0-7 7" /> <path d="M15 5 5 15" /> <path d="M14 17v.01" /> <path d="M10 16v.01" /> <path d="M13 13v.01" /> <path d="M16 10v.01" /> <path d="M11 20v.01" /> <path d="M17 14v.01" /> <path d="M20 11v.01" />`,
);

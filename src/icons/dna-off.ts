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
    'dna-off',
    svg`<path d="M15 2c-1.35 1.5-2.092 3-2.5 4.5L14 8" /> <path d="m17 6-2.891-2.891" /> <path d="M2 15c3.333-3 6.667-3 10-3" /> <path d="m2 2 20 20" /> <path d="m20 9 .891.891" /> <path d="M22 9c-1.5 1.35-3 2.092-4.5 2.5l-1-1" /> <path d="M3.109 14.109 4 15" /> <path d="m6.5 12.5 1 1" /> <path d="m7 18 2.891 2.891" /> <path d="M9 22c1.35-1.5 2.092-3 2.5-4.5L10 16" />`,
);

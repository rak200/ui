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
    'ferris-wheel',
    svg`<circle cx="12" cy="12" r="2" /> <path d="M12 2v4" /> <path d="m6.8 15-3.5 2" /> <path d="m20.7 7-3.5 2" /> <path d="M6.8 9 3.3 7" /> <path d="m20.7 17-3.5-2" /> <path d="m9 22 3-8 3 8" /> <path d="M8 22h8" /> <path d="M18 18.7a9 9 0 1 0-12 0" />`,
);

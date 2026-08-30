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
    'wind-arrow-down',
    svg`<path d="M10 2v8" /> <path d="M12.8 21.6A2 2 0 1 0 14 18H2" /> <path d="M17.5 10a2.5 2.5 0 1 1 2 4H2" /> <path d="m6 6 4 4 4-4" />`,
);

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
    'fence',
    svg`<path d="M4 3 2 5v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Z" /> <path d="M6 8h4" /> <path d="M6 18h4" /> <path d="m12 3-2 2v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Z" /> <path d="M14 8h4" /> <path d="M14 18h4" /> <path d="m20 3-2 2v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Z" />`,
);

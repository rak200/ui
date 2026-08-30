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
    'play-off',
    svg`<path d="m10.215 4.56 9.79 5.71a2 2 0 0 1 .003 3.458l-.393.23" /> <path d="m16.042 16.042-8.034 4.686A2 2 0 0 1 5 19V5" /> <path d="m2 2 20 20" />`,
);

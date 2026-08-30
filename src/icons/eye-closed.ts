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
    'eye-closed',
    svg`<path d="m15 18-.722-3.25" /> <path d="M2 8a10.645 10.645 0 0 0 20 0" /> <path d="m20 15-1.726-2.05" /> <path d="m4 15 1.726-2.05" /> <path d="m9 18 .722-3.25" />`,
);

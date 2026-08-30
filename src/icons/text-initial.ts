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
    'text-initial',
    svg`<path d="M15 5h6" /> <path d="M15 12h6" /> <path d="M3 19h18" /> <path d="m3 12 3.553-7.724a.5.5 0 0 1 .894 0L11 12" /> <path d="M3.92 10h6.16" />`,
);

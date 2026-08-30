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
    'send-to-back',
    svg`<rect x="14" y="14" width="8" height="8" rx="2" /> <rect x="2" y="2" width="8" height="8" rx="2" /> <path d="M7 14v1a2 2 0 0 0 2 2h1" /> <path d="M14 7h1a2 2 0 0 1 2 2v1" />`,
);

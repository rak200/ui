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
    'robot-arm',
    svg`<path d="M12 21 7.5 8.322" /> <path d="m14 7 1.75-3.767a.5.5 0 0 1 .662-.172L20 5.005" /> <path d="m20 8.998-3.588 1.944a.5.5 0 0 1-.662-.172L14 7H8" /> <path d="M3.486 21h10" /> <path d="M5 21V8.732" /> <circle cx="6" cy="7" r="2" />`,
);

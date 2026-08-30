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
    'face-slightly-smiling-plus',
    svg`<path d="M13.267 2.08a10 10 0 108.653 8.653" /> <path d="M15 10V9" /> <path d="M16 5h6" /> <path d="M16.472 15a6 6 0 01-8.943 0" /> <path d="M19 2v6" /> <path d="M9 10V9" />`,
);

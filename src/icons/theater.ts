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
    'theater',
    svg`<path d="M2 10s3-3 3-8" /> <path d="M22 10s-3-3-3-8" /> <path d="M10 2c0 4.4-3.6 8-8 8" /> <path d="M14 2c0 4.4 3.6 8 8 8" /> <path d="M2 10s2 2 2 5" /> <path d="M22 10s-2 2-2 5" /> <path d="M8 15h8" /> <path d="M2 22v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" /> <path d="M14 22v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" />`,
);

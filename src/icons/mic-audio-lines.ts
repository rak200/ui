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
    'mic-audio-lines',
    svg`<path d="M10 3v2.341" /> <path d="M12 17v4" /> <path d="M14 5v.341" /> <path d="M18 5v13" /> <path d="M2 10v3" /> <path d="M22 10v3" /> <path d="M6 6v11" /> <path d="M9 21h6" /> <rect width="4" height="8" x="10" y="9" rx="2" />`,
);

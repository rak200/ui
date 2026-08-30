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
    'haze',
    svg`<path d="m5.2 6.2 1.4 1.4" /> <path d="M2 13h2" /> <path d="M20 13h2" /> <path d="m17.4 7.6 1.4-1.4" /> <path d="M22 17H2" /> <path d="M22 21H2" /> <path d="M16 13a4 4 0 0 0-8 0" /> <path d="M12 5V2.5" />`,
);

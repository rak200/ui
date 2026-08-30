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
    'gamepad',
    svg`<line x1="6" x2="10" y1="12" y2="12" /> <line x1="8" x2="8" y1="10" y2="14" /> <line x1="15" x2="15.01" y1="13" y2="13" /> <line x1="18" x2="18.01" y1="11" y2="11" /> <rect width="20" height="12" x="2" y="6" rx="2" />`,
);

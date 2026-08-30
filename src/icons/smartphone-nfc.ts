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
    'smartphone-nfc',
    svg`<rect width="7" height="12" x="2" y="6" rx="1" /> <path d="M13 8.32a7.43 7.43 0 0 1 0 7.36" /> <path d="M16.46 6.21a11.76 11.76 0 0 1 0 11.58" /> <path d="M19.91 4.1a15.91 15.91 0 0 1 .01 15.8" />`,
);

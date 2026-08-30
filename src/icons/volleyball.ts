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
    'volleyball',
    svg`<path d="M11 7a16 16 20 0 1 10.98 4.362" /> <path d="M12 12a13 13 0 0 1-8.66 5" /> <path d="M16.83 13.634a16 16 0 0 1-9.267 7.328" /> <path d="M20.66 17A13 13 0 0 0 12 12a13 13 0 0 1 0-10" /> <path d="M8.17 15.366a16 16 0 0 1-1.713-11.69" /> <circle cx="12" cy="12" r="10" />`,
);

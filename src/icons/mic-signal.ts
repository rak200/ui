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
    'mic-signal',
    svg`<path d="M12 17v4" /> <path d="M18 11a6 6 0 00-3-5.197" /> <path d="M2 11a10 10 0 015-8.662" /> <path d="M22 11a10 10 0 00-5-8.662" /> <path d="M6 11a6 6 0 013-5.197" /> <path d="M9 21h6" /> <rect x="10" y="9" width="4" height="8" rx="2" />`,
);

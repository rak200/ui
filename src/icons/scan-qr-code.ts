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
    'scan-qr-code',
    svg`<path d="M17 12v4a1 1 0 0 1-1 1h-4" /> <path d="M17 3h2a2 2 0 0 1 2 2v2" /> <path d="M17 8V7" /> <path d="M21 17v2a2 2 0 0 1-2 2h-2" /> <path d="M3 7V5a2 2 0 0 1 2-2h2" /> <path d="M7 17h.01" /> <path d="M7 21H5a2 2 0 0 1-2-2v-2" /> <rect x="7" y="7" width="5" height="5" rx="1" />`,
);

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
    'wifi-sync',
    svg`<path d="M11.965 10.105v4L13.5 12.5a5 5 0 0 1 8 1.5" /> <path d="M11.965 14.105h4" /> <path d="M17.965 18.105h4L20.43 19.71a5 5 0 0 1-8-1.5" /> <path d="M2 8.82a15 15 0 0 1 20 0" /> <path d="M21.965 22.105v-4" /> <path d="M5 12.86a10 10 0 0 1 3-2.032" /> <path d="M8.5 16.429h.01" />`,
);

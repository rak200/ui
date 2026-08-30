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
    'drone',
    svg`<path d="M10 10 7 7" /> <path d="m10 14-3 3" /> <path d="m14 10 3-3" /> <path d="m14 14 3 3" /> <path d="M14.205 4.139a4 4 0 1 1 5.439 5.863" /> <path d="M19.637 14a4 4 0 1 1-5.432 5.868" /> <path d="M4.367 10a4 4 0 1 1 5.438-5.862" /> <path d="M9.795 19.862a4 4 0 1 1-5.429-5.873" /> <rect x="10" y="8" width="4" height="8" rx="1" />`,
);

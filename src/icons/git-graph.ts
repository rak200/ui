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
    'git-graph',
    svg`<circle cx="5" cy="6" r="3" /> <path d="M5 9v6" /> <circle cx="5" cy="18" r="3" /> <path d="M12 3v18" /> <circle cx="19" cy="6" r="3" /> <path d="M16 15.7A9 9 0 0 0 19 9" />`,
);

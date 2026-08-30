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
    'git-merge-conflict',
    svg`<path d="M12 6h4a2 2 0 0 1 2 2v7" /> <path d="M6 12v9" /> <path d="m8.5 3.5-5 5" /> <path d="m8.5 8.5-5-5" /> <circle cx="18" cy="18" r="3" />`,
);

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
    'sheet',
    svg`<rect width="18" height="18" x="3" y="3" rx="2" ry="2" /> <line x1="3" x2="21" y1="9" y2="9" /> <line x1="3" x2="21" y1="15" y2="15" /> <line x1="9" x2="9" y1="9" y2="21" /> <line x1="15" x2="15" y1="9" y2="21" />`,
);

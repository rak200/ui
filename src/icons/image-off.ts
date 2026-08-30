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
    'image-off',
    svg`<line x1="2" x2="22" y1="2" y2="22" /> <path d="M10.41 10.41a2 2 0 1 1-2.83-2.83" /> <line x1="13.5" x2="6" y1="13.5" y2="21" /> <line x1="18" x2="21" y1="12" y2="15" /> <path d="M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.052-.22 1.41-.59" /> <path d="M21 15V5a2 2 0 0 0-2-2H9" />`,
);

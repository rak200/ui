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
    'brain-circuit',
    svg`<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" /> <path d="M9 13a4.5 4.5 0 0 0 3-4" /> <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" /> <path d="M3.477 10.896a4 4 0 0 1 .585-.396" /> <path d="M6 18a4 4 0 0 1-1.967-.516" /> <path d="M12 13h4" /> <path d="M12 18h6a2 2 0 0 1 2 2v1" /> <path d="M12 8h8" /> <path d="M16 8V5a2 2 0 0 1 2-2" /> <circle cx="16" cy="13" r=".5" /> <circle cx="18" cy="3" r=".5" /> <circle cx="20" cy="21" r=".5" /> <circle cx="20" cy="8" r=".5" />`,
);

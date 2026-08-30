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
    'kanban-square-dashed',
    svg`<path d="M8 7v7" /> <path d="M12 7v4" /> <path d="M16 7v9" /> <path d="M5 3a2 2 0 0 0-2 2" /> <path d="M9 3h1" /> <path d="M14 3h1" /> <path d="M19 3a2 2 0 0 1 2 2" /> <path d="M21 9v1" /> <path d="M21 14v1" /> <path d="M21 19a2 2 0 0 1-2 2" /> <path d="M14 21h1" /> <path d="M9 21h1" /> <path d="M5 21a2 2 0 0 1-2-2" /> <path d="M3 14v1" /> <path d="M3 9v1" />`,
);

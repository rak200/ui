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
    'book-template',
    svg`<path d="M12 17h1.5" /> <path d="M12 22h1.5" /> <path d="M12 2h1.5" /> <path d="M17.5 22H19a1 1 0 0 0 1-1" /> <path d="M17.5 2H19a1 1 0 0 1 1 1v1.5" /> <path d="M20 14v3h-2.5" /> <path d="M20 8.5V10" /> <path d="M4 10V8.5" /> <path d="M4 19.5V14" /> <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H8" /> <path d="M8 22H6.5a1 1 0 0 1 0-5H8" />`,
);

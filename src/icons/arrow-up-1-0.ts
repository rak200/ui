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
    'arrow-up-1-0',
    svg`<path d="m3 8 4-4 4 4" /> <path d="M7 4v16" /> <path d="M17 10V4h-2" /> <path d="M15 10h4" /> <rect x="15" y="14" width="4" height="6" ry="2" />`,
);

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
    'triangle-dashed',
    svg`<path d="M10.17 4.193a2 2 0 0 1 3.666.013" /> <path d="M14 21h2" /> <path d="m15.874 7.743 1 1.732" /> <path d="m18.849 12.952 1 1.732" /> <path d="M21.824 18.18a2 2 0 0 1-1.835 2.824" /> <path d="M4.024 21a2 2 0 0 1-1.839-2.839" /> <path d="m5.136 12.952-1 1.732" /> <path d="M8 21h2" /> <path d="m8.102 7.743-1 1.732" />`,
);

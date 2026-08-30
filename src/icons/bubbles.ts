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
    'bubbles',
    svg`<path d="M7.001 15.085A1.5 1.5 0 0 1 9 16.5" /> <circle cx="18.5" cy="8.5" r="3.5" /> <circle cx="7.5" cy="16.5" r="5.5" /> <circle cx="7.5" cy="4.5" r="2.5" />`,
);

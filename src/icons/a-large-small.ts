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
    'a-large-small',
    svg`<path d="m15 16 2.536-7.328a1.02 1.02 1 0 1 1.928 0L22 16" /> <path d="M15.697 14h5.606" /> <path d="m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16" /> <path d="M3.304 13h6.392" />`,
);

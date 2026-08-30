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
    'sandwich',
    svg`<path d="m2.37 11.223 8.372-6.777a2 2 0 0 1 2.516 0l8.371 6.777" /> <path d="M21 15a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-5.25" /> <path d="M3 15a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h9" /> <path d="m6.67 15 6.13 4.6a2 2 0 0 0 2.8-.4l3.15-4.2" /> <rect width="20" height="4" x="2" y="11" rx="1" />`,
);

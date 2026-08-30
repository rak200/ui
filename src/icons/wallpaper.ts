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
    'wallpaper',
    svg`<path d="M12 17v4" /> <path d="M8 21h8" /> <path d="m9 17 6.1-6.1a2 2 0 0 1 2.81.01L22 15" /> <circle cx="8" cy="9" r="2" /> <rect x="2" y="3" width="20" height="14" rx="2" />`,
);

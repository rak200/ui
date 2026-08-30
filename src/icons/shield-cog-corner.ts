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
    'shield-cog-corner',
    svg`<path d="M11 22c-3.806-1.45-7-3.966-7-9V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1v4" /> <path d="M14.923 16.547 14 16.164" /> <path d="m14.923 18.843-.923.383" /> <path d="M16.547 14.923 16.164 14" /> <path d="m16.547 20.467-.383.924" /> <path d="m18.843 14.923.383-.923" /> <path d="m19.225 21.391-.382-.924" /> <path d="m20.467 16.547.923-.383" /> <path d="m20.467 18.843.923.383" /> <circle cx="17.695" cy="17.695" r="3" />`,
);

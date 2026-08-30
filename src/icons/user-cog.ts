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
    'user-cog',
    svg`<path d="M10 15H6a4 4 0 0 0-4 4v2" /> <path d="m14.305 16.53.923-.382" /> <path d="m15.228 13.852-.923-.383" /> <path d="m16.852 12.228-.383-.923" /> <path d="m16.852 17.772-.383.924" /> <path d="m19.148 12.228.383-.923" /> <path d="m19.53 18.696-.382-.924" /> <path d="m20.772 13.852.924-.383" /> <path d="m20.772 16.148.924.383" /> <circle cx="18" cy="15" r="3" /> <circle cx="9" cy="7" r="4" />`,
);

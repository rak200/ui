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
    'monitor-cog',
    svg`<path d="M12 17v4" /> <path d="m14.305 7.53.923-.382" /> <path d="m15.228 4.852-.923-.383" /> <path d="m16.852 3.228-.383-.924" /> <path d="m16.852 8.772-.383.923" /> <path d="m19.148 3.228.383-.924" /> <path d="m19.53 9.696-.382-.924" /> <path d="m20.772 4.852.924-.383" /> <path d="m20.772 7.148.924.383" /> <path d="M22 13v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" /> <path d="M8 21h8" /> <circle cx="18" cy="6" r="3" />`,
);

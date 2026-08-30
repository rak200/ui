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
    'calendar-cog',
    svg`<path d="m15.228 16.852-.923-.383" /> <path d="m15.228 19.148-.923.383" /> <path d="M16 2v3" /> <path d="m16.47 14.305.382.923" /> <path d="m16.852 20.772-.383.924" /> <path d="m19.148 15.228.383-.923" /> <path d="m19.53 21.696-.382-.924" /> <path d="m20.773 16.852.924-.383" /> <path d="m20.773 19.148.924.383" /> <path d="M21 10.5V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h5.5" /> <path d="M3 9h18" /> <path d="M8 2v3" /> <circle cx="18" cy="18" r="3" />`,
);

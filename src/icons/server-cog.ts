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
    'server-cog',
    svg`<path d="m10.852 14.772-.383.923" /> <path d="M13.148 14.772a3 3 0 1 0-2.296-5.544l-.383-.923" /> <path d="m13.148 9.228.383-.923" /> <path d="m13.53 15.696-.382-.924a3 3 0 1 1-2.296-5.544" /> <path d="m14.772 10.852.923-.383" /> <path d="m14.772 13.148.923.383" /> <path d="M4.5 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-.5" /> <path d="M4.5 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-.5" /> <path d="M6 18h.01" /> <path d="M6 6h.01" /> <path d="m9.228 10.852-.923-.383" /> <path d="m9.228 13.148-.923.383" />`,
);

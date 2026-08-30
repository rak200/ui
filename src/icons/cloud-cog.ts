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
    'cloud-cog',
    svg`<path d="m10.852 19.772-.383.924" /> <path d="m13.148 14.228.383-.923" /> <path d="M13.148 19.772a3 3 0 1 0-2.296-5.544l-.383-.923" /> <path d="m13.53 20.696-.382-.924a3 3 0 1 1-2.296-5.544" /> <path d="m14.772 15.852.923-.383" /> <path d="m14.772 18.148.923.383" /> <path d="M4.2 15.1a7 7 0 1 1 9.93-9.858A7 7 0 0 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.2" /> <path d="m9.228 15.852-.923-.383" /> <path d="m9.228 18.148-.923.383" />`,
);

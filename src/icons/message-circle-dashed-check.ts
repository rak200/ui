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
    'message-circle-dashed-check',
    svg`<path d="M10.1 2.182a10 10 0 013.8 0" /> <path d="M13.9 21.818a10 10 0 01-3.8 0" /> <path d="M17.609 3.72a10 10 0 012.69 2.7" /> <path d="M2.182 13.9a10 10 0 010-3.8" /> <path d="M20.28 17.61a10 10 0 01-2.7 2.69" /> <path d="M21.818 10.1a10 10 0 010 3.8" /> <path d="M3.721 6.391a10 10 0 012.7-2.69" /> <path d="m6.163 21.117-2.906.85a1 1 0 01-1.236-1.169l.965-2.98" /> <path d="m16 9-5.5 5.5L8 12" />`,
);

// Generated from lucide-static@1.37.0 by tests/manual/vendor-icons.mjs. Do not edit.
import { svg } from 'lit';
import { register } from '../icon.js';

// Stryker disable all: the registration below runs once, at import, inside the warm
// process Stryker switches mutants in — so by the time a mutant on it is active the
// glyph is already registered under its original name and geometry. Outside the
// runner's reach, the category `src/button.ts` names beside `customElements.define`.
//
// `all` rather than `next-line`, and the file holds one statement so the two cover
// the same ground: prettier wraps the longer calls across four lines, and
// `next-line` then covers `register(` while the strings under it stay mutated —
// measured, as 3790 live mutants on a green local run. See vendor-icons.mjs for why
// this is emitted per file rather than excluded in `stryker.config.js`.
register(
    'file-cog',
    svg`<path d="M15 8a1 1 0 0 1-1-1V2a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8z" /> <path d="M20 8v12a2 2 0 0 1-2 2h-4.182" /> <path d="m3.305 19.53.923-.382" /> <path d="M4 10.592V4a2 2 0 0 1 2-2h8" /> <path d="m4.228 16.852-.924-.383" /> <path d="m5.852 15.228-.383-.923" /> <path d="m5.852 20.772-.383.924" /> <path d="m8.148 15.228.383-.923" /> <path d="m8.53 21.696-.382-.924" /> <path d="m9.773 16.852.922-.383" /> <path d="m9.773 19.148.922.383" /> <circle cx="7" cy="18" r="3" />`,
);

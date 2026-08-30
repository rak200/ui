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
    'git-fork',
    svg`<circle cx="12" cy="18" r="3" /> <circle cx="6" cy="6" r="3" /> <circle cx="18" cy="6" r="3" /> <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" /> <path d="M12 12v3" />`,
);

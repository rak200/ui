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
    'grape',
    svg`<path d="M22 5V2l-5.89 5.89" /> <circle cx="16.6" cy="15.89" r="3" /> <circle cx="8.11" cy="7.4" r="3" /> <circle cx="12.35" cy="11.65" r="3" /> <circle cx="13.91" cy="5.85" r="3" /> <circle cx="18.15" cy="10.09" r="3" /> <circle cx="6.56" cy="13.2" r="3" /> <circle cx="10.8" cy="17.44" r="3" /> <circle cx="5" cy="19" r="3" />`,
);

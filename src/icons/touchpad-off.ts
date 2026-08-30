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
    'touchpad-off',
    svg`<path d="M12 20v-6" /> <path d="M19.656 14H22" /> <path d="M2 14h12" /> <path d="m2 2 20 20" /> <path d="M20 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2" /> <path d="M9.656 4H20a2 2 0 0 1 2 2v10.344" />`,
);

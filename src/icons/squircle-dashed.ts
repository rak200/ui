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
    'squircle-dashed',
    svg`<path d="M13.77 3.043a34 34 0 0 0-3.54 0" /> <path d="M13.771 20.956a33 33 0 0 1-3.541.001" /> <path d="M20.18 17.74c-.51 1.15-1.29 1.93-2.439 2.44" /> <path d="M20.18 6.259c-.51-1.148-1.291-1.929-2.44-2.438" /> <path d="M20.957 10.23a33 33 0 0 1 0 3.54" /> <path d="M3.043 10.23a34 34 0 0 0 .001 3.541" /> <path d="M6.26 20.179c-1.15-.508-1.93-1.29-2.44-2.438" /> <path d="M6.26 3.82c-1.149.51-1.93 1.291-2.44 2.44" />`,
);

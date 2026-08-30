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
    'webcam-off',
    svg`<path d="M12 22v-4" /> <path d="M12.754 7.096a3 3 0 0 1 2.15 2.15" /> <path d="M12.863 12.873a3 3 0 0 1-3.736-3.735" /> <path d="M16.566 16.57A8 8 0 0 1 5.43 5.433" /> <path d="m2 2 20 20" /> <path d="M7 22h10" /> <path d="M8.478 2.817a8 8 0 0 1 10.705 10.705" />`,
);

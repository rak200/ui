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
    'battery-plus',
    svg`<path d="M10 9v6" /> <path d="M12.543 6H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3.605" /> <path d="M22 14v-4" /> <path d="M7 12h6" /> <path d="M7.606 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.606" />`,
);

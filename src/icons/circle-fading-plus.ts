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
    'circle-fading-plus',
    svg`<path d="M12 2a10 10 0 0 1 7.38 16.75" /> <path d="M12 8v8" /> <path d="M16 12H8" /> <path d="M2.5 8.875a10 10 0 0 0-.5 3" /> <path d="M2.83 16a10 10 0 0 0 2.43 3.4" /> <path d="M4.636 5.235a10 10 0 0 1 .891-.857" /> <path d="M8.644 21.42a10 10 0 0 0 7.631-.38" />`,
);

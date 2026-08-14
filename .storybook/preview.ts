/**
 * What every story renders under.
 *
 * One entry today, and it is the collision RFC 0001 had to settle rather than ordinary
 * configuration: the panel and the suite must not be two accessibility bars.
 */

import type { Preview } from '@storybook/web-components-vite';
import { ruleset } from '../tests/a11y-ruleset.js';

const preview: Preview = {
    parameters: {
        a11y: {
            // One ruleset, two readers. `addon-a11y` takes the same axe `RunOptions` the
            // suite declares, so the constant is passed verbatim and there is nothing that
            // can drift.
            options: ruleset,

            // The suite is the gate; the panel only displays. Written down because the
            // failure it prevents is someone later turning the panel into a second gate
            // that can disagree with the first.
            //
            // The panel does report more than the gate blocks on: the addon has no impact
            // filter, so the `minor` and `moderate` violations `tests/a11y.ts` tolerates
            // show up here. Accepted rather than configured away — the alternative is
            // switching rules off one by one, which the ruleset refuses in writing.
            test: 'off',
        },
    },
};

export default preview;

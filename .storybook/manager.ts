/**
 * The manager UI, which exists for one line: the commit the site was built from.
 *
 * The site follows `master` rather than a release, so the published playground can be
 * ahead of the latest published version. RFC 0001 accepted that trade and attached a
 * condition to it — the site has to be unambiguous about which `master` a reader is
 * looking at — and this is that condition, discharged where every page shows it.
 *
 * `STORYBOOK_`-prefixed environment variables are the documented channel into the built
 * site; `pages.yml` sets this one from `github.sha`. A local build has no such variable
 * and says so, rather than inventing a commit it does not know.
 */

import { addons } from 'storybook/manager-api';
import { getPreferredColorScheme } from 'storybook/theming';
import { create } from 'storybook/theming/create';

const commit = process.env['STORYBOOK_COMMIT'] ?? '';

addons.setConfig({
    theme: create({
        // Storybook's own default chrome already follows the reader's system —
        // `themes[getPreferredColorScheme()]` is what it converts against — and passing an
        // explicit theme here replaced that with a choice this file had no business making.
        // A reader in dark mode was handed a light panel because this line said `light`,
        // which is the whole of the regression: the brand title needed a theme object, and
        // the theme object silently carried a scheme with it.
        base: getPreferredColorScheme(),
        brandTitle:
            commit === '' ? '@rak200/ui — local build' : `@rak200/ui — ${commit.slice(0, 7)}`,
        brandUrl: 'https://github.com/rak200/ui',
        brandTarget: '_self',
    }),
});

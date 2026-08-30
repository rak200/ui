/**
 * The playground's build.
 *
 * RFC 0001 chose Storybook, on GitHub Pages, at `/ui/`. What is configured here is only
 * what that decision leaves to a file; everything else is Storybook's own default, on
 * purpose — a configuration surface outside the scaffold is one of the prices that choice
 * was accepted with, and it stays as small as the decision allows.
 */

import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/web-components-vite';

/** The public barrel, resolved from this file rather than from the working directory. */
const barrel = fileURLToPath(new URL('../src/index.ts', import.meta.url));

/** The vendored glyph modules, which are a second published subpath. */
const icons = fileURLToPath(new URL('../src/icons/', import.meta.url));

const config: StorybookConfig = {
    // `stories/` mirrors `src/`, one file per unit, beside `tests/button.test.ts`.
    //
    // The suffix is not decoration and RFC 0001 wanted it dropped: Storybook matches a
    // story by FILENAME, not by directory, and the default indexer's test is
    // `(stories|story).[jt]s`. `stories/button.ts` builds nothing — *no matching indexer
    // found* — and keeping the bare name means supplying an indexer from
    // `storybook/internal/*`, which is fragile config bought for a naming preference. The
    // measurement is recorded in the proposal.
    stories: ['../stories/**/*.stories.ts'],

    // Autodocs is deliberately absent rather than turned off. It is opt-in through a tag,
    // and enabling it would publish an ArgTypes table duplicating `docs/<component>.md` —
    // the API surface of record, and the one CI actually checks. The playground may SHOW
    // the API; it does not DESCRIBE it.
    addons: ['@storybook/addon-a11y'],

    framework: {
        name: '@storybook/web-components-vite',
        options: {},
    },

    viteFinal: (vite) => ({
        ...vite,
        resolve: {
            ...vite.resolve,
            // A story imports `@rak200/ui` and never a path into `src/`, so it can only
            // show what a consumer can actually have. The name resolves to the source
            // rather than to `dist/`: the site follows `master`, so the two are the same
            // code, and the source keeps hot reload and needs no build before the
            // playground will open. `tsconfig.json` carries the same mapping for the
            // compiler, and `eslint.config.js` gates the path that would bypass both.
            //
            // Measured: neither `builder-vite` nor `web-components-vite` declares an alias
            // of its own, so this replaces nothing.
            //
            // Pointing at the source is also why `package.json`'s `sideEffects` had to
            // name `./src/*.ts` beside `./dist/*.js`. A story registers its element by
            // importing the barrel for its side effect alone, and a bundler that reads
            // that field as covering `dist/` only treats the source barrel as pure and
            // drops the whole graph. Measured before the field was widened: the site built
            // green, every story rendered its slotted text, and NOTHING upgraded —
            // `customElements.define` appeared nowhere in the output.
            //
            // The array form, and the order is the rule rather than a style: an alias
            // matches by PREFIX, so a lone `@rak200/ui` entry rewrites
            // `@rak200/ui/icons/x.js` into `src/index.ts/icons/x.js`. The specific one has
            // to come first, and there is no configuration that makes the general one
            // safe on its own.
            alias: [
                { find: /^@rak200\/ui\/icons\/(.*)\.js$/, replacement: `${icons}$1.ts` },
                { find: '@rak200/ui', replacement: barrel },
            ],
        },
    }),
};

export default config;

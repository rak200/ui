import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import base from '@rak200/coding-standard-ts/vitest';

const here = dirname(fileURLToPath(import.meta.url));

// Components run in a real browser, not a DOM emulator. Shadow DOM, focus, layout and
// event ordering are exactly where jsdom and a browser disagree, and exactly what a UI
// library exists to get right — see the Layer 2 conventions, Testing.
export default mergeConfig(
    base,
    defineConfig({
        resolve: {
            // The suite composes the stories, and a story imports `@rak200/ui`. Without
            // this the bare name self-references through `exports` to `dist/`, so the
            // suite loads a SECOND copy of every component — measured, and it fails loudly
            // rather than quietly: `customElements.define` throws `NOT_SUPPORTED_ERR` on
            // the tag the test's own `src/` import already registered. It would also mean
            // testing the build output while Stryker mutates the source.
            //
            // The same mapping is in `.storybook/main.ts` for the bundler and in
            // `tsconfig.json` for the compiler. Three readers, because the three resolve
            // module names themselves; one meaning.
            // The array form, and the order is the rule: an alias matches by prefix, so a
            // lone `@rak200/ui` entry rewrites `@rak200/ui/icons/x.js` into
            // `src/index.ts/icons/x.js`. `.storybook/main.ts` carries the same pair for
            // the same reason.
            alias: [
                {
                    find: /^@rak200\/ui\/icons\/(.*)\.js$/,
                    replacement: `${join(here, 'src', 'icons')}/$1.ts`,
                },
                { find: '@rak200/ui', replacement: join(here, 'src', 'index.ts') },
            ],
        },
        test: {
            // Browser mode photographs a failing test and files the attachment beside it.
            // Both are build artefacts, and the accessibility canary produces them on
            // purpose — so they go to `reports/`, which the seeded `.gitignore` already
            // covers. The alternative was two more ignore lines in a file CI diffs
            // byte-for-byte against the pinned scaffold.
            attachmentsDir: 'reports/vitest-attachments',

            coverage: {
                // The generated glyph modules are excluded, and `tsc` is what covers them
                // instead — `tsconfig.json` includes `src`, so all two thousand and the
                // barrel that imports them are typechecked by `analyse`. A module that
                // failed to emit, or a barrel with a bad import line, reds there.
                //
                // The alternative was importing the barrel from a test, which does cover
                // them and costs 9.4 seconds of import on every run, measured. That buys
                // *registers without throwing* over what the compiler already says, which
                // is not worth doubling the suite for.
                exclude: [...(base.test?.coverage?.exclude ?? []), 'src/icons/**'],
            },

            browser: {
                enabled: true,
                headless: true,
                provider: playwright(),
                instances: [{ browser: 'chromium' }],
                screenshotDirectory: 'reports/screenshots',
            },
        },
    }),
);

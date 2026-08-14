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
            alias: { '@rak200/ui': join(here, 'src', 'index.ts') },
        },
        test: {
            // Browser mode photographs a failing test and files the attachment beside it.
            // Both are build artefacts, and the accessibility canary produces them on
            // purpose — so they go to `reports/`, which the seeded `.gitignore` already
            // covers. The alternative was two more ignore lines in a file CI diffs
            // byte-for-byte against the pinned scaffold.
            attachmentsDir: 'reports/vitest-attachments',
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

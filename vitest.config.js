import { defineConfig, mergeConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import base from '@rak200/coding-standard-ts/vitest';

// Components run in a real browser, not a DOM emulator. Shadow DOM, focus, layout and
// event ordering are exactly where jsdom and a browser disagree, and exactly what a UI
// library exists to get right — see the Layer 2 conventions, Testing.
export default mergeConfig(
    base,
    defineConfig({
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

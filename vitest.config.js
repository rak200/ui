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
            browser: {
                enabled: true,
                headless: true,
                provider: playwright(),
                instances: [{ browser: 'chromium' }],
            },
        },
    }),
);

/**
 * The button's interaction states, in every engine — RFC 0002's Rollout step, run.
 *
 * **A step, not a test.** It is not collected by the suite and does not gate anything:
 * `vitest` picks up `*.test.ts`, and this is neither. The suite runs one engine by
 * design, so it cannot warn about what this looks for; that is the whole reason the
 * proposal made this a step in the first place.
 *
 * It lives under `tests/` for two reasons that are not "it is a test": that directory is
 * already `export-ignore`d, so a development script does not ride along in a consumer's
 * `git archive`, and the alternative was editing a seed the conformance check compares
 * byte for byte. `eslint.config.js` ignores this path, which is where that is stated.
 *
 * ## Running it
 *
 * ```sh
 * npm run build-storybook
 * (cd storybook-static && python3 -m http.server 8099 --bind 127.0.0.1) &
 * node tests/manual/interaction-states.mjs chromium firefox
 * ```
 *
 * WebKit needs libraries a current Debian does not carry — `libicu66`, `libjpeg.so.8` —
 * and `playwright install-deps` wants root. The official image has them:
 *
 * ```sh
 * docker run --rm --network host -v "$(pwd)":/work -w /work \
 *   -e PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
 *   mcr.microsoft.com/playwright:v1.62.1-noble \
 *   node tests/manual/interaction-states.mjs webkit webkit:mobile
 * ```
 *
 * ## What it cannot tell you
 *
 * Whether `:active` fires from a real finger on real iOS. Playwright's touchscreen taps
 * instantaneously and cannot hold, and an emulated context is not a device. That question
 * needs a phone, and it is the one the tracking issue keeps open.
 *
 * **Answering it takes ten seconds and no instrument.** Open the playground on the phone —
 * `Components/ui-button` → `States` — and **press and hold** a button. Holding is the whole
 * trick: `:active` persists for as long as the finger is down, so there is no 100ms flash
 * to catch and nothing to judge. The button darkens and stays darkened, or it does not.
 *
 * If it does not, iOS is gating `:active` on a touch listener existing, and the fix is a
 * no-op listener on the component — decided against for now rather than carried before
 * anything needed it. If it does, nothing changes and the question closes.
 *
 * ## Reading it
 *
 * Engines are named on the command line, `:mobile` appends an iPhone descriptor. Every
 * derived colour serialises as `oklab(…)` because `color-mix()` computes there; compare
 * the numbers across engines rather than to a literal.
 *
 * **Give the transition room.** `SETTLE` defaults to 400ms against a 150ms transition,
 * and that was not enough for WebKit on first measurement — it read a hover partway
 * through and looked like a cross-engine discrepancy that did not exist. `SETTLE=1500`
 * is the value that settled it.
 */

import { chromium, firefox, webkit, devices } from 'playwright';

const URL =
    process.env.STORY_URL ??
    'http://127.0.0.1:8099/iframe.html?id=components-ui-button--states&viewMode=story';

const SETTLE = Number(process.env.SETTLE ?? 400);
const ENGINES = { chromium, firefox, webkit };

/** The three buttons the `States` story renders, in order. */
const BUTTONS = ['primary', 'secondary', 'disabled'];

const settle = (page) => page.waitForTimeout(SETTLE);

/** What the inner button is painted right now, read through the shadow root. */
function read(page, index) {
    return page.evaluate((i) => {
        const host = document.querySelectorAll('ui-button')[i];
        const button = host.shadowRoot.querySelector('button');
        const style = getComputedStyle(button);

        return {
            background: style.backgroundColor,
            outline: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`,
            transition: `${style.transitionProperty} / ${style.transitionDuration} / ${style.transitionTimingFunction}`,
            tap: style.getPropertyValue('-webkit-tap-highlight-color') || '(not supported)',
        };
    }, index);
}

async function measure(label, type, contextOptions) {
    const browser = await type.launch();
    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();

    await page.goto(URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForFunction(
        () =>
            document.querySelectorAll('ui-button').length === 3 &&
            document.querySelector('ui-button')?.shadowRoot?.querySelector('button'),
        null,
        { timeout: 20000 },
    );
    await settle(page);

    const rows = [];

    for (const [index, name] of BUTTONS.entries()) {
        const box = await page.locator('ui-button').nth(index).locator('button').boundingBox();
        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;

        const resting = await read(page, index);

        await page.mouse.move(x, y);
        await settle(page);
        const hover = await read(page, index);

        await page.mouse.down();
        await page.waitForTimeout(120);
        const active = await read(page, index);
        await page.mouse.up();

        await page.mouse.move(1, 1);
        await settle(page);

        rows.push({ name, resting, hover, active });
    }

    // The frame has to hold focus before Tab means anything, and the click has to land on
    // neither button. Tab after a click still matches :focus-visible — the heuristic reads
    // the LAST input modality, which is what makes the ring appear for someone who
    // arrived with a mouse and then reached for the keyboard.
    await page.mouse.click(2, 2);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    const focus = await read(page, 0);
    const reached = await page.evaluate(() =>
        [...document.querySelectorAll('ui-button')].some(
            (host) => host.shadowRoot.activeElement === host.shadowRoot.querySelector('button'),
        ),
    );

    await browser.close();

    console.log(`\n=== ${label} ===`);

    for (const row of rows) {
        console.log(`  ${row.name.padEnd(9)} resting  ${row.resting.background}`);
        console.log(`  ${row.name.padEnd(9)} hover    ${row.hover.background}`);
        console.log(`  ${row.name.padEnd(9)} active   ${row.active.background}`);
    }

    console.log(`  transition     ${rows[0].resting.transition}`);
    console.log(`  tap-highlight  ${rows[0].resting.tap}`);
    console.log(`  focus ring     ${focus.outline}   (tab reached a button: ${reached})`);
}

if (process.argv.length <= 2) {
    console.log('usage: node tests/manual/interaction-states.mjs <engine[:mobile]>…');
    console.log('       engines: chromium, firefox, webkit');
    process.exit(1);
}

for (const argument of process.argv.slice(2)) {
    const mobile = argument.endsWith(':mobile');
    const engine = mobile ? argument.slice(0, -':mobile'.length) : argument;

    if (!(engine in ENGINES)) {
        console.log(`\n=== ${argument} ===\n  UNKNOWN ENGINE`);
        continue;
    }

    try {
        await measure(
            mobile ? `${engine} · iPhone 15 emulated` : engine,
            ENGINES[engine],
            mobile ? devices['iPhone 15'] : {},
        );
    } catch (error) {
        console.log(`\n=== ${argument} ===\n  COULD NOT RUN: ${String(error).split('\n')[0]}`);
    }
}

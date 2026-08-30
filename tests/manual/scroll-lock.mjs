/**
 * The dialog's scroll lock, on a browser that actually draws a scrollbar.
 *
 * **A step, not a test**, for the same reasons as `interaction-states.mjs` beside it: it
 * is not collected by the suite, it gates nothing, and it lives under `tests/` because
 * that path is already `export-ignore`d.
 *
 * ## What the suite cannot tell you, and this can
 *
 * `<dialog>` does not stop the page behind it scrolling, so `ui-dialog` writes that lock
 * itself — and the hard half is doing it **without a layout shift**: `overflow: hidden`
 * takes the scrollbar away, and the page jumps left by its width.
 *
 * The suite asserts the mechanism and cannot see the effect. Measured, on this machine:
 *
 * ```
 * chromium headless   gap=0    naive lock 1280 → 1280    (no scrollbar to lose)
 * chromium headed     gap=15   naive lock 1265 → 1280    (the shift, 15px)
 * firefox  either     gap=0    naive lock 1280 → 1280
 * ```
 *
 * Headless engines use overlay scrollbars, so the gap is zero and every arithmetic that
 * compensates for it — including a wrong one — passes. A **headed** Chromium is where the
 * question is answerable at all, and CI runners are headless. Hence a step.
 *
 * ## Running it
 *
 * ```sh
 * npm run build-storybook
 * (cd storybook-static && python3 -m http.server 8099 --bind 127.0.0.1) &
 * node tests/manual/scroll-lock.mjs chromium
 * ```
 *
 * It launches **headed** on purpose; a display is required. `HEADLESS=1` runs it without
 * one, which is useful only for checking that the script itself still works — with no
 * scrollbar to lose there is nothing for it to measure, and it says so.
 *
 * ## Reading it
 *
 * `shift` is the number that matters and it must be `0`. `scroll held` is the other half —
 * the wheel, over the backdrop, moving nothing. `gutter` reports whether the
 * component reserved the scrollbar's space, which is how it gets a zero: it is expected to
 * be `stable` where there was a scrollbar and empty where there was not — reserving space
 * that was never there is the same shift in the other direction.
 */

import { chromium, firefox, webkit } from 'playwright';

const URL =
    process.env.STORY_URL ??
    'http://127.0.0.1:8099/iframe.html?id=components-ui-dialog--long&viewMode=story';

const HEADLESS = process.env.HEADLESS === '1';
const ENGINES = { chromium, firefox, webkit };

/** The width of a full-width element, which is what a layout shift moves. */
const probeWidth = (page) =>
    page.evaluate(() => document.querySelector('#scroll-lock-probe').getBoundingClientRect().width);

/** What the document is doing about scrolling right now. */
const lockState = (page) =>
    page.evaluate(() => ({
        overflow: document.documentElement.style.overflow,
        gutter: document.documentElement.style.getPropertyValue('scrollbar-gutter'),
        gap: window.innerWidth - document.documentElement.clientWidth,
        scrollY: window.scrollY,
    }));

async function measure(label, type) {
    const browser = await type.launch({ headless: HEADLESS });
    const page = await browser.newPage();

    await page.goto(URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForFunction(
        () => document.querySelector('ui-dialog')?.shadowRoot !== null,
        null,
        {
            timeout: 20000,
        },
    );

    // A full-width element is the instrument: the page shifting sideways is exactly this
    // number changing, and it is the thing a person would see move.
    await page.evaluate(() => {
        const probe = document.createElement('div');
        probe.id = 'scroll-lock-probe';
        probe.style.cssText = 'width: 100%; height: 4px; background: red';
        document.body.prepend(probe);
    });

    const before = await probeWidth(page);
    const resting = await lockState(page);

    // Scrolled first, so that *scrolling is blocked* is asked from somewhere other than
    // the top — a page already at zero cannot show that it refused to move.
    await page.evaluate(() => {
        window.scrollTo(0, 400);
    });
    await page.waitForTimeout(100);

    const scrolledTo = (await lockState(page)).scrollY;

    await page.evaluate(() => {
        document.querySelector('ui-dialog').open = true;
    });
    await page.waitForFunction(
        () =>
            document
                .querySelector('ui-dialog')
                .shadowRoot.querySelector('dialog')
                .matches(':modal'),
        null,
        { timeout: 5000 },
    );
    await page.waitForTimeout(400);

    const during = await probeWidth(page);
    const locked = await lockState(page);

    // The **wheel**, and not `window.scrollTo`. `overflow: hidden` is defined to clip the
    // content and offer the *user* no scrolling mechanism; the box stays scrollable from
    // script, so a lock asserted with `scrollTo` would be asserting a defect rather than
    // the behaviour. Measured that way first, and it read as a failure of a component that
    // was working.
    await page.mouse.move(4, 4);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(300);

    const heldAt = (await lockState(page)).scrollY;

    await page.evaluate(() => {
        document.querySelector('ui-dialog').open = false;
    });
    await page.waitForFunction(
        () => !document.querySelector('ui-dialog').shadowRoot.querySelector('dialog').open,
        null,
        { timeout: 5000 },
    );

    const after = await probeWidth(page);
    const released = await lockState(page);

    await browser.close();

    const shift = during - before;
    const returned = after - before;

    console.log(`\n=== ${label}${HEADLESS ? ' · headless' : ''} ===`);
    console.log(
        `  scrollbar gap    ${resting.gap}px${resting.gap === 0 ? '  (overlay scrollbars — nothing to lose, and nothing to prove)' : ''}`,
    );
    console.log(`  probe resting    ${before}`);
    console.log(`  probe locked     ${during}`);
    console.log(`  probe released   ${after}`);
    console.log(
        `  shift            ${shift}px          ${shift === 0 ? 'OK' : 'FAIL — the page moved under the dialog'}`,
    );
    console.log(
        `  restored         ${returned}px          ${returned === 0 ? 'OK' : 'FAIL — the page did not come back'}`,
    );
    console.log(
        `  overflow         [${resting.overflow}] → [${locked.overflow}] → [${released.overflow}]`,
    );
    console.log(
        `  gutter           [${resting.gutter}] → [${locked.gutter}] → [${released.gutter}]`,
    );
    console.log(
        `  scroll held      ${scrolledTo} → ${heldAt}          ${heldAt === scrolledTo ? 'OK' : 'FAIL — the page scrolled behind the dialog'}`,
    );
}

if (process.argv.length <= 2) {
    console.log('usage: node tests/manual/scroll-lock.mjs <engine>…');
    console.log('       engines: chromium, firefox, webkit');
    console.log('       HEADLESS=1 runs without a display, and then measures nothing.');
    process.exit(1);
}

for (const engine of process.argv.slice(2)) {
    if (!(engine in ENGINES)) {
        console.log(`\n=== ${engine} ===\n  UNKNOWN ENGINE`);
        continue;
    }

    try {
        await measure(engine, ENGINES[engine]);
    } catch (error) {
        console.log(`\n=== ${engine} ===\n  COULD NOT RUN: ${String(error).split('\n')[0]}`);
    }
}

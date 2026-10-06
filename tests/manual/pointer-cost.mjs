/**
 * What an effect that follows the pointer costs the main thread — RFC 0004's S3, run.
 *
 * **A step, not a test**, for the reasons `interaction-states.mjs` gives beside it. It
 * reads Chromium's own counters through the DevTools protocol, so it runs in Chromium only:
 * the question is the order of magnitude, and one engine answers that.
 *
 * ## Running it
 *
 * ```sh
 * node tests/manual/pointer-cost.mjs
 * ```
 *
 * ## Reading it
 *
 * One card, 600 by 400, lit by a radial gradient at `--x` and `--y`. The pointer crosses it
 * the same way twice per round, 600 moves about a frame apart: once with nothing listening,
 * once with a `pointermove` handler that writes both properties, throttled to one write a
 * frame. Each line is the main-thread time those 600 moves cost, in milliseconds, as the
 * protocol counts it: the whole of it, then the script, the style recalculation and the
 * layout inside it. What the whole has beyond the three is mostly paint.
 *
 * ## What it cannot tell you
 *
 * What a real device pays. A headless engine paints in software, so the paint share here is
 * an upper bound rather than a reading, and a phone's main thread is slower than this one.
 */

import { chromium } from 'playwright';

const METRICS = ['TaskDuration', 'ScriptDuration', 'RecalcStyleDuration', 'LayoutDuration'];

/** The page, with the effect or without it. */
const fixture = (follow) => `<!doctype html>
<style>
    body { margin: 0; }
    .card {
        margin: 40px; inline-size: 600px; block-size: 400px; border-radius: 8px;
        background: radial-gradient(circle at var(--x, 50%) var(--y, 50%), #ffffff55, transparent 40%), #2563eb;
    }
</style>
<div class="card"></div>
<script>
    ${
        follow
            ? `const card = document.querySelector('.card');
    let pending = false, x = 0, y = 0;
    card.addEventListener('pointermove', (event) => {
        x = event.offsetX;
        y = event.offsetY;
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
            pending = false;
            card.style.setProperty('--x', x + 'px');
            card.style.setProperty('--y', y + 'px');
        });
    });`
            : ''
    }
</script>`;

/** Main-thread time, in milliseconds, that one crossing pattern costs. */
async function measure(browser, follow) {
    const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
    await page.setContent(fixture(follow));
    await page.mouse.move(60, 60);
    await page.waitForTimeout(300);

    const read = async () =>
        Object.fromEntries(
            (await cdp.send('Performance.getMetrics')).metrics
                .filter((metric) => METRICS.includes(metric.name))
                .map((metric) => [metric.name, metric.value]),
        );
    const before = await read();

    for (let pass = 0; pass < 10; pass += 1) {
        for (let step = 0; step < 60; step += 1) {
            const t = step / 59;
            await page.mouse.move(60 + t * 560, 60 + (pass % 2 ? 1 - t : t) * 360);
            await page.waitForTimeout(16);
        }
    }

    await page.waitForTimeout(100);
    const after = await read();
    await context.close();

    return METRICS.map((metric) => ((after[metric] - before[metric]) * 1000).toFixed(1)).join(
        ' / ',
    );
}

const browser = await chromium.launch();
console.log(`chromium ${browser.version()} — ${METRICS.join(' / ')}, ms over 600 moves`);

for (let round = 1; round <= 3; round += 1) {
    console.log(`round ${round}  idle    ${await measure(browser, false)}`);
    console.log(`round ${round}  follow  ${await measure(browser, true)}`);
}

await browser.close();

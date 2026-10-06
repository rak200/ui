/**
 * Whether a consumer's choice of effect reaches a component, at every scope, in every
 * engine — RFC 0004's S2, S5, S6 and S7, run.
 *
 * **A step, not a test.** It is not collected by the suite and does not gate anything:
 * `vitest` picks up `*.test.ts`, and this is neither. The suite runs one engine, and the
 * question here is whether three agree. It lives under `tests/` for the reasons
 * `interaction-states.mjs` gives beside it, and `eslint.config.js` ignores this path.
 *
 * ## Running it
 *
 * ```sh
 * node tests/manual/motion-selection.mjs chromium firefox
 * ```
 *
 * WebKit needs libraries a current Debian does not carry, and the official image has them.
 * Mounting your own browser cache keeps the engine the installed Playwright expects:
 *
 * ```sh
 * docker run --rm --ipc=host -v "$(pwd)":/work -w /work \
 *   -v "$HOME/.cache/ms-playwright":/ms-cache:ro -e PLAYWRIGHT_BROWSERS_PATH=/ms-cache \
 *   mcr.microsoft.com/playwright:v1.62.1-noble \
 *   node tests/manual/motion-selection.mjs webkit
 * ```
 *
 * ## Reading it
 *
 * The fixture is two custom elements whose shadow roots stand in for a component: one
 * `@keyframes` of their own, two style queries on a choice named `--fx-hover`, an effect
 * named by `--fx-press`, a press under `:active`, and two animations, one whose duration
 * reads a token and one whose duration is a literal.
 *
 * - `s5-*` — the animation the inner box runs when its name is set outside: keyframes in
 *   the shadow root, keyframes only in the document, and a name nothing declares.
 * - `s6-*` — the `translate` a style query resolved to, with the choice made on the page, a
 *   region, a component type and an instance, then `none` and a name nobody offers.
 * - `s7-*` — animations running during and right after a 60ms press, twice. The first
 *   press ends at none, so one running during the second is a new start. Counting
 *   `animationstart` instead was measured to miss one in WebKit, on one run of two.
 * - `s2-*` — each animation's duration once the reader asks for less motion.
 *
 * ## What it cannot tell you
 *
 * Whether any of it reads well. It measures that a choice arrives, never which choices are
 * worth offering — that is what a prototype is for.
 */

import { chromium, firefox, webkit } from 'playwright';

const ENGINES = { chromium, firefox, webkit };

const FIXTURE = `<!doctype html>
<style>
    /* The package's collapse, mirrored: every duration token goes to 0.01ms. */
    @media (prefers-reduced-motion: reduce) {
        :root { --ui-duration-state: 0.01ms; }
    }

    /* Keyframes the document declares and no component's shadow root does. */
    @keyframes doc-only { from { opacity: 0.2 } to { opacity: 1 } }

    /* One choice, made at four scopes; the fourth is on the instance itself. */
    :root { --fx-hover: lift; }
    #region { --fx-hover: sink; }
    fx-other { --fx-hover: sink; }
</style>
<script type="module">
    const sheet = \`
        :host { display: inline-block; margin: 4px; }
        @keyframes fx-pulse { from { opacity: 0.2 } to { opacity: 1 } }
        .box { display: block; inline-size: 40px; block-size: 40px; background: teal; }
        .box.named { animation-name: var(--fx-press, none); animation-duration: 10s; }
        @container style(--fx-hover: lift) { .box { translate: 0 -2px; } }
        @container style(--fx-hover: sink) { .box { translate: 0 2px; } }
        @container style(--fx-tap: pulse) { .box.tap:active { animation: fx-pulse 300ms; } }
        .box.tokened { animation: fx-pulse var(--ui-duration-state, 150ms) infinite; }
        .box.literal { animation: fx-pulse 10s infinite; }
    \`;

    for (const name of ['fx-box', 'fx-other']) {
        customElements.define(name, class extends HTMLElement {
            constructor() {
                super();
                this.attachShadow({ mode: 'open' }).innerHTML =
                    \`<style>\${sheet}</style><div class="box \${this.getAttribute('box') ?? ''}"></div>\`;
            }
        });
    }
</script>
<fx-box id="s5-inner" box="named" style="--fx-press: fx-pulse"></fx-box>
<fx-box id="s5-doc" box="named" style="--fx-press: doc-only"></fx-box>
<fx-box id="s5-unknown" box="named" style="--fx-press: wobble"></fx-box>
<fx-box id="s6-page"></fx-box>
<section id="region"><fx-box id="s6-region"></fx-box></section>
<fx-other id="s6-type"></fx-other>
<fx-box id="s6-instance" style="--fx-hover: none"></fx-box>
<fx-box id="s6-unknown" style="--fx-hover: wobble"></fx-box>
<fx-box id="s7" box="tap" style="--fx-tap: pulse"></fx-box>
<fx-box id="s2-tokened" box="tokened"></fx-box>
<fx-box id="s2-literal" box="literal"></fx-box>`;

for (const name of process.argv.slice(2)) {
    const browser = await ENGINES[name].launch();
    const page = await browser.newPage();
    await page.setContent(FIXTURE);
    await page.waitForFunction(() => customElements.get('fx-other') !== undefined);

    /** The box inside one element's shadow root. */
    const inner = (id) =>
        page.evaluateHandle(
            (id) => document.getElementById(id).shadowRoot.querySelector('.box'),
            id,
        );
    const results = { engine: `${name} ${browser.version()}` };

    for (const id of ['s5-inner', 's5-doc', 's5-unknown']) {
        results[id] = await (
            await inner(id)
        ).evaluate(
            (box) =>
                box
                    .getAnimations()
                    .map((a) => a.animationName)
                    .join(',') || 'none',
        );
    }

    for (const id of ['s6-page', 's6-region', 's6-type', 's6-instance', 's6-unknown']) {
        results[id] = await (await inner(id)).evaluate((box) => getComputedStyle(box).translate);
    }

    const tap = await inner('s7');
    const bounds = await tap.boundingBox();
    /** Animations running during a press and right after it, as `during→after`. */
    const press = async (ms) => {
        await page.mouse.move(bounds.x + 20, bounds.y + 20);
        await page.mouse.down();
        await page.waitForTimeout(ms);
        const during = await tap.evaluate((box) => box.getAnimations().length);
        await page.mouse.up();
        const after = await tap.evaluate((box) => box.getAnimations().length);
        await page.waitForTimeout(400);
        return `${during}→${after}`;
    };
    results['s7-press'] = await press(60);
    results['s7-press-again'] = await press(60);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const id of ['s2-tokened', 's2-literal']) {
        results[id] = await (
            await inner(id)
        ).evaluate((box) => `${box.getAnimations()[0]?.effect.getComputedTiming().duration}ms`);
    }

    console.log(JSON.stringify(results, null, 1));
    await browser.close();
}

/**
 * What every story renders under.
 *
 * Three entries, and none of them is ordinary configuration.
 *
 * **The token sheet is here because without it the site shows the fallbacks rather than
 * the tokens.** Every component writes `var(--ui-token, fallback)`, and a fallback is a
 * bare literal — the `light-dark()` pairs live only in `tokenStyleSheet()`. So a playground
 * that inserts nothing renders what a page *without* the sheet renders, and the dark half
 * of this package could not be seen at all. Inserted the way a host inserts it, once, at
 * the root of the preview.
 *
 * **The scheme control is one CSS property, and that is RFC 0002 item 2 being spent.** A
 * ground carries both of its schemes in one `light-dark()` value under `color-scheme: light
 * dark`, so switching is `color-scheme` and nothing else: no class to swap, no attribute,
 * no second sheet, and no `@storybook/addon-themes` — which exists to do exactly the
 * swapping that decision removed. `globalTypes`, `initialGlobals` and the toolbar are core.
 *
 * **`.storybook/main.ts` says the configuration surface stays as small as RFC 0001 allows,
 * and this grows it.** The trade is stated rather than skipped: a component kit whose site
 * can only be seen in one of the two schemes it ships is showing half of itself.
 */

import { html, type TemplateResult } from 'lit';
import { tokenStyleSheet } from '../src/tokens.js';
import type { Preview } from '@storybook/web-components-vite';
import { ruleset } from '../tests/a11y-ruleset.js';

/**
 * The sheet a host inserts, built as an element rather than interpolated into a `<style>`
 * template — the content is this package's own output, and a node needs no exception made
 * for it. Lit takes no binding inside a `<style>` element anyway.
 *
 * Returned into the story's own subtree rather than appended to `document.head`, and that
 * placement is what keeps the suite honest: `tests/stories.ts` composes these annotations,
 * so a sheet in the head would outlive the story that carried it and quietly re-tune every
 * test that ran after. A rule reaches `:root` from wherever the `<style>` sits.
 */
function sheet(): HTMLStyleElement {
    const element = document.createElement('style');
    element.textContent = tokenStyleSheet();

    return element;
}

const preview: Preview = {
    globalTypes: {
        scheme: {
            description: 'Which colour scheme the preview renders under',
            toolbar: {
                title: 'Scheme',
                icon: 'mirror',
                // `light dark` rather than an empty value for *System*: it is what the
                // sheet already declares, so choosing it puts the preview back under the
                // reader's own setting rather than into a third state of its own.
                items: [
                    { value: 'light dark', title: 'System', icon: 'browser' },
                    { value: 'light', title: 'Light', icon: 'sun' },
                    { value: 'dark', title: 'Dark', icon: 'moon' },
                ],
                dynamicTitle: true,
            },
        },
    },

    initialGlobals: { scheme: 'light dark' },

    decorators: [
        (story, context): TemplateResult => {
            // On the root element rather than on a wrapper, because the preview's own
            // background is painted by the canvas and not by the story: a dark card on a
            // white page is not the dark scheme, it is half of it. `color-scheme` inherits,
            // so one write reaches every component below.
            document.documentElement.style.colorScheme = String(context.globals['scheme']);

            return html`${sheet()}${story()}`;
        },
    ],

    parameters: {
        a11y: {
            // One ruleset, two readers. `addon-a11y` takes the same axe `RunOptions` the
            // suite declares, so the constant is passed verbatim and there is nothing that
            // can drift.
            options: ruleset,

            // The suite is the gate; the panel only displays. Written down because the
            // failure it prevents is someone later turning the panel into a second gate
            // that can disagree with the first.
            //
            // The panel does report more than the gate blocks on: the addon has no impact
            // filter, so the `minor` and `moderate` violations `tests/a11y.ts` tolerates
            // show up here. Accepted rather than configured away — the alternative is
            // switching rules off one by one, which the ruleset refuses in writing.
            test: 'off',
        },
    },
};

export default preview;

/**
 * What every story renders under.
 *
 * Four entries, and none of them is ordinary configuration.
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
 * **The theme control is the scheme control's second axis**, which RFC 0003 asked for beside
 * it: a theme is the attribute `data-ui-theme`, written on the same root the scheme is, with
 * the theme's own block inserted where the token sheet is. A host does the same two things.
 *
 * **The reduced-motion control is the token sheet's own collapse, written out**, which RFC
 * 0004 put first in its rollout: the second state of every effect is the one easiest to ship
 * broken, because nobody sees it by accident. A page cannot set `prefers-reduced-motion`, so
 * the control does what the reader's setting does instead, and declares everything the
 * sheet's reduced-motion rule declares with the condition taken off. A script finds the
 * collapse in a value the collapse sets, never in the media query — the proposal's fifth
 * question — so it stands still under the control as it does under the setting.
 *
 * **`.storybook/main.ts` says the configuration surface stays as small as RFC 0001 allows,
 * and this grows it.** The trade is stated rather than skipped: a component kit whose site
 * can only be seen in one of the two schemes it ships is showing half of itself.
 */

import { html, nothing, type TemplateResult } from 'lit';
import { tokenStyleSheet } from '../src/tokens.js';
import { glass, matrix, themeStyleSheet, type Theme } from '../src/theme.js';
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

/** The themes the toolbar offers, by the value `data-ui-theme` takes for each. */
const themes: ReadonlyMap<string, Theme> = new Map([
    [matrix.name, matrix],
    [glass.name, glass],
]);

/** A shipped theme's block, built the way {@link sheet} builds the token sheet. */
function themed(theme: Theme): HTMLStyleElement {
    const element = document.createElement('style');
    element.textContent = themeStyleSheet(theme);

    return element;
}

/**
 * What the token sheet declares for a reader who asked for less motion, with the condition
 * taken off, built the way {@link sheet} builds the sheet itself.
 *
 * **Read out of the sheet rather than restated**, so the control collapses what the reader's
 * setting collapses and nothing else: every duration today, and whatever the collapse grows
 * to — RFC 0004 widens it to a loop's count — with no second list here to fall out of step.
 * The rule is found by its condition rather than by its place in the sheet, and a sheet
 * without one throws: a control that quietly collapsed nothing would show the very motion it
 * exists to take away.
 */
function reduced(): HTMLStyleElement {
    const parsed = new CSSStyleSheet();
    parsed.replaceSync(tokenStyleSheet());

    const rule = [...parsed.cssRules].find(
        (candidate): candidate is CSSMediaRule =>
            candidate instanceof CSSMediaRule &&
            candidate.conditionText === '(prefers-reduced-motion: reduce)',
    );

    if (rule === undefined) {
        throw new Error('the token sheet carries no rule for prefers-reduced-motion');
    }

    const element = document.createElement('style');
    element.textContent = [...rule.cssRules].map((inner) => inner.cssText).join('\n');

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
        theme: {
            description: 'Which shipped theme the preview renders under',
            toolbar: {
                title: 'Theme',
                icon: 'paintbrush',
                // An empty value for the default palette, which is no theme at all: the
                // attribute is removed rather than set to a name nothing selects.
                items: [
                    { value: '', title: 'Default' },
                    { value: matrix.name, title: 'Matrix' },
                    { value: glass.name, title: 'Glass' },
                ],
                dynamicTitle: true,
            },
        },
        motion: {
            description: 'Whether the preview renders as for a reader who asked for less motion',
            toolbar: {
                title: 'Motion',
                icon: 'lightning',
                // An empty value for the reader's own setting, which writes nothing and leaves
                // it in force, as the scheme's *System* does. Named apart from that one, since
                // the toolbar shows the chosen title and two buttons reading *System* side by
                // side would say nothing. No item turns the motion back on over a reader who
                // asked for less: it would undo their setting, and the first item already shows
                // it to every reader who did not.
                items: [
                    { value: '', title: 'System motion', icon: 'lightning' },
                    { value: 'reduce', title: 'Reduced motion', icon: 'lightningoff' },
                ],
                dynamicTitle: true,
            },
        },
    },

    initialGlobals: { scheme: 'light dark', theme: '', motion: '' },

    decorators: [
        (story, context): TemplateResult => {
            // On the root element rather than on a wrapper, because the preview's own
            // background is painted by the canvas and not by the story: a dark card on a
            // white page is not the dark scheme, it is half of it. `color-scheme` inherits,
            // so one write reaches every component below.
            document.documentElement.style.colorScheme = String(context.globals['scheme']);

            // On the root too, and removed rather than left behind: `tests/stories.ts`
            // composes these annotations, so an attribute a story left would theme every
            // test that ran after it.
            const theme = themes.get(String(context.globals['theme']));

            if (theme === undefined) {
                delete document.documentElement.dataset['uiTheme'];
            } else {
                document.documentElement.dataset['uiTheme'] = theme.name;
            }

            // In the story rather than on the root, which the collapse needs no more than the
            // token sheet does, so it goes with the story that carried it. Last of the three,
            // since at equal specificity the later rule wins.
            const palette = theme === undefined ? nothing : themed(theme);
            const motion = String(context.globals['motion']) === 'reduce' ? reduced() : nothing;

            return html`${sheet()}${palette}${motion}${story()}`;
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

/**
 * The design tokens, rendered.
 *
 * Not the mirror being forced onto a module that has no component: there is currently no
 * way to *see* the palette at all, and a table of hex strings in `docs/tokens.md` is not
 * seeing it.
 *
 * Every sample below is drawn with `var(--ui-token, fallback)` — the same reference every
 * component writes — rather than with the constant. So the page shows what a page would
 * actually render, and a host override reaches these swatches exactly as it reaches a
 * button. For a derived name that is the only way to show it at all: it has no value to
 * print, only a formula that resolves where it is used.
 */

import '@rak200/ui';
import {
    defaults,
    derivedTokens,
    formulas,
    tokens,
    tokenStyleSheet,
    type DerivedToken,
    type Token,
} from '@rak200/ui';
import { html, type TemplateResult } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

/** The token doing its own job, which is a different demonstration per category. */
function sample(token: Token | DerivedToken, value: string): TemplateResult {
    if (token.startsWith('--ui-color-')) {
        return html`<span
            class="box"
            data-token=${token}
            style="background: ${value}"
            aria-hidden="true"
        ></span>`;
    }

    if (token.startsWith('--ui-duration-')) {
        return html`<span
            class="timing"
            data-token=${token}
            style="transition-duration: ${value}"
            aria-hidden="true"
        ></span>`;
    }

    if (token.startsWith('--ui-easing-')) {
        return html`<span
            class="timing slow"
            data-token=${token}
            style="transition-timing-function: ${value}"
            aria-hidden="true"
        ></span>`;
    }

    if (token === '--ui-radius') {
        return html`<span
            class="box ruled"
            data-token=${token}
            style="border-radius: ${value}"
            aria-hidden="true"
        ></span>`;
    }

    if (token === '--ui-space') {
        return html`<span
            class="ruled"
            data-token=${token}
            style="padding: ${value}"
            aria-hidden="true"
            >·</span
        >`;
    }

    return html`<span data-token=${token} style="font-family: ${value}">Ag</span>`;
}

/**
 * The styling both tables share.
 *
 * A bar that grows while its row is hovered is the only honest way to render a duration or
 * a curve: printing `150ms` shows the string, not the speed.
 */
const tableStyles = html`
    <style>
        .tokens {
            border-collapse: collapse;
            font-family: system-ui, sans-serif;
        }

        .tokens th,
        .tokens td {
            border-bottom: 1px solid #d1d5db;
            padding: 0.5rem 1rem;
            text-align: left;
        }

        .box {
            display: inline-block;
            block-size: 1.5rem;
            inline-size: 3rem;
        }

        .ruled {
            border: 1px solid #1f2937;
        }

        .timing {
            display: inline-block;
            background: #1f2937;
            block-size: 1.5rem;
            inline-size: 1.5rem;
            transition-property: inline-size;
            transition-timing-function: linear;
        }

        .timing.slow {
            transition-duration: 1s;
        }

        .tokens tr:hover .timing {
            inline-size: 6rem;
        }
    </style>
`;

const meta: Meta = {
    title: 'Tokens/Design tokens',

    render: (): TemplateResult => html`
        ${tableStyles}
        <table class="tokens">
            <caption>
                The default value of every ground token this package defines. Hover a row to see a
                duration or a curve run.
            </caption>
            <thead>
                <tr>
                    <th scope="col">Token</th>
                    <th scope="col">Default</th>
                    <th scope="col">Rendered</th>
                </tr>
            </thead>
            <tbody>
                ${tokens.map(
                    (token) => html`
                        <tr>
                            <th scope="row"><code>${token}</code></th>
                            <td><code>${defaults[token]}</code></td>
                            <td>${sample(token, `var(${token}, ${defaults[token]})`)}</td>
                        </tr>
                    `,
                )}
            </tbody>
        </table>
    `,
};

export default meta;

/** The palette as it ships, before a host has decided anything. */
export const Defaults: StoryObj = {};

/**
 * The roles that have no value of their own.
 *
 * The *Computes* column is the whole of the mechanism: a derived name is a formula living
 * in the `var()` fallback at the point of use, so it resolves against whatever grounds are
 * in force *there*. Nothing here is declared anywhere — override one and every component
 * follows, read one back and there is nothing to read.
 */
export const Derived: StoryObj = {
    render: (): TemplateResult => html`
        ${tableStyles}
        <table class="tokens">
            <caption>
                Every derived role, its formula, and what that formula resolves to here.
            </caption>
            <thead>
                <tr>
                    <th scope="col">Token</th>
                    <th scope="col">Computes</th>
                    <th scope="col">Rendered</th>
                </tr>
            </thead>
            <tbody>
                ${derivedTokens.map(
                    (token) => html`
                        <tr>
                            <th scope="row"><code>${token}</code></th>
                            <td><code>${formulas[token]}</code></td>
                            <td>${sample(token, `var(${token}, ${formulas[token]})`)}</td>
                        </tr>
                    `,
                )}
            </tbody>
        </table>
    `,
};

/**
 * The sheet a host inserts, built as an element rather than interpolated into a `<style>`
 * template — the content is this package's own output, and a node needs no exception made
 * for it. Lit takes no binding inside a `<style>` element anyway.
 */
function sheet(): HTMLStyleElement {
    const element = document.createElement('style');
    element.textContent = tokenStyleSheet();

    return element;
}

/** A button, a field and the derived swatches, which is what a panel below shows. */
function panel(scheme: 'light' | 'dark'): TemplateResult {
    return html`
        <div class="panel" style="color-scheme: ${scheme}">
            <p>Every value here is the ${scheme} branch of one <code>light-dark()</code> pair.</p>
            <div class="row">
                <ui-button>Save</ui-button>
                <ui-button variant="secondary">Cancel</ui-button>
            </div>
            <ui-field>
                <label slot="label">Amount</label>
                <input type="number" />
                <span slot="help">In BRL, two decimals.</span>
                <span slot="error">Amount is required.</span>
            </ui-field>
            <div class="row">
                ${derivedTokens
                    .filter((token) => token.startsWith('--ui-color-'))
                    .map((token) => sample(token, `var(${token}, ${formulas[token]})`))}
            </div>
        </div>
    `;
}

const panelStyles = html`
    <style>
        .panel {
            background: var(--ui-color-surface);
            color: var(--ui-color-text);
            display: flex;
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
            padding: 1.5rem;
        }

        .row {
            display: flex;
            gap: 0.5rem;
            align-items: center;
        }

        .box {
            display: inline-block;
            block-size: 1.5rem;
            inline-size: 3rem;
        }
    </style>
`;

/**
 * The same tokens, rendered dark.
 *
 * **Nothing here restates a value.** `tokenStyleSheet()` declares each ground as
 * `light-dark(light, dark)` and the wrapper declares `color-scheme: dark`, so the browser
 * picks the branch — which is the whole of the mechanism, shown rather than described. A
 * scheme is not a theme: no `data-ui-theme` appears anywhere in this story.
 *
 * It carries a button and a field beside the swatches on purpose. A palette proves the
 * values resolve; only a rendered component proves they are legible, and the accessibility
 * bar reaches this story exactly as it reaches every other one.
 */
export const DarkScheme: StoryObj = {
    render: (): TemplateResult => html` ${sheet()}${panelStyles} ${panel('dark')} `,
};

/**
 * The other axis: a whole theme, in both of its schemes.
 *
 * **A theme is four grounds and nothing else.** The block below redeclares `surface`,
 * `text`, `accent` and its contrast — and border, hover and pressed follow into both
 * schemes on their own, because each of those is a formula that resolves against the
 * grounds in force where it is used rather than a value frozen at `:root`. The swatches on
 * each panel are the evidence: nothing restates them, and they are purple here.
 *
 * A second theme is a second contrast obligation, which is why this is a story rather than
 * a paragraph — `expectAccessible` reaches what renders, and a theme without a story is
 * outside the bar this repository advertises.
 */
export const Theme: StoryObj = {
    render: (): TemplateResult => html`
        ${sheet()}${panelStyles}
        <style>
            [data-ui-theme='brand'] {
                --ui-color-surface: light-dark(#faf5ff, #1a0b2e);
                --ui-color-text: light-dark(#3b0764, #f3e8ff);
                --ui-color-accent: light-dark(#7e22ce, #c084fc);
                --ui-color-accent-contrast: light-dark(#ffffff, #1a0b2e);
            }
        </style>
        <div data-ui-theme="brand" class="theme">${panel('light')}${panel('dark')}</div>
    `,
};

/**
 * The design tokens, rendered.
 *
 * Not the mirror being forced onto a module that has no component: there is currently no
 * way to *see* the palette at all, and a table of nine hex strings in `docs/tokens.md` is
 * not seeing it.
 *
 * Every sample below is drawn with `var(--ui-token, default)` — the same reference every
 * component writes — rather than with the constant. So the page shows what a page would
 * actually render, and a host override reaches these swatches exactly as it reaches a
 * button.
 */

import { defaults, tokens, type Token } from '@rak200/ui';
import { html, type TemplateResult } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

/** The token doing its own job, which is a different demonstration per category. */
function sample(token: Token): TemplateResult {
    const value = `var(${token}, ${defaults[token]})`;

    if (token.startsWith('--ui-color-')) {
        return html`<span class="box" style="background: ${value}" aria-hidden="true"></span>`;
    }

    if (token === '--ui-radius') {
        return html`<span
            class="box ruled"
            style="border-radius: ${value}"
            aria-hidden="true"
        ></span>`;
    }

    if (token === '--ui-space') {
        return html`<span class="ruled" style="padding: ${value}" aria-hidden="true">·</span>`;
    }

    return html`<span style="font-family: ${value}">Ag</span>`;
}

const meta: Meta = {
    title: 'Tokens/Design tokens',

    render: (): TemplateResult => html`
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
        </style>

        <table class="tokens">
            <caption>
                The default value of every token this package defines.
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
                            <td>${sample(token)}</td>
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

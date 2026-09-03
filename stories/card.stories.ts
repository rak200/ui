/**
 * `<ui-card>`, one story per thing a reader would go looking for.
 *
 * What a card is for — and what it is deliberately not — is in `docs/card.md`, which CI
 * checks and a consumer opens first. This file shows the component; it does not describe
 * it.
 *
 * **Every story writes its own content**, headings included, because that is the point of
 * the element: what a card *means* is the host's, and this one carries the surface.
 */

// Two lines for one module, and the split is forced: `verbatimModuleSyntax` erases a
// type-only import whole, so a lone `import type` would drop the side effect that
// registers the elements and the tags below would never upgrade.
import '@rak200/ui';
import { html, type TemplateResult } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface CardArgs {
    heading: string;
    body: string;
}

const meta: Meta<CardArgs> = {
    title: 'Components/ui-card',

    // `argTypes` carry control affordance, not documentation: a name and a control type,
    // so the panel works and nothing more. A `description` here would start the second API
    // surface this playground exists without.
    argTypes: {
        heading: { control: 'text' },
        body: { control: 'text' },
    },

    args: {
        heading: 'Monthly plan',
        body: 'Everything in the free tier, plus priority support and a shared inbox.',
    },

    render: ({ heading, body }): TemplateResult => html`
        <ui-card style="max-inline-size: 24rem">
            <h3 slot="header" style="margin: 0">${heading}</h3>
            <p style="margin: 0">${body}</p>
            <div slot="footer"><ui-button>Choose</ui-button></div>
        </ui-card>
    `,
};

export default meta;

/** The ordinary case: all three regions filled. */
export const Card: StoryObj<CardArgs> = {};

/**
 * Body only, which is what most cards are.
 *
 * The regions are slots and an unfilled slot contributes no box, so this draws no space
 * where a header and a footer would have been.
 */
export const BodyOnly: StoryObj<CardArgs> = {
    render: ({ body }): TemplateResult => html`
        <ui-card style="max-inline-size: 24rem"><p style="margin: 0">${body}</p></ui-card>
    `,
};

/**
 * The regions render in the order the element declares, not the order they were written.
 *
 * The footer is first in this markup and last on the screen — which is the second thing a
 * named slot buys, after the alignment below.
 */
export const OutOfOrder: StoryObj<CardArgs> = {
    render: ({ heading, body }): TemplateResult => html`
        <ui-card style="max-inline-size: 24rem">
            <div slot="footer"><ui-button variant="secondary">Choose</ui-button></div>
            <p style="margin: 0">${body}</p>
            <h3 slot="header" style="margin: 0">${heading}</h3>
        </ui-card>
    `,
};

/**
 * A row of them, which is where the footer slot earns its keep.
 *
 * The bodies are different lengths and the buttons still line up: the footer is pushed to
 * the bottom of whatever height the row settled on, rather than sitting under its own
 * paragraph.
 */
export const Row: StoryObj<CardArgs> = {
    render: (): TemplateResult => {
        const card = (heading: string, body: string): TemplateResult => html`
            <ui-card>
                <h3 slot="header" style="margin: 0">${heading}</h3>
                <p style="margin: 0">${body}</p>
                <div slot="footer"><ui-button>Choose</ui-button></div>
            </ui-card>
        `;

        return html`
            <div style="display: grid; grid-template-columns: repeat(3, 16rem); gap: 1rem">
                ${card('Free', 'One project.')}
                ${card('Monthly', 'Everything in the free tier, plus priority support.')}
                ${card('Yearly', 'Two months off, and a shared inbox your whole team reads.')}
            </div>
        `;
    },
};

/**
 * A card that is a link, which is how a clickable card is written.
 *
 * `<ui-card>` grows no `clickable` attribute: the first thing one would have to do is
 * reimplement keyboard activation, the accessible name and the focus ring that an `<a>`
 * carries already. So the anchor goes *inside*, over the part that is actually the target.
 */
export const WithLink: StoryObj<CardArgs> = {
    render: ({ heading, body }): TemplateResult => html`
        <ui-card style="max-inline-size: 24rem">
            <h3 slot="header" style="margin: 0">
                <a href="#monthly">${heading}</a>
            </h3>
            <p style="margin: 0">${body}</p>
        </ui-card>
    `,
};

/**
 * `<ui-table>`, one story per thing a reader would go looking for.
 *
 * What the element is for — and what it deliberately is not — is in `docs/table.md`, which
 * CI checks and a consumer opens first. This file shows the component; it does not
 * describe it.
 *
 * **Every story writes its own `<table>`**, because that is the point of the element: the
 * markup is the host's and this one carries the surface around it.
 */

// Two lines for one module, and the split is forced: `verbatimModuleSyntax` erases a
// type-only import whole, so a lone `import type` would drop the side effect that
// registers the elements and the tags below would never upgrade.
import '@rak200/ui';
import { html, type TemplateResult } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface Invoice {
    readonly number: string;
    readonly client: string;
    readonly total: string;
}

interface TableArgs {
    caption: string;
    rows: readonly Invoice[];
}

const invoices: readonly Invoice[] = [
    { number: '0001', client: 'Papelaria Aurora', total: 'R$ 1.200,00' },
    { number: '0002', client: 'Marcenaria Vale', total: 'R$ 840,50' },
    { number: '0003', client: 'Café da Esquina', total: 'R$ 2.310,00' },
    { number: '0004', client: 'Studio Bergamota', total: 'R$ 96,00' },
];

/** The rows, written the way a host writes them — no data goes in, no markup comes out. */
function body(rows: readonly Invoice[]): TemplateResult {
    return html`
        <tbody>
            ${rows.map(
                (row) => html`
                    <tr>
                        <td>${row.number}</td>
                        <td>${row.client}</td>
                        <td data-ui-numeric>${row.total}</td>
                    </tr>
                `,
            )}
        </tbody>
    `;
}

const meta: Meta<TableArgs> = {
    title: 'Components/ui-table',

    // `argTypes` carry control affordance, not documentation: a name and a control type,
    // so the panel works and nothing more. A `description` here would start the second API
    // surface this playground exists without.
    argTypes: {
        caption: { control: 'text' },
    },

    args: {
        caption: 'Every invoice raised this quarter.',
        rows: invoices,
    },

    render: ({ caption, rows }): TemplateResult => html`
        <ui-table>
            <table>
                <caption>
                    ${caption}
                </caption>
                <thead>
                    <tr>
                        <th scope="col">Number</th>
                        <th scope="col">Client</th>
                        <th scope="col" data-ui-numeric>Total</th>
                    </tr>
                </thead>
                ${body(rows)}
            </table>
        </ui-table>
    `,
};

export default meta;

/** The ordinary case: a caption, a header, striped rows, and one column the host marks numeric. */
export const Table: StoryObj<TableArgs> = {};

/**
 * No caption, which is the common shape when a heading above the table already says what
 * it is.
 *
 * The element is still named, because a scrollable region wants a name and the caption was
 * never where this one came from.
 */
export const NoCaption: StoryObj<TableArgs> = {
    render: ({ rows }): TemplateResult => html`
        <ui-table>
            <table>
                <thead>
                    <tr>
                        <th scope="col">Number</th>
                        <th scope="col">Client</th>
                        <th scope="col" data-ui-numeric>Total</th>
                    </tr>
                </thead>
                ${body(rows)}
            </table>
        </ui-table>
    `,
};

/**
 * Wider than the space it is given, which is what the scrolling is for.
 *
 * The element is the scroll container, and it takes a tab stop while its table overflows,
 * so a reader with no pointer can still reach the columns off the edge — WCAG 2.1.1.
 */
export const Scrolling: StoryObj<TableArgs> = {
    render: ({ rows }): TemplateResult => html`
        <ui-table style="max-inline-size: 20rem">
            <table>
                <thead>
                    <tr>
                        <th scope="col">Number</th>
                        <th scope="col">Client</th>
                        <th scope="col">Raised</th>
                        <th scope="col">Due</th>
                        <th scope="col" data-ui-numeric>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(
                        (row) => html`
                            <tr>
                                <td>${row.number}</td>
                                <td>${row.client}</td>
                                <td>12/08/2026</td>
                                <td>11/09/2026</td>
                                <td data-ui-numeric>${row.total}</td>
                            </tr>
                        `,
                    )}
                </tbody>
            </table>
        </ui-table>
    `,
};

/**
 * A row header as well as a column one, which is what `scope` is for.
 *
 * Nothing here is this element's doing — the styling reaches every `th` the same way, and
 * what the cell *means* stays in the markup the host wrote.
 */
export const RowHeaders: StoryObj<TableArgs> = {
    render: ({ rows }): TemplateResult => html`
        <ui-table>
            <table>
                <thead>
                    <tr>
                        <th scope="col">Number</th>
                        <th scope="col">Client</th>
                        <th scope="col" data-ui-numeric>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(
                        (row) => html`
                            <tr>
                                <th scope="row">${row.number}</th>
                                <td>${row.client}</td>
                                <td data-ui-numeric>${row.total}</td>
                            </tr>
                        `,
                    )}
                </tbody>
            </table>
        </ui-table>
    `,
};

/**
 * Numeric columns, each cell and its header marked `data-ui-numeric`: to the end in tabular
 * figures, so the amounts line up by their places, and to the end right to left as well, which is
 * the left.
 */
export const NumericColumns: StoryObj<TableArgs> = {
    render: ({ rows }): TemplateResult => {
        const priced = (direction: 'ltr' | 'rtl'): TemplateResult => html`
            <ui-table dir=${direction}>
                <table>
                    <thead>
                        <tr>
                            <th scope="col">Client</th>
                            <th scope="col" data-ui-numeric>Items</th>
                            <th scope="col" data-ui-numeric>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map(
                            (row, place) => html`
                                <tr>
                                    <td>${row.client}</td>
                                    <td data-ui-numeric>${String(3 + place * 7)}</td>
                                    <td data-ui-numeric>${row.total}</td>
                                </tr>
                            `,
                        )}
                    </tbody>
                </table>
            </ui-table>
        `;

        return html`<div style="display: grid; gap: 1.5rem">
            ${priced('ltr')} ${priced('rtl')}
        </div>`;
    },
};

/**
 * A header and a first column that stick: the box is given a height, so it scrolls down and its
 * header stays at its top, and `sticky-column` keeps the column that names each row at its start as
 * it scrolls sideways, the corner at both.
 */
export const StickyHeaderAndColumn: StoryObj<TableArgs> = {
    render: ({ caption, rows }): TemplateResult => html`
        <ui-table sticky-column style="max-inline-size: 28rem; max-block-size: 14rem">
            <table style="inline-size: 48rem">
                <caption>
                    ${caption}
                </caption>
                <thead>
                    <tr>
                        <th scope="col">Client</th>
                        <th scope="col">Number</th>
                        <th scope="col">Issued</th>
                        <th scope="col">Due</th>
                        <th scope="col" data-ui-numeric>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${[...rows, ...rows, ...rows].map(
                        (row, place) => html`
                            <tr>
                                <th scope="row">${row.client}</th>
                                <td>${row.number}</td>
                                <td>2026-0${String(1 + (place % 9))}-01</td>
                                <td>2026-0${String(1 + ((place + 1) % 9))}-15</td>
                                <td data-ui-numeric>${row.total}</td>
                            </tr>
                        `,
                    )}
                </tbody>
            </table>
        </ui-table>
    `,
};

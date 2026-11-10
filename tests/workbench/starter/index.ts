/**
 * The starter page's script: what a page of these components does that its markup cannot — data
 * in the table, a dialog opened and closed, a toast raised, and the form sent.
 */

import '@rak200/ui';
import '@rak200/ui/icons/check.js';
import '@rak200/ui/icons/search.js';
import '@rak200/ui/icons/trash-2.js';
import type { UiDialog } from '@rak200/ui';

/** The table's rows, as a page would have them from somewhere. */
const invoices = [
    { number: '0042', client: 'Acme', total: 1200 },
    { number: '0043', client: 'Globex', total: 310.5 },
    { number: '0044', client: 'Initech', total: 87 },
] as const;

const body = document.querySelector('#invoices tbody');

for (const invoice of invoices) {
    const row = document.createElement('tr');

    for (const [value, end] of [
        [invoice.number, false],
        [invoice.client, false],
        [invoice.total.toLocaleString('en', { style: 'currency', currency: 'BRL' }), true],
    ] as const) {
        const cell = document.createElement('td');
        cell.textContent = value;

        if (end) {
            cell.style.textAlign = 'end';
        }

        row.append(cell);
    }

    body?.append(row);
}

const dialog = document.querySelector<UiDialog>('#confirm');

document.querySelector('#open')?.addEventListener('click', () => {
    dialog?.show();
});

for (const action of document.querySelectorAll('#confirm [slot="actions"]')) {
    action.addEventListener('click', () => {
        dialog?.close();
    });
}

// A `ui-button` does not submit the form it sits in: the button it draws lies in its shadow
// root, where it has no form owner. So the page sends the form itself.
document.querySelector('#send')?.addEventListener('click', () => {
    document.querySelector<HTMLFormElement>('#transfer')?.requestSubmit();
});

document.querySelector('#discard')?.addEventListener('click', () => {
    document.querySelector<HTMLFormElement>('#transfer')?.reset();
});

document.querySelector('#toast')?.addEventListener('click', () => {
    const toast = document.createElement('ui-toast');
    toast.setAttribute('variant', 'success');
    toast.textContent = 'Transfer sent.';
    document.querySelector('ui-toaster')?.append(toast);
});

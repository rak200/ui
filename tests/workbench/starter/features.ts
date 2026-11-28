/**
 * The features page's script: what its markup cannot do — the ledger's rows, the alert opened and
 * closed, the answer a dialog's form gave, and the toasts raised, one with a heading and one with
 * an action. The dialogs opened from markup take none of it.
 */

import '@rak200/ui';
import '@rak200/ui/icons/arrow-right.js';
import '@rak200/ui/icons/bold.js';
import '@rak200/ui/icons/copy.js';
import '@rak200/ui/icons/italic.js';
import '@rak200/ui/icons/search.js';
import '@rak200/ui/icons/underline.js';
import type { UiDialog, UiToast } from '@rak200/ui';

/** The ledger's clients, as a page would have them from somewhere. */
const clients = ['Acme', 'Globex', 'Initech', 'Umbrella', 'Hooli', 'Stark'] as const;

const ledger = document.querySelector('#ledger tbody');

for (let at = 0; at < 18; at += 1) {
    const row = document.createElement('tr');
    const client = document.createElement('th');

    client.scope = 'row';
    client.textContent = clients[at % clients.length] ?? '';
    row.append(client);

    const month = String(1 + (at % 9));
    const total = ((at * 137) % 4000) + 85.5;

    for (const [value, numeric] of [
        [String(4200 + at), false],
        [`2026-0${month}-01`, false],
        [`2026-0${month}-28`, false],
        [total.toLocaleString('en', { style: 'currency', currency: 'BRL' }), true],
    ] as const) {
        const cell = document.createElement('td');

        cell.textContent = value;
        cell.toggleAttribute('data-ui-numeric', numeric);
        row.append(cell);
    }

    ledger?.append(row);
}

/** Raises a toast, with a heading or an action where one is given. */
function raise(
    variant: string,
    message: string,
    extra?: { readonly heading?: string; readonly action?: string },
): UiToast {
    const toast = document.createElement('ui-toast');

    toast.setAttribute('variant', variant);

    if (extra?.heading !== undefined) {
        const heading = document.createElement('strong');

        heading.slot = 'heading';
        heading.textContent = extra.heading;
        toast.append(heading);
    }

    toast.append(message);

    if (extra?.action !== undefined) {
        const action = document.createElement('button');

        action.type = 'button';
        action.slot = 'action';
        action.textContent = extra.action;
        toast.append(action);
    }

    document.querySelector('ui-toaster')?.append(toast);

    return toast;
}

document.querySelector('#headed')?.addEventListener('click', () => {
    raise('success', 'It is on its way to Acme, and a copy is in your outbox.', {
        heading: 'Invoice sent',
    });
});

document.querySelector('#undoable')?.addEventListener('click', () => {
    const toast = raise('info', 'Invoice 4207 deleted.', { action: 'Undo' });

    toast.querySelector('[slot="action"]')?.addEventListener('click', () => {
        toast.dismiss();
        raise('success', 'Invoice 4207 is back.');
    });
});

document.querySelector('#copy')?.addEventListener('click', () => {
    navigator.clipboard.writeText('3f9a-77c2').then(
        () => {
            raise('success', 'The token is copied.');
        },
        () => {
            raise('warning', 'The clipboard refused the token.');
        },
    );
});

document.querySelector('#compare')?.addEventListener('click', () => {
    raise('info', 'Compared with last month: 4% more.');
});

const alerting = document.querySelector<UiDialog>('#alert');

document.querySelector('#alarm')?.addEventListener('click', () => {
    alerting?.show();
});

for (const action of document.querySelectorAll('#alert [slot="actions"]')) {
    action.addEventListener('click', () => {
        alerting?.close();
    });
}

const leaving = document.querySelector<UiDialog>('#by-its-form');

leaving?.addEventListener('ui-close', () => {
    const answer = document.querySelector('#answer');

    if (answer !== null) {
        answer.textContent = `The form answered ${leaving.returnValue}.`;
    }
});

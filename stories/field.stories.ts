/**
 * `<ui-field>`, whose whole product is invisible: the ids, the `for`, the
 * `aria-describedby` and the `aria-invalid` it writes onto a control it does not own.
 *
 * So the stories are its states rather than its looks. Each one renders different markup,
 * which is exactly the condition `expectAccessible` attaches its per-state obligation to.
 */

// See `button.ts`: the bare import is what registers the element, and a type-only import
// would be erased before it could.
import '@rak200/ui';
import { html, nothing, type TemplateResult } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface FieldArgs {
    label: string;
    help: string;
    error: string;
}

const meta: Meta<FieldArgs> = {
    title: 'Components/ui-field',

    argTypes: {
        label: { control: 'text' },
        help: { control: 'text' },
        error: { control: 'text' },
    },

    args: { label: 'Amount', help: '', error: '' },

    // Empty text renders no element at all, rather than an empty one. The component reads
    // an empty describer as absent either way, and a control that never had the element is
    // the honest shape of "no error yet".
    render: ({ label, help, error }): TemplateResult => html`
        <ui-field>
            <label slot="label">${label}</label>
            <input type="number" />
            ${help === '' ? nothing : html`<span slot="help">${help}</span>`}
            ${error === '' ? nothing : html`<span slot="error">${error}</span>`}
        </ui-field>
    `,
};

export default meta;

/** A label and a control, associated — the least the component ever does. */
export const Default: StoryObj<FieldArgs> = {};

/** Help text, described by the control rather than merely sitting near it. */
export const WithHelp: StoryObj<FieldArgs> = {
    args: { help: 'In BRL, two decimals.' },
};

/**
 * In error, and with the help kept.
 *
 * The error is announced first and the help stays: help text is usually the format
 * requirement, which is the suggestion the user needs in order to recover.
 */
export const WithError: StoryObj<FieldArgs> = {
    args: { help: 'In BRL, two decimals.', error: 'Amount is required.' },
};

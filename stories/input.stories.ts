/**
 * `<ui-input>` and `<ui-textarea>`, one story per thing a reader would go looking for.
 *
 * What the wrapper owns and what the control owns is in `docs/input.md`, which CI checks
 * and a consumer opens first. This file shows the components; it does not describe them.
 *
 * **Every story writes the native control by hand**, and that is the demonstration rather
 * than boilerplate: the control is the host's, it stays in the light DOM where the label
 * and the description can resolve against it, and its attributes are the platform's.
 */

// Two lines for one module, and the split is forced: `verbatimModuleSyntax` erases a
// type-only import whole, so a lone `import type` would drop the side effect that
// registers the elements and the tags below would never upgrade.
import '@rak200/ui';
import { html, type TemplateResult } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface InputArgs {
    label: string;
    help: string;
    placeholder: string;
    disabled: boolean;
}

const meta: Meta<InputArgs> = {
    title: 'Components/ui-input',

    // `argTypes` carry control affordance, not documentation: a name and a control type,
    // so the panel works and nothing more. A `description` here would start the second API
    // surface this playground exists without.
    argTypes: {
        label: { control: 'text' },
        help: { control: 'text' },
        placeholder: { control: 'text' },
        disabled: { control: 'boolean' },
    },

    args: {
        label: 'Amount',
        help: 'In BRL, two decimals.',
        placeholder: '0,00',
        disabled: false,
    },

    render: ({ label, help, placeholder, disabled }): TemplateResult => html`
        <ui-field>
            <label slot="label">${label}</label>
            <ui-input>
                <input type="text" name="amount" placeholder=${placeholder} ?disabled=${disabled} />
            </ui-input>
            <span slot="help">${help}</span>
        </ui-field>
    `,
};

export default meta;

/** The ordinary case: a labelled text field with help under it. */
export const Text: StoryObj<InputArgs> = {};

/** The same wiring around a `<textarea>`, which starts taller and resizes vertically. */
export const Multiline: StoryObj<InputArgs> = {
    args: { label: 'Notes', help: 'Anything the invoice should carry.', placeholder: '' },
    render: ({ label, help }): TemplateResult => html`
        <ui-field>
            <label slot="label">${label}</label>
            <ui-textarea><textarea name="notes" rows="3"></textarea></ui-textarea>
            <span slot="help">${help}</span>
        </ui-field>
    `,
};

/**
 * In error, and nothing here says so twice.
 *
 * The red boundary is not set by this story or by the wrapper: `ui-field` marks the
 * control `aria-invalid` as part of the wiring it already owns, and the box reads that.
 * One source, and it is the one a screen reader is already using — so the message and the
 * border cannot disagree.
 */
export const Invalid: StoryObj<InputArgs> = {
    render: ({ label, help, placeholder }): TemplateResult => html`
        <ui-field>
            <label slot="label">${label}</label>
            <ui-input><input type="text" name="amount" placeholder=${placeholder} /></ui-input>
            <span slot="help">${help}</span>
            <span slot="error">Amount is required.</span>
        </ui-field>
    `,
};

/** Refusing input, and refusing it in the two different ways the platform has. */
export const Disabled: StoryObj<InputArgs> = {
    render: ({ label }): TemplateResult => html`
        <div style="display: flex; flex-direction: column; gap: 1rem">
            <ui-field>
                <label slot="label">${label}</label>
                <ui-input><input type="text" value="12,00" disabled /></ui-input>
                <span slot="help">Disabled — not submitted, not focusable.</span>
            </ui-field>
            <ui-field>
                <label slot="label">Reference</label>
                <ui-input><input type="text" value="INV-2026-0031" readonly /></ui-input>
                <span slot="help">Readonly — submitted, focusable, not editable.</span>
            </ui-field>
        </div>
    `,
};

/**
 * A control with no field around it, which is why this is an element of its own.
 *
 * `ui-field` is form plumbing and not everything is a form: a search box in a toolbar
 * wants the styling and has no label, help or error to wire. It carries its accessible
 * name on the control, where the platform can already see it.
 */
export const Standalone: StoryObj<InputArgs> = {
    render: (): TemplateResult => html`
        <ui-input
            ><input type="search" aria-label="Search invoices" placeholder="Search"
        /></ui-input>
    `,
};

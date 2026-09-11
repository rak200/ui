/**
 * `<ui-input>` and `<ui-textarea>`, one story per thing a reader would go looking for.
 *
 * What each attribute does is in `docs/input.md`, which CI checks and a consumer opens
 * first. This file shows the components; it does not describe them.
 *
 * **No story writes a control.** Both elements render their own control, their own label,
 * their own help and their own message into one shadow root, which is what RFC 0005
 * decided.
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
    error: string;
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
        error: { control: 'text' },
        placeholder: { control: 'text' },
        disabled: { control: 'boolean' },
    },

    args: {
        label: 'Amount',
        help: 'In BRL, two decimals.',
        error: '',
        placeholder: '0,00',
        disabled: false,
    },

    render: ({ label, help, error, placeholder, disabled }): TemplateResult => html`
        <ui-input
            label=${label}
            help=${help}
            error=${error}
            placeholder=${placeholder}
            name="amount"
            ?disabled=${disabled}
        ></ui-input>
    `,
};

export default meta;

/** The ordinary case, which is one tag and its attributes. */
export const Text: StoryObj<InputArgs> = {};

/** The same box around a control that grows, which is the one rule that differs. */
export const Multiline: StoryObj<InputArgs> = {
    args: { label: 'Notes', help: '', placeholder: 'Anything worth remembering' },
    render: ({ label, placeholder, disabled }): TemplateResult => html`
        <ui-textarea
            label=${label}
            placeholder=${placeholder}
            name="notes"
            rows="4"
            ?disabled=${disabled}
        ></ui-textarea>
    `,
};

/**
 * In error, and one property says it once.
 *
 * The red boundary, the message under the control and the `aria-describedby` that ties
 * them together all come from `error` — which is also what the element hands to
 * `setValidity`, so a form cannot be submitted past a message the reader can see. The help
 * text stays: it is usually the format requirement, which is the suggestion a reader needs
 * in order to recover.
 */
export const Invalid: StoryObj<InputArgs> = {
    args: { error: 'Amount is required.' },
    render: ({ label, help, error, placeholder }): TemplateResult => html`
        <ui-input
            label=${label}
            help=${help}
            error=${error}
            placeholder=${placeholder}
            name="amount"
            required
        ></ui-input>
    `,
};

/** Unavailable, which the label follows rather than only the box. */
export const Disabled: StoryObj<InputArgs> = {
    args: { disabled: true },
};

/**
 * What the platform validates, handed to it rather than reimplemented.
 *
 * `type`, `min` and `step` go to a real `<input>`, which computes its own validity and
 * writes its own message — the element only passes the answer on.
 */
export const Constrained: StoryObj<InputArgs> = {
    args: { label: 'Quantity', help: 'Ten or more, in fives.', placeholder: '' },
    render: ({ label, help }): TemplateResult => html`
        <ui-input
            label=${label}
            help=${help}
            name="quantity"
            type="number"
            min="10"
            step="5"
            value="3"
        ></ui-input>
    `,
};

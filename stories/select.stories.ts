/**
 * `<ui-select>`, one story per thing a reader would go looking for.
 *
 * What the platform still refuses is in `docs/select.md`, which CI checks and a consumer
 * opens first. This file shows the component; it does not describe it.
 *
 * **Every story writes the native `<select>` and its options by hand**, and that is the
 * demonstration rather than boilerplate: the control is the host's, it stays in the light
 * DOM where the label can resolve against it, and its attributes are the platform's.
 */

// Two lines for one module, and the split is forced: `verbatimModuleSyntax` erases a
// type-only import whole, so a lone `import type` would drop the side effect that
// registers the elements and the tags below would never upgrade.
import '@rak200/ui';
import { html, type TemplateResult } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface SelectArgs {
    label: string;
    help: string;
    disabled: boolean;
}

const meta: Meta<SelectArgs> = {
    title: 'Components/ui-select',

    // `argTypes` carry control affordance, not documentation: a name and a control type,
    // so the panel works and nothing more. A `description` here would start the second API
    // surface this playground exists without.
    argTypes: {
        label: { control: 'text' },
        help: { control: 'text' },
        disabled: { control: 'boolean' },
    },

    args: {
        label: 'Currency',
        help: 'Used for every amount on the invoice.',
        disabled: false,
    },

    render: ({ label, help, disabled }): TemplateResult => html`
        <ui-field>
            <label slot="label">${label}</label>
            <ui-select>
                <select name="currency" ?disabled=${disabled}>
                    <option value="brl">Real</option>
                    <option value="usd">Dollar</option>
                    <option value="eur">Euro</option>
                </select>
            </ui-select>
            <span slot="help">${help}</span>
        </ui-field>
    `,
};

export default meta;

/** The ordinary case: a labelled drop-down with help under it. */
export const Select: StoryObj<SelectArgs> = {};

/**
 * Beside a text field, which is the comparison this component has to survive.
 *
 * The two boxes are written in different files and `tests/select.test.ts` asserts they
 * agree — the boundary, the radius, the padding, the font and the focus ring. A kit whose
 * select does not line up with its input is a kit nobody trusts with a form.
 */
export const BesideAnInput: StoryObj<SelectArgs> = {
    render: (): TemplateResult => html`
        <div style="display: flex; flex-direction: column; gap: 1rem">
            <ui-field>
                <label slot="label">Amount</label>
                <ui-input><input type="number" name="amount" placeholder="0,00" /></ui-input>
            </ui-field>
            <ui-field>
                <label slot="label">Currency</label>
                <ui-select>
                    <select name="currency">
                        <option value="brl">Real</option>
                        <option value="usd">Dollar</option>
                    </select>
                </ui-select>
            </ui-field>
        </div>
    `,
};

/**
 * In error, and nothing here says so twice.
 *
 * The red boundary is not set by this story or by the wrapper: `ui-field` marks the
 * control `aria-invalid` as part of the wiring it already owns, and the box reads that.
 */
export const Invalid: StoryObj<SelectArgs> = {
    render: ({ label }): TemplateResult => html`
        <ui-field>
            <label slot="label">${label}</label>
            <ui-select>
                <select name="currency" required>
                    <option value="">Choose one</option>
                    <option value="brl">Real</option>
                </select>
            </ui-select>
            <span slot="error">A currency is required.</span>
        </ui-field>
    `,
};

/** Refusing input, which for a select is the one way the platform has. */
export const Disabled: StoryObj<SelectArgs> = {
    args: { disabled: true, help: 'Disabled — not submitted, not focusable.' },
};

/**
 * A list rather than a drop-down, which is what `multiple` makes it.
 *
 * The caret is guarded off here rather than drawn on a list it would point at nothing
 * from. The box stays, because the box is the part this component owns.
 */
export const Multiple: StoryObj<SelectArgs> = {
    args: { label: 'Tags', help: 'Hold ctrl or cmd to pick more than one.' },
    render: ({ label, help }): TemplateResult => html`
        <ui-field>
            <label slot="label">${label}</label>
            <ui-select>
                <select name="tags" multiple size="4">
                    <option value="urgent">Urgent</option>
                    <option value="billed">Billed</option>
                    <option value="draft">Draft</option>
                </select>
            </ui-select>
            <span slot="help">${help}</span>
        </ui-field>
    `,
};

/**
 * Right to left, where the caret is the one thing that does not follow on its own.
 *
 * `padding-inline-end` is logical and flips by itself; `background-position` has no
 * logical form, so the component mirrors it explicitly against the control's own
 * direction rather than the page's.
 */
export const RightToLeft: StoryObj<SelectArgs> = {
    render: (): TemplateResult => html`
        <ui-field>
            <label slot="label" dir="rtl">العملة</label>
            <ui-select>
                <select name="currency" dir="rtl">
                    <option value="brl">ريال</option>
                    <option value="usd">دولار</option>
                </select>
            </ui-select>
        </ui-field>
    `,
};

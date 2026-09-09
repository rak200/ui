/**
 * `<ui-select>`, one story per thing a reader would go looking for.
 *
 * What each attribute does is in `docs/select.md`, which CI checks and a consumer opens
 * first. This file shows the component; it does not describe it.
 *
 * **The choices are `<ui-option>` rather than `<option>`**, and that is measured rather
 * than stylistic: a `<slot>` inside a `<select>` assigns the nodes and the select sees none
 * of them, so the real `<option>` elements are built from these declarations.
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
    error: string;
    disabled: boolean;
}

const meta: Meta<SelectArgs> = {
    title: 'Components/ui-select',

    // `argTypes` carry control affordance, not documentation: a name and a control type,
    // so the panel works and nothing more.
    argTypes: {
        label: { control: 'text' },
        help: { control: 'text' },
        error: { control: 'text' },
        disabled: { control: 'boolean' },
    },

    args: {
        label: 'Currency',
        help: '',
        error: '',
        disabled: false,
    },

    render: ({ label, help, error, disabled }): TemplateResult => html`
        <ui-select label=${label} help=${help} error=${error} name="currency" ?disabled=${disabled}>
            <ui-option value="brl" selected>Real</ui-option>
            <ui-option value="usd">Dollar</ui-option>
            <ui-option value="eur">Euro</ui-option>
        </ui-select>
    `,
};

export default meta;

/** The ordinary case: a labelled drop-down over a native control. */
export const Select: StoryObj<SelectArgs> = {};

/**
 * Beside a text field, which is what the shared box exists for.
 *
 * The two are drawn by different stylesheets on purpose — `src/select.ts` says why — and
 * `tests/select.test.ts` compares them, so a drift shows up as a failure rather than as a
 * control that stopped matching the one next to it.
 */
export const BesideAnInput: StoryObj<SelectArgs> = {
    render: ({ label }): TemplateResult => html`
        <div style="display: flex; flex-direction: column; gap: 1rem">
            <ui-input label="Amount" name="amount" placeholder="0,00"></ui-input>
            <ui-select label=${label} name="currency">
                <ui-option value="brl" selected>Real</ui-option>
                <ui-option value="usd">Dollar</ui-option>
            </ui-select>
        </div>
    `,
};

/** Choices under headings, which the platform draws inside the list it opens. */
export const Grouped: StoryObj<SelectArgs> = {
    render: ({ label }): TemplateResult => html`
        <ui-select label=${label} name="currency" help="Grouped by where they are spent.">
            <ui-optgroup label="Americas">
                <ui-option value="brl" selected>Real</ui-option>
                <ui-option value="usd">Dollar</ui-option>
            </ui-optgroup>
            <ui-optgroup label="Europe">
                <ui-option value="eur">Euro</ui-option>
                <ui-option value="gbp">Pound</ui-option>
            </ui-optgroup>
        </ui-select>
    `,
};

/** In error, from the one property that also reaches `setValidity`. */
export const Invalid: StoryObj<SelectArgs> = {
    args: { error: 'Pick a currency.' },
};

/** Unavailable, which the label follows rather than only the box. */
export const Disabled: StoryObj<SelectArgs> = {
    args: { disabled: true },
};

/**
 * A list rather than a drop-down, where the caret would point at nothing.
 *
 * The guard is a rule rather than a judgement call: `multiple` turns the control into a
 * list box, and a chevron on a list is a promise of something to open.
 */
export const Multiple: StoryObj<SelectArgs> = {
    render: ({ label }): TemplateResult => html`
        <ui-select label=${label} name="currency" multiple>
            <ui-option value="brl" selected>Real</ui-option>
            <ui-option value="usd">Dollar</ui-option>
            <ui-option value="eur">Euro</ui-option>
        </ui-select>
    `,
};

/**
 * Right to left, where the caret follows the control rather than the page.
 *
 * `background-position` has no logical form, so it is the one physical thing in the
 * stylesheet and it is mirrored explicitly.
 */
export const RightToLeft: StoryObj<SelectArgs> = {
    render: (): TemplateResult => html`
        <ui-select dir="rtl" label="عملة" name="currency">
            <ui-option value="aed" selected>درهم</ui-option>
            <ui-option value="sar">ريال</ui-option>
        </ui-select>
    `,
};

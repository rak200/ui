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
import '@rak200/ui/icons/search.js';
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

/** The same box around a control that grows with its text, from the four rows it starts at. */
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
 * Text before and after the value, inside the box, and a glyph in a slot of the same name.
 *
 * The text is heard with the control, after an error and before the help; the glyph is hidden
 * from the tree. Either is laid over the control's padding, which widens to hold it.
 */
export const Affixes: StoryObj<InputArgs> = {
    render: (): TemplateResult => html`
        <div style="display: flex; flex-direction: column; gap: 1rem">
            <ui-input
                label="Price"
                name="price"
                help="Billed monthly."
                prefix-text="R$"
                suffix-text="per month"
            ></ui-input>
            <ui-input label="Search" name="q" type="search">
                <ui-icon slot="prefix" name="search"></ui-icon>
            </ui-input>
        </div>
    `,
};

/**
 * The buttons a field carries at its end, each named by its label, and the count under it.
 *
 * The clear button keeps its place while there is nothing to clear; the password's is pressed
 * while its text is shown; the count is heard again once the reader stops typing.
 */
export const Tools: StoryObj<InputArgs> = {
    render: (): TemplateResult => html`
        <div style="display: flex; flex-direction: column; gap: 1rem">
            <ui-input label="Search" name="q" type="search" clear-label="Clear"></ui-input>
            <ui-input
                label="Password"
                name="password"
                type="password"
                reveal-label="Show password"
            ></ui-input>
            <ui-input
                label="Headline"
                name="headline"
                maxlength="60"
                count-text="{remaining} characters left"
            ></ui-input>
        </div>
    `,
};

/**
 * A button of the page's at the box's end, after the element's own: a search's submit button, and
 * a copy button beside a value the reader cannot change.
 *
 * Each is written compact, so it is drawn inside the box with room round it; one at the page's
 * density is as tall as the box. The element draws neither: each is named by its own text.
 */
export const Action: StoryObj<InputArgs> = {
    render: (): TemplateResult => html`
        <div style="display: flex; flex-direction: column; gap: 1rem">
            <form
                role="search"
                @submit=${(event: SubmitEvent) => {
                    event.preventDefault();
                }}
            >
                <ui-input label="Search the docs" name="q" type="search" clear-label="Clear">
                    <ui-button
                        slot="action"
                        type="submit"
                        variant="secondary"
                        data-ui-density="compact"
                        >Search</ui-button
                    >
                </ui-input>
            </form>
            <ui-input label="Token" name="token" value="3f9a-77c2" readonly>
                <ui-button slot="action" variant="secondary" data-ui-density="compact"
                    >Copy</ui-button
                >
            </ui-input>
        </div>
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

/**
 * `<ui-checkbox>` and `<ui-switch>`, one story per thing a reader would go looking for.
 *
 * When to reach for which is in `docs/checkbox.md`, which CI checks and a consumer opens
 * first. This file shows the components; it does not describe them.
 *
 * **No story writes a control, and none reaches for `<ui-field>`.** Both elements render
 * their own `<input>` and their own `<label>` into one shadow root, so the markup is the
 * tag and its attributes — which is the whole of what RFC 0005 decided.
 */

// Two lines for one module, and the split is forced: `verbatimModuleSyntax` erases a
// type-only import whole, so a lone `import type` would drop the side effect that
// registers the elements and the tags below would never upgrade.
import '@rak200/ui';
import { html, type TemplateResult } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface ToggleArgs {
    label: string;
    checked: boolean;
    disabled: boolean;
}

const meta: Meta<ToggleArgs> = {
    title: 'Components/ui-checkbox',

    // `argTypes` carry control affordance, not documentation: a name and a control type,
    // so the panel works and nothing more. A `description` here would start the second API
    // surface this playground exists without.
    argTypes: {
        label: { control: 'text' },
        checked: { control: 'boolean' },
        disabled: { control: 'boolean' },
    },

    args: {
        label: 'Send a receipt',
        checked: false,
        disabled: false,
    },

    render: ({ label, checked, disabled }): TemplateResult => html`
        <ui-checkbox
            label=${label}
            name="receipt"
            ?checked=${checked}
            ?disabled=${disabled}
        ></ui-checkbox>
    `,
};

export default meta;

/** The ordinary case, which is one tag and its attributes. */
export const Checkbox: StoryObj<ToggleArgs> = {};

/**
 * The same control, announcing itself as a switch.
 *
 * `role="switch"` is not written here and that is the point — the element sets it on the
 * control it renders, so a host cannot ship a switch that announces as a checkbox by
 * forgetting one attribute.
 */
export const Switch: StoryObj<ToggleArgs> = {
    args: { label: 'Email notifications', checked: true },
    render: ({ label, checked, disabled }): TemplateResult => html`
        <ui-switch
            label=${label}
            name="notify"
            ?checked=${checked}
            ?disabled=${disabled}
        ></ui-switch>
    `,
};

/**
 * Every state side by side, which is what a person checks a drawing against.
 *
 * The mixed one is here because `appearance: none` took the platform's dash away with the
 * rest of the drawing: a control set `indeterminate` would otherwise render as plainly
 * unchecked, which is a wrong answer rather than a missing one.
 */
export const States: StoryObj<ToggleArgs> = {
    render: (): TemplateResult => html`
        <div style="display: flex; flex-direction: column; gap: 0.75rem; align-items: start">
            <ui-checkbox label="Unchecked"></ui-checkbox>
            <ui-checkbox label="Checked" checked></ui-checkbox>
            <ui-checkbox label="Mixed" indeterminate></ui-checkbox>
            <ui-checkbox label="Disabled" disabled></ui-checkbox>
            <ui-switch label="Switch, off"></ui-switch>
            <ui-switch label="Switch, on" checked></ui-switch>
        </div>
    `,
};

/**
 * In error, and one property says it once.
 *
 * The red boundary, the message under the control and the `aria-describedby` that ties
 * them together all come from `error` — which is also what the element hands to
 * `setValidity`, so a form cannot be submitted past a message the reader can see.
 */
export const Invalid: StoryObj<ToggleArgs> = {
    args: { label: 'I accept the terms' },
    render: ({ label }): TemplateResult => html`
        <ui-checkbox
            label=${label}
            name="terms"
            required
            error="The terms have to be accepted."
        ></ui-checkbox>
    `,
};

/**
 * A label an attribute cannot hold, which is why the slot is kept.
 *
 * The link is the case that decides it: `label` takes a string, and a link inside a label
 * is markup. It is also the behaviour that comes free from the `<label>` being a real one —
 * clicking the link follows it rather than toggling the box.
 */
export const Markup: StoryObj<ToggleArgs> = {
    render: (): TemplateResult => html`
        <ui-checkbox name="terms">
            <span slot="label">I accept the <a href="#terms">terms of service</a></span>
        </ui-checkbox>
    `,
};

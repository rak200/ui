/**
 * `<ui-checkbox>` and `<ui-switch>`, one story per thing a reader would go looking for.
 *
 * When to reach for which is in `docs/checkbox.md`, which CI checks and a consumer opens
 * first. This file shows the components; it does not describe them.
 *
 * **Every story writes the native control by hand**, and that is the demonstration rather
 * than boilerplate: the control is the host's, it stays in the light DOM where the label
 * can resolve against it, and its attributes are the platform's.
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
        <ui-field>
            <label slot="label">${label}</label>
            <ui-checkbox>
                <input type="checkbox" name="receipt" ?checked=${checked} ?disabled=${disabled} />
            </ui-checkbox>
        </ui-field>
    `,
};

export default meta;

/** The ordinary case: a labelled checkbox inside the field that wires it. */
export const Checkbox: StoryObj<ToggleArgs> = {};

/**
 * The same control, announcing itself as a switch.
 *
 * `role="switch"` is not written here and that is the point — the element sets it on the
 * control, so a host cannot ship a switch that announces as a checkbox by forgetting one
 * attribute.
 */
export const Switch: StoryObj<ToggleArgs> = {
    args: { label: 'Email notifications', checked: true },
    render: ({ label, checked, disabled }): TemplateResult => html`
        <ui-field>
            <label slot="label">${label}</label>
            <ui-switch>
                <input type="checkbox" name="notify" ?checked=${checked} ?disabled=${disabled} />
            </ui-switch>
        </ui-field>
    `,
};

/**
 * Every state side by side, which is what a person checks a drawing against.
 *
 * The mixed one is here because `appearance: none` took the platform's dash away with the
 * rest of the drawing: a control the host set `indeterminate` on would otherwise render as
 * plainly unchecked, which is a wrong answer rather than a missing one.
 */
export const States: StoryObj<ToggleArgs> = {
    render: (): TemplateResult => {
        // The gap is laid out rather than left to the whitespace between the tags, which
        // a formatter is free to move around and did.
        const row = 'display: flex; align-items: center; gap: 0.5rem';

        return html`
            <div style="display: flex; flex-direction: column; gap: 0.75rem">
                <label style=${row}>
                    <ui-checkbox><input type="checkbox" /></ui-checkbox>
                    Unchecked
                </label>
                <label style=${row}>
                    <ui-checkbox><input type="checkbox" checked /></ui-checkbox>
                    Checked
                </label>
                <label style=${row}>
                    <!-- The mixed state is a property with no attribute behind it, so it
                         is bound rather than written. -->
                    <ui-checkbox><input type="checkbox" .indeterminate=${true} /></ui-checkbox>
                    Mixed
                </label>
                <label style=${row}>
                    <ui-checkbox><input type="checkbox" disabled /></ui-checkbox>
                    Disabled
                </label>
                <label style=${row}>
                    <ui-switch><input type="checkbox" /></ui-switch>
                    Switch, off
                </label>
                <label style=${row}>
                    <ui-switch><input type="checkbox" checked /></ui-switch>
                    Switch, on
                </label>
            </div>
        `;
    },
};

/**
 * In error, and nothing here says so twice.
 *
 * The red boundary is not set by this story or by the wrapper: `ui-field` marks the
 * control `aria-invalid` as part of the wiring it already owns, and the box reads that.
 * One source, and it is the one a screen reader is already using.
 */
export const Invalid: StoryObj<ToggleArgs> = {
    args: { label: 'I accept the terms' },
    render: ({ label }): TemplateResult => html`
        <ui-field>
            <label slot="label">${label}</label>
            <ui-checkbox><input type="checkbox" name="terms" required /></ui-checkbox>
            <span slot="error">The terms have to be accepted.</span>
        </ui-field>
    `,
};

/**
 * A checkbox with no field around it, which is why this is an element of its own.
 *
 * `ui-field` is form plumbing and not everything is a form. A `<label>` wrapping the
 * control labels it the way the platform has always allowed — the control is in the light
 * DOM, so it is a descendant of that label in the tree the browser reads.
 */
export const Inline: StoryObj<ToggleArgs> = {
    render: (): TemplateResult => html`
        <label style="display: flex; align-items: center; gap: 0.5rem">
            <ui-checkbox><input type="checkbox" name="remember" /></ui-checkbox>
            Remember this device
        </label>
    `,
};

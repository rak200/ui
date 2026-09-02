/**
 * `<ui-radio-group>` and `<ui-radio>`, one story per thing a reader would go looking for.
 *
 * When to reach for which is in `docs/radio.md`, which CI checks and a consumer opens
 * first. This file shows the components; it does not describe them.
 *
 * **Every story writes the native radios by hand**, and that is the demonstration rather
 * than boilerplate: the controls are the host's, they stay in the light DOM where the
 * labels can resolve against them, and the group behaviour every story exercises with the
 * arrow keys is theirs too — nothing here installs it.
 */

// Two lines for one module, and the split is forced: `verbatimModuleSyntax` erases a
// type-only import whole, so a lone `import type` would drop the side effect that
// registers the elements and the tags below would never upgrade.
import '@rak200/ui';
import { html, type TemplateResult } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import type { RadioOrientation } from '@rak200/ui';

interface GroupArgs {
    label: string;
    orientation: RadioOrientation;
    disabled: boolean;
}

/** One option, written the way a consumer writes it: a label wrapping the control. */
function option(value: string, text: string, checked = false, disabled = false): TemplateResult {
    return html`
        <label style="display: flex; align-items: center; gap: 0.5rem">
            <ui-radio>
                <input
                    type="radio"
                    name="plan"
                    value=${value}
                    ?checked=${checked}
                    ?disabled=${disabled}
                />
            </ui-radio>
            ${text}
        </label>
    `;
}

const meta: Meta<GroupArgs> = {
    title: 'Components/ui-radio-group',

    // `argTypes` carry control affordance, not documentation: a name and a control type,
    // so the panel works and nothing more. A `description` here would start the second API
    // surface this playground exists without.
    argTypes: {
        label: { control: 'text' },
        orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
        disabled: { control: 'boolean' },
    },

    args: {
        label: 'Plan',
        orientation: 'vertical',
        disabled: false,
    },

    render: ({ label, orientation, disabled }): TemplateResult => html`
        <ui-field>
            <label slot="label">${label}</label>
            <ui-radio-group orientation=${orientation}>
                ${option('free', 'Free', true, disabled)} ${option('pro', 'Pro', false, disabled)}
                ${option('max', 'Max', false, disabled)}
            </ui-radio-group>
        </ui-field>
    `,
};

export default meta;

/**
 * The ordinary case: a labelled group inside the field that names it.
 *
 * The name is on the group and not on an option, which is what `<label for>` could not
 * have done — so the field points `aria-labelledby` at the label instead. Tab reaches the
 * set once; the arrow keys do the rest.
 */
export const RadioGroup: StoryObj<GroupArgs> = {};

/** The same set laid out in a row, announcing that it is a row. */
export const Horizontal: StoryObj<GroupArgs> = {
    args: { orientation: 'horizontal' },
};

/**
 * Every state side by side, which is what a person checks a drawing against.
 *
 * The disabled pair is a group of its own — a disabled option inside the group above would
 * be one the arrow keys skip, which is the platform being right and a confusing thing to
 * put in a drawing sheet.
 */
export const States: StoryObj<GroupArgs> = {
    render: (): TemplateResult => {
        const row = 'display: flex; align-items: center; gap: 0.5rem';

        return html`
            <div style="display: flex; flex-direction: column; gap: 0.75rem">
                <label style=${row}>
                    <ui-radio><input type="radio" name="states" /></ui-radio>
                    Unselected
                </label>
                <label style=${row}>
                    <ui-radio><input type="radio" name="states" checked /></ui-radio>
                    Selected
                </label>
                <label style=${row}>
                    <ui-radio><input type="radio" name="off" disabled /></ui-radio>
                    Disabled
                </label>
                <label style=${row}>
                    <ui-radio><input type="radio" name="off-selected" checked disabled /></ui-radio>
                    Disabled, selected
                </label>
            </div>
        `;
    },
};

/**
 * In error, and nothing here says so twice.
 *
 * The red boundary is not set by this story and not by an option: `ui-field` marks the
 * *group* `aria-invalid` as part of the wiring it already owns, and the group retargets the
 * boundary token over its own subtree. What is invalid is the choice, not one radio.
 */
export const Invalid: StoryObj<GroupArgs> = {
    args: { label: 'Plan' },
    render: ({ label }): TemplateResult => html`
        <ui-field>
            <label slot="label">${label}</label>
            <ui-radio-group>
                ${option('free', 'Free')} ${option('pro', 'Pro')} ${option('max', 'Max')}
            </ui-radio-group>
            <span slot="error">Pick a plan to continue.</span>
        </ui-field>
    `,
};

/**
 * A group with no field around it, which is why the role is the element's own.
 *
 * `ui-field` is form plumbing and not everything is a form. Named here by an
 * `aria-labelledby` the host wrote, which is what the field would otherwise have written.
 */
export const Standalone: StoryObj<GroupArgs> = {
    render: (): TemplateResult => html`
        <p id="delivery-label" style="margin: 0 0 0.5rem">Delivery</p>
        <ui-radio-group aria-labelledby="delivery-label">
            <label style="display: flex; align-items: center; gap: 0.5rem">
                <ui-radio><input type="radio" name="delivery" value="standard" checked /></ui-radio>
                Standard
            </label>
            <label style="display: flex; align-items: center; gap: 0.5rem">
                <ui-radio><input type="radio" name="delivery" value="express" /></ui-radio>
                Express
            </label>
        </ui-radio-group>
    `,
};

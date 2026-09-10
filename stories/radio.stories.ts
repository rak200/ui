/**
 * `<ui-radio-group>` and `<ui-radio>`, one story per thing a reader would go looking for.
 *
 * When to reach for which is in `docs/radio.md`, which CI checks and a consumer opens
 * first. This file shows the components; it does not describe them.
 *
 * **No story writes a control**, and that is the demonstration rather than boilerplate: a
 * host writes the tag and its choices, and the group renders the radios, their labels and
 * its own name, help and message. The arrow-key behaviour every story exercises is still
 * the platform's — the controls are native radios, sharing a name inside one tree.
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
    help: string;
    orientation: RadioOrientation;
    required: boolean;
    disabled: boolean;
}

const meta: Meta<GroupArgs> = {
    title: 'Components/ui-radio-group',

    // `argTypes` carry control affordance, not documentation: a name and a control type,
    // so the panel works and nothing more. A `description` here would start the second API
    // surface this playground exists without.
    argTypes: {
        label: { control: 'text' },
        help: { control: 'text' },
        orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
        required: { control: 'boolean' },
        disabled: { control: 'boolean' },
    },

    args: {
        label: 'Plan',
        help: '',
        orientation: 'vertical',
        required: false,
        disabled: false,
    },

    render: ({ label, help, orientation, required, disabled }): TemplateResult => html`
        <ui-radio-group
            label=${label}
            help=${help}
            name="plan"
            orientation=${orientation}
            ?required=${required}
            ?disabled=${disabled}
        >
            <ui-radio value="free" checked>Free</ui-radio>
            <ui-radio value="pro">Pro</ui-radio>
            <ui-radio value="max">Max</ui-radio>
        </ui-radio-group>
    `,
};

export default meta;

/**
 * The ordinary case: a labelled set, named as one thing.
 *
 * The name is the group's rather than an option's, which is what a `<label for>` could not
 * have done — it reaches a labelable element and a group is not one. Tab reaches the set
 * once; the arrow keys do the rest.
 */
export const RadioGroup: StoryObj<GroupArgs> = {};

/** The same set laid out in a row, announcing that it is a row. */
export const Horizontal: StoryObj<GroupArgs> = {
    args: { orientation: 'horizontal' },
};

/** Supporting text under the set, which an error does not replace. */
export const WithHelp: StoryObj<GroupArgs> = {
    args: { help: 'You can change it at any time.' },
};

/**
 * In error, and nothing here says so twice.
 *
 * What is invalid is the *choice*, not one radio — so the message is the group's and the
 * boundary is painted on every option from the one `aria-invalid` the group rendered.
 */
export const Invalid: StoryObj<GroupArgs> = {
    render: (): TemplateResult => html`
        <ui-radio-group label="Plan" name="plan" error="Pick a plan to continue.">
            <ui-radio value="free">Free</ui-radio>
            <ui-radio value="pro">Pro</ui-radio>
            <ui-radio value="max">Max</ui-radio>
        </ui-radio-group>
    `,
};

/** The whole set unavailable, which is one attribute rather than one per option. */
export const Disabled: StoryObj<GroupArgs> = {
    args: { disabled: true },
};

/**
 * One option unavailable, the rest of the set live.
 *
 * The arrow keys skip it, which is the platform being right rather than something this
 * component arranges.
 */
export const OneOptionDisabled: StoryObj<GroupArgs> = {
    render: (): TemplateResult => html`
        <ui-radio-group label="Plan" name="plan">
            <ui-radio value="free" checked>Free</ui-radio>
            <ui-radio value="pro" disabled>Pro — sold out</ui-radio>
            <ui-radio value="max">Max</ui-radio>
        </ui-radio-group>
    `,
};

/**
 * Right to left, where the arrow keys swap with the writing direction.
 *
 * Nothing in this component arranges that either: left advances and right goes back
 * because the controls are native radios reading their own direction.
 */
export const RightToLeft: StoryObj<GroupArgs> = {
    render: (): TemplateResult => html`
        <ui-radio-group dir="rtl" label="الخطة" name="plan" help="يمكنك تغييرها في أي وقت.">
            <ui-radio value="free" checked>مجاني</ui-radio>
            <ui-radio value="pro">احترافي</ui-radio>
        </ui-radio-group>
    `,
};

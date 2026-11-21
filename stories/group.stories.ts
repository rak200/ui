/**
 * `<ui-button-group>`, one story per thing a reader would go looking for.
 *
 * What a group is for, and the keyboard a toolbar takes, are in `docs/group.md`, which CI
 * checks and a consumer opens first. This file shows the component; it does not describe it.
 */

// Two lines for one module, and the split is forced: `verbatimModuleSyntax` erases a
// type-only import whole, so a lone `import type` would drop the side effect that
// registers the elements and the tags below would never upgrade.
import '@rak200/ui';
import { html, type TemplateResult } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface GroupArgs {
    label: string;
}

const meta: Meta<GroupArgs> = {
    title: 'Components/ui-button-group',

    // `argTypes` carry control affordance, not documentation: a name and a control type,
    // so the panel works and nothing more.
    argTypes: {
        label: { control: 'text' },
    },

    args: { label: 'View' },

    render: ({ label }): TemplateResult => html`
        <ui-button-group label=${label}>
            <ui-button variant="secondary" type="button">Day</ui-button>
            <ui-button variant="secondary" type="button">Week</ui-button>
            <ui-button variant="secondary" type="button">Month</ui-button>
        </ui-button-group>
    `,
};

export default meta;

/** Buttons drawn as one, the corners they share squared and their edges met as one line. */
export const Group: StoryObj<GroupArgs> = {};

/**
 * A toolbar of toggles: one tab stop, which the arrows move through and Home and End take to
 * the ends, each toggle saying whether it is pressed.
 */
export const Toolbar: StoryObj<GroupArgs> = {
    render: (): TemplateResult => html`
        <ui-button-group label="Text style" toolbar>
            <ui-button toggle pressed type="button">Bold</ui-button>
            <ui-button toggle type="button">Italic</ui-button>
            <ui-button toggle type="button">Underline</ui-button>
        </ui-button-group>
    `,
};

/** Right to left, where the corners turn with the row and the arrows with the reading. */
export const RightToLeft: StoryObj<GroupArgs> = {
    render: (): TemplateResult => html`
        <ui-button-group dir="rtl" label="תצוגה" toolbar>
            <ui-button variant="secondary" type="button">יום</ui-button>
            <ui-button variant="secondary" type="button">שבוע</ui-button>
            <ui-button variant="secondary" type="button">חודש</ui-button>
        </ui-button-group>
    `,
};

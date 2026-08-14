/**
 * `<ui-button>`, one story per thing a reader would go looking for.
 *
 * What a variant means and when to reach for it is in `docs/button.md`, which CI checks
 * and a consumer opens first. This file shows the component; it does not describe it.
 */

// Two lines for one module, and the split is forced: `verbatimModuleSyntax` erases a
// type-only import whole, so a lone `import type` would drop the side effect that
// registers the element and the tag below would never upgrade.
import '@rak200/ui';
import type { ButtonVariant } from '@rak200/ui';
import { html, type TemplateResult } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface ButtonArgs {
    variant: ButtonVariant;
    disabled: boolean;
    label: string;
}

const meta: Meta<ButtonArgs> = {
    title: 'Components/ui-button',

    // `argTypes` carry control affordance, not documentation: a name and a control type,
    // so the panel works and nothing more. A `description` here would start the second API
    // surface this playground exists without.
    argTypes: {
        variant: { control: 'inline-radio', options: ['primary', 'secondary'] },
        disabled: { control: 'boolean' },
        label: { control: 'text' },
    },

    args: { variant: 'primary', disabled: false, label: 'Save' },

    render: ({ variant, disabled, label }): TemplateResult =>
        html`<ui-button variant=${variant} ?disabled=${disabled}>${label}</ui-button>`,
};

export default meta;

/** Full visual weight, for the one action a screen is about. */
export const Primary: StoryObj<ButtonArgs> = {};

/** The weight beside it, for everything that is not that action. */
export const Secondary: StoryObj<ButtonArgs> = {
    args: { variant: 'secondary', label: 'Cancel' },
};

/**
 * Refusing interaction, which is a different rendering rather than the same one greyed:
 * the cursor changes with the opacity, and the real `<button>` underneath carries the
 * semantics the platform gives it.
 */
export const Disabled: StoryObj<ButtonArgs> = {
    args: { disabled: true },
};

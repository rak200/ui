/**
 * `<ui-toaster>` and `<ui-toast>`, one story per thing a reader would go looking for.
 *
 * What the regions are and why there are two is in `docs/toast.md`, which CI checks and a
 * consumer opens first. This file shows the components; it does not describe them.
 *
 * **Every story here writes `duration="0"`**, which is the one thing about it that is not
 * how a page would be written: a playground whose subject disappears five seconds after it
 * renders cannot be looked at. `Timed` is the story that keeps the clock, and it is the one
 * that says so.
 */

// Two lines for one module, and the split is forced: `verbatimModuleSyntax` erases a
// type-only import whole, so a lone `import type` would drop the side effect that
// registers the elements and the tags below would never upgrade.
import '@rak200/ui';
import { html, type TemplateResult } from 'lit';
import type { ToastVariant } from '@rak200/ui';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface ToastArgs {
    variant: ToastVariant;
    message: string;
    duration: number;
}

const meta: Meta<ToastArgs> = {
    title: 'Components/ui-toast',

    // `argTypes` carry control affordance, not documentation: a name and a control type,
    // so the panel works and nothing more. A `description` here would start the second API
    // surface this playground exists without.
    argTypes: {
        variant: { control: 'inline-radio', options: ['info', 'success', 'warning', 'danger'] },
        message: { control: 'text' },
        duration: { control: 'number' },
    },

    args: {
        variant: 'info',
        message: 'Your changes have been saved.',
        duration: 0,
    },

    render: ({ variant, message, duration }): TemplateResult => html`
        <ui-toaster>
            <ui-toast variant=${variant} duration=${duration}>${message}</ui-toast>
        </ui-toaster>
    `,
};

export default meta;

/** The ordinary case: one notice, in the corner, announced politely. */
export const Toast: StoryObj<ToastArgs> = {};

/**
 * The four outcomes, and the two regions they fall into.
 *
 * The error is last in the stack because it is announced from the other region — and that
 * region is nearest the corner, which is where the stack grows from.
 */
export const Outcomes: StoryObj<ToastArgs> = {
    render: ({ duration }): TemplateResult => html`
        <ui-toaster>
            <ui-toast duration=${duration}>Draft saved automatically.</ui-toast>
            <ui-toast variant="success" duration=${duration}>Invoice sent.</ui-toast>
            <ui-toast variant="warning" duration=${duration}>Two fields were skipped.</ui-toast>
            <ui-toast variant="danger">Could not reach the server.</ui-toast>
        </ui-toaster>
    `,
};

/**
 * The clock, at a length a reader can watch run out.
 *
 * Hover it, or tab into it, and the clock stops — a notice must not expire while it is
 * being read. The error beside it carries no clock at all, whatever `duration` says.
 */
export const Timed: StoryObj<ToastArgs> = {
    args: { duration: 8000 },
    render: ({ duration }): TemplateResult => html`
        <ui-toaster>
            <ui-toast variant="success" duration=${duration}>Gone in eight seconds.</ui-toast>
            <ui-toast variant="danger" duration=${duration}>This one waits for you.</ui-toast>
        </ui-toaster>
    `,
};

/**
 * A message long enough to wrap, which is where the layout is decided.
 *
 * The stack is capped rather than sized to its content, so a paragraph does not make a
 * panel out of a notice — and the dismiss button stays where the reader last saw it.
 */
export const Long: StoryObj<ToastArgs> = {
    args: {
        variant: 'warning',
        message:
            'The export finished, but four rows were skipped because they had no billing address on file.',
    },
};

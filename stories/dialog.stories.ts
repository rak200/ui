/**
 * `<ui-dialog>`, one story per thing a reader would go looking for.
 *
 * What the element delegates to the platform and what it writes itself is in
 * `docs/dialog.md`, which CI checks and a consumer opens first. This file shows the
 * component; it does not describe it.
 *
 * **Every story opens from a trigger rather than rendering open**, and that is the
 * demonstration rather than a convenience: focus moving in and then *returning to the
 * button that opened it* is the half of a modal nobody sees until it is missing, and a
 * dialog that was already open when the page loaded has nowhere to return focus to.
 */

// Two lines for one module, and the split is forced: `verbatimModuleSyntax` erases a
// type-only import whole, so a lone `import type` would drop the side effect that
// registers the element and the tags below would never upgrade.
import '@rak200/ui';
import type { UiDialog } from '@rak200/ui';
import { html, type TemplateResult } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface DialogArgs {
    title: string;
    body: string;
}

/** Opens the dialog beside the button that was clicked. */
function opens(event: Event): void {
    const trigger = event.currentTarget;

    if (trigger instanceof HTMLElement) {
        trigger.parentElement?.querySelector<UiDialog>('ui-dialog')?.show();
    }
}

/** Closes the dialog the clicked button is slotted into. */
function closes(event: Event): void {
    const trigger = event.currentTarget;

    if (trigger instanceof HTMLElement) {
        trigger.closest<UiDialog>('ui-dialog')?.close();
    }
}

const meta: Meta<DialogArgs> = {
    title: 'Components/ui-dialog',

    // `argTypes` carry control affordance, not documentation: a name and a control type,
    // so the panel works and nothing more. A `description` here would start the second API
    // surface this playground exists without.
    argTypes: {
        title: { control: 'text' },
        body: { control: 'text' },
    },

    args: {
        title: 'Delete account',
        body: 'This cannot be undone. Everything in the workspace goes with it.',
    },

    render: ({ title, body }): TemplateResult => html`
        <div>
            <ui-button @click=${opens}>Delete account</ui-button>
            <ui-dialog>
                <h2 slot="title">${title}</h2>
                <p>${body}</p>
                <ui-button slot="actions" variant="secondary" @click=${closes}>Cancel</ui-button>
                <ui-button slot="actions" @click=${closes}>Delete</ui-button>
            </ui-dialog>
        </div>
    `,
};

export default meta;

/** The shape a modal is usually reached for: a decision, and the two ways out of it. */
export const Confirm: StoryObj<DialogArgs> = {};

/**
 * Enough content to scroll, which is what the scroll lock is for.
 *
 * Open it and try to scroll the page behind: it does not move, and it does not jump
 * sideways as it stops. `<dialog>` gives a modal the top layer, an inert background and a
 * focus trap; holding the page still is the one piece of modality it leaves to the
 * component, and this is the story that shows it doing so.
 */
export const Long: StoryObj<DialogArgs> = {
    render: ({ title }): TemplateResult => html`
        <div>
            <ui-button @click=${opens}>Read the terms</ui-button>
            <ui-dialog>
                <h2 slot="title">${title}</h2>
                ${Array.from(
                    { length: 12 },
                    (_, index) =>
                        html`<p>
                            Paragraph ${String(index + 1)}. The panel caps its own width and scrolls
                            its own content, so a long dialog stays a dialog rather than becoming
                            the page.
                        </p>`,
                )}
                <ui-button slot="actions" @click=${closes}>Close</ui-button>
            </ui-dialog>
            ${Array.from({ length: 40 }, () => html`<p>Page content behind the dialog.</p>`)}
        </div>
    `,
    args: { title: 'Terms of service' },
};

/**
 * A confirm over a form, which is the ordinary reason two modals are up at once.
 *
 * The second one closing must not hand the page back while the first is still up — the
 * lock is counted rather than flagged, and this is the arrangement that would catch it if
 * it stopped being.
 */
export const Nested: StoryObj<DialogArgs> = {
    render: (): TemplateResult => html`
        <div>
            <ui-button @click=${opens}>Edit workspace</ui-button>
            <ui-dialog>
                <h2 slot="title">Edit workspace</h2>
                <p>Renaming a workspace changes every link that points at it.</p>
                <div>
                    <ui-button variant="secondary" @click=${opens}>Delete instead</ui-button>
                    <ui-dialog>
                        <h2 slot="title">Delete workspace</h2>
                        <p>This cannot be undone.</p>
                        <ui-button slot="actions" @click=${closes}>Keep it</ui-button>
                    </ui-dialog>
                </div>
                <ui-button slot="actions" @click=${closes}>Done</ui-button>
            </ui-dialog>
        </div>
    `,
};

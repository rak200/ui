/**
 * `<ui-menu>`, one story per thing a reader would go looking for.
 *
 * What it delegates and what it writes is in `docs/menu.md`, which CI checks and a consumer
 * opens first. This file shows the component; it does not describe it.
 *
 * **Every story writes native items** — a `<button>` or an `<a href>` — which is the one
 * requirement this component has, and the reason is in the doc: activation, the accessible
 * name and the disabled state stay the platform's.
 */

// Two lines for one module, and the split is forced: `verbatimModuleSyntax` erases a
// type-only import whole, so a lone `import type` would drop the side effect that
// registers the elements and the tags below would never upgrade.
import '@rak200/ui';
import { html, type TemplateResult } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface MenuArgs {
    label: string;
}

const meta: Meta<MenuArgs> = {
    title: 'Components/ui-menu',

    // `argTypes` carry control affordance, not documentation: a name and a control type,
    // so the panel works and nothing more. A `description` here would start the second API
    // surface this playground exists without.
    argTypes: {
        label: { control: 'text' },
    },

    args: {
        label: 'Actions',
    },

    render: ({ label }): TemplateResult => html`
        <div style="padding-block-end: 12rem">
            <ui-menu>
                <span slot="trigger">${label}</span>
                <button type="button">Rename</button>
                <button type="button">Duplicate</button>
                <hr />
                <button type="button">Move to trash</button>
            </ui-menu>
        </div>
    `,
};

export default meta;

/** The ordinary case: click it, or tab to it and press <kbd>↓</kbd>. */
export const Menu: StoryObj<MenuArgs> = {};

/**
 * An item that cannot be chosen, which the keys step over rather than land on.
 *
 * `disabled` is the platform's, so the state is announced without this component writing
 * anything — and the arrow keys skip it because a menu item you cannot activate is not
 * somewhere to be.
 */
export const Disabled: StoryObj<MenuArgs> = {
    render: ({ label }): TemplateResult => html`
        <div style="padding-block-end: 12rem">
            <ui-menu>
                <span slot="trigger">${label}</span>
                <button type="button">Rename</button>
                <button type="button" disabled>Duplicate</button>
                <hr />
                <button type="button">Move to trash</button>
            </ui-menu>
        </div>
    `,
};

/**
 * Links rather than buttons, which is a navigation menu.
 *
 * An `<a href>` is a menu item too — the component asks only that an item be something the
 * browser will focus and activate on its own.
 */
export const Links: StoryObj<MenuArgs> = {
    args: { label: 'Go to' },
    render: ({ label }): TemplateResult => html`
        <div style="padding-block-end: 12rem">
            <ui-menu>
                <span slot="trigger">${label}</span>
                <a href="#overview">Overview</a>
                <a href="#billing">Billing</a>
                <a href="#members">Members</a>
            </ui-menu>
        </div>
    `,
};

/**
 * Against the edges, which is where a menu usually gets placed wrong.
 *
 * The panel hangs from the trigger's leading edge and is pulled back inside the viewport
 * rather than running off it; with no room below, it flips above. The same arithmetic
 * places `<ui-tooltip>`.
 */
export const AtTheEdge: StoryObj<MenuArgs> = {
    render: ({ label }): TemplateResult => html`
        <div style="display: flex; justify-content: space-between; padding-block-start: 60vh">
            <ui-menu>
                <span slot="trigger">${label}</span>
                <button type="button">Rename</button>
                <button type="button">Duplicate</button>
            </ui-menu>
            <ui-menu>
                <span slot="trigger">${label}</span>
                <button type="button">A much longer item than the trigger</button>
                <button type="button">Duplicate</button>
            </ui-menu>
        </div>
    `,
};

/**
 * Hung from the trigger's trailing edge with `align="end"`, as a menu at the end of a toolbar is:
 * the panel ends where its trigger ends, and turns to the leading edge where it would run off the
 * screen, as the one at the start of the row does here.
 */
export const AlignedToTheEnd: StoryObj<MenuArgs> = {
    render: ({ label }): TemplateResult => html`
        <div style="display: flex; justify-content: space-between">
            <ui-menu align="end">
                <span slot="trigger">${label}</span>
                <button type="button">A much longer item than the trigger</button>
                <button type="button">Duplicate</button>
            </ui-menu>
            <ui-menu align="end">
                <span slot="trigger">${label}</span>
                <button type="button">A much longer item than the trigger</button>
                <button type="button">Duplicate</button>
            </ui-menu>
        </div>
    `,
};

/**
 * Items that tick, and sections: two checkboxes, and two sections of radios, each named by its
 * heading. The space bar ticks an item and keeps the menu open; Enter and a click tick it and close
 * it.
 */
export const TicksAndSections: StoryObj<MenuArgs> = {
    render: (): TemplateResult => html`
        <ui-menu>
            <span slot="trigger">View</span>
            <button type="button" role="menuitemcheckbox" aria-checked="true">
                Show the ruler
            </button>
            <button type="button" role="menuitemcheckbox">Show the grid</button>
            <hr />
            <div role="group" aria-labelledby="story-sort">
                <span id="story-sort">Sort by</span>
                <button type="button" role="menuitemradio" aria-checked="true">Name</button>
                <button type="button" role="menuitemradio" aria-checked="false">Date</button>
            </div>
            <hr />
            <div role="group" aria-labelledby="story-size">
                <span id="story-size">Size</span>
                <button type="button" role="menuitemradio" aria-checked="false">Small</button>
                <button type="button" role="menuitemradio" aria-checked="true">Large</button>
            </div>
        </ui-menu>
    `,
};

/**
 * A shortcut and a description on an item: the host's `<kbd>` drawn at the item's end, and its
 * element marked `data-ui-description` under the label, heard after the item's name.
 */
export const ShortcutsAndDescriptions: StoryObj<MenuArgs> = {
    render: (): TemplateResult => html`
        <ui-menu>
            <span slot="trigger">File</span>
            <button type="button">
                Rename <kbd>F2</kbd><span data-ui-description>Give the file a new name.</span>
            </button>
            <button type="button">Duplicate <kbd>Ctrl+D</kbd></button>
            <hr />
            <button type="button">
                Delete <kbd>Del</kbd
                ><span data-ui-description>It goes to the bin for a month.</span>
            </button>
        </ui-menu>
    `,
};

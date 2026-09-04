/**
 * `<ui-tooltip>`, one story per thing a reader would go looking for.
 *
 * What it delegates and what it refuses is in `docs/tooltip.md`, which CI checks and a
 * consumer opens first. This file shows the component; it does not describe it.
 *
 * **Every story writes its own trigger**, and every trigger is a natively focusable
 * element — which is the one requirement this component has, and the reason is in the doc:
 * an IDREF does not cross a shadow boundary, so the description has to reach an element
 * the browser will actually focus.
 */

// Two lines for one module, and the split is forced: `verbatimModuleSyntax` erases a
// type-only import whole, so a lone `import type` would drop the side effect that
// registers the elements and the tags below would never upgrade.
import '@rak200/ui';
import { html, type TemplateResult } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface TooltipArgs {
    label: string;
    tip: string;
}

const meta: Meta<TooltipArgs> = {
    title: 'Components/ui-tooltip',

    // `argTypes` carry control affordance, not documentation: a name and a control type,
    // so the panel works and nothing more. A `description` here would start the second API
    // surface this playground exists without.
    argTypes: {
        label: { control: 'text' },
        tip: { control: 'text' },
    },

    args: {
        label: 'Save',
        tip: 'Saves without closing the dialog.',
    },

    render: ({ label, tip }): TemplateResult => html`
        <div style="padding-block: 6rem; display: flex; justify-content: center">
            <ui-tooltip>
                <ui-button>${label}</ui-button>
                <span slot="tip">${tip}</span>
            </ui-tooltip>
        </div>
    `,
};

export default meta;

/**
 * The ordinary case: hover it, or tab to it.
 *
 * The trigger here is a `<ui-button>`, which is the one trigger whose *description* does
 * not arrive — its `<button>` lives in a shadow root, and an IDREF does not cross that
 * boundary in either direction. It is shown anyway because it is what a reader will try
 * first, and `docs/tooltip.md` says what to write instead when the text has to be
 * announced.
 */
export const Tooltip: StoryObj<TooltipArgs> = {};

/**
 * A native trigger, which is the one whose description actually reaches a screen reader.
 */
export const OnAField: StoryObj<TooltipArgs> = {
    args: { label: 'Amount', tip: 'Two decimals, in BRL.' },
    render: ({ label, tip }): TemplateResult => html`
        <div style="padding-block: 6rem; max-inline-size: 20rem; margin-inline: auto">
            <ui-field>
                <label slot="label">${label}</label>
                <ui-tooltip>
                    <input type="number" name="amount" />
                    <span slot="tip">${tip}</span>
                </ui-tooltip>
            </ui-field>
        </div>
    `,
};

/**
 * Against the edge of the viewport, which is the case a tooltip usually gets wrong.
 *
 * The tip is pulled back inside rather than centred off the screen, and it flips below the
 * trigger when there is no room above.
 */
export const AtTheEdge: StoryObj<TooltipArgs> = {
    args: { tip: 'A description long enough that centring it would run off the edge.' },
    render: ({ tip }): TemplateResult => html`
        <div style="display: flex; justify-content: space-between">
            <ui-tooltip>
                <button type="button">Left</button>
                <span slot="tip">${tip}</span>
            </ui-tooltip>
            <ui-tooltip>
                <button type="button">Right</button>
                <span slot="tip">${tip}</span>
            </ui-tooltip>
        </div>
    `,
};

/**
 * Inside something that clips, which is the other case it usually gets wrong.
 *
 * The tip is a popover, so the platform promotes it to the top layer and it is not clipped
 * by the box around it — with no `z-index` anywhere in this component to tune.
 */
export const Inside: StoryObj<TooltipArgs> = {
    render: ({ tip }): TemplateResult => html`
        <div style="padding-block: 6rem; display: flex; justify-content: center">
            <div style="overflow: hidden; block-size: 2.5rem; inline-size: 8rem; padding: 0.25rem">
                <ui-tooltip>
                    <button type="button">Save</button>
                    <span slot="tip">${tip}</span>
                </ui-tooltip>
            </div>
        </div>
    `,
};

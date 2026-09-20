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
 * The trigger is a `<ui-button>`, which focuses a `<button>` in its own shadow root — so
 * the `aria-describedby` this element writes reaches it in neither direction. **The
 * sentence is handed over instead**, and `<ui-button>` renders it where its own control
 * can be described by it, which is RFC 0006's first rollout step. Nothing here says so:
 * the composition is the same one that did not work before.
 *
 * The other seven controls arrive in order; until each does, the console says so on sight
 * and `docs/tooltip.md` says what to write in the meantime.
 */
export const Tooltip: StoryObj<TooltipArgs> = {};

/**
 * A native trigger, which needs no handoff at all: the control is in the host's tree, so
 * both ends of the reference already are. This is the path that never broke, and the one
 * the whole package returns to the day Reference Target lands.
 */
export const OnAControlYouWrote: StoryObj<TooltipArgs> = {
    args: { label: 'Amount', tip: 'Two decimals, in BRL.' },
    render: ({ label, tip }): TemplateResult => html`
        <div style="padding-block: 6rem; max-inline-size: 20rem; margin-inline: auto">
            <label for="amount" style="display: block; margin-block-end: 0.5rem">${label}</label>
            <ui-tooltip>
                <input id="amount" type="number" name="amount" />
                <span slot="tip">${tip}</span>
            </ui-tooltip>
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

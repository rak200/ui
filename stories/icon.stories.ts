/**
 * `<ui-icon>`, one story per thing a reader would go looking for.
 *
 * Which glyphs exist, what a name costs and how the accessible name is decided are in
 * `docs/icon.md`, which CI checks and a consumer opens first. This file shows the
 * component; it does not describe it.
 *
 * **The imports below are the demonstration**, not boilerplate: a glyph module is imported
 * for its side effect, and the markup underneath starts working. A page that imported none
 * of them would draw nothing and say so in the console.
 */

// Two lines for one module, and the split is forced: `verbatimModuleSyntax` erases a
// type-only import whole, so a lone `import type` would drop the side effect that
// registers the elements and the tags below would never upgrade.
import '@rak200/ui';
import '@rak200/ui/icons/x.js';
import '@rak200/ui/icons/check.js';
import '@rak200/ui/icons/circle-alert.js';
import '@rak200/ui/icons/search.js';
import '@rak200/ui/icons/trash-2.js';
import { html, type TemplateResult } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface IconArgs {
    name: string;
    label: string;
}

const meta: Meta<IconArgs> = {
    title: 'Components/ui-icon',

    // `argTypes` carry control affordance, not documentation: a name and a control type,
    // so the panel works and nothing more.
    argTypes: {
        name: { control: 'select', options: ['x', 'check', 'circle-alert', 'search', 'trash-2'] },
        label: { control: 'text' },
    },

    args: { name: 'check', label: '' },

    render: ({ name, label }): TemplateResult =>
        html`<ui-icon name=${name} label=${label}></ui-icon>`,
};

export default meta;

/**
 * Beside a word, which is where most icons live — and where they must stay silent.
 *
 * No `label`, so the element is `aria-hidden`. The word is the accessible name already,
 * and an icon that repeats it makes a screen reader say the same thing twice.
 */
export const Decorative: StoryObj<IconArgs> = {
    render: (): TemplateResult => html`
        <div style="display: flex; align-items: center; gap: 0.5rem">
            <ui-icon name="check"></ui-icon>
            Saved
        </div>
    `,
};

/** With a name of its own, for when the icon carries meaning nothing beside it repeats. */
export const Named: StoryObj<IconArgs> = {
    args: { name: 'circle-alert', label: 'Warning' },
};

/**
 * The case the accessible name exists for.
 *
 * An icon-only button has nowhere else to get a name from — take the `label` off and the
 * control announces as an unnamed button, which axe reports at critical impact.
 */
export const IconOnly: StoryObj<IconArgs> = {
    render: (): TemplateResult => html`
        <div style="display: flex; gap: 0.5rem">
            <ui-button><ui-icon name="search" label="Search"></ui-icon></ui-button>
            <ui-button variant="secondary"
                ><ui-icon name="trash-2" label="Delete"></ui-icon
            ></ui-button>
        </div>
    `,
};

/**
 * The colour is never set here, and that is the point.
 *
 * Every glyph strokes with `currentColor`, so one registration serves a primary button, a
 * danger message and body text without three of anything.
 */
export const Inherited: StoryObj<IconArgs> = {
    render: (): TemplateResult => html`
        <div style="display: flex; align-items: center; gap: 1rem">
            <span style="color: #1f2937"><ui-icon name="check"></ui-icon></span>
            <span style="color: #b91c1c"><ui-icon name="circle-alert"></ui-icon></span>
            <span style="color: #2563eb"><ui-icon name="search"></ui-icon></span>
        </div>
    `,
};

/**
 * Sized in `em`, so an icon beside a word is the size of that word by default.
 *
 * `--ui-icon-size` is the knob; a host who wants a fixed size sets one, and a host who
 * wants it to follow the text already has that.
 */
export const Sizes: StoryObj<IconArgs> = {
    render: (): TemplateResult => html`
        <div style="display: flex; align-items: center; gap: 1rem">
            <span style="font-size: 0.875rem"><ui-icon name="check"></ui-icon> pequeno</span>
            <span style="font-size: 1rem"><ui-icon name="check"></ui-icon> normal</span>
            <span style="font-size: 1.5rem"><ui-icon name="check"></ui-icon> grande</span>
            <ui-icon name="check" style="--ui-icon-size: 3rem"></ui-icon>
        </div>
    `,
};

/**
 * A mark the adopted set does not have, slotted rather than registered.
 *
 * Brand and domain glyphs are the case that stays in scope for drawing by hand — on the
 * adopted grid, so they are indistinguishable from a vendored one. The stroke, the caps
 * and the colour are applied to the slotted `<svg>` exactly as they are to a drawn glyph.
 */
export const Bespoke: StoryObj<IconArgs> = {
    render: (): TemplateResult => html`
        <div style="display: flex; align-items: center; gap: 0.75rem">
            <ui-icon label="Our mark">
                <svg viewBox="0 0 24 24"><path d="M12 3 3 21h18Z" /></svg>
            </ui-icon>
            <ui-icon name="check"></ui-icon>
            <span>the same grid, the same stroke</span>
        </div>
    `,
};

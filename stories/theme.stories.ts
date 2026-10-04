/**
 * The themes this package ships, one story each, rendered over the real components.
 *
 * **A shipped theme carries a story, and that is what puts it inside the bar.** RFC 0002 made a
 * theme's contrast an obligation only where this suite renders it, and `tests/theme.test.ts`
 * runs the accessibility assertion over each story here in both schemes. What each theme is
 * for is in `docs/theme.md`; this file shows it.
 */

// Two lines for one module, and the split is forced: `verbatimModuleSyntax` erases a
// type-only import whole, so a lone `import type` would drop the side effect that
// registers the elements and the tags below would never upgrade.
import '@rak200/ui';
import { glass, matrix, themeStyleSheet, type Theme } from '@rak200/ui';
import { html, type TemplateResult } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

/** The theme's own block, inserted the way a host inserts it, beside the token sheet. */
function sheet(theme: Theme): HTMLStyleElement {
    const element = document.createElement('style');
    element.textContent = themeStyleSheet(theme);

    return element;
}

/**
 * One scheme's worth of components, under the theme, on `page` — the theme's surface unless
 * the theme lets the page through, where it is the page the theme documents holding over.
 */
function panel(
    theme: Theme,
    scheme: 'light' | 'dark',
    page = 'var(--ui-color-surface)',
): TemplateResult {
    return html`
        <section
            data-ui-theme=${theme.name}
            data-scheme=${scheme}
            style="color-scheme: ${scheme}; display: grid; gap: 1rem; padding: 1.25rem;
                background: ${page}; color: var(--ui-color-text);
                font-family: var(--ui-font)"
        >
            <ui-card>
                <h3 slot="header" style="margin: 0">Transfer</h3>
                <ui-input label="Amount" name="amount-${scheme}" value="120.00"></ui-input>
                <ui-select label="Account" name="account-${scheme}">
                    <ui-option value="checking">Checking</ui-option>
                    <ui-option value="savings">Savings</ui-option>
                </ui-select>
                <ui-checkbox label="Save as a template" name="save-${scheme}" checked></ui-checkbox>
                <ui-switch label="Notify me" name="notify-${scheme}"></ui-switch>
                <div slot="footer" style="display: flex; gap: 0.5rem">
                    <ui-button>Send</ui-button>
                    <ui-button variant="secondary">Cancel</ui-button>
                </div>
            </ui-card>
            <div style="display: grid; gap: 0.5rem">
                <ui-toast duration="0">Draft saved.</ui-toast>
                <ui-toast variant="success" duration="0">Transfer sent.</ui-toast>
                <ui-toast variant="danger">Could not reach the bank.</ui-toast>
            </div>
        </section>
    `;
}

const meta: Meta = {
    title: 'Themes',
};

export default meta;

/**
 * Matrix, in both of its schemes: a terminal's green on near-black, and the same idea on
 * white. The raised surfaces glow through the elevation step they already read.
 */
export const Matrix: StoryObj = {
    render: (): TemplateResult => html`
        ${sheet(matrix)}
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr))">
            ${panel(matrix, 'light')}${panel(matrix, 'dark')}
        </div>
    `,
};

/**
 * Glass, in both of its schemes, over the page it documents holding over: the darkest grey in
 * the light scheme and the lightest in the dark. A flat page rather than a busy one, because
 * that is the page the accessibility assertion measures correctly — over an image it would
 * pass however unreadable the glass was, RFC 0003 measured.
 */
export const Glass: StoryObj = {
    render: (): TemplateResult => html`
        ${sheet(glass)}
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr))">
            ${panel(glass, 'light', '#cecece')}${panel(glass, 'dark', '#303030')}
        </div>
    `,
};

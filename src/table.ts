import { LitElement, css, html, type CSSResult, type TemplateResult } from 'lit';
import { reference } from './reference.js';

/**
 * The rules that cannot live in a shadow root, and the reason they cannot.
 *
 * `::slotted()` matches the **top level** of what a slot was given and nothing below it.
 * `<ui-select>` styles one `::slotted(select)` and needs no more; a table is a tree — the
 * cells, the rows, the header and the caption are all descendants of the slotted element,
 * and no selector written inside a shadow root reaches them. Measured, and it is not a
 * quirk to route around: shadow CSS is scoped to its own tree, and the host's table is in
 * the host's tree.
 *
 * So these rules are adopted into **that** tree instead, and `#adopt()` finds it with
 * `getRootNode()` rather than reaching for `document` — a `<ui-table>` inside another
 * component's shadow root has to be styled in that shadow root, and hardcoding the
 * document would leave it bare exactly there.
 *
 * Every selector is prefixed with the element, so what is adopted cannot reach a table
 * the host wrote somewhere else.
 */
const rules: CSSResult = css`
    ui-table table {
        /* The box the cells' own borders are drawn against: separate borders would double
           every internal rule and leave a gap at each junction. */
        border-collapse: collapse;
        inline-size: 100%;
        font-family: ${reference('--ui-font')};
        /* The pair, never half of it — the argument src/card.ts makes beside its own. */
        color: ${reference('--ui-color-text')};
        background: ${reference('--ui-color-surface')};
    }

    ui-table th,
    ui-table td {
        padding: ${reference('--ui-space')};
        /* start rather than left, so a right-to-left page needs no second rule — and
           declared at all because the platform centres a th and only a th, which makes a
           header sit off the column it heads. A host aligning a numeric column writes
           text-align on their own cells; it inherits, so nothing here has to offer it. */
        text-align: start;
        vertical-align: top;
        border-block-end: 1px solid ${reference('--ui-color-border')};
    }

    /* The header rests on the second surface tone rather than on a heavier rule, so a
       table with one row still reads as having a header. font-weight is the platform's
       own on a th and is deliberately not restated. */
    ui-table thead th {
        background: ${reference('--ui-color-surface-muted')};
    }

    /* Zebra rows, on the same tone. nth-child rather than nth-of-type: a tbody holds tr
       and nothing else, so the two agree, and the first is what a reader expects to find.

       Scoped to tbody on purpose — a striped thead or tfoot would be counting rows the
       reader is not scanning. */
    ui-table tbody tr:nth-child(even) {
        background: ${reference('--ui-color-surface-muted')};
    }

    /* Below the table rather than above it, which is the platform's default reversed on
       purpose: a caption that explains a table reads after it, and one that titles it is a
       heading the host writes outside this element. */
    ui-table caption {
        caption-side: bottom;
        text-align: start;
        padding-block: ${reference('--ui-space')};
        color: ${reference('--ui-color-text-muted')};
        font-size: ${reference('--ui-text-supporting')};
    }
`;

/** One sheet for the whole page, adopted per tree — see {@link rules}. */
const sheet = new CSSStyleSheet();
sheet.replaceSync(rules.cssText);

/**
 * A table, styled rather than rendered.
 *
 * **The `<table>` is yours**, and the whole of it: the rows, the cells, the header and the
 * caption. This element writes no markup from data, which is the same shape `<ui-select>`
 * and `<ui-input>` have and is chosen for a stronger reason here — a table's semantics are
 * the host's subject, and a component that generates them is guessing at which column is a
 * header and what the caption should say.
 *
 * **Explicitly not a data grid.** Sorting, selection, virtualization, editing and
 * pagination are each an accessibility project of its own, and RFC 0016 defers all five.
 * A `sortable` attribute here would reopen that decision, and `docs/table.md` says so
 * where a consumer looks rather than leaving them to discover it in review.
 *
 * **It claims no role**, for the reason `<ui-card>` claims none: the platform already has
 * the element that means *table*, and the host wrote it. What this adds is the surface
 * around it.
 *
 * **The element scrolls, and it is focusable because it scrolls.** A region that overflows
 * and cannot be reached by keyboard is unusable by keyboard, which is WCAG 2.1.1 — so the
 * tab stop is not decoration. It is unconditional rather than measured, and that costs one
 * tab stop on a table that happens to fit; the alternative watches every table's size
 * forever to save it, which is the more expensive mistake.
 *
 * The name is left to the host: a scrollable region wants one, and the caption that would
 * give it is in the host's tree where an IDREF from here cannot resolve. So write
 * `aria-label` on this element, which is in one tree with nothing to miswire.
 *
 * @example
 * ```html
 * <ui-table aria-label="Invoices">
 *   <table>
 *     <caption>Every invoice raised this quarter.</caption>
 *     <thead>
 *       <tr><th scope="col">Number</th><th scope="col">Total</th></tr>
 *     </thead>
 *     <tbody>
 *       <tr><td>0001</td><td>R$ 1.200,00</td></tr>
 *     </tbody>
 *   </table>
 * </ui-table>
 * ```
 */
export class UiTable extends LitElement {
    static override readonly styles: CSSResult = css`
        :host {
            display: block;
            /* The scroll lives on the element itself rather than on a wrapper in the
               shadow root, and that is what lets the host name it: aria-label on a box in
               here would be a name written by this package, and the element is the one
               node a consumer already has their hands on. */
            overflow-x: auto;
            border: 1px solid ${reference('--ui-color-border')};
            border-radius: ${reference('--ui-radius')};
        }

        /* A visible focus ring is not decoration: removing it is the single most common
           way a component stops being usable by keyboard. */
        :host(:focus-visible) {
            outline: 2px solid ${reference('--ui-color-focus')};
            outline-offset: 2px;
        }
    `;

    override connectedCallback(): void {
        super.connectedCallback();
        this.#adopt();

        // Not `setAttribute` unless it is absent: a host who wrote their own tabindex —
        // taking the element out of the tab order deliberately, or putting it somewhere
        // specific in it — has made a decision, and this would overwrite it on every
        // reconnection a framework performs.
        if (!this.hasAttribute('tabindex')) {
            this.setAttribute('tabindex', '0');
        }
    }

    /**
     * Puts {@link rules} in the tree this element is in.
     *
     * Run from `connectedCallback` rather than once at import, because the tree is not
     * known until there is an element in one — and a second element in the same tree finds
     * the sheet already there.
     */
    #adopt(): void {
        // `connectedCallback` runs when the element is connected to a document, so the
        // root is a `Document` or a `ShadowRoot` and never a bare fragment. Both carry
        // `adoptedStyleSheets`; asserted rather than narrowed, because the branch a guard
        // would add is one no connected element can take.
        const root = this.getRootNode() as Document | ShadowRoot;

        if (!root.adoptedStyleSheets.includes(sheet)) {
            root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
        }
    }

    override render(): TemplateResult {
        return html`<slot></slot>`;
    }
}

// Stryker disable next-line StringLiteral: the registration runs once, at import, inside
// the warm process Stryker switches mutants in — so by the time a mutant on this line is
// active the element is already defined under the original name, and no test can observe
// the change. Outside the runner's reach, not an equivalent mutant.
customElements.define('ui-table', UiTable);

declare global {
    interface HTMLElementTagNameMap {
        'ui-table': UiTable;
    }
}

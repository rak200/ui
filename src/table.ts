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
        background: ${reference('--ui-color-surface-control')};
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
 * **The element scrolls, and it takes a tab stop while it overflows.** A region that
 * overflows and cannot be reached by keyboard is unusable by keyboard, which is WCAG 2.1.1.
 * Chromium and Firefox make an overflowing box focusable of their own accord and leave one
 * that fits alone; WebKit does neither, so this element writes the stop itself, by the same
 * rule, in all three. A table that fits takes no stop, and a click in one of its cells
 * leaves the focus where it was.
 *
 * **It needs no name.** A focusable box that exposes the `generic` role it has does not fail
 * 4.1.2, which is what the WCAG working group answered in w3c/wcag#3029, and ARIA prohibits
 * naming a `generic`: the `<caption>` is what names the table. A host that wants the box to
 * be a named region writes `role="region"` and the name on it, which makes the name valid.
 *
 * @example
 * ```html
 * <ui-table>
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
    /** The styles its shadow root adopts. */
    static override readonly styles: CSSResult = css`
        :host {
            display: block;
            /* The scroll lives on the element itself rather than on a wrapper in the
               shadow root, so the box that scrolls and takes the stop is the one node a
               consumer already has their hands on: a tabindex or a role they write lands
               on what scrolls. */
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

    /** The attributes it watches: Lit's own, and the tab stop, which is this element's or the host's. */
    static override get observedAttributes(): string[] {
        return [...super.observedAttributes, 'tabindex'];
    }

    /**
     * Whether the tab stop is this element's to write.
     *
     * It is until the host writes a `tabindex` of their own — taking the element out of the tab
     * order, or putting it somewhere specific in it — and again once the host takes theirs away.
     * Decided by who last changed the attribute rather than by whether it is there, so the stop
     * this element wrote is not taken for the host's when a framework moves the element.
     */
    #owned = true;

    /** Set while this element writes the stop, so its own write is not read as the host's. */
    #writing = false;

    /**
     * The tables that rendered since the last pass, which one microtask weighs together. Every
     * box is read before any stop is written, so a page that renders many tables at once lays
     * out once rather than once per table. Measured in WebKit on 500 tables: weighed one by one
     * as each rendered, they took 834ms to render; weighed together, 169ms to render and lay
     * out, against 156ms with the stop written unread.
     */
    static readonly #rendered: UiTable[] = [];

    /** The pass the tables above are waiting for, while one is pending. */
    static #pass: Promise<void> | undefined;

    /**
     * Watches the box and what it holds, either of which can start or end the overflow: the
     * box narrows with the page, and the table widens with what is written in it. A callback
     * runs only when one of them changes size, so a page that is not resizing pays nothing.
     */
    readonly #watching = new ResizeObserver(() => {
        this.#measure();
    });

    /** Weighs the stop again once the focus has left, which is the one time a kept stop can go. */
    constructor() {
        super();

        // A microtask, so the focus has moved on before the stop is weighed.
        this.addEventListener('focusout', () => {
            queueMicrotask(() => {
                this.#measure();
            });
        });
    }

    /** Styles the table in the tree it joined. */
    override connectedCallback(): void {
        super.connectedCallback();
        this.#adopt();
    }

    /**
     * Weighs the stop as the element first renders, with every table that rendered beside it,
     * so a script that waits for `updateComplete`, axe included, finds the stop there. The
     * observer's first answer comes a frame later, before that frame is painted.
     */
    override firstUpdated(): void {
        UiTable.#rendered.push(this);
        UiTable.#pass ??= Promise.resolve().then(() => {
            UiTable.#pass = undefined;

            const weighed = UiTable.#rendered
                .splice(0)
                .map((table) => [table, table.#stop()] as const);

            for (const [table, stop] of weighed) {
                table.#write(stop);
            }
        });
    }

    /** Waits, beyond Lit's own update, for the pass that weighs the stop as the element renders. */
    protected override async getUpdateComplete(): Promise<boolean> {
        const complete = await super.getUpdateComplete();

        await UiTable.#pass;

        return complete;
    }

    /** Hands the stop to the host when they write a `tabindex`, and takes it back when they remove it. */
    override attributeChangedCallback(
        name: string,
        old: string | null,
        value: string | null,
    ): void {
        // Stryker disable next-line CallExpression: Lit maps an attribute to a reactive
        // property here, and this element has none — `tabindex` is the only attribute it
        // observes, so the call does nothing today. Lit requires it of an override, and the
        // day a property arrives the mutant stops being equivalent.
        super.attributeChangedCallback(name, old, value);

        if (!this.#writing) {
            this.#owned = value === null;
            this.#measure();
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

    /**
     * Watches the box and every element it was given, from each `slotchange` — the first
     * assignment is one, so a table that arrives later or replaces the first is watched too.
     */
    #watch(): void {
        // Stryker disable next-line CallExpression: what this lets go of is a table the host
        // took out, and a box out of the document reports a size of nothing, which the
        // callback answers from the element as it is now. Nothing a test can reach behaves
        // differently; it is here so a replaced table is not held for the life of the element.
        this.#watching.disconnect();
        this.#watching.observe(this);

        for (const child of this.children) {
            this.#watching.observe(child);
        }
    }

    /** Weighs the stop and writes what it found, for the observer, the focus and the host. */
    #measure(): void {
        this.#write(this.#stop());
    }

    /**
     * Whether the box needs the stop: while it overflows, on either axis, and while it has the
     * focus, where taking the stop away would drop the focus on the page.
     */
    #stop(): boolean {
        return (
            this.scrollWidth > this.clientWidth ||
            this.scrollHeight > this.clientHeight ||
            this.matches(':focus')
        );
    }

    /** Writes the stop or takes it away, unless the stop is the host's to decide. */
    #write(stop: boolean): void {
        if (!this.#owned) {
            return;
        }

        this.#writing = true;

        if (stop) {
            this.setAttribute('tabindex', '0');
        } else {
            this.removeAttribute('tabindex');
        }

        this.#writing = false;
    }

    /** The default slot, where the host's own `<table>` goes. */
    override render(): TemplateResult {
        return html`<slot
            @slotchange=${() => {
                this.#watch();
            }}
        ></slot>`;
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

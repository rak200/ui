import { LitElement, css, html, nothing, type CSSResult, type TemplateResult } from 'lit';
import { UiButton } from './button.js';

/**
 * The rules that join a group's buttons, which cannot live in its shadow root.
 *
 * **A button's corners are drawn on the button in its own root**, which the group reaches only by
 * `::part(button)`, and `::slotted()` takes no `::part()` after it. So these rules are adopted into
 * the tree the buttons are in, which `getRootNode()` finds, as `<ui-table>` adopts its own: a group
 * inside another component's shadow root is joined there. The button learns nothing: measured for
 * RFC 0010, in Chromium 153, Firefox 155 and WebKit 26.5, the button took the corners it was given
 * from outside, and so did the three layers its effects are drawn on, which take theirs from it.
 * Right to left, the logical corners turned with the row.
 *
 * **The edges meet as one line**: each button after the first is drawn one pixel back over the
 * one before, where its edge lies, so two secondary buttons share an edge rather than drawing
 * two. The button under the pointer, or holding the focus, is drawn over its neighbours, so its
 * edge, its effects and the ring the keys show are whole.
 *
 * Every selector is the group's own child, so what is adopted reaches no button elsewhere.
 */
export const rules: CSSResult = css`
    ui-button-group > ui-button:not(:first-child)::part(button) {
        border-start-start-radius: 0;
        border-end-start-radius: 0;
    }

    ui-button-group > ui-button:not(:last-child)::part(button) {
        border-start-end-radius: 0;
        border-end-end-radius: 0;
    }

    ui-button-group > ui-button + ui-button {
        margin-inline-start: -1px;
    }

    ui-button-group > ui-button:is(:hover, :focus-within) {
        z-index: 1;
    }
`;

/** One sheet for the whole page, adopted once into each tree a group joins — see {@link rules}. */
const sheet = new CSSStyleSheet();
sheet.replaceSync(rules.cssText);

/**
 * Buttons drawn as one: joined in a row, the corners they share squared, and named together.
 *
 * **The group is a role the root draws round the buttons**, `group`, and `toolbar` where it takes a
 * toolbar's keyboard: the buttons stay the host's, slotted, and are inside it, since containment
 * crosses a root where a reference does not, as `<ui-radio-group>`'s radios are inside the
 * `radiogroup` it draws. Its name is `label`, a string the root writes on the role, since a
 * reference from in here reaches nothing in the page.
 *
 * **A toolbar is one tab stop, which the arrows move through**, the APG's toolbar pattern: the
 * button the reader was on last keeps `tabindex="0"` and every other takes `-1`, the arrows move to
 * the next and the previous, turned right to left, and wrap at either end, and Home and End go to
 * the ends. That roves over the buttons' elements, which is why `<ui-button>` delegates its focus:
 * a `tabindex` on one decides its button's stop, and `focus()` on it lands on its button. A button
 * that is disabled is passed by, as the keys cannot reach it; one marked `aria-disabled` is
 * reached, as the APG asks of a toolbar's.
 *
 * @example
 * ```html
 * <ui-button-group label="Alignment" toolbar>
 *   <ui-button toggle pressed type="button">Left</ui-button>
 *   <ui-button toggle type="button">Centre</ui-button>
 *   <ui-button toggle type="button">Right</ui-button>
 * </ui-button-group>
 * ```
 */
export class UiButtonGroup extends LitElement {
    /** The styles its shadow root adopts. */
    static override readonly styles: CSSResult = css`
        :host {
            display: inline-block;
            vertical-align: middle;
        }

        div {
            display: flex;
            align-items: stretch;
        }
    `;

    /** The properties Lit observes on this element. */
    static override readonly properties = {
        label: { type: String, reflect: true },
        toolbar: { type: Boolean, reflect: true },
    };

    /** The name the group is read by, written on the role the root draws. Reflected. */
    label = '';

    /**
     * Whether the group is a toolbar: one tab stop, which the arrows, Home and End move through.
     * Reflected.
     */
    toolbar = false;

    /** The button the reader was on last, which keeps a toolbar's one stop. */
    #current: UiButton | undefined;

    /** Weighs the stop again as a button is disabled or enabled, which no slot reports. */
    readonly #watching = new MutationObserver(() => {
        this.#rove();
    });

    /** Hears the keys and the focus of every button in it. */
    constructor() {
        super();
        this.addEventListener('keydown', this.#keyed);
        this.addEventListener('focusin', this.#arrived);
    }

    /** Joins the buttons in the tree it joined, and watches them for a button disabled. */
    override connectedCallback(): void {
        super.connectedCallback();

        // `connectedCallback` runs when the element is connected to a document, so the root is a
        // `Document` or a `ShadowRoot`, both of which carry `adoptedStyleSheets`.
        const root = this.getRootNode() as Document | ShadowRoot;

        if (!root.adoptedStyleSheets.includes(sheet)) {
            root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
        }

        this.#watching.observe(this, {
            subtree: true,
            attributes: true,
            attributeFilter: ['disabled'],
        });
    }

    /** Lets go of the buttons it watched. */
    override disconnectedCallback(): void {
        // Stryker disable next-line CallExpression: the reading `src/table.ts` carries at its
        // own, verified again here rather than inherited. In Lit this reaches exactly two things
        // — `__controllers`, and `__childPart.setConnected(false)`, which speaks only to async
        // directives — and this element has neither: nothing registers a reactive controller and
        // the template is a role, a slot and a listener. So no input distinguishes the call from
        // its absence. It stays because Lit documents the super call as the extension point it
        // reserves for later additions: the day this element grows a controller or an async
        // directive the mutant stops being equivalent, and nothing else would say so.
        super.disconnectedCallback();
        this.#watching.disconnect();
    }

    /** Weighs the stop once the group is drawn, as a toolbar or as a group. */
    override updated(): void {
        this.#rove();
    }

    /** The buttons the group holds, in their order. */
    #buttons(): UiButton[] {
        return [...this.children].filter((child) => child instanceof UiButton);
    }

    /** The buttons the keys can reach, which a disabled one is not. */
    #reachable(): UiButton[] {
        return this.#buttons().filter((button) => !button.matches(':disabled'));
    }

    /**
     * Writes the one stop of a toolbar: `0` on the button the reader was on last, or the first
     * the keys can reach, and `-1` on every other. A group that is no toolbar writes none, and
     * takes away what it wrote, so each button keeps its own stop.
     */
    readonly #rove = (): void => {
        const buttons = this.#buttons();

        if (!this.toolbar) {
            for (const button of buttons) {
                button.removeAttribute('tabindex');
            }

            return;
        }

        const reachable = this.#reachable();
        const current = reachable.find((button) => button === this.#current) ?? reachable[0];

        for (const button of buttons) {
            button.setAttribute('tabindex', button === current ? '0' : '-1');
        }
    };

    /** Takes the button the focus came to as the stop, by the keys, the pointer or a script. */
    readonly #arrived = (event: FocusEvent): void => {
        const button = this.#buttons().find((one) => one === event.target);

        if (button !== undefined) {
            this.#current = button;
            this.#rove();
        }
    };

    /** Moves a toolbar's focus by the arrows, turned right to left, and by Home and End. */
    readonly #keyed = (event: KeyboardEvent): void => {
        if (!this.toolbar) {
            return;
        }

        const reachable = this.#reachable();
        const at = reachable.findIndex((button) => button === event.target);
        const turned = this.matches(':dir(rtl)');
        const offsets: Readonly<Record<string, number>> = {
            ArrowRight: turned ? -1 : 1,
            ArrowLeft: turned ? 1 : -1,
        };
        const offset = offsets[event.key];
        let next: UiButton | undefined;

        if (offset !== undefined) {
            // A key from no button the keys reach finds no place, and the modulo none either.
            next = reachable[(at + offset + reachable.length) % reachable.length];
        } else if (event.key === 'Home') {
            next = reachable[0];
        } else if (event.key === 'End') {
            next = reachable[reachable.length - 1];
        }

        if (next === undefined || at === -1) {
            return;
        }

        event.preventDefault();
        next.focus();
    };

    /** The role round the slotted buttons, named by `label`. */
    override render(): TemplateResult {
        return html`<div
            role=${this.toolbar ? 'toolbar' : 'group'}
            aria-label=${this.label === '' ? nothing : this.label}
            part="group"
        >
            <slot @slotchange=${this.#rove}></slot>
        </div>`;
    }
}

// Stryker disable next-line StringLiteral: the registration runs once, at import,
// inside the warm process Stryker switches mutants in — so by the time a mutant on this
// line is active the element is already defined under the original name, and no test can
// observe the change. Outside the runner's reach, not an equivalent mutant.
customElements.define('ui-button-group', UiButtonGroup);

declare global {
    interface HTMLElementTagNameMap {
        'ui-button-group': UiButtonGroup;
    }
}

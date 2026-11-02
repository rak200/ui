import { LitElement, css, html, type CSSResult, type TemplateResult } from 'lit';
import { surfaceEffects } from './effects.js';
import { held, released } from './held.js';
import { erode, materialize, mend } from './pieces.js';
import { follow } from './pointer.js';
import { reference } from './reference.js';

/**
 * A container: a surface with a boundary, a corner and a lift.
 *
 * **Presentational, and deliberately not interactive.** A card that reacts to a click is a
 * button or a link, and both already exist — here and in the platform. This element grows
 * no `clickable` attribute, because the first thing such an attribute has to do is
 * reimplement keyboard activation, the accessible name and the disabled semantics that
 * `<button>` and `<a>` carry for free. `docs/card.md` sends a reader there rather than
 * leaving them to find out.
 *
 * **It claims no role either.** There is no card element and no APG pattern for one, so
 * the shadow root renders slots and, beside them, the empty layers its effects are drawn on —
 * nothing that means anything: what a card *means* is the host's, and
 * they say it by slotting a heading, or by writing `<article>` around this element when
 * the content really is self-contained. A `role` invented here would be one every consumer
 * inherits and none of them chose.
 *
 * **Three regions, ordered here rather than in the host's markup.** The slots are declared
 * header, body, footer, so that is the order they render in whatever order the host wrote
 * them — and an unfilled one costs nothing, because a `<slot>` is `display: contents` and
 * contributes no box to lay out or to space.
 *
 * **It leaves through {@link UiCard.leave}, and removes itself.** A card cannot hold off a
 * removal it did not ask for: whatever takes it off the page takes it at once, and its exit with
 * it. So the exit is the card's own way out, as `close()` is the dialog's and `dismiss()` the
 * toast's: it plays the exit, announces `ui-leave` while the card is still in the tree, so a
 * framework rendering a list of cards drops the entry there, and then removes the card. A card put
 * back on the page arrives as any card does.
 *
 * @example
 * ```html
 * <ui-card>
 *   <h3 slot="header">Monthly plan</h3>
 *   <p>Everything in the free tier, plus priority support.</p>
 *   <div slot="footer"><ui-button>Choose</ui-button></div>
 * </ui-card>
 * ```
 */
export class UiCard extends LitElement {
    /** Where the card keeps its states: `leaving`, from when it is asked to leave until it has gone. */
    readonly #internals = this.attachInternals();

    /** The departure under way, once one has been asked for. */
    #departure: Promise<void> | undefined;

    /**
     * Marks the card while a focus the reader can see is on something it holds, and has the pointer
     * engine follow it where its sheet chose a light that follows the pointer.
     */
    constructor() {
        super();
        this.addEventListener('focusin', held);
        this.addEventListener('focusout', released);
        this.addEventListener('pointerover', follow);
    }

    /**
     * {@inheritDoc LitElement.connectedCallback} A card put back on the page arrives anew, and once it
     * is drawn it is put together from its pieces, where its sheet chose that.
     */
    override connectedCallback(): void {
        super.connectedCallback();
        this.#internals.states.delete('leaving');
        this.#departure = undefined;
        void this.updateComplete.then(() => {
            materialize(this);
        });
    }

    /**
     * Takes the card off the page through its exit: plays the exit chosen for it, announces
     * `ui-leave` while it is still in the tree, and removes it. Resolves once it has gone. Asked
     * twice, it is one departure, and both calls resolve with it.
     *
     * Bound as a field, so it can be handed to a listener and called as a method without losing
     * `this`.
     */
    readonly leave = (): Promise<void> => {
        if (this.#departure === undefined) {
            this.#departure = this.#depart();
        }

        return this.#departure;
    };

    /**
     * Marks the card leaving, breaks it into its pieces where its sheet chose that, waits out its
     * exit, announces it, removes it, and gives it back whole.
     */
    async #depart(): Promise<void> {
        this.#internals.states.add('leaving');
        erode(this);

        // `finished` rejects when an animation is cancelled, so what this waits for is
        // settlement rather than fulfilment. `getAnimations` flushes the pending style change
        // before it answers, so the exit the state above started is in the list, and so are the
        // clocks the pieces fade on.
        await Promise.allSettled(this.getAnimations().map((animation) => animation.finished));

        // Before the removal, for the toast's reason: a listener above the card hears a bubbling
        // event only while the card is still in the tree.
        this.dispatchEvent(new Event('ui-leave', { bubbles: true, composed: true }));

        this.remove();
        mend(this);
    }

    /** The styles its shadow root adopts. */
    static override readonly styles: CSSResult[] = [
        css`
            /* A column rather than a block, and the footer below is why: margin-block-start:
           auto needs a flex line to push against. That is what makes a row of cards in a
           grid line their footers up when the bodies are different lengths — the one thing
           a footer slot buys that writing the element last does not.

           The slots are left at their default display: contents, so the flex items are
           the host's own elements. An empty region is then absent rather than
           zero-height — gap never spaces a card that has no footer. */
            :host {
                display: flex;
                flex-direction: column;
                gap: calc(${reference('--ui-space')} * 2);
                box-sizing: border-box;
                padding: calc(${reference('--ui-space')} * 2);
                font-family: ${reference('--ui-font')};
                /* The pair, never half of it: a surface declared without the text colour that
               was chosen against it inherits whatever the page set, and the contrast the
               token layer measured stops holding at the one place it was measured for. */
                color: ${reference('--ui-color-text')};
                /* The raised surface's own colour and what it does to the page behind it, which
               are the surface and nothing until a theme makes the card glass. */
                background: ${reference('--ui-color-surface-raised')};
                backdrop-filter: ${reference('--ui-backdrop-raised')};
                border: 1px solid ${reference('--ui-color-border-raised')};
                border-radius: ${reference('--ui-radius')};
                /* What the shadow's layer below is laid out against. */
                position: relative;
            }

            /* The boundary and the shadow are one decision made twice, because each covers
           where the other cannot. The shadow is what says *raised* on a light page and
           nearly nothing on a dark one: the default's is black at a low alpha in both
           schemes. Only a shadow's colour can follow the scheme, as a light-dark() pair
           inside it — Matrix's and Glass's do — and the default writes one colour. The
           boundary is derived, so it mixes toward the text and is correct in both
           schemes by construction. Drop either and the card loses its edge in one scheme:
           measured, a bordered card on the dark surface is the only thing separating it
           from the page behind it.

           The shadow is drawn on a layer over the card rather than on the card, because a
           theme may write it in currentColor — Matrix's glow is — and the card's own colour
           is its text. The layer's is the accent; it covers the card and its border, and it
           takes no pointer, so what is in the card is still what is clicked. */
            :host::before {
                content: '';
                position: absolute;
                inset: -1px;
                border-radius: inherit;
                pointer-events: none;
                color: ${reference('--ui-color-accent')};
                box-shadow: ${reference('--ui-elevation-raised')};
            }

            /* Pushed to the bottom of whatever height the card ended up with. Written on the
           slotted element rather than on a wrapper, because a wrapper would be a flex item
           of its own — present, and therefore spaced by gap, even with nothing in it. */
            slot[name='footer']::slotted(*) {
                margin-block-start: auto;
            }
        `,
        surfaceEffects('card'),
    ];

    /**
     * The three slots — `header`, the default one, and `footer` — and the layers the pointer's and
     * a focus's effects are drawn on, empty until one is chosen.
     */
    override render(): TemplateResult {
        return html`
            <span data-layer="fill"></span>
            <span data-layer="focus-fill"></span>
            <span data-layer="shadow"></span>
            <span data-layer="focus-shadow"></span>
            <span data-layer="border"></span>
            <slot name="header"></slot>
            <slot></slot>
            <slot name="footer"></slot>
        `;
    }
}

// Stryker disable next-line StringLiteral: the registration runs once, at import, inside
// the warm process Stryker switches mutants in — so by the time a mutant on this line is
// active the element is already defined under the original name, and no test can observe
// the change. Outside the runner's reach, not an equivalent mutant.
customElements.define('ui-card', UiCard);

declare global {
    interface HTMLElementTagNameMap {
        'ui-card': UiCard;
    }
}

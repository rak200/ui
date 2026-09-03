import { LitElement, css, html, type TemplateResult } from 'lit';
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
 * the shadow root renders slots and nothing else: what a card *means* is the host's, and
 * they say it by slotting a heading, or by writing `<article>` around this element when
 * the content really is self-contained. A `role` invented here would be one every consumer
 * inherits and none of them chose.
 *
 * **Three regions, ordered here rather than in the host's markup.** The slots are declared
 * header, body, footer, so that is the order they render in whatever order the host wrote
 * them — and an unfilled one costs nothing, because a `<slot>` is `display: contents` and
 * contributes no box to lay out or to space.
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
    static override readonly styles = css`
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
            background: ${reference('--ui-color-surface')};
            border: 1px solid ${reference('--ui-color-border')};
            border-radius: ${reference('--ui-radius')};
            /* The boundary and the shadow are one decision made twice, because each covers
               where the other cannot. The shadow is what says *raised* on a light page and
               nearly nothing on a dark one — it is black at a low alpha, and light-dark()
               cannot carry a second value for it, since it takes colours and a shadow is
               not one. The boundary is derived, so it mixes toward the text and is correct
               in both schemes by construction. Drop either and the card loses its edge in
               one scheme: measured, a bordered card on the dark surface is the only thing
               separating it from the page behind it. */
            box-shadow: ${reference('--ui-elevation-raised')};
        }

        /* Pushed to the bottom of whatever height the card ended up with. Written on the
           slotted element rather than on a wrapper, because a wrapper would be a flex item
           of its own — present, and therefore spaced by gap, even with nothing in it. */
        slot[name='footer']::slotted(*) {
            margin-block-start: auto;
        }
    `;

    override render(): TemplateResult {
        return html`
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

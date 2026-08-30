import { LitElement, css, html, type SVGTemplateResult, type TemplateResult } from 'lit';
import { reference } from './reference.js';

/**
 * The glyphs a page has imported, by the name they were registered under.
 *
 * Module-level and shared by every instance, which is what makes `name` an attribute a
 * plain page can write: a glyph module is imported for its side effect and the markup
 * below it starts working. Nothing else in this package keeps state at module level, and
 * the alternative here was making the glyph a value the host has to pass — which needs a
 * build step and rules out the page that only emits tags.
 */
const glyphs = new Map<string, SVGTemplateResult>();

/**
 * The elements waiting for a name that is not registered yet.
 *
 * **This exists because of a measured failure, not a suspected one.** The first spike drew
 * nothing at all: importing this module defines `<ui-icon>`, which upgrades every instance
 * already in the document *before* any glyph module below it has run. Without this set the
 * fix looks like reordering two imports, and the symptom is a blank page element with
 * nothing in the console.
 */
const pending = new Set<UiIcon>();

/**
 * Adds a glyph to the registry, which is what a glyph module does when it is imported.
 *
 * Called by the vendored modules under `src/icons/`; a host calls it directly only to add
 * a mark the adopted set does not have — and slotting the `<svg>` is the lighter way to do
 * that for a one-off. See `docs/icon.md`.
 *
 * @param name - The value `<ui-icon name>` selects this glyph by. Registering a name twice
 * replaces it, so a host can override a vendored glyph with their own drawing.
 * @param glyph - The geometry alone — paths, circles, lines — with no `<svg>` around it.
 * The wrapper belongs to the element, which is what keeps the grid, the stroke and the
 * colour one decision rather than two thousand.
 */
export function register(name: string, glyph: SVGTemplateResult): void {
    glyphs.set(name, glyph);

    for (const icon of pending) {
        icon.requestUpdate();
    }
}

/**
 * An icon, drawn from an adopted set or from a mark you slot in yourself.
 *
 * ```html
 * <script type="module">
 *   import '@rak200/ui';
 *   import '@rak200/ui/icons/x.js';
 * </script>
 *
 * <ui-button><ui-icon name="x" label="Close"></ui-icon></ui-button>
 * ```
 *
 * **The glyphs are adopted and the delivery is owned**, which is the house rule pointed at
 * the axis that carries the cost here. There is no APG pattern for drawing a padlock; what
 * a set costs is volume and optical consistency, so [Lucide](https://lucide.dev) is
 * vendored under its ISC licence and is ours to edit, with no upstream to fight.
 *
 * **Import one glyph or all of them.** A glyph module carries the geometry alone — 182
 * bytes of it on average, against a 482-byte source file, measured across the whole set —
 * because the `<svg>` around it belongs to this element. So `icons/x.js` costs a rounding
 * error, and `icons/all.js` costs about 96 KiB gzipped and buys a `name` that can be
 * anything at runtime.
 *
 * **The accessible name is the one part with a wrong answer.** An icon beside a word is
 * decoration and must not be announced twice; an icon that *is* the control has nowhere
 * else to get its name from. So this element is `aria-hidden` unless it is given a
 * `label`, and never both.
 *
 * @example A mark the adopted set does not have, slotted rather than registered.
 * ```html
 * <ui-icon label="Our logo">
 *   <svg viewBox="0 0 24 24"><path d="M12 2 2 22h20Z" /></svg>
 * </ui-icon>
 * ```
 */
export class UiIcon extends LitElement {
    static override readonly styles = css`
        :host {
            display: inline-flex;
            inline-size: ${reference('--ui-icon-size')};
            block-size: ${reference('--ui-icon-size')};
            /* An icon is a picture, not text: it never wants to be the thing that stretches
               a flex row or shrinks under one. */
            flex: none;
        }

        /* The icon takes the colour of whatever it sits in — colour inherits on its own,
           so there is nothing to declare for it, and the stroke below is what reads it.
           That is what lets one registration serve a primary button, a danger message and
           body text without three of anything. */
        svg,
        ::slotted(svg) {
            inline-size: 100%;
            block-size: 100%;
        }

        /* The slotted path gets the same treatment the drawn one is born with, so a
           bespoke mark on the adopted grid is indistinguishable from a vendored one —
           which is the whole condition under which drawing your own is in scope. */
        ::slotted(svg) {
            fill: none;
            stroke: currentColor;
            stroke-width: ${reference('--ui-icon-stroke')};
            stroke-linecap: round;
            stroke-linejoin: round;
        }
    `;

    static override readonly properties = {
        name: { type: String, reflect: true },
        label: { type: String, reflect: true },
    };

    /**
     * Which glyph to draw, as registered by importing its module.
     *
     * A plain field rather than the `accessor` keyword, for the reason `src/button.ts`
     * gives beside its own.
     */
    name = '';

    /**
     * What a screen reader should call this icon, when the icon is the content.
     *
     * Left unset the element is `aria-hidden`, which is right for an icon beside a word it
     * would otherwise announce twice. Set, the element becomes an image with a name, which
     * is the only thing an icon-only button has to go on.
     */
    label = '';

    override connectedCallback(): void {
        super.connectedCallback();
        pending.add(this);
    }

    override disconnectedCallback(): void {
        pending.delete(this);
        super.disconnectedCallback();
    }

    /**
     * Names the element, or hides it, on the host rather than on what it drew.
     *
     * **Measured**: putting `role` and `aria-label` on the inner `<svg>` names a drawn
     * glyph and silently fails to name a slotted one, because the host's own mark is not
     * in this shadow root. The spike that preceded this element reproduced exactly that —
     * a slotted icon with neither `aria-hidden` nor a name, which is the one state an icon
     * must never be in.
     *
     * Attributes rather than `ElementInternals`, which would express the same thing more
     * politely: ARIA on internals is one more feature this suite can only verify in one
     * engine, and being wrong there is invisible to everybody who can see.
     */
    override willUpdate(): void {
        if (this.label === '') {
            this.removeAttribute('role');
            this.removeAttribute('aria-label');
            this.setAttribute('aria-hidden', 'true');

            return;
        }

        this.removeAttribute('aria-hidden');
        this.setAttribute('role', 'img');
        this.setAttribute('aria-label', this.label);
    }

    override render(): TemplateResult {
        const glyph = glyphs.get(this.name);

        // One or the other, never both. Rendering the wrapper beside the slot puts two
        // flex items in a box sized for one, and a slotted mark comes out at half width —
        // measured, as a bespoke icon that drew at 20px inside a 40px element.
        return glyph === undefined
            ? // The slot is what the registry could not supply: a mark the set does not
              // have, or a name whose module was never imported. The second one warns.
              html`<slot @slotchange=${this.#complain}></slot>`
            : html`
                  <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width=${reference('--ui-icon-stroke')}
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      part="svg"
                  >
                      ${glyph}
                  </svg>
              `;
    }

    override updated(): void {
        this.#complain();
    }

    /**
     * Says out loud that a name resolved to nothing, which is the failure this design is
     * most likely to produce.
     *
     * Measured on the spike: a name with no module imported renders an empty box, with no
     * error anywhere — so a typo in `name` and a missing import look exactly like a glyph
     * that draws nothing. A page that slots its own mark is doing that deliberately and is
     * not warned.
     */
    #complain(): void {
        if (this.name === '' || glyphs.has(this.name) || this.children.length > 0) {
            return;
        }

        console.warn(
            `<ui-icon name="${this.name}"> drew nothing: no glyph is registered under that name. ` +
                `Import it — import '@rak200/ui/icons/${this.name}.js' — or slot an <svg> of your own.`,
        );
    }
}

// Stryker disable next-line StringLiteral: the registration runs once, at import, inside
// the warm process Stryker switches mutants in — so by the time a mutant on this line is
// active the element is already defined under the original name, and no test can observe
// the change. Outside the runner's reach, not an equivalent mutant.
customElements.define('ui-icon', UiIcon);

declare global {
    interface HTMLElementTagNameMap {
        'ui-icon': UiIcon;
    }
}

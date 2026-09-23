/**
 * The sentence a `<ui-tooltip>` hands over, and the node a control points at.
 *
 * **An `aria-describedby` written in the host's tree cannot name anything inside a
 * control's shadow root** — one IDREF, one tree scope — which is the failure #156 measured
 * across most of this package. RFC 0006 answered it by moving the *text* rather than the
 * reference: the tooltip dispatches it at the trigger, and a control that accepts it
 * renders it into its own root where its own `aria-describedby` reaches.
 *
 * **This module exists because `<ui-menu>` is the second element to need it**, which is
 * the same moment and the same reason `src/placement.ts` was extracted: two answers to one
 * problem is one too many. Six classes carry the protocol when the rollout is done, and a
 * copy in each is six chances for one of them to drift into accepting text it never
 * renders.
 *
 * **What it does not own is the rendering.** `<ui-button>` draws its control from a
 * template and `<ui-menu>` builds one imperatively, so each points its own control at
 * {@link Description.reference} and places {@link Description.carrier} where that control
 * can resolve it. What is shared is the part that is identical wherever it goes: the
 * listener, the sentence, and the rule that an empty one is no description at all.
 *
 * Internal — it is not re-exported from `src/index.ts`, because what a consumer writes is
 * the tip, never this.
 */

import { html, nothing, type TemplateResult } from 'lit';

/** The host's half of the contract: enough of `LitElement` to take the text and redraw. */
interface Described extends HTMLElement {
    requestUpdate: () => void;
}

/**
 * The id the carrier takes, fixed per root the way `help` and `error` already are.
 *
 * **The carrier deliberately carries no `part`.** `help` and `error` expose one because a
 * host is meant to style them; this node exists to be read and not seen, and a part on it
 * is an invitation to unclip it — which would put the sentence on screen twice, beside the
 * tip already showing it.
 */
const id = 'description';

/**
 * Keeps the carrier out of the paint without taking it out of the tree, **inline**.
 *
 * The sentence is already on screen — in the tip, which is the whole point of the
 * handoff — so drawing it again would show it twice.
 *
 * It is written on the node rather than adopted from a stylesheet because a stylesheet is
 * a thing each of the six components has to remember, and the day one forgets, the
 * sentence renders **visibly** beside the tip that already carries it. Measured, on the
 * first host that consumed this module without adopting the rule: 363px of text nobody
 * asked to see. There is no token in any of these values and nothing here for a host to
 * retune, so travelling with the node costs the rule nothing.
 *
 * **Four declarations, and the well-known recipe has eight.** The other four survived the
 * mutation floor, which is how they were found to be doing nothing here:
 *
 * - `margin: -1px` keeps a 1px box from disturbing the layout, and `position: absolute`
 *   already took it out of the flow.
 * - `padding: 0` resets an inherited padding. A `<span>` has none, and nothing in these
 *   components styles this id.
 * - `overflow: hidden` clips the content to the box, which `clip-path` then clips to
 *   nothing — so it removes a sliver that is already gone.
 * - `white-space: nowrap` is carried for a claim about how a screen reader reads wrapped
 *   text, and no instrument in this toolchain can read an accessibility tree. By the rule
 *   `docs/select.md` applies to `appearance: base-select`, that is not adopted here.
 *
 * Each of the four that stay does something no other one does, and the suite says which:
 * out of flow, one column wide, one row tall, and painted nowhere.
 *
 * display:none would be the shorter way and it is the one this package will not take. The
 * accessible description of a hidden element that is DIRECTLY referenced is computed
 * anyway, by specification; whether every engine does it is the same unverifiable claim,
 * and the clip has nothing left to disagree about: in the tree in every engine, and
 * painted in none.
 *
 * No offsets with the absolute, deliberately: an out-of-flow box with none stays at its
 * static position, so it neither travels nor grows the scrollable area.
 */
const clipped = [
    'position:absolute',
    'inline-size:1px',
    'block-size:1px',
    'clip-path:inset(50%)',
].join(';');

export class Description {
    #sentence = '';

    readonly #host: Described;

    /**
     * Listens from the constructor, which is where the host must build it.
     *
     * The tooltip waits on `customElements.whenDefined` before it hands anything over, and
     * that resolves *after* the constructor has run — so a listener added on connection
     * would still be in time, and one added on first render would not. The constructor is
     * the earliest of the three and the only one with nothing to reason about.
     */
    constructor(host: Described) {
        this.#host = host;
        host.addEventListener('ui-describe', this.#take);
    }

    /**
     * Takes the sentence, and leaves anything else unclaimed.
     *
     * The payload is tested and the event's class is not, which is narrower than it looks:
     * a plain `Event` carries no `detail` at all, so the type test stops one as surely as
     * an `instanceof` would — and an `instanceof` here was dead weight the mutation floor
     * could not kill, because nothing reached it that this line did not already turn away.
     *
     * `preventDefault()` is the whole of the acknowledgement: the dispatch's return value
     * is what tells the tooltip whether to warn, so a malformed payload has to read as a
     * refusal rather than be accepted and ignored.
     */
    readonly #take = (event: Event): void => {
        const handed: unknown = (event as CustomEvent<unknown>).detail;

        if (typeof handed !== 'string') {
            return;
        }

        event.preventDefault();

        this.#sentence = handed;
        this.#host.requestUpdate();
    };

    /**
     * What the control's `aria-describedby` is bound to, or `nothing` when there is no
     * description — an empty attribute is not the same shape as an absent one.
     */
    reference(): string | typeof nothing {
        return this.#sentence === '' ? nothing : id;
    }

    /**
     * Points a control built by hand at the carrier, or stops pointing it.
     *
     * The imperative half of {@link Description.reference}, and both exist because the
     * controls do: `<ui-button>` draws its `<button>` from a template and `<ui-menu>`
     * builds one with `document.createElement`, so the same rule has to be expressible
     * twice. It lives here rather than at each call site so *empty means absent* is
     * decided once — an `aria-describedby=""` is a different shape from no attribute, and
     * a control that wrote one would be describing nothing rather than nothing at all.
     */
    point(control: Element): void {
        const described = this.reference();

        if (described === nothing) {
            control.removeAttribute('aria-describedby');

            return;
        }

        control.setAttribute('aria-describedby', described);
    }

    /** The node that reference resolves to, rendered into the control's own root. */
    carrier(): TemplateResult | typeof nothing {
        return this.#sentence === ''
            ? nothing
            : html`<span id=${id} style=${clipped}>${this.#sentence}</span>`;
    }
}

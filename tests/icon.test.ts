import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectAccessible } from './a11y.js';
import { mountStory } from './stories.js';
import meta, { Bespoke, Decorative, IconOnly, Named, Sizes } from '../stories/icon.stories.js';
import { register, UiIcon } from '../src/icon.js';
import '../src/button.js';
// Three glyphs, imported the way a host imports them. Not the barrel: importing all two
// thousand costs 9.4 seconds here, measured, and buys nothing this file asserts.
import '../src/icons/x.js';
import '../src/icons/check.js';
import '../src/icons/circle-alert.js';
import { svg } from 'lit';

/** Mounts markup and waits for every icon in it to render. */
async function mount(markup: string): Promise<HTMLElement> {
    const host = document.createElement('div');
    host.innerHTML = markup;
    document.body.append(host);

    for (const element of host.querySelectorAll('ui-icon, ui-button')) {
        await (element as UiIcon).updateComplete;
    }

    return host;
}

/** The icon under test, and a failure with a name rather than a null dereference. */
function icon(host: HTMLElement): UiIcon {
    const element = host.querySelector('ui-icon');

    if (element === null) {
        throw new Error('no icon in the fixture');
    }

    return element;
}

/** What the element actually drew, which is the only thing a consumer sees. */
function drawn(host: HTMLElement): SVGSVGElement {
    const element = icon(host).shadowRoot?.querySelector('svg');

    if (!(element instanceof SVGSVGElement)) {
        throw new Error('the icon drew no svg');
    }

    return element;
}

afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
});

describe('ui-icon', () => {
    it('registers itself as a custom element', () => {
        expect(customElements.get('ui-icon')).toBeDefined();
    });

    it('draws the glyph whose module was imported', async () => {
        const host = await mount('<ui-icon name="x"></ui-icon>');

        expect(drawn(host).querySelectorAll('path')).toHaveLength(2);
    });

    it('draws a different glyph for a different name', async () => {
        const host = await mount('<ui-icon name="circle-alert"></ui-icon>');
        const svgElement = drawn(host);

        expect(svgElement.querySelectorAll('circle')).toHaveLength(1);
        expect(svgElement.querySelectorAll('line')).toHaveLength(2);
    });

    it('swaps the drawing when the name changes at runtime', async () => {
        const host = await mount('<ui-icon name="x"></ui-icon>');

        icon(host).name = 'check';
        await icon(host).updateComplete;

        // The whole point of a registry over a passed value: markup, and an attribute a
        // page can change without a build step.
        expect(drawn(host).querySelectorAll('path')).toHaveLength(1);
    });

    it('owns the wrapper, so the grid and the stroke are one decision', async () => {
        const host = await mount('<ui-icon name="x"></ui-icon>');
        const svgElement = drawn(host);

        expect(svgElement.getAttribute('viewBox')).toBe('0 0 24 24');
        expect(svgElement.getAttribute('fill')).toBe('none');
        expect(svgElement.getAttribute('stroke')).toBe('currentColor');
        expect(svgElement.getAttribute('stroke-linecap')).toBe('round');
    });

    it('takes the colour of whatever it sits in, without being told', async () => {
        const host = await mount(
            '<div style="color: rgb(1, 2, 3)"><ui-icon name="x"></ui-icon></div>',
        );

        expect(getComputedStyle(drawn(host)).stroke).toBe('rgb(1, 2, 3)');
    });

    it('takes its size and its stroke from the token layer', async () => {
        const host = await mount('<ui-icon name="x"></ui-icon>');

        expect(getComputedStyle(icon(host)).inlineSize).toBe('20px');

        icon(host).style.setProperty('--ui-icon-size', '48px');
        icon(host).style.setProperty('--ui-icon-stroke', '4');
        // The height is pinned to something else on purpose. With both axes taking the
        // same token, an icon that had lost its `inline-size` rule would still measure
        // right — the svg's own aspect ratio would supply the width from the height, and
        // the assertion would pass against a component that no longer sets it.
        icon(host).style.setProperty('block-size', '10px');

        expect(getComputedStyle(icon(host)).inlineSize).toBe('48px');
        // Computed style serialises a unitless stroke-width in px; inside the viewBox it
        // is still four user units, which is what scales with the glyph.
        expect(getComputedStyle(drawn(host)).strokeWidth).toBe('4px');
    });

    it('takes its height from that token too, not from what it drew', async () => {
        const host = await mount('<ui-icon name="x" style="--ui-icon-size: 48px"></ui-icon>');

        // The width is pinned away, which is the mirror of the reason above: with both
        // axes on the token, an icon that had lost its `block-size` rule would still
        // measure right, because the svg's aspect ratio would supply the height from the
        // width it was given.
        icon(host).style.setProperty('inline-size', '10px');

        expect(getComputedStyle(icon(host)).blockSize).toBe('48px');
    });

    it('reflects both properties, so a host stylesheet can select on them', async () => {
        const host = await mount('<ui-icon></ui-icon>');

        icon(host).name = 'check';
        icon(host).label = 'Saved';
        await icon(host).updateComplete;

        expect(icon(host).getAttribute('name')).toBe('check');
        expect(icon(host).getAttribute('label')).toBe('Saved');
        expect(icon(host).matches('ui-icon[name="check"]'), 'selectable').toBe(true);
    });

    it('reads both properties back from the attributes a page wrote', async () => {
        const host = await mount('<ui-icon name="check" label="Saved"></ui-icon>');

        expect(icon(host).name).toBe('check');
        expect(icon(host).label).toBe('Saved');
    });

    it('rounds the ends and the corners of every stroke it draws', async () => {
        const host = await mount('<ui-icon name="x"></ui-icon>');

        expect(drawn(host).getAttribute('stroke-linejoin')).toBe('round');
        expect(drawn(host).getAttribute('stroke-width')).toContain('--ui-icon-stroke');
    });

    it('exposes the drawing as a part, and fills the box with it', async () => {
        const host = await mount('<ui-icon name="x" style="--ui-icon-size: 40px"></ui-icon>');
        const box = drawn(host).getBoundingClientRect();

        expect(drawn(host).getAttribute('part')).toBe('svg');
        expect(Math.round(box.width), 'the glyph fills the element').toBe(40);
        expect(Math.round(box.height)).toBe(40);
    });

    it('never stretches or shrinks in a row that is doing either', async () => {
        const host = await mount(
            '<div style="display: flex; inline-size: 20px"><ui-icon name="x"></ui-icon><span style="flex: 1">a very long label indeed</span></div>',
        );

        expect(getComputedStyle(icon(host)).inlineSize).toBe('20px');
    });
});

/**
 * The one part of an icon with a wrong answer. An icon beside a word is decoration and
 * must not be announced twice; an icon that *is* the control has nowhere else to get a
 * name from.
 */
describe('the accessible name', () => {
    it('is hidden by default, because most icons repeat the word beside them', async () => {
        const host = await mount('<ui-icon name="x"></ui-icon>');

        expect(icon(host).getAttribute('aria-hidden')).toBe('true');
        expect(icon(host).hasAttribute('aria-label')).toBe(false);
        expect(icon(host).hasAttribute('role')).toBe(false);
    });

    it('becomes an image with a name when it is given one', async () => {
        const host = await mount('<ui-icon name="x" label="Close"></ui-icon>');

        expect(icon(host).getAttribute('role')).toBe('img');
        expect(icon(host).getAttribute('aria-label')).toBe('Close');
    });

    it('is never both, which would announce it and hide it at once', async () => {
        const host = await mount('<ui-icon name="x" label="Close"></ui-icon>');

        expect(icon(host).hasAttribute('aria-hidden')).toBe(false);
    });

    it('drops the hidden flag when a label arrives later', async () => {
        const host = await mount('<ui-icon name="x"></ui-icon>');

        expect(icon(host).getAttribute('aria-hidden'), 'hidden to begin with').toBe('true');

        icon(host).label = 'Close';
        await icon(host).updateComplete;

        // Named *and* hidden is the one state that is worse than either: the element
        // carries a name no assistive technology will ever reach.
        expect(icon(host).hasAttribute('aria-hidden')).toBe(false);
        expect(icon(host).getAttribute('aria-label')).toBe('Close');
    });

    it('follows the label back to hidden when it is taken away', async () => {
        const host = await mount('<ui-icon name="x" label="Close"></ui-icon>');

        icon(host).label = '';
        await icon(host).updateComplete;

        expect(icon(host).getAttribute('aria-hidden')).toBe('true');
        expect(icon(host).hasAttribute('role')).toBe(false);
        expect(icon(host).hasAttribute('aria-label')).toBe(false);
    });

    it('names a slotted mark, which is where putting this on the drawing failed', async () => {
        // The measured failure the spike produced: a11y attributes on the inner svg name a
        // drawn glyph and silently leave a slotted one with neither a name nor a hidden
        // flag — the one state an icon must never be in.
        const host = await mount(
            '<ui-icon label="Our mark"><svg viewBox="0 0 24 24"><path d="M12 2 2 22h20Z" /></svg></ui-icon>',
        );

        expect(icon(host).getAttribute('role')).toBe('img');
        expect(icon(host).getAttribute('aria-label')).toBe('Our mark');
    });

    it('hides a slotted mark that was given no name', async () => {
        const host = await mount(
            '<ui-icon><svg viewBox="0 0 24 24"><path d="M12 2 2 22h20Z" /></svg></ui-icon>',
        );

        expect(icon(host).getAttribute('aria-hidden')).toBe('true');
    });
});

/**
 * The registry is the price of an attribute a plain page can write, and both of its
 * failure modes were measured on a spike before this element existed.
 */
describe('the registry', () => {
    it('draws a glyph registered after the element was already in the document', async () => {
        // The measured failure this whole mechanism exists for: importing the element
        // upgrades every instance in the document *before* the glyph modules below it have
        // run, so without a redraw on registration the fix looks like reordering imports
        // and the symptom is a blank box.
        const host = await mount('<ui-icon name="late-arrival"></ui-icon>');

        expect(icon(host).shadowRoot?.querySelector('svg'), 'nothing drawn yet').toBeNull();

        register('late-arrival', svg`<path d="M1 1 23 23" />`);
        await icon(host).updateComplete;

        expect(drawn(host).querySelectorAll('path')).toHaveLength(1);
    });

    it('stops waiting on a name once the element leaves the document', async () => {
        const host = await mount('<ui-icon name="departed"></ui-icon>');
        const element = icon(host);

        element.remove();
        register('departed', svg`<path d="M1 1 23 23" />`);
        await element.updateComplete;

        // The registry holds every icon still waiting for a glyph, so an element that
        // never let go would be kept alive by module state for the life of the page —
        // and would redraw itself somewhere nobody can see.
        expect(element.shadowRoot?.querySelector('svg')).toBeNull();
    });

    it('lets a host replace a vendored glyph with their own drawing', async () => {
        register('x', svg`<circle cx="12" cy="12" r="10" />`);

        const host = await mount('<ui-icon name="x"></ui-icon>');

        expect(drawn(host).querySelectorAll('circle')).toHaveLength(1);

        // Put back, because the registry is module state and the next test reads it.
        register('x', svg`<path d="M18 6 6 18" /><path d="m6 6 12 12" />`);
    });

    it('says out loud that a name drew nothing, rather than leaving a blank box', async () => {
        // The other measured failure: a typo in `name` and a module nobody imported look
        // exactly alike, and both look like a glyph that draws nothing.
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        await mount('<ui-icon name="not-imported"></ui-icon>');

        expect(warn).toHaveBeenCalledOnce();

        // Both halves are asserted because both carry the fix. A warning that names the
        // element without naming the import leaves the reader where they started: a typo
        // in `name` and a module nobody imported are the same blank box.
        const message = String(warn.mock.calls[0]?.[0]);

        expect(message, 'names the element that drew nothing').toContain(
            '<ui-icon name="not-imported">',
        );
        expect(message, 'and the import that would fix it').toContain(
            "import '@rak200/ui/icons/not-imported.js'",
        );
    });

    it('says nothing when a glyph is there', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        await mount('<ui-icon name="x"></ui-icon>');

        expect(warn).not.toHaveBeenCalled();
    });

    it('says nothing about an icon carrying no name at all', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        await mount('<ui-icon></ui-icon>');

        expect(warn).not.toHaveBeenCalled();
    });
});

/**
 * The escape hatch: a mark the adopted set does not have, which is the case the issue
 * kept in scope for brand and domain glyphs.
 */
describe('a slotted mark', () => {
    const bespoke = `<ui-icon label="Our mark"><svg viewBox="0 0 24 24"><path d="M12 2 2 22h20Z" /></svg></ui-icon>`;

    it('renders the svg the host wrote when no name resolves', async () => {
        const host = await mount(bespoke);

        expect(icon(host).shadowRoot?.querySelector('slot')).not.toBeNull();
        expect(host.querySelector('ui-icon > svg')).not.toBeNull();
    });

    it('gets the same stroke and colour a vendored glyph is born with', async () => {
        const host = await mount(`<div style="color: rgb(1, 2, 3)">${bespoke}</div>`);
        const slotted = host.querySelector('ui-icon > svg');

        if (slotted === null) {
            throw new Error('no slotted mark');
        }

        const styles = getComputedStyle(slotted);

        expect(styles.stroke, 'indistinguishable from a vendored one').toBe('rgb(1, 2, 3)');
        expect(styles.strokeWidth).toBe('2px');
        expect(styles.fill).toBe('none');
        expect(styles.strokeLinecap).toBe('round');
        expect(styles.strokeLinejoin).toBe('round');
    });

    it('fills the box the way a drawn glyph does', async () => {
        const host = await mount(
            `<ui-icon label="Our mark" style="--ui-icon-size: 40px"><svg viewBox="0 0 24 24"><path d="M12 2 2 22h20Z" /></svg></ui-icon>`,
        );
        const slotted = host.querySelector('ui-icon > svg');

        if (slotted === null) {
            throw new Error('no slotted mark');
        }

        expect(Math.round(slotted.getBoundingClientRect().width)).toBe(40);
    });

    it('is not warned about under a name the registry never had', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        // A name and a slotted mark together is not the failure the warning is for: the
        // page drew something, and it drew it on purpose.
        await mount(
            '<ui-icon name="our-mark"><svg viewBox="0 0 24 24"><path d="M12 2 2 22h20Z" /></svg></ui-icon>',
        );

        expect(warn).not.toHaveBeenCalled();
    });

    it('is not warned about, because it is deliberate', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        await mount(bespoke);

        expect(warn).not.toHaveBeenCalled();
    });
});

/**
 * The stories are the playground, and mounting them here is what puts it behind the gate.
 * `expectAccessible` runs per state, because a decorative icon and a named one are
 * different markup and each can fail on its own.
 */
describe('accessibility', () => {
    it('has no violations as a decorative icon beside a word', async () => {
        await expectAccessible(await mountStory(Decorative, meta, 'Decorative'));
    });

    it('has no violations as a named icon', async () => {
        await expectAccessible(await mountStory(Named, meta, 'Named'));
    });

    it('has no violations as the only content of a button', async () => {
        await expectAccessible(await mountStory(IconOnly, meta, 'IconOnly'));
    });

    it('has no violations as a slotted mark', async () => {
        await expectAccessible(await mountStory(Bespoke, meta, 'Bespoke'));
    });

    it('has no violations across sizes', async () => {
        await expectAccessible(await mountStory(Sizes, meta, 'Sizes'));
    });
});

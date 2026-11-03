import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
// The playwright provider is what puts `send` on `CDPSession` — see `button.test.ts`,
// which needs the same line for the same reason.
import type {} from '@vitest/browser-playwright';
import { expectAccessible } from './a11y.js';
import { mountStory } from './stories.js';
import meta, { Long, Outcomes, Timed, Toast } from '../stories/toast.stories.js';
import '../src/toast.js';
// The vendored glyphs the toast's icons are copied from, registered here so the copy can be
// compared with them. Importing them is the test's doing and never the toast's.
import '../src/icon.js';
import '../src/icons/info.js';
import '../src/icons/circle-check.js';
import '../src/icons/triangle-alert.js';
import '../src/icons/circle-x.js';
import { reference } from '../src/reference.js';
import { glass, matrix, themeStyleSheet, type Theme } from '../src/theme.js';
import { tokenStyleSheet, type DerivedToken, type Token } from '../src/tokens.js';
import type { UiToast, UiToaster } from '../src/toast.js';

/**
 * The markup the behavioural tests use, unless one needs a different shape.
 *
 * **With no clock**, because a test that is not about the clock must not race it. The
 * default dwell is five seconds and starts on connection, so a host busy enough to stretch
 * mounting and settling past it dismisses the toast before the test reaches it. Measured
 * under a 700x CPU throttle: 12.3 s of setup, the toast gone, `closing` still on it and no
 * animation left, which is the one recorded failure of the exit assertion exactly. Every
 * test under `the clock` writes its own duration, so nothing the clock does goes unmeasured,
 * and the markup written inline elsewhere in this file says `duration="0"` for the same
 * reason — except a `danger` toast's, which never runs one. #177
 */
const fixture = `
    <ui-toaster>
        <ui-toast duration="0">Your changes have been saved.</ui-toast>
    </ui-toaster>
`;

/** A dwell short enough to watch run out inside a test, and longer than mounting one. */
const brief = 120;

/**
 * The dwell for a test that has to reach the toast before the clock does.
 *
 * Hovering is a round trip out to the driver and back, and a toast that expired during it
 * is a toast the hover then retries against forever — measured, as a fifteen-second
 * timeout. {@link brief} is not long enough to survive one.
 *
 * **1000 was not long enough either**, and the arithmetic is why rather than a hunch.
 * `hover` refuses to act until the element is *stable*, and a toast's entrance is an
 * animation — so the driver waits, and a toast that expires meanwhile is one it then
 * retries against until it gives up. Settling the entrance first is what bounds that, and
 * the two together were still measured at **871 ms of the 1000** under a 10x CPU throttle:
 *
 * | throttle | entrance | hover | setup |
 * | -------- | -------- | ----- | ----- |
 * | 1x       | 159 ms   | 400   | 559   |
 * | 10x      | 225 ms   | 307   | 532   |
 * | 20x      | 229 ms   | 642   | **871** |
 *
 * A dwell the setup wins by 129 ms is a dwell the setup loses on a busy CI runner. This one
 * leaves it 1.6 s. The cost is paid back at the other end: a held toast has its dwell cut to
 * {@link brief} before the reader leaves, so only the *hold* is measured at this length and
 * the resume stays quick enough to keep both tests inside the runner's timeout. #177
 */
const patient = 2500;

/** Longer than {@link brief} plus the exit, so *nothing happened* is a settled answer. */
const settled = 400;

async function mount(markup: string): Promise<HTMLElement> {
    const host = document.createElement('div');
    host.innerHTML = markup;
    document.body.append(host);

    for (const element of host.querySelectorAll('ui-toaster, ui-toast')) {
        await (element as UiToast).updateComplete;
    }

    return host;
}

/** The one element a selector has to match, so a fixture typo fails where it happened. */
function only(host: ParentNode, selector: string): HTMLElement {
    const found = host.querySelector<HTMLElement>(selector);

    if (found === null) {
        throw new Error(`no ${selector} in the fixture`);
    }

    return found;
}

const toaster = (host: ParentNode): UiToaster => only(host, 'ui-toaster') as UiToaster;
const toast = (host: ParentNode): UiToast => only(host, 'ui-toast') as UiToast;

/** The dismiss button, which is the component's own element rather than the host's. */
function dismisser(element: UiToast): HTMLElement {
    const found = element.shadowRoot?.querySelector('button') ?? null;

    if (found === null) {
        throw new Error('the toast rendered no dismiss button');
    }

    return found;
}

/** One of the parts a toast exposes. */
function part(element: UiToast, name: string): HTMLElement {
    const found = element.shadowRoot?.querySelector<HTMLElement>(`[part='${name}']`) ?? null;

    if (found === null) {
        throw new Error(`the toast exposed no ${name}`);
    }

    return found;
}

/** One live region, by the politeness it announces at. */
function region(element: UiToaster, live: string): HTMLElement {
    const found = element.shadowRoot?.querySelector<HTMLElement>(`[aria-live=${live}]`) ?? null;

    if (found === null) {
        throw new Error(`the toaster rendered no ${live} region`);
    }

    return found;
}

/** The dismiss mark, drawn on the adopted grid rather than imported as a glyph module. */
function mark(element: UiToast): SVGSVGElement {
    const found = element.shadowRoot?.querySelector<SVGSVGElement>('button svg') ?? null;

    if (found === null) {
        throw new Error('the toast drew no dismiss mark');
    }

    return found;
}

/** The two live regions, in the order the shadow root declares them. */
function regions(element: UiToaster): HTMLElement[] {
    return [...(element.shadowRoot?.querySelectorAll('div') ?? [])];
}

/** The toaster's own stylesheet, as text, for a rule that is an absence rather than a value. */
function toasterStyles(): string {
    return String((customElements.get('ui-toaster') as unknown as { styles: unknown }).styles);
}

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

/** Resolves when the toast announces its own dismissal, or rejects rather than hanging. */
function dismissed(element: UiToast): Promise<Event> {
    return new Promise((resolve, reject) => {
        element.addEventListener('ui-dismiss', resolve, { once: true });
        setTimeout(() => {
            reject(new Error('the toast never dismissed'));
        }, patient * 4);
    });
}

/**
 * What a token computes to here, so an assertion names the token rather than its value.
 *
 * Comparing against the literal would compare the component's CSS with the constant that
 * produced it — a check no change of value can fail. Comparing against the reference
 * catches the change that matters: an edge painted from the wrong name.
 */
function resolved(token: Token | DerivedToken): string {
    const probe = document.createElement('div');
    probe.style.color = String(reference(token));
    document.body.append(probe);

    try {
        return getComputedStyle(probe).color;
    } finally {
        probe.remove();
    }
}

/**
 * A colour as the icon paints it: made opaque, which the browser writes as `color(srgb …)`
 * rather than in the form it was given — so the expectation goes through the same function.
 */
function opaque(colour: string): string {
    const probe = document.createElement('div');
    probe.style.color = `rgb(from ${colour} r g b / 1)`;
    document.body.append(probe);

    try {
        return getComputedStyle(probe).color;
    } finally {
        probe.remove();
    }
}

/**
 * Moves the pointer out of the way — see `checkbox.test.ts` for why nothing in the page
 * can. The far corner is where the toaster lives, so this parks at the near one instead:
 * a pointer resting on a toast holds its clock, which is the component working and would
 * look like the clock not running.
 */
async function parkPointer(): Promise<void> {
    await cdp().send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1, buttons: 0 });
}

/** Waits out whatever the element is animating, so the next change has somewhere to go. */
async function still(element: HTMLElement): Promise<void> {
    await Promise.allSettled(element.getAnimations().map((animation) => animation.finished));
}

beforeEach(parkPointer);

afterEach(async () => {
    await parkPointer();

    document.body.replaceChildren();
});

describe('ui-toaster', () => {
    it('registers itself as a custom element', () => {
        expect(customElements.get('ui-toaster')).toBeDefined();
    });

    it('owns two live regions, one per politeness, and declares them in the DOM once', async () => {
        const host = await mount(fixture);
        const [polite, assertive] = regions(toaster(host));

        expect(regions(toaster(host))).toHaveLength(2);
        expect(polite?.getAttribute('aria-live')).toBe('polite');
        expect(assertive?.getAttribute('aria-live')).toBe('assertive');
    });

    it('claims no role on either region, which would re-announce the whole stack', async () => {
        // `role="alert"` and `role="status"` each imply `aria-atomic="true"`, so a third
        // toast arriving would read all three. Bare `aria-live` leaves atomicity at its
        // `false` default, which announces the one that arrived.
        const host = await mount(fixture);

        for (const region of regions(toaster(host))) {
            expect(region.hasAttribute('role')).toBe(false);
            expect(region.hasAttribute('aria-atomic')).toBe(false);
        }
    });

    it('is a manual popover, and is open from the moment it connects', async () => {
        const host = await mount('<ui-toaster></ui-toaster>');

        expect(toaster(host).getAttribute('popover')).toBe('manual');
        expect(toaster(host).matches(':popover-open')).toBe(true);
    });

    it('takes the top layer rather than a z-index, so nothing here opens a layering category', async () => {
        const host = await mount(fixture);

        expect(getComputedStyle(toaster(host)).zIndex).toBe('auto');
        expect(toasterStyles()).not.toContain('z-index');
    });

    it('names display under the open state only, so a closed toaster takes no space', async () => {
        // The user agent hides a closed popover with `display: none`, and an author rule
        // naming `display` unconditionally outranks it — the trap `src/dialog.ts` fell into
        // once and states beside its own rule.
        const host = await mount(fixture);

        expect(getComputedStyle(toaster(host)).display).toBe('flex');

        toaster(host).hidePopover();

        expect(getComputedStyle(toaster(host)).display).toBe('none');
    });

    it('sits in the block-end inline-end corner of the viewport', async () => {
        const host = await mount(fixture);
        const box = toaster(host).getBoundingClientRect();
        const root = document.documentElement;

        expect(getComputedStyle(toaster(host)).position).toBe('fixed');
        expect(Math.round(box.bottom)).toBe(root.clientHeight);
        expect(Math.round(box.right)).toBe(root.clientWidth);
    });

    it('is capped rather than sized to its content, and never wider than the viewport', async () => {
        const host = await mount(fixture);
        const box = toaster(host).getBoundingClientRect();

        expect(box.width).toBeLessThanOrEqual(document.documentElement.clientWidth);
        // 44 spacing steps at the default 0.5rem, which is the cap the stylesheet writes.
        expect(box.width).toBeLessThanOrEqual(352);
    });

    it('takes no clicks itself, and gives them back on a toast', async () => {
        const host = await mount(fixture);

        expect(getComputedStyle(toaster(host)).pointerEvents).toBe('none');
        expect(getComputedStyle(toast(host)).pointerEvents).toBe('auto');
    });

    it('goes inert behind an open modal, which is the platform rather than this component', async () => {
        // Measured, and it is why the stack is shown once rather than re-promoted per
        // message: promotion would fix the layer ordering and could not fix this. A modal
        // `<dialog>` makes the rest of the document inert, which takes it out of the
        // accessibility tree as well as out of reach — so a toaster outside an open modal
        // is not announced whichever layer it is in. `docs/toast.md` says where to put one
        // for a page that toasts from inside a dialog.
        const host = await mount(fixture);
        const button = dismisser(toast(host));
        const dialog = document.createElement('dialog');
        document.body.append(dialog);

        button.focus();

        expect(toast(host).shadowRoot?.activeElement, 'reachable on its own').toBe(button);

        dialog.showModal();
        button.focus();

        expect(toast(host).shadowRoot?.activeElement, 'inert behind the modal').toBeNull();

        dialog.close();
        button.focus();

        expect(toast(host).shadowRoot?.activeElement, 'reachable again').toBe(button);
    });

    it('is accessible', async () => {
        await expectAccessible(await mount(fixture));
    });
});

describe('ui-toast', () => {
    it('registers itself as a custom element', () => {
        expect(customElements.get('ui-toast')).toBeDefined();
    });

    it('stays in the light DOM, where the region can contain it', async () => {
        const host = await mount(fixture);

        expect(toast(host).parentElement).toBe(toaster(host));
    });

    it('is polite by default, and lands in the region that says so', async () => {
        const host = await mount(fixture);

        expect(toast(host).slot).toBe('polite');
        expect(toast(host).assignedSlot?.parentElement?.getAttribute('aria-live')).toBe('polite');
    });

    it.each(['info', 'success', 'warning'] as const)(
        'announces a %s toast politely',
        async (variant) => {
            const host = await mount(
                `<ui-toaster><ui-toast variant="${variant}" duration="0">x</ui-toast></ui-toaster>`,
            );

            expect(toast(host).slot).toBe('polite');
        },
    );

    it('announces an error assertively, which is the one variant that may interrupt', async () => {
        const host = await mount(
            '<ui-toaster><ui-toast variant="danger">Could not save.</ui-toast></ui-toaster>',
        );

        expect(toast(host).slot).toBe('assertive');
        expect(toast(host).assignedSlot?.parentElement?.getAttribute('aria-live')).toBe(
            'assertive',
        );
    });

    it('is in its region in the task it was inserted, so nothing sees it in the other one', async () => {
        const host = await mount('<ui-toaster></ui-toaster>');
        const element = document.createElement('ui-toast');
        element.variant = 'danger';

        toaster(host).append(element);

        // Deliberately unawaited: a toast routed on its first update would be assigned to
        // the polite region for a microtask first, and a message moved between live
        // regions is a message announced twice.
        expect(element.slot).toBe('assertive');
        expect(element.assignedSlot?.name).toBe('assertive');
    });

    it('follows a variant that changes after it was inserted', async () => {
        const host = await mount(fixture);

        toast(host).variant = 'danger';
        await toast(host).updateComplete;

        expect(toast(host).slot).toBe('assertive');
    });

    it('reflects the variant, which is what the stylesheet selects on', async () => {
        const host = await mount(fixture);

        expect(toast(host).getAttribute('variant'), 'the default is written out too').toBe('info');

        toast(host).variant = 'success';
        await toast(host).updateComplete;

        expect(toast(host).getAttribute('variant')).toBe('success');
    });
});

/** Each variant, and the colour its edge and its icon are painted from. */
const tones = [
    ['info', '--ui-color-info'],
    ['success', '--ui-color-success'],
    ['warning', '--ui-color-warning'],
    ['danger', '--ui-color-danger'],
] as const;

/**
 * The icon, which tells the variant by its shape, so colour is not the only thing that does —
 * WCAG 1.4.1, and the one cue that survives forced colors, where the edge goes flat.
 */
describe('the icon, which tells the variant apart without its colour', () => {
    /** The icon a toast draws, which is the one svg in it that is not the dismiss mark. */
    function icon(element: UiToast): SVGSVGElement {
        const found = element.shadowRoot?.querySelector<SVGSVGElement>('svg[part=icon]');

        if (found === null || found === undefined) {
            throw new Error('the toast drew no icon');
        }

        return found;
    }

    /** The shapes inside an svg, without the markers a template leaves between them. */
    function geometry(drawing: SVGSVGElement): string {
        return [...drawing.children].map((shape) => shape.outerHTML).join('');
    }

    it.each(tones)('paints a %s icon from %s, the colour of its edge', async (variant, token) => {
        const host = await mount(
            `<ui-toaster><ui-toast variant="${variant}" duration="0">Done.</ui-toast></ui-toaster>`,
        );

        expect(getComputedStyle(icon(toast(host))).color).toBe(opaque(resolved(token)));
    });

    it.each([
        ['info', 'info'],
        ['success', 'circle-check'],
        ['warning', 'triangle-alert'],
        ['danger', 'circle-x'],
    ] as const)("draws a %s toast's icon as the vendored %s", async (variant, name) => {
        const host = await mount(
            `<ui-toaster><ui-toast variant="${variant}" duration="0">Done.</ui-toast></ui-toaster>`,
        );
        const vendored = document.createElement('ui-icon');
        vendored.setAttribute('name', name);
        host.append(vendored);
        await vendored.updateComplete;

        const drawn = vendored.shadowRoot?.querySelector('svg');

        if (drawn === null || drawn === undefined) {
            throw new Error(`the registry has no ${name}`);
        }

        // Copied rather than imported, so that importing a toast registers nothing — and
        // compared here, so the copy is checked against the set it was copied from.
        expect(geometry(icon(toast(host)))).toBe(geometry(drawn));
    });

    it("takes the edge and the icon from the host, through the variant's own name", async () => {
        // Read back from a retuned name rather than from the default, which is what tells a
        // colour from a fallback: an unresolvable reference would leave both the edge and the
        // expectation at the text colour and agree.
        const host = await mount(
            '<ui-toaster><ui-toast variant="success" duration="0">Done.</ui-toast></ui-toaster>',
        );
        const element = toast(host);

        element.style.setProperty('--ui-color-success', 'rgb(1, 2, 3)');

        expect(getComputedStyle(element, '::before').borderTopColor, 'the edge').toBe(
            'rgb(1, 2, 3)',
        );
        expect(getComputedStyle(icon(element)).color, 'the icon').toBe(opaque('rgb(1, 2, 3)'));
    });

    it('follows a variant that changes after it was drawn', async () => {
        const host = await mount(fixture);
        const before = geometry(icon(toast(host)));

        toast(host).variant = 'danger';
        await toast(host).updateComplete;

        expect(geometry(icon(toast(host)))).not.toBe(before);
    });

    it("sits centred on the message's first line, whatever height the page gives a line", async () => {
        const host = await mount(fixture);
        const element = toast(host);

        element.style.lineHeight = '40px';
        element.style.setProperty('--ui-icon-size', '20px');

        // Half of what the line has to spare over the glyph, above it and below.
        expect(getComputedStyle(icon(element)).marginTop).toBe('10px');
        expect(getComputedStyle(icon(element)).marginBottom).toBe('10px');
    });

    it('is hidden from the accessibility tree, which the message already covers', async () => {
        const host = await mount(fixture);

        expect(icon(toast(host)).getAttribute('aria-hidden')).toBe('true');
    });
});

describe('the edge, which agrees with the message rather than replacing it', () => {
    it.each(tones)('edges a %s toast all the way round from %s', async (variant, token) => {
        const host = await mount(
            `<ui-toaster><ui-toast variant="${variant}" duration="0">Done.</ui-toast></ui-toaster>`,
        );
        const styles = getComputedStyle(toast(host), '::before');

        // One colour on every side, where the stripe used to meet the derived border at the
        // corners as a break.
        expect(styles.borderInlineStartColor, 'the stripe').toBe(resolved(token));
        expect(styles.borderTopColor, 'and the rest of it').toBe(resolved(token));
        expect(styles.borderInlineEndColor).toBe(resolved(token));
        expect(styles.borderBottomColor).toBe(resolved(token));
    });

    it.each(tones)(
        'edges a %s toast, its icon and its lift in --ui-color-toast-edge once it is set',
        async (variant) => {
            const host = await mount(
                `<ui-toaster><ui-toast variant="${variant}" duration="0">Done.</ui-toast></ui-toaster>`,
            );
            const element = toast(host);

            element.style.setProperty('--ui-color-toast-edge', 'rgb(1, 2, 3)');
            element.style.setProperty('--ui-elevation-raised', '0 0 0 1px currentColor');

            const edge = getComputedStyle(element, '::before');

            expect(edge.borderTopColor, 'the edge').toBe('rgb(1, 2, 3)');
            expect(edge.borderInlineStartColor, 'the stripe').toBe('rgb(1, 2, 3)');
            expect(edge.boxShadow, 'a lift written in currentColor').toBe(
                'rgb(1, 2, 3) 0px 0px 0px 1px',
            );
            expect(getComputedStyle(part(element, 'icon')).color, 'the icon').toBe(
                opaque('rgb(1, 2, 3)'),
            );
        },
    );

    it('paints the icon opaque when the edge is softened, as the one cue that is not colour', async () => {
        // A theme may write the edge at an opacity — Glass does, at 0.80 — and the icon owes
        // 3:1 as a graphic, which every icon but the danger's lost at that opacity.
        const host = await mount(fixture);
        const element = toast(host);

        element.style.setProperty('--ui-color-toast-edge', 'rgb(1 2 3 / 0.5)');

        expect(getComputedStyle(element, '::before').borderTopColor, 'the edge').toBe(
            'rgba(1, 2, 3, 0.5)',
        );
        expect(getComputedStyle(part(element, 'icon')).color, 'the icon').toBe(
            opaque('rgb(1, 2, 3)'),
        );
    });

    it('lights a lift written in currentColor in the variant, as the edge is', async () => {
        const host = await mount(
            '<ui-toaster><ui-toast variant="danger" duration="0">Done.</ui-toast></ui-toaster>',
        );

        toast(host).style.setProperty('--ui-elevation-raised', '0 0 0 1px currentColor');

        expect(getComputedStyle(toast(host), '::before').boxShadow).toBe(
            `${resolved('--ui-color-danger')} 0px 0px 0px 1px`,
        );
    });

    it('edges every variant in the text, its icon too, when the reader asks for more contrast', async () => {
        const style = document.createElement('style');
        style.textContent = tokenStyleSheet();
        document.head.append(style);
        await cdp().send('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-contrast', value: 'more' }],
        });

        try {
            for (const variant of ['info', 'success', 'warning', 'danger'] as const) {
                const host = await mount(
                    `<ui-toaster><ui-toast variant="${variant}" duration="0">Done.</ui-toast></ui-toaster>`,
                );

                expect(getComputedStyle(toast(host), '::before').borderTopColor, variant).toBe(
                    'rgb(0, 0, 0)',
                );
                expect(getComputedStyle(part(toast(host), 'icon')).color, variant).toBe(
                    opaque('rgb(0, 0, 0)'),
                );
                host.remove();
            }
        } finally {
            await cdp().send('Emulation.setEmulatedMedia', { features: [] });
            style.remove();
        }
    });

    it('tells the four apart, so the table above is not four names for one colour', async () => {
        const painted = new Set<string>();

        for (const variant of ['info', 'success', 'warning', 'danger'] as const) {
            const host = await mount(
                `<ui-toaster><ui-toast variant="${variant}" duration="0">Done.</ui-toast></ui-toaster>`,
            );

            painted.add(getComputedStyle(toast(host), '::before').borderInlineStartColor);
        }

        expect(painted.size).toBe(4);
    });
});

/**
 * Every value the two components paint, read back from the token it was written with.
 *
 * **Each assertion retunes the token and reads the property**, rather than comparing the
 * property against the default the layer already declares — which is the shape
 * `card.test.ts` established and the reason is the same: comparing against the default
 * compares this package with itself, and passes for a rule that names the wrong token, or
 * no token at all. Retuned, the read can only agree if the declaration is the one that
 * arrived from that name.
 *
 * The mutation floor is what made this a block rather than a line. Thirty rules here read
 * a token, and the suite asserted one of them.
 */
describe('the values, all of which come from the token layer', () => {
    it('takes the stack spacing and the cap from the host', async () => {
        const host = await mount(fixture);
        const element = toaster(host);

        // Small enough that 44 steps fit inside the viewport, which is what makes the
        // multiplier readable: at the default step the min() picks the other side and the
        // assertion would be about the window instead.
        element.style.setProperty('--ui-space', '5px');

        const styles = getComputedStyle(element);

        expect(styles.padding).toBe('10px');
        expect(styles.rowGap).toBe('5px');
        expect(styles.inlineSize).toBe('220px');
        expect(getComputedStyle(region(element, 'polite')).rowGap, 'inside a region').toBe('5px');
    });

    it('never runs wider than the viewport, whatever the step is', async () => {
        const host = await mount(fixture);
        const element = toaster(host);

        element.style.setProperty('--ui-space', '40px');

        expect(element.getBoundingClientRect().width).toBeLessThanOrEqual(
            document.documentElement.clientWidth,
        );
    });

    it('takes the box of a toast from the host', async () => {
        const host = await mount(fixture);
        const element = toast(host);

        element.style.setProperty('--ui-space', '10px');
        element.style.setProperty('--ui-radius', '11px');
        // The edge is the variant's colour, and the fixture's variant is the default, info.
        element.style.setProperty('--ui-color-info', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-color-surface', 'rgb(4, 5, 6)');
        element.style.setProperty('--ui-color-text', 'rgb(7, 8, 9)');
        element.style.setProperty('--ui-font', 'Courier');
        element.style.setProperty('--ui-elevation-raised', 'rgb(1, 2, 3) 0px 4px 8px 0px');

        const styles = getComputedStyle(element);
        // The edge and the lift are drawn on a layer over the toast, in the edge's colour.
        const edge = getComputedStyle(element, '::before');

        expect(styles.columnGap).toBe('10px');
        expect(styles.padding).toBe('10px 15px');
        // The toast holds the edge's room, and the layer draws in it.
        expect(styles.borderInlineStartWidth).toBe('5px');
        expect(styles.borderTopWidth).toBe('1px');
        expect(edge.borderTopColor).toBe('rgb(1, 2, 3)');
        expect(edge.borderInlineStartWidth).toBe('5px');
        expect(edge.borderTopWidth).toBe('1px');
        expect(edge.top).toBe('-1px');
        expect(edge.insetInlineStart).toBe('-5px');
        expect(edge.position).toBe('absolute');
        expect(styles.position).toBe('relative');
        expect(edge.pointerEvents).toBe('none');
        expect(styles.borderRadius).toBe('11px');
        expect(edge.borderTopLeftRadius).toBe('11px');
        expect(styles.backgroundColor).toBe('rgb(4, 5, 6)');
        expect(getComputedStyle(part(element, 'message')).color).toBe('rgb(7, 8, 9)');
        expect(styles.fontFamily).toBe('Courier');
        expect(edge.boxShadow).toBe('rgb(1, 2, 3) 0px 4px 8px 0px');
        expect(styles.boxShadow, 'and none on the toast').toBe('none');
    });

    it('takes a raised surface and what it does to the page behind it from the host', async () => {
        const host = await mount(fixture);
        const element = toast(host);

        expect(getComputedStyle(element).backdropFilter, 'nothing by default').toBe('none');

        element.style.setProperty('--ui-color-surface-raised', 'rgb(1, 2, 3, 0.2)');
        element.style.setProperty('--ui-backdrop-raised', 'blur(10px)');

        expect(getComputedStyle(element).backgroundColor).toBe('rgba(1, 2, 3, 0.2)');
        expect(getComputedStyle(element).backdropFilter).toBe('blur(10px)');
    });

    it('declares the text colour with the surface, never half the pair', async () => {
        // A surface declared without the colour chosen against it inherits whatever the
        // page set, and the contrast the token layer measured stops holding at the one
        // place it was measured for.
        const host = await mount(`<div style="color: rgb(1, 2, 3)">${fixture}</div>`);

        expect(getComputedStyle(part(toast(host), 'message')).color).toBe('rgb(31, 41, 55)');
    });

    it('takes the entrance from the host', async () => {
        const host = await mount(fixture);
        const element = toast(host);

        element.style.setProperty('--ui-duration-state', '0.4s');
        element.style.setProperty('--ui-duration-effect', '0.3s');
        element.style.setProperty('--ui-easing-enter', 'linear');

        const styles = getComputedStyle(element);

        // Its rise and its fade over a state's time, and what a focus moves it by on its
        // transform over an effect's.
        expect(styles.transitionProperty).toBe('opacity, translate, transform');
        expect(styles.transitionDuration).toBe('0.4s, 0.4s, 0.3s');
        expect(styles.transitionTimingFunction).toBe('linear, linear, linear');
    });

    it('takes the distance the entrance travels from the host', async () => {
        // `@starting-style` applies for the frame the toast is inserted, so the override
        // has to be in force before it arrives — on the toaster, which it inherits from.
        // The duration is stretched so the read lands near the start of the travel rather
        // than near the end of it.
        const host = await mount('<ui-toaster></ui-toaster>');
        const element = toaster(host);

        element.style.setProperty('--ui-space', '10px');
        element.style.setProperty('--ui-duration-state', '10s');

        const created = document.createElement('ui-toast');
        created.textContent = 'Saved.';
        element.append(created);
        await created.updateComplete;

        const travelled = Number.parseFloat(
            getComputedStyle(created).translate.split(' ')[1] ?? '',
        );

        expect(travelled).toBeGreaterThan(15);
    });

    it('takes the exit from the host, and reverses the curve', async () => {
        const host = await mount(fixture);
        const element = toast(host);

        element.style.setProperty('--ui-space', '10px');
        element.style.setProperty('--ui-easing-exit', 'linear');
        element.style.setProperty('--ui-duration-state', '10s');
        await still(element);

        element.dismiss();

        // One value rather than the list the resting rule declares: the exit names the
        // timing function alone, and one function covers every property in the list.
        expect(getComputedStyle(element).transitionTimingFunction).toBe('linear');

        // The destination rather than the interpolation: a value read partway through the
        // exit is whatever the curve had reached, which is a different question.
        for (const animation of element.getAnimations()) {
            animation.finish();
        }

        expect(getComputedStyle(element).translate).toBe('0px 20px');
        expect(getComputedStyle(element).opacity).toBe('0');
    });

    it('takes the dismiss button from the host', async () => {
        const host = await mount(fixture);
        const element = toast(host);

        element.style.setProperty('--ui-radius', '11px');
        element.style.setProperty('--ui-color-text-muted', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-duration-state', '0.4s');
        element.style.setProperty('--ui-easing-state', 'linear');
        element.style.setProperty('--ui-icon-size', '30px');
        element.style.setProperty('--ui-icon-stroke', '7');

        const button = getComputedStyle(dismisser(element));
        const glyph = getComputedStyle(mark(element));

        expect(button.borderRadius).toBe('11px');
        expect(button.color).toBe('rgb(1, 2, 3)');
        expect(button.transitionProperty).toBe('background-color');
        expect(button.transitionDuration).toBe('0.4s');
        expect(button.transitionTimingFunction).toBe('linear');
        expect(glyph.inlineSize).toBe('30px');
        expect(glyph.blockSize).toBe('30px');
        expect(glyph.strokeWidth).toBe('7px');
    });

    it('draws the mark on the adopted grid, in the colour of the control it names', async () => {
        // Drawn here rather than imported from `src/icons/`: a component may not require a
        // host to import a glyph module in order for its own control to have a mark. The
        // grid, the stroke and the colour are the icon element own decisions, read from the
        // same two tokens.
        const host = await mount(fixture);
        const element = toast(host);

        element.style.setProperty('--ui-color-text-muted', 'rgb(1, 2, 3)');

        const glyph = mark(element);
        const styles = getComputedStyle(glyph);

        expect(glyph.getAttribute('viewBox')).toBe('0 0 24 24');
        expect(glyph.querySelector('path')?.getAttribute('d')).toMatch(/\d/);
        expect(styles.fill, 'the geometry is strokes, not areas').toBe('none');
        expect(styles.stroke, 'and it follows the text beside it').toBe('rgb(1, 2, 3)');
        expect(styles.strokeLinecap).toBe('round');
    });

    it('answers a pointer, from the host own colour', async () => {
        const host = await mount(fixture);
        const element = toast(host);

        element.style.setProperty('--ui-color-hover', 'rgb(1, 2, 3)');
        // The colour is the question here, not the motion — a background read partway
        // through the transition is whatever the interpolation had reached.
        element.style.setProperty('--ui-duration-state', '0s');

        const resting = getComputedStyle(dismisser(element)).backgroundColor;

        await userEvent.hover(dismisser(element));

        expect(resting, 'transparent until it is pointed at').toBe('rgba(0, 0, 0, 0)');
        expect(getComputedStyle(dismisser(element)).backgroundColor).toBe('rgb(1, 2, 3)');
    });

    it('takes the focus ring from the host, which is the one a keyboard reader needs', async () => {
        const host = await mount(fixture);
        const element = toast(host);

        element.style.setProperty('--ui-color-focus', 'rgb(1, 2, 3)');

        await userEvent.tab();

        const styles = getComputedStyle(dismisser(element));

        expect(element.shadowRoot?.activeElement, 'the tab reached it').toBe(dismisser(element));
        expect(styles.outlineColor).toBe('rgb(1, 2, 3)');
        expect(styles.outlineStyle).toBe('solid');
        expect(styles.outlineWidth).toBe('2px');
    });

    it('exposes the five parts a host restyles through', async () => {
        const host = await mount(fixture);

        expect(region(toaster(host), 'polite').getAttribute('part')).toBe('polite');
        expect(region(toaster(host), 'assertive').getAttribute('part')).toBe('assertive');
        expect(
            toast(host).shadowRoot?.querySelector('[part=message]')?.textContent,
        ).not.toBeUndefined();
        expect(dismisser(toast(host)).getAttribute('part')).toBe('dismiss');
        expect(toast(host).shadowRoot?.querySelector('svg')?.getAttribute('part')).toBe('icon');
    });
});

/**
 * The pointer and a focus in a toast — RFC 0004's, a card's by kind, under each theme's taste. What
 * each effect draws is graded on a surface of the suite's own in `tests/effects.test.ts`; what these
 * are about is that the toast draws it.
 */
describe("the pointer and a focus in it, under each theme's taste", () => {
    /**
     * Mounts the fixture under the token sheet, and under `theme`'s after it where one is named,
     * which the region round it takes, with every duration the effects fade over out.
     */
    async function under(theme?: Theme): Promise<UiToast> {
        const style = document.createElement('style');
        style.textContent = tokenStyleSheet() + (theme === undefined ? '' : themeStyleSheet(theme));
        document.body.append(style);

        const host = document.createElement('div');
        host.style.setProperty('--ui-duration-effect', '0s');
        host.style.setProperty('--ui-duration-state', '0s');

        if (theme !== undefined) {
            host.dataset['uiTheme'] = theme.name;
        }

        host.innerHTML = fixture;
        document.body.append(host);

        const element = toast(host);
        await toaster(host).updateComplete;
        await element.updateComplete;
        await still(element);

        return element;
    }

    /** One of the toast's layers. */
    function layer(element: UiToast, name: string): HTMLElement {
        return only(element.shadowRoot ?? document, `[data-layer='${name}']`);
    }

    it('renders the empty layers its effects are drawn on, beside its icon, message and button', async () => {
        const host = await mount(fixture);
        const layers = [...(toast(host).shadowRoot?.querySelectorAll('[data-layer]') ?? [])];

        expect(
            layers.map((each) => [each.getAttribute('data-layer'), each.childNodes.length]),
        ).toEqual([
            ['fill', 0],
            ['focus-fill', 0],
            ['shadow', 0],
            ['focus-shadow', 0],
            ['border', 0],
        ]);
    });

    it('lays every layer over its edge, the wider stripe at its start included', async () => {
        const host = await mount(fixture);
        const element = toast(host);
        element.style.setProperty('--ui-space', '10px');

        for (const name of ['fill', 'focus-fill', 'shadow', 'focus-shadow', 'border']) {
            const styles = getComputedStyle(layer(element, name));

            expect([styles.top, styles.left, styles.right, styles.bottom], name).toEqual([
                '-1px',
                '-5px',
                '-1px',
                '-1px',
            ]);
        }
    });

    it("raises a toast under the pointer, and raises and lifts it on its transform at a focus in it, under the default theme's taste", async () => {
        const element = await under();

        await userEvent.hover(element);

        expect(getComputedStyle(layer(element, 'shadow')).opacity, 'raised').toBe('1');

        await userEvent.tab();

        expect(element.hasAttribute('data-focus-visible'), 'marked').toBe(true);
        expect(getComputedStyle(layer(element, 'focus-shadow')).opacity, 'raised').toBe('1');
        expect(
            [getComputedStyle(element).transform, getComputedStyle(element).translate],
            'lifted on its transform, its translate left to its rise',
        ).toEqual(['matrix(1, 0, 0, 1, 0, -4)', '0px']);
    });

    it('takes the mark off as the focus leaves the toast', async () => {
        const element = await under();
        const after = document.createElement('button');
        after.textContent = 'After';
        document.body.append(after);

        await userEvent.tab();

        expect(element.hasAttribute('data-focus-visible'), 'in it').toBe(true);

        await userEvent.tab();

        expect(element.hasAttribute('data-focus-visible'), 'left').toBe(false);
    });

    it('has the pointer engine follow a toast whose sheet chose a light that follows it', async () => {
        const element = await under(glass);
        const box = element.getBoundingClientRect();
        // The engine is handed an effect's time, and follows nothing under none.
        element.style.setProperty('--ui-duration-effect', '0.3s');

        // Dispatched rather than driven, so the pointer is where the test says.
        element.dispatchEvent(
            new PointerEvent('pointerover', {
                bubbles: true,
                clientX: box.left + box.width / 2,
                clientY: box.top + box.height / 2,
            }),
        );
        await new Promise(requestAnimationFrame);

        expect(element.style.getPropertyValue('--ui-fx-pointer-near')).toBe('1');
    });

    it('tints and glows a toast under the pointer under Matrix, and tints it and bursts light round it at a focus in it', async () => {
        const element = await under(matrix);

        await userEvent.hover(element);

        expect(getComputedStyle(layer(element, 'fill')).opacity, 'tinted').toBe('1');
        expect(getComputedStyle(layer(element, 'shadow')).boxShadow, 'glowing').toMatch(
            / 0px 0px 16px 2px, .+ 0px 0px 40px 8px$/,
        );

        await userEvent.tab();

        expect(getComputedStyle(layer(element, 'focus-fill')).opacity, 'tinted').toBe('1');
        expect(getComputedStyle(layer(element, 'focus-shadow')).animationName, 'a burst').toBe(
            'ui-burst',
        );
        expect(getComputedStyle(element).transform, 'not lifted').toBe('none');
    });

    it('raises a toast under the pointer under Glass, its edge as it rests, and sweeps it and lights it inside at a focus in it', async () => {
        const element = await under(glass);

        await userEvent.hover(element);

        expect(getComputedStyle(layer(element, 'shadow')).boxShadow, 'raised, not cast').toContain(
            'rgba(0, 0, 0, 0.35) 0px 12px 28px -8px',
        );
        expect(getComputedStyle(layer(element, 'border')).backgroundImage, 'no edge').toBe('none');

        await userEvent.tab();

        expect(getComputedStyle(layer(element, 'focus-fill')).animationName, 'a sweep').toBe(
            'ui-shimmer',
        );
        expect(getComputedStyle(layer(element, 'focus-shadow')).boxShadow, 'a light').toMatch(
            / 0px 0px 0px 1px inset, .+ 0px 0px 12px 2px inset$/,
        );
    });
});

/**
 * How a toast comes onto the page and leaves it — RFC 0004's entrance and exit, which its own rise and
 * sink, today's, stand down for where a surface's effects animate one.
 */
describe('arriving and leaving', () => {
    /**
     * Puts a toast into a toaster mounted under the token sheet, the effects `choices` names chosen
     * on the toaster, and hands it over as it arrives.
     */
    async function arriving(choices: Readonly<Record<string, string>> = {}): Promise<UiToast> {
        const style = document.createElement('style');
        style.textContent = tokenStyleSheet();
        document.body.append(style);

        const host = await mount('<ui-toaster></ui-toaster>');

        for (const [moment, effect] of Object.entries(choices)) {
            toaster(host).style.setProperty(`--ui-motion-${moment}`, effect);
        }

        const created = document.createElement('ui-toast');
        created.duration = 0;
        created.textContent = 'Saved.';
        toaster(host).append(created);
        await created.updateComplete;

        return created;
    }

    /** What `element` transitions: only its transform where an animated passage stands its own down. */
    function transitioned(element: HTMLElement): string {
        return getComputedStyle(element).transitionProperty;
    }

    it("slides a toast in under the default theme's taste, its own rise standing down", async () => {
        const element = await arriving();

        expect(getComputedStyle(element).animationName).toBe('ui-enter-slide-elastic');
        expect(transitioned(element), 'only what moves it').toBe('transform');
    });

    it.each([['fade'], ['slide-elastic'], ['refocus'], ['materialize'], ['wind'], ['dissolve']])(
        'stands its own rise down where its entrance is %s',
        async (effect) => {
            const element = await arriving({ enter: effect });

            expect(transitioned(element)).toBe('transform');
        },
    );

    it.each([['fade'], ['slide'], ['defocus'], ['erode'], ['wind'], ['dissolve']])(
        'stands its own sink down where its exit is %s, at rest for whatever draws it',
        async (effect) => {
            const element = await arriving({ exit: effect });
            await still(element);
            element.style.setProperty('--ui-duration-exit', '10s');

            element.dismiss();

            const styles = getComputedStyle(element);

            expect(transitioned(element)).toBe('transform');
            expect(
                [styles.getPropertyValue('opacity'), element.style.opacity],
                'its own sink not drawn',
            ).not.toContain('0');
        },
    );

    it('blows a toast in and away on a wind under Matrix, drawn through its pieces at rest', async () => {
        const style = document.createElement('style');
        style.textContent = tokenStyleSheet() + themeStyleSheet(matrix);
        document.body.append(style);

        const host = await mount('<ui-toaster data-ui-theme="matrix"></ui-toaster>');
        const created = document.createElement('ui-toast');
        created.duration = 0;
        created.textContent = 'Saved.';
        toaster(host).append(created);
        await created.updateComplete;
        await created.updateComplete;

        expect(created.style.filter, 'blown in').toMatch(/^url\("#ui-pieces-\d+"\)$/);

        for (const animation of created.getAnimations()) {
            animation.finish();
        }

        await new Promise((resolve) => setTimeout(resolve, 0));

        created.dismiss();

        expect(created.style.filter, 'blown away').toMatch(/^url\("#ui-pieces-\d+"\)$/);
        expect(getComputedStyle(created).opacity, 'at rest, for the pieces to draw').toBe('1');

        const gone = dismissed(created);

        for (const animation of created.getAnimations()) {
            animation.finish();
        }

        await gone;
        await Promise.resolve();

        expect([created.isConnected, created.style.filter], 'gone, and whole').toEqual([false, '']);
    });

    it('brings a toast into focus under Glass, and takes it out of focus as it leaves', async () => {
        const style = document.createElement('style');
        style.textContent = tokenStyleSheet() + themeStyleSheet(glass);
        document.body.append(style);

        const host = await mount('<ui-toaster data-ui-theme="glass"></ui-toaster>');
        const created = document.createElement('ui-toast');
        created.duration = 0;
        created.textContent = 'Saved.';
        toaster(host).append(created);
        await created.updateComplete;

        expect(getComputedStyle(created).animationName).toBe('ui-enter-refocus');

        await still(created);
        created.dismiss();

        expect(getComputedStyle(created).animationName).toBe('ui-exit-defocus');
    });

    it('fades a toast in where the fade is chosen, its own rise standing down', async () => {
        const element = await arriving({ enter: 'fade' });

        expect(getComputedStyle(element).animationName).toBe('ui-enter-fade');
        expect(transitioned(element), 'only what moves it').toBe('transform');
    });

    it('rises as it does today where no entrance is chosen', async () => {
        const element = await arriving({ enter: 'none' });

        expect(getComputedStyle(element).animationName).toBe('none');
        expect(transitioned(element), 'its rise').toBe('opacity, translate, transform');
    });

    it.each([
        ["the default theme's slide", {}, 'ui-exit-slide'],
        ['a fade', { exit: 'fade' }, 'ui-exit-fade'],
    ] as const)(
        'leaves through %s as it is dismissed, its own sink standing down, then goes',
        async (_whose, choices, exit) => {
            const element = await arriving(choices);
            await still(element);

            element.style.setProperty('--ui-duration-effect', '0.3s');
            element.dismiss();

            expect(getComputedStyle(element).animationName).toBe(exit);
            expect(
                [transitioned(element), getComputedStyle(element).transitionDuration],
                'only what moves it',
            ).toEqual(['transform', '0.3s']);

            const gone = dismissed(element);

            for (const animation of element.getAnimations()) {
                animation.finish();
            }

            await gone;

            expect(element.isConnected).toBe(false);
        },
    );

    it('arrives anew when it is put back after it was dismissed', async () => {
        const host = await mount(fixture);
        const element = toast(host);
        element.style.setProperty('--ui-duration-state', '0s');
        await still(element);

        element.dismiss();
        await dismissed(element);
        toaster(host).append(element);

        expect(element.matches(':state(leaving)')).toBe(false);
    });

    it('lets a toast slide past the stack it stands in rather than scrolling it', async () => {
        const host = await mount(fixture);

        expect(getComputedStyle(toaster(host)).overflow).toBe('visible');
    });
});

/**
 * The time a toast has left, drawn as a ring round its dismiss button — RFC 0004's dwell, which the
 * default theme's taste names under every theme.
 */
describe('the time left, a ring round the dismiss button', () => {
    /** Mounts `markup` under the token sheet, and hands over its toast. */
    async function sheeted(markup: string): Promise<UiToast> {
        const style = document.createElement('style');
        style.textContent = tokenStyleSheet();
        document.body.append(style);

        return toast(await mount(markup));
    }

    /** The ring, as its button's layer draws it. */
    function ring(element: UiToast): CSSStyleDeclaration {
        return getComputedStyle(dismisser(element), '::after');
    }

    /** The ring's sweep, the one animation its button's layer runs. */
    function sweep(element: UiToast): CSSAnimation {
        const found = dismisser(element)
            .getAnimations({ subtree: true })
            .find(
                (animation): animation is CSSAnimation =>
                    animation instanceof CSSAnimation &&
                    animation.animationName === 'ui-dwell-ring',
            );

        if (found === undefined) {
            throw new Error('no ring sweeping');
        }

        return found;
    }

    it("rings a timed toast's dismiss button with the time it has left, over its own dwell", async () => {
        const element = await sheeted(
            '<ui-toaster><ui-toast duration="9000">Saved.</ui-toast></ui-toaster>',
        );
        const styles = ring(element);

        expect([
            styles.content,
            styles.animationName,
            styles.animationDuration,
            styles.animationTimingFunction,
            styles.animationFillMode,
        ]).toEqual(['""', 'ui-dwell-ring', '9s', 'linear', 'forwards']);
        expect(styles.backgroundImage, "in the button's own colour").toBe(
            `conic-gradient(${getComputedStyle(dismisser(element)).color} 360deg, rgba(0, 0, 0, 0) 0deg)`,
        );

        const swept = sweep(element);

        swept.pause();
        swept.currentTime = 4500;

        expect(ring(element).getPropertyValue('--ui-fx-swept'), 'half left').toBe('180deg');
    });

    it("draws no ring round an error's button, nor round one that stays until it is dismissed", async () => {
        const error = await sheeted(
            '<ui-toaster><ui-toast variant="danger">Failed.</ui-toast></ui-toaster>',
        );
        const kept = await sheeted(
            '<ui-toaster><ui-toast duration="0">Saved.</ui-toast></ui-toaster>',
        );

        expect([ring(error).content, ring(kept).content]).toEqual(['none', 'none']);
    });

    it('holds the ring full while the pointer is on the toast', async () => {
        const element = await sheeted(
            `<ui-toaster><ui-toast duration="${String(patient)}">Saved.</ui-toast></ui-toaster>`,
        );
        await still(element);

        await userEvent.hover(element);

        expect([
            ring(element).animationName,
            ring(element).getPropertyValue('--ui-fx-swept'),
        ]).toEqual(['none', '360deg']);
    });

    it('holds the ring full while the focus is in the toast', async () => {
        const element = await sheeted(
            `<ui-toaster><ui-toast duration="${String(patient)}">Saved.</ui-toast></ui-toaster>`,
        );

        await userEvent.tab();

        expect(ring(element).animationName).toBe('none');
    });

    it('stands the ring down for a reader who asked for less motion, read off the count the collapse takes to one', async () => {
        const element = await sheeted(
            '<ui-toaster style="--ui-iteration-settle: 1"><ui-toast duration="9000">Saved.</ui-toast></ui-toaster>',
        );

        expect(ring(element).content).toBe('none');
    });

    it('writes its dwell where it has a clock, and takes it off where it has none', async () => {
        const element = await sheeted(
            '<ui-toaster><ui-toast duration="9000">Saved.</ui-toast></ui-toaster>',
        );

        expect([
            element.style.getPropertyValue('--ui-fx-dwell'),
            element.matches(':state(timed)'),
        ]).toEqual(['9000ms', true]);

        element.variant = 'danger';
        await element.updateComplete;

        expect([
            element.style.getPropertyValue('--ui-fx-dwell'),
            element.matches(':state(timed)'),
        ]).toEqual(['', false]);
    });
});

/**
 * The stack — RFC 0004's, the toaster's: how the toasts a change leaves standing move into their
 * place. What the moves are is graded on a stack of the suite's own in `tests/stack.test.ts`; what
 * these are about is that the toaster and its toasts draw them.
 */
describe('the stack, which springs its toasts into place', () => {
    /** Mounts `markup` under the token sheet. */
    async function sheeted(markup: string): Promise<HTMLElement> {
        const style = document.createElement('style');
        style.textContent = tokenStyleSheet();
        document.body.append(style);

        return mount(markup);
    }

    /** The moves the stack set going on `element`, apart from what its own sheet animates. */
    function springs(element: Element): (readonly unknown[])[] {
        return element
            .getAnimations()
            .filter(
                (animation) =>
                    !(animation instanceof CSSAnimation) && !(animation instanceof CSSTransition),
            )
            .map((animation) => {
                const effect = animation.effect as KeyframeEffect;

                return [effect.getKeyframes()[0]?.['translate'], effect.getTiming().duration];
            });
    }

    it("hands a toast its toaster's spring, read where the toaster stands", async () => {
        const host = await sheeted(`
            <ui-toaster style="--ui-duration-travel: 0.7s; --ui-easing-emphasis: linear">
                <ui-toast duration="0">Saved.</ui-toast>
            </ui-toaster>
            <ui-toaster style="--ui-motion-stack: none">
                <ui-toast duration="0">Kept.</ui-toast>
            </ui-toaster>
        `);
        const [springing, still] = [...host.querySelectorAll('ui-toast')];
        const handed = (element: Element | undefined): string[] =>
            ['', '-time', '-curve'].map((kind) =>
                element === undefined
                    ? ''
                    : getComputedStyle(element).getPropertyValue(`--ui-fx-stack${kind}`),
            );

        expect(handed(springing)).toEqual(['spring', '0.7s', 'linear']);
        expect(handed(still)[0], 'a choice written on the toaster itself').toBe('');
    });

    it('springs the others into their place as one is dismissed, leaving one on its way out where it is', async () => {
        const host = await sheeted(`
            <ui-toaster style="--ui-duration-travel: 10s">
                <ui-toast duration="0" style="--ui-duration-exit: 10s">First.</ui-toast>
                <ui-toast duration="0">Second.</ui-toast>
                <ui-toast duration="0" style="--ui-duration-exit: 0s">Third.</ui-toast>
            </ui-toaster>
        `);
        const [first, second, third] = [...host.querySelectorAll<UiToast>('ui-toast')];

        if (first === undefined || second === undefined || third === undefined) {
            throw new Error('three toasts in the fixture');
        }

        for (const element of [first, second, third]) {
            await still(element);
        }

        first.dismiss();

        const gone = dismissed(third);

        third.dismiss();
        await gone;
        await new Promise(requestAnimationFrame);

        expect(springs(second), 'let down from where it stood').toEqual([
            [expect.stringMatching(/^0px -\d+(\.\d+)?px$/), 10000],
        ]);
        expect(springs(first), 'on its way out, left to its exit').toEqual([]);
    });
});

describe('the dismiss button, which every toast has', () => {
    it('carries a name, because an icon-only control has nothing else to be called', async () => {
        const host = await mount(fixture);

        expect(dismisser(toast(host)).getAttribute('aria-label')).toBe('Dismiss');
    });

    it('takes the name a page that is not in English writes', async () => {
        const host = await mount(
            '<ui-toaster><ui-toast dismiss-label="Fechar" duration="0">Salvo.</ui-toast></ui-toaster>',
        );

        expect(dismisser(toast(host)).getAttribute('aria-label')).toBe('Fechar');
        await expectAccessible(host);
    });

    it('hides the mark from the accessibility tree, which the label already covers', async () => {
        const host = await mount(fixture);

        expect(dismisser(toast(host)).querySelector('svg')?.getAttribute('aria-hidden')).toBe(
            'true',
        );
    });

    it('clears the 24 by 24 floor WCAG 2.2 asks of a pointer target', async () => {
        const host = await mount(fixture);
        const box = dismisser(toast(host)).getBoundingClientRect();

        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);
    });

    it('dismisses the toast when it is clicked', async () => {
        const host = await mount(fixture);
        const element = toast(host);
        const announced = dismissed(element);

        await userEvent.click(dismisser(element));
        await announced;

        expect(element.isConnected).toBe(false);
    });
});

describe('dismissal', () => {
    it('announces the dismissal while the toast can still be heard, and then removes it', async () => {
        const host = await mount(fixture);
        const element = toast(host);
        let connectedWhenHeard: boolean | undefined;

        // On an ancestor rather than on the toast: an event that reaches here has bubbled,
        // which it can only do from an element still in the tree.
        host.addEventListener('ui-dismiss', (event) => {
            connectedWhenHeard = (event.target as HTMLElement).isConnected;
        });

        element.dismiss();
        await dismissed(element);

        expect(connectedWhenHeard).toBe(true);
        expect(element.isConnected).toBe(false);
    });

    it('crosses a shadow boundary, so a component holding a toaster hears it too', async () => {
        const outer = document.createElement('div');
        const shadow = outer.attachShadow({ mode: 'open' });
        document.body.append(outer);
        shadow.innerHTML = fixture;

        const element = toast(shadow);
        await element.updateComplete;

        let heard = false;
        outer.addEventListener('ui-dismiss', () => {
            heard = true;
        });

        element.dismiss();
        await dismissed(element);

        expect(heard).toBe(true);
    });

    it('runs an exit that can be seen before the toast goes', async () => {
        const host = await mount(fixture);
        const element = toast(host);

        // Arrived first, and that is the assertion's own precondition rather than a wait
        // for convenience: the exit lands on the values the entrance starts from, so a
        // toast dismissed while it is still arriving has nothing left to animate. Measured
        // — dismissing straight after mounting cancels the entrance and runs no exit, which
        // is the component being right and would read here as it doing nothing.
        await still(element);

        element.dismiss();

        expect(element.matches(':state(leaving)')).toBe(true);
        expect(element.getAnimations().length).toBeGreaterThan(0);

        await dismissed(element);
    });

    it('dismisses once however many times it is asked', async () => {
        const host = await mount(fixture);
        const element = toast(host);
        let announced = 0;

        // On the toast rather than on an ancestor, and the difference is the whole
        // assertion: a second exit finishes after the first one has removed the element, so
        // its event bubbles to nothing and a listener above would count one either way.
        element.addEventListener('ui-dismiss', () => {
            announced += 1;
        });

        element.dismiss();
        element.dismiss();

        await dismissed(element);
        await wait(settled);

        expect(announced).toBe(1);
    });

    it('stays on the page until the exit has finished', async () => {
        const host = await mount(fixture);
        const element = toast(host);

        // Arrived first, so there is an exit to run at all, and then stretched so the
        // assertion below lands inside it rather than after it.
        await still(element);
        element.style.setProperty('--ui-duration-state', '1s');
        element.dismiss();

        await wait(settled);

        expect(element.isConnected, 'still there while the exit runs').toBe(true);

        await dismissed(element);

        expect(element.isConnected).toBe(false);
    });

    it('dismisses on Escape, for a reader who has tabbed into it', async () => {
        const host = await mount(fixture);
        const element = toast(host);
        const announced = dismissed(element);

        dismisser(element).focus();
        await userEvent.keyboard('{Escape}');
        await announced;

        expect(element.isConnected).toBe(false);
    });

    it('leaves every other key alone', async () => {
        const host = await mount(fixture);

        dismisser(toast(host)).focus();
        await userEvent.keyboard('a');
        await wait(settled);

        expect(toast(host).isConnected).toBe(true);
    });
});

describe('the clock', () => {
    it('takes a polite toast away once its dwell has run', async () => {
        const host = await mount(
            `<ui-toaster><ui-toast duration="${String(brief)}">Saved.</ui-toast></ui-toaster>`,
        );
        const element = toast(host);

        await dismissed(element);

        expect(element.isConnected).toBe(false);
    });

    it('never runs at all when the page asks for no clock', async () => {
        const host = await mount(
            '<ui-toaster><ui-toast duration="0">Saved.</ui-toast></ui-toaster>',
        );

        await wait(settled);

        expect(toast(host).isConnected).toBe(true);
    });

    it('never runs on an error, whatever duration the page wrote', async () => {
        // The variant decides this rather than a second attribute beside it: an error is
        // the message a reader has to keep, and a knob that could say otherwise is a knob
        // that will.
        const host = await mount(
            `<ui-toaster><ui-toast variant="danger" duration="${String(brief)}">Failed.</ui-toast></ui-toaster>`,
        );

        await wait(settled);

        expect(toast(host).isConnected).toBe(true);
    });

    it('stops while the pointer is over the toast, and starts again when it leaves', async () => {
        const host = await mount(
            `<ui-toaster><ui-toast duration="${String(patient)}">Saved.</ui-toast></ui-toaster>`,
        );
        const element = toast(host);

        // **Settled before the pointer is sent**, and that ordering is the whole of #177:
        // `hover` waits for the element to be stable and the entrance is an animation, so a
        // driver sent at a still-animating toast waits — and on a slow machine the dwell it
        // was racing ran out underneath it. Measured at a 10x CPU throttle, verbatim:
        // `element is not stable, retrying hover action`, then `element was detached from
        // the DOM`. {@link patient} carries what that costs and why it is now what it is.
        await still(element);

        // The real pointer, through the driver, because this is the one place the suite's
        // own shortcut cannot go: `Input.dispatchMouseEvent` takes coordinates in the top
        // page and the suite runs in a frame, so a point near the block-end corner — which
        // is exactly where a toaster is — lands outside the window. Measured, on a plain
        // fixed box as well as on a toast, so it is the coordinates rather than the top
        // layer. `parkPointer` is unaffected: it aims at the near corner.
        await userEvent.hover(element);
        await wait(patient + settled);

        expect(element.isConnected, 'held while it is being read').toBe(true);

        // Cut short before the reader leaves, because the dwell is only long for the half
        // above: `duration` is read where the clock STARTS, and a held toast starts none, so
        // this is what the resume picks up. Waiting {@link patient} out twice would put the
        // test over the runner's timeout.
        element.duration = brief;

        const announced = dismissed(element);
        await parkPointer();
        await announced;

        expect(element.isConnected).toBe(false);
    });

    it('stops while the focus is inside it, and starts again when it leaves', async () => {
        const host = await mount(
            `<ui-toaster><ui-toast duration="${String(patient)}">Saved.</ui-toast></ui-toaster>`,
        );
        const element = toast(host);

        dismisser(element).focus();
        await wait(patient + settled);

        expect(element.isConnected, 'held while it has the focus').toBe(true);

        // As above, and only for the timeout: `focus()` lands in this frame, so this twin
        // never raced the dwell and needs no `still()` — it just cannot afford to wait the
        // long one out twice either.
        element.duration = brief;

        const announced = dismissed(element);
        dismisser(element).blur();
        await announced;

        expect(element.isConnected).toBe(false);
    });

    it('keeps one clock however often it is restarted', async () => {
        // Two `pointerleave`s in a row must not leave two timers running: the second one
        // outlives the disconnect below and fires on a toast that is no longer anywhere.
        const host = await mount(
            `<ui-toaster><ui-toast duration="${String(brief)}">Saved.</ui-toast></ui-toaster>`,
        );
        const element = toast(host);
        let announced = 0;

        element.addEventListener('ui-dismiss', () => {
            announced += 1;
        });

        element.dispatchEvent(new PointerEvent('pointerleave'));
        element.dispatchEvent(new PointerEvent('pointerleave'));
        element.remove();

        await wait(settled);

        expect(announced).toBe(0);
    });

    it('takes its listeners off when it leaves, so a removed toast hears nothing', async () => {
        // One `abort()` rather than five `removeEventListener` calls, and this is the half
        // that reports: a leaked `pointerleave` reaches the resume, which starts a clock on
        // a toast that is no longer anywhere and then dismisses it from outside the tree.
        const host = await mount(
            `<ui-toaster><ui-toast duration="${String(brief)}">Saved.</ui-toast></ui-toaster>`,
        );
        const element = toast(host);
        let announced = 0;

        element.addEventListener('ui-dismiss', () => {
            announced += 1;
        });

        element.remove();
        element.dispatchEvent(new PointerEvent('pointerleave'));

        await wait(settled);

        expect(announced).toBe(0);
    });

    it('stops when the toast is taken off the page by something else', async () => {
        const host = await mount(
            `<ui-toaster><ui-toast duration="${String(brief)}">Saved.</ui-toast></ui-toaster>`,
        );
        const element = toast(host);
        let announced = 0;

        element.addEventListener('ui-dismiss', () => {
            announced += 1;
        });

        element.remove();
        await wait(settled);

        expect(announced).toBe(0);
    });

    it('starts again for a toast a framework moved in the tree', async () => {
        const host = await mount(
            `<ui-toaster><ui-toast duration="${String(brief)}">Saved.</ui-toast></ui-toaster>`,
        );
        const element = toast(host);

        element.remove();
        toaster(host).append(element);

        await dismissed(element);

        expect(element.isConnected).toBe(false);
    });
});

describe('toast stories', () => {
    it.each([
        ['Toast', Toast],
        ['Outcomes', Outcomes],
        ['Timed', Timed],
        ['Long', Long],
    ] as const)('renders %s accessibly', async (name, story) => {
        await expectAccessible(await mountStory(story, meta, name));
    });

    it('shows the four outcomes in the two regions they belong to', async () => {
        const container = await mountStory(Outcomes, meta, 'Outcomes');
        const routed = [...container.querySelectorAll('ui-toast')].map((element) => element.slot);

        expect(routed).toEqual(['polite', 'polite', 'polite', 'assertive']);
    });
});

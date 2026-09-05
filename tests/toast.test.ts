import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
// The playwright provider is what puts `send` on `CDPSession` — see `button.test.ts`,
// which needs the same line for the same reason.
import type {} from '@vitest/browser-playwright';
import { expectAccessible } from './a11y.js';
import { mountStory } from './stories.js';
import meta, { Long, Outcomes, Timed, Toast } from '../stories/toast.stories.js';
import '../src/toast.js';
import { reference } from '../src/reference.js';
import type { DerivedToken, Token } from '../src/tokens.js';
import type { UiToast, UiToaster } from '../src/toast.js';

/** The markup the behavioural tests use, unless one needs a different shape. */
const fixture = `
    <ui-toaster>
        <ui-toast>Your changes have been saved.</ui-toast>
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
 */
const patient = 1000;

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
    const found = element.shadowRoot?.querySelector('svg') ?? null;

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
                `<ui-toaster><ui-toast variant="${variant}">x</ui-toast></ui-toaster>`,
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

describe('the edge, which agrees with the message rather than replacing it', () => {
    it.each([
        ['info', '--ui-color-accent'],
        ['success', '--ui-color-success'],
        ['warning', '--ui-color-warning'],
        ['danger', '--ui-color-danger'],
    ] as const)('paints a %s toast from %s', async (variant, token) => {
        const host = await mount(
            `<ui-toaster><ui-toast variant="${variant}">Done.</ui-toast></ui-toaster>`,
        );

        expect(getComputedStyle(toast(host)).borderInlineStartColor).toBe(resolved(token));
    });

    it('tells the four apart, so the table above is not four names for one colour', async () => {
        const painted = new Set<string>();

        for (const variant of ['info', 'success', 'warning', 'danger'] as const) {
            const host = await mount(
                `<ui-toaster><ui-toast variant="${variant}">Done.</ui-toast></ui-toaster>`,
            );

            painted.add(getComputedStyle(toast(host)).borderInlineStartColor);
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
        element.style.setProperty('--ui-color-border', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-color-surface', 'rgb(4, 5, 6)');
        element.style.setProperty('--ui-color-text', 'rgb(7, 8, 9)');
        element.style.setProperty('--ui-font', 'Courier');
        element.style.setProperty('--ui-elevation-raised', 'rgb(1, 2, 3) 0px 4px 8px 0px');

        const styles = getComputedStyle(element);

        expect(styles.columnGap).toBe('10px');
        expect(styles.padding).toBe('10px 15px');
        expect(styles.borderTopColor).toBe('rgb(1, 2, 3)');
        expect(styles.borderInlineStartWidth).toBe('5px');
        expect(styles.borderRadius).toBe('11px');
        expect(styles.backgroundColor).toBe('rgb(4, 5, 6)');
        expect(styles.color).toBe('rgb(7, 8, 9)');
        expect(styles.fontFamily).toBe('Courier');
        expect(styles.boxShadow).toBe('rgb(1, 2, 3) 0px 4px 8px 0px');
    });

    it('declares the text colour with the surface, never half the pair', async () => {
        // A surface declared without the colour chosen against it inherits whatever the
        // page set, and the contrast the token layer measured stops holding at the one
        // place it was measured for.
        const host = await mount(`<div style="color: rgb(1, 2, 3)">${fixture}</div>`);

        expect(getComputedStyle(toast(host)).color).toBe('rgb(31, 41, 55)');
    });

    it('takes the entrance from the host', async () => {
        const host = await mount(fixture);
        const element = toast(host);

        element.style.setProperty('--ui-duration-state', '0.4s');
        element.style.setProperty('--ui-easing-enter', 'linear');

        const styles = getComputedStyle(element);

        expect(styles.transitionProperty).toBe('opacity, translate');
        expect(styles.transitionDuration).toBe('0.4s, 0.4s');
        expect(styles.transitionTimingFunction).toBe('linear, linear');
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
        // The destination rather than the interpolation: a value read partway through the
        // exit is whatever the curve had reached, which is a different question.
        element.style.setProperty('--ui-duration-state', '0s');
        element.classList.add('closing');

        const styles = getComputedStyle(element);

        expect(styles.translate).toBe('0px 20px');
        expect(styles.opacity).toBe('0');
        // One value rather than the pair the resting rule declares: the exit names the
        // timing function alone, and one function covers both properties in the list.
        expect(styles.transitionTimingFunction).toBe('linear');
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

    it('exposes the four parts a host restyles through', async () => {
        const host = await mount(fixture);

        expect(region(toaster(host), 'polite').getAttribute('part')).toBe('polite');
        expect(region(toaster(host), 'assertive').getAttribute('part')).toBe('assertive');
        expect(
            toast(host).shadowRoot?.querySelector('[part=message]')?.textContent,
        ).not.toBeUndefined();
        expect(dismisser(toast(host)).getAttribute('part')).toBe('dismiss');
    });
});

describe('the dismiss button, which every toast has', () => {
    it('carries a name, because an icon-only control has nothing else to be called', async () => {
        const host = await mount(fixture);

        expect(dismisser(toast(host)).getAttribute('aria-label')).toBe('Dismiss');
    });

    it('takes the name a page that is not in English writes', async () => {
        const host = await mount(
            '<ui-toaster><ui-toast dismiss-label="Fechar">Salvo.</ui-toast></ui-toaster>',
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

        expect(element.classList.contains('closing')).toBe(true);
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

        // The real pointer, through the driver, because this is the one place the suite's
        // own shortcut cannot go: `Input.dispatchMouseEvent` takes coordinates in the top
        // page and the suite runs in a frame, so a point near the block-end corner — which
        // is exactly where a toaster is — lands outside the window. Measured, on a plain
        // fixed box as well as on a toast, so it is the coordinates rather than the top
        // layer. `parkPointer` is unaffected: it aims at the near corner.
        await userEvent.hover(element);
        await wait(patient + settled);

        expect(element.isConnected, 'held while it is being read').toBe(true);

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

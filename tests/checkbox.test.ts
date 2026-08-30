import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
// The playwright provider is what puts `send` on `CDPSession` — see `button.test.ts`,
// which needs the same line for the same reason.
import type {} from '@vitest/browser-playwright';
import { expectAccessible } from './a11y.js';
import { mountStory } from './stories.js';
import meta, { Checkbox, Inline, Invalid, States, Switch } from '../stories/checkbox.stories.js';
import '../src/checkbox.js';
import '../src/field.js';
import type { UiCheckbox, UiSwitch } from '../src/checkbox.js';

/** The markup the behavioural tests use, unless one needs a different shape. */
const fixture = `
    <ui-field>
        <label slot="label">Send a receipt</label>
        <ui-checkbox><input type="checkbox" name="receipt" /></ui-checkbox>
    </ui-field>
`;

/** Mounts a fixture inside a form and waits for the wiring to settle. */
async function mount(markup: string): Promise<HTMLFormElement> {
    const form = document.createElement('form');
    form.innerHTML = markup;
    document.body.append(form);

    for (const element of form.querySelectorAll('ui-field, ui-checkbox, ui-switch')) {
        await (element as UiCheckbox).updateComplete;
    }

    // `ui-field` associates from a MutationObserver, which lands on a microtask.
    await new Promise((resolve) => {
        setTimeout(resolve, 0);
    });

    return form;
}

/** The wrapper, which is the component under test. */
function wrapper(form: HTMLFormElement): UiCheckbox | UiSwitch {
    // The tag map resolves a single tag name, not a list, so the union is named here.
    const element = form.querySelector<UiCheckbox | UiSwitch>('ui-checkbox, ui-switch');

    if (element === null) {
        throw new Error('no wrapper in the fixture');
    }

    return element;
}

/** The control the host wrote, which is the thing the wrapper is about. */
function control(form: HTMLFormElement): HTMLInputElement {
    const element = form.querySelector('input');

    if (element === null) {
        throw new Error('no control in the fixture');
    }

    return element;
}

/**
 * Takes the motion out, flushed, so that a colour read is the destination rather than
 * whichever frame of a 150ms interpolation the read landed on.
 *
 * The duration is the host's own knob, and flushing between setting it and changing the
 * colour is not optional: both in one recalculation and the transition starts under the
 * duration that was in force before it.
 */
function withoutMotion(form: HTMLFormElement): void {
    wrapper(form).style.setProperty('--ui-duration-state', '0s');

    // Every declared transition, not the first: these sheets transition two properties and
    // the switch's three, so a check on the whole string would be a check on how many.
    const durations = getComputedStyle(control(form)).transitionDuration.split(', ');

    expect(new Set(durations), 'the motion is out').toEqual(new Set(['0s']));
}

/**
 * Waits out whatever is transitioning on the control.
 *
 * `withoutMotion` is the cheaper answer and only works when the test schedules the change
 * itself. Where the change lands during mount — `ui-field` writing `aria-invalid` from a
 * MutationObserver, say — the transition is already in flight before any test code runs,
 * and changing the duration then does not retract a running one.
 */
async function settled(element: Element): Promise<void> {
    await Promise.allSettled(element.getAnimations().map((animation) => animation.finished));
}

/** The component's own stylesheet, as text, for the rules no rendering can show. */
function styleText(tag: string): string {
    return String((customElements.get(tag) as unknown as { styles: unknown }).styles);
}

/**
 * Moves the pointer out of the way, because nothing in the page can.
 *
 * The pointer keeps its position across tests *and across files*, and a control left under
 * it is a control matching `:hover` before its test has done anything — so a rule about
 * the *resting* boundary reads the hover colour on its way in. `input.test.ts` measured
 * that within one file; this file measured the other half, as a test that passed alone,
 * passed in the file, and failed in the full run: `button.test.ts` sorts immediately
 * before it and its own teardown leaves the pointer wherever the last press landed.
 *
 * So it runs **before** each test as well as after. After alone protects the next test in
 * this file and nothing else, which is exactly the gap that showed up.
 */
async function parkPointer(): Promise<void> {
    await cdp().send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: window.innerWidth - 1,
        y: window.innerHeight - 1,
        buttons: 0,
    });
}

beforeEach(parkPointer);

afterEach(async () => {
    await parkPointer();

    document.body.replaceChildren();
});

describe('ui-checkbox', () => {
    it('registers both elements', () => {
        expect(customElements.get('ui-checkbox')).toBeDefined();
        expect(customElements.get('ui-switch')).toBeDefined();
    });

    it('leaves the control in the light DOM, where a label can reach it', async () => {
        const form = await mount(fixture);

        expect(control(form).parentElement).toBe(wrapper(form));
        expect(wrapper(form).shadowRoot?.querySelector('input')).toBeNull();
    });

    it('lets the control reach a submit, because it never stopped being one', async () => {
        const form = await mount(fixture);
        control(form).checked = true;

        expect([...new FormData(form).entries()]).toEqual([['receipt', 'on']]);
    });

    it('is labelled by the field around it, through the wrapper', async () => {
        const form = await mount(fixture);
        const label = form.querySelector('label');

        expect(label?.htmlFor).toBe(control(form).id);
        expect(control(form).labels?.[0]).toBe(label);
    });

    it('hugs the control rather than filling the line', async () => {
        // Outside a field on purpose: `ui-field` lays its slots out with flex, and a flex
        // item's display is blockified — `inline-flex` computes to `flex` in there, which
        // is the platform being right rather than this rule being ignored.
        const form = await mount('<ui-checkbox><input type="checkbox" /></ui-checkbox>');

        expect(getComputedStyle(wrapper(form)).display).toBe('inline-flex');
    });

    it('drops the margin the user agent puts around a checkbox', async () => {
        const form = await mount(fixture);

        expect(getComputedStyle(control(form)).margin).toBe('0px');
    });

    it('draws at the target-size floor, and holds it against a smaller space token', async () => {
        const form = await mount(fixture);

        // WCAG 2.2 2.5.8 asks 24x24 of a target the author sized, which this one is.
        expect(getComputedStyle(control(form)).blockSize).toBe('24px');
        expect(getComputedStyle(control(form)).inlineSize).toBe('24px');

        wrapper(form).style.setProperty('--ui-space', '4px');

        expect(getComputedStyle(control(form)).blockSize, 'the floor holds').toBe('24px');
    });

    it('grows with the space token above the floor', async () => {
        const form = await mount(fixture);
        wrapper(form).style.setProperty('--ui-space', '16px');

        expect(getComputedStyle(control(form)).blockSize).toBe('48px');
    });

    it('rests on the surface, inside the boundary the rest of the kit uses', async () => {
        const form = await mount(fixture);
        const styles = getComputedStyle(control(form));

        expect(styles.appearance).toBe('none');
        expect(styles.backgroundColor).toBe('rgb(255, 255, 255)');
        expect(styles.borderTopWidth).toBe('1px');
        expect(styles.borderTopStyle).toBe('solid');
        expect(styles.borderRadius).toBe('6px');
        expect(styles.cursor).toBe('pointer');
    });

    it('fills with the accent when checked', async () => {
        const form = await mount(fixture);
        withoutMotion(form);
        control(form).checked = true;

        const styles = getComputedStyle(control(form));

        expect(styles.backgroundColor).toBe('rgb(37, 99, 235)');
        expect(styles.borderTopColor).toBe('rgb(37, 99, 235)');
    });

    it('marks the fill by subtracting the tick from it, rather than painting one on', async () => {
        const form = await mount(fixture);
        control(form).checked = true;

        const styles = getComputedStyle(control(form));

        // Two layers and `exclude` is the whole mechanism: the mark is the hole, so its
        // colour is whatever the control sits on and no colour is frozen in the data URI.
        expect(styles.maskComposite).toBe('exclude, exclude');
        expect(styles.maskImage).toContain('linear-gradient');
        expect(styles.maskImage).toContain('svg');
        expect(styles.maskRepeat).toBe('no-repeat, no-repeat');
        expect(styles.maskSize).toBe('100% 100%, 100% 100%');
    });

    it('draws a dash for the mixed state the platform stopped drawing', async () => {
        const form = await mount(fixture);
        withoutMotion(form);
        control(form).indeterminate = true;

        const styles = getComputedStyle(control(form));

        expect(styles.backgroundColor, 'filled, like checked').toBe('rgb(37, 99, 235)');
        expect(styles.borderTopColor, 'boundary included').toBe('rgb(37, 99, 235)');
        expect(styles.maskComposite).toBe('exclude, exclude');
        expect(styles.maskImage, 'a rectangle needs no picture').not.toContain('svg');
        expect(styles.maskSize, 'a bar across the middle').toBe('100% 100%, 12px 2px');
        expect(styles.maskPosition).toBe('50% 50%, 50% 50%');
    });

    it('takes the boundary from the host', async () => {
        const form = await mount(fixture);
        // The boundary is transitioned, so a read taken straight after the change returns
        // the first frame of a 150ms interpolation — which is the *resting* colour, and
        // reads exactly like the override having been ignored. Measured: with the duration
        // held at 5s the immediate read is the resting `color-mix()`, every time.
        withoutMotion(form);
        wrapper(form).style.setProperty('--ui-color-border', 'rgb(1, 2, 3)');

        expect(getComputedStyle(control(form)).borderTopColor).toBe('rgb(1, 2, 3)');
    });

    it('reads the error from the control, never from a second source', async () => {
        const form = await mount(`
            <ui-field>
                <label slot="label">I accept the terms</label>
                <ui-checkbox><input type="checkbox" required /></ui-checkbox>
                <span slot="error">The terms have to be accepted.</span>
            </ui-field>
        `);

        expect(control(form).getAttribute('aria-invalid'), 'ui-field wired it').toBe('true');

        // `ui-field` sets the attribute from its observer, during mount, so the boundary is
        // already transitioning by the time this test runs and there is no earlier moment
        // to take the motion out at. Waited out rather than pre-empted.
        await settled(control(form));

        expect(getComputedStyle(control(form)).borderTopColor).toBe('rgb(185, 28, 28)');
    });

    it('refuses a pointer it will do nothing with', async () => {
        const form = await mount(`
            <ui-field>
                <label slot="label">Send a receipt</label>
                <ui-checkbox><input type="checkbox" disabled /></ui-checkbox>
            </ui-field>
        `);
        const styles = getComputedStyle(control(form));

        expect(styles.cursor).toBe('not-allowed');
        expect(styles.opacity).toBe('0.5');
    });

    it('keeps a visible focus ring — removing it is how a component stops being usable', () => {
        expect(styleText('ui-checkbox')).toContain('focus-visible');
        expect(styleText('ui-checkbox')).toContain('outline:');
        expect(styleText('ui-checkbox')).toContain('outline-offset:');
    });

    it('takes the focus ring colour from the host', async () => {
        // Tabbed to rather than focused by script: `:focus-visible` is what carries the
        // ring, and it matches on a keyboard interaction rather than on a `focus()` call.
        const form = await mount(fixture);
        wrapper(form).style.setProperty('--ui-color-focus', 'rgb(1, 2, 3)');

        await userEvent.tab();

        expect(document.activeElement, 'tab reached the control').toBe(control(form));
        expect(getComputedStyle(control(form)).outlineColor).toBe('rgb(1, 2, 3)');
    });
});

describe('ui-switch', () => {
    const fixture = `
        <ui-field>
            <label slot="label">Email notifications</label>
            <ui-switch><input type="checkbox" name="notify" /></ui-switch>
        </ui-field>
    `;

    it('announces itself as a switch, so the host cannot forget to', async () => {
        const form = await mount(fixture);

        expect(control(form).getAttribute('role')).toBe('switch');
    });

    it('never overwrites a role the host wrote', async () => {
        const form = await mount(`
            <ui-field>
                <label slot="label">Email notifications</label>
                <ui-switch><input type="checkbox" role="checkbox" /></ui-switch>
            </ui-field>
        `);

        expect(control(form).getAttribute('role')).toBe('checkbox');
    });

    it('announces a control the host swapped in later, not only the first', async () => {
        const form = await mount(fixture);
        const replacement = document.createElement('input');
        replacement.type = 'checkbox';

        control(form).replaceWith(replacement);
        await wrapper(form).updateComplete;
        // `slotchange` is queued as a microtask against the slot, not against the render.
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(replacement.getAttribute('role')).toBe('switch');
    });

    it('says nothing about a control the host took away', async () => {
        // An empty `<ui-switch>` does not reach this: `slotchange` fires when the assigned
        // nodes *change*, and a slot that starts empty never changed — measured, as a test
        // that passed with the guard removed. Taking the control away is the change that
        // reaches it, and then the guard is the only thing between a lifecycle callback and
        // an attribute read on nothing, which throws where no assertion would see it.
        const thrown: string[] = [];
        const capture = (event: ErrorEvent): void => {
            thrown.push(event.message);
        };
        const form = await mount(fixture);

        window.addEventListener('error', capture);

        try {
            control(form).remove();
            await new Promise((resolve) => {
                setTimeout(resolve, 0);
            });
        } finally {
            window.removeEventListener('error', capture);
        }

        expect(thrown, 'an emptied slot is not an error').toEqual([]);
    });

    it('leaves a checkbox alone — it already announces what it is', async () => {
        const form = await mount(`
            <ui-field>
                <label slot="label">Send a receipt</label>
                <ui-checkbox><input type="checkbox" /></ui-checkbox>
            </ui-field>
        `);

        expect(control(form).hasAttribute('role')).toBe(false);
    });

    it('is a pill wider than it is tall, and takes its track from the boundary token', async () => {
        const form = await mount(fixture);
        const styles = getComputedStyle(control(form));

        expect(styles.blockSize).toBe('24px');
        expect(styles.inlineSize).toBe('40px');
        expect(styles.borderRadius, 'at half the height or more, the ends are round').toBe('24px');
        // Compared against the checkbox's boundary rather than to a literal: the token is
        // derived, so its value is a `color-mix()` that computes in oklab, and asserting
        // the number would assert the mix rather than that both read the same name.
        const checkbox = await mount('<ui-checkbox><input type="checkbox" /></ui-checkbox>');

        expect(styles.backgroundColor, 'the 3:1 boundary, as a fill').toBe(
            getComputedStyle(control(checkbox)).borderTopColor,
        );
        // One flat track: the border is the same colour, so the pill has no ring around it
        // that the checkbox's boundary would otherwise leave behind.
        expect(styles.borderTopColor).toBe(styles.backgroundColor);
    });

    it('carries the thumb as a layer, because an element could not be told it is on', async () => {
        const form = await mount(fixture);
        const styles = getComputedStyle(control(form));

        expect(styles.backgroundImage).toContain('radial-gradient');
        expect(styles.backgroundSize).toBe('16px');
        expect(styles.backgroundRepeat, 'one thumb, not a row of them').toBe('no-repeat');
    });

    it('slides the thumb across on the way to on', async () => {
        const form = await mount(fixture);
        withoutMotion(form);

        const off = getComputedStyle(control(form)).backgroundPosition;

        expect(off).toBe('4px 50%');

        control(form).checked = true;

        expect(getComputedStyle(control(form)).backgroundPosition).not.toBe(off);
    });

    it('moves the thumb over the state duration, along with the colours', async () => {
        const form = await mount(fixture);
        const styles = getComputedStyle(control(form));

        expect(styles.transitionProperty).toBe(
            'background-color, border-color, background-position',
        );
        expect(styles.transitionDuration).toBe('0.15s, 0.15s, 0.15s');
    });

    it('draws no mixed state, because a switch has no third value', async () => {
        const form = await mount(fixture);
        const off = getComputedStyle(control(form)).maskImage;

        control(form).indeterminate = true;

        // Read rather than asserted against the stylesheet's text: the shared sheet does
        // name `:indeterminate`, in the forced-colors block, so a check for the word would
        // pass whatever the drawing did.
        expect(getComputedStyle(control(form)).maskImage).toBe(off);
    });
});

/**
 * A component that accepts interaction and shows no feedback is defective. Nothing here
 * restates a colour: the question a hover asks is *did it move*.
 */
describe('the interaction states', () => {
    it('answers a pointer while unchecked, on the boundary', async () => {
        const form = await mount(fixture);
        withoutMotion(form);

        const resting = getComputedStyle(control(form)).borderColor;

        await userEvent.hover(control(form));

        expect(getComputedStyle(control(form)).borderColor).not.toBe(resting);
    });

    it('answers a pointer while checked, on the fill', async () => {
        const form = await mount(fixture);
        withoutMotion(form);
        control(form).checked = true;

        const resting = getComputedStyle(control(form)).backgroundColor;

        await userEvent.hover(control(form));

        const hovered = getComputedStyle(control(form));

        expect(hovered.backgroundColor).not.toBe(resting);
        // The boundary moves with the fill rather than being left at the resting accent,
        // which would draw a ring around a control that is only being pointed at.
        expect(hovered.borderTopColor).toBe(hovered.backgroundColor);
    });

    it('ignores a pointer while disabled', async () => {
        const form = await mount(`
            <ui-field>
                <label slot="label">Send a receipt</label>
                <ui-checkbox><input type="checkbox" disabled /></ui-checkbox>
            </ui-field>
        `);
        withoutMotion(form);

        const resting = getComputedStyle(control(form)).borderColor;

        await userEvent.hover(control(form));

        expect(getComputedStyle(control(form)).borderColor).toBe(resting);
    });

    it('moves the boundary and the fill over the state duration, and nothing else', async () => {
        const form = await mount(fixture);
        const styles = getComputedStyle(control(form));

        expect(styles.transitionProperty).toBe('background-color, border-color');
        expect(styles.transitionDuration).toBe('0.15s, 0.15s');
    });

    it('guards every interaction rule against the state that refuses it', () => {
        // Structural, and it reaches the rules a later control might add: a disabled
        // control still matches :hover. The nested `:not(...)` is why this is not
        // `[^)]*` — that stops at the first closing parenthesis, which is inside the
        // guard it is meant to be checking for.
        const rules = [
            ...styleText('ui-checkbox').matchAll(
                /::slotted\([a-z]+[^)]*:hover(?:[^()]|\([^()]*\))*\)/g,
            ),
        ];

        expect(rules.length, 'there are hover rules to check').toBeGreaterThan(0);

        for (const [rule] of rules) {
            expect(rule, rule).toContain(':not(:disabled)');
        }
    });
});

/**
 * Forced colors replaces every author colour, so a state told apart by colour alone stops
 * being told apart — for the people who turned the mode on to see states more clearly.
 */
describe('under forced colors', () => {
    async function forcedColors(active: boolean): Promise<void> {
        await cdp().send('Emulation.setEmulatedMedia', {
            features: [{ name: 'forced-colors', value: active ? 'active' : 'none' }],
        });
    }

    afterEach(async () => {
        await forcedColors(false);
    });

    it('keeps checked and unchecked apart', async () => {
        const form = await mount(fixture);
        withoutMotion(form);
        await forcedColors(true);

        expect(matchMedia('(forced-colors: active)').matches, 'the mode is on').toBe(true);

        const resting = getComputedStyle(control(form)).backgroundColor;

        control(form).checked = true;

        expect(getComputedStyle(control(form)).backgroundColor).not.toBe(resting);
    });

    it('says unavailable with a colour rather than a veil, which is not forced', async () => {
        const form = await mount(`
            <ui-field>
                <label slot="label">Send a receipt</label>
                <ui-checkbox><input type="checkbox" disabled /></ui-checkbox>
            </ui-field>
        `);
        await forcedColors(true);

        expect(getComputedStyle(control(form)).opacity).toBe('1');
    });
});

/**
 * The stories are the playground, and mounting them here is what puts it behind the gate.
 * `expectAccessible` is called per state rather than once, because a checked control, a
 * mixed one and a disabled one are different markup and each can fail on its own.
 */
describe('accessibility', () => {
    it('has no violations as a labelled checkbox', async () => {
        await expectAccessible(await mountStory(Checkbox, meta, 'Checkbox'));
    });

    it('has no violations as a switch, with the role it sets itself', async () => {
        await expectAccessible(await mountStory(Switch, meta, 'Switch'));
    });

    it('has no violations in any drawn state, mixed and disabled included', async () => {
        await expectAccessible(await mountStory(States, meta, 'States'));
    });

    it('has no violations in error', async () => {
        await expectAccessible(await mountStory(Invalid, meta, 'Invalid'));
    });

    it('has no violations labelled by a wrapping label, with no field at all', async () => {
        await expectAccessible(await mountStory(Inline, meta, 'Inline'));
    });
});

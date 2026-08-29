import { afterEach, describe, expect, it } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
// The playwright provider is what puts `send` on `CDPSession` — see `button.test.ts`,
// which needs the same line for the same reason.
import type {} from '@vitest/browser-playwright';
import { expectAccessible } from './a11y.js';
import { mountStory } from './stories.js';
import meta, { Disabled, Invalid, Multiline, Standalone, Text } from '../stories/input.stories.js';
import '../src/input.js';
import '../src/field.js';
import type { UiInput, UiTextarea } from '../src/input.js';

/** The markup the behavioural tests use, unless one needs a different shape. */
const fixture = `
    <ui-field>
        <label slot="label">Amount</label>
        <ui-input><input type="text" name="amount" placeholder="0,00" /></ui-input>
        <span slot="help">In BRL, two decimals.</span>
    </ui-field>
`;

/** Mounts a fixture inside a form and waits for the wiring to settle. */
async function mount(markup: string): Promise<HTMLFormElement> {
    const form = document.createElement('form');
    form.innerHTML = markup;
    document.body.append(form);

    for (const element of form.querySelectorAll('ui-field, ui-input, ui-textarea')) {
        await (element as UiInput).updateComplete;
    }

    // `ui-field` associates from a MutationObserver, which lands on a microtask.
    await new Promise((resolve) => {
        setTimeout(resolve, 0);
    });

    return form;
}

/** The wrapper, which is the component under test. */
function wrapper(form: HTMLFormElement): UiInput | UiTextarea {
    // The tag map resolves a single tag name, not a list, so the union is named here.
    const element = form.querySelector<UiInput | UiTextarea>('ui-input, ui-textarea');

    if (element === null) {
        throw new Error('no wrapper in the fixture');
    }

    return element;
}

/** The control the host wrote, which is the thing the wrapper is about. */
function control(form: HTMLFormElement): HTMLInputElement | HTMLTextAreaElement {
    const element = form.querySelector('input, textarea');

    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
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

    expect(getComputedStyle(control(form)).transitionDuration, 'the motion is out').toBe('0s');
}

/** The component's own stylesheet, as text, for the rules no rendering can show. */
function styleText(tag: string): string {
    return String((customElements.get(tag) as unknown as { styles: unknown }).styles);
}

afterEach(async () => {
    // The pointer keeps its position across tests, and a control left under it is a
    // control matching `:hover` before its test has done anything — so a rule about the
    // *resting* boundary reads the hover colour on its way in, and only when some earlier
    // test happened to leave the mouse there. Measured, as a test that passed alone and
    // failed in the file. Nothing in the page can move the pointer, which is why this
    // reaches for CDP the way `button.test.ts` does for `:active`.
    await cdp().send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: window.innerWidth - 1,
        y: window.innerHeight - 1,
        buttons: 0,
    });

    document.body.replaceChildren();
});

describe('ui-input', () => {
    it('registers both elements', () => {
        expect(customElements.get('ui-input')).toBeDefined();
        expect(customElements.get('ui-textarea')).toBeDefined();
    });

    it('leaves the control in the light DOM, which is the whole shape of the component', async () => {
        // The load-bearing assertion in this file. The same control rendered into the
        // shadow root is an axe `label` violation at critical impact and an
        // `aria-describedby` that dangles — measured, and the reason the host writes the
        // element rather than the component synthesising one.
        const form = await mount(fixture);

        expect(control(form).parentElement, 'the control is a light-DOM child').toBe(wrapper(form));
        expect(wrapper(form).shadowRoot?.querySelector('input'), 'and not in the shadow root').toBe(
            null,
        );
    });

    it('reaches a form submit with no value mirroring at all', async () => {
        // The open question on the issue, answered by the shape rather than by
        // `ElementInternals`: a native control inside a form participates because it is a
        // native control inside a form.
        const form = await mount(fixture);
        control(form).value = '42';

        expect(new FormData(form).get('amount')).toBe('42');
    });

    it('takes the wiring ui-field writes, through the wrapper', async () => {
        const form = await mount(fixture);
        const label = form.querySelector('label');

        expect(control(form).id, 'the field gave the control an id').toMatch(/\S/);
        expect(label?.htmlFor, 'and the label points at the control, not the wrapper').toBe(
            control(form).id,
        );
        expect(control(form).getAttribute('aria-describedby')).toMatch(/\S/);
    });

    it('is labelled, which is what the wrapper could have broken', async () => {
        const form = await mount(fixture);

        expect(control(form).labels?.length).toBe(1);
    });

    it('carries the error state the field decided, rather than deciding one', async () => {
        const form = await mount(`
            <ui-field>
                <label slot="label">Amount</label>
                <ui-input><input type="text" name="amount" /></ui-input>
                <span slot="error">Amount is required.</span>
            </ui-field>
        `);

        expect(control(form).getAttribute('aria-invalid')).toBe('true');
        expect(getComputedStyle(control(form)).borderColor, 'and the box reads it').toBe(
            'rgb(185, 28, 28)',
        );
    });

    it('has no accessibility violations inside a field', async () => {
        await expectAccessible(await mount(fixture));
    });

    it('has no accessibility violations in error', async () => {
        const form = await mount(`
            <ui-field>
                <label slot="label">Amount</label>
                <ui-input><input type="text" name="amount" /></ui-input>
                <span slot="error">Amount is required.</span>
            </ui-field>
        `);

        await expectAccessible(form);
    });

    it('has no accessibility violations standing on its own', async () => {
        await expectAccessible(
            await mount(`<ui-input><input type="search" aria-label="Search" /></ui-input>`),
        );
    });

    it('keeps a visible focus ring — removing it is how a component stops being usable', () => {
        expect(styleText('ui-input')).toContain('focus-visible');
        expect(styleText('ui-input')).toContain('outline:');
    });
});

describe('ui-textarea', () => {
    const multiline = `
        <ui-field>
            <label slot="label">Notes</label>
            <ui-textarea><textarea name="notes"></textarea></ui-textarea>
        </ui-field>
    `;

    it('styles a textarea the same way, and adds the two rules that differ', async () => {
        const form = await mount(multiline);
        const styles = getComputedStyle(control(form));

        expect(styles.resize, 'grows down, never sideways').toBe('vertical');
        expect(Number.parseFloat(styles.minBlockSize), 'starts with room to write').toBeGreaterThan(
            0,
        );
    });

    it('takes the shared box, so the two controls cannot drift apart', async () => {
        const form = await mount(multiline);

        expect(getComputedStyle(control(form)).borderRadius).toBe('6px');
    });

    it('reaches a form submit too', async () => {
        const form = await mount(multiline);
        control(form).value = 'a note';

        expect(new FormData(form).get('notes')).toBe('a note');
    });

    it('has no accessibility violations', async () => {
        await expectAccessible(await mount(multiline));
    });
});

/**
 * *Every visual decision is a token* is a promise a component can quietly stop keeping.
 *
 * The assertion is the host's own act: declare the property above the component and read
 * what it rendered. A hardcoded value fails it, and so does a reference that stopped being
 * one — an invalid `var()` drops the whole declaration.
 */
describe('every visual decision a control paints is a token', () => {
    it('takes its shape, its surface and its type from the host', async () => {
        const form = await mount(fixture);
        wrapper(form).style.setProperty('--ui-font', 'monospace');
        wrapper(form).style.setProperty('--ui-radius', '11px');
        wrapper(form).style.setProperty('--ui-space', '7px');
        wrapper(form).style.setProperty('--ui-color-surface', 'rgb(1, 2, 3)');
        wrapper(form).style.setProperty('--ui-color-text', 'rgb(4, 5, 6)');

        const styles = getComputedStyle(control(form));

        expect(styles.fontFamily, '--ui-font').toBe('monospace');
        expect(styles.borderRadius, '--ui-radius').toBe('11px');
        expect(styles.paddingTop, '--ui-space').toBe('7px');
        expect(styles.backgroundColor, '--ui-color-surface').toBe('rgb(1, 2, 3)');
        expect(styles.color, '--ui-color-text').toBe('rgb(4, 5, 6)');
    });

    it('takes the boundary from the host', async () => {
        const form = await mount(fixture);

        withoutMotion(form);
        wrapper(form).style.setProperty('--ui-color-border', 'rgb(1, 2, 3)');

        expect(getComputedStyle(control(form)).borderColor).toBe('rgb(1, 2, 3)');
    });

    it('takes the placeholder colour from the host, at full opacity', async () => {
        // The colour clears 4.5:1 against the surface, and a browser that dims a
        // placeholder by default would take it back under — so the opacity is part of the
        // floor rather than a stylistic preference.
        const form = await mount(fixture);
        wrapper(form).style.setProperty('--ui-color-text-muted', 'rgb(1, 2, 3)');

        const styles = getComputedStyle(control(form), '::placeholder');

        expect(styles.color, '--ui-color-text-muted').toBe('rgb(1, 2, 3)');
        expect(styles.opacity, 'not dimmed under the floor it was chosen for').toBe('1');
    });

    it('takes the focus ring colour from the host', async () => {
        const form = await mount(fixture);
        wrapper(form).style.setProperty('--ui-color-focus', 'rgb(1, 2, 3)');

        await userEvent.tab();

        expect(document.activeElement, 'tab reached the control').toBe(control(form));
        expect(getComputedStyle(control(form)).outlineColor).toBe('rgb(1, 2, 3)');
    });
});

/**
 * A component that accepts interaction and shows no feedback is defective. Nothing here
 * restates a colour: the question a hover asks is *did it move*.
 */
describe('the interaction states', () => {
    it('answers a pointer', async () => {
        const form = await mount(fixture);
        withoutMotion(form);

        const resting = getComputedStyle(control(form)).borderColor;

        await userEvent.hover(control(form));

        expect(getComputedStyle(control(form)).borderColor).not.toBe(resting);
    });

    it('ignores a pointer while disabled', async () => {
        const form = await mount(`
            <ui-field>
                <label slot="label">Amount</label>
                <ui-input><input type="text" disabled /></ui-input>
            </ui-field>
        `);
        withoutMotion(form);

        const resting = getComputedStyle(control(form)).borderColor;

        await userEvent.hover(control(form));

        expect(getComputedStyle(control(form)).borderColor).toBe(resting);
    });

    it('ignores a pointer while readonly, which accepts focus and refuses edits', async () => {
        const form = await mount(`
            <ui-field>
                <label slot="label">Reference</label>
                <ui-input><input type="text" value="INV-1" readonly /></ui-input>
            </ui-field>
        `);
        withoutMotion(form);

        const resting = getComputedStyle(control(form)).borderColor;

        await userEvent.hover(control(form));

        expect(getComputedStyle(control(form)).borderColor).toBe(resting);
    });

    it('moves the boundary over the state duration, and moves nothing else', async () => {
        const form = await mount(fixture);
        const styles = getComputedStyle(control(form));

        expect(styles.transitionProperty).toBe('border-color');
        expect(styles.transitionDuration).toBe('0.15s');
    });

    it('guards every interaction rule against the states that refuse it', () => {
        // Structural, and it reaches the rules a later control might add: a disabled input
        // still matches :hover, and a readonly one takes a pointer it will do nothing with.
        // The nested `:not(...)` is why this is not `[^)]*`: that stops at the first
        // closing parenthesis, which is inside the guard it is meant to be checking for.
        const rules = [
            ...styleText('ui-input').matchAll(/::slotted\([a-z]+:hover(?:[^()]|\([^()]*\))*\)/g),
        ];

        for (const [rule] of rules) {
            expect(rule, rule).toContain(':not(:disabled)');
            expect(rule, rule).toContain(':not([readonly])');
        }

        expect(rules.length, 'and there are some to guard').toBeGreaterThan(0);
    });
});

/**
 * The playground's gate. A story that stops compiling or stops rendering fails here rather
 * than on the deploy, which runs after the required check.
 */
describe('ui-input stories', () => {
    it.each([
        ['Text', Text],
        ['Multiline', Multiline],
        ['Invalid', Invalid],
        ['Disabled', Disabled],
        ['Standalone', Standalone],
    ] as const)('%s renders a real control and meets the bar', async (name, story) => {
        const container = await mountStory(story, meta, name);

        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(container.querySelector('input, textarea')).not.toBe(null);
        await expectAccessible(container);
    });
});

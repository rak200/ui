import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
// The playwright provider is what puts `send` on `CDPSession` — see `button.test.ts`,
// which needs the same line for the same reason.
import type {} from '@vitest/browser-playwright';
import { expectAccessible } from './a11y.js';
import { mountStory } from './stories.js';
import meta, {
    BesideAnInput,
    Disabled,
    Invalid,
    Multiple,
    RightToLeft,
    Select,
} from '../stories/select.stories.js';
import '../src/select.js';
import '../src/input.js';
import '../src/field.js';
import type { UiSelect } from '../src/select.js';

/** The markup the behavioural tests use, unless one needs a different shape. */
const fixture = `
    <ui-field>
        <label slot="label">Currency</label>
        <ui-select>
            <select name="currency">
                <option value="brl">Real</option>
                <option value="usd">Dollar</option>
            </select>
        </ui-select>
    </ui-field>
`;

/** Mounts a fixture inside a form and waits for the wiring to settle. */
async function mount(markup: string): Promise<HTMLFormElement> {
    const form = document.createElement('form');
    form.innerHTML = markup;
    document.body.append(form);

    for (const element of form.querySelectorAll('ui-field, ui-select, ui-input')) {
        await (element as UiSelect).updateComplete;
    }

    // `ui-field` associates from a MutationObserver, which lands on a microtask.
    await new Promise((resolve) => {
        setTimeout(resolve, 0);
    });

    return form;
}

/** The wrapper, which is the component under test. */
function wrapper(form: HTMLFormElement): UiSelect {
    const element = form.querySelector('ui-select');

    if (element === null) {
        throw new Error('no wrapper in the fixture');
    }

    return element;
}

/** The control the host wrote, which is the thing the wrapper is about. */
function control(form: HTMLFormElement): HTMLSelectElement {
    const element = form.querySelector('select');

    if (element === null) {
        throw new Error('no control in the fixture');
    }

    return element;
}

/**
 * Takes the motion out, flushed, so that a colour read is the destination rather than
 * whichever frame of a 150ms interpolation the read landed on.
 *
 * The flush is not optional and is not decoration: setting the duration and changing the
 * colour in one recalculation starts the transition under the duration that was in force
 * before it. `tests/checkbox.test.ts` shipped a read without this and it reached master as
 * a flake that passed one CI run and failed the next.
 */
function withoutMotion(form: HTMLFormElement): void {
    wrapper(form).style.setProperty('--ui-duration-state', '0s');

    expect(getComputedStyle(control(form)).transitionDuration, 'the motion is out').toBe('0s');
}

/** Waits out whatever is transitioning, for a change this file does not get to schedule. */
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
 * Before as well as after: the pointer keeps its position across files, so a control left
 * under it matches `:hover` before its test has done anything.
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

describe('ui-select', () => {
    it('registers itself as a custom element', () => {
        expect(customElements.get('ui-select')).toBeDefined();
    });

    it('leaves the control in the light DOM, where a label can reach it', async () => {
        const form = await mount(fixture);

        expect(control(form).parentElement).toBe(wrapper(form));
        expect(wrapper(form).shadowRoot?.querySelector('select')).toBeNull();
    });

    it('lets the control reach a submit, because it never stopped being one', async () => {
        const form = await mount(fixture);
        control(form).value = 'usd';

        expect([...new FormData(form).entries()]).toEqual([['currency', 'usd']]);
    });

    it('is labelled by the field around it, through the wrapper', async () => {
        // The promise `ui-field` has been making since it shipped: its `#control()` looks
        // for `input, textarea, select` inside the wrapper, and until this component
        // existed the third name in that list was a claim nothing exercised.
        const form = await mount(fixture);
        const label = form.querySelector('label');

        expect(label?.htmlFor).toBe(control(form).id);
        expect(control(form).labels[0]).toBe(label);
    });

    it('takes the platform drawing off, which is what makes the box possible', async () => {
        const form = await mount(fixture);

        expect(getComputedStyle(control(form)).appearance).toBe('none');
    });

    it('opens as a pointer rather than a caret', async () => {
        const form = await mount(fixture);

        expect(getComputedStyle(control(form)).cursor).toBe('pointer');
    });

    it('fills the line it is given', async () => {
        const form = await mount(fixture);

        expect(getComputedStyle(wrapper(form)).display).toBe('block');
        expect(getComputedStyle(control(form)).inlineSize).toBe(
            getComputedStyle(wrapper(form)).inlineSize,
        );
    });

    it('reads the error from the control, never from a second source', async () => {
        const form = await mount(`
            <ui-field>
                <label slot="label">Currency</label>
                <ui-select><select required><option value="">Choose</option></select></ui-select>
                <span slot="error">A currency is required.</span>
            </ui-field>
        `);

        expect(control(form).getAttribute('aria-invalid'), 'ui-field wired it').toBe('true');

        // `ui-field` sets the attribute from its observer, during mount, so the boundary is
        // already transitioning by the time this runs and there is no earlier moment to
        // take the motion out at.
        await settled(control(form));

        expect(getComputedStyle(control(form)).borderTopColor).toBe('rgb(185, 28, 28)');
    });

    it('takes the boundary from the host', async () => {
        const form = await mount(fixture);
        withoutMotion(form);
        wrapper(form).style.setProperty('--ui-color-border', 'rgb(1, 2, 3)');

        expect(getComputedStyle(control(form)).borderTopColor).toBe('rgb(1, 2, 3)');
    });

    it('refuses a pointer it will do nothing with', async () => {
        const form = await mount(`
            <ui-field>
                <label slot="label">Currency</label>
                <ui-select><select disabled><option>Real</option></select></ui-select>
            </ui-field>
        `);
        const styles = getComputedStyle(control(form));

        expect(styles.cursor).toBe('not-allowed');
        expect(styles.opacity).toBe('0.5');
    });

    it('keeps a visible focus ring — removing it is how a component stops being usable', () => {
        expect(styleText('ui-select')).toContain('focus-visible');
        expect(styleText('ui-select')).toContain('outline:');
        expect(styleText('ui-select')).toContain('outline-offset:');
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

    it('carries no readonly guard, because a select has no readonly', () => {
        // Measured rather than asserted from memory, and the reason the hover rule here is
        // one guard shorter than `ui-input`'s rather than an oversight.
        expect('readOnly' in document.createElement('select')).toBe(false);

        // Read off the selectors rather than the sheet's text: the comment beside that
        // rule says the word `readonly` out loud, so a search over the whole stylesheet
        // finds the explanation and calls it a guard. It did.
        const selectors = [
            ...styleText('ui-select').matchAll(/::slotted\((?:[^()]|\([^()]*\))*\)/g),
        ];

        expect(selectors.length, 'there are rules to check').toBeGreaterThan(0);

        for (const [selector] of selectors) {
            expect(selector, selector).not.toContain('readonly');
        }
    });
});

/**
 * The box is written twice — here and in `src/input.ts` — and this is what answers the
 * objection that file records against duplicating it: *two copies of a contract with
 * nothing comparing them*. Something compares them.
 */
describe('the box, against the input it has to match', () => {
    async function bothControls(): Promise<{ select: HTMLSelectElement; input: HTMLInputElement }> {
        const form = await mount(`
            <ui-select><select><option>Real</option></select></ui-select>
            <ui-input><input type="text" /></ui-input>
        `);
        const input = form.querySelector('input');

        if (input === null) {
            throw new Error('no input in the fixture');
        }

        return { select: control(form), input };
    }

    it('agrees on the boundary, the corner, the padding and the type', async () => {
        const { select, input } = await bothControls();
        const drawn = (element: Element): Record<string, string> => {
            const styles = getComputedStyle(element);

            return {
                borderTopColor: styles.borderTopColor,
                borderTopWidth: styles.borderTopWidth,
                borderTopStyle: styles.borderTopStyle,
                borderRadius: styles.borderRadius,
                paddingTop: styles.paddingTop,
                paddingLeft: styles.paddingLeft,
                backgroundColor: styles.backgroundColor,
                color: styles.color,
                fontFamily: styles.fontFamily,
                fontSize: styles.fontSize,
                boxSizing: styles.boxSizing,
                transitionProperty: styles.transitionProperty,
                transitionDuration: styles.transitionDuration,
            };
        };

        expect(drawn(select)).toEqual(drawn(input));
    });

    it('agrees on the focus ring', async () => {
        const { select, input } = await bothControls();
        const ring = (element: Element): string => {
            const styles = getComputedStyle(element);

            return `${styles.outlineWidth} ${styles.outlineStyle} ${styles.outlineOffset}`;
        };

        // Read one at a time, and tabbed to rather than focused by script: the ring is
        // carried by `:focus-visible`, so a control that is not currently focused reports
        // the user agent's default and two of those compare equal while proving nothing.
        await userEvent.tab();

        expect(document.activeElement, 'tab reached the select').toBe(select);

        const selectRing = ring(select);

        await userEvent.tab();

        expect(document.activeElement, 'tab reached the input').toBe(input);

        expect(selectRing).toBe(ring(input));
        expect(selectRing, 'a ring, not the absence of one').toContain('solid');
    });

    it('parts company only on the two rules it declares it does', async () => {
        const { select, input } = await bothControls();

        // The caret needs room the input has no use for, and a select opens something.
        expect(getComputedStyle(select).paddingRight).not.toBe(
            getComputedStyle(input).paddingRight,
        );
        expect(getComputedStyle(select).cursor).not.toBe(getComputedStyle(input).cursor);
    });
});

/**
 * The caret is the one thing this component draws, so it is the one thing a rendering has
 * to be read for rather than a stylesheet.
 */
describe('the caret', () => {
    it('is drawn from gradients, so its colour stays a token', async () => {
        const form = await mount(fixture);
        const styles = getComputedStyle(control(form));

        expect(styles.backgroundImage.split('linear-gradient').length - 1, 'two arms').toBe(2);
        expect(styles.backgroundRepeat, 'one caret, not a row of them').toBe(
            'no-repeat, no-repeat',
        );
        expect(styles.backgroundImage, 'no frozen picture').not.toContain('url(');
    });

    it('takes its colour from the muted token', async () => {
        const form = await mount(fixture);
        wrapper(form).style.setProperty('--ui-color-text-muted', 'rgb(1, 2, 3)');

        expect(getComputedStyle(control(form)).backgroundImage).toContain('rgb(1, 2, 3)');
    });

    it('keeps clear of the text, by the room it actually takes', async () => {
        const form = await mount(fixture);
        const styles = getComputedStyle(control(form));
        const clearance = Number.parseFloat(styles.paddingRight);
        const arm = Number.parseFloat(styles.backgroundSize);

        // The caret ends one space from the edge and is two arms wide, so the padding has
        // to clear that. Asserted as the relationship rather than as 28px, which would be
        // a fact about the default space token instead of about the rule.
        expect(clearance).toBeGreaterThan(arm * 2);
    });

    it('sets the caret one space in, with the arms side by side', async () => {
        // Asserted as the relationship rather than as pixels: the space token is the
        // host's knob, so a literal here would be a fact about the default rather than
        // about the rule. Retuned to a value nothing else in the sheet rounds to.
        const form = await mount(fixture);
        wrapper(form).style.setProperty('--ui-space', '20px');

        const styles = getComputedStyle(control(form));
        const arm = Number.parseFloat(styles.backgroundSize);
        const [far, near] = [
            ...styles.backgroundPosition.matchAll(/calc\(100% - ([\d.]+)px\)/g),
        ].map(([, offset]) => Number.parseFloat(offset ?? ''));

        if (far === undefined || near === undefined) {
            throw new Error(
                `the caret is not measured from the trailing edge: ${styles.backgroundPosition}`,
            );
        }

        expect(near, 'the near arm sits one space in').toBe(20);
        expect(far - near, 'the far arm sits one arm beyond it').toBe(arm);
    });

    it('follows the control to the other side under rtl', async () => {
        const form = await mount(fixture);
        const ltr = getComputedStyle(control(form)).backgroundPosition;

        control(form).setAttribute('dir', 'rtl');

        const rtl = getComputedStyle(control(form)).backgroundPosition;

        expect(rtl).not.toBe(ltr);
        // Anchored to the near edge rather than measured off the far one, which is what
        // `left` resolves to and `calc(100% - …)` would not.
        expect(rtl.startsWith('calc('), `rtl was ${rtl}`).toBe(false);
    });

    it('is not drawn on a list, where it would point at nothing', async () => {
        const form = await mount(`
            <ui-field>
                <label slot="label">Tags</label>
                <ui-select>
                    <select multiple size="3"><option>Urgent</option></select>
                </ui-select>
            </ui-field>
        `);

        expect(getComputedStyle(control(form)).backgroundImage).toBe('none');
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
                <label slot="label">Currency</label>
                <ui-select><select disabled><option>Real</option></select></ui-select>
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

    it('guards every interaction rule against the state that refuses it', () => {
        const rules = [
            ...styleText('ui-select').matchAll(
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
 * The stories are the playground, and mounting them here is what puts it behind the gate.
 * `expectAccessible` is called per state rather than once, because a disabled control, an
 * error and a list are different markup and each can fail on its own.
 */
describe('accessibility', () => {
    it('has no violations as a labelled drop-down', async () => {
        await expectAccessible(await mountStory(Select, meta, 'Select'));
    });

    it('has no violations beside a text field', async () => {
        await expectAccessible(await mountStory(BesideAnInput, meta, 'BesideAnInput'));
    });

    it('has no violations in error', async () => {
        await expectAccessible(await mountStory(Invalid, meta, 'Invalid'));
    });

    it('has no violations while disabled', async () => {
        await expectAccessible(await mountStory(Disabled, meta, 'Disabled'));
    });

    it('has no violations as a list', async () => {
        await expectAccessible(await mountStory(Multiple, meta, 'Multiple'));
    });

    it('has no violations right to left', async () => {
        await expectAccessible(await mountStory(RightToLeft, meta, 'RightToLeft'));
    });
});

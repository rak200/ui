import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
// The playwright provider is what puts `send` on `CDPSession` — see `button.test.ts`,
// which needs the same line for the same reason.
import type {} from '@vitest/browser-playwright';
import { expectAccessible } from './a11y.js';
import { mountStory } from './stories.js';
import meta, {
    Horizontal,
    Invalid,
    RadioGroup,
    Standalone,
    States,
} from '../stories/radio.stories.js';
import '../src/radio.js';
import '../src/checkbox.js';
import '../src/field.js';
import type { UiRadioGroup } from '../src/radio.js';

/** One option, in the shape a consumer writes: a label wrapping the drawn control. */
function option(value: string, extra = ''): string {
    return `
        <label>
            <ui-radio><input type="radio" name="plan" value="${value}" ${extra} /></ui-radio>
            ${value}
        </label>
    `;
}

/** The markup the behavioural tests use, unless one needs a different shape. */
const fixture = `
    <ui-field>
        <label slot="label">Plan</label>
        <ui-radio-group>${option('free')}${option('pro')}${option('max')}</ui-radio-group>
    </ui-field>
`;

/** Mounts a fixture inside a form and waits for the wiring to settle. */
async function mount(markup: string): Promise<HTMLFormElement> {
    const form = document.createElement('form');
    form.innerHTML = markup;
    document.body.append(form);

    for (const element of form.querySelectorAll(
        'ui-field, ui-radio-group, ui-radio, ui-checkbox',
    )) {
        await (element as UiRadioGroup).updateComplete;
    }

    // `ui-field` associates from a MutationObserver, which lands on a microtask.
    await new Promise((resolve) => {
        setTimeout(resolve, 0);
    });

    return form;
}

/** The group, which is the element a field names and describes. */
function group(form: HTMLFormElement): UiRadioGroup {
    const element = form.querySelector('ui-radio-group');

    if (element === null) {
        throw new Error('no group in the fixture');
    }

    return element;
}

/** The controls the host wrote, which are what the drawing is about. */
function radios(form: HTMLFormElement): HTMLInputElement[] {
    return [...form.querySelectorAll<HTMLInputElement>('input[type=radio]')];
}

/** The one element a selector has to match, so a fixture typo fails where it happened. */
function only(form: HTMLFormElement, selector: string): HTMLElement {
    const found = form.querySelector<HTMLElement>(selector);

    if (found === null) {
        throw new Error(`no ${selector} in the fixture`);
    }

    return found;
}

/** The first of them, which most drawing assertions are taken on. */
function radio(form: HTMLFormElement): HTMLInputElement {
    const [first] = radios(form);

    if (first === undefined) {
        throw new Error('no control in the fixture');
    }

    return first;
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
    for (const element of form.querySelectorAll('ui-radio')) {
        (element as HTMLElement).style.setProperty('--ui-duration-state', '0s');
    }

    // Every declared transition, not the first: this sheet transitions two properties, so
    // a check on the whole string would be a check on how many.
    const durations = getComputedStyle(radio(form)).transitionDuration.split(', ');

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
 * The same stylesheet with its comments taken out.
 *
 * A rule about which selectors a sheet does *not* use has to read the sheet rather than
 * the prose around it — and the prose here names every selector that was rejected, so a
 * check on the raw text would find them and pass or fail on a comment.
 */
function ruleText(tag: string): string {
    return styleText(tag).replaceAll(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Moves the pointer out of the way, because nothing in the page can.
 *
 * The pointer keeps its position across tests *and across files*, and a control left under
 * it is a control matching `:hover` before its test has done anything — so a rule about
 * the *resting* boundary reads the hover colour on its way in. `checkbox.test.ts` carries
 * the measurement; this file inherits the fix rather than rediscovering it.
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

describe('ui-radio-group', () => {
    it('registers both elements', () => {
        expect(customElements.get('ui-radio')).toBeDefined();
        expect(customElements.get('ui-radio-group')).toBeDefined();
    });

    it('leaves every control in the light DOM, where a label can reach it', async () => {
        const form = await mount(fixture);

        for (const control of radios(form)) {
            expect(control.closest('ui-radio')?.shadowRoot?.querySelector('input')).toBeNull();
            expect(control.closest('label')).not.toBeNull();
            expect(control.labels?.length, 'the wrapping label labels it').toBe(1);
        }
    });

    it('marks itself a group, so a screen reader has a set rather than three controls', async () => {
        const form = await mount(fixture);

        expect(group(form).getAttribute('role')).toBe('radiogroup');
    });

    it('never overwrites a role the host wrote', async () => {
        const form = await mount(
            `<ui-radio-group role="presentation">${option('free')}</ui-radio-group>`,
        );

        expect(group(form).getAttribute('role')).toBe('presentation');
    });

    it('announces the orientation it draws, so the two cannot disagree', async () => {
        const form = await mount(fixture);

        expect(group(form).getAttribute('aria-orientation')).toBe('vertical');

        group(form).setAttribute('orientation', 'horizontal');
        await group(form).updateComplete;

        expect(group(form).getAttribute('aria-orientation')).toBe('horizontal');
    });

    it('lays out from the property too, not only from the attribute', async () => {
        // The reflection is what makes the two the same knob. Without it a host setting
        // the property in script would get the announcement and not the row: the rule that
        // draws it selects on the attribute, which is the only half a selector can read.
        const form = await mount(fixture);
        group(form).orientation = 'horizontal';
        await group(form).updateComplete;

        expect(group(form).getAttribute('orientation'), 'reflected back out').toBe('horizontal');
        expect(getComputedStyle(group(form)).flexDirection, 'so the rule matches').toBe('row');
        expect(group(form).getAttribute('aria-orientation')).toBe('horizontal');
    });
});

/**
 * The claim this component is made of: the APG radio group pattern is the platform's, and
 * nothing here installs it. Measured rather than trusted — the wrappers are the reason to
 * measure, since a group is defined by name and tree, and each control now sits inside a
 * custom element.
 */
describe('the behaviour, which the platform already had', () => {
    it('writes no tabindex anywhere, because the roving one is not ours', async () => {
        const form = await mount(fixture);

        for (const control of radios(form)) {
            expect(control.hasAttribute('tabindex'), control.value).toBe(false);
        }

        expect(group(form).hasAttribute('tabindex')).toBe(false);
    });

    it('is one tab stop, not one per option', async () => {
        const form = await mount(`${fixture}<input type="text" name="after" />`);

        await userEvent.tab();

        expect(document.activeElement, 'the first option takes the focus').toBe(radio(form));

        await userEvent.tab();

        expect(
            (document.activeElement as HTMLInputElement).name,
            'and the next tab leaves the set entirely',
        ).toBe('after');
    });

    it('enters at the selected option rather than at the first', async () => {
        const form = await mount(`
            <ui-radio-group>${option('free')}${option('pro', 'checked')}</ui-radio-group>
        `);

        await userEvent.tab();

        expect(document.activeElement).toBe(radios(form)[1]);
    });

    it('moves and selects with the arrow keys, and wraps at the end', async () => {
        const form = await mount(fixture);
        const [free, pro, max] = radios(form);

        await userEvent.tab();
        await userEvent.keyboard('{ArrowDown}');

        expect(document.activeElement, 'focus moved').toBe(pro);
        expect(pro?.checked, 'and selection moved with it').toBe(true);

        await userEvent.keyboard('{ArrowDown}');

        expect(document.activeElement).toBe(max);

        await userEvent.keyboard('{ArrowDown}');

        expect(document.activeElement, 'the set wraps').toBe(free);
        expect(free?.checked).toBe(true);
    });

    it('submits one value for the set, because they never stopped being native', async () => {
        const form = await mount(fixture);

        await userEvent.tab();
        await userEvent.keyboard('{ArrowDown}');

        expect([...new FormData(form).entries()]).toEqual([['plan', 'pro']]);
    });
});

/**
 * What a `<label for>` could not have done. The group is not a labelable element, so the
 * field names it by reference — and it names the *group*, never the first radio, which
 * would name one option and leave the set anonymous.
 */
describe('inside a field', () => {
    it('names the group rather than an option', async () => {
        const form = await mount(fixture);
        const label = form.querySelector('label[slot=label]');

        expect(label?.id, 'the label got an id to point at').toMatch(/\S/);
        expect(group(form).getAttribute('aria-labelledby')).toBe(label?.id);
        expect(label?.hasAttribute('for'), 'and no for, which would label nothing').toBe(false);
        expect(
            radio(form).getAttribute('aria-labelledby'),
            'the options keep their own',
        ).toBeNull();
    });

    it('keeps an id the host gave the label, which something unseen may reference', async () => {
        const form = await mount(`
            <ui-field>
                <label slot="label" id="chosen">Plan</label>
                <ui-radio-group>${option('free')}</ui-radio-group>
            </ui-field>
        `);

        expect(group(form).getAttribute('aria-labelledby')).toBe('chosen');
    });

    it('drops the name when the label goes away, rather than dangling at nothing', async () => {
        const form = await mount(fixture);

        form.querySelector('label[slot=label]')?.remove();
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(group(form).hasAttribute('aria-labelledby')).toBe(false);
    });

    it('describes and invalidates the group, not one radio inside it', async () => {
        const form = await mount(`
            <ui-field>
                <label slot="label">Plan</label>
                <ui-radio-group>${option('free')}${option('pro')}</ui-radio-group>
                <span slot="help">You can change this later.</span>
                <span slot="error">Pick a plan to continue.</span>
            </ui-field>
        `);

        expect(group(form).getAttribute('aria-describedby')).toMatch(/\S/);
        expect(group(form).getAttribute('aria-invalid')).toBe('true');
        expect(radio(form).hasAttribute('aria-describedby')).toBe(false);
        expect(radio(form).hasAttribute('aria-invalid')).toBe(false);
    });
});

describe('the drawing', () => {
    it('stacks the options, spaced by the space token', async () => {
        const form = await mount(fixture);
        const styles = getComputedStyle(group(form));

        expect(styles.display).toBe('flex');
        expect(styles.flexDirection).toBe('column');
        expect(styles.rowGap).toBe('4px');
    });

    it('lays out in a row when asked, wrapping rather than overflowing', async () => {
        const form = await mount(fixture);
        group(form).setAttribute('orientation', 'horizontal');
        await group(form).updateComplete;

        const styles = getComputedStyle(group(form));

        expect(styles.flexDirection).toBe('row');
        expect(styles.flexWrap).toBe('wrap');
        expect(styles.columnGap, 'more air between options than between rows').toBe('16px');
    });

    it('hugs the control rather than filling the line', async () => {
        const form = await mount(`<ui-radio><input type="radio" /></ui-radio>`);

        expect(getComputedStyle(only(form, 'ui-radio')).display).toBe('inline-flex');
    });

    it('drops the margin the user agent puts around a radio', async () => {
        const form = await mount(fixture);

        expect(getComputedStyle(radio(form)).margin).toBe('0px');
    });

    it('draws at the target-size floor, and holds it against a smaller space token', async () => {
        const form = await mount(fixture);

        // WCAG 2.2 2.5.8 asks 24x24 of a target the author sized, which this one is: a
        // native radio is 13x13 in this engine and escapes the criterion only through its
        // user agent control exception, which `appearance: none` gives up.
        expect(getComputedStyle(radio(form)).blockSize).toBe('24px');
        expect(getComputedStyle(radio(form)).inlineSize).toBe('24px');

        group(form).style.setProperty('--ui-space', '4px');

        expect(getComputedStyle(radio(form)).blockSize, 'the floor holds').toBe('24px');
    });

    it('grows with the space token above the floor', async () => {
        const form = await mount(fixture);
        group(form).style.setProperty('--ui-space', '16px');

        expect(getComputedStyle(radio(form)).blockSize).toBe('48px');
    });

    it('is a circle, which is what tells it from a checkbox before it is read', async () => {
        const form = await mount(fixture);

        expect(getComputedStyle(radio(form)).borderRadius).toBe('50%');
    });

    it('fills with the accent when selected', async () => {
        const form = await mount(fixture);
        withoutMotion(form);
        radio(form).checked = true;

        const styles = getComputedStyle(radio(form));

        expect(styles.backgroundColor).toBe('rgb(37, 99, 235)');
        expect(styles.borderTopColor).toBe('rgb(37, 99, 235)');
    });

    it('marks the fill by subtracting the dot from it, rather than painting one on', async () => {
        const form = await mount(fixture);
        radio(form).checked = true;

        const styles = getComputedStyle(radio(form));

        // Two layers and `exclude` is the whole mechanism: the mark is the hole, so its
        // colour is whatever the control sits on and no colour is frozen anywhere.
        expect(styles.maskComposite).toBe('exclude, exclude');
        expect(styles.maskImage).toContain('linear-gradient');
        expect(styles.maskImage, 'a circle needs no picture').toContain('radial-gradient');
        expect(styles.maskImage).not.toContain('svg');
        expect(styles.maskPosition).toBe('50% 50%, 50% 50%');
        expect(styles.maskRepeat).toBe('no-repeat, no-repeat');
    });

    it('takes the boundary from the host', async () => {
        const form = await mount(fixture);
        // The boundary is transitioned, so a read taken straight after the change returns
        // the first frame of the interpolation, which reads exactly like the override
        // having been ignored.
        withoutMotion(form);
        group(form).style.setProperty('--ui-color-border', 'rgb(1, 2, 3)');

        expect(getComputedStyle(radio(form)).borderTopColor).toBe('rgb(1, 2, 3)');
    });

    it('keeps a visible focus ring — removing it is how a component stops being usable', () => {
        expect(styleText('ui-radio')).toContain('focus-visible');
        expect(styleText('ui-radio')).toContain('outline:');
        expect(styleText('ui-radio')).toContain('outline-offset:');
    });

    it('takes the focus ring colour from the host', async () => {
        // Tabbed to rather than focused by script: `:focus-visible` is what carries the
        // ring, and it matches on a keyboard interaction rather than on a `focus()` call.
        const form = await mount(fixture);
        group(form).style.setProperty('--ui-color-focus', 'rgb(1, 2, 3)');

        await userEvent.tab();

        expect(document.activeElement, 'tab reached the control').toBe(radio(form));
        expect(getComputedStyle(radio(form)).outlineColor).toBe('rgb(1, 2, 3)');
    });

    it('refuses a pointer it will do nothing with', async () => {
        const form = await mount(`
            <ui-radio-group>${option('free', 'disabled')}</ui-radio-group>
        `);
        const styles = getComputedStyle(radio(form));

        expect(styles.cursor).toBe('not-allowed');
        expect(styles.opacity).toBe('0.5');
    });
});

/**
 * The box, against the checkbox it has to match.
 *
 * `src/radio.ts` writes the drawing out rather than sharing `src/checkbox.ts`'s, for the
 * reason `src/select.ts` gives about `src/input.ts` — and this is the mechanism that
 * answers the duplication objection on its own terms. Something compares them, and it
 * fails when they drift.
 */
describe('the control, against the checkbox it has to match', () => {
    it('agrees on the size, the boundary, the fill and the cursor', async () => {
        const form = await mount(`
            ${fixture}
            <ui-checkbox><input type="checkbox" /></ui-checkbox>
        `);
        const drawn = getComputedStyle(radio(form));
        const checkbox = getComputedStyle(only(form, 'input[type=checkbox]'));

        for (const property of [
            'appearance',
            'inlineSize',
            'blockSize',
            'backgroundColor',
            'borderTopWidth',
            'borderTopStyle',
            'borderTopColor',
            'cursor',
            'transitionProperty',
            'transitionDuration',
        ] as const) {
            expect(drawn[property], property).toBe(checkbox[property]);
        }
    });

    it('agrees on the accent it fills with, and on the focus ring', async () => {
        const form = await mount(`
            ${fixture}
            <ui-checkbox><input type="checkbox" checked /></ui-checkbox>
        `);
        radio(form).checked = true;
        await settled(radio(form));

        const drawn = getComputedStyle(radio(form));
        const checkbox = getComputedStyle(only(form, 'input[type=checkbox]'));

        expect(drawn.backgroundColor).toBe(checkbox.backgroundColor);
        expect(drawn.outlineColor).toBe(checkbox.outlineColor);
    });

    it('differs on the shape, and only on the shape', async () => {
        const form = await mount(`
            ${fixture}
            <ui-checkbox><input type="checkbox" /></ui-checkbox>
        `);

        expect(getComputedStyle(radio(form)).borderRadius).not.toBe(
            getComputedStyle(only(form, 'input[type=checkbox]')).borderRadius,
        );
    });
});

/**
 * A component that accepts interaction and shows no feedback is defective. Nothing here
 * restates a colour: the question a hover asks is *did it move*.
 */
describe('the interaction states', () => {
    it('answers a pointer while unselected, on the boundary', async () => {
        const form = await mount(fixture);
        withoutMotion(form);

        const resting = getComputedStyle(radio(form)).borderColor;

        await userEvent.hover(radio(form));

        expect(getComputedStyle(radio(form)).borderColor).not.toBe(resting);
    });

    it('answers a pointer while selected, on the fill', async () => {
        const form = await mount(fixture);
        withoutMotion(form);
        radio(form).checked = true;

        const resting = getComputedStyle(radio(form)).backgroundColor;

        await userEvent.hover(radio(form));

        const hovered = getComputedStyle(radio(form));

        expect(hovered.backgroundColor).not.toBe(resting);
        // The boundary moves with the fill rather than being left at the resting accent,
        // which would draw a ring around a control that is only being pointed at.
        expect(hovered.borderTopColor).toBe(hovered.backgroundColor);
    });

    it('ignores a pointer while disabled', async () => {
        const form = await mount(`
            <ui-radio-group>${option('free', 'disabled')}</ui-radio-group>
        `);
        withoutMotion(form);

        const resting = getComputedStyle(radio(form)).borderColor;

        await userEvent.hover(radio(form));

        expect(getComputedStyle(radio(form)).borderColor).toBe(resting);
    });

    it('moves the boundary and the fill over the state duration, and nothing else', async () => {
        const form = await mount(fixture);
        const styles = getComputedStyle(radio(form));

        expect(styles.transitionProperty).toBe('background-color, border-color');
        expect(styles.transitionDuration).toBe('0.15s, 0.15s');
    });

    it('guards every interaction rule against the state that refuses it', () => {
        // Structural, and it reaches the rules a later state might add: a disabled control
        // still matches :hover. The nested `:not(...)` is why this is not `[^)]*` — that
        // stops at the first closing parenthesis, which is inside the guard it is meant to
        // be checking for.
        const rules = [
            ...styleText('ui-radio').matchAll(
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
 * The error belongs to the set, not to an option — what a radio group gets wrong is the
 * choice. The group paints it by retargeting the boundary token over its own subtree,
 * which is the only thing that reaches a control two elements down: `::slotted()` stops at
 * the group's own children, `:host-context()` is not cross-engine, and
 * `:host(:has(...))` is invalid in this engine.
 */
describe('in error', () => {
    it('paints every option from the one source the field already wrote', async () => {
        const form = await mount(`
            <ui-field>
                <label slot="label">Plan</label>
                <ui-radio-group>${option('free')}${option('pro')}</ui-radio-group>
                <span slot="error">Pick a plan to continue.</span>
            </ui-field>
        `);

        expect(group(form).getAttribute('aria-invalid'), 'ui-field wired it').toBe('true');

        // `ui-field` sets the attribute from its observer, during mount, so the boundary is
        // already transitioning by the time this test runs and there is no earlier moment
        // to take the motion out at. Waited out rather than pre-empted.
        for (const control of radios(form)) {
            await settled(control);

            expect(getComputedStyle(control).borderTopColor, control.value).toBe(
                'rgb(185, 28, 28)',
            );
        }
    });

    it('reaches the options through inheritance rather than through a selector', () => {
        // The mechanism, asserted where no rendering can show it: the group names no
        // descendant, it moves the token they already read.
        expect(ruleText('ui-radio-group')).toContain('--ui-color-border:');
        expect(ruleText('ui-radio-group'), 'it names no descendant').not.toContain('::slotted');
        expect(ruleText('ui-radio'), 'and no option reads the state').not.toContain('aria-invalid');
    });

    it('takes the error colour from the host, like every other colour here', async () => {
        const form = await mount(`
            <ui-field>
                <label slot="label">Plan</label>
                <ui-radio-group>${option('free')}</ui-radio-group>
                <span slot="error">Pick a plan to continue.</span>
            </ui-field>
        `);
        group(form).style.setProperty('--ui-color-danger', 'rgb(1, 2, 3)');
        await settled(radio(form));

        expect(getComputedStyle(radio(form)).borderTopColor).toBe('rgb(1, 2, 3)');
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

    it('keeps selected and unselected apart', async () => {
        const form = await mount(fixture);
        withoutMotion(form);
        await forcedColors(true);

        expect(matchMedia('(forced-colors: active)').matches, 'the mode is on').toBe(true);

        const resting = getComputedStyle(radio(form)).backgroundColor;

        radio(form).checked = true;

        expect(getComputedStyle(radio(form)).backgroundColor).not.toBe(resting);
    });

    it('says unavailable with a colour rather than a veil, which is not forced', async () => {
        const form = await mount(`
            <ui-radio-group>${option('free', 'disabled')}</ui-radio-group>
        `);
        await forcedColors(true);

        expect(getComputedStyle(radio(form)).opacity).toBe('1');
    });
});

/**
 * The stories are the playground, and mounting them here is what puts it behind the gate.
 * `expectAccessible` is called per state rather than once, because a horizontal group, a
 * disabled option and a group in error are different markup and each can fail on its own.
 */
describe('accessibility', () => {
    it('has no violations as a labelled group', async () => {
        await expectAccessible(await mountStory(RadioGroup, meta, 'RadioGroup'));
    });

    it('has no violations laid out in a row', async () => {
        await expectAccessible(await mountStory(Horizontal, meta, 'Horizontal'));
    });

    it('has no violations in any drawn state, disabled included', async () => {
        await expectAccessible(await mountStory(States, meta, 'States'));
    });

    it('has no violations in error', async () => {
        await expectAccessible(await mountStory(Invalid, meta, 'Invalid'));
    });

    it('has no violations named by the host, with no field at all', async () => {
        await expectAccessible(await mountStory(Standalone, meta, 'Standalone'));
    });
});

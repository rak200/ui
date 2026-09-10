import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
// The playwright provider is what puts `send` on `CDPSession` — see `button.test.ts`,
// which needs the same line for the same reason.
import type {} from '@vitest/browser-playwright';
import { expectAccessible } from './a11y.js';
import { mountStory } from './stories.js';
import meta, {
    Disabled,
    Horizontal,
    Invalid,
    OneOptionDisabled,
    RadioGroup,
    RightToLeft,
    WithHelp,
} from '../stories/radio.stories.js';
import '../src/radio.js';
import '../src/checkbox.js';
import type { UiRadio, UiRadioGroup } from '../src/radio.js';
import type { UiCheckbox } from '../src/checkbox.js';

/** The markup the behavioural tests use, unless one needs a different shape. */
const fixture = `
    <ui-radio-group label="Plan" name="plan">
        <ui-radio value="free">Free</ui-radio>
        <ui-radio value="pro">Pro</ui-radio>
        <ui-radio value="max">Max</ui-radio>
    </ui-radio-group>
`;

/** Mounts a fixture inside a form and waits for every declaration to settle. */
async function mount(markup: string): Promise<HTMLFormElement> {
    const form = document.createElement('form');
    form.innerHTML = markup;
    document.body.append(form);

    for (const element of form.querySelectorAll('ui-radio, ui-radio-group, ui-checkbox')) {
        await (element as UiRadioGroup).updateComplete;
    }

    // A declaration announces on its own first update, which lands after the group's — so
    // the group renders a second time, on a microtask.
    await new Promise((resolve) => {
        setTimeout(resolve, 0);
    });

    return form;
}

/** The element under test, which is now the set rather than a box around one. */
function group(form: HTMLFormElement): UiRadioGroup {
    const element = form.querySelector('ui-radio-group');

    if (element === null) {
        throw new Error('no group in the fixture');
    }

    return element;
}

/** The rendered controls, which is what every drawing assertion is about. */
function controls(form: HTMLFormElement): HTMLInputElement[] {
    return [...group(form).renderRoot.querySelectorAll('input')];
}

/** The first rendered control, for the assertions that need only one. */
function radio(form: HTMLFormElement): HTMLInputElement {
    const [first] = controls(form);

    if (first === undefined) {
        throw new Error('the group rendered no control');
    }

    return first;
}

/** One declaration the host wrote, which is what the controls are built from. */
function choice(form: HTMLFormElement, value: string): UiRadio {
    const found = group(form).querySelector<UiRadio>(`ui-radio[value='${value}']`);

    if (found === null) {
        throw new Error(`no choice named ${value}`);
    }

    return found;
}

/** The label the group rendered around a control, which contains it rather than points. */
function labelOf(control: HTMLInputElement): HTMLLabelElement {
    const [label] = control.labels ?? [];

    if (label === undefined) {
        throw new Error(`the control for ${control.value} has no label`);
    }

    return label;
}

/** One of the exposed parts, which is how a host reaches anything in here. */
function part(element: UiRadioGroup, name: string): HTMLElement {
    const found = element.renderRoot.querySelector<HTMLElement>(`[part='${name}']`);

    if (found === null) {
        throw new Error(`no part named ${name}`);
    }

    return found;
}

/** The checkbox's own control, for the comparison that keeps the two drawings together. */
function checkbox(form: HTMLFormElement): HTMLInputElement {
    const element = form.querySelector<UiCheckbox>('ui-checkbox');
    const control = element?.renderRoot.querySelector('input');

    if (control == null) {
        throw new Error('no checkbox in the fixture');
    }

    return control;
}

/** Waits out the render a declaration's own announcement schedules. */
async function settled(element: UiRadioGroup): Promise<void> {
    await new Promise((resolve) => {
        setTimeout(resolve, 0);
    });

    await element.updateComplete;
}

/**
 * Takes the motion out, flushed, so that a colour read is the destination rather than
 * whichever frame of a 150ms interpolation the read landed on.
 */
function withoutMotion(form: HTMLFormElement): void {
    group(form).style.setProperty('--ui-duration-state', '0s');

    // Two properties transition here, so the computed value is a list — every entry has to
    // be out, not the string as a whole.
    for (const duration of getComputedStyle(radio(form)).transitionDuration.split(', ')) {
        expect(duration, 'the motion is out').toBe('0s');
    }
}

/** The component's own stylesheet, as text, for the rules no rendering can show. */
function styleText(tag: string): string {
    return String((customElements.get(tag) as unknown as { styles: unknown }).styles);
}

/** Moves the pointer out of the way — see `checkbox.test.ts` for why nothing else can. */
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

/**
 * The shape RFC 0005 decided: the controls, their labels, the group's own name, help and
 * message rendered together, so every end of every relationship shares one tree scope.
 */
describe('the set and its frame, in one tree scope', () => {
    it('registers both elements', () => {
        expect(customElements.get('ui-radio')).toBeDefined();
        expect(customElements.get('ui-radio-group')).toBeDefined();
    });

    it('renders the controls, leaving the host nothing to write but the choices', async () => {
        const form = await mount(fixture);

        expect(form.querySelector('input'), 'nothing in the light DOM').toBeNull();
        expect(controls(form).map((control) => control.type)).toEqual(['radio', 'radio', 'radio']);
    });

    it('names the set rather than an option, with both ends in the same root', async () => {
        const form = await mount(fixture);
        const options = part(group(form), 'options');

        expect(options.getAttribute('role'), 'the set is the widget').toBe('radiogroup');

        const named = options.getAttribute('aria-labelledby') ?? '';

        expect(named, 'the set is named by reference').not.toBe('');
        expect(group(form).renderRoot.querySelector(`#${named}`)?.textContent).toBe('Plan');
        // A `<label for>` reaches a labelable element and a group is not one, so the name
        // is a reference — which resolves here because both ends were rendered together.
        expect(document.getElementById('label'), 'and it does not leak to the document').toBeNull();
    });

    it('labels each option by containment, so there is no id to strand', async () => {
        const form = await mount(fixture);

        expect(labelOf(radio(form)).className, 'the label contains its control').toBe('option');
        expect(labelOf(radio(form)).textContent.trim()).toBe('Free');
    });

    it('describes the set by the help, and by the message before it in error', async () => {
        const form = await mount(fixture);
        const options = part(group(form), 'options');

        expect(options.hasAttribute('aria-describedby')).toBe(false);

        group(form).help = 'Change it any time.';
        await group(form).updateComplete;

        expect(part(group(form), 'options').getAttribute('aria-describedby')).toBe('help');

        group(form).error = 'Pick one.';
        await group(form).updateComplete;

        expect(part(group(form), 'options').getAttribute('aria-describedby')).toBe('error help');
        expect(part(group(form), 'options').getAttribute('aria-invalid')).toBe('true');
    });

    it('renders the two supporting texts only when it has them', async () => {
        const form = await mount(fixture);
        const element = group(form);

        expect(element.renderRoot.querySelector('.help'), 'nothing to say').toBeNull();
        expect(element.renderRoot.querySelector('.error')).toBeNull();

        element.help = 'Change it any time.';
        element.error = 'Pick one.';
        await element.updateComplete;

        expect(part(element, 'help').textContent).toBe('Change it any time.');
        expect(part(element, 'error').textContent).toBe('Pick one.');

        element.help = '';
        element.error = '';
        await element.updateComplete;

        expect(element.renderRoot.querySelector('.help'), 'and gone again').toBeNull();
        expect(element.renderRoot.querySelector('.error')).toBeNull();
    });

    it('draws nothing for the declarations themselves', async () => {
        const form = await mount(fixture);

        expect(choice(form, 'free').getBoundingClientRect().height).toBe(0);
        expect(getComputedStyle(choice(form, 'free')).display).toBe('none');
    });

    it('announces the orientation it draws, so the two cannot disagree', async () => {
        const form = await mount(fixture);

        expect(part(group(form), 'options').getAttribute('aria-orientation')).toBe('vertical');

        group(form).orientation = 'horizontal';
        await group(form).updateComplete;

        expect(part(group(form), 'options').getAttribute('aria-orientation')).toBe('horizontal');
        expect(getComputedStyle(part(group(form), 'options')).flexDirection).toBe('row');
    });

    it('starts with nothing written on it, which no fixture here ever shows', async () => {
        const form = await mount('<ui-radio-group></ui-radio-group>');
        const element = group(form);

        expect(element.label, 'no label until a host writes one').toBe('');
        expect(part(element, 'label').textContent).toBe('');
        expect(element.name).toBe('');
        expect(element.value, 'the choice in force is the declared one, not a string').toBe('');
        expect(element.required).toBe(false);
        expect(element.disabled).toBe(false);
        expect(element.orientation).toBe('vertical');
        expect(controls(form), 'and no controls, having no choices').toEqual([]);
    });

    it('reflects what a host would style or read back, and not the choice in force', async () => {
        const form = await mount(fixture);
        const element = group(form);

        element.label = 'Tier';
        element.help = 'Change it any time.';
        element.error = 'Nope.';
        element.name = 'tier';
        element.value = 'pro';
        element.orientation = 'horizontal';
        element.required = true;
        element.disabled = true;
        await element.updateComplete;

        expect(element.getAttribute('label')).toBe('Tier');
        expect(element.getAttribute('help')).toBe('Change it any time.');
        expect(element.getAttribute('error')).toBe('Nope.');
        expect(element.getAttribute('name')).toBe('tier');
        expect(element.getAttribute('orientation')).toBe('horizontal');
        expect(element.hasAttribute('required')).toBe(true);
        expect(element.hasAttribute('disabled')).toBe(true);
        // The choice in force is state rather than a default, the way a native control's
        // `checked` IDL attribute is — so a reset has somewhere to return to.
        expect(element.hasAttribute('value'), 'value is the state, not the default').toBe(false);
    });

    it('fills the line it is given', async () => {
        const form = await mount(fixture);

        expect(getComputedStyle(group(form)).display).toBe('block');
    });
});

/**
 * The choices, which are declarations rather than controls.
 *
 * The group renders the radios because a `role="radiogroup"`, the name pointing at it and
 * the controls it contains have to share one tree scope. So `<ui-radio>` says what a choice
 * is and shows nothing, the way `<ui-option>` does for `<ui-select>`.
 */
describe('the choices', () => {
    it('become the controls the platform needs, in the order written', async () => {
        const form = await mount(fixture);

        expect(
            controls(form).map(
                (control) => `${control.value}:${labelOf(control).textContent.trim()}`,
            ),
        ).toEqual(['free:Free', 'pro:Pro', 'max:Max']);
    });

    it('start on the one declared checked, and on none where there is none', async () => {
        const declared = await mount(`
            <ui-radio-group label="Plan" name="plan">
                <ui-radio value="free">Free</ui-radio>
                <ui-radio value="pro" checked>Pro</ui-radio>
            </ui-radio-group>
        `);

        expect(controls(declared).map((control) => control.checked)).toEqual([false, true]);

        const bare = await mount(fixture);

        // A radio group differs from a drop-down exactly here: it has an empty state, so
        // there is no first-choice fallback to make.
        expect(
            controls(bare).some((control) => control.checked),
            'nothing declared',
        ).toBe(false);
    });

    it('carry a change written as a property, which no observer could see', async () => {
        // A `<option>` or an `<input>` the host wrote is somebody else's element, and a
        // property write on one is not something a MutationObserver reports. These are this
        // package's own elements, so the property is reactive.
        const form = await mount(fixture);

        choice(form, 'max').checked = true;
        await settled(group(form));

        expect(controls(form)[2]?.checked).toBe(true);
    });

    it('carry one disabled option, the rest of the set staying live', async () => {
        const form = await mount(`
            <ui-radio-group label="Plan" name="plan">
                <ui-radio value="free">Free</ui-radio>
                <ui-radio value="pro" disabled>Pro</ui-radio>
            </ui-radio-group>
        `);

        expect(controls(form).map((control) => control.disabled)).toEqual([false, true]);
    });

    it('report arriving and leaving through the slot they sit in', async () => {
        const form = await mount(fixture);

        choice(form, 'free').remove();
        await settled(group(form));

        expect(controls(form).map((control) => control.value)).toEqual(['pro', 'max']);

        const added = document.createElement('ui-radio');
        added.value = 'team';
        added.textContent = 'Team';
        group(form).append(added);
        await settled(group(form));

        expect(controls(form).map((control) => control.value)).toEqual(['pro', 'max', 'team']);
    });

    it('leave the set empty when there are none', async () => {
        const form = await mount('<ui-radio-group label="Plan" name="plan"></ui-radio-group>');

        expect(controls(form)).toEqual([]);
        expect([...new FormData(form)], 'an empty choice is still an entry').toEqual([
            ['plan', ''],
        ]);
    });

    it('ignore anything that is not a choice', async () => {
        const form = await mount(`
            <ui-radio-group label="Plan" name="plan">
                <span>not a choice</span>
                <ui-radio value="free">Free</ui-radio>
            </ui-radio-group>
        `);

        expect(controls(form).map((control) => control.value)).toEqual(['free']);
    });

    it('reflect what a host writes, so a stylesheet and a reader both see it', async () => {
        const form = await mount(fixture);
        const option = choice(form, 'free');

        option.value = 'starter';
        option.checked = true;
        option.disabled = true;
        await settled(group(form));

        expect(option.getAttribute('value')).toBe('starter');
        expect(option.hasAttribute('checked')).toBe(true);
        expect(option.hasAttribute('disabled')).toBe(true);
    });

    it('start empty, so an undeclared choice declares nothing', () => {
        const option = document.createElement('ui-radio');

        expect(option.value).toBe('');
        expect(option.checked).toBe(false);
        expect(option.disabled).toBe(false);
    });
});

/**
 * The element joins the form, because the controls cannot: an `<input>` in a shadow root
 * has no form owner. Everything here is `ElementInternals` paying that back.
 */
describe('the form, which the element joins in the place of the controls', () => {
    it('submits the choice in force', async () => {
        const form = await mount(fixture);

        expect([...new FormData(form)], 'nothing chosen yet').toEqual([['plan', '']]);

        group(form).value = 'pro';
        await group(form).updateComplete;

        expect([...new FormData(form)]).toEqual([['plan', 'pro']]);
    });

    it('takes the name from a property, because a form reads the attribute', async () => {
        const form = await mount(`
            <ui-radio-group label="Plan"><ui-radio value="free" checked>Free</ui-radio></ui-radio-group>
        `);
        group(form).name = 'plan';
        await group(form).updateComplete;

        expect([...new FormData(form)]).toEqual([['plan', 'free']]);
    });

    it('submits nothing while disabled, and refuses every option', async () => {
        const form = await mount(`
            <ui-radio-group label="Plan" name="plan" disabled>
                <ui-radio value="free" checked>Free</ui-radio>
            </ui-radio-group>
        `);

        expect([...new FormData(form)]).toEqual([]);
        expect(radio(form).disabled, 'one attribute, not one per option').toBe(true);
    });

    it('knows the form it is in', async () => {
        const form = await mount(fixture);

        expect(group(form).form).toBe(form);
    });

    it('resets to the choice the declarations name', async () => {
        const form = await mount(`
            <ui-radio-group label="Plan" name="plan">
                <ui-radio value="free">Free</ui-radio>
                <ui-radio value="pro" checked>Pro</ui-radio>
            </ui-radio-group>
        `);
        group(form).value = 'free';
        await group(form).updateComplete;

        expect(controls(form)[0]?.checked).toBe(true);

        form.reset();
        await group(form).updateComplete;

        expect(controls(form)[1]?.checked, 'back to the declared default').toBe(true);
        // Empty rather than 'pro': the property means *the declared default*, and a reset
        // that wrote the resolved choice back would freeze it against a later declaration.
        expect(group(form).value, 'and the property is empty again').toBe('');
    });

    it('follows a fieldset that disables it', async () => {
        const form = await mount(`
            <fieldset disabled>
                <ui-radio-group label="Plan" name="plan">
                    <ui-radio value="free">Free</ui-radio>
                </ui-radio-group>
            </fieldset>
        `);

        expect(group(form).disabled, 'the callback fired').toBe(true);
        expect(radio(form).disabled, 'and reached the controls').toBe(true);
    });

    it('restores what a back-navigation hands back', async () => {
        const form = await mount(fixture);

        group(form).formStateRestoreCallback('max');
        await group(form).updateComplete;

        expect(controls(form)[2]?.checked).toBe(true);

        group(form).formStateRestoreCallback(null);
        await group(form).updateComplete;

        expect(
            controls(form).some((control) => control.checked),
            'back to nothing',
        ).toBe(false);
        expect(group(form).value, 'by emptying the property, not by naming a choice').toBe('');
    });

    it('mirrors a choice made by hand, and re-dispatches the change', async () => {
        // `change` is non-composed, so the one a control fires stops at the shadow boundary
        // and a host listening on the tag would hear nothing.
        const form = await mount(fixture);
        const heard: (EventTarget | null)[] = [];

        form.addEventListener('change', (event) => heard.push(event.target));

        radio(form).click();
        await group(form).updateComplete;

        expect(group(form).value, 'mirrored back into the property').toBe('free');
        expect(heard, 'retargeted to the element').toEqual([group(form)]);
    });
});

describe('the validity', () => {
    it('is missing while a required set has no choice made', async () => {
        const form = await mount(`
            <ui-radio-group label="Plan" name="plan" required>
                <ui-radio value="free">Free</ui-radio>
                <ui-radio value="pro">Pro</ui-radio>
            </ui-radio-group>
        `);

        // The platform computes it: `required` on the rendered radios makes the set
        // required, and the group hands the whole ValidityState over rather than deciding.
        expect(group(form).validity.valueMissing).toBe(true);
        expect(group(form).validationMessage, 'with the engine own words').not.toBe('');

        group(form).value = 'pro';
        await group(form).updateComplete;

        expect(group(form).validity.valid).toBe(true);
        expect(group(form).validationMessage).toBe('');
    });

    it('takes the message the host wrote, which wins over the platform', async () => {
        const form = await mount(fixture);

        group(form).error = 'Pick a plan.';
        await group(form).updateComplete;

        expect(group(form).validity.customError).toBe(true);
        expect(group(form).validationMessage).toBe('Pick a plan.');

        group(form).error = '';
        await group(form).updateComplete;

        expect(group(form).validity.valid).toBe(true);
    });

    it('has nothing to validate when it has no choices', async () => {
        const form = await mount(
            '<ui-radio-group label="Plan" name="plan" required></ui-radio-group>',
        );

        expect(group(form).validity.valid, 'an empty set is not an invalid one').toBe(true);
    });

    it('delegates focus, so the browser can put the reader on a control', async () => {
        const form = await mount(`
            <ui-radio-group label="Plan" name="plan" required>
                <ui-radio value="free">Free</ui-radio>
            </ui-radio-group>
        `);

        expect(form.reportValidity()).toBe(false);
        expect(document.activeElement).toBe(group(form));
        expect(group(form).shadowRoot?.activeElement).toBe(radio(form));

        // And the plain call, which is the half `reportValidity()` does not measure: the
        // browser focuses the anchor `setValidity` was given whether or not focus is
        // delegated, so only `focus()` on the host tells the two apart.
        radio(form).blur();

        expect(document.activeElement, 'the focus is off it').not.toBe(group(form));

        group(form).focus();

        expect(document.activeElement, 'and back on it by hand').toBe(group(form));
        expect(group(form).shadowRoot?.activeElement).toBe(radio(form));
    });
});

/**
 * The claim this component is made of: the APG radio group pattern is the platform's, and
 * nothing here installs it. Measured rather than trusted — and measured in the arrangement
 * the controls are actually in, which is a shadow root with no form owner, where the group
 * is scoped by its tree.
 */
describe('the behaviour, which the platform already had', () => {
    it('writes no tabindex anywhere, because the roving one is not ours', async () => {
        const form = await mount(fixture);

        for (const control of controls(form)) {
            expect(control.hasAttribute('tabindex'), control.value).toBe(false);
        }

        expect(part(group(form), 'options').hasAttribute('tabindex')).toBe(false);
    });

    it('is one tab stop, not one per option', async () => {
        const form = await mount(`${fixture}<input type="text" name="after" />`);

        await userEvent.tab();

        expect(group(form).shadowRoot?.activeElement, 'the first option takes the focus').toBe(
            radio(form),
        );

        await userEvent.tab();

        expect(
            (document.activeElement as HTMLInputElement).name,
            'and the next tab leaves the set entirely',
        ).toBe('after');
    });

    it('enters at the selected option rather than at the first', async () => {
        const form = await mount(`
            <ui-radio-group label="Plan" name="plan">
                <ui-radio value="free">Free</ui-radio>
                <ui-radio value="pro" checked>Pro</ui-radio>
            </ui-radio-group>
        `);

        await userEvent.tab();

        expect(group(form).shadowRoot?.activeElement).toBe(controls(form)[1]);
    });

    it('moves and selects with the arrow keys, and wraps at the end', async () => {
        const form = await mount(fixture);
        const [free, pro, max] = controls(form);

        await userEvent.tab();
        await userEvent.keyboard('{ArrowDown}');

        expect(pro?.checked, 'selection moved with the focus').toBe(true);
        expect(group(form).value, 'and the property followed').toBe('pro');

        await userEvent.keyboard('{ArrowDown}');

        expect(max?.checked).toBe(true);

        await userEvent.keyboard('{ArrowDown}');

        expect(free?.checked, 'the set wraps').toBe(true);
    });

    it('swaps left and right under rtl, which a hand-rolled one has to remember to', async () => {
        const form = await mount(fixture);
        group(form).setAttribute('dir', 'rtl');
        await group(form).updateComplete;

        const [free, pro] = controls(form);

        free?.focus();
        free?.click();

        await userEvent.keyboard('{ArrowLeft}');

        expect(pro?.checked, 'left advances under rtl').toBe(true);

        await userEvent.keyboard('{ArrowRight}');

        expect(free?.checked, 'and right goes back').toBe(true);
    });

    it('scopes two sets apart, which a shared form owner does not', async () => {
        // The rendered controls all carry one internal name, and that is safe precisely
        // because a group with no form owner is scoped by its TREE: two elements are two
        // shadow roots, so they are two groups.
        const form = await mount(`${fixture}${fixture}`);
        const [first, second] = [...form.querySelectorAll('ui-radio-group')];

        if (first === undefined || second === undefined) {
            throw new Error('the fixture rendered fewer than two groups');
        }

        const controlsOf = (element: UiRadioGroup): HTMLInputElement[] => [
            ...element.renderRoot.querySelectorAll('input'),
        ];

        controlsOf(first)[0]?.click();
        controlsOf(second)[0]?.click();

        expect(controlsOf(first)[0]?.checked, 'the first kept its choice').toBe(true);
    });

    it('submits one value for the set, because they never stopped being native', async () => {
        const form = await mount(fixture);

        radio(form).click();
        await group(form).updateComplete;

        expect([...new FormData(form)]).toEqual([['plan', 'free']]);

        controls(form)[1]?.click();
        await group(form).updateComplete;

        expect([...new FormData(form)], 'one entry, not one per option').toEqual([['plan', 'pro']]);
    });
});

describe('the drawing', () => {
    it('stacks the options, spaced by the space token', async () => {
        const form = await mount(fixture);
        group(form).style.setProperty('--ui-space', '10px');

        const options = getComputedStyle(part(group(form), 'options'));

        expect(options.flexDirection).toBe('column');
        expect(options.rowGap).toBe('5px');
    });

    it('lays out in a row when asked, wrapping rather than overflowing', async () => {
        const form = await mount(fixture);
        group(form).orientation = 'horizontal';
        await group(form).updateComplete;

        const options = getComputedStyle(part(group(form), 'options'));

        expect(options.flexDirection).toBe('row');
        expect(options.flexWrap).toBe('wrap');
    });

    it('drops the margin the user agent puts around a radio', async () => {
        const form = await mount(fixture);

        expect(getComputedStyle(radio(form)).margin).toBe('0px');
    });

    it('draws at the target-size floor, and holds it against a smaller space token', async () => {
        const form = await mount(fixture);

        expect(getComputedStyle(radio(form)).blockSize).toBe('24px');
        expect(getComputedStyle(radio(form)).inlineSize).toBe('24px');

        group(form).style.setProperty('--ui-space', '2px');

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
        group(form).style.setProperty('--ui-color-accent', 'rgb(1, 2, 3)');

        radio(form).click();
        await group(form).updateComplete;

        expect(getComputedStyle(radio(form)).backgroundColor).toBe('rgb(1, 2, 3)');
    });

    it('marks the fill by subtracting the dot from it, rather than painting one on', async () => {
        const form = await mount(fixture);

        radio(form).click();
        await group(form).updateComplete;

        const styles = getComputedStyle(radio(form));

        for (const composite of styles.maskComposite.split(', ')) {
            expect(composite, 'the mark is a hole').toBe('exclude');
        }
        expect(styles.maskImage, 'and no picture freezes a colour').not.toContain('url(');
    });

    it('takes the boundary from the host', async () => {
        const form = await mount(fixture);
        withoutMotion(form);
        group(form).style.setProperty('--ui-color-border', 'rgb(1, 2, 3)');

        expect(getComputedStyle(radio(form)).borderTopColor).toBe('rgb(1, 2, 3)');
    });

    it('takes the label and the two supporting texts from their own tokens', async () => {
        const form = await mount(`
            <ui-radio-group label="Plan" name="plan" help="How." error="Nope.">
                <ui-radio value="free">Free</ui-radio>
            </ui-radio-group>
        `);
        const element = group(form);

        element.style.setProperty('--ui-color-text', 'rgb(4, 5, 6)');
        element.style.setProperty('--ui-color-danger', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-text-supporting', '19px');

        expect(getComputedStyle(part(element, 'label')).color, '--ui-color-text').toBe(
            'rgb(4, 5, 6)',
        );

        const message = getComputedStyle(part(element, 'error'));
        const help = getComputedStyle(part(element, 'help'));

        expect(message.color, '--ui-color-danger').toBe('rgb(1, 2, 3)');
        expect(message.fontSize, '--ui-text-supporting').toBe('19px');
        expect(help.color, '--ui-color-text').toBe('rgb(4, 5, 6)');
        expect(help.fontSize).toBe('19px');
    });

    it('mutes the label while the whole set is unavailable', async () => {
        const form = await mount(`
            <ui-radio-group label="Plan" name="plan" disabled>
                <ui-radio value="free">Free</ui-radio>
            </ui-radio-group>
        `);
        group(form).style.setProperty('--ui-color-text-muted', 'rgb(1, 2, 3)');

        expect(getComputedStyle(part(group(form), 'label')).color).toBe('rgb(1, 2, 3)');
        expect(getComputedStyle(radio(form)).opacity).toBe('0.5');
    });

    it('stacks the frame half a space apart', async () => {
        const form = await mount(fixture);
        group(form).style.setProperty('--ui-space', '10px');

        expect(getComputedStyle(part(group(form), 'stack')).rowGap).toBe('5px');
    });

    it('keeps a visible focus ring — removing it is how a component stops being usable', () => {
        expect(styleText('ui-radio-group')).toContain('focus-visible');
        expect(styleText('ui-radio-group')).toContain('outline:');
        expect(styleText('ui-radio-group')).toContain('outline-offset:');
    });

    it('takes the focus ring colour from the host', async () => {
        const form = await mount(fixture);
        group(form).style.setProperty('--ui-color-focus', 'rgb(1, 2, 3)');

        await userEvent.tab();

        expect(document.activeElement, 'tab reached the element').toBe(group(form));
        expect(getComputedStyle(radio(form)).outlineColor).toBe('rgb(1, 2, 3)');
    });

    it('refuses a pointer it will do nothing with', async () => {
        const form = await mount(`
            <ui-radio-group label="Plan" name="plan">
                <ui-radio value="free" disabled>Free</ui-radio>
            </ui-radio-group>
        `);

        expect(getComputedStyle(radio(form)).cursor).toBe('not-allowed');
        expect(getComputedStyle(labelOf(radio(form))).cursor).toBe('not-allowed');
    });
});

/**
 * The two drawn boolean controls have to agree, and something compares them so that it
 * fails when they drift. `src/radio.ts` writes its own out rather than importing the
 * checkbox's, for the reason `src/select.ts` gives about the box it shares with the input.
 */
describe('the control, against the checkbox it has to match', () => {
    it('agrees on the size, the boundary, the fill and the cursor', async () => {
        const form = await mount(`
            ${fixture}
            <ui-checkbox label="The drawing this one has to match"></ui-checkbox>
        `);
        const drawn = getComputedStyle(radio(form));
        const box = getComputedStyle(checkbox(form));

        for (const property of [
            'appearance',
            'inlineSize',
            'blockSize',
            'backgroundColor',
            'borderTopWidth',
            'borderTopStyle',
            'borderTopColor',
            'transitionProperty',
            'transitionDuration',
        ] as const) {
            expect(drawn[property], property).toBe(box[property]);
        }
    });

    it('agrees on the accent it fills with, and on the focus ring', async () => {
        const form = await mount(`
            ${fixture}
            <ui-checkbox label="The drawing this one has to match" checked></ui-checkbox>
        `);
        withoutMotion(form);

        radio(form).click();
        await group(form).updateComplete;

        const drawn = getComputedStyle(radio(form));
        const box = getComputedStyle(checkbox(form));

        expect(drawn.backgroundColor).toBe(box.backgroundColor);
        expect(drawn.outlineColor).toBe(box.outlineColor);
    });

    it('differs on the shape, and only on the shape', async () => {
        const form = await mount(`
            ${fixture}
            <ui-checkbox label="The drawing this one has to differ from"></ui-checkbox>
        `);

        expect(getComputedStyle(radio(form)).borderRadius).not.toBe(
            getComputedStyle(checkbox(form)).borderRadius,
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

        radio(form).click();
        await group(form).updateComplete;

        const resting = getComputedStyle(radio(form)).backgroundColor;

        await userEvent.hover(radio(form));

        expect(getComputedStyle(radio(form)).backgroundColor).not.toBe(resting);
    });

    it('ignores a pointer while disabled', async () => {
        const form = await mount(`
            <ui-radio-group label="Plan" name="plan" disabled>
                <ui-radio value="free">Free</ui-radio>
            </ui-radio-group>
        `);
        withoutMotion(form);

        const resting = getComputedStyle(radio(form)).borderColor;

        await userEvent.hover(radio(form));

        expect(getComputedStyle(radio(form)).borderColor).toBe(resting);
    });

    it('moves the boundary and the fill over the state duration, and nothing else', async () => {
        const form = await mount(fixture);
        const durations = getComputedStyle(radio(form)).transitionDuration.split(', ');

        expect(getComputedStyle(radio(form)).transitionProperty).toBe(
            'background-color, border-color',
        );
        expect(new Set(durations).size, 'one duration for both').toBe(1);
    });

    it('guards every interaction rule against the state that refuses it', () => {
        const sheet = styleText('ui-radio-group');

        for (const rule of sheet.split('}')) {
            if (rule.includes(':hover') && rule.includes('input')) {
                expect(rule, rule.trim().slice(0, 60)).toContain(':not(:disabled)');
            }
        }
    });
});

describe('in error', () => {
    it('paints every option from the one source the group rendered', async () => {
        const form = await mount(`
            <ui-radio-group label="Plan" name="plan" error="Pick one.">
                <ui-radio value="free">Free</ui-radio>
                <ui-radio value="pro">Pro</ui-radio>
            </ui-radio-group>
        `);
        withoutMotion(form);
        group(form).style.setProperty('--ui-color-danger', 'rgb(1, 2, 3)');

        for (const control of controls(form)) {
            expect(getComputedStyle(control).borderTopColor, control.value).toBe('rgb(1, 2, 3)');
        }
    });

    it('reads the state off the rendered aria-invalid, not a reflected attribute', () => {
        // Lit reflects an empty string default as an empty attribute, and an
        // attribute-presence selector matches every element. Measured on ui-checkbox.
        const sheet = styleText('ui-radio-group');

        expect(sheet).toContain("[aria-invalid='true']");
        expect(sheet, 'never :host([error])').not.toContain(':host([error])');
    });

    it('says it in words as well as in colour', async () => {
        const form = await mount(`
            <ui-radio-group label="Plan" name="plan" error="Pick one.">
                <ui-radio value="free">Free</ui-radio>
            </ui-radio-group>
        `);

        expect(part(group(form), 'error').textContent).toBe('Pick one.');
        expect(part(group(form), 'options').getAttribute('aria-describedby')).toContain('error');
    });
});

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

        radio(form).click();
        await group(form).updateComplete;

        expect(getComputedStyle(radio(form)).backgroundColor).not.toBe(resting);
    });

    it('says unavailable with a colour rather than a veil, which is not forced', async () => {
        const form = await mount(`
            <ui-radio-group label="Plan" name="plan">
                <ui-radio value="free" disabled>Free</ui-radio>
            </ui-radio-group>
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

    it('has no violations with supporting text', async () => {
        await expectAccessible(await mountStory(WithHelp, meta, 'WithHelp'));
    });

    it('has no violations in error', async () => {
        await expectAccessible(await mountStory(Invalid, meta, 'Invalid'));
    });

    it('has no violations while disabled', async () => {
        await expectAccessible(await mountStory(Disabled, meta, 'Disabled'));
    });

    it('has no violations with one option disabled', async () => {
        await expectAccessible(await mountStory(OneOptionDisabled, meta, 'OneOptionDisabled'));
    });

    it('has no violations right to left', async () => {
        await expectAccessible(await mountStory(RightToLeft, meta, 'RightToLeft'));
    });
});

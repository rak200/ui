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
    Grouped,
    Invalid,
    Multiple,
    RightToLeft,
    Select,
} from '../stories/select.stories.js';
import '../src/select.js';
import '../src/input.js';
import type { UiOption, UiSelect } from '../src/select.js';
import type { UiInput } from '../src/input.js';

/** The markup the behavioural tests use, unless one needs a different shape. */
const fixture = `
    <ui-select label="Currency" name="currency">
        <ui-option value="brl">Real</ui-option>
        <ui-option value="usd">Dollar</ui-option>
    </ui-select>
`;

/** Mounts a fixture inside a form and waits for every declaration to settle. */
async function mount(markup: string): Promise<HTMLFormElement> {
    const form = document.createElement('form');
    form.innerHTML = markup;
    document.body.append(form);

    for (const element of form.querySelectorAll('ui-option, ui-optgroup, ui-select, ui-input')) {
        await (element as UiSelect).updateComplete;
    }

    // A declaration announces itself on its own first update, which lands after the
    // select's — so the select renders a second time, on a microtask.
    await new Promise((resolve) => {
        setTimeout(resolve, 0);
    });

    return form;
}

/** The element under test. */
function select(form: HTMLFormElement): UiSelect {
    const element = form.querySelector('ui-select');

    if (element === null) {
        throw new Error('no select in the fixture');
    }

    return element;
}

/** The rendered control, which is what every drawing assertion is about. */
function box(element: UiSelect): HTMLSelectElement {
    const control = element.renderRoot.querySelector('select');

    if (control === null) {
        throw new Error('the select rendered no control');
    }

    return control;
}

/** One of the exposed parts, which is how a host reaches anything in here. */
function part(element: UiSelect | UiInput, name: string): HTMLElement {
    const found = element.renderRoot.querySelector<HTMLElement>(`[part='${name}']`);

    if (found === null) {
        throw new Error(`no part named ${name}`);
    }

    return found;
}

/** One declaration the host wrote, which is what the control is built from. */
function choice(element: UiSelect, value: string): UiOption {
    const found = element.querySelector<UiOption>(`ui-option[value='${value}']`);

    if (found === null) {
        throw new Error(`no choice named ${value}`);
    }

    return found;
}

/** Waits out the render a declaration's own announcement schedules. */
async function settled(element: UiSelect): Promise<void> {
    await new Promise((resolve) => {
        setTimeout(resolve, 0);
    });

    await element.updateComplete;
}

/**
 * Takes the motion out, flushed, so that a colour read is the destination rather than
 * whichever frame of a 150ms interpolation the read landed on.
 */
function withoutMotion(element: UiSelect): void {
    element.style.setProperty('--ui-duration-state', '0s');

    expect(getComputedStyle(box(element)).transitionDuration, 'the motion is out').toBe('0s');
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

describe('the control and its frame, in one tree scope', () => {
    it('registers all three elements', () => {
        expect(customElements.get('ui-select')).toBeDefined();
        expect(customElements.get('ui-option')).toBeDefined();
        expect(customElements.get('ui-optgroup')).toBeDefined();
    });

    it('renders the control, leaving the host nothing to write but the choices', async () => {
        const form = await mount(fixture);

        expect(form.querySelector('select'), 'nothing in the light DOM').toBeNull();
        expect(box(select(form)).tagName).toBe('SELECT');
        expect(box(select(form)).getAttribute('name'), 'and the name reaches it').toBe('currency');
    });

    it('starts with nothing written on it, which no fixture here ever shows', async () => {
        const form = await mount('<ui-select></ui-select>');
        const element = select(form);

        expect(element.label, 'no label until a host writes one').toBe('');
        expect(part(element, 'label').textContent).toBe('');
        // An empty name writes no attribute rather than an empty one, the way every
        // optional attribute in this package does.
        expect(element.name).toBe('');
        expect(box(element).hasAttribute('name'), 'and none on the control').toBe(false);
        // Empty means *the declared default* rather than nothing, so the property starts
        // empty however the choices below it are marked.
        expect(element.value).toBe('');
        expect(element.required).toBe(false);
        expect(box(element).required, 'nothing a host did not ask for').toBe(false);
        expect(element.multiple).toBe(false);
        expect(box(element).multiple).toBe(false);
    });

    it('renders the two supporting texts only when it has them', async () => {
        const form = await mount(fixture);
        const element = select(form);

        expect(element.renderRoot.querySelector('.help'), 'nothing to say').toBeNull();
        expect(element.renderRoot.querySelector('.error')).toBeNull();

        element.help = 'Pick one.';
        element.error = 'Pick a currency.';
        await element.updateComplete;

        expect(part(element, 'help').textContent).toBe('Pick one.');
        expect(part(element, 'error').textContent).toBe('Pick a currency.');

        element.help = '';
        element.error = '';
        await element.updateComplete;

        expect(element.renderRoot.querySelector('.help'), 'and gone again').toBeNull();
        expect(element.renderRoot.querySelector('.error')).toBeNull();
    });

    it('reflects what a host would style or read back, and not the choice in force', async () => {
        const form = await mount(fixture);
        const element = select(form);

        element.label = 'Money';
        element.help = 'Pick one.';
        element.error = 'Nope.';
        element.name = 'money';
        element.value = 'usd';
        element.required = true;
        element.disabled = true;
        element.multiple = true;
        await element.updateComplete;

        expect(element.getAttribute('label')).toBe('Money');
        expect(element.getAttribute('help')).toBe('Pick one.');
        expect(element.getAttribute('error')).toBe('Nope.');
        expect(element.getAttribute('name')).toBe('money');
        expect(element.hasAttribute('required')).toBe(true);
        expect(element.hasAttribute('disabled')).toBe(true);
        expect(element.hasAttribute('multiple')).toBe(true);
        // The choice in force is state rather than a default, the way a native control's
        // `value` IDL attribute is — so a reset has somewhere to return to.
        expect(element.hasAttribute('value'), 'value is the state, not the default').toBe(false);
    });

    it('names it with a label that points at it, which resolves in the same root', async () => {
        const form = await mount(fixture);
        const label = part(select(form), 'label');

        expect(label.tagName).toBe('LABEL');
        expect(box(select(form)).labels[0]).toBe(label);
        expect(label.textContent).toBe('Currency');
    });

    it('describes it by the help, and by the message before it in error', async () => {
        const form = await mount(fixture);

        expect(box(select(form)).hasAttribute('aria-describedby')).toBe(false);

        select(form).help = 'Pick one.';
        await select(form).updateComplete;

        expect(box(select(form)).getAttribute('aria-describedby')).toBe('help');

        select(form).error = 'Pick a currency.';
        await select(form).updateComplete;

        expect(box(select(form)).getAttribute('aria-describedby')).toBe('error help');
        expect(box(select(form)).getAttribute('aria-invalid')).toBe('true');
    });

    it('draws nothing for the declarations themselves', async () => {
        const form = await mount(fixture);

        expect(choice(select(form), 'brl').getBoundingClientRect().height).toBe(0);
        expect(getComputedStyle(choice(select(form), 'brl')).display).toBe('none');
    });

    it('fills the line it is given', async () => {
        const form = await mount(fixture);

        expect(getComputedStyle(select(form)).display).toBe('block');
        expect(getComputedStyle(box(select(form))).inlineSize).toBe(
            getComputedStyle(select(form)).inlineSize,
        );
    });
});

/**
 * The choices, which could not stay as `<option>`s.
 *
 * Measured before the shape was chosen: a `<slot>` inside a `<select>` assigns the nodes
 * and the select sees none of them — `options.length` was `0` with two assigned, because
 * `HTMLSelectElement.options` is built from its own children rather than the flattened
 * tree. So the choices are declarations, and the platform's elements are built from them.
 */
describe('the choices', () => {
    it('become the options the platform needs', async () => {
        const form = await mount(fixture);
        const control = box(select(form));

        expect(
            [...control.options].map((option) => `${option.value}:${option.text.trim()}`),
        ).toEqual(['brl:Real', 'usd:Dollar']);
    });

    it('start on the one declared selected, and on the first where none is', async () => {
        const declared = await mount(`
            <ui-select label="C" name="c">
                <ui-option value="brl">Real</ui-option>
                <ui-option value="usd" selected>Dollar</ui-option>
            </ui-select>
        `);

        expect(box(select(declared)).value, 'the declared default').toBe('usd');

        const bare = await mount(fixture);

        // The platform's own rule, read off the declarations: a native select with no
        // selected option in it lands on the first.
        expect(box(select(bare)).value, 'the first, where none is declared').toBe('brl');
    });

    it('carry a change written as a property, which no observer could see', async () => {
        // This is what decided the shape. A `<option>` the host wrote is somebody else's
        // element, and `option.selected = true` is a property write that a MutationObserver
        // does not report — measured, as a mirrored control that simply never moved. These
        // are this package's own elements, so the property is reactive.
        const form = await mount(fixture);

        choice(select(form), 'usd').selected = true;
        await settled(select(form));

        expect(box(select(form)).value).toBe('usd');
    });

    it('carry a disabled one, and a group with a heading', async () => {
        const form = await mount(`
            <ui-select label="C" name="c">
                <ui-optgroup label="Americas">
                    <ui-option value="brl">Real</ui-option>
                    <ui-option value="usd" disabled>Dollar</ui-option>
                </ui-optgroup>
            </ui-select>
        `);
        const control = box(select(form));

        expect(control.querySelector('optgroup')?.label).toBe('Americas');
        expect(control.options[1]?.disabled).toBe(true);
        expect(control.options.length, 'the group is not an option').toBe(2);
    });

    it('reflect what a host writes, so a stylesheet and a reader both see it', async () => {
        const form = await mount(`
            <ui-select label="C" name="c">
                <ui-optgroup label="Americas">
                    <ui-option value="brl">Real</ui-option>
                </ui-optgroup>
            </ui-select>
        `);
        const option = choice(select(form), 'brl');
        const group = select(form).querySelector('ui-optgroup');

        if (group === null) {
            throw new Error('no group in the fixture');
        }

        option.value = 'usd';
        option.selected = true;
        option.disabled = true;
        group.label = 'Europe';
        group.disabled = true;
        await settled(select(form));

        expect(option.getAttribute('value')).toBe('usd');
        expect(option.hasAttribute('selected')).toBe(true);
        expect(option.hasAttribute('disabled')).toBe(true);
        expect(group.getAttribute('label')).toBe('Europe');
        expect(group.hasAttribute('disabled')).toBe(true);
    });

    it('start empty, so an undeclared choice declares nothing', () => {
        const option = document.createElement('ui-option');
        const group = document.createElement('ui-optgroup');

        expect(option.value).toBe('');
        expect(option.selected).toBe(false);
        expect(option.disabled).toBe(false);
        expect(group.label).toBe('');
        expect(group.disabled, 'a group nobody disabled').toBe(false);
    });

    it('report arriving and leaving through the slot they sit in', async () => {
        const form = await mount(fixture);

        choice(select(form), 'brl').remove();
        await settled(select(form));

        expect(box(select(form)).options.length).toBe(1);

        const added = document.createElement('ui-option');
        added.value = 'eur';
        added.textContent = 'Euro';
        select(form).append(added);
        await added.updateComplete;
        await settled(select(form));

        expect([...box(select(form)).options].map((option) => option.value)).toEqual([
            'usd',
            'eur',
        ]);
    });

    it('leave the control empty when there are none', async () => {
        const form = await mount('<ui-select label="C" name="c"></ui-select>');

        expect(box(select(form)).options.length).toBe(0);
        expect(box(select(form)).value).toBe('');
        expect([...new FormData(form)], 'an empty choice is still an entry').toEqual([['c', '']]);
    });

    it('ignore anything that is not a choice', async () => {
        // A host can put whatever it likes in there; only the two declarations become
        // options, and a stray element draws nothing rather than an empty choice.
        const form = await mount(`
            <ui-select label="C" name="c">
                <span>not a choice</span>
                <ui-option value="brl">Real</ui-option>
            </ui-select>
        `);

        expect([...box(select(form)).options].map((option) => option.value)).toEqual(['brl']);

        // Not an empty option and not a stray string either: the fallback draws nothing,
        // so the control has no text of its own between the options.
        const loose = [...box(select(form)).childNodes]
            .filter((node) => node.nodeType === Node.TEXT_NODE)
            .map((node) => node.textContent?.trim() ?? '');

        expect(loose.join(''), 'nothing drawn for what is not a choice').toBe('');
    });

    it('report it from inside a group too, which the top-level slot cannot see', async () => {
        // A slot reports only the nodes assigned to *it*, so the select's own slot sees
        // nothing when a choice moves inside a group. Measured, as a removal that left the
        // control showing a choice that was gone — which is why each declaration carries a
        // slot of its own.
        const form = await mount(`
            <ui-select label="C" name="c">
                <ui-optgroup label="Americas">
                    <ui-option value="brl">Real</ui-option>
                    <ui-option value="usd">Dollar</ui-option>
                </ui-optgroup>
            </ui-select>
        `);

        choice(select(form), 'usd').remove();
        await settled(select(form));

        expect(box(select(form)).options.length).toBe(1);
    });
});

describe('the form, which the element joins in the place of the control', () => {
    it('submits the choice in force', async () => {
        const form = await mount(fixture);

        expect([...new FormData(form)]).toEqual([['currency', 'brl']]);

        select(form).value = 'usd';
        await select(form).updateComplete;

        expect([...new FormData(form)]).toEqual([['currency', 'usd']]);
    });

    it('takes the name from a property, because a form reads the attribute', async () => {
        const form = await mount(`
            <ui-select label="C"><ui-option value="brl">Real</ui-option></ui-select>
        `);
        select(form).name = 'currency';
        await select(form).updateComplete;

        expect([...new FormData(form)]).toEqual([['currency', 'brl']]);
    });

    it('submits nothing while disabled', async () => {
        const form = await mount(`
            <ui-select label="C" name="c" disabled>
                <ui-option value="brl">Real</ui-option>
            </ui-select>
        `);

        expect([...new FormData(form)]).toEqual([]);
    });

    it('knows the form it is in', async () => {
        const form = await mount(fixture);

        expect(select(form).form).toBe(form);
    });

    it('resets to the choice the declarations name', async () => {
        const form = await mount(`
            <ui-select label="C" name="c">
                <ui-option value="brl">Real</ui-option>
                <ui-option value="usd" selected>Dollar</ui-option>
            </ui-select>
        `);
        select(form).value = 'brl';
        await select(form).updateComplete;

        expect(box(select(form)).value).toBe('brl');

        form.reset();
        await select(form).updateComplete;

        expect(box(select(form)).value).toBe('usd');
        // Empty rather than 'usd': the property means *the declared default*, and a reset
        // that wrote the resolved choice back would freeze it against a later declaration.
        expect(select(form).value, 'and the property is empty again').toBe('');
    });

    it('follows a fieldset that disables it', async () => {
        const form = await mount(`
            <fieldset disabled>
                <ui-select label="C" name="c"><ui-option value="brl">Real</ui-option></ui-select>
            </fieldset>
        `);

        expect(select(form).disabled, 'the callback fired').toBe(true);
        expect(box(select(form)).disabled, 'and reached the control').toBe(true);
    });

    it('restores what a back-navigation hands back', async () => {
        const form = await mount(fixture);

        select(form).formStateRestoreCallback('usd');
        await select(form).updateComplete;

        expect(box(select(form)).value).toBe('usd');

        select(form).formStateRestoreCallback(null);
        await select(form).updateComplete;

        expect(box(select(form)).value, 'back to the declared default').toBe('brl');
        expect(select(form).value, 'by emptying the property, not by naming a choice').toBe('');
    });

    it('mirrors a choice made by hand, and re-dispatches the change', async () => {
        // `change` is non-composed, so the one the control fires stops at the shadow
        // boundary and a host listening on the tag would hear nothing.
        const form = await mount(fixture);
        const heard: (EventTarget | null)[] = [];

        form.addEventListener('change', (event) => heard.push(event.target));

        await userEvent.selectOptions(box(select(form)), 'usd');

        expect(select(form).value, 'mirrored back into the property').toBe('usd');
        expect(heard, 'retargeted to the element').toEqual([select(form)]);
    });
});

describe('the validity', () => {
    it('is missing while a required control has no choice made', async () => {
        const form = await mount(`
            <ui-select label="C" name="c" required>
                <ui-option value="">Choose</ui-option>
                <ui-option value="brl">Real</ui-option>
            </ui-select>
        `);

        expect(select(form).validity.valueMissing).toBe(true);
        expect(select(form).matches(':invalid')).toBe(true);

        select(form).value = 'brl';
        await select(form).updateComplete;

        expect(select(form).validity.valid).toBe(true);
    });

    it('takes the message the host wrote', async () => {
        const form = await mount(`
            <ui-select label="C" name="c" error="Pick a currency.">
                <ui-option value="brl">Real</ui-option>
            </ui-select>
        `);

        expect(select(form).validity.customError).toBe(true);
        expect(select(form).validationMessage).toBe('Pick a currency.');

        select(form).error = '';
        await select(form).updateComplete;

        expect(select(form).validity.valid).toBe(true);
        expect(select(form).validationMessage).toBe('');
    });

    it('delegates focus, so the browser can put the reader on the control', async () => {
        const form = await mount(`
            <ui-select label="C" name="c" required>
                <ui-option value="">Choose</ui-option>
            </ui-select>
        `);

        expect(form.reportValidity()).toBe(false);
        expect(document.activeElement).toBe(select(form));
        expect(select(form).shadowRoot?.activeElement).toBe(box(select(form)));

        // And the plain call, which is the half `reportValidity()` does not measure: the
        // browser focuses the anchor `setValidity` was given whether or not focus is
        // delegated, so only `focus()` on the host tells the two apart. Without the
        // delegation it lands on nothing, because the host is not a focusable element.
        box(select(form)).blur();

        expect(document.activeElement, 'the focus is off it').not.toBe(select(form));

        select(form).focus();

        expect(document.activeElement, 'and back on it by hand').toBe(select(form));
        expect(select(form).shadowRoot?.activeElement).toBe(box(select(form)));
    });
});

/**
 * The box, against the input it has to match.
 *
 * `src/select.ts` writes the drawing out rather than sharing `src/input.ts`'s, for the
 * reason its docblock gives — and this is the mechanism that answers the duplication
 * objection on its own terms. Something compares them, and it fails when they drift.
 */
describe('the box, against the input it has to match', () => {
    async function pair(): Promise<[UiSelect, UiInput]> {
        const form = await mount(`
            ${fixture}
            <ui-input label="Amount" name="amount"></ui-input>
        `);
        const input = form.querySelector('ui-input');

        if (input === null) {
            throw new Error('no input in the fixture');
        }

        return [select(form), input];
    }

    /** The input's own control, which is the thing the box is compared against. */
    function written(element: UiInput): HTMLInputElement {
        const control = element.renderRoot.querySelector('input');

        if (control === null) {
            throw new Error('the input rendered no control');
        }

        return control;
    }

    it('agrees on the boundary, the corner, the padding and the type', async () => {
        const [drop, text] = await pair();
        const drawn = getComputedStyle(box(drop));
        const beside = getComputedStyle(written(text));

        for (const property of [
            'boxSizing',
            'borderTopWidth',
            'borderTopStyle',
            'borderTopColor',
            'borderRadius',
            'paddingBlockStart',
            'paddingBlockEnd',
            'paddingInlineStart',
            'backgroundColor',
            'color',
            'fontFamily',
            'fontSize',
            'transitionProperty',
            'transitionDuration',
        ] as const) {
            expect(drawn[property], property).toBe(beside[property]);
        }
    });

    it('agrees on the frame around it, which both write out themselves', async () => {
        const [drop, text] = await pair();
        const stack = getComputedStyle(part(drop, 'stack'));
        const beside = getComputedStyle(part(text, 'stack'));

        expect(stack.display).toBe(beside.display);
        expect(stack.flexDirection).toBe(beside.flexDirection);
        expect(stack.rowGap).toBe(beside.rowGap);
    });

    it('parts company only on the two rules it declares it does', async () => {
        const [drop, text] = await pair();

        // A select opens something when clicked, so it is a pointer rather than a caret,
        // and it reserves room for the caret the platform stopped drawing.
        expect(getComputedStyle(box(drop)).cursor).toBe('pointer');
        expect(getComputedStyle(written(text)).cursor).toBe('text');
        expect(getComputedStyle(box(drop)).paddingInlineEnd).not.toBe(
            getComputedStyle(written(text)).paddingInlineEnd,
        );
    });
});

describe('the caret', () => {
    it('is drawn from gradients, so its colour stays a token', async () => {
        const form = await mount(fixture);
        const image = getComputedStyle(box(select(form))).backgroundImage;

        expect(image).toContain('linear-gradient');
        expect(image, 'a picture would freeze the colour').not.toContain('url(');
    });

    it('takes its colour from the muted token', async () => {
        const form = await mount(fixture);
        select(form).style.setProperty('--ui-color-text-muted', 'rgb(1, 2, 3)');

        expect(getComputedStyle(box(select(form))).backgroundImage).toContain('rgb(1, 2, 3)');
    });

    it('keeps clear of the text, by the room it actually takes', async () => {
        const form = await mount(fixture);
        select(form).style.setProperty('--ui-space', '10px');

        // One space of air, two arms, and one more space to the edge.
        expect(getComputedStyle(box(select(form))).paddingInlineEnd).toBe('35px');
    });

    it('sits at the end, one space in, with the second triangle beside it', async () => {
        const form = await mount(fixture);
        select(form).style.setProperty('--ui-space', '10px');

        // Two gradients, so two positions: the far triangle a space plus an arm from the
        // edge, the near one a space. An arm is three quarters of a space, which is 7.5px
        // here — and the pair is what the padding above leaves room for. The engine
        // resolves the edge-offset form into a percentage and a calc, which is what a
        // computed background-position is.
        expect(getComputedStyle(box(select(form))).backgroundPosition).toBe(
            'calc(100% - 17.5px) 50%, calc(100% - 10px) 50%',
        );
    });

    it('follows the control to the other side under rtl', async () => {
        const form = await mount(fixture);
        const ltr = getComputedStyle(box(select(form))).backgroundPosition;

        select(form).setAttribute('dir', 'rtl');
        await select(form).updateComplete;

        // Direction is the control's own, and background-position has no logical form —
        // so the one physical thing in this sheet is mirrored explicitly.
        expect(getComputedStyle(box(select(form))).backgroundPosition).not.toBe(ltr);
    });

    it('is not drawn on a list, where it would point at nothing', async () => {
        const form = await mount(`
            <ui-select label="C" name="c" multiple>
                <ui-option value="brl">Real</ui-option>
            </ui-select>
        `);

        expect(box(select(form)).multiple).toBe(true);
        expect(getComputedStyle(box(select(form))).backgroundImage).toBe('none');
    });
});

/**
 * *Every visual decision is a token* is a promise a component can quietly stop keeping.
 *
 * The assertion is the host's own act: declare the property above the component and read
 * what it rendered. A hardcoded value fails it, and so does a reference that stopped being
 * one — an invalid `var()` drops the whole declaration.
 */
describe('every visual decision it paints is a token', () => {
    it('paints the boundary and the two supporting texts from their own tokens', async () => {
        const form = await mount(`
            <ui-select label="C" name="c" help="How." error="Nope.">
                <ui-option value="brl">Real</ui-option>
            </ui-select>
        `);
        const element = select(form);
        withoutMotion(element);

        element.style.setProperty('--ui-color-danger', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-text-supporting', '19px');
        element.style.setProperty('--ui-color-text', 'rgb(4, 5, 6)');

        // Read off the control's own aria-invalid rather than a reflected attribute on the
        // host, which is the trap `ui-checkbox` measured: an empty string reflects as an
        // empty attribute, and an attribute-presence selector matches every element.
        expect(getComputedStyle(box(element)).borderTopColor, '--ui-color-danger').toBe(
            'rgb(1, 2, 3)',
        );

        const message = getComputedStyle(part(element, 'error'));
        const help = getComputedStyle(part(element, 'help'));

        expect(message.color, '--ui-color-danger').toBe('rgb(1, 2, 3)');
        expect(message.fontSize, '--ui-text-supporting').toBe('19px');
        expect(help.color, '--ui-color-text').toBe('rgb(4, 5, 6)');
        expect(help.fontSize, '--ui-text-supporting').toBe('19px');
    });

    it('takes the label colour from the host, and mutes it while unavailable', async () => {
        const form = await mount(fixture);

        select(form).style.setProperty('--ui-color-text', 'rgb(4, 5, 6)');

        expect(getComputedStyle(part(select(form), 'label')).color, '--ui-color-text').toBe(
            'rgb(4, 5, 6)',
        );

        const off = await mount(`
            <ui-select label="C" name="c" disabled>
                <ui-option value="brl">Real</ui-option>
            </ui-select>
        `);

        select(off).style.setProperty('--ui-color-text-muted', 'rgb(1, 2, 3)');

        expect(getComputedStyle(part(select(off), 'label')).color, '--ui-color-text-muted').toBe(
            'rgb(1, 2, 3)',
        );
        expect(getComputedStyle(box(select(off))).opacity).toBe('0.5');
    });
});

describe('the interaction states', () => {
    it('answers a pointer', async () => {
        const form = await mount(fixture);
        withoutMotion(select(form));

        const resting = getComputedStyle(box(select(form))).borderColor;

        await userEvent.hover(box(select(form)));

        expect(getComputedStyle(box(select(form))).borderColor).not.toBe(resting);
    });

    it('ignores a pointer while disabled', async () => {
        const form = await mount(`
            <ui-select label="C" name="c" disabled>
                <ui-option value="brl">Real</ui-option>
            </ui-select>
        `);
        withoutMotion(select(form));

        const resting = getComputedStyle(box(select(form))).borderColor;

        await userEvent.hover(box(select(form)));

        expect(getComputedStyle(box(select(form))).borderColor).toBe(resting);
        expect(getComputedStyle(box(select(form))).cursor).toBe('not-allowed');
    });

    it('takes the focus ring colour from the host', async () => {
        const form = await mount(fixture);
        select(form).style.setProperty('--ui-color-focus', 'rgb(1, 2, 3)');

        await userEvent.tab();

        expect(document.activeElement, 'tab reached the element').toBe(select(form));
        expect(getComputedStyle(box(select(form))).outlineColor).toBe('rgb(1, 2, 3)');
    });

    it('keeps a visible focus ring — removing it is how a component stops being usable', () => {
        expect(styleText('ui-select')).toContain('focus-visible');
        expect(styleText('ui-select')).toContain('outline:');
        expect(styleText('ui-select')).toContain('outline-offset:');
    });

    it('carries no readonly guard, because a select has no readonly', () => {
        // Measured rather than forgotten: readOnly is not a property of a select at all,
        // so the input's second guard would be a rule about an attribute the platform
        // never sets.
        expect(styleText('ui-select')).not.toContain(':not([readonly])');
    });

    it('guards every interaction rule against the state that refuses it', () => {
        const rules = [
            ...styleText('ui-select').matchAll(/select[a-z:()[\]-]*:hover[a-z:()[\]-]*/g),
        ];

        expect(rules.length, 'there are hover rules to check').toBeGreaterThan(0);

        for (const [rule] of rules) {
            expect(rule, rule).toContain(':not(:disabled)');
        }
    });
});

describe('accessibility', () => {
    it('has no violations as a labelled drop-down', async () => {
        await expectAccessible(await mountStory(Select, meta, 'Select'));
    });

    it('has no violations beside a text field', async () => {
        await expectAccessible(await mountStory(BesideAnInput, meta, 'BesideAnInput'));
    });

    it('has no violations with its choices under headings', async () => {
        await expectAccessible(await mountStory(Grouped, meta, 'Grouped'));
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

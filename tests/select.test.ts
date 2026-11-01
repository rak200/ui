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
import '../src/tooltip.js';
import type { UiOption, UiSelect } from '../src/select.js';
import type { UiInput } from '../src/input.js';
import { tokenStyleSheet } from '../src/tokens.js';
import { matrix, themeStyleSheet } from '../src/theme.js';

/** The markup the behavioural tests use, unless one needs a different shape. */
const fixture = `
    <ui-select label="Currency" name="currency">
        <ui-option value="brl">Real</ui-option>
        <ui-option value="usd">Dollar</ui-option>
    </ui-select>
`;

/** A list with groups, a choice already made and one that cannot be made. */
const grouped = `
    <ui-select label="Timezone" name="timezone">
        <ui-optgroup label="Americas">
            <ui-option value="sao-paulo" selected>São Paulo</ui-option>
            <ui-option value="new-york">New York</ui-option>
        </ui-optgroup>
        <ui-optgroup label="Europe">
            <ui-option value="lisbon">Lisbon</ui-option>
            <ui-option value="berlin" disabled>Berlin</ui-option>
        </ui-optgroup>
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

/**
 * The component's sheet as the engine parses it, for what no rendering here can show. This engine
 * hands the list to the page, so what the sheet draws where the system keeps the list — Firefox,
 * which keeps the base appearance behind a preference, and a pointer that does not hover — is read
 * off the sheet rather than rendered.
 */
function parsed(): readonly CSSRule[] {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styleText('ui-select'));

    return [...sheet.cssRules];
}

/** A rule at the top of the sheet, which holds whoever draws the list. */
function outside(selector: string): CSSStyleRule {
    const found = parsed().find(
        (rule): rule is CSSStyleRule =>
            rule instanceof CSSStyleRule && rule.selectorText === selector,
    );

    if (found === undefined) {
        throw new Error(`no rule for ${selector} at the top of the sheet`);
    }

    return found;
}

/** One rendered choice, by its value. */
function option(element: UiSelect, value: string): HTMLOptionElement {
    const found = box(element).querySelector<HTMLOptionElement>(`option[value='${value}']`);

    if (found === null) {
        throw new Error(`no option for ${value}`);
    }

    return found;
}

/** The caret, in the icon the base appearance gives the control. */
function icon(element: UiSelect): CSSStyleDeclaration {
    return getComputedStyle(box(element), '::picker-icon');
}

/** The list, as the base appearance's pseudo-element reports it. */
function list(element: UiSelect): CSSStyleDeclaration {
    return getComputedStyle(box(element), '::picker(select)');
}

/** Opens the list as a reader does, with the pointer. */
async function open(element: UiSelect): Promise<void> {
    await userEvent.click(box(element));

    expect(box(element).matches(':open'), 'the list is open').toBe(true);
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

/**
 * The glow a theme lights a control with, drawn around the box for the reason the input
 * draws it around its own — and compared with the input's, as the box is.
 */
describe('the glow a theme lights', () => {
    const glow = '0 0 0 1px currentColor';

    /** The box around a control that the glow is drawn on. */
    function lit(element: UiSelect | UiInput): HTMLElement {
        const found = element.renderRoot.querySelector<HTMLElement>('.glow');

        if (found === null) {
            throw new Error('the control rendered nothing to draw a glow on');
        }

        return found;
    }

    it('lights nothing by default', async () => {
        const form = await mount(fixture);

        expect(getComputedStyle(lit(select(form))).boxShadow).toBe('none');
    });

    it("lights the box in the accent, hugging it as the input's glow hugs the input", async () => {
        const form = await mount(`
            ${fixture}
            <ui-input label="Amount" name="amount"></ui-input>
        `);
        const input = form.querySelector('ui-input');

        if (input === null) {
            throw new Error('no input in the fixture');
        }

        form.style.setProperty('--ui-elevation-control', glow);
        form.style.setProperty('--ui-color-accent', 'rgb(1, 2, 3)');
        form.style.setProperty('--ui-radius', '11px');

        const drawn = getComputedStyle(lit(select(form)));
        const beside = getComputedStyle(lit(input));

        expect(drawn.boxShadow).toBe('rgb(1, 2, 3) 0px 0px 0px 1px');

        for (const property of ['display', 'borderRadius', 'color', 'boxShadow'] as const) {
            expect(drawn[property], property).toBe(beside[property]);
        }

        expect(lit(select(form)).getBoundingClientRect().toJSON()).toEqual(
            box(select(form)).getBoundingClientRect().toJSON(),
        );
    });

    it('writes the value of an invalid box in --ui-color-text-invalid', async () => {
        const form = await mount(`
            <ui-select label="Currency" error="Pick one.">
                <ui-option value="brl">Real</ui-option>
            </ui-select>
            <ui-select label="Currency">
                <ui-option value="brl">Real</ui-option>
            </ui-select>
        `);
        const [invalid, valid] = [...form.querySelectorAll('ui-select')];

        if (invalid === undefined || valid === undefined) {
            throw new Error('the fixture holds two selects');
        }

        form.style.setProperty('--ui-color-text', 'rgb(7, 8, 9)');

        expect(getComputedStyle(box(invalid)).color, 'the text, by default').toBe('rgb(7, 8, 9)');

        form.style.setProperty('--ui-color-text-invalid', 'rgb(1, 2, 3)');

        expect(getComputedStyle(box(invalid)).color, 'once a theme says').toBe('rgb(1, 2, 3)');
        expect(getComputedStyle(box(valid)).color, 'and only in error').toBe('rgb(7, 8, 9)');
    });

    it('lights an invalid box in the danger, as its boundary is', async () => {
        const form = await mount(`
            <ui-select label="Currency" error="Pick one.">
                <ui-option value="brl">Real</ui-option>
            </ui-select>
        `);

        select(form).style.setProperty('--ui-elevation-control', glow);
        select(form).style.setProperty('--ui-color-danger', 'rgb(4, 5, 6)');

        expect(getComputedStyle(lit(select(form))).boxShadow).toBe('rgb(4, 5, 6) 0px 0px 0px 1px');
    });

    it('lights nothing that cannot be used', async () => {
        const form = await mount(`
            <ui-select label="Currency" disabled>
                <ui-option value="brl">Real</ui-option>
            </ui-select>
        `);

        select(form).style.setProperty('--ui-elevation-control', glow);

        expect(getComputedStyle(lit(select(form))).boxShadow).toBe('none');
    });
});

/**
 * The caret, in the icon the base appearance gives the control, where this engine hands the list
 * to the page, and in the background where the system keeps it.
 */
describe('the caret', () => {
    it('is drawn from gradients, so its colour stays a token', async () => {
        const form = await mount(fixture);
        const image = icon(select(form)).backgroundImage;

        expect(image).toContain('linear-gradient');
        expect(image, 'a picture would freeze the colour').not.toContain('url(');
        expect(getComputedStyle(box(select(form))).backgroundImage, 'and drawn once').toBe('none');
    });

    it('takes its colour from the muted token', async () => {
        const form = await mount(fixture);
        select(form).style.setProperty('--ui-color-text-muted', 'rgb(1, 2, 3)');

        expect(icon(select(form)).backgroundImage).toContain('rgb(1, 2, 3)');
    });

    it('keeps clear of the text, by the room it actually takes', async () => {
        const form = await mount(fixture);
        select(form).style.setProperty('--ui-space', '10px');

        // One space of air, two arms, and one more space to the edge.
        expect(getComputedStyle(box(select(form))).paddingInlineEnd).toBe('35px');
    });

    it('sits at the end, one space in, a triangle at each end of the icon', async () => {
        const form = await mount(fixture);
        select(form).style.setProperty('--ui-space', '10px');

        // An arm is three quarters of a space, which is 7.5px here: the icon is two arms wide
        // and one tall, where the padding above leaves room for it.
        const drawn = icon(select(form));

        expect(drawn.position).toBe('absolute');
        expect(drawn.right).toBe('10px');
        expect(drawn.width).toBe('15px');
        expect(drawn.height).toBe('7.5px');
        expect(drawn.backgroundSize).toBe('7.5px 7.5px, 7.5px 7.5px');
        expect(drawn.backgroundPosition).toBe('0% 50%, 100% 50%');
    });

    it('follows the control to the other side under rtl', async () => {
        const form = await mount(fixture);
        select(form).style.setProperty('--ui-space', '10px');
        select(form).setAttribute('dir', 'rtl');
        await select(form).updateComplete;

        // The icon's end is logical, so it changes sides with the control's own direction.
        expect(icon(select(form)).left).toBe('10px');
    });

    it('turns over while the list is open, on the state step', async () => {
        const form = await mount(fixture);
        const element = select(form);

        element.style.setProperty('--ui-duration-state', '0.3s');
        element.style.setProperty('--ui-easing-state', 'linear');

        expect(icon(element).transition).toBe('rotate 0.3s linear');
        expect(icon(element).rotate, 'at rest').toBe('none');

        withoutMotion(element);
        await open(element);

        expect(icon(element).rotate).toBe('180deg');
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

    it('stays in the background where the system draws the list', () => {
        // Two triangles in the background, mirrored right to left, since background-position
        // has no logical form.
        const caret = outside('select:not([multiple])').style;

        expect(caret.backgroundImage).toContain('linear-gradient');
        expect(caret.backgroundImage).toContain('var(--ui-color-text-muted');
        expect(caret.backgroundPosition).toMatch(/^right /);
        expect(outside('select:not([multiple]):dir(rtl)').style.backgroundPosition).toMatch(
            /^left /,
        );
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
    it("fills the box with the controls' own fill", async () => {
        const form = await mount(fixture);
        const element = select(form);

        element.style.setProperty('--ui-color-surface-control', 'rgb(1, 2, 3, 0.2)');

        expect(getComputedStyle(box(element)).backgroundColor).toBe('rgba(1, 2, 3, 0.2)');
    });
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

    it('lets each choice paint the surface where the system draws the list', () => {
        // The system's list takes its colours from the select unless an option brings its own,
        // so a fill a host made translucent would be what that list is drawn on. This engine
        // draws the list itself, so the rule is read off the sheet.
        expect(outside('select:not([multiple]) :is(option, optgroup)').style.backgroundColor).toBe(
            'var(--ui-color-surface, #ffffff)',
        );
    });

    it("leaves a multiple select's choices to the platform, which marks a chosen one", async () => {
        // A list draws its options in the box, and the platform says which are chosen by
        // painting their background. A surface on every option would paint that out.
        const form = await mount(`
            <ui-select label="C" name="c" multiple>
                <ui-option value="brl" selected>Real</ui-option>
                <ui-option value="usd">Dollar</ui-option>
            </ui-select>
        `);
        const element = select(form);

        element.style.setProperty('--ui-color-surface', 'rgb(1, 2, 3)');

        const [chosen, other] = [...box(element).options].map(
            (option) => getComputedStyle(option).backgroundColor,
        ) as [string, string];

        expect(chosen, 'the platform marks the chosen one').not.toBe(other);
        expect(chosen, 'and nothing here paints over the mark').not.toBe('rgb(1, 2, 3)');
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

/**
 * The list the component draws where the engine hands it to the page: this engine, under a
 * pointer that hovers and is fine, which is the suite's. Each colour on it is retuned and read
 * back, as the box's are.
 */
describe('the list, where the engine hands it to the page', () => {
    it('takes the base appearance, on the control and on its list', async () => {
        const form = await mount(fixture);

        expect(getComputedStyle(box(select(form))).appearance).toBe('base-select');
        expect(list(select(form)).appearance).toBe('base-select');
    });

    it('leaves a select of several choices alone, which opens nothing', async () => {
        const form = await mount(`
            <ui-select label="C" name="c" multiple>
                <ui-option value="brl">Real</ui-option>
            </ui-select>
        `);

        expect(getComputedStyle(box(select(form))).appearance).toBe('none');
    });

    it('draws it only under the base appearance and a pointer that hovers and is fine', () => {
        // Firefox keeps the base appearance behind a preference, and a phone keeps the picker
        // it opens. Neither can be rendered here, so the condition is read off the sheet.
        const supports = parsed().filter(
            (rule): rule is CSSSupportsRule => rule instanceof CSSSupportsRule,
        );
        const [condition] = supports;
        const inside = [...(condition?.cssRules ?? [])];

        expect(supports, 'one condition').toHaveLength(1);
        expect(condition?.conditionText).toBe('(appearance: base-select)');
        expect(inside, 'and nothing under it but the pointer').toHaveLength(1);
        expect(inside[0] instanceof CSSMediaRule ? inside[0].conditionText : '').toBe(
            '(hover: hover) and (pointer: fine)',
        );
    });

    it('raises the list as the menu raises its panel', async () => {
        const form = await mount(fixture);
        const element = select(form);

        element.style.setProperty('--ui-space', '10px');
        element.style.setProperty('--ui-radius', '3px');
        element.style.setProperty('--ui-color-surface-raised', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-backdrop-raised', 'blur(4px)');
        element.style.setProperty('--ui-color-border-overlay', 'rgb(4, 5, 6)');
        element.style.setProperty('--ui-color-accent', 'rgb(7, 8, 9)');
        // A shadow in currentColor, as Matrix writes its glow, so the colour it is lit in shows.
        element.style.setProperty('--ui-elevation-raised', '0 0 0 1px currentColor');

        const drawn = list(element);

        expect(drawn.backgroundColor, '--ui-color-surface-raised').toBe('rgb(1, 2, 3)');
        expect(drawn.backdropFilter, '--ui-backdrop-raised').toBe('blur(4px)');
        expect(drawn.borderTopStyle).toBe('solid');
        expect(drawn.borderTopWidth).toBe('1px');
        expect(drawn.borderTopColor, '--ui-color-border-overlay').toBe('rgb(4, 5, 6)');
        expect(drawn.borderTopLeftRadius, '--ui-radius').toBe('3px');
        expect(drawn.boxShadow, 'lit in the accent').toBe('rgb(7, 8, 9) 0px 0px 0px 1px');
        expect(drawn.marginTop, 'half a space from the control').toBe('5px');
        expect(drawn.paddingTop, 'and half a space inside').toBe('5px');
    });

    it('lays each choice on the list, in the text', async () => {
        const form = await mount(grouped);
        const element = select(form);

        element.style.setProperty('--ui-color-text', 'rgb(1, 2, 3)');

        const other = getComputedStyle(option(element, 'new-york'));
        const heading = box(element).querySelector('optgroup');

        expect(other.backgroundColor, 'no surface of its own').toBe('rgba(0, 0, 0, 0)');
        expect(other.color, '--ui-color-text').toBe('rgb(1, 2, 3)');
        expect(heading === null ? '' : getComputedStyle(heading).backgroundColor).toBe(
            'rgba(0, 0, 0, 0)',
        );
        expect(heading === null ? '' : getComputedStyle(heading).color).toBe('rgb(1, 2, 3)');
    });

    it('draws a choice as the menu draws an item', async () => {
        const form = await mount(grouped);
        const element = select(form);

        element.style.setProperty('--ui-space', '10px');
        element.style.setProperty('--ui-radius', '3px');
        element.style.setProperty('--ui-duration-state', '0.3s');
        element.style.setProperty('--ui-easing-state', 'linear');

        const drawn = getComputedStyle(option(element, 'new-york'));

        expect(drawn.paddingTop).toBe('5px');
        expect(drawn.paddingInlineStart).toBe('10px');
        expect(drawn.columnGap, 'between the check and the text').toBe('5px');
        expect(drawn.borderTopLeftRadius).toBe('3px');
        expect(drawn.cursor).toBe('pointer');
        expect(drawn.transition).toBe('background-color 0.3s linear');
    });

    it('lights a choice under the pointer in the hover colour', async () => {
        const form = await mount(grouped);
        const element = select(form);

        withoutMotion(element);
        element.style.setProperty('--ui-color-hover', 'rgb(1, 2, 3)');

        await open(element);
        await userEvent.hover(option(element, 'new-york'));

        expect(getComputedStyle(option(element, 'new-york')).backgroundColor).toBe('rgb(1, 2, 3)');
    });

    it('rings the choice the focus is on, inside it', async () => {
        const form = await mount(grouped);
        const element = select(form);

        element.style.setProperty('--ui-color-focus', 'rgb(1, 2, 3)');

        box(element).focus();
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard('{ArrowDown}');

        const ringed = option(element, 'new-york');

        expect(ringed.matches(':focus-visible'), 'the arrow moved the focus').toBe(true);
        expect(getComputedStyle(ringed).outline).toBe('rgb(1, 2, 3) solid 2px');
        expect(getComputedStyle(ringed).outlineOffset).toBe('-2px');
    });

    it('mutes a choice that cannot be made', async () => {
        const form = await mount(grouped);
        const element = select(form);

        element.style.setProperty('--ui-color-text-muted', 'rgb(1, 2, 3)');

        const refused = getComputedStyle(option(element, 'berlin'));

        expect(refused.color).toBe('rgb(1, 2, 3)');
        expect(refused.cursor).toBe('not-allowed');
    });

    it('sets a group after the first apart with a line above it', async () => {
        const form = await mount(grouped);
        const element = select(form);

        element.style.setProperty('--ui-space', '10px');
        element.style.setProperty('--ui-color-border', 'rgb(1, 2, 3)');

        const [first, second] = [...box(element).querySelectorAll('optgroup')].map((group) =>
            getComputedStyle(group),
        );

        expect(first?.borderTopStyle, 'the first has none').toBe('none');
        expect(second?.borderTopStyle).toBe('solid');
        expect(second?.borderTopWidth).toBe('1px');
        expect(second?.borderTopColor, '--ui-color-border').toBe('rgb(1, 2, 3)');
        expect(second?.marginTop).toBe('5px');
        expect(second?.paddingTop).toBe('5px');
        expect(second?.borderBottomStyle, 'and nothing below it').toBe('none');
    });

    it("fills the choice already made, its text and its check in the fill's label", async () => {
        const form = await mount(grouped);
        const element = select(form);

        element.style.setProperty('--ui-color-selected', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-color-selected-contrast', 'rgb(4, 5, 6)');

        const chosen = option(element, 'sao-paulo');

        expect(getComputedStyle(chosen).backgroundColor, '--ui-color-selected').toBe(
            'rgb(1, 2, 3)',
        );
        expect(getComputedStyle(chosen).color, '--ui-color-selected-contrast').toBe('rgb(4, 5, 6)');
        expect(getComputedStyle(chosen, '::checkmark').color, 'its check').toBe('rgb(4, 5, 6)');
        expect(getComputedStyle(option(element, 'new-york')).backgroundColor, 'and only it').toBe(
            'rgba(0, 0, 0, 0)',
        );
    });

    it('moves the fill of the choice already made under the pointer', async () => {
        const form = await mount(grouped);
        const element = select(form);

        withoutMotion(element);
        element.style.setProperty('--ui-color-selected-hover', 'rgb(1, 2, 3)');

        await open(element);
        await userEvent.hover(option(element, 'sao-paulo'));

        expect(getComputedStyle(option(element, 'sao-paulo')).backgroundColor).toBe('rgb(1, 2, 3)');
    });

    it('rings the choice already made outside its fill, and keeps the fill where the arrows leave it', async () => {
        const form = await mount(grouped);
        const element = select(form);

        withoutMotion(element);
        element.style.setProperty('--ui-color-selected', 'rgb(1, 2, 3)');

        box(element).focus();
        await userEvent.keyboard('{Enter}');

        const chosen = option(element, 'sao-paulo');

        expect(chosen.matches(':focus-visible'), 'the list opens on the choice made').toBe(true);
        expect(getComputedStyle(chosen).outlineOffset, 'round the fill').toBe('1px');

        await userEvent.keyboard('{ArrowDown}');

        expect(getComputedStyle(chosen).backgroundColor, 'the fill stays').toBe('rgb(1, 2, 3)');
        expect(
            getComputedStyle(option(element, 'new-york')).backgroundColor,
            'and does not follow the focus',
        ).toBe('rgba(0, 0, 0, 0)');
    });

    it('chooses as the platform does, and re-dispatches the change', async () => {
        const form = await mount(grouped);
        const element = select(form);
        const changes: Event[] = [];

        element.addEventListener('change', (event) => {
            changes.push(event);
        });

        await open(element);
        await userEvent.click(option(element, 'lisbon'));

        expect(element.value).toBe('lisbon');
        expect(changes).toHaveLength(1);
        expect(box(element).matches(':open'), 'and the list closes').toBe(false);
    });

    it('closes on Escape without choosing', async () => {
        const form = await mount(grouped);
        const element = select(form);

        box(element).focus();
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard('{ArrowDown}');
        await userEvent.keyboard('{Escape}');

        expect(box(element).matches(':open')).toBe(false);
        expect(box(element).value, 'the choice is where it was').toBe('sao-paulo');
    });
});

/**
 * Forced colors puts every author colour into the reader's palette, so a choice marked by its fill
 * alone would stop being marked — for the people who turned the mode on to see states more
 * clearly.
 */
describe('the list under forced colors', () => {
    async function forcedColors(active: boolean): Promise<void> {
        await cdp().send('Emulation.setEmulatedMedia', {
            features: [{ name: 'forced-colors', value: active ? 'active' : 'none' }],
        });
    }

    afterEach(async () => {
        await forcedColors(false);
    });

    it('keeps the choice already made apart from the list, and its check apart from its fill', async () => {
        const form = await mount(grouped);
        const element = select(form);

        await forcedColors(true);

        expect(matchMedia('(forced-colors: active)').matches, 'the mode is on').toBe(true);

        // The fill names Highlight, which the mode keeps, where the accent would be forced to the
        // Canvas the list is drawn on.
        const chosen = getComputedStyle(option(element, 'sao-paulo'));

        expect(chosen.backgroundColor).not.toBe(list(element).backgroundColor);
        expect(getComputedStyle(option(element, 'sao-paulo'), '::checkmark').color).not.toBe(
            chosen.backgroundColor,
        );
    });

    it('says a choice is unavailable in a colour of its own', async () => {
        const form = await mount(grouped);
        const element = select(form);

        await forcedColors(true);

        // GrayText, where the muted text would be forced to the text every other choice has.
        expect(getComputedStyle(option(element, 'berlin')).color).not.toBe(
            getComputedStyle(option(element, 'lisbon')).color,
        );
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

/**
 * RFC 0006's handoff, on the element whose choices are the host's own declarations. The
 * protocol is graded in `description.test.ts` and the composition in `src/description.ts`;
 * what these are about is that the box takes the sentence and the choices do not.
 */
/**
 * A field's effects — RFC 0004's — which the select adopts from `src/effects.ts` under its own
 * taste name, with the one guard a select has. What each effect draws is graded on a field of the
 * suite's own in `tests/effects.test.ts`.
 */
describe("a field's effects, which the select adopts", () => {
    /** The button's drop, as the engine computes it on a light page. */
    const raised = 'rgba(0, 0, 0, 0.25) 0px 2px 4px -1px, rgba(0, 0, 0, 0.35) 0px 6px 14px -4px';

    afterEach(() => {
        // A ring still in the air lands, so nothing flies on into the next test.
        for (const flight of document.querySelector('[data-ui-ring]')?.getAnimations() ?? []) {
            flight.finish();
        }
    });

    /** The box round a field's control, which a theme's glow is drawn on and the lift moves. */
    function glow(element: HTMLElement): HTMLElement {
        const found = element.shadowRoot?.querySelector<HTMLElement>('.glow') ?? null;

        if (found === null) {
            throw new Error(`${element.tagName} rendered no box round its control`);
        }

        return found;
    }

    /** Takes every duration the effects move over out, on the region round the fixture. */
    function stilled(form: HTMLElement): void {
        form.style.setProperty('--ui-duration-effect', '0s');
        form.style.setProperty('--ui-duration-state', '0s');
    }

    /** Whether the page's ring is in the air. */
    function aloft(): boolean {
        return document.querySelector('[data-ui-ring]:popover-open') !== null;
    }

    /** The select's own control. */
    function control(form: HTMLElement): HTMLSelectElement {
        const found = form.querySelector('ui-select')?.shadowRoot?.querySelector('select') ?? null;

        if (found === null) {
            throw new Error('the fixture rendered no select');
        }

        return found;
    }

    it("draws them under the select's own taste name, and not under the input's", async () => {
        const form = await mount(fixture);
        stilled(form);
        form.style.setProperty('--ui-taste-input-focus-move', 'lift');

        await userEvent.tab();

        expect(getComputedStyle(glow(select(form))).translate, "the input's").toBe('none');

        form.style.setProperty('--ui-taste-select-focus-move', 'lift');

        expect(getComputedStyle(glow(select(form))).translate, 'its own').toBe('0px -2px');
    });

    it('raises nothing under the pointer on a select that cannot be used', async () => {
        const form = await mount(fixture.replace('<ui-select', '<ui-select disabled'));
        stilled(form);
        form.style.setProperty('--ui-motion-hover-shadow', 'raise');

        await userEvent.hover(control(form));

        expect(getComputedStyle(control(form)).boxShadow).toBe('none');
    });

    it('glides the ring from an input to the select, both of which hand it the flight', async () => {
        const form = await mount(`<ui-input label="Name"></ui-input>${fixture}`);
        form.style.setProperty('--ui-motion-focus-ring', 'glide');

        await userEvent.tab();
        await userEvent.tab();

        expect(aloft()).toBe(true);
    });

    it("answers an error and the focus under the default theme's taste: a band, a flash and the label", async () => {
        const style = document.createElement('style');
        style.textContent = tokenStyleSheet();
        document.body.append(style);
        const form = await mount(fixture.replace('<ui-select', '<ui-select error="Pick one."'));
        stilled(form);

        expect(getComputedStyle(glow(select(form)), '::before').animationName, 'the pulse').toBe(
            'ui-pulse-danger',
        );
        expect(getComputedStyle(control(form)).animationName, "the flash, its list's second").toBe(
            'none, ui-flash',
        );

        const label = select(form).shadowRoot?.querySelector('label') ?? null;

        if (label === null) {
            throw new Error('the select rendered no label');
        }

        const resting = getComputedStyle(label).color;

        await userEvent.tab();

        expect(getComputedStyle(label).color, 'the label at the focus').not.toBe(resting);
    });

    it("tints the select at the focus under Matrix, the field's own where the page names the highlight", async () => {
        const style = document.createElement('style');
        style.textContent = tokenStyleSheet() + themeStyleSheet(matrix);
        document.body.append(style);
        const form = await mount(fixture);
        stilled(form);
        form.dataset['uiTheme'] = matrix.name;

        const fill = getComputedStyle(control(form)).backgroundColor;

        await userEvent.tab();

        expect(getComputedStyle(control(form)).backgroundColor).not.toBe(fill);

        for (const flight of document.querySelector('[data-ui-ring]')?.getAnimations() ?? []) {
            flight.finish();
        }
    });

    it("raises the select under the pointer, and raises and lifts it at the focus, under the default theme's taste", async () => {
        const style = document.createElement('style');
        style.textContent = tokenStyleSheet();
        document.body.append(style);
        const form = await mount(fixture);
        stilled(form);

        await userEvent.hover(control(form));

        expect(getComputedStyle(control(form)).boxShadow, 'under the pointer').toBe(raised);

        await userEvent.tab();

        expect(getComputedStyle(control(form)).boxShadow, 'at the focus').toBe(raised);
        expect(getComputedStyle(glow(select(form))).translate, 'lifted').toBe('0px -2px');
    });
});

describe('the description a tooltip hands over', () => {
    /** Dispatches the handoff the way `<ui-tooltip>` does, and reports whether it was taken. */
    function hand(element: UiSelect, detail: unknown): boolean {
        return !element.dispatchEvent(new CustomEvent('ui-describe', { detail, cancelable: true }));
    }

    /** The clipped node the control's `aria-describedby` has to resolve to. */
    function carrier(element: UiSelect): HTMLElement | null {
        return element.renderRoot.querySelector<HTMLElement>('#description');
    }

    const sentence = 'What the amounts below are quoted in.';

    it('describes the box, and announces the three in the order a reader needs them', async () => {
        const form = await mount(`
            <ui-select label="Currency" name="currency" help="Affects every total.">
                <ui-option value="brl">Real</ui-option>
            </ui-select>
        `);
        const element = select(form);

        expect(box(element).getAttribute('aria-describedby'), 'the help alone').toBe('help');

        expect(hand(element, sentence), 'taken').toBe(true);
        await settled(element);

        expect(box(element).getAttribute('aria-describedby')).toBe('help description');

        element.error = 'Pick a currency.';
        await settled(element);

        expect(box(element).getAttribute('aria-describedby')).toBe('error help description');
        expect(carrier(element)?.textContent).toBe(sentence);
    });

    it('leaves the choices undescribed, which is where a reader is not', async () => {
        // A description on an `<option>` is announced only while that option is the one
        // under the cursor. The instruction is about the field, so it rides on the box.
        const form = await mount(fixture);
        const element = select(form);

        hand(element, sentence);
        await settled(element);

        for (const option of element.renderRoot.querySelectorAll('option')) {
            expect(option.hasAttribute('aria-describedby'), option.value).toBe(false);
        }
    });

    it('keeps the carrier out of the control, which takes options and nothing else', async () => {
        // A `<slot>` inside a `<select>` assigns its nodes and the select sees none of
        // them, measured — so anything in there is a node the platform would ignore.
        const form = await mount(fixture);
        const element = select(form);

        hand(element, sentence);
        await settled(element);

        const node = carrier(element);

        expect(node).not.toBeNull();
        expect(box(element).contains(node), 'beside the box, not inside it').toBe(false);
    });

    it('takes the description away when the sentence is withdrawn', async () => {
        const form = await mount(fixture);
        const element = select(form);

        hand(element, sentence);
        await settled(element);

        expect(hand(element, ''), 'the withdrawal is taken too').toBe(true);
        await settled(element);

        expect(box(element).hasAttribute('aria-describedby')).toBe(false);
        expect(carrier(element)).toBeNull();
    });

    it('leaves a payload that is not a sentence unclaimed', async () => {
        const form = await mount(fixture);
        const element = select(form);

        expect(hand(element, 42)).toBe(false);
        await settled(element);

        expect(box(element).hasAttribute('aria-describedby')).toBe(false);
    });

    it('arrives from a real tooltip, and is not painted beside the tip', async () => {
        const form = await mount(`
            <ui-tooltip>
                <ui-select label="Currency" name="currency">
                    <ui-option value="brl">Real</ui-option>
                </ui-select>
                <span slot="tip">What the amounts below are quoted in.</span>
            </ui-tooltip>
        `);
        const element = select(form);

        expect(box(element).getAttribute('aria-describedby')).toBe('description');

        const clip = carrier(element)?.getBoundingClientRect();

        expect(clip?.width, 'the tip is already showing it').toBeLessThanOrEqual(1);

        await expectAccessible(form);
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

    it('has no violations with its list open', async () => {
        const form = await mount(grouped);

        await userEvent.click(box(select(form)));

        expect(box(select(form)).matches(':open'), 'the list is open').toBe(true);
        await expectAccessible(form);
    });
});

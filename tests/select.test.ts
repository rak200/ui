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

    it('agrees on the frame around it, which ui-field used to own', async () => {
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

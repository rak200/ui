import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
// The playwright provider is what puts `send` on `CDPSession` — see `button.test.ts`,
// which needs the same line for the same reason.
import type {} from '@vitest/browser-playwright';
import { expectAccessible } from './a11y.js';
import { pointTo } from './pointing.js';
import { mountStory } from './stories.js';
import meta, {
    Action,
    Affixes,
    Constrained,
    Tools,
    Disabled,
    Invalid,
    Multiline,
    Text,
} from '../stories/input.stories.js';
import '../src/input.js';
import '../src/tooltip.js';
import type { UiInput, UiTextarea } from '../src/input.js';
import { tokenStyleSheet } from '../src/tokens.js';
import { kept } from '../src/state.js';
import { glass, matrix, themeStyleSheet, type Theme } from '../src/theme.js';

/** Either element, since almost everything under test is the pair's rather than one's. */
type Field = UiInput | UiTextarea;

/** The markup the behavioural tests use, unless one needs a different shape. */
const fixture =
    '<ui-input label="Amount" help="In BRL, two decimals." name="amount" placeholder="0,00"></ui-input>';

/** Mounts a fixture inside a form and waits for the first render. */
async function mount(markup: string): Promise<HTMLFormElement> {
    const form = document.createElement('form');
    form.innerHTML = markup;
    document.body.append(form);

    for (const element of form.querySelectorAll<Field>('ui-input, ui-textarea')) {
        await element.updateComplete;
    }

    return form;
}

/** The element under test, which is now the control rather than a box around one. */
function field(form: HTMLFormElement): Field {
    // The tag map resolves a single tag name, not a list, so the union is named here.
    const element = form.querySelector<Field>('ui-input, ui-textarea');

    if (element === null) {
        throw new Error('no field in the fixture');
    }

    return element;
}

/** The fieldset a fixture holds its field in. */
function fieldset(form: HTMLFormElement): HTMLFieldSetElement {
    const element = form.querySelector('fieldset');

    if (element === null) {
        throw new Error('no fieldset in the fixture');
    }

    return element;
}

/** The rendered control, which is what every drawing assertion is about. */
function box(element: Field): HTMLInputElement | HTMLTextAreaElement {
    const control = element.renderRoot.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        'input, textarea',
    );

    if (control === null) {
        throw new Error('the field rendered no control');
    }

    return control;
}

/** One of the exposed parts, which is how a host reaches anything in here. */
function part(element: Field, name: string): HTMLElement {
    const found = element.renderRoot.querySelector<HTMLElement>(`[part='${name}']`);

    if (found === null) {
        throw new Error(`no part named ${name}`);
    }

    return found;
}

/**
 * Takes the motion out, flushed, so that a colour read is the destination rather than
 * whichever frame of a 150ms interpolation the read landed on.
 *
 * The duration is the host's own knob, and flushing between setting it and changing the
 * colour is not optional: both in one recalculation and the transition starts under the
 * duration that was in force before it.
 */
function withoutMotion(element: Field): void {
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

/**
 * The shape RFC 0005 decided: the control, its label, its help and its message rendered
 * together, so every end of every relationship shares one tree scope.
 */
describe('the control and its frame, in one tree scope', () => {
    it('registers both elements', () => {
        expect(customElements.get('ui-input')).toBeDefined();
        expect(customElements.get('ui-textarea')).toBeDefined();
    });

    it('renders the control, leaving the host nothing to write', async () => {
        const form = await mount(fixture);

        expect(form.querySelector('input'), 'nothing in the light DOM').toBeNull();
        expect(box(field(form)).tagName).toBe('INPUT');
    });

    it('names it with a label that points at it, which resolves in the same root', async () => {
        const form = await mount(fixture);
        const label = part(field(form), 'label');

        expect(label.tagName).toBe('LABEL');
        expect(box(field(form)).labels?.[0]).toBe(label);
        expect(label.textContent).toBe('Amount');
    });

    it('describes it by the help text, and by the message before it in error', async () => {
        const form = await mount(fixture);

        expect(box(field(form)).getAttribute('aria-describedby')).toBe('help');

        field(form).error = 'Amount is required.';
        await field(form).updateComplete;

        // The error comes first: a reader needs to know what is wrong before reading how
        // the value should look. And the help is not replaced by it — help text is usually
        // the format requirement, which is the suggestion needed in order to recover.
        expect(box(field(form)).getAttribute('aria-describedby')).toBe('error help');
    });

    it('describes it by nothing when there is nothing to say', async () => {
        const form = await mount('<ui-input label="Amount" name="amount"></ui-input>');

        expect(box(field(form)).hasAttribute('aria-describedby')).toBe(false);
        expect(box(field(form)).hasAttribute('aria-invalid')).toBe(false);
        expect(field(form).shadowRoot?.querySelector('[part="help"]')).toBeNull();
        expect(field(form).shadowRoot?.querySelector('[part="error"]')).toBeNull();
    });

    it('starts as a text field with nothing written on it', async () => {
        const form = await mount('<ui-input></ui-input>');
        const element = field(form) as UiInput;

        expect(element.label, 'no label until a host writes one').toBe('');
        expect(part(element, 'label').textContent).toBe('');
        // `type=""` is not an empty type: the platform reads any unknown value as text, so
        // the control cannot show the difference and the property is where it is visible.
        expect(element.type, 'the type a host did not name').toBe('text');
        expect(box(element).getAttribute('type')).toBe('text');
    });

    it('writes no attribute it was given nothing for', async () => {
        // An empty attribute is not a neutral one, which is the whole reason for the rule:
        // `pattern=""` is the empty expression and matches only the empty string, so a
        // field carrying it would be invalid for every value a person can type. Measured.
        const form = await mount('<ui-input label="Amount" name="amount" value="ok"></ui-input>');

        expect(box(field(form)).getAttributeNames().sort()).toEqual(['id', 'name', 'part', 'type']);
        expect(field(form).validity.valid, 'and so it is valid').toBe(true);
    });

    it('writes the ones it was given', async () => {
        const form = await mount(
            '<ui-input label="A" name="a" type="number" placeholder="0" autocomplete="off" inputmode="decimal" pattern="[0-9]*" minlength="1" maxlength="4" min="10" max="20" step="5" required readonly></ui-input>',
        );
        const control = box(field(form));

        expect(control.getAttribute('type')).toBe('number');
        expect(control.getAttribute('placeholder')).toBe('0');
        expect(control.getAttribute('autocomplete')).toBe('off');
        expect(control.getAttribute('inputmode')).toBe('decimal');
        expect(control.getAttribute('pattern')).toBe('[0-9]*');
        expect(control.getAttribute('minlength')).toBe('1');
        expect(control.getAttribute('maxlength')).toBe('4');
        expect(control.getAttribute('min')).toBe('10');
        expect(control.getAttribute('max')).toBe('20');
        expect(control.getAttribute('step')).toBe('5');
        expect(control.required).toBe(true);
        expect(control.readOnly).toBe(true);
    });

    it('reflects what a host would style or read back, and not the live value', async () => {
        const form = await mount(fixture);
        const element = field(form);

        element.label = 'Total';
        element.help = 'Two decimals.';
        element.error = 'Nope.';
        element.name = 'total';
        element.placeholder = '0';
        element.value = 'typed';
        element.required = true;
        element.disabled = true;
        element.readonly = true;
        await element.updateComplete;

        expect(element.getAttribute('label')).toBe('Total');
        expect(element.getAttribute('help')).toBe('Two decimals.');
        expect(element.getAttribute('error')).toBe('Nope.');
        expect(element.getAttribute('name')).toBe('total');
        expect(element.getAttribute('placeholder')).toBe('0');
        expect(element.hasAttribute('required')).toBe(true);
        expect(element.hasAttribute('disabled')).toBe(true);
        expect(element.hasAttribute('readonly')).toBe(true);
        // The content attribute is the *default* a reset returns to, and one that followed
        // every keystroke would make the default whatever was last typed.
        expect(element.hasAttribute('value'), 'value is the default, not the state').toBe(false);
    });

    it('reflects the pass-through set too, which is what makes it a declared API', async () => {
        // Written as properties on purpose. An attribute reaches its property without any
        // reflection at all, so a test that only writes markup passes on a component that
        // reflects nothing — and what a host reads back, and what a stylesheet selects on,
        // is the attribute.
        const form = await mount(fixture);
        const element = field(form) as UiInput;

        element.type = 'number';
        element.autocomplete = 'off';
        element.inputmode = 'decimal';
        element.pattern = '[0-9]*';
        element.minlength = '1';
        element.maxlength = '4';
        element.min = '10';
        element.max = '20';
        element.step = '5';
        await element.updateComplete;

        expect(element.getAttribute('type')).toBe('number');
        expect(element.getAttribute('autocomplete')).toBe('off');
        expect(element.getAttribute('inputmode')).toBe('decimal');
        expect(element.getAttribute('pattern')).toBe('[0-9]*');
        expect(element.getAttribute('minlength')).toBe('1');
        expect(element.getAttribute('maxlength')).toBe('4');
        expect(element.getAttribute('min')).toBe('10');
        expect(element.getAttribute('max')).toBe('20');
        expect(element.getAttribute('step')).toBe('5');
    });

    it('fills the line it is given', async () => {
        const form = await mount(fixture);

        expect(getComputedStyle(field(form)).display).toBe('block');
        expect(getComputedStyle(box(field(form))).inlineSize).toBe(
            getComputedStyle(field(form)).inlineSize,
        );
    });
});

/**
 * The element joins the form, because the control cannot: an `<input>` in a shadow root has
 * no form owner. Everything here is `ElementInternals` paying that back.
 */
describe('the form, which the element joins in the place of the control', () => {
    it('submits under its name', async () => {
        const form = await mount(fixture);
        field(form).value = 'sent';
        await field(form).updateComplete;

        expect([...new FormData(form)]).toEqual([['amount', 'sent']]);
    });

    it('takes the name from a property, because a form reads the attribute', async () => {
        // The failure this is here for is silent: a form-associated custom element's entry
        // is named from the content attribute, so a name set only as a property submits
        // nothing at all while every other sign says the control is participating.
        const form = await mount('<ui-input label="Amount"></ui-input>');
        field(form).name = 'amount';
        field(form).value = 'sent';
        await field(form).updateComplete;

        expect([...new FormData(form)]).toEqual([['amount', 'sent']]);
    });

    it('starts with no name and submits nothing at all', async () => {
        const form = await mount('<ui-input label="Amount" value="sent"></ui-input>');

        expect([...new FormData(form)]).toEqual([]);
    });

    it('submits nothing while disabled, which is what a native control does', async () => {
        const form = await mount('<ui-input label="A" name="a" value="x" disabled></ui-input>');

        expect([...new FormData(form)]).toEqual([]);
    });

    it('knows the form it is in', async () => {
        const form = await mount(fixture);

        expect(field(form).form).toBe(form);
    });

    it('resets to the attribute, which is the default rather than what was typed', async () => {
        const form = await mount(`
            <ui-input label="Empty" name="a"></ui-input>
            <ui-input label="Filled" name="b" value="start"></ui-input>
        `);
        const [empty, filled] = [...form.querySelectorAll<UiInput>('ui-input')] as [
            UiInput,
            UiInput,
        ];

        empty.value = 'typed';
        filled.value = 'typed';
        await Promise.all([empty.updateComplete, filled.updateComplete]);

        form.reset();
        await Promise.all([empty.updateComplete, filled.updateComplete]);

        expect([empty.value, filled.value]).toEqual(['', 'start']);
    });

    it.each(['ui-input', 'ui-textarea'])(
        'is disabled by a fieldset above it and enabled with it again, a %s, its attribute untouched',
        async (tag) => {
            const form = await mount(
                `<fieldset disabled><${tag} label="A" name="a" value="1"></${tag}></fieldset>`,
            );
            const element = field(form);
            element.style.setProperty('--ui-color-text-muted', 'rgb(1, 2, 3)');

            expect(box(element).disabled, 'the control refuses interaction').toBe(true);
            expect(element.matches(':disabled'), 'the platform holds it disabled').toBe(true);
            expect(element.disabled, 'its own state stays its own, as on a native one').toBe(false);
            expect(element.hasAttribute('disabled'), 'and so does the attribute').toBe(false);
            expect(getComputedStyle(part(element, 'label')).color, 'muted').toBe('rgb(1, 2, 3)');
            expect([...new FormData(form)], 'nothing submitted').toEqual([]);

            fieldset(form).disabled = false;
            await element.updateComplete;

            expect(box(element).disabled, 'enabled again').toBe(false);
            expect(getComputedStyle(part(element, 'label')).color, 'no more').not.toBe(
                'rgb(1, 2, 3)',
            );
            expect([...new FormData(form)], 'and submitted').toEqual([['a', '1']]);

            fieldset(form).disabled = true;
            await element.updateComplete;

            expect(box(element).disabled, 'and disabled again').toBe(true);
        },
    );

    it('stays disabled by its own attribute through a fieldset disabled and enabled', async () => {
        const form = await mount('<fieldset><ui-input label="A" name="a"></ui-input></fieldset>');
        const element = field(form);

        element.disabled = true;
        await element.updateComplete;

        expect(box(element).disabled, 'in the update a script started').toBe(true);

        fieldset(form).disabled = true;
        await element.updateComplete;
        fieldset(form).disabled = false;
        await element.updateComplete;

        expect(element.hasAttribute('disabled'), 'the attribute it was given').toBe(true);
        expect(box(element).disabled, 'and the control refusing').toBe(true);

        element.disabled = false;
        await element.updateComplete;

        expect(box(element).disabled, 'until it is enabled itself').toBe(false);
    });

    it('restores what a back-navigation hands back, where it saved that itself', async () => {
        const form = await mount(fixture);

        field(form).formStateRestoreCallback(kept(field(form), 'kept'));
        await field(form).updateComplete;

        expect(field(form).value).toBe('kept');
        expect(box(field(form)).value, 'and shows it').toBe('kept');

        field(form).formStateRestoreCallback(kept(field(form), ''));
        await field(form).updateComplete;

        expect(field(form).value, 'an empty value is one too').toBe('');
    });

    it('saves the state it restores from, the value it holds', async () => {
        const form = await mount(fixture);
        const saving = vi.spyOn(ElementInternals.prototype, 'setFormValue');

        field(form).value = '12';
        await field(form).updateComplete;
        const state: unknown = saving.mock.lastCall?.[1];
        saving.mockRestore();

        field(form).value = 'changed';
        await field(form).updateComplete;
        field(form).formStateRestoreCallback(state);
        await field(form).updateComplete;

        expect(field(form).value).toBe('12');
    });

    it('refuses a state another element saved, which Firefox hands over', async () => {
        const form = await mount('<ui-input label="Amount" name="amount" value="12"></ui-input>');

        for (const [which, state] of [
            [
                'another kind of field, of the same name',
                kept({ localName: 'ui-checkbox', name: 'amount' }, 'true'),
            ],
            ['the same kind, of another name', kept({ localName: 'ui-input', name: 'note' }, 'on')],
            ['the bare value an older version saved', 'on'],
            ['nothing at all', null],
            ['no text, as some other element may save', new FormData()],
        ] as const) {
            field(form).formStateRestoreCallback(state);
            await field(form).updateComplete;

            expect(field(form).value, which).toBe('12');
        }
    });

    it('mirrors what was typed, and lets both events out', async () => {
        // `input` is composed and leaves the shadow root retargeted on its own; `change`
        // is not, so the one the control fires stops at the boundary and is re-dispatched.
        const form = await mount(fixture);
        const heard: string[] = [];
        const targets: (EventTarget | null)[] = [];

        for (const type of ['input', 'change']) {
            form.addEventListener(type, (event) => {
                heard.push(event.type);
                targets.push(event.target);
            });
        }

        await userEvent.fill(box(field(form)), 'typed');
        box(field(form)).blur();

        expect(field(form).value, 'mirrored back into the property').toBe('typed');
        expect(heard).toEqual(['input', 'change']);
        expect(new Set(targets), 'retargeted to the element').toEqual(new Set([field(form)]));
    });
});

/**
 * Constraint validation moved here with the value — but it is not reimplemented here. The
 * control still computes its own, and this element hands the answer on.
 */
describe('the validity', () => {
    it('is the platform own validity, forwarded whole', async () => {
        const form = await mount(
            '<ui-input label="Email" name="email" type="email" value="nope"></ui-input>',
        );

        expect(field(form).validity.typeMismatch, 'a type the platform knows').toBe(true);
        // The message is the engine's rather than one written here, which is the point:
        // nothing in this package decides what a bad email address should say.
        expect(field(form).validationMessage).toContain('@');
        expect(form.checkValidity()).toBe(false);
    });

    it('follows the constraints the host declared', async () => {
        const form = await mount(
            '<ui-input label="Q" name="q" type="number" min="10" value="3"></ui-input>',
        );

        expect(field(form).validity.rangeUnderflow).toBe(true);

        field(form).value = '12';
        await field(form).updateComplete;

        expect(field(form).validity.valid).toBe(true);
        expect(field(form).matches(':valid')).toBe(true);
    });

    it('is missing while a required field is empty', async () => {
        const form = await mount('<ui-input label="A" name="a" required></ui-input>');

        expect(field(form).validity.valueMissing).toBe(true);
        expect(field(form).matches(':invalid')).toBe(true);
    });

    it('takes the message the host wrote, which wins over the one the platform writes', async () => {
        const form = await mount('<ui-input label="A" name="a" required error="Nope."></ui-input>');

        expect(field(form).validity.customError).toBe(true);
        expect(field(form).validity.valueMissing, 'the host said it first').toBe(false);
        expect(field(form).validationMessage).toBe('Nope.');
    });

    it('drops the message when the host takes it back', async () => {
        const form = await mount('<ui-input label="A" name="a" error="Nope."></ui-input>');
        field(form).error = '';
        await field(form).updateComplete;

        expect(field(form).validity.valid).toBe(true);
        expect(field(form).validationMessage).toBe('');
    });

    it('blocks a submit while invalid, and allows one once it is not', async () => {
        const form = await mount('<ui-input label="A" name="a" required></ui-input>');
        let submits = 0;

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            submits += 1;
        });

        form.requestSubmit();

        expect(submits, 'the platform stopped it').toBe(0);

        field(form).value = 'x';
        await field(form).updateComplete;
        form.requestSubmit();

        expect(submits).toBe(1);
    });

    it('delegates focus, so the browser can put the reader on the control', async () => {
        const form = await mount('<ui-input label="A" name="a" required></ui-input>');

        expect(form.reportValidity()).toBe(false);
        expect(document.activeElement).toBe(field(form));
        expect(field(form).shadowRoot?.activeElement).toBe(box(field(form)));

        // And the plain call, which is the half `reportValidity()` does not measure: the
        // browser focuses the anchor `setValidity` was given whether or not focus is
        // delegated, so only `focus()` on the host tells the two apart. Without the
        // delegation it lands on nothing, because the host is not a focusable element.
        box(field(form)).blur();

        expect(document.activeElement, 'the focus is off it').not.toBe(field(form));

        field(form).focus();

        expect(document.activeElement, 'and back on it by hand').toBe(field(form));
        expect(field(form).shadowRoot?.activeElement).toBe(box(field(form)));
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
    it("takes its fill from the controls' own, which a theme may set apart from the surface", async () => {
        const form = await mount(fixture);
        const element = field(form);

        element.style.setProperty('--ui-color-surface-control', 'rgb(1, 2, 3)');

        expect(getComputedStyle(box(element)).backgroundColor).toBe('rgb(1, 2, 3)');
    });
    it('takes its shape, its surface and its type from the host', async () => {
        const form = await mount(fixture);
        const element = field(form);

        element.style.setProperty('--ui-radius', '11px');
        element.style.setProperty('--ui-space', '9px');
        element.style.setProperty('--ui-color-surface', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-color-text', 'rgb(4, 5, 6)');
        element.style.setProperty('--ui-font', 'Courier');

        const styles = getComputedStyle(box(element));

        expect(styles.borderRadius, '--ui-radius').toBe('11px');
        expect(styles.padding, '--ui-space').toBe('9px');
        expect(styles.backgroundColor, '--ui-color-surface').toBe('rgb(1, 2, 3)');
        expect(styles.color, '--ui-color-text').toBe('rgb(4, 5, 6)');
        expect(styles.fontFamily, '--ui-font').toBe('Courier');

        const label = getComputedStyle(part(element, 'label'));

        expect(label.color, 'the label too').toBe('rgb(4, 5, 6)');
        // The label has no family of its own, so this is `:host`'s rule and only that one.
        expect(label.fontFamily, 'and the family it inherits').toBe('Courier');
    });

    it('keeps the control on the token when the host writes a family of its own', async () => {
        // `:host` sets the family and the control's `font: inherit` would carry it down on
        // its own — so the control's *own* declaration only shows up where the two
        // disagree, which is a host writing `font-family` on the element. Without it the
        // control follows that instead of the token, and a kit stops being one thing.
        const form = await mount(fixture);
        const element = field(form);

        element.style.setProperty('--ui-font', 'Courier');
        element.style.fontFamily = 'Georgia';

        expect(getComputedStyle(box(element)).fontFamily, 'the control keeps the token').toBe(
            'Courier',
        );
        expect(
            getComputedStyle(part(element, 'label')).fontFamily,
            'and the label follows the host',
        ).toBe('Georgia');
    });

    it('takes the boundary from the host', async () => {
        const form = await mount(fixture);
        withoutMotion(field(form));
        field(form).style.setProperty('--ui-color-border', 'rgb(1, 2, 3)');

        expect(getComputedStyle(box(field(form))).borderTopColor).toBe('rgb(1, 2, 3)');
    });

    it('takes the placeholder colour from the host, at full opacity', async () => {
        const form = await mount(fixture);
        field(form).style.setProperty('--ui-color-text-muted', 'rgb(1, 2, 3)');

        const styles = getComputedStyle(box(field(form)), '::placeholder');

        expect(styles.color, '--ui-color-text-muted').toBe('rgb(1, 2, 3)');
        // Firefox lowers a placeholder's opacity by default, which would take the colour
        // below the 4.5:1 it was chosen to clear.
        expect(styles.opacity).toBe('1');
    });

    it('takes the focus ring colour from the host', async () => {
        const form = await mount(fixture);
        field(form).style.setProperty('--ui-color-focus', 'rgb(1, 2, 3)');

        await userEvent.tab();

        expect(document.activeElement, 'tab reached the element').toBe(field(form));
        expect(getComputedStyle(box(field(form))).outlineColor).toBe('rgb(1, 2, 3)');
    });

    it('paints the boundary and the two supporting texts from their own tokens', async () => {
        const form = await mount(
            '<ui-input label="A" name="a" help="How." error="Nope."></ui-input>',
        );
        const element = field(form);

        element.style.setProperty('--ui-color-danger', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-text-supporting', '19px');
        element.style.setProperty('--ui-color-text', 'rgb(4, 5, 6)');

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

    it('mutes the label while the control is unavailable', async () => {
        const form = await mount('<ui-input label="A" name="a" disabled></ui-input>');
        field(form).style.setProperty('--ui-color-text-muted', 'rgb(1, 2, 3)');

        expect(getComputedStyle(part(field(form), 'label')).color).toBe('rgb(1, 2, 3)');
        expect(getComputedStyle(box(field(form))).opacity).toBe('0.5');
    });

    it('stacks the frame half a space apart', async () => {
        const form = await mount(fixture);
        field(form).style.setProperty('--ui-space', '10px');

        expect(getComputedStyle(part(field(form), 'stack')).rowGap).toBe('5px');
    });

    it('keeps a visible focus ring — removing it is how a component stops being usable', () => {
        for (const tag of ['ui-input', 'ui-textarea']) {
            expect(styleText(tag), tag).toContain('focus-visible');
            expect(styleText(tag), tag).toContain('outline:');
            expect(styleText(tag), tag).toContain('outline-offset:');
        }
    });
});

/**
 * The glow a theme lights a control with, drawn around the control rather than on it: a
 * theme writes it in `currentColor`, and the control's own colour is its text.
 */
describe('the glow a theme lights', () => {
    const glow = '0 0 0 1px currentColor';
    const tags = ['ui-input', 'ui-textarea'] as const;

    /** The box around the control that the glow is drawn on. */
    function lit(element: Field): HTMLElement {
        const found = element.renderRoot.querySelector<HTMLElement>('.glow');

        if (found === null) {
            throw new Error('the field rendered nothing to draw a glow on');
        }

        return found;
    }

    it.each(tags)('lights nothing around a %s by default', async (tag) => {
        const form = await mount(`<${tag} label="Notes"></${tag}>`);

        expect(getComputedStyle(lit(field(form))).boxShadow).toBe('none');
    });

    it.each(tags)('lights a %s in the accent, hugging its boundary', async (tag) => {
        const form = await mount(`<${tag} label="Notes"></${tag}>`);
        const element = field(form);

        element.style.setProperty('--ui-elevation-control', glow);
        element.style.setProperty('--ui-color-accent', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-color-text', 'rgb(7, 8, 9)');
        element.style.setProperty('--ui-radius', '11px');

        expect(getComputedStyle(lit(element)).boxShadow).toBe('rgb(1, 2, 3) 0px 0px 0px 1px');
        // The control's size and corner, so the glow sits against the boundary.
        expect(lit(element).getBoundingClientRect().toJSON()).toEqual(
            box(element).getBoundingClientRect().toJSON(),
        );
        expect(getComputedStyle(lit(element)).borderRadius).toBe('11px');
        // And the accent reaches no text: the control writes its own.
        expect(getComputedStyle(box(element)).color).toBe('rgb(7, 8, 9)');
    });

    it.each(tags)('writes the value of an invalid %s in --ui-color-text-invalid', async (tag) => {
        const form = await mount(`<${tag} label="Notes" error="Write something."></${tag}>`);
        const element = field(form);

        element.style.setProperty('--ui-color-text', 'rgb(7, 8, 9)');

        expect(getComputedStyle(box(element)).color, 'the text, by default').toBe('rgb(7, 8, 9)');

        element.style.setProperty('--ui-color-text-invalid', 'rgb(1, 2, 3)');

        expect(getComputedStyle(box(element)).color, 'once a theme says').toBe('rgb(1, 2, 3)');
    });

    it.each(tags)('leaves the value of a valid %s in the text', async (tag) => {
        const form = await mount(`<${tag} label="Notes"></${tag}>`);
        const element = field(form);

        element.style.setProperty('--ui-color-text', 'rgb(7, 8, 9)');
        element.style.setProperty('--ui-color-text-invalid', 'rgb(1, 2, 3)');

        expect(getComputedStyle(box(element)).color).toBe('rgb(7, 8, 9)');
    });

    it.each(tags)('lights an invalid %s in the danger, as its boundary is', async (tag) => {
        const form = await mount(`<${tag} label="Notes" error="Write something."></${tag}>`);
        const element = field(form);

        element.style.setProperty('--ui-elevation-control', glow);
        element.style.setProperty('--ui-color-danger', 'rgb(4, 5, 6)');

        expect(getComputedStyle(lit(element)).boxShadow).toBe('rgb(4, 5, 6) 0px 0px 0px 1px');
    });

    it.each(tags)('lights nothing around a %s that cannot be used', async (tag) => {
        const form = await mount(`<${tag} label="Notes" disabled></${tag}>`);

        field(form).style.setProperty('--ui-elevation-control', glow);

        expect(getComputedStyle(lit(field(form))).boxShadow).toBe('none');
    });
});

describe('ui-textarea', () => {
    const fixture = '<ui-textarea label="Notes" name="notes"></ui-textarea>';

    it('renders a textarea, and takes the same box', async () => {
        const form = await mount(`${fixture}<ui-input label="A" name="a"></ui-input>`);
        const [notes, amount] = [...form.querySelectorAll<Field>('ui-textarea, ui-input')] as [
            UiTextarea,
            UiInput,
        ];

        expect(box(notes).tagName).toBe('TEXTAREA');

        const drawn = getComputedStyle(box(notes));
        const beside = getComputedStyle(box(amount));

        for (const property of [
            'borderTopWidth',
            'borderTopStyle',
            'borderTopColor',
            'borderRadius',
            'padding',
            'backgroundColor',
            'color',
            'fontFamily',
        ] as const) {
            expect(drawn[property], property).toBe(beside[property]);
        }
    });

    it('adds the rules that differ: it grows, by its height alone, from a least height', async () => {
        const form = await mount(fixture);
        const styles = getComputedStyle(box(field(form)));

        expect(styles.getPropertyValue('field-sizing')).toBe('content');
        // One that grows sideways breaks the layout around it.
        expect(styles.resize).toBe('vertical');

        field(form).style.setProperty('--ui-space', '10px');

        expect(getComputedStyle(box(field(form))).minBlockSize).toBe('100px');
    });

    /** Text of so many lines, each a word or two. */
    function lines(count: number): string {
        return Array.from({ length: count }, (_, line) => `line ${String(line + 1)}`).join('\n');
    }

    it('grows with its text past its least height, with nothing to scroll', async () => {
        const form = await mount(fixture);
        const element = field(form);
        const control = box(element);

        element.style.setProperty('--ui-space', '10px');

        expect(control.getBoundingClientRect().height, 'empty, at its least height').toBe(100);

        element.value = lines(12);
        await element.updateComplete;

        expect(control.getBoundingClientRect().height).toBeGreaterThan(100);
        expect(control.scrollHeight, 'all of the text in sight').toBe(control.clientHeight);
    });

    it('starts at the rows it was given, and grows past them as its text does', async () => {
        const form = await mount(
            '<ui-textarea label="Notes" name="notes" rows="12"></ui-textarea>',
        );
        const element = field(form);
        const control = box(element);

        element.style.setProperty('--ui-space', '10px');

        const empty = control.getBoundingClientRect().height;

        expect(empty, 'twelve rows ask for more than the least height').toBeGreaterThan(100);

        element.value = lines(12);
        await element.updateComplete;

        expect(control.getBoundingClientRect().height, 'twelve lines fill them').toBeCloseTo(
            empty,
            0,
        );

        element.value = lines(13);
        await element.updateComplete;

        expect(control.getBoundingClientRect().height, 'and a thirteenth grows it').toBeGreaterThan(
            empty + 1,
        );
    });

    it('writes no least height of its own without rows, nor for rows the platform reads none of', async () => {
        const bare = await mount(fixture);

        expect(box(field(bare)).hasAttribute('style')).toBe(false);

        const unread = await mount(
            '<ui-textarea label="Notes" name="notes" rows="many"></ui-textarea>',
        );

        expect(box(field(unread)).hasAttribute('style')).toBe(false);
    });

    it('stops at a greatest height the host sets on its control, and scrolls past it', async () => {
        const form = await mount(`
            <style>.capped::part(control) { max-block-size: 150px; }</style>
            <ui-textarea class="capped" label="Notes" name="notes"></ui-textarea>
        `);
        const element = field(form);
        const control = box(element);

        element.value = lines(30);
        await element.updateComplete;

        expect(control.getBoundingClientRect().height).toBe(150);
        expect(control.scrollHeight, 'the rest is scrolled to').toBeGreaterThan(
            control.clientHeight,
        );
    });

    it('takes the rows it was given, and writes none when it was given none', async () => {
        const form = await mount('<ui-textarea label="Notes" name="notes" rows="7"></ui-textarea>');

        expect(box(field(form)).getAttribute('rows')).toBe('7');

        const bare = await mount(fixture);

        expect(box(field(bare)).hasAttribute('rows')).toBe(false);

        const element = field(form) as UiTextarea;

        element.rows = '3';
        await element.updateComplete;

        expect(element.getAttribute('rows'), 'and reflects it, for a host reading back').toBe('3');
    });

    it('submits and validates the same way', async () => {
        const form = await mount('<ui-textarea label="Notes" name="notes" required></ui-textarea>');

        expect(field(form).validity.valueMissing).toBe(true);

        field(form).value = 'written';
        await field(form).updateComplete;

        expect([...new FormData(form)]).toEqual([['notes', 'written']]);
        expect(field(form).validity.valid).toBe(true);
    });
});

/**
 * What a field carries in its box beside the control, laid over the control's padding, which the
 * control widens by each side's measured width.
 */
describe('a prefix and a suffix', () => {
    /** Two frames, so the observer measuring each side has answered the first. */
    async function measured(): Promise<void> {
        for (let frame = 0; frame < 2; frame++) {
            await new Promise(requestAnimationFrame);
        }
    }

    /** One side's box, drawn whatever it holds. */
    function side(element: Field, name: 'prefix' | 'suffix'): HTMLElement {
        return part(element, name);
    }

    /** What a side draws, its glyph and its text, without the buttons it carries. */
    function mark(element: Field, name: 'prefix' | 'suffix'): HTMLElement {
        const found = side(element, name).querySelector<HTMLElement>('.affix');

        if (found === null) {
            throw new Error(`the ${name} draws no mark`);
        }

        return found;
    }

    const priced =
        '<ui-input label="Price" name="price" help="Billed monthly." prefix-text="R$" suffix-text="per month"></ui-input>';

    it('draws its text in the box, hidden from the tree, and describes the control by it', async () => {
        const form = await mount(priced);
        const element = field(form) as UiInput;

        expect(side(element, 'prefix').textContent.trim()).toBe('R$');
        expect(side(element, 'suffix').textContent.trim()).toBe('per month');
        expect(mark(element, 'prefix').getAttribute('aria-hidden')).toBe('true');
        expect(mark(element, 'suffix').getAttribute('aria-hidden')).toBe('true');
        // Nearer the value than the instruction under it.
        expect(box(element).getAttribute('aria-describedby')).toBe('prefix suffix help');

        element.error = 'Too high.';
        await element.updateComplete;

        expect(box(element).getAttribute('aria-describedby'), 'the error first').toBe(
            'error prefix suffix help',
        );

        element.prefixText = 'US$';
        element.suffixText = 'a month';
        await element.updateComplete;

        expect(element.getAttribute('prefix-text'), 'reflected').toBe('US$');
        expect(element.getAttribute('suffix-text'), 'reflected').toBe('a month');
        expect(side(element, 'prefix').textContent.trim()).toBe('US$');
    });

    it('spaces each side in the space token, round it and between its glyph and its text', async () => {
        const form = await mount(
            '<ui-input label="Price" name="price" prefix-text="R$"><span slot="prefix">*</span></ui-input>',
        );
        const element = field(form);

        element.style.setProperty('--ui-space', '10px');

        const styles = getComputedStyle(side(element, 'prefix'));

        expect(styles.paddingInlineStart).toBe('10px');
        expect(styles.paddingInlineEnd).toBe('10px');
        expect(styles.columnGap, 'half a space').toBe('5px');
    });

    it("widens the control's padding to hold each side, and gives it back when a side goes", async () => {
        const form = await mount(priced);
        const element = field(form) as UiInput;

        element.style.setProperty('--ui-space', '10px');
        await measured();

        const control = box(element);
        const styles = getComputedStyle(control);

        expect(Number.parseFloat(styles.paddingInlineStart)).toBe(
            side(element, 'prefix').offsetWidth,
        );
        expect(Number.parseFloat(styles.paddingInlineEnd)).toBe(
            side(element, 'suffix').offsetWidth,
        );
        expect(side(element, 'prefix').offsetWidth, 'wider than the space alone').toBeGreaterThan(
            10,
        );

        element.prefixText = '';
        element.suffixText = '';
        await element.updateComplete;
        await measured();

        expect(getComputedStyle(control).paddingInlineStart).toBe('10px');
        expect(getComputedStyle(control).paddingInlineEnd).toBe('10px');
        expect(side(element, 'prefix').hidden, 'not drawn').toBe(true);
        expect(element.getAttribute('style'), 'and nothing left written').not.toMatch(/--ui-fx-/);
    });

    it('writes nothing on a field that carries nothing, nor describes it by a side', async () => {
        const form = await mount(fixture);
        const element = field(form);

        await measured();

        expect(side(element, 'prefix').hidden).toBe(true);
        expect(side(element, 'suffix').hidden).toBe(true);
        expect(element.shadowRoot?.querySelector('[part="count"]'), 'no count').toBeNull();
        expect(element.shadowRoot?.querySelector('[aria-live]'), 'nor its voice').toBeNull();
        expect(element.hasAttribute('style')).toBe(false);
        expect(box(element).getAttribute('aria-describedby')).toBe('help');
    });

    it('takes a glyph in a slot of the same name, hidden from the tree, and lets it go', async () => {
        const form = await mount(
            '<ui-input label="Search" name="q"><span slot="prefix">*</span></ui-input>',
        );
        const element = field(form);

        await measured();

        expect(side(element, 'prefix').hidden, 'drawn for its glyph').toBe(false);
        expect(Number.parseFloat(getComputedStyle(box(element)).paddingInlineStart)).toBe(
            side(element, 'prefix').offsetWidth,
        );
        expect(box(element).hasAttribute('aria-describedby'), 'a glyph describes nothing').toBe(
            false,
        );

        element.querySelector('[slot="prefix"]')?.remove();
        await element.updateComplete;
        await measured();

        expect(side(element, 'prefix').hidden, 'gone with it').toBe(true);
    });

    it('lays the prefix at the start and the suffix at the end, right to left as well', async () => {
        const form = await mount(`<div dir="rtl">${priced}</div>`);
        const element = field(form);

        await measured();

        const control = box(element).getBoundingClientRect();
        const prefix = side(element, 'prefix').getBoundingClientRect();
        const suffix = side(element, 'suffix').getBoundingClientRect();

        expect(Math.round(prefix.right), 'the prefix at the right').toBe(Math.round(control.right));
        expect(Math.round(suffix.left), 'the suffix at the left').toBe(Math.round(control.left));
    });

    it('passes a click on either side through to the control', async () => {
        // Read where a point lands rather than driving the pointer there, which lands scaled
        // off the frame the suite runs in: the control, whose own click focuses it.
        const form = await mount(priced);
        const element = field(form);

        await measured();

        for (const name of ['prefix', 'suffix'] as const) {
            const at = side(element, name).getBoundingClientRect();

            expect(
                element.shadowRoot?.elementFromPoint(
                    at.left + at.width / 2,
                    at.top + at.height / 2,
                ),
                name,
            ).toBe(box(element));
        }
    });

    it('is drawn muted, and dims with a control that cannot be used', async () => {
        const form = await mount(priced);
        const element = field(form);

        element.style.setProperty('--ui-color-text-muted', 'rgb(1, 2, 3)');

        expect(getComputedStyle(mark(element, 'prefix')).color).toBe('rgb(1, 2, 3)');
        expect(getComputedStyle(mark(element, 'prefix')).opacity).toBe('1');

        element.disabled = true;
        await element.updateComplete;

        expect(getComputedStyle(mark(element, 'prefix')).opacity).toBe('0.5');
    });
});

/** The buttons a field carries at its end, and the count it draws under its box. */
describe('the clear button, the password shown, and the count', () => {
    /** One of the buttons at the control's end, by its part. */
    function tool(element: Field, name: 'clear' | 'reveal'): HTMLButtonElement {
        return part(element, name) as HTMLButtonElement;
    }

    /** Two frames, so the observer measuring each side has answered the first. */
    async function measured(): Promise<void> {
        for (let frame = 0; frame < 2; frame++) {
            await new Promise(requestAnimationFrame);
        }
    }

    /** Types into the control as a reader's key does: the value, and its input event. */
    function type(element: Field, value: string): void {
        const control = box(element);

        control.value = value;
        control.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    }

    afterEach(() => {
        vi.useRealTimers();
    });

    it('draws a clear button only where its label names it, idle while there is nothing to clear', async () => {
        const bare = await mount(fixture);

        expect(field(bare).shadowRoot?.querySelector('[part="clear"]'), 'none unasked').toBeNull();
        expect(part(field(bare), 'suffix').hidden).toBe(true);

        const form = await mount('<ui-input label="Find" name="q" clear-label="Clear"></ui-input>');
        const element = field(form) as UiInput;

        await measured();

        expect(tool(element, 'clear').getAttribute('aria-label')).toBe('Clear');
        expect(getComputedStyle(tool(element, 'clear')).visibility, 'idle while empty').toBe(
            'hidden',
        );
        expect(
            Number.parseFloat(getComputedStyle(box(element)).paddingInlineEnd),
            'its place kept, so the value does not move as it comes',
        ).toBe(part(element, 'suffix').offsetWidth);

        type(element, 'abc');
        await element.updateComplete;

        expect(getComputedStyle(tool(element, 'clear')).visibility).toBe('visible');

        element.readonly = true;
        await element.updateComplete;

        expect(getComputedStyle(tool(element, 'clear')).visibility, 'read-only').toBe('hidden');

        element.readonly = false;
        element.disabled = true;
        await element.updateComplete;

        expect(getComputedStyle(tool(element, 'clear')).visibility, 'disabled').toBe('hidden');

        element.clearLabel = 'Empty';
        await element.updateComplete;

        expect(element.getAttribute('clear-label'), 'reflected').toBe('Empty');
    });

    it('empties the control, says so with input and change, and hands the focus back', async () => {
        const form = await mount(
            '<ui-input label="Find" name="q" value="abc" clear-label="Clear"></ui-input>',
        );
        const element = field(form);
        const heard: string[] = [];

        // Heard on the form, so both bubble, as the platform's own do.
        form.addEventListener('input', () => heard.push('input'));
        form.addEventListener('change', () => heard.push('change'));

        expect(tool(element, 'clear').querySelectorAll('path').length, 'the cross').toBe(2);

        await userEvent.click(tool(element, 'clear'));
        await element.updateComplete;

        expect(element.value).toBe('');
        expect(box(element).value).toBe('');
        expect(heard).toEqual(['input', 'change']);
        expect(element.shadowRoot?.activeElement, 'the focus on the control').toBe(box(element));
        expect([...new FormData(form)]).toEqual([['q', '']]);
    });

    it("says its emptying past another component's root, as the platform's own input event does", async () => {
        const outer = document.createElement('div');

        document.body.append(outer);
        outer.attachShadow({ mode: 'open' }).innerHTML =
            '<ui-input label="Find" name="q" value="abc" clear-label="Clear"></ui-input>';

        const element = outer.shadowRoot?.querySelector('ui-input');

        if (element === null || element === undefined) {
            throw new Error('no field in the root');
        }
        const heard: string[] = [];

        await element.updateComplete;
        outer.addEventListener('input', () => heard.push('input'));
        outer.addEventListener('change', () => heard.push('change'));

        tool(element, 'clear').click();

        // input is composed and leaves the root it was said in; change is not, as a control's.
        expect(heard).toEqual(['input']);

        outer.remove();
    });

    it("draws a pressed button on a password's control, which shows its text while pressed", async () => {
        const form = await mount(
            '<ui-input label="Password" name="p" type="password" reveal-label="Show password"></ui-input>',
        );
        const element = field(form) as UiInput;
        const button = tool(element, 'reveal');

        expect(button.getAttribute('aria-label')).toBe('Show password');
        expect(button.getAttribute('aria-pressed')).toBe('false');
        expect(box(element).type).toBe('password');
        expect(button.querySelectorAll('path').length, 'the eye').toBe(1);

        await userEvent.click(button);
        await element.updateComplete;

        expect(button.getAttribute('aria-pressed')).toBe('true');
        expect(box(element).getAttribute('type'), 'shown').toBe('text');
        expect(element.getAttribute('type'), "the element's own type kept").toBe('password');
        expect(button.querySelectorAll('path').length, 'struck through').toBe(4);

        await userEvent.click(button);
        await element.updateComplete;

        expect(button.getAttribute('aria-pressed')).toBe('false');
        expect(box(element).type, 'hidden again').toBe('password');

        await userEvent.click(button);
        element.revealLabel = '';
        await element.updateComplete;

        expect(box(element).type, 'hidden with its button gone').toBe('password');

        element.revealLabel = 'Show';
        await element.updateComplete;

        expect(element.getAttribute('reveal-label'), 'reflected').toBe('Show');
    });

    it('draws no password button on another type, nor unnamed, nor one that can be pressed disabled', async () => {
        const text = await mount('<ui-input label="Name" name="n" reveal-label="Show"></ui-input>');

        expect(field(text).shadowRoot?.querySelector('[part="reveal"]'), 'a text field').toBeNull();

        const unnamed = await mount(
            '<ui-input label="Password" name="p" type="password"></ui-input>',
        );

        expect(field(unnamed).shadowRoot?.querySelector('[part="reveal"]'), 'unnamed').toBeNull();

        const disabled = await mount(
            '<ui-input label="Password" name="p" type="password" reveal-label="Show" disabled></ui-input>',
        );

        expect(tool(field(disabled), 'reveal').disabled).toBe(true);
    });

    it('holds both buttons in the padding it widens at its end', async () => {
        const form = await mount(
            '<ui-input label="Password" name="p" type="password" value="x" clear-label="Clear" reveal-label="Show"></ui-input>',
        );
        const element = field(form);

        await measured();

        const end = Number.parseFloat(getComputedStyle(box(element)).paddingInlineEnd);

        expect(end).toBe(part(element, 'suffix').offsetWidth);
        expect(end, 'room for two targets').toBeGreaterThanOrEqual(48);
    });

    it('gives each button a 24px target, a hover and a ring', async () => {
        const form = await mount(
            '<ui-input label="Find" name="q" value="abc" clear-label="Clear"></ui-input>',
        );
        const element = field(form);
        const button = tool(element, 'clear');

        element.style.setProperty('--ui-color-hover', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-duration-state', '0s');

        expect(button.getBoundingClientRect().width).toBeGreaterThanOrEqual(24);
        expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);

        await userEvent.hover(button);

        expect(getComputedStyle(button).backgroundColor).toBe('rgb(1, 2, 3)');

        await userEvent.click(box(element));
        await userEvent.tab();

        expect(element.shadowRoot?.activeElement, 'reached by Tab after the control').toBe(button);
        expect(getComputedStyle(button).outlineStyle).toBe('solid');
    });

    it('draws its count under the control, the numbers written in, and is described by it', async () => {
        const form = await mount(`
            <ui-input label="Comment" name="c" maxlength="10" help="Be kind."
                count-text="{count} typed, {remaining} left"></ui-input>
        `);
        const element = field(form) as UiInput;

        expect(part(element, 'count').textContent.trim()).toBe('0 typed, 10 left');
        expect(part(element, 'count').getAttribute('aria-hidden')).toBe('true');
        expect(box(element).getAttribute('aria-describedby'), 'before the help').toBe('count help');

        type(element, 'abc');
        await element.updateComplete;

        expect(part(element, 'count').textContent.trim(), 'at each key').toBe('3 typed, 7 left');

        element.maxlength = '';
        await element.updateComplete;

        expect(part(element, 'count').textContent.trim(), 'nothing left to count').toBe(
            '3 typed,  left',
        );

        element.countText = 'Counted';
        await element.updateComplete;

        expect(element.getAttribute('count-text'), 'reflected').toBe('Counted');
    });

    it('says its count once the reader stops typing, not at each key', async () => {
        const form = await mount(
            '<ui-input label="Comment" name="c" maxlength="10" count-text="{remaining} left"></ui-input>',
        );
        const element = field(form) as UiInput;
        const said = element.renderRoot.querySelector('[aria-live]');

        expect(said?.getAttribute('aria-live')).toBe('polite');

        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

        type(element, 'a');
        vi.advanceTimersByTime(500);
        type(element, 'ab');
        vi.advanceTimersByTime(999);
        await element.updateComplete;

        expect(said?.textContent, 'nothing yet, a key came within the second').toBe('');

        vi.advanceTimersByTime(1);
        await element.updateComplete;

        expect(said?.textContent).toBe('8 left');

        element.clearLabel = 'Clear';
        await element.updateComplete;
        tool(element, 'clear').click();
        vi.advanceTimersByTime(1000);
        await element.updateComplete;

        expect(said?.textContent, 'and after a clear').toBe('10 left');
    });

    it('paints its buttons, its marks and its count from the tokens, each read on its own', async () => {
        const form = await mount(`
            <ui-input label="Find" name="q" value="abc" clear-label="Clear" suffix-text="x"
                count-text="{count}"><span slot="suffix">*</span></ui-input>
        `);
        const element = field(form);

        for (const [token, value] of [
            ['--ui-space', '10px'],
            ['--ui-radius', '7px'],
            ['--ui-color-text-muted', 'rgb(1, 2, 3)'],
            ['--ui-color-focus', 'rgb(4, 5, 6)'],
            ['--ui-color-text', 'rgb(7, 8, 9)'],
            ['--ui-duration-state', '123ms'],
            ['--ui-easing-state', 'linear'],
            ['--ui-icon-size', '19px'],
            ['--ui-icon-stroke', '3'],
            ['--ui-text-supporting', '17px'],
        ] as const) {
            element.style.setProperty(token, value);
        }

        const button = tool(element, 'clear');
        const drawn = getComputedStyle(button);

        expect(drawn.borderTopLeftRadius, '--ui-radius').toBe('7px');
        expect(drawn.color, '--ui-color-text-muted').toBe('rgb(1, 2, 3)');
        expect(drawn.transitionDuration, '--ui-duration-state').toBe('0.123s');
        expect(drawn.transitionTimingFunction, '--ui-easing-state').toBe('linear');

        const svg = button.querySelector('svg');

        if (svg === null) {
            throw new Error('the button draws no mark');
        }

        const glyph = getComputedStyle(svg);

        expect(glyph.width, '--ui-icon-size').toBe('19px');
        expect(glyph.strokeWidth, '--ui-icon-stroke').toBe('3px');

        const mark = part(element, 'suffix').querySelector('.affix');

        if (mark === null) {
            throw new Error('the suffix draws no mark');
        }

        expect(getComputedStyle(mark).columnGap, 'half a space, glyph to text').toBe('5px');

        const count = getComputedStyle(part(element, 'count'));

        expect(count.color, '--ui-color-text').toBe('rgb(7, 8, 9)');
        expect(count.fontSize, '--ui-text-supporting').toBe('17px');

        await userEvent.click(box(element));
        await userEvent.tab();

        expect(getComputedStyle(button).outlineColor, '--ui-color-focus').toBe('rgb(4, 5, 6)');
    });

    it('has no violations with its buttons and its count', async () => {
        await expectAccessible(await mountStory(Tools, meta, 'Tools'));
    });
});

/** A button the page writes at the box's end, after the ones the element draws there. */
describe("a button of the host's at the end", () => {
    /** Two frames, so the observer measuring each side has answered the first. */
    async function measured(): Promise<void> {
        for (let frame = 0; frame < 2; frame++) {
            await new Promise(requestAnimationFrame);
        }
    }

    /** What the page slotted at the end. */
    function action(element: Field): HTMLElement {
        const found = element.querySelector<HTMLElement>('[slot="action"]');

        if (found === null) {
            throw new Error('nothing is slotted at the end');
        }

        return found;
    }

    it("is drawn at the box's end, the side shown for it alone, the padding widened to hold it", async () => {
        const form = await mount(
            '<ui-input label="Find" name="q"><button slot="action" id="go">Go</button></ui-input>',
        );
        const element = field(form);
        const button = action(element);
        const suffix = part(element, 'suffix');

        await measured();

        expect(suffix.hidden, 'shown for it').toBe(false);
        expect(part(element, 'prefix').hidden, 'at the end alone').toBe(true);
        expect(button.assignedSlot?.closest('[part="suffix"]')).toBe(suffix);
        expect(Number.parseFloat(getComputedStyle(box(element)).paddingInlineEnd)).toBe(
            suffix.offsetWidth,
        );
        expect(
            box(element).getBoundingClientRect().right - button.getBoundingClientRect().right,
            "the side's padding from the end",
        ).toBe(Number.parseFloat(getComputedStyle(suffix).paddingInlineEnd));
        expect(button.getAttributeNames(), 'named by itself, written on by nothing').toEqual([
            'slot',
            'id',
        ]);

        button.remove();
        await element.updateComplete;
        await measured();

        expect(suffix.hidden, 'gone with it').toBe(true);
    });

    it('is reached by Tab after the control and the buttons the element draws', async () => {
        const form = await mount(
            '<ui-input label="Password" name="p" type="password" value="hunter2" clear-label="Clear" reveal-label="Show password"><button slot="action" id="generate">Generate</button></ui-input>',
        );
        const element = field(form);
        const reached: string[] = [];

        await measured();
        box(element).focus();

        for (let step = 0; step < 3; step++) {
            await userEvent.tab();
            reached.push(
                document.activeElement === element
                    ? (element.shadowRoot?.activeElement?.getAttribute('part') ?? 'none')
                    : (document.activeElement?.id ?? 'none'),
            );
        }

        expect(reached).toEqual(['clear', 'reveal', 'generate']);
    });

    it("takes the pointer, and the text's colour rather than the box's, invalid too", async () => {
        const form = await mount(
            '<ui-input label="Token" name="t" value="abc"><button slot="action" style="color: inherit">Copy</button></ui-input>',
        );
        const element = field(form);
        const button = action(element);

        await measured();
        element.style.setProperty('--ui-color-text', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-color-accent', 'rgb(4, 5, 6)');
        element.style.setProperty('--ui-color-danger', 'rgb(7, 8, 9)');

        const at = button.getBoundingClientRect();

        expect(document.elementFromPoint(at.left + at.width / 2, at.top + at.height / 2)).toBe(
            button,
        );
        expect(getComputedStyle(button).color, '--ui-color-text').toBe('rgb(1, 2, 3)');

        element.error = 'Expired.';
        await element.updateComplete;

        expect(getComputedStyle(button).color, 'not the danger').toBe('rgb(1, 2, 3)');
    });

    it('keeps the state the page gave it, while the parts the element draws dim with the control', async () => {
        const form = await mount(
            '<ui-input label="Password" name="p" type="password" suffix-text="8 or more" reveal-label="Show password"><button slot="action" id="generate">Generate</button></ui-input>',
        );
        const element = field(form);
        const suffix = part(element, 'suffix');
        const mark = suffix.querySelector('.affix');

        if (mark === null) {
            throw new Error('the suffix draws no mark');
        }

        element.disabled = true;
        await element.updateComplete;

        expect(getComputedStyle(mark).opacity, 'the text').toBe('0.5');
        expect(getComputedStyle(part(element, 'reveal')).opacity, 'the button').toBe('0.5');
        expect(getComputedStyle(suffix).opacity, 'and nothing round the page').toBe('1');
        expect(action(element).matches(':disabled'), "the page's to disable").toBe(false);
    });

    it("has no violations with a button of the page's at its end", async () => {
        await expectAccessible(await mountStory(Action, meta, 'Action'));
    });
});

/**
 * A component that accepts interaction and shows no feedback is defective. Nothing here
 * restates a colour: the question a hover asks is *did it move*.
 */
describe('the interaction states', () => {
    it('answers a pointer', async () => {
        const form = await mount(fixture);
        withoutMotion(field(form));

        const resting = getComputedStyle(box(field(form))).borderColor;

        await userEvent.hover(box(field(form)));

        expect(getComputedStyle(box(field(form))).borderColor).not.toBe(resting);
    });

    it('ignores a pointer while disabled', async () => {
        const form = await mount('<ui-input label="A" name="a" disabled></ui-input>');
        withoutMotion(field(form));

        const resting = getComputedStyle(box(field(form))).borderColor;

        await userEvent.hover(box(field(form)));

        expect(getComputedStyle(box(field(form))).borderColor).toBe(resting);
        expect(getComputedStyle(box(field(form))).cursor).toBe('not-allowed');
    });

    it('ignores a pointer while readonly, which accepts focus and refuses edits', async () => {
        const form = await mount('<ui-input label="A" name="a" readonly value="x"></ui-input>');
        withoutMotion(field(form));

        const resting = getComputedStyle(box(field(form))).borderColor;

        await userEvent.hover(box(field(form)));

        expect(getComputedStyle(box(field(form))).borderColor).toBe(resting);
    });

    it('moves the boundary over the state duration, and moves nothing else', async () => {
        const form = await mount(fixture);
        const styles = getComputedStyle(box(field(form)));

        expect(styles.transitionProperty).toBe('border-color');
        expect(styles.transitionDuration).toBe('0.15s');
    });

    it('guards every interaction rule against the states that refuse it', () => {
        // Structural, and it reaches the rules a later control might add: a disabled
        // control still matches :hover, and a readonly one accepts a pointer it will do
        // nothing with.
        const rules = [
            ...styleText('ui-input').matchAll(
                /(?:input|textarea)[a-z:()[\]-]*:hover[a-z:()[\]-]*/g,
            ),
        ];

        expect(rules.length, 'there are hover rules to check').toBeGreaterThan(0);

        for (const [rule] of rules) {
            expect(rule, rule).toContain(':not(:disabled)');
            expect(rule, rule).toContain(':not([readonly])');
        }
    });
});

/**
 * RFC 0006's handoff, on the pair that already composed a list. The protocol is graded in
 * `description.test.ts` and the composition in `src/description.ts`; what these are about
 * is that a third id joins the two this element has always had, at the end.
 */
/**
 * A field's effects — RFC 0004's — which the pair adopts from `src/effects.ts` under each one's own
 * taste name. What each effect draws is graded on a field of the suite's own in
 * `tests/effects.test.ts`; what these are about is that both elements draw it.
 */
describe("a field's effects, which the pair adopts", () => {
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

    /** A frame, after which the pointer engine has written what the moves before it asked for. */
    async function frame(): Promise<void> {
        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
                resolve();
            });
        });
    }

    /** The pointer far off every field, so the engine lets go before the next test. */
    async function away(): Promise<void> {
        document.dispatchEvent(
            new PointerEvent('pointermove', { clientX: -10000, clientY: -10000 }),
        );
        await frame();
    }

    // Never stilled: the engine reads its time off the box, and a time of nothing is the
    // collapse's, under which nothing follows.
    it.each(['ui-input', 'ui-textarea'])(
        'hands the box round the control of a %s where the pointer is, which lights its band',
        async (tag) => {
            const form = await mount(`<${tag} label="Note"></${tag}>`);
            form.style.setProperty('--ui-motion-hover-border', 'edge');

            const element = field(form);

            try {
                await pointTo(box(element), 20, 10);

                expect(glow(element).style.getPropertyValue('--ui-fx-pointer-near')).toBe('1');
                expect(getComputedStyle(glow(element), '::after').opacity).toBe('1');
            } finally {
                await away();
            }
        },
    );

    it("follows the pointer under Glass's taste: the tint where it is, a shadow cast and a band", async () => {
        const style = document.createElement('style');
        style.textContent = tokenStyleSheet() + themeStyleSheet(glass);
        document.body.append(style);

        const form = await mount('<ui-input label="Amount"></ui-input>');
        form.dataset['uiTheme'] = glass.name;

        const element = field(form);

        try {
            await pointTo(box(element), 20, 10);

            expect(getComputedStyle(box(element)).backgroundImage, 'the tint').toMatch(
                /^radial-gradient\(256px at /,
            );
            expect(getComputedStyle(box(element)).boxShadow, 'a shadow cast').toMatch(/px/);
            expect(getComputedStyle(glow(element), '::after').opacity, 'a band').toBe('1');
        } finally {
            await away();
        }
    });

    it.each([
        ['ui-input', '--ui-taste-input-focus-move', '--ui-taste-textarea-focus-move'],
        ['ui-textarea', '--ui-taste-textarea-focus-move', '--ui-taste-input-focus-move'],
    ])(
        "draws them on %s under its own taste name, and not under the other's",
        async (tag, own, other) => {
            const form = await mount(`<${tag} label="Note"></${tag}>`);
            stilled(form);
            form.style.setProperty(other, 'lift');

            await userEvent.tab();

            expect(getComputedStyle(glow(field(form))).translate, "the other's").toBe('none');

            form.style.setProperty(own, 'lift');

            expect(getComputedStyle(glow(field(form))).translate, 'its own').toBe('0px -2px');
        },
    );

    it.each([
        ['ui-input', 'disabled'],
        ['ui-input', 'readonly'],
        ['ui-textarea', 'readonly'],
    ])(
        'raises no %s under the pointer that is %s, which its sheet guards against',
        async (tag, state) => {
            const form = await mount(`<${tag} label="Note" ${state}></${tag}>`);
            stilled(form);
            form.style.setProperty('--ui-motion-hover-shadow', 'raise');

            await userEvent.hover(box(field(form)));

            expect(getComputedStyle(box(field(form))).boxShadow).toBe('none');
        },
    );

    it.each([
        ['ui-input', 'ui-textarea'],
        ['ui-textarea', 'ui-input'],
    ])('glides the ring from a %s to a %s, which hands it the flight', async (first, second) => {
        const form = await mount(
            `<${first} label="First"></${first}><${second} label="Second"></${second}>`,
        );
        form.style.setProperty('--ui-motion-focus-ring', 'glide');

        await userEvent.tab();
        await userEvent.tab();

        expect(aloft()).toBe(true);
    });

    it("raises a field under the pointer, and raises and lifts it at the focus, under the default theme's taste", async () => {
        const style = document.createElement('style');
        style.textContent = tokenStyleSheet();
        document.body.append(style);
        const form = await mount(fixture);
        stilled(form);

        await userEvent.hover(box(field(form)));

        expect(getComputedStyle(box(field(form))).boxShadow, 'under the pointer').toBe(raised);

        await userEvent.tab();

        expect(getComputedStyle(box(field(form))).boxShadow, 'at the focus').toBe(raised);
        expect(getComputedStyle(glow(field(form))).translate, 'lifted').toBe('0px -2px');
    });
});

/**
 * A form's own moments on a field — RFC 0004's — under the default theme's taste, and what the two
 * shipped themes take back of it.
 */
describe("a form's moments on a field", () => {
    /** Inserts the token sheet, and a theme's after it where one is named. */
    function sheet(theme?: Theme): void {
        const style = document.createElement('style');
        style.textContent = tokenStyleSheet() + (theme === undefined ? '' : themeStyleSheet(theme));
        document.body.append(style);
    }

    /** The box round a field's control, which an error's band is drawn round. */
    function glow(element: Field): HTMLElement {
        const found = element.renderRoot.querySelector<HTMLElement>('.glow');

        if (found === null) {
            throw new Error('the field rendered no box round its control');
        }

        return found;
    }

    /** What a side of a field draws, which takes the halo its text takes. */
    function affix(element: Field, name: 'prefix' | 'suffix'): HTMLElement {
        const found = part(element, name).querySelector<HTMLElement>('.affix');

        if (found === null) {
            throw new Error(`the ${name} draws no mark`);
        }

        return found;
    }

    /** The animations an element's one list plays, the kinds that play nothing left out. */
    function playing(target: Element, pseudo?: string): readonly string[] {
        return getComputedStyle(target, pseudo)
            .animationName.split(', ')
            .filter((name) => name !== 'none');
    }

    /** Mounts a field in error under `theme`, every duration the effects move over taken out. */
    async function erring(theme?: Theme): Promise<Field> {
        sheet(theme);

        const form = await mount('<ui-input label="Amount" error="Wrong."></ui-input>');
        form.style.setProperty('--ui-duration-effect', '0s');
        form.style.setProperty('--ui-duration-state', '0s');

        if (theme !== undefined) {
            form.dataset['uiTheme'] = theme.name;
        }

        return field(form);
    }

    it("answers an error under the default theme's taste: a band sent out, and the fill flashed", async () => {
        const element = await erring();

        expect(playing(glow(element), '::after'), 'the pulse').toEqual(['ui-pulse-danger']);
        expect(playing(box(element)), 'the flash, and its halo').toEqual(['ui-flash', 'ui-halo']);
    });

    it('haloes what a field carries beside its control as its text, under the flash and the sheen', async () => {
        sheet();

        const flashed = await mount(
            '<ui-input label="Amount" error="Wrong." prefix-text="R$"></ui-input>',
        );

        expect(playing(affix(field(flashed), 'prefix')), 'beside the flash').toEqual(['ui-halo']);

        flashed.remove();
        sheet(glass);

        const swept = await mount('<ui-input label="Amount" suffix-text="BRL"></ui-input>');

        swept.dataset['uiTheme'] = glass.name;

        expect(playing(affix(field(swept), 'suffix')), 'nothing at rest').toEqual([]);

        await userEvent.tab();

        expect(playing(affix(field(swept), 'suffix')), 'under the sheen').toEqual(['ui-halo']);
    });

    it("takes the label to the accent at the focus under the default theme's taste", async () => {
        const element = await erring();
        const resting = getComputedStyle(part(element, 'label')).color;

        await userEvent.tab();

        expect(getComputedStyle(part(element, 'label')).color).not.toBe(resting);
    });

    it("splits a field in error's boundary under Matrix, and keeps its fill as it is", async () => {
        const element = await erring(matrix);

        expect(playing(glow(element), '::after'), 'the split').toEqual(['ui-split']);
        expect(playing(box(element)), 'no flash').toEqual([]);
    });

    it('glows the label at the focus under Matrix, its colour as it was', async () => {
        const element = await erring(matrix);
        const resting = getComputedStyle(part(element, 'label')).color;

        await userEvent.tab();

        expect(getComputedStyle(part(element, 'label')).color, 'its colour').toBe(resting);
        expect(getComputedStyle(part(element, 'label')).textShadow, 'a glow').not.toBe('none');
    });

    it.each(['ui-input', 'ui-textarea'])(
        "tints a %s at the focus under Matrix, the field's own where the page names the highlight",
        async (tag) => {
            sheet(matrix);

            const form = await mount(`<${tag} label="Note"></${tag}>`);
            form.style.setProperty('--ui-duration-effect', '0s');
            form.style.setProperty('--ui-duration-state', '0s');
            form.dataset['uiTheme'] = matrix.name;

            const control = box(field(form));
            const fill = getComputedStyle(control).backgroundColor;

            await userEvent.tab();

            expect(getComputedStyle(control).backgroundColor).not.toBe(fill);

            for (const flight of document.querySelector('[data-ui-ring]')?.getAnimations() ?? []) {
                flight.finish();
            }
        },
    );

    it('answers the pointer and the focus under Matrix: a glow and a tint, no darkening, a burst and the glitch', async () => {
        sheet(matrix);

        const form = await mount('<ui-input label="Amount"></ui-input>');
        form.style.setProperty('--ui-duration-effect', '0s');
        form.style.setProperty('--ui-duration-state', '0s');
        form.style.setProperty('--ui-duration-flourish', '10s');
        form.dataset['uiTheme'] = matrix.name;

        const element = field(form);
        const control = box(element);
        const resting = getComputedStyle(control);
        const [fill, edge] = [resting.backgroundColor, resting.borderTopColor];

        await userEvent.hover(control);

        expect(getComputedStyle(control).boxShadow, 'a glow').toMatch(/ 0px 0px 12px 2px$/);
        expect(getComputedStyle(control).backgroundColor, 'a tint').not.toBe(fill);
        expect(getComputedStyle(control).borderTopColor, 'no darkening').toBe(edge);

        await userEvent.tab();

        expect(playing(control), 'a burst').toEqual(['ui-burst']);
        expect(getComputedStyle(control).backgroundColor, "the tint, the field's own").not.toBe(
            fill,
        );
        expect(document.querySelector('[data-ui-ring]:popover-open'), 'the glitch').not.toBeNull();

        for (const flight of document.querySelector('[data-ui-ring]')?.getAnimations() ?? []) {
            flight.finish();
        }
    });

    it('keeps the label as it is at the focus under Glass, whose taste takes the accent back', async () => {
        const element = await erring(glass);
        const resting = getComputedStyle(part(element, 'label')).color;

        await userEvent.tab();

        expect(getComputedStyle(part(element, 'label')).color).toBe(resting);
        expect(
            playing(box(element)),
            'the shimmer at the focus, and the flash Glass keeps',
        ).toEqual(['ui-shimmer', 'ui-halo', 'ui-flash', 'ui-halo']);
        expect(getComputedStyle(box(element)).boxShadow, 'a light inside').toMatch(/ inset$/);
        expect(
            getComputedStyle(glow(element), '::after').boxShadow,
            'a light of the danger',
        ).not.toBe('none');
    });
});

describe('the description a tooltip hands over', () => {
    /** Dispatches the handoff the way `<ui-tooltip>` does, and reports whether it was taken. */
    function hand(element: Field, detail: unknown): boolean {
        return !element.dispatchEvent(new CustomEvent('ui-describe', { detail, cancelable: true }));
    }

    /** The clipped node the control's `aria-describedby` has to resolve to. */
    function carrier(element: Field): HTMLElement | null {
        return element.renderRoot.querySelector<HTMLElement>('#description');
    }

    const sentence = 'Two decimals, and a comma between them.';

    it('announces the three in the order a reader needs them', async () => {
        const form = await mount(fixture);
        const element = field(form);

        expect(box(element).getAttribute('aria-describedby'), 'the help alone').toBe('help');

        expect(hand(element, sentence), 'taken').toBe(true);
        await element.updateComplete;

        expect(box(element).getAttribute('aria-describedby')).toBe('help description');

        element.error = 'Amount is required.';
        await element.updateComplete;

        // The error first, because it is what sent the reader looking; the help second,
        // because it is usually the format requirement and therefore the way out; the
        // handed sentence last, being supplementary by construction.
        expect(box(element).getAttribute('aria-describedby')).toBe('error help description');
        expect(carrier(element)?.textContent).toBe(sentence);
    });

    it('keeps the help and the message when the sentence is withdrawn', async () => {
        const form = await mount(fixture);
        const element = field(form);

        element.error = 'Amount is required.';
        hand(element, sentence);
        await element.updateComplete;

        expect(hand(element, ''), 'the withdrawal is taken too').toBe(true);
        await element.updateComplete;

        expect(box(element).getAttribute('aria-describedby')).toBe('error help');
        expect(carrier(element), 'and the carrier goes with it').toBeNull();
    });

    it('leaves a payload that is not a sentence unclaimed', async () => {
        const form = await mount(fixture);
        const element = field(form);

        expect(hand(element, 42)).toBe(false);
        await element.updateComplete;

        expect(box(element).getAttribute('aria-describedby'), 'unchanged').toBe('help');
    });

    it('reaches ui-textarea too, which shares the frame rather than repeating it', async () => {
        const form = await mount('<ui-textarea label="Notes" name="notes" rows="4"></ui-textarea>');
        const element = field(form);

        hand(element, 'Anything the reader should know before writing.');
        await element.updateComplete;

        expect(box(element).tagName).toBe('TEXTAREA');
        expect(box(element).getAttribute('aria-describedby')).toBe('description');
        expect(carrier(element)?.textContent).toBe(
            'Anything the reader should know before writing.',
        );
    });

    it('arrives from a real tooltip, and is not painted beside the tip', async () => {
        const form = await mount(`
            <ui-tooltip>
                <ui-input label="Amount" help="In BRL, two decimals." name="amount"></ui-input>
                <span slot="tip">Two decimals, and a comma between them.</span>
            </ui-tooltip>
        `);
        const element = field(form);

        expect(box(element).getAttribute('aria-describedby')).toBe('help description');

        const clip = carrier(element)?.getBoundingClientRect();

        expect(clip?.width, 'the tip is already showing it').toBeLessThanOrEqual(1);

        await expectAccessible(form);
    });
});

/**
 * The stories are the playground, and mounting them here is what puts it behind the gate.
 * `expectAccessible` is called per state, because each is different markup that can fail
 * on its own.
 */
describe('accessibility', () => {
    it('has no violations as a labelled text field', async () => {
        await expectAccessible(await mountStory(Text, meta, 'Text'));
    });

    it('has no violations as a textarea', async () => {
        await expectAccessible(await mountStory(Multiline, meta, 'Multiline'));
    });

    it('has no violations with a text and a glyph on its sides', async () => {
        await expectAccessible(await mountStory(Affixes, meta, 'Affixes'));
    });

    it('has no violations in error', async () => {
        await expectAccessible(await mountStory(Invalid, meta, 'Invalid'));
    });

    it('has no violations while disabled', async () => {
        await expectAccessible(await mountStory(Disabled, meta, 'Disabled'));
    });

    it('has no violations under the constraints the platform applies', async () => {
        await expectAccessible(await mountStory(Constrained, meta, 'Constrained'));
    });
});

/** Who submitted the form while `run` ran, `none` for the form itself, once the field has acted. */
async function submitted(
    form: HTMLFormElement,
    run: () => Promise<void> | void,
): Promise<string[]> {
    const heard: string[] = [];
    const hear = (event: SubmitEvent): void => {
        event.preventDefault();
        heard.push(event.submitter === null ? 'none' : event.submitter.id);
    };

    form.addEventListener('submit', hear);
    await run();
    // The field acts a task after the key, so the submission lands a turn later.
    await new Promise((resolve) => {
        setTimeout(resolve, 0);
    });
    form.removeEventListener('submit', hear);

    return heard;
}

describe('Enter, which the field hands to its form', () => {
    it("submits by a button of the page's at the box's end, the form's first", async () => {
        const form = await mount(
            '<ui-input label="Find" name="q"><button slot="action" id="go">Go</button></ui-input>',
        );

        box(field(form)).focus();

        expect(await submitted(form, () => userEvent.keyboard('{Enter}'))).toEqual(['go']);
    });

    it("submits the form by its default button, as the platform's own input does", async () => {
        const form = await mount(
            '<ui-input label="A" name="a"></ui-input><button id="go">Go</button>',
        );
        box(field(form)).focus();

        expect(await submitted(form, () => userEvent.keyboard('{Enter}'))).toEqual(['go']);
    });

    it('submits a form with no submit button, where it is the one field', async () => {
        const form = await mount('<ui-input label="A" name="a"></ui-input>');
        box(field(form)).focus();

        expect(await submitted(form, () => userEvent.keyboard('{Enter}'))).toEqual(['none']);
    });

    // Handed over by hand: a real key opens the picker, which nothing in a suite can close.
    it.each(['color', 'file'])(
        'submits nothing from a %s control, which opens a picker instead',
        async (type) => {
            const form = await mount(
                `<ui-input label="A" name="a" type="${type}"></ui-input><button id="go">Go</button>`,
            );
            const enter = new KeyboardEvent('keypress', {
                key: 'Enter',
                bubbles: true,
                cancelable: true,
            });

            expect(
                await submitted(form, () => {
                    box(field(form)).dispatchEvent(enter);
                }),
            ).toEqual([]);
        },
    );

    it('submits nothing from a textarea, where Enter starts a line', async () => {
        const form = await mount(
            '<ui-textarea label="Note" name="note"></ui-textarea><button id="go">Go</button>',
        );
        box(field(form)).focus();

        expect(await submitted(form, () => userEvent.keyboard('{Enter}'))).toEqual([]);
    });
});

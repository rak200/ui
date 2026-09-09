import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
// The playwright provider is what puts `send` on `CDPSession` — see `button.test.ts`,
// which needs the same line for the same reason.
import type {} from '@vitest/browser-playwright';
import { expectAccessible } from './a11y.js';
import { mountStory } from './stories.js';
import meta, { Constrained, Disabled, Invalid, Multiline, Text } from '../stories/input.stories.js';
import '../src/input.js';
import type { UiInput, UiTextarea } from '../src/input.js';

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

    it('follows a fieldset that disables it, which reaches it and nothing below', async () => {
        const form = await mount(
            '<fieldset disabled><ui-input label="A" name="a"></ui-input></fieldset>',
        );

        expect(field(form).disabled, 'the callback fired').toBe(true);
        expect(box(field(form)).disabled, 'and reached the control').toBe(true);
    });

    it('restores what a back-navigation hands back', async () => {
        const form = await mount(fixture);

        field(form).formStateRestoreCallback('kept');
        await field(form).updateComplete;

        expect(field(form).value).toBe('kept');

        field(form).formStateRestoreCallback(null);
        await field(form).updateComplete;

        expect(field(form).value).toBe('');
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
        expect(getComputedStyle(part(element, 'label')).color, 'the label too').toBe(
            'rgb(4, 5, 6)',
        );
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

    it('adds the two rules that differ, and only those two', async () => {
        const form = await mount(fixture);
        const styles = getComputedStyle(box(field(form)));

        // A control that cannot grow is one people fight, and one that grows sideways
        // breaks the layout around it.
        expect(styles.resize).toBe('vertical');

        field(form).style.setProperty('--ui-space', '10px');

        expect(getComputedStyle(box(field(form))).minBlockSize).toBe('100px');
    });

    it('takes the rows it was given, and writes none when it was given none', async () => {
        const form = await mount('<ui-textarea label="Notes" name="notes" rows="7"></ui-textarea>');

        expect(box(field(form)).getAttribute('rows')).toBe('7');

        const bare = await mount(fixture);

        expect(box(field(bare)).hasAttribute('rows')).toBe(false);
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

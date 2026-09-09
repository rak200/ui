import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
// The playwright provider is what puts `send` on `CDPSession` — see `button.test.ts`,
// which needs the same line for the same reason.
import type {} from '@vitest/browser-playwright';
import { expectAccessible } from './a11y.js';
import { mountStory } from './stories.js';
import meta, { Checkbox, Invalid, Markup, States, Switch } from '../stories/checkbox.stories.js';
import '../src/checkbox.js';
import type { UiCheckbox, UiSwitch } from '../src/checkbox.js';

/** Either element, since almost everything under test is the pair's rather than one's. */
type Toggle = UiCheckbox | UiSwitch;

/** The markup the behavioural tests use, unless one needs a different shape. */
const fixture = '<ui-checkbox label="Send a receipt" name="receipt"></ui-checkbox>';

/** Mounts a fixture inside a form and waits for the first render. */
async function mount(markup: string): Promise<HTMLFormElement> {
    const form = document.createElement('form');
    form.innerHTML = markup;
    document.body.append(form);

    for (const element of form.querySelectorAll<Toggle>('ui-checkbox, ui-switch')) {
        await element.updateComplete;
    }

    return form;
}

/** The element under test, which is now the control rather than a box around one. */
function toggle(form: HTMLFormElement): Toggle {
    // The tag map resolves a single tag name, not a list, so the union is named here.
    const element = form.querySelector<Toggle>('ui-checkbox, ui-switch');

    if (element === null) {
        throw new Error('no toggle in the fixture');
    }

    return element;
}

/** The rendered control, which is what every drawing assertion is about. */
function box(element: Toggle): HTMLInputElement {
    const control = element.renderRoot.querySelector('input');

    if (control === null) {
        throw new Error('the toggle rendered no control');
    }

    return control;
}

/** One of the exposed parts, which is how a host reaches anything in here. */
function part(element: Toggle, name: string): HTMLElement {
    const found = element.renderRoot.querySelector<HTMLElement>(`[part='${name}']`);

    if (found === null) {
        throw new Error(`no part named ${name}`);
    }

    return found;
}

/** One element of the host's own markup, which only the label slot ever carries any of. */
function light<K extends keyof HTMLElementTagNameMap>(
    form: HTMLFormElement,
    selector: K,
): HTMLElementTagNameMap[K] {
    const found = form.querySelector(selector);

    if (found === null) {
        throw new Error(`no ${selector} in the fixture`);
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
function withoutMotion(element: Toggle): void {
    element.style.setProperty('--ui-duration-state', '0s');

    // Every declared transition, not the first: these sheets transition two properties and
    // the switch's three, so a check on the whole string would be a check on how many.
    const durations = getComputedStyle(box(element)).transitionDuration.split(', ');

    expect(new Set(durations), 'the motion is out').toEqual(new Set(['0s']));
}

/**
 * Waits out whatever is transitioning on the control.
 *
 * `withoutMotion` is the cheaper answer and only works when the test schedules the change
 * itself. Where the change lands during mount — an `error` written in the markup, say —
 * the transition is already in flight before any test code runs, and changing the duration
 * then does not retract a running one.
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

/**
 * The shape RFC 0005 decided, and the one thing it turns on.
 *
 * The variable was never whether the control is rendered — it is whether every end of the
 * relationship shares a tree scope. These assertions are that sentence, measured.
 */
describe('the control and its label, in one tree scope', () => {
    it('registers both elements', () => {
        expect(customElements.get('ui-checkbox')).toBeDefined();
        expect(customElements.get('ui-switch')).toBeDefined();
    });

    it('renders the control, leaving the host nothing to write', async () => {
        const form = await mount(fixture);

        expect(form.querySelector('input'), 'nothing in the light DOM').toBeNull();
        expect(box(toggle(form)).type).toBe('checkbox');
    });

    it('labels it the platform way, by containing it', async () => {
        const form = await mount(fixture);
        const label = part(toggle(form), 'label');

        // A `<label>` around the control needs no IDREF and therefore no id — which is why
        // the arrangement survives the shadow boundary that strands `<label for>`.
        expect(label.tagName).toBe('LABEL');
        expect(box(toggle(form)).labels?.[0]).toBe(label);
        expect(label.contains(box(toggle(form)))).toBe(true);
    });

    it('takes the label from an attribute, which is the short road', async () => {
        const form = await mount(fixture);

        expect(part(toggle(form), 'text').textContent).toBe('Send a receipt');
    });

    it('lets markup fill the label instead, and the attribute steps aside', async () => {
        const form = await mount(`
            <ui-checkbox label="ignored" name="terms">
                <span slot="label">I accept the <a href="#terms">terms</a></span>
            </ui-checkbox>
        `);
        const assigned = part(toggle(form), 'text').querySelector('slot')?.assignedNodes() ?? [];

        expect(assigned.map((node) => node.textContent)).toEqual(['I accept the terms']);
        // The markup stays in the host's own tree — only the `<label>` around it is in
        // here, which is the arrangement that makes the association the platform's.
        expect(assigned[0]?.parentElement).toBe(toggle(form));
    });

    it('makes the label text a click target, which a host used to build by hand', async () => {
        const form = await mount(fixture);

        await userEvent.click(part(toggle(form), 'text'));

        expect(toggle(form).checked).toBe(true);
    });

    it('leaves a link in the label to the link, which is the platform being right', async () => {
        const form = await mount(`
            <ui-checkbox name="terms">
                <span slot="label">I accept the <a href="#terms">terms</a></span>
            </ui-checkbox>
        `);

        await userEvent.click(light(form, 'a'));

        expect(toggle(form).checked, 'a link inside a label follows the link').toBe(false);
    });

    it('takes its initial state from the attribute, the way the platform does', async () => {
        const form = await mount('<ui-checkbox label="On" checked></ui-checkbox>');

        expect(toggle(form).checked).toBe(true);
        expect(box(toggle(form)).checked).toBe(true);
    });

    it('reflects what a host writes back or styles on, and nothing more', async () => {
        const form = await mount(fixture);
        const element = toggle(form);

        element.label = 'Send two';
        element.name = 'copies';
        element.value = 'both';
        element.error = 'Pick one.';
        element.disabled = true;
        element.required = true;
        element.checked = true;
        await element.updateComplete;

        expect(element.getAttribute('label')).toBe('Send two');
        expect(element.getAttribute('name')).toBe('copies');
        expect(element.getAttribute('value')).toBe('both');
        expect(element.getAttribute('error')).toBe('Pick one.');
        expect(element.hasAttribute('disabled')).toBe(true);
        expect(element.hasAttribute('required')).toBe(true);
        // The live state deliberately does not: the content attribute is the *default*, and
        // one that followed every click would make the default whatever the user last did.
        expect(element.hasAttribute('checked'), 'checked is the default, not the state').toBe(
            false,
        );
    });

    it('starts with nothing to say, which is the host not having said it', async () => {
        const form = await mount('<ui-checkbox checked></ui-checkbox>');

        expect(part(toggle(form), 'text').textContent, 'no label').toBe('');
        // And no name, so nothing is submitted however the box is set: a form names the
        // entry from the content attribute, and there is not one to name it from.
        expect([...new FormData(form)]).toEqual([]);
    });

    it('puts the two states a host cannot otherwise reach where CSS can', async () => {
        // Measured before this existed: `::part(box):checked` does not match, because a
        // ::part() takes user-action pseudo-classes and not state ones. So without these a
        // host had no way at all to select on a state kept in this shadow root — which is
        // what would have made *not reflecting* `checked` cost the host something.
        const form = await mount(fixture);
        const element = toggle(form);

        expect(element.matches(':state(checked)'), 'off').toBe(false);

        element.checked = true;
        await element.updateComplete;

        expect(element.matches(':state(checked)'), 'on').toBe(true);

        element.checked = false;
        await element.updateComplete;

        expect(element.matches(':state(checked)'), 'off again — it is removed, not left').toBe(
            false,
        );
    });

    it('exposes the mixed state the same way, and only the checkbox has one', async () => {
        const form = await mount(`
            <ui-checkbox label="All" indeterminate></ui-checkbox>
            <ui-switch label="Notify" checked></ui-switch>
        `);
        const [checkbox, uiSwitch] = [
            ...form.querySelectorAll<Toggle>('ui-checkbox, ui-switch'),
        ] as [UiCheckbox, UiSwitch];

        expect(checkbox.matches(':state(indeterminate)')).toBe(true);
        expect(uiSwitch.matches(':state(checked)'), 'the shared one still reaches it').toBe(true);
        expect(uiSwitch.matches(':state(indeterminate)'), 'and the other never does').toBe(false);

        checkbox.indeterminate = false;
        await checkbox.updateComplete;

        expect(checkbox.matches(':state(indeterminate)')).toBe(false);
    });

    it('takes part in the pseudo-classes a form control already has', async () => {
        // Nothing here is this element's work — a form-associated custom element matches
        // them because it is one, which is why only the two states above are written.
        const form = await mount(`
            <ui-checkbox label="Terms" required></ui-checkbox>
            <ui-checkbox label="Off" disabled></ui-checkbox>
        `);
        const [required, disabled] = [...form.querySelectorAll<UiCheckbox>('ui-checkbox')] as [
            UiCheckbox,
            UiCheckbox,
        ];

        expect(required.matches(':invalid'), 'required and off').toBe(true);

        required.checked = true;
        await required.updateComplete;

        expect(required.matches(':valid')).toBe(true);
        expect(disabled.matches(':disabled')).toBe(true);
        // And the trap that comes with reflecting a string whose default is empty: Lit
        // writes `error=""`, which a presence selector matches. `:invalid` is the one to
        // reach for, and the docs say so.
        expect(disabled.matches('[error]'), 'an empty attribute is still an attribute').toBe(true);
    });

    it('hugs its content rather than filling the line', async () => {
        const form = await mount(fixture);

        expect(getComputedStyle(toggle(form)).display).toBe('inline-flex');
    });

    it('takes the typeface from the host', async () => {
        const form = await mount(fixture);
        toggle(form).style.setProperty('--ui-font', 'Courier');

        expect(getComputedStyle(part(toggle(form), 'text')).fontFamily).toBe('Courier');
    });
});

/**
 * The element joins the form, because the control cannot: an `<input>` in a shadow root has
 * no form owner. Everything here is `ElementInternals` paying that back.
 */
describe('the form, which the element joins in the place of the control', () => {
    it('submits under its name when checked, and nothing when not', async () => {
        const form = await mount(fixture);

        expect([...new FormData(form)], 'off, so there is no entry').toEqual([]);

        toggle(form).checked = true;
        await toggle(form).updateComplete;

        expect([...new FormData(form)]).toEqual([['receipt', 'on']]);
    });

    it('takes the name from a property, because a form reads the attribute', async () => {
        // The failure this is here for is silent: a form-associated custom element's entry
        // is named from the content attribute, so a name set only as a property submits
        // nothing at all while every other sign says the control is participating.
        const form = await mount('<ui-checkbox label="Send a receipt"></ui-checkbox>');
        toggle(form).name = 'receipt';
        toggle(form).checked = true;
        await toggle(form).updateComplete;

        expect([...new FormData(form)]).toEqual([['receipt', 'on']]);
    });

    it('submits the value it was given, rather than the default the platform writes', async () => {
        const form = await mount(
            '<ui-checkbox label="Send a receipt" name="receipt" value="pdf" checked></ui-checkbox>',
        );

        expect([...new FormData(form)]).toEqual([['receipt', 'pdf']]);
    });

    it('submits nothing while disabled, which is what a native control does', async () => {
        const form = await mount(
            '<ui-checkbox label="Send a receipt" name="receipt" checked disabled></ui-checkbox>',
        );

        expect([...new FormData(form)]).toEqual([]);
    });

    it('knows the form it is in', async () => {
        const form = await mount(fixture);

        expect(toggle(form).form).toBe(form);
    });

    it('resets to the attribute, which is the default rather than the last click', async () => {
        const form = await mount(`
            <ui-checkbox label="Off by default" name="a"></ui-checkbox>
            <ui-checkbox label="On by default" name="b" checked></ui-checkbox>
        `);
        const [off, on] = [...form.querySelectorAll<UiCheckbox>('ui-checkbox')] as [
            UiCheckbox,
            UiCheckbox,
        ];

        off.checked = true;
        on.checked = false;
        await Promise.all([off.updateComplete, on.updateComplete]);

        form.reset();
        await Promise.all([off.updateComplete, on.updateComplete]);

        expect([off.checked, on.checked]).toEqual([false, true]);
    });

    it('follows a fieldset that disables it, which reaches it and nothing below', async () => {
        const form = await mount(
            '<fieldset disabled><ui-checkbox label="Send a receipt"></ui-checkbox></fieldset>',
        );

        expect(toggle(form).disabled, 'the callback fired').toBe(true);
        expect(box(toggle(form)).disabled, 'and reached the control').toBe(true);
    });

    it('restores what a back-navigation hands back', async () => {
        const form = await mount(fixture);

        toggle(form).formStateRestoreCallback('on');
        await toggle(form).updateComplete;

        expect(toggle(form).checked).toBe(true);

        toggle(form).formStateRestoreCallback(null);
        await toggle(form).updateComplete;

        expect(toggle(form).checked).toBe(false);
    });
});

/**
 * Constraint validation, which moved here with the value: a control in a shadow root is not
 * a submittable element, so a form asks this element and nobody else.
 */
describe('the validity', () => {
    it('is missing while a required box is off, with a message a form can report', async () => {
        const form = await mount('<ui-checkbox label="Terms" name="terms" required></ui-checkbox>');

        expect(toggle(form).validity.valueMissing).toBe(true);
        expect(toggle(form).validationMessage).toBe('Please tick this box if you want to proceed.');
        expect(form.checkValidity(), 'and the form knows').toBe(false);
    });

    it('is satisfied once the required box is ticked', async () => {
        const form = await mount('<ui-checkbox label="Terms" name="terms" required></ui-checkbox>');
        toggle(form).checked = true;
        await toggle(form).updateComplete;

        expect(toggle(form).validity.valueMissing).toBe(false);
        expect(toggle(form).validationMessage).toBe('');
        expect(form.checkValidity()).toBe(true);
    });

    it('leaves a box nobody required alone while it is off', async () => {
        const form = await mount(fixture);

        expect(toggle(form).validity.valid).toBe(true);
        expect(form.checkValidity()).toBe(true);
    });

    it('takes the message the host wrote, which wins over the one it writes itself', async () => {
        const form = await mount(
            '<ui-checkbox label="Terms" name="terms" required error="Nope."></ui-checkbox>',
        );

        expect(toggle(form).validity.customError).toBe(true);
        expect(toggle(form).validity.valueMissing, 'the host said it first').toBe(false);
        expect(toggle(form).validationMessage).toBe('Nope.');
    });

    it('drops the message when the host takes it back', async () => {
        const form = await mount(
            '<ui-checkbox label="Terms" name="terms" error="Nope."></ui-checkbox>',
        );
        toggle(form).error = '';
        await toggle(form).updateComplete;

        expect(toggle(form).validity.valid).toBe(true);
        expect(toggle(form).validationMessage).toBe('');
    });

    it('blocks a submit while invalid, and allows one once it is not', async () => {
        const form = await mount('<ui-checkbox label="Terms" name="terms" required></ui-checkbox>');
        let submits = 0;

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            submits += 1;
        });

        form.requestSubmit();

        expect(submits, 'the platform stopped it').toBe(0);

        toggle(form).checked = true;
        await toggle(form).updateComplete;
        form.requestSubmit();

        expect(submits).toBe(1);
    });

    it('delegates focus, so the browser can put the reader on the control', async () => {
        // Neither half is decoration: the host is not a focusable element, so without the
        // delegation `focus()` lands on something that cannot take it — and `focus()` is
        // what the platform calls itself when a form reports an invalid control.
        const form = await mount('<ui-checkbox label="Terms" name="terms" required></ui-checkbox>');

        expect(form.reportValidity()).toBe(false);
        expect(document.activeElement).toBe(toggle(form));
        expect(toggle(form).shadowRoot?.activeElement).toBe(box(toggle(form)));
    });

    it('describes the control by the message it renders, in the root that holds both', async () => {
        const form = await mount(fixture);

        expect(box(toggle(form)).hasAttribute('aria-describedby'), 'nothing to point at').toBe(
            false,
        );
        expect(box(toggle(form)).hasAttribute('aria-invalid'), 'and nothing wrong').toBe(false);
        // Not an empty one, which would be a described-by target with no text and a red
        // boundary waiting on a selector.
        expect(
            toggle(form).shadowRoot?.querySelector('[part="error"]'),
            'and no message at all',
        ).toBeNull();

        toggle(form).error = 'The terms have to be accepted.';
        await toggle(form).updateComplete;

        const message = part(toggle(form), 'error');

        expect(message.textContent).toBe('The terms have to be accepted.');
        expect(box(toggle(form)).getAttribute('aria-describedby')).toBe(message.id);
    });
});

/** What a person does to it, and what a host hears back. */
describe('the interaction', () => {
    it('toggles on a click and mirrors the platform back into the property', async () => {
        const form = await mount(fixture);

        await userEvent.click(box(toggle(form)));

        expect(toggle(form).checked).toBe(true);

        await userEvent.click(box(toggle(form)));

        expect(toggle(form).checked).toBe(false);
    });

    it('toggles on Space, which is the key the platform binds', async () => {
        const form = await mount(fixture);
        toggle(form).focus();

        await userEvent.keyboard(' ');

        expect(toggle(form).checked).toBe(true);
    });

    it('re-dispatches the change the platform keeps inside the shadow root', async () => {
        // `change` is non-composed, so the one the inner control fires stops at the
        // boundary and a host listening on the tag would hear nothing. `input` is
        // composed and needs no help, arriving retargeted on its own — both are asserted
        // from the form, which is where a host most often listens.
        const form = await mount(fixture);
        const heard: string[] = [];
        const targets: (EventTarget | null)[] = [];

        for (const type of ['input', 'change']) {
            form.addEventListener(type, (event) => {
                heard.push(event.type);
                targets.push(event.target);
            });
        }

        await userEvent.click(box(toggle(form)));

        expect(heard).toEqual(['input', 'change']);
        expect(new Set(targets), 'retargeted to the element, not the inner control').toEqual(
            new Set([toggle(form)]),
        );
    });

    it('refuses a click it would do nothing with', async () => {
        const form = await mount(
            '<ui-checkbox label="Send a receipt" name="receipt" disabled></ui-checkbox>',
        );

        await userEvent.click(part(toggle(form), 'label'), { force: true });

        expect(toggle(form).checked).toBe(false);
    });
});

describe('ui-checkbox', () => {
    it('drops the margin the user agent puts around a checkbox', async () => {
        const form = await mount(fixture);

        expect(getComputedStyle(box(toggle(form))).margin).toBe('0px');
    });

    it('draws at the target-size floor, and holds it against a smaller space token', async () => {
        const form = await mount(fixture);

        // WCAG 2.2 2.5.8 asks 24x24 of a target the author sized, which this one is.
        expect(getComputedStyle(box(toggle(form))).blockSize).toBe('24px');
        expect(getComputedStyle(box(toggle(form))).inlineSize).toBe('24px');

        toggle(form).style.setProperty('--ui-space', '4px');

        expect(getComputedStyle(box(toggle(form))).blockSize, 'the floor holds').toBe('24px');
    });

    it('grows with the space token above the floor', async () => {
        const form = await mount(fixture);
        toggle(form).style.setProperty('--ui-space', '16px');

        expect(getComputedStyle(box(toggle(form))).blockSize).toBe('48px');
    });

    it('rests on the surface, inside the boundary the rest of the kit uses', async () => {
        const form = await mount(fixture);
        const styles = getComputedStyle(box(toggle(form)));

        expect(styles.appearance).toBe('none');
        expect(styles.backgroundColor).toBe('rgb(255, 255, 255)');
        expect(styles.borderTopWidth).toBe('1px');
        expect(styles.borderTopStyle).toBe('solid');
        expect(styles.borderRadius).toBe('6px');
        expect(styles.cursor).toBe('pointer');
    });

    it('sets the control beside its text, a space apart', async () => {
        const form = await mount(fixture);
        const styles = getComputedStyle(part(toggle(form), 'label'));

        // Not inline-flex: a flex item's display is blockified, so the two would render
        // identically here and the sheet declares the one that is readable back.
        expect(styles.display).toBe('flex');
        expect(styles.alignItems).toBe('center');
        expect(styles.columnGap).toBe('8px');
        expect(styles.color, '--ui-color-text').toBe('rgb(31, 41, 55)');
    });

    it('fills with the accent when checked', async () => {
        const form = await mount(fixture);
        withoutMotion(toggle(form));
        toggle(form).checked = true;
        await toggle(form).updateComplete;

        const styles = getComputedStyle(box(toggle(form)));

        expect(styles.backgroundColor).toBe('rgb(37, 99, 235)');
        expect(styles.borderTopColor).toBe('rgb(37, 99, 235)');
    });

    it('marks the fill by subtracting the tick from it, rather than painting one on', async () => {
        const form = await mount('<ui-checkbox label="Send a receipt" checked></ui-checkbox>');

        const styles = getComputedStyle(box(toggle(form)));

        // Two layers and `exclude` is the whole mechanism: the mark is the hole, so its
        // colour is whatever the control sits on and no colour is frozen in the data URI.
        expect(styles.maskComposite).toBe('exclude, exclude');
        expect(styles.maskImage).toContain('linear-gradient');
        expect(styles.maskImage).toContain('svg');
        expect(styles.maskRepeat).toBe('no-repeat, no-repeat');
        expect(styles.maskSize).toBe('100% 100%, 100% 100%');
    });

    it('draws a dash for the mixed state the platform stopped drawing', async () => {
        const form = await mount('<ui-checkbox label="All" indeterminate></ui-checkbox>');
        withoutMotion(toggle(form));

        expect(box(toggle(form)).indeterminate, 'an attribute the platform never had').toBe(true);

        const styles = getComputedStyle(box(toggle(form)));

        expect(styles.backgroundColor, 'filled, like checked').toBe('rgb(37, 99, 235)');
        expect(styles.borderTopColor, 'boundary included').toBe('rgb(37, 99, 235)');
        expect(styles.maskComposite).toBe('exclude, exclude');
        expect(styles.maskImage, 'a rectangle needs no picture').not.toContain('svg');
        expect(styles.maskSize, 'a bar across the middle').toBe('100% 100%, 12px 2px');
        expect(styles.maskPosition).toBe('50% 50%, 50% 50%');
    });

    it('lets a toggle answer the question the mixed state was asking', async () => {
        // The platform clears `indeterminate` on the control as part of the toggle, so the
        // property is read back rather than assumed — without it the next render would put
        // the mixed state straight back on.
        const form = await mount('<ui-checkbox label="All" indeterminate></ui-checkbox>');

        await userEvent.click(box(toggle(form)));
        await toggle(form).updateComplete;

        expect((toggle(form) as UiCheckbox).indeterminate).toBe(false);
        expect(box(toggle(form)).indeterminate).toBe(false);
    });

    it('takes the boundary from the host', async () => {
        const form = await mount(fixture);
        // The boundary is transitioned, so a read taken straight after the change returns
        // the first frame of a 150ms interpolation — which is the *resting* colour, and
        // reads exactly like the override having been ignored. Measured: with the duration
        // held at 5s the immediate read is the resting `color-mix()`, every time.
        withoutMotion(toggle(form));
        toggle(form).style.setProperty('--ui-color-border', 'rgb(1, 2, 3)');

        expect(getComputedStyle(box(toggle(form))).borderTopColor).toBe('rgb(1, 2, 3)');
    });

    it('paints the boundary and the message from one error, never from two', async () => {
        const form = await mount(
            '<ui-checkbox label="Terms" error="The terms have to be accepted."></ui-checkbox>',
        );

        // The error is in the markup, so the boundary is already transitioning by the time
        // this test runs and there is no earlier moment to take the motion out at.
        await settled(box(toggle(form)));

        expect(getComputedStyle(box(toggle(form))).borderTopColor).toBe('rgb(185, 28, 28)');

        const message = getComputedStyle(part(toggle(form), 'error'));

        expect(message.color, '--ui-color-danger').toBe('rgb(185, 28, 28)');

        toggle(form).style.setProperty('--ui-text-supporting', '19px');

        expect(getComputedStyle(part(toggle(form), 'error')).fontSize, '--ui-text-supporting').toBe(
            '19px',
        );
    });

    it('stacks the message under the control without widening the click target', async () => {
        const form = await mount(
            '<ui-checkbox label="Yes" error="A message longer than that label"></ui-checkbox>',
        );
        const label = part(toggle(form), 'label').getBoundingClientRect();
        const message = part(toggle(form), 'error').getBoundingClientRect();

        expect(message.top, 'under, not beside').toBeGreaterThanOrEqual(label.bottom);
        expect(getComputedStyle(toggle(form)).rowGap, 'half a space apart').toBe('4px');
        // Stretched to the message's width, the label would be a click target running
        // under text that is not part of it.
        expect(label.width).toBeLessThan(toggle(form).getBoundingClientRect().width);
    });

    it('refuses a pointer it will do nothing with', async () => {
        const form = await mount('<ui-checkbox label="Send a receipt" disabled></ui-checkbox>');

        expect(getComputedStyle(box(toggle(form))).opacity).toBe('0.5');

        expect(getComputedStyle(part(toggle(form), 'label')).cursor).toBe('not-allowed');

        // The muted text is a derived token, so its value is a `color-mix()` that computes
        // in oklab — overridden rather than compared to a literal, which would assert the
        // mix rather than that the rule reads this name.
        toggle(form).style.setProperty('--ui-color-text-muted', 'rgb(1, 2, 3)');

        expect(getComputedStyle(part(toggle(form), 'label')).color).toBe('rgb(1, 2, 3)');
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
        toggle(form).style.setProperty('--ui-color-focus', 'rgb(1, 2, 3)');

        await userEvent.tab();

        expect(document.activeElement, 'tab reached the element').toBe(toggle(form));
        expect(toggle(form).shadowRoot?.activeElement, 'and the control inside it').toBe(
            box(toggle(form)),
        );
        expect(getComputedStyle(box(toggle(form))).outlineColor).toBe('rgb(1, 2, 3)');
    });

    it('announces nothing about itself — an input already says what it is', async () => {
        const form = await mount(fixture);

        expect(box(toggle(form)).hasAttribute('role')).toBe(false);
    });
});

describe('ui-switch', () => {
    const fixture = '<ui-switch label="Email notifications" name="notify"></ui-switch>';

    it('announces itself as a switch, so the host cannot forget to', async () => {
        const form = await mount(fixture);

        expect(box(toggle(form)).getAttribute('role')).toBe('switch');
    });

    it('is a pill wider than it is tall, and takes its track from the boundary token', async () => {
        const form = await mount(fixture);
        const styles = getComputedStyle(box(toggle(form)));

        expect(styles.blockSize).toBe('24px');
        expect(styles.inlineSize).toBe('40px');
        expect(styles.borderRadius, 'at half the height or more, the ends are round').toBe('24px');
        // Compared against the checkbox's boundary rather than to a literal: the token is
        // derived, so its value is a `color-mix()` that computes in oklab, and asserting
        // the number would assert the mix rather than that both read the same name.
        const other = await mount('<ui-checkbox label="Send a receipt"></ui-checkbox>');

        expect(styles.backgroundColor, 'the 3:1 boundary, as a fill').toBe(
            getComputedStyle(box(toggle(other))).borderTopColor,
        );
        // One flat track: the border is the same colour, so the pill has no ring around it
        // that the checkbox's boundary would otherwise leave behind.
        expect(styles.borderTopColor).toBe(styles.backgroundColor);
    });

    it('carries the thumb as a layer, because an element could not be told it is on', async () => {
        const form = await mount(fixture);
        const styles = getComputedStyle(box(toggle(form)));

        expect(styles.backgroundImage).toContain('radial-gradient');
        expect(styles.backgroundSize).toBe('16px');
        expect(styles.backgroundRepeat, 'one thumb, not a row of them').toBe('no-repeat');
    });

    it('slides the thumb across on the way to on', async () => {
        const form = await mount(fixture);
        withoutMotion(toggle(form));

        const off = getComputedStyle(box(toggle(form))).backgroundPosition;

        expect(off).toBe('4px 50%');

        toggle(form).checked = true;
        await toggle(form).updateComplete;

        expect(getComputedStyle(box(toggle(form))).backgroundPosition).not.toBe(off);
    });

    it('moves the thumb over the state duration, along with the colours', async () => {
        const form = await mount(fixture);
        const styles = getComputedStyle(box(toggle(form)));

        expect(styles.transitionProperty).toBe(
            'background-color, border-color, background-position',
        );
        expect(styles.transitionDuration).toBe('0.15s, 0.15s, 0.15s');
    });

    it('has no mixed state, because a switch has no third value', async () => {
        const form = await mount(fixture);

        // The property is a checkbox's and this element does not answer it, so the control
        // it renders is never in the mixed state — read rather than asserted against the
        // stylesheet's text, which does name `:indeterminate` in the forced-colors block.
        expect(box(toggle(form)).indeterminate, 'the control is never mixed').toBe(false);
        expect('indeterminate' in toggle(form), 'and no property invites one').toBe(false);
    });
});

/**
 * A component that accepts interaction and shows no feedback is defective. Nothing here
 * restates a colour: the question a hover asks is *did it move*.
 */
describe('the interaction states', () => {
    it('answers a pointer while unchecked, on the boundary', async () => {
        const form = await mount(fixture);
        withoutMotion(toggle(form));

        const resting = getComputedStyle(box(toggle(form))).borderColor;

        await userEvent.hover(box(toggle(form)));

        expect(getComputedStyle(box(toggle(form))).borderColor).not.toBe(resting);
    });

    it('answers a pointer while checked, on the fill', async () => {
        const form = await mount('<ui-checkbox label="Send a receipt" checked></ui-checkbox>');
        withoutMotion(toggle(form));

        const resting = getComputedStyle(box(toggle(form))).backgroundColor;

        await userEvent.hover(box(toggle(form)));

        const hovered = getComputedStyle(box(toggle(form)));

        expect(hovered.backgroundColor).not.toBe(resting);
        // The boundary moves with the fill rather than being left at the resting accent,
        // which would draw a ring around a control that is only being pointed at.
        expect(hovered.borderTopColor).toBe(hovered.backgroundColor);
    });

    it('ignores a pointer while disabled', async () => {
        const form = await mount('<ui-checkbox label="Send a receipt" disabled></ui-checkbox>');
        withoutMotion(toggle(form));

        const resting = getComputedStyle(box(toggle(form))).borderColor;

        await userEvent.hover(box(toggle(form)));

        expect(getComputedStyle(box(toggle(form))).borderColor).toBe(resting);
    });

    it('moves the boundary and the fill over the state duration, and nothing else', async () => {
        const form = await mount(fixture);
        const styles = getComputedStyle(box(toggle(form)));

        expect(styles.transitionProperty).toBe('background-color, border-color');
        expect(styles.transitionDuration).toBe('0.15s, 0.15s');
    });

    it('guards every interaction rule against the state that refuses it', () => {
        // Structural, and it reaches the rules a later control might add: a disabled
        // control still matches :hover.
        const rules = [...styleText('ui-checkbox').matchAll(/input[a-z:()-]*:hover[a-z:()-]*/g)];

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
        withoutMotion(toggle(form));
        await forcedColors(true);

        expect(matchMedia('(forced-colors: active)').matches, 'the mode is on').toBe(true);

        const resting = getComputedStyle(box(toggle(form))).backgroundColor;

        toggle(form).checked = true;
        await toggle(form).updateComplete;

        expect(getComputedStyle(box(toggle(form))).backgroundColor).not.toBe(resting);
    });

    it('keeps the mixed state apart from unchecked too', async () => {
        const form = await mount(fixture);
        withoutMotion(toggle(form));
        await forcedColors(true);

        const resting = getComputedStyle(box(toggle(form))).backgroundColor;

        (toggle(form) as UiCheckbox).indeterminate = true;
        await toggle(form).updateComplete;

        expect(getComputedStyle(box(toggle(form))).backgroundColor).not.toBe(resting);
    });

    it('says unavailable with a colour rather than a veil, which is not forced', async () => {
        const form = await mount('<ui-checkbox label="Send a receipt" disabled></ui-checkbox>');
        await forcedColors(true);

        expect(getComputedStyle(box(toggle(form))).opacity).toBe('1');
        expect(getComputedStyle(box(toggle(form))).borderTopColor, 'GrayText').not.toBe(
            'rgb(255, 255, 255)',
        );
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

    it('has no violations named by markup the slot carries', async () => {
        await expectAccessible(await mountStory(Markup, meta, 'Markup'));
    });
});

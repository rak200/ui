import { afterEach, describe, expect, it } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
// The playwright provider is what puts `send` on `CDPSession` — see `tokens.test.ts`.
import type {} from '@vitest/browser-playwright';
import { buttonEffects, fieldEffects, pressed } from '../src/effects.js';

/**
 * A component of the test's own that is a button: a host whose shadow root adopts the sheet built
 * for `component`, around a secondary control, with every duration taken out so a read is where an
 * effect lands.
 */
function mount(component: string): { host: HTMLElement; control: HTMLButtonElement } {
    const host = document.createElement('div');
    const root = host.attachShadow({ mode: 'open' });
    const sheet = buttonEffects(component).styleSheet;

    if (sheet === undefined) {
        throw new Error('the engine built no sheet to adopt');
    }

    root.adoptedStyleSheets = [sheet];
    root.innerHTML = '<button class="secondary">Press</button>';
    host.style.setProperty('--ui-duration-effect', '0s');
    host.style.setProperty('--ui-duration-state', '0s');
    document.body.append(host);

    const control = root.querySelector('button');

    if (control === null) {
        throw new Error('the fixture holds no control');
    }

    return { host, control };
}

afterEach(() => {
    for (const animation of document.getAnimations()) {
        animation.cancel();
    }

    document.body.replaceChildren();
});

describe("a button's effects", () => {
    it("draws an effect under the component's own taste name", async () => {
        const { host, control } = mount('test');
        host.style.setProperty('--ui-taste-test-focus-move', 'lift');

        await userEvent.tab();

        expect(getComputedStyle(control).translate).toBe('0px -2px');
    });

    it.each([
        ["the page's taste", '--ui-taste-focus-move', '0px -2px'],
        ['a choice', '--ui-motion-focus-move', '0px -2px'],
        ["another component's taste", '--ui-taste-button-focus-move', 'none'],
    ])('reads %s as a component of its own does', async (_whose, name, translate) => {
        const { host, control } = mount('test');
        host.style.setProperty(name, 'lift');

        await userEvent.tab();

        expect(getComputedStyle(control).translate).toBe(translate);
    });

    it('breaks a button and spreads its ripple through one listener, where its sheet chose both', () => {
        const control = document.createElement('button');
        control.style.cssText =
            'display: block; box-sizing: border-box; width: 100px; height: 40px; margin: 20px 0 0 30px';

        for (const [name, value] of [
            ['--ui-fx-press', 'shatter'],
            ['--ui-fx-press-time', '240ms'],
            ['--ui-fx-press-curve', 'linear'],
            ['--ui-fx-ripple-time', '520ms'],
            ['--ui-fx-ripple-curve', 'linear'],
        ] as const) {
            control.style.setProperty(name, value);
        }

        control.addEventListener('pointerdown', pressed);
        document.body.append(control);

        const box = control.getBoundingClientRect();
        const at = { clientX: box.left + 30, clientY: box.top + 10 };

        control.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, ...at }));

        try {
            expect(control.style.filter, 'broken').toBe('url("#ui-break")');
            expect(control.hasAttribute('data-ripple'), 'rippling').toBe(true);
        } finally {
            // Let go, so the pieces go back together and the press's listeners leave the page.
            window.dispatchEvent(new PointerEvent('pointerup', at));
        }
    });
});

/** The button's drop, as the engine computes it on a light page. */
const raised = 'rgba(0, 0, 0, 0.25) 0px 2px 4px -1px, rgba(0, 0, 0, 0.35) 0px 6px 14px -4px';

/**
 * A field of the test's own: a host whose shadow root adopts the sheet built for `component`, whose
 * control is the element that name names, alone in the box a field draws its glow on — with every
 * duration taken out, and the effects `choices` names chosen.
 */
function field(
    component: 'input' | 'textarea' | 'select',
    able: string,
    choices: Readonly<Record<string, string>>,
    attributes = '',
): { host: HTMLElement; control: HTMLElement; box: HTMLElement } {
    const host = document.createElement('div');
    const root = host.attachShadow({ mode: 'open', delegatesFocus: true });
    const sheet = fieldEffects(component, able).styleSheet;

    if (sheet === undefined) {
        throw new Error('the engine built no sheet to adopt');
    }

    root.adoptedStyleSheets = [sheet];
    root.innerHTML = `<span class="glow" style="display: grid"><${component} ${attributes}></${component}></span>`;
    host.style.setProperty('--ui-duration-effect', '0s');
    host.style.setProperty('--ui-duration-state', '0s');

    for (const [moment, effect] of Object.entries(choices)) {
        host.style.setProperty(`--ui-motion-${moment}`, effect);
    }

    document.body.append(host);

    const control = root.querySelector<HTMLElement>(component);
    const box = root.querySelector<HTMLElement>('.glow');

    if (control === null || box === null) {
        throw new Error('the fixture holds no field');
    }

    return { host, control, box };
}

/** A text control's guard, as `src/input.ts` hands it over. */
const typed = ':not(:disabled):not([readonly])';

describe("a field's effects", () => {
    afterEach(async () => {
        await cdp().send('Input.dispatchMouseEvent', {
            type: 'mouseMoved',
            x: innerWidth - 1,
            y: innerHeight - 1,
            buttons: 0,
        });
    });

    it.each([
        ['an input', 'input', typed],
        ['a textarea', 'textarea', typed],
        ['a select', 'select', ':not(:disabled)'],
    ] as const)("raises %s under the pointer, the button's drop", async (_what, tag, able) => {
        const { control } = field(tag, able, { 'hover-shadow': 'raise' });

        await userEvent.hover(control);

        expect(getComputedStyle(control).boxShadow).toBe(raised);
    });

    it.each([
        ['disabled', 'disabled'],
        ['read-only', 'readonly'],
    ])('raises nothing under the pointer on a field that is %s', async (_what, attribute) => {
        const { control } = field('input', typed, { 'hover-shadow': 'raise' }, attribute);

        await userEvent.hover(control);

        expect(getComputedStyle(control).boxShadow).toBe('none');
    });

    it('lets the focus win: a pointer resting on a focused field changes nothing', async () => {
        const { control } = field('input', typed, { 'hover-shadow': 'raise' });

        await userEvent.tab();
        await userEvent.hover(control);

        expect(getComputedStyle(control).boxShadow).toBe('none');
    });

    it('raises it at the focus, and lifts the box round it two pixels, the ring with it', async () => {
        const { control, box } = field('input', typed, {
            'focus-shadow': 'raise',
            'focus-move': 'lift',
        });

        await userEvent.tab();

        expect(getComputedStyle(control).boxShadow, 'raised').toBe(raised);
        expect(getComputedStyle(control).translate, 'the control itself stays').toBe('none');
        expect(getComputedStyle(box).translate, 'the box lifted').toBe('0px -2px');
    });

    it.each([
        ['hover-shadow', 'raise'],
        ['focus-shadow', 'raise'],
        ['focus-move', 'lift'],
    ])('moves the shadow and the place once %s is %s, and only then', (moment, effect) => {
        const still = field('input', typed, {});
        const moving = field('input', typed, { [moment]: effect });
        const transitions = (control: HTMLElement, box: HTMLElement): readonly string[] => [
            getComputedStyle(control).transitionProperty,
            getComputedStyle(box).transitionProperty,
        ];

        expect(transitions(moving.control, moving.box), 'chosen').toEqual([
            'border-color, box-shadow',
            'translate',
        ]);
        expect(transitions(still.control, still.box), 'nothing chosen').toEqual(['all', 'all']);
    });

    it('hands the ring the glide while the reader can see the focus, never in forced colours', async () => {
        const { control } = field('input', typed, { 'focus-ring': 'glide' });
        const handed = (): readonly string[] =>
            ['', '-time', '-curve'].map((name) =>
                getComputedStyle(control).getPropertyValue(`--ui-fx-ring${name}`),
            );

        await userEvent.tab();

        expect(handed(), 'handed').toEqual(['glide', '360ms', 'cubic-bezier(0.4, 0, 0.2, 1)']);

        await cdp().send('Emulation.setEmulatedMedia', {
            features: [{ name: 'forced-colors', value: 'active' }],
        });

        try {
            expect(handed(), 'in forced colours').toEqual(['', '', '']);
        } finally {
            await cdp().send('Emulation.setEmulatedMedia', { features: [] });
        }
    });

    it.each([
        ["the field's own taste", '--ui-taste-input-focus-move', '0px -2px'],
        ["another field's", '--ui-taste-select-focus-move', 'none'],
    ])('reads %s', async (_whose, name, translate) => {
        const { host, box } = field('input', typed, {});
        host.style.setProperty(name, 'lift');

        await userEvent.tab();

        expect(getComputedStyle(box).translate).toBe(translate);
    });
});

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
): { host: HTMLElement; control: HTMLElement; box: HTMLElement; label: HTMLElement } {
    const host = document.createElement('div');
    const root = host.attachShadow({ mode: 'open', delegatesFocus: true });
    const sheet = fieldEffects(component, able).styleSheet;

    if (sheet === undefined) {
        throw new Error('the engine built no sheet to adopt');
    }

    root.adoptedStyleSheets = [sheet];
    root.innerHTML = `<label for="control">Name</label><span class="glow" style="display: grid"><${component} id="control" ${attributes}></${component}></span>`;
    host.style.setProperty('--ui-duration-effect', '0s');
    host.style.setProperty('--ui-duration-state', '0s');

    for (const [moment, effect] of Object.entries(choices)) {
        host.style.setProperty(`--ui-motion-${moment}`, effect);
    }

    document.body.append(host);

    const control = root.querySelector<HTMLElement>(component);
    const box = root.querySelector<HTMLElement>('.glow');
    const label = root.querySelector<HTMLElement>('label');

    if (control === null || box === null || label === null) {
        throw new Error('the fixture holds no field');
    }

    return { host, control, box, label };
}

/** What the engine computes `value` to as a colour, on an element of the page. */
function colour(value: string): string {
    const probe = document.createElement('div');
    probe.style.color = value;
    document.body.append(probe);

    try {
        return getComputedStyle(probe).color;
    } finally {
        probe.remove();
    }
}

/** The one CSS animation named `name` running on `target` or a layer of it. */
function running(target: HTMLElement, name: string): CSSAnimation {
    const found = target
        .getAnimations({ subtree: true })
        .find(
            (animation): animation is CSSAnimation =>
                animation instanceof CSSAnimation && animation.animationName === name,
        );

    if (found === undefined) {
        throw new Error(`no ${name} running`);
    }

    return found;
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
        // A value of its own for each token, so each is read where it is written.
        const tokens = {
            '--ui-duration-state': '0.1s',
            '--ui-duration-effect': '0.2s',
            '--ui-easing-state': 'linear',
            '--ui-easing-enter': 'ease-in',
        };

        for (const [name, value] of Object.entries(tokens)) {
            moving.host.style.setProperty(name, value);
        }

        const transitions = (control: HTMLElement, box: HTMLElement): readonly string[] => [
            getComputedStyle(control).transitionProperty,
            getComputedStyle(box).transitionProperty,
        ];

        expect(transitions(moving.control, moving.box), 'chosen').toEqual([
            'border-color, box-shadow',
            'translate',
        ]);
        expect(
            [moving.control, moving.box].map((target) => {
                const styles = getComputedStyle(target);

                return [styles.transitionDuration, styles.transitionTimingFunction];
            }),
            'the boundary on the state, the shadow and the place on an effect',
        ).toEqual([
            ['0.1s, 0.2s', 'linear, ease-in'],
            ['0.2s', 'ease-in'],
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

    it('moves the label on its own transition where the accent is chosen for it', () => {
        const { host, label } = field('input', typed, { 'focus-label': 'accent' });
        host.style.setProperty('--ui-duration-effect', '0.2s');
        host.style.setProperty('--ui-easing-state', 'linear');

        const styles = getComputedStyle(label);

        expect([
            styles.transitionProperty,
            styles.transitionDuration,
            styles.transitionTimingFunction,
        ]).toEqual(['color', '0.2s', 'linear']);
    });

    it('takes the label to the accent at the focus, with a fifth of the text in it', async () => {
        const { host, label } = field('input', typed, { 'focus-label': 'accent' });
        host.style.setProperty('--ui-color-accent', 'rgb(0, 0, 255)');
        host.style.setProperty('--ui-color-text', 'rgb(0, 0, 0)');

        const resting = getComputedStyle(label).color;

        await userEvent.tab();

        const mixed = colour('color-mix(in oklab, rgb(0, 0, 255) 80%, rgb(0, 0, 0))');

        expect(getComputedStyle(label).color, 'at the focus').toBe(mixed);
        expect(resting, 'before it').not.toBe(mixed);
    });

    it('sends a band of the danger out from a field in error, rounds of a flourish that settle', () => {
        const { host, box } = field(
            'input',
            typed,
            { 'invalid-border': 'pulse' },
            'aria-invalid="true"',
        );
        host.style.setProperty('--ui-duration-flourish', '0.5s');
        host.style.setProperty('--ui-easing-enter', 'ease-in');
        host.style.setProperty('--ui-iteration-settle', '3');

        const layer = getComputedStyle(box, '::before');

        expect([
            layer.animationName,
            layer.animationDuration,
            layer.animationTimingFunction,
            layer.animationIterationCount,
        ]).toEqual(['ui-pulse-danger', '0.5s', 'ease-in', '3']);
        expect(
            [layer.position, layer.top, layer.left, layer.pointerEvents],
            'a layer round the box, which takes no pointer',
        ).toEqual(['absolute', '0px', '0px', 'none']);
        expect(getComputedStyle(box).position, 'the box it is laid out against').toBe('relative');
    });

    it('draws the band from the boundary out to 12px, fading from half the danger to nothing', () => {
        const { host, box } = field(
            'input',
            typed,
            { 'invalid-border': 'pulse' },
            'aria-invalid="true"',
        );
        host.style.setProperty('--ui-color-danger', 'rgb(200, 0, 0)');
        host.style.setProperty('--ui-duration-flourish', '10s');
        host.style.setProperty('--ui-easing-enter', 'linear');

        const pulse = running(box, 'ui-pulse-danger');

        pulse.pause();
        pulse.currentTime = 0;

        // An animated shadow's colour is computed in the space it moves through.
        const danger = (opacity: number): string =>
            colour(`oklab(from rgb(200, 0, 0) l a b / ${String(opacity)})`);

        expect(getComputedStyle(box, '::before').boxShadow, 'leaving').toBe(
            `${danger(0.5)} 0px 0px 0px 0px`,
        );

        pulse.currentTime = 5000;

        expect(getComputedStyle(box, '::before').boxShadow, 'halfway').toBe(
            `${danger(0.25)} 0px 0px 0px 6px`,
        );
    });

    it('tints a field in error from a fifth of the danger back to its fill, rounds that settle', () => {
        const { host, control } = field(
            'input',
            typed,
            { 'invalid-fill': 'flash' },
            'aria-invalid="true"',
        );
        host.style.setProperty('--ui-duration-flourish', '0.5s');
        host.style.setProperty('--ui-easing-exit', 'linear');
        host.style.setProperty('--ui-iteration-settle', '3');

        const styles = getComputedStyle(control);

        expect([
            styles.animationName,
            styles.animationDuration,
            styles.animationTimingFunction,
            styles.animationIterationCount,
        ]).toEqual(['ui-flash', '0.5s', 'linear', '3']);

        host.style.setProperty('--ui-color-danger', 'rgb(200, 0, 0)');
        host.style.setProperty('--ui-color-surface-control', 'rgb(255, 255, 255)');
        host.style.setProperty('--ui-duration-flourish', '10s');

        const flash = running(control, 'ui-flash');

        flash.pause();
        flash.currentTime = 0;

        expect(getComputedStyle(control).backgroundColor).toBe(
            colour('color-mix(in oklab, rgb(200, 0, 0) 20%, rgb(255, 255, 255))'),
        );
    });

    it('sends nothing out and tints nothing where the field is not in error', () => {
        const { control, box } = field('input', typed, {
            'invalid-border': 'pulse',
            'invalid-fill': 'flash',
        });

        expect(getComputedStyle(box, '::before').animationName, 'the band').toBe('none');
        expect(getComputedStyle(control).animationName, 'the fill').toBe('none');
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

import { afterEach, describe, expect, it } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
// The playwright provider is what puts `send` on `CDPSession` — see `tokens.test.ts`.
import type {} from '@vitest/browser-playwright';
import {
    buttonEffects,
    controlEffects,
    fieldEffects,
    pressed,
    surfaceEffects,
} from '../src/effects.js';
import { held, released } from '../src/held.js';
import { farPole } from '../src/tokens.js';

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

/** The animations an element's one list plays, the kinds that play nothing left out. */
function playing(target: Element, pseudo?: string): readonly string[] {
    return getComputedStyle(target, pseudo)
        .animationName.split(', ')
        .filter((name) => name !== 'none');
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
        ['hover-fill', 'tint'],
        ['hover-shadow', 'raise'],
        ['hover-shadow', 'glow'],
        ['focus-fill', 'tint'],
        ['focus-shadow', 'raise'],
        ['focus-move', 'lift'],
    ])(
        'moves the shadow, the fill and the place once %s is %s, and only then',
        (moment, effect) => {
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
                'border-color, box-shadow, background-color',
                'translate',
            ]);
            expect(
                [moving.control, moving.box].map((target) => {
                    const styles = getComputedStyle(target);

                    return [styles.transitionDuration, styles.transitionTimingFunction];
                }),
                'the boundary on the state, the shadow and the place on an effect',
            ).toEqual([
                ['0.1s, 0.2s, 0.2s', 'linear, ease-in, ease-in'],
                ['0.2s', 'ease-in'],
            ]);
            expect(transitions(still.control, still.box), 'nothing chosen').toEqual(['all', 'all']);
        },
    );

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

        // An error's fill's place in the control's one list, the shadow's and the focus's fill's
        // before it playing nothing.
        expect([
            styles.animationName,
            styles.animationDuration,
            styles.animationTimingFunction,
            styles.animationIterationCount,
        ]).toEqual([
            'none, none, ui-flash, ui-halo',
            '0s, 0s, 0.5s, 0.5s',
            'ease, ease, linear, linear',
            '1, 1, 3, 3',
        ]);

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

        expect(playing(box, '::before'), 'the band').toEqual([]);
        expect(playing(control), 'the fill').toEqual([]);
    });

    it("glows a field under the pointer, the button's light of the accent round it", async () => {
        const { host, control } = field('input', typed, { 'hover-shadow': 'glow' });
        host.style.setProperty('--ui-color-accent', 'rgb(10, 20, 30)');

        await userEvent.hover(control);

        expect(getComputedStyle(control).boxShadow).toBe(
            'color(srgb 0.0392157 0.0784314 0.117647 / 0.5) 0px 0px 12px 2px',
        );
    });

    it("tints a field under the pointer and at the focus with the button's own tint", async () => {
        const tokens = {
            '--ui-color-accent': 'rgb(0, 0, 255)',
            '--ui-color-surface-control': 'rgb(240, 240, 240)',
        };
        const { host, control } = field('input', typed, {
            'hover-fill': 'tint',
            'focus-fill': 'tint',
        });
        const button = document.createElement('div');
        const root = button.attachShadow({ mode: 'open' });
        const sheet = buttonEffects('test').styleSheet;

        if (sheet === undefined) {
            throw new Error('the engine built no sheet to adopt');
        }

        root.adoptedStyleSheets = [sheet];
        root.innerHTML = '<button class="secondary" style="display: block">Tinted</button>';
        button.style.setProperty('--ui-motion-hover-fill', 'tint');

        for (const [name, value] of Object.entries(tokens)) {
            host.style.setProperty(name, value);
            button.style.setProperty(name, value);
        }

        document.body.append(button);

        const own = root.querySelector('button');

        if (own === null) {
            throw new Error('the button rendered no control');
        }

        const resting = getComputedStyle(control).backgroundColor;

        await userEvent.hover(own);

        const buttons = getComputedStyle(own).backgroundColor;

        await userEvent.hover(control);

        expect(getComputedStyle(control).backgroundColor, 'under the pointer').toBe(buttons);
        expect(buttons, 'a tint at all').not.toBe(resting);

        await userEvent.tab();

        expect(getComputedStyle(control).backgroundColor, 'at the focus').toBe(buttons);
    });

    it("takes the darkening's place under the pointer with the boundary at rest, a field in error's red kept", async () => {
        const plain = field('input', typed, { 'hover-border': 'none' });
        const erring = field('input', typed, { 'hover-border': 'none' }, 'aria-invalid="true"');

        for (const { host } of [plain, erring]) {
            host.style.setProperty('--ui-color-border', 'rgb(1, 2, 3)');
            host.style.setProperty('--ui-color-danger', 'rgb(200, 0, 0)');
        }

        await userEvent.hover(plain.control);

        expect(getComputedStyle(plain.control).borderTopColor, 'at rest').toBe('rgb(1, 2, 3)');

        await userEvent.hover(erring.control);

        expect(getComputedStyle(erring.control).borderTopColor, 'in error').toBe('rgb(200, 0, 0)');
    });

    it("bursts light out round a field as the focus arrives, on the shadow's place in its list", async () => {
        const { host, control } = field('input', typed, { 'focus-shadow': 'burst' });
        host.style.setProperty('--ui-duration-flourish', '0.5s');
        host.style.setProperty('--ui-easing-enter', 'ease-in');

        await userEvent.tab();

        const styles = getComputedStyle(control);

        expect([
            styles.animationName,
            styles.animationDuration,
            styles.animationTimingFunction,
        ]).toEqual(['ui-burst, none, none', '0.5s, 0s, 0s', 'ease-in, ease, ease']);
    });

    it('draws the burst from four fifths of the accent at the boundary out to nothing, 10px and 15px soft', async () => {
        const { host, control } = field('input', typed, { 'focus-shadow': 'burst' });
        host.style.setProperty('--ui-color-accent', 'rgb(200, 0, 0)');
        host.style.setProperty('--ui-duration-flourish', '10s');
        host.style.setProperty('--ui-easing-enter', 'linear');

        await userEvent.tab();

        const burst = running(control, 'ui-burst');
        // An animated shadow's colour is computed in the space it moves through.
        const accent = (opacity: number): string =>
            colour(`oklab(from rgb(200, 0, 0) l a b / ${String(opacity)})`);

        burst.pause();
        burst.currentTime = 0;

        expect(getComputedStyle(control).boxShadow, 'arriving').toBe(
            `${accent(0.8)} 0px 0px 0px 0px`,
        );

        burst.currentTime = 5000;

        expect(getComputedStyle(control).boxShadow, 'halfway').toBe(
            `${accent(0.4)} 0px 0px 7.5px 5px`,
        );
    });

    it('plays the burst and the flash at once on a field in error the focus arrives at', async () => {
        const { host, control } = field(
            'input',
            typed,
            { 'focus-shadow': 'burst', 'invalid-fill': 'flash' },
            'aria-invalid="true"',
        );
        host.style.setProperty('--ui-duration-flourish', '10s');

        await userEvent.tab();

        expect(playing(control)).toEqual(['ui-burst', 'ui-flash', 'ui-halo']);
    });

    it("hands the ring the glitch, a flourish's time, a straight clock and its two lines' colours", async () => {
        const { host, control } = field('input', typed, { 'focus-ring': 'glitch' });
        host.style.setProperty('--ui-color-danger', 'rgb(1, 2, 3)');
        host.style.setProperty('--ui-color-info', 'rgb(4, 5, 6)');

        await userEvent.tab();

        const styles = getComputedStyle(control);

        expect(
            ['', '-time', '-curve', '-left', '-right'].map((name) =>
                styles.getPropertyValue(`--ui-fx-ring${name}`),
            ),
        ).toEqual(['glitch', '520ms', 'linear', 'rgb(1, 2, 3)', 'rgb(4, 5, 6)']);
    });

    it('lights the label with a glow of the accent at the focus, on its own transition', async () => {
        const { host, label } = field('input', typed, { 'focus-label': 'glow' });
        host.style.setProperty('--ui-color-accent', 'rgb(10, 20, 30)');
        host.style.setProperty('--ui-duration-effect', '0.2s');
        host.style.setProperty('--ui-easing-state', 'linear');

        const styles = getComputedStyle(label);

        expect(
            [styles.transitionProperty, styles.transitionDuration, styles.transitionTimingFunction],
            'its transition',
        ).toEqual(['text-shadow', '0.2s', 'linear']);

        host.style.setProperty('--ui-duration-effect', '0s');

        await userEvent.tab();

        expect(getComputedStyle(label).textShadow, 'at the focus').toBe(
            'color(srgb 0.0392157 0.0784314 0.117647 / 0.7) 0px 0px 8px',
        );
    });

    it("splits a field in error's boundary into the danger and the info, twice the rounds an effect takes", () => {
        const { host, box } = field(
            'input',
            typed,
            { 'invalid-border': 'split' },
            'aria-invalid="true"',
        );
        host.style.setProperty('--ui-duration-effect', '0.2s');
        host.style.setProperty('--ui-iteration-settle', '3');

        const layer = getComputedStyle(box, '::before');

        expect([
            layer.animationName,
            layer.animationDuration,
            layer.animationTimingFunction,
            layer.animationIterationCount,
        ]).toEqual(['ui-split', '0.2s', 'linear', '6']);
        expect([layer.position, layer.pointerEvents], 'on the layer round the box').toEqual([
            'absolute',
            'none',
        ]);

        host.style.setProperty('--ui-color-danger', 'rgb(200, 0, 0)');
        host.style.setProperty('--ui-color-info', 'rgb(0, 0, 200)');
        host.style.setProperty('--ui-duration-effect', '10s');

        const split = running(box, 'ui-split');

        split.pause();

        // Each of its four keyframes, held where it is written: thrown 3px either way, back, 2px
        // and a pixel down, and a pixel.
        const thrown = [
            [2000, 'rgb(200, 0, 0) -3px 0px 0px 0px, rgb(0, 0, 200) 3px 0px 0px 0px'],
            [4000, 'rgb(200, 0, 0) 3px 0px 0px 0px, rgb(0, 0, 200) -3px 0px 0px 0px'],
            [6000, 'rgb(200, 0, 0) -2px 1px 0px 0px, rgb(0, 0, 200) 2px -1px 0px 0px'],
            [8000, 'rgb(200, 0, 0) 1px 0px 0px 0px, rgb(0, 0, 200) -1px 0px 0px 0px'],
        ] as const;

        for (const [time, shadow] of thrown) {
            split.currentTime = time;

            expect(getComputedStyle(box, '::before').boxShadow, String(time)).toBe(shadow);
        }
    });

    it("holds the button's light inside the boundary at the focus", async () => {
        const { host, control } = field('input', typed, { 'focus-shadow': 'inner' });
        host.style.setProperty('--ui-color-accent', 'rgb(10, 20, 30)');

        await userEvent.tab();

        expect(getComputedStyle(control).boxShadow).toBe(
            'rgb(10, 20, 30) 0px 0px 0px 1px inset, color(srgb 0.0392157 0.0784314 0.117647 / 0.5) 0px 0px 12px 2px inset',
        );
    });

    it("sweeps the button's sheen across a field at the focus, on the focus's fill's place in its list", async () => {
        const { host, control } = field('input', typed, { 'focus-fill': 'shimmer' });
        host.style.setProperty('--ui-duration-loop', '10s');
        host.style.setProperty('--ui-iteration-settle', '3');

        await userEvent.tab();

        const styles = getComputedStyle(control);

        expect(styles.backgroundImage, 'the sheen, and nothing behind it').toMatch(
            /^linear-gradient\(100deg, rgba\(0, 0, 0, 0\) 35%, .+ 50%, rgba\(0, 0, 0, 0\) 65%\), none$/,
        );
        expect([styles.backgroundSize, styles.backgroundRepeat]).toEqual([
            '250% 100%, auto',
            'no-repeat, no-repeat',
        ]);
        expect([
            styles.animationName,
            styles.animationDuration,
            styles.animationTimingFunction,
            styles.animationIterationCount,
        ]).toEqual([
            'none, ui-shimmer, ui-halo, none',
            '0s, 10s, 10s, 0s',
            'ease, linear, linear, ease',
            '1, 3, 3, 1',
        ]);

        // Through the property the button's sheen moves through, halfway across a round.
        const sweep = running(control, 'ui-shimmer');

        sweep.pause();
        sweep.currentTime = 5000;

        expect(getComputedStyle(control).getPropertyValue('--ui-fx-shimmer')).toBe('50%');
    });

    it('draws the sheen a secondary button sweeps, the accent moved off the text', async () => {
        const tokens = {
            '--ui-color-accent': 'rgb(0, 0, 255)',
            '--ui-color-text': 'rgb(0, 0, 0)',
        };
        const { host, control } = field('input', typed, { 'focus-fill': 'shimmer' });
        const button = document.createElement('div');
        const root = button.attachShadow({ mode: 'open' });
        const sheet = buttonEffects('test').styleSheet;

        if (sheet === undefined) {
            throw new Error('the engine built no sheet to adopt');
        }

        root.adoptedStyleSheets = [sheet];
        root.innerHTML = '<button class="secondary">Swept</button>';

        for (const [name, value] of Object.entries(tokens)) {
            host.style.setProperty(name, value);
            button.style.setProperty(name, value);
        }

        document.body.append(button);

        const own = root.querySelector('button');

        if (own === null) {
            throw new Error('the button rendered no control');
        }

        const sheen = colour(getComputedStyle(own).getPropertyValue('--ui-fx-sheen'));

        await userEvent.tab();

        expect(getComputedStyle(control).backgroundImage).toContain(`, ${sheen} 50%, `);
    });

    it('sweeps the sheen in front of what a component hands over as behind it', async () => {
        const { host, control } = field('input', typed, { 'focus-fill': 'shimmer' });
        host.style.setProperty('--ui-duration-loop', '10s');
        control.style.setProperty(
            '--ui-fx-behind',
            'linear-gradient(rgb(255, 0, 0), rgb(255, 0, 0))',
        );
        control.style.setProperty('--ui-fx-behind-size', '10px 10px');
        control.style.setProperty('--ui-fx-behind-position', 'right 4px center');

        await userEvent.tab();

        const styles = getComputedStyle(control);

        expect(styles.backgroundImage, 'the sheen, then what was behind').toMatch(
            /, linear-gradient\(rgb\(255, 0, 0\), rgb\(255, 0, 0\)\)$/,
        );
        expect(styles.backgroundSize, 'each its own size').toBe('250% 100%, 10px 10px');
        expect(styles.backgroundPosition, 'each its own place').toMatch(
            /, calc\(100% - 4px\) 50%$/,
        );
    });

    it.each([
        ['the sheen sweeps', { 'focus-fill': 'shimmer' }, '', 'ui-shimmer'],
        ['the flash plays', { 'invalid-fill': 'flash' }, 'aria-invalid="true"', 'ui-flash'],
    ] as const)(
        'rings the text with a halo in the fill made opaque for as long as %s, and lets it go after',
        async (_while, choices, attributes, light) => {
            const { host, control } = field('input', typed, choices, attributes);
            host.style.setProperty('--ui-color-surface-control', 'rgb(240, 240, 240, 0.2)');
            host.style.setProperty('--ui-duration-loop', '10s');
            host.style.setProperty('--ui-duration-flourish', '10s');

            await userEvent.tab();

            // The fill, opaque; an animated shadow's colour is computed in the space it moves through.
            const ring = colour('oklab(from rgb(240, 240, 240) l a b)');

            expect(getComputedStyle(control).textShadow, 'while it plays').toBe(
                `${ring} 0px 0px 1px, ${ring} 0px 0px 2px, ${ring} 0px 0px 3px, ${ring} 0px 0px 4px`,
            );

            for (const animation of [running(control, light), running(control, 'ui-halo')]) {
                animation.finish();
            }

            expect(getComputedStyle(control).textShadow, 'once it has played').toBe('none');
        },
    );

    /** Writes where the pointer is on the box round a field's control, as the engine writes it. */
    function pointed(box: HTMLElement, near: number, x: number, y: number, nx = 0, ny = 0): void {
        for (const [name, value] of Object.entries({
            near: String(near),
            x: `${String(x)}px`,
            y: `${String(y)}px`,
            nx: String(nx),
            ny: String(ny),
        })) {
            box.style.setProperty(`--ui-fx-pointer-${name}`, value);
        }
    }

    it.each([
        ['hover-fill', 'spotlight'],
        ['hover-shadow', 'cast'],
        ['hover-border', 'edge'],
    ])(
        "hands the engine an effect's time on the box where %s is %s, and only while the pointer can change the field",
        (moment, effect) => {
            const tokens = { '--ui-duration-effect': '0.3s' };
            const handed = (box: HTMLElement): string =>
                getComputedStyle(box).getPropertyValue('--ui-fx-follow');
            const chosen = field('input', typed, { [moment]: effect });
            const readonly = field('input', typed, { [moment]: effect }, 'readonly');
            const plain = field('input', typed, {});

            for (const { host } of [chosen, readonly, plain]) {
                for (const [name, value] of Object.entries(tokens)) {
                    host.style.setProperty(name, value);
                }
            }

            expect(handed(chosen.box), 'chosen').toBe('0.3s');
            expect(handed(readonly.box), 'read-only').toBe('');
            expect(handed(plain.box), 'nothing chosen').toBe('');
        },
    );

    it('lights the field with its own tint where the pointer is, as strong as it is near', async () => {
        const { box, control } = field('input', typed, { 'hover-fill': 'spotlight' });
        const tinted = field('input', typed, { 'hover-fill': 'tint' });

        pointed(box, 1, 30, 10);

        const styles = getComputedStyle(control);
        const stop =
            /^radial-gradient\(256px at 30px 10px, (.+), rgba\(0, 0, 0, 0\) 70%\), none$/.exec(
                styles.backgroundImage,
            )?.[1];

        expect(stop, 'at the pointer, 16rem out, and nothing behind').toBeDefined();
        expect([styles.backgroundSize, styles.backgroundRepeat]).toEqual([
            'auto, auto',
            'no-repeat, no-repeat',
        ]);

        await userEvent.hover(tinted.control);

        expect(stop, "the field's tint, where the pointer is nearest").toBe(
            getComputedStyle(tinted.control).backgroundColor,
        );

        pointed(box, 0, 30, 10);

        expect(getComputedStyle(control).backgroundImage, 'gone with the pointer').toContain(
            ' / 0)',
        );
    });

    it("casts the button's shadow from the control away from the pointer, as near as it is", () => {
        const { box, control } = field('input', typed, { 'hover-shadow': 'cast' });

        pointed(box, 1, 75, 10, 0.5, -0.5);

        expect(getComputedStyle(control).boxShadow).toBe(
            'rgba(0, 0, 0, 0.3) -4px 8px 14px -2px, rgba(0, 0, 0, 0) 6px -6px 24px 2px',
        );
    });

    it('lights a band on the boundary nearest the pointer, on the layer round the box, as strong as it is near', () => {
        const { box } = field('input', typed, { 'hover-border': 'edge' });

        pointed(box, 1, 30, 10);

        const layer = getComputedStyle(box, '::before');

        expect(layer.opacity, 'as near as the pointer').toBe('1');
        expect(layer.backgroundImage).toMatch(/^radial-gradient\(100% 100% at 30px 10px, /);
        expect([layer.position, layer.paddingTop, layer.pointerEvents]).toEqual([
            'absolute',
            '2px',
            'none',
        ]);
        expect(getComputedStyle(box).position, 'the box it is laid out against').toBe('relative');
    });

    it('lets the focus win over the lights, and leaves the band to a field in error', async () => {
        const choices = {
            'hover-fill': 'spotlight',
            'hover-shadow': 'cast',
            'hover-border': 'edge',
        };
        const focused = field('input', typed, choices);
        const erring = field('input', typed, choices, 'aria-invalid="true"');

        for (const { box } of [focused, erring]) {
            pointed(box, 1, 30, 10);
        }

        expect(getComputedStyle(erring.box, '::before').backgroundImage, 'in error').toBe('none');

        await userEvent.tab();

        expect(getComputedStyle(focused.box, '::before').opacity, 'the band').toBe('0');
        expect(getComputedStyle(focused.control).boxShadow, 'the cast').toBe('none');
        expect(getComputedStyle(focused.control).backgroundImage, 'the light').toBe('none');
    });

    it("hands the ring the refocus, an effect's time and the curves it comes and goes on", async () => {
        const { host, control } = field('input', typed, { 'focus-ring': 'refocus' });
        host.style.setProperty('--ui-duration-effect', '0.3s');
        host.style.setProperty('--ui-easing-enter', 'ease-in');
        host.style.setProperty('--ui-easing-exit', 'linear');

        await userEvent.tab();

        const styles = getComputedStyle(control);

        expect(
            ['', '-time', '-curve', '-exit'].map((name) =>
                styles.getPropertyValue(`--ui-fx-ring${name}`),
            ),
        ).toEqual(['refocus', '0.3s', 'ease-in', 'linear']);
    });

    it('holds a light of the danger round a field in error, and none round one that cannot be used', () => {
        const erring = field('input', typed, { 'invalid-border': 'glow' }, 'aria-invalid="true"');
        const disabled = field(
            'input',
            typed,
            { 'invalid-border': 'glow' },
            'aria-invalid="true" disabled',
        );

        for (const { host } of [erring, disabled]) {
            host.style.setProperty('--ui-color-danger', 'rgb(10, 20, 30)');
        }

        const layer = getComputedStyle(erring.box, '::before');

        expect(layer.boxShadow, 'in error').toBe(
            'color(srgb 0.0392157 0.0784314 0.117647 / 0.5) 0px 0px 12px 2px',
        );
        expect([layer.position, layer.pointerEvents], 'on the layer round the box').toEqual([
            'absolute',
            'none',
        ]);
        expect(getComputedStyle(disabled.box, '::before').boxShadow, 'disabled').toBe('none');
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

/**
 * A drawn control of the test's own: a host whose shadow root adopts the sheet built for
 * `component`, around an `<input type="checkbox">` with `attributes` — or around `markup`, whose
 * first control is the one returned — and the effects `choices` names chosen on the host.
 */
function drawnControl(
    component: string,
    choices: Readonly<Record<string, string>>,
    attributes = '',
    markup = `<input type="checkbox" ${attributes}>`,
): { host: HTMLElement; input: HTMLInputElement } {
    const host = document.createElement('div');
    const root = host.attachShadow({ mode: 'open' });
    const sheet = controlEffects(component).styleSheet;

    if (sheet === undefined) {
        throw new Error('the engine built no sheet to adopt');
    }

    root.adoptedStyleSheets = [sheet];
    root.innerHTML = markup;

    for (const [moment, effect] of Object.entries(choices)) {
        host.style.setProperty(`--ui-motion-${moment}`, effect);
    }

    document.body.append(host);

    const input = root.querySelector('input');

    if (input === null) {
        throw new Error('the fixture holds no control');
    }

    return { host, input };
}

describe("a drawn control's effects", () => {
    /** What the sheet hands src/check.ts on a control: the mark, its time and its curve. */
    function handed(input: HTMLInputElement): readonly string[] {
        const styles = getComputedStyle(input);

        return ['', '-time', '-curve'].map((name) =>
            styles.getPropertyValue(`--ui-fx-check${name}`),
        );
    }

    it.each([
        ['draw', '--ui-easing-enter', 'ease-in'],
        ['pop', '--ui-easing-emphasis', 'ease-out'],
    ])(
        "hands the mark %s, an effect's time and its curve, while the control can be used",
        (effect, curve, value) => {
            const usable = drawnControl('checkbox', { check: effect });
            const disabled = drawnControl('checkbox', { check: effect }, 'disabled');

            for (const { host } of [usable, disabled]) {
                host.style.setProperty('--ui-duration-effect', '0.3s');
                host.style.setProperty(curve, value);
            }

            expect(handed(usable.input), 'usable').toEqual([effect, '0.3s', value]);
            expect(handed(disabled.input), 'disabled').toEqual(['', '', '']);
        },
    );

    it("takes a control's colours out of its transitions while its mark plays", () => {
        const { input } = drawnControl('checkbox', {}, 'data-check');

        expect(getComputedStyle(input).transitionProperty).toBe('none');
    });

    it("springs a switch's thumb over a flourish on the reference's spring, its track at once and its place as the lift moves it", () => {
        const { host, input } = drawnControl(
            'switch',
            { check: 'spring', 'focus-move': 'lift' },
            'role="switch"',
        );
        host.style.setProperty('--ui-duration-state', '0.1s');
        host.style.setProperty('--ui-duration-flourish', '0.6s');
        host.style.setProperty('--ui-duration-effect', '0.2s');
        host.style.setProperty('--ui-easing-enter', 'ease-in');

        const styles = getComputedStyle(input);

        expect(styles.transitionProperty, "the lift's").toBe(
            'background-color, border-color, background-position, translate',
        );
        expect(styles.transitionDuration).toBe('0s, 0s, 0.6s, 0.2s');
        expect(styles.transitionTimingFunction).toMatch(
            /^linear, linear, linear\(0( 0%)?, 0\.45 7%, 0\.98 15%, 1\.18 22%, 1\.22 26%, 1\.15 32%, 0\.97 44%, 0\.94 52%, 1\.01 66%, 1 78%, 1( 100%)?\), ease-in$/,
        );
    });

    it('springs nothing on a control that is not a switch, which has no thumb', () => {
        const { input } = drawnControl('checkbox', { check: 'spring' });

        expect(getComputedStyle(input).transitionDuration).toBe('0s');
    });

    it.each([
        ["the control's own taste", '--ui-taste-checkbox-check', 'draw'],
        ["another control's", '--ui-taste-radio-check', ''],
    ])('reads %s', (_whose, name, mark) => {
        const { host, input } = drawnControl('checkbox', {});
        host.style.setProperty(name, 'draw');

        expect(handed(input)[0]).toBe(mark);
    });

    /** A light that is not there, as the engine computes the layer's fallback. */
    const clear = 'rgba(0, 0, 0, 0) 0px 0px 0px 0px';

    /** The inner light's place and an error's, with nothing in them. */
    const unlit =
        'rgba(0, 0, 0, 0) 0px 0px 0px 0px inset, rgba(0, 0, 0, 0) 0px 0px 0px 0px inset, rgba(0, 0, 0, 0) 0px 0px 0px 0px';

    /** A control drawn as the components draw one, which the lights' layer is laid over. */
    const drawnBox =
        'style="appearance: none; margin: 0; width: 20px; height: 20px; border-width: 1px; border-style: solid; border-radius: 5px"';

    /** Each colour the pointer's effects draw in, each its own, on the host round a control. */
    function coloured(host: HTMLElement): void {
        host.style.setProperty('--ui-color-border', 'rgb(1, 2, 3)');
        host.style.setProperty('--ui-color-hover', 'rgb(4, 5, 6)');
        host.style.setProperty('--ui-color-accent', 'rgb(0, 0, 200)');
        host.style.setProperty('--ui-color-accent-hover', 'rgb(0, 0, 100)');
        host.style.setProperty('--ui-color-danger', 'rgb(200, 0, 0)');
    }

    /** A control's fill and its boundary. */
    function colours(input: HTMLInputElement): readonly string[] {
        const styles = getComputedStyle(input);

        return [styles.backgroundColor, styles.borderTopColor];
    }

    it.each([
        ['hover-shadow', 'raise'],
        ['hover-shadow', 'glow'],
        ['hover-shadow', 'cast'],
        ['focus-shadow', 'raise'],
        ['focus-shadow', 'inner'],
        ['invalid-border', 'glow'],
    ])(
        "lays the lights' layer over the control's whole box, its boundary and corners included, once %s: %s is chosen",
        (moment, effect) => {
            // A switch, whose own sheet does not lay its control out for a layer: the sheet does.
            const { input } = drawnControl(
                'switch',
                { [moment]: effect },
                `role="switch" ${drawnBox}`,
            );
            const layer = getComputedStyle(input, '::after');

            expect([layer.width, layer.height], 'its box').toEqual([
                `${String(input.offsetWidth)}px`,
                `${String(input.offsetHeight)}px`,
            ]);
            expect(layer.borderTopLeftRadius, 'its corners').toBe('5px');
        },
    );

    it("moves the lights on an effect's time and on the curve an arrival takes", () => {
        const { host, input } = drawnControl('checkbox', { 'hover-shadow': 'raise' });
        host.style.setProperty('--ui-duration-effect', '0.3s');
        host.style.setProperty('--ui-easing-enter', 'ease-in');

        const layer = getComputedStyle(input, '::after');

        expect([
            layer.transitionProperty,
            layer.transitionDuration,
            layer.transitionTimingFunction,
        ]).toEqual(['box-shadow', '0.3s', 'ease-in']);
    });

    it('raises a control under the pointer, on a light of its own', async () => {
        const { host, input } = drawnControl('checkbox', { 'hover-shadow': 'raise' });
        host.style.setProperty('--ui-duration-effect', '0s');

        await userEvent.hover(input);

        expect(getComputedStyle(input, '::after').boxShadow).toBe(`${raised}, ${clear}, ${unlit}`);
    });

    it('raises a control at the focus, on a light of its own', async () => {
        const { host, input } = drawnControl('checkbox', { 'focus-shadow': 'raise' });
        host.style.setProperty('--ui-duration-effect', '0s');

        await userEvent.tab();

        expect(getComputedStyle(input, '::after').boxShadow).toBe(`${clear}, ${raised}, ${unlit}`);
    });

    it("moves a control's place on an effect's time beside its colours on the state's, once the lift is chosen", () => {
        const { host, input } = drawnControl('checkbox', { 'focus-move': 'lift' });
        host.style.setProperty('--ui-duration-state', '0.1s');
        host.style.setProperty('--ui-duration-effect', '0.2s');
        host.style.setProperty('--ui-easing-state', 'linear');
        host.style.setProperty('--ui-easing-enter', 'ease-in');

        const styles = getComputedStyle(input);

        expect([
            styles.transitionProperty,
            styles.transitionDuration,
            styles.transitionTimingFunction,
        ]).toEqual([
            'background-color, border-color, translate',
            '0.1s, 0.1s, 0.2s',
            'linear, linear, ease-in',
        ]);
    });

    it("moves a switch's thumb with its colours, and its place on an effect's time", () => {
        const { host, input } = drawnControl('switch', { 'focus-move': 'lift' }, 'role="switch"');
        host.style.setProperty('--ui-duration-state', '0.1s');
        host.style.setProperty('--ui-duration-effect', '0.2s');
        host.style.setProperty('--ui-easing-state', 'linear');
        host.style.setProperty('--ui-easing-enter', 'ease-in');

        const styles = getComputedStyle(input);

        expect([
            styles.transitionProperty,
            styles.transitionDuration,
            styles.transitionTimingFunction,
        ]).toEqual([
            'background-color, border-color, background-position, translate',
            '0.1s, 0.1s, 0.1s, 0.2s',
            'linear, linear, linear, ease-in',
        ]);
    });

    it('lifts a control two pixels at the focus', async () => {
        const { host, input } = drawnControl('checkbox', { 'focus-move': 'lift' });
        host.style.setProperty('--ui-duration-state', '0s');
        host.style.setProperty('--ui-duration-effect', '0s');

        await userEvent.tab();

        expect(getComputedStyle(input).translate).toBe('0px -2px');
    });

    it.each([['none'], ['edge']])(
        "takes the darkening's place under the pointer under %s, the boundary at rest, a full control's fill and boundary in the accent",
        async (effect) => {
            const empty = drawnControl('checkbox', { 'hover-border': effect }, drawnBox);
            const full = drawnControl(
                'checkbox',
                { 'hover-border': effect },
                `checked ${drawnBox}`,
            );
            const mixed = drawnControl('checkbox', { 'hover-border': effect }, drawnBox);
            mixed.input.indeterminate = true;

            for (const { host } of [empty, full, mixed]) {
                coloured(host);
            }

            await userEvent.hover(empty.input);

            expect(colours(empty.input)[1], 'empty').toBe('rgb(1, 2, 3)');

            await userEvent.hover(full.input);

            expect(colours(full.input), 'checked').toEqual(['rgb(0, 0, 200)', 'rgb(0, 0, 200)']);

            await userEvent.hover(mixed.input);

            expect(colours(mixed.input), 'mixed').toEqual(['rgb(0, 0, 200)', 'rgb(0, 0, 200)']);
        },
    );

    it.each([
        ['none for the boundary', { 'hover-border': 'none' }, 'rgb(0, 0, 200)'],
        ['the edge for the boundary', { 'hover-border': 'edge' }, 'rgb(0, 0, 200)'],
        ['highlight for the fill', { 'hover-fill': 'highlight' }, 'rgb(0, 0, 100)'],
        ['tint for the fill', { 'hover-fill': 'tint' }, 'rgb(0, 0, 100)'],
        [
            'both, as the default theme names them',
            { 'hover-border': 'none', 'hover-fill': 'highlight' },
            'rgb(0, 0, 100)',
        ],
    ])(
        'keeps the red of a full control in error under the pointer, on the control or on its set, under %s',
        async (_under, choices, fill) => {
            const own = drawnControl(
                'checkbox',
                choices,
                `checked aria-invalid="true" ${drawnBox}`,
            );
            const set = drawnControl(
                'radio',
                choices,
                '',
                `<div aria-invalid="true"><input type="radio" name="set" checked ${drawnBox}></div>`,
            );

            for (const { host } of [own, set]) {
                coloured(host);
            }

            await userEvent.hover(own.input);

            expect(colours(own.input), 'its own').toEqual([fill, 'rgb(200, 0, 0)']);

            await userEvent.hover(set.input);

            expect(colours(set.input), 'its set').toEqual([fill, 'rgb(200, 0, 0)']);
        },
    );

    it('fills a control under the pointer with the hover colour, and a full one with the deeper accent, its boundary with it', async () => {
        const pointed = { 'hover-border': 'none', 'hover-fill': 'highlight' };
        const empty = drawnControl('checkbox', pointed, drawnBox);
        const full = drawnControl('checkbox', pointed, `checked ${drawnBox}`);

        for (const { host } of [empty, full]) {
            coloured(host);
        }

        await userEvent.hover(empty.input);

        expect(colours(empty.input), 'empty').toEqual(['rgb(4, 5, 6)', 'rgb(1, 2, 3)']);

        await userEvent.hover(full.input);

        expect(colours(full.input), 'full').toEqual(['rgb(0, 0, 100)', 'rgb(0, 0, 100)']);
    });

    it('draws a radio full under the pointer only once it is chosen, though one in a group with no choice is indeterminate', async () => {
        const { host, input } = drawnControl(
            'radio',
            { 'hover-border': 'none', 'hover-fill': 'highlight' },
            '',
            `<input type="radio" name="unchosen" ${drawnBox}>`,
        );
        coloured(host);

        expect(input.matches(':indeterminate'), 'indeterminate').toBe(true);

        await userEvent.hover(input);

        expect(colours(input)).toEqual(['rgb(4, 5, 6)', 'rgb(1, 2, 3)']);
    });

    it("leaves a control with the focus as the focus has it, under the pointer's effects", async () => {
        const { host, input } = drawnControl(
            'checkbox',
            {
                'hover-border': 'none',
                'hover-fill': 'highlight',
                'hover-shadow': 'raise',
            },
            drawnBox,
        );
        coloured(host);
        host.style.setProperty('--ui-duration-effect', '0s');

        await userEvent.tab();

        const focused = colours(input);

        await userEvent.hover(input);

        expect(colours(input), 'its colours').toEqual(focused);
        expect(getComputedStyle(input, '::after').boxShadow, 'its light').toBe(
            `${clear}, ${clear}, ${unlit}`,
        );
    });

    it('hands the ring the glide at the focus, over a travel on the curve a move takes', async () => {
        const { host, input } = drawnControl('checkbox', { 'focus-ring': 'glide' });
        host.style.setProperty('--ui-duration-travel', '0.4s');
        host.style.setProperty('--ui-easing-move', 'ease-in');

        await userEvent.tab();

        const styles = getComputedStyle(input);

        expect(
            ['', '-time', '-curve'].map((name) => styles.getPropertyValue(`--ui-fx-ring${name}`)),
        ).toEqual(['glide', '0.4s', 'ease-in']);
    });

    /** A control with its label beside it, as the components lay one out. */
    const labelled =
        '<label><span class="frame"><input type="checkbox"></span><span>Notify me</span></label>';

    /** The label beside a control: the next sibling of the frame round it. */
    function text(input: HTMLInputElement): HTMLElement {
        const found = input.parentElement?.nextElementSibling;

        if (!(found instanceof HTMLElement)) {
            throw new Error('the control has no label beside it');
        }

        return found;
    }

    /** A control in error, and a control of a set in error, with the effects `choices` names. */
    function erring(choices: Readonly<Record<string, string>>): readonly HTMLInputElement[] {
        const own = drawnControl('checkbox', choices, 'aria-invalid="true"');
        const set = drawnControl(
            'radio',
            choices,
            '',
            '<div aria-invalid="true"><input type="radio" name="set"></div>',
        );

        return [own.input, set.input];
    }

    it("moves a control's label on its own transition where the accent is chosen for it", () => {
        const { host, input } = drawnControl('checkbox', { 'focus-label': 'accent' }, '', labelled);
        host.style.setProperty('--ui-duration-effect', '0.2s');
        host.style.setProperty('--ui-easing-state', 'linear');

        const styles = getComputedStyle(text(input));

        expect([
            styles.transitionProperty,
            styles.transitionDuration,
            styles.transitionTimingFunction,
        ]).toEqual(['color', '0.2s', 'linear']);
    });

    it("takes a control's label to the accent at the focus, with a fifth of the text in it", async () => {
        const { host, input } = drawnControl('checkbox', { 'focus-label': 'accent' }, '', labelled);
        host.style.setProperty('--ui-duration-effect', '0s');
        host.style.setProperty('--ui-color-accent', 'rgb(0, 0, 255)');
        host.style.setProperty('--ui-color-text', 'rgb(0, 0, 0)');

        const resting = getComputedStyle(text(input)).color;

        await userEvent.tab();

        const mixed = colour('color-mix(in oklab, rgb(0, 0, 255) 80%, rgb(0, 0, 0))');

        expect(getComputedStyle(text(input)).color, 'at the focus').toBe(mixed);
        expect(resting, 'before it').not.toBe(mixed);
    });

    it('sends a band of the danger out from a control in error, or of a set in error, rounds of a flourish that settle', () => {
        const controls = erring({ 'invalid-border': 'pulse' });

        for (const input of controls) {
            input.style.setProperty('--ui-duration-flourish', '0.5s');
            input.style.setProperty('--ui-easing-enter', 'ease-in');
            input.style.setProperty('--ui-iteration-settle', '3');
        }

        for (const input of controls) {
            const styles = getComputedStyle(input);

            // The boundary's place in the control's one list, added to what is under it, the
            // focus's shadow before it and an error's fill after it playing nothing.
            expect([
                styles.animationName,
                styles.animationDuration,
                styles.animationTimingFunction,
                styles.animationIterationCount,
                styles.animationComposition,
            ]).toEqual([
                'none, none, ui-pulse-danger, none',
                '0s, 0s, 0.5s, 0s',
                'ease, ease, ease-in, ease',
                '1, 1, 3, 1',
                'add, replace, add, replace',
            ]);
        }
    });

    it("draws the band from the boundary out to 10px, fading from half the danger to nothing, beside the control's glow", () => {
        const { host, input } = drawnControl(
            'checkbox',
            { 'invalid-border': 'pulse' },
            'aria-invalid="true" style="box-shadow: 0 0 0 1px rgb(0, 200, 0)"',
        );
        host.style.setProperty('--ui-color-danger', 'rgb(200, 0, 0)');
        host.style.setProperty('--ui-duration-flourish', '10s');
        host.style.setProperty('--ui-easing-enter', 'linear');

        const pulse = running(input, 'ui-pulse-danger');

        pulse.pause();
        pulse.currentTime = 0;

        // An animated shadow's colour is computed in the space it moves through.
        const danger = (opacity: number): string =>
            colour(`oklab(from rgb(200, 0, 0) l a b / ${String(opacity)})`);

        expect(getComputedStyle(input).boxShadow, 'leaving').toBe(
            `rgb(0, 200, 0) 0px 0px 0px 1px, ${danger(0.5)} 0px 0px 0px 0px`,
        );

        pulse.currentTime = 5000;

        expect(getComputedStyle(input).boxShadow, 'halfway').toBe(
            `rgb(0, 200, 0) 0px 0px 0px 1px, ${danger(0.25)} 0px 0px 0px 5px`,
        );
    });

    it('tints a control in error, or of a set in error, from a fifth of the danger back to its fill, rounds that settle', () => {
        const controls = erring({ 'invalid-fill': 'flash' });

        for (const input of controls) {
            input.style.setProperty('--ui-duration-flourish', '0.5s');
            input.style.setProperty('--ui-easing-exit', 'linear');
            input.style.setProperty('--ui-iteration-settle', '3');
        }

        for (const input of controls) {
            const styles = getComputedStyle(input);

            // An error's fill's place in the control's one list, the two shadows' before it
            // playing nothing.
            expect([
                styles.animationName,
                styles.animationDuration,
                styles.animationTimingFunction,
                styles.animationIterationCount,
            ]).toEqual([
                'none, none, none, ui-flash',
                '0s, 0s, 0s, 0.5s',
                'ease, ease, ease, linear',
                '1, 1, 1, 3',
            ]);
        }

        const [own] = controls;

        if (own === undefined) {
            throw new Error('no control in error');
        }

        own.style.setProperty('--ui-color-danger', 'rgb(200, 0, 0)');
        own.style.setProperty('--ui-color-surface-control', 'rgb(255, 255, 255)');
        own.style.setProperty('--ui-duration-flourish', '10s');

        const flash = running(own, 'ui-flash');

        flash.pause();
        flash.currentTime = 0;

        expect(getComputedStyle(own).backgroundColor).toBe(
            colour('color-mix(in oklab, rgb(200, 0, 0) 20%, rgb(255, 255, 255))'),
        );
    });

    it('sends nothing out and tints nothing where the control is not in error', () => {
        const { input } = drawnControl('checkbox', {
            'invalid-border': 'pulse',
            'invalid-fill': 'flash',
        });

        expect(playing(input)).toEqual([]);
    });

    it("glows a control under the pointer, the button's light of the accent round it", async () => {
        const { host, input } = drawnControl('checkbox', { 'hover-shadow': 'glow' });
        host.style.setProperty('--ui-color-accent', 'rgb(10, 20, 30)');
        host.style.setProperty('--ui-duration-effect', '0s');

        await userEvent.hover(input);

        expect(getComputedStyle(input, '::after').boxShadow).toBe(
            `color(srgb 0.0392157 0.0784314 0.117647 / 0.5) 0px 0px 12px 2px, ${clear}, ${unlit}`,
        );
    });

    it("tints a control under the pointer with the button's own tint, and a full one with the deeper accent, its boundary with it", async () => {
        const empty = drawnControl('checkbox', { 'hover-fill': 'tint' }, drawnBox);
        const full = drawnControl('checkbox', { 'hover-fill': 'tint' }, `checked ${drawnBox}`);
        const button = document.createElement('div');
        const root = button.attachShadow({ mode: 'open' });
        const sheet = buttonEffects('test').styleSheet;

        if (sheet === undefined) {
            throw new Error('the engine built no sheet to adopt');
        }

        root.adoptedStyleSheets = [sheet];
        root.innerHTML = '<button class="secondary" style="display: block">Tinted</button>';
        button.style.setProperty('--ui-motion-hover-fill', 'tint');

        for (const host of [empty.host, full.host, button]) {
            coloured(host);
            host.style.setProperty('--ui-color-surface-control', 'rgb(240, 240, 240)');
        }

        document.body.append(button);

        const own = root.querySelector('button');

        if (own === null) {
            throw new Error('the button rendered no control');
        }

        const resting = colours(empty.input)[0];

        await userEvent.hover(own);

        const buttons = getComputedStyle(own).backgroundColor;

        await userEvent.hover(empty.input);

        expect(colours(empty.input)[0], 'empty').toBe(buttons);
        expect(buttons, 'a tint at all').not.toBe(resting);

        await userEvent.hover(full.input);

        expect(colours(full.input), 'full').toEqual(['rgb(0, 0, 100)', 'rgb(0, 0, 100)']);
    });

    it("takes the hover colour into a control at the focus, and the deeper accent into a full one with its boundary, an error's red kept", async () => {
        const empty = drawnControl('checkbox', { 'focus-fill': 'highlight' }, drawnBox);
        const full = drawnControl('checkbox', { 'focus-fill': 'highlight' }, `checked ${drawnBox}`);
        const erring = drawnControl(
            'radio',
            { 'focus-fill': 'highlight' },
            '',
            `<div aria-invalid="true"><input type="radio" name="set" checked ${drawnBox}></div>`,
        );

        for (const { host } of [empty, full, erring]) {
            coloured(host);
        }

        await userEvent.tab();

        expect(colours(empty.input), 'empty').toEqual(['rgb(4, 5, 6)', 'rgb(0, 0, 0)']);

        await userEvent.tab();

        expect(colours(full.input), 'full').toEqual(['rgb(0, 0, 100)', 'rgb(0, 0, 100)']);

        await userEvent.tab();

        expect(colours(erring.input), 'in error').toEqual(['rgb(0, 0, 100)', 'rgb(200, 0, 0)']);
    });

    it("bursts light out round a control as the focus arrives, on the focus's shadow's place in its list", async () => {
        const { host, input } = drawnControl('checkbox', { 'focus-shadow': 'burst' });
        host.style.setProperty('--ui-duration-flourish', '0.5s');
        host.style.setProperty('--ui-easing-enter', 'ease-in');

        await userEvent.tab();

        const styles = getComputedStyle(input);

        expect([
            styles.animationName,
            styles.animationDuration,
            styles.animationTimingFunction,
            styles.animationIterationCount,
            styles.animationComposition,
        ]).toEqual([
            'ui-burst, none, none, none',
            '0.5s, 0s, 0s, 0s',
            'ease-in, ease, ease, ease',
            '1, 1, 1, 1',
            'add, replace, add, replace',
        ]);
    });

    it("draws the burst from four fifths of the accent at the boundary out to nothing, 10px and 15px soft, beside the control's glow", async () => {
        const { host, input } = drawnControl(
            'checkbox',
            { 'focus-shadow': 'burst' },
            'style="box-shadow: 0 0 0 1px rgb(0, 200, 0)"',
        );
        host.style.setProperty('--ui-color-accent', 'rgb(200, 0, 0)');
        host.style.setProperty('--ui-duration-flourish', '10s');
        host.style.setProperty('--ui-easing-enter', 'linear');

        await userEvent.tab();

        const burst = running(input, 'ui-burst');
        // An animated shadow's colour is computed in the space it moves through.
        const accent = (opacity: number): string =>
            colour(`oklab(from rgb(200, 0, 0) l a b / ${String(opacity)})`);

        burst.pause();
        burst.currentTime = 0;

        expect(getComputedStyle(input).boxShadow, 'arriving').toBe(
            `rgb(0, 200, 0) 0px 0px 0px 1px, ${accent(0.8)} 0px 0px 0px 0px`,
        );

        burst.currentTime = 5000;

        expect(getComputedStyle(input).boxShadow, 'halfway').toBe(
            `rgb(0, 200, 0) 0px 0px 0px 1px, ${accent(0.4)} 0px 0px 7.5px 5px`,
        );
    });

    it("lights a control's label with a glow of the accent at the focus, on its own transition", async () => {
        const { host, input } = drawnControl('checkbox', { 'focus-label': 'glow' }, '', labelled);
        host.style.setProperty('--ui-color-accent', 'rgb(10, 20, 30)');
        host.style.setProperty('--ui-duration-effect', '0.2s');
        host.style.setProperty('--ui-easing-state', 'linear');

        const styles = getComputedStyle(text(input));

        expect(
            [styles.transitionProperty, styles.transitionDuration, styles.transitionTimingFunction],
            'its transition',
        ).toEqual(['text-shadow', '0.2s', 'linear']);

        host.style.setProperty('--ui-duration-effect', '0s');

        await userEvent.tab();

        expect(getComputedStyle(text(input)).textShadow, 'at the focus').toBe(
            'color(srgb 0.0392157 0.0784314 0.117647 / 0.7) 0px 0px 8px',
        );
    });

    it("hands the ring the glitch, a flourish's time, a straight clock and its two lines' colours", async () => {
        const { host, input } = drawnControl('checkbox', { 'focus-ring': 'glitch' });
        host.style.setProperty('--ui-color-danger', 'rgb(1, 2, 3)');
        host.style.setProperty('--ui-color-info', 'rgb(4, 5, 6)');

        await userEvent.tab();

        const styles = getComputedStyle(input);

        expect(
            ['', '-time', '-curve', '-left', '-right'].map((name) =>
                styles.getPropertyValue(`--ui-fx-ring${name}`),
            ),
        ).toEqual(['glitch', '520ms', 'linear', 'rgb(1, 2, 3)', 'rgb(4, 5, 6)']);
    });

    it('splits a control in error, or of a set in error, into the danger and the info, twice the rounds an effect takes', () => {
        const controls = erring({ 'invalid-border': 'split' });

        for (const input of controls) {
            input.style.setProperty('--ui-duration-effect', '0.2s');
            input.style.setProperty('--ui-iteration-settle', '3');
        }

        for (const input of controls) {
            const styles = getComputedStyle(input);

            expect([
                styles.animationName,
                styles.animationDuration,
                styles.animationTimingFunction,
                styles.animationIterationCount,
            ]).toEqual([
                'none, none, ui-split, none',
                '0s, 0s, 0.2s, 0s',
                'ease, ease, linear, ease',
                '1, 1, 6, 1',
            ]);
        }

        const [own] = controls;

        if (own === undefined) {
            throw new Error('no control in error');
        }

        own.style.setProperty('--ui-color-danger', 'rgb(200, 0, 0)');
        own.style.setProperty('--ui-color-info', 'rgb(0, 0, 200)');
        own.style.setProperty('--ui-duration-effect', '10s');

        const split = running(own, 'ui-split');

        split.pause();

        // Each of its four keyframes, held where it is written: thrown 3px either way, back, 2px
        // and a pixel down, and a pixel.
        const thrown = [
            [2000, 'rgb(200, 0, 0) -3px 0px 0px 0px, rgb(0, 0, 200) 3px 0px 0px 0px'],
            [4000, 'rgb(200, 0, 0) 3px 0px 0px 0px, rgb(0, 0, 200) -3px 0px 0px 0px'],
            [6000, 'rgb(200, 0, 0) -2px 1px 0px 0px, rgb(0, 0, 200) 2px -1px 0px 0px'],
            [8000, 'rgb(200, 0, 0) 1px 0px 0px 0px, rgb(0, 0, 200) -1px 0px 0px 0px'],
        ] as const;

        for (const [time, shadow] of thrown) {
            split.currentTime = time;

            expect(getComputedStyle(own).boxShadow, String(time)).toBe(shadow);
        }
    });
    it('holds a light of the accent inside a control at the focus, at its scale, and over a full one in the accent moved toward its mark', async () => {
        const empty = drawnControl('checkbox', { 'focus-shadow': 'inner' });
        const full = drawnControl('checkbox', { 'focus-shadow': 'inner' }, 'checked');

        for (const { host } of [empty, full]) {
            host.style.setProperty('--ui-color-accent', 'rgb(10, 20, 30)');
            host.style.setProperty('--ui-color-accent-contrast', 'rgb(250, 250, 250)');
            host.style.setProperty('--ui-duration-effect', '0s');
        }

        /** The layer's shadows with `ink`'s inner light in its place. */
        const inside = (ink: string): string =>
            `${clear}, ${clear}, ${colour(ink)} 0px 0px 0px 1px inset, ${colour(`rgb(from ${ink} r g b / 0.5)`)} 0px 0px 6px 1px inset, ${clear}`;

        await userEvent.tab();

        expect(getComputedStyle(empty.input, '::after').boxShadow, 'empty').toBe(
            inside('rgb(10, 20, 30)'),
        );

        await userEvent.tab();

        expect(getComputedStyle(full.input, '::after').boxShadow, 'full').toBe(
            inside('color-mix(in oklab, rgb(10, 20, 30), rgb(250, 250, 250) 40%)'),
        );
    });

    it("sweeps a sheen across a control at the focus, under its mark, on the focus's fill's place in its list", async () => {
        const { host, input } = drawnControl('checkbox', { 'focus-fill': 'shimmer' }, drawnBox);
        host.style.setProperty('--ui-duration-loop', '10s');
        host.style.setProperty('--ui-iteration-settle', '3');
        host.style.setProperty('--ui-color-accent', 'rgb(0, 0, 200)');
        host.style.setProperty('--ui-color-text', 'rgb(0, 0, 0)');

        await userEvent.tab();

        const styles = getComputedStyle(input);
        // A secondary button's: the accent with a fifth of the pole further from the text.
        const sheen = colour(
            'rgb(from color-mix(in oklab, rgb(0, 0, 200), rgb(255, 255, 255) 20%) r g b / 0.5)',
        );

        expect([
            styles.animationName,
            styles.animationDuration,
            styles.animationTimingFunction,
            styles.animationIterationCount,
        ]).toEqual([
            'none, ui-shimmer, none, none',
            '0s, 10s, 0s, 0s',
            'ease, linear, ease, ease',
            '1, 3, 1, 1',
        ]);
        expect(styles.backgroundImage, 'the sheen, on the control').toBe(
            `linear-gradient(100deg, rgba(0, 0, 0, 0) 35%, ${sheen} 50%, rgba(0, 0, 0, 0) 65%)`,
        );
        expect([styles.backgroundSize, styles.backgroundRepeat]).toEqual([
            '250% 100%',
            'no-repeat',
        ]);

        const sweep = running(input, 'ui-shimmer');

        sweep.pause();
        sweep.currentTime = 0;

        expect(getComputedStyle(input).backgroundPosition, 'before its start').toBe('150% 0px');

        sweep.currentTime = 5000;

        expect(getComputedStyle(input).backgroundPosition, 'halfway').toBe('50% 0px');
    });

    it('sweeps the accent across a full control, with a fifth of the pole further from its mark in it', async () => {
        const checked = drawnControl(
            'checkbox',
            { 'focus-fill': 'shimmer' },
            `checked ${drawnBox}`,
        );
        const mixed = drawnControl('checkbox', { 'focus-fill': 'shimmer' }, drawnBox);
        mixed.input.indeterminate = true;

        for (const { host } of [checked, mixed]) {
            host.style.setProperty('--ui-color-accent', 'rgb(0, 0, 200)');
            host.style.setProperty('--ui-color-accent-contrast', 'rgb(255, 255, 255)');
        }

        const swept = `linear-gradient(100deg, rgba(0, 0, 0, 0) 35%, ${colour(
            'rgb(from color-mix(in oklab, rgb(0, 0, 200), rgb(0, 0, 0) 20%) r g b / 0.5)',
        )} 50%, rgba(0, 0, 0, 0) 65%)`;

        await userEvent.tab();

        expect(getComputedStyle(checked.input).backgroundImage, 'checked').toBe(swept);

        await userEvent.tab();

        expect(getComputedStyle(mixed.input).backgroundImage, 'mixed').toBe(swept);
    });

    it('sweeps no sheen across a switch, whose thumb is a layer of the same background', async () => {
        const { input } = drawnControl(
            'switch',
            { 'focus-fill': 'shimmer' },
            `role="switch" ${drawnBox}`,
        );

        await userEvent.tab();

        const styles = getComputedStyle(input);

        expect([styles.backgroundImage, styles.animationName]).toEqual([
            'none',
            'none, none, none, none',
        ]);
    });

    it("hands the ring the refocus, an effect's time on the curves an arrival and a departure take", async () => {
        const { host, input } = drawnControl('checkbox', { 'focus-ring': 'refocus' });
        host.style.setProperty('--ui-duration-effect', '0.3s');
        host.style.setProperty('--ui-easing-enter', 'ease-in');
        host.style.setProperty('--ui-easing-exit', 'ease-out');

        await userEvent.tab();

        const styles = getComputedStyle(input);

        expect(
            ['', '-time', '-curve', '-exit'].map((name) =>
                styles.getPropertyValue(`--ui-fx-ring${name}`),
            ),
        ).toEqual(['refocus', '0.3s', 'ease-in', 'ease-out']);
    });

    it('holds a light of the danger round a control in error, or of a set in error, and none round one that cannot be used', () => {
        const controls = erring({ 'invalid-border': 'glow' });
        const disabled = drawnControl(
            'checkbox',
            { 'invalid-border': 'glow' },
            'aria-invalid="true" disabled',
        );

        for (const input of [...controls, disabled.input]) {
            input.style.setProperty('--ui-color-danger', 'rgb(10, 20, 30)');
            input.style.setProperty('--ui-duration-effect', '0s');
        }

        for (const input of controls) {
            expect(getComputedStyle(input, '::after').boxShadow).toBe(
                `${clear}, ${clear}, rgba(0, 0, 0, 0) 0px 0px 0px 0px inset, rgba(0, 0, 0, 0) 0px 0px 0px 0px inset, color(srgb 0.0392157 0.0784314 0.117647 / 0.5) 0px 0px 12px 2px`,
            );
        }

        expect(getComputedStyle(disabled.input, '::after').boxShadow, 'disabled').toBe(
            `${clear}, ${clear}, ${unlit}`,
        );
    });
    /** A control in the frame the components lay round it, its corners the frame's. */
    function framed(
        component: string,
        choices: Readonly<Record<string, string>>,
        attributes = '',
    ): { host: HTMLElement; input: HTMLInputElement; frame: HTMLElement } {
        const { host, input } = drawnControl(
            component,
            choices,
            '',
            `<span class="frame" style="display: grid; border-radius: 5px"><input type="checkbox" ${attributes} ${drawnBox}></span>`,
        );
        const frame = input.parentElement;

        if (frame === null) {
            throw new Error('the control has no frame');
        }

        return { host, input, frame };
    }

    /** Where the engine puts the pointer, written on a frame as it writes it. */
    function pointed(frame: HTMLElement, near = '1'): void {
        frame.style.setProperty('--ui-fx-pointer-x', '5px');
        frame.style.setProperty('--ui-fx-pointer-y', '6px');
        frame.style.setProperty('--ui-fx-pointer-nx', '1');
        frame.style.setProperty('--ui-fx-pointer-ny', '0');
        frame.style.setProperty('--ui-fx-pointer-near', near);
    }

    /** What the engine computes `value` to as a picture, on an element of the page. */
    function picture(value: string): string {
        const probe = document.createElement('div');
        probe.style.backgroundImage = value;
        document.body.append(probe);

        try {
            return getComputedStyle(probe).backgroundImage;
        } finally {
            probe.remove();
        }
    }

    it.each([
        ['hover-fill', 'spotlight'],
        ['hover-shadow', 'cast'],
        ['hover-border', 'edge'],
    ])(
        'hands the pointer engine its time on the frame where %s: %s is chosen, and only round a control that can be used',
        (moment, effect) => {
            const usable = framed('checkbox', { [moment]: effect });
            const disabled = framed('checkbox', { [moment]: effect }, 'disabled');

            for (const { host } of [usable, disabled]) {
                host.style.setProperty('--ui-duration-effect', '0.3s');
            }

            expect(getComputedStyle(usable.frame).getPropertyValue('--ui-fx-follow')).toBe('0.3s');
            expect(getComputedStyle(disabled.frame).getPropertyValue('--ui-fx-follow')).toBe('');
        },
    );

    it('lights a control in its sheen where the pointer is, as strong as it is near, under its mark', () => {
        const empty = framed('checkbox', { 'hover-fill': 'spotlight' });
        const full = framed('checkbox', { 'hover-fill': 'spotlight' }, 'checked');
        const toggle = framed('switch', { 'hover-fill': 'spotlight' }, 'role="switch"');

        for (const { host, frame } of [empty, full, toggle]) {
            host.style.setProperty('--ui-color-accent', 'rgb(0, 0, 200)');
            host.style.setProperty('--ui-color-accent-contrast', 'rgb(255, 255, 255)');
            host.style.setProperty('--ui-color-text', 'rgb(0, 0, 0)');
            pointed(frame, '0.5');
        }

        /** The spotlight in `sheen`, at the point and the nearness the engine wrote. */
        const lit = (sheen: string): string =>
            picture(
                `radial-gradient(circle 4rem at 5px 6px, rgb(from ${sheen} r g b / calc(0.5 * 0.24)), transparent)`,
            );
        const sheen = (pole: string): string =>
            `rgb(from color-mix(in oklab, rgb(0, 0, 200), ${farPole(pole)} 20%) r g b / 0.5)`;

        expect(getComputedStyle(empty.input).backgroundImage, 'empty').toBe(
            lit(sheen('rgb(0, 0, 0)')),
        );
        expect(getComputedStyle(full.input).backgroundImage, 'full').toBe(
            lit(sheen('rgb(255, 255, 255)')),
        );
        expect(getComputedStyle(toggle.input).backgroundImage, 'a switch').toBe('none');
    });

    it("casts the card's shadow at a drawn control's scale on its lights' layer, as strong as the pointer is near", () => {
        const { host, input, frame } = framed('checkbox', { 'hover-shadow': 'cast' });
        host.style.setProperty('--ui-duration-effect', '0s');
        pointed(frame);

        expect(getComputedStyle(input, '::after').boxShadow).toBe(
            `rgba(0, 0, 0, 0.3) -4px 2px 7px -1px, rgba(0, 0, 0, 0) 6px 0px 12px 1px, ${clear}, ${unlit}`,
        );
    });

    it('lays the edge on the frame, a band on the boundary lit where the pointer is nearest, in the accent pushed off the page and off a full fill', () => {
        const empty = framed('checkbox', { 'hover-border': 'edge' });
        const full = framed('checkbox', { 'hover-border': 'edge' }, 'checked');

        for (const { host, frame } of [empty, full]) {
            host.style.setProperty('--ui-color-accent', 'rgb(0, 0, 200)');
            host.style.setProperty('--ui-color-accent-contrast', 'rgb(255, 255, 255)');
            pointed(frame);
        }

        const band = getComputedStyle(empty.frame, '::after');

        expect(getComputedStyle(empty.frame).position, 'the frame it is laid out against').toBe(
            'relative',
        );
        expect(
            [band.position, band.top, band.left, band.paddingTop, band.pointerEvents],
            'a band round the boundary, which takes no pointer',
        ).toEqual(['absolute', '-1px', '-1px', '2px', 'none']);
        expect(band.backgroundImage, 'empty').toBe(
            picture(
                'radial-gradient(ellipse 100% 100% at 5px 6px, light-dark(oklch(from rgb(0, 0, 200) calc(l - 0.1) c h), oklch(from rgb(0, 0, 200) calc(l + 0.2) c h)), transparent)',
            ),
        );
        expect(getComputedStyle(full.frame, '::after').backgroundImage, 'full').toBe(
            picture(
                'radial-gradient(ellipse 100% 100% at 5px 6px, color-mix(in oklab, rgb(0, 0, 200), rgb(255, 255, 255) 40%), transparent)',
            ),
        );
    });

    it('lights the edge as strongly as the pointer is near, and never round a control that cannot be used, has the focus or is in error', async () => {
        const usable = framed('checkbox', { 'hover-border': 'edge' });
        const disabled = framed('checkbox', { 'hover-border': 'edge' }, 'disabled');
        const erring = framed('checkbox', { 'hover-border': 'edge' }, 'aria-invalid="true"');
        const set = drawnControl(
            'radio',
            { 'hover-border': 'edge' },
            '',
            `<div aria-invalid="true"><span class="frame" style="display: grid"><input type="radio" name="set" ${drawnBox}></span></div>`,
        );
        const frames = [usable.frame, disabled.frame, erring.frame, set.input.parentElement];

        for (const frame of frames) {
            if (frame !== null) {
                pointed(frame, '0.6');
            }
        }

        const opacity = (frame: HTMLElement | null): string =>
            frame === null ? '' : getComputedStyle(frame, '::after').opacity;

        expect(opacity(usable.frame), 'usable').toBe('0.6');
        expect(opacity(disabled.frame), 'disabled').toBe('0');
        expect(opacity(erring.frame), 'in error').toBe('0');
        expect(opacity(set.input.parentElement), 'of a set in error').toBe('0');

        await userEvent.tab();

        expect(opacity(usable.frame), 'with the focus').toBe('0');
    });
});

/**
 * A surface of the test's own, in a region of the page: a host whose shadow root adopts the sheet
 * built for `component`, holding its layers and a slot, with a button in it and the mark bound, and
 * the effects `choices` names chosen on the region round it — where a choice reaches what the sheet
 * draws on the host as well as on its layers.
 */
function surface(
    component: string,
    choices: Readonly<Record<string, string>>,
): {
    region: HTMLElement;
    host: HTMLElement;
    layer: HTMLElement;
    focus: HTMLElement;
    fill: HTMLElement;
    focusFill: HTMLElement;
    border: HTMLElement;
} {
    const region = document.createElement('div');
    const host = document.createElement('div');
    const root = host.attachShadow({ mode: 'open' });
    const sheet = surfaceEffects(component).styleSheet;

    if (sheet === undefined) {
        throw new Error('the engine built no sheet to adopt');
    }

    root.adoptedStyleSheets = [sheet];
    root.innerHTML = [
        '<span data-layer="fill"></span><span data-layer="focus-fill"></span>',
        '<span data-layer="shadow"></span><span data-layer="focus-shadow"></span>',
        '<span data-layer="border"></span><slot></slot>',
    ].join('');
    host.innerHTML = '<button>Inside</button>';
    host.style.cssText = 'display: block; position: relative; width: 200px; height: 100px';
    host.addEventListener('focusin', held);
    host.addEventListener('focusout', released);

    for (const [moment, effect] of Object.entries(choices)) {
        region.style.setProperty(`--ui-motion-${moment}`, effect);
    }

    region.append(host);
    document.body.append(region);

    const [fill, focusFill, layer, focus, border] =
        root.querySelectorAll<HTMLElement>('[data-layer]');

    if (
        fill === undefined ||
        focusFill === undefined ||
        layer === undefined ||
        focus === undefined ||
        border === undefined
    ) {
        throw new Error('the surface holds no layers');
    }

    return { region, host, layer, focus, fill, focusFill, border };
}

describe("a surface's effects", () => {
    /** The raise, as the engine computes it on a light page over a lift written as one ring. */
    const raisedOver =
        'rgb(1, 2, 3) 0px 0px 0px 3px, rgba(0, 0, 0, 0) 0px 1px 0px 0px inset, rgba(0, 0, 0, 0) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.35) 0px 12px 28px -8px, rgba(0, 0, 0, 0) 0px 16px 40px -4px, rgba(0, 0, 0, 0) 0px 4px 12px 0px';

    /** Each token the raise draws in, each its own, on the region round a surface. */
    function lifted(region: HTMLElement): void {
        region.style.setProperty('--ui-elevation-raised', '0 0 0 3px rgb(1, 2, 3)');
        region.style.setProperty('--ui-color-accent', 'rgb(4, 5, 6)');
        region.style.setProperty('--ui-duration-effect', '0s');
    }

    it('lays a layer per moment over the boundary, taking no pointer and invisible until an effect fades it in', () => {
        const { layer, focus, border } = surface('test', {});

        for (const each of [layer, focus, border]) {
            const styles = getComputedStyle(each);

            expect(
                [styles.position, styles.top, styles.left, styles.pointerEvents, styles.opacity],
                each.dataset['layer'],
            ).toEqual(['absolute', '-1px', '-1px', 'none', '0']);
        }
    });

    it("raises a surface under the pointer, the theme's lift drawn again with a drop, on its layer", async () => {
        const { region, host, layer } = surface('test', { 'hover-shadow': 'raise' });
        lifted(region);

        await userEvent.hover(host);

        const styles = getComputedStyle(layer);

        expect([styles.opacity, styles.color, styles.boxShadow]).toEqual([
            '1',
            'rgb(4, 5, 6)',
            raisedOver,
        ]);
    });

    it("fades each raise in and out on its layer, over an effect's time on the curve an arrival takes", () => {
        const { region, layer, focus } = surface('test', {
            'hover-shadow': 'raise',
            'focus-shadow': 'raise',
        });
        region.style.setProperty('--ui-duration-effect', '0.3s');
        region.style.setProperty('--ui-easing-enter', 'ease-in');

        for (const each of [layer, focus]) {
            const styles = getComputedStyle(each);

            expect(
                [
                    styles.transitionProperty,
                    styles.transitionDuration,
                    styles.transitionTimingFunction,
                ],
                each.dataset['layer'],
            ).toEqual(['opacity', '0.3s', 'ease-in']);
        }
    });

    it('raises a surface while a focus the reader can see is on something it holds, on its own layer', async () => {
        const { region, layer, focus } = surface('test', { 'focus-shadow': 'raise' });
        lifted(region);

        await userEvent.tab();

        expect([getComputedStyle(focus).opacity, getComputedStyle(focus).boxShadow]).toEqual([
            '1',
            raisedOver,
        ]);
        expect(getComputedStyle(focus).color, 'in the accent').toBe('rgb(4, 5, 6)');
        expect(getComputedStyle(layer).opacity, "the pointer's layer").toBe('0');
    });

    it("draws nothing of the pointer's while a focus the reader can see is in the surface, which wins", async () => {
        const { region, host, layer } = surface('test', { 'hover-shadow': 'raise' });
        lifted(region);

        await userEvent.tab();
        await userEvent.hover(host);

        expect(getComputedStyle(layer).opacity).toBe('0');
    });

    it.each([
        ['focus-move', 'lift'],
        ['hover-move', 'tilt'],
    ])(
        "moves the surface where %s: %s is chosen, its place over an effect's time and its turn over a following's",
        (moment, effect) => {
            const { region, host } = surface('test', { [moment]: effect });
            const still = surface('test', {});
            region.style.setProperty('--ui-duration-effect', '0.3s');
            region.style.setProperty('--ui-duration-follow', '0.05s');
            region.style.setProperty('--ui-easing-enter', 'ease-in');

            expect([
                getComputedStyle(host).transitionProperty,
                getComputedStyle(host).transitionDuration,
                getComputedStyle(host).transitionTimingFunction,
            ]).toEqual(['translate, transform', '0.3s, 0.05s', 'ease-in, linear']);
            expect(getComputedStyle(still.host).transitionDuration, 'nothing chosen').toBe('0s');
        },
    );

    it('lifts the whole surface a quarter rem while a focus the reader can see is in it', async () => {
        const { region, host } = surface('test', { 'focus-move': 'lift' });
        region.style.setProperty('--ui-duration-effect', '0s');

        await userEvent.tab();

        expect(getComputedStyle(host).translate, 'lifted').toBe('0px -4px');
    });

    it("leaves a choice written on the one surface out of reach of what it draws on its host — RFC 0004's S8", async () => {
        const { host } = surface('test', {});
        host.style.setProperty('--ui-motion-focus-move', 'lift');
        host.style.setProperty('--ui-motion-hover-move', 'tilt');
        host.style.setProperty('--ui-motion-hover-fill', 'spotlight');

        expect(getComputedStyle(host).transform, 'the tilt').toBe('none');
        expect(getComputedStyle(host).getPropertyValue('--ui-fx-follow'), 'the engine').toBe('');

        await userEvent.tab();

        expect(getComputedStyle(host).translate, 'the lift').toBe('none');
    });
    /** The surface's tint over `surface` with `accent` in it, as the engine computes it on a light page. */
    function tinted(surface: string, accent: string): string {
        return colour(
            `light-dark(oklch(from color-mix(in oklab, ${surface} 88%, ${accent}) max(l, 0.98) c h / max(alpha, 0.6)), oklch(from color-mix(in oklab, ${surface} 90%, ${accent}) l c h / max(alpha, 0.6)))`,
        );
    }

    it('lays a fill per moment inside the boundary and under the content', () => {
        const { fill, focusFill } = surface('test', {});

        for (const each of [fill, focusFill]) {
            const styles = getComputedStyle(each);

            expect([styles.top, styles.left, styles.zIndex], each.dataset['layer']).toEqual([
                '0px',
                '0px',
                '-1',
            ]);
        }
    });

    it.each([
        ['hover-fill', 'tint'],
        ['hover-fill', 'spotlight'],
        ['focus-fill', 'tint'],
        ['focus-fill', 'shimmer'],
        ['focus-shadow', 'inner'],
    ])(
        "isolates the surface where %s: %s is chosen, so what lies under its content stays over the surface's own fill",
        (moment, effect) => {
            const { host } = surface('test', { [moment]: effect });

            expect(getComputedStyle(host).isolation).toBe('isolate');
        },
    );

    it('leaves a surface unisolated where nothing under its content is chosen, so what it holds stacks as it did', () => {
        const { host } = surface('test', {
            'hover-shadow': 'cast',
            'hover-border': 'edge',
            'focus-shadow': 'raise',
            'focus-move': 'lift',
        });

        expect(getComputedStyle(host).isolation).toBe('auto');
    });

    it("tints a surface under the pointer with a little of the accent in its own fill, over the state's time", async () => {
        const { region, host, fill } = surface('test', { 'hover-fill': 'tint' });
        region.style.setProperty('--ui-color-surface-raised', 'rgb(240, 240, 240)');
        region.style.setProperty('--ui-color-accent', 'rgb(0, 0, 200)');
        region.style.setProperty('--ui-duration-state', '0.3s');
        region.style.setProperty('--ui-easing-state', 'ease-in');

        const styles = getComputedStyle(fill);

        expect(
            [styles.transitionProperty, styles.transitionDuration, styles.transitionTimingFunction],
            'its fade',
        ).toEqual(['opacity', '0.3s', 'ease-in']);
        expect(styles.backgroundColor, 'the tint').toBe(
            tinted('rgb(240, 240, 240)', 'rgb(0, 0, 200)'),
        );

        region.style.setProperty('--ui-duration-state', '0s');

        await userEvent.hover(host);

        expect(getComputedStyle(fill).opacity, 'faded in').toBe('1');
    });

    it("tints a surface while a focus the reader can see is in it, on its own layer, over the state's time", async () => {
        const { region, fill, focusFill } = surface('test', { 'focus-fill': 'tint' });
        region.style.setProperty('--ui-color-surface-raised', 'rgb(240, 240, 240)');
        region.style.setProperty('--ui-color-accent', 'rgb(0, 0, 200)');
        region.style.setProperty('--ui-duration-state', '0.3s');
        region.style.setProperty('--ui-easing-state', 'ease-in');

        const styles = getComputedStyle(focusFill);

        expect(
            [styles.transitionProperty, styles.transitionDuration, styles.transitionTimingFunction],
            'its fade',
        ).toEqual(['opacity', '0.3s', 'ease-in']);
        expect(styles.backgroundColor, 'the tint').toBe(
            tinted('rgb(240, 240, 240)', 'rgb(0, 0, 200)'),
        );

        region.style.setProperty('--ui-duration-state', '0s');

        await userEvent.tab();

        expect(getComputedStyle(focusFill).opacity, 'faded in').toBe('1');
        expect(getComputedStyle(fill).opacity, "the pointer's").toBe('0');
    });

    it("glows a surface under the pointer, a light of the accent round it, faded in over an effect's time", async () => {
        const { region, host, layer } = surface('test', { 'hover-shadow': 'glow' });
        region.style.setProperty('--ui-color-accent', 'rgb(10, 20, 30)');
        region.style.setProperty('--ui-duration-effect', '0.3s');
        region.style.setProperty('--ui-easing-enter', 'ease-in');

        const styles = getComputedStyle(layer);

        expect(
            [styles.transitionProperty, styles.transitionDuration, styles.transitionTimingFunction],
            'its fade',
        ).toEqual(['opacity', '0.3s', 'ease-in']);
        expect(styles.boxShadow, 'the glow').toBe(
            'color(srgb 0.0392157 0.0784314 0.117647 / 0.45) 0px 0px 16px 2px, color(srgb 0.0392157 0.0784314 0.117647 / 0.25) 0px 0px 40px 8px',
        );

        region.style.setProperty('--ui-duration-effect', '0s');

        await userEvent.hover(host);

        expect(getComputedStyle(layer).opacity, 'faded in').toBe('1');
    });

    it('bursts light out round a surface as a focus arrives in it, from four fifths of the accent to nothing, 10px and 15px soft', async () => {
        const { region, focus } = surface('test', { 'focus-shadow': 'burst' });
        region.style.setProperty('--ui-color-accent', 'rgb(200, 0, 0)');
        region.style.setProperty('--ui-duration-flourish', '10s');
        region.style.setProperty('--ui-easing-enter', 'linear');

        await userEvent.tab();

        const styles = getComputedStyle(focus);

        expect([
            styles.opacity,
            styles.animationName,
            styles.animationDuration,
            styles.animationTimingFunction,
        ]).toEqual(['1', 'ui-burst', '10s', 'linear']);

        const burst = running(focus, 'ui-burst');
        // An animated shadow's colour is computed in the space it moves through.
        const accent = (opacity: number): string =>
            colour(`oklab(from rgb(200, 0, 0) l a b / ${String(opacity)})`);

        burst.pause();
        burst.currentTime = 0;

        expect(getComputedStyle(focus).boxShadow, 'arriving').toBe(
            `${accent(0.8)} 0px 0px 0px 0px`,
        );

        burst.currentTime = 5000;

        expect(getComputedStyle(focus).boxShadow, 'halfway').toBe(
            `${accent(0.4)} 0px 0px 7.5px 5px`,
        );
    });

    /** Writes where the pointer is on a surface's host, as the engine writes it. */
    function pointed(host: HTMLElement, near: number, x: number, y: number, nx = 0, ny = 0): void {
        for (const [name, value] of Object.entries({
            near: String(near),
            x: `${String(x)}px`,
            y: `${String(y)}px`,
            nx: String(nx),
            ny: String(ny),
        })) {
            host.style.setProperty(`--ui-fx-pointer-${name}`, value);
        }
    }

    /** What the engine computes `value` to as a picture, on an element of the page. */
    function picture(value: string): string {
        const probe = document.createElement('div');
        probe.style.backgroundImage = value;
        document.body.append(probe);

        try {
            return getComputedStyle(probe).backgroundImage;
        } finally {
            probe.remove();
        }
    }

    it.each([
        ['hover-fill', 'spotlight'],
        ['hover-shadow', 'cast'],
        ['hover-border', 'edge'],
        ['hover-move', 'tilt'],
    ])(
        "hands the pointer engine an effect's time on the host where %s: %s is chosen",
        (moment, effect) => {
            const chosen = surface('test', { [moment]: effect });
            const plain = surface('test', {});

            for (const { region } of [chosen, plain]) {
                region.style.setProperty('--ui-duration-effect', '0.3s');
            }

            expect(getComputedStyle(chosen.host).getPropertyValue('--ui-fx-follow')).toBe('0.3s');
            expect(
                getComputedStyle(plain.host).getPropertyValue('--ui-fx-follow'),
                'nothing chosen',
            ).toBe('');
        },
    );

    it('cuts the border to a band over the boundary and a pixel inside it, over the content', () => {
        const { border } = surface('test', {});
        const styles = getComputedStyle(border);

        expect([styles.paddingTop, styles.zIndex, styles.maskComposite]).toEqual([
            '2px',
            'auto',
            'exclude, add',
        ]);
    });

    it('lights the surface with its tint where the pointer is, as strong as it is near, on its fill', async () => {
        const { region, host, fill } = surface('test', { 'hover-fill': 'spotlight' });
        region.style.setProperty('--ui-color-surface-raised', 'rgb(240, 240, 240)');
        region.style.setProperty('--ui-color-accent', 'rgb(0, 0, 200)');

        pointed(host, 0.5, 30, 10);

        expect(getComputedStyle(fill).backgroundImage, 'at the pointer, 16rem out').toBe(
            picture(
                `radial-gradient(16rem circle at 30px 10px, ${tinted('rgb(240, 240, 240)', 'rgb(0, 0, 200)')}, transparent 70%)`,
            ),
        );
        expect(getComputedStyle(fill).opacity, 'as near as the pointer').toBe('0.5');

        await userEvent.tab();

        expect(getComputedStyle(fill).opacity, 'the focus wins').toBe('0');
    });

    it("casts the surface's shadow away from the pointer at the card's own size, as strong as it is near", async () => {
        const { region, host, layer } = surface('test', { 'hover-shadow': 'cast' });
        const dark = surface('test', { 'hover-shadow': 'cast' });
        dark.region.style.colorScheme = 'dark';

        for (const each of [region, dark.region]) {
            each.style.setProperty('--ui-color-accent', 'rgb(10, 20, 30)');
        }

        for (const each of [host, dark.host]) {
            pointed(each, 0.5, 150, 25, 0.5, -0.5);
        }

        expect(getComputedStyle(layer).boxShadow, 'on a light page, the shadow').toBe(
            'rgba(0, 0, 0, 0.3) -8px 16px 28px -4px, rgba(0, 0, 0, 0) 12px -12px 48px 4px',
        );
        expect(getComputedStyle(dark.layer).boxShadow, 'on a dark one, the light too').toBe(
            'rgba(0, 0, 0, 0.85) -8px 16px 28px -4px, color(srgb 0.0392157 0.0784314 0.117647 / 0.35) 12px -12px 48px 4px',
        );
        expect(getComputedStyle(layer).opacity, 'as near as the pointer').toBe('0.5');

        await userEvent.tab();

        expect(getComputedStyle(layer).opacity, 'the focus wins').toBe('0');
    });

    it('lights a band on the boundary nearest the pointer, in the accent pushed off the page, as strong as it is near', async () => {
        const { region, host, border } = surface('test', { 'hover-border': 'edge' });
        region.style.setProperty('--ui-color-accent', 'rgb(0, 0, 200)');

        pointed(host, 0.5, 30, 10);

        expect(getComputedStyle(border).backgroundImage).toBe(
            picture(
                'radial-gradient(ellipse 100% 100% at 30px 10px, light-dark(oklch(from rgb(0, 0, 200) calc(l - 0.1) c h), oklch(from rgb(0, 0, 200) calc(l + 0.2) c h)), transparent)',
            ),
        );
        expect(getComputedStyle(border).opacity, 'as near as the pointer').toBe('0.5');

        await userEvent.tab();

        expect(getComputedStyle(border).opacity, 'the focus wins').toBe('0');
    });

    it('turns the surface toward the pointer, five degrees at most each way, as strong as it is near', async () => {
        const { region, host } = surface('test', { 'hover-move': 'tilt' });
        const turned = document.createElement('div');
        region.style.setProperty('--ui-duration-follow', '0s');
        turned.style.transform = 'perspective(60rem) rotateX(1.25deg) rotateY(-2.5deg)';
        document.body.append(turned);

        pointed(host, 0.5, 20, 30, -1, -0.5);

        expect(getComputedStyle(host).transform).toBe(getComputedStyle(turned).transform);

        await userEvent.tab();

        expect(getComputedStyle(host).transform, 'the focus wins').toBe('none');
    });

    it("sweeps the surface's tint across it at a focus the reader can see in it, four rounds of the loop and then at rest", async () => {
        const { region, focusFill } = surface('test', { 'focus-fill': 'shimmer' });
        region.style.setProperty('--ui-color-surface-raised', 'rgb(240, 240, 240)');
        region.style.setProperty('--ui-color-accent', 'rgb(0, 0, 200)');
        region.style.setProperty('--ui-duration-loop', '10s');
        region.style.setProperty('--ui-iteration-settle', '3');

        expect(getComputedStyle(focusFill).backgroundImage, 'its tint, swept').toBe(
            picture(
                `linear-gradient(100deg, transparent 35%, ${tinted('rgb(240, 240, 240)', 'rgb(0, 0, 200)')} 50%, transparent 65%)`,
            ),
        );

        await userEvent.tab();

        const styles = getComputedStyle(focusFill);

        expect([
            styles.opacity,
            styles.backgroundSize,
            styles.backgroundRepeat,
            styles.animationName,
            styles.animationDuration,
            styles.animationTimingFunction,
            styles.animationIterationCount,
        ]).toEqual(['1', '250% 100%', 'no-repeat', 'ui-shimmer', '10s', 'linear', '3']);

        // Through the property the button's sheen moves through, halfway across a round.
        const sweep = running(focusFill, 'ui-shimmer');

        sweep.pause();
        sweep.currentTime = 5000;

        expect(getComputedStyle(focusFill).backgroundPosition).toBe('50% 0px');
    });

    it("holds the button's light inside the boundary while a focus the reader can see is in the surface, under its content", async () => {
        const { region, focus } = surface('test', { 'focus-shadow': 'inner' });
        region.style.setProperty('--ui-color-accent', 'rgb(10, 20, 30)');
        region.style.setProperty('--ui-duration-effect', '0.3s');
        region.style.setProperty('--ui-easing-enter', 'ease-in');

        const styles = getComputedStyle(focus);

        expect(
            [styles.transitionProperty, styles.transitionDuration, styles.transitionTimingFunction],
            'its fade',
        ).toEqual(['opacity', '0.3s', 'ease-in']);
        expect([styles.zIndex, styles.boxShadow]).toEqual([
            '-1',
            'rgb(10, 20, 30) 0px 0px 0px 1px inset, color(srgb 0.0392157 0.0784314 0.117647 / 0.5) 0px 0px 12px 2px inset',
        ]);

        region.style.setProperty('--ui-duration-effect', '0s');

        await userEvent.tab();

        expect(getComputedStyle(focus).opacity, 'faded in').toBe('1');
    });
});

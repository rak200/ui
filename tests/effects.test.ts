import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { buttonEffects, pressed } from '../src/effects.js';

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

import { afterEach, describe, expect, it } from 'vitest';
import { watch } from '../src/stack.js';

/**
 * What a toast's sheet hands the stack where its toaster chose the spring: a long time on a straight
 * curve, so a move is read where it starts.
 */
const handed = '--ui-fx-stack: spring; --ui-fx-stack-time: 10s; --ui-fx-stack-curve: linear';

/**
 * A stack of the suite's own, anchored at the foot of the page as a toaster is, holding `count`
 * toasts 40px tall with 8px between them, each carrying `style` after what a toast hands the stack;
 * watched. The toasts are no component's — `ui-toast` is not defined here — so only the stack moves
 * them.
 */
function stacked(count: number, style = handed): { toaster: HTMLElement; toasts: HTMLElement[] } {
    const toaster = document.createElement('div');
    toaster.style.cssText =
        'position: fixed; bottom: 0; right: 0; width: 200px; display: flex; flex-direction: column; gap: 8px';

    const toasts = Array.from({ length: count }, () => made(style));

    toaster.append(...toasts);
    document.body.append(toaster);
    watch(toaster);

    return { toaster, toasts };
}

/** A toast of the stack's: a block 40px tall. */
function made(style = handed): HTMLElement {
    const toast = document.createElement('ui-toast');
    toast.style.cssText = `display: block; height: 40px; ${style}`;

    return toast;
}

/** The moves the stack set going on `toast`: where each starts, its time, its curve, how it adds. */
function moves(toast: HTMLElement): (readonly unknown[])[] {
    return toast.getAnimations().map((animation) => {
        const effect = animation.effect as KeyframeEffect;
        const timing = effect.getTiming();

        return [
            effect.getKeyframes()[0]?.['translate'],
            timing.duration,
            timing.easing,
            effect.composite,
        ];
    });
}

/** Waits for the watcher to hear what changed, and for the frame an arrival is moved at. */
async function heard(): Promise<void> {
    await Promise.resolve();
    await new Promise(requestAnimationFrame);
}

afterEach(() => {
    for (const animation of document.getAnimations()) {
        animation.cancel();
    }

    document.body.replaceChildren();
});

describe('a toast arriving', () => {
    it('springs the toasts it pushes up from where they stood, at the next frame', async () => {
        const { toaster, toasts } = stacked(2);
        const [first, second] = toasts;
        const newcomer = made();

        toaster.append(newcomer);
        await heard();

        // Pushed up its height and the gap: from 48px below, to where each now stands.
        for (const toast of [first, second]) {
            expect(toast === undefined ? [] : moves(toast)).toEqual([
                ['0px 48px', 10000, 'linear', 'add'],
            ]);
        }

        expect(moves(newcomer), 'the newcomer, which the stack does not move').toEqual([]);
    });

    it("keeps the newcomer's own display, which it takes away only for the reading", async () => {
        const { toaster } = stacked(1);
        const newcomer = made(`${handed}; display: grid`);

        toaster.append(newcomer);
        await heard();

        expect(newcomer.style.display).toBe('grid');
    });

    it('moves nothing where the toasts were handed no spring, another move, or the collapse', async () => {
        const plain = stacked(1, '');
        const other = stacked(1, `${handed}; --ui-fx-stack: glide`);
        const collapsed = stacked(1, `${handed}; --ui-fx-stack-time: 0.01ms`);

        for (const { toaster } of [plain, other, collapsed]) {
            toaster.append(made());
        }

        await heard();

        expect([...plain.toasts, ...other.toasts, ...collapsed.toasts].map(moves)).toEqual([
            [],
            [],
            [],
        ]);
    });

    it('moves nothing for what arrives that is no toast', async () => {
        const { toaster, toasts } = stacked(1);
        const stranger = document.createElement('div');
        stranger.style.height = '40px';

        toaster.append(stranger);
        await heard();

        expect(toasts.map(moves)).toEqual([[]]);
    });
});

describe('a toast leaving', () => {
    it('springs the toasts it lets down from where they stood as it began to go, once it has gone', async () => {
        const { toaster, toasts } = stacked(3);
        const [first, middle, last] = toasts;

        middle?.dispatchEvent(new Event('ui-dismiss', { bubbles: true, composed: true }));
        middle?.remove();
        await Promise.resolve();

        expect(first === undefined ? [] : moves(first), 'let down').toEqual([
            ['0px -48px', 10000, 'linear', 'add'],
        ]);
        expect(last === undefined ? [] : moves(last), 'below it, where it was').toEqual([]);
        expect(toaster.children).toHaveLength(2);
    });

    it('measures before anything listening on the toast can keep the word from the stack', async () => {
        const { toasts } = stacked(2);
        const [first, last] = toasts;
        last?.addEventListener('ui-dismiss', (event) => {
            event.stopPropagation();
        });

        last?.dispatchEvent(new Event('ui-dismiss', { bubbles: true, composed: true }));
        last?.remove();
        await Promise.resolve();

        expect(first === undefined ? [] : moves(first)).toHaveLength(1);
    });

    it('moves nothing for a toast taken away with no word that it was going', async () => {
        const { toasts } = stacked(2);
        const [first, last] = toasts;

        last?.remove();
        await Promise.resolve();

        expect(first === undefined ? [] : moves(first)).toEqual([]);
    });

    it('moves each once, however many changes it hears after', async () => {
        const { toaster, toasts } = stacked(3);
        const [first, middle] = toasts;

        middle?.dispatchEvent(new Event('ui-dismiss', { bubbles: true, composed: true }));
        middle?.remove();
        await Promise.resolve();

        toaster.append(document.createElement('span'));
        await Promise.resolve();

        expect(first === undefined ? [] : moves(first)).toHaveLength(1);
    });
});

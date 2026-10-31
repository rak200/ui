import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { arrive, watch } from '../src/ring.js';

/** Three controls a ring flies between, as `mount` lays them out. */
interface Controls {
    readonly from: HTMLButtonElement;
    readonly to: HTMLButtonElement;
    readonly on: HTMLButtonElement;
}

/**
 * Three controls on a line, the last two of which glide. While the reader can see the focus on
 * one of those, it carries what a component's sheet declares under the glide's query: the choice,
 * and a flight long enough to read partway, on a straight curve so its progress is its time.
 */
function mount(): Controls {
    const host = document.createElement('div');
    host.innerHTML = `
        <style>
            button { margin: 24px; border-radius: 0; outline: none; }
            button:focus-visible { outline: 2px solid rgb(1, 2, 3); outline-offset: 2px; }
            .glides { border-radius: 6px; }
            .glides:focus-visible {
                --ui-fx-ring: glide;
                --ui-fx-ring-time: 10s;
                --ui-fx-ring-curve: linear;
            }
        </style>
        <button id="from">From</button>
        <button id="to" class="glides">To</button>
        <button id="on" class="glides">On</button>`;
    document.body.append(host);
    watch();

    const pick = (id: string): HTMLButtonElement => {
        const control = host.querySelector<HTMLButtonElement>(`#${id}`);

        if (control === null) {
            throw new Error(`no #${id}`);
        }

        return control;
    };
    const controls = { from: pick('from'), to: pick('to'), on: pick('on') };

    controls.to.addEventListener('focus', arrive);
    controls.on.addEventListener('focus', arrive);

    return controls;
}

/** The page's flown ring, which the first flight makes. */
function flown(): HTMLElement {
    const ring = document.querySelector<HTMLElement>('[data-ui-ring]');

    if (ring === null) {
        throw new Error('no ring was flown');
    }

    return ring;
}

/** Whether a ring is in the air. */
function aloft(): boolean {
    return document.querySelector('[data-ui-ring]:popover-open') !== null;
}

/** The flight's clock. */
function clock(): Animation {
    const [animation] = flown().getAnimations();

    if (animation === undefined) {
        throw new Error('nothing is flying');
    }

    return animation;
}

/** Holds the flight `at` a time of its own, and lets a frame lay the ring where that is. */
async function hold(at: number): Promise<void> {
    const flight = clock();

    flight.pause();
    flight.currentTime = at;
    await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
            resolve();
        });
    });
}

/** A ring: its left, its top, its width, its height and its corner. */
type Ring = readonly [number, number, number, number, number];

/** The ring a 2px outline 2px off draws round `element`, its corner `radius` and the outline out. */
function around(element: Element, radius: number): Ring {
    const box = element.getBoundingClientRect();

    return [box.x - 4, box.y - 4, box.width + 8, box.height + 8, radius > 0 ? radius + 4 : 0];
}

/** Where the flown ring is laid, read off its own style. */
function laid(): Ring {
    const { style } = flown();

    return [
        Number.parseFloat(style.left),
        Number.parseFloat(style.top),
        Number.parseFloat(style.width),
        Number.parseFloat(style.height),
        Number.parseFloat(style.borderTopLeftRadius),
    ];
}

afterEach(() => {
    // Whatever is still in the air lands, so nothing flies on into the next test.
    for (const flight of document.querySelector('[data-ui-ring]')?.getAnimations() ?? []) {
        flight.finish();
    }

    document.body.replaceChildren();
});

describe('the ring the page flies', () => {
    it("lays it round the ring the reader saw last, and puts the control's own away", async () => {
        const { from, to } = mount();

        await userEvent.tab();
        await userEvent.tab();
        await hold(0);

        expect(aloft()).toBe(true);
        expect(getComputedStyle(to).outlineStyle).toBe('none');

        const start = around(from, 0);

        // The style keeps six figures of each length, so a read back is close rather than equal.
        laid().forEach((value, index) => {
            expect(value, String(index)).toBeCloseTo(start[index] ?? 0, 3);
        });
    });

    it("carries it between the two on the control's curve, its corners with it", async () => {
        const { from, to } = mount();

        await userEvent.tab();
        await userEvent.tab();
        await hold(5000);

        const start = around(from, 0);
        const end = around(to, 6);

        laid().forEach((value, index) => {
            expect(value, String(index)).toBeCloseTo(((start[index] ?? 0) + (end[index] ?? 0)) / 2);
        });
    });

    it('follows the control if it moves while the ring is on its way', async () => {
        const { from, to } = mount();

        await userEvent.tab();
        await userEvent.tab();
        await hold(5000);
        to.style.translate = '0 40px';
        await hold(5000);

        expect(laid()[1]).toBeCloseTo((around(from, 0)[1] + around(to, 6)[1]) / 2);
    });

    it("lands it where the control's ring is, gives the outline back, and lays it no more", async () => {
        const { to } = mount();

        await userEvent.tab();
        await userEvent.tab();

        const flight = clock();

        flight.finish();
        await flight.finished;

        expect(aloft(), 'landed').toBe(false);
        expect(getComputedStyle(to).outlineStyle, 'the outline').toBe('solid');

        const landed = laid();

        to.style.translate = '0 40px';
        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
                resolve();
            });
        });

        expect(laid(), 'not followed once down').toEqual(landed);
    });

    it("takes the control's outline for its own, and stands out of the pointer's and the reader's way", async () => {
        mount();

        await userEvent.tab();
        await userEvent.tab();

        const ring = flown();
        const style = getComputedStyle(ring);

        expect(ring.popover).toBe('manual');
        expect(ring.ariaHidden).toBe('true');
        expect([
            style.position,
            style.pointerEvents,
            style.borderTopStyle,
            style.borderTopWidth,
            style.borderTopColor,
            style.backgroundColor,
        ]).toEqual(['fixed', 'none', 'solid', '2px', 'rgb(1, 2, 3)', 'rgba(0, 0, 0, 0)']);
    });

    it('flies nothing from a ring the reader did not see', async () => {
        const { from } = mount();

        // A pointer's focus on a button draws no ring.
        await userEvent.click(from);
        await userEvent.tab();

        expect(aloft()).toBe(false);
    });

    it('flies nothing from a focus that went nowhere first', async () => {
        const { from } = mount();

        await userEvent.tab();
        from.blur();
        await userEvent.tab();

        expect(aloft()).toBe(false);
    });

    it('flies nothing from a control that is no longer drawn', async () => {
        const { from } = mount();

        from.addEventListener('blur', () => {
            from.style.display = 'none';
        });

        await userEvent.tab();
        await userEvent.tab();

        expect(aloft()).toBe(false);
    });

    it('flies nothing where the sheet chose no glide', async () => {
        const { to } = mount();

        to.classList.remove('glides');

        await userEvent.tab();
        await userEvent.tab();

        expect(aloft()).toBe(false);
    });

    it.each(['0.01ms', '0s'])(
        'flies nothing where the collapse, or a host, took the flight to %s',
        async (time) => {
            const { to } = mount();

            to.style.setProperty('--ui-fx-ring-time', time);

            await userEvent.tab();
            await userEvent.tab();

            expect(aloft()).toBe(false);
        },
    );

    it('flies on from where the ring had got to when the focus leaves before it lands', async () => {
        const { to, on } = mount();

        await userEvent.tab();
        await userEvent.tab();
        await hold(5000);

        const midway = laid();

        await userEvent.tab();

        expect(to.style.outlineStyle, 'the first put down, its outline its own again').toBe('');

        await hold(0);

        expect(laid()).toEqual(midway);
        expect(getComputedStyle(on).outlineStyle).toBe('none');
    });

    it("keeps a new flight when the last one's landing comes in after the reader moved on", async () => {
        const { on } = mount();

        await userEvent.tab();
        await userEvent.tab();

        const first = clock();
        const landing = first.finished;

        // Its landing is queued, and the reader moves on before it is delivered.
        first.finish();
        on.focus();
        await landing;

        expect(aloft()).toBe(true);
        expect(getComputedStyle(on).outlineStyle).toBe('none');
    });

    it('hears the departure and the arrival even where the page stops them on their way up', async () => {
        const { from } = mount();

        for (const type of ['focusin', 'focusout']) {
            from.addEventListener(type, (event) => {
                event.stopPropagation();
            });
        }

        await userEvent.tab();
        await userEvent.tab();

        expect(aloft()).toBe(true);
    });

    it('lays a ring again where the page took the last one away', async () => {
        mount();

        await userEvent.tab();
        await userEvent.tab();

        const flight = clock();

        flight.finish();
        await flight.finished;
        flown().remove();

        await userEvent.tab({ shift: true });
        await userEvent.tab();

        expect(aloft()).toBe(true);
    });
});

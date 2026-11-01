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

    it('reads a time written in milliseconds as one, as well as one in seconds', async () => {
        const { from, to } = mount();

        to.style.setProperty('--ui-fx-ring-time', '10000ms');

        await userEvent.tab();
        await userEvent.tab();
        await hold(5000);

        expect(laid()[0]).toBeCloseTo((around(from, 0)[0] + around(to, 6)[0]) / 2);
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

    it('flies nothing where the sheet chose no glide, though it hands over a time', async () => {
        const { to } = mount();

        // The time and the curve stay as the sheet hands them over; only the choice is gone.
        to.style.setProperty('--ui-fx-ring', 'none');

        await userEvent.tab();
        await userEvent.tab();

        expect(aloft()).toBe(false);
    });

    it('puts the ring down where the focus leaves it for a control that does not glide', async () => {
        const { to } = mount();

        await userEvent.tab();
        await userEvent.tab();
        await hold(5000);
        await userEvent.tab({ shift: true });

        expect(aloft(), 'down').toBe(false);
        expect(to.style.outlineStyle, 'the outline its own again').toBe('');
    });

    it('forgets the ring the reader saw once the focus moves on from one they did not', async () => {
        const { from, to, on } = mount();

        await userEvent.tab();
        // Two pointer focuses: the first leaves the ring the reader saw toward this very control,
        // and the second, from a ring nobody saw, has to forget it.
        await userEvent.click(to);
        await userEvent.click(on);
        await userEvent.tab({ shift: true });

        expect(document.activeElement).toBe(to);
        expect(from.matches(':focus'), 'the ring seen first is long gone').toBe(false);
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

    it('flies nothing where the sheet chose a flight this does not know', async () => {
        const { to } = mount();

        to.style.setProperty('--ui-fx-ring', 'tumble');

        await userEvent.tab();
        await userEvent.tab();

        expect(aloft()).toBe(false);
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

/** A plain control, one whose ring glitches, and one whose ring glides, as `glitching` lays them. */
interface Glitching {
    readonly before: HTMLButtonElement;
    readonly shook: HTMLButtonElement;
    readonly after: HTMLButtonElement;
}

/**
 * Three controls on a line, the middle one glitching: while the reader can see the focus on it,
 * it carries what a component's sheet declares under the glitch's query — the choice, a flight long
 * enough to read partway on a straight clock, and its two lines' colours. The last one glides.
 */
function glitching(): Glitching {
    const host = document.createElement('div');
    host.innerHTML = `
        <style>
            button { margin: 24px; border-radius: 0; outline: none; }
            button:focus-visible { outline: 2px solid rgb(1, 2, 3); outline-offset: 2px; }
            .glitches { border-radius: 6px; }
            .glitches:focus-visible {
                --ui-fx-ring: glitch;
                --ui-fx-ring-time: 10s;
                --ui-fx-ring-curve: linear;
                --ui-fx-ring-left: rgb(200, 0, 0);
                --ui-fx-ring-right: rgb(0, 0, 200);
            }
            .glides:focus-visible {
                --ui-fx-ring: glide;
                --ui-fx-ring-time: 10s;
                --ui-fx-ring-curve: linear;
            }
        </style>
        <button id="before">Before</button>
        <button id="shook" class="glitches">Shook</button>
        <button id="after" class="glides">After</button>`;
    document.body.append(host);
    watch();

    const pick = (id: string): HTMLButtonElement => {
        const control = host.querySelector<HTMLButtonElement>(`#${id}`);

        if (control === null) {
            throw new Error(`no #${id}`);
        }

        control.addEventListener('focus', arrive);

        return control;
    };

    return { before: pick('before'), shook: pick('shook'), after: pick('after') };
}

/** The two lines the glitch splits the flown ring into: the one thrown left, then the right. */
function lines(): readonly HTMLElement[] {
    return [...flown().children] as HTMLElement[];
}

/** Takes the focus onto the glitching control from a pointer's focus, which leaves no ring seen. */
async function shake({ before }: Glitching): Promise<void> {
    await userEvent.click(before);
    await userEvent.tab();
}

describe('the glitch the page flies', () => {
    it("shakes the control's own ring, wherever the focus came from", async () => {
        const controls = glitching();

        await shake(controls);
        await hold(0);

        expect(aloft()).toBe(true);
        expect(getComputedStyle(controls.shook).outlineStyle).toBe('none');
        expect(flown().style.translate).toBe('-2px');

        const ring = around(controls.shook, 6);

        laid().forEach((value, index) => {
            expect(value, String(index)).toBeCloseTo(ring[index] ?? 0, 3);
        });
    });

    it('jumps a step at a time, and is back where the ring is before it lands', async () => {
        await shake(glitching());

        // Each step's middle, of a 10s flight, and one step's own first moment, which is that
        // step's rather than the last one's. As the style writes them back: no zero for y.
        for (const [at, jump] of [
            [400, '-2px'],
            [800, '2px 1px'],
            [1200, '2px 1px'],
            [2000, '-3px -1px'],
            [2900, '1px'],
            [3700, '3px 1px'],
            [4500, '-1px -1px'],
            [5400, '2px'],
            [6200, '-2px 1px'],
            [7000, '1px -1px'],
            [7900, '-1px'],
            [8700, '1px'],
            [9500, 'none'],
        ] as const) {
            await hold(at);

            expect(flown().style.translate, String(at)).toBe(jump);
        }
    });

    it('shows its two lines three times, each span from its first moment until its end', async () => {
        await shake(glitching());

        for (const [at, shown] of [
            [400, '0'],
            [800, '0.8'],
            [1200, '0.8'],
            [1600, '0'],
            [2400, '0'],
            [3700, '0.8'],
            [4100, '0'],
            [5000, '0'],
            [6200, '0.8'],
            [6700, '0'],
            [9000, '0'],
        ] as const) {
            await hold(at);

            expect(
                lines().map((line) => line.style.opacity),
                String(at),
            ).toEqual([shown, shown]);
        }
    });

    it('draws the lines over the ring in the colours handed over, thrown 3px either way', async () => {
        await shake(glitching());
        await hold(1200);

        const radius = getComputedStyle(flown()).borderTopLeftRadius;

        expect(
            lines().map((line) => {
                const style = getComputedStyle(line);

                return [
                    style.position,
                    style.borderTopColor,
                    style.borderTopWidth,
                    style.translate,
                    style.top,
                    style.left,
                    style.borderTopLeftRadius,
                ];
            }),
        ).toEqual([
            ['absolute', 'rgb(200, 0, 0)', '2px', '-3px', '-2px', '-2px', radius],
            ['absolute', 'rgb(0, 0, 200)', '2px', '3px', '-2px', '-2px', radius],
        ]);
    });

    it("resolves the lines' colours in the control's own scheme, which the ring takes", async () => {
        const controls = glitching();
        controls.shook.parentElement?.style.setProperty('color-scheme', 'dark');
        controls.shook.style.setProperty(
            '--ui-fx-ring-left',
            'light-dark(rgb(1, 1, 1), rgb(2, 2, 2))',
        );

        await shake(controls);
        await hold(1200);

        expect(getComputedStyle(lines()[0] ?? flown()).borderTopColor).toBe('rgb(2, 2, 2)');
    });

    it('follows the control if it moves while the ring shakes', async () => {
        const controls = glitching();

        await shake(controls);
        await hold(1200);
        controls.shook.style.translate = '0 40px';
        await hold(1200);

        expect(laid()[1]).toBeCloseTo(around(controls.shook, 6)[1]);
    });

    it("lands where the control's ring is, and gives the outline back", async () => {
        const controls = glitching();

        await shake(controls);

        const flight = clock();

        flight.finish();
        await flight.finished;

        expect(aloft(), 'landed').toBe(false);
        expect(getComputedStyle(controls.shook).outlineStyle, 'the outline').toBe('solid');
    });

    it('lets a glide after it fly unshaken, its lines put away', async () => {
        await shake(glitching());
        await hold(1200);
        await userEvent.tab();
        await hold(0);

        expect(aloft(), 'the glide in the air').toBe(true);
        expect(flown().style.translate, 'unshaken').toBe('');
        expect(
            lines().map((line) => line.style.opacity),
            'its lines put away',
        ).toEqual(['0', '0']);
    });

    it.each(['0.01ms', '0s'])(
        'shakes nothing where the collapse, or a host, took the flight to %s',
        async (time) => {
            const controls = glitching();
            controls.shook.style.setProperty('--ui-fx-ring-time', time);

            await shake(controls);

            expect(aloft()).toBe(false);
        },
    );
});

/** A plain control, two whose rings come into focus, and one whose ring glides, on a line. */
interface Refocusing {
    readonly before: HTMLButtonElement;
    readonly first: HTMLButtonElement;
    readonly second: HTMLButtonElement;
    readonly glides: HTMLButtonElement;
}

/**
 * Four controls on a line, the middle two refocusing: while the reader can see the focus on one,
 * it carries what a component's sheet declares under the refocus's query — the choice, a time long
 * enough to read partway, and straight curves for its arrival and its departure. The last glides.
 */
function refocusing(): Refocusing {
    const host = document.createElement('div');
    host.innerHTML = `
        <style>
            button { margin: 24px; border-radius: 0; outline: none; }
            button:focus-visible { outline: 2px solid rgb(1, 2, 3); outline-offset: 2px; }
            .refocuses { border-radius: 6px; }
            .refocuses:focus-visible {
                --ui-fx-ring: refocus;
                --ui-fx-ring-time: 10s;
                --ui-fx-ring-curve: linear;
                --ui-fx-ring-exit: linear;
            }
            .glides:focus-visible {
                --ui-fx-ring: glide;
                --ui-fx-ring-time: 10s;
                --ui-fx-ring-curve: linear;
            }
        </style>
        <button id="before">Before</button>
        <button id="first" class="refocuses">First</button>
        <button id="second" class="refocuses">Second</button>
        <button id="glides" class="glides">Glides</button>`;
    document.body.append(host);
    watch();

    const pick = (id: string): HTMLButtonElement => {
        const control = host.querySelector<HTMLButtonElement>(`#${id}`);

        if (control === null) {
            throw new Error(`no #${id}`);
        }

        control.addEventListener('focus', arrive);

        return control;
    };

    return {
        before: pick('before'),
        first: pick('first'),
        second: pick('second'),
        glides: pick('glides'),
    };
}

/** The second ring, which a refocused ring blurs away on, if one was made. */
function leaving(): HTMLElement | undefined {
    return document.querySelectorAll<HTMLElement>('[data-ui-ring]')[1];
}

/** Holds every animation on the second ring `at` a time of its own. */
function stop(at: number): void {
    for (const playing of leaving()?.getAnimations() ?? []) {
        playing.pause();
        playing.currentTime = at;
    }
}

/** Takes the focus onto the first refocusing control from a pointer's, which leaves no ring seen. */
async function refocus({ before }: Refocusing): Promise<void> {
    await userEvent.click(before);
    await userEvent.tab();
}

/**
 * What `act` leaves rejected with nobody to hear it: a ring put away in a promise's callback, where
 * a throw reaches no caller.
 */
async function unheard(act: () => Promise<void>): Promise<unknown[]> {
    const rejected: unknown[] = [];
    const hear = (event: PromiseRejectionEvent): void => {
        rejected.push(event.reason);
    };

    window.addEventListener('unhandledrejection', hear);

    try {
        await act();
        await new Promise((resolve) => setTimeout(resolve, 50));
    } finally {
        window.removeEventListener('unhandledrejection', hear);
    }

    return rejected;
}

/** Lands the ring in the air. */
async function land(): Promise<void> {
    const flight = clock();

    flight.finish();
    await flight.finished;
}

describe('the refocus the page flies', () => {
    it("brings the control's own ring into focus from a blur, wherever the focus came from", async () => {
        const controls = refocusing();

        await refocus(controls);
        await hold(0);

        expect(aloft()).toBe(true);
        expect(getComputedStyle(flown()).filter).toBe('blur(3px)');

        const ring = around(controls.first, 6);

        laid().forEach((value, index) => {
            expect(value, String(index)).toBeCloseTo(ring[index] ?? 0, 3);
        });
    });

    it('takes a quarter again the time handed over, on the curve handed over', async () => {
        await refocus(refocusing());

        expect(clock().effect?.getTiming().duration).toBe(12500);

        await hold(6250);

        expect(getComputedStyle(flown()).filter).toBe('blur(1.5px)');
    });

    it('blurs it away on a second ring as the focus leaves, fading over the second half', async () => {
        const controls = refocusing();

        await refocus(controls);
        await land();
        await userEvent.tab({ shift: true });

        const ring = leaving();

        expect(ring?.matches(':popover-open'), 'up').toBe(true);
        expect(getComputedStyle(ring ?? document.body).borderTopColor).toBe('rgb(1, 2, 3)');

        const where = around(controls.first, 6);

        expect(Number.parseFloat(ring?.style.left ?? '')).toBeCloseTo(where[0], 3);
        expect(Number.parseFloat(ring?.style.top ?? '')).toBeCloseTo(where[1], 3);

        stop(9375);

        expect(getComputedStyle(ring ?? document.body).filter, 'three quarters blurred').toBe(
            'blur(2.25px)',
        );
        expect(getComputedStyle(ring ?? document.body).opacity, 'half faded').toBe('0.5');

        const [going] = ring?.getAnimations() ?? [];

        going?.finish();
        await going?.finished;

        expect(ring?.matches(':popover-open'), 'gone').toBe(false);
    });

    it('lets the next ring come into focus while the last blurs away', async () => {
        await refocus(refocusing());
        await land();
        await userEvent.tab();

        expect(aloft(), 'the next coming into focus').toBe(true);
        expect(leaving()?.matches(':popover-open'), 'the last blurring away').toBe(true);
    });

    it('blurs a new departure away from where it leaves, and gives up the last', async () => {
        const controls = refocusing();

        await refocus(controls);
        await land();
        await userEvent.tab();
        await land();
        await userEvent.tab();

        expect(leaving()?.getAnimations(), 'one blur and one fade').toHaveLength(2);
        expect(Number.parseFloat(leaving()?.style.left ?? '')).toBeCloseTo(
            around(controls.second, 6)[0],
            3,
        );
    });

    it('blurs nothing away from a ring that did not come into focus', async () => {
        mount();

        // A glide onto the second control, and the focus leaving it for the third.
        await userEvent.tab();
        await userEvent.tab();
        await userEvent.tab();

        expect(leaving()?.matches(':popover-open') ?? false).toBe(false);
    });

    it('blurs nothing away from a control no longer drawn', async () => {
        const controls = refocusing();
        controls.first.addEventListener('blur', () => {
            controls.first.style.display = 'none';
        });

        await refocus(controls);
        await land();
        await userEvent.tab();

        expect(leaving()?.matches(':popover-open') ?? false).toBe(false);
    });

    it('lays no blur over a glide', async () => {
        mount();

        await userEvent.tab();
        await userEvent.tab();
        await hold(0);

        expect(getComputedStyle(flown()).filter).toBe('none');
    });

    it('blurs away again once the last blur has gone', async () => {
        await refocus(refocusing());
        await land();
        await userEvent.tab();

        const [going] = leaving()?.getAnimations() ?? [];

        going?.finish();
        await going?.finished;
        await land();
        await userEvent.tab({ shift: true });

        expect(leaving()?.matches(':popover-open')).toBe(true);
    });

    it('puts away nothing the page took out while it blurred', async () => {
        await refocus(refocusing());
        await land();
        await userEvent.tab();

        const rejected = await unheard(async () => {
            const ring = leaving();
            const [going] = ring?.getAnimations() ?? [];

            ring?.remove();
            going?.finish();
            await going?.finished;
        });

        expect(rejected).toEqual([]);
    });

    it.each(['0.01ms', '0s'])(
        'brings nothing into focus, and blurs nothing away, where the time was taken to %s',
        async (time) => {
            const controls = refocusing();
            controls.first.style.setProperty('--ui-fx-ring-time', time);

            await refocus(controls);

            expect(aloft(), 'nothing came').toBe(false);

            await userEvent.tab({ shift: true });

            expect(leaving()?.matches(':popover-open') ?? false, 'nothing went').toBe(false);
        },
    );
});

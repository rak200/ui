import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
// The playwright provider is what puts `send` on `CDPSession` — see `button.test.ts`.
import type {} from '@vitest/browser-playwright';
import { expectAccessible } from './a11y.js';
import { mountStory } from './stories.js';
import meta, { Confirm, Long, Nested } from '../stories/dialog.stories.js';
import '../src/dialog.js';
import { applyLock, reservedGutter } from '../src/dialog.js';
import type { UiDialog } from '../src/dialog.js';
import { glass, matrix, themeStyleSheet, type Theme } from '../src/theme.js';
import { tokenStyleSheet } from '../src/tokens.js';

/** The markup the behavioural tests open, unless one needs a different shape. */
const fixture = `
    <button id="trigger">Open</button>
    <ui-dialog>
        <h2 slot="title">  Delete account  </h2>
        <p id="body">This cannot be undone.</p>
        <button slot="actions" id="confirm">Delete</button>
    </ui-dialog>
`;

/** Mounts a fixture and waits for the component's first render. */
async function mount(markup: string): Promise<UiDialog> {
    const host = document.createElement('div');
    host.innerHTML = markup;
    document.body.append(host);

    const element = host.querySelector('ui-dialog');

    if (element === null) {
        throw new Error('no ui-dialog in the fixture');
    }

    await element.updateComplete;

    return element;
}

/** The one `<ui-dialog>` a story mounted, which failing to find is the gate doing its job. */
function only(container: HTMLElement): UiDialog {
    const element = container.querySelector('ui-dialog');

    if (element === null) {
        throw new Error('the story rendered no ui-dialog');
    }

    return element;
}

/** The real `<dialog>` the component delegates to. */
function inner(element: UiDialog): HTMLDialogElement {
    const dialog = element.shadowRoot?.querySelector('dialog');

    if (!(dialog instanceof HTMLDialogElement)) {
        throw new Error('the component rendered no dialog');
    }

    return dialog;
}

/** The component's own stylesheet, as text, for the rules no rendering can show. */
function styleText(): string {
    return String((customElements.get('ui-dialog') as unknown as { styles: unknown }).styles);
}

/** Resolves when the dialog announces that it has closed. */
function closed(element: UiDialog): Promise<void> {
    return new Promise((resolve) => {
        element.addEventListener('ui-close', () => {
            resolve();
        });
    });
}

/** Waits for whatever the dialog is animating — panel and scrim both — to finish. */
async function still(element: UiDialog): Promise<void> {
    await Promise.allSettled(
        inner(element)
            .getAnimations({ subtree: true })
            .map((animation) => animation.finished),
    );
}

/** Opens the dialog and waits for the entrance to land. */
async function open(element: UiDialog): Promise<void> {
    element.open = true;
    await element.updateComplete;
    await still(element);
}

/** Closes the dialog and waits for the exit to finish. */
async function close(element: UiDialog): Promise<void> {
    const done = closed(element);

    element.open = false;
    await done;
    await element.updateComplete;
}

afterEach(() => {
    // Synchronous, and that is a property of the component rather than of this callback:
    // removing an open dialog closes it and gives the page back in the same turn, so no
    // lock survives into the next test. It did not always — the release used to hang off
    // the platform's `close` event, which is a queued task, and the leak showed up as
    // tests failing on one Node version and not another.
    document.body.replaceChildren();

    // Hygiene rather than assertion: the tests below check that the component gives the
    // page back, and this only stops one that fails from taking the rest of the file with
    // it.
    document.documentElement.style.removeProperty('overflow');
    document.documentElement.style.removeProperty('scrollbar-gutter');
});

describe('ui-dialog', () => {
    it('registers itself as a custom element', () => {
        expect(customElements.get('ui-dialog')).toBeDefined();
    });

    it('delegates to a real dialog, so the platform owns the semantics', async () => {
        const element = await mount(fixture);

        expect(inner(element).tagName).toBe('DIALOG');
    });

    it('is closed until told otherwise', async () => {
        const element = await mount(fixture);

        expect(element.open).toBe(false);
        expect(inner(element).open).toBe(false);
    });

    it('opens modally, which is the top layer, the inert background and the trap', async () => {
        // `:modal` is the platform's own statement that this dialog is the one thing on
        // the page that can be reached — and it is what the `open` attribute alone would
        // never produce.
        const element = await mount(fixture);
        await open(element);

        expect(inner(element).matches(':modal')).toBe(true);
    });

    it('reflects open back to the attribute, so CSS and a host can select on it', async () => {
        const element = await mount(fixture);
        await open(element);

        expect(element.hasAttribute('open')).toBe(true);

        await close(element);

        expect(element.hasAttribute('open')).toBe(false);
    });

    it('opens from the attribute as readily as from the property', async () => {
        const element = await mount(`<ui-dialog open><h2 slot="title">T</h2></ui-dialog>`);
        await still(element);

        expect(element.open).toBe(true);
        expect(inner(element).matches(':modal')).toBe(true);
    });

    it('opens and closes by method, which is the same one way in', async () => {
        const element = await mount(fixture);

        element.show();
        await element.updateComplete;

        expect(element.open, 'show() set the property rather than opening behind it').toBe(true);
        expect(inner(element).matches(':modal')).toBe(true);

        const done = closed(element);
        element.close();

        expect(element.open).toBe(false);

        await done;

        expect(inner(element).open).toBe(false);
    });

    it('exposes the dialog as a part, so a host can style it', async () => {
        const element = await mount(fixture);

        expect(inner(element).getAttribute('part')).toBe('dialog');
    });

    it('renders every slotted region inside the dialog', async () => {
        // A slot whose name stopped matching renders nothing at all, and an unassigned
        // node has no box — so a laid-out rectangle is the assertion that each of the
        // three slots is still connected to the markup a consumer writes.
        const element = await mount(fixture);
        await open(element);

        for (const selector of ['h2', '#body', '#confirm']) {
            const node = element.querySelector(selector);

            expect(node?.getBoundingClientRect().width, selector).toBeGreaterThan(0);
        }
    });
});

/**
 * The half of a modal that is invisible until it is missing.
 *
 * Every one of these is the platform's, and that is the point: they are asserted here
 * because *delegating* them is the design decision, and a component that stopped calling
 * `showModal()` would look identical and trap nobody.
 */
describe('focus', () => {
    it('moves focus into the dialog on open', async () => {
        const element = await mount(fixture);

        await open(element);

        expect(document.activeElement?.id).toBe('confirm');
    });

    it('returns focus to whatever opened it — the half everyone forgets', async () => {
        const element = await mount(fixture);
        const trigger = document.querySelector('#trigger');

        if (!(trigger instanceof HTMLButtonElement)) {
            throw new Error('no trigger in the fixture');
        }

        trigger.focus();
        await open(element);

        expect(document.activeElement, 'focus went in').not.toBe(trigger);

        await close(element);

        expect(document.activeElement).toBe(trigger);
    });

    it('dismisses on Escape', async () => {
        const element = await mount(fixture);
        await open(element);

        const done = closed(element);
        await userEvent.keyboard('{Escape}');
        await done;

        expect(element.open, 'the property followed the dismissal').toBe(false);
        expect(inner(element).open).toBe(false);
    });

    it('runs the exit on Escape rather than closing in the same frame', async () => {
        // Esc arrives as `cancel`, which closes immediately unless it is prevented. This
        // is the assertion that it is — without it the component still closes, and the
        // exit it just gained is never seen.
        const element = await mount(fixture);
        await open(element);

        await userEvent.keyboard('{Escape}');

        // `cancel` sets the property synchronously, so an update is already pending here
        // and this waits for it. Asserting straight off the keypress would be asserting
        // against whether Lit's microtask had run yet, which is the shape of the CI
        // failure that took two tries to stop chasing.
        await element.updateComplete;

        expect(inner(element).open, 'still up while the exit runs').toBe(true);
        expect(inner(element).getAnimations({ subtree: true }).length).toBeGreaterThan(0);
    });

    it('keeps a visible focus ring, for the dialog the platform focuses itself', () => {
        expect(styleText()).toContain('focus-visible');
        expect(styleText()).toContain('outline:');
    });
});

/**
 * The accessible name, which crosses the shadow boundary as a string because an IDREF
 * cannot.
 */
describe('the accessible name', () => {
    it('names the dialog after its title, trimmed', async () => {
        const element = await mount(fixture);

        expect(inner(element).getAttribute('aria-label')).toBe('Delete account');
    });

    it('follows a title rewritten in place, with no element changing', async () => {
        const element = await mount(fixture);
        const title = element.querySelector('h2');

        if (title === null) {
            throw new Error('no title in the fixture');
        }

        title.textContent = 'Delete workspace';
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(inner(element).getAttribute('aria-label')).toBe('Delete workspace');
    });

    it('drops the name when the title is blanked in place', async () => {
        // Three things at once, and all three were surviving mutants. The name has to be
        // *removed* rather than merely never set, which needs a dialog that had one; and
        // the text is changed on the node itself rather than through `textContent`, which
        // would replace the node and be a childList change — so this is the only
        // assertion in the file that a character-data mutation is watched at all.
        const element = await mount(fixture);

        expect(inner(element).getAttribute('aria-label'), 'named to begin with').toBe(
            'Delete account',
        );

        const text = element.querySelector('h2')?.firstChild;

        if (!(text instanceof Text)) {
            throw new Error('the title has no text node to rewrite');
        }

        text.data = '   ';
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(inner(element).hasAttribute('aria-label')).toBe(false);
    });

    it('leaves no name at all when there is no title to take one from', async () => {
        // An `aria-label` that is present and empty is worse than none: a screen reader
        // announces "dialog" either way, and the attribute is the shape that makes an
        // audit read as handled.
        const element = await mount(`<ui-dialog><p>Body</p></ui-dialog>`);

        expect(inner(element).hasAttribute('aria-label')).toBe(false);
    });

    it('leaves no name when the title is present but blank', async () => {
        const element = await mount(`<ui-dialog><h2 slot="title">   </h2></ui-dialog>`);

        expect(inner(element).hasAttribute('aria-label')).toBe(false);
    });

    it('has no accessibility violations while open', async () => {
        const element = await mount(fixture);
        await open(element);

        await expectAccessible(element);
    });

    it('has no accessibility violations while closed', async () => {
        const element = await mount(fixture);

        await expectAccessible(element);
    });
});

/**
 * The one piece of modality `<dialog>` does not supply. Everything else in this file is
 * the platform's; this is the component's.
 */
describe('the scroll lock', () => {
    it('holds the page still while it is open, and gives it back after', async () => {
        const root = document.documentElement;
        const element = await mount(fixture);

        expect(root.style.overflow, 'before').toBe('');

        await open(element);

        expect(root.style.overflow, 'while open').toBe('hidden');

        await close(element);

        expect(root.style.overflow, 'after').toBe('');
    });

    it('gives back what the host had, rather than clearing it', async () => {
        // A page that sets its own overflow, or reserves its own gutter, gets those back.
        // Restoring to the empty string instead would be a component deciding a page-level
        // property on the host's behalf, one dialog at a time.
        const root = document.documentElement;

        root.style.overflow = 'auto';
        root.style.setProperty('scrollbar-gutter', 'stable both-edges');

        const element = await mount(fixture);

        // The page has to actually scroll, or the lock never touches the gutter and the
        // restore has nothing to give back — a version that dropped the gutter entirely
        // would pass against a short page.
        const tall = document.createElement('div');
        tall.style.height = '5000px';
        document.body.append(tall);

        await open(element);

        // Untouched rather than displaced: this engine's scrollbar takes no space, so
        // there is nothing to reserve and the host's own gutter stands through the lock.
        expect(root.style.getPropertyValue('scrollbar-gutter'), 'kept').toBe('stable both-edges');

        await close(element);

        expect(root.style.overflow).toBe('auto');
        expect(root.style.getPropertyValue('scrollbar-gutter')).toBe('stable both-edges');
    });

    it('reserves nothing in an engine whose scrollbar takes no space', async () => {
        // Scrolling is not the question — taking space is. This engine reports a
        // scrollbar width of zero even on a page that scrolls, so there is no gutter to
        // keep and reserving one would pull the content in by a scrollbar that was never
        // there. `tests/manual/scroll-lock.mjs` measured that at -15px against the
        // `scrollHeight` test this used to make, on a browser that draws one.
        const root = document.documentElement;
        const element = await mount(fixture);

        const tall = document.createElement('div');
        tall.style.height = '5000px';
        document.body.append(tall);

        expect(root.scrollHeight, 'the page scrolls').toBeGreaterThan(root.clientHeight);
        expect(window.innerWidth - root.clientWidth, 'and its scrollbar takes nothing').toBe(0);

        await open(element);

        expect(root.style.getPropertyValue('scrollbar-gutter')).toBe('');
    });

    it('gives the page back only when the last dialog has closed', async () => {
        // A confirm over a form is ordinary, and the inner one closing must not hand the
        // page back while the outer one is still up.
        const root = document.documentElement;
        const first = await mount(fixture);
        const second = await mount(fixture);

        await open(first);
        await open(second);

        expect(root.style.overflow, 'both up').toBe('hidden');

        await close(second);

        expect(root.style.overflow, 'the first is still up').toBe('hidden');

        await close(first);

        expect(root.style.overflow, 'and now nothing is').toBe('');
    });
});

/**
 * The rule the scroll lock cannot check from inside this engine, checked as a rule.
 *
 * The suite's browser reports no scrollbar width, so the reserving branch is unreachable
 * from anything the component could measure itself. Decided as a function of two numbers,
 * it is checkable here — and `tests/manual/scroll-lock.mjs` is what confirms the numbers
 * are the right ones, on a browser that draws a scrollbar.
 */
describe('applyLock', () => {
    it('writes both properties by name', () => {
        // On the root, in this engine, the gutter written is always the gutter already
        // there — so the property name is a string nothing compares. On an element handed
        // in, it is observable.
        const element = document.createElement('div');

        applyLock(element, 'hidden', 'stable');

        expect(element.style.overflow).toBe('hidden');
        expect(element.style.getPropertyValue('scrollbar-gutter')).toBe('stable');
    });

    it('gives both back when handed the empty string', () => {
        const element = document.createElement('div');

        applyLock(element, 'hidden', 'stable');
        applyLock(element, '', '');

        expect(element.style.overflow).toBe('');
        expect(element.style.getPropertyValue('scrollbar-gutter')).toBe('');
    });
});

describe('reservedGutter', () => {
    it('reserves the space a scrollbar is taking', () => {
        expect(reservedGutter(1280, 1265, '')).toBe('stable');
    });

    it('reserves nothing when the scrollbar takes no space', () => {
        // Overlay scrollbars: the page scrolls, the bar floats over it, and reserving a
        // gutter would move the content by a width nobody was using.
        expect(reservedGutter(1280, 1280, '')).toBe('');
    });

    it('gives back what the host had rather than clearing it', () => {
        expect(reservedGutter(1280, 1280, 'stable both-edges')).toBe('stable both-edges');
    });

    it('does not reserve for a content box wider than the viewport', () => {
        // Which happens: a page overflowing horizontally reports a content width above the
        // viewport, and there is no vertical gutter to keep there either.
        expect(reservedGutter(1280, 1400, '')).toBe('');
    });
});

/**
 * The exit is the component's own, and it is the reason the token layer collapses reduced
 * motion to `0.01ms` rather than to zero: this is the code that waits for the end of a
 * transition before removing something.
 */
describe('the motion', () => {
    it('runs an exit, and stays open until it has finished', async () => {
        const element = await mount(fixture);
        await open(element);

        element.open = false;
        await element.updateComplete;

        expect(inner(element).open, 'still up while the exit runs').toBe(true);
        expect(inner(element).getAnimations({ subtree: true }).length).toBeGreaterThan(0);

        await closed(element);

        expect(inner(element).open).toBe(false);
    });

    it.each([
        ['nothing chosen', ''],
        ['the blur', 'blur'],
    ] as const)(
        'takes the panel and the scrim away over one duration, which is what lets it await one: %s',
        async (_name, backdrop) => {
            // `#exit` waits on the panel alone — a pseudo-element needs `subtree: true` and the
            // backdrop is therefore not in the list it reads. That is only correct while the
            // two move together as it closes, whatever the scrim came in over, so this is the
            // invariant under that decision rather than a restatement of the stylesheet.
            const element = await mount(fixture);
            element.style.setProperty('--ui-motion-backdrop', backdrop);
            element.style.setProperty('--ui-duration-modal', '0.45s');
            await open(element);

            element.open = false;
            await element.updateComplete;

            const panel = getComputedStyle(inner(element)).transitionDuration;
            const scrim = getComputedStyle(inner(element), '::backdrop').transitionDuration;

            expect(panel, 'and there is a duration to share').not.toBe('0s');
            expect(scrim.split(', ').map((each) => each === panel)).not.toContain(false);
        },
    );

    it('enters and leaves along different curves', async () => {
        const element = await mount(fixture);
        await open(element);

        expect(getComputedStyle(inner(element)).transitionTimingFunction, 'entering').toBe(
            'ease-out',
        );

        element.open = false;
        await element.updateComplete;

        expect(getComputedStyle(inner(element)).transitionTimingFunction, 'leaving').toBe(
            'ease-in',
        );
    });

    it('stays open when it is reopened while the exit is still running', async () => {
        const element = await mount(fixture);
        await open(element);

        element.open = false;
        await element.updateComplete;

        element.open = true;
        await element.updateComplete;

        // The exit is still running — nothing cancelled it — so the way back is it
        // finishing and taking its own class off again. Waiting for the animation rather
        // than polling straight away is the difference between asserting that and
        // catching the first frame, where the opacity has not moved yet and every reading
        // is still 1.
        await still(element);
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(inner(element).open, 'and it never closed').toBe(true);
        expect(inner(element).matches(':modal')).toBe(true);
        await expect.poll(() => getComputedStyle(inner(element)).opacity).toBe('1');
    });

    it('is fully visible again when it is reopened after closing', async () => {
        const element = await mount(fixture);

        await open(element);
        await close(element);
        await open(element);

        expect(getComputedStyle(inner(element)).opacity).toBe('1');
    });

    it('closes without hanging when a host has taken the motion away', async () => {
        // A zero-length transition fires nothing at all, so an exit that waited for an
        // event would wait forever. Waiting on the animations themselves means an empty
        // list resolves rather than blocks — which is also what the token layer's
        // `0.01ms` exists to avoid needing.
        const element = await mount(fixture);
        element.style.setProperty('--ui-duration-state', '0s');

        await open(element);
        await close(element);

        expect(inner(element).open).toBe(false);
    });
});

/** Opens `element` and leaves its entrance running, so what it set going can be read. */
async function opening(element: UiDialog): Promise<void> {
    element.open = true;
    await element.updateComplete;
}

/** The transitions the panel's own sheet set going, as against the clocks a script set going. */
function fades(element: UiDialog): Animation[] {
    return inner(element)
        .getAnimations()
        .filter((animation) => animation instanceof CSSTransition);
}

/** When the last clock a script set going on the panel ends. */
function last(element: UiDialog): number {
    return Math.max(
        ...inner(element)
            .getAnimations()
            .filter((animation) => !(animation instanceof CSSTransition))
            .map((clock) => Number(clock.effect?.getComputedTiming().endTime)),
    );
}

/** The fixture's dialog under `theme`, written where a page writes one. */
async function themed(theme: Theme, name: string): Promise<UiDialog> {
    const style = document.createElement('style');
    style.textContent = tokenStyleSheet() + themeStyleSheet(theme);
    document.body.append(style);

    // The rain's fall cut short, which the scrim's own tests time: `still()` waits out every
    // animation the dialog runs, the rain's included.
    return mount(`<div data-ui-theme="${name}" style="--ui-duration-loop: 10ms">${fixture}</div>`);
}

describe("the panel's passage, RFC 0004's", () => {
    it('hands its panel nothing where nothing is chosen, nor what a surface round it was handed', async () => {
        const element = await mount(
            `<div style="--ui-fx-enter: materialize; --ui-fx-exit: erode; --ui-fx-fit: pace">${fixture}</div>`,
        );
        const style = getComputedStyle(inner(element));

        expect(
            ['enter', 'exit', 'fit'].map((name) => style.getPropertyValue(`--ui-fx-${name}`)),
        ).toEqual(['none', 'none', 'whole']);
    });

    it.each([
        ['enter', 'materialize', '--ui-easing-enter', 'steps(3)'],
        ['exit', 'erode', '--ui-easing-exit', 'steps(5)'],
    ] as const)(
        "hands the pieces its %s, %s, over the dialog's step on the moment's curve",
        async (moment, effect, curve, value) => {
            const element = await mount(fixture);
            element.style.setProperty(`--ui-motion-${moment}`, effect);
            element.style.setProperty('--ui-duration-modal', '0.7s');
            element.style.setProperty(curve, value);
            const style = getComputedStyle(inner(element));

            expect(
                ['', '-time', '-curve'].map((part) =>
                    style.getPropertyValue(`--ui-fx-${moment}${part}`),
                ),
            ).toEqual([effect, '0.7s', value]);
        },
    );

    it.each([['enter'], ['exit']] as const)(
        "hands the grain its %s over the dialog's step, on a straight clock",
        async (moment) => {
            const element = await mount(fixture);
            element.style.setProperty(`--ui-motion-${moment}`, 'dissolve');
            element.style.setProperty('--ui-duration-modal', '0.9s');
            const style = getComputedStyle(inner(element));

            expect(
                ['', '-time', '-curve'].map((part) =>
                    style.getPropertyValue(`--ui-fx-${moment}${part}`),
                ),
            ).toEqual(['dissolve', '0.9s', 'linear']);
        },
    );

    it.each([
        ['nothing chosen', '', 1],
        ['none', 'none', 0],
        ['materialize', 'materialize', 0],
        ['dissolve', 'dissolve', 0],
    ] as const)(
        'fades its panel in only where its own fade is the entrance: %s',
        async (_name, effect, count) => {
            const element = await mount(fixture);
            element.style.setProperty('--ui-motion-enter', effect);

            await opening(element);

            expect(fades(element)).toHaveLength(count);
        },
    );

    it.each([
        ['nothing chosen', '', 1, '0'],
        ['erode', 'erode', 0, '1'],
        ['dissolve', 'dissolve', 0, '1'],
    ] as const)(
        'fades its panel out only where its own fade is the exit, and keeps it whole for one drawn in script: %s',
        async (_name, effect, count, opacity) => {
            const element = await mount(fixture);
            element.style.setProperty('--ui-motion-exit', effect);
            await open(element);

            element.open = false;
            await element.updateComplete;

            const fading = fades(element);

            for (const fade of fading) {
                fade.finish();
            }

            expect([fading.length, getComputedStyle(inner(element)).opacity]).toEqual([
                count,
                opacity,
            ]);
        },
    );

    it('closes at once where its exit is none, its panel fading nothing', async () => {
        const element = await mount(fixture);
        element.style.setProperty('--ui-motion-exit', 'none');
        await open(element);

        element.open = false;
        await element.updateComplete;

        expect([fades(element).length, inner(element).open]).toEqual([0, false]);
    });

    it.each([
        ['erode', 'steps(4)'],
        ['dissolve', 'linear'],
    ] as const)(
        "takes the scrim away over the dialog's step under %s, on the panel's clock",
        async (effect, curve) => {
            const element = await mount(fixture);
            element.style.setProperty('--ui-motion-exit', effect);
            element.style.setProperty('--ui-duration-modal', '0.6s');
            element.style.setProperty('--ui-easing-exit', 'steps(4)');
            await open(element);

            element.open = false;
            await element.updateComplete;

            const scrim = getComputedStyle(inner(element), '::backdrop');

            expect([scrim.transitionDuration, scrim.transitionTimingFunction]).toEqual([
                '0.6s',
                curve,
            ]);
        },
    );

    it("puts the panel together and breaks it under Matrix, each in the whole of the dialog's step, then gives it back", async () => {
        const element = await themed(matrix, 'matrix');

        await opening(element);

        expect(inner(element).style.filter, 'put together').toMatch(/^url\("#ui-pieces-\d+"\)$/);
        expect(last(element), 'the last piece landing').toBeCloseTo(200, 6);

        await still(element);
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(inner(element).style.filter, 'whole once it has landed').toBe('');

        const done = closed(element);
        element.open = false;
        await element.updateComplete;

        expect(inner(element).style.filter, 'broken').toMatch(/^url\("#ui-pieces-\d+"\)$/);
        expect(last(element), 'the last piece going').toBeCloseTo(200, 6);

        await done;

        expect([inner(element).open, inner(element).style.filter], 'closed, and whole').toEqual([
            false,
            '',
        ]);
    });

    it("brings the panel out of a grain and dissolves it under Glass, over the dialog's step", async () => {
        const element = await themed(glass, 'glass');

        await opening(element);

        expect(inner(element).style.filter, 'brought out').toMatch(/^url\("#ui-grain-\d+"\)$/);
        expect(last(element)).toBe(200);

        await still(element);
        const done = closed(element);
        element.open = false;
        await element.updateComplete;

        expect(inner(element).style.filter, 'dissolved').toMatch(/^url\("#ui-grain-\d+"\)$/);
        expect(last(element)).toBe(200);

        await done;

        expect(inner(element).style.filter, 'whole').toBe('');
    });

    it('puts the panel together again when it is reopened while its pieces are going', async () => {
        const element = await themed(matrix, 'matrix');
        await open(element);

        element.open = false;
        await element.updateComplete;

        const broken = inner(element).style.filter;

        element.open = true;
        await element.updateComplete;

        for (const clock of inner(element).getAnimations()) {
            clock.finish();
        }

        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(inner(element).open, 'and it never closed').toBe(true);
        expect(inner(element).style.filter, 'put together anew').toMatch(
            /^url\("#ui-pieces-\d+"\)$/,
        );
        expect(inner(element).style.filter).not.toBe(broken);
    });
});

/** The transitions the scrim runs. */
function scrimmed(element: UiDialog): CSSTransition[] {
    return inner(element)
        .getAnimations({ subtree: true })
        .filter(
            (animation): animation is CSSTransition =>
                animation instanceof CSSTransition &&
                (animation.effect as KeyframeEffect | null)?.pseudoElement === '::backdrop',
        );
}

describe("the scrim's moment, RFC 0004's", () => {
    it.each([
        ['nothing chosen', '', ['opacity']],
        ['none', 'none', []],
    ] as const)(
        'fades the scrim in only where its own fade is the moment: %s',
        async (_name, backdrop, moved) => {
            const element = await mount(fixture);
            element.style.setProperty('--ui-motion-backdrop', backdrop);

            await opening(element);

            expect(scrimmed(element).map((each) => each.transitionProperty)).toEqual(moved);
        },
    );

    it('takes the scrim away at once under none', async () => {
        const element = await mount(fixture);
        element.style.setProperty('--ui-motion-backdrop', 'none');
        await open(element);

        element.open = false;
        await element.updateComplete;

        expect(scrimmed(element)).toEqual([]);
    });

    it("blurs the page behind as the scrim comes in, over the dialog's step on the entrance's curve", async () => {
        const element = await mount(fixture);
        element.style.setProperty('--ui-motion-backdrop', 'blur');
        element.style.setProperty('--ui-duration-modal', '0.45s');
        element.style.setProperty('--ui-easing-enter', 'steps(2)');

        await opening(element);

        const scrim = getComputedStyle(inner(element), '::backdrop');

        expect([
            scrim.transitionProperty,
            scrim.transitionDuration,
            scrim.transitionTimingFunction,
        ]).toEqual(['opacity, backdrop-filter', '0.45s, 0.45s', 'steps(2), steps(2)']);

        const coming = scrimmed(element);

        for (const each of coming) {
            each.pause();
            each.currentTime = 0;
        }

        expect(scrim.backdropFilter, 'from the page in focus').toBe('blur(0px)');

        for (const each of coming) {
            each.finish();
        }

        expect(scrim.backdropFilter, 'to the page blurred').toBe('blur(4px)');
    });

    it("brings the page back into focus as the dialog closes, over the panel's step", async () => {
        const element = await mount(fixture);
        element.style.setProperty('--ui-motion-backdrop', 'blur');
        element.style.setProperty('--ui-duration-state', '0.3s');
        await open(element);

        element.open = false;
        await element.updateComplete;

        const going = scrimmed(element);

        expect(going.map((each) => each.transitionProperty)).toEqual([
            'backdrop-filter',
            'opacity',
        ]);
        // One step for both: the closing rule writes the duration alone, which every property
        // in the list takes.
        expect(getComputedStyle(inner(element), '::backdrop').transitionDuration).toBe('0.3s');

        for (const each of going) {
            each.finish();
        }

        expect(getComputedStyle(inner(element), '::backdrop').backdropFilter).toBe('blur(0px)');
    });

    it.each([
        ['glass', 'blur(10px)', 'rgba(0, 0, 0, 0)'],
        ['no glass', 'none', 'rgb(1, 2, 3)'],
        ['nothing said', '', 'rgb(1, 2, 3)'],
    ] as const)(
        'lays no scrim colour over the blur under glass, and keeps it otherwise: %s',
        async (_name, raised, colour) => {
            const element = await mount(fixture);
            element.style.setProperty('--ui-motion-backdrop', 'blur');
            element.style.setProperty('--ui-color-scrim', 'rgb(1, 2, 3)');
            element.style.setProperty('--ui-backdrop-raised', raised);

            await open(element);

            expect(getComputedStyle(inner(element), '::backdrop').backgroundColor).toBe(colour);
        },
    );

    it('keeps the scrim colour where nothing but glass is chosen', async () => {
        const element = await mount(fixture);
        element.style.setProperty('--ui-color-scrim', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-backdrop-raised', 'blur(10px)');

        await open(element);

        expect(getComputedStyle(inner(element), '::backdrop').backgroundColor).toBe('rgb(1, 2, 3)');
    });

    it.each([
        ['prefers-contrast', 'more'],
        ['prefers-reduced-transparency', 'reduce'],
    ] as const)(
        'blurs the page with no scrim under Glass, and lays the scrim over it again under %s',
        async (feature, value) => {
            const element = await themed(glass, 'glass');
            await open(element);

            const scrim = getComputedStyle(inner(element), '::backdrop');

            expect([scrim.backdropFilter, scrim.backgroundColor], 'glass').toEqual([
                'blur(4px)',
                'rgba(0, 0, 0, 0)',
            ]);

            await cdp().send('Emulation.setEmulatedMedia', {
                features: [{ name: feature, value }],
            });

            try {
                expect(
                    [scrim.backdropFilter, scrim.backgroundColor],
                    'the glass stood down',
                ).toEqual(['blur(4px)', 'rgba(0, 0, 0, 0.5)']);
            } finally {
                await cdp().send('Emulation.setEmulatedMedia', { features: [] });
            }
        },
    );
});

/** Records the colour of every character a canvas is asked to draw, in place of drawing it. */
function drawing(): string[] {
    const fills: string[] = [];
    const spy = vi
        .spyOn(OffscreenCanvasRenderingContext2D.prototype, 'fillText')
        .mockImplementation(function (this: OffscreenCanvasRenderingContext2D) {
            fills.push(typeof this.fillStyle === 'string' ? this.fillStyle : 'a pattern');
        });

    onTestFinished(() => {
        spy.mockRestore();
    });

    return fills;
}

/** Waits past the frame the dialog is first drawn in, and the task its rain is drawn in. */
async function past(): Promise<void> {
    await new Promise(requestAnimationFrame);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
}

/** The rain laid on the dialog for its scrim, once it has been. */
async function rained(element: UiDialog): Promise<string> {
    await expect
        .poll(() => inner(element).style.getPropertyValue('--ui-fx-rain'))
        .toMatch(/^url\("blob:/);

    return inner(element).style.getPropertyValue('--ui-fx-rain');
}

describe("the scrim's rain, RFC 0004's", () => {
    it.each([
        ['where it is chosen', 'char-rain', 'none', 'char-rain'],
        ['nowhere else', '', 'none', 'none'],
        ['nor under forced colours', 'char-rain', 'active', 'none'],
    ] as const)('hands the rain to draw %s', async (_name, backdrop, forced, handed) => {
        const element = await mount(fixture);
        element.style.setProperty('--ui-motion-backdrop', backdrop);
        await cdp().send('Emulation.setEmulatedMedia', {
            features: [{ name: 'forced-colors', value: forced }],
        });

        try {
            expect(getComputedStyle(inner(element)).getPropertyValue('--ui-fx-backdrop')).toBe(
                handed,
            );
        } finally {
            await cdp().send('Emulation.setEmulatedMedia', { features: [] });
        }
    });

    it('lays the rain over the scrim, drawn in the accent the scrim resolves to', async () => {
        const fills = drawing();
        const element = await mount(fixture);
        element.style.setProperty('--ui-motion-backdrop', 'char-rain');
        element.style.setProperty('--ui-color-accent', 'rgb(10, 200, 30)');
        element.style.setProperty('--ui-color-scrim', 'rgb(1, 2, 3)');

        await opening(element);

        const layers = await rained(element);
        const scrim = getComputedStyle(inner(element), '::backdrop');

        expect(layers.split(', ')).toHaveLength(3);
        expect(
            scrim.backgroundImage.split(', ').map((image) => image.startsWith('url("blob:')),
        ).toEqual([true, true, true, false]);
        expect(scrim.backgroundColor).toBe('rgb(1, 2, 3)');
        expect([...new Set(fills)].sort()).toEqual(['#0ac81e', '#ffffff']);
    });

    it('lets the rain fall over a loop that settles, from whole tiles above to where it started', async () => {
        drawing();
        const element = await mount(fixture);
        element.style.setProperty('--ui-motion-backdrop', 'char-rain');
        element.style.setProperty('--ui-duration-loop', '2s');
        element.style.setProperty('--ui-iteration-settle', '3');
        element.style.setProperty('--ui-duration-modal', '0.45s');

        await opening(element);
        await rained(element);

        const scrim = getComputedStyle(inner(element), '::backdrop');

        expect([
            scrim.animationName,
            scrim.animationDuration,
            scrim.animationTimingFunction,
            scrim.transitionDuration,
        ]).toEqual(['ui-rain', '6s', 'cubic-bezier(0.33, 0.33, 0.5, 1)', '0.45s']);

        const falling = inner(element)
            .getAnimations({ subtree: true })
            .find((each) => each instanceof CSSAnimation);

        falling?.pause();

        if (falling !== undefined) {
            falling.currentTime = 0;
        }

        // The rain's three tiles; the scrim's own layer holds no picture to move.
        expect(scrim.backgroundPosition.split(', ').slice(0, 3)).toEqual([
            '0px -1800px',
            '0px -1170px',
            '0px -660px',
        ]);
    });

    it('takes the rain away under forced colours, and draws none', async () => {
        const fills = drawing();
        const element = await mount(fixture);
        element.style.setProperty('--ui-motion-backdrop', 'char-rain');
        await cdp().send('Emulation.setEmulatedMedia', {
            features: [{ name: 'forced-colors', value: 'active' }],
        });

        try {
            await opening(element);
            await past();

            const scrim = getComputedStyle(inner(element), '::backdrop');

            expect([scrim.backgroundImage, scrim.animationName, fills.length]).toEqual([
                'none',
                'none',
                0,
            ]);
        } finally {
            await cdp().send('Emulation.setEmulatedMedia', { features: [] });
        }
    });

    it('rains code over the scrim under Matrix', async () => {
        drawing();
        const element = await themed(matrix, 'matrix');

        await opening(element);
        await rained(element);

        expect(getComputedStyle(inner(element), '::backdrop').animationName).toBe('ui-rain');
    });

    it('draws nothing where the rain is not chosen', async () => {
        const fills = drawing();
        const element = await mount(fixture);

        await opening(element);
        await past();

        expect([fills.length, inner(element).style.getPropertyValue('--ui-fx-rain')]).toEqual([
            0,
            '',
        ]);
    });

    it('draws the rain once for each colour a dialog opens in', async () => {
        const fills = drawing();
        const element = await mount(fixture);
        element.style.setProperty('--ui-motion-backdrop', 'char-rain');
        element.style.setProperty('--ui-duration-loop', '10ms');
        element.style.setProperty('--ui-color-accent', 'rgb(10, 200, 30)');
        await open(element);

        const first = await rained(element);
        const drawn = fills.length;

        await close(element);
        await open(element);
        await past();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fills.length, 'the same colour, kept').toBe(drawn);
        expect(inner(element).style.getPropertyValue('--ui-fx-rain')).toBe(first);

        await close(element);
        element.style.setProperty('--ui-color-accent', 'rgb(200, 10, 30)');
        await open(element);

        await expect
            .poll(() => inner(element).style.getPropertyValue('--ui-fx-rain'))
            .not.toBe(first);
        expect(fills.length, 'another, drawn').toBeGreaterThan(drawn);
    });

    it('draws the rain again on a display of another density', async () => {
        const fills = drawing();
        const element = await mount(fixture);
        element.style.setProperty('--ui-motion-backdrop', 'char-rain');
        element.style.setProperty('--ui-duration-loop', '10ms');
        await open(element);
        await rained(element);

        const drawn = fills.length;

        await close(element);
        await cdp().send('Emulation.setDeviceMetricsOverride', {
            width: 414,
            height: 896,
            deviceScaleFactor: 2,
            mobile: false,
        });
        onTestFinished(async () => {
            await cdp().send('Emulation.clearDeviceMetricsOverride');
        });
        await open(element);

        await expect.poll(() => fills.length).toBeGreaterThan(drawn);
    });
});

describe('the lifecycle', () => {
    it('survives a re-render while it is open', async () => {
        // Lit re-renders for reasons a component does not choose, and a second
        // `showModal()` on an open dialog throws. The guard is a comparison against the
        // platform's state rather than against Lit's changed properties.
        const element = await mount(fixture);
        await open(element);

        element.requestUpdate();
        await element.updateComplete;

        expect(inner(element).matches(':modal')).toBe(true);
    });

    it('announces the close, and the announcement escapes the element', async () => {
        const element = await mount(fixture);
        const seen: Event[] = [];

        document.addEventListener('ui-close', (event) => {
            seen.push(event);
        });

        await open(element);
        await close(element);

        expect(seen.length).toBe(1);
        expect(seen[0]?.bubbles, 'bubbles, so a host can delegate').toBe(true);
        expect(seen[0]?.composed, 'and crosses a shadow boundary').toBe(true);
    });

    it('stays open when it is reopened before the platform reports the close', async () => {
        // The platform fires `close` as a queued task, a turn after the dialog has closed.
        // This reopens it as early as anything can: an observer's callback runs before any
        // queued task, so the dialog is back up before the event lands.
        const element = await mount(fixture);
        const seen: Event[] = [];

        element.addEventListener('ui-close', (event) => {
            seen.push(event);
        });

        await open(element);

        const reopened = new Promise<void>((resolve) => {
            const observer = new MutationObserver(() => {
                if (!inner(element).open) {
                    observer.disconnect();
                    element.open = true;
                    resolve();
                }
            });

            observer.observe(inner(element), { attributeFilter: ['open'] });
        });
        const reported = new Promise((resolve) => {
            inner(element).addEventListener('close', resolve, { once: true });
        });

        element.open = false;
        await reopened;
        await reported;
        await element.updateComplete;

        expect(element.open, 'the host still says open').toBe(true);
        expect(inner(element).matches(':modal'), 'and the dialog is').toBe(true);
        expect(seen.length, 'with no close announced for a dialog that is open').toBe(0);
    });

    it('gives the page back in the same turn it is removed in', async () => {
        // Removing an open dialog drops it out of the top layer and announces nothing, so
        // without this the page stays held by a dialog that is no longer anywhere.
        //
        // **In the same turn**, with nothing awaited between the removal and the
        // assertion, and that is the point of the test rather than a tightening of it.
        // The platform fires `close` as a queued task, so a release hung off that event
        // leaves the page locked for a turn — long enough for a second dialog to open
        // against a count nobody was holding.
        const root = document.documentElement;
        const element = await mount(fixture);

        await open(element);

        expect(root.style.overflow, 'held').toBe('hidden');

        element.remove();

        expect(root.style.overflow, 'given back, with nothing awaited').toBe('');
    });

    it('stops watching the title once it is out of the document', async () => {
        // A `MutationObserver` is not detached by removal: it holds its own reference to
        // the node it watches and goes on firing, in a subtree no longer in a document.
        // Left connected, a removed dialog keeps recomputing an accessible name nobody can
        // reach, and cannot be collected while it does.
        //
        // The full mutation run found this — `disconnect()` deleted, and every test still
        // green. It is in `disconnectedCallback` beside the scroll release, which the test
        // above measures, and beside it the observer had nothing measuring it at all.
        const element = await mount(fixture);
        const title = element.querySelector('h2');

        if (title === null) {
            throw new Error('no title in the fixture');
        }

        expect(inner(element).getAttribute('aria-label'), 'named to begin with').toBe(
            'Delete account',
        );

        element.remove();

        // The same rewrite the name-following test uses, which is what makes this one
        // about the disconnect rather than about the observer working at all.
        title.textContent = 'Delete workspace';
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(inner(element).getAttribute('aria-label'), 'and the name never moved').toBe(
            'Delete account',
        );
    });
});

/**
 * *Every visual decision is a token* is a promise a component can quietly stop keeping.
 *
 * The assertion is the host's own act: declare the property above the component and read
 * what it rendered. A hardcoded value fails it, and so does a reference that stopped being
 * one — an invalid `var()` drops the whole declaration.
 */
describe('every visual decision a dialog paints is a token', () => {
    it('takes its shape, its boundary, its surface and its type from the host', async () => {
        const element = await mount(fixture);

        element.style.setProperty('--ui-font', 'monospace');
        element.style.setProperty('--ui-radius', '11px');
        element.style.setProperty('--ui-space', '7px');
        element.style.setProperty('--ui-color-surface-raised', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-backdrop-raised', 'blur(10px)');
        element.style.setProperty('--ui-color-text', 'rgb(4, 5, 6)');
        element.style.setProperty('--ui-color-border-overlay', 'rgb(7, 8, 9)');

        await open(element);

        const styles = getComputedStyle(inner(element));

        expect(styles.fontFamily, '--ui-font').toBe('monospace');
        expect(styles.borderRadius, '--ui-radius').toBe('11px');
        // The edge of what floats, and for a reason the scrim cannot cover: over the dark
        // surface it leaves the panel 1.10:1 from the page.
        expect(styles.borderTopColor, '--ui-color-border-overlay').toBe('rgb(7, 8, 9)');
        expect(styles.borderTopStyle).toBe('solid');
        expect(styles.borderTopWidth).toBe('1px');
        expect(styles.paddingTop, '--ui-space, tripled').toBe('21px');
        expect(styles.backgroundColor, '--ui-color-surface-raised').toBe('rgb(1, 2, 3)');
        expect(styles.backdropFilter, '--ui-backdrop-raised').toBe('blur(10px)');
        expect(styles.color, '--ui-color-text').toBe('rgb(4, 5, 6)');
        expect(styles.rowGap, '--ui-space, doubled between the regions').toBe('14px');

        const actions = element.shadowRoot?.querySelector('slot[name="actions"]');

        if (actions === null || actions === undefined) {
            throw new Error('the component rendered no actions slot');
        }

        expect(getComputedStyle(actions).gap, '--ui-space, between the buttons').toBe('7px');
    });

    it('keeps the panel clear of the viewport edge by the spacing step', async () => {
        // The cap is four steps of clearance on each side, asserted through what the panel
        // actually measures rather than through the declaration: a `var()` that stopped
        // resolving drops the whole line, and the dialog would simply grow to the viewport.
        //
        // The content has to be wide enough for the cap to be what decides the width — a
        // short dialog is narrower than its own cap, and would measure the same either
        // way.
        const step = 16;
        const element = await mount(`
            <ui-dialog>
                <h2 slot="title">Title</h2>
                <p>${'A sentence long enough to run past the viewport on its own. '.repeat(4)}</p>
            </ui-dialog>
        `);
        element.style.setProperty('--ui-space', `${String(step)}px`);

        await open(element);

        expect(Math.round(inner(element).getBoundingClientRect().width)).toBe(
            document.documentElement.clientWidth - 8 * step,
        );
    });

    it('takes the scrim from the host, which reaches the backdrop', async () => {
        // `::backdrop` is not a descendant of anything, so whether a custom property
        // reaches it at all is a fact about the engine rather than about this stylesheet —
        // measured here rather than assumed.
        const element = await mount(fixture);
        element.style.setProperty('--ui-color-scrim', 'rgb(1, 2, 3)');

        await open(element);

        expect(getComputedStyle(inner(element), '::backdrop').backgroundColor).toBe('rgb(1, 2, 3)');
    });

    it('takes both curves from the host', async () => {
        const element = await mount(fixture);
        element.style.setProperty('--ui-easing-enter', 'linear');
        element.style.setProperty('--ui-easing-exit', 'cubic-bezier(0.1, 0.2, 0.3, 0.4)');

        await open(element);

        expect(getComputedStyle(inner(element)).transitionTimingFunction, 'entering').toBe(
            'linear',
        );

        element.open = false;
        await element.updateComplete;

        expect(getComputedStyle(inner(element)).transitionTimingFunction, 'leaving').toBe(
            'cubic-bezier(0.1, 0.2, 0.3, 0.4)',
        );
    });

    it('takes the focus ring colour from the host', async () => {
        const element = await mount(`<ui-dialog><h2 slot="title">Title</h2></ui-dialog>`);
        element.style.setProperty('--ui-color-focus', 'rgb(1, 2, 3)');

        await open(element);

        expect(getComputedStyle(inner(element)).outlineColor).toBe('rgb(1, 2, 3)');
    });
});

/**
 * The playground's gate. A story that stops compiling or stops rendering fails here rather
 * than on the deploy, which runs after the required check.
 */
describe('ui-dialog stories', () => {
    it.each([
        ['Confirm', Confirm],
        ['Long', Long],
        ['Nested', Nested],
    ] as const)('%s renders a real dialog and meets the bar', async (name, story) => {
        const container = await mountStory(story, meta, name);
        const element = only(container);

        expect(inner(element).tagName).toBe('DIALOG');

        await open(element);
        await expectAccessible(container);
    });
});

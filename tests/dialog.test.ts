import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectAccessible } from './a11y.js';
import { mountStory } from './stories.js';
import meta, { Confirm, Long, Nested } from '../stories/dialog.stories.js';
import '../src/dialog.js';
import type { UiDialog } from '../src/dialog.js';

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

afterEach(async () => {
    document.body.replaceChildren();

    // Removing an open dialog closes it, and the platform fires `close` as a queued task
    // rather than synchronously — so without this turn the release lands in the middle of
    // the *next* test and gives the page back under it. Measured, as three tests failing
    // in a way that depended on the order they ran in.
    await new Promise((resolve) => {
        setTimeout(resolve, 0);
    });

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

        root.style.overflow = 'clip';
        root.style.setProperty('scrollbar-gutter', 'stable both-edges');

        const element = await mount(fixture);
        await open(element);
        await close(element);

        expect(root.style.overflow).toBe('clip');
        expect(root.style.getPropertyValue('scrollbar-gutter')).toBe('stable both-edges');
    });

    it('reserves the gutter only where there was a scrollbar to lose', async () => {
        const root = document.documentElement;
        const element = await mount(fixture);

        expect(root.scrollHeight, 'the fixture page does not scroll').toBeLessThanOrEqual(
            root.clientHeight,
        );

        await open(element);

        expect(root.style.getPropertyValue('scrollbar-gutter'), 'nothing to reserve').toBe('');

        await close(element);

        const tall = document.createElement('div');
        tall.style.height = '5000px';
        document.body.append(tall);

        expect(root.scrollHeight, 'the page scrolls now').toBeGreaterThan(root.clientHeight);

        await open(element);

        expect(root.style.getPropertyValue('scrollbar-gutter'), 'a scrollbar to keep').toBe(
            'stable',
        );
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

    it('moves the panel and the scrim over one duration, which is what lets it await one', async () => {
        // `#exit` waits on the panel alone — a pseudo-element needs `subtree: true` and the
        // backdrop is therefore not in the list it reads. That is only correct while the
        // two move together, so this is the invariant under that decision rather than a
        // restatement of the stylesheet.
        const element = await mount(fixture);
        await open(element);

        const panel = getComputedStyle(inner(element)).transitionDuration;
        const scrim = getComputedStyle(inner(element), '::backdrop').transitionDuration;

        expect(panel, 'and there is a duration to share').not.toBe('0s');
        expect(scrim).toBe(panel);
    });

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

    it('gives the page back when it is removed while open', async () => {
        // Removing an open dialog drops it out of the top layer and announces nothing, so
        // without this the page stays held by a dialog that is no longer anywhere.
        const root = document.documentElement;
        const element = await mount(fixture);

        await open(element);

        expect(root.style.overflow, 'held').toBe('hidden');

        element.remove();
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(root.style.overflow, 'given back').toBe('');
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
    it('takes its shape, its surface and its type from the host', async () => {
        const element = await mount(fixture);

        element.style.setProperty('--ui-font', 'monospace');
        element.style.setProperty('--ui-radius', '11px');
        element.style.setProperty('--ui-space', '7px');
        element.style.setProperty('--ui-color-surface', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-color-text', 'rgb(4, 5, 6)');

        await open(element);

        const styles = getComputedStyle(inner(element));

        expect(styles.fontFamily, '--ui-font').toBe('monospace');
        expect(styles.borderRadius, '--ui-radius').toBe('11px');
        expect(styles.paddingTop, '--ui-space, tripled').toBe('21px');
        expect(styles.backgroundColor, '--ui-color-surface').toBe('rgb(1, 2, 3)');
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

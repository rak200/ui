import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
// The playwright provider is what puts `send` on `CDPSession` — see `button.test.ts`,
// which needs the same line for the same reason.
import type {} from '@vitest/browser-playwright';
import { expectAccessible } from './a11y.js';
import { mountStory } from './stories.js';
import meta, {
    AtTheEdge,
    Inside,
    OnAControlYouWrote,
    Tooltip,
} from '../stories/tooltip.stories.js';
import '../src/tooltip.js';
import '../src/input.js';
import type { UiTooltip } from '../src/tooltip.js';

/** The markup the behavioural tests use, unless one needs a different shape. */
const fixture = `
    <ui-tooltip>
        <button type="button">Save</button>
        <span slot="tip">Saves without closing the dialog.</span>
    </ui-tooltip>
`;

/**
 * Mounts a fixture, pushed down the page so there is room above the trigger.
 *
 * The default placement is above, and a trigger at the very top of the viewport flips —
 * which is a case with its own test rather than the shape every other test should inherit.
 */
async function mount(markup: string, offset = '120px'): Promise<HTMLElement> {
    const host = document.createElement('div');
    host.style.marginBlockStart = offset;
    host.innerHTML = markup;
    document.body.append(host);

    for (const element of host.querySelectorAll('ui-tooltip, ui-input')) {
        await (element as UiTooltip).updateComplete;
    }

    await new Promise((resolve) => {
        setTimeout(resolve, 0);
    });

    return host;
}

/**
 * Two shapes of custom element, because what strands a description is where focus lands
 * rather than which component is in front of it. A test built out of `<ui-button>` would
 * be asserting that pair; these assert the rule, and they keep meaning the same thing when
 * a component moves.
 */
/**
 * A trigger that hands focus from inside its shadow root out to a child in the light DOM.
 *
 * That is `<ui-menu>`'s shape — it renders its own button and leaves the items slotted —
 * and it is what made a `focusout` at this element mean nothing on its own. Written as a
 * fixture for the reason the two below give: the rule is about where focus goes, not about
 * which component happens to be in front of it.
 */
class HandsFocusOn extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML =
            '<button type="button" class="own">More</button><slot></slot>';
    }
}

class FocusesInside extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML = '<button type="button">Save</button>';
    }
}

class DrawsInside extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML = '<span>Save</span>';
    }
}

/**
 * A trigger that accepts the handoff, which is what `<ui-button>` became in RFC 0006's
 * first rollout step. Written here rather than reaching for `<ui-button>` for the reason
 * the three above give: these tests are about the protocol, not about which component
 * happens to implement it.
 */
class TakesTheText extends HTMLElement {
    /** Every sentence it was handed, in order, so the cadence can be asserted and not only the last. */
    readonly handed: string[] = [];

    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML = '<button type="button">Save</button>';
        this.addEventListener('ui-describe', (event) => {
            if (event instanceof CustomEvent && typeof event.detail === 'string') {
                this.handed.push(event.detail);
                event.preventDefault();
            }
        });
    }
}

customElements.define('test-takes-the-text', TakesTheText);
customElements.define('test-hands-focus-on', HandsFocusOn);
customElements.define('test-focuses-inside', FocusesInside);
customElements.define('test-draws-inside', DrawsInside);

/** The one element a selector has to match, so a fixture typo fails where it happened. */
function only(host: ParentNode, selector: string): HTMLElement {
    const found = host.querySelector<HTMLElement>(selector);

    if (found === null) {
        throw new Error(`no ${selector} in the fixture`);
    }

    return found;
}

const trigger = (host: ParentNode): HTMLElement => only(host, 'button, input');
const tip = (host: ParentNode): HTMLElement => only(host, '[slot=tip]');

/** Lets a placement land: the element is shown, then measured, then moved. */
async function painted(): Promise<void> {
    await new Promise((resolve) => {
        requestAnimationFrame(() => {
            resolve(null);
        });
    });
}

/**
 * Runs something and hands back every error that escaped into a listener.
 *
 * **An exception thrown inside an event listener reaches nobody.** It does not propagate to
 * whatever dispatched the event — the platform reports it on the window instead. So a
 * component that throws where it should have returned leaves every assertion in this file
 * passing, and the mutation floor does not catch it either: Stryker sees a run that
 * *errored* rather than a test that *failed*, records `RuntimeError`, and **leaves the
 * mutant out of the score entirely**. Eight mutants on this element's handoff, show and
 * hide paths came back that way from the full run — ungraded, and with nothing complaining
 * that they had not been graded.
 *
 * The idiom is not new: two placement tests below already captured errors exactly this way,
 * inline. What the floor showed is that the paths needing it are six rather than two.
 */
async function escaped(run: () => Promise<void> | void): Promise<string[]> {
    const thrown: string[] = [];

    const caught = (event: ErrorEvent): void => {
        thrown.push(event.message);
        // Handled, because this is what is handling it: the assertion below is the
        // treatment. Left uncancelled the runner also reports it as an unhandled error,
        // and a run that errors is classified ahead of a run that merely fails.
        event.preventDefault();
    };

    // **Both channels, and the second is not symmetry for its own sake.** A synchronous
    // throw inside a listener arrives as `error`; a rejected promise nobody awaited arrives
    // as `unhandledrejection` and nowhere else. `customElements.whenDefined` on a name that
    // could never be a custom element *rejects* rather than throws — measured, as a mutant
    // that produced 55 errors in this file and failed no test that was only watching the
    // first channel.
    const rejected = (event: PromiseRejectionEvent): void => {
        thrown.push(String(event.reason));
    };

    window.addEventListener('error', caught);
    window.addEventListener('unhandledrejection', rejected);

    try {
        await run();
        // A rejection is delivered on a later turn than the call that made it, so a check
        // that ran straight after `run()` would read an empty list and call it silence.
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });
    } finally {
        window.removeEventListener('error', caught);
        window.removeEventListener('unhandledrejection', rejected);
    }

    return thrown;
}

/** The component's own stylesheet, as text, for the rules no rendering can show. */
function styleText(): string {
    return String((customElements.get('ui-tooltip') as unknown as { styles: unknown }).styles);
}

/** Moves the pointer out of the way, because nothing in the page can — see checkbox.test.ts. */
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
    // `vi.spyOn` hands back the spy already on a method rather than wrapping it again, so
    // an unrestored one carries the previous test's calls into the next — measured, as two
    // assertions of silence reading a warning neither of them provoked.
    vi.restoreAllMocks();
});

describe('ui-tooltip', () => {
    it('registers itself as a custom element', () => {
        expect(customElements.get('ui-tooltip')).toBeDefined();
    });

    it('leaves both the trigger and the tip in the light DOM', async () => {
        const host = await mount(fixture);
        const element = only(host, 'ui-tooltip');

        expect(trigger(host).parentElement).toBe(element);
        expect(tip(host).parentElement).toBe(element);
        expect(element.shadowRoot?.querySelector('button')).toBeNull();
    });

    it('lays nothing out, so wrapping a trigger does not move it', async () => {
        const host = await mount(fixture);

        expect(getComputedStyle(only(host, 'ui-tooltip')).display).toBe('contents');
    });

    it('makes the tip a popover, names it, and points the trigger at it', async () => {
        const host = await mount(fixture);

        expect(tip(host).getAttribute('popover')).toBe('manual');
        expect(tip(host).getAttribute('role')).toBe('tooltip');
        expect(tip(host).id).toMatch(/\S/);
        expect(trigger(host).getAttribute('aria-describedby')).toBe(tip(host).id);
    });

    it('numbers each tooltip separately, so two on one page do not collide', async () => {
        const host = await mount(`${fixture}${fixture}`);
        const [first, second] = host.querySelectorAll('[slot=tip]');

        expect(first?.id).not.toBe(second?.id);
    });

    it('keeps an id and a role the host wrote', async () => {
        const host = await mount(`
            <ui-tooltip>
                <button type="button">Save</button>
                <span slot="tip" id="chosen" role="note">Saves.</span>
            </ui-tooltip>
        `);

        expect(tip(host).id).toBe('chosen');
        expect(tip(host).getAttribute('role')).toBe('note');
        expect(trigger(host).getAttribute('aria-describedby')).toBe('chosen');
    });

    it('adds to a description the trigger already had, rather than replacing it', async () => {
        // A control may already be described by something this element cannot see, and a
        // description that silently replaced another is the failure nobody sees.
        const host = await mount(`
            <ui-tooltip>
                <button type="button" aria-describedby="elsewhere">Save</button>
                <span slot="tip">Saves.</span>
            </ui-tooltip>
            <span id="elsewhere">Something else</span>
        `);

        expect(trigger(host).getAttribute('aria-describedby')).toBe(`elsewhere ${tip(host).id}`);
    });

    it('says nothing twice when it is wired again', async () => {
        const host = await mount(fixture);
        const element = only(host, 'ui-tooltip');
        const replacement = document.createElement('span');
        replacement.slot = 'tip';
        replacement.textContent = 'Saves.';

        element.append(replacement);
        tip(host).remove();
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        const described = trigger(host).getAttribute('aria-describedby') ?? '';

        expect(described.split(' ')).toEqual([...new Set(described.split(' '))]);
        expect(described).toContain(replacement.id);
    });

    it('names the same tip once, however often it is wired again', async () => {
        // The tip is taken out and put back — a re-render that keeps the element rather
        // than replacing it. The id it already has must not be appended a second time, or
        // the description grows one copy per render.
        const host = await mount(fixture);
        const element = only(host, 'ui-tooltip');
        const same = tip(host);

        same.remove();
        element.append(same);
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(trigger(host).getAttribute('aria-describedby')).toBe(same.id);
    });

    it('names a tip the trigger was already pointing at only once', async () => {
        // The pair wired by hand and then wrapped, which is the case that still reaches
        // the guard. The test above stopped reaching it once the element began comparing
        // the pair it last wired: taking the same tip out and putting it back is now a
        // re-notification rather than a change, so it returns before the list is read.
        // The end state it asserts is unchanged; what it no longer exercises is this.
        const host = await mount(`
            <ui-tooltip>
                <button type="button" aria-describedby="chosen">Save</button>
                <span slot="tip" id="chosen">Saves.</span>
            </ui-tooltip>
        `);

        expect(trigger(host).getAttribute('aria-describedby')).toBe('chosen');
    });

    it('takes its id back out when the tip goes, rather than pointing at nothing', async () => {
        // A dangling IDREF is not a missing description. The platform resolves the
        // attribute when it is read, so this render costs the reader nothing — the damage
        // is that the element still believes it owns an entry, and the next tip is
        // appended beside the dead one. #189
        const host = await mount(fixture);
        const gone = tip(host).id;

        tip(host).remove();
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(document.getElementById(gone), 'the id resolves to nothing').toBeNull();
        expect(trigger(host).hasAttribute('aria-describedby')).toBe(false);
    });

    it('leaves the description the host wrote when it takes its own back out', async () => {
        // The mirror of adding to a list rather than replacing it: taking one entry out
        // must not take the neighbours with it.
        const host = await mount(`
            <ui-tooltip>
                <button type="button" aria-describedby="elsewhere">Save</button>
                <span slot="tip">Saves.</span>
            </ui-tooltip>
            <span id="elsewhere">Something else</span>
        `);

        tip(host).remove();
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(trigger(host).getAttribute('aria-describedby')).toBe('elsewhere');
    });

    it('keeps the ids it leaves behind apart from each other', async () => {
        // Two of them, because one cannot tell a separator from no separator.
        const host = await mount(`
            <ui-tooltip>
                <button type="button" aria-describedby="first second">Save</button>
                <span slot="tip">Saves.</span>
            </ui-tooltip>
            <span id="first">One</span>
            <span id="second">Two</span>
        `);

        tip(host).remove();
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(trigger(host).getAttribute('aria-describedby')).toBe('first second');
    });

    it('describes a trigger that replaced the one it was wired to', async () => {
        // The default slot reports a replacement and this element did not listen to it,
        // so a framework re-rendering the trigger left the new one undescribed. #189
        const host = await mount(fixture);
        const first = trigger(host);
        const replacement = document.createElement('button');
        replacement.type = 'button';
        replacement.textContent = 'Save';

        first.replaceWith(replacement);
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(replacement.getAttribute('aria-describedby')).toBe(tip(host).id);
        expect(first.hasAttribute('aria-describedby'), 'the old one let go').toBe(false);
    });

    it('does nothing at all when there is no trigger to describe', async () => {
        const host = await mount('<ui-tooltip><span slot="tip">Saves.</span></ui-tooltip>');

        expect(tip(host).hasAttribute('popover'), 'nothing was wired').toBe(false);
        expect(tip(host).id).toBe('');

        // And the way out is a return rather than a throw. `disconnectedCallback` hides on
        // the way out, and here there is a tip the element never made a popover — so
        // `hidePopover()` on it is `NotSupportedError`, thrown inside a lifecycle callback
        // where no assertion was looking. Taken out here rather than left to the teardown,
        // because a disconnect the teardown performs happens outside every test: the throw
        // is then reported against the run instead of against this assertion, and a run
        // that errors is graded ahead of a run that fails.
        const thrown = await escaped(() => {
            only(host, 'ui-tooltip').remove();
        });

        expect(thrown).toEqual([]);
    });

    it('does nothing at all when there is no tip to show', async () => {
        const host = await mount('<ui-tooltip><button type="button">Save</button></ui-tooltip>');

        const thrown = await escaped(async () => {
            await userEvent.hover(trigger(host));
        });

        expect(trigger(host).hasAttribute('aria-describedby')).toBe(false);
        expect(thrown, 'and nothing threw on the way').toEqual([]);
    });

    it('hands it the moment it is wired, when the definition has already arrived', () => {
        // Synchronously, and nothing is awaited here on purpose. A registry that already
        // holds the name needs no waiting, and waiting anyway would put every description
        // in this package a turn behind for the sake of the one case it cannot help.
        const element = document.createElement('ui-tooltip');
        const taker = document.createElement('test-takes-the-text') as TakesTheText;
        const tip = document.createElement('span');

        tip.slot = 'tip';
        tip.textContent = 'Saves.';
        element.append(taker, tip);

        document.body.append(element);

        expect(taker.handed).toEqual(['Saves.']);
    });

    it('stops watching a tip it has let go of', async () => {
        // The observer rides in the wiring, so letting go has to take it with it —
        // otherwise a tip removed from the page goes on describing the trigger it left.
        const host = await mount(`
            <ui-tooltip>
                <test-takes-the-text></test-takes-the-text>
                <span slot="tip">Saves.</span>
            </ui-tooltip>
        `);

        const taker = only(host, 'test-takes-the-text') as TakesTheText;
        const gone = tip(host);

        gone.remove();
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(taker.handed).toEqual(['Saves.', '']);

        gone.textContent = 'Edited after it left.';
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(taker.handed, 'a tip it let go of says nothing more').toEqual(['Saves.', '']);
    });

    it('hands the sentence to a trigger that takes it', async () => {
        const host = await mount(`
            <ui-tooltip>
                <test-takes-the-text></test-takes-the-text>
                <span slot="tip">Saves without closing the dialog.</span>
            </ui-tooltip>
        `);

        const taker = only(host, 'test-takes-the-text') as TakesTheText;

        expect(taker.handed).toEqual(['Saves without closing the dialog.']);
    });

    it('says nothing when the sentence was taken', async () => {
        // The warning is #158's and it narrows as each element is covered: an uncancelled
        // dispatch is the only condition, so a trigger that accepts needs no roster entry.
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        await mount(`
            <ui-tooltip>
                <test-takes-the-text></test-takes-the-text>
                <span slot="tip">Saves.</span>
            </ui-tooltip>
        `);

        expect(warn).not.toHaveBeenCalled();
    });

    it('hands it again when the tip is rewritten in place', async () => {
        // `slotchange` reports neither in-place edit — measured — so the observer is what
        // keeps the copy fresh, and the most recent dispatch is the one that counts.
        const host = await mount(`
            <ui-tooltip>
                <test-takes-the-text></test-takes-the-text>
                <span slot="tip">Saves.</span>
            </ui-tooltip>
        `);

        const taker = only(host, 'test-takes-the-text') as TakesTheText;

        tip(host).textContent = 'Saves without closing the dialog.';
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(taker.handed.at(-1)).toBe('Saves without closing the dialog.');
    });

    it('hands it again when a node is appended to the tip', async () => {
        const host = await mount(`
            <ui-tooltip>
                <test-takes-the-text></test-takes-the-text>
                <span slot="tip">Saves.</span>
            </ui-tooltip>
        `);

        const taker = only(host, 'test-takes-the-text') as TakesTheText;

        tip(host).append(' Twice.');
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(taker.handed.at(-1)).toBe('Saves. Twice.');
    });

    it('hands over the sentence and not the markup around it', async () => {
        // A tip written across lines carries the indentation into its text, and what the
        // trigger renders is announced rather than laid out — so the whitespace is not
        // cosmetic there, it is the sentence.
        const host = await mount(`
            <ui-tooltip>
                <test-takes-the-text></test-takes-the-text>
                <span slot="tip">
                    Saves without closing the dialog.
                </span>
            </ui-tooltip>
        `);

        expect((only(host, 'test-takes-the-text') as TakesTheText).handed).toEqual([
            'Saves without closing the dialog.',
        ]);
    });

    it('hands it again when the edit lands on a node inside the tip', async () => {
        // The tip is one element to `slotchange` and a subtree to everything else: an edit
        // can land on a descendant as readily as on the tip itself, and a host writing
        // emphasis into a sentence is the ordinary way that happens.
        const host = await mount(`
            <ui-tooltip>
                <test-takes-the-text></test-takes-the-text>
                <span slot="tip">Saves <em>quickly</em>.</span>
            </ui-tooltip>
        `);

        const taker = only(host, 'test-takes-the-text') as TakesTheText;
        const inner = only(host, 'em').firstChild;

        if (!(inner instanceof Text)) {
            throw new Error('the fixture lost its text node');
        }

        inner.data = 'slowly';
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(taker.handed.at(-1)).toBe('Saves slowly.');
    });

    it('speaks for the pair it is wired to now, not the one it was waiting on', async () => {
        // The definition can arrive after the trigger it was being waited on for is gone.
        // Handing over then would describe the element that replaced it a second time,
        // with a sentence nobody asked to be re-sent.
        const tag = `test-abandoned-${String(Date.now())}`;

        const host = await mount(`
            <ui-tooltip>
                <${tag}></${tag}>
                <span slot="tip">Saves.</span>
            </ui-tooltip>
        `);

        const abandoned = only(host, tag);
        const replacement = document.createElement('test-takes-the-text') as TakesTheText;
        const heard: unknown[] = [];

        // Listened to from out here rather than through the class, because an element
        // taken out of the document is never upgraded — so once it is replaced, its own
        // definition arriving gives it nothing to hear with.
        abandoned.addEventListener('ui-describe', (event) => {
            if (event instanceof CustomEvent) {
                heard.push(event.detail);
            }
        });

        abandoned.replaceWith(replacement);
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(replacement.handed, 'wired, and handed once').toEqual(['Saves.']);
        expect(heard, 'and the one it replaced was let go of').toEqual(['']);

        customElements.define(tag, class extends TakesTheText {});
        await customElements.whenDefined(tag);
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(heard, 'the one it was waiting on is never handed to').toEqual(['']);
        expect(replacement.handed, 'and the one it holds is not told twice').toEqual(['Saves.']);
    });

    it('withdraws with an empty sentence when the tip goes', async () => {
        // Without it a control keeps pointing at text describing a tip the reader can no
        // longer summon, which reads as current and is worse than never having had it.
        const host = await mount(`
            <ui-tooltip>
                <test-takes-the-text></test-takes-the-text>
                <span slot="tip">Saves.</span>
            </ui-tooltip>
        `);

        const taker = only(host, 'test-takes-the-text') as TakesTheText;

        tip(host).remove();
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(taker.handed.at(-1)).toBe('');
    });

    it('withdraws when the tooltip itself is taken out of the document', async () => {
        // The trigger is the tooltip's own child and usually leaves with it. This is the
        // host that moves the trigger out first, and the framework that unmounts one side.
        const host = await mount(`
            <ui-tooltip>
                <test-takes-the-text></test-takes-the-text>
                <span slot="tip">Saves.</span>
            </ui-tooltip>
        `);

        const element = only(host, 'ui-tooltip');
        const taker = only(host, 'test-takes-the-text') as TakesTheText;

        element.remove();
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(taker.handed.at(-1)).toBe('');
    });

    it('hands it again when a tooltip a framework moved comes back', async () => {
        const host = await mount(`
            <ui-tooltip>
                <test-takes-the-text></test-takes-the-text>
                <span slot="tip">Saves.</span>
            </ui-tooltip>
        `);

        const element = only(host, 'ui-tooltip');
        const taker = only(host, 'test-takes-the-text') as TakesTheText;

        element.remove();
        host.append(element);
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(taker.handed.at(-1)).toBe('Saves.');
    });

    it('waits for a trigger whose definition has not arrived yet', async () => {
        // Measured: a dispatch before the upgrade is heard by nobody and comes back
        // uncancelled, which is what a trigger that accepts no text returns — and the
        // upgrade itself fires no slotchange, so this promise is the only signal there is.
        const tag = `test-late-${String(Date.now())}`;
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        const host = await mount(`
            <ui-tooltip>
                <${tag}></${tag}>
                <span slot="tip">Saves.</span>
            </ui-tooltip>
        `);

        expect(
            warn,
            'nothing is said while refusal cannot be told from absence',
        ).not.toHaveBeenCalled();

        customElements.define(tag, class extends TakesTheText {});
        await customElements.whenDefined(tag);
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect((only(host, tag) as TakesTheText).handed).toEqual(['Saves.']);
        expect(warn).not.toHaveBeenCalled();
    });

    it('says out loud that a description will not arrive, rather than losing it quietly', async () => {
        // The failure this component is most likely to produce, and the one nothing on the
        // page reports: the tip shows, it lands where it should, and the reference points
        // at an element the screen reader never reaches.
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        await mount(`
            <ui-tooltip>
                <test-focuses-inside></test-focuses-inside>
                <span slot="tip">Saves.</span>
            </ui-tooltip>
        `);

        expect(warn).toHaveBeenCalledOnce();

        // Every claim the message makes, for the reason `icon.test.ts` gives beside its own
        // warning: naming the element without naming the way out leaves the reader where
        // they started, and a warning nobody can act on is noise.
        const message = String(warn.mock.calls[0]?.[0]);

        expect(message, 'names the trigger').toContain('<test-focuses-inside>');
        expect(message, 'says where the description got stranded').toContain('shadow root');
        expect(message, 'and why it cannot be reached').toContain(
            'an id in your tree cannot reach',
        );
        expect(message, 'and what a trigger has to be instead').toContain('a native <button>');
    });

    it('says nothing about a trigger in your own tree', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        await mount(fixture);

        expect(warn).not.toHaveBeenCalled();
    });

    it('hands the disconnect on to the base class, which a controller depends on', async () => {
        // Nothing in this element uses a reactive controller, so the super call reads as
        // free to drop — and dropping it breaks the contract every LitElement inherits, for
        // the host and for whatever this component grows next. `addController` is public,
        // so the contract is assertable without putting one in the component.
        const host = await mount(fixture);
        const element = only(host, 'ui-tooltip') as UiTooltip;
        let told = false;

        element.addController({
            hostDisconnected: () => {
                told = true;
            },
        });

        element.remove();

        expect(told, 'the base class was told').toBe(true);
    });

    it('says nothing about a shadow root that is only drawing', async () => {
        // The condition is the focusable descendant and not the boundary: an element whose
        // shadow content is decoration is named and described on the host itself, and is
        // correct as it stands.
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        await mount(`
            <ui-tooltip>
                <test-draws-inside tabindex="0"></test-draws-inside>
                <span slot="tip">Saves.</span>
            </ui-tooltip>
        `);

        expect(warn).not.toHaveBeenCalled();
    });
});

describe('when it shows', () => {
    it('shows on the pointer and hides when it leaves', async () => {
        const host = await mount(fixture);

        expect(tip(host).matches(':popover-open'), 'closed to begin with').toBe(false);

        await userEvent.hover(trigger(host));

        expect(tip(host).matches(':popover-open')).toBe(true);

        await userEvent.unhover(trigger(host));

        expect(tip(host).matches(':popover-open')).toBe(false);
    });

    it('shows on keyboard focus, which is the half a hover-only tooltip loses', async () => {
        const host = await mount(fixture);

        await userEvent.tab();

        expect(document.activeElement, 'tab reached the trigger').toBe(trigger(host));
        expect(tip(host).matches(':popover-open')).toBe(true);

        await userEvent.tab();

        expect(tip(host).matches(':popover-open'), 'and closes when focus leaves').toBe(false);
    });

    it('defers to focus on a touch screen, where there is no hover to answer', async () => {
        const host = await mount(fixture);

        trigger(host).dispatchEvent(
            new PointerEvent('pointerenter', { pointerType: 'touch', bubbles: false }),
        );
        only(host, 'ui-tooltip').dispatchEvent(
            new PointerEvent('pointerenter', { pointerType: 'touch' }),
        );

        expect(tip(host).matches(':popover-open')).toBe(false);
    });

    it('dismisses on Escape without moving the focus, which 1.4.13 asks for', async () => {
        const host = await mount(fixture);

        await userEvent.tab();

        expect(tip(host).matches(':popover-open')).toBe(true);

        await userEvent.keyboard('{Escape}');

        expect(tip(host).matches(':popover-open')).toBe(false);
        expect(document.activeElement, 'the focus stayed put').toBe(trigger(host));
    });

    it('ignores a key that is not Escape', async () => {
        const host = await mount(fixture);

        await userEvent.tab();
        await userEvent.keyboard('a');

        expect(tip(host).matches(':popover-open')).toBe(true);
    });

    it('stays open when the pointer travels onto the tip itself', async () => {
        // 1.4.13's second requirement: the tip is a DOM child of this element, so entering
        // it never leaves the host — which is what makes hoverable free rather than a
        // safe-area calculation.
        const host = await mount(fixture);

        await userEvent.hover(trigger(host));
        await painted();
        await userEvent.hover(tip(host));

        expect(tip(host).matches(':popover-open')).toBe(true);
    });

    it('opens once, however many times it is asked', async () => {
        // `showPopover()` on a popover that is already open throws, and it throws inside an
        // event listener where nothing would report it — so the guard is asserted through
        // the error it prevents rather than through a state nobody can see.
        const host = await mount(fixture);
        const thrown: string[] = [];
        const capture = (event: ErrorEvent): void => {
            thrown.push(event.message);
        };

        window.addEventListener('error', capture);

        try {
            await userEvent.hover(trigger(host));
            await userEvent.tab();
        } finally {
            window.removeEventListener('error', capture);
        }

        expect(thrown, 'the second request was refused rather than thrown').toEqual([]);
        expect(tip(host).matches(':popover-open')).toBe(true);

        await userEvent.keyboard('{Escape}');

        expect(tip(host).matches(':popover-open'), 'one dismissal is enough').toBe(false);
    });

    it('opens again after it has closed', async () => {
        const host = await mount(fixture);

        await userEvent.hover(trigger(host));
        await userEvent.unhover(trigger(host));

        expect(tip(host).matches(':popover-open'), 'closed').toBe(false);

        await userEvent.hover(trigger(host));

        expect(tip(host).matches(':popover-open'), 'and open again').toBe(true);
    });

    it('re-places when the window resizes, not only when something scrolls', async () => {
        const host = await mount(`<div id="mover">${fixture}</div>`);

        trigger(host).focus();
        await painted();

        const before = tip(host).style.insetBlockStart;

        // Padding rather than margin, and that is not a detail: an adjoining top margin
        // collapses into the wrapper's own, so the trigger would not have moved and the
        // test would have failed against working code.
        only(host, '#mover').style.paddingBlockStart = '40px';
        window.dispatchEvent(new Event('resize'));
        await painted();

        expect(tip(host).style.insetBlockStart).not.toBe(before);
    });

    it('stops following the trigger once it is closed', async () => {
        // The listeners are removed with the same options they were added with, which is
        // what makes the removal actually remove: a capturing listener taken off without
        // the flag stays on, and the tip would keep being placed while hidden.
        const host = await mount(`
            <div id="scroller" style="block-size: 80px; overflow: auto">
                <div style="block-size: 400px; padding-block-start: 40px">
                    <ui-tooltip>
                        <button type="button">Save</button>
                        <span slot="tip">Saves.</span>
                    </ui-tooltip>
                </div>
            </div>
        `);

        await userEvent.hover(trigger(host));
        await painted();
        await userEvent.unhover(trigger(host));

        const parked = tip(host).style.insetBlockStart;
        const scroller = only(host, '#scroller');
        const scrolled = new Promise((resolve) => {
            scroller.addEventListener('scroll', resolve, { once: true });
        });

        scroller.scrollTop = 30;
        await scrolled;
        await painted();

        window.dispatchEvent(new Event('resize'));
        await painted();

        expect(tip(host).style.insetBlockStart, 'nothing moved it').toBe(parked);
    });

    it('answers nothing once it has left the document', async () => {
        // The listeners come off with it. Left on, the first pointer or focus event to
        // reach a detached element would call `showPopover()` on a node that is not in a
        // document, which throws inside a listener where nothing would report it.
        const host = await mount(fixture);
        const element = only(host, 'ui-tooltip');
        const button = trigger(host);
        const shown = tip(host);
        const thrown: string[] = [];
        const capture = (event: ErrorEvent): void => {
            thrown.push(event.message);
        };

        await userEvent.hover(trigger(host));
        element.remove();
        window.addEventListener('error', capture);

        try {
            element.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
            element.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
            button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
            element.dispatchEvent(new PointerEvent('pointerleave'));
            element.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
            await painted();
        } finally {
            window.removeEventListener('error', capture);
        }

        expect(thrown).toEqual([]);
        expect(shown.matches(':popover-open')).toBe(false);
    });

    it('works again after a framework moves it in the tree', async () => {
        // Removal has to put the state back as well as take the listeners off. Left
        // thinking it is still shown, the tooltip refuses to open at its own guard — and
        // it refuses silently, which is the shape of every bug in this file worth having a
        // test for.
        const host = await mount(fixture);
        const element = only(host, 'ui-tooltip');
        const parent = element.parentElement;

        trigger(host).focus();

        expect(tip(host).matches(':popover-open'), 'open to begin with').toBe(true);

        element.remove();
        parent?.append(element);
        await (element as UiTooltip).updateComplete;
        trigger(host).focus();

        expect(tip(host).matches(':popover-open'), 'it opens again').toBe(true);
    });

    it('stops placing the moment it leaves the document, not when it is next asked', async () => {
        // The window listeners are what a removal has to take with it. Left on, they keep
        // calling the placement against a trigger that is no longer laid out — every rect
        // is zero — and the tip is dragged to the corner of a page it is not on. Read off
        // the written inset, because a detached element has no rendering to compare.
        const host = await mount(fixture);
        const element = only(host, 'ui-tooltip');

        // Shown by the pointer, and that is the half that needs the removal to act:
        // removing a *focused* element fires `focusout`, so the focus path already closes
        // itself and would have proved nothing. Measured, as a test that passed against a
        // `disconnectedCallback` with no body in it.
        await userEvent.hover(trigger(host));
        await painted();

        // Held before the removal takes it out of the fixture.
        const shown = tip(host);
        const placed = shown.style.insetBlockStart;

        expect(placed, 'it was placed to begin with').toMatch(/\d/);

        element.remove();
        window.dispatchEvent(new Event('resize'));
        await painted();

        expect(shown.style.insetBlockStart, 'nothing placed it again').toBe(placed);
    });

    it('closes without complaint when the pointer leaves after an Escape', async () => {
        // `hidePopover()` on a popover that is not showing throws, and leaving the trigger
        // after dismissing it is the ordinary way to arrive there.
        const host = await mount(fixture);
        const thrown: string[] = [];
        const capture = (event: ErrorEvent): void => {
            thrown.push(event.message);
        };

        await userEvent.hover(trigger(host));
        await userEvent.keyboard('{Escape}');
        window.addEventListener('error', capture);

        try {
            await userEvent.unhover(trigger(host));
            await painted();
        } finally {
            window.removeEventListener('error', capture);
        }

        expect(thrown, 'the second dismissal was refused rather than thrown').toEqual([]);
    });

    it('takes its listeners with it when it is removed mid-hover', async () => {
        const host = await mount(fixture);
        const element = only(host, 'ui-tooltip');

        await userEvent.hover(trigger(host));

        // Held before the removal takes it out of the fixture: what is asserted is the
        // state of the element that *was* shown, not the absence of a lookup.
        const shown = tip(host);
        const thrown: string[] = [];
        const capture = (event: ErrorEvent): void => {
            thrown.push(event.message);
        };

        window.addEventListener('error', capture);

        try {
            element.remove();
            window.dispatchEvent(new Event('resize'));
            await painted();
        } finally {
            window.removeEventListener('error', capture);
        }

        expect(thrown, 'nothing is still placing a detached element').toEqual([]);
        expect(shown.matches(':popover-open')).toBe(false);
    });
});

describe('the dismissal, which 1.4.13 asks to hold', () => {
    /** The trigger that hands focus on, with a tip about it. */
    const handing = `
        <ui-tooltip>
            <test-hands-focus-on>
                <button type="button" class="item">One</button>
            </test-hands-focus-on>
            <span slot="tip">Everything else lives here.</span>
        </ui-tooltip>
    `;

    /** The button inside the trigger's shadow root, which is where focus starts. */
    function own(host: ParentNode): HTMLElement {
        const root = only(host, 'test-hands-focus-on').shadowRoot;

        if (root === null) {
            throw new Error('the handing trigger has no shadow root');
        }

        return only(root, 'button.own');
    }

    it('does not close when focus moves to something it still contains', async () => {
        // Not *is it still open* — it is open either way, because the old code closed it and
        // reopened it on the same keystroke and the end state cannot tell the two apart.
        // What this asserts is that nothing happened at all: `beforetoggle` is dispatched
        // synchronously on each transition, so a hidden count of them is not available to
        // hide in.
        const host = await mount(handing);
        const transitions: string[] = [];

        own(host).focus();

        expect(tip(host).matches(':popover-open')).toBe(true);

        tip(host).addEventListener('beforetoggle', (event) => {
            transitions.push(event.newState);
        });

        only(host, 'button.item').focus();

        expect(
            transitions,
            'focus went from a shadow root to a slotted sibling, which is not leaving',
        ).toEqual([]);
        expect(tip(host).matches(':popover-open')).toBe(true);
    });

    it('stays dismissed when the trigger hands focus back to itself', async () => {
        // The failure this was written for: Escape shut the tip, the trigger restored focus
        // to its own button, and the tip came back in the same turn as the key. Hidden and
        // dismissed have to be two states for this to hold.
        const host = await mount(handing);

        only(host, 'button.item').focus();
        await userEvent.keyboard('{Escape}');

        expect(tip(host).matches(':popover-open')).toBe(false);

        own(host).focus();

        expect(tip(host).matches(':popover-open'), 'a dismissal is not undone by focus').toBe(
            false,
        );
    });

    it('shows again once the reader has left and come back', async () => {
        // The other half: dismissed until the trigger is left, and no longer than that.
        const host = await mount(handing);
        const elsewhere = document.createElement('button');

        document.body.append(elsewhere);

        own(host).focus();
        await userEvent.keyboard('{Escape}');
        elsewhere.focus();
        own(host).focus();

        expect(tip(host).matches(':popover-open')).toBe(true);
    });

    it('closes when focus goes nowhere at all', async () => {
        // `relatedTarget` is null when nothing receives the focus, which is a departure and
        // the branch a leave to another element does not reach.
        const host = await mount(handing);

        own(host).focus();

        expect(tip(host).matches(':popover-open')).toBe(true);

        own(host).blur();

        expect(tip(host).matches(':popover-open')).toBe(false);
    });

    it('claims the Escape it acted on, so the modal around it stays open', async () => {
        // A native `<dialog>`, because what is at stake is the platform's close request —
        // `<ui-dialog>` delegates to exactly this and would only put a component in front
        // of the mechanism under test. Unclaimed, one press shut the tip and closed the
        // dialog together, and 1.4.13 wants a dismissal that does not move focus.
        const host = await mount(`<dialog>${handing}</dialog>`);
        const modal = only(host, 'dialog') as HTMLDialogElement;

        modal.showModal();
        own(host).focus();

        expect(tip(host).matches(':popover-open')).toBe(true);

        await userEvent.keyboard('{Escape}');

        expect(tip(host).matches(':popover-open')).toBe(false);
        expect(modal.open, 'the key stopped at the topmost thing').toBe(true);

        modal.close();
    });

    it('leaves an Escape alone when it has no tip open', async () => {
        // The other side of the same claim, and what keeps it from being a key this element
        // simply swallows: the listener exists only while the tip does.
        const host = await mount(`<dialog><button type="button">x</button>${handing}</dialog>`);
        const modal = only(host, 'dialog') as HTMLDialogElement;

        modal.showModal();
        only(host, 'dialog > button').focus();

        expect(tip(host).matches(':popover-open')).toBe(false);

        await userEvent.keyboard('{Escape}');

        expect(modal.open, 'nothing was dismissed, so the modal answered').toBe(false);
    });
});

describe('where it lands', () => {
    it('sits above the trigger, centred on it', async () => {
        // Centred in the page on purpose: a trigger near an edge is clamped instead, which
        // is the case two tests below rather than a wrinkle in this one.
        const host = await mount(
            `<div style="display: flex; justify-content: center">${fixture}</div>`,
        );

        await userEvent.hover(trigger(host));
        await painted();

        const anchor = trigger(host).getBoundingClientRect();
        const box = tip(host).getBoundingClientRect();

        expect(box.bottom, 'above, with the gap the token sets').toBeLessThan(anchor.top);
        expect(anchor.top - box.bottom).toBeGreaterThan(0);
        expect((box.left + box.right) / 2).toBeCloseTo((anchor.left + anchor.right) / 2, 0);
        expect(tip(host).getAttribute('data-side')).toBe('block-start');
    });

    it('goes above when the room is exactly enough, which is where the boundary sits', async () => {
        // The comparison is `>=`, and this is the input that tells it from `>`: a tip whose
        // height is exactly the room above it fits, flush against the trigger.
        const host = await mount(
            `
            <div style="position: absolute; inset-block-start: 32px">
                <ui-tooltip>
                    <button type="button">Save</button>
                    <span slot="tip" style="block-size: 32px; box-sizing: border-box">Saves.</span>
                </ui-tooltip>
            </div>
        `,
            '0px',
        );

        await userEvent.hover(trigger(host));
        await painted();

        expect(trigger(host).getBoundingClientRect().top, 'the room is the tip height').toBe(32);
        expect(tip(host).getBoundingClientRect().height).toBe(32);
        expect(tip(host).getAttribute('data-side')).toBe('block-start');
    });

    it('flips below when there is no room above', async () => {
        const host = await mount(fixture, '0px');

        await userEvent.hover(trigger(host));
        await painted();

        const anchor = trigger(host).getBoundingClientRect();
        const box = tip(host).getBoundingClientRect();

        expect(box.top).toBeGreaterThan(anchor.bottom);
        expect(tip(host).getAttribute('data-side')).toBe('block-end');
    });

    it('styles the gap from the side it wrote, so the two cannot disagree', async () => {
        const host = await mount(fixture);

        await userEvent.hover(trigger(host));

        const written = tip(host)
            .getAttributeNames()
            .find((name) => name.startsWith('data-'));

        expect(written, 'the script wrote a side').toMatch(/\S/);
        expect(styleText(), 'and the sheet reads that same name').toContain(`[${String(written)}=`);
    });

    it('stays inside the viewport at the leading edge', async () => {
        const host = await mount(`
            <div style="position: absolute; inset-inline-start: 0">
                <ui-tooltip>
                    <button type="button">S</button>
                    <span slot="tip">A description long enough to run off the edge on its own.</span>
                </ui-tooltip>
            </div>
        `);

        await userEvent.hover(trigger(host));
        await painted();

        expect(tip(host).getBoundingClientRect().left).toBeGreaterThanOrEqual(0);
    });

    it('stays inside the viewport at the trailing edge', async () => {
        const host = await mount(`
            <div style="position: absolute; inset-inline-end: 0">
                <ui-tooltip>
                    <button type="button">S</button>
                    <span slot="tip">A description long enough to run off the edge on its own.</span>
                </ui-tooltip>
            </div>
        `);

        await userEvent.hover(trigger(host));
        await painted();

        const box = tip(host).getBoundingClientRect();

        expect(box.right).toBeLessThanOrEqual(document.documentElement.clientWidth + 1);
    });

    it('follows the trigger when an ancestor scrolls, not only the window', async () => {
        const host = await mount(`
            <div id="scroller" style="block-size: 80px; overflow: auto">
                <div style="block-size: 400px; padding-block-start: 40px">
                    <ui-tooltip>
                        <button type="button">Save</button>
                        <span slot="tip">Saves.</span>
                    </ui-tooltip>
                </div>
            </div>
        `);

        // Shown by focus rather than by the pointer, and that is the test learning
        // something: scrolling moves the trigger out from under the pointer, the browser
        // dispatches the boundary event that follows, and the tip closes before the
        // placement it was supposed to be running. Measured — the first version of this
        // test passed against a *closed* tip, because a hidden popover has a rect of zero
        // and zero is not where it was.
        trigger(host).focus();
        await painted();

        // The written inset rather than the measured rect: what is under test is that the
        // placement ran again, and a rect can move for reasons that are not this component.
        const before = tip(host).style.insetBlockStart;

        expect(before, 'it was placed to begin with').toMatch(/\d/);

        const scroller = only(host, '#scroller');
        const scrolled = new Promise((resolve) => {
            scroller.addEventListener('scroll', resolve, { once: true });
        });

        scroller.scrollTop = 30;
        await scrolled;
        await painted();

        const anchor = trigger(host).getBoundingClientRect();
        const box = tip(host).getBoundingClientRect();

        expect(tip(host).style.insetBlockStart, 'it was placed again').not.toBe(before);
        expect(box.bottom, 'and it is still against the trigger').toBeLessThan(anchor.top);
    });

    it('places nothing once the tip is gone, rather than throwing at a scroll', async () => {
        // Reachable, and only from here: `#show` refuses to open without a tip, so the
        // guard inside the placement is for the window that opens when a framework
        // re-renders the tip away while it is on screen and something then scrolls.
        const host = await mount(fixture);

        await userEvent.hover(trigger(host));
        await painted();

        const thrown: string[] = [];
        const capture = (event: ErrorEvent): void => {
            thrown.push(event.message);
        };

        window.addEventListener('error', capture);

        try {
            tip(host).remove();
            window.dispatchEvent(new Event('resize'));
            await painted();
        } finally {
            window.removeEventListener('error', capture);
        }

        expect(thrown).toEqual([]);
    });

    it('places nothing once the trigger is gone either', async () => {
        const host = await mount(fixture);

        await userEvent.hover(trigger(host));
        await painted();

        const thrown: string[] = [];
        const capture = (event: ErrorEvent): void => {
            thrown.push(event.message);
        };

        window.addEventListener('error', capture);

        try {
            trigger(host).remove();
            window.dispatchEvent(new Event('resize'));
            await painted();
        } finally {
            window.removeEventListener('error', capture);
        }

        expect(thrown).toEqual([]);
    });

    it('escapes an ancestor that clips, because the platform lifts it out', async () => {
        const host = await mount(`
            <div style="overflow: hidden; block-size: 24px; inline-size: 40px">
                <ui-tooltip>
                    <button type="button">Save</button>
                    <span slot="tip">Saves without closing the dialog.</span>
                </ui-tooltip>
            </div>
        `);

        await userEvent.hover(trigger(host));
        await painted();

        expect(
            tip(host).getBoundingClientRect().width,
            'wider than the box that clips',
        ).toBeGreaterThan(40);
    });
});

describe('the drawing', () => {
    it('is a small raised surface, drawn from the token layer', async () => {
        const host = await mount(fixture);

        await userEvent.hover(trigger(host));

        const styles = getComputedStyle(tip(host));

        expect(styles.position).toBe('fixed');
        expect(styles.margin).toBe('0px');
        expect(styles.backgroundColor).toBe('rgb(255, 255, 255)');
        expect(styles.color).toBe('rgb(31, 41, 55)');
        expect(styles.borderTopWidth).toBe('1px');
        expect(styles.borderRadius).toBe('6px');
        expect(styles.padding).toBe('4px 8px');
        expect(styles.fontFamily).toContain('system-ui');
        expect(styles.boxShadow, 'the category ui-card brought').toMatch(/rgba?\(/);
    });

    it('keeps a phrase on one line up to a ceiling, rather than to whatever it sits near', async () => {
        const host = await mount(fixture);

        await userEvent.hover(trigger(host));

        expect(getComputedStyle(tip(host)).maxInlineSize).toBe('320px');
    });

    it('takes every value it paints with from the host', async () => {
        const host = await mount(fixture);
        const element = only(host, 'ui-tooltip');

        element.style.setProperty('--ui-color-surface', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-color-border', 'rgb(4, 5, 6)');
        element.style.setProperty('--ui-radius', '11px');
        element.style.setProperty('--ui-space', '10px');
        element.style.setProperty('--ui-text-supporting', '21px');

        await userEvent.hover(trigger(host));

        const styles = getComputedStyle(tip(host));

        expect(styles.backgroundColor).toBe('rgb(1, 2, 3)');
        // A tip is supporting text, and shipped as a hardcoded `0.875em` until the type
        // scale arrived to replace it — three hardcoded sizes across the package, all
        // agreeing and none of them read back by anything.
        expect(styles.fontSize).toBe('21px');
        expect(styles.borderTopColor).toBe('rgb(4, 5, 6)');
        expect(styles.borderRadius).toBe('11px');
        expect(styles.padding).toBe('5px 10px');
        expect(styles.maxInlineSize).toBe('400px');
    });
});

/**
 * The paths whose failure is a throw rather than a wrong answer.
 *
 * Each of these guards a state the element can legitimately reach — a trigger the registry
 * will never define, a second pointer enter, a leave with nothing open, a tip a framework
 * removed while it was on screen. Remove any of those guards and the platform throws, in a
 * listener, where no assertion in this file was looking. `escaped` above is what looks.
 */
describe('the paths that must not throw', () => {
    it('answers a hyphenless trigger without asking the registry about it', async () => {
        // Two guards at once, and both were ungraded. `whenDefined` rejects on a name
        // that could never be a custom element, so the hyphen test has to answer
        // `<button>` before the registry is asked — and `#complain` then reads a `shadowRoot` that a
        // native control does not have.
        const thrown = await escaped(async () => {
            await mount(fixture);
        });

        expect(thrown).toEqual([]);
    });

    it('shows once, so a second pointer enter is a return rather than a throw', async () => {
        const host = await mount(fixture);

        const thrown = await escaped(async () => {
            // Twice, because the guard is what the second one meets. Dispatched at the
            // element rather than at the trigger: `pointerenter` does not bubble, and the
            // listeners are this element's own.
            for (const round of ['first', 'second']) {
                only(host, 'ui-tooltip').dispatchEvent(new PointerEvent('pointerenter'));
                await painted();

                expect(tip(host).matches(':popover-open'), round).toBe(true);
            }
        });

        // `showPopover()` on a popover that is already open throws `InvalidStateError`, so
        // the guard is what keeps a repeated enter from being an error rather than a no-op.
        expect(thrown).toEqual([]);
        expect(tip(host).matches(':popover-open'), 'and it is open once').toBe(true);
    });

    it('hides once, so a leave with nothing open is a return rather than a throw', async () => {
        const host = await mount(fixture);

        const thrown = await escaped(() => {
            only(host, 'ui-tooltip').dispatchEvent(new PointerEvent('pointerleave'));
        });

        // `hidePopover()` on a popover that is not showing throws the same way.
        expect(thrown).toEqual([]);
        expect(tip(host).matches(':popover-open')).toBe(false);
    });

    it('leaves without throwing when the tip was taken away while it was open', async () => {
        // The window a framework opens by re-rendering the tip away mid-hover, which the
        // placement tests below already cover for a scroll and nobody covered for a leave.
        const host = await mount(fixture);

        await userEvent.hover(trigger(host));
        await painted();

        const thrown = await escaped(() => {
            tip(host).remove();
            only(host, 'ui-tooltip').dispatchEvent(new PointerEvent('pointerleave'));
        });

        expect(thrown).toEqual([]);
    });
});

/**
 * The stories are the playground, and mounting them here is what puts it behind the gate.
 * `expectAccessible` is called per story: a tooltip on a form control and one at the edge
 * of the viewport are different markup, and each can fail on its own.
 */
describe('accessibility', () => {
    it('has no violations on a button', async () => {
        await expectAccessible(await mountStory(Tooltip, meta, 'Tooltip'));
    });

    it('has no violations on a field control', async () => {
        await expectAccessible(await mountStory(OnAControlYouWrote, meta, 'OnAControlYouWrote'));
    });

    it('has no violations at the edge of the viewport', async () => {
        await expectAccessible(await mountStory(AtTheEdge, meta, 'AtTheEdge'));
    });

    it('has no violations inside something that clips', async () => {
        await expectAccessible(await mountStory(Inside, meta, 'Inside'));
    });
});

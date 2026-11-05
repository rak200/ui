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
import { glass, matrix, themeStyleSheet } from '../src/theme.js';
import { tokenStyleSheet } from '../src/tokens.js';

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
 * **Every capture in this file goes through here**, so each one watches both channels and
 * waits the turn a rejection needs. Six tests captured `error` inline before this existed,
 * and none of them was watching the second.
 */
async function escaped(run: () => Promise<void> | void): Promise<string[]> {
    const thrown: string[] = [];

    const caught = (event: ErrorEvent): void => {
        thrown.push(event.message);
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

    // **Attaching is the whole of the handling.** Vitest's browser runner reports a window
    // error as unhandled only while the page has no listener of its own for that event, so
    // for as long as these two are attached what escapes is this helper's to judge — and the
    // assertion on what it returns is what turns a throw into a failure. Nothing has to be
    // cancelled: measured, as this element's 228 mutants graded with none of them erroring
    // and no `preventDefault()` anywhere in the capture.
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
        // is then an error with no failed test beside it, which is exactly the run the
        // mutation runner leaves out of the score.
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
        const thrown = await escaped(async () => {
            await userEvent.hover(trigger(host));
            await userEvent.tab();
        });

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

    it('reads its side again when the window resizes, not only when something scrolls', async () => {
        const host = await mount(
            `<div id="mover" style="padding-block-start: 60px">${fixture}</div>`,
            '0px',
        );

        trigger(host).focus();
        await painted();

        expect(tip(host).getAttribute('data-side'), 'above, with room for it').toBe('block-start');

        // Taken to the top, where the tip has no room above: the platform flips it as the page
        // lays out, and the resize is what reads the side it took. Padding rather than margin,
        // since an adjoining top margin collapses into the wrapper's own and moves nothing.
        only(host, '#mover').style.paddingBlockStart = '0px';
        window.dispatchEvent(new Event('resize'));
        await painted();

        expect(tip(host).getAttribute('data-side')).toBe('block-end');
    });
    it('stops following the trigger once it is closed', async () => {
        // The listeners are removed with the same options they were added with, which is
        // what makes the removal actually remove: a capturing listener taken off without
        // the flag stays on. A closed tip measures nothing at the origin, whose middle is above
        // any trigger's, so a listener left on would read the tip below as above.
        const host = await mount(
            `
            <div id="scroller" style="block-size: 80px; overflow: auto">
                <div style="block-size: 400px">
                    <ui-tooltip>
                        <button type="button">Save</button>
                        <span slot="tip">Saves.</span>
                    </ui-tooltip>
                </div>
            </div>
        `,
            '0px',
        );

        await userEvent.hover(trigger(host));
        await painted();

        expect(tip(host).getAttribute('data-side'), 'below, at the top').toBe('block-end');

        await userEvent.unhover(trigger(host));

        const scroller = only(host, '#scroller');
        const scrolled = new Promise((resolve) => {
            scroller.addEventListener('scroll', resolve, { once: true });
        });

        scroller.scrollTop = 30;
        await scrolled;
        await painted();

        window.dispatchEvent(new Event('resize'));
        await painted();

        expect(tip(host).getAttribute('data-side'), 'nothing read it').toBe('block-end');
    });
    it('answers nothing once it has left the document', async () => {
        // The listeners come off with it. Left on, the first pointer or focus event to
        // reach a detached element would call `showPopover()` on a node that is not in a
        // document, which throws inside a listener where nothing would report it.
        const host = await mount(fixture);
        const element = only(host, 'ui-tooltip');
        const button = trigger(host);
        const shown = tip(host);

        await userEvent.hover(trigger(host));
        element.remove();

        const thrown = await escaped(async () => {
            element.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
            element.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
            button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
            element.dispatchEvent(new PointerEvent('pointerleave'));
            element.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
            await painted();
        });

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

    it('stops reading its side the moment it leaves the document, not when it is next asked', async () => {
        // The listeners come off with it. Left on, a resize would read a trigger and a tip
        // that are no longer laid out — every box is nothing at the origin, whose two middles
        // are level, which reads as below — and write it on a tip the reader saw above.
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

        expect(shown.getAttribute('data-side'), 'above to begin with').toBe('block-start');

        element.remove();
        window.dispatchEvent(new Event('resize'));
        await painted();

        expect(shown.getAttribute('data-side'), 'nothing read it again').toBe('block-start');
    });
    it('closes without complaint when the pointer leaves after an Escape', async () => {
        // `hidePopover()` on a popover that is not showing throws, and leaving the trigger
        // after dismissing it is the ordinary way to arrive there.
        const host = await mount(fixture);

        await userEvent.hover(trigger(host));
        await userEvent.keyboard('{Escape}');

        const thrown = await escaped(async () => {
            await userEvent.unhover(trigger(host));
            await painted();
        });

        expect(thrown, 'the second dismissal was refused rather than thrown').toEqual([]);
    });

    it('takes its listeners with it when it is removed mid-hover', async () => {
        const host = await mount(fixture);
        const element = only(host, 'ui-tooltip');

        await userEvent.hover(trigger(host));

        // Held before the removal takes it out of the fixture: what is asserted is the
        // state of the element that *was* shown, not the absence of a lookup.
        const shown = tip(host);
        const thrown = await escaped(async () => {
            element.remove();
            window.dispatchEvent(new Event('resize'));
            await painted();
        });

        expect(thrown, 'nothing is still placing a detached element').toEqual([]);
        expect(shown.matches(':popover-open')).toBe(false);
    });
});

/** The transitions the tip runs, sorted by the property each moves. */
function moving(host: ParentNode): CSSTransition[] {
    return tip(host)
        .getAnimations()
        .filter((each): each is CSSTransition => each instanceof CSSTransition)
        .sort((one, other) => one.transitionProperty.localeCompare(other.transitionProperty));
}

/** Holds every transition the tip runs at `time`. */
function held(host: ParentNode, time: number): void {
    for (const each of moving(host)) {
        each.pause();
        each.currentTime = time;
    }
}

/** The fixture's tooltip, with `style` written on it: the choices and tokens a test hands it. */
async function chosen(style: string): Promise<HTMLElement> {
    const host = await mount(fixture);
    only(host, 'ui-tooltip').style.cssText = style;

    return host;
}

// The pointer leaves by `parkPointer()` rather than `unhover()`, which scrolled the page under the
// tip and moved what its placement reads.
describe("the tip's motion, RFC 0004's", () => {
    it('tells the tip which side of it its trigger is on', async () => {
        // The one below first, so it is at the top of the page, with no room above its trigger.
        const below = await mount(fixture, '0px');
        const above = await mount(fixture);

        await userEvent.hover(trigger(above));
        await painted();

        const upper = getComputedStyle(tip(above)).getPropertyValue('--ui-fx-toward');

        await parkPointer();
        await userEvent.hover(trigger(below));
        await painted();

        expect([upper, getComputedStyle(tip(below)).getPropertyValue('--ui-fx-toward')]).toEqual([
            '1',
            '-1',
        ]);
    });

    it("rises toward where it sits as it shows, over the overlay's step on the entrance's curve", async () => {
        const host = await chosen(
            '--ui-motion-enter: rise; --ui-duration-overlay: 7s; --ui-easing-enter: steps(3)',
        );

        await userEvent.hover(trigger(host));

        expect(
            moving(host).map((each) => {
                const timing = each.effect?.getTiming();

                return [each.transitionProperty, timing?.duration, timing?.easing];
            }),
        ).toEqual([
            ['opacity', 7000, 'steps(3)'],
            ['transform', 7000, 'steps(3)'],
        ]);

        held(host, 0);

        expect([
            getComputedStyle(tip(host)).opacity,
            getComputedStyle(tip(host)).transform,
        ]).toEqual(['0', 'matrix(1, 0, 0, 1, 0, 4)']);
    });

    it('comes into focus as it shows, over five quarters of the step, whole by half the way', async () => {
        const host = await chosen(
            '--ui-motion-enter: refocus; --ui-duration-overlay: 8s; --ui-easing-enter: steps(2)',
        );

        await userEvent.hover(trigger(host));

        expect(
            moving(host).map((each) => {
                const timing = each.effect?.getTiming();

                return [each.transitionProperty, timing?.duration, timing?.easing];
            }),
        ).toEqual([
            ['filter', 10000, 'steps(2)'],
            ['opacity', 5000, 'steps(2)'],
        ]);

        held(host, 0);

        expect([getComputedStyle(tip(host)).filter, getComputedStyle(tip(host)).opacity]).toEqual([
            'blur(8px)',
            '0',
        ]);
    });

    it("sinks back toward its trigger as it goes, held on the page over the overlay's step", async () => {
        const host = await chosen(
            '--ui-motion-exit: sink; --ui-duration-overlay: 6s; --ui-easing-exit: steps(4)',
        );
        await userEvent.hover(trigger(host));

        await parkPointer();

        expect(tip(host).matches(':popover-open'), 'closed').toBe(false);
        expect(getComputedStyle(tip(host)).display, 'and still on the page').not.toBe('none');
        expect(
            moving(host).map((each) => {
                const timing = each.effect?.getTiming();

                return [each.transitionProperty, timing?.duration, timing?.easing];
            }),
        ).toEqual([
            ['display', 6000, 'ease'],
            ['opacity', 6000, 'steps(4)'],
            ['overlay', 6000, 'ease'],
            ['transform', 6000, 'steps(4)'],
        ]);

        // Half way, on four steps: half gone and half way back. At its end the tip is off the page,
        // where no box is left to read a transform off.
        held(host, 3000);

        expect([
            getComputedStyle(tip(host)).opacity,
            getComputedStyle(tip(host)).transform,
        ]).toEqual(['0.5', 'matrix(1, 0, 0, 1, 0, 2)']);
    });

    it('goes out of focus as it leaves, gone over the second half', async () => {
        const host = await chosen(
            '--ui-motion-exit: defocus; --ui-duration-overlay: 8s; --ui-easing-exit: steps(5)',
        );
        await userEvent.hover(trigger(host));

        await parkPointer();

        expect(
            moving(host).map((each) => {
                const timing = each.effect?.getTiming();

                return [each.transitionProperty, timing?.duration, timing?.delay, timing?.easing];
            }),
        ).toEqual([
            ['display', 10000, 0, 'ease'],
            ['filter', 10000, 0, 'steps(5)'],
            ['opacity', 5000, 5000, 'steps(5)'],
            ['overlay', 10000, 0, 'ease'],
        ]);

        held(host, 10000);

        expect([getComputedStyle(tip(host)).filter, getComputedStyle(tip(host)).opacity]).toEqual([
            'blur(8px)',
            '0',
        ]);
    });

    it.each([
        ['nothing is chosen', ''],
        ['none is', '--ui-motion-enter: none; --ui-motion-exit: none'],
    ])('shows and goes at once where %s', async (_name, style) => {
        const host = await chosen(style);

        await userEvent.hover(trigger(host));

        expect(moving(host), 'showing').toEqual([]);

        await parkPointer();

        expect([moving(host), getComputedStyle(tip(host)).display], 'gone').toEqual([[], 'none']);
    });

    it('lands where it would without motion, and reads the same side, whatever its entrance moves', async () => {
        const still = await mount(fixture);
        await userEvent.hover(trigger(still));
        await painted();

        const placed = tip(still).getBoundingClientRect();

        await parkPointer();
        only(still, 'ui-tooltip').style.setProperty('--ui-motion-enter', 'rise');
        await userEvent.hover(trigger(still));

        expect(tip(still).getAttribute('data-side'), 'read as it shows').toBe('block-start');

        for (const each of tip(still).getAnimations()) {
            each.finish();
        }

        await painted();

        const moved = tip(still).getBoundingClientRect();

        expect([moved.top, moved.left]).toEqual([placed.top, placed.left]);
    });
    it.each([
        ['the default theme', '', '', ['opacity', 'transform']],
        ['Glass', themeStyleSheet(glass), 'glass', ['filter', 'opacity']],
    ] as const)(
        "takes its entrance and its exit from %s's taste",
        async (_name, sheet, theme, moved) => {
            const style = document.createElement('style');
            style.textContent = tokenStyleSheet() + sheet;
            document.body.append(style);
            // Slowed, so every transition is still running when it is read, however long the pointer
            // takes to arrive.
            const host = await mount(
                `<div data-ui-theme="${theme}" style="--ui-duration-overlay: 10s">${fixture}</div>`,
            );

            await userEvent.hover(trigger(host));

            expect(
                moving(host).map((each) => each.transitionProperty),
                'coming',
            ).toEqual(moved);

            // Arrived: a tip left as it starts to come is where its exit goes already.
            for (const each of moving(host)) {
                each.finish();
            }

            await parkPointer();

            expect(
                moving(host).map((each) => each.transitionProperty),
                'going',
            ).toEqual(['display', ...moved, 'overlay'].sort());
        },
    );
});

/** The tip's text each of the typing's highlights draws now. */
function drawn(name: string): string[] {
    return [...(CSS.highlights.get(name) ?? [])].map((range) => (range as Range).toString());
}

describe("Matrix's tip, RFC 0004's", () => {
    it.each([
        [
            'where it is chosen',
            '--ui-motion-enter: typing; --ui-duration-overlay: 0.5s',
            'typing',
            '0.5s',
        ],
        ['nowhere else', '', 'none', ''],
    ] as const)('hands its tip the typing %s', async (_name, style, effect, time) => {
        const host = await chosen(style);
        const handed = getComputedStyle(tip(host));

        expect([
            handed.getPropertyValue('--ui-fx-enter'),
            handed.getPropertyValue('--ui-fx-enter-time'),
        ]).toEqual([effect, time]);
    });

    it('hands its tip none of what a surface round the tooltip was handed', async () => {
        const host = await mount(`<div style="--ui-fx-enter: materialize">${fixture}</div>`);

        expect(getComputedStyle(tip(host)).getPropertyValue('--ui-fx-enter')).toBe('none');
    });

    it('types its tip out as it shows, and stops where it got to as it goes', async () => {
        const host = await chosen('--ui-motion-enter: typing; --ui-duration-overlay: 0.5s');
        const errors = await escaped(async () => {
            await userEvent.hover(trigger(host));

            const typing = tip(host)
                .getAnimations()
                .find((each) => each.id === 'ui-typing');

            // A character every tenth of the overlay's half second, for each of the 33.
            expect(typing?.effect?.getTiming().duration).toBe(33 * 50);

            typing?.pause();

            if (typing !== undefined) {
                typing.currentTime = 50 * 6.5;
            }

            await painted();

            expect([drawn('ui-caret'), drawn('ui-untyped')]).toEqual([
                ['w'],
                ['ithout closing the dialog.'],
            ]);

            await parkPointer();
            await painted();

            expect(
                tip(host)
                    .getAnimations()
                    .some((each) => each.id === 'ui-typing'),
                'stopped',
            ).toBe(false);
            expect(drawn('ui-caret'), 'where it got to').toEqual(['w']);
        });

        expect(errors).toEqual([]);
    });

    it('types a tip shown again from its first character once it has gone', async () => {
        const host = await chosen('--ui-motion-enter: typing; --ui-duration-overlay: 50s');
        const errors = await escaped(async () => {
            await userEvent.hover(trigger(host));

            const first = tip(host)
                .getAnimations()
                .find((each) => each.id === 'ui-typing');

            first?.pause();

            if (first !== undefined) {
                first.currentTime = 5000 * 6.5;
            }

            // Gone at once, with no exit chosen, and pointed at again.
            await parkPointer();
            await userEvent.hover(trigger(host));

            expect(
                tip(host)
                    .getAnimations()
                    .find((each) => each.id === 'ui-typing')?.currentTime,
                // Started over: inside its first character, which takes five seconds here, where
                // going on would have stood six and a half characters in.
            ).toBeLessThan(5000);
        });

        expect(errors).toEqual([]);
    });

    it.each([
        [0.25, 'matrix(1, 0, 0, 1, 2, 0)', 'inset(20% -48px 25%)', '1', '1px', '-1px'],
        [0.45, 'matrix(1, 0, 0, 1, -3, 0)', 'inset(40% -48px 0%)', '0.5', '-2px', '2px'],
        [0.65, 'matrix(1, 0, 0, 1, 3, 0)', 'inset(0px -48px 55%)', '1', '2px', '-2px'],
        [0.85, 'matrix(1, 0, 0, 1, 3, 0)', 'inset(0px -48px 55%)', '0', '2px', '-2px'],
    ] as const)(
        'flickers its tip out in bands, its text split, held at %s of the way',
        async (fraction, transform, clip, opacity, red, blue) => {
            const host = await chosen(
                '--ui-motion-exit: glitch; --ui-duration-overlay: 6s; --ui-color-danger: rgb(200, 0, 0); --ui-color-info: rgb(0, 0, 200)',
            );
            await userEvent.hover(trigger(host));

            await parkPointer();

            const flicker = tip(host)
                .getAnimations()
                .find((each): each is CSSAnimation => each instanceof CSSAnimation);
            const timing = flicker?.effect?.getTiming();

            expect([flicker?.animationName, timing?.duration, timing?.fill]).toEqual([
                'ui-tip-glitch-out',
                6000,
                'forwards',
            ]);
            expect(getComputedStyle(tip(host)).animationTimingFunction).toBe('steps(1)');
            expect(moving(host).map((each) => each.transitionProperty)).toEqual([
                'display',
                'overlay',
            ]);

            flicker?.pause();

            if (flicker !== undefined) {
                flicker.currentTime = 6000 * fraction;
            }

            const style = getComputedStyle(tip(host));

            expect([style.transform, style.clipPath, style.opacity, style.textShadow]).toEqual([
                transform,
                clip,
                opacity,
                `rgb(200, 0, 0) ${red} 0px 0px, rgb(0, 0, 200) ${blue} 0px 0px`,
            ]);
        },
    );

    it("types its tip in and flickers it out under Matrix's taste", async () => {
        const style = document.createElement('style');
        style.textContent = tokenStyleSheet() + themeStyleSheet(matrix);
        document.body.append(style);
        const host = await mount(
            `<div data-ui-theme="matrix" style="--ui-duration-overlay: 10s">${fixture}</div>`,
        );
        const errors = await escaped(async () => {
            await userEvent.hover(trigger(host));

            expect(
                tip(host)
                    .getAnimations()
                    .some((each) => each.id === 'ui-typing'),
                'typed',
            ).toBe(true);

            await parkPointer();

            expect(getComputedStyle(tip(host)).animationName, 'flickered out').toBe(
                'ui-tip-glitch-out',
            );
        });

        expect(errors).toEqual([]);
    });
});

describe("the next tip, RFC 0004's", () => {
    it.each([
        ['nothing where nothing is chosen', '', ['none', '0ms', 'linear']],
        [
            'the glide where it is chosen',
            '--ui-motion-next: glide; --ui-duration-overlay: 0.5s; --ui-easing-move: steps(3)',
            ['glide', '0.5s', 'steps(3)'],
        ],
    ] as const)('hands its tip %s', async (_name, style, values) => {
        const host = await chosen(style);
        const handed = getComputedStyle(tip(host));

        expect(
            ['', '-time', '-curve'].map((part) => handed.getPropertyValue(`--ui-fx-next${part}`)),
        ).toEqual(values);
    });

    it('glides the tip pointed at next over from the one the pointer left', async () => {
        const host = await mount(`
            <div style="display: flex; gap: 120px; --ui-motion-next: glide; --ui-duration-overlay: 10s">
                <ui-tooltip>
                    <button type="button">Save</button>
                    <span slot="tip">Saves without closing the dialog.</span>
                </ui-tooltip>
                <ui-tooltip>
                    <button type="button">Discard</button>
                    <span slot="tip">Throws the draft away.</span>
                </ui-tooltip>
            </div>
        `);
        const [save, discard] = host.querySelectorAll('button');
        const [first, second] = host.querySelectorAll<HTMLElement>('[slot=tip]');
        // One instant for both, so the second opens well inside the window whatever the pointer
        // takes to cross.
        vi.spyOn(performance, 'now').mockReturnValue(1000);

        const errors = await escaped(async () => {
            if (save !== undefined && discard !== undefined) {
                await userEvent.hover(save);
                await userEvent.hover(discard);
            }
        });
        const glides = second
            ?.getAnimations()
            .filter((each) => (each.effect as KeyframeEffect).composite === 'add');

        expect(errors).toEqual([]);
        expect(glides?.map((each) => each.effect?.getTiming().duration)).toEqual([10000]);
        expect(first?.getAnimations().filter((each) => each.playState === 'running')).toEqual([]);
    });

    it("glides under the default theme's taste", async () => {
        const style = document.createElement('style');
        style.textContent = tokenStyleSheet();
        document.body.append(style);
        const host = await mount(fixture);

        expect(getComputedStyle(tip(host)).getPropertyValue('--ui-fx-next')).toBe('glide');
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

    it("hangs from its trigger's leading edge in a right-to-left part of a left-to-right page", async () => {
        // An island: Firefox mirrors a centred tip there, and put it off the screen in every
        // form measured — Mozilla 2019601 — so the tip hangs from its trigger's leading edge.
        const host = await mount(
            `<div dir="rtl" style="padding-inline-start: 150px">${fixture}</div>`,
        );

        await userEvent.hover(trigger(host));
        await painted();

        const anchor = trigger(host).getBoundingClientRect();
        const box = tip(host).getBoundingClientRect();

        expect(only(host, 'ui-tooltip').matches(':state(island)'), 'an island').toBe(true);
        expect(box.bottom).toBeLessThan(anchor.top);
        expect(box.right).toBeCloseTo(anchor.right, 0);
    });

    it("turns to its trigger's other edge in an island, where the leading one runs off the screen", async () => {
        const host = await mount(`<div dir="rtl" style="text-align: left">
            <ui-tooltip>
                <button type="button">S</button>
                <span slot="tip">A description long enough to run off the edge on its own.</span>
            </ui-tooltip>
        </div>`);

        await userEvent.hover(trigger(host));
        await painted();

        const anchor = trigger(host).getBoundingClientRect();
        const box = tip(host).getBoundingClientRect();

        expect(box.left, 'inside the screen').toBeGreaterThanOrEqual(0);
        expect(box.left).toBeCloseTo(anchor.left, 0);
    });

    it("lets the island go once its tip shows where its direction is the page's own again", async () => {
        const host = await mount(
            `<div dir="rtl" style="padding-inline-start: 150px">${fixture}</div>`,
        );
        const element = only(host, 'ui-tooltip');

        await userEvent.hover(trigger(host));
        await painted();
        await parkPointer();

        expect(element.matches(':state(island)'), 'an island').toBe(true);

        only(host, 'div').dir = 'ltr';
        await userEvent.hover(trigger(host));
        await painted();

        const anchor = trigger(host).getBoundingClientRect();
        const box = tip(host).getBoundingClientRect();

        expect(element.matches(':state(island)'), 'no island now').toBe(false);
        expect((box.left + box.right) / 2, 'centred again').toBeCloseTo(
            (anchor.left + anchor.right) / 2,
            0,
        );
    });
    it('sits centred on its trigger in a right-to-left page', async () => {
        document.documentElement.dir = 'rtl';

        try {
            // Away from the middle, where a tip mirrored across the viewport would land back
            // over its own trigger.
            const host = await mount(`<div style="padding-inline-start: 150px">${fixture}</div>`);

            await userEvent.hover(trigger(host));
            await painted();

            const anchor = trigger(host).getBoundingClientRect();
            const box = tip(host).getBoundingClientRect();

            expect((box.left + box.right) / 2).toBeCloseTo((anchor.left + anchor.right) / 2, 0);
        } finally {
            document.documentElement.removeAttribute('dir');
        }
    });

    it.each([
        ['holds the tip and its gap', 36, 'block-start'],
        ['falls a pixel short of them', 35, 'block-end'],
    ] as const)('goes above only where the room %s', async (_room, top, side) => {
        // The gap is a margin, so the platform counts it in the room the tip needs: half the
        // space token, 4px over a tip 32px tall.
        const host = await mount(
            `
            <div style="position: absolute; inset-block-start: ${String(top)}px">
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

        expect(trigger(host).getBoundingClientRect().top).toBe(top);
        expect(tip(host).getAttribute('data-side')).toBe(side);
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

    it.each([
        ['above, where it has room', '160px', 'block-start'],
        ['below, flipped at the top', '0px', 'block-end'],
    ] as const)(
        'reads its side by the two middles under a trigger taller than its tip: %s',
        async (_where, offset, side) => {
            // A trigger far taller than the tip, so a side read off anything but the trigger's
            // middle — its top, or a point past its bottom — reads the other side.
            const host = await mount(
                `
            <ui-tooltip>
                <button type="button" style="block-size: 120px">Save</button>
                <span slot="tip">Saves.</span>
            </ui-tooltip>
        `,
                offset,
            );

            await userEvent.hover(trigger(host));
            await painted();

            expect(tip(host).getAttribute('data-side')).toBe(side);
        },
    );
    it.each([
        ['above', '120px'],
        ['below, where it flipped', '0px'],
    ] as const)('keeps its gap on its trigger side, %s', async (_where, offset) => {
        // A margin the flip moves to the other side with the tip, so the gap and the side
        // cannot disagree.
        const host = await mount(fixture, offset);

        await userEvent.hover(trigger(host));
        await painted();

        const anchor = trigger(host).getBoundingClientRect();
        const box = tip(host).getBoundingClientRect();
        const gap = box.top >= anchor.bottom ? box.top - anchor.bottom : anchor.top - box.bottom;

        expect(gap).toBeCloseTo(4, 0);
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
        // dispatches the boundary event that follows, and the tip closes before anything
        // could follow it.
        trigger(host).focus();
        await painted();

        const scroller = only(host, '#scroller');
        const scrolled = new Promise((resolve) => {
            scroller.addEventListener('scroll', resolve, { once: true });
        });

        scroller.scrollTop = 30;
        await scrolled;
        await painted();

        const anchor = trigger(host).getBoundingClientRect();
        const box = tip(host).getBoundingClientRect();

        expect(anchor.top - box.bottom, 'still against the trigger, its gap and all').toBeCloseTo(
            4,
            0,
        );
        expect(tip(host).getAttribute('data-side')).toBe('block-start');
    });
    it('places nothing once the tip is gone, rather than throwing at a scroll', async () => {
        // Reachable, and only from here: `#show` refuses to open without a tip, so the
        // guard inside the placement is for the window that opens when a framework
        // re-renders the tip away while it is on screen and something then scrolls.
        const host = await mount(fixture);

        await userEvent.hover(trigger(host));
        await painted();

        const thrown = await escaped(async () => {
            tip(host).remove();
            window.dispatchEvent(new Event('resize'));
            await painted();
        });

        expect(thrown).toEqual([]);
    });

    it('places nothing once the trigger is gone either', async () => {
        const host = await mount(fixture);

        await userEvent.hover(trigger(host));
        await painted();

        const thrown = await escaped(async () => {
            trigger(host).remove();
            window.dispatchEvent(new Event('resize'));
            await painted();
        });

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
        expect(styles.margin, 'the gap, on its trigger side').toBe('0px 0px 4px');
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

        element.style.setProperty('--ui-color-surface-raised', 'rgb(1, 2, 3)');
        element.style.setProperty('--ui-backdrop-raised', 'blur(10px)');
        element.style.setProperty('--ui-color-border-overlay', 'rgb(4, 5, 6)');
        element.style.setProperty('--ui-radius', '11px');
        element.style.setProperty('--ui-space', '10px');
        element.style.setProperty('--ui-text-supporting', '21px');

        await userEvent.hover(trigger(host));

        const styles = getComputedStyle(tip(host));

        expect(styles.backgroundColor).toBe('rgb(1, 2, 3)');
        expect(styles.backdropFilter).toBe('blur(10px)');
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

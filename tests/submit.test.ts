import { afterEach, describe, expect, it } from 'vitest';
import { escaped } from './escaped.js';
import '../src/button.js';
import '../src/input.js';
import type { UiButton } from '../src/button.js';
import type { UiInput } from '../src/input.js';
import { implicit } from '../src/submit.js';

/** Mounts a form and waits for every component in it to render. */
async function mount(markup: string): Promise<HTMLFormElement> {
    const form = document.createElement('form');
    form.innerHTML = markup;
    document.body.append(form);

    // The tag map resolves a single tag name, not a list, so the union is named here.
    for (const element of form.querySelectorAll<UiButton | UiInput>('ui-input, ui-button')) {
        await element.updateComplete;
    }

    return form;
}

/** A key as the field's `keypress` listener is handed it, which a test may cancel. */
function key(name: string): KeyboardEvent {
    return new KeyboardEvent('keypress', { key: name, cancelable: true });
}

/** A task's turn, which is how long a field takes to act on a key. */
async function turn(): Promise<void> {
    await new Promise((resolve) => {
        setTimeout(resolve, 0);
    });
}

/**
 * Every submission a form made while `run` ran, as who submitted it and what it carried, with
 * nothing escaping on the way.
 *
 * Two turns, because the longest way round is two tasks long: the field acts a task after the
 * key, and a `<ui-button>` it clicks acts a task after that click. `escaped()` waits a third.
 */
async function submissions(form: HTMLFormElement, run: () => void): Promise<string[]> {
    const heard: string[] = [];
    const hear = (event: SubmitEvent): void => {
        event.preventDefault();
        heard.push(`${event.submitter?.id ?? 'none'} ${JSON.stringify([...new FormData(form)])}`);
    };

    form.addEventListener('submit', hear);

    const thrown = await escaped(async () => {
        run();
        await turn();
        await turn();
    });

    form.removeEventListener('submit', hear);
    expect(thrown, 'nothing escaped').toEqual([]);

    return heard;
}

afterEach(() => {
    document.body.replaceChildren();
});

describe('Enter, where a form has a default button', () => {
    it("clicks the form's first submit button, which submits it as its own", async () => {
        const form = await mount('<input name="a" value="1" /><button id="go">Go</button>');

        expect(
            await submissions(form, () => {
                implicit(key('Enter'), { form }, true);
            }),
        ).toEqual(['go [["a","1"]]']);
    });

    it('takes the first in tree order, past the buttons that do not submit', async () => {
        const form = await mount(`
            <input name="a" value="1" />
            <button type="button" id="plain">Plain</button>
            <button type="reset" id="clear">Clear</button>
            <input type="image" id="picture" alt="Picture" src="data:," />
            <button id="go">Go</button>
        `);

        expect(
            await submissions(form, () => {
                implicit(key('Enter'), { form }, true);
            }),
        ).toEqual(['picture [["a","1"]]']);
    });

    it("counts a submit button its form attribute ties to the form, and passes over another form's", async () => {
        await mount('<button id="theirs">Theirs</button>');
        const form = await mount('<input name="a" value="1" />');
        form.id = 'ours';
        const tied = document.createElement('button');
        tied.id = 'tied';
        tied.setAttribute('form', 'ours');
        document.body.append(tied);

        expect(
            await submissions(form, () => {
                implicit(key('Enter'), { form }, true);
            }),
        ).toEqual(['tied [["a","1"]]']);
    });

    it('counts a ui-button that submits, which puts its own entry in and reports no submitter', async () => {
        const form = await mount(`
            <input name="a" value="1" />
            <ui-button name="action" value="save">Save</ui-button>
            <button id="go">Go</button>
        `);

        expect(
            await submissions(form, () => {
                implicit(key('Enter'), { form }, true);
            }),
        ).toEqual(['none [["a","1"],["action","save"]]']);
    });

    it('passes over a ui-button that resets or does nothing, as over a button', async () => {
        const form = await mount(`
            <input name="a" value="1" />
            <ui-button type="reset" name="r" value="r">Clear</ui-button>
            <ui-button type="button" name="b" value="b">Plain</ui-button>
            <button id="go">Go</button>
        `);

        expect(
            await submissions(form, () => {
                implicit(key('Enter'), { form }, true);
            }),
        ).toEqual(['go [["a","1"]]']);
    });

    it('counts a ui-button whose type the platform does not know, which submits as a button would', async () => {
        const form = await mount(`
            <input name="a" value="1" />
            <ui-button type="go" name="action" value="save">Save</ui-button>
            <button id="go">Go</button>
        `);

        expect(
            await submissions(form, () => {
                implicit(key('Enter'), { form }, true);
            }),
        ).toEqual(['none [["a","1"],["action","save"]]']);
    });

    it('stops at a disabled default button, as the platform does, though another follows it', async () => {
        const form = await mount(`
            <input name="a" />
            <button id="off" disabled>Off</button>
            <button id="on">On</button>
        `);

        expect(
            await submissions(form, () => {
                implicit(key('Enter'), { form }, true);
            }),
        ).toEqual([]);
    });

    it('stops at a disabled ui-button the same way', async () => {
        const form = await mount(`
            <input name="a" />
            <ui-button disabled>Off</ui-button>
            <button id="on">On</button>
        `);

        expect(
            await submissions(form, () => {
                implicit(key('Enter'), { form }, true);
            }),
        ).toEqual([]);
    });

    it('clicks it from a box or a radio too', async () => {
        const form = await mount('<input name="a" value="1" /><button id="go">Go</button>');

        expect(
            await submissions(form, () => {
                implicit(key('Enter'), { form }, false);
            }),
        ).toEqual(['go [["a","1"]]']);
    });
});

describe('Enter, where a form has no submit button', () => {
    it('submits the form from a text field that is the only field blocking it', async () => {
        const form = await mount(
            '<input name="a" value="1" /><input type="checkbox" name="box" />',
        );

        expect(
            await submissions(form, () => {
                implicit(key('Enter'), { form }, true);
            }),
        ).toEqual(['none [["a","1"]]']);
    });

    // One case for each type HTML lists, so each one is shown to block on its own: the first field
    // is a text one, so the form is submitted only if the second does not count.
    it.each([
        'text',
        'search',
        'tel',
        'url',
        'email',
        'password',
        'date',
        'month',
        'week',
        'time',
        'datetime-local',
        'number',
    ])('submits nothing where a second field of type %s would block it', async (type) => {
        const form = await mount(`<input name="a" /><input type="${type}" name="b" />`);

        expect(
            await submissions(form, () => {
                implicit(key('Enter'), { form }, true);
            }),
        ).toEqual([]);
    });

    it('counts a ui-input by the type it draws', async () => {
        const blocked = await mount(`
            <ui-input label="A" name="a"></ui-input>
            <ui-input label="B" name="b" type="email"></ui-input>
        `);

        expect(
            await submissions(blocked, () => {
                implicit(key('Enter'), { form: blocked }, true);
            }),
        ).toEqual([]);

        const open = await mount(`
            <ui-input label="A" name="a" value="1"></ui-input>
            <ui-input label="B" name="b" type="range" value="5"></ui-input>
        `);

        expect(
            await submissions(open, () => {
                implicit(key('Enter'), { form: open }, true);
            }),
        ).toEqual(['none [["a","1"],["b","5"]]']);
    });

    it('submits nothing from a box or a radio, as Chromium and WebKit do', async () => {
        const form = await mount('<input name="a" />');

        expect(
            await submissions(form, () => {
                implicit(key('Enter'), { form }, false);
            }),
        ).toEqual([]);
    });
});

describe('what Enter leaves alone', () => {
    it('answers Enter and no other key', async () => {
        const form = await mount('<input name="a" /><button id="go">Go</button>');

        expect(
            await submissions(form, () => {
                implicit(key('a'), { form }, true);
                implicit(key(' '), { form }, true);
            }),
        ).toEqual([]);
    });

    it('leaves a key a listener cancelled, even once it was handed over', async () => {
        const form = await mount('<input name="a" /><button id="go">Go</button>');

        expect(
            await submissions(form, () => {
                const cancelled = key('Enter');

                implicit(cancelled, { form }, true);
                // After the field has had it, as a listener further along the key's path would.
                cancelled.preventDefault();
            }),
        ).toEqual([]);
    });

    it('does nothing, and throws nothing, for a field in no form', async () => {
        const thrown = await escaped(async () => {
            implicit(key('Enter'), { form: null }, true);
            await turn();
        });

        expect(thrown).toEqual([]);
    });
});

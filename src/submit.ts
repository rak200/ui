/**
 * A form's implicit submission, for a field whose control a shadow root keeps from the form —
 * internal.
 *
 * **Enter in a field submits its form on the platform's own controls, and the platform starts
 * from the focused control's form owner**, which a control drawn in a shadow root does not have.
 * So each field hands the key on: `implicit()` is bound to its control's `keypress`, and does
 * what HTML's implicit submission does from there. Where the form has a default button, its first
 * submit button, a native one or a `<ui-button>` that submits, Enter clicks it, so a disabled one
 * stops the submission and a listener can cancel the click. Where it has none, a text field
 * submits the form itself, unless a second field in it would block that. A box or a radio submits
 * only through a default button: measured, Chromium and WebKit submit nothing from one in a form
 * with none, where Firefox submits.
 *
 * **`keypress` rather than `keydown`, because it is the key the engines submit on.** It does not
 * come where a `keydown` listener cancelled the key, nor while an input method composes; and it
 * comes for <kbd>Enter</kbd> and <kbd>Shift</kbd>+<kbd>Enter</kbd> and not for <kbd>Ctrl</kbd>,
 * <kbd>Alt</kbd> or <kbd>Meta</kbd> with it in Chromium and WebKit. That is exactly when a native
 * control submits there. Firefox submits on all three as well, measured: it hands a `keypress`
 * over for <kbd>Ctrl</kbd>+<kbd>Enter</kbd>, so a field follows it there, and none for the other
 * two, where a field does not.
 *
 * **A task later**, once the key has reached every listener: one that cancels the `keypress`,
 * wherever it sits, has cancelled the submission.
 */

import { submitting, type UiButton } from './button.js';

/** The elements a form's submit button can be, by what draws them. */
type Submitter = HTMLButtonElement | HTMLInputElement | UiButton;

/**
 * The types of `<input>` that block a form's implicit submission, as HTML lists them: in a form
 * with no submit button, Enter in one submits the form only while it is the only one there. A
 * `<ui-input>` answers by its own `type`, which is the control it draws.
 */
const blocking: ReadonlySet<unknown> = new Set([
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
]);

/** The types that make a `<button>` or an `<input>` one of a form's submit buttons. */
const submitters: ReadonlySet<unknown> = new Set(['submit', 'image']);

/** Whether an element is a submit button, the platform's or a `<ui-button>` that submits. */
function submits(element: Submitter): boolean {
    return submitters.has(element.type) || submitting(element);
}

/** Whether a field blocks the implicit submission of a form with no submit button. */
function blocks(element: Element): boolean {
    return blocking.has((element as { readonly type?: unknown }).type);
}

/**
 * Submits the form a field is in, as <kbd>Enter</kbd> on the platform's own control would.
 *
 * Bound to the control's `keypress`, with the element that draws it, which answers for the
 * form. `text` says whether the field is one a form with no submit button is submitted from: a
 * text field is, a box and a radio are not.
 */
export function implicit(
    event: KeyboardEvent,
    field: { readonly form: HTMLFormElement | null },
    text: boolean,
): void {
    if (event.key !== 'Enter') {
        return;
    }

    setTimeout(() => {
        const { form } = field;

        if (event.defaultPrevented || form === null) {
            return;
        }

        // The default button is the first submit button in tree order whose form owner is the form,
        // looked for in the form's tree rather than among its elements: those leave an `<input
        // type="image">` out, for a historical reason HTML keeps, and a submit button its `form`
        // attribute ties to the form from outside counts in tree order all the same.
        const root = form.getRootNode() as ParentNode;
        const button = [...root.querySelectorAll<Submitter>('button, input, ui-button')].find(
            (element) => element.form === form && submits(element),
        );

        if (button !== undefined) {
            button.click();
        } else if (text && [...form.elements].filter(blocks).length < 2) {
            form.requestSubmit();
        }
    });
}

/**
 * The state a field saves for the browser to restore, and how it knows its own — internal.
 *
 * **A field saves what brings it back as it was, not what it submits.** `setFormValue(value)`
 * saves the submitted value as the state too, and two fields lost themselves by it: an unticked
 * box submits nothing, which leaves nothing to restore, so a box ticked by default came back
 * ticked; and a `<ui-select>` or `<ui-radio-group>` with no choice made submits the declared
 * one, which the restore then made its choice. Each field hands `setFormValue()` a second
 * argument, the state `kept()` writes from what it holds.
 *
 * **And a field takes back only a state it wrote.** Firefox keys a form-associated element's
 * saved state by its place among the form's elements as it joins the form, and an element joins
 * as its definition runs: one defined after an element that follows it in the tree takes a place
 * that one already holds, and is handed that one's state. Measured with two plain elements and no
 * library (#380), so a field cannot stop the hand-off; it can refuse what it is handed. A state
 * opens with the tag and the `name` of the element that saved it, and `restored()` gives a field
 * back only a state opening with its own, so a hand-off leaves a field as its markup declares,
 * which is what a reload does in Chromium and WebKit, where nothing is restored.
 *
 * The mark is the pair as JSON, so that no element's mark opens another's: a name is a JSON
 * string there, closed by a quote that one name cannot carry unescaped.
 */

/** What a state is saved for and refused by: the element that draws a field. */
interface Field {
    /** The tag, which tells one kind of field from another. */
    readonly localName: string;

    /** The name its entry is submitted under, which tells two of a kind apart. */
    readonly name: string;
}

/** The mark a field's state opens with. */
function mark(field: Field): string {
    return JSON.stringify([field.localName, field.name]);
}

/** The state a field saves for the browser to hand back: its mark, and then what it holds. */
export function kept(field: Field, held: string): string {
    return `${mark(field)}${held}`;
}

/**
 * What a state the browser hands back says a field held, where the field saved it; `undefined`
 * where another element did, or where it is no text at all, a `File` or a `FormData` some other
 * element saved.
 */
export function restored(field: Field, state: unknown): string | undefined {
    const own = mark(field);

    return typeof state === 'string' && state.startsWith(own) ? state.slice(own.length) : undefined;
}

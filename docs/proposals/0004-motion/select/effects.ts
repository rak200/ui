/**
 * `ui-select`: what the pointer, focus and an error can do, as `../fields.ts` draws them for every
 * field, and what opening its list, closing it and its caret can do where the list is drawn in the
 * page, as `../panels.ts` draws them for the menu's panel too.
 *
 * **The component draws the list where the engine hands it to the page** — #303: under
 * `appearance: base-select`, which Chromium and WebKit have and Firefox keeps behind a preference,
 * and under a pointer that hovers and is fine. Its surface, its choices and the mark on the choice
 * already made are `src/select.ts`'s; what this page adds is how the list opens, closes and turns
 * its caret.
 */
import { reference } from '../../../../src/reference.js';
import { validation, type Field } from '../controls.js';
import { moments, refused, sheet } from '../fields.js';
import { prototype, queries } from '../motion.js';
import { moments as opening, panel, type Panel } from '../panels.js';

/** The component's space, and the arm of its caret, which the component keeps to itself. */
const space = reference('--ui-space').cssText;
const arm = `calc(${space} * 0.75)`;

/** The caret's colour. */
const muted = reference('--ui-color-text-muted').cssText;

/** The caret's two triangles, as the component paints them, in a colour. */
const triangles = (colour: string): string =>
    `linear-gradient(45deg, transparent 50%, ${colour} 50%), linear-gradient(135deg, ${colour} 50%, transparent 50%)`;

/** The caret in the control's background, which goes transparent where the list is drawn. */
const painted = `var(--ui-select-caret, ${muted})`;

/**
 * The drawn list, its choices and the control's icon. The platform places the list, below the
 * select unless there is no room, and writes nowhere which side it took, so the list has no side
 * of its own and what comes from the trigger's side comes from above. Its choices are written as
 * the component writes them, so a rule here for all of them meets the component's at its weight
 * and wins by coming later.
 */
const where: Panel = {
    panel: 'select::picker(select)',
    open: 'select:open::picker(select)',
    closed: 'select:not(:open)::picker(select)',
    rtl: 'select:dir(rtl)::picker(select)',
    items: 'select:open > :is(option, optgroup)',
    item: (place, rest) => `select:open > :nth-child(${rest ? 'n + 7' : String(place)})`,
    caret: 'select::picker-icon',
    turned: 'select:open::picker-icon',
    name: 'select',
};

/** What opening the list, closing it and its caret can do, where the component draws the list. */
function list(name: string): string {
    return String.raw`
/* Where the component draws the list, and nowhere else: elsewhere the list is the system's, and the
   caret is in the background, where the fills paint it again. */
@supports (appearance: base-select) {
@media (hover: hover) and (pointer: fine) {
    /* The caret moved into the icon, so the fills that paint the background stop painting it. */
    select:not([multiple]) {
        --ui-select-caret: transparent;
    }

${panel(where, queries(name))}
}
}`;
}

prototype({
    tags: ['ui-select'],
    // Under its label, so the edge is lit from where the pointer is in the box round the control.
    bounded: 'select',
    sheet: (name) =>
        sheet(
            {
                controls: ['select'],
                // A select has no read-only state, so its darkening has no second guard.
                able: ':not(:disabled)',
                // The caret: two triangles the component paints in the control's background, on
                // a select that is not a list.
                behind: {
                    where: 'select:not([multiple])',
                    image: triangles(painted),
                    size: `${arm} ${arm}, ${arm} ${arm}`,
                    position: `right calc(${space} + ${arm}) center, right ${space} center`,
                    mirrored: `left ${space} center, left calc(${space} + ${arm}) center`,
                },
            },
            name,
        ) + list(name),
    moments: [...moments, ...opening({ panel: 'list', items: 'choices', labels: 'choices' })],
    refused: [
        {
            name: 'zoom',
            why: 'the list opens as the menu’s panel does, and the menu leaves the zoom out: it places its panel by the size it reads as the panel opens.',
        },
        {
            name: 'dim the others',
            why: 'fading every choice but the one under the pointer takes their text under the 4.5:1 the list clears, for as long as the pointer is in it.',
        },
        {
            name: 'the cascade on the way out',
            why: 'a list closes because a choice was made, and the control already shows it; an exit that waits on each choice in turn holds the list over it, the longer the more choices there are.',
        },
        {
            name: 'typing',
            why: 'a list is opened to be chosen from, and choices typed in one by one hide what the reader opened it for.',
        },
        ...refused,
    ],
});

validation(
    'ui-select[required]',
    (field: Field) => (field as Field & { readonly value: string }).value !== '',
    'Choose one to continue.',
);

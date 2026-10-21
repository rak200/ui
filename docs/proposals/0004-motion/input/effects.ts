/**
 * `ui-input` and `ui-textarea`: what the pointer, focus and an error can do, as `../fields.ts`
 * draws them for every field, and what a field the reader types in leaves out besides.
 */
import { validation, type Field } from '../controls.js';
import { moments, refused, sheet } from '../fields.js';
import { prototype } from '../motion.js';

prototype({
    tags: ['ui-input', 'ui-textarea'],
    // Under its label, so the edge is lit from where the pointer is in the box round the control.
    bounded: 'input, textarea',
    sheet: (name) =>
        sheet(
            {
                controls: ['input', 'textarea'],
                // Not one that cannot be used or written in.
                able: ':not(:disabled):not([readonly])',
            },
            name,
        ),
    moments,
    refused: [
        ...refused,
        {
            name: 'floating label',
            why: 'moves the field’s name into it on focus — text the reader has just read, moving while they type under it.',
        },
        {
            name: 'a keystroke’s echo',
            why: 'a ring or a light for every character typed lands in the middle of the typing it answers, as often as the reader types.',
        },
        {
            name: 'the placeholder fading on focus',
            why: 'the component holds the placeholder at full opacity because its colour was chosen to clear 4.5:1, and a fade takes it under that.',
        },
    ],
});

validation(
    'ui-input[required], ui-textarea[required]',
    (field: Field) => (field as Field & { readonly value: string }).value !== '',
    'Fill this in to continue.',
);

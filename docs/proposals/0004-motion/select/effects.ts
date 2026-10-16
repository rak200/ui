/**
 * `ui-select`: what the pointer, focus and an error can do, as `../fields.ts` draws them for every
 * field. The list itself is the platform's popup, which no style reaches in two engines of three,
 * so opening it is not a moment this catalogue has.
 */
import { reference } from '../../../../src/reference.js';
import { validation, type Field } from '../controls.js';
import { moments, refused, sheet } from '../fields.js';
import { prototype } from '../motion.js';

/** The component's space, and the arm of its caret, which the component keeps to itself. */
const space = reference('--ui-space').cssText;
const arm = `calc(${space} * 0.75)`;

/** The caret's colour. */
const muted = reference('--ui-color-text-muted').cssText;

prototype({
    tags: ['ui-select'],
    sheet: (name) =>
        sheet(
            {
                controls: ['select'],
                // A select has no read-only state, so its darkening has no second guard.
                pointed: ':hover:not(:disabled)',
                // The caret: two triangles the component paints in the control's background, on
                // a select that is not a list.
                behind: {
                    where: 'select:not([multiple])',
                    image: `linear-gradient(45deg, transparent 50%, ${muted} 50%), linear-gradient(135deg, ${muted} 50%, transparent 50%)`,
                    size: `${arm} ${arm}, ${arm} ${arm}`,
                    position: `right calc(${space} + ${arm}) center, right ${space} center`,
                    mirrored: `left ${space} center, left calc(${space} + ${arm}) center`,
                },
            },
            name,
        ),
    moments,
    refused: [
        {
            name: 'opening the list',
            why: 'the list is the platform’s popup; docs/select.md publishes what it refuses, and appearance: base-select, which would hand it over, is in one engine.',
        },
        ...refused,
    ],
});

validation(
    'ui-select[required]',
    (field: Field) => (field as Field & { readonly value: string }).value !== '',
    'Choose one to continue.',
);

/**
 * `ui-button`: what a press, the pointer and focus can each do, as `../buttons.ts` draws them on
 * every button.
 */
import { moments, refused, sheet } from '../buttons.js';
import { prototype } from '../motion.js';

prototype({
    tags: ['ui-button'],
    sheet: sheet(
        {
            variants: { primary: 'button.primary', secondary: 'button.secondary' },
            filled: "[variant='primary']",
        },
        'button',
    ),
    moments,
    refused,
});

/**
 * `ui-menu`: what opening, closing and the caret can do, as `../panels.ts` draws them for every
 * panel that hangs from a trigger, and what a press, the pointer and focus can do to its trigger,
 * as `../buttons.ts` draws them on every button.
 *
 * **The trigger is a secondary button**, which the component writes out, so it offers the button's
 * effects, and takes a theme's taste for them as every button does. Its host holds the panel and
 * the items too, so they are answered on the trigger alone: the catalogue names it as its control,
 * and the layers drawn on the host are drawn off the page's record of the pointer on it.
 */
import * as trigger from '../buttons.js';
import { prototype, queries } from '../motion.js';
import { moments, panel, type Panel } from '../panels.js';

/** The query each effect is drawn under: the consumer's choice, else the theme's taste. */
const is = queries('menu');

/**
 * The popover the menu shows, its items and the trigger's caret. The menu writes the side the
 * panel takes as it opens, before the panel's first style, so an entrance comes from the trigger's
 * side. The trigger is a child of the menu too, so it is counted out of the items' places.
 */
const where: Panel = {
    panel: '[popover]',
    open: '[popover]:popover-open',
    closed: '[popover]:not(:popover-open)',
    above: "[popover][data-side='block-start']",
    rtl: '[popover]:dir(rtl)',
    items: '[popover]:popover-open slot::slotted(*)',
    item: (place, rest) =>
        `[popover]:popover-open slot::slotted(:nth-child(${rest ? 'n + 8' : String(place + 1)} of :not([slot])))`,
    caret: 'svg',
    turned: ':host([open]) svg',
    name: 'menu',
};

prototype({
    tags: ['ui-menu'],
    sheet: `${panel(where, is)}\n${trigger.sheet({ variants: { secondary: 'button' }, hovered: '[data-hover]' }, 'menu')}`,
    control: 'button',
    moments: [...moments({ panel: 'panel', items: 'items', labels: 'labels' }), ...trigger.moments],
    refused: [
        {
            name: 'zoom',
            why: 'a panel that starts scaled is measured scaled: the menu places the panel by its size, read the moment it opens.',
        },
        {
            name: 'dim the others',
            why: 'fading every item but the one under the pointer puts their text under the 4.5:1 the menu clears, for as long as the pointer is in it.',
        },
        {
            name: 'the cascade on the way out',
            why: 'a menu closes because an item was chosen, so the reader is already looking at what it did; an exit that waits on each item in turn holds the panel over that, the longer the more items it has.',
        },
        {
            name: 'typing',
            why: 'a menu is opened to be chosen from, and labels typed in one by one hide what the reader opened it for.',
        },
        ...trigger.refused,
    ],
});

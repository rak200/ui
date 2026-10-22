/**
 * `ui-select`: what the pointer, focus and an error can do, as `../fields.ts` draws them for every
 * field, and what opening its list, closing it and its caret can do where the page draws the list,
 * as `../panels.ts` draws them for the menu's panel too.
 *
 * **The list is the platform's popup today.** Under `appearance: base-select` the engine hands it
 * to the page, and the switch on the page takes it: Chromium and WebKit then open the list in the
 * page, in the kit's surface, and Firefox, which has the base appearance behind a preference, keeps
 * its own list. The control stays the box it is.
 */
import { reference } from '../../../../src/reference.js';
import { glass } from '../../../../src/theme.js';
import { validation, type Field } from '../controls.js';
import { moments, refused, sheet } from '../fields.js';
import { prototype, queries } from '../motion.js';
import { moments as opening, panel, type Panel } from '../panels.js';

/** The component's space, and the arm of its caret, which the component keeps to itself. */
const space = reference('--ui-space').cssText;
const arm = `calc(${space} * 0.75)`;

/** The caret's colour. */
const muted = reference('--ui-color-text-muted').cssText;

/** The accent, and its label, which the choice already made can be marked in. */
const accent = reference('--ui-color-accent').cssText;
const label = reference('--ui-color-accent-contrast').cssText;

/** The caret's two triangles, as the component paints them, in a colour. */
const triangles = (colour: string): string =>
    `linear-gradient(45deg, transparent 50%, ${colour} 50%), linear-gradient(135deg, ${colour} 50%, transparent 50%)`;

/** The caret in the control's background, which goes transparent where the list is drawn. */
const painted = `var(--ui-select-caret, ${muted})`;

/** Whether the page draws the list, which the switch writes on the root. */
const drawn = 'style(--ui-select-list: drawn)';

/**
 * Whether the choice already made is marked in a look: the one the page picks, or where it picks
 * none, the theme's. Each `not` in parentheses of its own, as `queries()` writes it.
 */
const marked = (look: string): string =>
    `(style(--ui-select-current: ${look}) or ((not style(--ui-select-current)) and style(--ui-select-current-theme: ${look})))`;

/**
 * The drawn list, its choices and the control's icon. The platform places the list, below the
 * select unless there is no room, and writes nowhere which side it took, so the list has no side
 * of its own and what comes from the trigger's side comes from above.
 */
const where: Panel = {
    panel: 'select::picker(select)',
    open: 'select:open::picker(select)',
    closed: 'select:not(:open)::picker(select)',
    rtl: 'select:dir(rtl)::picker(select)',
    items: 'select:open > *',
    item: (place, rest) => `select:open > :nth-child(${rest ? 'n + 7' : String(place)})`,
    caret: 'select::picker-icon',
    turned: 'select:open::picker-icon',
    name: 'select',
};

/** The list the page draws, and what opening it, closing it and its caret can do. */
function list(name: string): string {
    const is = queries(name);

    /** Each effect's query, met only while the page draws the list. */
    const listed = (moment: string, effect: string): string =>
        `(${drawn} and ${is(moment, effect)})`;

    return String.raw`
/* All of it only where the engine has the base appearance: elsewhere the caret would go from the
   background into an icon the control does not have. */
@supports (appearance: base-select) {
@container ${drawn} {
    /* The base appearance on the control and on its list is what hands the list to the page. A
       select of several choices draws them in the box and opens nothing, so it is left alone. */
    select:not([multiple]),
    select:not([multiple])::picker(select) {
        appearance: base-select;
    }

    /* The box stays the component's. Its caret moves into the icon the base appearance gives the
       control, which can turn as the list opens, where the one painted in the background was
       painted there, and that one goes transparent, under the fills that paint it again too. */
    select:not([multiple]) {
        position: relative;
        background-image: none;
        --ui-select-caret: transparent;
    }

    select::picker-icon {
        content: '';
        position: absolute;
        inset-inline-end: ${space};
        inset-block: 0;
        margin: auto 0;
        padding: 0;
        inline-size: calc(${arm} * 2);
        block-size: ${arm};
        background-image: ${triangles(muted)};
        background-size: ${arm} ${arm};
        background-position:
            left center,
            right center;
        background-repeat: no-repeat;
        transition: rotate ${reference('--ui-duration-state')} ${reference('--ui-easing-state')};
    }

    /* Turned over while the list is open, on the state's step, as the menu's caret is. */
    select:open::picker-icon {
        rotate: 180deg;
    }

    /* The list is a raised surface, as the menu's panel is: its boundary, its corner, its glass,
       and its shadow, lit in the accent as the panel's is, so the choices take the text back.
       Half a space clear of the control, on whichever side the platform hangs it. */
    select::picker(select) {
        box-sizing: border-box;
        margin: calc(${space} / 2) 0;
        padding: calc(${space} / 2);
        border: 1px solid ${reference('--ui-color-border-overlay')};
        border-radius: ${reference('--ui-radius')};
        background: ${reference('--ui-color-surface-raised')};
        backdrop-filter: ${reference('--ui-backdrop-raised')};
        color: ${reference('--ui-color-accent')};
        box-shadow: ${reference('--ui-elevation-raised')};
    }

    /* Each choice on the list's surface rather than its own, which the component paints for the
       platform's list. */
    select:not([multiple]) :is(option, optgroup) {
        background-color: transparent;
        color: ${reference('--ui-color-text')};
    }

    /* A choice is a menu's item: its padding, its corner, the hover colour under the pointer and
       the ring at the focus. Under :where(), so an entrance that writes a choice's transitions
       outranks this one. */
    :where(select) option {
        gap: calc(${space} / 2);
        padding: calc(${space} / 2) ${space};
        border-radius: ${reference('--ui-radius')};
        cursor: pointer;
        transition: background-color ${reference('--ui-duration-state')}
            ${reference('--ui-easing-state')};
    }

    select:not([multiple]) option:not(:disabled):hover {
        background-color: ${reference('--ui-color-hover')};
    }

    select:not([multiple]) option:focus-visible {
        outline: 2px solid ${reference('--ui-color-focus')};
        outline-offset: -2px;
    }

    select:not([multiple]) option:disabled {
        color: ${muted};
        cursor: not-allowed;
    }

    select:not([multiple]) option::checkmark {
        color: ${reference('--ui-color-accent')};
    }

    /* A group after the first is set off by the menu's separator, which WebKit's own sheet draws
       fainter and Chromium's not at all. */
    :where(select) optgroup {
        border: none;
    }

    :where(select) optgroup:not(:first-child) {
        border-block-start: 1px solid ${reference('--ui-color-border')};
        margin-block-start: calc(${space} / 2);
        padding-block-start: calc(${space} / 2);
    }

    /* The choice already made, in the look the page picks, or else the theme's: the check alone,
       as today, a tint of the accent behind it, the accent itself with the accent's label on it,
       as a checked box is filled, or a ring in the accent. Read from :checked, which is the
       selection rather than the focus: the arrows move the focus through the list and leave this
       where it is. */
    @container ${marked('tint')} {
        select:not([multiple]) option:checked {
            background-color: color-mix(in oklab, ${accent} 14%, transparent);
        }

        select:not([multiple]) option:checked:not(:disabled):hover {
            background-color: color-mix(in oklab, ${accent} 24%, transparent);
        }
    }

    @container ${marked('fill')} {
        select:not([multiple]) option:checked {
            background-color: ${accent};
            color: ${label};
        }

        select:not([multiple]) option:checked:not(:disabled):hover {
            background-color: ${reference('--ui-color-accent-hover')};
        }

        select:not([multiple]) option:checked::checkmark {
            color: ${label};
        }

        /* The ring goes round the fill rather than inside it, where it would be drawn in the
           fill's own colour in every theme that draws the focus in the accent. */
        select:not([multiple]) option:checked:focus-visible {
            outline-offset: 1px;
        }
    }

    @container ${marked('ring')} {
        select:not([multiple]) option:checked {
            box-shadow: inset 0 0 0 1px ${accent};
        }
    }
}
${panel(where, listed)}
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

// The switch: the page draws the list, or leaves it to the platform.
for (const toggle of document.querySelectorAll<HTMLElement & { readonly checked: boolean }>(
    '[data-list]',
)) {
    toggle.addEventListener('change', () => {
        document.documentElement.style.setProperty(
            '--ui-select-list',
            toggle.checked ? 'drawn' : 'platform',
        );
    });
}

// What each theme marks the choice already made with, where the page picks nothing: the fill, and
// under Glass the tint, which looked better on its glass, by eye. On the root, as a theme's block
// writes its tastes, so the list follows the theme as the frame changes it.
const theirs = document.createElement('style');
theirs.textContent = `:where(:root) { --ui-select-current-theme: fill; }
:where(:root[data-ui-theme='${glass.name}']) { --ui-select-current-theme: tint; }`;
document.head.append(theirs);

// How a drawn list marks the choice already made: the look the page picks, or nothing written while
// it picks the theme's, so the theme's runs. Written from the declaration the page selects at first,
// because the select's value stays empty until someone chooses.
for (const picker of document.querySelectorAll<HTMLElement & { readonly value: string }>(
    '[data-current]',
)) {
    const write = (look: string): void => {
        const root = document.documentElement.style;

        if (look === '') {
            root.removeProperty('--ui-select-current');
        } else {
            root.setProperty('--ui-select-current', look);
        }
    };

    write(picker.querySelector('[selected]')?.getAttribute('value') ?? '');
    picker.addEventListener('change', () => {
        write(picker.value);
    });
}

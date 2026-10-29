/**
 * The half every RFC 0004 prototype shares.
 *
 * A page declares one component's catalogue — the moments it answers, the effects it offers for
 * each, and the CSS it would carry — and this file does the rest: the token sheet and the steps
 * the catalogue needs beyond it, the frame's controls, the choice a consumer makes and the CSS
 * that choice is, and the script a component would carry for what CSS cannot do alone.
 * Proposal material rather than a consumer demo, so it reaches under the barrel.
 *
 * **What a page proposes is its catalogue's `sheet`.** It is adopted into every instance's
 * shadow root, which is where S5 found an effect has to be declared for all three engines to
 * find it: a stand-in for the component shipping it there.
 */
import '../../../src/index.js';

import { LitElement, html, nothing, render, type TemplateResult } from 'lit';

import { glass, matrix, themeStyleSheet, type Theme } from '../../../src/theme.js';
import { tokenStyleSheet } from '../../../src/tokens.js';

/** Where a consumer makes a choice: the four scopes S6 measured. */
export type Scope = 'page' | 'region' | 'type' | 'instance';

/** What a fired effect is handed: the element the choice was read on, and the event. */
export interface Firing {
    readonly host: HTMLElement;
    readonly event: Event;
}

/** One effect a component offers for one moment. */
export interface Effect {
    /** The value a consumer writes, and the name the component's sheet queries. */
    readonly name: string;
    /** What it does, in a line. */
    readonly says: string;
    /** The component's behaviour today, which is what renders when nothing is chosen. */
    readonly today?: boolean;
    /** It needs the pointer engine, which publishes where the pointer is. */
    readonly follows?: boolean;
    /** Drawn on the host itself, which a choice made on the host cannot reach — S8. */
    readonly host?: boolean;
    /** It runs in script on the moment's event and finishes, whatever the state does — S7. One
     *  that holds for as long as the state does, as a press held in pieces does, listens for its
     *  end itself. */
    readonly fire?: (firing: Firing) => void;
    /** It repeats for as long as the state lasts, and not at all for a reader who asked for
     *  less motion: its count reads a token, as its period does. */
    readonly loops?: boolean;
    /** It repeats a few rounds and rests, for a state that can last as long as the reader likes. */
    readonly settles?: boolean;
    /** The one element of the catalogue's several it applies to. */
    readonly only?: string;
    /** It travels, and a direction chosen beside it says which way. */
    readonly directed?: boolean;
    /** The list its moment shares offers it, and this component does not draw it yet. */
    readonly yet?: boolean;
    /** The list its moment shares offers it, and this component never draws it, for this reason. */
    readonly refused?: string;
}

/** Whether a component draws an effect it lists: one the list its moment shares offers and the
 *  component does not draw is shown, and runs nowhere. */
function drawn(effect: Effect): boolean {
    return effect.yet !== true && effect.refused === undefined;
}

/** A kind of change a moment's effects make — where the element is, its shadow, its fill —
 *  which is a property of its own. */
export interface Kind {
    /** The name after `--ui-motion-<moment>-`; empty for the moment's own property, which a
     *  kind that only qualifies it — a direction, a curve — is written beside. */
    readonly name: string;
    readonly label: string;
    readonly effects: readonly Effect[];
}

/** A moment a component answers, and the effects it offers for it. */
export interface Moment {
    /** The name after `--ui-motion-`. */
    readonly name: string;
    readonly label: string;
    /** The event a fired effect listens for, where the moment has one. `press` is the primary
     *  pointer going down, Space going down — it presses a control from its down and clicks it
     *  at its up — or the click any other key makes, Enter's coming at its down.
     *  `enter` is a pointer that can hover arriving on the element itself. `focus` is a focus
     *  the reader can see arriving — a key's, not a click's. `arrive` is an instance being
     *  inserted, and a choice made for the moment inserts every instance again. `leave` is an
     *  instance the page is taking away, which plays the exit first, and a choice made for the
     *  moment takes every instance out through it and back. Any other name is an event the page
     *  dispatches from inside the instance, where the component would act itself: a dialog's
     *  `opening` and `closing`. */
    readonly on?: string;
    /** Its effects in one property, `--ui-motion-<moment>`: one at a time. */
    readonly effects?: readonly Effect[];
    /** Its effects by the kind of change each makes, a property per kind,
     *  `--ui-motion-<moment>-<kind>`: one of each kind at a time, and the kinds together. A
     *  style query compares the whole value, so a list in one property matches no effect. */
    readonly kinds?: readonly Kind[];
    /** The one element of the catalogue's several that answers it, where the others do not: a
     *  toast arrives and leaves, and the toaster round it does neither. Every one, unless named. */
    readonly only?: string;
}

/** An effect the reference has and the catalogue leaves out, and why. */
export interface Refusal {
    readonly name: string;
    readonly why: string;
}

/** Everything a page declares about its component. */
export interface Catalogue {
    /** The elements the choices are made on, the first named in the page's title. */
    readonly tags: readonly string[];
    readonly moments: readonly Moment[];
    /** The CSS the component would carry: every effect under its style query. Where a page's
     *  elements carry one sheet and each asks for its tastes under its own name, the sheet is
     *  written for that name, and each element takes its own copy. */
    readonly sheet: string | ((name: string) => string);
    /** Where the sheet goes: the shadow root, or the host's tree for a component that styles
     *  what the host wrote, as `ui-table` does. */
    readonly where?: 'shadow' | 'document';
    /** The layers the component would render for its effects to draw on, one per kind of
     *  change that needs one, so effects of different kinds draw at once: a host has two
     *  pseudo-elements, and a theme already draws on one. */
    readonly layers?: readonly string[];
    /** The one element the layers are rendered in, where the page's elements share a sheet and
     *  only one of them is drawn on: a toast, and not the toaster round it. Every one, unless
     *  named. */
    readonly layered?: string;
    /** The control in the shadow root that a press, the pointer and focus are answered on, where
     *  the component renders more than the control: the menu's trigger, and not its items, which
     *  are in its host too. Any control in the instance, unless named. */
    readonly control?: string;
    /** The controls in the shadow root a border's light is drawn round, where the instance's box
     *  is not theirs: a field under its label, a drawn control beside its text, each choice in a
     *  group. The pointer engine writes each control's parent, which lays the layers over it,
     *  where the pointer is from the control's own box. */
    readonly bounded?: string;
    readonly refused?: readonly Refusal[];
}

/** A property a consumer writes for a moment, and the effects it takes. */
interface Slot {
    /** The name after `--ui-motion-`: the moment's, or the moment's and its kind's. */
    readonly name: string;
    readonly kind?: Kind;
    readonly effects: readonly Effect[];
    /** The one element that answers it: its moment's. */
    readonly only?: string | undefined;
}

/** Whether a property offers an effect by that name other than today's: what a taste, or a
 *  choice of today's over it, has to be for the property to be written at all. */
function offers(slot: Slot, name: string | undefined): boolean {
    return slot.effects.some(
        (effect) => effect.name === name && effect.today !== true && drawn(effect),
    );
}

/** A moment's properties: its one, or one per kind. */
function slots(moment: Moment): readonly Slot[] {
    if (moment.kinds === undefined) {
        return [{ name: moment.name, effects: moment.effects ?? [], only: moment.only }];
    }

    return moment.kinds.map((kind) => ({
        name: kind.name === '' ? moment.name : `${moment.name}-${kind.name}`,
        kind,
        effects: kind.effects,
        only: moment.only,
    }));
}

/** What a reader chose for a moment: an effect for each property they have picked one for,
 *  and one scope. A property with no pick does what the theme chooses, or what it does today. */
interface Choice {
    readonly picks: ReadonlyMap<string, string>;
    readonly scope: Scope;
}

const pages = [
    ['button', 'Button'],
    ['card', 'Card'],
    ['checkbox', 'Checkbox and switch'],
    ['radio', 'Radio'],
    ['input', 'Input'],
    ['select', 'Select'],
    ['menu', 'Menu'],
    ['tooltip', 'Tooltip'],
    ['dialog', 'Dialog'],
    ['toast', 'Toast'],
    ['table', 'Table'],
    ['icon', 'Icon'],
    ['compare', 'Side by side'],
] as const;

/**
 * The steps and curves the catalogue needs and the token layer does not have yet, shaped on
 * the reference's five-step scale, and a loop's period and count. Placeholders, collapsed with
 * the rest under reduced motion, and by the frame's switch too, so a reader can see the second
 * state of every effect. One step is not the reference's: `--ui-duration-150`, between two of
 * its steps, which every effect the dialog offers takes.
 *
 * **A loop's count is a token for the reason its period is.** Collapsing the period alone leaves
 * an infinite loop running in all three engines, tens of thousands of iterations in a third of
 * a second: Chromium and WebKit hold one phase, and Firefox draws a different one every frame,
 * which flickers. Measured; with the count at one, the loop is over before the first frame.
 *
 * **A loop that settles has a count of its own**, for states that can last as long as the
 * reader likes: a focus can rest on a button for minutes, and a loop that never ends there is
 * motion the reader cannot stop without moving away. Four rounds of the period stay inside the
 * five seconds WCAG 2.2.2 lets motion run before it must be stoppable.
 */
const standIns = `
:root {
    --ui-duration-50: 75ms;
    --ui-duration-150: 200ms;
    --ui-duration-200: 240ms;
    --ui-duration-300: 360ms;
    --ui-duration-400: 520ms;
    --ui-duration-loop: 1.2s;
    --ui-iteration-loop: infinite;
    --ui-iteration-settle: 4;
    --ui-easing-emphasis: cubic-bezier(0.3, 1.5, 0.5, 1);
    --ui-easing-move: cubic-bezier(0.4, 0, 0.2, 1);
}
@media (prefers-reduced-motion: reduce) {
    :root {
        --ui-duration-50: 0.01ms;
        --ui-duration-150: 0.01ms;
        --ui-duration-200: 0.01ms;
        --ui-duration-300: 0.01ms;
        --ui-duration-400: 0.01ms;
        --ui-duration-loop: 0.01ms;
        --ui-iteration-loop: 1;
        --ui-iteration-settle: 1;
    }
}
:root[data-reduced] {
    --ui-duration-100: 0.01ms;
    --ui-duration-state: 0.01ms;
    --ui-duration-50: 0.01ms;
    --ui-duration-150: 0.01ms;
    --ui-duration-200: 0.01ms;
    --ui-duration-300: 0.01ms;
    --ui-duration-400: 0.01ms;
    --ui-duration-loop: 0.01ms;
    --ui-iteration-loop: 1;
    --ui-iteration-settle: 1;
}`;

/** Registered, so CSS can compute with them and a transition can interpolate them. */
const registered = [
    ['--ui-pointer-x', '<length>', '-999px'],
    ['--ui-pointer-y', '<length>', '-999px'],
    ['--ui-pointer-nx', '<number>', '0'],
    ['--ui-pointer-ny', '<number>', '0'],
    ['--ui-pointer-near', '<number>', '0'],
    ['--ui-ripple-x', '<length>', '0px'],
    ['--ui-ripple-y', '<length>', '0px'],
    ['--ui-ripple-progress', '<number>', '0'],
    ['--ui-ripple-alpha', '<number>', '0'],
    ['--ui-orbit', '<angle>', '0deg'],
    ['--ui-trace', '<angle>', '0deg'],
    ['--ui-turn', '<number>', '0'],
    ['--ui-flood', '<number>', '0'],
    ['--ui-flood-x', '<length>', '0px'],
    ['--ui-flood-y', '<length>', '0px'],
    ['--ui-breath', '<number>', '0'],
    ['--ui-typed', '<length-percentage>', '100%'],
    ['--ui-swept', '<angle>', '360deg'],
    ['--ui-scan', '<length-percentage>', '-80%'],
    ['--ui-shimmer', '<length-percentage>', '150%'],
    ['--ui-shown', '<number>', '0'],
] as const;

for (const [name, syntax, initialValue] of registered) {
    try {
        CSS.registerProperty({ name, syntax, inherits: true, initialValue });
    } catch {
        // Registered by an earlier module on the same page, which is all that is needed.
    }
}

const sheets = document.createElement('style');
sheets.textContent = `${tokenStyleSheet()}\n${standIns}`;
document.head.prepend(sheets);

/** The shipped themes the frame offers, by the value `data-ui-theme` takes for each. */
const themes: ReadonlyMap<string, Theme> = new Map([
    [matrix.name, matrix],
    [glass.name, glass],
]);

/** The chosen theme's block, after the token sheet whose grounds it overrides at equal
 *  specificity; empty for the default palette, which is no theme at all. */
const themed = document.createElement('style');
sheets.after(themed);

/**
 * What a theme chooses where a consumer has chosen nothing: an effect for each moment, for the
 * page and for one component. RFC 0003 let a theme bring a category whose default is the
 * identity. The default theme's is on the root whatever the theme, as its tokens are, so a theme
 * with no taste keeps it and one with a taste replaces it moment by moment.
 *
 * **A theme names each moment once, for the page.** The pointer's and the focus's effects are one
 * list wherever they are answered — `moments.ts` — so a name is one effect on every component, and
 * one that leaves the effect out, with why, does what it does today there; a press is answered by
 * the button alone, and an error by a form's controls. A component's own taste is left for a moment
 * of its own: a check, a menu's panel and caret, a toast, a tooltip, an icon and a table's row. A
 * theme sets a component apart from the page with one too, and only Glass does: the card alone
 * leans under the pointer.
 *
 * A taste is written in properties of its own, never in the consumer's: `--ui-taste-<moment>` for
 * the page and `--ui-taste-<component>-<moment>` for one component, both on the root, read only
 * where no choice is written — `queries()` and `chosen()`. In the consumer's property a taste for
 * one component could not be told from a choice made for the page: it would have to be written on
 * the component, where it outweighs every choice inherited from above, and where the effects the
 * card draws on its host miss it — S8.
 */
interface Taste {
    /** The components whose pages write it, by tag. */
    readonly for: readonly string[];
    /** The effect for each moment, for every component on the page that offers it. */
    readonly moments: Readonly<Record<string, string>>;
    /** The effect for each moment of one component, by its tag less `ui-`, over the page's. */
    readonly components?: Readonly<Record<string, Readonly<Record<string, string>>>>;
}

/** The tastes, by the value `data-ui-theme` takes, and `default` for the theme that is none. */
const tastes: ReadonlyMap<string, Taste> = new Map([
    [
        'default',
        {
            for: [
                'ui-card',
                'ui-dialog',
                'ui-button',
                'ui-checkbox',
                'ui-switch',
                'ui-radio-group',
                'ui-icon',
                'ui-table',
                'ui-toast',
                'ui-tooltip',
                'ui-menu',
                'ui-input',
                'ui-textarea',
                'ui-select',
            ],
            moments: {
                enter: 'fade',
                exit: 'fade',
                hover: 'glow',
                'hover-fill': 'highlight',
                'hover-shadow': 'raise',
                'hover-border': 'pulse',
                'focus-move': 'lift',
                'focus-shadow': 'raise',
                'focus-border': 'pulse',
                'focus-label': 'accent',
                'focus-ring': 'glide',
                'press-move': 'squish',
                'press-fill': 'highlight',
                'press-shadow': 'sink',
                'press-border': 'none',
                'invalid-border': 'pulse',
                'invalid-fill': 'flash',
            },
            components: {
                menu: { enter: 'cascade', exit: 'fold', caret: 'flip' },
                select: { enter: 'cascade', exit: 'fold', caret: 'flip' },
                icon: { enter: 'draw' },
                table: { hover: 'highlight', enter: 'glow' },
                toast: { enter: 'slide-elastic', exit: 'slide', dwell: 'ring' },
                toaster: { stack: 'spring' },
                tooltip: { enter: 'rise', exit: 'sink', next: 'glide' },
                checkbox: { check: 'draw' },
                switch: { check: 'spring' },
                'radio-group': { check: 'pop' },
            },
        },
    ],
    [
        matrix.name,
        {
            for: [
                'ui-card',
                'ui-dialog',
                'ui-button',
                'ui-checkbox',
                'ui-switch',
                'ui-radio-group',
                'ui-icon',
                'ui-table',
                'ui-toast',
                'ui-tooltip',
                'ui-menu',
                'ui-input',
                'ui-textarea',
                'ui-select',
            ],
            moments: {
                enter: 'materialize',
                exit: 'erode',
                backdrop: 'char-rain',
                'hover-move': 'none',
                'hover-fill': 'tint',
                'hover-shadow': 'glow',
                'hover-border': 'trace',
                'focus-move': 'glitch',
                'focus-fill': 'scan',
                'focus-shadow': 'burst',
                'focus-border': 'comet',
                'focus-label': 'glow',
                'focus-ring': 'glitch',
                'press-move': 'shatter',
                'press-fill': 'none',
                'press-shadow': 'none',
                'press-border': 'none',
                'invalid-border': 'split',
                'invalid-fill': 'none',
            },
            components: {
                menu: { enter: 'glitch', exit: 'glitch' },
                select: { enter: 'glitch', exit: 'glitch' },
                icon: { enter: 'pop', hover: 'glitch' },
                table: { enter: 'glow' },
                toast: { enter: 'wind', exit: 'wind' },
                tooltip: { enter: 'typing', exit: 'glitch' },
            },
        },
    ],
    [
        glass.name,
        {
            for: [
                'ui-card',
                'ui-dialog',
                'ui-button',
                'ui-checkbox',
                'ui-switch',
                'ui-radio-group',
                'ui-icon',
                'ui-table',
                'ui-toast',
                'ui-tooltip',
                'ui-menu',
                'ui-input',
                'ui-textarea',
                'ui-select',
            ],
            moments: {
                enter: 'dissolve',
                exit: 'dissolve',
                backdrop: 'blur',
                'hover-move': 'none',
                'hover-fill': 'spotlight',
                'hover-shadow': 'cast',
                'hover-border': 'edge',
                'focus-move': 'none',
                'focus-fill': 'shimmer',
                'focus-shadow': 'neon',
                'focus-border': 'orbit',
                'focus-label': 'none',
                'focus-ring': 'refocus',
                'press-move': 'spring',
                'press-fill': 'ripple',
                'press-shadow': 'sink',
                'press-border': 'none',
                'invalid-border': 'glow',
                'invalid-fill': 'flash',
            },
            components: {
                card: { 'hover-move': 'tilt' },
                menu: { enter: 'refocus', exit: 'defocus' },
                select: { enter: 'refocus', exit: 'defocus' },
                icon: { enter: 'refocus', hover: 'pop' },
                table: { hover: 'frost', enter: 'glow' },
                toast: { enter: 'refocus', exit: 'defocus' },
                tooltip: { enter: 'refocus', exit: 'defocus' },
            },
        },
    ],
]);

/** The tastes a page of these components writes, the default theme's first. */
function tastesFor(tags: readonly string[]): readonly (readonly [string, Taste])[] {
    return [...tastes].filter(([, taste]) => taste.for.some((tag) => tags.includes(tag)));
}

/** The name a component's own taste is written under: its tag, less `ui-`. */
function component(tag: string): string {
    return tag.replace(/^ui-/, '');
}

/** A theme's taste for one moment of one component: its own, or else the page's. */
function tasteOf(taste: Taste, tag: string, moment: string): string | undefined {
    return taste.components?.[component(tag)]?.[moment] ?? taste.moments[moment];
}

/** What runs on one component where nothing is chosen: for each moment a theme has a taste for,
 *  the effect, and whose taste it is. */
type Tasted = Readonly<Record<string, readonly [effect: string, theme: string]>>;

/** What runs where nothing is chosen, on each component of a page, for each moment the page has
 *  a taste for, and whose taste it is: the theme the page is in, over the default theme. A
 *  theme's taste for the page runs over the default theme's for one component, as its block
 *  clears it. Each component's is its own: on a page of two, one can draw while the other springs. */
function taste(tags: readonly string[]): ReadonlyMap<string, Tasted> {
    const now = document.documentElement.dataset['uiTheme'] ?? 'default';

    return new Map(
        tags.map((tag) => {
            const result: Record<string, readonly [string, string]> = {};

            for (const [theme, given] of tastesFor(tags)) {
                if (theme === 'default' || theme === now) {
                    for (const [moment, effect] of Object.entries(given.moments)) {
                        result[moment] = [effect, theme];
                    }

                    for (const [moment, effect] of Object.entries(
                        given.components?.[component(tag)] ?? {},
                    )) {
                        result[moment] = [effect, theme];
                    }
                }
            }

            return [tag, result];
        }),
    );
}

/** Whether a component answers a property at all: every element of the catalogue does, unless
 *  its moment is one element's. */
function answers(slot: Slot, tag: string): boolean {
    return slot.only === undefined || slot.only === tag;
}

/** Whether an effect is one a component offers: for a moment it answers, one it draws, and one its
 *  element is the one it applies to, or one every element of the catalogue offers. */
function applies(effect: Effect, tag: string, slot: Slot): boolean {
    return (
        answers(slot, tag) && drawn(effect) && (effect.only === undefined || effect.only === tag)
    );
}

/** Whether a theme's taste runs an effect other than today's for a property on any component of
 *  the page that answers it: where one does, a choice of today's is written, to run in its place. */
function stands(slot: Slot, theme: ReadonlyMap<string, Tasted>): boolean {
    return [...theme].some(
        ([tag, tasted]) => answers(slot, tag) && offers(slot, tasted[slot.name]?.[0]),
    );
}

/** What a property runs on one component where nothing is picked, and whose taste it is: the
 *  theme's, where the component offers it, or else today's, which is no one's. */
function untouched(
    slot: Slot,
    tag: string,
    tasted: Tasted,
): readonly [effect: string | undefined, theme: string | undefined] {
    const [name, theme] = tasted[slot.name] ?? [];
    const effect = slot.effects.find(
        (candidate) =>
            candidate.name === name && candidate.today !== true && applies(candidate, tag, slot),
    );

    return effect === undefined
        ? [slot.effects.find((candidate) => candidate.today === true)?.name, undefined]
        : [effect.name, theme];
}

/**
 * The effect a property runs on one instance, as the instance reads it — the consumer's choice,
 * else its own taste, under its own name — where its element offers that effect. One drawn on the
 * host is read where the host's own sheet reads it, so its script misses what its sheet misses —
 * S8 — and the two never run different effects for one moment.
 */
function running(slot: Slot, host: HTMLElement): Effect | undefined {
    const offered = (name: string, drawn: boolean): Effect | undefined =>
        slot.effects.find(
            (effect) =>
                effect.name === name &&
                (effect.host === true) === drawn &&
                applies(effect, host.localName, slot),
        );
    const parent = around(host);

    return (
        offered(chosen(host, slot.name), false) ??
        (parent === null
            ? undefined
            : offered(chosen(parent, slot.name, component(host.localName)), true))
    );
}

/**
 * A theme's taste as its block carries it, on the root and under `:where()`: the page's and each
 * component's, in properties no choice is written in. A theme other than the default clears the
 * default theme's taste for one component wherever it names the moment for the page and not for
 * that component, so its own runs there, as it does on every other component.
 */
function tasteSheet(theme: string): string {
    const given = tastes.get(theme);

    if (given === undefined) {
        return '';
    }

    const root = theme === 'default' ? ':root' : `:root[data-ui-theme='${theme}']`;
    const lines = Object.entries(given.moments).map(
        ([moment, effect]) => `    --ui-taste-${moment}: ${effect};`,
    );

    if (theme !== 'default') {
        for (const [name, moments] of Object.entries(tastes.get('default')?.components ?? {})) {
            for (const moment of Object.keys(moments)) {
                if (moment in given.moments && given.components?.[name]?.[moment] === undefined) {
                    lines.push(`    --ui-taste-${name}-${moment}: initial;`);
                }
            }
        }
    }

    for (const [name, moments] of Object.entries(given.components ?? {})) {
        for (const [moment, effect] of Object.entries(moments)) {
            lines.push(`    --ui-taste-${name}-${moment}: ${effect};`);
        }
    }

    return lines.length === 0 ? '' : `:where(${root}) {\n${lines.join('\n')}\n}`;
}

/** Whose choice an effect is, in a badge or a summary. */
function whose(theme: string): string {
    return theme === 'default' ? "the default theme's choice" : `${theme}'s choice`;
}

/**
 * The effect a moment runs on an element, as the element reads it: the consumer's choice, or
 * where none is written, the theme's taste for the component and then for the page.
 */
export function chosen(
    element: Element,
    moment: string,
    name = component(element.localName),
): string {
    const style = getComputedStyle(element);
    const read = (property: string): string => style.getPropertyValue(property).trim();

    return (
        read(`--ui-motion-${moment}`) ||
        read(`--ui-taste-${name}-${moment}`) ||
        read(`--ui-taste-${moment}`)
    );
}

/**
 * Where an effect drawn on a host reads its choice: the host's parent in the flat tree, the slot
 * it is assigned to or else its parent, which holds every choice the host inherits and none
 * written on the host itself — what a style query on `:host` sees, S8 found.
 */
export function around(host: Element): Element | null {
    const parent = host.assignedSlot ?? host.parentNode;

    return parent instanceof ShadowRoot ? parent.host : parent instanceof Element ? parent : null;
}

/**
 * The style query each effect of one component is drawn under, as a function of the moment and
 * the effect: the consumer's choice where one is written, at any scope, and where none is, the
 * theme's taste for the component, then for the page. A bare `style()` asks whether anything is
 * written at all. Each `not` sits in parentheses of its own, which the grammar asks for: without
 * them Chromium and WebKit dropped the rule and Firefox read only its first half — measured.
 */
export function queries(name: string): (moment: string, effect: string) => string {
    return (moment, effect) => {
        const own = `--ui-taste-${name}-${moment}`;

        return `(style(--ui-motion-${moment}: ${effect}) or ((not style(--ui-motion-${moment})) and (style(${own}: ${effect}) or ((not style(${own})) and style(--ui-taste-${moment}: ${effect})))))`;
    };
}

/** A duration token as the element resolves it, in milliseconds. */
export function duration(element: Element, token: string): number {
    const value = getComputedStyle(element).getPropertyValue(token).trim();
    const number = Number.parseFloat(value);

    if (Number.isNaN(number)) {
        return 0;
    }

    return value.endsWith('ms') ? number : number * 1000;
}

/** An easing token as the element resolves it. */
export function easing(element: Element, token: string): string {
    return getComputedStyle(element).getPropertyValue(token).trim() || 'ease';
}

/** Whether motion is off for this reader: their setting, or the frame's switch. */
export function still(): boolean {
    return (
        document.documentElement.hasAttribute('data-reduced') ||
        matchMedia('(prefers-reduced-motion: reduce)').matches
    );
}

/** The element in a shadow root a fired effect animates. */
export function inner(host: Element, selector: string): HTMLElement | null {
    return host.shadowRoot?.querySelector<HTMLElement>(selector) ?? null;
}

/** What listens for the focus's events with {@link heard}, in the order each asked, and the shadow
 *  roots already listened to for the moves that stay inside them. */
const hearers: {
    readonly type: 'focusin' | 'focusout';
    readonly listener: (event: FocusEvent, root: ShadowRoot | undefined) => void;
}[] = [];
const listened = new WeakSet<ShadowRoot>();

/**
 * Listens for the focus's `focusin` or `focusout` wherever the focus moves: on the document, where
 * every moment is listened for, and on each shadow root the focus has been in, for a move that
 * stays inside it. Such a move's event stops at the root, since the host keeps the focus, so the
 * document never hears it: an arrow key moving the focus between a radio group's controls, in all
 * three engines. Each event is heard once, where it stops, and `root` is the shadow root it
 * stopped at, where it stopped at one.
 */
export function heard(
    type: 'focusin' | 'focusout',
    listener: (event: FocusEvent, root: ShadowRoot | undefined) => void,
): void {
    if (hearers.length === 0) {
        document.addEventListener('focusin', listen, { capture: true });
    }

    hearers.push({ type, listener });
    document.addEventListener(
        type,
        (event) => {
            listener(event, undefined);
        },
        { capture: true },
    );
}

/** Listens to each shadow root an event came through that is not listened to yet, for the focus's
 *  moves that stay inside it, and hands each to what asked for it. */
function listen(event: Event): void {
    for (const root of event.composedPath()) {
        if (!(root instanceof ShadowRoot) || listened.has(root)) {
            continue;
        }

        listened.add(root);

        for (const type of ['focusin', 'focusout'] as const) {
            root.addEventListener(
                type,
                (moved) => {
                    // Only a move that stopped here: one that went on is heard further out.
                    if (!(moved instanceof FocusEvent) || moved.composedPath().at(-1) !== root) {
                        return;
                    }

                    listen(moved);

                    for (const hearer of hearers) {
                        if (hearer.type === type) {
                            hearer.listener(moved, root);
                        }
                    }
                },
                { capture: true },
            );
        }
    }
}

/** The replay each mark on an element last took, so the one a replay cancels clears nothing. */
const turns = new WeakMap<HTMLElement, Map<string, symbol>>();

/**
 * Plays, from its start, the animation the sheet declares under `[data-fx='name']`, and clears
 * the mark once that animation is over, ended or cancelled. **The sheet owns the effect and the
 * script only the moment**: what moves, how far and on which duration token are CSS, so the
 * collapse reaches them, and all the script adds is a start that outlives the state — which S7
 * found `:active` cannot give.
 *
 * **One element can carry effects of several kinds at once**, each under a mark of its own, so
 * a mark goes when its own animation is over — `ui-<name>`, the name every sheet here gives it —
 * and not when the first animation on the element or its layers is. Where another animation
 * on the element shares the name, the layer the mark's plays on is named too: a drawn control's
 * pointer plays the pulse on the control, and its check plays it on the control's `::after`.
 *
 * **A replay takes the mark over**: an effect fired again, or another of the same kind, cancels
 * the animation the mark was playing, and that animation leaves the mark to the replay.
 */
export function replay(target: HTMLElement, name: string, mark = 'data-fx', on?: string): void {
    target.removeAttribute(mark);
    // Read layout once, so the removal is seen before the mark comes back: without it the
    // two writes land in the same frame and the animation never restarts.
    target.getBoundingClientRect();
    const before = new Set(target.getAnimations({ subtree: true }));
    target.setAttribute(mark, name);

    const turn = Symbol(name);
    const marks = turns.get(target) ?? new Map<string, symbol>();
    turns.set(target, marks.set(mark, turn));

    const clear = (): void => {
        if (marks.get(mark) === turn) {
            target.removeAttribute(mark);
        }
    };

    // The animation the mark started, which `getAnimations` has just started by flushing the
    // mark's style: the one that was not running a moment ago.
    const started = target
        .getAnimations({ subtree: true })
        .find(
            (animation) =>
                !before.has(animation) &&
                animation instanceof CSSAnimation &&
                animation.animationName === `ui-${name}` &&
                (on === undefined ||
                    (animation.effect instanceof KeyframeEffect &&
                        animation.effect.pseudoElement === on)),
        );

    if (started !== undefined) {
        // Cleared when it is cancelled too. An element that stops being drawn cancels its
        // animation, which fires no end, and before the animation's first frame no event at
        // all: a dialog closed by one of its buttons left the press's mark on the button, and
        // opening the dialog again played the press again — measured in all three engines.
        started.finished.then(clear, clear);
        return;
    }

    // None started, the element not drawn or the sheet declaring nothing under the mark, so
    // the mark waits for its animation's end, whenever one comes.
    const done = (event: AnimationEvent): void => {
        if (
            event.animationName === `ui-${name}` &&
            (on === undefined || event.pseudoElement === on)
        ) {
            clear();
            target.removeEventListener('animationend', done);
        }
    };

    target.addEventListener('animationend', done);
}

/** Where an effect travels, by the direction chosen beside it, as a step on each axis. */
const travels: Readonly<Record<string, readonly [number, number]>> = {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0],
};

/** The curves a reader can choose for an effect, by name. */
const curves: Readonly<Record<string, string>> = {
    linear: 'linear',
    'ease-in-out': 'ease-in-out',
};

/** The way a moment's effect travels, by the direction chosen for it: a step on each axis, or
 *  nothing where the effect keeps its own. */
export function travel(element: Element, moment: string): readonly [number, number] | undefined {
    return travels[chosen(element, `${moment}-direction`)];
}

/** The curve chosen for a moment's effect, or nothing where the effect keeps its own. */
export function curve(element: Element, moment: string): string | undefined {
    return curves[chosen(element, `${moment}-curve`)];
}

/** The reference's orders for breaking a thing apart: along a wind, out from its middle, or each
 *  piece where it lies, at random. */
export type Order = 'wind' | 'middle' | 'random';

/** A surface broken into pieces where it is, or put together from them. */
export interface Pieces {
    /** The instance, which the pieces go beside in the tree, so the rules its content takes
     *  reach theirs. */
    readonly host: HTMLElement;
    /** What the pieces go after in its place, where nothing beside the instance is drawn: a
     *  toast is assigned to a slot of its toaster's, and pieces beside it, assigned to none,
     *  showed nothing in Chromium and Firefox — measured. */
    readonly after?: Element | undefined;
    /** What the pieces stand for: measured, and transparent while they come together. */
    readonly surface: HTMLElement;
    /** A copy of the surface, for one piece to show its own cell of. */
    readonly copy: () => HTMLElement;
    readonly order: Order;
    /** The way the wind blows, a step on each axis, which a wind's pieces fly along. */
    readonly wind: readonly [number, number];
    /** Put together from the pieces, rather than broken into them: every flight run backward. */
    readonly together: boolean;
    /** The curve every piece flies on; the reference's, run the way the flight runs, where
     *  none is chosen. */
    readonly easing?: string | undefined;
    /** How long the pieces take, in milliseconds, whatever the order: put together, until the
     *  last has landed, and broken, until the last has gone. */
    readonly length?: number | undefined;
    /** How the surface is cut, rows by columns: six by six, the reference's, unless given. */
    readonly grid?: readonly [rows: number, columns: number] | undefined;
}

/** One piece: its cell, and its flight — when it leaves, for how long, and where to. */
interface Piece {
    readonly row: number;
    readonly column: number;
    readonly delay: number;
    readonly length: number;
    readonly dx: number;
    readonly dy: number;
    readonly turn: number;
}

/** Pieces a side, thirty-six in all, as the reference cuts them. */
const side = 6;

/** Every piece's flight, in the reference's own milliseconds and pixels, but for the pace of the
 *  random order. Where a cell lies is counted in the reference's six steps across and down, so a
 *  surface cut otherwise flies as one cut six by six does. */
function flights(
    order: Order,
    wind: readonly [number, number],
    [rows, columns]: readonly [number, number],
): Piece[] {
    const random = (from: number, to: number): number => from + Math.random() * (to - from);
    const steps = (at: number, count: number): number =>
        count === 1 ? (side - 1) / 2 : (at * (side - 1)) / (count - 1);
    const plan: Piece[] = [];

    for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
            const length = 520 + random(0, 260);
            const x = steps(column, columns);
            const y = steps(row, rows);

            if (order === 'wind') {
                // How far along the wind the piece lies, from the side it blows from: that side
                // goes first, and what lies further on flies further.
                const along =
                    wind[0] > 0 ? x : wind[0] < 0 ? side - 1 - x : wind[1] > 0 ? y : side - 1 - y;
                const reach = 90 + along * 12;
                const drift = random(-14, 14);
                plan.push({
                    row,
                    column,
                    delay: along * 34 + random(0, 40),
                    length,
                    dx: wind[0] === 0 ? drift : wind[0] * reach,
                    dy: wind[1] === 0 ? drift : wind[1] * reach,
                    turn: random(-25, 25),
                });
            } else if (order === 'middle') {
                // The middle goes first, and each piece flies straight out from it.
                const down = y - (side - 1) / 2;
                const across = x - (side - 1) / 2;
                plan.push({
                    row,
                    column,
                    delay: Math.hypot(down, across) * 26,
                    length,
                    dx: across * 16,
                    dy: down * 16,
                    turn: random(-60, 60),
                });
            } else {
                // A quarter quicker than the reference's, for a breaking: put together, every
                // order is fitted to one time anyway. Each piece waits up to 620ms before it goes,
                // on top of the flight every order has, so at the reference's pace the last would
                // vanish at about 1.3s, against 0.95s along a wind; at this one, about where a
                // wind's does.
                plan.push({
                    row,
                    column,
                    delay: random(0, 620) * 0.75,
                    length: length * 0.75,
                    dx: 0,
                    dy: 0,
                    turn: 0,
                });
            }
        }
    }

    return plan;
}

/** What a breaking or a dissolve leaves running on a surface: how to end it, so the next can
 *  end it first, and when it is over. */
const breaking = new WeakMap<
    HTMLElement,
    { readonly end: () => void; readonly finished: Promise<void> }
>();

/**
 * Breaks a surface into pieces where it is, or puts it together from them: the reference's
 * disintegration, run forward or backward. Six by six copies of the surface, or as many as its own
 * cut asks for, each cut to its own cell, fly off along the order's paths, shrinking and fading;
 * put together, every flight runs
 * backward — what left last arrives first — and the surface shows once every piece has landed.
 * Either way the flights are scaled by the duration token, so the collapse reaches them. Put
 * together, the last piece lands when a refocus would have arrived, whatever the order, because
 * the surface is not there until it has; broken, the pieces keep the reference's pace. Given a
 * length, as the dialog gives its step, they are fitted to it either way.
 *
 * In script, as the reference's is: a sheet cannot copy an element. The pieces go in the top
 * layer, which a modal and its backdrop are in and the rest of the page paints under, and beside
 * the instance in the tree, so they inherit what its content inherits. They are inert and hidden
 * from a reader of the page, who meets the surface whole: transparent while the pieces come
 * together, never removed. For a reader who asked for less motion there are no pieces.
 */
export function pieces(how: Pieces): void {
    const { host, surface, together } = how;
    restore(surface);
    const box = surface.getBoundingClientRect();

    if (still() || box.width === 0 || box.height === 0) {
        return;
    }

    const [rows, columns] = how.grid ?? [side, side];
    const plan = flights(how.order, how.wind, [rows, columns]);
    const end = Math.max(...plan.map((piece) => piece.delay + piece.length));
    // Put together, from the first piece setting off to the last landing.
    const span = end - Math.min(...plan.map((piece) => piece.delay));
    const scale = together
        ? (how.length ?? duration(host, '--ui-duration-400') * 1.25) / span
        : how.length === undefined
          ? duration(host, '--ui-duration-400') / 520
          : how.length / end;
    const ratio = devicePixelRatio;
    /*
     * Where a cut falls, from the surface's edge: on a device pixel, so two pieces side by side
     * meet without a seam. A cut between pixels leaves each piece half over the one it crosses,
     * and two halves over each other let what is behind show through — a grid of faint lines on
     * the surface until the pieces are taken away, measured in Firefox. An outer edge is not cut
     * at all: it lies 3rem out, so a glow or a ring drawn past the surface goes with its piece.
     */
    const past = 3 * Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
    const cut = (origin: number, length: number, at: number, count: number): number =>
        at === 0
            ? -past
            : at === count
              ? length + past
              : Math.round((origin + (length * at) / count) * ratio) / ratio - origin;
    const flock = document.createElement('div');
    flock.dataset['fragments'] = '';
    flock.popover = 'manual';
    flock.inert = true;
    flock.setAttribute('aria-hidden', 'true');
    // The top layer's own box undone: no edge, padding, ground or scroll of its own. And no
    // entrance: a copy of an instance is an instance, and would arrive in turn.
    flock.style.cssText = `position: fixed; inset: auto; left: ${String(box.left)}px; top: ${String(box.top)}px; width: ${String(box.width)}px; height: ${String(box.height)}px; margin: 0; padding: 0; border: 0; background: none; color: inherit; overflow: visible; pointer-events: none; --ui-motion-enter: none;`;

    const animations = plan.flatMap((piece) => {
        const left = cut(box.left, box.width, piece.column, columns);
        const top = cut(box.top, box.height, piece.row, rows);
        const width = cut(box.left, box.width, piece.column + 1, columns) - left;
        const height = cut(box.top, box.height, piece.row + 1, rows) - top;
        /*
         * A cell cut by its own box rather than by clip-path, which left the seam in WebKit even on
         * a device pixel; and faded through its copy rather than itself. In Chromium a clip-path
         * or a moving opacity makes the cell a backdrop root, and the copy of a glass surface then
         * blurs nothing behind it: with both, the page showed through every piece, measured. It
         * turns about the surface's middle, as a whole copy would.
         */
        const cell = document.createElement('div');
        cell.style.cssText = `position: absolute; left: ${String(left)}px; top: ${String(top)}px; width: ${String(width)}px; height: ${String(height)}px; overflow: hidden; transform-origin: ${String(box.width / 2 - left)}px ${String(box.height / 2 - top)}px;`;
        const copy = how.copy();
        copy.style.position = 'absolute';
        copy.style.left = `${String(-left)}px`;
        copy.style.top = `${String(-top)}px`;
        copy.style.width = `${String(box.width)}px`;
        copy.style.height = `${String(box.height)}px`;
        cell.append(copy);
        flock.append(cell);

        const away = `translate(${piece.dx.toFixed(1)}px, ${piece.dy.toFixed(1)}px) rotate(${piece.turn.toFixed(1)}deg) scale(0.72)`;
        const timing: KeyframeAnimationOptions = {
            duration: piece.length * scale,
            delay: (together ? end - piece.delay - piece.length : piece.delay) * scale,
            // The reference's curve, reversed with its flight.
            easing:
                how.easing ??
                (together ? 'cubic-bezier(0.4, 0, 0.7, 0.9)' : 'cubic-bezier(0.3, 0.1, 0.6, 1)'),
            // A piece waits where its flight starts, and one that has gone stays gone.
            fill: together ? 'backwards' : 'both',
        };

        return [
            cell.animate(
                together
                    ? [{ transform: away }, { transform: 'none' }]
                    : [{ transform: 'none' }, { transform: away }],
                timing,
            ),
            copy.animate(
                together ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }],
                timing,
            ),
        ];
    });

    (how.after ?? host).after(flock);
    flock.showPopover();
    // The surface stands aside while its pieces stand for it: until they have landed, or, broken,
    // for good — it stays gone until it is restored, as a dissolved one does.
    surface.style.opacity = '0';

    const whole = (): void => {
        flock.remove();
        surface.style.removeProperty('opacity');
        breaking.delete(surface);
    };

    breaking.set(surface, {
        end: () => {
            for (const animation of animations) {
                animation.cancel();
            }

            whole();
        },
        finished: Promise.all(animations.map((animation) => animation.finished)).then(
            () => {
                if (together) {
                    whole();
                } else {
                    flock.remove();
                }
            },
            () => {
                // Cancelled by the next, which has already put the surface back.
            },
        ),
    });
}

/** A surface dissolved into grain where it is, or brought out of it. */
export interface Dissolving {
    /** The instance, whose duration and curve tokens the dissolve runs on. */
    readonly host: HTMLElement;
    /** What dissolves. */
    readonly surface: HTMLElement;
    /** Brought out of the grain, rather than dissolved into it. */
    readonly together: boolean;
    /** The curve the threshold moves on; linear, as the reference's is, where none is chosen.
     *  The grain is already sparse at both ends of its span, so the moment's curve on top eases
     *  it twice: under the exit's, a dialog's panel lost its first hundredth 149ms into 780,
     *  and at linear 45ms in. */
    readonly easing?: string | undefined;
    /** How long the threshold takes over its span, in milliseconds; a step and a half of the
     *  longest step where none is given. */
    readonly length?: number | undefined;
}

/** How hard a grain's edge is: the noise times this turns its ramp into a step. */
const gain = 6;

/*
 * The span of the threshold a dissolve moves through: the grain's, not the whole of it. Nothing
 * had changed below 0.25 and everything had by 0.725, on the card and on the dialog's panel, in
 * every theme and in both engines measured; time spent outside that is time with nothing moving,
 * which an exit shows as a wait before it starts. The span keeps a little margin either side,
 * and the ends are exact: whole before, gone after.
 */
const span = [0.22, 0.75] as const;

/** How many dissolves have run, which names each one's filter. */
let dissolves = 0;

/** Sets an SVG element's attributes, which have no properties to set them by. */
export function attributes(element: Element, values: Readonly<Record<string, string>>): void {
    for (const [name, value] of Object.entries(values)) {
        element.setAttribute(name, value);
    }
}

/**
 * Dissolves a surface into grain where it is, or brings it out of the grain: the reference's
 * cheaper way, one element under a filter and no copy at all. Noise from feTurbulence becomes the
 * surface's alpha through a colour matrix — `gain × noise + offset`, held between 0 and 1 — and
 * the offset is a threshold: moved from 1, where every pixel is whole, to −gain, where none is
 * left, it eats the surface grain by grain. Whatever the surface draws goes with it, a glow or a
 * glass included, and none of it goes anywhere: the reference's own note, the price of the saving
 * is that no grain can be sent one way and another the other.
 *
 * In script, as the reference's is: the threshold is an attribute of the filter, which neither a
 * sheet nor an animation can move. It follows an animation with no target instead, which brings
 * the duration token and the curve, and a frame callback copies that animation's progress into
 * the matrix. Brought out of the grain, the surface goes back to its own drawing; dissolved, it
 * stays gone until it is restored. For a reader who asked for less motion nothing dissolves.
 */
export function dissolve(how: Dissolving): void {
    const { host, surface, together } = how;
    restore(surface);

    if (still()) {
        return;
    }

    dissolves += 1;
    const id = `ui-dissolve-${String(dissolves)}`;
    const svg = 'http://www.w3.org/2000/svg';
    const holder = document.createElementNS(svg, 'svg');
    attributes(holder, {
        'aria-hidden': 'true',
        style: 'position: absolute; width: 0; height: 0;',
    });
    const filter = document.createElementNS(svg, 'filter');
    // Room round the surface for a glow, which the default tenth would cut; and the surface's
    // own colours, which a round trip through linearRGB shifted, measured in Firefox.
    attributes(filter, {
        id,
        x: '-25%',
        y: '-25%',
        width: '150%',
        height: '150%',
        'color-interpolation-filters': 'sRGB',
    });
    const noise = document.createElementNS(svg, 'feTurbulence');
    attributes(noise, {
        type: 'fractalNoise',
        baseFrequency: '0.62',
        numOctaves: '1',
        seed: String(Math.floor(Math.random() * 1000)),
        result: 'grain',
    });
    const matrix = document.createElementNS(svg, 'feColorMatrix');
    attributes(matrix, { in: 'grain', type: 'matrix', result: 'mask' });
    const kept = document.createElementNS(svg, 'feComposite');
    attributes(kept, { in: 'SourceGraphic', in2: 'mask', operator: 'in' });
    filter.append(noise, matrix, kept);
    holder.append(filter);

    /** Where the threshold is: at 0 every pixel is whole, and at 1 none is left. */
    const at = (threshold: number): void => {
        matrix.setAttribute(
            'values',
            `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${String(gain)} 0 0 0 ${(1 - (gain + 1) * threshold).toFixed(3)}`,
        );
    };

    at(together ? 1 : 0);
    // In the surface's own tree, which is where a reference from its style looks: a filter in
    // the document filtered nothing in a shadow root, in all three engines measured, and a
    // dialog's panel is in one.
    const tree = surface.getRootNode();
    (tree instanceof ShadowRoot ? tree : document.body).append(holder);
    surface.style.filter = `url(#${id})`;

    const timing = new Animation(
        new KeyframeEffect(null, null, {
            // A step and a half, longer than the grain moved for in the reference: 900ms over
            // the whole threshold, of which it moved through only half.
            duration: how.length ?? duration(host, '--ui-duration-400') * 1.5,
            easing: how.easing ?? 'linear',
            fill: 'forwards',
        }),
    );
    let frame = 0;
    const step = (): void => {
        const progress = timing.effect?.getComputedTiming().progress ?? 0;
        const [from, to] = span;
        at(from + (to - from) * (together ? 1 - progress : progress));

        if (timing.playState === 'running') {
            frame = requestAnimationFrame(step);
        }
    };
    const clear = (): void => {
        cancelAnimationFrame(frame);
        surface.style.removeProperty('filter');
        holder.remove();
        breaking.delete(surface);
    };

    timing.play();
    frame = requestAnimationFrame(step);
    breaking.set(surface, {
        end: () => {
            timing.cancel();
            clear();
        },
        finished: timing.finished.then(
            () => {
                cancelAnimationFrame(frame);

                if (together) {
                    clear();
                } else {
                    at(1);
                }
            },
            () => {
                // Ended before it finished, by whatever restored the surface.
            },
        ),
    });
}

/** Puts a surface back whole: ends whatever breaking or dissolve is running on it, or undoes one
 *  that finished and left it gone. */
export function restore(surface: HTMLElement): void {
    breaking.get(surface)?.end();
}

/** When whatever is running on a surface is over: at once, where nothing is. */
export function settled(surface: HTMLElement): Promise<void> {
    return breaking.get(surface)?.finished ?? Promise.resolve();
}

/** What a page can ask of its prototype once it is drawn. */
export interface Page {
    /** Takes an instance off the page as a component that owned its removal would: the exit
     *  plays, and the instance goes once it has finished. */
    readonly remove: (host: HTMLElement) => Promise<void>;
}

const scopes: readonly Scope[] = ['page', 'region', 'type', 'instance'];

/** Renders the page around a catalogue and wires what the catalogue needs. */
export function prototype(catalogue: Catalogue): Page {
    const tags = catalogue.tags;
    const choices = new Map<string, Choice>(
        catalogue.moments.map((moment) => [moment.name, { picks: new Map(), scope: 'page' }]),
    );

    const selector: Record<Scope, string> = {
        page: ':root',
        region: '.region',
        type: tags.join(', '),
        instance: '#chosen',
    };

    const consumer = document.createElement('style');
    document.head.append(consumer);

    // The tastes this page's components are given, every theme's at once: each block is under
    // its own theme's attribute but the default theme's, which comes first.
    const defaults = document.createElement('style');
    defaults.textContent = tastesFor(tags)
        .map(([theme]) => tasteSheet(theme))
        .join('\n\n');
    consumer.before(defaults);

    /** The CSS a consumer writes for the current choices: nothing where nothing is picked, and
     *  nothing for today's behaviour unless the theme's taste would run in its place. */
    const written = (): string => {
        const blocks = new Map<string, string[]>();
        const theme = taste(tags);

        for (const moment of catalogue.moments) {
            const choice = choices.get(moment.name);

            for (const slot of slots(moment)) {
                const effect = slot.effects.find(
                    (candidate) => candidate.name === choice?.picks.get(slot.name),
                );

                if (
                    choice === undefined ||
                    effect === undefined ||
                    (effect.today === true && !stands(slot, theme))
                ) {
                    continue;
                }

                const block = blocks.get(selector[choice.scope]) ?? [];
                block.push(`    --ui-motion-${slot.name}: ${effect.name};`);
                blocks.set(selector[choice.scope], block);
            }
        }

        return [...blocks]
            .map(([where, lines]) => `${where} {\n${lines.join('\n')}\n}`)
            .join('\n\n');
    };

    /** A sheet of these rules, for an element to adopt. */
    const adoptable = (rules: string): CSSStyleSheet => {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(rules);

        return sheet;
    };

    /** The sheet each element adopts, by its tag: the catalogue's one, or the copy written for
     *  the name the element asks for its tastes under. */
    const sheets = new Map<string, CSSStyleSheet>();
    let shared: CSSStyleSheet | undefined;

    for (const tag of tags) {
        const { sheet } = catalogue;
        sheets.set(
            tag,
            typeof sheet === 'string'
                ? (shared ??= adoptable(sheet))
                : adoptable(sheet(component(tag))),
        );
    }

    if (catalogue.where === 'document') {
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...new Set(sheets.values())];
    }

    /** One of the layers the component would render, empty until an effect draws on it. */
    const layer = (name: string): HTMLElement => {
        const element = document.createElement('span');
        element.dataset['layer'] = name;
        element.setAttribute('aria-hidden', 'true');

        return element;
    };

    /** The control an instance's moments are answered on: the one the catalogue names, or else
     *  the instance, any control in it. */
    const answering = (host: HTMLElement): Element | null =>
        catalogue.control === undefined ? host : inner(host, catalogue.control);

    /** Whether an event happened on that control: on its path, or, for a move of the focus that
     *  stopped at `root`, inside the instance that is the control. */
    const within = (event: Event, host: HTMLElement, root?: ShadowRoot): boolean => {
        const control = answering(host);

        return (
            control !== null && (event.composedPath().includes(control) || control === root?.host)
        );
    };

    /*
     * The pointer's arrival on a named control, and the host's record of the pointer on it. The
     * host's own :hover takes in everything the host holds, and the menu's holds its panel; and a
     * pointer arriving on a control in the shadow root is not heard from the document, where the
     * other moments are: pointerenter is not composed, in all three engines — measured. So the
     * control is listened to itself, as the component would listen to it, and the attribute
     * stands in for the state it would set from the same event: :host(:state(hover)).
     */
    const point = (host: HTMLElement): void => {
        const control = catalogue.control === undefined ? null : inner(host, catalogue.control);

        control?.addEventListener('pointerenter', (event) => {
            // A finger has no hover, so it arrives only to press. And the pointer arrives once,
            // while it is not on the control yet: Chromium dispatches two of these as it
            // arrives, where Firefox and WebKit dispatch one — measured.
            if (
                event.pointerType === 'touch' ||
                host.hasAttribute('data-hover') ||
                disabled(event)
            ) {
                return;
            }

            host.setAttribute('data-hover', '');

            // The focus wins: on a control the reader can see the focus on, the pointer's arrival
            // plays nothing of the pointer's.
            if (host.hasAttribute('data-focus-visible')) {
                return;
            }

            for (const moment of catalogue.moments) {
                if (moment.on === 'enter') {
                    for (const slot of slots(moment)) {
                        running(slot, host)?.fire?.({ host, event });
                    }
                }
            }
        });
        control?.addEventListener('pointerleave', () => {
            host.removeAttribute('data-hover');
        });
    };

    /** Adopts the element's sheet into one instance's shadow root, once, renders its layers there
     *  after what the component rendered, and listens to the control it names. */
    const adopt = async (element: Element): Promise<void> => {
        if (catalogue.where === 'document' || !(element instanceof LitElement)) {
            return;
        }

        await element.updateComplete;
        const root = element.shadowRoot;
        const sheet = sheets.get(element.localName);

        if (root !== null && sheet !== undefined && !root.adoptedStyleSheets.includes(sheet)) {
            root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];

            if (catalogue.layered === undefined || catalogue.layered === element.localName) {
                root.append(...(catalogue.layers ?? []).map(layer));
            }

            point(element);
        }
    };

    /** The instances on the page, leaving out the copies an effect makes of one to draw with, and
     *  any the page is taking away. */
    const instances = (): HTMLElement[] =>
        [...document.querySelectorAll<HTMLElement>(tags.join(', '))].filter(
            (element) =>
                element.closest('[data-fragments]') === null &&
                !element.hasAttribute('data-leaving'),
        );

    /** Fires every moment of arrival on an instance just inserted: the effect chosen for each
     *  of its properties, where that effect is fired rather than drawn. */
    const arrive = (host: HTMLElement): void => {
        if (host.closest('[data-fragments]') !== null) {
            return;
        }

        for (const moment of catalogue.moments) {
            if (moment.on !== 'arrive') {
                continue;
            }

            for (const slot of slots(moment)) {
                running(slot, host)?.fire?.({ host, event: new Event('arrive') });
            }
        }
    };

    const adoptWithin = (node: Node): void => {
        if (!(node instanceof Element)) {
            return;
        }

        for (const element of [node, ...node.querySelectorAll(tags.join(', '))]) {
            if (tags.includes(element.localName) && element instanceof HTMLElement) {
                void adopt(element).then(() => {
                    arrive(element);
                });
            }
        }
    };

    /** Plays an instance's exit, and resolves once it is over. The instance is marked, which is
     *  what an exit the sheet draws waits for — the state a component that owned its removal would
     *  set, `:state(leaving)` — and the effect chosen for each property of every moment of leaving
     *  is fired; then whatever either left running on the instance is waited out. */
    const leave = async (host: HTMLElement): Promise<void> => {
        host.dataset['leaving'] = '';

        for (const moment of catalogue.moments) {
            if (moment.on !== 'leave') {
                continue;
            }

            for (const slot of slots(moment)) {
                running(slot, host)?.fire?.({ host, event: new Event('leave') });
            }
        }

        // The sheet's exit has started with the mark: asking for the animations settles the style.
        await Promise.all([
            settled(host),
            ...host.getAnimations().map(async (animation) => {
                await animation.finished.catch(() => undefined);
            }),
        ]);
    };

    /** The node an instance goes back before: its next sibling, past the pieces an effect has put
     *  beside it, which go when the effect is ended. */
    const after = (element: Element): Node | null => {
        let next = element.nextSibling;

        while (next instanceof Element && next.hasAttribute('data-fragments')) {
            next = next.nextSibling;
        }

        return next;
    };

    /*
     * A choice made for a moment of arrival is shown at once, as a focus effect is: every
     * instance is taken out and put back where it was, so each arrives again — an entrance the
     * sheet draws plays from its start, and one a script draws is fired. A choice made for a
     * moment of leaving takes every instance out through its exit first, and each is made whole
     * while it is out, so it comes back as it would arrive. Last first, so an instance whose next
     * sibling is another goes back before it.
     */
    const again = async (leaving: boolean): Promise<void> => {
        const all = instances();

        if (leaving) {
            await Promise.all(all.map(leave));
        }

        // Still on the page: one the page took away meanwhile stays away.
        const placed = all
            .filter((element) => element.isConnected)
            .map((element) => ({ element, parent: element.parentNode, next: after(element) }));

        for (const { element } of placed) {
            element.remove();
            delete element.dataset['leaving'];
            restore(element);
        }

        for (const { element, parent, next } of placed.reverse()) {
            parent?.insertBefore(element, next);
        }
    };

    adoptWithin(document.body);
    new MutationObserver((records) => {
        for (const record of records) {
            record.addedNodes.forEach(adoptWithin);
        }
    }).observe(document.body, { childList: true, subtree: true });

    /** The instance an event happened in, if it is one of this catalogue's: on its path, or the
     *  host of the shadow root a move of the focus stopped at, `root`. */
    const hostOf = (event: Event, root?: ShadowRoot): HTMLElement | undefined =>
        [...event.composedPath(), ...(root === undefined ? [] : [root.host])].find(
            (node): node is HTMLElement =>
                node instanceof HTMLElement && tags.includes(node.localName),
        );

    /*
     * The host's own record of a focus the reader can see, for an effect drawn on the host
     * rather than inside it. No engine lets a host match :focus-visible for a control in its
     * shadow root — it matches :focus and :focus-within, which a click sets too — so the
     * attribute stands in for the custom state a component would set from the same event:
     * :host(:state(focus-visible)). Only for the control the catalogue names, where it names one:
     * a focus on one of the menu's items is not its trigger's. Written before any effect of the
     * focus fires, so an effect drawn on the host has begun by the time a fired one asks what the
     * focus began: written after, the ring's none missed the comet a button and a checkbox draw on
     * the host, and brought the ring back once the burst was over — measured. Rewritten as the
     * focus moves inside the host, which a click on another of a radio group's controls leaves
     * without one.
     */
    heard('focusin', (event, root) => {
        const host = hostOf(event, root);
        const target = event.composedPath()[0];

        if (host !== undefined && target instanceof Element) {
            host.toggleAttribute(
                'data-focus-visible',
                within(event, host, root) && target.matches(':focus-visible'),
            );
        }
    });
    document.addEventListener(
        'focusout',
        (event) => {
            const host = hostOf(event);
            host?.removeAttribute('data-focus-visible');
            host?.removeAttribute('data-pressed');

            if (host !== undefined) {
                spaced.delete(host);
            }
        },
        { capture: true },
    );

    for (const moment of catalogue.moments) {
        if (moment.on === undefined) {
            continue;
        }

        for (const [type, counts] of triggers(moment.on)) {
            const answer = (event: Event, root?: ShadowRoot): void => {
                const host = hostOf(event, root);

                if (
                    host === undefined ||
                    !within(event, host, root) ||
                    !counts(event, host) ||
                    disabled(event)
                ) {
                    return;
                }

                for (const slot of slots(moment)) {
                    running(slot, host)?.fire?.({ host, event });
                }
            };

            // The focus is heard as it moves inside an instance too: an arrow key takes it to
            // another of a radio group's controls, which is a focus arriving.
            if (type === 'focusin') {
                heard(type, answer);
            } else {
                document.addEventListener(type, answer, { capture: true });
            }
        }
    }

    /*
     * The host's record of a press a key holds, for the same reason: the control is :active while
     * Space holds it and the host is not, in Chromium and WebKit — measured — and a pointer's
     * press makes both. Read once the key's own default has made the control :active, so where
     * it does not, the host is not marked either: :host(:state(pressed)), in a component.
     */
    document.addEventListener(
        'keydown',
        (event) => {
            const host = hostOf(event);
            const target = event.composedPath()[0];

            if (
                event.key === ' ' &&
                host !== undefined &&
                target instanceof Element &&
                within(event, host)
            ) {
                setTimeout(() => {
                    host.toggleAttribute('data-pressed', target.matches(':active'));
                });
            }
        },
        { capture: true },
    );
    document.addEventListener(
        'keyup',
        (event) => {
            const host = hostOf(event);

            if (event.key === ' ' && host !== undefined) {
                host.removeAttribute('data-pressed');
                // After the click the key makes coming up, which its own up dispatches, so that
                // one is told apart; and no later click, where none came.
                setTimeout(() => {
                    spaced.delete(host);
                });
            }
        },
        { capture: true },
    );

    follow(catalogue, hostOf);

    /*
     * A focus effect chosen with the pointer is shown at once: the first instance the choice
     * reaches takes a focus the reader can see, as a Tab would give it. A script's focus after
     * a click matches no :focus-visible in any engine unless it asks to — measured in all
     * three. After the click has finished choosing, and once: a click on an option's text
     * reaches the radio as a second click. Away first, for an engine whose click leaves the
     * focus where it was: a focus that does not move does not arrive again. An instance with no
     * control of its own, a card, is shown the focus on the first one it holds.
     */
    let judging = false;
    const judge = (scope: Scope): void => {
        if (judging) {
            return;
        }

        judging = true;
        setTimeout(() => {
            judging = false;
            const where = selector[scope];
            const instance = document.querySelector(
                `:is(${tags.join(', ')}):is(${where}, ${where} *):not([disabled])`,
            );
            const control =
                instance?.shadowRoot?.querySelector<HTMLElement>(
                    catalogue.control ?? `${reachable}:not(:disabled)`,
                ) ?? (instance === null ? null : held(instance));

            control?.blur();
            control?.focus({ focusVisible: true });
        });
    };

    const redraw = (): void => {
        const css = written();
        consumer.textContent = css;
        draw(catalogue, choices, css, redraw, judge, (leaving) => {
            void again(leaving);
        });
    };

    let tasted = taste(tags);
    frame(() => {
        const before = tasted;
        tasted = taste(tags);
        redraw();

        // A taste for an arrival or a departure is seen as instances arrive and leave.
        const moved = catalogue.moments.filter(
            (moment) =>
                (moment.on === 'arrive' || moment.on === 'leave') &&
                slots(moment).some((slot) =>
                    [...tasted].some(
                        ([tag, now]) =>
                            answers(slot, tag) &&
                            before.get(tag)?.[slot.name]?.[0] !== now[slot.name]?.[0],
                    ),
                ),
        );

        if (moved.length > 0) {
            void again(moved.some((moment) => moment.on === 'leave'));
        }
    });
    hold();
    redraw();

    return {
        remove: async (host) => {
            await leave(host);
            host.remove();
            restore(host);
        },
    };
}

/** What a reader reaches by Tab in an instance, as the components render it. */
const reachable = ':is(button, input, select, textarea)';

/** The first control an element holds, its own or one a component it holds renders: where a
 *  focus in a card is shown. */
function held(element: Element): HTMLElement | null {
    for (const each of element.querySelectorAll('*')) {
        if (each instanceof HTMLElement && each.matches(`${reachable}:not(:disabled)`)) {
            return each;
        }

        const inside = each.shadowRoot?.querySelector<HTMLElement>(`${reachable}:not(:disabled)`);

        if (inside !== undefined && inside !== null) {
            return inside;
        }
    }

    return null;
}

/** What Space presses: a button, and the inputs it clicks. */
const pressable =
    'button, input:is([type="button" i], [type="submit" i], [type="reset" i], [type="checkbox" i], [type="radio" i])';

/** The instances Space has pressed, until the click it makes coming up, which is no press of its
 *  own; or, where none comes, until the key is up or the focus has gone. */
const spaced = new WeakSet<HTMLElement>();

/** The events a moment fires on, each with the test an event of that type has to pass. */
function triggers(on: string): [string, (event: Event, host: HTMLElement) => boolean][] {
    if (on === 'press') {
        return [
            ['pointerdown', (event) => event instanceof PointerEvent && event.button === 0],
            // Space going down, as a pointer does: not again for a key held, whose down repeats,
            // and only on a control Space presses, which a field it types into is not.
            [
                'keydown',
                (event, host) => {
                    const target = event.composedPath()[0];
                    const pressing =
                        event instanceof KeyboardEvent &&
                        event.key === ' ' &&
                        !event.repeat &&
                        target instanceof Element &&
                        target.matches(pressable);

                    if (pressing) {
                        spaced.add(host);
                    }

                    return pressing;
                },
            ],
            // The click another key makes, and a script's: a pointer's has a count, and so does
            // none of these. Not the one Space makes coming up, whose press was answered going
            // down.
            [
                'click',
                (event, host) =>
                    event instanceof MouseEvent && event.detail === 0 && !spaced.delete(host),
            ],
        ];
    }

    if (on === 'focus') {
        return [
            [
                'focusin',
                // A focus the reader can see: the platform already knows, inside the shadow
                // root, by the time the event arrives — and a clicked button's focus is not one.
                (event) => {
                    const target = event.composedPath()[0];

                    return target instanceof Element && target.matches(':focus-visible');
                },
            ],
        ];
    }

    // An arrival and a departure are no events: the page fires each as it adopts an instance
    // or takes one away.
    if (on === 'arrive' || on === 'leave') {
        return [];
    }

    if (on === 'enter') {
        return [
            [
                'pointerenter',
                // The host's own arrival, not one of its shadow root's: the listener is a
                // capture on the document, which every element entered passes on its way down.
                // A finger has no hover, so it arrives only to press. And none on a host the
                // reader can see the focus on or in, which the pointer's effects yield to.
                (event, host) =>
                    event instanceof PointerEvent &&
                    event.pointerType !== 'touch' &&
                    event.composedPath()[0] === host &&
                    !host.hasAttribute('data-focus-visible'),
            ],
        ];
    }

    return [[on, (): boolean => true]];
}

/**
 * Whether the event landed on a disabled control. A disabled control takes no click, so it
 * answers no press either — but a pointer going down still reaches it, and the control is
 * inside a shadow root, where the host cannot be asked. A host that reflects `disabled` is
 * asked by its attribute: an element the platform does not know matches no `:disabled`.
 */
function disabled(event: Event): boolean {
    return event
        .composedPath()
        .some((node) => node instanceof Element && node.matches(':disabled, [disabled]'));
}

/** Where a reader's open and closed moments are kept, per page. */
const kept = (page: string, moment: string): string => `rfc-0004:${page}:${moment}`;

/**
 * Whether a moment's choices were left open, so a reload keeps the panel as the reader had
 * it. A convenience: a store that throws or forgets costs only the first moment opening again.
 */
function opened(page: string, moment: string, first: boolean): boolean {
    try {
        const value = localStorage.getItem(kept(page, moment));

        return value === null ? first : value === 'open';
    } catch {
        return first;
    }
}

/** Records a moment opened or closed, where the store allows it. */
function remember(page: string, moment: string, open: boolean): void {
    try {
        localStorage.setItem(kept(page, moment), open ? 'open' : 'closed');
    } catch {
        // A private window, or a store turned off: the panel just opens as it did.
    }
}

/** The choices panel, what the choices are as CSS, and what the catalogue leaves out. */
function draw(
    catalogue: Catalogue,
    choices: Map<string, Choice>,
    css: string,
    redraw: () => void,
    judge: (scope: Scope) => void,
    again: (leaving: boolean) => void,
): void {
    const label: Record<Scope, string> = {
        page: 'the page',
        region: 'the region',
        type: `every ${catalogue.tags.join(' and ')}`,
        instance: 'this instance',
    };

    const theme = taste(catalogue.tags);
    const given = tastesFor(catalogue.tags);

    /** What runs on each component that answers a property, where nothing is picked. */
    const answering = (slot: Slot): (readonly [string, Tasted])[] =>
        [...theme].filter(([tag]) => answers(slot, tag));

    const badges = (effect: Effect, slot: Slot): TemplateResult => html`
        ${effect.today === true ? html`<span class="badge">today</span>` : nothing}
        ${given
            .filter(([, tasted]) =>
                catalogue.tags.some(
                    (tag) =>
                        applies(effect, tag, slot) &&
                        tasteOf(tasted, tag, slot.name) === effect.name,
                ),
            )
            .map(([name]) => html`<span class="badge">${whose(name)}</span>`)}
        ${effect.fire === undefined ? nothing : html`<span class="badge">script</span>`}
        ${effect.follows === true ? html`<span class="badge">follows the pointer</span>` : nothing}
        ${effect.directed === true ? html`<span class="badge">takes a direction</span>` : nothing}
        ${effect.loops === true ? html`<span class="badge">loops</span>` : nothing}
        ${effect.settles === true ? html`<span class="badge">loops, then rests</span>` : nothing}
        ${
            effect.host === true
                ? html`<span class="badge limit">misses a choice made on the element itself</span>`
                : nothing
        }
        ${effect.only === undefined ? nothing : html`<span class="badge">${effect.only} only</span>`}
        ${effect.yet === true ? html`<span class="badge">not here yet</span>` : nothing}
        ${effect.refused === undefined ? nothing : html`<span class="badge">left out here</span>`}
    `;

    const panel = document.querySelector('[data-choices]');
    const page = location.pathname;

    /** Draws the choices again, and plays an arrival or a departure at once, as a pick does. */
    const refresh = (): void => {
        redraw();
        const moving = catalogue.moments.filter(
            (moment) => moment.on === 'arrive' || moment.on === 'leave',
        );

        if (moving.length > 0) {
            again(moving.some((moment) => moment.on === 'leave'));
        }
    };

    /**
     * Every property that offers `none` set to it, keeping each moment's scope, so one effect at
     * a time can be tried with nothing else running: neither a theme's taste nor what the
     * component does today. Where `none` is today's and no taste stands against it, nothing has
     * to be written, as a pick of it writes nothing.
     */
    const stilled = (): void => {
        for (const moment of catalogue.moments) {
            const choice = choices.get(moment.name) ?? { picks: new Map(), scope: 'page' };
            const picks = new Map(choice.picks);

            for (const slot of slots(moment)) {
                const none = slot.effects.find((effect) => effect.name === 'none');

                if (none?.today === true && !stands(slot, theme)) {
                    picks.delete(slot.name);
                } else if (none !== undefined) {
                    picks.set(slot.name, none.name);
                }
            }

            choices.set(moment.name, { ...choice, picks });
        }

        refresh();
    };

    /** Every pick taken back, so each moment does what the theme chooses again. */
    const unpicked = (): void => {
        for (const [moment, choice] of choices) {
            choices.set(moment, { ...choice, picks: new Map() });
        }

        refresh();
    };

    if (panel instanceof HTMLElement) {
        render(
            html`
                <h2>Choose</h2>
                <div class="every">
                    <button type="button" @click=${stilled}>Every effect to none</button>
                    <button type="button" @click=${unpicked}>Clear the choices</button>
                </div>
                ${catalogue.moments.map((moment, index) => {
                    const choice: Choice = choices.get(moment.name) ?? {
                        picks: new Map(),
                        scope: 'page',
                    };
                    const picked = slots(moment).flatMap((slot) => {
                        const effect = slot.effects.find(
                            (candidate) => candidate.name === choice.picks.get(slot.name),
                        );

                        return effect === undefined ||
                            (effect.today === true && !stands(slot, theme))
                            ? []
                            : [effect.name];
                    });
                    /* What the components run where nothing is picked: said once where they
                       all run the same, and not at all where that is today's, which the line
                       falls back on; each named where they differ. */
                    const tasted = slots(moment).flatMap((slot) => {
                        if (choice.picks.has(slot.name)) {
                            return [];
                        }

                        const each = answering(slot).map(
                            ([tag, given]) => [tag, ...untouched(slot, tag, given)] as const,
                        );
                        const [first] = each;

                        if (
                            each.every(
                                ([, effect, by]) => effect === first?.[1] && by === first?.[2],
                            )
                        ) {
                            return first?.[2] === undefined
                                ? []
                                : [`${first[1] ?? ''} · ${whose(first[2])}`];
                        }

                        return each.map(([tag, effect, by]) =>
                            by === undefined
                                ? `${effect ?? ''} on ${tag}, today`
                                : `${effect ?? ''} on ${tag} · ${whose(by)}`,
                        );
                    });
                    const today = slots(moment)[0]?.effects.find(
                        (effect) => effect.today === true,
                    )?.name;
                    const current =
                        [
                            ...(picked.length === 0
                                ? []
                                : [`${picked.join(' + ')} · ${label[choice.scope]}`]),
                            ...tasted,
                        ].join(', ') || `${today ?? ''}, today`;
                    /** What a property runs: the pick, or else the theme's taste or today's —
                     *  and no one effect where the components run different ones, which no one
                     *  radio can say. */
                    const runs = (slot: Slot): string | undefined => {
                        const each = new Set(
                            answering(slot).map(([tag, given]) => untouched(slot, tag, given)[0]),
                        );

                        return (
                            choice.picks.get(slot.name) ??
                            (each.size === 1 ? [...each][0] : undefined)
                        );
                    };

                    /** One property's effects, as a group of radios. */
                    const group = (slot: Slot): TemplateResult => html`
                        <fieldset>
                            ${
                                slot.kind === undefined
                                    ? html`<legend class="hidden">${moment.label}</legend>`
                                    : html`<legend class="kind">
                                          ${slot.kind.label}<code>--ui-motion-${slot.name}</code>
                                      </legend>`
                            }
                            ${slot.effects.map(
                                (effect) => html`
                                    <label
                                        class="effect"
                                        @click=${(event: MouseEvent): void => {
                                            // A pointer's click: a key's has no count.
                                            if (
                                                moment.name === 'focus' &&
                                                event.detail > 0 &&
                                                drawn(effect)
                                            ) {
                                                judge(choice.scope);
                                            }
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name=${slot.name}
                                            ?disabled=${!drawn(effect)}
                                            .checked=${runs(slot) === effect.name}
                                            @change=${(): void => {
                                                // Today's, with no taste to stand against, is
                                                // what nothing chosen already writes: nothing.
                                                const picks = new Map(choice.picks);

                                                if (effect.today === true && !stands(slot, theme)) {
                                                    picks.delete(slot.name);
                                                } else {
                                                    picks.set(slot.name, effect.name);
                                                }

                                                choices.set(moment.name, { ...choice, picks });
                                                redraw();

                                                if (
                                                    moment.on === 'arrive' ||
                                                    moment.on === 'leave'
                                                ) {
                                                    again(moment.on === 'leave');
                                                }
                                            }}
                                        />
                                        <span>
                                            <strong>${effect.name}</strong>${badges(effect, slot)}
                                            <span class="says">${effect.says}</span>
                                            ${
                                                effect.refused === undefined
                                                    ? nothing
                                                    : html`<span class="says"
                                                          >Left out here: ${effect.refused}</span
                                                      >`
                                            }
                                        </span>
                                    </label>
                                `,
                            )}
                        </fieldset>
                    `;

                    return html`
                        <details
                            class="moment"
                            ?open=${opened(page, moment.name, index === 0)}
                            @toggle=${(event: Event): void => {
                                remember(
                                    page,
                                    moment.name,
                                    (event.target as HTMLDetailsElement).open,
                                );
                            }}
                        >
                            <summary>
                                ${moment.label}<code
                                    >--ui-motion-${moment.name}${
                                        moment.kinds === undefined
                                            ? ''
                                            : moment.kinds.some((kind) => kind.name === '')
                                              ? ', -*'
                                              : '-*'
                                    }</code
                                >
                                <span class="current">${current}</span>
                            </summary>
                            <div class="choice">
                                ${slots(moment).map(group)}
                                <label class="scope">
                                    Chosen for
                                    <select
                                        @change=${(event: Event): void => {
                                            const scope = (event.target as HTMLSelectElement)
                                                .value as Scope;
                                            choices.set(moment.name, { ...choice, scope });
                                            redraw();

                                            if (moment.on === 'arrive' || moment.on === 'leave') {
                                                again(moment.on === 'leave');
                                            }
                                        }}
                                    >
                                        ${scopes.map(
                                            (scope) => html`
                                                <option
                                                    value=${scope}
                                                    ?selected=${choice.scope === scope}
                                                >
                                                    ${label[scope]}
                                                </option>
                                            `,
                                        )}
                                    </select>
                                </label>
                            </div>
                        </details>
                    `;
                })}
            `,
            panel,
        );
    }

    const shown = document.querySelector('[data-written]');
    const tasting = catalogue.moments.flatMap(slots).some((slot) => stands(slot, theme));
    const unwritten = tasting
        ? '/* nothing: every moment does what the theme chooses, or what it does today */'
        : '/* nothing: every moment does what it does today */';

    if (shown instanceof HTMLElement) {
        render(
            html`
                <h2>What the consumer writes</h2>
                <pre><code>${css === '' ? unwritten : css}</code></pre>
                <p>
                    One custom property per moment, inherited, so the narrower scope wins: the
                    instance over its type, the type over the region, the region over the page. The
                    component reads it with a style query on its own shadow root.
                </p>
                ${
                    given.length > 0
                        ? html`
                              <h2>What the themes write</h2>
                              <pre><code>${given.map(([name]) => tasteSheet(name)).join('\n\n')}</code></pre>
                              <p>
                                  Each theme's choice where the consumer has made none, under
                                  <code>:where()</code> so it weighs nothing: the default theme's
                                  whatever the theme, a theme's over it, and anything the consumer
                                  writes, at any scope, over both.
                              </p>
                          `
                        : nothing
                }
            `,
            shown,
        );
    }

    const refused = document.querySelector('[data-refused]');

    if (refused instanceof HTMLElement && catalogue.refused !== undefined) {
        render(
            html`
                <h2>Left out</h2>
                <ul>
                    ${catalogue.refused.map(
                        (refusal) =>
                            html`<li><strong>${refusal.name}</strong> — ${refusal.why}</li>`,
                    )}
                </ul>
            `,
            refused,
        );
    }
}

/** A control a border's light is drawn round: the element that lays the layers over it, and the
 *  control's own box. */
interface Bound {
    readonly layers: HTMLElement;
    readonly box: DOMRect;
}

/**
 * The pointer engine, for the effects that follow: one passive listener, one write a frame,
 * and the box measured when the pointer arrives rather than on every move. Nothing runs for a
 * reader who asked for less motion or has no hover, which S3 found the collapse cannot see to.
 */
function follow(catalogue: Catalogue, hostOf: (event: Event) => HTMLElement | undefined): void {
    const following = catalogue.moments
        .flatMap(slots)
        .filter((slot) => slot.effects.some((effect) => effect.follows === true));

    if (following.length === 0) {
        return;
    }

    const boxes = new Map<HTMLElement, DOMRect>();
    const bounds = new Map<HTMLElement, readonly Bound[]>();
    const radius = 96;
    let last: PointerEvent | undefined;
    let pending = false;

    const follows = (host: HTMLElement): boolean =>
        following.some((slot) => running(slot, host)?.follows === true);

    /** The controls in an instance the catalogue names, each with its parent and its own box. */
    const bound = (host: HTMLElement): readonly Bound[] =>
        catalogue.bounded === undefined
            ? []
            : [...(host.shadowRoot?.querySelectorAll(catalogue.bounded) ?? [])].flatMap(
                  (control) =>
                      control.parentElement === null
                          ? []
                          : [
                                {
                                    layers: control.parentElement,
                                    box: control.getBoundingClientRect(),
                                },
                            ],
              );

    /** An instance measured, and the controls in it. */
    const measured = (host: HTMLElement): void => {
        boxes.set(host, host.getBoundingClientRect());
        bounds.set(host, bound(host));
    };

    document.addEventListener(
        'pointerover',
        (event) => {
            const host = hostOf(event);

            if (host !== undefined && !boxes.has(host) && follows(host)) {
                measured(host);
            }
        },
        { passive: true },
    );

    /** Where the pointer is from a box, written on an element, and how near it is. */
    const write = (
        element: HTMLElement,
        box: DOMRect,
        x: number,
        y: number,
        quiet: boolean,
    ): number => {
        const dx = Math.max(box.left - x, 0, x - box.right);
        const dy = Math.max(box.top - y, 0, y - box.bottom);
        const near = quiet ? 0 : Math.max(0, 1 - Math.hypot(dx, dy) / radius);
        const clamp = (value: number): number => Math.max(-1, Math.min(1, value));

        element.style.setProperty('--ui-pointer-near', near.toFixed(3));
        element.style.setProperty(
            '--ui-pointer-nx',
            clamp((x - (box.left + box.width / 2)) / (box.width / 2)).toFixed(3),
        );
        element.style.setProperty(
            '--ui-pointer-ny',
            clamp((y - (box.top + box.height / 2)) / (box.height / 2)).toFixed(3),
        );
        element.style.setProperty('--ui-pointer-x', `${(x - box.left).toFixed(1)}px`);
        element.style.setProperty('--ui-pointer-y', `${(y - box.top).toFixed(1)}px`);

        return near;
    };

    const frame = (): void => {
        pending = false;

        if (last === undefined) {
            return;
        }

        const { clientX: x, clientY: y } = last;
        const quiet = still() || matchMedia('(hover: none)').matches;

        for (const [host, box] of boxes) {
            const near = write(host, box, x, y, quiet);

            // Inside the instance's box, so never nearer than it: at nothing with it.
            for (const { layers, box: own } of bounds.get(host) ?? []) {
                write(layers, own, x, y, quiet);
            }

            if (near === 0) {
                boxes.delete(host);
                bounds.delete(host);
            }
        }
    };

    const schedule = (): void => {
        if (!pending) {
            pending = true;
            requestAnimationFrame(frame);
        }
    };

    document.addEventListener(
        'pointermove',
        (event) => {
            last = event;
            schedule();
        },
        { passive: true },
    );

    // A scroll or a resize moves the boxes under a pointer that may not move, so each followed
    // box is measured again and drawn from there. Dropped instead, a host the pointer rested on
    // stopped being followed in Chromium until the pointer left it and came back — measured.
    // Captured, so the instances' own column is heard too: its scroll does not reach the window.
    const measure = (): void => {
        for (const host of boxes.keys()) {
            measured(host);
        }

        schedule();
    };

    addEventListener('scroll', measure, { passive: true, capture: true });
    addEventListener('resize', measure, { passive: true });
}

/**
 * Keeps a wheel over the choices on them, where they scroll on their own. Firefox aims a wheel
 * that begins over them at their end at the instances instead, past their overscroll-behavior,
 * where Chromium and WebKit hold it on them — measured. So it is stopped there, unless Ctrl makes
 * it a zoom or it runs across rather than down.
 */
function hold(): void {
    const panel = document.querySelector('[data-choices]');

    if (!(panel instanceof HTMLElement)) {
        return;
    }

    panel.addEventListener(
        'wheel',
        (event) => {
            const spent =
                event.deltaY > 0
                    ? panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 1
                    : panel.scrollTop <= 0;

            if (
                spent &&
                !event.ctrlKey &&
                Math.abs(event.deltaY) > Math.abs(event.deltaX) &&
                getComputedStyle(panel).overflowY === 'auto'
            ) {
                event.preventDefault();
            }
        },
        { passive: false },
    );
}

/** What hears of a new theme: each catalogue drawn on the page, which is one but on the page
 *  that sets every component side by side. */
const listening: (() => void)[] = [];

/** The navigation, the scheme and the reduced-motion switch every page carries, drawn once
 *  however many catalogues a page draws; `changed` hears of a new theme, whose taste can change
 *  what a moment runs. */
function frame(changed: () => void): void {
    listening.push(changed);
    const slot = document.querySelector('[data-frame]');

    if (listening.length > 1 || !(slot instanceof HTMLElement)) {
        return;
    }

    const here = location.pathname.split('/').filter(Boolean).at(-2) ?? '';
    const root = document.documentElement;

    const scheme = (value: string): void => {
        if (value === 'system') {
            root.style.removeProperty('color-scheme');
        } else {
            root.style.setProperty('color-scheme', value);
        }
    };

    /** What a host does to select a theme: the attribute, and the theme's block inserted. */
    const theme = (value: string): void => {
        const chosen = themes.get(value);
        themed.textContent = chosen === undefined ? '' : themeStyleSheet(chosen);

        if (chosen === undefined) {
            delete root.dataset['uiTheme'];
        } else {
            root.dataset['uiTheme'] = chosen.name;
        }

        for (const each of listening) {
            each();
        }
    };

    render(
        html`
            <nav aria-label="Prototypes">
                <a href="../index.html">All</a>
                ${pages.map(
                    ([path, name]) => html`
                        <a
                            href=${`../${path}/index.html`}
                            aria-current=${path === here ? 'page' : nothing}
                            >${name}</a
                        >
                    `,
                )}
            </nav>
            <div class="settings">
                <span class="legend">Theme</span>
                ${['default', ...themes.keys()].map(
                    (value) => html`
                        <label>
                            <input
                                type="radio"
                                name="theme"
                                ?checked=${value === 'default'}
                                @change=${(): void => {
                                    theme(value);
                                }}
                            />
                            ${value}
                        </label>
                    `,
                )}
                <span class="legend">Scheme</span>
                ${(['system', 'light', 'dark'] as const).map(
                    (value) => html`
                        <label>
                            <input
                                type="radio"
                                name="scheme"
                                ?checked=${value === 'system'}
                                @change=${(): void => {
                                    scheme(value);
                                }}
                            />
                            ${value}
                        </label>
                    `,
                )}
                <label>
                    <input
                        type="checkbox"
                        @change=${(event: Event): void => {
                            root.toggleAttribute(
                                'data-reduced',
                                (event.target as HTMLInputElement).checked,
                            );
                        }}
                    />
                    reduced motion
                </label>
            </div>
        `,
        slot,
    );
}

/**
 * The workbench's shell: what RFC 0007 put around a scratch page — the options, the event log,
 * tokens and effects, and the accessibility check.
 *
 * `vite.config.ts` beside it writes it into every page under `reports/workbench/`, first among the
 * page's module scripts, so the token sheet and the options are in place before anything the page
 * imports upgrades. Every save reloads the page, so what the shell holds is kept in storage.
 *
 * **It is an element of its own, drawn with native controls in its own shadow root**, so a
 * component under development cannot break the panel it is looked at through, and the
 * accessibility check leaves it out. **It writes no list of the package's**: the tokens are the
 * barrel's, the effects are read off the components' sheets the way `tests/tokens.test.ts` reads
 * them, and each reader setting is the sheets' own rule with its condition taken off.
 */

import axe, { type Result } from 'axe-core';
import {
    LitElement,
    css,
    html,
    nothing,
    type CSSResultArray,
    type CSSResultGroup,
    type TemplateResult,
} from 'lit';
import * as ui from '@rak200/ui';
import { rules } from '../../src/table.js';
import { ruleset } from '../a11y-ruleset.js';

/** Where the scratch is served from, which `vite.config.ts` names too. */
const scratch = '/reports/workbench/';

/** The panels the shell switches between, in the order its tabs show them. */
const tabs = ['options', 'events', 'tokens', 'effects', 'check'] as const;

/** One of the shell's panels. */
type Tab = (typeof tabs)[number];

/** What each tab reads. */
const titles: Readonly<Record<Tab, string>> = {
    options: 'Options',
    events: 'Events',
    tokens: 'Tokens',
    effects: 'Effects',
    check: 'Accessibility',
};

/** What each option is set to. An empty value leaves the page as it would be without the shell. */
interface Options {
    /** A shipped theme's name, or empty for the default palette. */
    theme: string;
    /** `compact` for the compact density, or empty for what the page wrote. */
    density: string;
    /** `light` or `dark`, or empty for the reader's own, which is what the token sheet declares. */
    scheme: string;
    /** `reduce` for the collapse the reader's setting asks for, or empty for the reader's own. */
    motion: string;
    /** `more` for the answer to more contrast, or empty for the reader's own. */
    contrast: string;
    /** `ltr` or `rtl`, or empty for what the page wrote. */
    direction: string;
}

/** An effect chosen for a moment, on the page or on every instance of one component. */
interface Choice {
    /** `:root` for the page, or a component's tag. */
    readonly scope: string;
    /** The moment, as it follows `--ui-motion-`. */
    readonly moment: string;
    /** The effect's name. */
    readonly effect: string;
}

/** What the shell keeps across a reload. */
interface Kept {
    options: Options;
    open: boolean;
    tab: Tab;
    tokens: Record<string, string>;
    choices: Choice[];
}

/** One event the log heard. */
interface Heard {
    /** When, in seconds since the page started loading. */
    readonly at: string;
    readonly type: string;
    /** The element it was dispatched on, by tag, id and name. */
    readonly target: string;
    /** What it carried: a value, a validation message, a submitted form's entries. */
    readonly detail: string;
}

/** The storage key, one for every page of the scratch. */
const key = 'rak200-workbench';

/** What the shell holds the first time, and whatever storage cannot give back. */
const initial: Kept = {
    options: { theme: '', density: '', scheme: '', motion: '', contrast: '', direction: '' },
    open: true,
    tab: 'options',
    tokens: {},
    choices: [],
};

/** What the last page kept, or the initial state where storage is empty or unreadable. */
function recall(): Kept {
    try {
        const stored = localStorage.getItem(key);
        const parsed = (stored === null ? {} : JSON.parse(stored)) as Partial<Kept>;
        const tab = tabs.find((one) => one === parsed.tab) ?? initial.tab;

        return {
            ...structuredClone(initial),
            ...parsed,
            options: { ...initial.options, ...parsed.options },
            tab,
        };
    } catch {
        return structuredClone(initial);
    }
}

/** Keeps `kept` for the next page, where storage can be written at all. */
function keep(kept: Kept): void {
    try {
        localStorage.setItem(key, JSON.stringify(kept));
    } catch {
        // A page without storage forgets the shell at its next reload, and works otherwise.
    }
}

/** A style element the shell owns, marked so a reader of the head can tell it apart. */
function owned(name: string): HTMLStyleElement {
    const element = document.createElement('style');
    element.dataset['workbench'] = name;

    return element;
}

/**
 * The shell's sheets, in cascade order. The first four go before anything the page writes, as a
 * host inserts the token sheet and a theme's; the last two after it, since they stand for CSS a
 * consumer writes over both.
 */
const sheets = {
    tokens: owned('tokens'),
    theme: owned('theme'),
    motion: owned('motion'),
    contrast: owned('contrast'),
    overrides: owned('overrides'),
    choices: owned('choices'),
};

sheets.tokens.textContent = ui.tokenStyleSheet();
document.head.prepend(sheets.tokens, sheets.theme, sheets.motion, sheets.contrast);
document.head.append(sheets.overrides, sheets.choices);

/** The shipped themes, by the name `data-ui-theme` takes for each. */
const themes: ReadonlyMap<string, ui.Theme> = new Map([
    [ui.matrix.name, ui.matrix],
    [ui.glass.name, ui.glass],
]);

/** What the page wrote on its root before the shell touched it, which an empty option restores. */
const authored = {
    direction: document.documentElement.getAttribute('dir'),
    theme: document.documentElement.getAttribute('data-ui-theme'),
    density: document.documentElement.getAttribute('data-ui-density'),
};

/** Writes `value` as `name` on the root, or takes the attribute away where `value` is `null`. */
function attribute(name: string, value: string | null): void {
    if (value === null) {
        document.documentElement.removeAttribute(name);
    } else {
        document.documentElement.setAttribute(name, value);
    }
}

/** The rules `sheet` holds under a media condition naming `feature`, the condition taken off. */
function lifted(sheet: string, feature: string): string {
    const parsed = new CSSStyleSheet();
    parsed.replaceSync(sheet);

    return [...parsed.cssRules]
        .filter(
            (rule): rule is CSSMediaRule =>
                rule instanceof CSSMediaRule && rule.conditionText.includes(feature),
        )
        .flatMap((rule) => [...rule.cssRules].map((inner) => inner.cssText))
        .join('\n');
}

/** Puts the page under `options`. */
function apply(options: Options): void {
    const theme = themes.get(options.theme);
    const palette = theme === undefined ? '' : ui.themeStyleSheet(theme);
    const root = document.documentElement;

    attribute('data-ui-theme', theme === undefined ? authored.theme : theme.name);
    attribute('data-ui-density', options.density === '' ? authored.density : options.density);
    attribute('dir', options.direction === '' ? authored.direction : options.direction);

    if (options.scheme === '') {
        root.style.removeProperty('color-scheme');
    } else {
        root.style.setProperty('color-scheme', options.scheme);
    }

    sheets.theme.textContent = palette;
    sheets.motion.textContent =
        options.motion === 'reduce'
            ? lifted(ui.tokenStyleSheet(), 'prefers-reduced-motion: reduce')
            : '';
    sheets.contrast.textContent =
        options.contrast === 'more'
            ? [
                  lifted(ui.tokenStyleSheet(), 'prefers-contrast: more'),
                  lifted(palette, 'prefers-contrast: more'),
              ].join('\n')
            : '';
}

/** `declarations` as one rule per scope, which is the CSS a consumer would write for them. */
function written(declarations: readonly (readonly [string, string, string])[]): string {
    const scopes = new Map<string, string[]>();

    for (const [scope, name, value] of declarations) {
        scopes.set(scope, [...(scopes.get(scope) ?? []), `  ${name}: ${value};`]);
    }

    return [...scopes].map(([scope, lines]) => `${scope} {\n${lines.join('\n')}\n}`).join('\n\n');
}

/** The tokens `kept` sets, as CSS. */
function overrides(kept: Kept): string {
    return written(Object.entries(kept.tokens).map(([name, value]) => [':root', name, value]));
}

/**
 * The property `choice` is written under: the page's under the name every component reads, and one
 * component's under the component's own, which nothing it holds reads. Nothing where the component
 * no longer draws that moment, which a choice kept from an older page can name.
 */
function property({ scope, moment }: Choice): string | undefined {
    const name = scope === ':root' ? moment : offered.get(moment)?.get(scope)?.own;

    return name === undefined ? undefined : `--ui-motion-${name}`;
}

/** The effects `kept` chooses, as CSS: all of them at the page, each under its own property. */
function chosen(kept: Kept): string {
    return written(
        kept.choices.flatMap((choice) => {
            const name = property(choice);

            return name === undefined ? [] : [[':root', name, choice.effect] as const];
        }),
    );
}

/** Whether a sheet group is a list of them, which Lit allows at any depth. */
function isList(styles: CSSResultGroup): styles is CSSResultArray {
    return Array.isArray(styles);
}

/** The text of a component's styles, however Lit holds them. */
function text(styles: CSSResultGroup | undefined): string {
    if (styles === undefined) {
        return '';
    }

    if (isList(styles)) {
        return styles.map((one) => text(one)).join('\n');
    }

    if (styles instanceof CSSStyleSheet) {
        return [...styles.cssRules].map((rule) => rule.cssText).join('\n');
    }

    return styles.cssText;
}

/** Whether `value`, one of the barrel's exports, is a component class. */
function isElement(value: unknown): value is typeof LitElement {
    return typeof value === 'function' && value.prototype instanceof LitElement;
}

/** The effects one component draws for a moment, and the name it reads a choice for it alone under. */
interface Offer {
    /** The choice's name less `--ui-motion-`: the component's own name and the moment. */
    readonly own: string;
    readonly effects: Set<string>;
}

/**
 * For each moment a consumer can choose an effect for, each component that draws one, the effects
 * it draws and its own name for the moment: read off every component the barrel exports, and off
 * the rules the table adopts into the document, where its rows are drawn. Each query asks for the
 * component's own choice and then for the one every component reads, so the pair names both, and
 * the own name is the query's rather than the tag's: the radio group draws its radios under
 * `radio`, and a toast reads its toaster's stack under `toaster`.
 */
function catalogue(): ReadonlyMap<string, ReadonlyMap<string, Offer>> {
    const found = new Map<string, Map<string, Offer>>();
    const read = (component: string, sheet: string): void => {
        for (const match of sheet.matchAll(
            /style\(--ui-motion-([a-z0-9-]+): ([a-z0-9-]+)\) or \(\(not style\(--ui-motion-\1\)\) and \(style\(--ui-motion-([a-z0-9-]+):/g,
        )) {
            const [, own = '', effect = '', moment = ''] = match;
            const components = found.get(moment) ?? new Map<string, Offer>();
            const offer = components.get(component) ?? { own, effects: new Set<string>() };

            offer.effects.add(effect);
            components.set(component, offer);
            found.set(moment, components);
        }
    };

    for (const value of Object.values(ui)) {
        const tag = isElement(value) ? customElements.getName(value) : null;

        if (tag !== null && isElement(value)) {
            read(tag, text(value.styles));
        }
    }

    read('ui-table', rules.cssText);

    return found;
}

/** The catalogue, read once: the components register as the barrel is imported. */
const offered = catalogue();

/** The effects offered for `moment` at `scope`: one component's, or every component's. */
function effectsFor(moment: string, scope: string): string[] {
    const components = offered.get(moment) ?? new Map<string, Offer>();
    const offers = scope === ':root' ? [...components.values()] : [components.get(scope)];

    return [...new Set(offers.flatMap((offer) => [...(offer?.effects ?? [])]))].sort();
}

/** The events a consumer listens for, which the log hears from the document. */
const listened = ['input', 'change', 'invalid', 'submit', 'ui-close', 'ui-dismiss', 'ui-leave'];

/** The element `target` is, by tag, id and name. */
function named(target: EventTarget | null): string {
    if (!(target instanceof Element)) {
        return target === document ? 'document' : 'window';
    }

    const id = target.id === '' ? '' : `#${target.id}`;
    const name = target.getAttribute('name');

    return `${target.localName}${id}${name === null ? '' : `[name=${name}]`}`;
}

/** What `event` carried, as the log shows it. */
function carried(event: Event): string {
    const target = event.target;

    if (event.type === 'submit' && target instanceof HTMLFormElement) {
        const entries = [...new FormData(target).entries()].map(
            ([name, value]) => `${name}=${typeof value === 'string' ? value : value.name}`,
        );

        return `${entries.length === 0 ? 'nothing' : entries.join(' ')} (held on the page)`;
    }

    if (!(target instanceof Element)) {
        return '';
    }

    const parts: string[] = [];

    if (event.type === 'invalid' && 'validationMessage' in target) {
        parts.push(typeof target.validationMessage === 'string' ? target.validationMessage : '');
    }

    if ('checked' in target && typeof target.checked === 'boolean') {
        parts.push(`checked ${String(target.checked)}`);
    }

    if ('value' in target && typeof target.value === 'string') {
        parts.push(`value ${JSON.stringify(target.value)}`);
    }

    return parts.join(', ');
}

/** How many events the log keeps, the latest first. */
const kept = 200;

/** The panel drawn over a scratch page. */
class WorkbenchShell extends LitElement {
    /** The state the shell draws from. */
    static override readonly properties = {
        state: { state: true },
        heard: { state: true },
        pages: { state: true },
        filter: { state: true },
        draft: { state: true },
        violations: { state: true },
        checking: { state: true },
    };

    /** The shell's own look, which reads no token, so no change to one can break it. */
    static override readonly styles = css`
        :host {
            all: initial;
            display: block;
            position: fixed;
            inset-block-end: 12px;
            inset-inline-end: 12px;
            z-index: 2147483647;
            direction: ltr;
            color-scheme: light dark;
            font:
                13px/1.45 system-ui,
                sans-serif;
            color: light-dark(#1f2328, #e6edf3);
        }

        button,
        input,
        select {
            font: inherit;
        }

        .panel {
            box-sizing: border-box;
            display: grid;
            grid-template-rows: auto auto minmax(0, 1fr);
            inline-size: min(30rem, calc(100vw - 24px));
            max-block-size: min(75vh, 44rem);
            background: light-dark(#ffffff, #161b22);
            border: 1px solid light-dark(#d0d7de, #30363d);
            border-radius: 8px;
            box-shadow: 0 8px 24px rgb(0 0 0 / 25%);
        }

        header {
            display: flex;
            gap: 8px;
            align-items: center;
            padding: 8px 10px;
            border-block-end: 1px solid light-dark(#d0d7de, #30363d);
        }

        header select {
            flex: 1;
            min-inline-size: 0;
        }

        nav {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            padding: 8px 10px 0;
        }

        nav button[aria-pressed='true'] {
            font-weight: 600;
            outline: 2px solid light-dark(#0969da, #4493f8);
        }

        .body {
            overflow: auto;
            padding: 10px;
        }

        .row {
            display: grid;
            grid-template-columns: 8rem minmax(0, 1fr);
            gap: 8px;
            align-items: center;
            margin-block-end: 6px;
        }

        .actions {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-block: 8px;
        }

        pre,
        code,
        .log {
            font:
                12px/1.45 ui-monospace,
                monospace;
        }

        pre {
            margin: 8px 0 0;
            padding: 8px;
            overflow: auto;
            background: light-dark(#f6f8fa, #0d1117);
            border-radius: 6px;
        }

        .log,
        .found {
            margin: 0;
            padding: 0;
            list-style: none;
        }

        .log li,
        .found li {
            padding-block: 3px;
            border-block-end: 1px solid light-dark(#d8dee4, #21262d);
        }

        .quiet {
            color: light-dark(#59636e, #9198a1);
        }

        .tokens input {
            inline-size: 100%;
            box-sizing: border-box;
        }
    `;

    /** What the shell holds, kept across a reload. */
    state: Kept = recall();

    /** The events heard since the page loaded, the latest first. */
    heard: readonly Heard[] = [];

    /** The scratch's pages, by address. */
    pages: readonly string[] = [];

    /** What the token list is narrowed to. */
    filter = '';

    /** The effect about to be chosen. */
    draft: Choice = { scope: ':root', moment: [...offered.keys()].sort()[0] ?? '', effect: '' };

    /** The last accessibility check's violations, or `undefined` before one has run. */
    violations: readonly Result[] | undefined = undefined;

    /** Whether a check is running. */
    checking = false;

    /** Records `event` unless it came from the shell's own controls. */
    readonly #hear = (event: Event): void => {
        if (event.composedPath().includes(this)) {
            return;
        }

        if (event.type === 'submit') {
            // A scratch form has nowhere to go, and leaving would take the log with it.
            event.preventDefault();
        }

        const heard: Heard = {
            at: (event.timeStamp / 1000).toFixed(3),
            type: event.type,
            target: named(event.target),
            detail: carried(event),
        };

        this.heard = [heard, ...this.heard].slice(0, kept);
    };

    constructor() {
        super();
        this.setAttribute('dir', 'ltr');

        for (const type of listened) {
            document.addEventListener(type, this.#hear, { capture: true });
        }

        apply(this.state.options);
        sheets.overrides.textContent = overrides(this.state);
        sheets.choices.textContent = chosen(this.state);
        void this.#list();
    }

    /** Fetches the scratch's pages from the server. */
    async #list(): Promise<void> {
        const response = await fetch('/__workbench/pages');
        this.pages = (await response.json()) as string[];
    }

    /** Keeps `next` and redraws from it. */
    #update(next: Kept): void {
        this.state = next;
        keep(next);
    }

    /** Sets one option, and puts the page under the result. */
    #option(name: keyof Options, value: string): void {
        const options = { ...this.state.options, [name]: value };

        apply(options);
        this.#update({ ...this.state, options });
    }

    /** Sets a token, or takes it back where `value` is empty. */
    #token(name: string, value: string): void {
        const rest = Object.entries(this.state.tokens).filter(([one]) => one !== name);
        const tokens = Object.fromEntries(value === '' ? rest : [...rest, [name, value]]);
        const next = { ...this.state, tokens };

        sheets.overrides.textContent = overrides(next);
        this.#update(next);
    }

    /** Sets the effects chosen to `choices`. */
    #choose(choices: Choice[]): void {
        const next = { ...this.state, choices };

        sheets.choices.textContent = chosen(next);
        this.#update(next);
    }

    /** Runs axe over the page, leaving the shell out. */
    async #check(): Promise<void> {
        this.checking = true;

        try {
            const results = await axe.run({ exclude: ['workbench-shell'] }, ruleset);
            this.violations = results.violations;
        } finally {
            this.checking = false;
        }
    }

    /** A select over `choices`, each a value and its title, that sets one option. */
    #select(
        name: keyof Options,
        label: string,
        choices: readonly (readonly [string, string])[],
    ): TemplateResult {
        return html`
            <label class="row">
                ${label}
                <select
                    @change=${(event: Event): void => {
                        if (event.currentTarget instanceof HTMLSelectElement) {
                            this.#option(name, event.currentTarget.value);
                        }
                    }}
                >
                    ${choices.map(
                        ([value, title]) =>
                            html`<option
                                value=${value}
                                ?selected=${this.state.options[name] === value}
                            >
                                ${title}
                            </option>`,
                    )}
                </select>
            </label>
        `;
    }

    /** The options: the theme, the density, the scheme, the reader's settings, the direction. */
    #options(): TemplateResult {
        const named = [...themes.keys()].map(
            (name) => [name, `${name.charAt(0).toUpperCase()}${name.slice(1)}`] as const,
        );

        return html`
            ${this.#select('theme', 'Theme', [['', 'Default'], ...named])}
            ${this.#select('density', 'Density', [
                ['', 'As the page writes it'],
                ['compact', 'Compact'],
            ])}
            ${this.#select('scheme', 'Scheme', [
                ['', 'System'],
                ['light', 'Light'],
                ['dark', 'Dark'],
            ])}
            ${this.#select('motion', 'Motion', [
                ['', 'System'],
                ['reduce', 'Reduced'],
            ])}
            ${this.#select('contrast', 'Contrast', [
                ['', 'System'],
                ['more', 'More'],
            ])}
            ${this.#select('direction', 'Direction', [
                ['', 'As the page writes it'],
                ['ltr', 'Left to right'],
                ['rtl', 'Right to left'],
            ])}
            <p class="quiet">
                Reduced motion and more contrast are the sheets' own rules with the condition taken
                off, as the reader's setting would apply them.
            </p>
        `;
    }

    /** The event log. */
    #events(): TemplateResult {
        return html`
            <div class="actions">
                <button
                    @click=${(): void => {
                        this.heard = [];
                    }}
                >
                    Clear
                </button>
                <span class="quiet">${listened.join(', ')}</span>
            </div>
            ${
                this.heard.length === 0
                    ? html`<p class="quiet">Nothing heard yet.</p>`
                    : html`<ol class="log">
                          ${this.heard.map(
                              (one) =>
                                  html`<li>
                                      <span class="quiet">${one.at}</span>
                                      <strong>${one.type}</strong>
                                      on
                                      ${one.target}${one.detail === '' ? nothing : html` — ${one.detail}`}
                                  </li>`,
                          )}
                      </ol>`
            }
        `;
    }

    /** The tokens a host sets, each with its default and a value of the reader's own. */
    #tokens(): TemplateResult {
        const shown = ui.tokens.filter((token) => token.includes(this.filter.trim()));

        return html`
            <label class="row">
                Filter
                <input
                    type="search"
                    .value=${this.filter}
                    @input=${(event: Event): void => {
                        if (event.currentTarget instanceof HTMLInputElement) {
                            this.filter = event.currentTarget.value;
                        }
                    }}
                />
            </label>
            <div class="tokens">
                ${shown.map(
                    (token) => html`
                        <label class="row">
                            <code>${token}</code>
                            <input
                                .value=${this.state.tokens[token] ?? ''}
                                placeholder=${
                                    ui.darkScheme[token] === undefined
                                        ? ui.defaults[token]
                                        : `${ui.defaults[token]} / ${ui.darkScheme[token]}`
                                }
                                @change=${(event: Event): void => {
                                    if (event.currentTarget instanceof HTMLInputElement) {
                                        this.#token(token, event.currentTarget.value.trim());
                                    }
                                }}
                            />
                        </label>
                    `,
                )}
            </div>
            <div class="actions">
                <button
                    @click=${(): void => {
                        sheets.overrides.textContent = '';
                        this.#update({ ...this.state, tokens: {} });
                    }}
                >
                    Reset
                </button>
            </div>
            <pre>${overrides(this.state) || '/* no token set */'}</pre>
        `;
    }

    /** The effects chosen, and the row that chooses another. */
    #effects(): TemplateResult {
        const moments = [...offered.keys()].sort();
        const scopes = [':root', ...[...(offered.get(this.draft.moment)?.keys() ?? [])].sort()];
        // `none` first wherever it is offered, and offered everywhere: where no component draws
        // it, it is still the name that leaves a moment doing nothing.
        const effects = [...new Set(['none', ...effectsFor(this.draft.moment, this.draft.scope)])];
        const effect = effects.includes(this.draft.effect) ? this.draft.effect : (effects[1] ?? '');
        const draft = (change: Partial<Choice>): void => {
            this.draft = { ...this.draft, ...change };
        };

        return html`
            <label class="row">
                Moment
                <select
                    @change=${(event: Event): void => {
                        if (event.currentTarget instanceof HTMLSelectElement) {
                            draft({ moment: event.currentTarget.value, scope: ':root' });
                        }
                    }}
                >
                    ${moments.map(
                        (moment) =>
                            html`<option value=${moment} ?selected=${moment === this.draft.moment}>
                                ${moment}
                            </option>`,
                    )}
                </select>
            </label>
            <label class="row">
                Where
                <select
                    @change=${(event: Event): void => {
                        if (event.currentTarget instanceof HTMLSelectElement) {
                            draft({ scope: event.currentTarget.value });
                        }
                    }}
                >
                    ${scopes.map(
                        (scope) =>
                            html`<option value=${scope} ?selected=${scope === this.draft.scope}>
                                ${scope === ':root' ? 'The page' : scope}
                            </option>`,
                    )}
                </select>
            </label>
            <label class="row">
                Effect
                <select
                    @change=${(event: Event): void => {
                        if (event.currentTarget instanceof HTMLSelectElement) {
                            draft({ effect: event.currentTarget.value });
                        }
                    }}
                >
                    ${effects.map(
                        (one) =>
                            html`<option value=${one} ?selected=${one === effect}>${one}</option>`,
                    )}
                </select>
            </label>
            <div class="actions">
                <button
                    @click=${(): void => {
                        const { scope, moment } = this.draft;
                        const others = this.state.choices.filter(
                            (one) => one.scope !== scope || one.moment !== moment,
                        );

                        this.#choose([...others, { scope, moment, effect }]);
                    }}
                >
                    Choose
                </button>
                <button
                    @click=${(): void => {
                        this.#choose([]);
                    }}
                >
                    Reset
                </button>
            </div>
            <ul class="found">
                ${this.state.choices.map(
                    (choice) => html`
                        <li>
                            <code
                                >${choice.scope === ':root' ? 'The page' : choice.scope}
                                ${property(choice) ?? `--ui-motion-${choice.moment}, not drawn`}:
                                ${choice.effect}</code
                            >
                            <button
                                @click=${(): void => {
                                    this.#choose(
                                        this.state.choices.filter((one) => one !== choice),
                                    );
                                }}
                            >
                                Remove
                            </button>
                        </li>
                    `,
                )}
            </ul>
            <pre>${chosen(this.state) || "/* no effect chosen: the theme's taste runs */"}</pre>
        `;
    }

    /** The accessibility check, and what it last found. */
    #accessibility(): TemplateResult {
        const violations = this.violations;

        return html`
            <div class="actions">
                <button
                    ?disabled=${this.checking}
                    @click=${(): void => {
                        void this.#check();
                    }}
                >
                    ${this.checking ? 'Checking…' : 'Run axe'}
                </button>
                <span class="quiet">the suite's ruleset, over the page and not the shell</span>
            </div>
            ${
                violations === undefined
                    ? nothing
                    : violations.length === 0
                      ? html`<p>No violation.</p>`
                      : html`<ul class="found">
                            ${violations.map(
                                (violation) => html`
                                    <li>
                                        <strong>${violation.impact ?? 'unknown'}</strong>
                                        <code>${violation.id}</code> — ${violation.help}
                                        <a
                                            href=${violation.helpUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            >rule</a
                                        >
                                        ${violation.nodes.map(
                                            (node) =>
                                                html`<div class="quiet">
                                                    <code>${JSON.stringify(node.target)}</code>
                                                </div>`,
                                        )}
                                    </li>
                                `,
                            )}
                        </ul>`
            }
        `;
    }

    /** The panel the current tab shows. */
    #panel(): TemplateResult {
        switch (this.state.tab) {
            case 'options':
                return this.#options();
            case 'events':
                return this.#events();
            case 'tokens':
                return this.#tokens();
            case 'effects':
                return this.#effects();
            case 'check':
                return this.#accessibility();
        }
    }

    /** {@inheritDoc} */
    override render(): TemplateResult {
        if (!this.state.open) {
            return html`
                <button
                    @click=${(): void => {
                        this.#update({ ...this.state, open: true });
                    }}
                >
                    Workbench
                </button>
            `;
        }

        const here = location.pathname.endsWith('/')
            ? `${location.pathname}index.html`
            : location.pathname;

        return html`
            <section class="panel" aria-label="Workbench">
                <header>
                    <strong>Workbench</strong>
                    <select
                        aria-label="Page"
                        @change=${(event: Event): void => {
                            if (event.currentTarget instanceof HTMLSelectElement) {
                                location.assign(event.currentTarget.value);
                            }
                        }}
                    >
                        ${this.pages.map(
                            (page) =>
                                html`<option value=${page} ?selected=${page === here}>
                                    ${page.slice(scratch.length)}
                                </option>`,
                        )}
                    </select>
                    <button
                        aria-label="Hide the workbench"
                        @click=${(): void => {
                            this.#update({ ...this.state, open: false });
                        }}
                    >
                        Hide
                    </button>
                </header>
                <nav aria-label="Panels">
                    ${tabs.map(
                        (tab) =>
                            html`<button
                                aria-pressed=${String(tab === this.state.tab)}
                                @click=${(): void => {
                                    this.#update({ ...this.state, tab });
                                }}
                            >
                                ${titles[tab]}
                            </button>`,
                    )}
                </nav>
                <div class="body">${this.#panel()}</div>
            </section>
        `;
    }
}

customElements.define('workbench-shell', WorkbenchShell);
document.body.append(new WorkbenchShell());

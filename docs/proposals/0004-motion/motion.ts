/**
 * The half every RFC 0004 prototype shares.
 *
 * A page declares one component's catalogue — the moments it answers, the effects it offers for
 * each, and the CSS it would carry — and this file does the rest: the token sheet and the steps
 * the catalogue needs beyond it, the frame's controls, the choice a consumer makes and the CSS
 * that choice is, and the two pieces of script a component would carry for what CSS cannot do
 * alone. Proposal material rather than a consumer demo, so it reaches under the barrel.
 *
 * **What a page proposes is its catalogue's `sheet`.** It is adopted into every instance's
 * shadow root, which is where S5 found an effect has to be declared for all three engines to
 * find it: a stand-in for the component shipping it there.
 */
import '../../../src/index.js';

import { LitElement, html, nothing, render, type TemplateResult } from 'lit';

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
    /** It runs in script on the moment's event and finishes, whatever the state does — S7. */
    readonly fire?: (firing: Firing) => void;
    /** The one element of the catalogue's several it applies to. */
    readonly only?: string;
}

/** A moment a component answers, and the effects it offers for it. */
export interface Moment {
    /** The name after `--ui-motion-`. */
    readonly name: string;
    readonly label: string;
    /** The event a fired effect listens for, where the moment has one. */
    readonly on?: string;
    readonly effects: readonly Effect[];
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
    /** The CSS the component would carry: every effect under its style query. */
    readonly sheet: string;
    /** Where the sheet goes: the shadow root, or the host's tree for a component that styles
     *  what the host wrote, as `ui-table` does. */
    readonly where?: 'shadow' | 'document';
    readonly refused?: readonly Refusal[];
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
] as const;

/**
 * The steps and curves the catalogue needs and the token layer does not have yet, shaped on
 * the reference's five-step scale. Placeholders, collapsed with the rest under reduced motion,
 * and by the frame's switch too, so a reader can see the second state of every effect.
 */
const standIns = `
:root {
    --ui-duration-50: 75ms;
    --ui-duration-200: 240ms;
    --ui-duration-300: 360ms;
    --ui-duration-400: 520ms;
    --ui-easing-emphasis: cubic-bezier(0.3, 1.5, 0.5, 1);
    --ui-easing-move: cubic-bezier(0.4, 0, 0.2, 1);
}
@media (prefers-reduced-motion: reduce) {
    :root {
        --ui-duration-50: 0.01ms;
        --ui-duration-200: 0.01ms;
        --ui-duration-300: 0.01ms;
        --ui-duration-400: 0.01ms;
    }
}
:root[data-reduced] {
    --ui-duration-100: 0.01ms;
    --ui-duration-state: 0.01ms;
    --ui-duration-50: 0.01ms;
    --ui-duration-200: 0.01ms;
    --ui-duration-300: 0.01ms;
    --ui-duration-400: 0.01ms;
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
    ['--ui-ripple-size', '<length>', '0px'],
    ['--ui-ripple-alpha', '<number>', '0'],
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

/** The value a consumer chose for one moment, as the element reads it. */
export function chosen(element: Element, moment: string): string {
    return getComputedStyle(element).getPropertyValue(`--ui-motion-${moment}`).trim();
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

/**
 * Plays, from its start, the animation the sheet declares under `[data-fx='name']`, and clears
 * the mark when it ends. **The sheet owns the effect and the script only the moment**: what
 * moves, how far and on which duration token are CSS, so the collapse reaches them, and all
 * the script adds is a start that outlives the state — which S7 found `:active` cannot give.
 */
export function replay(target: HTMLElement, name: string): void {
    target.removeAttribute('data-fx');
    // Read layout once, so the removal is seen before the mark comes back: without it the
    // two writes land in the same frame and the animation never restarts.
    target.getBoundingClientRect();
    target.setAttribute('data-fx', name);
    target.addEventListener(
        'animationend',
        () => {
            target.removeAttribute('data-fx');
        },
        { once: true },
    );
}

const scopes: readonly Scope[] = ['page', 'region', 'type', 'instance'];

/** Renders the page around a catalogue and wires what the catalogue needs. */
export function prototype(catalogue: Catalogue): void {
    const tags = catalogue.tags;
    const choices = new Map<string, { effect: string; scope: Scope }>(
        catalogue.moments.map((moment) => [
            moment.name,
            {
                effect: moment.effects.find((effect) => effect.today === true)?.name ?? '',
                scope: 'page',
            },
        ]),
    );

    const selector: Record<Scope, string> = {
        page: ':root',
        region: '.region',
        type: tags.join(', '),
        instance: '#chosen',
    };

    const consumer = document.createElement('style');
    document.head.append(consumer);

    /** The CSS a consumer writes for the current choices: nothing for today's behaviour. */
    const written = (): string => {
        const blocks = new Map<string, string[]>();

        for (const moment of catalogue.moments) {
            const choice = choices.get(moment.name);
            const effect = moment.effects.find((candidate) => candidate.name === choice?.effect);

            if (choice === undefined || effect === undefined || effect.today === true) {
                continue;
            }

            const block = blocks.get(selector[choice.scope]) ?? [];
            block.push(`    --ui-motion-${moment.name}: ${effect.name};`);
            blocks.set(selector[choice.scope], block);
        }

        return [...blocks]
            .map(([where, lines]) => `${where} {\n${lines.join('\n')}\n}`)
            .join('\n\n');
    };

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(catalogue.sheet);

    if (catalogue.where === 'document') {
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    }

    /** Adopts the catalogue's sheet into one instance's shadow root, once. */
    const adopt = async (element: Element): Promise<void> => {
        if (catalogue.where === 'document' || !(element instanceof LitElement)) {
            return;
        }

        await element.updateComplete;
        const root = element.shadowRoot;

        if (root !== null && !root.adoptedStyleSheets.includes(sheet)) {
            root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
        }
    };

    const adoptWithin = (node: Node): void => {
        if (!(node instanceof Element)) {
            return;
        }

        for (const element of [node, ...node.querySelectorAll(tags.join(', '))]) {
            if (tags.includes(element.localName)) {
                void adopt(element);
            }
        }
    };

    adoptWithin(document.body);
    new MutationObserver((records) => {
        for (const record of records) {
            record.addedNodes.forEach(adoptWithin);
        }
    }).observe(document.body, { childList: true, subtree: true });

    /** The instance an event happened in, if it is one of this catalogue's. */
    const hostOf = (event: Event): HTMLElement | undefined =>
        event
            .composedPath()
            .find(
                (node): node is HTMLElement =>
                    node instanceof HTMLElement && tags.includes(node.localName),
            );

    for (const moment of catalogue.moments) {
        if (moment.on === undefined) {
            continue;
        }

        document.addEventListener(
            moment.on,
            (event) => {
                const host = hostOf(event);

                if (host === undefined) {
                    return;
                }

                const name = chosen(host, moment.name);
                moment.effects.find((effect) => effect.name === name)?.fire?.({ host, event });
            },
            { capture: true },
        );
    }

    follow(catalogue, hostOf);

    const redraw = (): void => {
        const css = written();
        consumer.textContent = css;
        draw(catalogue, choices, css, redraw);
    };

    frame();
    redraw();
}

/** The choices panel, what the choices are as CSS, and what the catalogue leaves out. */
function draw(
    catalogue: Catalogue,
    choices: Map<string, { effect: string; scope: Scope }>,
    css: string,
    redraw: () => void,
): void {
    const label: Record<Scope, string> = {
        page: 'the page',
        region: 'the region',
        type: `every ${catalogue.tags.join(' and ')}`,
        instance: 'this instance',
    };

    const badges = (effect: Effect): TemplateResult => html`
        ${effect.today === true ? html`<span class="badge">today</span>` : nothing}
        ${effect.fire === undefined ? nothing : html`<span class="badge">script</span>`}
        ${effect.follows === true ? html`<span class="badge">follows the pointer</span>` : nothing}
        ${
            effect.host === true
                ? html`<span class="badge limit">misses a choice made on the element itself</span>`
                : nothing
        }
        ${effect.only === undefined ? nothing : html`<span class="badge">${effect.only} only</span>`}
    `;

    const panel = document.querySelector('[data-choices]');

    if (panel instanceof HTMLElement) {
        render(
            html`
                <h2>Choose</h2>
                ${catalogue.moments.map((moment) => {
                    const choice = choices.get(moment.name) ?? { effect: '', scope: 'page' };

                    return html`
                        <fieldset class="moment">
                            <legend>${moment.label}<code>--ui-motion-${moment.name}</code></legend>
                            ${moment.effects.map(
                                (effect) => html`
                                    <label class="effect">
                                        <input
                                            type="radio"
                                            name=${moment.name}
                                            .checked=${choice.effect === effect.name}
                                            @change=${(): void => {
                                                choices.set(moment.name, {
                                                    ...choice,
                                                    effect: effect.name,
                                                });
                                                redraw();
                                            }}
                                        />
                                        <span>
                                            <strong>${effect.name}</strong>${badges(effect)}
                                            <span class="says">${effect.says}</span>
                                        </span>
                                    </label>
                                `,
                            )}
                            <label class="scope">
                                Chosen for
                                <select
                                    @change=${(event: Event): void => {
                                        const scope = (event.target as HTMLSelectElement)
                                            .value as Scope;
                                        choices.set(moment.name, { ...choice, scope });
                                        redraw();
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
                        </fieldset>
                    `;
                })}
            `,
            panel,
        );
    }

    const shown = document.querySelector('[data-written]');

    if (shown instanceof HTMLElement) {
        render(
            html`
                <h2>What the consumer writes</h2>
                <pre><code>${css === '' ? '/* nothing: every moment does what it does today */' : css}</code></pre>
                <p>
                    One custom property per moment, inherited, so the narrower scope wins: the
                    instance over its type, the type over the region, the region over the page. The
                    component reads it with a style query on its own shadow root.
                </p>
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

/**
 * The pointer engine, for the effects that follow: one passive listener, one write a frame,
 * and the box measured when the pointer arrives rather than on every move. Nothing runs for a
 * reader who asked for less motion or has no hover, which S3 found the collapse cannot see to.
 */
function follow(catalogue: Catalogue, hostOf: (event: Event) => HTMLElement | undefined): void {
    const moment = catalogue.moments.find((candidate) =>
        candidate.effects.some((effect) => effect.follows === true),
    );

    if (moment === undefined) {
        return;
    }

    const boxes = new Map<HTMLElement, DOMRect>();
    const radius = 96;
    let last: PointerEvent | undefined;
    let pending = false;

    const follows = (host: HTMLElement): boolean => {
        const name = chosen(host, moment.name);

        return moment.effects.some((effect) => effect.name === name && effect.follows === true);
    };

    document.addEventListener(
        'pointerover',
        (event) => {
            const host = hostOf(event);

            if (host !== undefined && !boxes.has(host) && follows(host)) {
                boxes.set(host, host.getBoundingClientRect());
            }
        },
        { passive: true },
    );

    const forget = (): void => {
        boxes.clear();
    };

    addEventListener('scroll', forget, { passive: true });
    addEventListener('resize', forget, { passive: true });

    const frame = (): void => {
        pending = false;

        if (last === undefined) {
            return;
        }

        const { clientX: x, clientY: y } = last;
        const quiet = still() || matchMedia('(hover: none)').matches;

        for (const [host, box] of boxes) {
            const dx = Math.max(box.left - x, 0, x - box.right);
            const dy = Math.max(box.top - y, 0, y - box.bottom);
            const near = quiet ? 0 : Math.max(0, 1 - Math.hypot(dx, dy) / radius);
            const clamp = (value: number): number => Math.max(-1, Math.min(1, value));

            host.style.setProperty('--ui-pointer-near', near.toFixed(3));
            host.style.setProperty(
                '--ui-pointer-nx',
                clamp((x - (box.left + box.width / 2)) / (box.width / 2)).toFixed(3),
            );
            host.style.setProperty(
                '--ui-pointer-ny',
                clamp((y - (box.top + box.height / 2)) / (box.height / 2)).toFixed(3),
            );
            host.style.setProperty('--ui-pointer-x', `${(x - box.left).toFixed(1)}px`);
            host.style.setProperty('--ui-pointer-y', `${(y - box.top).toFixed(1)}px`);

            if (near === 0) {
                boxes.delete(host);
            }
        }
    };

    document.addEventListener(
        'pointermove',
        (event) => {
            last = event;

            if (!pending) {
                pending = true;
                requestAnimationFrame(frame);
            }
        },
        { passive: true },
    );
}

/** The navigation, the scheme and the reduced-motion switch every page carries. */
function frame(): void {
    const slot = document.querySelector('[data-frame]');

    if (!(slot instanceof HTMLElement)) {
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

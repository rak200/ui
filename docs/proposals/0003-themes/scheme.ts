/**
 * The scheme control every prototype page carries: the host's `color-scheme`, written on the
 * root element the way the playground's toolbar writes it. Every panel inherits it unless its
 * theme declares a scheme of its own — which is what Matrix is there to show.
 *
 * The choice is kept in the browser, so it follows the reader from page to page. That is a
 * convenience and nothing depends on it: where storage is refused, the page follows the system.
 */
import { html, render } from 'lit';

type Choice = 'system' | 'light' | 'dark';

const key = 'rfc-0003-prototypes-scheme';

function saved(): Choice {
    try {
        const value = localStorage.getItem(key);

        return value === 'light' || value === 'dark' ? value : 'system';
    } catch {
        return 'system';
    }
}

/** Writes the choice, keeps it, and tells the page its colours moved. */
function choose(choice: Choice): void {
    const root = document.documentElement;

    if (choice === 'system') {
        root.style.removeProperty('color-scheme');
    } else {
        root.style.setProperty('color-scheme', choice);
    }

    try {
        localStorage.setItem(key, choice);
    } catch {
        // Storage refused: the choice lasts as long as the page, which is all it needs.
    }

    document.dispatchEvent(new Event('schemechange'));
}

// The reader's own preference moving is a scheme change too, while the page follows it.
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    document.dispatchEvent(new Event('schemechange'));
});

const initial = saved();

choose(initial);

for (const slot of document.querySelectorAll('[data-scheme-control]')) {
    render(
        html`
            <fieldset class="scheme">
                <legend>Scheme</legend>
                ${(['system', 'light', 'dark'] as const).map(
                    (choice) => html`
                        <label>
                            <input
                                type="radio"
                                name="scheme"
                                value=${choice}
                                ?checked=${choice === initial}
                                @change=${(): void => {
                                    choose(choice);
                                }}
                            />
                            ${choice === 'system' ? 'System' : choice === 'light' ? 'Light' : 'Dark'}
                        </label>
                    `,
                )}
            </fieldset>
        `,
        slot as HTMLElement,
    );
}

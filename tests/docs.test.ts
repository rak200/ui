/// <reference types="vite/client" />

/**
 * Every example in `docs/`, mounted as a reader would write it, says nothing in the console.
 *
 * A page copies the examples before anything else, so an example that warned would teach a reader
 * that the package warns at correct markup, which is the noise RFC 0011 keeps out. The examples are
 * read from the pages themselves, every `html` block in each, so a new one is held to this the day
 * it is written. The glyphs an example names are imported first, as the page around it says to.
 * The silence is `silence.ts`'s to check, after each example. #422
 *
 * A check that spans components rather than a unit, as `a11y.test.ts` is, so the mirror does not
 * cover it.
 */

import { ReactiveElement } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import '../src/index.js';

/** Every page in `docs/`, as its text. */
const pages = import.meta.glob<string>('../docs/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
});

/** Every glyph module, loaded only when an example names it. */
const glyphs = import.meta.glob('../src/icons/*.ts');

/** One `html` block, where it is, and the glyphs it names. */
interface Example {
    readonly where: string;
    readonly markup: string;
    readonly names: readonly string[];
}

/** Every `html` block in every page, in the order the pages and their blocks come. */
function examples(): Example[] {
    const found: Example[] = [];

    for (const [path, text] of Object.entries(pages)) {
        let index = 0;

        for (const block of text.matchAll(/```html\n([\s\S]*?)```/g)) {
            index += 1;

            const markup = block[1] ?? '';
            const names = [...markup.matchAll(/<ui-icon\b[^>]*\bname="([^"]+)"/g)].map(
                (name) => name[1] ?? '',
            );

            found.push({
                where: `${path.replace('../docs/', '')}, example ${String(index)}`,
                markup,
                names: [...new Set(names)],
            });
        }
    }

    return found;
}

const all = examples();

/** Mounts an example as a page would, once the glyphs it names are registered. */
async function mount(example: Example): Promise<HTMLElement> {
    await Promise.all(
        example.names.flatMap((name) => {
            const load = glyphs[`../src/icons/${name}.ts`];

            return load === undefined ? [] : [load()];
        }),
    );

    const host = document.createElement('div');

    host.innerHTML = example.markup;
    document.body.append(host);

    const tags = new Set(
        [...host.querySelectorAll('*')]
            .map((element) => element.localName)
            .filter((tag) => tag.startsWith('ui-')),
    );

    await Promise.all([...tags].map((tag) => customElements.whenDefined(tag)));

    for (const element of host.querySelectorAll('*')) {
        if (element instanceof ReactiveElement) {
            await element.updateComplete;
        }
    }

    await new Promise((resolve) => {
        requestAnimationFrame(() => {
            resolve(null);
        });
    });

    return host;
}

afterEach(() => {
    document.body.replaceChildren();
});

describe('the examples in docs/', () => {
    it('are found, every html block in every page', () => {
        expect(all.length).toBeGreaterThan(50);
    });

    it.each(all.map((example) => [example.where, example] as const))(
        '%s says nothing as it mounts',
        async (_where, example) => {
            const host = await mount(example);

            expect(host.hasChildNodes(), 'the example mounted something').toBe(true);
        },
    );
});

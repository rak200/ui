/**
 * Rendering a story inside the suite, which is what puts the playground behind the gate.
 *
 * Without this the Storybook build has none: `validate` does not build it, the caller
 * `ci.yml` is a masked seed and takes no extra step, and the deploy runs on push to
 * `master` — *after* the required check. A story that failed to compile would reach the
 * default branch and be caught by the deploy. Composed here, it fails `test`, inside
 * `ci / gate`, with nothing added to the shared pipeline and no ninth verb opened.
 *
 * Suite scaffolding rather than a unit, like the two `a11y` modules beside it, so the
 * mirror does not cover it.
 *
 * **What RFC 0001 expected to import, and what is actually here.** The proposal read
 * `composeStories`, `composeStory` and `setProjectAnnotations` off
 * `@storybook/web-components`. At 10.5.8 that package exports seven symbols and only the
 * last of those three is among them; the composition helpers live in
 * `storybook/preview-api`, which is a public subpath export and typed. Nothing here
 * reaches into `storybook/internal/*`.
 */

import { render } from 'lit';
import { composeStory, setProjectAnnotations } from 'storybook/preview-api';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import * as preview from '../.storybook/preview.js';
import { rendered } from './a11y.js';

/**
 * The playground's own preview annotations, applied once for the whole suite.
 *
 * Measured, because it is the point of composing at all rather than calling the story's
 * `render` by hand: the `parameters.a11y` this installs reaches the composed story. What
 * the site renders under is what the suite renders under.
 *
 * The renderer's defaults are deliberately not registered.
 * `@storybook/web-components/entry-preview` is what would supply them and it ships no type
 * declarations at all, so importing it fails `analyse`. Measured without them: args reach
 * the DOM, decorators are applied, and `<ui-field>` wires its ARIA exactly as its own test
 * asserts. They supply `renderToCanvas`, and nothing here renders to a canvas — lit's
 * `render` puts the story where this file says, which `run()` does not: measured, it
 * ignored the element it was handed and mounted the story elsewhere in the document.
 */
const project = setProjectAnnotations(preview);

/**
 * Composes one story and mounts it, resolved once its components have rendered.
 *
 * The container is left in the document for the caller to assert against; the `afterEach`
 * each test file already has is what removes it.
 *
 * @param story - The story export, as written in `stories/`.
 * @param meta - Its module's default export, which carries the args and the render.
 * @param name - The export's name, which is what Storybook derives a story id from.
 */
export async function mountStory<TArgs>(
    story: StoryObj<TArgs>,
    meta: Meta<TArgs>,
    name: string,
): Promise<HTMLElement> {
    const composed = composeStory(
        // @ts-expect-error Storybook's own types do not survive `exactOptionalPropertyTypes`: `composeStory` fixes its first parameter at the index-signature `Args`, and a `StoryObj<TArgs>` is not assignable to it — the decorator and play-function positions are contravariant, so a typed story is rejected by the helper written to take stories. A cast would outlive the defect silently; this fails the moment upstream fixes it.
        story,
        meta,
        project,
        undefined,
        name,
    );
    const container = document.createElement('div');

    document.body.append(container);
    render(composed(), container);
    await rendered(container);

    return container;
}

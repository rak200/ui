/**
 * The workbench's server, which RFC 0007 decided: a page for using the components while they are
 * built, served from `src/` and reloaded on every save.
 *
 * `npm run workbench` starts Vite over the whole repository with this file. The address it prints
 * leads to the scratch, `reports/workbench/`, where each page is written as a consumer writes one,
 * and this file writes the shell into each of them. Nothing publishes it and `test` does not run
 * it; `analyse` reads it, so a rename in `src/` fails here rather than leaving a dead page.
 *
 * **The scratch lives under `reports/` because every tool but ESLint already leaves that folder
 * alone**, which `eslint.config.js` makes all of them. A nested `.gitignore` would hide a scratch
 * page from git and not from `lint`: Prettier reads the root's ignore file alone, and that file is
 * a seed.
 */

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

/** A path inside the repository, which is the server's root. */
function inside(path: string): string {
    return fileURLToPath(new URL(`../../${path}`, import.meta.url));
}

/** Where the scratch is served from. The shell is written into the pages here and nowhere else. */
const scratch = '/reports/workbench/';

/** The scratch folder on disk. */
const folder = inside('reports/workbench/');

/**
 * The scratch's own `tsconfig.json`, which puts a scratch module in a program with `@rak200/ui`
 * mapped to `src/`, so an editor shows the package's types there. Written rather than copied: a
 * file in `starter/` would extend a path that resolves only once it has moved.
 */
const types = { extends: '../../tsconfig.json', include: ['./**/*.ts'] };

/**
 * Lays the starter out where there is no scratch yet, so a first run opens on every component.
 * A scratch that exists is never written over.
 */
function seed(): void {
    if (existsSync(folder)) {
        return;
    }

    mkdirSync(folder, { recursive: true });
    cpSync(fileURLToPath(new URL('starter/', import.meta.url)), folder, { recursive: true });
    writeFileSync(`${folder}tsconfig.json`, `${JSON.stringify(types, null, 2)}\n`);
}

/** Every page in the scratch, by its address, for the shell's list of pages. */
function pages(): string[] {
    return readdirSync(folder, { recursive: true, encoding: 'utf8' })
        .filter((name) => name.endsWith('.html'))
        .map((name) => `${scratch}${name.split(sep).join('/')}`)
        .sort();
}

/** The workbench: the scratch laid out, its pages listed, and the shell written into each. */
const workbench: Plugin = {
    name: 'workbench',

    configureServer(server) {
        seed();

        server.middlewares.use((request, response, next) => {
            if (request.url === '/') {
                response.writeHead(302, { location: scratch });
                response.end();

                return;
            }

            if (request.url === '/__workbench/pages') {
                response.setHeader('content-type', 'application/json');
                response.end(JSON.stringify(pages()));

                return;
            }

            next();
        });
    },

    transformIndexHtml: {
        // Before Vite's own transform, so the script it writes is resolved like the page's.
        order: 'pre',
        handler(html, context) {
            if (!context.path.startsWith(scratch)) {
                return html;
            }

            return {
                html,
                tags: [
                    {
                        tag: 'script',
                        attrs: { type: 'module', src: '/tests/workbench/shell.ts' },
                        // First of the page's module scripts, so the token sheet and the options
                        // are in place before anything the page imports upgrades.
                        injectTo: 'head-prepend',
                    },
                ],
            };
        },
    },
};

export default defineConfig({
    root: inside(''),
    plugins: [workbench],
    resolve: {
        // The fourth reader of the mapping CLAUDE.md lists, and in the order its icons bullet
        // gives: an alias matches by prefix, so the glyphs' entry comes first.
        alias: [
            { find: /^@rak200\/ui\/icons\/(.*)\.js$/, replacement: `${inside('src/icons/')}$1.ts` },
            { find: '@rak200/ui', replacement: inside('src/index.ts') },
        ],
    },
    // Only the scratch and the shell are crawled for dependencies to pre-bundle. Left to its
    // default, Vite would crawl every HTML file in the repository, the measurement harnesses in
    // `reports/` and the built playground among them.
    optimizeDeps: { entries: ['reports/workbench/**/*.html', 'tests/workbench/shell.ts'] },
    server: {
        // Apart from Vite's own default, which a second server is usually already holding.
        port: 5180,
        // Trees a run writes thousands of files into, which no page here reads.
        watch: {
            ignored: [
                '**/.stryker-tmp/**',
                '**/coverage/**',
                '**/dist/**',
                '**/storybook-static/**',
            ],
        },
    },
});

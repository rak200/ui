/**
 * What a catalogue of effects costs the mutation floor — RFC 0004's _What a catalogue costs the
 * gate_, counted on the prototypes.
 *
 * **A step, not a test**, for the reasons `interaction-states.mjs` gives beside it. It runs no
 * mutant: Stryker's own instrumenter says how many each file makes, which is the count a run of
 * the `mutation` verb starts from, so this takes seconds where a run takes hours.
 *
 * ## Running it
 *
 * ```sh
 * node tests/manual/catalogue-cost.mjs
 * ```
 *
 * ## Reading it
 *
 * **Today's library** is what `src/` makes, less the generated glyphs, as the verb leaves them out.
 *
 * **The prototypes** are put down, a top-level declaration at a time, to the sheets that write a
 * component's CSS, the scripts that run an effect, and the page: the panel, the lists it describes
 * and each page's demonstration, which no component would carry. The seeds are named below; any
 * other declaration takes the group of what uses it, as the type checker resolves the name — a
 * script's where a script uses it, a sheet's where a sheet does, and the page's only where nothing
 * else does. What a page's lists hand a moment is an effect, so a declaration only the lists use
 * is a script's, but for a sentence, which the panel shows. The catalogue is the sheets and the
 * scripts.
 *
 * **The effects** are those each page's catalogue draws, on every element it draws them on — the
 * input's on the textarea too, the checkbox's on the switch — less `none`. Those a component does
 * today are counted apart, since the suite tests them now, and so are the loops among the rest,
 * whose count has to collapse under reduced motion as well as their period.
 *
 * ## What it cannot tell you
 *
 * What the catalogue would make in `src/`. The prototypes write an effect once for every component
 * that draws it, and a component's own file could write it otherwise. Nor what a run would take: a
 * mutant's cost is the test that kills it, which nothing here runs, and the rate is the
 * pipeline's, read off its logs.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const require = createRequire(import.meta.url);
const ts = require('typescript');
// Stryker's instrumenter, reached through the engine that runs it: it is that engine's
// dependency, not this repository's.
const engine = createRequire(require.resolve('@stryker-mutator/core/package.json'));
const { Instrumenter } = await import(
    pathToFileURL(engine.resolve('@stryker-mutator/instrumenter')).href
);

const repository = join(dirname(fileURLToPath(import.meta.url)), '../..');
const prototypes = join(repository, 'docs/proposals/0004-motion');

/** The seeds the groups grow from, by file under the prototypes, `*` for every file. */
const seeds = {
    // Drawn for the reader alone, so what only these use is the page's too.
    panel: { 'motion.ts': ['draw', 'frame', 'hold', 'opened'], 'moments.ts': ['shown', 'moment'] },
    // What a page hands its moments to — names, sentences, which effects a component draws — and
    // the page's own call, as well as any statement that wires a demonstration's buttons.
    wiring: {
        'motion.ts': ['prototype'],
        'moments.ts': ['listed', 'ringed', 'hover', 'focus', 'labels'],
        'panels.ts': ['moments'],
        'buttons.ts': ['moments', 'refused'],
        'fields.ts': ['moments', 'refused'],
        'controls.ts': ['moments', 'validation'],
        'card/effects.ts': ['page'],
    },
    // What writes a component's CSS, and the tastes a theme's block is written from.
    sheet: {
        'controls.ts': ['rules', 'ringRules', 'pulse'],
        'surfaces.ts': ['surface'],
        'panels.ts': ['panel', 'cascade'],
        'motion.ts': ['tasteSheet', 'tastes'],
        '*': ['sheet'],
    },
};

/** Every TypeScript file in a directory, and in the ones under it where `deep`. */
function sources(directory, deep) {
    return readdirSync(directory)
        .sort()
        .flatMap((name) => {
            const path = join(directory, name);

            if (statSync(path).isDirectory()) {
                return deep ? sources(path, deep) : [];
            }

            return name.endsWith('.ts') && !name.endsWith('.d.ts') ? [path] : [];
        });
}

/** The mutants Stryker makes in the files, less those a `Stryker disable` takes out. */
async function mutants(files) {
    const quiet = new Proxy(
        {},
        { get: (_, key) => (String(key).startsWith('is') ? () => false : () => {}) },
    );
    const { mutants: made } = await new Instrumenter(quiet).instrument(
        files.map((name) => ({ name, content: readFileSync(name, 'utf8'), mutate: true })),
        { plugins: null, excludedMutations: [], ignorers: [] },
    );

    return made.filter((mutant) => mutant.status !== 'Ignored');
}

/** Each top-level statement of the files, with its mutants and its group. */
function grouped(files, made) {
    const program = ts.createProgram(files, {
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        noEmit: true,
        skipLibCheck: true,
        types: [],
    });
    const checker = program.getTypeChecker();
    const statements = new Map();

    for (const file of files) {
        const source = program.getSourceFile(file);
        const name = relative(prototypes, file);

        for (const statement of source.statements) {
            if (ts.isImportDeclaration(statement)) {
                continue;
            }

            const own = [];

            if (statement.name !== undefined) {
                own.push(statement.name.text);
            }

            if (ts.isVariableStatement(statement)) {
                for (const declaration of statement.declarationList.declarations) {
                    if (ts.isIdentifier(declaration.name)) {
                        own.push(declaration.name.text);
                    }
                }
            }

            const text = statement.getText();
            const named = (table) =>
                own.some((each) => table[name]?.includes(each) || table['*']?.includes(each));
            const call = /^(prototype|validation)\(/.test(text);
            const demonstration = /querySelectorAll(<[^>]+>)?\(\s*'\[data-/.test(
                text.slice(0, 200),
            );
            let seed = null;

            if (named(seeds.panel)) {
                seed = 'panel';
            } else if (call || named(seeds.wiring)) {
                seed = 'wiring';
            } else if (named(seeds.sheet)) {
                seed = 'sheet';
            } else if (demonstration) {
                seed = 'wiring';
            }

            statements.set(statement, {
                file: name,
                own,
                start: source.getLineAndCharacterOfPosition(statement.getStart()).line,
                end: source.getLineAndCharacterOfPosition(statement.getEnd()).line,
                sentence:
                    ts.isVariableStatement(statement) &&
                    statement.declarationList.declarations.every(
                        (declaration) =>
                            declaration.initializer !== undefined &&
                            (ts.isStringLiteral(declaration.initializer) ||
                                ts.isTemplateLiteral(declaration.initializer)),
                    ),
                seed,
                group: seed === 'panel' || seed === 'wiring' ? 'page' : seed,
                users: new Set(),
                mutants: [],
            });
        }
    }

    // Who uses whom, by the declaration each name resolves to rather than by its spelling.
    const top = (node) => {
        let at = node;

        while (at.parent !== undefined && !ts.isSourceFile(at.parent)) {
            at = at.parent;
        }

        return statements.get(at);
    };

    for (const [statement, entry] of statements) {
        const visit = (node) => {
            if (ts.isIdentifier(node)) {
                let symbol = checker.getSymbolAtLocation(node);

                if (symbol !== undefined && (symbol.flags & ts.SymbolFlags.Alias) !== 0) {
                    symbol = checker.getAliasedSymbol(symbol);
                }

                for (const declaration of symbol?.declarations ?? []) {
                    const used = top(declaration);

                    if (used !== undefined && used !== entry) {
                        used.users.add(entry);
                    }
                }
            }

            ts.forEachChild(node, visit);
        };

        visit(statement);
    }

    for (let changed = true; changed;) {
        changed = false;

        for (const entry of statements.values()) {
            if (entry.seed !== null) {
                continue;
            }

            const users = [...entry.users];
            let group = null;

            if (users.length === 0 || users.some((user) => user.group === 'script')) {
                group = 'script';
            } else if (users.some((user) => user.group === 'sheet')) {
                group = 'sheet';
            } else if (users.some((user) => user.seed === 'wiring')) {
                group = entry.sentence || entry.file === 'moments.ts' ? 'page' : 'script';
            } else if (users.every((user) => user.group === 'page')) {
                group = 'page';
            }

            if (group !== entry.group) {
                entry.group = group;
                changed = true;
            }
        }
    }

    // Stryker counts lines from zero, as the compiler does.
    const entries = [...statements.values()];

    for (const mutant of made) {
        const name = relative(prototypes, mutant.fileName);
        const line = mutant.location.start.line;
        const entry = entries.find(
            (each) => each.file === name && each.start <= line && line <= each.end,
        );

        entry?.mutants.push(mutant);
    }

    return entries;
}

/** Hands the step each catalogue a page draws, from the one call every page makes. */
const handed = {
    name: 'hand-the-catalogue',
    enforce: 'pre',
    transform(code, id) {
        if (!id.split('?')[0].endsWith('/0004-motion/motion.ts')) {
            return null;
        }

        const opening = 'export function prototype(catalogue: Catalogue): Page {';

        if (!code.includes(opening)) {
            throw new Error(`motion.ts no longer opens prototype() with ${opening}`);
        }

        return code.replace(
            opening,
            `${opening}\n    (globalThis.catalogues ??= []).push(catalogue);`,
        );
    },
};

/** Every effect each page's catalogues draw, on every element each is drawn on. */
async function effects() {
    const server = await createServer({
        root: prototypes,
        configFile: false,
        logLevel: 'silent',
        plugins: [handed],
        server: { port: 5180 },
    });
    await server.listen();

    const base = server.resolvedUrls.local[0];
    const browser = await chromium.launch();
    const pages = readdirSync(prototypes)
        .filter((name) => name !== 'compare')
        .filter((name) => statSync(join(prototypes, name)).isDirectory())
        .sort();
    const counted = [];

    try {
        for (const name of pages) {
            const page = await browser.newPage();
            await page.goto(`${base}${name}/index.html`);
            await page.waitForSelector('[data-choices] label.effect');

            const drawn = await page.evaluate(() =>
                globalThis.catalogues.flatMap(({ tags, moments }) =>
                    moments.flatMap((moment) =>
                        (moment.kinds ?? [{ effects: moment.effects ?? [] }]).flatMap((kind) =>
                            kind.effects
                                .filter(
                                    (effect) =>
                                        effect.name !== 'none' &&
                                        effect.yet !== true &&
                                        effect.refused === undefined,
                                )
                                .map((effect) => ({
                                    on:
                                        effect.only !== undefined || moment.only !== undefined
                                            ? 1
                                            : tags.length,
                                    today: effect.today === true,
                                    loops: effect.loops === true,
                                })),
                        ),
                    ),
                ),
            );

            counted.push({
                name,
                drawn: drawn.reduce((sum, effect) => sum + effect.on, 0),
                fresh: drawn
                    .filter((effect) => !effect.today)
                    .reduce((sum, effect) => sum + effect.on, 0),
                loops: drawn
                    .filter((effect) => !effect.today && effect.loops)
                    .reduce((sum, effect) => sum + effect.on, 0),
            });
            await page.close();
        }
    } finally {
        await browser.close();
        await server.close();
    }

    return counted;
}

const share = (part, whole) => `${Math.round((100 * part) / whole)}%`;
const strings = (made) => made.filter((mutant) => mutant.mutatorName === 'StringLiteral').length;

/** One line of the report: a label, then each value right-aligned in a column of its own. */
const row = (label, ...values) =>
    console.log(`${label.padEnd(28)}${values.map((value) => String(value).padStart(7)).join('')}`);

const library = await mutants(sources(join(repository, 'src'), false));
const files = sources(prototypes, true);
const entries = grouped(files, await mutants(files));
const groups = Object.fromEntries(
    ['sheet', 'script', 'page'].map((group) => [
        group,
        entries.filter((entry) => entry.group === group).flatMap((entry) => entry.mutants),
    ]),
);
const catalogue = groups.sheet.length + groups.script.length;

console.log('mutants, and the share of them that are a string');
row("today's library, src/", library.length, share(strings(library), library.length));
row(
    'the prototypes',
    entries.reduce((sum, entry) => sum + entry.mutants.length, 0),
);

for (const [group, made] of Object.entries(groups)) {
    row(`  the ${group}s`, made.length, share(strings(made), made.length));
}

row('the catalogue', catalogue, `${(catalogue / library.length).toFixed(2)}×`);

// File by file, so one component's part can be set against what its own module makes today.
const perFile = new Map();

for (const entry of entries) {
    if (entry.group === 'sheet' || entry.group === 'script') {
        const counts = perFile.get(entry.file) ?? { sheet: 0, script: 0 };
        counts[entry.group] += entry.mutants.length;
        perFile.set(entry.file, counts);
    }
}

console.log('\nthe catalogue by file: its sheets, its scripts');

for (const [file, { sheet, script }] of [...perFile].sort(([a], [b]) => a.localeCompare(b))) {
    row(`  ${file}`, sheet, script);
}

console.log("\ntoday's library by file");

for (const file of sources(join(repository, 'src'), false)) {
    row(`  ${relative(repository, file)}`, library.filter((m) => m.fileName === file).length);
}

const counted = await effects();
const total = (key) => counted.reduce((sum, page) => sum + page[key], 0);

console.log('\nthe effects drawn, per element: all of them, the new, the new that loop');

for (const { name, drawn, fresh, loops } of counted) {
    row(`  ${name}`, drawn, fresh, loops);
}

row('  every page', total('drawn'), total('fresh'), total('loops'));

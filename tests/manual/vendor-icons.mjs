/**
 * Vendors the adopted glyph set into `src/icons/`, one module per glyph.
 *
 * **A step, not a test.** It is not collected by the suite and gates nothing: `vitest`
 * picks up `*.test.ts`, and this is neither. It runs when the pinned Lucide version moves,
 * which is a decision a person makes rather than a thing that happens.
 *
 * It lives under `tests/` for the reason `interaction-states.mjs` gives beside it: that
 * directory is already `export-ignore`d, so a development script does not ride along in a
 * consumer's `git archive`, and the alternative was editing a seed the conformance check
 * compares byte for byte. `eslint.config.js` ignores this path.
 *
 * ## Running it
 *
 * ```sh
 * node tests/manual/vendor-icons.mjs
 * npm run fix          # the emitted modules are formatted like everything else
 * ```
 *
 * Downloads one tarball rather than two thousand files. The version is pinned in this
 * file, so the set moves when somebody edits that line and re-runs — never on its own.
 *
 * ## What it emits, and why that shape
 *
 * A glyph module carries **the geometry alone**, because every Lucide SVG has the same
 * wrapper — 24 grid, `fill="none"`, `stroke="currentColor"`, width 2, round caps — and
 * that wrapper belongs to `<ui-icon>`. Measured across all 2048 of them: 482 bytes as a
 * whole file, 182 bytes as geometry. Keeping the wrapper in the element is what makes the
 * grid, the stroke and the colour one decision rather than two thousand.
 *
 * **The modules export nothing.** They are imported for the side effect of registering,
 * which is what lets `name` be an attribute a plain page writes — and it also keeps them
 * out of the docs gate, which asks that every exported symbol under `src/` appears in
 * `docs/`. Two thousand exported names could not honestly satisfy that.
 *
 * **Each one carries its own Stryker exclusion**, and the comment says why it is there
 * rather than in `stryker.config.js`: a pull request runs `--mutate` over the changed
 * files, and that argument REPLACES the config's list. An exclusion written in the config
 * holds on a full run and is silently dropped on the path that gates every pull request —
 * measured, as a 2.87% score over four thousand mutants nobody meant to make. The emitted
 * comment is read wherever the list comes from. `tsconfig.icons.json` strips comments from
 * the build, so it costs the published package nothing.
 *
 * **It is `disable all`, not `disable next-line`, and that cost a second red gate.** The
 * emitted call is one statement, but prettier wraps the longer ones — 1897 of 2048 — over
 * four lines, and `next-line` then covers `register(` while the two strings under it stay
 * mutated. The first fix was verified against `x` and `check`, which happen to be short
 * enough to fit on one line, so it looked like it worked. A generated file with a single
 * statement is the one place where the file-wide form and the narrow one cover exactly the
 * same ground.
 *
 * **The licence travels with the files.** ISC requires the notice to ship, so it is
 * written to `src/icons/LICENSE` and reaches the package through `dist`.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

/** The adopted set, pinned. Moving this line is what moves the glyphs. */
const PACKAGE = 'lucide-static@1.37.0';

/** Where the emitted modules go, relative to the repository root. */
const OUT = resolve(import.meta.dirname, '../../src/icons');

/**
 * The geometry inside a Lucide SVG, with the wrapper taken off.
 *
 * **Sliced at the wrapper's own boundaries rather than pattern-matched away.** The first
 * version stripped the licence comment with a regex, and CodeQL was right to red it:
 * `js/incomplete-multi-character-sanitization` fires on exactly that shape, because one
 * pass over `<!-- -->` can leave a `<!--` behind. Measured across all 2048 files, the
 * comment sits *outside* the wrapper in every one of them — so slicing already drops it
 * and the regex never had anything to do.
 *
 * If one ever moves inside, this refuses rather than strips. A comment carried into an
 * `svg` template is markup this package would be emitting blind, and a generator that
 * quietly half-cleans it is how that arrives unnoticed.
 *
 * Whitespace is collapsed rather than preserved: the emitted file is generated, so the
 * only reader who benefits from its formatting is a diff, and a diff benefits more from
 * one line per glyph.
 */
function geometry(svg) {
    const open = svg.indexOf('<svg');
    const start = svg.indexOf('>', open);
    const end = svg.lastIndexOf('</svg>');

    if (open === -1 || start === -1 || end === -1 || end < start) {
        throw new Error('no <svg> wrapper to take off — has the upstream format changed?');
    }

    const inner = svg
        .slice(start + 1, end)
        .replace(/\s+/g, ' ')
        .trim();

    if (inner.includes('<!--')) {
        throw new Error('a comment inside the wrapper — the upstream format has changed');
    }

    return inner;
}

/** Downloads the pinned tarball into a scratch directory and unpacks it. */
function fetchSet() {
    const scratch = mkdtempSync(join(tmpdir(), 'vendor-icons-'));

    console.log(`fetching ${PACKAGE}`);

    const tarball = execFileSync('npm', ['pack', PACKAGE, '--silent'], {
        cwd: scratch,
        encoding: 'utf8',
    }).trim();

    execFileSync('tar', ['-xzf', tarball], { cwd: scratch });

    return scratch;
}

const scratch = fetchSet();

try {
    const root = join(scratch, 'package');
    const files = readdirSync(join(root, 'icons')).filter((name) => name.endsWith('.svg'));

    if (files.length === 0) {
        throw new Error('the tarball carried no icons — has the package layout changed?');
    }

    rmSync(OUT, { recursive: true, force: true });
    mkdirSync(OUT, { recursive: true });

    const names = [];

    for (const file of files.sort()) {
        const name = file.replace(/\.svg$/, '');
        const inner = geometry(readFileSync(join(root, 'icons', file), 'utf8'));

        if (inner === '') {
            throw new Error(`${file} produced no geometry — the wrapper pattern has changed`);
        }

        names.push(name);
        writeFileSync(
            join(OUT, `${name}.ts`),
            [
                `// Generated from ${PACKAGE} by tests/manual/vendor-icons.mjs. Do not edit.`,
                `import { svg } from 'lit';`,
                `import { register } from '../icon.js';`,
                ``,
                `// Stryker disable all: the registration below runs once, at import, inside the warm`,
                `// process Stryker switches mutants in — so by the time a mutant on it is active the`,
                `// glyph is already registered under its original name and geometry. Outside the`,
                `// runner's reach, the category \`src/button.ts\` names beside \`customElements.define\`.`,
                `//`,
                `// \`all\` rather than \`next-line\`, and the file holds one statement so the two cover`,
                `// the same ground: prettier wraps the longer calls across four lines, and`,
                `// \`next-line\` then covers \`register(\` while the strings under it stay mutated —`,
                `// measured, as 3790 live mutants on a green local run. See vendor-icons.mjs for why`,
                `// this is emitted per file rather than excluded in \`stryker.config.js\`.`,
                `register('${name}', svg\`${inner}\`);`,
                ``,
            ].join('\n'),
        );
    }

    writeFileSync(
        join(OUT, 'all.ts'),
        [
            `// Generated from ${PACKAGE} by tests/manual/vendor-icons.mjs. Do not edit.`,
            `//`,
            `// Every glyph, for a page whose \`name\` is decided at runtime. A host who knows which`,
            `// glyphs they use imports those modules instead and pays for those alone.`,
            ...names.map((name) => `import './${name}.js';`),
            ``,
        ].join('\n'),
    );

    writeFileSync(join(OUT, 'LICENSE'), readFileSync(join(root, 'LICENSE'), 'utf8'));

    console.log(`wrote ${String(names.length)} glyph modules, all.ts and LICENSE to src/icons/`);
} finally {
    rmSync(scratch, { recursive: true, force: true });
}

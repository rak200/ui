/**
 * The `mutation` verb, with the generated glyph modules taken out of `--mutate`.
 *
 * **A step the pipeline runs, not one a person does** — which is why it is not in
 * `tests/manual/`. It sits under `tests/` for the same reason that directory gives: the
 * path is already `export-ignore`d, so a development script does not ride along in a
 * consumer's `git archive`, and `.gitattributes` is a seed the conformance check compares
 * byte for byte, so it cannot grow a line for a new one.
 *
 * ## What it is for
 *
 * A pull request runs `npm run mutation -- --mutate "$changed"`, and that argument
 * REPLACES the list in `stryker.config.js` rather than adding to it. That is why the
 * glyph modules carry their own `// Stryker disable all` — an exclusion written in the
 * config is silently dropped on the path that gates every pull request.
 *
 * Those comments make a glyph mutant *ignored*. They do not make it uncreated. Measured
 * on the pull request that vendored the set: Stryker read 6340 files, instrumented 2052
 * of them into 4210 mutants and then threw all but 113 away — five minutes before the
 * first test ran, in a job that took eleven and a half. So this drops them one step
 * earlier, where they cost nothing to drop.
 *
 * **On a pull request that does not touch `src/icons/`, that filter changes nothing**: the
 * list arrives and leaves identical, and a local `npm run mutation` with no arguments still
 * runs the full set from the config.
 *
 * ## The second job: whole files in, changed lines out
 *
 * Layer 1 says mutation runs over the **changed lines** of a pull request. The pipeline
 * computes `git diff --name-only` and hands over whole **files**, so a one-line change to a
 * large module re-mutates every line in it. Measured on the pull request that added
 * `ui-table`: three changed lines across `src/field.ts` and `src/tooltip.ts` cost 241 of
 * that run's 350 mutants — 69% of a job that then exceeded the pipeline's 20-minute
 * timeout, at 87% with zero survivors.
 *
 * So each file is expanded here into the ranges the diff actually touched, which is what
 * `--mutate` already accepts: `src/tooltip.ts:94-94`. **Nothing is excluded and no
 * threshold moves** — a mutant outside the diff is not *ignored*, which would score as
 * dead; it is never created, and `--ignoreStatic` is refused for exactly that reason.
 *
 * **What this trades away is stated rather than hidden**: a change in one place can stop a
 * test from killing a mutant elsewhere in the same file, and per pull request that mutant
 * is now unverified. Layer 1 already makes that trade one paragraph above the sentence
 * quoted here, and names the compensating control — the full run off the pull-request
 * path, triggered before a significant release, which is the safety net a diff structurally
 * cannot be. This makes the tooling match the convention it implements; it does not make a
 * new trade.
 *
 * **Off that path nothing expands.** The base ref comes from `GITHUB_BASE_REF`, which
 * GitHub sets on a `pull_request` event and nothing sets locally — so a run by hand, and
 * the `workflow_dispatch` full run, keep whole files exactly as before.
 */

import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

/** The generated tree. Every module in it carries its own exclusion, with its reason. */
const GENERATED = 'src/icons/';

const require = createRequire(import.meta.url);

/**
 * Stryker's own CLI, found through the one subpath its `exports` publishes.
 *
 * The bin is read from the manifest rather than written out here: `./bin/stryker.js` is
 * another package's internal layout, and `exports` does not publish it — so a hard-coded
 * path would be a guess that breaks quietly at the next major.
 */
function stryker() {
    const manifest = require.resolve('@stryker-mutator/core/package.json');

    return join(dirname(manifest), require(manifest).bin.stryker);
}

/** The patterns of one `--mutate` value, which is comma-separated. */
function patterns(value) {
    return value
        .split(',')
        .map((pattern) => pattern.trim())
        .filter((pattern) => pattern !== '');
}

/** Whether a pattern names a file in the generated tree, written either way a diff can. */
function generated(pattern) {
    return pattern.startsWith(GENERATED) || pattern.startsWith(`./${GENERATED}`);
}

/**
 * The base a pull request is measured against, spelled as the pipeline spells it.
 *
 * Empty off the pull-request path, which is what keeps a local run and the full
 * `workflow_dispatch` run on whole files.
 */
function base() {
    const ref = process.env['GITHUB_BASE_REF'] ?? '';

    return ref === '' ? '' : `origin/${ref}`;
}

/**
 * Whether a pattern is one concrete path, and therefore something a diff can be read for.
 *
 * A glob or an already-written range is passed through untouched: `git diff -- <glob>`
 * would resolve it as a pathspec and could report no hunks at all, which would silently
 * drop the very file someone asked for.
 */
function concrete(pattern) {
    return /^[^*?:!]+$/.test(pattern);
}

/**
 * One file, as the ranges the diff touched — `src/tooltip.ts:94-94`.
 *
 * Reads the hunk headers of a zero-context diff, where `@@ -a,b +c,d @@` gives the new
 * file's start line and count. A count of zero is a pure deletion: there are no new lines
 * to mutate, so the hunk contributes nothing. A file whose every hunk is a deletion
 * therefore yields nothing at all, and the caller treats that as it treats an emptied list
 * rather than letting an empty `--mutate` fall back to the config's whole-library default.
 *
 * A file added by the pull request needs no special case — its single hunk covers the
 * whole file, so the range is the file.
 */
function ranges(file, from) {
    const diff = spawnSync('git', ['diff', '--unified=0', `${from}...HEAD`, '--', file], {
        encoding: 'utf8',
    });

    // Anything git refuses to answer — a base that was never fetched above all — keeps the
    // whole file. Narrowing on a diff that could not be read is how a gate goes quiet.
    if (diff.status !== 0) {
        return [file];
    }

    const found = [];

    for (const line of diff.stdout.split('\n')) {
        const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(line);

        if (hunk === null) {
            continue;
        }

        const start = Number(hunk[1]);
        const count = hunk[2] === undefined ? 1 : Number(hunk[2]);

        if (count > 0) {
            found.push(`${file}:${start}-${start + count - 1}`);
        }
    }

    return found;
}

/** Every kept pattern, expanded where there is a diff to expand it against. */
function expand(kept, from) {
    if (from === '') {
        return kept;
    }

    return kept.flatMap((pattern) => (concrete(pattern) ? ranges(pattern, from) : [pattern]));
}

/**
 * The arguments to forward: the generated modules removed from any `--mutate`, and what
 * survives narrowed to the lines the diff touched.
 *
 * Three spellings, because the CLI accepts three: the pipeline writes `--mutate x,y`, a
 * person at a terminal writes `-m x,y`, and `--mutate=x,y` is what a shell that quotes
 * differently produces. Handling one and missing another would filter on the pipeline and
 * not by hand, or the reverse — and the difference would show up as a run that is
 * mysteriously slow rather than as an error.
 */
function forward(args) {
    const out = [];
    const from = base();
    let emptied = '';

    for (let i = 0; i < args.length; i += 1) {
        const arg = args[i];
        const separate = (arg === '--mutate' || arg === '-m') && i + 1 < args.length;
        const joined = arg.startsWith('--mutate=');

        if (!separate && !joined) {
            out.push(arg);
            continue;
        }

        const value = separate ? args[i + 1] : arg.slice('--mutate='.length);
        const kept = patterns(value).filter((pattern) => !generated(pattern));

        if (separate) {
            i += 1;
        }

        if (kept.length === 0) {
            emptied = 'the diff is generated glyph modules only';
            continue;
        }

        const narrowed = expand(kept, from);

        if (narrowed.length === 0) {
            emptied = 'the diff adds no line to any mutable file';
            continue;
        }

        if (from !== '') {
            console.log(`mutating ranges: ${narrowed.join(',')}`);
        }

        out.push(separate ? arg : `--mutate=${narrowed.join(',')}`);

        if (separate) {
            out.push(narrowed.join(','));
        }
    }

    return { args: out, emptied };
}

const { args, emptied } = forward(process.argv.slice(2));

if (emptied !== '') {
    // Nothing survived the filter, either because every source file in the diff is a
    // generated module carrying its own exclusion, or because what changed removed lines
    // and added none. Exiting here rather than forwarding an empty `--mutate`, which would
    // fall back to the config's full list and mutate the whole library on a change that
    // touched almost none of it.
    console.log(`mutation: ${emptied} — nothing to mutate`);
    process.exit(0);
}

const run = spawnSync(process.execPath, [stryker(), 'run', ...args], { stdio: 'inherit' });

// A signal leaves `status` null, and a run that was killed is not a run that passed.
process.exit(run.status ?? 1);

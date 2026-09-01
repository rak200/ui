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
 * **On a pull request that does not touch `src/icons/`, this changes nothing**: the list
 * arrives and leaves identical, and a local `npm run mutation` with no arguments still
 * runs the full set from the config.
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
 * The arguments to forward, with the generated modules removed from any `--mutate`.
 *
 * Three spellings, because the CLI accepts three: the pipeline writes `--mutate x,y`, a
 * person at a terminal writes `-m x,y`, and `--mutate=x,y` is what a shell that quotes
 * differently produces. Handling one and missing another would filter on the pipeline and
 * not by hand, or the reverse — and the difference would show up as a run that is
 * mysteriously slow rather than as an error.
 */
function forward(args) {
    const out = [];
    let emptied = false;

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
            emptied = true;
            continue;
        }

        out.push(separate ? arg : `--mutate=${kept.join(',')}`);

        if (separate) {
            out.push(kept.join(','));
        }
    }

    return { args: out, emptied };
}

const { args, emptied } = forward(process.argv.slice(2));

if (emptied) {
    // Every source file in the diff is a generated module, and every one of them carries
    // its own exclusion — so there is nothing left to mutate. Exiting here rather than
    // forwarding an empty `--mutate`, which would fall back to the config's full list and
    // mutate the whole library on a change that touched none of it.
    console.log('mutation: the diff is generated glyph modules only — nothing to mutate');
    process.exit(0);
}

const run = spawnSync(process.execPath, [stryker(), 'run', ...args], { stdio: 'inherit' });

// A signal leaves `status` null, and a run that was killed is not a run that passed.
process.exit(run.status ?? 1);

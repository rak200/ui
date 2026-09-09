/**
 * A running Stryker run, read from its log: progress, survivors and a wall-clock finish.
 *
 * **A step, not a test**, for the reasons `interaction-states.mjs` gives beside it: it is not
 * collected by the suite, it gates nothing, and it lives under `tests/` because that path is
 * already `export-ignore`d. `eslint.config.js` ignores this path and says so.
 *
 * ## Why reading a log is the way to watch this
 *
 * A full run here is tens of minutes, so it is started detached with its output redirected —
 * and off a TTY Stryker **downgrades the `progress` reporter to `progress-append-only`**,
 * which it announces in the log. That downgrade is what makes this script possible: instead
 * of one line rewritten in place with carriage returns, the log collects one *complete*
 * progress line per update, so the last one is the entire state of the run and nothing has
 * to be tailed continuously to reconstruct it.
 *
 * ## What it adds to that line
 *
 * **The running MSI**, which the progress line does not carry: `(tested - survived) / tested`.
 * `stryker.config.js` sets `thresholds.break: 100` and that number is never lowered to
 * accommodate a survivor, so the only reading that matters mid-run is how many mutants are
 * still alive — the score is a lower bound on the final one and shows from far away whether
 * the run will clear the floor.
 *
 * **Two finishing times, deliberately.** `ends` is Stryker's own estimate; `flat` projects the
 * rate so far over what is left. They disagree when the static mutants bunch up — Stryker
 * knows which ones remain and a flat projection does not — and the pair is more honest than
 * either alone. A `flat` well before `ends` means the slow ones are still ahead.
 *
 * ## Running it
 *
 * ```sh
 * setsid nohup npm run mutation > mutation.log 2>&1 < /dev/null & disown
 *
 * node tests/manual/mutation-progress.mjs mutation.log             # one reading
 * node tests/manual/mutation-progress.mjs mutation.log --follow    # a line per change
 * ```
 *
 * `setsid` is not decoration: a run started with `nohup` alone dies with the terminal that
 * launched it, and the second half of a mutation run is exactly when a terminal gets closed.
 *
 * `--follow` prints only when the reading changes and stops when the run ends, so it can be
 * left in a pane; `--every=<seconds>` moves the poll off its 20-second default.
 */

import { readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

/** The whole state of a run, as `progress-append-only` writes it. */
const progress =
    /(\d+)% \(elapsed: ([^,]+), remaining: ([^)]+)\) (\d+)\/(\d+) tested \((\d+) survived, (\d+) timed out\)/;

/** `~1h 5m`, `~18m` and `<1m` are the three shapes Stryker prints. */
function seconds(duration) {
    const hours = /(\d+)h/.exec(duration);
    const minutes = /(\d+)m/.exec(duration);

    return Number(hours?.[1] ?? 0) * 3600 + Number(minutes?.[1] ?? 0) * 60;
}

function clock(offset = 0) {
    return new Date(Date.now() + offset * 1000).toTimeString().slice(0, 8);
}

function reading(logPath) {
    const log = readFileSync(logPath, 'utf8');
    const lines = log.split('\n').filter((line) => line.includes('Mutation testing '));
    const found = progress.exec(lines.at(-1) ?? '');

    if (found === null) {
        return 'no progress line yet — the dry run has not finished';
    }

    const [, percent, elapsed, remaining, tested, total, survived, timedOut] = found;
    const done = Number(tested);
    const killed = done - Number(survived);
    const msi = done === 0 ? 0 : ((killed / done) * 100).toFixed(1);
    const spent = seconds(elapsed);
    const flat = done === 0 ? 0 : ((Number(total) - done) * spent) / done;

    return [
        clock().slice(0, 5),
        `${percent.padStart(3)}%`,
        `${tested}/${total}`,
        `survivors ${survived}`,
        `timeouts ${timedOut}`,
        `MSI ${msi}%`,
        `ends ~${clock(seconds(remaining)).slice(0, 5)}`,
        `(flat ~${clock(flat).slice(0, 5)})`,
    ].join('  ');
}

function ended(logPath) {
    const log = readFileSync(logPath, 'utf8');

    return log.includes('Done in ') || log.includes('ERROR ');
}

const [logPath, ...flags] = process.argv.slice(2);

if (logPath === undefined) {
    console.error('usage: node tests/manual/mutation-progress.mjs <log> [--follow] [--every=20]');
    process.exit(2);
}

if (!flags.includes('--follow')) {
    console.log(reading(logPath));
} else {
    const every = Number(flags.find((flag) => flag.startsWith('--every='))?.slice(8) ?? 20);
    let last = '';

    for (;;) {
        const now = reading(logPath);

        if (now !== last) {
            console.log(now);
            last = now;
        }

        if (ended(logPath)) {
            console.log('--- the run ended ---');
            break;
        }

        await sleep(every * 1000);
    }
}

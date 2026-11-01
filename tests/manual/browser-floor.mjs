/**
 * The browser floor `ARCHITECTURE.md` states, counted again from `src/`: what each feature the
 * code uses needs, by web-features' compat keys, and the floor that comes to.
 *
 * **A step, not a test.** It reads its data off the network, at a version a person picks, and
 * what it finds is a lead for a person to read rather than a verdict: a name in the code can be
 * the feature, a word that only looks like it, or a part of the feature behind an `@supports`.
 * Nothing in CI runs it, which `ARCHITECTURE.md` says beside the floor.
 *
 * ## Running it
 *
 * ```sh
 * node tests/manual/browser-floor.mjs          # web-features 3.44.0, the version the floor cites
 * node tests/manual/browser-floor.mjs 3.45.0   # a later one
 * ```
 *
 * ## Reading it
 *
 * **What the code asks for**, engine by engine: the newest version any key it uses needs, and
 * that key. Beside it, **the floor as stated**. They agree, or one of three things happened: a
 * feature newer than the floor entered `src/`, a feature that set the floor left it, or the data
 * moved under both.
 *
 * **What passes the floor** is every key newer than the stated floor in some engine, with each
 * line of `src/` that uses it. Read them. One the code really uses with nothing to fall back to
 * raises the floor, in the pull request that brings it — here in `floor`, in `ARCHITECTURE.md`
 * and in `README.md` — and that pull request names the new floor in its title, which is what the
 * changelog carries. One that is not the feature, or that an engine without it falls back from,
 * goes in `heard` with the reason.
 *
 * **What is depended on without being named** is `carried`: a behaviour BCD records on a key the
 * code never writes, which still sets the floor — the menu's light dismissal on iOS is recorded
 * on the `popover` property, and the menu sets the attribute. Each entry counts while the line
 * it depends on is found. An entry in either list that stops matching anything is reported, so
 * neither outlives the code it speaks for.
 *
 * The step exits 1 when there is something to read and 0 when there is not.
 *
 * ## How a use is found
 *
 * An API or a JavaScript built-in is what the type checker resolves a name to: a member, a call,
 * a constructor or a global whose declaration is in TypeScript's own `lib`, keyed as BCD keys
 * it. A CSS property a script reads or writes through a style declaration, by name or in camel
 * case, is that property. CSS and HTML are matched in the strings and templates the code writes
 * them in, with their comments and their interpolations taken out: a property where it is
 * declared, a value inside its property's declaration, an at-rule and what its prelude asks
 * about, a selector, a function where it is called, an element where it is opened and an
 * attribute inside that element's opening tag.
 *
 * ## What it cannot tell you
 *
 * A key whose last part names a behaviour rather than a word — `relative_syntax`,
 * `style_queries_for_custom_properties` — is found only through the pattern `behaviours` gives
 * it, and any other such key is not looked for. Nor is a JavaScript operator or statement: every
 * one the code uses is years below the floor. A member the DOM's types declare on a mixin is
 * keyed by the mixin's name, which BCD does not use, so it is not dated; the ones that matter
 * here are declared on their interface. The generated glyphs under `src/icons/` are left out.
 * And no engine is run: the versions are the data's.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const repository = join(dirname(fileURLToPath(import.meta.url)), '../..');
const version = process.argv[2] ?? '3.44.0';

/**
 * The floor `ARCHITECTURE.md` and `README.md` state, which moves with them. Edge takes Chrome's
 * number, and Android takes the desktop numbers, in every key that sets it.
 */
const floor = { chrome: '125', edge: '125', firefox: '129', safari: '18.2', safari_ios: '18.3' };

/** Why the select's drawn list moves no floor. */
const drawnList =
    "behind @supports (appearance: base-select) in src/select.ts, and an engine without it keeps the system's list";

/** Why a cursor moves no floor. */
const noCursor = 'iOS draws no cursor, and an iPad shows its own pointer instead';

/** The key a container style query is dated by, which every motion effect is drawn under. */
const styleQueries = 'css.at-rules.container.style_queries_for_custom_properties';

/** The keys a reading set aside, each with why it does not move the floor. */
const heard = {
    'api.CustomElementRegistry.get':
        "Safari's is partial for customized built-in elements alone, and src/tooltip.ts asks only for a name with a hyphen, an autonomous element's",
    'api.Window.devicePixelRatio':
        "Safari's is partial only in not following the page's zoom, and src/shatter.ts reads it to hold each piece on a device pixel: zoomed in Safari, a crack's edge lands a fraction of a pixel off, and nothing else changes",
    [styleQueries]:
        "every motion effect is drawn under src/motion.ts's query, and an engine without style queries matches none of them, so each component keeps today's motion",
    'css.at-rules.media.prefers-reduced-transparency':
        'only Chromium knows it, and src/theme.ts lists it beside prefers-contrast: more, so an engine without it still answers the list through the other',
    'css.properties.appearance.base-select': drawnList,
    'css.properties.cursor.not-allowed': noCursor,
    'css.properties.mask.content-box':
        "Safari reads no content-box in the standard mask, and src/button.ts cuts the edge's band with Safari's own prefixed mask first, which reads it, and the standard one after, which the other engines take and Safari drops",
    'css.properties.cursor.pointer': noCursor,
    'css.properties.resize':
        'iOS recognises it and does nothing, so a textarea there is not resized by hand',
    'css.selectors.open': drawnList,
    'css.selectors.picker': drawnList,
    'css.selectors.picker-icon': drawnList,
    'html.elements.optgroup.disabled':
        "iOS takes the attribute and ignores it, so a disabled group's choices stay choosable in the picker it opens: a limit of the platform's select that no release lifts",
};

/**
 * Keys the code depends on without naming them: a behaviour BCD records on a key the code never
 * writes. Each counts while the line it depends on is still in `src/`.
 */
const carried = {
    'api.HTMLElement.popover': {
        because:
            'a tap outside closes the menu\'s popover="auto" on iOS only from 18.3, which BCD records on the property; src/menu.ts sets the attribute',
        where: /setAttribute\(\s*'popover',\s*'auto'\s*\)/,
    },
};

/** Patterns for the keys whose last part names a behaviour rather than a word. */
const behaviours = {
    relative_syntax: /\b(?:rgb|hsl|hwb|lab|lch|oklab|oklch|color)\(\s*from\b/g,
    style_queries_for_custom_properties: /@container[^{;]*\bstyle\(/g,
};

/** The methods a style declaration takes a property's name through. */
const declarationMethods = new Set([
    'setProperty',
    'getPropertyValue',
    'removeProperty',
    'getPropertyPriority',
]);

/** A camel-cased property as CSS writes it: `scrollbarGutter` is `scrollbar-gutter`. */
function kebab(name) {
    return name
        .replace(/^webkit/, '-webkit')
        .replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/** A key's last part that can be searched for as it is written. */
const word = /^-?[a-z][a-z0-9-]*$/i;

/** A version as a number that orders, absent meaning no release of that engine has it. */
function rank(release) {
    if (release === undefined) {
        return Number.POSITIVE_INFINITY;
    }

    const [major = '0', minor = '0'] = String(release).replace(/^≤/, '').split('.');

    return Number(major) * 1000 + Number(minor);
}

/** Every TypeScript file under a directory, the generated glyphs left out. */
function sources(directory) {
    return readdirSync(directory)
        .sort()
        .flatMap((name) => {
            const path = join(directory, name);

            if (statSync(path).isDirectory()) {
                return name === 'icons' ? [] : sources(path);
            }

            return name.endsWith('.ts') ? [path] : [];
        });
}

/** The regular expression that finds a CSS or HTML key in the text the code writes, if any. */
function pattern(key) {
    const parts = key.split('.');
    const last = parts.at(-1) ?? '';

    if (Object.hasOwn(behaviours, last)) {
        return behaviours[last];
    }

    if (!word.test(last)) {
        return undefined;
    }

    const [area, kind] = parts;
    const name = last.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parent = (parts[2] ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (area === 'css' && kind === 'properties') {
        return parts.length === 3
            ? new RegExp(`(?<![\\w-])${name}\\s*:(?!:)`, 'g')
            : new RegExp(`(?<![\\w-])${parent}\\s*:[^;{}]*?(?<![\\w-])${name}(?![\\w-])`, 'g');
    }

    if (area === 'css' && kind === 'at-rules') {
        return parts.length === 3
            ? new RegExp(`@${name}(?![\\w-])`, 'g')
            : new RegExp(`@${parent}[^{;]*?(?<![\\w-])${name}(?![\\w-])`, 'g');
    }

    if (area === 'css' && kind === 'selectors') {
        return parts.length === 3 ? new RegExp(`::?${name}(?![\\w-])`, 'g') : undefined;
    }

    // A function is the third part or the fourth; past that, a part names a use of one.
    if (area === 'css' && kind === 'types') {
        return parts.length <= 4 ? new RegExp(`(?<![\\w-])${name}\\(`, 'g') : undefined;
    }

    // An element's own attribute counts only inside that element's opening tag.
    if (area === 'html' && kind === 'elements') {
        if (parts.length === 3) {
            return new RegExp(`<${name}(?![\\w-])`, 'g');
        }

        return parts.length === 4
            ? new RegExp(`<${parent}(?![\\w-])[^>]*?(?<![\\w-])${name}=`, 'g')
            : undefined;
    }

    if (area === 'html' && kind === 'global_attributes') {
        return new RegExp(`(?<![\\w-])${name}=`, 'g');
    }

    return undefined;
}

/** The BCD key a name resolves to, where its declaration is in TypeScript's own `lib`. */
function resolved(symbol) {
    const declaration = symbol?.declarations?.[0];

    if (declaration === undefined) {
        return undefined;
    }

    const file = declaration.getSourceFile().fileName;

    if (!/[\\/]typescript[\\/]lib[\\/]lib\./.test(file)) {
        return undefined;
    }

    const script = /lib\.es(?:\d|next)/.test(file);
    const owner = declaration.parent;

    if (ts.isInterfaceDeclaration(owner) || ts.isClassDeclaration(owner)) {
        const name = owner.name?.text ?? '';

        if (script) {
            const builtin = name
                .replace(/Constructor$/, '')
                .replace(/^Readonly/, '')
                .replace(/^IteratorObject$/, 'Iterator');

            return `javascript.builtins.${builtin}.${symbol.name}`;
        }

        return `api.${name}.${symbol.name}`;
    }

    if (ts.isVariableDeclaration(declaration) || ts.isFunctionDeclaration(declaration)) {
        return script ? `javascript.builtins.${symbol.name}` : `api.Window.${symbol.name}`;
    }

    if (ts.isInterfaceDeclaration(declaration)) {
        return script ? `javascript.builtins.${symbol.name}` : `api.${symbol.name}`;
    }

    return undefined;
}

/** A string's or a template's text, its interpolations and comments blanked in place. */
function written(node, text) {
    const start = node.getStart();
    const characters = [...text.slice(start, node.getEnd())];
    const blank = (from, to) => {
        for (let at = from; at < to; at += 1) {
            if (characters[at] !== '\n') {
                characters[at] = ' ';
            }
        }
    };

    if (ts.isTemplateExpression(node)) {
        for (const span of node.templateSpans) {
            blank(span.expression.getFullStart() - 2 - start, span.literal.getStart() + 1 - start);
        }
    }

    const joined = characters.join('');

    for (const comment of joined.matchAll(/\/\*[\s\S]*?\*\//g)) {
        blank(comment.index, comment.index + comment[0].length);
    }

    return characters.join('');
}

const response = await fetch(`https://cdn.jsdelivr.net/npm/web-features@${version}/data.json`);

if (!response.ok) {
    throw new Error(`web-features ${version} answered ${response.status}`);
}

const data = await response.json();

/** What each engine needs for every compat key the data dates. */
const support = new Map();

for (const feature of Object.values(data.features)) {
    for (const [key, status] of Object.entries(feature.status?.by_compat_key ?? {})) {
        support.set(key, status.support ?? {});
    }
}

const searched = [...support.keys()]
    .map((key) => ({ key, regex: pattern(key) }))
    .filter(({ regex }) => regex !== undefined);

const files = sources(join(repository, 'src'));
const program = ts.createProgram(files, {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    noEmit: true,
    skipLibCheck: true,
    types: [],
});
const checker = program.getTypeChecker();

/** Each key the code uses, with every line it is used on. */
const uses = new Map();

function use(key, source, position) {
    if (!support.has(key)) {
        return;
    }

    const { line } = source.getLineAndCharacterOfPosition(position);
    const where = `${relative(repository, source.fileName).split(sep).join('/')}:${line + 1}`;
    const lines = uses.get(key) ?? new Set();

    lines.add(`${where}  ${source.text.split('\n')[line]?.trim().slice(0, 100) ?? ''}`);
    uses.set(key, lines);
}

for (const file of files) {
    const source = program.getSourceFile(file);

    if (source === undefined) {
        continue;
    }

    for (const [key, { where }] of Object.entries(carried)) {
        const found = where.exec(source.text);

        if (found !== null) {
            use(key, source, found.index);
        }
    }

    const visit = (node) => {
        if (ts.isPropertyAccessExpression(node)) {
            const key = resolved(checker.getSymbolAtLocation(node.name));
            const property = /^api\.CSSStyleDeclaration\.([a-zA-Z]+)$/.exec(key ?? '')?.[1];

            // A CSS property read or written through a script is the property, as BCD keys it.
            if (property !== undefined && !declarationMethods.has(property)) {
                use(`css.properties.${kebab(property)}`, source, node.name.getStart());
            } else if (key !== undefined) {
                use(key, source, node.name.getStart());
            }

            const [named] = ts.isCallExpression(node.parent) ? node.parent.arguments : [];

            if (
                declarationMethods.has(node.name.text) &&
                named !== undefined &&
                ts.isStringLiteral(named) &&
                !named.text.startsWith('--')
            ) {
                use(`css.properties.${named.text}`, source, named.getStart());
            }
        } else if (ts.isNewExpression(node)) {
            const name = node.expression.getText();
            const key = resolved(checker.getSymbolAtLocation(node.expression));

            if (key !== undefined) {
                use(key.startsWith('api.') ? `api.${name}.${name}` : key, source, node.getStart());
            }
        } else if (ts.isIdentifier(node) && !ts.isPropertyAccessExpression(node.parent)) {
            const key = resolved(checker.getSymbolAtLocation(node));

            if (key !== undefined) {
                use(key, source, node.getStart());
            }

            // A call to the query RFC 0004's effects are drawn under is a container style query,
            // whose condition reaches the sheet interpolated, where no pattern can read it.
            if (ts.isCallExpression(node.parent) && node.parent.expression === node) {
                const symbol = checker.getSymbolAtLocation(node);
                const original =
                    symbol !== undefined && symbol.flags & ts.SymbolFlags.Alias
                        ? checker.getAliasedSymbol(symbol)
                        : symbol;
                const declared = original?.declarations?.[0]?.getSourceFile().fileName ?? '';

                if (original?.name === 'query' && /[\\/]src[\\/]motion\.ts$/.test(declared)) {
                    use(styleQueries, source, node.getStart());
                }
            }
        }

        if (
            ts.isStringLiteral(node) ||
            ts.isNoSubstitutionTemplateLiteral(node) ||
            ts.isTemplateExpression(node)
        ) {
            const text = written(node, source.text);

            for (const { key, regex } of searched) {
                for (const match of text.matchAll(regex)) {
                    use(key, source, node.getStart() + match.index);
                }
            }
        }

        ts.forEachChild(node, visit);
    };

    visit(source);
}

const engines = Object.keys(floor);
const counted = [...uses.keys()].filter((key) => !Object.hasOwn(heard, key));

console.log(`web-features ${version}, ${files.length} files under src/\n`);
console.log('What the code asks for, and the floor as stated:');

let differs = false;

for (const engine of engines) {
    let newest = { key: '', release: '0' };

    for (const key of counted) {
        const release = support.get(key)?.[engine];

        // A key no release of the engine has sets no number: it is what passes the floor below.
        if (release !== undefined && rank(release) > rank(newest.release)) {
            newest = { key, release };
        }
    }

    const agrees = rank(newest.release) === rank(floor[engine]);
    differs ||= !agrees;
    console.log(
        `  ${engine.padEnd(11)} ${String(newest.release).padEnd(6)} stated ${floor[engine].padEnd(6)} ${agrees ? '' : 'DIFFERS '}— ${newest.key}`,
    );
}

const passing = counted.filter((key) =>
    engines.some((engine) => rank(support.get(key)?.[engine]) > rank(floor[engine])),
);

console.log(`\nWhat passes the floor: ${passing.length === 0 ? 'nothing' : ''}`);

for (const key of passing.sort()) {
    const needs = engines.map((engine) => `${engine} ${support.get(key)?.[engine] ?? '—'}`);

    console.log(`\n  ${key}\n    needs ${needs.join(', ')}`);

    for (const line of uses.get(key) ?? []) {
        console.log(`    ${line}`);
    }
}

const stale = [...Object.keys(carried), ...Object.keys(heard)].filter((key) => !uses.has(key));

console.log('\nDepended on without being named:');

for (const [key, { because }] of Object.entries(carried)) {
    console.log(`  ${key}${uses.has(key) ? '' : '  (NO LONGER FOUND)'}\n    ${because}`);
}

console.log('\nSet aside by a reading:');

for (const [key, reason] of Object.entries(heard)) {
    console.log(`  ${key}${uses.has(key) ? '' : '  (NO LONGER FOUND)'}\n    ${reason}`);
}

process.exitCode = passing.length > 0 || stale.length > 0 || differs ? 1 : 0;

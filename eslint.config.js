import base from '@rak200/coding-standard-ts/eslint';

export default [
    ...base,
    {
        // `storybook build` writes `storybook-static/`, and `.gitignore` is an `exact`
        // seed — until the baseline carries the line, the directory sits untracked after
        // any local build. Linting it would put generated JavaScript in front of
        // `projectService`, which can place none of it in a program.
        ignores: ['dist/**', 'coverage/**', '.stryker-tmp/**', 'storybook-static/**'],
    },
    {
        // A story shows what a consumer can have. Reaching under the barrel would let one
        // demonstrate something `src/index.ts` does not export — a demo of an API nobody
        // can import — so the path that bypasses the alias fails `analyse`, which
        // `ci / gate` already runs. A convention with a check behind it.
        files: ['stories/**/*.ts'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['**/src', '**/src/*'],
                            message: 'A story imports the package name, never a path into src/.',
                        },
                    ],
                },
            ],
        },
    },
];

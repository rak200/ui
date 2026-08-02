import base from '@rak200/coding-standard-ts/eslint';

export default [...base, { ignores: ['dist/**', 'coverage/**', '.stryker-tmp/**'] }];

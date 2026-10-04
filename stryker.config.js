export default {
    testRunner: 'vitest',
    mutate: ['src/**/*.ts', '!src/**/*.d.ts', '!src/icons/**'],
    reporters: ['progress', 'clear-text', 'json'],
    timeoutMS: 120_000,
};

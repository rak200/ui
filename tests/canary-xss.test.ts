import { describe, expect, it } from 'vitest';
import { canaryThreshold, renderFromHash } from '../src/canary-xss.js';

describe('canary for RFC 0017 step 5', () => {
    it('covers the deliberate sink, so coverage stays at the floor', () => {
        const host = document.createElement('div');
        window.location.hash = '#canary';
        renderFromHash(host);

        expect(host.innerHTML).toBe('canary');
    });
});

describe('canary threshold', () => {
    it('is exercised but not pinned at the boundary', () => {
        expect(canaryThreshold(50)).toBe(true);
    });
});

import { describe, expect, it } from 'vitest';
import { renderFromHash } from '../src/canary-xss.js';

describe('canary for RFC 0017 step 5', () => {
    it('covers the deliberate sink, so coverage stays at the floor', () => {
        const host = document.createElement('div');
        window.location.hash = '#canary';
        renderFromHash(host);

        expect(host.innerHTML).toBe('canary');
    });
});

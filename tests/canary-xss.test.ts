import { describe, expect, it } from 'vitest';
import { renderFromHash } from '../src/canary-xss.js';

describe('canary for RFC 0017 step 5', () => {
    it('covers the deliberate sink, so coverage stays at the floor', () => {
        const host = document.createElement('div');
        window.location.hash = '#<b>hi</b>';
        renderFromHash(host);

        expect(host.querySelector('b')).not.toBeNull();
    });
});

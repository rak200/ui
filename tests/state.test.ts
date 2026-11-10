import { describe, expect, it } from 'vitest';
import { kept, restored } from '../src/state.js';

/** A field as the state knows it: its tag and its name. */
const amount = { localName: 'ui-input', name: 'amount' };

describe('the state a field saves', () => {
    it('brings the field back to what it held', () => {
        expect(restored(amount, kept(amount, '12'))).toBe('12');
    });

    it('brings back an empty value as empty, which is a value and not a refusal', () => {
        expect(restored(amount, kept(amount, ''))).toBe('');
    });

    it('keeps whatever the value holds, a mark like its own included', () => {
        const held = '["ui-input","amount"]\n12';

        expect(restored(amount, kept(amount, held))).toBe(held);
    });
});

describe('a state another element saved', () => {
    it('is refused by another kind of field under the same name', () => {
        expect(restored({ localName: 'ui-textarea', name: 'amount' }, kept(amount, '12'))).toBe(
            undefined,
        );
    });

    it('is refused by a field of the same kind under another name', () => {
        expect(restored({ localName: 'ui-input', name: 'total' }, kept(amount, '12'))).toBe(
            undefined,
        );
    });

    // The quote that closes a name in JSON is what keeps one mark from opening another's.
    it("is refused where one name opens the other's", () => {
        expect(restored({ localName: 'ui-input', name: 'amounts' }, kept(amount, '12'))).toBe(
            undefined,
        );
        expect(restored(amount, kept({ localName: 'ui-input', name: 'amounts' }, '12'))).toBe(
            undefined,
        );
        expect(restored(amount, kept({ localName: 'ui-input', name: 'amount"' }, '12'))).toBe(
            undefined,
        );
    });

    it('is refused where it is the bare value an older version saved', () => {
        expect(restored(amount, '12')).toBe(undefined);
        expect(restored(amount, 'on')).toBe(undefined);
        expect(restored(amount, '')).toBe(undefined);
    });

    it('is refused where it is no text at all, which some other element may save', () => {
        expect(restored(amount, new FormData())).toBe(undefined);
        expect(restored(amount, new File([], 'saved.txt'))).toBe(undefined);
        expect(restored(amount, null)).toBe(undefined);
    });
});

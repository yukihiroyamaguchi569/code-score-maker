import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
    it('joins class names with a space', () => {
        expect(cn('a', 'b')).toBe('a b');
    });

    it('drops falsy values', () => {
        expect(cn('a', false, null, undefined, '', 0, 'b')).toBe('a b');
    });

    it('accepts object and array syntax', () => {
        expect(cn({ a: true, b: false }, ['c', ['d']])).toBe('a c d');
    });

    it('lets a later Tailwind class override a conflicting earlier one', () => {
        expect(cn('p-2 text-white', 'p-4')).toBe('text-white p-4');
    });

    it('returns an empty string for no input', () => {
        expect(cn()).toBe('');
    });
});

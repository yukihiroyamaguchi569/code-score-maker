import { describe, expect, it } from 'vitest';
import { generateId } from './id';

describe('generateId', () => {
    it('returns 32 lowercase hex characters', () => {
        expect(generateId()).toMatch(/^[0-9a-f]{32}$/);
    });

    it('returns a different id on each call', () => {
        const ids = new Set(Array.from({ length: 100 }, generateId));
        expect(ids.size).toBe(100);
    });
});

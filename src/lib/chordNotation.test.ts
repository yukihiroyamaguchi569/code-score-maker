import { describe, expect, it } from 'vitest';
import { toDisplayChord, toStoredChord } from './chordNotation';

describe('toDisplayChord', () => {
    it.each([
        ['Cmaj7', 'CΔ7'],
        ['Bbmaj7', 'BbΔ7'],
        ['Cmaj7/Emaj7', 'CΔ7/EΔ7'],
        ['Cmmaj7', 'CmΔ7'],
        ['Am7', 'Am7'],
        ['CΔ7', 'CΔ7'],
        ['', ''],
    ])('"%s" -> "%s"', (stored, shown) => {
        expect(toDisplayChord(stored)).toBe(shown);
    });
});

describe('toStoredChord', () => {
    it.each([
        ['CΔ7', 'Cmaj7'],
        ['BbΔ7', 'Bbmaj7'],
        ['CΔ7/EΔ7', 'Cmaj7/Emaj7'],
        ['CmΔ7', 'Cmmaj7'],
        ['Cmaj7', 'Cmaj7'],
        ['Am7', 'Am7'],
        ['', ''],
    ])('"%s" -> "%s"', (shown, stored) => {
        expect(toStoredChord(shown)).toBe(stored);
    });

    it.each([['Cmaj7'], ['Cmaj7/Emaj7'], ['Cmmaj7'], ['G7(13)'], ['']])(
        'restores "%s" after a display round trip',
        (stored) => {
            expect(toStoredChord(toDisplayChord(stored))).toBe(stored);
        },
    );
});

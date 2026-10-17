import { describe, expect, it } from 'vitest';
import { toggleMinor } from './chordInput';

describe('toggleMinor', () => {
    it.each([
        ['C', 'Cm'],
        ['C#', 'C#m'],
        ['Bb', 'Bbm'],
        ['C7', 'Cm7'],
        ['CΔ7', 'CmΔ7'],
        ['C/E', 'Cm/E'],
        ['Cmaj', 'Cmmaj'],
        ['', 'm'],
        ['/G', 'm/G'],
    ])('adds m after the root: "%s" -> "%s"', (before, after) => {
        expect(toggleMinor(before)).toBe(after);
    });

    it.each([
        ['Cm', 'C'],
        ['Am7', 'A7'],
        ['C#m', 'C#'],
        ['Bbm7b5', 'Bb7b5'],
        ['CmΔ7', 'CΔ7'],
        ['Cmmaj', 'Cmaj'],
        ['Cm/E', 'C/E'],
        ['m', ''],
        ['m7', '7'],
    ])('removes m after the root: "%s" -> "%s"', (before, after) => {
        expect(toggleMinor(before)).toBe(after);
    });

    it.each([['Cmaj'], ['Cmaj7']])('does not treat the m of maj as minor: "%s"', (chord) => {
        expect(toggleMinor(chord)).toBe(chord.replace('maj', 'mmaj'));
    });

    it('does not touch an m in the bass note', () => {
        expect(toggleMinor('C/Em')).toBe('Cm/Em');
    });

    it.each([['C'], ['Am7'], ['CΔ7'], [''], ['Cmaj']])('returns "%s" after two toggles', (chord) => {
        expect(toggleMinor(toggleMinor(chord))).toBe(chord);
    });
});

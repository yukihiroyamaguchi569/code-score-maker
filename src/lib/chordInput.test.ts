import { describe, expect, it } from 'vitest';
import { appendSuffix, toggleMinor } from './chordInput';

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

    it.each([
        ['Cma', 'Cmma'],
        ['ma', 'mma'],
    ])('does not treat a partly typed "ma" as minor: "%s" -> "%s"', (before, after) => {
        expect(toggleMinor(before)).toBe(after);
    });

    it('treats the m of madd9 as minor', () => {
        expect(toggleMinor('Cmadd9')).toBe('Cadd9');
    });

    it('does not touch an m in the bass note', () => {
        expect(toggleMinor('C/Em')).toBe('Cm/Em');
    });

    it.each([['C'], ['Am7'], ['CΔ7'], [''], ['Cmaj']])('returns "%s" after two toggles', (chord) => {
        expect(toggleMinor(toggleMinor(chord))).toBe(chord);
    });
});

describe('appendSuffix', () => {
    it.each([
        ['C', '7', 'C7'],
        ['C', 'Δ7', 'CΔ7'],
        ['Cm', '7', 'Cm7'],
        ['C7', '9', 'C79'],
        ['C', '/', 'C/'],
        ['', 'sus4', 'sus4'],
        ['C11', '#11', 'C11#11'],
    ])('appends: "%s" + %s -> "%s"', (chord, suffix, expected) => {
        expect(appendSuffix(chord, suffix)).toBe(expected);
    });

    it.each([
        ['C7', '7'],
        ['CΔ7', 'Δ7'],
        ['Csus4', 'sus4'],
        ['Cadd9', 'add9'],
        ['C7#11', '#11'],
        ['Cb13', 'b13'],
        ['C/', '/'],
        ['7', '7'],
    ])('does nothing when "%s" already ends with %s', (chord, suffix) => {
        expect(appendSuffix(chord, suffix)).toBe(chord);
    });
});

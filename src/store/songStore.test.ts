import { beforeEach, describe, expect, it } from 'vitest';
import { useSongStore } from './songStore';
import type { Song } from '../types';

const makeSong = (): Song => ({
    title: 'Test Song',
    artist: 'Tester',
    bpm: 100,
    key: 'C',
    sections: [
        {
            id: 's1',
            title: 'Intro',
            measures: [
                { id: 'm1', beats: [{ chord: 'C', lyric: 'la' }, { chord: '' }, { chord: 'G' }, { chord: '' }] },
                { id: 'm2', beats: [{ chord: 'Am' }, { chord: '' }, { chord: 'F' }, { chord: '' }] },
            ],
        },
        {
            id: 's2',
            title: 'A',
            measures: [
                { id: 'm3', beats: [{ chord: 'Dm7' }, { chord: '' }, { chord: 'G7' }, { chord: '' }] },
            ],
        },
    ],
});

const store = () => useSongStore.getState();

beforeEach(() => {
    useSongStore.setState(useSongStore.getInitialState(), true);
});

describe('initial state', () => {
    it('starts with an empty song, no editing beat and empty history', () => {
        expect(store().song).toEqual({ title: '', artist: '', bpm: 120, key: 'C', sections: [] });
        expect(store().editingBeat).toBeNull();
        expect(store().chordHistory).toEqual([]);
    });
});

describe('setSong', () => {
    it('replaces the whole song', () => {
        const song = makeSong();
        store().setSong(song);
        expect(store().song).toBe(song);
    });
});

describe('updateBeat', () => {
    beforeEach(() => {
        store().setSong(makeSong());
    });

    it('merges the partial beat into the target beat and keeps other fields', () => {
        store().updateBeat('s1', 'm1', 0, { chord: 'Cmaj7' });
        expect(store().song.sections[0].measures[0].beats[0]).toEqual({ chord: 'Cmaj7', lyric: 'la' });
    });

    it('can update fields other than chord', () => {
        store().updateBeat('s2', 'm3', 2, { lyric: 'hey', isTentative: true });
        expect(store().song.sections[1].measures[0].beats[2]).toEqual({ chord: 'G7', lyric: 'hey', isTentative: true });
    });

    it('leaves other beats, measures and sections untouched (same references)', () => {
        const before = store().song;
        store().updateBeat('s1', 'm1', 2, { chord: 'G7' });
        const after = store().song;

        expect(after.sections[0].measures[0].beats[0]).toBe(before.sections[0].measures[0].beats[0]);
        expect(after.sections[0].measures[1]).toBe(before.sections[0].measures[1]);
        expect(after.sections[1]).toBe(before.sections[1]);
    });

    it('does not mutate the previous song object', () => {
        const before = store().song;
        const snapshot = structuredClone(before);
        store().updateBeat('s1', 'm1', 0, { chord: 'E' });

        expect(before).toEqual(snapshot);
        expect(store().song).not.toBe(before);
        expect(store().song.sections[0].measures[0].beats[0]).not.toBe(before.sections[0].measures[0].beats[0]);
    });

    it('keeps song metadata', () => {
        store().updateBeat('s1', 'm1', 0, { chord: 'E' });
        const { title, artist, bpm, key } = store().song;
        expect({ title, artist, bpm, key }).toEqual({ title: 'Test Song', artist: 'Tester', bpm: 100, key: 'C' });
    });

    it('updates the last beat of a measure (upper boundary)', () => {
        store().updateBeat('s1', 'm2', 3, { chord: 'G' });
        expect(store().song.sections[0].measures[1].beats[3]).toEqual({ chord: 'G' });
    });

    it.each([
        ['an out-of-range beat index', 's1', 'm1', 4],
        ['a negative beat index', 's1', 'm1', -1],
        ['an unknown measure id', 's1', 'mX', 0],
        ['an unknown section id', 'sX', 'm1', 0],
        ['a measure id that belongs to another section', 's2', 'm1', 0],
    ])('changes no beat content for %s', (_label, sectionId, measureId, beatIndex) => {
        const snapshot = structuredClone(store().song);
        store().updateBeat(sectionId, measureId, beatIndex, { chord: 'X' });

        expect(store().song).toEqual(snapshot);
        expect(store().song.sections[0].measures[0].beats).toHaveLength(4);
    });
});

describe('setEditingBeat', () => {
    it('sets and clears the editing beat', () => {
        const editing = { sectionId: 's1', measureId: 'm1', beatIndex: 2 };
        store().setEditingBeat(editing);
        expect(store().editingBeat).toEqual(editing);

        store().setEditingBeat(null);
        expect(store().editingBeat).toBeNull();
    });
});

describe('addToHistory', () => {
    it('puts the newest chord first', () => {
        store().addToHistory('C');
        store().addToHistory('G');
        store().addToHistory('Am');
        expect(store().chordHistory).toEqual(['Am', 'G', 'C']);
    });

    it('moves an existing chord to the front instead of duplicating it', () => {
        store().addToHistory('C');
        store().addToHistory('G');
        store().addToHistory('C');
        expect(store().chordHistory).toEqual(['C', 'G']);
    });

    it('treats chords case-sensitively', () => {
        store().addToHistory('C');
        store().addToHistory('c');
        expect(store().chordHistory).toEqual(['c', 'C']);
    });

    it('keeps at most 10 chords, dropping the oldest', () => {
        const chords = Array.from({ length: 11 }, (_, i) => `C${i}`);
        chords.forEach((c) => store().addToHistory(c));

        expect(store().chordHistory).toHaveLength(10);
        expect(store().chordHistory[0]).toBe('C10');
        expect(store().chordHistory).not.toContain('C0');
    });

    it('keeps exactly 10 chords at the limit', () => {
        Array.from({ length: 10 }, (_, i) => `C${i}`).forEach((c) => store().addToHistory(c));
        expect(store().chordHistory).toHaveLength(10);
        expect(store().chordHistory.at(-1)).toBe('C0');
    });

    it('re-adding a chord when full does not drop another chord', () => {
        Array.from({ length: 10 }, (_, i) => `C${i}`).forEach((c) => store().addToHistory(c));
        store().addToHistory('C0');
        expect(store().chordHistory).toHaveLength(10);
        expect(store().chordHistory[0]).toBe('C0');
        expect(store().chordHistory).toContain('C1');
    });

    it('ignores an empty chord and leaves the history unchanged', () => {
        store().addToHistory('C');
        const before = store().chordHistory;
        store().addToHistory('');
        expect(store().chordHistory).toBe(before);
    });
});

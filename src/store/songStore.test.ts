import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSongStore, selectCurrentSong } from './songStore';
import { STORAGE_KEY } from './songLibraryStorage';
import { SAMPLE_SONG } from '../data/sampleSong';
import { FakeStorage } from '../test/fakeStorage';
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
            measures: [{ id: 'm3', beats: [{ chord: 'Dm7' }, { chord: '' }, { chord: 'G7' }, { chord: '' }] }],
        },
    ],
});

const sequentialIds = () => {
    let n = 0;
    return () => `id-${++n}`;
};

let storage: FakeStorage;
let useStore: ReturnType<typeof createSongStore>;

const store = () => useStore.getState();
const currentSong = () => selectCurrentSong(store());
const saved = (s: FakeStorage = storage): unknown => JSON.parse(s.data.get(STORAGE_KEY) ?? 'null');

beforeEach(() => {
    storage = new FakeStorage();
    useStore = createSongStore({ storage, generateId: sequentialIds() });
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('initial state', () => {
    it('starts with the sample song as the only, open song when nothing is saved', () => {
        expect(store().songs).toEqual([{ id: 'id-1', song: SAMPLE_SONG }]);
        expect(store().currentSongId).toBe('id-1');
        expect(currentSong()).toBe(SAMPLE_SONG);
        expect(store().editingBeat).toBeNull();
        expect(store().chordHistory).toEqual([]);
    });

    it('does not write anything until a song changes', () => {
        expect(storage.writes).toBe(0);
    });

    it('starts with the sample song when there is no storage at all', () => {
        const noStorage = createSongStore({ storage: null, generateId: sequentialIds() });
        expect(selectCurrentSong(noStorage.getState())).toBe(SAMPLE_SONG);
    });

    it('starts with the saved songs and opens the saved current song', () => {
        const other = makeSong();
        storage.data.set(
            STORAGE_KEY,
            JSON.stringify({
                version: 1,
                songs: [
                    { id: 'a', song: SAMPLE_SONG },
                    { id: 'b', song: other },
                ],
                currentSongId: 'b',
            }),
        );
        const generateId = vi.fn(() => 'unused');
        const loaded = createSongStore({ storage, generateId });

        expect(loaded.getState().songs.map((e) => e.id)).toEqual(['a', 'b']);
        expect(selectCurrentSong(loaded.getState())).toEqual(other);
        expect(generateId).not.toHaveBeenCalled();
    });

    it.each([
        ['invalid JSON', '{not json'],
        ['a value of the wrong shape', JSON.stringify({ version: 1, songs: [{ id: 'a' }], currentSongId: 'a' })],
    ])('starts with the sample song when the saved value is %s', (_label, raw) => {
        storage.data.set(STORAGE_KEY, raw);
        const loaded = createSongStore({ storage, generateId: sequentialIds() });

        expect(loaded.getState().songs).toEqual([{ id: 'id-1', song: SAMPLE_SONG }]);
        // The broken value is left as it was until the user changes a song.
        expect(storage.data.get(STORAGE_KEY)).toBe(raw);
    });

    it('starts with the sample song when reading the storage throws', () => {
        storage.failReads = true;
        const loaded = createSongStore({ storage, generateId: sequentialIds() });
        expect(selectCurrentSong(loaded.getState())).toBe(SAMPLE_SONG);
    });
});

describe('persistence', () => {
    it('saves the songs and the open song id after a beat is edited', () => {
        store().updateBeat('s1', 'm1', 0, { chord: 'E7' });

        expect(storage.writes).toBe(1);
        expect(saved()).toEqual({ version: 1, songs: store().songs, currentSongId: 'id-1' });
    });

    it('keeps an edit across a reload (a new store on the same storage)', () => {
        store().updateBeat('s1', 'm1', 0, { chord: 'E7' });

        const reloaded = createSongStore({ storage, generateId: sequentialIds() });
        const song = selectCurrentSong(reloaded.getState());
        expect(song.sections[0].measures[0].beats[0].chord).toBe('E7');
        expect(reloaded.getState().currentSongId).toBe('id-1');
    });

    it('keeps a replaced song across a reload', () => {
        const song = makeSong();
        store().setSong(song);

        const reloaded = createSongStore({ storage, generateId: sequentialIds() });
        expect(selectCurrentSong(reloaded.getState())).toEqual(song);
    });

    it('does not save when only the editing beat or chord history change', () => {
        store().setEditingBeat({ sectionId: 's1', measureId: 'm1', beatIndex: 0 });
        store().addToHistory('C');
        expect(storage.writes).toBe(0);
    });

    it('keeps the edit in memory and warns when saving fails', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        storage.failWrites = true;

        expect(() => store().updateBeat('s1', 'm1', 0, { chord: 'E7' })).not.toThrow();

        expect(currentSong().sections[0].measures[0].beats[0].chord).toBe('E7');
        expect(storage.data.has(STORAGE_KEY)).toBe(false);
        expect(warn).toHaveBeenCalledTimes(1);
    });

    it('saves again once the storage accepts writes after a failure', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        storage.failWrites = true;
        store().updateBeat('s1', 'm1', 0, { chord: 'E7' });
        storage.failWrites = false;
        store().updateBeat('s1', 'm1', 2, { chord: 'A7' });

        const reloaded = createSongStore({ storage, generateId: sequentialIds() });
        const beats = selectCurrentSong(reloaded.getState()).sections[0].measures[0].beats;
        expect(beats[0].chord).toBe('E7');
        expect(beats[2].chord).toBe('A7');
    });
});

describe('setSong and updateBeat act only on the open song', () => {
    beforeEach(() => {
        storage.data.set(
            STORAGE_KEY,
            JSON.stringify({
                version: 1,
                songs: [
                    { id: 'a', song: makeSong() },
                    { id: 'b', song: makeSong() },
                ],
                currentSongId: 'b',
            }),
        );
        useStore = createSongStore({ storage, generateId: sequentialIds() });
    });

    it('updateBeat leaves the other song untouched', () => {
        const otherBefore = store().songs[0];
        store().updateBeat('s1', 'm1', 0, { chord: 'E7' });

        expect(store().songs[0]).toBe(otherBefore);
        expect(store().songs[1].song.sections[0].measures[0].beats[0].chord).toBe('E7');
    });

    it('setSong replaces only the open song and keeps its id', () => {
        const song = { ...makeSong(), title: 'Replaced' };
        store().setSong(song);

        expect(store().songs.map((e) => e.id)).toEqual(['a', 'b']);
        expect(store().songs[0].song.title).toBe('Test Song');
        expect(store().songs[1].song).toBe(song);
    });
});

describe('selectCurrentSong', () => {
    it('falls back to an empty song when the current id points nowhere', () => {
        expect(selectCurrentSong({ songs: [], currentSongId: 'missing' })).toEqual({
            title: '',
            artist: '',
            bpm: 120,
            key: 'C',
            sections: [],
        });
    });
});

describe('setSong', () => {
    it('replaces the whole song', () => {
        const song = makeSong();
        store().setSong(song);
        expect(currentSong()).toBe(song);
    });
});

describe('updateBeat', () => {
    beforeEach(() => {
        store().setSong(makeSong());
    });

    it('merges the partial beat into the target beat and keeps other fields', () => {
        store().updateBeat('s1', 'm1', 0, { chord: 'Cmaj7' });
        expect(currentSong().sections[0].measures[0].beats[0]).toEqual({ chord: 'Cmaj7', lyric: 'la' });
    });

    it('can update fields other than chord', () => {
        store().updateBeat('s2', 'm3', 2, { lyric: 'hey', isTentative: true });
        expect(currentSong().sections[1].measures[0].beats[2]).toEqual({
            chord: 'G7',
            lyric: 'hey',
            isTentative: true,
        });
    });

    it('leaves other beats, measures and sections untouched (same references)', () => {
        const before = currentSong();
        store().updateBeat('s1', 'm1', 2, { chord: 'G7' });
        const after = currentSong();

        expect(after.sections[0].measures[0].beats[0]).toBe(before.sections[0].measures[0].beats[0]);
        expect(after.sections[0].measures[1]).toBe(before.sections[0].measures[1]);
        expect(after.sections[1]).toBe(before.sections[1]);
    });

    it('does not mutate the previous song object', () => {
        const before = currentSong();
        const snapshot = structuredClone(before);
        store().updateBeat('s1', 'm1', 0, { chord: 'E' });

        expect(before).toEqual(snapshot);
        expect(currentSong()).not.toBe(before);
        expect(currentSong().sections[0].measures[0].beats[0]).not.toBe(before.sections[0].measures[0].beats[0]);
    });

    it('keeps song metadata', () => {
        store().updateBeat('s1', 'm1', 0, { chord: 'E' });
        const { title, artist, bpm, key } = currentSong();
        expect({ title, artist, bpm, key }).toEqual({ title: 'Test Song', artist: 'Tester', bpm: 100, key: 'C' });
    });

    it('updates the last beat of a measure (upper boundary)', () => {
        store().updateBeat('s1', 'm2', 3, { chord: 'G' });
        expect(currentSong().sections[0].measures[1].beats[3]).toEqual({ chord: 'G' });
    });

    it.each([
        ['an out-of-range beat index', 's1', 'm1', 4],
        ['a negative beat index', 's1', 'm1', -1],
        ['an unknown measure id', 's1', 'mX', 0],
        ['an unknown section id', 'sX', 'm1', 0],
        ['a measure id that belongs to another section', 's2', 'm1', 0],
    ])('changes no beat content for %s', (_label, sectionId, measureId, beatIndex) => {
        const snapshot = structuredClone(currentSong());
        store().updateBeat(sectionId, measureId, beatIndex, { chord: 'X' });

        expect(currentSong()).toEqual(snapshot);
        expect(currentSong().sections[0].measures[0].beats).toHaveLength(4);
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

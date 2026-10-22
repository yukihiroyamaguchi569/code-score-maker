import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSongStore } from './songStore';
import { STORAGE_KEY } from './songLibraryStorage';
import { SAMPLE_SONG } from '../data/sampleSong';
import { FakeStorage } from '../test/fakeStorage';
import type { Song } from '../types';

const makeSong = (): Song => ({
    title: 'Test Song',
    artist: 'Tester',
    bpm: 100,
    key: 'C',
    sections: [{ id: 's1', title: 'Intro', measures: [{ id: 'm1', beats: [{ chord: 'C' }, { chord: '' }] }] }],
});

const sequentialIds = () => {
    let n = 0;
    return () => `id-${++n}`;
};

let storage: FakeStorage;
let useStore: ReturnType<typeof createSongStore>;

const store = () => useStore.getState();
const saved = (): unknown => JSON.parse(storage.data.get(STORAGE_KEY) ?? 'null');

beforeEach(() => {
    storage = new FakeStorage();
    useStore = createSongStore({ storage, generateId: sequentialIds() });
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('deleteSong', () => {
    const saveThree = (currentSongId: string) => {
        storage.data.set(
            STORAGE_KEY,
            JSON.stringify({
                version: 1,
                songs: [
                    { id: 'a', song: { ...makeSong(), title: 'A' } },
                    { id: 'b', song: { ...makeSong(), title: 'B' } },
                    { id: 'c', song: { ...makeSong(), title: 'C' } },
                ],
                currentSongId,
            }),
        );
        useStore = createSongStore({ storage, generateId: sequentialIds() });
    };
    const ids = () => store().songs.map((e) => e.id);

    it('removes a song that is not open and keeps the open song', () => {
        saveThree('a');
        store().deleteSong('b');

        expect(ids()).toEqual(['a', 'c']);
        expect(store().currentSongId).toBe('a');
    });

    it('leaves the other songs untouched (same references)', () => {
        saveThree('a');
        const [first, , third] = store().songs;
        store().deleteSong('b');

        expect(store().songs[0]).toBe(first);
        expect(store().songs[1]).toBe(third);
    });

    it('opens the song that takes the place of the deleted open song', () => {
        saveThree('b');
        store().deleteSong('b');

        expect(ids()).toEqual(['a', 'c']);
        expect(store().currentSongId).toBe('c');
    });

    it('opens the song before it when the deleted open song was the last in the list', () => {
        saveThree('c');
        store().deleteSong('c');

        expect(ids()).toEqual(['a', 'b']);
        expect(store().currentSongId).toBe('b');
    });

    it('opens the next song when the deleted open song was the first in the list', () => {
        saveThree('a');
        store().deleteSong('a');

        expect(store().currentSongId).toBe('b');
    });

    it('puts a fresh sample song with a new id in place of the last song', () => {
        store().deleteSong(store().currentSongId);

        expect(store().songs).toEqual([{ id: 'id-2', song: SAMPLE_SONG }]);
        expect(store().currentSongId).toBe('id-2');
    });

    it('saves the version 1 shape after the last song is deleted, and it loads back', () => {
        store().deleteSong(store().currentSongId);

        expect(saved()).toEqual({ version: 1, songs: [{ id: 'id-2', song: SAMPLE_SONG }], currentSongId: 'id-2' });
        const generateId = vi.fn(() => 'unused');
        const reloaded = createSongStore({ storage, generateId });
        expect(reloaded.getState().songs.map((e) => e.id)).toEqual(['id-2']);
        expect(reloaded.getState().currentSongId).toBe('id-2');
        expect(generateId).not.toHaveBeenCalled();
    });

    it('saves the deletion and the new open song so they survive a reload', () => {
        saveThree('b');
        store().deleteSong('b');

        expect(storage.writes).toBe(1);
        const reloaded = createSongStore({ storage, generateId: sequentialIds() });
        expect(reloaded.getState().songs.map((e) => e.id)).toEqual(['a', 'c']);
        expect(reloaded.getState().currentSongId).toBe('c');
    });

    it('ignores an unknown id and writes nothing', () => {
        saveThree('a');
        const songsBefore = store().songs;
        store().deleteSong('missing');

        expect(store().songs).toBe(songsBefore);
        expect(store().currentSongId).toBe('a');
        expect(storage.writes).toBe(0);
    });

    it('keeps the deletion in memory and warns when saving fails', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        saveThree('a');
        storage.failWrites = true;
        store().deleteSong('b');

        expect(ids()).toEqual(['a', 'c']);
        expect(warn).toHaveBeenCalledTimes(1);
    });
});

describe('duplicateSong', () => {
    beforeEach(() => {
        storage.data.set(
            STORAGE_KEY,
            JSON.stringify({
                version: 1,
                songs: [
                    { id: 'a', song: makeSong() },
                    { id: 'b', song: { ...makeSong(), title: 'Second' } },
                ],
                currentSongId: 'b',
            }),
        );
        useStore = createSongStore({ storage, generateId: sequentialIds() });
    });

    it('adds a copy with a new id and 「（コピー）」 after the title, right after the original', () => {
        store().duplicateSong('a');

        expect(store().songs.map((e) => e.id)).toEqual(['a', 'id-1', 'b']);
        expect(store().songs[1].song).toEqual({ ...makeSong(), title: 'Test Song（コピー）' });
    });

    it('adds the copy at the end when the original is the last song', () => {
        store().duplicateSong('b');

        expect(store().songs.map((e) => e.id)).toEqual(['a', 'b', 'id-1']);
        expect(store().songs[2].song.title).toBe('Second（コピー）');
    });

    it('leaves the original and the open song as they were', () => {
        const original = store().songs[0];
        const snapshot = structuredClone(original);
        store().duplicateSong('a');

        expect(store().songs[0]).toBe(original);
        expect(original).toEqual(snapshot);
        expect(store().currentSongId).toBe('b');
    });

    it('editing the copy does not change the original', () => {
        store().duplicateSong('a');
        store().openSong('id-1');
        store().updateBeat('s1', 'm1', 0, { chord: 'E7' });

        expect(store().songs[1].song.sections[0].measures[0].beats[0].chord).toBe('E7');
        expect(store().songs[0].song.sections[0].measures[0].beats[0].chord).toBe('C');
    });

    it('copies an untitled song as 「（コピー）」', () => {
        store().setSong({ ...makeSong(), title: '' });
        store().duplicateSong('b');

        expect(store().songs[2].song.title).toBe('（コピー）');
    });

    it('can copy a copy', () => {
        store().duplicateSong('a');
        store().duplicateSong('id-1');

        expect(store().songs[2]).toEqual({
            id: 'id-2',
            song: { ...makeSong(), title: 'Test Song（コピー）（コピー）' },
        });
    });

    it('saves the copy so it survives a reload', () => {
        store().duplicateSong('a');

        expect(storage.writes).toBe(1);
        const reloaded = createSongStore({ storage, generateId: sequentialIds() });
        expect(reloaded.getState().songs.map((e) => e.id)).toEqual(['a', 'id-1', 'b']);
        expect(reloaded.getState().songs[1].song.title).toBe('Test Song（コピー）');
        expect(reloaded.getState().currentSongId).toBe('b');
    });

    it('ignores an unknown id and writes nothing', () => {
        const songsBefore = store().songs;
        store().duplicateSong('missing');

        expect(store().songs).toBe(songsBefore);
        expect(storage.writes).toBe(0);
    });
});

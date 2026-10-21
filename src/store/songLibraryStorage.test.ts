import { describe, expect, it } from 'vitest';
import { loadSongLibrary, saveSongLibrary, STORAGE_KEY, type SongLibrary } from './songLibraryStorage';
import { FakeStorage } from '../test/fakeStorage';
import type { Song } from '../types';

const song = (title: string): Song => ({
    title,
    artist: 'A',
    bpm: 120,
    key: 'C',
    sections: [
        {
            id: 's1',
            title: 'Intro',
            measures: [{ id: 'm1', beats: [{ chord: 'C', lyric: 'la', isTentative: true }, { chord: '' }] }],
        },
    ],
});

const library = (): SongLibrary => ({
    version: 1,
    songs: [
        { id: 'a', song: song('One') },
        { id: 'b', song: song('Two') },
    ],
    currentSongId: 'b',
});

const storageWith = (value: unknown) => {
    const storage = new FakeStorage();
    storage.data.set(STORAGE_KEY, typeof value === 'string' ? value : JSON.stringify(value));
    return storage;
};

describe('saveSongLibrary / loadSongLibrary', () => {
    it('round-trips a library through the storage under the fixed key', () => {
        const storage = new FakeStorage();
        expect(saveSongLibrary(storage, library())).toBe(true);

        expect([...storage.data.keys()]).toEqual([STORAGE_KEY]);
        expect(loadSongLibrary(storage)).toEqual(library());
    });

    it('accepts a single song with an empty section list (lower boundary)', () => {
        const single: SongLibrary = {
            version: 1,
            songs: [{ id: 'x', song: { ...song('Only'), sections: [] } }],
            currentSongId: 'x',
        };
        expect(loadSongLibrary(storageWith(single))).toEqual(single);
    });

    it('drops unknown extra fields', () => {
        const withExtra = { ...library(), extra: 1, songs: [{ id: 'a', song: { ...song('One'), extra: true } }] };
        expect(loadSongLibrary(storageWith({ ...withExtra, currentSongId: 'a' }))).toEqual({
            version: 1,
            songs: [{ id: 'a', song: song('One') }],
            currentSongId: 'a',
        });
    });
});

describe('loadSongLibrary returns null', () => {
    it('when nothing is saved', () => {
        expect(loadSongLibrary(new FakeStorage())).toBeNull();
    });

    it('when there is no storage', () => {
        expect(loadSongLibrary(null)).toBeNull();
    });

    it('when reading the storage throws', () => {
        const storage = storageWith(library());
        storage.failReads = true;
        expect(loadSongLibrary(storage)).toBeNull();
    });

    const valid = library();
    const firstSong = valid.songs[0];
    it.each<[string, unknown]>([
        ['invalid JSON', '{"version":'],
        ['an empty string', ''],
        ['JSON null', 'null'],
        ['a JSON array', '[]'],
        ['a missing version', { songs: valid.songs, currentSongId: 'a' }],
        ['an unknown version', { ...valid, version: 2 }],
        ['an empty song list', { ...valid, songs: [] }],
        ['songs that is not an array', { ...valid, songs: {} }],
        ['a song without id', { ...valid, songs: [{ song: firstSong.song }], currentSongId: 'a' }],
        ['an empty song id', { ...valid, songs: [{ id: '', song: firstSong.song }], currentSongId: '' }],
        ['duplicate song ids', { ...valid, songs: [firstSong, firstSong], currentSongId: 'a' }],
        ['a current id that is not stored', { ...valid, currentSongId: 'zzz' }],
        ['a missing current id', { version: 1, songs: valid.songs }],
        ['bpm stored as a string', { ...valid, songs: [{ id: 'a', song: { ...firstSong.song, bpm: '120' } }] }],
        [
            'a beat without chord',
            {
                ...valid,
                currentSongId: 'a',
                songs: [
                    {
                        id: 'a',
                        song: {
                            ...firstSong.song,
                            sections: [{ id: 's', title: 'X', measures: [{ id: 'm', beats: [{}] }] }],
                        },
                    },
                ],
            },
        ],
    ])('for %s', (_label, value) => {
        expect(loadSongLibrary(storageWith(value))).toBeNull();
    });
});

describe('saveSongLibrary returns false', () => {
    it('when writing throws (e.g. quota exceeded) and stores nothing', () => {
        const storage = new FakeStorage();
        storage.failWrites = true;

        expect(saveSongLibrary(storage, library())).toBe(false);
        expect(storage.data.size).toBe(0);
    });

    it('when there is no storage', () => {
        expect(saveSongLibrary(null, library())).toBe(false);
    });
});

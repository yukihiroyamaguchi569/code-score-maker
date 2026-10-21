import { create } from 'zustand';
import type { Song, Beat } from '../types';
import { SAMPLE_SONG } from '../data/sampleSong';
import { generateId } from '../lib/id';
import {
    getBrowserStorage,
    loadSongLibrary,
    saveSongLibrary,
    type KeyValueStorage,
    type SongEntry,
    type SongLibrary,
} from './songLibraryStorage';

interface EditingState {
    sectionId: string;
    measureId: string;
    beatIndex: number;
}

interface SongState {
    songs: SongEntry[];
    currentSongId: string;
    editingBeat: EditingState | null;
    chordHistory: string[];

    // Actions (setSong and updateBeat act on the current song)
    setSong: (song: Song) => void;
    updateBeat: (sectionId: string, measureId: string, beatIndex: number, newBeat: Partial<Beat>) => void;
    setEditingBeat: (editingState: EditingState | null) => void;
    addToHistory: (chord: string) => void;
}

export interface SongStoreDeps {
    storage: KeyValueStorage | null;
    generateId: () => string;
}

const MAX_HISTORY = 10;

// Shown only if currentSongId ever points nowhere; the store keeps it valid.
const EMPTY_SONG: Song = {
    title: '',
    artist: '',
    bpm: 120,
    key: 'C',
    sections: [],
};

export const selectCurrentSong = (state: Pick<SongState, 'songs' | 'currentSongId'>): Song =>
    state.songs.find((entry) => entry.id === state.currentSongId)?.song ?? EMPTY_SONG;

const createInitialLibrary = (generate: () => string): SongLibrary => {
    const id = generate();
    return { version: 1, songs: [{ id, song: SAMPLE_SONG }], currentSongId: id };
};

const updateBeatInSong = (
    song: Song,
    { sectionId, measureId, beatIndex }: EditingState,
    newBeat: Partial<Beat>,
): Song => ({
    ...song,
    sections: song.sections.map((section) => {
        if (section.id !== sectionId) return section;

        const newMeasures = section.measures.map((measure) => {
            if (measure.id !== measureId) return measure;

            const newBeats = [...measure.beats];
            if (newBeats[beatIndex]) {
                newBeats[beatIndex] = { ...newBeats[beatIndex], ...newBeat };
            }
            return { ...measure, beats: newBeats };
        });

        return { ...section, measures: newMeasures };
    }),
});

const replaceCurrentSong = (state: SongState, update: (song: Song) => Song): Pick<SongState, 'songs'> => ({
    songs: state.songs.map((entry) =>
        entry.id === state.currentSongId ? { ...entry, song: update(entry.song) } : entry,
    ),
});

export function createSongStore({ storage, generateId: generate }: SongStoreDeps) {
    const library = loadSongLibrary(storage) ?? createInitialLibrary(generate);

    const store = create<SongState>((set) => ({
        songs: library.songs,
        currentSongId: library.currentSongId,
        editingBeat: null,
        chordHistory: [],

        setSong: (song) => set((state) => replaceCurrentSong(state, () => song)),

        updateBeat: (sectionId, measureId, beatIndex, newBeat) =>
            set((state) =>
                replaceCurrentSong(state, (song) =>
                    updateBeatInSong(song, { sectionId, measureId, beatIndex }, newBeat),
                ),
            ),

        setEditingBeat: (editingBeat) => set({ editingBeat }),

        addToHistory: (chord) =>
            set((state) => {
                if (!chord) return {};
                const newHistory = [chord, ...state.chordHistory.filter((c) => c !== chord)].slice(0, MAX_HISTORY);
                return { chordHistory: newHistory };
            }),
    }));

    // Persist the songs whenever they (or the open song) change. Editing state
    // and chord history are not saved.
    store.subscribe((state, prev) => {
        if (state.songs === prev.songs && state.currentSongId === prev.currentSongId) return;
        const saved = saveSongLibrary(storage, { version: 1, songs: state.songs, currentSongId: state.currentSongId });
        if (!saved) console.warn('code-score-maker: failed to save songs to localStorage');
    });

    return store;
}

export const useSongStore = createSongStore({ storage: getBrowserStorage(), generateId });

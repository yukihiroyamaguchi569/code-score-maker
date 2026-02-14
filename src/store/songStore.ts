import { create } from 'zustand';
import type { Song, Beat } from '../types';

interface EditingState {
    sectionId: string;
    measureId: string;
    beatIndex: number;
}

interface SongState {
    song: Song;
    editingBeat: EditingState | null;
    chordHistory: string[];

    // Actions
    setSong: (song: Song) => void;
    updateBeat: (sectionId: string, measureId: string, beatIndex: number, newBeat: Partial<Beat>) => void;
    setEditingBeat: (editingState: EditingState | null) => void;
    addToHistory: (chord: string) => void;
}

const MAX_HISTORY = 10;

// Initial empty song (will be overwritten by setSong or initial props if we change architecture)
const INITIAL_SONG: Song = {
    title: "",
    artist: "",
    bpm: 120,
    key: "C",
    sections: []
};

export const useSongStore = create<SongState>((set) => ({
    song: INITIAL_SONG,
    editingBeat: null,
    chordHistory: [],

    setSong: (song) => set({ song }),

    updateBeat: (sectionId, measureId, beatIndex, newBeat) => set((state) => {
        const newSections = state.song.sections.map((section) => {
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
        });

        return { song: { ...state.song, sections: newSections } };
    }),

    setEditingBeat: (editingBeat) => set({ editingBeat }),

    addToHistory: (chord) => set((state) => {
        if (!chord) return {};
        const newHistory = [chord, ...state.chordHistory.filter(c => c !== chord)].slice(0, MAX_HISTORY);
        return { chordHistory: newHistory };
    }),
}));

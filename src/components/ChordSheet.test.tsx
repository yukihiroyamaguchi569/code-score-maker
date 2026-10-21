// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ChordSheet } from './ChordSheet';
import { useSongStore } from '../store/songStore';
import type { Song } from '../types';

const SONG: Song = {
    title: 'T',
    artist: 'A',
    bpm: 120,
    key: 'C',
    sections: [
        {
            id: 's1',
            title: 'Intro',
            measures: [
                { id: 'm1', beats: [{ chord: 'Cmaj7', lyric: 'Some' }, { chord: '' }, { chord: 'G7' }, { chord: '' }] },
            ],
        },
        {
            id: 's2',
            title: 'A',
            measures: [{ id: 'm2', beats: [{ chord: 'Am' }, { chord: '' }, { chord: '' }, { chord: 'F' }] }],
        },
    ],
};

beforeEach(() => {
    useSongStore.setState(useSongStore.getInitialState(), true);
    useSongStore.getState().setSong(SONG);
});

afterEach(() => {
    cleanup();
});

describe('ChordSheet', () => {
    it('shows section titles in order', () => {
        render(<ChordSheet />);
        expect(screen.getAllByRole('heading').map((h) => h.textContent)).toEqual(['Intro', 'A']);
    });

    it('shows maj7 as Δ7 and "-" for empty beats', () => {
        render(<ChordSheet />);
        expect(screen.getByText('CΔ7')).toBeTruthy();
        expect(screen.queryByText('Cmaj7')).toBeNull();
        expect(screen.getAllByText('-')).toHaveLength(4);
    });

    it('shows maj7 as Δ7 without changing the stored chord', () => {
        render(<ChordSheet />);
        expect(useSongStore.getState().song.sections[0].measures[0].beats[0].chord).toBe('Cmaj7');
    });

    it('shows lyrics only where present', () => {
        render(<ChordSheet />);
        expect(screen.getByText('Some')).toBeTruthy();
        // Cell text = chord + lyric (if any) + beat number indicator
        expect(screen.getByText('CΔ7').parentElement?.textContent).toBe('CΔ7Some1');
        expect(screen.getByText('G7').parentElement?.textContent).toBe('G73');
    });

    it('starts editing the clicked beat', () => {
        render(<ChordSheet />);
        fireEvent.click(screen.getByText('G7'));
        expect(useSongStore.getState().editingBeat).toEqual({ sectionId: 's1', measureId: 'm1', beatIndex: 2 });

        fireEvent.click(screen.getByText('F'));
        expect(useSongStore.getState().editingBeat).toEqual({ sectionId: 's2', measureId: 'm2', beatIndex: 3 });
    });

    it('starts editing an empty beat', () => {
        render(<ChordSheet />);
        const emptyBeats = screen.getAllByText('-');
        fireEvent.click(emptyBeats[0]);
        expect(useSongStore.getState().editingBeat).toEqual({ sectionId: 's1', measureId: 'm1', beatIndex: 1 });

        fireEvent.click(emptyBeats[3]);
        expect(useSongStore.getState().editingBeat).toEqual({ sectionId: 's2', measureId: 'm2', beatIndex: 2 });
    });

    it('re-renders when a beat is updated in the store', () => {
        render(<ChordSheet />);
        act(() => useSongStore.getState().updateBeat('s2', 'm2', 0, { chord: 'Dm' }));
        expect(screen.getByText('Dm')).toBeTruthy();
        expect(screen.queryByText('Am')).toBeNull();
    });

    it('renders no content for a song without sections', () => {
        useSongStore.getState().setSong({ ...SONG, sections: [] });
        const { container } = render(<ChordSheet />);
        expect(container.textContent).toBe('');
        expect(screen.queryAllByRole('heading')).toHaveLength(0);
    });
});

// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { ChordEditor } from './ChordEditor';
import { useSongStore } from '../store/songStore';
import type { Song } from '../types';

const makeSong = (chord: string): Song => ({
    title: 'T',
    artist: 'A',
    bpm: 120,
    key: 'C',
    sections: [
        {
            id: 's1',
            title: 'Intro',
            measures: [{ id: 'm1', beats: [{ chord, lyric: 'la' }, { chord: 'G' }, { chord: '' }, { chord: '' }] }],
        },
    ],
});

const store = () => useSongStore.getState();
const savedChord = () => store().song.sections[0].measures[0].beats[0].chord;
const input = () => screen.getByRole<HTMLInputElement>('textbox');
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const type = (value: string) => fireEvent.change(input(), { target: { value } });

const openEditor = (chord: string, history: string[] = []) => {
    store().setSong(makeSong(chord));
    useSongStore.setState({ chordHistory: history });
    store().setEditingBeat({ sectionId: 's1', measureId: 'm1', beatIndex: 0 });
    return render(<ChordEditor />);
};

beforeEach(() => {
    useSongStore.setState(useSongStore.getInitialState(), true);
});

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

describe('visibility', () => {
    it('renders nothing when no beat is being edited', () => {
        const { container } = render(<ChordEditor />);
        expect(container.innerHTML).toBe('');
    });

    it('shows the editor when a beat is being edited', () => {
        openEditor('C');
        expect(screen.getByRole('heading', { name: 'Edit Chord' })).toBeTruthy();
    });
});

describe('initial input', () => {
    it('loads the chord of the edited beat', () => {
        openEditor('Am7');
        expect(input().value).toBe('Am7');
    });

    it('shows maj7 as Δ7', () => {
        openEditor('Bbmaj7');
        expect(input().value).toBe('BbΔ7');
    });

    it('replaces every maj7 occurrence', () => {
        openEditor('Cmaj7/Emaj7');
        expect(input().value).toBe('CΔ7/EΔ7');
    });

    it('is empty for an empty beat', () => {
        openEditor('');
        expect(input().value).toBe('');
    });

    it('is empty when the edited beat does not exist', () => {
        store().setSong(makeSong('C'));
        store().setEditingBeat({ sectionId: 's1', measureId: 'm1', beatIndex: 9 });
        render(<ChordEditor />);
        expect(input().value).toBe('');
    });

    it('reloads the input when another beat is opened without remounting', () => {
        openEditor('Am7');
        type('D');
        click('Cancel');
        expect(screen.queryByRole('textbox')).toBeNull();

        act(() => store().setEditingBeat({ sectionId: 's1', measureId: 'm1', beatIndex: 1 }));
        expect(input().value).toBe('G');

        act(() => store().setEditingBeat({ sectionId: 's1', measureId: 'm1', beatIndex: 0 }));
        expect(input().value).toBe('Am7');
    });

    it('focuses the input after 50ms', () => {
        vi.useFakeTimers();
        openEditor('C');
        act(() => {
            vi.advanceTimersByTime(49);
        });
        expect(document.activeElement).not.toBe(input());
        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(document.activeElement).toBe(input());
    });
});

describe('candidate buttons', () => {
    it('lists roots C to B in order', () => {
        openEditor('');
        const rootLabel = screen.getByText('Root');
        const rootButtons = within(rootLabel.parentElement as HTMLElement).getAllByRole('button');
        expect(rootButtons.map((b) => b.textContent)).toEqual([
            'C', 'D', 'E', 'F', 'G', 'A', 'B', '♯ (Sharp)', '♭ (Flat)',
        ]);
    });

    it('lists qualities and tensions in order', () => {
        openEditor('');
        const label = screen.getByText('Quality & Extension');
        const buttons = within(label.parentElement as HTMLElement).getAllByRole('button');
        expect(buttons.map((b) => b.textContent?.trim())).toEqual([
            'm', 'Δ7', '7', 'sus4', 'dim', 'aug', 'add9',
            '9', '11', '13', '#11', 'b13', '/ (On)',
        ]);
    });
});

describe('root buttons', () => {
    it.each([
        ['', 'C', 'C'],
        ['Am7', 'D', 'Dm7'],
        ['F#m', 'G', 'Gm'],
        ['Bbmaj7', 'E', 'EΔ7'],
        ['m7', 'E', 'Em7'],
        ['/G', 'C', 'C/G'],
    ])('input "%s" + root %s -> "%s"', (initial, root, expected) => {
        openEditor(initial);
        click(root);
        expect(input().value).toBe(expected);
    });

    it('does not touch the bass note of a slash chord', () => {
        openEditor('C/E');
        click('G');
        expect(input().value).toBe('G/E');
    });

    it('does not save to the store until Save', () => {
        openEditor('C');
        click('D');
        expect(savedChord()).toBe('C');
    });
});

describe('accidental buttons', () => {
    it.each([
        ['C', '♯ (Sharp)', 'C#'],
        ['C', '♭ (Flat)', 'Cb'],
        ['C#', '♯ (Sharp)', 'C'],
        ['Cb', '♭ (Flat)', 'C'],
        ['C#', '♭ (Flat)', 'Cb'],
        ['Fb', '♯ (Sharp)', 'F#'],
        ['Am7', '♯ (Sharp)', 'A#m7'],
        ['Bbmaj7', '♭ (Flat)', 'BΔ7'],
        ['C/E', '♯ (Sharp)', 'C#/E'],
    ])('input "%s" + %s -> "%s"', (initial, button, expected) => {
        openEditor(initial);
        click(button);
        expect(input().value).toBe(expected);
    });

    it.each([[''], ['m7'], ['/G']])('does nothing when input "%s" has no root', (initial) => {
        openEditor(initial);
        click('♯ (Sharp)');
        expect(input().value).toBe(initial);
        click('♭ (Flat)');
        expect(input().value).toBe(initial);
    });
});

describe('quality and tension buttons', () => {
    it.each([
        ['m', 'Cm'],
        ['Δ7', 'CΔ7'],
        ['7', 'C7'],
        ['sus4', 'Csus4'],
        ['dim', 'Cdim'],
        ['aug', 'Caug'],
        ['add9', 'Cadd9'],
        ['9', 'C9'],
        ['11', 'C11'],
        ['13', 'C13'],
        ['#11', 'C#11'],
        ['b13', 'Cb13'],
        ['/ (On)', 'C/'],
    ])('button %s appends to "C" -> "%s"', (button, expected) => {
        openEditor('C');
        click(button);
        expect(input().value).toBe(expected);
    });

    it('appends in click order without deduplication', () => {
        openEditor('');
        click('m');
        click('m');
        click('7');
        expect(input().value).toBe('mm7');
    });

    it('builds a slash chord by combining buttons', () => {
        openEditor('');
        click('C');
        click('Δ7');
        click('/ (On)');
        type(input().value + 'E');
        expect(input().value).toBe('CΔ7/E');
    });
});

describe('history', () => {
    it('is hidden when the history is empty', () => {
        openEditor('C');
        expect(screen.queryByText('Recently Used')).toBeNull();
    });

    it('shows chords in history order with maj7 shown as Δ7', () => {
        openEditor('C', ['Fmaj7', 'G7', 'Am']);
        const label = screen.getByText('Recently Used');
        const buttons = within(label.parentElement as HTMLElement).getAllByRole('button');
        expect(buttons.map((b) => b.textContent)).toEqual(['FΔ7', 'G7', 'Am']);
    });

    it('puts the chord into the input as shown on the button (maj7 as Δ7)', () => {
        openEditor('C', ['Fmaj7']);
        click('FΔ7');
        expect(input().value).toBe('FΔ7');
    });
});

describe('saving', () => {
    it('saves on Enter, adds to history and closes', () => {
        openEditor('C');
        type('Dm7');
        fireEvent.keyDown(input(), { key: 'Enter' });

        expect(savedChord()).toBe('Dm7');
        expect(store().song.sections[0].measures[0].beats[0].lyric).toBe('la');
        expect(store().chordHistory).toEqual(['Dm7']);
        expect(store().editingBeat).toBeNull();
        expect(screen.queryByRole('textbox')).toBeNull();
    });

    it('saves on the Save button', () => {
        openEditor('C');
        type('G7');
        click('Save');
        expect(savedChord()).toBe('G7');
        expect(store().chordHistory).toEqual(['G7']);
        expect(store().editingBeat).toBeNull();
    });

    it('saves the displayed Δ7 form, not the original maj7', () => {
        openEditor('Bbmaj7');
        click('Save');
        expect(savedChord()).toBe('BbΔ7');
        expect(store().chordHistory).toEqual(['BbΔ7']);
    });

    it('saves an empty chord but does not add it to history', () => {
        openEditor('C', ['G']);
        type('');
        click('Save');
        expect(savedChord()).toBe('');
        expect(store().chordHistory).toEqual(['G']);
        expect(store().editingBeat).toBeNull();
    });

    it('only updates the edited beat', () => {
        openEditor('C');
        type('E');
        click('Save');
        const beats = store().song.sections[0].measures[0].beats;
        expect(beats.map((b) => b.chord)).toEqual(['E', 'G', '', '']);
    });

    it('ignores other keys', () => {
        openEditor('C');
        type('D');
        fireEvent.keyDown(input(), { key: 'Tab' });
        expect(savedChord()).toBe('C');
        expect(store().editingBeat).not.toBeNull();
    });
});

describe('cancelling', () => {
    const expectCancelled = () => {
        expect(savedChord()).toBe('C');
        expect(store().chordHistory).toEqual([]);
        expect(store().editingBeat).toBeNull();
        expect(screen.queryByRole('textbox')).toBeNull();
    };

    it('cancels on Escape without saving', () => {
        openEditor('C');
        type('D');
        fireEvent.keyDown(input(), { key: 'Escape' });
        expectCancelled();
    });

    it('cancels on the Cancel button', () => {
        openEditor('C');
        type('D');
        click('Cancel');
        expectCancelled();
    });

    it('cancels on the close (X) button in the header', () => {
        openEditor('C');
        type('D');
        const heading = screen.getByRole('heading', { name: 'Edit Chord' });
        fireEvent.click(within(heading.parentElement as HTMLElement).getByRole('button'));
        expectCancelled();
    });

    it('cancels when the backdrop is clicked', () => {
        const { container } = openEditor('C');
        type('D');
        fireEvent.click(container.firstChild as HTMLElement);
        expectCancelled();
    });

    it('stays open when the dialog body is clicked', () => {
        openEditor('C');
        fireEvent.click(screen.getByRole('heading', { name: 'Edit Chord' }));
        expect(store().editingBeat).not.toBeNull();
        expect(screen.getByRole('textbox')).toBeTruthy();
    });
});

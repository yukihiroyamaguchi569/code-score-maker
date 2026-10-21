// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { STORAGE_KEY } from './store/songLibraryStorage';
import type { Song } from './types';

// The store reads localStorage when its module is first imported, so each
// test sets up localStorage and then imports a fresh copy of the app.
const renderFreshApp = async () => {
    vi.resetModules();
    const { default: App } = await import('./App');
    render(<App />);
};

const makeSong = (title: string, artist: string): Song => ({ title, artist, bpm: 90, key: 'F', sections: [] });

const withChord = (song: Song, chord: string): Song => ({
    ...song,
    sections: [{ id: 's1', title: 'A', measures: [{ id: 'm1', beats: [{ chord }] }] }],
});

const saveLibrary = (songs: { id: string; song: Song }[], currentSongId: string) =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, songs, currentSongId }));

// The button that opens each song (each row also has duplicate and delete buttons).
const songButtons = () =>
    within(screen.getByRole('list'))
        .getAllByRole('listitem')
        .map((item) => within(item).getAllByRole('button')[0]);
const backButton = () => screen.getByRole('button', { name: '曲の一覧に戻る' });

beforeEach(() => {
    localStorage.clear();
});

afterEach(() => {
    cleanup();
    localStorage.clear();
});

describe('App: song list (start screen)', () => {
    it('shows the sample song in the list on the first visit', async () => {
        await renderFreshApp();
        expect(screen.getByRole('heading', { name: '曲の一覧' })).toBeTruthy();
        expect(songButtons()).toHaveLength(1);
        expect(songButtons()[0].textContent).toContain('Someday My Prince Will Come');
        expect(songButtons()[0].textContent).toContain('Bill Evans');
    });

    it('lists every saved song with its artist, in saved order', async () => {
        saveLibrary(
            [
                { id: 'a', song: makeSong('First', 'Artist A') },
                { id: 'b', song: makeSong('Second', 'Artist B') },
                { id: 'c', song: makeSong('Third', 'Artist C') },
            ],
            'b',
        );
        await renderFreshApp();

        expect(songButtons().map((b) => b.textContent)).toEqual(['FirstArtist A', 'SecondArtist B', 'ThirdArtist C']);
    });

    it('starts on the list even when a current song is saved', async () => {
        saveLibrary([{ id: 'saved', song: makeSong('Saved Song', 'Me') }], 'saved');
        await renderFreshApp();

        expect(screen.getByRole('heading', { name: '曲の一覧' })).toBeTruthy();
        expect(screen.queryByRole('heading', { name: 'Saved Song' })).toBeNull();
    });

    it('shows a placeholder for an untitled song and omits an empty artist', async () => {
        saveLibrary([{ id: 'x', song: makeSong('', '') }], 'x');
        await renderFreshApp();

        expect(songButtons()[0].textContent).toBe('（タイトルなし）');
    });

    it('shows the same placeholder as the heading after opening an untitled song', async () => {
        saveLibrary([{ id: 'x', song: makeSong('', '') }], 'x');
        await renderFreshApp();
        fireEvent.click(songButtons()[0]);

        expect(document.activeElement).toBe(screen.getByRole('heading', { name: '（タイトルなし）' }));
    });

    it('shows the sample song when localStorage holds a broken value', async () => {
        localStorage.setItem(STORAGE_KEY, '{broken');
        await renderFreshApp();
        expect(songButtons()[0].textContent).toContain('Someday My Prince Will Come');
    });
});

describe('App: moving between the list and a song', () => {
    beforeEach(() => {
        saveLibrary(
            [
                { id: 'a', song: withChord(makeSong('First', 'Artist A'), 'Dm7') },
                { id: 'b', song: withChord(makeSong('Second', 'Artist B'), 'Am7') },
            ],
            'a',
        );
    });

    it('marks the list as the main region', async () => {
        await renderFreshApp();
        expect(within(screen.getByRole('main')).getByRole('heading', { name: '曲の一覧' })).toBeTruthy();
    });

    it('opens the chosen song (not the saved current one) with its chord sheet', async () => {
        await renderFreshApp();
        fireEvent.click(songButtons()[1]);

        expect(screen.getByRole('heading', { name: 'Second' })).toBeTruthy();
        expect(within(screen.getByRole('main')).getByText('Am7')).toBeTruthy();
        expect(screen.queryByText('Dm7')).toBeNull();
        expect(screen.queryByRole('heading', { name: '曲の一覧' })).toBeNull();
    });

    it('goes back to the list from the song screen', async () => {
        await renderFreshApp();
        fireEvent.click(songButtons()[1]);
        fireEvent.click(backButton());

        expect(screen.getByRole('heading', { name: '曲の一覧' })).toBeTruthy();
        expect(screen.queryByRole('heading', { name: 'Second' })).toBeNull();
        expect(songButtons()).toHaveLength(2);
    });

    it('can open another song after going back', async () => {
        await renderFreshApp();
        fireEvent.click(songButtons()[1]);
        fireEvent.click(backButton());
        fireEvent.click(songButtons()[0]);

        expect(screen.getByRole('heading', { name: 'First' })).toBeTruthy();
    });

    it('has no back button on the list', async () => {
        await renderFreshApp();
        expect(screen.queryByRole('button', { name: '曲の一覧に戻る' })).toBeNull();
    });

    it('puts the back button after the focused song heading in tab order', async () => {
        await renderFreshApp();
        fireEvent.click(songButtons()[1]);

        const heading = screen.getByRole('heading', { name: 'Second' });
        expect(heading.compareDocumentPosition(backButton()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('moves focus to the heading of the screen it switches to, both ways', async () => {
        await renderFreshApp();
        fireEvent.click(songButtons()[1]);
        expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Second' }));

        fireEvent.click(backButton());
        expect(document.activeElement).toBe(screen.getByRole('heading', { name: '曲の一覧' }));
    });
});

describe('App: deleting and duplicating songs in the list', () => {
    const savedLibrary = (): { songs: { id: string; song: Song }[]; currentSongId: string } =>
        JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    const titles = () => songButtons().map((b) => b.textContent);
    const button = (name: string) => screen.getByRole('button', { name });
    const confirmBox = () => screen.queryByRole('group', { name: '削除の確認' });

    beforeEach(() => {
        saveLibrary(
            [
                { id: 'a', song: makeSong('First', 'Artist A') },
                { id: 'b', song: makeSong('Second', 'Artist B') },
            ],
            'a',
        );
    });

    it('has a duplicate and a delete button for each song', async () => {
        await renderFreshApp();
        for (const title of ['First', 'Second']) {
            expect(button(`「${title}」を複製`)).toBeTruthy();
            expect(button(`「${title}」を削除`)).toBeTruthy();
        }
    });

    it('asks on the screen before deleting, without the browser confirm, and deletes nothing yet', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm');
        await renderFreshApp();
        fireEvent.click(button('「Second」を削除'));

        expect(within(confirmBox()!).getByText('「Second」を削除しますか？')).toBeTruthy();
        expect(document.activeElement).toBe(button('キャンセル'));
        expect(confirmSpy).not.toHaveBeenCalled();
        expect(savedLibrary().songs.map((e) => e.id)).toEqual(['a', 'b']);
        confirmSpy.mockRestore();
    });

    it('deletes the song after confirming and keeps it deleted after a reload', async () => {
        await renderFreshApp();
        fireEvent.click(button('「Second」を削除'));
        fireEvent.click(button('削除する'));

        expect(titles()).toEqual(['FirstArtist A']);
        expect(confirmBox()).toBeNull();

        cleanup();
        await renderFreshApp();
        expect(titles()).toEqual(['FirstArtist A']);
    });

    it('changes nothing when the deletion is cancelled', async () => {
        await renderFreshApp();
        const before = localStorage.getItem(STORAGE_KEY);
        fireEvent.click(button('「Second」を削除'));
        fireEvent.click(button('キャンセル'));

        expect(confirmBox()).toBeNull();
        expect(titles()).toEqual(['FirstArtist A', 'SecondArtist B']);
        expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
    });

    it('returns focus to the delete button of the song when the deletion is cancelled', async () => {
        await renderFreshApp();
        fireEvent.click(button('「Second」を削除'));
        fireEvent.click(button('キャンセル'));

        expect(document.activeElement).toBe(button('「Second」を削除'));
    });

    it('returns focus to the delete button again after a second cancel on the same song', async () => {
        await renderFreshApp();
        fireEvent.click(button('「Second」を削除'));
        fireEvent.click(button('キャンセル'));
        fireEvent.click(button('「Second」を削除'));
        fireEvent.click(button('キャンセル'));

        expect(document.activeElement).toBe(button('「Second」を削除'));
    });

    it('moves focus to the list heading after a song is deleted', async () => {
        await renderFreshApp();
        fireEvent.click(button('「Second」を削除'));
        fireEvent.click(button('削除する'));

        expect(document.activeElement).toBe(screen.getByRole('heading', { name: '曲の一覧' }));
    });

    it('shows only one confirmation at a time', async () => {
        await renderFreshApp();
        fireEvent.click(button('「First」を削除'));
        fireEvent.click(button('「Second」を削除'));

        expect(screen.getAllByRole('group', { name: '削除の確認' })).toHaveLength(1);
        expect(within(confirmBox()!).getByText('「Second」を削除しますか？')).toBeTruthy();
        expect(button('「First」を削除')).toBeTruthy();
    });

    it('moves the open song to a remaining song when the open song is deleted', async () => {
        await renderFreshApp();
        fireEvent.click(button('「First」を削除'));
        fireEvent.click(button('削除する'));

        expect(savedLibrary().currentSongId).toBe('b');
        fireEvent.click(songButtons()[0]);
        expect(screen.getByRole('heading', { name: 'Second' })).toBeTruthy();
    });

    it('says the sample song comes back when the last song is about to be deleted', async () => {
        saveLibrary([{ id: 'only', song: makeSong('Only', 'Me') }], 'only');
        await renderFreshApp();
        fireEvent.click(button('「Only」を削除'));

        expect(within(confirmBox()!).getByText(/サンプルの曲が入ります/)).toBeTruthy();
    });

    it('does not mention the sample song when other songs remain', async () => {
        await renderFreshApp();
        fireEvent.click(button('「Second」を削除'));

        expect(within(confirmBox()!).queryByText(/サンプルの曲/)).toBeNull();
    });

    it('keeps the list working after the last song is deleted: the sample song is listed and opens', async () => {
        saveLibrary([{ id: 'only', song: makeSong('Only', 'Me') }], 'only');
        await renderFreshApp();
        fireEvent.click(button('「Only」を削除'));
        fireEvent.click(button('削除する'));

        expect(screen.getByRole('heading', { name: '曲の一覧' })).toBeTruthy();
        expect(songButtons()).toHaveLength(1);
        expect(titles()[0]).toContain('Someday My Prince Will Come');
        const { songs, currentSongId } = savedLibrary();
        expect(songs).toHaveLength(1);
        expect(songs[0].id).not.toBe('only');
        expect(currentSongId).toBe(songs[0].id);

        fireEvent.click(songButtons()[0]);
        expect(screen.getByRole('heading', { name: 'Someday My Prince Will Come' })).toBeTruthy();
    });

    it('adds a copy right after the original and keeps it after a reload', async () => {
        await renderFreshApp();
        fireEvent.click(button('「First」を複製'));

        expect(titles()).toEqual(['FirstArtist A', 'First（コピー）Artist A', 'SecondArtist B']);
        const { songs, currentSongId } = savedLibrary();
        expect(new Set(songs.map((e) => e.id)).size).toBe(3);
        expect(songs[0]).toEqual({ id: 'a', song: makeSong('First', 'Artist A') });
        expect(currentSongId).toBe('a');

        cleanup();
        await renderFreshApp();
        expect(titles()).toEqual(['FirstArtist A', 'First（コピー）Artist A', 'SecondArtist B']);
    });

    it('stays on the list after duplicating', async () => {
        await renderFreshApp();
        fireEvent.click(button('「Second」を複製'));

        expect(screen.getByRole('heading', { name: '曲の一覧' })).toBeTruthy();
    });
});

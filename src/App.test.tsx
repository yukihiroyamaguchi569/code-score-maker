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

const saveLibrary = (songs: { id: string; song: Song }[], currentSongId: string) =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, songs, currentSongId }));

const songButtons = () => within(screen.getByRole('list')).getAllByRole('button');
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
                { id: 'a', song: makeSong('First', 'Artist A') },
                { id: 'b', song: makeSong('Second', 'Artist B') },
            ],
            'a',
        );
    });

    it('opens the chosen song (not the saved current one) on the song screen', async () => {
        await renderFreshApp();
        fireEvent.click(songButtons()[1]);

        expect(screen.getByRole('heading', { name: 'Second' })).toBeTruthy();
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
});

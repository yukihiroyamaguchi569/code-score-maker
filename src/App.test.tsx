// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { STORAGE_KEY } from './store/songLibraryStorage';

// The store reads localStorage when its module is first imported, so each
// test sets up localStorage and then imports a fresh copy of the app.
const renderFreshApp = async () => {
    vi.resetModules();
    const { default: App } = await import('./App');
    render(<App />);
};

beforeEach(() => {
    localStorage.clear();
});

afterEach(() => {
    cleanup();
    localStorage.clear();
});

describe('App', () => {
    it('shows the sample song on the first visit', async () => {
        await renderFreshApp();
        expect(screen.getByRole('heading', { name: 'Someday My Prince Will Come' })).toBeTruthy();
    });

    it('shows the saved open song from localStorage', async () => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                version: 1,
                songs: [
                    {
                        id: 'saved',
                        song: { title: 'Saved Song', artist: 'Me', bpm: 90, key: 'F', sections: [] },
                    },
                ],
                currentSongId: 'saved',
            }),
        );
        await renderFreshApp();
        expect(screen.getByRole('heading', { name: 'Saved Song' })).toBeTruthy();
    });

    it('shows the sample song when localStorage holds a broken value', async () => {
        localStorage.setItem(STORAGE_KEY, '{broken');
        await renderFreshApp();
        expect(screen.getByRole('heading', { name: 'Someday My Prince Will Come' })).toBeTruthy();
    });
});

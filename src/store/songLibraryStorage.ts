import { z } from 'zod';
import { SongSchema } from '../types';

export const STORAGE_KEY = 'code-score-maker:songs';

/** The subset of the Web Storage API this module needs, so tests can pass a fake. */
export interface KeyValueStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

export const SongEntrySchema = z.object({
    id: z.string().min(1),
    song: SongSchema,
});

const hasUniqueIds = (songs: { id: string }[]) => new Set(songs.map((s) => s.id)).size === songs.length;

export const SongLibrarySchema = z
    .object({
        version: z.literal(1),
        songs: z.array(SongEntrySchema).min(1),
        currentSongId: z.string(),
    })
    .refine((lib) => hasUniqueIds(lib.songs), { message: 'song ids must be unique' })
    .refine((lib) => lib.songs.some((s) => s.id === lib.currentSongId), {
        message: 'currentSongId must point to a stored song',
    });

export type SongEntry = z.infer<typeof SongEntrySchema>;
export type SongLibrary = z.infer<typeof SongLibrarySchema>;

const parseJson = (raw: string): unknown => {
    try {
        return JSON.parse(raw);
    } catch {
        return undefined;
    }
};

/**
 * Reads the saved library. Returns null when nothing is saved, the value is
 * malformed, or the storage cannot be read (e.g. it throws).
 */
export function loadSongLibrary(storage: KeyValueStorage | null): SongLibrary | null {
    if (!storage) return null;
    let raw: string | null;
    try {
        raw = storage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
    if (raw === null) return null;
    const result = SongLibrarySchema.safeParse(parseJson(raw));
    return result.success ? result.data : null;
}

/** Saves the library. Returns false when the storage is missing or refuses the write (e.g. quota exceeded). */
export function saveSongLibrary(storage: KeyValueStorage | null, library: SongLibrary): boolean {
    if (!storage) return false;
    try {
        storage.setItem(STORAGE_KEY, JSON.stringify(library));
        return true;
    } catch {
        return false;
    }
}

/** Returns the browser's localStorage, or null where it does not exist or access is denied. */
export function getBrowserStorage(): KeyValueStorage | null {
    if (typeof window === 'undefined') return null;
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

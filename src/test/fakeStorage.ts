import type { KeyValueStorage } from '../store/songLibraryStorage';

/** In-memory storage for tests. Reads or writes can be made to throw to simulate failures. */
export class FakeStorage implements KeyValueStorage {
    readonly data = new Map<string, string>();
    failReads = false;
    failWrites = false;
    writes = 0;

    getItem(key: string): string | null {
        if (this.failReads) throw new Error('read failed');
        return this.data.get(key) ?? null;
    }

    setItem(key: string, value: string): void {
        if (this.failWrites) throw new DOMException('quota exceeded', 'QuotaExceededError');
        this.writes += 1;
        this.data.set(key, value);
    }
}

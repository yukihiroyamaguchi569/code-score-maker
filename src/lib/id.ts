/**
 * Returns a random 128-bit id as 32 hex characters.
 * Uses getRandomValues rather than randomUUID because randomUUID is missing
 * outside secure contexts (e.g. the dev server opened over the LAN by IP).
 */
export function generateId(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

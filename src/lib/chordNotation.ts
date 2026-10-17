// Chords are stored with "maj7" and shown with "Δ7"
export const toDisplayChord = (chord: string) => chord.replace(/maj7/g, 'Δ7');

export const toStoredChord = (chord: string) => chord.replace(/Δ7/g, 'maj7');

// Maps an offset in a stored-form string to the same place after toDisplayChord.
// An offset inside "maj7" moves to the end of its "Δ7".
export const toDisplayOffset = (chord: string, offset: number) => {
    let shift = 0;
    for (const match of chord.matchAll(/maj7/g)) {
        const start = match.index;
        if (offset <= start) break;
        if (offset < start + match[0].length) return start - shift + 'Δ7'.length;
        shift += match[0].length - 'Δ7'.length;
    }
    return offset - shift;
};

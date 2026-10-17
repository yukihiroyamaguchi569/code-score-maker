// Chords are stored with "maj7" and shown with "Δ7"
export const toDisplayChord = (chord: string) => chord.replace(/maj7/g, 'Δ7');

export const toStoredChord = (chord: string) => chord.replace(/Δ7/g, 'maj7');

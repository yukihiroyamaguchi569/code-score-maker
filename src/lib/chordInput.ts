// Root (with optional accidental) followed by an optional minor "m" that is not the start of "maj"
const ROOT_AND_MINOR = /^([A-G][#b]?)?(m(?!aj))?/;

export const toggleMinor = (chord: string) =>
    chord.replace(ROOT_AND_MINOR, (_match: string, root: string | undefined, minor: string | undefined) => {
        const base = root ?? '';
        return minor ? base : `${base}m`;
    });

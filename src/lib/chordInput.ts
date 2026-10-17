// Root (with optional accidental) followed by an optional minor "m" that is not the start of "maj" (also a partly typed "ma")
const ROOT_AND_MINOR = /^([A-G][#b]?)?(m(?!aj|a$))?/;

export const toggleMinor = (chord: string) =>
    chord.replace(ROOT_AND_MINOR, (_match: string, root: string | undefined, minor: string | undefined) => {
        const base = root ?? '';
        return minor ? base : `${base}m`;
    });

// A second click of the same button must not stack the same suffix
export const appendSuffix = (chord: string, suffix: string) =>
    chord.endsWith(suffix) ? chord : chord + suffix;

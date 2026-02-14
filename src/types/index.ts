export interface Beat {
    chord: string;
    lyric?: string;
    isTentative?: boolean;
}

export interface Measure {
    id: string;
    beats: Beat[];
}

export interface Section {
    id: string;
    title: string;
    measures: Measure[];
}

export interface Song {
    title: string;
    artist: string;
    bpm: number;
    key: string;
    sections: Section[];
}

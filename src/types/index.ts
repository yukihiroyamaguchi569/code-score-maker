import { z } from 'zod';

// Types are inferred from these schemas so that values read from storage
// can be validated against exactly the same shape the app uses.
const BeatSchema = z.object({
    chord: z.string(),
    lyric: z.string().optional(),
    isTentative: z.boolean().optional(),
});

const MeasureSchema = z.object({
    id: z.string(),
    beats: z.array(BeatSchema),
});

const SectionSchema = z.object({
    id: z.string(),
    title: z.string(),
    measures: z.array(MeasureSchema),
});

export const SongSchema = z.object({
    title: z.string(),
    artist: z.string(),
    bpm: z.number(),
    key: z.string(),
    sections: z.array(SectionSchema),
});

export type Beat = z.infer<typeof BeatSchema>;
export type Measure = z.infer<typeof MeasureSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type Song = z.infer<typeof SongSchema>;

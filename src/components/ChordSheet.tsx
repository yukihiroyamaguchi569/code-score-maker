import type { Song, Section, Measure, Beat } from '../types';

interface ChordSheetProps {
    song: Song;
}

const BeatCell = ({ beat, index }: { beat: Beat; index: number }) => {
    return (
        <div className={`
      relative p-2 border-r border-gray-700 last:border-r-0 min-h-[4rem] flex flex-col justify-center
      ${index === 0 ? 'bg-gray-800/30' : ''}
    `}>
            <div className="text-xl font-bold text-white text-center">
                {beat.chord || <span className="text-gray-600">-</span>}
            </div>
            {beat.lyric && (
                <div className="text-xs text-gray-400 text-center mt-1 truncate">
                    {beat.lyric}
                </div>
            )}
            {/* Beat indicator for debugging or visual aid */}
            <div className="absolute top-1 right-1 text-[10px] text-gray-700">
                {index + 1}
            </div>
        </div>
    );
};

const MeasureBlock = ({ measure }: { measure: Measure }) => {
    return (
        <div className="grid grid-cols-4 border border-gray-700 rounded bg-gray-800/50">
            {measure.beats.map((beat, idx) => (
                <BeatCell key={`${measure.id}-beat-${idx}`} beat={beat} index={idx} />
            ))}
        </div>
    );
};

const SectionBlock = ({ section }: { section: Section }) => {
    return (
        <div className="relative mb-6">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="md:w-32 flex-shrink-0 pt-4">
                    <div className="sticky top-20">
                        <h3 className="text-xl font-bold text-indigo-400 border-l-4 border-indigo-500 pl-3">
                            {section.title}
                        </h3>
                    </div>
                </div>
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-2">
                    {section.measures.map((measure) => (
                        <MeasureBlock key={measure.id} measure={measure} />
                    ))}
                </div>
            </div>
            <div className="h-px bg-gray-800 my-6"></div>
        </div>
    );
};

export const ChordSheet = ({ song }: ChordSheetProps) => {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-2">
                {song.sections.map((section) => (
                    <SectionBlock key={section.id} section={section} />
                ))}
            </div>
        </div>
    );
};

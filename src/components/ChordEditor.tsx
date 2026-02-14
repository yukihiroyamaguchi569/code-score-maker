import { useEffect, useRef, useState } from 'react';
import { useSongStore } from '../store/songStore';
import { X, Check } from 'lucide-react';

export const ChordEditor = () => {
    const { editingBeat, setEditingBeat, updateBeat, addToHistory, chordHistory } = useSongStore();
    const [chordInput, setChordInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync input with current beat chord when editor opens
    useEffect(() => {
        if (editingBeat) {
            const { sectionId, measureId, beatIndex } = editingBeat;
            // Retrieve current chord from store (this logic could be in a selector but direct access is fine for now)
            const state = useSongStore.getState();
            const section = state.song.sections.find(s => s.id === sectionId);
            const measure = section?.measures.find(m => m.id === measureId);
            const beat = measure?.beats[beatIndex];
            setChordInput(beat?.chord || "");

            // Focus input
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [editingBeat]);

    if (!editingBeat) return null;

    const handleSave = () => {
        if (editingBeat) {
            updateBeat(editingBeat.sectionId, editingBeat.measureId, editingBeat.beatIndex, { chord: chordInput });
            if (chordInput) addToHistory(chordInput);
            setEditingBeat(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setEditingBeat(null);
        }
    };

    const handleHistoryClick = (chord: string) => {
        setChordInput(chord);
        // Optional: Auto-save on history click? Or just fill input? 
        // Let's just fill input for now to allow further editing.
        inputRef.current?.focus();
    };

    // Simple suggestion logic (can be expanded)
    const suggestions = ["M7", "7", "m7", "m7b5", "dim7", "add9", "sus4"];
    const root = chordInput.match(/^[A-G][b#]?/)?.[0] || "";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setEditingBeat(null)}>
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Edit Chord</h3>
                    <button onClick={() => setEditingBeat(null)} className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Chord Symbol</label>
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={chordInput}
                                onChange={(e) => setChordInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-2xl font-bold text-center text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none uppercase placeholder-gray-700"
                                placeholder="ex. Cmaj7"
                            />
                        </div>
                    </div>

                    {/* Suggestions */}
                    {root && (
                        <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Suggestions</div>
                            <div className="flex flex-wrap gap-2">
                                {suggestions.map(quality => (
                                    <button
                                        key={quality}
                                        onClick={() => {
                                            setChordInput(root + quality);
                                            inputRef.current?.focus();
                                        }}
                                        className="px-3 py-1.5 bg-gray-700 hover:bg-indigo-600 text-sm text-gray-200 rounded-md transition-colors"
                                    >
                                        {root}{quality}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* History */}
                    {chordHistory.length > 0 && (
                        <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recently Used</div>
                            <div className="flex flex-wrap gap-2">
                                {chordHistory.map((chord, i) => (
                                    <button
                                        key={`${chord}-${i}`}
                                        onClick={() => handleHistoryClick(chord)}
                                        className="px-3 py-1.5 bg-gray-700/50 hover:bg-gray-600 border border-gray-600 text-sm text-gray-300 rounded-md transition-colors"
                                    >
                                        {chord}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-end gap-3">
                    <button
                        onClick={() => setEditingBeat(null)}
                        className="px-4 py-2 text-gray-400 hover:text-white font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all"
                    >
                        <Check className="w-4 h-4" />
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

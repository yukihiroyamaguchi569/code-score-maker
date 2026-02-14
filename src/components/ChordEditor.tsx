import { useEffect, useRef, useState } from 'react';
import { useSongStore } from '../store/songStore';
import { X, Check } from 'lucide-react';
import { cn } from '../lib/utils';

// Helper to normalize chord display
const normalizeChord = (chord: string) => {
    return chord.replace(/maj7/g, 'Δ7');
};



export const ChordEditor = () => {
    const { editingBeat, setEditingBeat, updateBeat, addToHistory, chordHistory } = useSongStore();
    const [chordInput, setChordInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync input with current beat chord when editor opens
    useEffect(() => {
        if (editingBeat) {
            const { sectionId, measureId, beatIndex } = editingBeat;
            const state = useSongStore.getState();
            const section = state.song.sections.find(s => s.id === sectionId);
            const measure = section?.measures.find(m => m.id === measureId);
            const beat = measure?.beats[beatIndex];
            setChordInput(normalizeChord(beat?.chord || ""));

            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [editingBeat]);

    if (!editingBeat) return null;

    const handleSave = () => {
        if (editingBeat) {
            // Save as normalized "Δ7" if user prefers, or standard "maj7"?
            // User asked for "notation to be Δ7". 
            // If we save "Δ7", then our system uses that. 
            // Let's save what the user sees/inputs.
            const valueToSave = chordInput;
            updateBeat(editingBeat.sectionId, editingBeat.measureId, editingBeat.beatIndex, { chord: valueToSave });
            if (valueToSave) addToHistory(valueToSave);
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
        inputRef.current?.focus();
    };

    const setRoot = (root: string) => {
        // If current input is empty, just set root
        // If current input has a root, replace it? Or just append?
        // Usually, clicking a root button replaces the root of the current chord or starts a new one.
        // Let's try: Replace the root part if exists, or append if empty.
        // Simple regex to find root: ^[A-G][#b]?

        const currentRootMatch = chordInput.match(/^[A-G][#b]?/);
        if (currentRootMatch) {
            setChordInput(chordInput.replace(currentRootMatch[0], root));
        } else {
            setChordInput(root + chordInput);
        }
        inputRef.current?.focus();
    };

    const toggleAccidental = (acc: '#' | 'b') => {
        const rootMatch = chordInput.match(/^[A-G][#b]?/);
        if (!rootMatch) return;

        const currentRoot = rootMatch[0];
        let newRoot = currentRoot;

        if (currentRoot.endsWith(acc)) {
            // Toggle off
            newRoot = currentRoot.slice(0, -1);
        } else if (currentRoot.length > 1) {
            // Switch accidental (e.g. F# -> Fb)
            newRoot = currentRoot[0] + acc;
        } else {
            // Add accidental
            newRoot = currentRoot + acc;
        }

        setChordInput(chordInput.replace(currentRoot, newRoot));
        inputRef.current?.focus();
    };

    const appendQuality = (q: string) => {
        // Append to end. 
        // If 'm' is clicked, and already has 'm', maybe toggle? 
        // For now, simple append logic, but be smart about 'm' vs 'maj7'.

        // Special handling for 'm' (minor) to be inserted after root/accidental but before others?
        // Actually, chord symbols are [Root][Quality][Extensions].
        // If user clicks "m", should we inject it?

        // Let's just append for simplicity as requested, 
        // but maybe replcae if it conflicts? e.g. clicking m then maj7.

        setChordInput(prev => prev + q);
        inputRef.current?.focus();
    }

    const ROOTS = ["C", "D", "E", "F", "G", "A", "B"];
    // "m" separate
    // "7, 9, 11 etc"
    const QUALITIES = ["Δ7", "7", "sus4", "dim", "aug", "add9"];
    const TENSIONS = ["9", "11", "13", "#11", "b13"];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditingBeat(null)}>
            <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                    <h3 className="text-lg font-bold text-white">Edit Chord</h3>
                    <button onClick={() => setEditingBeat(null)} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1 space-y-6">

                    {/* Input Display */}
                    <div>
                        <input
                            ref={inputRef}
                            type="text"
                            value={chordInput}
                            onChange={(e) => setChordInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-black/40 border border-gray-600 rounded-lg px-4 py-4 text-3xl font-bold text-center text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none uppercase placeholder-gray-700 font-mono"
                            placeholder=""
                        />
                    </div>

                    {/* History */}
                    {chordHistory.length > 0 && (
                        <div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Recently Used</div>
                            <div className="flex flex-wrap gap-2">
                                {chordHistory.map((chord, i) => (
                                    <button
                                        key={`${chord}-${i}`}
                                        onClick={() => handleHistoryClick(chord)}
                                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm font-medium text-indigo-300 rounded transition-colors"
                                    >
                                        {normalizeChord(chord)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Roots */}
                        <div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Root</div>
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {ROOTS.map(root => (
                                    <button
                                        key={root}
                                        onClick={() => setRoot(root)}
                                        className={cn(
                                            "aspect-square flex items-center justify-center rounded font-bold text-lg transition-colors",
                                            "bg-gray-800 hover:bg-indigo-600 text-white border border-gray-700 hover:border-indigo-500"
                                        )}
                                    >
                                        {root}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => toggleAccidental('#')} className="py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-white font-bold">♯ (Sharp)</button>
                                <button onClick={() => toggleAccidental('b')} className="py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-white font-bold">♭ (Flat)</button>
                            </div>
                        </div>

                        {/* Qualities & Tensions */}
                        <div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Quality & Extension</div>

                            <div className="flex flex-wrap gap-2 mb-2">
                                {/* Minor is special */}
                                <button onClick={() => appendQuality('m')} className="px-4 py-2 bg-gray-800 hover:bg-indigo-600 border border-gray-700 rounded text-white font-bold">
                                    m
                                </button>
                                {QUALITIES.map(q => (
                                    <button key={q} onClick={() => appendQuality(q)} className="px-3 py-2 bg-gray-800 hover:bg-indigo-600 border border-gray-700 rounded text-white font-medium">
                                        {q}
                                    </button>
                                ))}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {TENSIONS.map(t => (
                                    <button key={t} onClick={() => appendQuality(t)} className="px-3 py-1.5 bg-gray-800/60 hover:bg-gray-700 border border-gray-700 rounded text-gray-300 text-sm">
                                        {t}
                                    </button>
                                ))}
                                <button onClick={() => appendQuality('/')} className="px-3 py-1.5 bg-gray-800/60 hover:bg-gray-700 border border-gray-700 rounded text-gray-300 text-sm">
                                    / (On)
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="p-4 bg-gray-800/50 border-t border-gray-800 flex justify-end gap-3">
                    <button
                        onClick={() => setEditingBeat(null)}
                        className="px-4 py-2 text-gray-400 hover:text-white font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-8 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all"
                    >
                        <Check className="w-5 h-5" />
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

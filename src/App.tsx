import { useEffect } from 'react';
import { Header } from './components/Header';
import { ChordSheet } from './components/ChordSheet';
import { ChordEditor } from './components/ChordEditor';
import { useSongStore } from './store/songStore';
import type { Song, Beat } from './types';

// Helper to create empty beats
const createBeats = (chords: string[], lyrics?: string[]): Beat[] => {
  return Array(4).fill(null).map((_, i) => ({
    chord: chords[i] || '',
    lyric: lyrics?.[i] || undefined,
  }));
};

// Sample Data
const SAMPLE_SONG: Song = {
  title: "Someday My Prince Will Come",
  artist: "Bill Evans",
  bpm: 110,
  key: "Bb",
  sections: [
    {
      id: "s1",
      title: "Intro",
      measures: [
        { id: "m1", beats: createBeats(["Bbmaj7", "", "D7", ""], ["Some", "", "day", ""]) },
        { id: "m2", beats: createBeats(["Gm7", "", "Ebmaj7", ""]) },
        { id: "m3", beats: createBeats(["Cm7", "", "F7", ""]) },
        { id: "m4", beats: createBeats(["Bbmaj7", "", "F7", ""]) },
      ]
    },
    {
      id: "s2",
      title: "A",
      measures: [
        { id: "m5", beats: createBeats(["Bbmaj7", "", "D7(#5)", ""]) },
        { id: "m6", beats: createBeats(["Ebmaj7", "", "G7(b9)", ""]) },
        { id: "m7", beats: createBeats(["Cm7", "", "G7", ""]) },
        { id: "m8", beats: createBeats(["Cm7", "", "", ""]) },
        { id: "m9", beats: createBeats(["F7", "", "", ""]) },
        { id: "m10", beats: createBeats(["Dm7", "", "G7", ""]) },
        { id: "m11", beats: createBeats(["Cm7", "", "F7", ""]) },
        { id: "m12", beats: createBeats(["Bbmaj7", "", "F7", ""]) },
      ]
    },
    {
      id: "s3",
      title: "B",
      measures: [
        { id: "m13", beats: createBeats(["Bbmaj7", "", "D7(#5)", ""]) },
        { id: "m14", beats: createBeats(["Ebmaj7", "", "G7(b9)", ""]) },
        { id: "m15", beats: createBeats(["Cm7", "", "G7", ""]) },
        { id: "m16", beats: createBeats(["Cm7", "", "", ""]) },
      ]
    }
  ]
};

function App() {
  const { song, setSong } = useSongStore();

  useEffect(() => {
    // Initialize store with sample data
    setSong(SAMPLE_SONG);
  }, [setSong]);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-indigo-500 selection:text-white">
      <Header song={song} />
      <main>
        <ChordSheet />
      </main>
      <ChordEditor />
    </div>
  );
}

export default App;

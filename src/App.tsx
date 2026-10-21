import { useEffect } from 'react';
import { Header } from './components/Header';
import { ChordSheet } from './components/ChordSheet';
import { ChordEditor } from './components/ChordEditor';
import { useSongStore } from './store/songStore';
import { SAMPLE_SONG } from './data/sampleSong';

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

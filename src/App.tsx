import { Header } from './components/Header';
import { ChordSheet } from './components/ChordSheet';
import { ChordEditor } from './components/ChordEditor';
import { selectCurrentSong, useSongStore } from './store/songStore';

function App() {
    const song = useSongStore(selectCurrentSong);

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

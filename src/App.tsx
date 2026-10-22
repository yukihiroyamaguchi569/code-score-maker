import { Header } from './components/Header';
import { ChordSheet } from './components/ChordSheet';
import { ChordEditor } from './components/ChordEditor';
import { SongList } from './components/SongList';
import { selectCurrentSong, useSongStore } from './store/songStore';

const SongView = () => {
    const song = useSongStore(selectCurrentSong);
    const showSongList = useSongStore((state) => state.showSongList);

    return (
        <>
            <Header song={song} onBack={showSongList} />
            <main>
                <ChordSheet />
            </main>
            <ChordEditor />
        </>
    );
};

function App() {
    const screen = useSongStore((state) => state.screen);

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-indigo-500 selection:text-white">
            {screen === 'list' ? <SongList /> : <SongView />}
        </div>
    );
}

export default App;

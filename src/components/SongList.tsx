import { ChevronRight, Music } from 'lucide-react';
import { useSongStore } from '../store/songStore';

export const SongList = () => {
    const songs = useSongStore((state) => state.songs);
    const openSong = useSongStore((state) => state.openSong);

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-4 mb-6">
                <div className="bg-indigo-600 p-2 rounded-lg">
                    <Music className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">曲の一覧</h1>
            </div>
            <ul className="divide-y divide-gray-700 rounded-lg border border-gray-700 bg-gray-800">
                {songs.map(({ id, song }) => (
                    <li key={id}>
                        <button
                            type="button"
                            onClick={() => openSong(id)}
                            className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left hover:bg-gray-700/50 transition-colors"
                        >
                            <span className="min-w-0">
                                <span className="block text-lg font-bold text-white truncate">
                                    {song.title || '（タイトルなし）'}
                                </span>
                                {song.artist && (
                                    <span className="block text-sm text-gray-400 truncate">{song.artist}</span>
                                )}
                            </span>
                            <ChevronRight className="w-5 h-5 shrink-0 text-gray-500" />
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

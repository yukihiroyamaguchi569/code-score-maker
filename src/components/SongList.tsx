import { useState } from 'react';
import { ChevronRight, Copy, Music, Trash2 } from 'lucide-react';
import { useSongStore } from '../store/songStore';
import { useFocusOnMount } from '../lib/useFocusOnMount';
import { displayTitle } from '../lib/songTitle';
import type { SongEntry } from '../store/songLibraryStorage';

interface DeleteConfirmProps {
    title: string;
    isLastSong: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const DeleteConfirm = ({ title, isLastSong, onConfirm, onCancel }: DeleteConfirmProps) => (
    <div role="group" aria-label="削除の確認" className="px-4 py-3 bg-red-950/40">
        <p className="text-white">「{title}」を削除しますか？</p>
        {isLastSong && (
            <p className="mt-1 text-sm text-gray-400">最後の 1 曲なので、削除するとサンプルの曲が入ります。</p>
        )}
        <div className="mt-3 flex gap-2">
            <button
                type="button"
                onClick={onConfirm}
                className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-sm font-bold"
            >
                削除する
            </button>
            <button
                type="button"
                autoFocus
                onClick={onCancel}
                className="px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-sm"
            >
                キャンセル
            </button>
        </div>
    </div>
);

interface SongRowProps {
    entry: SongEntry;
    onOpen: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
}

const SongRow = ({ entry: { song }, onOpen, onDuplicate, onDelete }: SongRowProps) => {
    const title = displayTitle(song.title);
    return (
        <div className="flex items-center">
            <button
                type="button"
                onClick={onOpen}
                className="flex-1 min-w-0 flex items-center justify-between gap-4 px-4 py-3 text-left hover:bg-gray-700/50 transition-colors"
            >
                <span className="min-w-0">
                    <span className="block text-lg font-bold text-white truncate">{title}</span>
                    {song.artist && <span className="block text-sm text-gray-400 truncate">{song.artist}</span>}
                </span>
                <ChevronRight className="w-5 h-5 shrink-0 text-gray-500" />
            </button>
            <button
                type="button"
                onClick={onDuplicate}
                aria-label={`「${title}」を複製`}
                title="複製"
                className="p-3 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
            >
                <Copy className="w-5 h-5" />
            </button>
            <button
                type="button"
                onClick={onDelete}
                aria-label={`「${title}」を削除`}
                title="削除"
                className="p-3 text-gray-400 hover:text-red-400 hover:bg-gray-700/50 transition-colors"
            >
                <Trash2 className="w-5 h-5" />
            </button>
        </div>
    );
};

export const SongList = () => {
    const songs = useSongStore((state) => state.songs);
    const openSong = useSongStore((state) => state.openSong);
    const duplicateSong = useSongStore((state) => state.duplicateSong);
    const deleteSong = useSongStore((state) => state.deleteSong);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const headingRef = useFocusOnMount<HTMLHeadingElement>();

    return (
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-4 mb-6">
                <div className="bg-indigo-600 p-2 rounded-lg">
                    <Music className="w-6 h-6 text-white" />
                </div>
                <h1 ref={headingRef} tabIndex={-1} className="text-xl font-bold text-white focus:outline-none">
                    曲の一覧
                </h1>
            </div>
            <ul className="divide-y divide-gray-700 rounded-lg border border-gray-700 bg-gray-800">
                {songs.map((entry) => (
                    <li key={entry.id}>
                        {confirmingId === entry.id ? (
                            <DeleteConfirm
                                title={displayTitle(entry.song.title)}
                                isLastSong={songs.length === 1}
                                onConfirm={() => {
                                    deleteSong(entry.id);
                                    setConfirmingId(null);
                                }}
                                onCancel={() => setConfirmingId(null)}
                            />
                        ) : (
                            <SongRow
                                entry={entry}
                                onOpen={() => openSong(entry.id)}
                                onDuplicate={() => duplicateSong(entry.id)}
                                onDelete={() => setConfirmingId(entry.id)}
                            />
                        )}
                    </li>
                ))}
            </ul>
        </main>
    );
};

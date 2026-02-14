import { Music, Settings } from 'lucide-react';
import type { Song } from '../types';

interface HeaderProps {
    song: Song;
}

export const Header = ({ song }: HeaderProps) => {
    return (
        <header className="sticky top-0 z-50 bg-gray-800 border-b border-gray-700 shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-600 p-2 rounded-lg">
                            <Music className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white leading-tight">
                                {song.title}
                            </h1>
                            <p className="text-sm text-gray-400">
                                {song.artist}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Key</div>
                            <div className="text-lg font-bold text-indigo-400">{song.key}</div>
                        </div>
                        <div className="h-8 w-px bg-gray-700"></div>
                        <div className="text-center">
                            <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">BPM</div>
                            <div className="text-lg font-bold text-indigo-400">{song.bpm}</div>
                        </div>
                        <div className="ml-4">
                            <button className="p-2 hover:bg-gray-700 rounded-full transition-colors">
                                <Settings className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

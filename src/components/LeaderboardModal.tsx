import React from 'react';
import { Trophy, X } from 'lucide-react';

interface LeaderboardEntry {
  player: string;
  score: number;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaderboard: LeaderboardEntry[];
  currentPlayerAddress?: string;
}

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ 
  isOpen, 
  onClose, 
  leaderboard,
  currentPlayerAddress 
}) => {
  if (!isOpen) return null;

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 sm:p-8 rounded-xl shadow-2xl max-w-md w-full mx-auto animate-scale-fade relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center justify-center mb-6">
          <Trophy className="w-12 h-12 text-yellow-400" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
          Top Players
        </h2>

        <div className="space-y-4">
          {leaderboard.map((entry, index) => (
            <div 
              key={entry.player}
              className={`flex items-center justify-between p-3 rounded-lg ${
                entry.player.toLowerCase() === currentPlayerAddress?.toLowerCase()
                  ? 'bg-purple-500 bg-opacity-20 border border-purple-500'
                  : 'bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                <span className="text-gray-300">{formatAddress(entry.player)}</span>
              </div>
              <span className="font-bold text-yellow-400">{entry.score}</span>
            </div>
          ))}

          {leaderboard.length === 0 && (
            <p className="text-center text-gray-400">No scores recorded yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardModal;
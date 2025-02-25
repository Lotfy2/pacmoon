import React from 'react';
import { Trophy, AlertCircle } from 'lucide-react';

interface LevelCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  score: number;
  pendingTransactions: number;
}

const LevelCompletionModal: React.FC<LevelCompletionModalProps> = ({
  isOpen,
  onClose,
  level,
  score,
  pendingTransactions
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 sm:p-8 rounded-xl shadow-2xl max-w-md w-full mx-auto animate-scale-fade">
        <div className="flex items-center justify-center mb-6">
          <Trophy className="w-12 h-12 text-yellow-400" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
          Level {level} Complete!
        </h2>
        
        <div className="text-gray-300 text-center mb-6">
          <p className="text-lg mb-2">
            Your current score: <span className="text-yellow-400 font-bold">{score}</span>
          </p>
          {pendingTransactions > 0 && (
            <div className="mt-4 bg-blue-900 bg-opacity-50 p-4 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertCircle className="text-blue-400" />
                <h3 className="text-lg font-semibold text-blue-400">Action Required</h3>
              </div>
              <p className="text-sm">
                You have {pendingTransactions} pending moon{pendingTransactions > 1 ? 's' : ''} to confirm.
                Please confirm all transactions to proceed to the next level.
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all flex items-center justify-center gap-2"
        >
          {pendingTransactions > 0 ? 'Confirm Pending Moons' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default LevelCompletionModal;
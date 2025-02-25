import React from 'react';
import { Trophy, ArrowRight } from 'lucide-react';

interface LevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  onStartNext: () => void;
}

const LevelModal: React.FC<LevelModalProps> = ({ isOpen, level, onStartNext }) => {
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
        
        <p className="text-gray-300 text-center mb-6">
          Congratulations! You've mastered this level. Ready for a bigger challenge?
        </p>

        <button
          onClick={onStartNext}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all flex items-center justify-center gap-2 group"
        >
          Start Level {level + 1}
          <ArrowRight className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default LevelModal;
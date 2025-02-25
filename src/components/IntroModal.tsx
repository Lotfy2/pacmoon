import React from 'react';
import { Moon, Zap, Ghost, ArrowRight } from 'lucide-react';

interface IntroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const IntroModal: React.FC<IntroModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-8 rounded-xl shadow-2xl max-w-2xl mx-4 animate-scale-fade">
        <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
          Welcome to PacMoon
        </h2>
        
        <div className="space-y-6 text-gray-300">
          <p className="text-lg">
            Navigate through the cosmic grid, collect moons, and avoid enemies in this fast-paced blockchain game on the Monad network!
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="mt-1 text-purple-400">
                <Moon size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-purple-400">Collect Moons</h3>
                <p>Each moon collected is recorded on the Monad network. The more you collect, the higher your on-chain score!</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="mt-1 text-blue-400">
                <Zap size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-400">Power-Ups</h3>
                <p>Grab power-ups to gain temporary invincibility and move faster through the grid.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="mt-1 text-red-400">
                <Ghost size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-400">Watch Out!</h3>
                <p>Avoid the enemies patrolling the grid. One touch and it's game over!</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-2">How to Play:</h3>
            <p>Use <kbd className="px-2 py-1 bg-gray-700 rounded">W</kbd> <kbd className="px-2 py-1 bg-gray-700 rounded">A</kbd> <kbd className="px-2 py-1 bg-gray-700 rounded">S</kbd> <kbd className="px-2 py-1 bg-gray-700 rounded">D</kbd> or arrow keys to move</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-8 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all flex items-center gap-2 group"
        >
          Start Playing
          <ArrowRight className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default IntroModal;
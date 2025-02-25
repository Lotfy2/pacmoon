import React from 'react';
import { Wallet, Loader2, Send, Trophy, Crown, LogOut } from 'lucide-react';

interface GameControlsProps {
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
  onProcessTransaction: () => void;
  onShowLeaderboard: () => void;
  score: number;
  onChainScore: number;
  isWalletConnected: boolean;
  gameOver: boolean;
  onRestart: () => void;
  isProcessingTransaction: boolean;
  pendingTransactions: number;
  currentLevel: number;
  requiredScore: number;
}

const GameControls: React.FC<GameControlsProps> = ({
  onConnectWallet,
  onDisconnectWallet,
  onProcessTransaction,
  onShowLeaderboard,
  score,
  onChainScore,
  isWalletConnected,
  gameOver,
  onRestart,
  isProcessingTransaction,
  pendingTransactions,
  currentLevel,
  requiredScore,
}) => {
  return (
    <div className="mt-4 flex flex-col items-center gap-4 w-full">
      <div className="flex flex-col sm:flex-row gap-4 w-full">
        <div className="bg-gray-700 p-4 rounded-lg flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <p className="text-yellow-400">Level {currentLevel}</p>
            </div>
            <button
              onClick={onShowLeaderboard}
              className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
            >
              <Crown size={20} />
              <span className="hidden sm:inline">Leaderboard</span>
            </button>
          </div>
          <p className="text-purple-400">Local Score: {score}</p>
          <p className="text-gray-400">Required: {requiredScore}</p>
          {isWalletConnected && (
            <p className="text-blue-400">On-chain Score: {onChainScore}</p>
          )}
        </div>
        {(isProcessingTransaction || pendingTransactions > 0) && (
          <div className="bg-gray-700 p-4 rounded-lg flex items-center gap-3 flex-1">
            {isProcessingTransaction ? (
              <>
                <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                <div>
                  <p className="text-yellow-400">Processing Transaction...</p>
                  {pendingTransactions > 1 && (
                    <p className="text-xs text-gray-400">{pendingTransactions - 1} more in queue</p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4 w-full">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  <p className="text-blue-400">{pendingTransactions} Pending</p>
                </div>
                <button
                  onClick={onProcessTransaction}
                  disabled={pendingTransactions === 0 || isProcessingTransaction}
                  className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ml-auto"
                >
                  <Send size={16} />
                  Confirm Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex gap-4">
        {!isWalletConnected ? (
          <button
            onClick={onConnectWallet}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Wallet size={20} />
            Connect Wallet
          </button>
        ) : (
          <div className="flex gap-4">
            <div className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2">
              <Wallet size={20} />
              Wallet Connected
            </div>
            <button
              onClick={onDisconnectWallet}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <LogOut size={20} />
              Disconnect
            </button>
          </div>
        )}
        {gameOver && (
          <button
            onClick={onRestart}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Play Again
          </button>
        )}
      </div>
    </div>
  );
};

export default GameControls;
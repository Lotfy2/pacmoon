import React, { useState, useEffect, useCallback } from 'react';
import { Wallet } from 'lucide-react';
import GameBoard from './components/GameBoard';
import GameControls from './components/GameControls';
import TransactionModal from './components/TransactionModal';
import IntroModal from './components/IntroModal';
import LevelModal from './components/LevelModal';
import LeaderboardModal from './components/LeaderboardModal';
import LevelCompletionModal from './components/LevelCompletionModal';
import { Position, GameState, Enemy, PowerUp, Lamp, Level } from './types/game';
import { generateRandomPosition, checkCollision, savePendingTransactions, getPendingTransactions, saveGameState, getGameState, getLevelPositions } from './utils/gameUtils';
import { lampManContract } from './utils/contract';

const GRID_SIZE = 15;
const LEVELS: Level[] = [
  {
    number: 1,
    requiredScore: 0,
    enemyCount: 2,
    enemySpeed: 1,
    lampCount: 15,
    powerUpCount: 1,
    completed: false
  },
  {
    number: 2,
    requiredScore: 150,
    enemyCount: 3,
    enemySpeed: 1.2,
    lampCount: 20,
    powerUpCount: 2,
    completed: false
  },
  {
    number: 3,
    requiredScore: 350,
    enemyCount: 4,
    enemySpeed: 1.5,
    lampCount: 25,
    powerUpCount: 2,
    completed: false
  },
  {
    number: 4,
    requiredScore: 600,
    enemyCount: 5,
    enemySpeed: 1.8,
    lampCount: 30,
    powerUpCount: 3,
    completed: false
  },
  {
    number: 5,
    requiredScore: 900,
    enemyCount: 6,
    enemySpeed: 2,
    lampCount: 35,
    powerUpCount: 3,
    completed: false
  }
];

const createInitialState = (level: Level): GameState => {
  const levelPositions = getLevelPositions(level.number, GRID_SIZE);
  
  return {
    player: { x: 1, y: 1 },
    lamps: levelPositions.map((position, i) => ({
      id: `lamp-${i}`,
      position,
      collected: false,
    })),
    enemies: Array.from({ length: level.enemyCount }, (_, i) => ({
      id: `enemy-${i}`,
      position: generateRandomPosition(GRID_SIZE),
      type: i % 2 === 0 ? 'GasSpike' : 'Bottleneck',
      speed: level.enemySpeed,
      direction: { x: Math.random() < 0.5 ? -1 : 1, y: Math.random() < 0.5 ? -1 : 1 }
    })),
    powerUps: Array.from({ length: level.powerUpCount }, (_, i) => ({
      id: `powerup-${i}`,
      position: generateRandomPosition(GRID_SIZE),
      type: i === 0 ? 'TurboNode' : 'AtomicBundle',
      active: false,
    })),
    score: 0,
    isPowerUpActive: false,
    gameOver: false,
    isWalletConnected: false,
    onChainScore: 0,
    lampsCollected: 0,
    currentLevel: 1,
    levels: LEVELS,
    isTransactionPending: false,
    gameStarted: false
  };
};

function App() {
  const [gameState, setGameState] = useState<GameState>(createInitialState(LEVELS[0]));
  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<'waiting' | 'complete' | 'rejected'>('waiting');
  const [pendingLamps, setPendingLamps] = useState<string[]>([]);
  const [showIntro, setShowIntro] = useState(true);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showLevelCompletion, setShowLevelCompletion] = useState(false);
  const [leaderboard, setLeaderboard] = useState<Array<{ player: string; score: number }>>([]);
  const [currentPlayerAddress, setCurrentPlayerAddress] = useState<string>('');

  const loadLeaderboard = useCallback(async () => {
    try {
      const data = await lampManContract.getLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
    const interval = setInterval(loadLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [loadLeaderboard]);

  const handleDisconnectWallet = async () => {
    await lampManContract.disconnect();
    setGameState(prev => ({
      ...prev,
      isWalletConnected: false,
      onChainScore: 0
    }));
    setCurrentPlayerAddress('');
    setLeaderboard([]);
    setPendingLamps([]);
    savePendingTransactions([]);
  };

  const checkLevelCompletion = useCallback(() => {
    if (!gameState.gameStarted) return;
    
    const uncollectedLamps = gameState.lamps.filter(lamp => !lamp.collected);
    const currentLevel = gameState.levels[gameState.currentLevel - 1];
    const nextLevel = gameState.levels[gameState.currentLevel];
    
    // Show completion modal when all lamps are collected
    if (uncollectedLamps.length === 0) {
      setShowLevelCompletion(true);
      
      // Only proceed to next level if we have enough score and no pending transactions
      if (nextLevel && 
          gameState.score >= nextLevel.requiredScore && 
          pendingLamps.length === 0) {
        
        setGameState(prev => ({
          ...prev,
          levels: prev.levels.map(level => 
            level.number === prev.currentLevel ? { ...level, completed: true } : level
          )
        }));
        
        setShowLevelModal(true);
      }
    }
  }, [gameState, pendingLamps.length]);

  const startNextLevel = useCallback(() => {
    if (gameState.currentLevel < LEVELS.length) {
      const nextLevel = LEVELS[gameState.currentLevel];
      setGameState(prev => ({
        ...prev,
        ...createInitialState(nextLevel),
        currentLevel: prev.currentLevel + 1,
        score: prev.score,
        onChainScore: prev.onChainScore,
        isWalletConnected: prev.isWalletConnected,
        levels: prev.levels,
        gameStarted: true
      }));
      setShowLevelModal(false);
      saveGameState(gameState);
    }
  }, [gameState]);

  const addNewLamps = useCallback(() => {
    const currentLevel = gameState.levels[gameState.currentLevel - 1];
    const newLamps = Array.from({ length: 5 }, (_, i) => ({
      id: `lamp-${gameState.lampsCollected + i}`,
      position: generateRandomPosition(GRID_SIZE),
      collected: false,
    }));

    setGameState(prev => ({
      ...prev,
      lamps: [...prev.lamps, ...newLamps].slice(0, currentLevel.lampCount)
    }));
  }, [gameState.lampsCollected, gameState.currentLevel, gameState.levels]);

  const processNextLamp = useCallback(async () => {
    if (pendingLamps.length === 0 || isProcessingTransaction) return;

    setIsProcessingTransaction(true);
    setShowTransactionModal(true);
    setTransactionStatus('waiting');
    setGameState(prev => ({ ...prev, isTransactionPending: true }));

    try {
      const success = await lampManContract.collectLamp();
      if (success) {
        setTransactionStatus('complete');
        const address = await lampManContract.getAddress();
        if (address) {
          const onChainScore = await lampManContract.getPlayerScore(address);
          setGameState(prev => ({
            ...prev,
            onChainScore,
            score: prev.score + 10,
            lampsCollected: prev.lampsCollected + 1,
            isTransactionPending: false
          }));
        }
        setPendingLamps(prev => {
          const newPending = prev.slice(1);
          savePendingTransactions(newPending);
          return newPending;
        });
        
        if (gameState.lampsCollected % 5 === 0) {
          addNewLamps();
        }

        checkLevelCompletion();
        loadLeaderboard();

        setTimeout(() => {
          setShowTransactionModal(false);
          setIsProcessingTransaction(false);
        }, 300);
      }
    } catch (error: any) {
      console.error('Error processing lamp:', error);
      const isUserRejection = error.code === 4001 || 
                             error.code === 'ACTION_REJECTED' ||
                             (error.info?.error?.code === 4001);
      
      setTransactionStatus(isUserRejection ? 'rejected' : 'waiting');
      setGameState(prev => ({ ...prev, isTransactionPending: false }));
      
      if (isUserRejection) {
        setGameState(prev => ({
          ...prev,
          lamps: prev.lamps.map(lamp => 
            lamp.id === pendingLamps[0] ? { ...lamp, collected: false } : lamp
          )
        }));
        setPendingLamps(prev => {
          const newPending = prev.slice(1);
          savePendingTransactions(newPending);
          return newPending;
        });
      }

      setTimeout(() => {
        setShowTransactionModal(false);
        setIsProcessingTransaction(false);
      }, 1000);
    }
  }, [pendingLamps, isProcessingTransaction, gameState.lampsCollected, addNewLamps, checkLevelCompletion, loadLeaderboard]);

  const moveEnemies = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      enemies: prev.enemies.map((enemy) => {
        const currentLevel = prev.levels[prev.currentLevel - 1];
        const moveChance = enemy.speed * currentLevel.enemySpeed;
        const shouldMove = Math.random() < moveChance;

        if (!shouldMove) return enemy;

        const newPosition = {
          x: Math.max(0, Math.min(GRID_SIZE - 1, enemy.position.x + enemy.direction.x)),
          y: Math.max(0, Math.min(GRID_SIZE - 1, enemy.position.y + enemy.direction.y))
        };

        // Change direction if hitting a wall
        const newDirection = {
          x: newPosition.x === 0 || newPosition.x === GRID_SIZE - 1 ? -enemy.direction.x : enemy.direction.x,
          y: newPosition.y === 0 || newPosition.y === GRID_SIZE - 1 ? -enemy.direction.y : enemy.direction.y
        };

        return {
          ...enemy,
          position: newPosition,
          direction: newDirection
        };
      }),
    }));
  }, []);

  const movePlayer = useCallback((direction: { x: number; y: number }) => {
    if (gameState.gameOver || gameState.isTransactionPending) return;

    setGameState((prev) => {
      const newPosition: Position = {
        x: Math.max(0, Math.min(GRID_SIZE - 1, prev.player.x + direction.x)),
        y: Math.max(0, Math.min(GRID_SIZE - 1, prev.player.y + direction.y)),
      };

      const hasEnemyCollision = prev.enemies.some(enemy => 
        checkCollision(newPosition, enemy.position)
      );

      if (hasEnemyCollision && !prev.isPowerUpActive) {
        return { ...prev, gameOver: true };
      }

      const collectedLamp = prev.lamps.find(
        (lamp) => !lamp.collected && checkCollision(newPosition, lamp.position)
      );

      if (collectedLamp && prev.isWalletConnected) {
        setPendingLamps(prevLamps => {
          const newPending = [...prevLamps, collectedLamp.id];
          savePendingTransactions(newPending);
          return newPending;
        });
      }

      const collectedPowerUp = prev.powerUps.find(
        (p) => !p.active && checkCollision(newPosition, p.position)
      );

      let isPowerUpActive = prev.isPowerUpActive;
      if (collectedPowerUp) {
        isPowerUpActive = true;
        setTimeout(() => {
          setGameState(prevState => ({
            ...prevState,
            isPowerUpActive: false
          }));
        }, 10000);
      }

      const newState = {
        ...prev,
        player: newPosition,
        isPowerUpActive,
        lamps: prev.lamps.map((lamp) =>
          lamp.id === collectedLamp?.id ? { ...lamp, collected: true } : lamp
        ),
        powerUps: prev.powerUps.map((p) =>
          p.id === collectedPowerUp?.id ? { ...p, active: true } : p
        ),
        gameStarted: true
      };

      // Check level completion after collecting a lamp
      if (collectedLamp) {
        setTimeout(() => checkLevelCompletion(), 0);
      }

      saveGameState(newState);
      return newState;
    });
  }, [gameState.gameOver, gameState.isTransactionPending, gameState.isWalletConnected, checkLevelCompletion]);

  const handleConnectWallet = async () => {
    const connected = await lampManContract.connect();
    if (connected) {
      const address = await lampManContract.getAddress();
      setCurrentPlayerAddress(address || '');
      setGameState(prev => ({
        ...prev,
        isWalletConnected: true
      }));
      setShowIntro(false);
      loadLeaderboard();
    }
  };

  const handleRestart = () => {
    setGameState(prev => ({
      ...createInitialState(LEVELS[0]),
      isWalletConnected: prev.isWalletConnected,
      onChainScore: prev.onChainScore
    }));
    setPendingLamps([]);
    savePendingTransactions([]);
    saveGameState(null);
  };

  useEffect(() => {
    const savedState = getGameState();
    const savedPending = getPendingTransactions();
    
    if (savedState) {
      setGameState(prev => ({
        ...prev,
        ...savedState,
        isWalletConnected: prev.isWalletConnected
      }));
    }
    
    if (savedPending.length > 0) {
      setPendingLamps(savedPending);
    }
  }, []);

  useEffect(() => {
    const enemyInterval = setInterval(moveEnemies, 500);
    return () => clearInterval(enemyInterval);
  }, [moveEnemies]);

  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartX || !touchStartY) return;

      const touchEndX = e.touches[0].clientX;
      const touchEndY = e.touches[0].clientY;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          movePlayer({ x: 1, y: 0 });
        } else {
          movePlayer({ x: -1, y: 0 });
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          movePlayer({ x: 0, y: 1 });
        } else {
          movePlayer({ x: 0, y: -1 });
        }
      }

      touchStartX = touchEndX;
      touchStartY = touchEndY;
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [movePlayer]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const keyActions: { [key: string]: { x: number; y: number } } = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: -1 },
        s: { x: 0, y: 1 },
        a: { x: -1, y: 0 },
        d: { x: 1, y: 0 },
      };

      const direction = keyActions[event.key];
      if (direction) {
        event.preventDefault();
        movePlayer(direction);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [movePlayer]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#1E293B] text-white">
      {!gameState.isWalletConnected ? (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
          <div className="text-center max-w-4xl w-full">
            <h1 className="text-4xl sm:text-5xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              PacMoon
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              A fast-paced blockchain game on the Monad network
            </p>
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-purple-400">Top Players</h2>
                {leaderboard.length > 0 ? (
                  <div className="space-y-4">
                    {leaderboard.map((entry, index) => (
                      <div 
                        key={entry.player}
                        className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                          <span className="text-gray-300">{`${entry.player.slice(0, 6)}...${entry.player.slice(-4)}`}</span>
                        </div>
                        <span className="font-bold text-yellow-400">{entry.score}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No scores recorded yet. Be the first to play!</p>
                )}
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-blue-400">How to Play</h2>
                <div className="space-y-4 text-gray-300">
                  <p>Connect your wallet to start playing and compete for the highest score on the Monad blockchain!</p>
                  <div className="space-y-2">
                    <p>🎮 Use arrow keys or WASD to move</p>
                    <p>🌙 Collect moons to earn points</p>
                    <p>⚡ Grab power-ups for temporary invincibility</p>
                    <p>👻 Avoid enemies or it's game over!</p>
                  </div>
                </div>
                <button
                  onClick={handleConnectWallet}
                  className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all flex items-center justify-center gap-2"
                >
                  <Wallet className="w-5 h-5" />
                  Connect Wallet to Play
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
          <div className="relative z-10 w-full max-w-4xl">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 sm:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 text-center">
              PacMoon - Level {gameState.currentLevel}
            </h1>
            <div className="game-container flex flex-col items-center">
              <GameBoard
                player={gameState.player}
                lamps={gameState.lamps.filter((l) => !l.collected).map((l) => l.position)}
                enemies={gameState.enemies.map((e) => e.position)}
                powerUps={gameState.powerUps.filter((p) => !p.active).map((p) => p.position)}
                gridSize={GRID_SIZE}
                isPowerUpActive={gameState.isPowerUpActive}
                gameOver={gameState.gameOver}
              />
              <GameControls
                onConnectWallet={handleConnectWallet}
                onDisconnectWallet={handleDisconnectWallet}
                onProcessTransaction={processNextLamp}
                onShowLeaderboard={() => setShowLeaderboard(true)}
                score={gameState.score}
                onChainScore={gameState.onChainScore || 0}
                isWalletConnected={gameState.isWalletConnected}
                gameOver={gameState.gameOver}
                onRestart={handleRestart}
                isProcessingTransaction={isProcessingTransaction}
                pendingTransactions={pendingLamps.length}
                currentLevel={gameState.currentLevel}
                requiredScore={gameState.levels[gameState.currentLevel - 1].requiredScore}
              />
            </div>
          </div>
        </div>
      )}
      <TransactionModal 
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false);
          setGameState(prev => ({ ...prev, isTransactionPending: false }));
        }}
        status={transactionStatus}
      />
      <IntroModal isOpen={showIntro} onClose={() => setShowIntro(false)} />
      <LevelModal 
        isOpen={showLevelModal}
        onClose={() => setShowLevelModal(false)}
        level={gameState.currentLevel}
        onStartNext={startNextLevel}
      />
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        leaderboard={leaderboard}
        currentPlayerAddress={currentPlayerAddress}
      />
      <LevelCompletionModal
        isOpen={showLevelCompletion}
        onClose={() => {
          setShowLevelCompletion(false);
          if (pendingLamps.length > 0) {
            processNextLamp();
          }
        }}
        level={gameState.currentLevel}
        score={gameState.score}
        pendingTransactions={pendingLamps.length}
      />
    </div>
  );
}

export default App;
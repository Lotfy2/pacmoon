import React from 'react';
import { Position } from '../types/game';
import { Moon, Zap, AlertTriangle } from 'lucide-react';

interface GameBoardProps {
  player: Position;
  lamps: Position[];
  enemies: Position[];
  powerUps: Position[];
  gridSize: number;
  isPowerUpActive: boolean;
  gameOver: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({
  player,
  lamps,
  enemies,
  powerUps,
  gridSize,
  isPowerUpActive,
  gameOver,
}) => {
  const cellSize = typeof window !== 'undefined' ? 
    Math.min(
      (window.innerWidth - 32) / gridSize,
      (window.innerHeight - 200) / gridSize,
      40
    ) : 40;

  const renderCell = (x: number, y: number) => {
    if (player.x === x && player.y === y) {
      return (
        <div 
          className={`
            ${isPowerUpActive ? 'bg-blue-400' : 'bg-yellow-400'} 
            rounded-full w-full h-full 
            ${isPowerUpActive ? 'animate-pulse' : ''}
            transition-colors duration-300
          `} 
        />
      );
    }

    const isLamp = lamps.some((lamp) => lamp.x === x && lamp.y === y);
    if (isLamp) {
      return (
        <div className="text-purple-500 animate-pulse">
          <Moon size={Math.min(cellSize * 0.6, 20)} />
        </div>
      );
    }

    const isEnemy = enemies.some((enemy) => enemy.x === x && enemy.y === y);
    if (isEnemy) {
      return (
        <div className="text-red-500 animate-pulse">
          <AlertTriangle size={Math.min(cellSize * 0.6, 20)} />
        </div>
      );
    }

    const isPowerUp = powerUps.some((powerUp) => powerUp.x === x && powerUp.y === y);
    if (isPowerUp) {
      return (
        <div className="text-blue-400 animate-pulse">
          <Zap size={Math.min(cellSize * 0.6, 20)} />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="relative">
      <div 
        className="grid gap-1 bg-gray-800 p-4 rounded-lg mx-auto"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          width: 'fit-content'
        }}
      >
        {Array.from({ length: gridSize * gridSize }).map((_, index) => {
          const x = index % gridSize;
          const y = Math.floor(index / gridSize);
          return (
            <div
              key={`${x}-${y}`}
              className="bg-gray-700 rounded flex items-center justify-center"
              style={{
                width: `${cellSize}px`,
                height: `${cellSize}px`
              }}
            >
              {renderCell(x, y)}
            </div>
          );
        })}
      </div>
      {gameOver && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="text-2xl font-bold text-red-500">GAME OVER</div>
        </div>
      )}
    </div>
  );
};

export default GameBoard
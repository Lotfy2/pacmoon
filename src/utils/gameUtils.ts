import { GameState, Position } from '../types/game';

export function generateRandomPosition(gridSize: number) {
  return {
    x: Math.floor(Math.random() * gridSize),
    y: Math.floor(Math.random() * gridSize),
  };
}

export function getMShapedPositions(gridSize: number): Position[] {
  const positions: Position[] = [];
  
  // Left vertical line
  for (let y = 3; y <= 11; y++) {
    positions.push({ x: 3, y });
  }
  
  // First diagonal
  positions.push({ x: 4, y: 4 });
  positions.push({ x: 5, y: 5 });
  positions.push({ x: 6, y: 6 });
  
  // Middle vertical line
  for (let y = 3; y <= 11; y++) {
    positions.push({ x: 7, y });
  }
  
  // Second diagonal
  positions.push({ x: 8, y: 6 });
  positions.push({ x: 9, y: 5 });
  positions.push({ x: 10, y: 4 });
  
  // Right vertical line
  for (let y = 3; y <= 11; y++) {
    positions.push({ x: 11, y });
  }
  
  return positions;
}

export function getOShapedPositions(gridSize: number): Position[] {
  const positions: Position[] = [];
  
  // Top and bottom horizontal lines
  for (let x = 5; x <= 9; x++) {
    positions.push({ x, y: 3 });
    positions.push({ x, y: 11 });
  }
  
  // Left and right vertical lines
  for (let y = 4; y <= 10; y++) {
    positions.push({ x: 5, y });
    positions.push({ x: 9, y });
  }
  
  return positions;
}

export function getNShapedPositions(gridSize: number): Position[] {
  const positions: Position[] = [];
  
  // Left vertical line
  for (let y = 3; y <= 11; y++) {
    positions.push({ x: 4, y });
  }
  
  // Diagonal line
  for (let i = 0; i < 5; i++) {
    positions.push({ x: 5 + i, y: 4 + i });
  }
  
  // Right vertical line
  for (let y = 3; y <= 11; y++) {
    positions.push({ x: 10, y });
  }
  
  return positions;
}

export function getAShapedPositions(gridSize: number): Position[] {
  const positions: Position[] = [];
  
  // Left diagonal
  for (let i = 0; i < 5; i++) {
    positions.push({ x: 4 + i, y: 11 - i });
  }
  
  // Right diagonal
  for (let i = 0; i < 5; i++) {
    positions.push({ x: 10 - i, y: 11 - i });
  }
  
  // Middle horizontal line
  for (let x = 5; x <= 9; x++) {
    positions.push({ x, y: 7 });
  }
  
  return positions;
}

export function getDShapedPositions(gridSize: number): Position[] {
  const positions: Position[] = [];
  
  // Vertical line
  for (let y = 3; y <= 11; y++) {
    positions.push({ x: 5, y });
  }
  
  // Top curve
  for (let x = 6; x <= 8; x++) {
    positions.push({ x, y: 3 });
  }
  positions.push({ x: 9, y: 4 });
  
  // Bottom curve
  for (let x = 6; x <= 8; x++) {
    positions.push({ x, y: 11 });
  }
  positions.push({ x: 9, y: 10 });
  
  // Right side
  for (let y = 5; y <= 9; y++) {
    positions.push({ x: 9, y });
  }
  
  return positions;
}

export function getLevelPositions(level: number, gridSize: number): Position[] {
  switch (level) {
    case 1: return getMShapedPositions(gridSize);
    case 2: return getOShapedPositions(gridSize);
    case 3: return getNShapedPositions(gridSize);
    case 4: return getAShapedPositions(gridSize);
    case 5: return getDShapedPositions(gridSize);
    default: return getMShapedPositions(gridSize);
  }
}

export function checkCollision(pos1: { x: number; y: number }, pos2: { x: number; y: number }) {
  return pos1.x === pos2.x && pos1.y === pos2.y;
}

export function savePendingTransactions(transactions: string[]) {
  localStorage.setItem('pendingTransactions', JSON.stringify(transactions));
}

export function getPendingTransactions(): string[] {
  const saved = localStorage.getItem('pendingTransactions');
  return saved ? JSON.parse(saved) : [];
}

export function saveGameState(state: GameState | null) {
  if (state === null) {
    localStorage.removeItem('gameState');
    return;
  }

  const savedState = {
    score: state.score,
    currentLevel: state.currentLevel,
    levels: state.levels,
    lampsCollected: state.lampsCollected,
    gameStarted: state.gameStarted,
    onChainScore: state.onChainScore
  };
  
  localStorage.setItem('gameState', JSON.stringify(savedState));
}

export function getGameState() {
  const saved = localStorage.getItem('gameState');
  if (!saved) return null;
  
  try {
    const state = JSON.parse(saved);
    if (state.levels) {
      state.levels = state.levels.map((level: any, index: number) => ({
        ...level,
        number: index + 1,
        completed: Boolean(level.completed)
      }));
    }
    return state;
  } catch (error) {
    console.error('Error parsing saved game state:', error);
    return null;
  }
}

export function saveLocalLeaderboard(leaderboard: Array<{ player: string; score: number }>) {
  const sortedLeaderboard = leaderboard
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  localStorage.setItem('leaderboard', JSON.stringify(sortedLeaderboard));
}

export function getLocalLeaderboard(): Array<{ player: string; score: number }> {
  try {
    const saved = localStorage.getItem('leaderboard');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading local leaderboard:', error);
    return [];
  }
}
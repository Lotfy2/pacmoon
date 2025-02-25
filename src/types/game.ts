export interface Position {
  x: number;
  y: number;
}

export interface Lamp {
  position: Position;
  collected: boolean;
  id: string;
}

export interface Enemy {
  position: Position;
  type: 'GasSpike' | 'Bottleneck';
  id: string;
  speed: number;
  direction: Position; // Added direction property
}

export interface PowerUp {
  position: Position;
  type: 'TurboNode' | 'ShardSplitter' | 'AtomicBundle';
  active: boolean;
  id: string;
}

export interface Level {
  number: number;
  requiredScore: number;
  enemyCount: number;
  enemySpeed: number;
  lampCount: number;
  powerUpCount: number;
  completed: boolean;
}

export interface GameState {
  player: Position;
  lamps: Lamp[];
  enemies: Enemy[];
  powerUps: PowerUp[];
  score: number;
  isPowerUpActive: boolean;
  gameOver: boolean;
  isWalletConnected: boolean;
  onChainScore: number;
  lampsCollected: number;
  currentLevel: number;
  levels: Level[];
  isTransactionPending: boolean;
  gameStarted: boolean;
}
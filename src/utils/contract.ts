import { ethers } from 'ethers';
import { saveLocalLeaderboard, getLocalLeaderboard } from './gameUtils';

const MONAD_TESTNET_CONFIG = {
  chainId: 10143,
  chainName: 'Monad Testnet',
  nativeCurrency: {
    name: 'MON',
    symbol: 'MON',
    decimals: 18
  },
  rpcUrls: ['https://testnet-rpc.monad.xyz'],
  blockExplorerUrls: ['https://testnet.monadexplorer.com']
};

const MONAD_TESTNET_RPC = 'https://testnet-rpc.monad.xyz';
const CONTRACT_ADDRESS = '0x1aAad12d16F414E1dd903E93301033EcB5D8C49b';
const BLOCKS_PER_QUERY = 5; // Reduced block range for more reliable queries
const MAX_BLOCKS_BACK = 50; // Reduced to minimize RPC load
const RETRY_DELAY = 1000;
const MAX_RETRIES = 3;
const CACHE_DURATION = 30000; // 30 seconds cache duration

const contractABI = [
  "function collectLamp() external",
  "function getPlayerTransactions(address player) external view returns (tuple(uint256 timestamp, uint256 score, address player)[])",
  "function getPlayerScore(address player) external view returns (uint256)",
  "function getHighScore() public view returns (uint256)",
  "event LampCollected(address indexed player, uint256 score, uint256 timestamp)",
  "event NewHighScore(address indexed player, uint256 totalScore)"
];

export class LampManContract {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private signer?: ethers.Signer;
  private address?: string;
  private playerScores: Map<string, number> = new Map();
  private lastProcessedBlock: number = 0;
  private isProcessingEvents: boolean = false;
  private lastLeaderboardUpdate: number = 0;
  private cachedLeaderboard: Array<{ player: string; score: number }> = [];
  private eventRetryQueue: Array<{ fromBlock: number; toBlock: number }> = [];
  private isProcessingRetryQueue: boolean = false;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(MONAD_TESTNET_RPC, undefined, {
      staticNetwork: true,
      batchMaxCount: 1, // Limit concurrent requests
      pollingInterval: 4000, // Increase polling interval
      maxRetries: 3
    });
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, this.provider);
    this.setupEventListeners();
    this.loadCachedLeaderboard();
    this.startRetryQueueProcessor();
  }

  private async loadCachedLeaderboard() {
    this.cachedLeaderboard = getLocalLeaderboard();
  }

  private async setupEventListeners() {
    try {
      const filter = this.contract.filters.LampCollected();
      this.contract.on(filter, (player, score) => {
        this.updatePlayerScore(player, Number(score));
      });
    } catch (error) {
      console.error('Error setting up event listeners:', error);
    }
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    retries: number = MAX_RETRIES,
    delayMs: number = RETRY_DELAY
  ): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        if (i === retries - 1) break;
        await this.delay(delayMs * Math.pow(2, i)); // Exponential backoff
      }
    }
    
    throw lastError;
  }

  private async getEventsInRange(fromBlock: number, toBlock: number) {
    const getEvents = async () => {
      try {
        const filter = this.contract.filters.LampCollected();
        const events = await this.contract.queryFilter(filter, fromBlock, toBlock);
        return events;
      } catch (error: any) {
        // If the error is due to rate limiting or block range, add to retry queue
        if (error.message?.includes('rate') || error.message?.includes('range')) {
          this.eventRetryQueue.push({ fromBlock, toBlock });
        }
        throw error;
      }
    };

    return this.retryOperation(getEvents);
  }

  private async startRetryQueueProcessor() {
    if (this.isProcessingRetryQueue) return;
    this.isProcessingRetryQueue = true;

    while (true) {
      if (this.eventRetryQueue.length === 0) {
        await this.delay(5000); // Wait before checking queue again
        continue;
      }

      const batch = this.eventRetryQueue.splice(0, 1)[0];
      try {
        await this.delay(2000); // Rate limiting delay
        const events = await this.getEventsInRange(batch.fromBlock, batch.toBlock);
        // Process events...
      } catch (error) {
        console.error('Error processing retry queue:', error);
        // Re-add to queue if temporary error
        if (this.eventRetryQueue.length < 50) { // Prevent queue from growing too large
          this.eventRetryQueue.push(batch);
        }
      }
    }
  }

  private async getAllEvents(fromBlock: number, toBlock: number) {
    if (this.isProcessingEvents) return [];
    this.isProcessingEvents = true;

    try {
      const events = [];
      for (let start = fromBlock; start <= toBlock; start += BLOCKS_PER_QUERY) {
        const end = Math.min(start + BLOCKS_PER_QUERY - 1, toBlock);
        try {
          await this.delay(200); // Increased delay between requests
          const batchEvents = await this.getEventsInRange(start, end);
          events.push(...batchEvents);
        } catch (error) {
          console.error(`Error in block range ${start}-${end}:`, error);
          // Add failed range to retry queue
          this.eventRetryQueue.push({ fromBlock: start, toBlock: end });
          continue;
        }
      }
      return events;
    } finally {
      this.isProcessingEvents = false;
    }
  }

  private async updatePlayerScore(player: string, score: number) {
    const currentScore = this.playerScores.get(player) || 0;
    const newScore = currentScore + score;
    this.playerScores.set(player, newScore);
    
    const existingEntry = this.cachedLeaderboard.find(entry => entry.player === player);
    if (existingEntry) {
      existingEntry.score = newScore;
    } else {
      this.cachedLeaderboard.push({ player, score: newScore });
    }
    
    this.cachedLeaderboard.sort((a, b) => b.score - a.score);
    saveLocalLeaderboard(this.cachedLeaderboard);
  }

  async connect() {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask to use this feature');
      return false;
    }

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== `0x${MONAD_TESTNET_CONFIG.chainId.toString(16)}`) {
        const switched = await this.switchToMonadNetwork();
        if (!switched) {
          alert('Please switch to Monad Testnet to continue');
          return false;
        }
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await provider.getSigner();
      this.address = await this.signer.getAddress();
      this.contract = this.contract.connect(this.signer);

      if (this.address) {
        const score = await this.getPlayerScore(this.address);
        this.playerScores.set(this.address, score);
      }

      return true;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return false;
    }
  }

  private async switchToMonadNetwork() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${MONAD_TESTNET_CONFIG.chainId.toString(16)}` }]
      });
      return true;
    } catch (error: any) {
      if (error.code === 4902) {
        return this.addMonadNetwork();
      }
      console.error('Error switching to Monad network:', error);
      return false;
    }
  }

  private async addMonadNetwork() {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${MONAD_TESTNET_CONFIG.chainId.toString(16)}`,
          chainName: MONAD_TESTNET_CONFIG.chainName,
          nativeCurrency: MONAD_TESTNET_CONFIG.nativeCurrency,
          rpcUrls: MONAD_TESTNET_CONFIG.rpcUrls,
          blockExplorerUrls: MONAD_TESTNET_CONFIG.blockExplorerUrls
        }]
      });
      return true;
    } catch (error) {
      console.error('Error adding Monad network:', error);
      return false;
    }
  }

  async disconnect() {
    this.signer = undefined;
    this.address = undefined;
    this.playerScores.clear();
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, this.provider);
    this.contract.removeAllListeners();
  }

  async getAddress() {
    return this.address;
  }

  async collectLamp() {
    if (!this.signer) throw new Error('Wallet not connected');
    
    try {
      const tx = await this.contract.collectLamp();
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error collecting lamp:', error);
      throw error;
    }
  }

  async getPlayerScore(address: string) {
    try {
      const score = await this.retryOperation(async () => {
        const result = await this.contract.getPlayerScore(address);
        return Number(result);
      });
      this.playerScores.set(address, score);
      return score;
    } catch (error) {
      console.error('Error getting player score:', error);
      return this.playerScores.get(address) || 0;
    }
  }

  async getHighScore() {
    try {
      const score = await this.retryOperation(async () => {
        const result = await this.contract.getHighScore();
        return Number(result);
      });
      return score;
    } catch (error) {
      console.error('Error getting high score:', error);
      return 0;
    }
  }

  async getLeaderboard() {
    try {
      // Return cached data if within cache duration
      const now = Date.now();
      if (now - this.lastLeaderboardUpdate < CACHE_DURATION) {
        return this.cachedLeaderboard;
      }

      // Get current block number with retry
      const latestBlock = await this.retryOperation(
        async () => await this.provider.getBlockNumber()
      );
      
      const fromBlock = Math.max(0, latestBlock - MAX_BLOCKS_BACK);
      const events = await this.getAllEvents(fromBlock, latestBlock);
      
      // Get unique players from events
      const players = new Set(events.map(event => event.args?.[0]));
      
      // Get scores with retry and concurrency limit
      const playerArray = Array.from(players);
      const scores = [];
      
      // Process in batches of 3 to avoid overwhelming the RPC
      for (let i = 0; i < playerArray.length; i += 3) {
        const batch = playerArray.slice(i, i + 3);
        const batchScores = await Promise.all(
          batch.map(async (player) => {
            try {
              const score = await this.getPlayerScore(player);
              return { player, score };
            } catch (error) {
              console.error(`Error getting score for player ${player}:`, error);
              return { player, score: 0 };
            }
          })
        );
        scores.push(...batchScores);
        await this.delay(100); // Rate limiting
      }

      // Update cache
      const validScores = scores
        .filter(entry => entry.score > 0)
        .sort((a, b) => b.score - a.score);
      
      this.cachedLeaderboard = validScores;
      this.lastLeaderboardUpdate = now;
      saveLocalLeaderboard(validScores);

      return validScores;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return this.cachedLeaderboard;
    }
  }
}

export const lampManContract = new LampManContract();
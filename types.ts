
export enum GameStatus {
  LOBBY = 'LOBBY',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
}

export interface GameState {
  roomId: string;
  players: Player[];
  status: GameStatus;
  currentTurnPlayerId: string | null;
  currentWord: string | null;
  timeLeft: number;
  roundNumber: number;
  language: 'ua' | 'en';
  targetScore: number;
  difficulty: Difficulty;
  useAI: boolean;
  aiWords?: string[];
}

export interface SyncMessage {
  type: 'SYNC_STATE' | 'GUESS_WORD' | 'SKIP_WORD' | 'PLAYER_JOINED' | 'START_GAME' | 'TICK';
  payload: any;
  senderId: string;
}

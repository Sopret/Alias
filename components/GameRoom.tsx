
import React from 'react';
import { GameState } from '../types';
import Leaderboard from './Leaderboard';

interface Props {
  gameState: GameState;
  myId: string;
  onCorrect: () => void;
  onSkip: () => void;
}

const GameRoom: React.FC<Props> = ({ gameState, myId, onCorrect, onSkip }) => {
  const currentTurnPlayer = gameState.players.find(p => p.id === gameState.currentTurnPlayerId);
  const isMyTurn = gameState.currentTurnPlayerId === myId;

  return (
    <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Turn Header */}
        <div className="glass p-6 rounded-3xl flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 border-2 border-indigo-500">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentTurnPlayer?.name}`} alt="avatar" />
             </div>
             <div>
               <p className="text-xs text-slate-400 uppercase tracking-widest">Зараз пояснює</p>
               <h4 className="text-xl font-bold">{currentTurnPlayer?.name} {isMyTurn && "(Ви)"}</h4>
             </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase tracking-widest">Час</p>
            <p className={`text-4xl font-black font-mono ${gameState.timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-indigo-400'}`}>
              {gameState.timeLeft}с
            </p>
          </div>
        </div>

        {/* Word Display Area */}
        <div className="aspect-video glass rounded-[40px] flex flex-col items-center justify-center p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
            <div 
              className="h-full bg-indigo-500 transition-all duration-1000" 
              style={{ width: `${(gameState.timeLeft / 60) * 100}%` }}
            ></div>
          </div>

          {isMyTurn ? (
            <div className="text-center animate-fade-in">
              <p className="text-indigo-400 font-semibold mb-2 uppercase tracking-tighter">Поясни це слово:</p>
              <h2 className="text-6xl md:text-7xl font-black mb-8 break-words leading-tight">{gameState.currentWord}</h2>
              <div className="flex gap-4 w-full max-w-sm mx-auto">
                <button 
                  onClick={onSkip}
                  className="flex-1 py-4 bg-slate-800 border border-slate-700 rounded-2xl font-bold text-slate-300 hover:bg-slate-700 transition-all active:scale-95"
                >
                  Пропустити
                </button>
                <button 
                  onClick={onCorrect}
                  className="flex-[1.5] py-4 bg-emerald-600 rounded-2xl font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition-all active:scale-95"
                >
                  Вгадали!
                </button>
              </div>
              <p className="mt-6 text-xs text-slate-500 font-medium">Не використовуй спільнокореневі слова!</p>
            </div>
          ) : (
            <div className="text-center space-y-4 animate-pulse-slow">
              <div className="w-24 h-24 mx-auto bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 mb-4">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                 </svg>
              </div>
              <p className="text-2xl font-bold text-slate-400">Слухай уважно!</p>
              <p className="text-lg text-slate-500">{currentTurnPlayer?.name} пояснює таємне слово...</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar: Leaderboard */}
      <div className="space-y-6">
        <Leaderboard players={gameState.players} currentTurnId={gameState.currentTurnPlayerId || ''} />
        
        <div className="glass p-6 rounded-3xl">
           <h5 className="font-bold text-slate-400 uppercase text-xs tracking-widest mb-4">Правила соло режиму</h5>
           <ul className="text-sm space-y-3 text-slate-300">
             <li className="flex gap-2">
               <span className="text-indigo-400 font-bold">•</span> 
               Один пояснює — всі інші вгадують
             </li>
             <li className="flex gap-2">
               <span className="text-indigo-400 font-bold">•</span> 
               Хто вгадав, отримує +1 бал
             </li>
             <li className="flex gap-2">
               <span className="text-indigo-400 font-bold">•</span> 
               Той, хто пояснює, теж отримує +1 за вгадане слово
             </li>
             <li className="flex gap-2">
               <span className="text-indigo-400 font-bold">•</span> 
               Кожен грає сам за себе
             </li>
           </ul>
        </div>
      </div>
    </div>
  );
};

export default GameRoom;

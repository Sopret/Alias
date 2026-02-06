
import React from 'react';
import { GameState, Difficulty } from '../types';
import { DIFFICULTY_LABELS } from '../constants';

interface Props {
  gameState: GameState;
  myId: string;
  onStart: () => void;
}

const Lobby: React.FC<Props> = ({ gameState, myId, onStart }) => {
  const isHost = gameState.players.find(p => p.id === myId)?.isHost;

  return (
    <div className="max-w-xl w-full flex flex-col items-center mt-6">
      {/* Game Settings Banner */}
      <div className="w-full flex gap-4 mb-6">
        <div className="glass flex-1 p-4 rounded-2xl text-center border-b-4 border-b-indigo-500">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Ціль балів</p>
          <p className="text-xl font-black text-white">{gameState.targetScore}</p>
        </div>
        <div className="glass flex-1 p-4 rounded-2xl text-center border-b-4 border-b-amber-500">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Складність</p>
          <p className="text-xl font-black text-white">{DIFFICULTY_LABELS[gameState.difficulty]}</p>
        </div>
        <div className="glass flex-1 p-4 rounded-2xl text-center border-b-4 border-b-emerald-500">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Мова</p>
          <p className="text-xl font-black text-white">{gameState.language.toUpperCase()}</p>
        </div>
      </div>

      <div className="glass w-full p-6 rounded-3xl mb-6 flex justify-between items-center">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Код кімнати</p>
          <p className="text-3xl font-mono font-black text-indigo-400">{gameState.roomId}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Гравців</p>
          <p className="text-3xl font-black">{gameState.players.length}<span className="text-slate-600">/20</span></p>
        </div>
      </div>

      <div className="w-full space-y-3 mb-8">
        <h3 className="text-lg font-bold ml-2 text-slate-300">Список гравців</h3>
        {gameState.players.map((p) => (
          <div key={p.id} className="glass p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-white/10">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} alt="avatar" />
              </div>
              <div>
                <span className="font-bold">{p.name} {p.id === myId && "(Ти)"}</span>
                {p.isHost && <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full font-black">HOST</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isHost ? (
        <button 
          onClick={onStart}
          disabled={gameState.players.length < 1}
          className="w-full py-5 bg-indigo-600 disabled:opacity-50 rounded-2xl font-bold text-white hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/40"
        >
          Почати Гру
        </button>
      ) : (
        <div className="glass p-6 rounded-3xl text-center w-full">
          <p className="font-bold text-slate-400">Чекаємо на запуск гри хостом...</p>
        </div>
      )}
    </div>
  );
};

export default Lobby;


import React from 'react';
import { Player } from '../types';

interface Props {
  players: Player[];
  currentTurnId: string;
}

const Leaderboard: React.FC<Props> = ({ players, currentTurnId }) => {
  return (
    <div className="glass rounded-3xl overflow-hidden shadow-xl">
      <div className="bg-white/5 p-5 border-b border-white/5">
        <h4 className="font-bold text-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-amber-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0V9.403c0-1.154-.614-2.217-1.613-2.798L12 6.037 10.113 6.605c-.999.581-1.613 1.644-1.613 2.798v5.972m5.007 0h-5.007" />
          </svg>
          Топ Гравців
        </h4>
      </div>
      <div className="p-4 space-y-2">
        {players
          .sort((a, b) => b.score - a.score)
          .map((p, i) => (
            <div 
              key={p.id} 
              className={`flex items-center justify-between p-3 rounded-xl transition-all ${p.id === currentTurnId ? 'bg-indigo-600/20 ring-1 ring-indigo-500/50' : 'bg-white/5'}`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 text-center font-bold text-sm ${i === 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                  {i + 1}
                </span>
                <span className="font-semibold text-slate-200">{p.name}</span>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-xs text-slate-500 uppercase font-bold">Бали:</span>
                 <span className="text-lg font-black text-indigo-400">{p.score}</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Leaderboard;

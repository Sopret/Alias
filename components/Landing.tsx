
import React, { useState } from 'react';
import { Difficulty, GameStatus } from '../types';
import { SCORE_OPTIONS, DIFFICULTY_LABELS } from '../constants';

interface Props {
  onCreate: (name: string, lang: 'ua' | 'en', score: number, diff: Difficulty) => void;
  onJoin: (name: string, code: string) => void;
}

const Landing: React.FC<Props> = ({ onCreate, onJoin }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'main' | 'create' | 'join'>('main');
  const [lang, setLang] = useState<'ua' | 'en'>('ua');
  const [targetScore, setTargetScore] = useState(25);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const handleAction = () => {
    if (!name.trim()) return;
    if (mode === 'create') onCreate(name, lang, targetScore, difficulty);
    if (mode === 'join') onJoin(name, code);
  };

  return (
    <div className="glass max-w-md w-full p-8 rounded-3xl mt-12 shadow-2xl">
      {mode === 'main' ? (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Alias Solo</h2>
            <p className="text-slate-400">Гра без команд — кожен за себе!</p>
          </div>
          <button 
            onClick={() => setMode('create')}
            className="w-full py-5 bg-indigo-600 rounded-2xl font-bold text-white hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20"
          >
            Створити Кімнату
          </button>
          <button 
            onClick={() => setMode('join')}
            className="w-full py-5 glass rounded-2xl font-bold text-white hover:bg-white/10 transition-all"
          >
            Приєднатися
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <button onClick={() => setMode('main')} className="text-indigo-400 font-semibold flex items-center gap-1">
             ← Назад
          </button>
          <h2 className="text-2xl font-bold">{mode === 'create' ? 'Налаштування гри' : 'Вхід у Гру'}</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Твоє ім'я</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Введіть ім'я..."
                className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            {mode === 'create' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">Мова</label>
                    <div className="flex bg-slate-800 p-1 rounded-xl">
                      {(['ua', 'en'] as const).map(l => (
                        <button
                          key={l}
                          onClick={() => setLang(l)}
                          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${lang === l ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                        >
                          {l.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">Бали для перемоги</label>
                    <input 
                      type="number"
                      min="1"
                      max="999"
                      value={targetScore}
                      onChange={(e) => setTargetScore(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-white font-bold h-[40px] focus:outline-none focus:ring-1 ring-indigo-500 text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Рівень складності</label>
                  <div className="flex bg-slate-800 p-1 rounded-xl gap-1">
                    {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${difficulty === d ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                      >
                        {DIFFICULTY_LABELS[d]}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {mode === 'join' && (
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Код кімнати</label>
                <input 
                  type="text" 
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="КОД"
                  className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono tracking-widest"
                />
              </div>
            )}
          </div>

          <button 
            disabled={!name || (mode === 'join' && !code)}
            onClick={handleAction}
            className="w-full py-5 bg-indigo-600 disabled:opacity-50 rounded-2xl font-bold text-white hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20"
          >
            {mode === 'create' ? 'Створити' : 'Увійти'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Landing;

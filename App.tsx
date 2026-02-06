
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStatus, Player, GameState, Difficulty } from './types';
import { WORDS_UA, WORDS_EN, ROUND_DURATION, DIFFICULTY_LABELS } from './constants';
import { supabase } from './supabase';
import { GoogleGenAI } from "@google/genai";

// --- Sub-components for UI ---

const Header = () => (
  <div className="w-full max-w-4xl flex justify-between items-center py-6">
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/30 text-xl">A</div>
      <h1 className="text-2xl font-black tracking-tighter">ALIAS <span className="gradient-text uppercase">Solo</span></h1>
    </div>
    <div className="flex flex-col items-end">
      <span className="px-3 py-1 glass rounded-full text-[10px] font-black text-emerald-400 uppercase tracking-widest border border-emerald-500/20 shadow-lg shadow-emerald-500/10">Online Multiplayer</span>
    </div>
  </div>
);

const Leaderboard = ({ players, currentTurnId }: { players: Player[], currentTurnId: string }) => (
  <div className="glass rounded-[32px] overflow-hidden shadow-2xl border border-white/5 animate-fade-in">
    <div className="bg-white/5 p-5 border-b border-white/5">
      <h4 className="font-black text-xs text-slate-400 uppercase tracking-[0.2em]">Турнірна таблиця</h4>
    </div>
    <div className="p-4 space-y-2">
      {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
        <div key={p.id} className={`flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 ${p.id === currentTurnId ? 'bg-indigo-600/30 ring-2 ring-indigo-500/50 scale-[1.02]' : 'bg-white/5 hover:bg-white/10'}`}>
          <div className="flex items-center gap-3">
            <span className={`w-5 text-center font-black text-sm ${i === 0 ? 'text-amber-400' : 'text-slate-500'}`}>{i + 1}</span>
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} className="w-8 h-8 rounded-full bg-slate-800" alt="av" />
            <span className="font-bold text-slate-200">{p.name}</span>
          </div>
          <span className="text-xl font-black text-indigo-400">{p.score}</span>
        </div>
      ))}
    </div>
  </div>
);

// --- Main App ---

const App: React.FC = () => {
  const [myId] = useState(() => Math.random().toString(36).substr(2, 9));
  const [isJoined, setIsJoined] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const initialGameState: GameState = {
    roomId: '',
    players: [],
    status: GameStatus.LOBBY,
    currentTurnPlayerId: null,
    currentWord: null,
    timeLeft: ROUND_DURATION,
    roundNumber: 0,
    language: 'ua',
    targetScore: 25,
    difficulty: 'medium',
    useAI: false,
    aiWords: []
  };

  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const channelRef = useRef<any>(null);

  const sendMessage = useCallback((event: string, payload: any) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: event,
        payload: { ...payload, senderId: myId }
      });
    }
  }, [myId]);

  const fetchAIWords = async (lang: string, diff: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Generate a list of 50 common nouns or objects for a game of Alias in ${lang === 'ua' ? 'Ukrainian' : 'English'}. Difficulty level: ${diff}. Format the output as a simple comma-separated list. No preamble, just words.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      
      const words = response.text?.split(',').map(w => w.trim().replace(/[".]/g, '')) || [];
      return words.filter(w => w.length > 1);
    } catch (e) {
      console.error("AI Generation failed, using fallback lists", e);
      return [];
    }
  };

  const getRandomWord = useCallback((state: GameState) => {
    const { language, difficulty, useAI, aiWords } = state;
    if (useAI && aiWords && aiWords.length > 0) {
      const word = aiWords[Math.floor(Math.random() * aiWords.length)];
      return word;
    }
    const list = language === 'ua' ? WORDS_UA[difficulty] : WORDS_EN[difficulty];
    return list[Math.floor(Math.random() * list.length)];
  }, []);

  const resetApp = () => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    setIsJoined(false);
    setGameState(initialGameState);
  };

  useEffect(() => {
    if (!gameState.roomId || !isJoined) return;

    const channel = supabase.channel(`room:${gameState.roomId}`, {
      config: { broadcast: { self: false }, presence: { key: myId } }
    });

    channel
      .on('broadcast', { event: 'SYNC_STATE' }, ({ payload }) => setGameState(payload))
      .on('broadcast', { event: 'START_GAME' }, ({ payload }) => {
        setGameState(prev => ({
          ...prev,
          status: GameStatus.PLAYING,
          currentTurnPlayerId: payload.currentTurnPlayerId,
          currentWord: payload.firstWord,
          aiWords: payload.aiWords || prev.aiWords,
          timeLeft: ROUND_DURATION
        }));
      })
      .on('broadcast', { event: 'GUESS_WORD' }, ({ payload }) => {
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(p => p.id === payload.playerId ? { ...p, score: p.score + 1 } : p),
          currentWord: payload.nextWord
        }));
      })
      .on('broadcast', { event: 'SKIP_WORD' }, ({ payload }) => {
        setGameState(prev => ({ ...prev, currentWord: payload.nextWord }));
      })
      .on('broadcast', { event: 'TICK' }, ({ payload }) => {
        setGameState(prev => ({ ...prev, timeLeft: payload }));
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlinePlayers = Object.values(state).flat().map((p: any) => ({
          id: p.id,
          name: p.name,
          score: 0,
          isHost: p.id === gameState.players.find(pl => pl.isHost)?.id
        }));

        setGameState(prev => {
          const merged = onlinePlayers.map(op => {
             const existing = prev.players.find(ep => ep.id === op.id);
             return { ...op, score: existing ? existing.score : 0, isHost: existing ? existing.isHost : op.isHost };
          });
          const me = merged.find(p => p.id === myId);
          if (me?.isHost) {
             sendMessage('SYNC_STATE', { ...prev, players: merged });
          }
          return { ...prev, players: merged };
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const myName = gameState.players.find(p => p.id === myId)?.name || 'Анонім';
          await channel.track({ id: myId, name: myName });
        }
      });

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [gameState.roomId, isJoined, myId]);

  const handleCreate = (name: string, lang: 'ua' | 'en', score: number, diff: Difficulty, useAI: boolean) => {
    const roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
    const newPlayer: Player = { id: myId, name, score: 0, isHost: true };
    setGameState(prev => ({ ...prev, roomId, language: lang, targetScore: score, difficulty: diff, useAI, players: [newPlayer] }));
    setIsJoined(true);
  };

  const handleJoin = (name: string, code: string) => {
    const newPlayer: Player = { id: myId, name, score: 0, isHost: false };
    setGameState(prev => ({ ...prev, roomId: code, players: [...prev.players, newPlayer] }));
    setIsJoined(true);
  };

  const handleStartGame = async () => {
    setIsAiLoading(true);
    let wordsFromAI: string[] = [];
    if (gameState.useAI) {
      wordsFromAI = await fetchAIWords(gameState.language, gameState.difficulty);
    }
    
    const tempState = { ...gameState, aiWords: wordsFromAI.length > 0 ? wordsFromAI : gameState.aiWords };
    const firstWord = getRandomWord(tempState);
    const payload = { 
      currentTurnPlayerId: gameState.players[0].id, 
      firstWord,
      aiWords: wordsFromAI.length > 0 ? wordsFromAI : undefined
    };
    
    setGameState(prev => ({ ...prev, status: GameStatus.PLAYING, ...payload, aiWords: wordsFromAI.length > 0 ? wordsFromAI : prev.aiWords }));
    sendMessage('START_GAME', payload);
    setIsAiLoading(false);
  };

  const handleCorrect = () => {
    const nextWord = getRandomWord(gameState);
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p => p.id === myId ? { ...p, score: p.score + 1 } : p),
      currentWord: nextWord
    }));
    sendMessage('GUESS_WORD', { playerId: myId, nextWord });
  };

  const handleSkip = () => {
    const nextWord = getRandomWord(gameState);
    setGameState(prev => ({ ...prev, currentWord: nextWord }));
    sendMessage('SKIP_WORD', { nextWord });
  };

  useEffect(() => {
    let timer: any;
    const me = gameState.players.find(p => p.id === myId);
    if (gameState.status === GameStatus.PLAYING && me?.isHost) {
      timer = setInterval(() => {
        setGameState(prev => {
          if (prev.timeLeft <= 0) {
            const winner = prev.players.find(p => p.score >= prev.targetScore);
            if (winner) {
              const newState = { ...prev, status: GameStatus.GAME_OVER };
              sendMessage('SYNC_STATE', newState);
              return newState;
            }
            const currentIndex = prev.players.findIndex(p => p.id === prev.currentTurnPlayerId);
            const nextIndex = (currentIndex + 1) % prev.players.length;
            const newState = {
              ...prev,
              timeLeft: ROUND_DURATION,
              currentTurnPlayerId: prev.players[nextIndex].id,
              currentWord: getRandomWord(prev)
            };
            sendMessage('SYNC_STATE', newState);
            return newState;
          }
          const nextTime = prev.timeLeft - 1;
          sendMessage('TICK', nextTime);
          return { ...prev, timeLeft: nextTime };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState.status, gameState.players, myId, sendMessage, getRandomWord]);

  return (
    <div className="min-h-screen flex flex-col items-center p-4">
      <Header />
      
      {!isJoined ? (
        <LandingView onCreate={handleCreate} onJoin={handleJoin} />
      ) : gameState.status === GameStatus.LOBBY ? (
        <LobbyView gameState={gameState} myId={myId} onStart={handleStartGame} isLoading={isAiLoading} />
      ) : gameState.status === GameStatus.PLAYING ? (
        <GameRoomView gameState={gameState} myId={myId} onCorrect={handleCorrect} onSkip={handleSkip} />
      ) : (
        <GameOverView gameState={gameState} onReset={resetApp} />
      )}
    </div>
  );
};

// --- View Implementation ---

const LandingView = ({ onCreate, onJoin }: any) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [score, setScore] = useState(25);
  const [lang, setLang] = useState<'ua' | 'en'>('ua');
  const [diff, setDiff] = useState<Difficulty>('medium');
  const [useAI, setUseAI] = useState(false);

  if (mode === 'menu') return (
    <div className="glass max-w-sm w-full p-10 rounded-[45px] mt-20 text-center space-y-10 shadow-2xl animate-fade-in">
      <div className="space-y-4">
        <h2 className="text-4xl font-black tracking-tight">ONLINE!</h2>
        <p className="text-slate-400 font-medium text-sm leading-relaxed">Це повноцінний Alias Royale. Створюйте кімнату, кидайте код друзям та грайте разом!</p>
      </div>
      <div className="space-y-4">
        <button onClick={() => setMode('create')} className="w-full py-5 bg-indigo-600 rounded-3xl font-black text-lg shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all">Створити гру</button>
        <button onClick={() => setMode('join')} className="w-full py-5 glass rounded-3xl font-black text-lg hover:bg-white/10 active:scale-95 transition-all">Увійти за кодом</button>
      </div>
    </div>
  );

  return (
    <div className="glass max-w-md w-full p-8 rounded-[40px] mt-10 space-y-8 shadow-2xl animate-fade-in border-white/5">
      <button onClick={() => setMode('menu')} className="text-indigo-400 font-black flex items-center gap-1 transition-colors hover:text-indigo-300">← Назад</button>
      <h2 className="text-3xl font-black tracking-tight">{mode === 'create' ? 'Нова кімната' : 'Вхід у гру'}</h2>
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] text-slate-500 uppercase font-black ml-2 tracking-widest">Твоє ім'я</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Введіть ім'я..." className="w-full bg-slate-800 p-4 rounded-2xl focus:ring-2 ring-indigo-500 outline-none font-bold transition-all border border-white/5" />
        </div>
        {mode === 'create' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 uppercase font-black ml-2 tracking-widest">Ціль балів</label>
                <input type="number" value={score} onChange={e => setScore(parseInt(e.target.value) || 25)} className="w-full bg-slate-800 p-4 rounded-2xl outline-none text-center font-black text-indigo-400 border border-white/5" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 uppercase font-black ml-2 tracking-widest">Складність</label>
                <select value={diff} onChange={e => setDiff(e.target.value as Difficulty)} className="w-full bg-slate-800 p-4 rounded-2xl outline-none font-bold h-[62px] appearance-none cursor-pointer border border-white/5">
                  {Object.keys(DIFFICULTY_LABELS).map(k => <option key={k} value={k}>{DIFFICULTY_LABELS[k as Difficulty]}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 glass rounded-2xl border border-white/5">
               <div className="flex items-center gap-3">
                 <span className="text-xl">✨</span>
                 <div>
                   <p className="font-bold text-sm text-slate-200">AI-генерація слів</p>
                   <p className="text-[10px] text-slate-500 font-medium">Нескінченні нові слова через Gemini</p>
                 </div>
               </div>
               <button 
                 onClick={() => setUseAI(!useAI)}
                 className={`w-12 h-6 rounded-full transition-all relative ${useAI ? 'bg-indigo-600' : 'bg-slate-700'}`}
               >
                 <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${useAI ? 'left-7' : 'left-1'}`}></div>
               </button>
            </div>
          </div>
        )}
        {mode === 'join' && (
          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 uppercase font-black ml-2 tracking-widest">Код кімнати</label>
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="XXXXXX" className="w-full bg-slate-800 p-4 rounded-2xl uppercase font-mono text-center tracking-[0.4em] text-2xl font-black text-indigo-400 outline-none focus:ring-2 ring-indigo-500 transition-all border border-white/5" />
          </div>
        )}
      </div>
      <button disabled={!name.trim() || (mode === 'join' && !code.trim())} onClick={() => mode === 'create' ? onCreate(name, lang, score, diff, useAI) : onJoin(name, code)} className="w-full py-5 bg-indigo-600 disabled:opacity-50 rounded-3xl font-black text-lg shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 active:scale-95 transition-all">ГОТОВО</button>
    </div>
  );
};

const LobbyView = ({ gameState, myId, onStart, isLoading }: any) => {
  const isHost = gameState.players.find((p:any) => p.id === myId)?.isHost;
  return (
    <div className="max-w-xl w-full mt-10 space-y-8 animate-fade-in">
      <div className="glass p-10 rounded-[45px] flex justify-between items-center border-b-8 border-indigo-600 shadow-2xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Код кімнати</p>
          <p className="text-5xl font-black text-indigo-400 font-mono tracking-tight">{gameState.roomId}</p>
        </div>
        <div className="text-right space-y-1 relative z-10">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Мета</p>
          <p className="text-4xl font-black text-white">{gameState.targetScore} <span className="text-sm text-indigo-400">б.</span></p>
        </div>
        {gameState.useAI && <div className="absolute top-2 right-2 px-2 py-0.5 bg-indigo-500/20 rounded-full border border-indigo-500/30 text-[8px] font-black text-indigo-400 uppercase tracking-widest">✨ AI Mode On</div>}
      </div>
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest ml-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
          Гравці в мережі ({gameState.players.length})
        </h3>
        <div className="space-y-2">
          {gameState.players.map((p: any) => (
            <div key={p.id} className="glass p-5 rounded-3xl flex items-center justify-between border border-white/5 hover:border-indigo-500/30 transition-all group">
              <div className="flex items-center gap-4">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-slate-700 group-hover:border-indigo-500 transition-colors" alt="av" />
                <p className="font-black text-slate-200 text-lg">{p.name} {p.id === myId && <span className="text-indigo-400 text-xs">(Ви)</span>}</p>
              </div>
              {p.isHost && <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full font-black uppercase tracking-widest">Власник</span>}
            </div>
          ))}
        </div>
      </div>
      {isHost ? (
        <button 
          disabled={isLoading}
          onClick={onStart} 
          className="w-full py-6 bg-indigo-600 disabled:opacity-50 rounded-[35px] font-black text-2xl shadow-2xl shadow-indigo-600/40 hover:bg-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <>
              <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
              ГЕНЕРУЄМО СЛОВА...
            </>
          ) : 'ПОЧАТИ ГРУ'}
        </button>
      ) : (
        <div className="glass p-8 rounded-[35px] text-center"><p className="text-slate-400 font-bold animate-pulse text-lg tracking-tight">Чекаємо запуск власником...</p></div>
      )}
    </div>
  );
};

const GameRoomView = ({ gameState, myId, onCorrect, onSkip }: any) => {
  const isMyTurn = gameState.currentTurnPlayerId === myId;
  const currentP = gameState.players.find((p:any) => p.id === gameState.currentTurnPlayerId);

  return (
    <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10 px-2 lg:px-0 animate-fade-in">
      <div className="lg:col-span-2 space-y-6">
        <div className="glass p-7 rounded-[35px] flex justify-between items-center shadow-xl border-white/5">
          <div className="flex items-center gap-4">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentP?.name}`} className="w-14 h-14 rounded-2xl border-2 border-indigo-500 bg-slate-800 shadow-lg" alt="av" />
            <div>
               <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Пояснює</p>
               <p className="font-black text-2xl text-white tracking-tight leading-none">{currentP?.name} {isMyTurn && <span className="text-indigo-400 text-sm">(Ви)</span>}</p>
            </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Час</p>
             <p className={`text-5xl font-black font-mono leading-none ${gameState.timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-indigo-400'}`}>{gameState.timeLeft}с</p>
          </div>
        </div>
        <div className="aspect-video glass rounded-[55px] flex flex-col items-center justify-center p-10 relative overflow-hidden shadow-2xl border-2 border-white/5">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5">
             <div className={`h-full transition-all duration-1000 ${gameState.timeLeft < 10 ? 'bg-rose-500 shadow-[0_0_15px_#f43f5e]' : 'bg-indigo-500 shadow-[0_0_15px_#6366f1]'}`} style={{ width: `${(gameState.timeLeft / 60) * 100}%` }}></div>
          </div>
          {isMyTurn ? (
            <div className="text-center space-y-14 w-full animate-fade-in">
              <div className="space-y-3">
                <p className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-2">
                  {gameState.useAI && <span className="text-xs">✨ AI Word:</span>}
                  Твоє слово:
                </p>
                <h2 className="text-6xl md:text-8xl font-black leading-none text-white uppercase drop-shadow-2xl tracking-tighter break-words">{gameState.currentWord}</h2>
              </div>
              <div className="flex gap-5 max-w-sm mx-auto w-full">
                <button onClick={onSkip} className="flex-1 py-5 bg-slate-800 rounded-[28px] font-black text-slate-400 hover:bg-slate-700 transition-all border border-white/5 active:scale-95 uppercase tracking-widest text-xs">Пропуск</button>
                <button onClick={onCorrect} className="flex-[1.8] py-5 bg-emerald-600 rounded-[28px] font-black text-white shadow-2xl shadow-emerald-600/30 hover:bg-emerald-500 transition-all uppercase tracking-widest">Вгадано!</button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-8 animate-fade-in">
              <div className="w-28 h-28 mx-auto bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-14 h-14 animate-bounce"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" /></svg>
              </div>
              <p className="text-3xl font-black text-slate-200 tracking-tight uppercase">СЛУХАЙТЕ {currentP?.name?.toUpperCase()}!</p>
              <p className="text-slate-500 font-bold text-xs tracking-[0.3em] uppercase">Коли вгадаєте — натисніть в себе на екрані "Вгадано"</p>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-8">
        <Leaderboard players={gameState.players} currentTurnId={gameState.currentTurnPlayerId || ''} />
      </div>
    </div>
  );
};

const GameOverView = ({ gameState, onReset }: any) => (
  <div className="glass max-w-md w-full p-10 rounded-[50px] text-center mt-12 shadow-2xl border-white/5 animate-fade-in relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,#6366f111_0%,transparent_70%)] pointer-events-none"></div>
    <h2 className="text-5xl font-black mb-2 gradient-text tracking-tighter">ФІНІШ!</h2>
    <p className="text-slate-400 mb-10 font-bold uppercase text-[10px] tracking-widest">Мета досягнута</p>
    <div className="space-y-4 mb-12">
      {gameState.players.sort((a:any, b:any) => b.score - a.score).map((p: any, i: number) => (
        <div key={p.id} className={`flex justify-between p-5 rounded-3xl items-center border-white/5 transition-all ${i === 0 ? 'bg-indigo-600/30 ring-4 ring-indigo-500/40 scale-105 shadow-2xl' : 'bg-white/5 opacity-80'}`}>
          <div className="flex items-center gap-4">
             <span className={`text-2xl font-black ${i === 0 ? 'text-amber-400 drop-shadow-lg' : 'text-slate-600'}`}>#{i+1}</span>
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} className="w-10 h-10 rounded-lg bg-slate-900" alt="av" />
             <span className="font-black text-xl text-slate-100">{p.name}</span>
          </div>
          <span className="text-3xl font-black text-indigo-400">{p.score}</span>
        </div>
      ))}
    </div>
    <button onClick={onReset} className="w-full py-6 bg-indigo-600 rounded-[35px] font-black text-xl shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 active:scale-95 transition-all uppercase tracking-widest">Грати знову</button>
  </div>
);

export default App;


import React from 'react';

const Header: React.FC = () => {
  return (
    <div className="w-full max-w-4xl flex justify-between items-center py-6">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/30">
          A
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          ALIAS <span className="gradient-text">SOLO</span>
        </h1>
      </div>
      <div className="px-4 py-1.5 glass rounded-full text-sm font-semibold text-slate-400">
        v1.0 Demo
      </div>
    </div>
  );
};

export default Header;

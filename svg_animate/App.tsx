import React from 'react';
import AskAiAnimation from './components/AskAiAnimation';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8 text-slate-900">
      <div className="max-w-4xl w-full">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 tracking-tight">
            学术助手 <span className="text-violet-600">AI</span>
          </h1>
          <p className="text-slate-500 text-lg">
            全能学术伙伴：支持<span className="font-semibold text-violet-600">润色、语气调整与多语言翻译</span>。
          </p>
        </header>
        
        <main className="w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden relative">
          {/* subtle gradient glow behind the component */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-200/40 blur-[100px] rounded-full pointer-events-none"></div>
          
          <AskAiAnimation />
        </main>
        
        <footer className="mt-8 text-center text-slate-400 text-sm">
          演示：自动展示从选词到翻译的完整流程
        </footer>
      </div>
    </div>
  );
};

export default App;
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, GraduationCap, Scroll, Sparkles } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { AcademicSnake } from './components/AcademicSnake';
import { Lantern } from './components/Lantern';
import { generateAcademicFortune } from './services/gemini';

const App: React.FC = () => {
  const [stage, setStage] = useState<'intro' | 'active' | 'fortune'>('intro');
  const [fortune, setFortune] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFortuneModal, setShowFortuneModal] = useState(false);

  // Auto-start animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setStage('active');
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSnakeClick = async () => {
    if (loading) return;
    setLoading(true);
    setStage('fortune');
    setShowFortuneModal(true);

    // Generate fortune (now local)
    const result = await generateAcademicFortune();
    setFortune(result);
    setLoading(false);
  };

  const closeModal = () => {
    setShowFortuneModal(false);
    setStage('active'); // Return to active idle state
  };

  return (
    <div className="min-h-screen w-full bg-paper-cream relative overflow-hidden text-ink-black font-serif ink-texture">
      {/* Background Decorative Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vh] h-[50vh] rounded-full bg-red-50 opacity-50 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vh] h-[60vh] rounded-full bg-yellow-50 opacity-50 blur-3xl" />

      {/* Hanging Lanterns */}
      <AnimatePresence>
        {stage !== 'intro' && (
          <>
            <Lantern x={10} delay={0.5} text="蛇" />
            <Lantern x={25} delay={0.6} text="年" />
            <Lantern x={70} delay={0.7} text="纳" />
            <Lantern x={85} delay={0.8} text="福" />
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="relative z-10 container mx-auto px-4 h-screen flex flex-col items-center justify-center">

        {/* Header Text */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="text-center mb-4"
        >
          <div className="flex items-center justify-center gap-2 text-academic-red text-sm font-bold tracking-[0.3em] uppercase mb-2">
            <GraduationCap size={16} />
            <span>学术论坛 · 新春特辑</span>
            <GraduationCap size={16} />
          </div>
          <h1 className="text-5xl md:text-7xl font-display text-ink-black mb-2">
            乙巳蛇年
          </h1>
          <p className="text-xl md:text-2xl text-academic-red/80 italic font-serif">
            智慧 · 蜕变 · 真理
          </p>
        </motion.div>

        {/* Interactive SVG Stage */}
        <div className="relative w-full max-w-lg aspect-[4/5] md:aspect-square flex items-center justify-center">
          {/* Tooltip hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: stage === 'active' ? 1 : 0 }}
            className="absolute top-10 right-0 md:right-[-20px] bg-white/80 backdrop-blur px-3 py-1 rounded-full shadow-sm text-xs text-gray-500 border border-gray-100"
          >
            点击灵蛇 祈愿学术亨通
          </motion.div>

          <AcademicSnake isActive={stage !== 'intro'} onClick={handleSnakeClick} />

          {/* Interactive Button */}
          <motion.button
            onClick={handleSnakeClick}
            className="absolute bottom-0 bg-gradient-to-r from-academic-red to-red-800 text-white px-8 py-3 rounded-full shadow-lg flex items-center gap-2 hover:shadow-xl transition-shadow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2 }}
          >
            <Sparkles size={18} className="text-academic-gold" />
            <span className="font-display">开启学术运势</span>
          </motion.button>
        </div>
      </main>

      {/* Fortune Modal Overlay */}
      <AnimatePresence>
        {showFortuneModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="bg-paper-cream w-full max-w-md p-8 rounded-xl shadow-2xl border-2 border-academic-gold relative overflow-hidden"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative Scroll Background */}
              <div className="absolute inset-0 opacity-5 pointer-events-none">
                <Scroll size={400} strokeWidth={0.5} className="absolute -right-20 -bottom-20 rotate-[-15deg]" />
              </div>

              <div className="relative z-10 text-center">
                <div className="w-12 h-12 bg-academic-red rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <BookOpen className="text-academic-gold" size={24} />
                </div>

                <h3 className="text-2xl font-display text-academic-red mb-6 border-b border-academic-gold/30 pb-4">
                  灵蛇献瑞 · 学术签运
                </h3>

                {loading ? (
                  <div className="py-8 flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-academic-red border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 text-sm animate-pulse">正在查阅学术古籍...</p>
                  </div>
                ) : (
                  <div className="py-2">
                    <p className="text-xl md:text-2xl leading-relaxed font-serif text-ink-black mb-8">
                      “{fortune}”
                    </p>
                    <button
                      onClick={closeModal}
                      className="text-sm uppercase tracking-widest text-gray-500 hover:text-academic-red transition-colors"
                    >
                      收下祝福 继续科研
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="absolute bottom-4 w-full text-center text-xs text-gray-400 font-serif opacity-60">
        © 2026 学术论坛
      </footer>
    </div>
  );
};

export default App;
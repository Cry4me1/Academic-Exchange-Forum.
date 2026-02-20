"use client";

import { AcademicHorse } from '@/components/cny/AcademicHorse';
import { ACADEMIC_GREETINGS_CN } from '@/components/cny/constants';
import { Lantern } from '@/components/cny/Lantern';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, BookOpen, GraduationCap, Scroll, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CNYGreetingPage() {
    const router = useRouter();
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

    const generateAcademicFortune = async (): Promise<string> => {
        // 模拟一个简短的“查阅”延迟，增加仪式感
        return new Promise((resolve) => {
            setTimeout(() => {
                const randomIndex = Math.floor(Math.random() * ACADEMIC_GREETINGS_CN.length);
                resolve(ACADEMIC_GREETINGS_CN[randomIndex]);
            }, 800); // 0.8秒延迟
        });
    };

    const handleSnakeClick = async () => {
        if (loading) return;
        setLoading(true);
        setStage('fortune');
        setShowFortuneModal(true);

        // Generate fortune
        const result = await generateAcademicFortune();
        setFortune(result);
        setLoading(false);
    };

    const closeModal = () => {
        setShowFortuneModal(false);
        setStage('active'); // Return to active idle state
    };

    return (
        <div className="min-h-screen w-full bg-[#fdfbf7] relative overflow-hidden text-[#1a1a1a] font-serif">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none" />

            {/* Back Button */}
            <div className="absolute top-6 left-6 z-20">
                <Button
                    variant="ghost"
                    onClick={() => router.push('/dashboard')}
                    className="group flex items-center gap-2 text-red-900 hover:text-red-700 hover:bg-red-50"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    返回 Dashboard
                </Button>
            </div>

            {/* Background Decorative Circles */}
            <div className="absolute top-[-10%] left-[-10%] w-[50vh] h-[50vh] rounded-full bg-red-50 opacity-50 blur-3xl" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60vh] h-[60vh] rounded-full bg-yellow-50 opacity-50 blur-3xl" />

            {/* Hanging Lanterns */}
            <AnimatePresence>
                {stage !== 'intro' && (
                    <>
                        <Lantern x={10} delay={0.5} text="马" />
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
                    <div className="flex items-center justify-center gap-2 text-red-800 text-sm font-bold tracking-[0.3em] uppercase mb-2">
                        <GraduationCap size={16} />
                        <span>Scholarly · 新春特辑</span>
                        <GraduationCap size={16} />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold text-[#1a1a1a] mb-2 tracking-tight">
                        丙午马年
                    </h1>
                    <p className="text-xl md:text-2xl text-red-800/80 italic font-serif">
                        龙马精神 · 学术腾飞
                    </p>
                </motion.div>

                {/* Interactive SVG Stage */}
                <div className="relative w-full max-w-lg aspect-[4/5] md:aspect-square flex items-center justify-center">
                    {/* Tooltip hint */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: stage === 'active' ? 1 : 0 }}
                        className="absolute top-10 right-0 md:right-[-20px] bg-white/80 backdrop-blur px-3 py-1 rounded-full shadow-sm text-xs text-gray-500 border border-gray-100 hidden md:block z-30"
                    >
                        点击骏马 祈愿学术亨通
                    </motion.div>

                    <AcademicHorse isActive={stage !== 'active' ? false : true} onClick={handleSnakeClick} />

                    {/* Interactive Button */}
                    <motion.button
                        onClick={handleSnakeClick}
                        className="absolute bottom-0 bg-gradient-to-r from-red-700 to-red-900 text-white px-8 py-3 rounded-full shadow-lg flex items-center gap-2 hover:shadow-xl transition-shadow z-20"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2 }}
                    >
                        <Sparkles size={18} className="text-yellow-400" />
                        <span className="font-bold tracking-wider">开启学术运势</span>
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
                            className="bg-[#fdfbf7] w-full max-w-md p-8 rounded-xl shadow-2xl border-2 border-yellow-500 relative overflow-hidden"
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
                                <div className="w-12 h-12 bg-red-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                    <BookOpen className="text-yellow-400" size={24} />
                                </div>

                                <h3 className="text-2xl font-bold text-red-800 mb-6 border-b border-yellow-500/30 pb-4 tracking-widest">
                                    骏马献瑞 · 学术签运
                                </h3>

                                {loading ? (
                                    <div className="py-8 flex flex-col items-center gap-4">
                                        <div className="w-8 h-8 border-2 border-red-800 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-gray-500 text-sm animate-pulse">正在查阅学术古籍...</p>
                                    </div>
                                ) : (
                                    <div className="py-2">
                                        <p className="text-xl md:text-2xl leading-relaxed font-serif text-[#1a1a1a] mb-8 font-medium">
                                            “{fortune}”
                                        </p>
                                        <button
                                            onClick={closeModal}
                                            className="text-sm uppercase tracking-widest text-gray-500 hover:text-red-800 transition-colors font-sans font-semibold"
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
                © 2026 Scholarly 学术论坛 • 灵感来自 Gemini
            </footer>
        </div>
    );
};

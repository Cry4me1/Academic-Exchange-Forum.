"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function NewYearPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkNewYear = () => {
            const now = new Date();
            const currentYear = now.getFullYear();

            // 判断是否在春节活动期间：2月17日 - 3月31日
            const startDate = new Date(currentYear, 1, 17); // 2月17日
            const endDate = new Date(currentYear, 2, 31, 23, 59, 59); // 3月31日
            const isSpringFestival = now >= startDate && now <= endDate;

            if (!isSpringFestival) return;

            // 使用年份作为 key，确保每年春节只弹一次
            const storageKey = `cny_popup_seen_${currentYear}`;

            // 检查是否已经弹出过
            if (localStorage.getItem(storageKey)) return;

            // 标记为已弹出，然后显示
            localStorage.setItem(storageKey, "true");
            setIsOpen(true);
        };

        checkNewYear();
    }, []);

    const handleOpenEnvelope = () => {
        setIsOpen(false);
        router.push("/cny");
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent
                showCloseButton={false}
                className="sm:max-w-2xl p-0 overflow-visible flex flex-col items-center justify-center min-h-[600px] bg-transparent border-none shadow-none outline-none ring-0"
            >
                <DialogTitle className="sr-only">新年快乐</DialogTitle>

                <AnimatePresence>
                    <motion.div
                        key="envelope"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.2, opacity: 0 }}
                        className="relative cursor-pointer group w-full flex justify-center"
                        onClick={handleOpenEnvelope}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="w-80 h-[480px] bg-red-600 rounded-3xl shadow-2xl relative overflow-hidden border-[6px] border-yellow-500 flex flex-col items-center justify-center ring-4 ring-red-900/50">
                            {/* Envelope Texture */}
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                            <div className="absolute inset-0 bg-gradient-to-br from-red-500/50 to-red-900/50"></div>

                            {/* Center Circle */}
                            <div className="w-32 h-32 rounded-full border-[6px] border-yellow-400 bg-red-700 flex items-center justify-center shadow-inner mb-6 relative z-10">
                                <span className="text-6xl font-serif text-yellow-400 font-bold select-none">開</span>
                            </div>

                            <span className="text-yellow-200 font-serif text-2xl z-10 animate-pulse tracking-[0.2em] font-medium selection:bg-none">点击开启好运</span>

                            {/* Decorative Curved Lines */}
                            <div className="absolute -bottom-16 -left-16 w-64 h-64 border-t-[12px] border-r-[12px] border-yellow-500/30 rounded-full"></div>
                            <div className="absolute -top-16 -right-16 w-64 h-64 border-b-[12px] border-l-[12px] border-yellow-500/30 rounded-full"></div>
                        </div>

                        {/* Shake Animation Hint */}
                        <motion.div
                            className="absolute top-10 right-20 bg-yellow-400 text-red-700 text-sm font-bold px-3 py-1.5 rounded-full shadow-lg border-2 border-red-600 z-20"
                            animate={{ y: [0, -10, 0], rotate: [0, 10, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >
                            点我!
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}

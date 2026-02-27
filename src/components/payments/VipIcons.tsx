"use client";

import { motion } from "framer-motion";
import { Crown, Diamond, Flame, Hexagon, Shield, Sparkles, Star, Zap } from "lucide-react";

export type VipIconProps = {
    className?: string;
    size?: number;
};

// ==========================================
// V1 学术新星: Star + 闪烁星光
// ==========================================
export const VipIconV1 = ({ className, size = 24 }: VipIconProps) => (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 flex items-center justify-center opacity-30"
        >
            <Star size={size * 1.2} strokeWidth={1} className="text-zinc-400" />
        </motion.div>
        <Star size={size} strokeWidth={2.5} className="text-zinc-200 relative z-10 drop-shadow-md" />
        <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 right-0"
        >
            <Sparkles size={size * 0.4} strokeWidth={3} className="text-zinc-100" />
        </motion.div>
    </div>
);

// ==========================================
// V2 学术探索者: Shield + Star
// ==========================================
export const VipIconV2 = ({ className, size = 24 }: VipIconProps) => (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <motion.div
            animate={{ y: [-2, 2, -2] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center"
        >
            <Shield size={size} strokeWidth={2} className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        </motion.div>
        <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10 mt-1"
        >
            <Star size={size * 0.5} strokeWidth={3} className="text-emerald-200 fill-emerald-300" />
        </motion.div>
    </div>
);

// ==========================================
// V3 学术精英: Hexagon + Zap
// ==========================================
export const VipIconV3 = ({ className, size = 24 }: VipIconProps) => (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 flex items-center justify-center"
        >
            <Hexagon size={size} strokeWidth={2} className="text-cyan-500 drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]" />
        </motion.div>
        <motion.div
            animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10"
        >
            <Zap size={size * 0.6} strokeWidth={3} className="text-cyan-100 fill-cyan-400" />
        </motion.div>
    </div>
);

// ==========================================
// V4 学术大师: Diamond + Sparkles
// ==========================================
export const VipIconV4 = ({ className, size = 24 }: VipIconProps) => (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        {/* 外层旋转光环 */}
        <motion.div
            className="absolute inset-[-20%] rounded-full border border-purple-500/30 border-t-purple-400"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
            animate={{ y: [-3, 3, -3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10"
        >
            <Diamond size={size} strokeWidth={2.5} className="text-purple-400 fill-purple-500/20 drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]" />
        </motion.div>
        {/* 内部星光 */}
        <motion.div
            animate={{ scale: [0.5, 1, 0.5], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute"
        >
            <Sparkles size={size * 0.5} strokeWidth={3} className="text-purple-200" />
        </motion.div>
    </div>
);

// ==========================================
// V5 学术泰斗: Crown + 背光光环
// ==========================================
export const VipIconV5 = ({ className, size = 24 }: VipIconProps) => (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        {/* 爆炸光效背景 */}
        <motion.div
            className="absolute inset-[-50%] bg-[radial-gradient(circle,rgba(245,158,11,0.4)_0%,transparent_70%)]"
            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* 旋转底座 */}
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute"
        >
            <Star size={size * 1.3} strokeWidth={1} className="text-amber-500/30 fill-amber-500/10" />
        </motion.div>

        <Crown size={size} strokeWidth={2.5} className="text-amber-400 relative z-10 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)] fill-amber-500/20" />
    </div>
);

// ==========================================
// V6 学术至尊: Crown + Flame + 复杂流光
// ==========================================
export const VipIconV6 = ({ className, size = 24 }: VipIconProps) => (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        {/* 三层逆向旋转法阵 */}
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-30%] rounded-full border-2 border-dashed border-rose-500/40"
        />
        <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-15%] rounded-full border border-pink-500/50 border-t-pink-400 border-b-fuchsia-400"
        />

        {/* 背后燃烧火焰 */}
        <motion.div
            animate={{ scale: [0.9, 1.1, 0.9], y: [0, -4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-20%] z-0"
        >
            <Flame size={size * 1.1} strokeWidth={2} className="text-rose-600/50 fill-rose-600/30 blur-[2px]" />
        </motion.div>

        {/* 核心皇冠 */}
        <div className="relative z-10 flex flex-col items-center">
            <Crown size={size * 1.1} strokeWidth={2.5} className="text-rose-100 drop-shadow-[0_0_20px_rgba(225,29,72,1)] fill-rose-500/80" />
        </div>

        {/* 前景闪耀粒子 */}
        <motion.div
            animate={{ y: [5, -15], opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className="absolute bottom-0 right-0 z-20"
        >
            <Sparkles size={size * 0.4} strokeWidth={3} className="text-pink-200" />
        </motion.div>
        <motion.div
            animate={{ y: [5, -15], opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
            className="absolute bottom-0 left-0 z-20"
        >
            <Sparkles size={size * 0.3} strokeWidth={3} className="text-fuchsia-200" />
        </motion.div>
    </div>
);

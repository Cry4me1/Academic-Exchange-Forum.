"use client";

import { motion } from "framer-motion";

interface GlyphConfig {
    text: string;
    x: string;
    y: string;
    size: string;
    duration: number;
    delay: number;
}

const GLYPHS: GlyphConfig[] = [
    { text: "iℏ ∂Ψ/∂t = ĤΨ", x: "10%", y: "16%", size: "text-lg md:text-xl", duration: 18, delay: 0 },
    { text: "∇ × B = μ₀J + μ₀ε₀∂E/∂t", x: "82%", y: "14%", size: "text-sm md:text-base", duration: 22, delay: 2 },
    { text: "∮ E · dA = Q/ε₀", x: "8%", y: "78%", size: "text-sm md:text-base", duration: 20, delay: 4 },
    { text: "E = mc²", x: "88%", y: "72%", size: "text-xl md:text-2xl", duration: 16, delay: 1 },
    { text: "∫ e^{-x²} dx = √π", x: "72%", y: "42%", size: "text-sm md:text-base", duration: 24, delay: 3 },
    { text: "∑ 1/n² = π²/6", x: "18%", y: "52%", size: "text-xs md:text-sm", duration: 19, delay: 5 },
    { text: "G_{μν} + Λg_{μν} = 8πG T_{μν}", x: "48%", y: "88%", size: "text-sm md:text-base", duration: 25, delay: 2 },
];

export function FloatingGlyphs() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
            {GLYPHS.map((glyph, index) => (
                <motion.div
                    key={index}
                    className={`absolute font-serif italic text-slate-500/20 dark:text-amber-200/15 ${glyph.size} transition-colors`}
                    style={{ left: glyph.x, top: glyph.y }}
                    animate={{
                        y: [0, -28, 0],
                        x: [0, 14, 0],
                        rotate: [-2, 3, -2],
                        opacity: [0.15, 0.45, 0.15],
                    }}
                    transition={{
                        duration: glyph.duration,
                        repeat: Infinity,
                        delay: glyph.delay,
                        ease: "easeInOut",
                    }}
                >
                    {glyph.text}
                </motion.div>
            ))}
        </div>
    );
}

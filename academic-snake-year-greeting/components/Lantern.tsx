import React from 'react';
import { motion } from 'framer-motion';

interface LanternProps {
  x: number;
  delay: number;
  text: string;
}

export const Lantern: React.FC<LanternProps> = ({ x, delay, text }) => {
  return (
    <motion.div
      className="absolute top-0 z-10"
      style={{ left: `${x}%` }}
      initial={{ y: -200 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 50, damping: 15, delay }}
    >
      <div className="flex flex-col items-center animate-float origin-top">
        {/* String */}
        <div className="w-0.5 h-24 bg-academic-gold/50"></div>
        
        {/* Lantern Body */}
        <div className="relative w-16 h-20 bg-gradient-to-b from-red-700 to-red-900 rounded-lg shadow-lg flex items-center justify-center border-t-4 border-b-4 border-academic-gold">
           {/* Glow effect inside */}
           <div className="absolute inset-0 bg-red-500 opacity-20 blur-md rounded-lg animate-pulse"></div>
           <span className="text-academic-gold font-serif font-bold text-2xl drop-shadow-md">{text}</span>
        </div>
        
        {/* Tassel */}
        <div className="flex flex-col items-center">
            <div className="w-1 h-2 bg-academic-gold"></div>
            <div className="w-4 h-16 bg-red-800 rounded-full blur-[1px] opacity-80"></div>
        </div>
      </div>
    </motion.div>
  );
};